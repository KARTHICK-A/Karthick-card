// Generates the site's pages from build/data.mjs and build/content.mjs:
//   index.html · work.html · about.html · work/<slug>.html · 404.html
//   sitemap.xml · robots.txt · manifest.webmanifest
// Called by build/build.mjs. Pages use relative URLs only, so the site works
// from any path and from a plain static file server.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARD_URL, person, vcardQR, contactRows, linkRows, docRows } from './data.mjs';
import { projects, featured, profile } from './content.mjs';
import { make, version, qrSvg } from './qr.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OWNER_ALT = `Portrait of ${person.fullName}`;

// ---- helpers ---------------------------------------------------------------
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const abs = (path) => CARD_URL + path;
// Let long values wrap after '@' and '/' instead of mid-word.
const breakable = (v) => /^\+\d/.test(v)
  ? esc(v).replace(/ /g, '&nbsp;')                       // phone numbers must not wrap mid-number
  : esc(v).replace(/@/g, '@<wbr>').replace(/\//g, '/<wbr>');

const ICONS = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  phone: '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  download: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  'arrow-right': '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  'arrow-left': '<path d="M19 12H5m6-6-6 6 6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  zoom: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  'chev-left': '<path d="m15 6-6 6 6 6"/>',
  'chev-right': '<path d="m9 6 6 6-6 6"/>',
};
const sprite = '<svg class="sprite" aria-hidden="true" focusable="false"><defs>'
  + Object.entries(ICONS).map(([id, d]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${d}</symbol>`).join('')
  + '<symbol id="mark" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="#04060c"/><g fill="#22e0e6">'
  + '<rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/>'
  + '<rect x="9" y="9" width="2" height="2"/><rect x="12" y="12" width="2" height="2"/></g></symbol>'
  + '</defs></svg>';
const ic = (name, cls = '') => `<svg class="i${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
const NEW_TAB = '<span class="sr"> (opens in a new tab)</span>';

// Ghost IC package drawn for projects that have no photograph — honest about
// being a placeholder, and on-brand for a board-themed card.
function chipArt(ref) {
  const ys = [60, 80, 100, 120, 140];
  const pins = ys.map((y) => `<rect class="pin" x="92" y="${y - 4}" width="12" height="8"/><rect class="pin" x="216" y="${y - 4}" width="12" height="8"/>`).join('');
  const traces = ys.map((y, i) => {
    const cls = i === 2 ? 'tr tr-a' : 'tr';
    return `<path class="${cls}" d="M92 ${y}H0"/><path class="${cls}" d="M228 ${y}H320"/>`;
  }).join('');
  const vias = `<circle class="via" cx="48" cy="80" r="5"/><circle class="via" cx="268" cy="120" r="5"/>`;
  return `<svg class="chipart" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">`
    + `${traces}${vias}<rect class="body" x="104" y="40" width="112" height="120" rx="6"/>${pins}`
    + `<circle class="p1" cx="120" cy="56" r="3.5"/><text x="160" y="108" text-anchor="middle">${esc(ref)}</text></svg>`;
}

// ---- page shell ------------------------------------------------------------
const CSP = "default-src 'none'; img-src 'self'; font-src 'self'; style-src 'self'; script-src 'self'; "
  + "connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'";

function shell({ r, file, title, desc, current, body, ld = [], lightbox = false, ogType = 'website', robots }) {
  const url = abs(file === 'index.html' ? '' : file);
  const nav = [
    ['Work', `${r}work.html`, 'work'],
    ['About', `${r}about.html`, 'about'],
    ['Contact', `${r}index.html#contact`, 'contact'],
  ].map(([t, h, k]) => `<a href="${h}"${current === k ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${robots ? `<meta name="robots" content="${robots}">\n` : `<link rel="canonical" href="${url}">\n`}<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#04060c" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#eef1f6" media="(prefers-color-scheme: light)">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Karthick A — contact card">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs('og.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Karthick A, Embedded Systems Engineer, Spark Invotech Pvt Ltd">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${abs('og.png')}">
<link rel="icon" href="${r}assets/img/icons/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${r}assets/img/icons/apple-touch-icon.png">
<link rel="manifest" href="${r}manifest.webmanifest">
<link rel="preload" href="${r}fonts/unbounded-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${r}fonts/plexsans-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${r}assets/site.css">
<script src="${r}assets/theme.js"></script>
${ld.map(jsonLd).join('\n')}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${sprite}
<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="${r}index.html" aria-label="${esc(person.fullName)} — home">
      <svg class="mark" aria-hidden="true" focusable="false"><use href="#mark"/></svg><span class="brand-name">${esc(person.fullName)}</span>
    </a>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <button class="icon-btn theme" type="button" aria-label="Switch to light theme">${ic('sun', 'i-sun')}${ic('moon', 'i-moon')}</button>
  </div>
</header>
<main id="main" class="wrap">
${body}
</main>
<footer class="foot">
  <div class="wrap foot-in">
    <div class="foot-id"><strong>${esc(person.fullName)}</strong><span>${esc(person.title)} · ${esc(person.company)}</span></div>
    <nav aria-label="Footer"><a href="${r}index.html">Card</a><a href="${r}work.html">Work</a><a href="${r}about.html">About</a><a href="${r}print.html">Print sheet</a></nav>
    <p class="fine">Works offline once loaded. No tracking, no third-party requests.</p>
  </div>
</footer>
<p class="toast" id="toast" role="status" aria-live="polite" hidden></p>
${lightbox ? `<dialog class="lb" id="lb" aria-label="Photo viewer">
  <div class="lb-in">
    <button class="lb-btn lb-close" type="button" aria-label="Close photo">${ic('x')}</button>
    <button class="lb-btn lb-prev" type="button" aria-label="Previous photo">${ic('chev-left')}</button>
    <figure><figcaption></figcaption></figure>
    <button class="lb-btn lb-next" type="button" aria-label="Next photo">${ic('chev-right')}</button>
  </div>
</dialog>
` : ''}<script src="${r}assets/site.js" defer></script>
</body>
</html>
`;
}

// ---- components ------------------------------------------------------------
function rows(list) {
  return `<ul class="rows">${list.map((x) => `
      <li class="row">
        <a class="row-main" href="${esc(x.href)}"${x.ext ? ' target="_blank" rel="noopener"' : ''}${x.download ? ' download' : ''}>
          <span class="row-ico">${ic(x.icon)}</span>
          <span class="row-txt"><span class="row-k">${esc(x.k)}</span><span class="row-v">${breakable(x.v)}</span></span>${x.ext ? NEW_TAB : ''}
        </a>
        <button class="icon-btn copy" type="button" data-copy="${esc(x.copy)}" data-label="${esc(x.copyLabel)}" aria-label="Copy ${esc(x.copyLabel.toLowerCase())}">${ic('copy', 'i-copy')}${ic('check', 'i-check')}</button>
      </li>`).join('')}
    </ul>`;
}

const pill = (p) => `<span class="pill pill-${p.status.tone}">${esc(p.status.label)}</span>`;
const subject = (p) => p.kind || p.client;

function card(p, r) {
  const ph = p.photos[0];
  const media = ph
    ? `<img src="${r}${ph.srcSm}" width="${ph.sw}" height="${ph.sh}" alt="${esc(ph.alt)}" loading="lazy" decoding="async">`
    : chipArt(p.ref);
  const title = p.titleNote ? `${esc(p.title)} <small>${esc(p.titleNote)}</small>` : esc(p.title);
  return `<article class="pcard">
        <div class="pcard-media">${media}<span class="pcard-ref">${p.ref}</span><span class="pill on-media pill-${p.status.tone}">${esc(p.status.label)}</span></div>
        <div class="pcard-body">
          <p class="label">${esc(subject(p))}</p>
          <h3 class="pcard-title"><a href="${r}${p.path}">${title}</a></h3>
          <p class="pcard-sum">${esc(p.summary)}</p>
          <ul class="chips" aria-label="Technologies">${p.chips.slice(0, 4).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          <span class="pcard-go" aria-hidden="true">View project ${ic('arrow-right', 'i-sm')}</span>
        </div>
      </article>`;
}

const mailto = `mailto:${person.email}`;

// ---- pages -----------------------------------------------------------------
function home() {
  const code = make(vcardQR);
  const quick = [
    ['Call', `tel:${person.phoneDigits}`, 'phone', false],
    ['WhatsApp', `https://wa.me/${person.whatsapp}`, 'chat', true],
    ['Email', mailto, 'mail', false],
  ].map(([t, h, i, ext]) => `<a class="qbtn" href="${h}"${ext ? ' target="_blank" rel="noopener"' : ''}>${ic(i)}<span>${t}</span>${ext ? NEW_TAB : ''}</a>`).join('\n      ');
  const body = `
<section class="hero" aria-labelledby="name">
  <div class="ident">
    <p class="eyebrow">TP1 · Contact</p>
    <div class="who">
      <img class="avatar" src="portrait.webp" width="92" height="92" alt="" decoding="async">
      <div>
        <h1 id="name">${esc(person.fullName)}</h1>
      </div>
    </div>
    <p class="role">${esc(person.title)}</p>
    <p class="org">${esc(person.company)} · ${esc(person.city)}</p>
    <p class="blurb">${esc(person.blurb)}</p>
  </div>

  <section class="qr card" aria-labelledby="qr-h">
    <div class="qr-head"><h2 id="qr-h">Scan to save my contact</h2><span class="qr-meta" id="qrmeta">v${version(code)} · ECC M</span></div>
    <div class="plate" id="plate">${qrSvg(code, { cls: 'qr-svg', label: `QR code containing the contact details of ${person.fullName}` })}</div>
    <p class="qr-hint" id="qrhint" aria-live="polite">Point your phone camera at the code. It adds my name, role, company, phone, both emails and website.</p>
    <div class="qr-actions">
      <a class="btn btn-primary" href="contact.vcf" download="karthick-a.vcf">${ic('download')}Save contact</a>
      <button class="btn" type="button" id="share" hidden>${ic('share')}Share</button>
    </div>
    <div class="seg" role="group" aria-label="Choose what the code contains">
      <button type="button" id="tab-vcard" aria-pressed="true">Contact</button>
      <button type="button" id="tab-url" aria-pressed="false">This page</button>
    </div>
  </section>

  <div class="quick" role="group" aria-label="Get in touch quickly">
      ${quick}
  </div>
</section>

<section aria-labelledby="work-h">
  <div class="sec-head">
    <div><p class="eyebrow">U1 – U${projects.length}</p><h2 id="work-h">Selected work</h2></div>
    <a class="more" href="work.html">All ${projects.length} projects ${ic('arrow-right', 'i-sm')}</a>
  </div>
  <div class="pgrid">
      ${featured.map((p) => card(p, '')).join('\n      ')}
  </div>
</section>

<section aria-labelledby="about-h">
  <div class="card teaser">
    <div>
      <h2 id="about-h">Profile</h2>
      <p class="lead">${profile.lead} ${esc(person.blurb)}</p>
      <ul class="chips" aria-label="Capabilities">${profile.capabilities.map(([, t]) => `<li>${esc(t)}</li>`).join('')}</ul>
    </div>
    <a class="btn" href="about.html">Read the profile ${ic('arrow-right')}</a>
  </div>
</section>

<section id="contact" aria-labelledby="contact-h">
  <div class="sec-head"><div><h2 id="contact-h">Get in touch</h2></div></div>
  <div class="cgrid">
    <div class="card contact-card"><h3>Contact</h3>${rows(contactRows)}
      <div class="card-foot"><a class="btn btn-primary" href="contact.vcf" download="karthick-a.vcf">${ic('download')}Save contact</a></div></div>
    <div class="cstack">
      <div class="card"><h3>Links</h3>${rows(linkRows)}</div>
      <div class="card"><h3>Documents</h3>${rows(docRows)}</div>
    </div>
  </div>
</section>`;
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Person', name: person.fullName, jobTitle: person.title,
      worksFor: { '@type': 'Organization', name: person.company },
      address: { '@type': 'PostalAddress', addressLocality: 'Chennai', addressCountry: 'IN' },
      url: CARD_URL, image: abs('portrait.webp'), sameAs: [person.website, person.linkedin, person.github],
    },
    {
      '@context': 'https://schema.org', '@type': 'ItemList', name: `Projects by ${person.fullName}`,
      itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(p.path), name: p.title })),
    },
  ];
  return shell({
    r: '', file: 'index.html', current: 'home', body, ld, ogType: 'profile',
    title: `${person.fullName} — contact card`,
    desc: `Scan to save the contact details of ${person.fullName}, ${person.title} at ${person.company} — automotive ECU electronics, PCB design and industrial IoT.`,
  });
}

