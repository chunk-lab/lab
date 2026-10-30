// 1ホールごとにもらえる英語の表現(句動詞・慣用句)。スポーツとは関係なく、ふだんの会話で使うものを毎日ちがうものにする。
//   pool=[{en, ja}]:組み込み先の辞書(熟語・句動詞 約4000)から。なければ下の小さな予備を使う。日付でえらぶ(その日は誰でも同じ)。
const SPARE = [
  ['get over', '乗り越える'], ['catch up', '追いつく'], ['pick up', '拾う・身につける'], ['work out', 'うまくいく・運動する'], ['give up', 'あきらめる'],
  ['look forward to', '楽しみにする'], ['run out of', '〜を使い果たす'], ['figure out', '理解する・解決する'], ['come up with', '思いつく'], ['put off', '延期する'],
  ['turn down', '断る'], ['take care of', '世話をする'], ['go through', '経験する・調べる'], ['make up for', '埋め合わせる'], ['deal with', '対処する'],
];
function rng(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function holeExpr(pool, key, i) {
  const L = (pool && pool.length >= 10 ? pool : SPARE.map(([en, ja]) => ({ en, ja }))).slice(), r = rng('expr:' + key);
  for (let k = L.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [L[k], L[j]] = [L[j], L[k]]; }
  const x = L[i % L.length]; return { en: x.en, ja: x.ja };
}
