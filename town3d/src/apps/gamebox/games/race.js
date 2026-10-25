// チャンクレース(上から見たカート)。◀▶で曲がる(アクセルは自動)。アイテムで逆転
import { surface, pointers, loop, txt, banner, rr, clamp, btn, hit, COL, CPUS, INK } from '../kit.js';

const TRACK = [[0.22, 0.1], [0.62, 0.08], [0.86, 0.16], [0.86, 0.34], [0.58, 0.44], [0.6, 0.54], [0.86, 0.62], [0.88, 0.84], [0.62, 0.93], [0.3, 0.92], [0.12, 0.8], [0.18, 0.62], [0.36, 0.5], [0.14, 0.38], [0.1, 0.2]];
const ITEMS = { boost: '⚡', banana: '🍌', star: '⭐' };

export default {
  id: 'race', title: 'チャンクレース', icon: '🏎️', desc: '◀▶で曲がってアイテムで逆転', rule: 'アクセルは自動。◀▶で曲がって、?の箱でアイテム(⚡ターボ・🍌バナナ・⭐むてき)。先にゴールした方の勝ち。',
  options: [{ key: 'laps', label: '何周', choices: [[2, '2周'], [3, '3周']], def: 3 }],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, sfx = host.sfx;
    const LAPS = host.opts.trial ? 1 : host.opts.laps || 3;
    let W, H, AX, AY, AW, AH, TW, pts = [], segLen = [];
    function layout() {
      S.resize(); W = S.W; H = S.H;
      const padT = two ? 96 : 40, padB = 96; AX = 10; AY = padT; AW = W - 20; AH = H - padT - padB;
      TW = Math.min(AW, AH) * 0.14;
      // なめらかなコース(Catmull-Rom)
      const P = TRACK.map(([x, y]) => [AX + x * AW, AY + y * AH]); pts = [];
      for (let i = 0; i < P.length; i++) {
        const p0 = P[(i - 1 + P.length) % P.length], p1 = P[i], p2 = P[(i + 1) % P.length], p3 = P[(i + 2) % P.length];
        for (let k = 0; k < 24; k++) { const t = k / 24, t2 = t * t, t3 = t2 * t; pts.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
      }
    }
    layout();
    const N = () => pts.length;
    const dirAt = i => { const a = pts[i % N()], b = pts[(i + 1) % N()]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
    // カート:0=自分 1=相手(2人 or えらんだCPU) 2,3=ほかのCPU
    const opp = host.players[1].cpu;
    const fill = CPUS.filter(c => !opp || c.id !== opp.id).slice(0, 2);
    const racers = [
      { name: host.players[0].name, col: COL.p1, icon: '🙂', human: 0 },
      { name: host.players[1].name, col: COL.p2, icon: host.players[1].icon || '😎', human: two ? 1 : -1, lv: opp ? opp.lv : 2 },
      { name: fill[0].name, col: '#8fe0b0', icon: fill[0].icon, human: -1, lv: Math.max(1, fill[0].lv - 1) },
      { name: fill[1].name, col: '#ffd36b', icon: fill[1].icon, human: -1, lv: Math.max(1, fill[1].lv - 1) },
    ];
    const lanes = [-0.28, 0.28, -0.1, 0.1];
    racers.forEach((r, i) => {
      const s = N() - 6 - Math.floor(i / 2) * 7, a = dirAt(s), p = pts[s];
      Object.assign(r, { x: p[0] - Math.sin(a) * lanes[i] * TW * 1.6, y: p[1] + Math.cos(a) * lanes[i] * TW * 1.6, ang: a, v: 0, idx: s, lap: 0, half: false, item: null, boost: 0, star: 0, spin: 0, done: 0, place: 0, steer: 0, aiT: 0, noise: 0 });
    });
    const boxes = []; [0.18, 0.48, 0.78].forEach(f => { const i = Math.floor(f * N()), a = dirAt(i); [-0.3, 0, 0.3].forEach(o => boxes.push({ i, x: pts[i][0] - Math.sin(a) * o * TW, y: pts[i][1] + Math.cos(a) * o * TW, t: 0 })); });
    const bananas = []; let count = 3.4, t = 0, finishOrder = [], over = false, msgs = [];
    // ボタン
    const B = () => {
      const bw = Math.min(110, W * 0.3), bh = 74, y0 = H - bh - 12;
      const b = { l0: { x: 10, y: y0, w: bw, h: bh, label: '◀' }, r0: { x: W - bw - 10, y: y0, w: bw, h: bh, label: '▶' }, i0: { x: W / 2 - 42, y: y0 + 6, w: 84, h: bh - 12, label: '' } };
      if (two) Object.assign(b, { l1: { x: W - bw - 10, y: 12, w: bw, h: bh, label: '◀' }, r1: { x: 10, y: 12, w: bw, h: bh, label: '▶' }, i1: { x: W / 2 - 42, y: 18, w: 84, h: bh - 12, label: '' } });
      return b;
    };
    const held = new Map();
    const press = p => { const b = B(); for (const k in b) if (hit(b[k], p)) { held.set(p.id, k); if (k[0] === 'i') useItem(+k[1]); return; } };
    const pt = pointers(S.cv, { onDown: press, onMove: p => { if (held.has(p.id)) { const b = B(), k = held.get(p.id); if (!hit(b[k], p)) { held.delete(p.id); press(p); } } }, onUp: p => held.delete(p.id) });
    const steerOf = h => { let s = 0; for (const k of held.values()) { if (k === 'l' + h) s -= 1; if (k === 'r' + h) s += 1; } return s; };
    function useItem(h) {
      const r = racers[h]; if (!r || !r.item || count > 0 || r.done) return;
      const it = r.item; r.item = null; sfx.play('item');
      if (it === 'boost') r.boost = 1.6; else if (it === 'star') r.star = 3; else bananas.push({ x: r.x - Math.cos(r.ang) * TW * 0.6, y: r.y - Math.sin(r.ang) * TW * 0.6, t: 25 });
    }
    function nearest(r) { let best = r.idx, bd = 1e9; for (let k = -10; k <= 25; k++) { const i = (r.idx + k + N()) % N(), d = Math.hypot(pts[i][0] - r.x, pts[i][1] - r.y); if (d < bd) { bd = d; best = i; } } return [best, bd]; }
    const VMAX = () => Math.min(AW, AH) * 0.62;
    const stop = loop(dt => {
      t += dt;
      if (count > -1) { const c0 = Math.ceil(count), was = count; count -= dt; if (Math.ceil(count) !== c0 && count > 0) sfx.play('count'); if (was > 0 && count <= 0) sfx.play('go'); }
      if (count <= 0 && !over) racers.forEach((r, i) => step(r, i, dt));
      // カートどうし
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) { const A = racers[a], Bk = racers[b], dx = Bk.x - A.x, dy = Bk.y - A.y, d = Math.hypot(dx, dy), m = TW * 0.42; if (d < m && d > 0) { const k = (m - d) / 2 / d; A.x -= dx * k; A.y -= dy * k; Bk.x += dx * k; Bk.y += dy * k; } }
      boxes.forEach(b => { if (b.t > 0) b.t -= dt; });
      draw(dt);
    });
    function step(r, i, dt) {
      if (r.done) { r.v *= 0.97; r.x += Math.cos(r.ang) * r.v * dt; r.y += Math.sin(r.ang) * r.v * dt; return; }
      let steer;
      if (r.human >= 0) steer = steerOf(r.human);
      else {   // CPU:少し先のコースへ向かう
        r.aiT -= dt; if (r.aiT <= 0) { r.aiT = 0.6 + Math.random(); r.noise = (Math.random() - 0.5) * [0, 0.5, 0.3, 0.12][r.lv]; }
        const tgt = pts[(r.idx + 9) % N()], want = Math.atan2(tgt[1] - r.y, tgt[0] - r.x); let d = want - r.ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        steer = clamp((d + r.noise) * 3, -1, 1);
        if (r.item && Math.random() < dt * 0.5) useItem(i);
      }
      r.steer += (steer - r.steer) * Math.min(1, dt * 10);
      const [ni, nd] = nearest(r), off = nd > TW * 0.55;
      let vmax = VMAX() * (r.human >= 0 ? 1 : [0, 0.86, 0.93, 0.99][r.lv]) * (off ? 0.45 : 1) * (r.boost > 0 ? 1.6 : 1) * (r.star > 0 ? 1.3 : 1);
      if (r.spin > 0) { r.spin -= dt; r.ang += dt * 12; vmax *= 0.25; }
      r.boost = Math.max(0, r.boost - dt); r.star = Math.max(0, r.star - dt);
      r.v += (vmax - r.v) * Math.min(1, dt * (r.v < vmax ? 1.6 : 4));
      r.ang += r.steer * dt * 3.1 * Math.min(1, r.v / (VMAX() * 0.4));
      r.x += Math.cos(r.ang) * r.v * dt; r.y += Math.sin(r.ang) * r.v * dt;
      r.x = clamp(r.x, 4, W - 4); r.y = clamp(r.y, AY - 10, AY + AH + 10);
      // 周回
      if (ni > N() * 0.45 && ni < N() * 0.6) r.half = true;
      if (r.idx > N() * 0.9 && ni < N() * 0.1 && r.half) { r.lap++; r.half = false; if (r.human >= 0 && r.lap < LAPS) { msgs.push({ h: r.human, t: 1.2, s: r.lap === LAPS - 1 ? 'ファイナルラップ!' : `${r.lap + 1}周目` }); sfx.play('point'); } if (r.lap >= LAPS) finish(r, i); }
      r.idx = ni;
      // アイテム箱・バナナ
      for (const b of boxes) if (b.t <= 0 && Math.hypot(b.x - r.x, b.y - r.y) < TW * 0.35) { b.t = 4; if (!r.item) { const k = Object.keys(ITEMS); r.item = k[Math.floor(Math.random() * k.length)]; if (r.human >= 0) sfx.play('pick'); } }
      for (let k = bananas.length - 1; k >= 0; k--) { const b = bananas[k]; if (Math.hypot(b.x - r.x, b.y - r.y) < TW * 0.3) { bananas.splice(k, 1); if (r.star <= 0) { r.spin = 0.9; if (r.human >= 0) sfx.play('ng'); } } }
    }
    function finish(r, i) {
      r.done = 1; finishOrder.push(i); r.place = finishOrder.length; if (r.human >= 0 || i <= 1) sfx.play(r.place === 1 ? 'win' : 'point');
      const main = [0, 1].every(k => racers[k].done);
      if (main && !over) { over = true; const w = racers[0].place < racers[1].place ? 0 : 1; setTimeout(() => host.end({ winner: w, text: finishOrder.map((k, n) => `${n + 1}位 ${racers[k].name}`).join('　') }), 1500); }
    }
    function placeOf(i) { const prog = r => (r.done ? 1e6 - r.place * 1000 : r.lap * N() + r.idx); const sorted = racers.map((r, k) => k).sort((a, b) => prog(racers[b]) - prog(racers[a])); return sorted.indexOf(i) + 1; }
    function draw(dt) {
      S.begin();
      g.fillStyle = '#9bd88e'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8bcd7e'; for (let y = 0; y < H; y += 28) for (let x = (y / 28 % 2) * 14; x < W; x += 28) g.fillRect(x, y, 14, 14);
      // コース
      const path = () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
      g.lineJoin = 'round'; g.lineCap = 'round';
      path(); g.strokeStyle = '#fff'; g.lineWidth = TW + 10; g.stroke();
      path(); g.strokeStyle = '#ff7aa2'; g.lineWidth = TW + 10; g.setLineDash([14, 14]); g.stroke(); g.setLineDash([]);
      path(); g.strokeStyle = '#8f8aa3'; g.lineWidth = TW; g.stroke();
      path(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 2; g.setLineDash([10, 12]); g.stroke(); g.setLineDash([]);
      // スタート
      { const p = pts[0], a = dirAt(0); g.save(); g.translate(p[0], p[1]); g.rotate(a); for (let k = -4; k < 4; k++) for (let j = 0; j < 2; j++) { g.fillStyle = (k + j) % 2 ? '#fff' : '#2b2140'; g.fillRect(j * 6 - 6, k * TW / 8, 6, TW / 8); } g.restore(); }
      boxes.forEach(b => { if (b.t > 0) return; g.save(); g.translate(b.x, b.y); g.rotate(t * 1.5); const s = TW * 0.22; g.fillStyle = `hsl(${(t * 120) % 360},90%,70%)`; rr(g, -s, -s, s * 2, s * 2, 4); g.fill(); g.restore(); txt(g, '?', b.x, b.y + 1, { size: TW * 0.28, color: '#fff', stroke: INK, sw: 3 }); });
      bananas.forEach(b => txt(g, '🍌', b.x, b.y, { size: TW * 0.36 }));
      // カート
      racers.forEach((r, i) => {
        g.save(); g.translate(r.x, r.y); g.rotate(r.ang);
        const L = TW * 0.42, Wd = TW * 0.26;
        if (r.star > 0) { g.shadowColor = '#ffd36b'; g.shadowBlur = 16; }
        if (r.boost > 0) { g.fillStyle = 'rgba(255,170,60,0.8)'; g.beginPath(); g.moveTo(-L * 0.5, -Wd * 0.3); g.lineTo(-L * (0.9 + Math.random() * 0.4), 0); g.lineTo(-L * 0.5, Wd * 0.3); g.fill(); }
        g.fillStyle = '#2b2140'; [[-0.32, -0.55], [0.3, -0.55], [-0.32, 0.55], [0.3, 0.55]].forEach(([a, b]) => g.fillRect(a * L - 4, b * Wd - 3, 8, 6));
        g.fillStyle = r.col; rr(g, -L / 2, -Wd / 2, L, Wd, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5; g.stroke();
        g.restore();
        txt(g, r.icon, r.x, r.y - 1, { size: TW * 0.22 });
        if (i <= 1) txt(g, i === 0 ? 'P1' : two ? 'P2' : 'VS', r.x, r.y - TW * 0.38, { size: 10, color: '#fff', stroke: i === 0 ? COL.p1d : COL.p2d, sw: 3, flip: i === 1 && two });
      });
      // ボタン・情報
      const b = B();
      [[0, b.l0, b.r0, b.i0], ...(two ? [[1, b.l1, b.r1, b.i1]] : [])].forEach(([h, l, rr2, it]) => {
        const flip = h === 1, r = racers[h], c = h === 0 ? COL.p1 : COL.p2;
        btn(g, { ...l, label: flip ? '▶' : '◀' }, { fill: steerOf(h) < 0 ? c : 'rgba(255,255,255,0.85)', size: 30, flip });
        btn(g, { ...rr2, label: flip ? '◀' : '▶' }, { fill: steerOf(h) > 0 ? c : 'rgba(255,255,255,0.85)', size: 30, flip });
        btn(g, { ...it, label: r.item ? ITEMS[r.item] : '—' }, { fill: r.item ? '#ffe58a' : 'rgba(255,255,255,0.6)', size: 28, flip });
        const info = r.done ? `ゴール! ${r.place}位` : `${Math.min(LAPS, r.lap + 1)}/${LAPS}周 ・ ${placeOf(h)}位`;
        txt(g, info, W / 2, flip ? 96 + 14 : H - 96 - 12, { size: 13, color: '#fff', stroke: INK, sw: 4, flip });
      });
      if (!two) { const r = racers[1]; txt(g, `${r.icon} ${r.name}:${r.done ? r.place + '位でゴール' : placeOf(1) + '位'}`, W / 2, 22, { size: 13, color: '#fff', stroke: INK, sw: 4 }); }
      for (let k = msgs.length - 1; k >= 0; k--) { const m = msgs[k]; m.t -= dt; if (m.t <= 0) { msgs.splice(k, 1); continue; } txt(g, m.s, W / 2, m.h === 0 ? H * 0.72 : H * 0.28, { size: 24, color: '#fff', stroke: INK, sw: 5, flip: m.h === 1 }); }
      if (count > 0) banner(g, S, two, count > 0.3 ? String(Math.ceil(count)) : 'GO!', { size: 60 });
      else if (count > -0.6) banner(g, S, two, 'GO!', { size: 60 });
    }
    const ro = new ResizeObserver(() => layout()); ro.observe(host.box);
    return { stop() { stop(); pt.off(); ro.disconnect(); S.cv.remove(); } };
  },
};
