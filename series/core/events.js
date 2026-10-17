/* できごとの記録：ゲームは「何をしたか」を report するだけ（例：report('clear', {stage:1, rank:'S'})）。
   コイン・課題・レベル・ステータスは、この記録をもとに共通のしくみが決める（中身はこれから相談して決める）。
   いまは回数と最初・最後の日だけ数えておく。 */
import { createStore } from './store.js';
export function createEvents() {
  const st = createStore('core');
  const stats = st.get('stats') || { first: null, last: null, count: {} };
  const subs = new Set();
  return {
    report(game, name, data = {}) {
      const now = new Date().toISOString().slice(0, 10), key = game + ':' + name;
      stats.first = stats.first || now; stats.last = now; stats.count[key] = (stats.count[key] || 0) + 1;
      st.set('stats', stats); subs.forEach(f => { try { f(game, name, data); } catch (e) { } });
    },
    stats: () => JSON.parse(JSON.stringify(stats)),
    on(f) { subs.add(f); return () => subs.delete(f); }
  };
}
