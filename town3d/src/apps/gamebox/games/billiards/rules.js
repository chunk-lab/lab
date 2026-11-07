// ルール判定(9ボール / 8ボール)。CPUの先読みでも使う
export const grp = n => n >= 1 && n <= 7 ? 'solid' : n >= 9 ? 'stripe' : null;
export const GNAME = { solid: 'ソリッド(1〜7)', stripe: 'ストライプ(9〜15)' };
export const lowest = balls => { let m = 99; for (const b of balls) if (b.on && b.n > 0 && b.n < m) m = b.n; return m === 99 ? null : m; };
export const cleared = (balls, g) => !!g && !balls.some(b => b.on && grp(b.n) === g);
// 最初に当てていい球
export function legalFirst(kind, balls, g) {
  if (kind === 9) { const l = lowest(balls); return l ? [l] : []; }
  if (!g) return balls.filter(b => b.on && b.n > 0 && b.n !== 8).map(b => b.n);
  if (cleared(balls, g)) return [8];
  return balls.filter(b => b.on && grp(b.n) === g).map(b => b.n);
}
// ショットの判定。s = { kind, ev, shooter, groups, breakShot, low(9:打つ前の一番小さい球), clr(8:打つ前に自分の組が全部落ちていたか) }
// → { foul, why, pots, scratch, cont, win(打った人の勝ち true / 負け false / null), assign, respot:[n] }
export function judge(s) {
  const ev = s.ev, pots = ev.filter(e => e.t === 'pot').map(e => e.n), obj = pots.filter(n => n !== 0), scratch = pots.includes(0);
  const fi = ev.findIndex(e => e.t === 'hit' && (e.a === 0 || e.b === 0)), first = fi < 0 ? null : (ev[fi].a === 0 ? ev[fi].b : ev[fi].a);
  const railAfter = fi >= 0 && ev.slice(fi).some(e => e.t === 'rail');
  const r = { foul: false, why: '', pots, obj, scratch, first, cont: false, win: null, assign: null, respot: [] };
  const F = why => { if (!r.foul) { r.foul = true; r.why = why; } };
  if (scratch) F('手球がポケットに落ちた');
  if (first == null) F('どの球にも当たらなかった');
  if (s.kind === 9) {
    if (first != null && first !== s.low) F(`最初に${s.low}番に当てなかった`);
    if (!s.breakShot && first != null && !railAfter && !obj.length) F('当てたあと、どの球もクッションに届かなかった');
    if (obj.includes(9)) { if (r.foul) r.respot.push(9); else r.win = true; }
    r.cont = !r.foul && obj.length > 0;
    return r;
  }
  // 8ボール
  const g = s.groups[s.shooter];
  if (!s.breakShot && first != null) {
    if (!g) { if (first === 8) F('8番に先に当てた'); }
    else if (s.clr) { if (first !== 8) F('8番に先に当てなかった'); }
    else if (grp(first) !== g) F('自分の組の球に先に当てなかった');
  }
  if (!s.breakShot && first != null && !railAfter && !obj.length) F('当てたあと、どの球もクッションに届かなかった');
  if (obj.includes(8)) {
    if (s.breakShot) r.respot.push(8);
    else { r.win = !r.foul && s.clr; return r; }
  }
  let gg = g;
  if (!s.breakShot && !g && !r.foul) { const f = obj.find(n => n !== 8); if (f) { r.assign = grp(f); gg = r.assign; } }
  r.cont = !r.foul && (s.breakShot ? obj.some(n => n !== 8) : !!gg && obj.some(n => grp(n) === gg));
  return r;
}
