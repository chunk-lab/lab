// CPUのショット選び。ねらえる「球 × ポケット」を形で選んで、物理で先読みして、いちばん良いものを打つ。
//   強さ(lv 1〜3)で、ねらいのずれ・力のずれ・先読みの数が変わる
import * as P from './phys.js';
import { judge, legalFirst, cleared, lowest } from './rules.js';

const R = P.R;
const clearPath = (balls, x0, z0, x1, z1, skip) => {   // x0,z0 → x1,z1 の間に球がないか(幅 2R)
  const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz || 1e-9;
  return balls.every(b => {
    if (!b.on || skip.includes(b.n)) return true;
    let t = ((b.x - x0) * dx + (b.z - z0) * dz) / l2; if (t <= 0 || t >= 1) return Math.hypot(b.x - x1, b.z - z1) >= 2 * R || t <= 0;
    return Math.hypot(b.x - (x0 + dx * t), b.z - (z0 + dz * t)) >= 2 * R * 0.98;
  });
};
// 手球 c から、ねらえるショットの一覧(形だけで点をつける)
export function shotsFrom(balls, cx, cz, targets, maxCut = 1.35) {
  const out = [];
  for (const n of targets) {
    const t = balls.find(b => b.n === n && b.on); if (!t) continue;
    P.POCKETS.forEach((p, k) => {
      const ux0 = p.aimx - t.x, uz0 = p.aimz - t.z, ul = Math.hypot(ux0, uz0), ux = ux0 / ul, uz = uz0 / ul;
      if (!p.corner && Math.abs(ux) < 0.35) return;   // サイドポケットには浅い角度では入らない
      const gx = t.x - ux * 2 * R, gz = t.z - uz * 2 * R, ax = gx - cx, az = gz - cz, al = Math.hypot(ax, az); if (al < 1e-4) return;
      const cut = Math.acos(Math.max(-1, Math.min(1, (ax * ux + az * uz) / al))); if (cut > maxCut) return;
      if (!clearPath(balls, cx, cz, gx, gz, [0, n]) || !clearPath(balls, t.x, t.z, p.aimx, p.aimz, [n, 0])) return;
      out.push({ n, k, ang: Math.atan2(ax, az), cut, d1: al, d2: ul, score: Math.cos(cut) * 2 - al * 0.35 - ul * 0.45 });
    });
  }
  return out.sort((a, b) => b.score - a.score);
}
export const easyCount = (balls, cx, cz, targets) => Math.min(3, shotsFrom(balls, cx, cz, targets, 0.8).length);

function evalShot(st, ang, v, a, b) {
  const balls = P.clone(st.balls), c = balls[0];
  P.strike(c, ang, v, a, b);
  const ev = P.simulate(balls, 12), g = st.groups[st.shooter];
  const j = judge({ kind: st.kind, ev, shooter: st.shooter, groups: st.groups, breakShot: st.breakShot, low: lowest(st.balls), clr: cleared(st.balls, g) });
  if (j.win === true) return 1000;
  if (j.win === false) return -1000;
  if (j.foul) return -120;
  const gg = j.assign || g, next = legalFirst(st.kind, balls, gg);
  if (j.cont) return 80 + easyCount(balls, c.x, c.z, next) * 18 + (st.kind === 9 && j.obj.includes(9) ? 500 : 0);
  // 入らなかった:相手にやさしい形を残さない方がよい
  const og = st.groups[1 - st.shooter] || (j.assign ? (j.assign === 'solid' ? 'stripe' : 'solid') : null);
  return -15 - easyCount(balls, c.x, c.z, legalFirst(st.kind, balls, og)) * 10;
}

