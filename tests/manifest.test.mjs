import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { parseTokens } from './lib/tokens.mjs';
import { parseColor } from './lib/color.mjs';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = JSON.parse(readFileSync(join(repo, 'theme/manifest.json'), 'utf8'));
const { light, dark: darkOnly } = parseTokens(readFileSync(join(repo, 'chrome/tokens.css'), 'utf8'));
const dark = new Map([...light, ...darkOnly]);

const MAP = {
  frame: 'bg-toolbar', toolbar: 'bg-toolbar',
  tab_background_text: 'label', toolbar_text: 'label', sidebar_text: 'label', popup_text: 'label',
  toolbar_field_text: 'label', sidebar_highlight_text: 'label',
  sidebar: 'bg-sidebar-opaque', sidebar_highlight: 'selection-sidebar',
  popup: 'bg-window', toolbar_field: 'bg-window',
  popup_border: 'separator', toolbar_bottom_separator: 'separator',
  tab_line: 'accent',
};

for (const [section, tokens] of [['theme', light], ['dark_theme', dark]]) {
  test(`${section} colors equal tokens`, () => {
    const colors = manifest[section]?.colors;
    assert.ok(colors, `${section}.colors missing`);
    for (const [key, token] of Object.entries(MAP)) {
      assert.deepEqual(parseColor(colors[key]), parseColor(tokens.get(`--mx-${token}`)), `${section}.${key}`);
    }
  });
}

test('color_scheme is system', () => {
  assert.equal(manifest.theme.properties?.color_scheme, 'system');
});

test('gecko id and minimum version', () => {
  assert.equal(manifest.browser_specific_settings.gecko.id, 'modern-thunderbird-theme@local');
  assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, '128.0');
});

test('xpi has manifest at root', () => {
  rmSync(join(repo, 'dist'), { recursive: true, force: true });
  const b = spawnSync('bash', [join(repo, 'scripts/build-theme.sh')], { encoding: 'utf8' });
  assert.equal(b.status, 0, b.stderr);
  const l = spawnSync('unzip', ['-l', join(repo, 'dist/modern-thunderbird-theme.xpi')], { encoding: 'utf8' });
  assert.match(l.stdout, /\s manifest\.json\n/);
});
