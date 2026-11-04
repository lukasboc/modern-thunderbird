import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parseTokens } from './lib/tokens.mjs';

const dir = new URL('../chrome/', import.meta.url);
const tokensCss = readFileSync(new URL('tokens.css', dir), 'utf8');
const { light } = parseTokens(tokensCss);

test('every var(--mx-*) used in area files is defined in tokens.css', () => {
  const missing = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.css') && f !== 'tokens.css')) {
    for (const m of readFileSync(new URL(f, dir), 'utf8').matchAll(/var\((--mx-[a-z0-9-]+)/g)) {
      if (!light.has(m[1])) missing.push(`${f}: ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('every icons/*.svg referenced in area files exists', () => {
  const missing = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.css'))) {
    for (const m of readFileSync(new URL(f, dir), 'utf8').matchAll(/url\("icons\/([a-z-]+)\.svg"\)/g)) {
      if (!existsSync(new URL(`icons/${m[1]}.svg`, dir))) missing.push(`${f}: ${m[1]}`);
    }
  }
  assert.deepEqual(missing, []);
});
