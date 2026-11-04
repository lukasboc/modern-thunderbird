// Contrast with any macOS system accent (AccentColor replaces the blue fallback at runtime).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTokens } from './lib/tokens.mjs';
import { parseColor, contrast, clampL } from './lib/color.mjs';

const { light, dark: darkOnly } = parseTokens(readFileSync(new URL('../chrome/tokens.css', import.meta.url), 'utf8'));
const dark = new Map([...light, ...darkOnly]);

const ACCENTS = { // macOS accent colours (light / dark appearance)
  blue: ['#007AFF', '#0A84FF'], purple: ['#953D96', '#A550A7'], pink: ['#F74F9E', '#F74F9E'],
  red: ['#E0383E', '#FF5257'], orange: ['#F7821B', '#F7821B'], yellow: ['#FFC726', '#FFC600'],
  green: ['#62BA46', '#62BA46'], graphite: ['#8C8C8C', '#8C8C8C'],
};

// Expressions the tokens must use; the test evaluates them per accent.
const EXPR = {
  light: {
    '--mx-accent-selection': ['oklch(from var(--mx-accent) min(l, 0.5) c h)', { max: 0.5 }],
    '--mx-accent-text': ['oklch(from var(--mx-accent) min(l, 0.5) c h)', { max: 0.5 }],
    '--mx-accent-icon': ['oklch(from var(--mx-accent) min(l, 0.62) c h)', { max: 0.62 }],
  },
  dark: {
    '--mx-accent-selection': ['oklch(from var(--mx-accent) min(l, 0.5) c h)', { max: 0.5 }],
    '--mx-accent-text': ['oklch(from var(--mx-accent) max(l, 0.72) c h)', { min: 0.72 }],
    '--mx-accent-icon': ['oklch(from var(--mx-accent) max(l, 0.6) c h)', { min: 0.6 }],
  },
};

test('accent tokens use the contrast-safe relative colour expressions', () => {
  for (const [mode, map] of [['light', light], ['dark', dark]]) {
    for (const [name, [expr]] of Object.entries(EXPR[mode])) assert.equal(map.get(name), expr, `${mode} ${name}`);
  }
});

test('text on accent surfaces stays white (never AccentColorText)', () => {
  assert.equal(light.get('--mx-on-accent'), '#FFFFFF');
  assert.equal(dark.get('--mx-on-accent'), '#FFFFFF');
  assert.doesNotMatch(readFileSync(new URL('../chrome/tokens.css', import.meta.url), 'utf8'), /AccentColorText/);
});

for (const [accent, [la, da]] of Object.entries(ACCENTS)) {
  for (const [mode, map, raw] of [['light', light, la], ['dark', dark, da]]) {
    const a = parseColor(raw);
    const tok = n => clampL(a, EXPR[mode][n][1]);
    const bg = n => parseColor(map.get(n));
    const white = parseColor('#FFFFFF');
    test(`${mode} ${accent}: white on selection >= 4.5`, () => {
      const r = contrast(white, tok('--mx-accent-selection')); assert.ok(r >= 4.5, r.toFixed(2));
    });
    test(`${mode} ${accent}: accent text on window >= 4.5`, () => {
      const r = contrast(tok('--mx-accent-text'), bg('--mx-bg-window')); assert.ok(r >= 4.5, r.toFixed(2));
    });
    for (const b of ['--mx-bg-window', '--mx-bg-sidebar-opaque', '--mx-bg-toolbar']) {
      test(`${mode} ${accent}: accent icon on ${b} >= 3`, () => {
        const r = contrast(tok('--mx-accent-icon'), bg(b)); assert.ok(r >= 3, r.toFixed(2));
      });
    }
  }
}
