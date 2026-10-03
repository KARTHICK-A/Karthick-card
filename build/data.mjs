// Single source of truth for the contact card: the vCard, the print sheet, the
// profile PDF and every page are generated from this file and build/content.mjs.
//
// Name, role, phone, location and links match the owner's published portfolio.
// The two email addresses are the ones chosen for the card; the portfolio's own
// JSON-LD lists a different address, so confirm which is current if in doubt.

export const CARD_URL =
  process.env.CARD_URL || 'https://karthick-card.vercel.app/';

export const person = {
  first: 'Karthick',
  last: 'A',
  fullName: 'Karthick A',
  title: 'Embedded Systems Engineer',
  company: 'Spark Invotech Pvt Ltd',
  blurb: 'Automotive ECU electronics, PCB design and industrial IoT.',
  city: 'Chennai, India',
  email: 'karthick.rd.dev@gmail.com',        // technical
  emailBiz: 'sparkinvotech.ceo@gmail.com',    // business / everything else
  phone: '+91 70948 28457',
  phoneDigits: '+917094828457',
  whatsapp: '917094828457',
  website: 'https://karthick-a.github.io/portfolio/',
  linkedin: 'https://linkedin.com/in/karthick-a-83a352211',
  github: 'https://github.com/KARTHICK-A',
};

// vCard 3.0 text values must escape backslash, comma, semicolon and newline,
// or a comma silently truncates the value in strict parsers.
const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');

// The QR payload is deliberately leaner than the .vcf file: parameters such as
// TYPE=INTERNET are dropped because they cost bytes and change nothing for any
// scanner. The .vcf download carries the full record.
export const vcardQR = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `N:${person.last};${person.first};;;`,
  `FN:${person.fullName}`,
  `TITLE:${esc(person.title)}`,
  `ORG:${esc(person.company)}`,
  `TEL:${person.phoneDigits}`,
  `EMAIL:${person.email}`,
  `EMAIL:${person.emailBiz}`,
  `URL:${person.website}`,
  'END:VCARD',
].join('\r\n') + '\r\n';

// Full record for the downloadable file — no size pressure here.
export const vcardFile = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  `N:${person.last};${person.first};;;`,
  `FN:${person.fullName}`,
  `TITLE:${esc(person.title)}`,
  `ORG:${esc(person.company)}`,
  `TEL;TYPE=CELL,VOICE:${person.phoneDigits}`,
  `EMAIL;TYPE=INTERNET,PREF:${person.email}`,
  `EMAIL;TYPE=INTERNET,WORK:${person.emailBiz}`,
  `URL:${person.website}`,
  'ADR;TYPE=WORK:;;;Chennai;Tamil Nadu;;India',
  `X-SOCIALPROFILE;TYPE=linkedin:${person.linkedin}`,
  `X-SOCIALPROFILE;TYPE=github:${person.github}`,
  `NOTE:${esc(person.blurb)}`,
  'END:VCARD',
].join('\r\n') + '\r\n';

// Rows for the contact page sections. `copy` is what the COPY button puts on
// the clipboard; documents copy their absolute URL so it can be pasted into a chat.
const abs = (path) => CARD_URL + path;
export const contactRows = [
  { k: 'Email · technical', v: person.email,    href: `mailto:${person.email}`,    copy: person.email,        icon: 'mail',  copyLabel: 'Technical email' },
  { k: 'Email · business',  v: person.emailBiz, href: `mailto:${person.emailBiz}`, copy: person.emailBiz,     icon: 'mail',  copyLabel: 'Business email' },
  { k: 'Phone',             v: person.phone,    href: `tel:${person.phoneDigits}`, copy: person.phoneDigits,  icon: 'phone', copyLabel: 'Phone number' },
  { k: 'WhatsApp',          v: person.phone,    href: `https://wa.me/${person.whatsapp}`, copy: person.phoneDigits, icon: 'chat', copyLabel: 'WhatsApp number', ext: true },
];
export const linkRows = [
  { k: 'Portfolio', v: 'karthick-a.github.io/portfolio', href: person.website,  copy: person.website,  icon: 'globe', copyLabel: 'Portfolio link', ext: true },
  { k: 'LinkedIn',  v: 'in/karthick-a-83a352211',        href: person.linkedin, copy: person.linkedin, icon: 'briefcase', copyLabel: 'LinkedIn link', ext: true },
  { k: 'GitHub',    v: 'KARTHICK-A',                     href: person.github,   copy: person.github,   icon: 'code',  copyLabel: 'GitHub link', ext: true },
];
export const docRows = [
  { k: 'Profile', v: 'One-page profile · PDF', href: 'Karthick-A-details.pdf', copy: abs('Karthick-A-details.pdf'), icon: 'file', copyLabel: 'Profile PDF link', download: true },
  { k: 'Résumé',  v: 'Karthick-A-resume.pdf',  href: 'Karthick-A-resume.pdf',  copy: abs('Karthick-A-resume.pdf'),  icon: 'file', copyLabel: 'Résumé link',     download: true },
];
