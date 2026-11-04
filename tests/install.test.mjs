import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, lstatSync, readlinkSync, existsSync, rmSync, readdirSync, chmodSync, statSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const run = (script, profile, env = {}) => spawnSync('bash', [join(repo, 'scripts', script), profile], { encoding: 'utf8', env: { ...process.env, MX_TB_PROCESS: 'mx-no-such-process', ...env } });
const ORIGINAL = 'user_pref("x", 1);\n';
let profile;

beforeEach(() => {
  profile = mkdtempSync(join(tmpdir(), 'mx-profile-'));
  writeFileSync(join(profile, 'prefs.js'), '');
  writeFileSync(join(profile, 'user.js'), ORIGINAL);
});
afterEach(() => rmSync(profile, { recursive: true, force: true }));

// Content processes are sandboxed to the profile: a chrome/ symlink pointing into the repo makes
// userContent.css fail to load (NS_ERROR_FILE_ACCESS_DENIED). So chrome/ is copied, with a marker.
test('install copies chrome/ into the profile with a marker (no symlink)', () => {
  const r = run('install.sh', profile);
  assert.equal(r.status, 0, r.stderr);
  const dir = join(profile, 'chrome');
  assert.ok(!lstatSync(dir).isSymbolicLink());
  assert.ok(existsSync(join(dir, '.mx-theme')));
  for (const f of ['userChrome.css', 'userContent.css', 'tokens.css', 'icons/dot.svg']) {
    assert.equal(readFileSync(join(dir, f), 'utf8'), readFileSync(join(repo, 'chrome', f), 'utf8'), f);
  }
});

test('re-running install refreshes the copied chrome/', () => {
  run('install.sh', profile);
  // Never write through a symlink: that would overwrite the repo's own chrome/.
  assert.ok(!lstatSync(join(profile, 'chrome')).isSymbolicLink(), 'chrome/ must be a copy before writing into it');
  writeFileSync(join(profile, 'chrome', 'tokens.css'), 'stale');
  writeFileSync(join(profile, 'chrome', 'leftover.css'), 'x');
  const r = run('install.sh', profile);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(profile, 'chrome', 'tokens.css'), 'utf8'), readFileSync(join(repo, 'chrome', 'tokens.css'), 'utf8'));
  assert.ok(!existsSync(join(profile, 'chrome', 'leftover.css')));
  assert.ok(existsSync(join(profile, 'chrome', '.mx-theme')));
});

test('install replaces an old symlink to this repo with a copy', () => {
  symlinkSync(join(repo, 'chrome'), join(profile, 'chrome'));
  const r = run('install.sh', profile);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!lstatSync(join(profile, 'chrome')).isSymbolicLink());
  assert.ok(existsSync(join(profile, 'chrome', '.mx-theme')));
});

test('install appends marked block and keeps existing lines', () => {
  run('install.sh', profile);
  const text = readFileSync(join(profile, 'user.js'), 'utf8');
  assert.ok(text.startsWith(ORIGINAL));
  assert.match(text, /\/\/ >>> mx-theme\n[\s\S]*user_pref\("toolkit\.legacyUserProfileCustomizations\.stylesheets", true\);[\s\S]*\/\/ <<< mx-theme\n$/);
  for (const p of ['mail.uidensity', 'mail.threadpane.listview', 'mail.threadpane.cardsview.rowcount', 'mail.tabs.autoHide', 'mail.appearance.accentColor', 'svg.context-properties.content.enabled']) {
    assert.ok(text.includes(`user_pref("${p}"`), p);
  }
});

test('install twice is idempotent', () => {
  run('install.sh', profile);
  const r = run('install.sh', profile);
  assert.equal(r.status, 0, r.stderr);
  const text = readFileSync(join(profile, 'user.js'), 'utf8');
  assert.equal(text.split('// >>> mx-theme').length - 1, 1);
});

test('install refuses when profile chrome/ exists and is not ours', () => {
  mkdirSync(join(profile, 'chrome'));
  writeFileSync(join(profile, 'chrome', 'mine.css'), 'x');
  const r = run('install.sh', profile);
  assert.equal(r.status, 1);
  assert.deepEqual(readdirSync(join(profile, 'chrome')), ['mine.css']);
  assert.equal(readFileSync(join(profile, 'user.js'), 'utf8'), ORIGINAL);
});

test('uninstall restores user.js byte-identical and removes the copied chrome/', () => {
  run('install.sh', profile);
  const r = run('uninstall.sh', profile);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(profile, 'user.js'), 'utf8'), ORIGINAL);
  assert.ok(!existsSync(join(profile, 'chrome')));
});

