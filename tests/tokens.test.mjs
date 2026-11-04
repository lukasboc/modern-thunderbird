import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTokens } from './lib/tokens.mjs';

const css = readFileSync(new URL('../chrome/tokens.css', import.meta.url), 'utf8');
const { light, dark } = parseTokens(css);

// [light, dark] — spec table "Farben" incl. plan deviation 1 (label-secondary light 0.55)
const SPEC = {
  '--mx-bg-window': ['#FFFFFF', '#1E1E1E'],
  '--mx-bg-sidebar': ['rgba(246,246,246,0.85)', 'rgba(40,40,40,0.85)'],
  '--mx-bg-sidebar-opaque': ['#F6F6F6', '#282828'],
  '--mx-bg-toolbar': ['#F6F6F6', '#2B2B2B'],
  '--mx-accent': ['#007AFF', '#0A84FF'],
  '--mx-label': ['rgba(0,0,0,0.85)', 'rgba(255,255,255,0.85)'],
  '--mx-label-secondary': ['rgba(0,0,0,0.55)', 'rgba(255,255,255,0.55)'],
  '--mx-label-tertiary': ['rgba(0,0,0,0.26)', 'rgba(255,255,255,0.25)'],
  '--mx-separator': ['rgba(0,0,0,0.10)', 'rgba(255,255,255,0.10)'],
  '--mx-selection-sidebar': ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.10)'],
  '--mx-pressed': ['rgba(0,0,0,0.16)', 'rgba(255,255,255,0.20)'],
  '--mx-selection-inactive': ['#DCDCDC', '#3A3A3A'],
  '--mx-flag': ['#FF9500', '#FF9F0A'],
  '--mx-danger': ['#FF3B30', '#FF453A'],
};

test('every spec color token has exact light and dark value', () => {
  for (const [name, [l, d]] of Object.entries(SPEC)) {
    assert.equal(light.get(name), l, `light ${name}`);
    assert.equal(dark.get(name), d, `dark ${name}`);
  }
});

// Thunderbird's chrome root font is the macOS system size (13px), not 16px.
// One design unit = 1px at the default UI font size and scales with Settings › Font size.
const u = px => `calc(${px} * var(--mx-unit))`;

test('design unit derives from a 13px root', () => {
  assert.equal(light.get('--mx-unit'), 'calc(1rem / 13)');
});

test('message content and composer editor (16px root) pin the unit to 1px', () => {
  assert.match(css, /@-moz-document url-prefix\("imap:"\), url-prefix\("mailbox:"\), url-prefix\("news:"\), url-prefix\("snews:"\), url-prefix\("about:blank\?compose"\)\s*\{\s*:root\s*\{\s*--mx-unit:\s*1px;/);
});

test('font tokens use spec pixel sizes', () => {
  const fonts = { title: [22, '700'], headline: [13, '600'], body: [13, '400'], caption: [12, '400'], section: [11, '600'] };
  for (const [k, [px, weight]] of Object.entries(fonts)) {
    assert.equal(light.get(`--mx-font-${k}-size`), u(px), k);
    assert.equal(light.get(`--mx-font-${k}-weight`), weight, k);
  }
  assert.equal(light.get('--mx-font-family'), 'system-ui, sans-serif');
});

test('spacing, radii and effects', () => {
  const expected = {
    '--mx-space-1': u(4), '--mx-space-2': u(8), '--mx-space-3': u(12), '--mx-space-4': u(16), '--mx-space-5': u(24),
    '--mx-radius-sm': u(6), '--mx-radius-md': u(8), '--mx-radius-lg': u(10),
    '--mx-shadow-popup': '0 8px 24px rgba(0,0,0,0.18)',
    '--mx-duration': '180ms', '--mx-ease': 'ease-out',
    '--mx-hairline': '1px', '--mx-focus-width': '3px',
  };
  for (const [k, v] of Object.entries(expected)) assert.equal(light.get(k), v, k);
});

test('measurement tokens', () => {
  const expected = {
    '--mx-toolbar-height': u(52), '--mx-search-height': u(28), '--mx-folder-row': u(28),
    '--mx-icon-sm': u(16), '--mx-icon-md': u(18), '--mx-avatar': u(40),
    '--mx-unread-dot': u(10), '--mx-message-max': u(720),
    '--mx-card-pad-y': u(10), '--mx-card-pad-x': u(16), '--mx-card-inset': u(6),
    '--mx-spaces-width': u(44),
  };
  for (const [k, v] of Object.entries(expected)) assert.equal(light.get(k), v, k);
});

test('no token besides the unit uses rem', () => {
  for (const [k, v] of light) if (k !== '--mx-unit') assert.doesNotMatch(v, /rem\b/, k);
});

test('derived accent tokens are color-mix expressions', () => {
  // accent-selection / accent-text / accent-icon: see tests/accent.test.mjs
  assert.equal(light.get('--mx-accent-tint'), 'color-mix(in srgb, var(--mx-accent) 12%, transparent)');
  assert.equal(light.get('--mx-focus-ring'), 'color-mix(in srgb, var(--mx-accent) 50%, transparent)');
  assert.equal(light.get('--mx-on-accent'), '#FFFFFF');
  assert.equal(light.get('--mx-danger-icon'), 'color-mix(in srgb, var(--mx-danger) 80%, black)');
  assert.equal(dark.get('--mx-danger-icon'), 'var(--mx-danger)');
  assert.equal(light.get('--mx-danger-tint'), 'color-mix(in srgb, var(--mx-danger) 10%, var(--mx-bg-sidebar-opaque))');
  assert.equal(light.get('--mx-flag-icon'), 'color-mix(in srgb, var(--mx-flag) 80%, black)');
  assert.equal(dark.get('--mx-flag-icon'), 'var(--mx-flag)');
  assert.ok(light.has('--mx-capsule') && dark.has('--mx-capsule'), 'capsule light+dark');
});

test('system accent override comes after the dark block', () => {
  const supports = css.search(/@supports \(color: AccentColor\)\s*{\s*:root\s*{[^}]*--mx-accent:\s*AccentColor;/);
  const darkIdx = css.search(/@media \(prefers-color-scheme: dark\)/);
  assert.ok(supports > -1, '@supports AccentColor block');
  assert.ok(supports > darkIdx, '@supports after dark media block');
});

test('accessibility media overrides', () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[^@]*--mx-duration:\s*0ms/);
  assert.match(css, /@media \(prefers-contrast: more\)[^@]*--mx-separator:\s*rgba\(0,0,0,0\.25\)/);
  assert.match(css, /@media \(prefers-contrast: more\) and \(prefers-color-scheme: dark\)[^@]*--mx-separator:\s*rgba\(255,255,255,0\.25\)/);
  assert.match(css, /@media \(prefers-contrast: more\)[^@]*--mx-bg-sidebar:\s*var\(--mx-bg-sidebar-opaque\)/);
  assert.match(css, /@media \(prefers-reduced-transparency: reduce\)[^@]*--mx-bg-sidebar:\s*var\(--mx-bg-sidebar-opaque\)/);
});
