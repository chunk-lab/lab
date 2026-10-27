/* 単語ごとの学習の記録：どのアプリで答えても、1語ずつ1か所に集める（勉強の記録はまとめる）。
   - ストリームの単語練習：終わったとき(done)に、出た単語(wl)とまちがえた単語(missed)から記録する
   - 3Dの町の「英語の釣り堀」：答えるたびに hit する（ctx.learn として渡す）
   1語 = { c:続けて正解した数, ok:正解の合計, ng:まちがいの合計, t:最後に答えた時刻, ja }
   いまは端末の中だけ。サーバーとつなぐときは、この中だけを直す。 */
import { createStore } from './store.js';
const key = en => String(en || '').trim().toLowerCase();
export function createLearn(events) {
  const st = createStore('core');
  let R = st.get('learn') || {}, tm = 0;
  const save = () => { clearTimeout(tm); tm = setTimeout(() => st.set('learn', R), 300); };
  const api = {
    hit(en, ok, o = {}) { const k = key(en); if (!k) return null; const r = R[k] || (R[k] = { c: 0, ok: 0, ng: 0, t: 0 }); if (ok) { r.c++; r.ok++; } else { r.c = 0; r.ng++; } r.t = Date.now(); if (o.ja) r.ja = o.ja; save(); return { ...r }; },
    get(en) { const r = R[key(en)]; return r ? { ...r } : null; },
    weak(n = 30) { return Object.entries(R).filter(([, r]) => r.ja && r.ng > 0 && r.c < 3).sort((a, b) => b[1].t - a[1].t).slice(0, n).map(([en, r]) => ({ en, ja: r.ja })); },
  };
  events.on((game, name, d) => {
    if (game !== 'stream' || name !== 'done' || !d || d.play !== 'stream.word' || !Array.isArray(d.wl)) return;
    const miss = new Map((d.missed || []).map(x => [key(x.en), x.ja]));
    d.wl.forEach(w => { const en = Array.isArray(w) ? w[0] : w, ja = Array.isArray(w) ? w[1] : ''; api.hit(en, !miss.has(key(en)), { ja: ja || miss.get(key(en)) }); });
  });
  return api;
}
