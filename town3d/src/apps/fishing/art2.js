// 魚の高品質な絵(Canvas 2D)。art.js の種類ごとのデータ(色・形・模様)をそのまま使って、
// うろこ・ひれのすじ・えら・つや・目 などを描き込む。右向き。
import { shade, pats } from './art.js';

const rgba = (hex, a) => { if (hex[0] === 'r') return hex.replace('rgb(', 'rgba(').replace(')', ',' + a + ')'); const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

function tailPath(tl, xt, x0, cy, L, H) {
  const p = new Path2D();
  if (tl === 'lunate') { p.moveTo(xt + L * 0.02, cy); p.quadraticCurveTo(x0 + L * 0.05, cy - H * 0.3, x0 - L * 0.04, cy - H * 0.85); p.quadraticCurveTo(x0 + L * 0.1, cy, x0 - L * 0.04, cy + H * 0.85); p.quadraticCurveTo(x0 + L * 0.05, cy + H * 0.3, xt + L * 0.02, cy); }
  else if (tl === 'fan') { p.moveTo(xt + L * 0.02, cy); p.bezierCurveTo(x0 - L * 0.08, cy - H * 1.15, x0 - L * 0.2, cy - H * 0.25, x0 + L * 0.0, cy); p.bezierCurveTo(x0 - L * 0.2, cy + H * 0.25, x0 - L * 0.08, cy + H * 1.15, xt + L * 0.02, cy); }
  else if (tl === 'square') { p.moveTo(xt + L * 0.02, cy - H * 0.12); p.lineTo(x0, cy - H * 0.5); p.quadraticCurveTo(x0 + L * 0.015, cy, x0, cy + H * 0.5); p.lineTo(xt + L * 0.02, cy + H * 0.12); }
  else if (tl === 'round') { p.moveTo(xt + L * 0.03, cy - H * 0.12); p.bezierCurveTo(x0 + L * 0.0, cy - H * 0.7, x0 - L * 0.08, cy - H * 0.4, x0 - L * 0.05, cy); p.bezierCurveTo(x0 - L * 0.08, cy + H * 0.4, x0 + L * 0.0, cy + H * 0.7, xt + L * 0.03, cy + H * 0.12); }
  else { p.moveTo(xt + L * 0.02, cy); p.quadraticCurveTo(x0 + L * 0.06, cy - H * 0.2, x0, cy - H * 0.6); p.quadraticCurveTo(x0 + L * 0.1, cy, x0, cy + H * 0.6); p.quadraticCurveTo(x0 + L * 0.06, cy + H * 0.2, xt + L * 0.02, cy); }
  p.closePath(); return p;
}

// ひれ:ぬりつぶし(はしほどうすく)+ すじ(扇)+ ふち
function fin(g, path, base, tip, color, rays, n, L, soft = 0.55) {
  g.save();
  const gr = g.createLinearGradient(base[0], base[1], tip[0], tip[1]);
  gr.addColorStop(0, rgba(shade(color, -0.12), 0.97)); gr.addColorStop(1, rgba(shade(color, 0.22), soft));
  g.fillStyle = gr; g.fill(path);
  g.clip(path);
  g.strokeStyle = rgba(shade(color, -0.35), 0.55); g.lineWidth = Math.max(0.6, L * 0.0055);
  for (let i = 0; i < n; i++) { const u = n === 1 ? 0.5 : i / (n - 1); const q = rays(u); g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[2], q[3]); g.stroke(); }
  g.restore();
  g.save(); g.strokeStyle = rgba(shade(color, -0.45), 0.55); g.lineWidth = Math.max(0.8, L * 0.008); g.lineJoin = 'round'; g.stroke(path); g.restore();
}

