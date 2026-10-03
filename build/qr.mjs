// QR helpers shared by every generator. Pure functions, no file output.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const qrcode = require(join(ROOT, 'vendor/qrcode.js'));

export function make(text) {
  const c = qrcode(0, 'M');
  c.addData(text, 'Byte');
  c.make();
  return c;
}
export const version = (c) => (c.getModuleCount() - 17) / 4;

// One <path> subpath per run of dark modules — small, exact edges, resolution
// independent. Always dark on white with a 4-module quiet zone: inverted codes
// fail on a lot of scanners.
export function qrSvg(code, { mm, label, cls } = {}) {
  const n = code.getModuleCount(), q = 4, side = n + q * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    let run = 0;
    for (let c = 0; c <= n; c++) {
      const dark = c < n && code.isDark(r, c);
      if (dark) { run++; continue; }
      if (run) { d += `M${c - run + q} ${r + q}h${run}v1h-${run}z`; run = 0; }
    }
  }
  const size = mm ? ` width="${mm}mm" height="${mm}mm"` : '';
  const role = label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"';
  return `<svg${cls ? ` class="${cls}"` : ''}${role}${size} viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges" `
    + `xmlns="http://www.w3.org/2000/svg"><rect width="${side}" height="${side}" fill="#fff"/><path fill="#000" d="${d}"/></svg>`;
}
