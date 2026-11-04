import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTokens } from './lib/tokens.mjs';
import { parseColor, composite, mixBlack, contrast, clampL } from './lib/color.mjs';

const { light, dark } = parseTokens(readFileSync(new URL('../chrome/tokens.css', import.meta.url), 'utf8'));

function resolver(mode, map) {
  const c = name => {
    if (name === 'accent-selection') return clampL(c('accent'), { max: 0.5 });
    if (name === 'accent-icon') return clampL(c('accent'), mode === 'light' ? { max: 0.62 } : { min: 0.6 });
    if (name === 'flag-icon') return mode === 'light' ? mixBlack(c('flag'), 80) : c('flag');
    if (name === 'accent-text') return clampL(c('accent'), mode === 'light' ? { max: 0.5 } : { min: 0.72 });
    return parseColor(map.get(`--mx-${name}`));
  };
  return c;
}

// [fg, bg, min] ; bg may be "pressed/bg-sidebar-opaque" = pressed composited over sidebar
const PAIRS = [
  ...['bg-window', 'bg-toolbar', 'bg-sidebar-opaque', 'selection-inactive'].map(bg => ['label', bg, 4.5]),
  ...['bg-window', 'bg-toolbar', 'bg-sidebar-opaque'].map(bg => ['label-secondary', bg, 4.5]),
  ['on-accent', 'accent-selection', 4.5],
  ['accent-text', 'bg-window', 4.5],
  ['accent-icon', 'bg-sidebar-opaque', 3],
  ['accent-icon', 'bg-window', 3],
  ['label-secondary', 'bg-toolbar', 3],
  ['flag-icon', 'bg-window', 3],
  ['danger', 'bg-window', 3],
  ['label', 'pressed/bg-sidebar-opaque', 4.5],
];

for (const [mode, map] of [['light', light], ['dark', dark.size ? new Map([...light, ...dark]) : light]]) {
  const c = resolver(mode, map);
  for (const [fg, bg, min] of PAIRS) {
    test(`${mode}: ${fg} on ${bg} >= ${min}`, () => {
      let back;
      if (bg.includes('/')) {
        const [top, base] = bg.split('/');
        back = composite(c(top), c(base));
      } else back = c(bg);
      const ratio = contrast(c(fg), back);
      assert.ok(ratio >= min, `${ratio.toFixed(2)} < ${min}`);
    });
  }
}
