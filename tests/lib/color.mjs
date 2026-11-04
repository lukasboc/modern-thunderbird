// WCAG 2.x colour helpers for contrast tests.
export function parseColor(s) {
  const str = s.trim();
  let m = str.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = [...h].map(c => c + c).join('');
    if (h.length !== 6 && h.length !== 8) throw new Error(`bad hex ${s}`);
    const n = i => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  m = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  throw new Error(`unsupported colour ${s}`);
}

export function composite(fg, bg) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

// color-mix(in srgb, c pct%, black)
export function mixBlack(c, pct) {
  const f = pct / 100;
  return { r: c.r * f, g: c.g * f, b: c.b * f, a: 1 };
}

function channel(v) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(c) {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrast(fg, bg) {
  const solidBg = bg.a < 1 ? composite(bg, { r: 255, g: 255, b: 255, a: 1 }) : bg;
  const solidFg = fg.a < 1 ? composite(fg, solidBg) : fg;
  const l1 = luminance(solidFg), l2 = luminance(solidBg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// --- OKLCH (CSS Color 4) for relative-colour tokens: oklch(from c min(l, x) c h) ---
const toLin = v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const toSrgb = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function toOklch({ r, g, b }) {
  const [R, G, B] = [r, g, b].map(toLin);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { L, C: Math.hypot(A, Bb), H: Math.atan2(Bb, A) };
}

function oklchToRgbRaw({ L, C, H }) {
  const A = C * Math.cos(H), B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// Gamut-maps by reducing chroma (keeps lightness), as CSS Color 4 does.
export function fromOklch(lch) {
  let { C } = lch;
  for (let i = 0; i < 60; i++) {
    const rgb = oklchToRgbRaw({ ...lch, C });
    if (rgb.every(v => v >= -1e-4 && v <= 1 + 1e-4)) {
      const [r, g, b] = rgb.map(v => toSrgb(Math.min(1, Math.max(0, v))));
      return { r, g, b, a: 1 };
    }
    C *= 0.92;
  }
  const [r, g, b] = oklchToRgbRaw({ ...lch, C: 0 }).map(v => toSrgb(Math.min(1, Math.max(0, v))));
  return { r, g, b, a: 1 };
}

export const clampL = (c, { min = 0, max = 1 }) => {
  const lch = toOklch(c);
  return fromOklch({ ...lch, L: Math.min(max, Math.max(min, lch.L)) });
};
