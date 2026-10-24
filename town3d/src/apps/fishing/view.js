// 釣り場の絵。岸から池を見わたす(手前が大きく、奥が小さい)。
//   createView(canvas, cond, {mini}) → { resize(), draw(vs, dt) }
//   vs(見た目の状態) は app.js が、自分の釣り(エンジン)か、相手の記録(再生)から作ってわたす。
import { AREAS } from './data.js';
import { drawCreature } from './art.js';

const lerp = (a, b, k) => a + (b - a) * k;
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); };
const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
// 時刻ごとの色 [時, 空の上, 空の下, 水の奥, 水の手前, 光]
const PAL = [
  [0, '#101634', '#2b2f66', '#2a3566', '#0e1730', '#fff6d8'],
  [5, '#3a3f7a', '#e9a6a6', '#9b8fb0', '#2d4a6a', '#ffd2a8'],
  [7, '#8fbfee', '#ffd9b8', '#e8cfc4', '#3f7f9c', '#fff2d8'],
  [12, '#73b9f0', '#d8eeff', '#a9dbeb', '#3a87a7', '#ffffff'],
  [16, '#7fa8e0', '#ffe2b8', '#c6d6d8', '#3c7899', '#fff2cf'],
  [18, '#5b5aa8', '#ff9f73', '#f0aa86', '#46618c', '#ffd2a0'],
  [19.5, '#2a2c66', '#8a5c8e', '#5a5486', '#1d2c50', '#ffd8b0'],
  [24, '#101634', '#2b2f66', '#2a3566', '#0e1730', '#fff6d8'],
];
function palette(h) {
  for (let i = 0; i < PAL.length - 1; i++) { const a = PAL[i], b = PAL[i + 1]; if (h >= a[0] && h <= b[0]) { const k = (h - a[0]) / (b[0] - a[0]); return { skyT: mix(a[1], b[1], k), skyB: mix(a[2], b[2], k), wFar: mix(a[3], b[3], k), wNear: mix(a[4], b[4], k), light: mix(a[5], b[5], k), night: h < 5.5 || h > 19.2 ? 1 : h < 6.5 ? 6.5 - h : h > 18.2 ? h - 18.2 : 0 }; } }
  return palette(12);
}
const TREES = { spring: ['#f6b6cb', '#ffd0de', '#8ccf8c', '#a9dca0'], summer: ['#5aa866', '#79c27a', '#4f9a5c', '#8ccf86'], autumn: ['#e8803a', '#d9503a', '#f0b53c', '#c96a2e', '#9fbf6a'], winter: ['#eef3f5', '#d5e0e6', '#bfcfd8', '#e6eef2'] };

