// Quick-delete add-on (addon/): Experiment API adds a delete button to message cards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import vm from 'node:vm';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const addon = p => join(repo, 'addon', p);
const manifest = JSON.parse(readFileSync(addon('manifest.json'), 'utf8'));

test('manifest: id, min version, permissions, background', () => {
  assert.equal(manifest.manifest_version, 2);
  assert.equal(manifest.browser_specific_settings.gecko.id, 'modern-thunderbird-actions@local');
  assert.equal(manifest.browser_specific_settings.gecko.strict_min_version, '128.0');
  assert.deepEqual([...manifest.permissions].sort(), ['messagesDelete', 'messagesRead']);
  assert.deepEqual(manifest.background.scripts, ['background.js']);
  assert.ok(existsSync(addon('background.js')));
});

test('manifest: experiment API files exist and load at startup', () => {
  const api = manifest.experiment_apis.cardDelete;
  assert.ok(existsSync(addon(api.schema)));
  assert.ok(existsSync(addon(api.parent.script)));
  assert.deepEqual(api.parent.scopes, ['addon_parent']);
  assert.deepEqual(api.parent.paths, [['cardDelete']]);
  assert.deepEqual(api.parent.events, ['startup']);
});

test('schema declares onDeleteClicked(messageIds: integer[])', () => {
  const [ns] = JSON.parse(readFileSync(addon(manifest.experiment_apis.cardDelete.schema), 'utf8'));
  assert.equal(ns.namespace, 'cardDelete');
  const ev = ns.events.find(e => e.name === 'onDeleteClicked');
  assert.ok(ev);
  assert.deepEqual(ev.parameters, [{ name: 'messageIds', type: 'array', items: { type: 'integer' } }]);
});

function runBackground() {
  const calls = [];
  let listener;
  const messenger = {
    cardDelete: { onDeleteClicked: { addListener: fn => { listener = fn; } } },
    messages: { delete: async (...args) => { calls.push(args); } },
  };
  vm.runInNewContext(readFileSync(addon('background.js'), 'utf8'), { messenger });
  return { calls, fire: ids => listener(ids) };
}

// TB 159 rejects a plain boolean ("Specify the options object …"). isUserAction passes the mail
// window to folder.deleteMessages and sets allowUndo, so ⌘Z restores the message.
test('background deletes the clicked messages to trash as a user action (undo)', async () => {
  const bg = runBackground();
  await bg.fire([3, 7]);
  assert.equal(bg.calls.length, 1);
  const [ids, options] = bg.calls[0];
  assert.deepEqual([...ids], [3, 7]);
  assert.deepEqual({ ...options }, { isUserAction: true });
});

test('background ignores an empty id list', async () => {
  const bg = runBackground();
  await bg.fire([]);
  assert.deepEqual(bg.calls, []);
});

// --- implementation.js helpers, evaluated with stubbed privileged globals ---
function loadImplementation() {
  const sandbox = {
    ChromeUtils: { importESModule: () => ({ ExtensionCommon: { ExtensionAPI: class {}, EventManager: class {} } }) },
    Services: {},
  };
  vm.runInNewContext(readFileSync(addon(manifest.experiment_apis.cardDelete.parent.script), 'utf8'), sandbox);
  return sandbox;
}

test('implementation defines the cardDelete API class', () => {
  assert.equal(typeof loadImplementation().cardDelete, 'function');
});

test('deleteLabel is German for de locales, English otherwise', () => {
  const impl = loadImplementation();
  assert.equal(impl.deleteLabel('de-DE'), 'Löschen');
  assert.equal(impl.deleteLabel('en-US'), 'Delete');
});

test('headersForRow: single message, or the whole collapsed thread', () => {
  const impl = loadImplementation();
  const thread = { numChildren: 3, getChildHdrAt: i => `t${i}` };
  const view = {
    isContainer: i => i === 1,
    isContainerOpen: () => false,
    getThreadContainingIndex: () => thread,
    getMsgHdrAt: i => `m${i}`,
  };
  assert.deepEqual([...impl.headersForRow(view, 0)], ['m0']);
  assert.deepEqual([...impl.headersForRow(view, 1)], ['t0', 't1', 't2']);
  const open = { ...view, isContainerOpen: () => true };
  assert.deepEqual([...impl.headersForRow(open, 1)], ['m1']);
});

// Minimal fake DOM for addButton
function fakeContainer() {
  const children = [{ className: 'button-star tree-button-flag', classList: { contains: c => ['button-star', 'tree-button-flag'].includes(c) } }];
  const attrs = {};
  const doc = {
    createElement: () => ({ setAttribute(k, v) { this.attrs = { ...this.attrs, [k]: v }; }, attrs: {} }),
  };
  const container = {
    children,
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return children.find(c => c.className.split(' ').includes(cls)) ?? null;
    },
    insertBefore(node, ref) {
      const i = ref ? children.indexOf(ref) : children.length;
      children.splice(i, 0, node);
    },
  };
  children[0].nextSibling = null;
  return { container, doc, children, attrs };
}

test('addButton inserts one labelled, non-tabbable delete button after the star', () => {
  const impl = loadImplementation();
  const { container, doc, children } = fakeContainer();
  assert.equal(impl.addButton(container, doc, 'Löschen'), true);
  assert.equal(children.length, 2);
  const btn = children[1];
  assert.match(btn.className, /\bmx-card-delete\b/);
  assert.equal(btn.type, 'button');
  assert.equal(btn.tabIndex, -1);
  assert.equal(btn.title, 'Löschen');
  assert.equal(btn.attrs['aria-label'], 'Löschen');
  assert.equal(impl.addButton(container, doc, 'Löschen'), false, 'idempotent');
  assert.equal(children.length, 2);
});

test('build-addon.sh packs manifest and experiment at the xpi root', () => {
  rmSync(join(repo, 'dist/modern-thunderbird-actions.xpi'), { force: true });
  const b = spawnSync('bash', [join(repo, 'scripts/build-addon.sh')], { encoding: 'utf8' });
  assert.equal(b.status, 0, b.stderr);
  const l = spawnSync('unzip', ['-l', join(repo, 'dist/modern-thunderbird-actions.xpi')], { encoding: 'utf8' }).stdout;
  for (const f of ['manifest.json', 'background.js', 'experiments/cardDelete/schema.json', 'experiments/cardDelete/implementation.js']) {
    assert.match(l, new RegExp(`\\s${f.replace(/[./]/g, '\\$&')}\\n`), f);
  }
});

// Background may register its listener (getAPI) before onStartup runs; onStartup must not
// throw that listener away, and report() must reach it with the converted ids.
test('listener registered before onStartup still receives deleted ids', () => {
  let registered;
  const sandbox = {
    ChromeUtils: { importESModule: () => ({ ExtensionCommon: {
      ExtensionAPI: class { constructor(extension) { this.extension = extension; } },
      EventManager: class { constructor(opts) { registered = opts.register; } api() { return {}; } },
    } }) },
    Services: { obs: { addObserver() {}, removeObserver() {} }, wm: { getEnumerator: () => [] } },
  };
  vm.runInNewContext(readFileSync(addon(manifest.experiment_apis.cardDelete.parent.script), 'utf8') + '\nthis.API = cardDelete;', sandbox);
  const api = new sandbox.API({ messageManager: { convert: h => ({ id: h.n }) } });
  api.getAPI({});
  const got = [];
  registered({ async: ids => got.push([...ids]) });
  api.onStartup();
  api.report([{ n: 4 }, { n: 9 }]);
  assert.deepEqual(got, [[4, 9]]);
});
