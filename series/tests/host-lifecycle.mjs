import test from 'node:test';
import assert from 'node:assert/strict';
import { createHost } from '../core/host.js';

function setup() {
  const made = [];
  const element = () => ({ hidden: true, className: '', children: [], addEventListener() {}, appendChild(e) { this.children.push(e); }, remove() { this.removed = true; } });
  globalThis.document = { body: { classList: { add() {}, remove() {} } }, createElement: () => { const e = element(); made.push(e); return e; } };
  const log = [], core = {
    config: { backButton: true }, base: './', settings: {}, speech: { stop: () => log.push('speech.stop') }, sound: {},
    rights: { has: () => true }, ui: { toast: t => log.push(t) }, member: { earn() {} },
    events: { report: (...a) => log.push(a) }, onClose: id => log.push('onClose:' + id),
  };
  const layer = element(), back = element();
  return { host: createHost(core, layer, back), core, log, layer, back, made };
}

test('通常の起動・保存の名前空間・終了を維持し、終了後にイベントへ通知する', async () => {
  const { host, log, layer, back } = setup(); let ctx;
  const off = host.onClose(id => log.push('listener:' + id));
  assert.equal(await host.open({ id: 'stream', mount(el, c) { ctx = c; return { unmount: () => log.push('unmount') }; } }, { wordset: { lv: 1, k: 0 } }), true);
  assert.equal(host.current, 'stream'); assert.equal(layer.hidden, false); assert.equal(back.hidden, false);
  assert.deepEqual(ctx.opts.wordset, { lv: 1, k: 0 });
  globalThis.localStorage = { getItem: k => k === 'cs:stream:existing' ? '{"keep":true}' : null };
  assert.deepEqual(ctx.store.get('existing'), { keep: true });
  host.close(); assert.equal(host.current, null); assert.equal(layer.hidden, true);
  assert.ok(log.indexOf('unmount') < log.indexOf('onClose:stream'));
  assert.ok(log.indexOf('onClose:stream') < log.indexOf('listener:stream'));
  off(); await host.open({ id: 'stream', mount() {} }); host.close();
  assert.equal(log.filter(x => x === 'listener:stream').length, 1);
});

test('開く途中で閉じたゲームも、読み込み終了後に必ず片づける', async () => {
  const { host } = setup(); let resolve, cleaned = 0, closed = 0;
  host.onClose(() => closed++);
  const mounting = host.open({ id: 'eigonou', mount: () => new Promise(r => { resolve = r; }) });
  host.close(); resolve({ unmount: () => cleaned++ }); await mounting;
  assert.equal(host.current, null); assert.equal(cleaned, 1); assert.equal(closed, 1);
});

test('権限不足・読み込み失敗を成功として返さない', async () => {
  const { host, core } = setup(); core.rights.has = () => false;
  assert.equal(await host.open({ id: 'x', right: 'x', mount() { throw new Error('must not mount'); } }), false);
  assert.equal(host.current, null);
});