// st = { balls, kind, shooter, groups, breakShot, inHand, kitchen, lv } → { place?, ang, v, a, b }
export function plan(st) {
  const lv = st.lv || 2, balls = st.balls, c = balls[0], targets = legalFirst(st.kind, balls, st.groups[st.shooter]);
  const res = { place: null, ang: 0, v: 2, a: 0, b: 0 };
  if (st.breakShot) {
    if (st.inHand) res.place = { x: (Math.random() - 0.5) * 0.3, z: P.HEAD_Z - 0.06 };
    const cx = res.place ? res.place.x : c.x, cz = res.place ? res.place.z : c.z, apex = balls.filter(b => b.on && b.n).sort((p, q) => p.z - q.z)[0];
    res.ang = Math.atan2(apex.x - cx, apex.z - cz) + (Math.random() - 0.5) * 0.004; res.v = 6.2 + lv * 0.35; res.b = -0.1; return res;
  }
  // ボールインハンド:まっすぐ近くからねらえる所に置く
  if (st.inHand) {
    let best = null;
    for (const n of targets) for (const p of P.POCKETS) {   // 置く場所は、球→ポケットの線の延長
      const t = balls.find(b => b.n === n && b.on); if (!t) continue;
      const ux = p.aimx - t.x, uz = p.aimz - t.z, ul = Math.hypot(ux, uz);
      if (!p.corner && Math.abs(ux / ul) < 0.35) continue;
      if (!clearPath(balls, t.x, t.z, p.aimx, p.aimz, [n, 0])) continue;
      for (const d of [0.2, 0.3, 0.14, 0.42]) {
        const x = t.x - ux / ul * (2 * R + d), z = t.z - uz / ul * (2 * R + d);
        if (st.kitchen && z > P.HEAD_Z) continue;
        if (!P.freeAt(balls, x, z, c)) continue;
        if (!clearPath(balls, x, z, t.x - ux / ul * 2 * R, t.z - uz / ul * 2 * R, [0, n])) continue;
        const sc = -ul * 0.5 - d; if (!best || sc > best.sc) best = { x, z, sc }; break;
      }
    }
    if (!best) { for (let i = 0; i < 60 && !best; i++) { const x = (Math.random() - 0.5) * (P.W - 4 * R), z = st.kitchen ? P.HEAD_Z - Math.random() * 0.5 : (Math.random() - 0.5) * (P.L - 4 * R); if (P.freeAt(balls, x, z, c)) best = { x, z }; } }
    if (best) { res.place = { x: best.x, z: best.z }; c.x = best.x; c.z = best.z; }
  }
  // 候補を先読みする
  const cand = shotsFrom(balls, c.x, c.z, targets).slice(0, [0, 3, 5, 7][lv]);
  const tries = [];
  cand.forEach(s => {
    const base = Math.max(0.9, Math.min(4.2, 0.7 + (s.d1 + s.d2) * 1.15 / Math.max(0.35, Math.cos(s.cut))));
    const vs = lv === 1 ? [base] : [base * 0.85, base * 1.2], spins = lv === 3 ? [0, 0.45, -0.5] : lv === 2 ? [0, -0.4] : [0];
    vs.forEach(v => spins.forEach(b => tries.push({ ang: s.ang, v, a: 0, b })));
  });
  // 入れられる形がないとき:当てていい球に、ふつうに当てる(厚み・強さをいくつか)
  if (!tries.length) targets.forEach(n => { const t = balls.find(b => b.n === n && b.on); if (!t) return; const a0 = Math.atan2(t.x - c.x, t.z - c.z), d = Math.hypot(t.x - c.x, t.z - c.z); [-0.6, -0.25, 0, 0.25, 0.6].forEach(o => [1.4, 2.4].forEach(v => tries.push({ ang: a0 + Math.asin(Math.max(-1, Math.min(1, o * 2 * R / d))), v, a: 0, b: 0 }))); });
  if (!tries.length) { res.ang = Math.random() * 6.28; res.v = 2; return res; }
  tries.forEach(t => { t.sc = evalShot(st, t.ang, t.v, t.a, t.b); });
  tries.sort((p, q) => q.sc - p.sc);
  const pick = lv === 1 ? tries[Math.floor(Math.random() * Math.min(3, tries.length))] : tries[0];
  const nA = [0, 0.02, 0.008, 0.0032][lv], nV = [0, 0.12, 0.06, 0.03][lv], gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 0.5;   // だいたい正規分布
  res.ang = pick.ang + gauss() * nA; res.v = pick.v * (1 + gauss() * nV); res.a = pick.a; res.b = pick.b;
  return res;
}
