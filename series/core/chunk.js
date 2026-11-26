/* チャンクの文の形と、役割の名前・範囲問題の採点（全アプリ共通）。もとはチャンクチャンクの core.js / study.js。
 文の書き方（1文）：  役割:英語=訳{小分けの訳/小分けの訳}#かんたんな説明|文法の説明 | 役割:英語=訳 | …
   役割＝ S 主語 V 動詞 O 目的語 I 間接目的語 C 補語 P 場所 T 時 M 様子・手段 R 理由 F 条件
   英語の中の「 / 」で小分け（名詞＋説明、熟語＋動詞）。先頭に「@b 」「@g 」「@o 」で主語のキャラ */
export const RN = { S: ['誰が・何が', '主語'], V: ['する', '動詞'], O: ['何を・誰を', '目的語'], I: ['誰に', '間接目的語'], C: ['どうだ', '補語'], P: ['どこで', '場所'], T: ['いつ', '時'], M: ['どうやって', '様子・手段'], R: ['なぜ', '理由'], F: ['もし', '条件'], X: ['説明', '修飾語句'] };
export function parseSentence(str, ja) {
  const units = [], words = [], unitOf = []; let who = null;
  if (str[0] === '@') { who = str[1]; str = str.slice(3); }
  str.split(' | ').forEach(us => {
    const role = us[0]; let rest = us.slice(2), note = null;
    const hi = rest.indexOf('#'); if (hi >= 0) { note = rest.slice(hi + 1).split('|'); rest = rest.slice(0, hi); }
    const ei = rest.indexOf('='); const en = ei >= 0 ? rest.slice(0, ei) : rest; let jp = ei >= 0 ? rest.slice(ei + 1) : '', subJp = null;
    const m = jp.match(/^(.*)\{(.*)\}$/); if (m) { jp = m[1]; subJp = m[2].split('/'); }
    const u = { role, jp, note, s: words.length, subs: null };
    const parts = en.split(' / '); if (parts.length > 1) u.subs = [];
    parts.forEach((p, pi) => { const s = words.length; p.split(' ').forEach(w => { words.push(w); unitOf.push(units.length); }); if (u.subs) u.subs.push({ s, e: words.length - 1, jp: subJp ? subJp[pi] || '' : '' }); });
    u.e = words.length - 1; u.text = words.slice(u.s, u.e + 1).join(' '); units.push(u);
  });
  return { units, words, unitOf, ja, en: words.join(' '), who };
}
export function wordRole(sen, i) { const u = sen.units[sen.unitOf[i]]; if (u.subs && u.role !== 'V') { const pi = u.subs.findIndex(p => i >= p.s && i <= p.e); if (pi > 0) return 'X'; } return u.role; }

/* 範囲の問題の採点：o＝想定どおり（別解も）、t＝中心は合っていて説明が足りない／同じ役割の分だけ長い、x＝それ以外 */
// 答えの端のつなぎの語(such as / that / which / who / including)は、あってもなくても同じ答えとして見る
const LEADW = new Set(['that', 'which', 'who', 'including']);
const nw = w => String(w || '').toLowerCase().replace(/[^a-z']/g, '');
function trimEdge(sen, r) {
  let { a, b } = r;
  for (;;) {
    const w = nw(sen.words[a]), w2 = nw(sen.words[a + 1]);
    if (a + 2 <= b && w === 'such' && w2 === 'as') a += 2; else if (a + 1 <= b && LEADW.has(w)) a += 1; else break;
  }
  return { a, b };
}
export function gradeRange(sen, q0, ans0) {
  const si = q0.si, eq = (x, y) => x && y && x.si === y.si && x.a === y.a && x.b === y.b, W = (a, b) => sen.words.slice(a, b + 1).join(' ');
  if (!ans0) return { mark: 'x', why: '未回答' };
  if (eq(ans0, q0) || (q0.alts || []).some(x => x.a >= 0 && eq(ans0, x))) return { mark: 'o', why: '' };
  if ((q0.partials || []).some(x => eq(ans0, x))) return { mark: 't', why: '部分点' };
  if (ans0.si !== si) return { mark: 'x', why: '別の文を選んでいる' };
  const q = { ...q0, ...trimEdge(sen, q0) }, ans = { si, ...trimEdge(sen, ans0) };   // 端のつなぎの語をはずして くらべる
  if (eq(ans, q) || (q0.alts || []).some(x => x.a >= 0 && eq(ans, { si, ...trimEdge(sen, x) }))) return { mark: 'o', why: '' };
  if (ans.b < q.a || ans.a > q.b) return { mark: 'x', why: '答えと重なっていない' };
  const unitRole = i => sen.units[sen.unitOf[i]].role;
  if (ans.a >= q.a && ans.b <= q.b) {
    const u = sen.units[sen.unitOf[q.a]], part = u.subs ? u.subs.find(p => q.a >= p.s && q.a <= p.e) : u;
    const head = { a: Math.max(q.a, part.s), b: Math.min(q.b, part.e) };
    const miss = []; for (let i = q.a; i <= q.b; i++) if (i < ans.a || i > ans.b) miss.push(i);
    if (ans.a <= head.a && ans.b >= head.b) return { mark: 't', why: `短い（足りない：${miss.map(i => sen.words[i]).join(' ')}）` };
    // ならべた例(コンマで区切られた1つ以上)は、そのうちの一部でも「例として正しい」
    const brk = i => /[,;.]$/.test(sen.words[i]);
    if ((ans.a === q.a || brk(ans.a - 1)) && (ans.b === q.b || brk(ans.b)) && /,/.test(W(q.a, q.b).replace(/,$/, ''))) return { mark: 't', why: `例の一部（ほかの例：${miss.map(i => sen.words[i]).join(' ')}）` };
    return { mark: 'x', why: '答えの中心が入っていない' };
  }
  if (ans.a <= q.a && ans.b >= q.b) {
    const roles = new Set(); for (let i = q.a; i <= q.b; i++) roles.add(unitRole(i));
    const extra = []; for (let i = ans.a; i <= ans.b; i++) if (i < q.a || i > q.b) extra.push(i);
    // 別の節(主語・動詞)までのびていたら×。2語までの余分、または後ろにくっつく説明(6語まで)なら△
    const xr = extra.map(unitRole), cutL = ans.a < q.a && ans.a !== sen.units[sen.unitOf[ans.a]].s, cutR = ans.b > q.b && ans.b !== sen.units[sen.unitOf[ans.b]].e, tolerant = !cutL && !cutR && q.a - ans.a <= 2 && !xr.some(r => (r === 'S' || r === 'V') && !roles.has(r)) && (extra.length <= 2 || (xr.every(r => 'IMPOC'.includes(r)) && extra.length <= 6)), old = extra.filter(i => !roles.has(unitRole(i))), bad = tolerant || !old.length ? [] : old;
    if (!bad.length) return { mark: 't', why: `長い（余分：${extra.map(i => sen.words[i]).join(' ')}）` };
    const br = [...new Set(bad.map(unitRole))].map(r => RN[r][1]).join('・');
    return { mark: 'x', why: `長い（余分：${W(bad[0], bad[bad.length - 1])} ＝${br}）` };
  }
  return { mark: 'x', why: '範囲がずれている' };
}
