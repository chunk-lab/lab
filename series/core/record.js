/* 学習の記録：アプリからの3種類の報告だけを受けて、日ごとにまとめる。
   - done   ：終わった    {play:'<plays.jsのid>', min:分, words:読んだ語数, score, missed:[{en,ja}], title}
   - word   ：言葉を登録  {kind, en, ja, src} → 勉強ノートへ
   - resume ：続きがある  {play, label, opts}（「つづきから」に使う）
   集計と表示は勉強部屋がやるので、単体版でも統合版でもアプリ側の作りは同じ。 */
import { createStore } from './store.js';
import { playOf } from './plays.js';
const day = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
export function createRecord(events, notebook) {
  const st = createStore('core'), subs = new Set();
  const R = Object.assign({ days: {}, last: null, goal: { min: 15 } }, st.get('record') || {});
  const save = () => { st.set('record', R); subs.forEach(f => { try { f(); } catch (e) { } }); };
  const today = () => (R.days[day()] = R.days[day()] || { min: {}, plays: {}, words: 0, done: 0 });
  events.on((game, name, d = {}) => {
    if (name === 'done') {
      const p = playOf(d.play) || { want: 'chill' }, t = today(), m = Math.max(0, Math.min(180, +d.min || 0));
      t.min[p.want] = Math.round(((t.min[p.want] || 0) + m) * 10) / 10;
      t.plays[d.play || game] = (t.plays[d.play || game] || 0) + 1;
      const bk = d.book || (d.passage && d.whole ? 'st:' + d.passage : null); if (bk && d.finished) { R.books = R.books || {}; R.books[bk] = (R.books[bk] || 0) + 1; } t.words += Math.max(0, +d.words || 0) | 0; t.done++;
      if (Array.isArray(d.missed) && d.missed.length) notebook.addMany(d.missed.slice(0, 50).map(x => ({ ...x, src: x.src || (p.n || game), marks: ['miss'] })));
      if (R.last && R.last.play === d.play && d.finished) R.last = null;
      save();
    } else if (name === 'word') {
      notebook.add({ ...d, src: d.src || game });
    } else if (name === 'resume') {
      R.last = { game, play: d.play || '', label: String(d.label || ''), opts: d.opts || {}, at: Date.now() }; save();
    }
  });
  const sumMin = t => Object.values((t && t.min) || {}).reduce((a, b) => a + b, 0);
  return {
    today: () => JSON.parse(JSON.stringify(today())),
    days(n = 7) { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = day(d); out.push({ day: k, ...(R.days[k] || { min: {}, plays: {}, words: 0, done: 0 }) }); } return out; },
    streak() { let n = 0; const d = new Date(); if (!sumMin(R.days[day(d)]) && !(R.days[day(d)] || {}).done) d.setDate(d.getDate() - 1); while ((R.days[day(d)] || {}).done) { n++; d.setDate(d.getDate() - 1); } return n; },
    sumMin,
    total: id => Object.values(R.days).reduce((a, d) => a + ((d.plays || {})[id] || 0), 0),   // これまでの回数
    bookDone: id => !!(R.books || {})[id],   // その本を最後まで読んだ(通しクリアした)ことがあるか
    last: () => R.last,
    clearLast() { R.last = null; save(); },
    goal: () => R.goal,
    setGoal(min) { R.goal.min = Math.max(5, Math.min(120, Math.round(+min) || 15)); save(); },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
  };
}