export function createView(canvas, cond, { mini = false } = {}) {
  const g = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, bg = null, t = 0;
  const P = palette(cond.hour), night = P.night;
  const parts = [], rings = [], weather = [];
  const R = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const HZ = () => H * (mini ? 0.3 : 0.27), SY = () => H * (mini ? 0.9 : 0.84);
  // 池の座標 → 画面
  function proj(x, d) {
    const z = 1 + d * 2.4, k = (1 / z - 1 / 3.4) / (1 - 1 / 3.4), s = 1 / z;
    const fy = HZ() + (SY() - HZ()) * 0.035;
    return { x: W / 2 + x * W * 0.78 * Math.pow(s, 0.75), y: fy + (SY() - fy) * k, s };
  }
  const tipPos = (side = 0, aim = 0) => ({ x: W * (mini ? 0.66 : 0.64) + aim * W * 0.06 + side * W * 0.08, y: H * (mini ? 0.7 : 0.6) });

  function buildBg() {
    bg = document.createElement('canvas'); bg.width = Math.round(W * dpr); bg.height = Math.round(H * dpr);
    const b = bg.getContext('2d'); b.scale(dpr, dpr);
    const hz = HZ(), sy = SY();
    // 空
    let gr = b.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, P.skyT); gr.addColorStop(1, P.skyB); b.fillStyle = gr; b.fillRect(0, 0, W, hz + 2);
    if (night > 0.5) { for (let i = 0; i < 70; i++) { b.fillStyle = `rgba(255,250,230,${0.3 + R() * 0.6})`; b.fillRect(R() * W, R() * hz * 0.9, R() < 0.15 ? 2 : 1, R() < 0.15 ? 2 : 1); } }
    // 太陽・月
    const sunX = W * (0.2 + ((cond.hour % 12) / 12) * 0.6), sunY = hz * (night > 0.5 ? 0.3 : 0.25 + Math.abs(cond.hour - 12) / 12 * 0.6);
    gr = b.createRadialGradient(sunX, sunY, 0, sunX, sunY, hz * 0.5); gr.addColorStop(0, rgba(P.light.startsWith('rgb') ? '#ffffff' : P.light, 0.55)); gr.addColorStop(1, 'rgba(255,255,255,0)');
    b.fillStyle = gr; b.fillRect(0, 0, W, hz);
    b.fillStyle = night > 0.5 ? '#fff6d8' : '#fffbe8'; b.beginPath(); b.arc(sunX, sunY, hz * (night > 0.5 ? 0.07 : 0.085), 0, 7); b.fill();
    // 雲
    b.fillStyle = night > 0.5 ? 'rgba(160,170,220,0.12)' : 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) { const cx = R() * W, cy = hz * (0.15 + R() * 0.45), w = W * (0.15 + R() * 0.15); for (let j = 0; j < 4; j++) { b.beginPath(); b.ellipse(cx + (j - 1.5) * w * 0.28, cy + Math.sin(j) * 4, w * 0.22, w * 0.1, 0, 0, 7); b.fill(); } }
    // むこう岸:山・木・町
    b.fillStyle = mix(P.skyB.startsWith('rgb') ? '#a0a8d0' : P.skyB, '#7a86b8', 0.5);
    const base = hz + (sy - hz) * 0.035;
    b.fillStyle = shadeRgb(P.skyB, -0.18); b.beginPath(); b.moveTo(0, base); for (let x = 0; x <= W; x += W / 12) b.lineTo(x, hz - hz * (0.1 + 0.12 * Math.abs(Math.sin(x / W * 5.3 + 1)))); b.lineTo(W, base); b.fill();
    // 町の屋根
    for (let i = 0; i < 7; i++) { const x = W * (0.08 + i * 0.13 + R() * 0.03), w = W * 0.05, h = hz * (0.06 + R() * 0.06); b.fillStyle = shadeRgb(P.skyB, -0.28 - R() * 0.1); b.fillRect(x, base - h, w, h); b.fillStyle = ['#e8a0a8', '#a8b8e8', '#e8c890', '#b0d8b0'][i % 4]; b.globalAlpha = 0.6 * (1 - night * 0.6); b.beginPath(); b.moveTo(x - 3, base - h); b.lineTo(x + w / 2, base - h - h * 0.6); b.lineTo(x + w + 3, base - h); b.fill(); b.globalAlpha = 1; if (night > 0.5) { b.fillStyle = '#ffe9a8'; b.fillRect(x + w * 0.3, base - h * 0.6, 2, 2); } }
    const TC = TREES[cond.season] || TREES.summer;
    for (let i = 0; i < 46; i++) { const x = (i / 45) * W * 1.04 - W * 0.02, r = W * (0.025 + R() * 0.03); b.fillStyle = TC[Math.floor(R() * TC.length)]; b.globalAlpha = 1 - night * 0.55; b.beginPath(); b.arc(x, base - r * 0.5, r, 0, 7); b.fill(); }
    b.globalAlpha = 1;
    // 水
    gr = b.createLinearGradient(0, base, 0, sy); gr.addColorStop(0, P.wFar); gr.addColorStop(0.35, mix(toHex(P.wFar), toHex(P.wNear), 0.45)); gr.addColorStop(1, P.wNear);
    b.fillStyle = gr; b.fillRect(0, base, W, sy - base + 2);
    // むこう岸の映りこみ
    b.globalAlpha = 0.18; for (let i = 0; i < 30; i++) { const x = R() * W, r = W * (0.02 + R() * 0.03); b.fillStyle = TC[i % TC.length]; b.beginPath(); b.ellipse(x, base + r * 0.4, r, r * 0.35, 0, 0, 7); b.fill(); } b.globalAlpha = 1;
    // ふかみ
    poly(b, AREAS.deep, 'rgba(10,30,60,0.22)', 0.6);
    // 水草(水の中)
    const A = AREAS.weed;
    for (let i = 0; i < (mini ? 30 : 70); i++) { const x = lerp(A.x0, A.x1, R()), d = lerp(A.d0, A.d1, R()), p = proj(x, d), h = 26 * p.s * (0.6 + R()); b.strokeStyle = `rgba(${40 + R() * 30},${110 + R() * 40},${70 + R() * 20},0.55)`; b.lineWidth = Math.max(1, 3 * p.s); b.beginPath(); b.moveTo(p.x, p.y); b.quadraticCurveTo(p.x + 6 * p.s, p.y - h * 0.5, p.x - 3 * p.s, p.y - h); b.stroke(); }
    // しずんだ木
    { const a = AREAS.log, p0 = proj(a.x0 + 0.04, a.d1 - 0.05), p1 = proj(a.x1 - 0.02, a.d0 + 0.05);
      b.lineCap = 'round'; b.strokeStyle = 'rgba(70,50,40,0.45)'; b.lineWidth = 22 * p1.s; b.beginPath(); b.moveTo(p0.x, p0.y); b.lineTo(p1.x, p1.y); b.stroke();
      b.strokeStyle = '#8a6a50'; b.lineWidth = 12 * p1.s; b.beginPath(); b.moveTo(lerp(p0.x, p1.x, 0.55), lerp(p0.y, p1.y, 0.55) - 3); b.lineTo(p1.x, p1.y - 6 * p1.s); b.stroke();
      b.strokeStyle = '#6e5340'; b.lineWidth = 5 * p1.s; b.beginPath(); b.moveTo(lerp(p0.x, p1.x, 0.75), lerp(p0.y, p1.y, 0.75) - 4); b.lineTo(lerp(p0.x, p1.x, 0.8) + 10 * p1.s, lerp(p0.y, p1.y, 0.8) - 28 * p1.s); b.stroke(); }
    // 岩
    { const a = AREAS.rock; const rs = []; for (let i = 0; i < 7; i++) rs.push([lerp(a.x0, a.x1, (i + R() * 0.6) / 7), lerp(a.d0, a.d1, R())]); rs.sort((p, q) => q[1] - p[1]);
      for (const [x, d] of rs) { const p = proj(x, d), r = (12 + R() * 16) * p.s * 2.4, n = 7, pts = [];
        for (let k = 0; k <= n; k++) { const t = Math.PI + (k / n) * Math.PI, rr = r * (0.75 + R() * 0.35); pts.push([p.x + Math.cos(t) * rr, p.y + Math.sin(t) * rr * (0.7 + R() * 0.2)]); }
        b.fillStyle = 'rgba(0,0,0,0.12)'; b.beginPath(); b.ellipse(p.x, p.y + 1, r * 1.15, r * 0.2, 0, 0, 7); b.fill();
        const gr2 = b.createLinearGradient(0, p.y - r, 0, p.y); gr2.addColorStop(0, shadeRgb('#b4b0c0', -night * 0.5)); gr2.addColorStop(1, shadeRgb('#7c7890', -night * 0.5));
        b.fillStyle = gr2; b.beginPath(); pts.forEach(([X, Y], k) => k ? b.lineTo(X, Y) : b.moveTo(X, Y)); b.closePath(); b.fill();
        b.fillStyle = 'rgba(255,255,255,0.22)'; b.beginPath(); b.moveTo(pts[1][0], pts[1][1]); b.lineTo(pts[2][0], pts[2][1]); b.lineTo(pts[3][0], pts[3][1]); b.lineTo(p.x - r * 0.1, p.y - r * 0.2); b.closePath(); b.fill();
        if (cond.season === 'winter') { b.fillStyle = 'rgba(255,255,255,0.85)'; b.beginPath(); b.ellipse(p.x - r * 0.05, p.y - r * 0.72, r * 0.45, r * 0.14, 0, 0, 7); b.fill(); }
        b.strokeStyle = 'rgba(255,255,255,0.35)'; b.lineWidth = 1; b.beginPath(); b.ellipse(p.x, p.y, r * 1.05, r * 0.16, 0, 0, Math.PI); b.stroke(); } }
    // ハスの葉
    { const a = AREAS.lily; for (let i = 0; i < (mini ? 9 : 16); i++) { const p = proj(lerp(a.x0, a.x1, R()), lerp(a.d0, a.d1, R())), r = (16 + R() * 10) * p.s * 2; b.fillStyle = shadeRgb(cond.season === 'autumn' ? '#a8b860' : cond.season === 'winter' ? '#9fb8a8' : '#6fbf6a', -night * 0.45 - R() * 0.1); b.beginPath(); b.ellipse(p.x, p.y, r, r * 0.38, 0, 0.25, Math.PI * 2 - 0.05); b.lineTo(p.x, p.y); b.fill(); b.strokeStyle = 'rgba(255,255,255,0.18)'; b.lineWidth = 1; b.stroke(); if (R() < 0.35 && cond.season !== 'winter') { b.fillStyle = '#ffc2d6'; for (let k = 0; k < 5; k++) { b.beginPath(); b.ellipse(p.x + Math.cos(k * 1.25) * r * 0.12, p.y - r * 0.12 + Math.sin(k * 1.25) * r * 0.05, r * 0.12, r * 0.06, k * 1.25, 0, 7); b.fill(); } b.fillStyle = '#ffe28a'; b.beginPath(); b.arc(p.x, p.y - r * 0.12, r * 0.05, 0, 7); b.fill(); } } }
    // 手前の岸(木の桟橋)とアシ
    const sy2 = sy;
    gr = b.createLinearGradient(0, sy2, 0, H); gr.addColorStop(0, shadeRgb('#b98e66', -night * 0.5)); gr.addColorStop(1, shadeRgb('#8e6a4c', -night * 0.5));
    b.fillStyle = gr; b.fillRect(0, sy2, W, H - sy2);
    b.strokeStyle = 'rgba(60,40,30,0.35)'; b.lineWidth = 1.5; for (let y = sy2 + 10; y < H; y += 16) { b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); }
    for (let x = W * 0.1; x < W; x += W * 0.27) { b.beginPath(); b.moveTo(x, sy2); b.lineTo(x, H); b.stroke(); }
    b.fillStyle = 'rgba(255,255,255,0.12)'; b.fillRect(0, sy2, W, 3);
    if (cond.season === 'winter') { b.fillStyle = 'rgba(250,252,255,0.7)'; b.fillRect(0, sy2, W, 5); }
    for (const side of [-1, 1]) for (let i = 0; i < (mini ? 10 : 22); i++) { const x = side < 0 ? R() * W * 0.14 : W - R() * W * 0.14, h = H * (0.08 + R() * 0.12); b.strokeStyle = shadeRgb(cond.season === 'autumn' ? '#b89a5a' : cond.season === 'winter' ? '#c8c0a8' : '#7aa860', -night * 0.5 - R() * 0.2); b.lineWidth = 2; b.beginPath(); b.moveTo(x, sy2 + 4); b.quadraticCurveTo(x + side * -6, sy2 - h * 0.5, x + side * -10 + (R() - 0.5) * 10, sy2 - h); b.stroke(); if (R() < 0.3) { b.fillStyle = '#7a5a3a'; b.beginPath(); b.ellipse(x + side * -10, sy2 - h, 2.5, 7, 0, 0, 7); b.fill(); } }
    if (night > 0) { b.fillStyle = `rgba(10,15,45,${0.25 * night})`; b.fillRect(0, 0, W, H); }
  }
  function poly(b, a, fill, round) {
    const ps = [proj(a.x0, a.d0), proj(a.x1, a.d0), proj(a.x1, a.d1), proj(a.x0, a.d1)];
    const cx = ps.reduce((s, p) => s + p.x, 0) / 4, cy = ps.reduce((s, p) => s + p.y, 0) / 4, rx = (ps[1].x - ps[0].x + ps[2].x - ps[3].x) / 4, ry = (ps[0].y - ps[3].y) / 2;
    const gr = b.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); gr.addColorStop(0, fill); gr.addColorStop(1, 'rgba(10,30,60,0)');
    b.fillStyle = gr; b.beginPath(); b.ellipse(cx, cy, rx * 1.1, ry * 0.8, 0, 0, 7); b.fill();
  }

  // ---- 動くもの ----
  function addRing(x, d, big = 1) { rings.push({ x, d, r: 0, a: 0.8, big }); }
  function splash(x, d, n = 14, big = 1) { const p = proj(x, d); for (let i = 0; i < n; i++) { const a = -Math.PI * (0.15 + R() * 0.7); parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * (40 + R() * 90) * p.s * big * 2, vy: Math.sin(a) * (80 + R() * 120) * p.s * big * 2, life: 0.5 + R() * 0.4, t: 0, s: (1.5 + R() * 2.5) * p.s * 2 * Math.min(2, big) }); } addRing(x, d, big); }
  if (!mini) {
    const kind = cond.rain ? 'rain' : cond.season === 'winter' ? 'snow' : cond.season === 'spring' ? 'petal' : cond.season === 'autumn' ? 'leaf' : cond.season === 'summer' && night > 0.5 ? 'fly' : null;
    const n = kind === 'rain' ? 90 : kind === 'snow' ? 70 : kind === 'fly' ? 14 : kind ? 18 : 0;
    for (let i = 0; i < n; i++) weather.push({ k: kind, x: R(), y: R(), v: 0.5 + R(), p: R() * 6 });
  }

  const api = {
    proj, splash, addRing,
    resize() {
      const r = canvas.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(10, r.width); H = Math.max(10, r.height); canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); buildBg();
    },
    get size() { return { W, H }; },
    // vs: { ph, aim, p, target:[x,d], maxTarget:[x,d], lure:{x,d,h}, isLure, nib, bite, sunk, moving, hooked:{x,d,T,jump,run,len,sp}, fish:[{x,d,len,vis,hx,hd,glow}], side, areaName, T }
    draw(vs, dt) {
      t += dt;
      if (!bg) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.drawImage(bg, 0, 0, W, H);
      const hz = HZ(), sy = SY();
      // さざなみ
      g.lineWidth = 1; const rows = mini ? 10 : 22;
      for (let i = 0; i < rows; i++) {
        const d = i / rows, p = proj(0, d), y = p.y; if (y < hz) continue;
        g.strokeStyle = `rgba(255,255,255,${0.05 + 0.1 * (1 - d) * (1 - night * 0.5)})`;
        const n = 5 + Math.floor(d * 6), len = 30 * p.s * 2;
        for (let k = 0; k < n; k++) { const x = ((k / n + t * 0.015 * (1 + i % 3) + i * 0.13) % 1) * W; g.beginPath(); g.moveTo(x, y + Math.sin(t * 1.5 + k + i) * 1.5); g.lineTo(x + len, y + Math.sin(t * 1.5 + k + i + 1) * 1.5); g.stroke(); }
      }
      // 光のきらめき
      const sx = W * (0.2 + ((cond.hour % 12) / 12) * 0.6);
      for (let i = 0; i < (mini ? 6 : 14); i++) { const y = lerp(hz + 8, sy - 10, ((i * 0.37 + t * 0.03) % 1)), x = sx + Math.sin(i * 7 + t) * W * 0.06 * (y / sy); const a = 0.25 + 0.25 * Math.sin(t * 4 + i * 3); g.fillStyle = `rgba(255,250,220,${a * (night > 0.5 ? 0.6 : 0.9)})`; g.fillRect(x, y, 6 + (y / sy) * 10, 1.5); }
      // 魚のかげ
      if (vs.fish) for (const f of vs.fish) {
        const p = proj(f.x, f.d), L = Math.max(8, Math.min(W * 0.5, f.len * p.s * 2.2)), ang = Math.atan2((proj(f.x + f.hx * 0.05, f.d + f.hd * 0.05).y - p.y), (proj(f.x + f.hx * 0.05, f.d + f.hd * 0.05).x - p.x) || 0.001);
        g.save(); g.translate(p.x, p.y); g.rotate(ang); g.scale(1, 0.45 + 0.3 * Math.abs(Math.cos(ang)));
        g.globalAlpha = 0.36 * f.vis; g.fillStyle = f.glow ? '#ffe9a0' : '#0b1a2e';
        if (f.glow) { g.shadowColor = '#ffe27a'; g.shadowBlur = 14; g.globalAlpha = 0.45 * f.vis; }
        g.beginPath(); g.ellipse(0, 0, L * 0.5, L * 0.16, 0, 0, 7); g.fill();
        const w = Math.sin(t * 8 + f.wig) * 0.4;
        g.beginPath(); g.moveTo(-L * 0.42, 0); g.lineTo(-L * 0.68, -L * 0.14 + w * L * 0.1); g.lineTo(-L * 0.68, L * 0.14 + w * L * 0.1); g.fill();
        g.restore();
      }
      // 波紋
      for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.r += dt * 60 * r.big; r.a -= dt * 0.9; if (r.a <= 0) { rings.splice(i, 1); continue; } const p = proj(r.x, r.d); g.strokeStyle = `rgba(255,255,255,${r.a * 0.6})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(p.x, p.y, r.r * p.s * 1.6, r.r * p.s * 0.5, 0, 0, 7); g.stroke(); }
      // ねらい
      const aim = vs.aim || 0;
      const tip = tipPos(vs.side || 0, (vs.ph === 'ready' || vs.ph === 'charge') ? aim : 0);
      if (vs.ph === 'ready' || vs.ph === 'charge') {
        const [mx, md] = vs.maxTarget || [0, 0.5], mp = proj(mx, md);
        g.setLineDash([4, 6]); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(tip.x, tip.y); g.quadraticCurveTo((tip.x + mp.x) / 2, Math.min(tip.y, mp.y) - H * 0.12, mp.x, mp.y); g.stroke(); g.setLineDash([]);
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(mp.x, mp.y, 18 * mp.s * 2, 6 * mp.s * 2, 0, 0, 7); g.stroke();
        if (vs.ph === 'charge' && vs.target) { const tp = proj(vs.target[0], vs.target[1]); g.strokeStyle = '#ffe36b'; g.lineWidth = 3; g.beginPath(); g.ellipse(tp.x, tp.y, 16 * tp.s * 2, 5.5 * tp.s * 2, 0, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,227,107,0.25)'; g.fill(); }
        if (vs.areaName && !mini) { g.font = '700 12px sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText(vs.areaName, mp.x, mp.y - 14 * mp.s * 2 - 4); }
      }
      // 釣れた魚が水面ではねる
      const hk = vs.hooked;
      let lp = null;
      if (vs.ph === 'fly' && vs.lure) { const p = proj(vs.lure.x, vs.lure.d); lp = { x: p.x, y: p.y - (vs.lure.h || 0) * H * 0.9 * (0.5 + p.s * 0.5), s: p.s }; }
      else if ((vs.ph === 'water' || vs.ph === 'fight') && vs.lure) { const p = proj(vs.lure.x, vs.lure.d); lp = { x: p.x, y: p.y, s: p.s }; }
      if (vs.ph === 'fight' && hk) {
        const p = proj(vs.lure.x, vs.lure.d);
        if (Math.random() < (hk.run ? 0.5 : 0.15) * (mini ? 0.5 : 1)) splash(vs.lure.x + (Math.random() - 0.5) * 0.02, vs.lure.d, hk.run ? 3 : 1, 0.6 + Math.min(1.5, hk.len / 80));
        if (Math.random() < 0.08) addRing(vs.lure.x, vs.lure.d, 0.7);
        if (hk.jump && hk.sp) { const L = Math.max(30, Math.min(W * 0.45, hk.len * p.s * 2.4)), up = Math.sin(Math.max(0, hk.jumpK || 0.5) * Math.PI) * H * 0.12; g.save(); g.translate(p.x, p.y - up); g.rotate(-0.5 + (hk.jumpK || 0.5)); drawCreature(g, hk.sp, 0, 0, L); g.restore(); }
        else { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(p.x, p.y, 10 * p.s * 2 * (1 + Math.min(2, hk.len / 60)), 3 * p.s * 2, 0, 0, 7); g.fill(); }
      }
      // 竿(先に曲がりを決めて、糸はその先から)
      drawRod(tip, vs.ph === 'fight' && hk ? hk.T : 0, lp);
      // 糸
      if (lp) {
        const T = vs.ph === 'fight' ? (hk ? hk.T : 0) : vs.ph === 'water' ? (vs.moving ? 0.3 : 0.05) : 0.1;
        const sag = vs.ph === 'fly' ? 0.25 : Math.max(0, 0.35 - T) * 0.5;
        const vib = T > 0.85 ? Math.sin(t * 90) * (T - 0.85) * 12 : 0;
        const mx = (tip.x + lp.x) / 2 + vib, my = Math.max(tip.y, lp.y) + (Math.abs(lp.y - tip.y) + Math.abs(lp.x - tip.x)) * sag;
        g.strokeStyle = T > 1 ? 'rgba(255,120,120,0.95)' : 'rgba(255,255,255,0.85)'; g.lineWidth = mini ? 1 : 1.3; g.beginPath(); g.moveTo(tip.x, tip.y); g.quadraticCurveTo(mx, my, lp.x, lp.y); g.stroke();
      }
      // ウキ・ルアー
      if (lp && vs.ph !== 'fight') {
        if (vs.ph === 'fly' || vs.isLure) {
          const r = Math.max(2.5, 5 * lp.s * 2);
          if (vs.ph === 'water' && vs.moving) { g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(lp.x - r * 3, lp.y + r * 2); g.lineTo(lp.x, lp.y); g.lineTo(lp.x + r * 3, lp.y + r * 2); g.stroke(); }
          g.fillStyle = vs.isLure ? '#e7e9f0' : '#ff6b6b'; g.beginPath(); g.arc(lp.x, lp.y, r, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(lp.x - r * 0.3, lp.y - r * 0.3, r * 0.35, 0, 7); g.fill();
          if (vs.bite && vs.ph === 'water') bang(lp.x, lp.y - r * 4);
        } else {
          const r = Math.max(4.5, 8 * lp.s * 2), dip = vs.sunk ? r * 1.6 : vs.nib ? r * 0.8 * vs.nib : Math.sin(t * 2.2) * r * 0.12;
          if (!vs.sunk) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(lp.x, lp.y + 1, r * 1.3, r * 0.35, 0, 0, 7); g.fill(); }
          g.save(); g.beginPath(); g.rect(lp.x - r * 2, 0, r * 4, lp.y + r * 0.15); g.clip();
          g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(lp.x, lp.y + dip + r * 0.3, r * 0.75, r, 0, 0, 7); g.fill();
          g.fillStyle = '#ff5a5a'; g.beginPath(); g.ellipse(lp.x, lp.y + dip - r * 0.45, r * 0.75, r * 0.8, 0, Math.PI, 0); g.fill();
          g.fillStyle = '#ff5a5a'; g.fillRect(lp.x - r * 0.12, lp.y + dip - r * 2.1, r * 0.24, r * 1.3);
          g.restore();
          if (vs.nib > 0.5) addRingSoft(vs, 0.25);
          if (vs.sunk) { if (Math.random() < 0.3) addRing(vs.lure.x, vs.lure.d, 0.5); bang(lp.x, lp.y - r * 4.5); }
        }
      }
      // 飛び散る水
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.t += dt; if (q.t > q.life) { parts.splice(i, 1); continue; } q.vy += 420 * dt; q.x += q.vx * dt; q.y += q.vy * dt; g.fillStyle = `rgba(255,255,255,${0.9 * (1 - q.t / q.life)})`; g.beginPath(); g.arc(q.x, q.y, q.s, 0, 7); g.fill(); }
      // 天気
      for (const w of weather) {
        if (w.k === 'rain') { w.y += dt * 1.6 * w.v; if (w.y > 1) { w.y = 0; w.x = Math.random(); if (Math.random() < 0.5) addRing(w.x * 2 - 1, Math.random(), 0.3); } g.strokeStyle = 'rgba(220,230,255,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(w.x * W, w.y * H); g.lineTo(w.x * W - 3, w.y * H + 14); g.stroke(); }
        else if (w.k === 'snow') { w.y += dt * 0.08 * w.v; w.x += Math.sin(t + w.p) * dt * 0.02; if (w.y > 1) { w.y = 0; w.x = Math.random(); } g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(w.x * W, w.y * H, 1.5 + w.v, 0, 7); g.fill(); }
        else if (w.k === 'petal' || w.k === 'leaf') { w.y += dt * 0.06 * w.v; w.x += (Math.sin(t * 1.3 + w.p) * 0.03 + 0.02) * dt; if (w.y > 1) { w.y = 0; w.x = Math.random(); } g.fillStyle = w.k === 'petal' ? 'rgba(255,190,210,0.9)' : ['#e8803a', '#d9503a', '#f0b53c'][Math.floor(w.p) % 3]; g.save(); g.translate(w.x * W, w.y * H); g.rotate(t * 2 + w.p); g.beginPath(); g.ellipse(0, 0, w.k === 'petal' ? 3.5 : 5, w.k === 'petal' ? 2 : 3, 0, 0, 7); g.fill(); g.restore(); }
        else if (w.k === 'fly') { const x = (w.x + Math.sin(t * 0.3 + w.p) * 0.05) * W, y = lerp(hz, sy, 0.3 + w.y * 0.6) + Math.sin(t * 0.8 + w.p * 2) * 10, a = 0.5 + 0.5 * Math.sin(t * 3 + w.p * 5); g.fillStyle = `rgba(220,255,140,${a})`; g.shadowColor = '#d8ff8a'; g.shadowBlur = 8; g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); g.shadowBlur = 0; }
      }
    },
  };
  let ringT = 0;
  function addRingSoft(vs, k) { ringT -= 0.016; if (ringT <= 0) { ringT = k; addRing(vs.lure.x, vs.lure.d, 0.35); } }
  function bang(x, y) { const k = 1 + Math.sin(t * 20) * 0.12; g.save(); g.translate(x, y); g.scale(k, k); g.fillStyle = '#ffe36b'; g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.font = `900 ${mini ? 18 : 30}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('!', 0, 0); g.fillText('!', 0, 0); g.restore(); }
  function drawRod(tip, T, lp) {
    const bx = W * (mini ? 0.9 : 0.9), by = H * 1.04;
    let cx = (bx + tip.x) / 2, cy = (by + tip.y) / 2;
    if (lp && T > 0) { const dx = lp.x - tip.x, dy = lp.y - tip.y, l = Math.hypot(dx, dy) || 1; cx += dx / l * T * W * 0.06; cy += dy / l * T * H * 0.08 + T * H * 0.05; }
    const ty = tip.y + (T > 0 ? T * H * 0.06 : 0), tx = tip.x + (lp && T > 0 ? (lp.x - tip.x) * 0.04 * T : 0);
    g.lineCap = 'round';
    g.strokeStyle = '#3d2c22'; g.lineWidth = mini ? 4 : 7; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(cx, cy, tx, ty); g.stroke();
    g.strokeStyle = '#b57a4a'; g.lineWidth = mini ? 2 : 4; g.stroke();
    g.fillStyle = '#2b2b33'; g.beginPath(); g.arc(lerp(bx, cx, 0.35), lerp(by, cy, 0.35), mini ? 6 : 12, 0, 7); g.fill(); g.fillStyle = '#c9c9d6'; g.beginPath(); g.arc(lerp(bx, cx, 0.35), lerp(by, cy, 0.35), mini ? 3 : 6, 0, 7); g.fill();
    tip.x = tx; tip.y = ty;
  }
  return api;
}
function toHex(c) { if (c[0] === '#') return c; const m = c.match(/\d+/g).map(Number); return '#' + m.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join(''); }
function shadeRgb(c, k) { const h = toHex(c), n = parseInt(h.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