function alsoBuilt() {
  return `<div class="card also">
    <h2 class="label">Also built — incubation lab</h2>
    <ul>${profile.alsoBuilt.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul>
  </div>`;
}

function ctaBand(heading = 'Working on something similar?', text = 'Email or message me — the contact details are one tap away.') {
  return `<div class="cta-band">
    <div><h2>${esc(heading)}</h2><p>${esc(text)}</p></div>
    <div class="btn-row">
      <a class="btn btn-primary" href="${mailto}">${ic('mail')}Email me</a>
      <a class="btn" href="https://wa.me/${person.whatsapp}" target="_blank" rel="noopener">${ic('chat')}WhatsApp${NEW_TAB}</a>
    </div>
  </div>`;
}

function work() {
  const body = `
<header class="page-head">
  <p class="eyebrow">U1 – U${projects.length}</p>
  <h1>Selected work</h1>
  <p class="lead">${projects.length} products, from prototype to delivered. Open any one for the problem, the constraints and the outcome.</p>
</header>
<section class="block" aria-labelledby="all-h">
  <h2 class="sr" id="all-h">All projects</h2>
  <div class="pgrid">
      ${projects.map((p) => card(p, '')).join('\n      ')}
      ${alsoBuilt()}
  </div>
</section>
<section>${ctaBand('Have a board that needs to run on a real machine?')}</section>`;
  return shell({
    r: '', file: 'work.html', current: 'work', body,
    title: `Selected work — ${person.fullName}`,
    desc: `${projects.length} embedded products by ${person.fullName}: dual-fuel ECU, injector multiplier, acoustic vehicle alerting, oil control, compressor monitoring, cold-chamber logging and production monitoring.`,
    ld: [{
      '@context': 'https://schema.org', '@type': 'ItemList', name: `Projects by ${person.fullName}`,
      itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(p.path), name: p.title })),
    }],
  });
}

