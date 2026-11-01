import test from 'node:test';
import assert from 'node:assert/strict';
import { createEpisodeProgress } from '../apps/town/episodes/progress.js';
import { FIRST_EPISODE } from '../apps/town/episodes/first.js';

function memory(seed = {}) {
  const values = new Map(Object.entries(seed));
  return { values, get: k => structuredClone(values.get(k) ?? null), set: (k, v) => values.set(k, structuredClone(v)) };
}
function toGame(p) { while (p.step.type !== 'game') p.next(); }

test('単語の実際の終了だけで進む。他のゲーム・セット・途中終了は進まない', () => {
  const st = memory(), p = createEpisodeProgress(st, FIRST_EPISODE); toGame(p);
  assert.equal(p.next(), false);
  for (const [g, n, d] of [
    ['cards', 'done', { play: 'stream.word', set: 'w1-1', finished: true }],
    ['stream', 'done', { play: 'stream.word', set: 'w1-2', finished: true }],
    ['stream', 'done', { play: 'stream.word', set: 'w1-1', finished: false }],
  ]) assert.equal(p.accept(g, n, d), false);
  assert.equal(p.accept('stream', 'done', { play: 'stream.word', set: 'w1-1', finished: true }), true);
  assert.equal(p.next(), true);
  assert.equal(p.step.who, 'hana'); assert.match(p.step.text, /疲れた/);
});

test('再起動で進行とクリア済み判定を保つ。次へを押す前のクリアも失わない', () => {
  const st = memory(), p = createEpisodeProgress(st, FIRST_EPISODE); p.mode('2d'); toGame(p);
  p.accept('stream', 'done', { play: 'stream.word', set: 'w1-1', finished: true });
  const resumed = createEpisodeProgress(st, FIRST_EPISODE);
  assert.equal(resumed.state.mode, '2d'); assert.equal(resumed.state.passed, true);
  assert.equal(resumed.next(), true); assert.match(resumed.step.text, /疲れた/);
});

test('レッスンの別章や英語脳アプリを開いただけではクリアしない', () => {
  const episode = { id: 'test', steps: [FIRST_EPISODE.steps.find(x => x.game === 'chunkchunk'), FIRST_EPISODE.steps.find(x => x.game === 'eigonou'), { type: 'door' }] };
  const p = createEpisodeProgress(memory(), episode);
  assert.equal(p.accept('chunkchunk', 'story_clear', { chapter: 2 }), false);
  assert.equal(p.next(), false);
  p.accept('chunkchunk', 'story_clear', { chapter: 1 }); p.next();
  assert.equal(p.accept('eigonou', 'open', {}), false); assert.equal(p.next(), false);
  p.accept('eigonou', 'episode_practice', { exercise: 'want-to' }); p.next();
  assert.equal(p.complete(), true);
});

test('イベントは自分のキーだけを更新し、再読してもゲームのセーブに触らない', () => {
  const untouched = { db: { memo: ['existing'], settings: { level: 4 } }, wallet: 777, story: { cleared: { 7: true } }, profile: { look: 'ren' } };
  const st = memory(untouched), p = createEpisodeProgress(st, FIRST_EPISODE);
  p.next(); p.mode('2d'); p.restart();
  for (const [k, v] of Object.entries(untouched)) assert.deepEqual(st.values.get(k), v);
  assert.deepEqual([...st.values.keys()].sort(), [...Object.keys(untouched), 'first'].sort());
});
