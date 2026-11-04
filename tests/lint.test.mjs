import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../chrome/', import.meta.url);
const read = f => readFileSync(new URL(f, dir), 'utf8');
const AREA = ['layout', 'folderpane', 'threadpane', 'messagepane', 'compose', 'notifications'];

const FORBIDDEN = [
  [/#[0-9a-fA-F]{3,8}\b/, 'hex colour'],
  [/\b(rgba?|hsla?)\(/, 'colour function'],
  [/(?<![\w-])\d*\.?\d+(px|rem|em|ms|s)\b/, 'length/time literal'],
  [/(?<![\w-])(white|black)(?![\w-])/, 'named colour'],
];

function codeLines(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ''))
    .split('\n')
    .map((text, i) => ({ text, line: i + 1 }))
    .filter(({ text }) => !/^\s*@(import|-moz-document)\b/.test(text));
}

test('area files contain no literals', () => {
  const files = readdirSync(dir).filter(f => f.endsWith('.css') && f !== 'tokens.css');
  const errors = [];
  for (const f of files) {
    for (const { text, line } of codeLines(read(f))) {
      for (const [re, what] of FORBIDDEN) if (re.test(text)) errors.push(`${f}:${line} ${what}: ${text.trim()}`);
    }
  }
  assert.deepEqual(errors, []);
});

function imports(file) {
  const lines = read(file).replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.trim()).filter(Boolean);
  for (const l of lines) assert.match(l, /^@import url\("[a-z]+\.css"\);$/, `${file}: ${l}`);
  return lines.map(l => l.match(/"([a-z]+)\.css"/)[1]);
}

test('userChrome.css only imports, tokens first', () => {
  assert.equal(imports('userChrome.css')[0], 'tokens');
});

test('userChrome imports every area file', () => {
  const list = imports('userChrome.css');
  for (const a of AREA) assert.ok(list.includes(a), a);
});

// about:preferences is a content-type browser: it gets userContent.css, not userChrome.css.
test('userContent imports tokens, content, preferences', () => {
  assert.deepEqual(imports('userContent.css'), ['tokens', 'content', 'preferences']);
});

test('userChrome does not import preferences', () => {
  assert.ok(!imports('userChrome.css').includes('preferences'));
});

// userChrome/userContent are USER sheets: without !important they lose to Thunderbird's author styles.
test('every declaration in area files is !important', () => {
  const errors = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.css') && !['tokens.css', 'userChrome.css', 'userContent.css'].includes(f))) {
    const css = read(f).replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ''));
    for (const m of css.matchAll(/(?<=^|[{;\s])(-{0,2}[a-z][a-z0-9-]*)\s*:\s*([^;{}]*);/gim)) {
      if (!/!important\s*$/.test(m[2])) errors.push(`${f}: ${m[1]}: ${m[2].trim()}`);
    }
  }
  assert.deepEqual(errors, []);
});