export function drawFishHQ(g, sp, cx, cy, len) {
  const a = sp.art || {}; const L = len, H = (a.h || 0.34) * L;
  const xn = cx + L * 0.47, xt = cx - L * 0.3, x0 = cx - L * 0.5;
  const [back, belly] = a.body || ['#7a8a9a', '#eef']; const fc = a.fin || back;
  const flatHead = a.shape === 'cat';
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  // 水の中のうすい影
  { const sh = g.createRadialGradient(cx, cy + H * 0.85, 1, cx, cy + H * 0.85, L * 0.46); sh.addColorStop(0, 'rgba(30,40,70,0.22)'); sh.addColorStop(1, 'rgba(30,40,70,0)'); g.save(); g.translate(0, 0); g.scale(1, 0.22); g.fillStyle = sh; g.beginPath(); g.arc(cx, (cy + H * 0.85) / 0.22, L * 0.46, 0, 7); g.fill(); g.restore(); }
  if (a.glow) { g.shadowColor = a.glow; g.shadowBlur = L * 0.14; }

  // ---- むなびれ(奥側)・はらびれ ----
  { const p = new Path2D(); p.moveTo(cx - L * 0.02, cy + H * 0.34); p.quadraticCurveTo(cx - L * 0.1, cy + H * 0.78, cx - L * 0.2, cy + H * 0.58); p.quadraticCurveTo(cx - L * 0.14, cy + H * 0.46, cx - L * 0.1, cy + H * 0.3); p.closePath();
    fin(g, p, [cx - L * 0.04, cy + H * 0.34], [cx - L * 0.18, cy + H * 0.7], fc, u => [cx - L * 0.05 - u * L * 0.04, cy + H * 0.32, cx - L * 0.08 - u * L * 0.14, cy + H * 0.9 - u * H * 0.16], 5, L, 0.5); }

  // ---- しっぽ ----
  { const p = tailPath(a.tail || 'fork', xt, x0, cy, L, H);
    fin(g, p, [xt, cy], [x0 - L * 0.05, cy], fc, u => { const ang = (u - 0.5) * 1.9; return [xt + L * 0.03, cy, xt + L * 0.03 - Math.cos(ang) * L * 0.34, cy + Math.sin(ang) * H * 1.5]; }, 13, L, 0.45); }

  // ---- しりびれ ----
  { const p = new Path2D(); p.moveTo(cx - L * 0.04, cy + H * 0.4); p.quadraticCurveTo(cx - L * 0.13, cy + H * 0.8, cx - L * 0.26, cy + H * 0.2); p.closePath();
    fin(g, p, [cx - L * 0.08, cy + H * 0.4], [cx - L * 0.2, cy + H * 0.7], fc, u => [cx - L * 0.06 - u * L * 0.16, cy + H * 0.34, cx - L * 0.1 - u * L * 0.15, cy + H * 0.95], 6, L, 0.5); }

  // ---- せびれ(とげ→やわらかいひれ) ----
  { const tuna = a.shape === 'tuna'; const p = new Path2D(); p.moveTo(cx + L * 0.1, cy - H * 0.46); p.quadraticCurveTo(cx + L * 0.02, cy - H * (tuna ? 1.05 : 0.98), cx - L * 0.06, cy - H * (tuna ? 0.8 : 0.98)); p.quadraticCurveTo(cx - L * 0.16, cy - H * 0.82, cx - L * 0.22, cy - H * 0.3); p.closePath();
    fin(g, p, [cx - L * 0.05, cy - H * 0.5], [cx - L * 0.05, cy - H * 1.0], fc, u => [cx + L * 0.1 - u * L * 0.32, cy - H * 0.44, cx + L * 0.09 - u * L * 0.31 - (u < 0.3 ? 0 : (u - 0.3) * L * 0.1), cy - H * (1.05 - Math.abs(u - 0.35) * 0.6)], 14, L, 0.6); }

  // ---- からだ ----
  const body = new Path2D();
  body.moveTo(xn, cy + H * (flatHead ? 0.12 : 0.04));
  body.bezierCurveTo(xn - L * (flatHead ? 0.02 : 0.07), cy - H * (flatHead ? 0.42 : 0.58), cx - L * 0.02, cy - H * 0.62, xt, cy - H * 0.13);
  body.lineTo(xt, cy + H * 0.13);
  body.bezierCurveTo(cx - L * 0.04, cy + H * 0.64, xn - L * 0.1, cy + H * 0.52, xn, cy + H * (flatHead ? 0.12 : 0.04));
  body.closePath();
  // 色(背が濃く、はらが明るい)
  const gr = g.createLinearGradient(0, cy - H * 0.62, 0, cy + H * 0.62);
  gr.addColorStop(0, shade(back, -0.28)); gr.addColorStop(0.3, shade(back, -0.05)); gr.addColorStop(0.5, back); gr.addColorStop(0.64, shade(belly, -0.04)); gr.addColorStop(1, shade(belly, 0.1));
  g.fillStyle = gr; g.fill(body);
  g.shadowBlur = 0;
  g.save(); g.clip(body);
  // 横からの陰影(あたまが少し明るく、しっぽ側がすこし落ち着く)
  { const hg = g.createLinearGradient(x0, 0, xn, 0); hg.addColorStop(0, 'rgba(20,20,50,0.18)'); hg.addColorStop(0.5, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(255,255,255,0.1)'); g.fillStyle = hg; g.fillRect(x0, cy - H, L, H * 2); }
  // 模様
  pats(g, a, { L, H, cx, cy, xn, xt, back });
  // うろこ(こい・ふな系は大きめ、細い魚は細かく)
  { const sr = Math.max(L * 0.03, H * 0.1) * (a.scale ? 1.15 : 1), cols = Math.ceil((xn - xt) / (sr * 0.95)), rows = Math.ceil(H * 1.3 / (sr * 0.8));
    g.lineWidth = Math.max(0.6, L * 0.0045);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = xt + sr * 0.2 + i * sr * 0.95 + (j % 2) * sr * 0.47, y = cy - H * 0.62 + j * sr * 0.8;
      const vy = (y - cy) / (H * 0.6), env = Math.max(0, 1 - vy * vy * 0.55) * Math.min(1, Math.max(0, (xn - L * 0.17 - x) / (L * 0.1)));
      if (env <= 0.02) continue;
      g.strokeStyle = `rgba(255,255,255,${0.2 * env})`; g.beginPath(); g.arc(x, y, sr * 0.62, -0.95, 0.95); g.stroke();
      g.strokeStyle = `rgba(20,20,40,${0.1 * env})`; g.beginPath(); g.arc(x - sr * 0.1, y, sr * 0.62, -0.95, 0.95); g.stroke();
    } }
  // 側線
  g.strokeStyle = rgba(shade(back, -0.4), 0.4); g.lineWidth = Math.max(0.7, L * 0.005); g.setLineDash([L * 0.008, L * 0.01]);
  g.beginPath(); g.moveTo(xn - L * 0.2, cy - H * 0.1); g.bezierCurveTo(cx + L * 0.1, cy - H * 0.17, cx - L * 0.1, cy - H * 0.1, xt, cy - H * 0.02); g.stroke(); g.setLineDash([]);
  // つや(せなかの光の帯)
  { const sg = g.createLinearGradient(0, cy - H * 0.58, 0, cy - H * 0.06); sg.addColorStop(0, 'rgba(255,255,255,0.0)'); sg.addColorStop(0.35, 'rgba(255,255,255,0.34)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg; g.beginPath(); g.moveTo(xn - L * 0.1, cy - H * 0.2); g.bezierCurveTo(cx + L * 0.12, cy - H * 0.58, cx - L * 0.02, cy - H * 0.58, xt + L * 0.03, cy - H * 0.2); g.bezierCurveTo(cx - L * 0.02, cy - H * 0.34, cx + L * 0.12, cy - H * 0.36, xn - L * 0.1, cy - H * 0.2); g.fill(); }
  // はらの下の照り返し
  { const bg = g.createLinearGradient(0, cy + H * 0.2, 0, cy + H * 0.62); bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(1, 'rgba(255,255,255,0.28)'); g.fillStyle = bg; g.fillRect(xt, cy + H * 0.2, L, H * 0.5); }
  // えら
  { const gx = xn - L * 0.2; const gg = g.createLinearGradient(gx - L * 0.08, 0, gx + L * 0.05, 0); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(255,255,255,0.18)');
    g.fillStyle = 'rgba(30,20,50,0.14)'; g.beginPath(); g.moveTo(gx, cy - H * 0.5); g.quadraticCurveTo(gx - L * 0.05, cy, gx, cy + H * 0.52); g.lineTo(gx - L * 0.012, cy + H * 0.52); g.quadraticCurveTo(gx - L * 0.065, cy, gx - L * 0.012, cy - H * 0.5); g.fill();
    g.fillStyle = gg; g.beginPath(); g.moveTo(gx, cy - H * 0.5); g.quadraticCurveTo(gx - L * 0.05, cy, gx, cy + H * 0.52); g.lineTo(xn, cy + H * 0.2); g.lineTo(xn, cy - H * 0.2); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(30,20,50,0.5)'; g.lineWidth = Math.max(1, L * 0.007); g.beginPath(); g.moveTo(gx, cy - H * 0.46); g.quadraticCurveTo(gx - L * 0.05, cy, gx, cy + H * 0.46); g.stroke(); }
  g.restore();
  // ふち
  g.strokeStyle = rgba(shade(back, -0.55), 0.55); g.lineWidth = Math.max(1, L * 0.01); g.stroke(body);

  // ---- むなびれ(手前) ----
  { const px = xn - L * 0.27, py = cy + H * 0.16; const p = new Path2D(); p.moveTo(px, py - H * 0.06); p.bezierCurveTo(px - L * 0.04, py - H * 0.2, px - L * 0.14, py - H * 0.05, px - L * 0.15, py + H * 0.22); p.bezierCurveTo(px - L * 0.09, py + H * 0.16, px - L * 0.03, py + H * 0.16, px, py + H * 0.08); p.closePath();
    fin(g, p, [px, py], [px - L * 0.14, py + H * 0.2], fc, u => [px - L * 0.005, py - H * 0.02 + u * H * 0.08, px - L * 0.15 + u * L * 0.05, py + H * 0.22 - u * H * 0.06], 6, L, 0.6); }

  // ---- くち ----
  g.strokeStyle = 'rgba(40,25,50,0.7)'; g.lineWidth = Math.max(1, L * 0.011);
  g.beginPath(); g.moveTo(xn - L * 0.003, cy + H * 0.07); g.quadraticCurveTo(xn - L * 0.03, cy + H * 0.14, xn - L * (a.bigMouth ? 0.13 : 0.06), cy + H * (a.bigMouth ? 0.15 : 0.11)); g.stroke();
  if (a.whisker) { g.strokeStyle = shade(back, -0.3); g.lineWidth = Math.max(1, L * 0.008); const n = a.whisker === 2 ? 2 : 1; for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(xn - L * 0.02, cy + H * 0.09); g.quadraticCurveTo(xn + L * 0.02, cy + H * (0.2 + i * 0.1), xn - L * 0.01, cy + H * (0.3 + i * 0.12)); g.stroke(); } }
  // ---- 目 ----
  { const ex = xn - L * (a.bigHead ? 0.1 : 0.115), ey = cy - H * (flatHead ? 0.02 : 0.13), r = Math.max(2, H * (a.eyeBig ? 0.16 : 0.115));
    g.fillStyle = 'rgba(20,15,30,0.35)'; g.beginPath(); g.arc(ex, ey, r * 1.22, 0, 7); g.fill();
    const ir = g.createRadialGradient(ex - r * 0.2, ey - r * 0.25, r * 0.1, ex, ey, r); ir.addColorStop(0, '#fff6d6'); ir.addColorStop(0.55, '#e9b24a'); ir.addColorStop(1, '#6b3d12');
    g.fillStyle = ir; g.beginPath(); g.arc(ex, ey, r, 0, 7); g.fill();
    g.fillStyle = '#14101c'; g.beginPath(); g.arc(ex + r * 0.1, ey, r * 0.58, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(ex + r * 0.3, ey - r * 0.32, r * 0.24, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(ex - r * 0.25, ey + r * 0.3, r * 0.12, 0, 7); g.fill(); }
  g.restore();
}
