// 単語ごとの学習の記録(どのアプリで答えても1か所に集める)。
//   チャンクタウンに組み込まれているときは、組み込み先の共通の記録(ctx.learn)を使う → ストリームで答えた分もここに入る
//   単体で動かすときだけ、町の中に保存する(同じ形)
//   1語 = { c:続けて正解した数, ok:正解の合計, ng:まちがいの合計, t:最後に答えた時刻, ja }
import { createStorage } from '../../core/core.js';
const key = en => String(en || '').trim().toLowerCase();
export function localLearn() {
  const st = createStorage('town:learn:');
  let R = st.get('w') || {}, tm = 0;
  const save = () => { clearTimeout(tm); tm = setTimeout(() => st.set('w', R), 300); };
  return {
    hit(en, ok, o = {}) { const k = key(en); if (!k) return null; const r = R[k] || (R[k] = { c: 0, ok: 0, ng: 0, t: 0 }); if (ok) { r.c++; r.ok++; } else { r.c = 0; r.ng++; } r.t = Date.now(); if (o.ja) r.ja = o.ja; save(); return { ...r }; },
    get(en) { const r = R[key(en)]; return r ? { ...r } : null; },
    weak(n = 30) { return Object.entries(R).filter(([, r]) => r.ja && r.ng > 0 && r.c < 3).sort((a, b) => b[1].t - a[1].t).slice(0, n).map(([en, r]) => ({ en, ja: r.ja })); },
  };
}