test('install without prefs.js exits 1', () => {
  rmSync(join(profile, 'prefs.js'));
  const r = run('install.sh', profile);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /prefs\.js/);
});

test('uninstall removes theme prefs persisted in prefs.js, keeps others', () => {
  run('install.sh', profile);
  writeFileSync(join(profile, 'prefs.js'),
    'user_pref("mail.uidensity", 2);\nuser_pref("other.pref", "keep");\nuser_pref("mail.threadpane.cardsview.rowcount", 3);\n');
  const r = run('uninstall.sh', profile);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(join(profile, 'prefs.js'), 'utf8'), 'user_pref("other.pref", "keep");\n');
});

test('install and uninstall refuse while Thunderbird runs', () => {
  for (const script of ['install.sh', 'uninstall.sh']) {
    const r = run(script, profile, { MX_TB_PROCESS: 'node' });
    assert.equal(r.status, 1, script);
    assert.match(r.stderr, /running/, script);
  }
  assert.equal(readFileSync(join(profile, 'user.js'), 'utf8'), ORIGINAL);
});

test('uninstall keeps user.js edits made after install', () => {
  run('install.sh', profile);
  writeFileSync(join(profile, 'user.js'), readFileSync(join(profile, 'user.js'), 'utf8') + 'user_pref("later", 2);\n');
  run('uninstall.sh', profile);
  assert.equal(readFileSync(join(profile, 'user.js'), 'utf8'), ORIGINAL + 'user_pref("later", 2);\n');
});

test('uninstall without prior user.js keeps prefs the user added later', () => {
  rmSync(join(profile, 'user.js'));
  run('install.sh', profile);
  writeFileSync(join(profile, 'user.js'), readFileSync(join(profile, 'user.js'), 'utf8') + 'user_pref("later", 2);\n');
  run('uninstall.sh', profile);
  assert.equal(readFileSync(join(profile, 'user.js'), 'utf8'), 'user_pref("later", 2);\n');
});

test('uninstall without prior user.js removes the file it created', () => {
  rmSync(join(profile, 'user.js'));
  run('install.sh', profile);
  run('uninstall.sh', profile);
  assert.ok(!existsSync(join(profile, 'user.js')));
});

test('uninstall never clobbers an unreadable prefs.js', () => {
  run('install.sh', profile);
  const prefs = join(profile, 'prefs.js');
  writeFileSync(prefs, 'user_pref("keep", 1);\n');
  chmodSync(prefs, 0o000);
  const r = run('uninstall.sh', profile);
  chmodSync(prefs, 0o600);
  assert.notEqual(r.status, 0);
  assert.equal(readFileSync(prefs, 'utf8'), 'user_pref("keep", 1);\n');
});

test('uninstall preserves prefs.js mode', () => {
  run('install.sh', profile);
  const prefs = join(profile, 'prefs.js');
  chmodSync(prefs, 0o600);
  run('uninstall.sh', profile);
  assert.equal(statSync(prefs).mode & 0o777, 0o600);
});

// One-time defaults go into prefs.js (user stays free to change them), not user.js (re-applied every start).
test('install sets UI font size 14 once in prefs.js, not in user.js', () => {
  run('install.sh', profile);
  assert.match(readFileSync(join(profile, 'prefs.js'), 'utf8'), /^user_pref\("mail\.uifontsize", 14\);$/m);
  assert.doesNotMatch(readFileSync(join(profile, 'user.js'), 'utf8'), /mail\.uifontsize/);
});

test('install keeps a UI font size the user already chose', () => {
  writeFileSync(join(profile, 'prefs.js'), 'user_pref("mail.uifontsize", 18);\n');
  run('install.sh', profile);
  assert.equal(readFileSync(join(profile, 'prefs.js'), 'utf8'), 'user_pref("mail.uifontsize", 18);\n');
});

test('uninstall removes the one-time UI font size', () => {
  run('install.sh', profile);
  run('uninstall.sh', profile);
  assert.doesNotMatch(readFileSync(join(profile, 'prefs.js'), 'utf8'), /mail\.uifontsize/);
});

test('re-running install on an installed profile adds new one-time defaults', () => {
  run('install.sh', profile);
  writeFileSync(join(profile, 'prefs.js'), '');
  const r = run('install.sh', profile);
  assert.equal(r.status, 0, r.stderr);
  assert.match(readFileSync(join(profile, 'prefs.js'), 'utf8'), /mail\.uifontsize", 14/);
});

test('uninstall leaves a foreign chrome/ folder alone', () => {
  run('install.sh', profile);
  rmSync(join(profile, 'chrome', '.mx-theme'));
  run('uninstall.sh', profile);
  assert.ok(existsSync(join(profile, 'chrome', 'userChrome.css')));
});
