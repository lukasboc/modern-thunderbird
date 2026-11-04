// Guards for behaviour found in the final review (TB 159 source cross-checks).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../chrome/', import.meta.url);
const read = f => readFileSync(new URL(f, dir), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('header buttons lose labels only in the sender toolbar (iMIP buttons keep theirs)', () => {
  const css = read('messagepane.css');
  const hits = css.split('\n').filter(l => l.includes('.toolbarbutton-text'));
  assert.ok(hits.length > 0);
  for (const l of hits) assert.match(l, /#headerSenderToolbarContainer \.message-header-view-button \.toolbarbutton-text/, l);
});

test('card cells keep Thunderbird thread indent (no padding-inline shorthand)', () => {
  const css = read('threadpane.css');
  assert.doesNotMatch(css, /padding-inline:\s*var\(--mx-card-inset\)/);
  assert.match(css, /padding-inline-end:\s*var\(--mx-card-inset\)/);
});

test('selected card does not fill every img/button (flag star stays readable)', () => {
  assert.doesNotMatch(read('threadpane.css'), /&\s*img,\s*&\s*button/);
});

test('keyboard current card is visibly outlined', () => {
  assert.match(read('threadpane.css'), /\.card-layout\.current:not\(\.selected\)[^{]*\{[^}]*outline:[^}]*var\(--mx-focus-ring\)/);
});

test('server rows keep busy/error icons; tls-error keeps its colour', () => {
  const css = read('folderpane.css');
  assert.match(css, /li\[data-server-type\]:not\(\[data-is-busy="true"\], \[data-has-error="true"\], \.tls-error\) > \.container > \.icon\s*\{\s*display:\s*none/);
  assert.match(css, /#folderTree li:not\(\[data-is-busy="true"\], \[data-has-error="true"\], \.tls-error\) > \.container > \.icon/);
});

test('no area file overrides the root font-size (UI font size setting must win)', () => {
  for (const f of readdirSync(dir).filter(f => f.endsWith('.css') && f !== 'tokens.css')) {
    for (const m of read(f).matchAll(/:root\s*\{([^}]*)\}/g)) {
      assert.doesNotMatch(m[1], /(^|[\s;])font-size\s*:/, f);
    }
  }
});

test('message links are recoloured only in the dark block', () => {
  const css = read('content.css');
  const msg = css.slice(0, css.indexOf('about:blank?compose'));
  const light = msg.slice(0, msg.indexOf('prefers-color-scheme: dark'));
  assert.doesNotMatch(light, /a:link/);
});

test('forced dark mode follows the per-message dark reader toggle', () => {
  assert.match(read('content.css'), /@media screen and \(prefers-color-scheme: dark\) and -moz-pref\("mail\.dark-reader\.enabled"\)/);
});

test('dark composer keeps quoted text readable', () => {
  const compose = read('content.css').split('about:blank?compose')[1];
  assert.match(compose, /prefers-color-scheme: dark[\s\S]*blockquote\[type="cite"\] \*/);
});

test('accent used for icons and text goes through contrast-safe tokens', () => {
  for (const f of readdirSync(dir).filter(f => f.endsWith('.css') && f !== 'tokens.css')) {
    const raw = [...read(f).matchAll(/(stroke|fill|color|outline|border[a-z-]*)\s*:[^;]*var\(--mx-accent\)/g)].map(m => m[0]);
    assert.deepEqual(raw, [], f);
  }
});

test('unread cards use the theme dot at --mx-unread-dot size', () => {
  const css = read('threadpane.css');
  assert.match(css, /--read-status-icon:\s*url\("icons\/dot\.svg"\)/);
  assert.match(css, /--read-status-size:\s*var\(--mx-unread-dot\)/);
});
