/* 共通の辞書（全アプリで1つ）。データは core/dict/data.js（tools/build_dict.py で作る）を、使うときに読み込む。
   const d = core.dict; await d.ready();
   d.lookup('went')        → { w:'go', pos:[['v','行く']], form:'went' }（変化形は元の形に戻して探す）
   d.lookup('lives', ['v']) → live（ほしい品詞の順を渡すと、それを持つ語を選ぶ）／ d.lookupAll('lives') → [life, live]
   d.phraseAt(words, i)    → 文の i 番目の単語をふくむ熟語・複合語（いちばん長いもの）{ ws, m, s, e }
   d.POSN                  → 品詞の名前 */
import { loadScript } from './host.js';
export const POSN = { v: '動詞', aux: '助動詞', n: '名詞', adj: '形容詞', adv: '副詞', prep: '前置詞', conj: '接続詞', pr: '代名詞', det: '限定詞', art: '冠詞', num: '数', int: '間投詞' };
export function createDict(base) {
  const D = new Map(), F = new Map(), PH = new Map();   // D＝見出し語、F＝変化形 → 元の語（lives → life・live のように複数あることも）
  let state = 0, wait = null;   // 0＝まだ 1＝読み込み中 2＝済み
  window.__csDictLoad = (rows, phr) => {
    rows.split('\n').forEach(l => {
      const [w, pos, forms] = l.split('\t'); if (!w || !pos) return;
      const e = { w, pos: pos.split(';').map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1).replace(/,/g, '、')]; }) };
      const k = w.toLowerCase(); if (!D.has(k)) D.set(k, e);
      (forms || '').split(',').filter(Boolean).forEach(f => { const fk = f.toLowerCase(); if (!F.has(fk)) F.set(fk, []); F.get(fk).push({ ...e, form: f }); });
    });
    phr.split('\n').forEach(l => {
      const [p, m] = l.split('\t'); if (!p || !m) return; const ws = p.split(' ');
      if (!PH.has(ws[0])) PH.set(ws[0], []); PH.get(ws[0]).push([ws, m]);
    });
  };
  const ready = () => {
    if (state === 2) return Promise.resolve();
    if (!wait) { state = 1; wait = loadScript(base + 'core/dict/data.js').then(() => { state = 2; }, e => { state = 0; wait = null; throw e; }); }
    return wait;
  };
  const norm = w => String(w).toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z0-9]+|[^a-z0-9']+$/g, '');
  /* その形になりうる語を全部（見出し語 → 変化形の表 → 語尾を外したもの の順） */
  function lookupAll(raw) {
    const w = norm(raw).replace(/'s$/, ''); if (!w) return [];
    const out = [], seen = new Set(), push = e => { if (e && !seen.has(e.w)) { seen.add(e.w); out.push(e); } };
    push(D.get(w)); (F.get(w) || []).forEach(push);
    if (/n't$/.test(w)) { const b = w === "can't" ? 'can' : w === "won't" ? 'will' : w.slice(0, -3), e = D.get(b); if (e) push({ ...e, form: raw, neg: true }); }
    const tries = [], add = b => tries.push(b);
    if (/ies$/.test(w)) add(w.slice(0, -3) + 'y'); if (/es$/.test(w)) add(w.slice(0, -2)); if (/s$/.test(w)) add(w.slice(0, -1));
    if (/ied$/.test(w)) add(w.slice(0, -3) + 'y'); if (/ed$/.test(w)) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1ed$/.test(w)) add(w.slice(0, -3)); }
    if (/ing$/.test(w)) { add(w.slice(0, -3)); add(w.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(w)) add(w.slice(0, -4)); }
    if (/er$/.test(w)) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1er$/.test(w)) add(w.slice(0, -3)); }
    if (/est$/.test(w)) { add(w.slice(0, -3)); add(w.slice(0, -2)); }
    if (/ly$/.test(w)) { add(w.slice(0, -2)); if (/ily$/.test(w)) add(w.slice(0, -3) + 'y'); }
    for (const b of tries) { const e = D.get(b); if (e) push({ ...e, form: raw }); }
    return out;
  }
  /* いちばんそれらしい1つ。prefer＝ほしい品詞の順（例 ['v','aux']）を渡すと、その品詞を持つ語を選ぶ */
  function lookup(raw, prefer) {
    const all = lookupAll(raw); if (!all.length) return null;
    if (!prefer || all.length === 1) return all[0];
    const rk = e => Math.min(...e.pos.map(p => { const i = prefer.indexOf(p[0]); return i < 0 ? 99 : i; }));
    return all.reduce((a, e) => rk(e) < rk(a) ? e : a);
  }
  function phraseAt(words, wi) {
    const lem = w => { const e = lookup(w); return e ? e.w.toLowerCase() : norm(w); };
    let best = null;
    for (let i = Math.max(0, wi - 3); i <= wi; i++) {
      [...new Set([norm(words[i]), lem(words[i])])].forEach(k => (PH.get(k) || []).forEach(([ws, m]) => {
        const end = i + ws.length - 1; if (end < wi || end >= words.length) return;
        for (let j = 1; j < ws.length; j++) { const w = words[i + j]; if (ws[j] !== norm(w) && ws[j] !== lem(w)) return; }
        if (!best || ws.length > best.ws.length) best = { ws, m, s: i, e: end };
      }));
    }
    return best;
  }
  // 熟語・句動詞のぜんぶ [{en, ja}]（日替わりの表現などに使う)。長すぎる・変なものは除く
  const PART = new Set('up out off in on over down away back through along around into with for about after ahead apart across by to from at of aside forward together'.split(' ')), VERB = new Set('be get take make put go come give keep let look run turn set bring call carry cut fall hold pull pick break hang hit play pass see tell say think find feel leave lose pay show stand stay work try use want need ask help start stop end move open close change check cover draw drive drop fill follow grow lay lie live mean meet miss pick point push reach read ride ring rule save send settle sit speak spend split step stick strike sweep throw touch walk wash watch wear win'.split(' '));
  const phrases = () => { const o = []; PH.forEach(a => a.forEach(([ws, m]) => { const en = ws.join(' '); if (ws.length >= 2 && ws.length <= 4 && /^[a-z' -]+$/i.test(en) && m.length <= 18 && (PART.has(ws[ws.length - 1]) || VERB.has(ws[0]) && ws.length >= 3 || VERB.has(ws[0]) && PART.has(ws[1]))) o.push({ en, ja: m.replace(/[;,]/g, '、') }); })); return o; };
  return { ready, phrases, lookup, lookupAll, phraseAt, POSN, get loaded() { return state === 2; }, get loading() { return state === 1; }, get size() { return D.size; } };
}
