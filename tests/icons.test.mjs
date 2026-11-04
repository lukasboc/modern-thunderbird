import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const dir = new URL('../chrome/icons/', import.meta.url);
export const ICONS = ['inbox', 'send', 'drafts', 'archive', 'trash', 'junk', 'folder', 'smart-folder',
  'reply', 'reply-all', 'forward', 'delete', 'flag', 'paperclip', 'compose', 'search', 'send-plane'];

test('all 17 icons exist', () => {
  for (const n of ICONS) assert.ok(existsSync(new URL(`${n}.svg`, dir)), n);
});

for (const n of ICONS) {
  test(`${n}.svg is a monochrome context-stroke icon`, () => {
    const svg = readFileSync(new URL(`${n}.svg`, dir), 'utf8');
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /<svg[^>]*fill="none"/);
    assert.match(svg, /<svg[^>]*stroke="context-stroke"/);
    assert.match(svg, /<svg[^>]*stroke-width="1.5"/);
    assert.match(svg, /<svg[^>]*stroke-linecap="round"/);
    const shapes = svg.match(/<(path|circle|rect|line|polyline|polygon|ellipse)\b[^>]*>/g) ?? [];
    assert.ok(shapes.length > 0, 'has shapes');
    for (const s of shapes) assert.match(s, /vector-effect="non-scaling-stroke"/, s);
    assert.doesNotMatch(svg, /#[0-9a-fA-F]{3,8}\b|rgba?\(|currentColor/);
    assert.match(svg, /<!-- lucide: [a-z0-9-]+ -->/);
  });
}

test('LICENSE is ISC', () => {
  assert.match(readFileSync(new URL('LICENSE', dir), 'utf8'), /ISC License/);
});