function project(p, i) {
  const r = '../';
  const prev = projects[(i + projects.length - 1) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const hasPhotos = p.photos.length > 0;
  const shot = (ph, eager) => `<button class="shot" type="button" data-lb="${r}${ph.src}" data-alt="${esc(ph.alt)}" data-tag="${esc(ph.tag)}" aria-label="Open photo: ${esc(ph.tag)} — ${esc(ph.alt)}">
        <img src="${r}${ph.srcSm}" width="${ph.sw}" height="${ph.sh}" alt="${esc(ph.alt)}" decoding="async"${eager ? '' : ' loading="lazy"'}>
        <span class="shot-tag">${esc(ph.tag)}</span><span class="shot-zoom" aria-hidden="true">${ic('zoom', 'i-sm')}</span>
      </button>`;
  const [hero, ...rest] = p.photos;
  const body = `
<nav class="crumbs" aria-label="Breadcrumb"><ol>
  <li><a href="${r}index.html">Card</a></li><li><a href="${r}work.html">Work</a></li><li aria-current="page">${p.ref}</li>
</ol></nav>

<header class="phead">
  <div class="pmeta"><span class="refpill">${p.ref}</span>${pill(p)}<span class="label">${esc(subject(p))}</span>${p.featured ? `<span class="pill pill-star">${ic('star', 'i-sm')}Featured</span>` : ''}</div>
  <h1>${esc(p.title)}${p.titleNote ? ` <small>${esc(p.titleNote)}</small>` : ''}</h1>
  <p class="lead">${esc(p.summary)}</p>
</header>

<div class="pgrid2">
  <div class="pmain">
    ${hasPhotos ? `<figure class="phero">${shot(hero, true)}</figure>` : ''}
    <section class="case" aria-label="Case study">
      <div class="step"><div class="step-k"><span class="step-n">01</span><h2 class="label">Problem</h2></div><p>${esc(p.problem)}</p></div>
      <div class="step"><div class="step-k"><span class="step-n">02</span><h2 class="label">Constraints</h2></div><ul>${p.constraints.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
      <div class="step step-out"><div class="step-k"><span class="step-n">03</span><h2 class="label">Outcome</h2></div><p>${esc(p.outcome)}</p></div>
    </section>
    ${rest.length ? `<section class="gallery" aria-labelledby="gal-h"><h2 class="label" id="gal-h">More photos</h2><div class="gal">${rest.map((ph) => shot(ph, false)).join('')}</div></section>` : ''}
  </div>
  <aside class="paside" aria-label="Project summary">
    <section class="card glance"><h2 class="label">At a glance</h2><dl>${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
    <section class="card built"><h2 class="label">Built with</h2><ul class="chips">${p.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></section>
    <section class="card cta"><h2 class="label">Similar project?</h2><p>Email or message me — I'll reply with questions, not a brochure.</p>
      <div class="btn-row"><a class="btn btn-primary" href="${mailto}">${ic('mail')}Email me</a><a class="btn" href="https://wa.me/${person.whatsapp}" target="_blank" rel="noopener">${ic('chat')}WhatsApp${NEW_TAB}</a></div></section>
  </aside>
</div>

<nav class="pn" aria-label="More projects">
  <a href="${r}${prev.path}" rel="prev"><span class="label">${ic('arrow-left', 'i-sm')}Previous · ${prev.ref}</span><span class="pn-title">${esc(prev.title)}</span></a>
  <a class="pn-next" href="${r}${next.path}" rel="next"><span class="label">Next · ${next.ref}${ic('arrow-right', 'i-sm')}</span><span class="pn-title">${esc(next.title)}</span></a>
</nav>`;
  return shell({
    r, file: p.path, current: 'work', body, lightbox: hasPhotos,
    title: `${p.title} — ${person.fullName}`,
    desc: p.summary,
    ld: [{
      '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description: p.summary,
      url: abs(p.path), creator: { '@type': 'Person', name: person.fullName },
      ...(hasPhotos ? { image: abs(hero.src) } : {}),
    }, {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [['Card', ''], ['Work', 'work.html'], [p.title, p.path]]
        .map(([name, path], k) => ({ '@type': 'ListItem', position: k + 1, name, item: abs(path) })),
    }],
  });
}

function about() {
  const body = `
<header class="page-head">
  <p class="eyebrow">Profile</p>
  <h1>${esc(person.fullName)}</h1>
  <p class="lead">${esc(person.title)} · ${esc(person.company)} · ${esc(person.city)}</p>
</header>

<div class="about-grid">
  <figure class="portrait"><img src="portrait.webp" width="288" height="512" alt="${esc(OWNER_ALT)}" decoding="async"></figure>
  <div class="prose">
    <p class="lead">${profile.lead} ${profile.ownership}</p>
    <ol class="pipe" aria-label="Scope of work, in order">${profile.pipeline.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${profile.intro.map((t) => `<p>${t}</p>`).join('')}
    <div class="btn-row">
      <a class="btn btn-primary" href="Karthick-A-resume.pdf" download>${ic('download')}Résumé (PDF)</a>
      <a class="btn" href="Karthick-A-details.pdf" download>${ic('file')}One-page profile (PDF)</a>
    </div>
  </div>
</div>

<section class="block" aria-labelledby="fig-h">
  <div class="sec-head"><div><h2 id="fig-h">In numbers</h2></div></div>
  <div class="figs">${profile.figures.map(([n, a, b]) => `<div class="fig"><b>${esc(n)}</b><span>${esc(a)}</span><small>${esc(b)}</small></div>`).join('')}</div>
</section>

<section aria-labelledby="cap-h">
  <div class="sec-head"><div><p class="eyebrow">Layer stack-up</p><h2 id="cap-h">Capabilities</h2></div></div>
  <div class="stack">${profile.capabilities.map(([n, t, d]) => `<div class="layer"><span class="no">${n}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div>
</section>

<section aria-labelledby="bg-h">
  <div class="sec-head"><div><h2 id="bg-h">Background</h2></div></div>
  <div class="card bg-grid">
    <dl>${profile.background.slice(0, 3).map(([k, v]) => `<div><dt class="label">${esc(k)}</dt><dd>${v.map((x) => `<span>${esc(x)}</span>`).join('')}</dd></div>`).join('')}</dl>
    <dl>${profile.background.slice(3).map(([k, v]) => `<div><dt class="label">${esc(k)}</dt><dd>${v.map((x) => `<span>${esc(x)}</span>`).join('')}</dd></div>`).join('')}</dl>
  </div>
</section>

<section aria-labelledby="sel-h">
  <div class="sec-head">
    <div><p class="eyebrow">U1 – U${projects.length}</p><h2 id="sel-h">Selected work</h2></div>
    <a class="more" href="work.html">All ${projects.length} projects ${ic('arrow-right', 'i-sm')}</a>
  </div>
  <div class="pgrid">
      ${featured.map((p) => card(p, '')).join('\n      ')}
  </div>
</section>

<section>${ctaBand('Let’s talk', 'The fastest way to reach me is a call, a WhatsApp message or an email.')}</section>`;
  return shell({
    r: '', file: 'about.html', current: 'about', body, ogType: 'profile',
    title: `Profile — ${person.fullName}`,
    desc: `${person.fullName}, ${person.title} and co-founder at ${person.company}. Capabilities, background and the full path from requirements to customer deployment.`,
    ld: [{
      '@context': 'https://schema.org', '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person', name: person.fullName, jobTitle: person.title,
        worksFor: { '@type': 'Organization', name: person.company }, url: CARD_URL,
        sameAs: [person.website, person.linkedin, person.github],
      },
    }],
  });
}

function notFound() {
  const body = `
<header class="page-head">
  <p class="eyebrow">404</p>
  <h1>Page not found</h1>
  <p class="lead">That address doesn’t exist on this card. The contact details, projects and profile are all one tap away.</p>
</header>
<section class="block"><div class="btn-row">
  <a class="btn btn-primary" href="/index.html">${ic('arrow-left')}Back to the card</a>
  <a class="btn" href="/work.html">Selected work</a>
  <a class="btn" href="/about.html">Profile</a>
</div></section>`;
  // Served for any missing path, at any depth — so it must use root-absolute URLs.
  return shell({ r: '/', file: '404.html', current: '', body, robots: 'noindex', title: `Page not found — ${person.fullName}`, desc: 'This page does not exist.' });
}

// ---- writer ----------------------------------------------------------------
export function buildSite() {
  const out = (rel, text) => {
    const p = join(ROOT, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text, 'utf8');
  };
  const pages = ['index.html', 'work.html', 'about.html', ...projects.map((p) => p.path)];
  out('index.html', home());
  out('work.html', work());
  out('about.html', about());
  projects.forEach((p, i) => out(p.path, project(p, i)));
  out('404.html', notFound());

  out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((f) => `  <url><loc>${abs(f === 'index.html' ? '' : f)}</loc></url>`).join('\n')}
</urlset>
`);
  out('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('sitemap.xml')}\n`);
  out('manifest.webmanifest', JSON.stringify({
    name: `${person.fullName} — contact card`, short_name: person.fullName,
    description: `${person.title}, ${person.company}. Scan to save my contact.`,
    start_url: './index.html', scope: './', display: 'standalone', orientation: 'portrait',
    background_color: '#04060c', theme_color: '#04060c',
    icons: [
      { src: 'assets/img/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'assets/img/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'assets/img/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }, null, 2) + '\n');

  return pages;
}
