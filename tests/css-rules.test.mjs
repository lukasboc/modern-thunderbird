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

test('unread cards set the theme dot directly on .read-status at --mx-unread-dot size', () => {
  const css = read('threadpane.css');
  assert.match(css, /\[data-properties~="unread"\] \.read-status\s*\{[^}]*content:\s*url\("icons\/dot\.svg"\) !important/);
  assert.match(css, /--read-status-size:\s*var\(--mx-unread-dot\)/);
});

// A relative url() inside a custom property resolves where var() is used (Thunderbird's own
// stylesheet under chrome://messenger/skin/), so the theme icon is not found there.
test('no relative url() inside custom properties', () => {
  for (const f of readdirSync(dir).filter(f => f.endsWith('.css'))) {
    const hits = [...read(f).matchAll(/(--[a-z0-9-]+)\s*:[^;{}]*url\("(?![a-z]+:)[^"]*"\)/g)].map(m => m[0]);
    assert.deepEqual(hits, [], f);
  }
});

// TB 159 infobar.css paints warnings light-dark(#fff160, #ffe900) with black text – glaring in dark mode.
test('notifications are calm cards in every chrome document', () => {
  const css = read('notifications.css');
  assert.doesNotMatch(css, /@-moz-document/);
  assert.match(css, /notification-message\s*\{[^}]*--message-bar-background-color:\s*var\(--mx-bg-sidebar-opaque\) !important/);
  assert.match(css, /notification-message\s*\{[^}]*--message-bar-text-color:\s*var\(--mx-label\) !important/);
});

test('privacy notice is neutral, warnings amber icon, errors red', () => {
  const css = read('notifications.css');
  assert.match(css, /notification-message\[value="remoteContent"\]\s*\{[^}]*--message-bar-icon-color:\s*var\(--mx-label-secondary\) !important/);
  assert.match(css, /notification-message\[type="warning"\]:not\(\[value="remoteContent"\]\)\s*\{[^}]*--message-bar-icon-color:\s*var\(--mx-flag-icon\) !important/);
  assert.match(css, /notification-message:is\(\[type="error"\], \[type="critical"\]\)\s*\{[^}]*--message-bar-background-color:\s*var\(--mx-danger-tint\) !important[^}]*--message-bar-icon-color:\s*var\(--mx-danger-icon\) !important/);
});

test('layout.css no longer styles notifications itself', () => {
  assert.doesNotMatch(read('layout.css'), /notification-message/);
});

// The dot sits at the top of its own column; the sender line is 1.5 × font tall. Giving the
// SVG the line's height (width stays the dot size) centres the dot on the sender line.
test('unread dot is vertically centred on the sender line', () => {
  const css = read('threadpane.css');
  assert.match(css, /\[data-properties~="unread"\] \.read-status\s*\{[^}]*block-size:\s*calc\(var\(--mx-line-height\) \* var\(--mx-font-headline-size\)\) !important/);
  assert.match(css, /\[data-properties~="unread"\] \.read-status\s*\{[^}]*inline-size:\s*var\(--mx-unread-dot\) !important/);
  assert.match(css, /& \.thread-card-row\s*\{[^}]*line-height:\s*var\(--mx-line-height\) !important/);
});

// TB's card grid ("dot column | text column") has no column gap: the dot touched the sender.
test('8px gap between unread dot column and text column', () => {
  assert.match(read('threadpane.css'), /& \.card-layout > td > \.card-container\s*\{[^}]*column-gap:\s*var\(--mx-space-2\) !important/);
});

// Global search results (glodaFacetView.xhtml): cards like the message list instead of grey boxes.
test('search results are styled as cards in their own document', () => {
  const css = read('search.css');
  assert.match(css, /@-moz-document url\("chrome:\/\/messenger\/content\/glodaFacetView\.xhtml"\)/);
  assert.match(css, /\.message\s*\{[^}]*border-radius:\s*var\(--mx-radius-md\) !important/);
  assert.match(css, /\.message-author\s*\{[^}]*font-weight:\s*var\(--mx-font-headline-weight\) !important/);
});

test('search snippet uses the system font, two lines, secondary colour', () => {
  const css = read('search.css');
  assert.match(css, /\.message-body\s*\{[^}]*font-family:\s*var\(--mx-font-family\) !important[^}]*-webkit-line-clamp:\s*2 !important/);
  assert.match(css, /\.message-body-fulltext-match\s*\{[^}]*background-color:\s*var\(--mx-accent-tint\) !important[^}]*color:\s*var\(--mx-label\) !important/);
});

test('search facets: pill toggles and bars in accent, selected text readable', () => {
  const css = read('search.css');
  assert.match(css, /\[checked\]:not\(\[disabled\]\) > \.facet-checkbox-bubble[^{]*\{[^}]*background-color:\s*var\(--mx-accent-selection\) !important[^}]*color:\s*var\(--mx-on-accent\) !important/);
  assert.match(css, /\.bar\[selected\][^{]*\{[^}]*background-color:\s*var\(--mx-accent-selection\) !important/);
  assert.match(css, /--barColor:\s*var\(--mx-accent-icon\) !important/);
});

// Quick-delete button injected by addon/: hidden until the card is hovered, red on hover.
test('card delete button: trash icon, revealed on hover, danger on hover, white on selection', () => {
  const css = read('threadpane.css');
  assert.match(css, /& \.mx-card-delete\s*\{[^}]*background:[^;]*url\("icons\/delete\.svg"\)[^}]*opacity:\s*0 !important/);
  assert.match(css, /\.card-layout:is\(:hover, :focus-within\) \.mx-card-delete\s*\{[^}]*opacity:\s*1 !important/);
  assert.match(css, /\.mx-card-delete:hover\s*\{[^}]*stroke:\s*var\(--mx-danger-icon\) !important/);
  assert.match(css, /\.card-layout\.selected > td > \.card-container \.mx-card-delete[^{]*\{[^}]*stroke:\s*var\(--mx-on-accent\) !important/);
});

// TB offsets #messengerBody by --spaces-total-width computed on :root from --spaces-icon-size.
// Setting spaces variables only on #spacesToolbar left a gap (white strip) next to the toolbar.
test('spaces toolbar variables live on :root and the total width is left to Thunderbird', () => {
  const css = read('layout.css');
  assert.doesNotMatch(css, /--spaces-total-width/);
  const rootBlock = css.match(/:root\s*\{([^}]*)\}/)[1];
  assert.match(rootBlock, /--spaces-icon-size:\s*var\(--mx-icon-md\) !important/);
  const toolbarBlock = css.match(/#spacesToolbar\s*\{([^}]*)\}/)[1];
  assert.doesNotMatch(toolbarBlock, /--spaces-/);
});
