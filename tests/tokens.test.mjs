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

test('font tokens are rem at 16px base', () => {
  const fonts = {
    title: ['1.375rem', '700'],
    headline: ['0.8125rem', '600'],
    body: ['0.8125rem', '400'],
    caption: ['0.75rem', '400'],
    section: ['0.6875rem', '600'],
  };
  for (const [k, [size, weight]] of Object.entries(fonts)) {
    assert.equal(light.get(`--mx-font-${k}-size`), size, k);
    assert.equal(light.get(`--mx-font-${k}-weight`), weight, k);
  }
  assert.equal(light.get('--mx-font-family'), 'system-ui, sans-serif');
});

test('spacing, radii and effects', () => {
  const expected = {
    '--mx-space-1': '0.25rem', '--mx-space-2': '0.5rem', '--mx-space-3': '0.75rem',
    '--mx-space-4': '1rem', '--mx-space-5': '1.5rem',
    '--mx-radius-sm': '0.375rem', '--mx-radius-md': '0.5rem', '--mx-radius-lg': '0.625rem',
    '--mx-shadow-popup': '0 8px 24px rgba(0,0,0,0.18)',
    '--mx-duration': '180ms', '--mx-ease': 'ease-out',
    '--mx-hairline': '1px', '--mx-focus-width': '3px',
  };
  for (const [k, v] of Object.entries(expected)) assert.equal(light.get(k), v, k);
});

test('measurement tokens', () => {
  const expected = {
    '--mx-toolbar-height': '3.25rem', '--mx-search-height': '1.75rem', '--mx-folder-row': '1.75rem',
    '--mx-icon-sm': '1rem', '--mx-icon-md': '1.125rem', '--mx-avatar': '2.5rem',
    '--mx-unread-dot': '0.5rem', '--mx-message-max': '45rem',
    '--mx-card-pad-y': '0.625rem', '--mx-card-pad-x': '1rem', '--mx-card-inset': '0.375rem',
  };
  for (const [k, v] of Object.entries(expected)) assert.equal(light.get(k), v, k);
});

test('derived accent tokens are color-mix expressions', () => {
  // accent-selection / accent-text / accent-icon: see tests/accent.test.mjs
  assert.equal(light.get('--mx-accent-tint'), 'color-mix(in srgb, var(--mx-accent) 12%, transparent)');
  assert.equal(light.get('--mx-focus-ring'), 'color-mix(in srgb, var(--mx-accent) 50%, transparent)');
  assert.equal(light.get('--mx-on-accent'), '#FFFFFF');
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
