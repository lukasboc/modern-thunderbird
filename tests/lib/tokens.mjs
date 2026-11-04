// Parses --mx-* custom properties from tokens.css.
// light: :root blocks outside any at-rule; dark: :root inside @media (prefers-color-scheme: dark).
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function topLevelBlocks(css) {
  const blocks = [];
  let depth = 0, start = 0, prelude = '', bodyStart = -1;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') {
      if (depth === 0) { prelude = css.slice(start, i).trim(); bodyStart = i + 1; }
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) { blocks.push({ prelude, body: css.slice(bodyStart, i) }); start = i + 1; }
    }
  }
  return blocks;
}

function declarations(body) {
  const map = new Map();
  for (const m of body.matchAll(/(--mx-[a-z0-9-]+)\s*:\s*([^;]+);/g)) map.set(m[1], m[2].trim());
  return map;
}

export function parseTokens(cssText) {
  const css = stripComments(cssText);
  const light = new Map();
  const dark = new Map();
  for (const { prelude, body } of topLevelBlocks(css)) {
    if (prelude === ':root') for (const [k, v] of declarations(body)) light.set(k, v);
    else if (/^@media\s*\(prefers-color-scheme:\s*dark\)$/.test(prelude)) {
      for (const inner of topLevelBlocks(body)) {
        if (inner.prelude === ':root') for (const [k, v] of declarations(inner.body)) dark.set(k, v);
      }
    }
  }
  return { light, dark };
}
