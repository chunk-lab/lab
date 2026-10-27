// 魚とアイテムの絵(Canvas 2D でその場でかく)。右向き。
// artCanvas(sp, w, h, {sil}) → 絵の canvas(同じものは使い回す)。sil=まだ見つけていない(かげだけ)
const cache = new Map();
export const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };

export function artCanvas(sp, w, h, opt = {}) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), key = sp.id + '|' + w + 'x' + h + '|' + (opt.sil ? 1 : 0) + '|' + dpr;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  drawCreature(g, sp, w / 2 + w * 0.03, h / 2, Math.min(w * 0.8, h * 1.75));
  if (opt.sil) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#4a4360'; g.fillRect(0, 0, w, h); }
  cache.set(key, c); return c;
}

export function drawCreature(g, sp, cx, cy, len) {
  const a = sp.art || {};
  g.save();
  if (sp.emoji) { g.font = `${Math.round(len * 0.62)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sp.emoji, cx, cy + len * 0.03); g.restore(); return; }
  if (a.glow) { g.shadowColor = a.glow; g.shadowBlur = len * 0.12; }
  const shape = a.shape || 'fish';
  ({ fish: fishShape, cat: fishShape, tuna: fishShape, eel, flat, puffer, octo, crab, seahorse, jelly, oar }[shape] || fishShape)(g, a, cx, cy, len, shape);
  g.restore();
}

function eye(g, x, y, r, big) {
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * (big ? 1.25 : 1), 0, 7); g.fill();
  g.fillStyle = '#231f2e'; g.beginPath(); g.arc(x + r * 0.15, y, r * (big ? 0.85 : 0.62), 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x + r * 0.35, y - r * 0.3, r * 0.22, 0, 7); g.fill();
}
const outline = (g, len) => { g.lineWidth = Math.max(1, len * 0.012); g.strokeStyle = 'rgba(40,30,60,0.35)'; g.stroke(); };

function fishShape(g, a, cx, cy, len, shape) {
  const L = len, H = (a.h || 0.34) * L, xn = cx + L * 0.47, xt = cx - L * 0.3, x0 = cx - L * 0.5;
  const [back, belly] = a.body || ['#7a8a9a', '#eef']; const fin = a.fin || back;
  // しっぽ
  g.fillStyle = fin; g.beginPath();
  const tl = a.tail || 'fork';
  if (tl === 'fork') { g.moveTo(xt + L * 0.02, cy); g.lineTo(x0, cy - H * 0.55); g.quadraticCurveTo(x0 + L * 0.09, cy, x0, cy + H * 0.55); }
  else if (tl === 'lunate') { g.moveTo(xt + L * 0.02, cy); g.quadraticCurveTo(x0 + L * 0.05, cy - H * 0.3, x0 - L * 0.04, cy - H * 0.8); g.quadraticCurveTo(x0 + L * 0.1, cy, x0 - L * 0.04, cy + H * 0.8); g.quadraticCurveTo(x0 + L * 0.05, cy + H * 0.3, xt + L * 0.02, cy); }
  else if (tl === 'fan') { g.moveTo(xt + L * 0.02, cy); g.bezierCurveTo(x0 - L * 0.1, cy - H * 1.1, x0 - L * 0.18, cy - H * 0.2, x0 + L * 0.02, cy); g.bezierCurveTo(x0 - L * 0.18, cy + H * 0.2, x0 - L * 0.1, cy + H * 1.1, xt + L * 0.02, cy); }
  else if (tl === 'square') { g.moveTo(xt + L * 0.02, cy - H * 0.1); g.lineTo(x0, cy - H * 0.45); g.lineTo(x0 + L * 0.01, cy + H * 0.45); g.lineTo(xt + L * 0.02, cy + H * 0.1); }
  else { g.moveTo(xt + L * 0.03, cy - H * 0.12); g.bezierCurveTo(x0 + L * 0.06, cy - H * 0.62, x0 - L * 0.07, cy - H * 0.32, x0 - L * 0.05, cy); g.bezierCurveTo(x0 - L * 0.07, cy + H * 0.32, x0 + L * 0.06, cy + H * 0.62, xt + L * 0.03, cy + H * 0.12); }
  g.closePath(); g.fill(); outline(g, L);
  // せびれ・しりびれ
  g.fillStyle = fin; g.beginPath(); g.moveTo(cx + L * 0.08, cy - H * 0.46); g.quadraticCurveTo(cx - L * 0.06, cy - H * (shape === 'tuna' ? 1.0 : 0.9), cx - L * 0.2, cy - H * 0.3); g.closePath(); g.fill(); outline(g, L);
  g.beginPath(); g.moveTo(cx - L * 0.06, cy + H * 0.42); g.quadraticCurveTo(cx - L * 0.15, cy + H * 0.75, cx - L * 0.24, cy + H * 0.22); g.closePath(); g.fill();
  if (shape === 'tuna') { g.fillStyle = a.fin; for (let i = 0; i < 5; i++) { const x = xt + L * 0.02 + i * L * 0.035; g.beginPath(); g.moveTo(x + L * 0.03, cy - H * 0.28 + i * H * 0.04); g.lineTo(x, cy - H * 0.38 + i * H * 0.04); g.lineTo(x - L * 0.005, cy - H * 0.2); g.fill(); g.beginPath(); g.moveTo(x + L * 0.03, cy + H * 0.28 - i * H * 0.04); g.lineTo(x, cy + H * 0.38 - i * H * 0.04); g.lineTo(x - L * 0.005, cy + H * 0.2); g.fill(); } }
  // からだ
  const body = new Path2D();
  const flatHead = shape === 'cat';
  body.moveTo(xn, cy + H * (flatHead ? 0.12 : 0.04));
  body.bezierCurveTo(xn - L * (flatHead ? 0.02 : 0.07), cy - H * (flatHead ? 0.42 : 0.56), cx - L * 0.02, cy - H * 0.6, xt, cy - H * 0.13);
  body.lineTo(xt, cy + H * 0.13);
  body.bezierCurveTo(cx - L * 0.04, cy + H * 0.62, xn - L * 0.1, cy + H * 0.5, xn, cy + H * (flatHead ? 0.12 : 0.04));
  body.closePath();
  const gr = g.createLinearGradient(0, cy - H * 0.6, 0, cy + H * 0.6); gr.addColorStop(0, shade(back, -0.12)); gr.addColorStop(0.42, back); gr.addColorStop(0.62, belly); gr.addColorStop(1, shade(belly, -0.05));
  g.fillStyle = gr; g.fill(body);
  g.save(); g.clip(body); g.shadowBlur = 0;
  const pc = a.pc || shade(back, -0.35);
  pats(g, a, { L, H, cx, cy, xn, xt, back });
  // つやと陰
  const sh = g.createLinearGradient(0, cy - H * 0.6, 0, cy - H * 0.1); sh.addColorStop(0, 'rgba(255,255,255,0.28)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(xt, cy - H * 0.6, L * 0.7, H * 0.4);
  g.restore();
  g.save(); g.shadowBlur = 0; g.lineWidth = Math.max(1, L * 0.012); g.strokeStyle = 'rgba(40,30,60,0.35)'; g.stroke(body); g.restore();
  // えら・むなびれ
  g.strokeStyle = 'rgba(40,30,60,0.28)'; g.lineWidth = Math.max(1, L * 0.008); g.beginPath(); g.arc(xn - L * 0.2, cy, H * 0.3, -1, 1); g.stroke();
  g.fillStyle = shade(fin, 0.15); g.globalAlpha = 0.85; g.beginPath(); g.ellipse(xn - L * 0.27, cy + H * 0.14, L * 0.07, H * 0.12, 0.5, 0, 7); g.fill(); g.globalAlpha = 1;
  // くち・目・ひげ
  g.strokeStyle = 'rgba(40,30,60,0.55)'; g.lineWidth = Math.max(1, L * 0.01); g.beginPath(); g.moveTo(xn, cy + H * 0.06); g.lineTo(xn - L * (a.bigMouth ? 0.12 : 0.04), cy + H * (a.bigMouth ? 0.14 : 0.09)); g.stroke();
  if (a.hook) { g.beginPath(); g.moveTo(xn, cy + H * 0.02); g.quadraticCurveTo(xn + L * 0.03, cy - H * 0.15, xn - L * 0.02, cy - H * 0.1); g.stroke(); }
  if (a.whisker) { g.strokeStyle = shade(back, -0.3); g.lineWidth = Math.max(1, L * 0.008); const n = a.whisker === 2 ? 2 : 1; for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(xn - L * 0.02, cy + H * 0.08); g.quadraticCurveTo(xn + L * 0.06, cy + H * (0.3 + i * 0.2), xn + L * (a.whisker === 2 ? 0.02 : -0.02), cy + H * (0.55 + i * 0.25)); g.stroke(); } }
  eye(g, xn - L * (a.bigHead ? 0.1 : 0.11), cy - H * (flatHead ? 0.02 : 0.13), Math.max(1.5, H * (a.eyeBig ? 0.13 : 0.1)), a.eyeBig);
}

function eel(g, a, cx, cy, L) {
  const [back, belly] = a.body; const H = L * 0.08;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([cx + L * 0.46 - u * L * 0.92, cy + Math.sin(u * 7) * L * 0.07 * u]); }
  g.strokeStyle = shade(back, 0.1); g.lineWidth = H * 1.6; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.strokeStyle = back; g.lineWidth = H * 1.2; g.stroke();
  g.strokeStyle = belly; g.lineWidth = H * 0.4; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y + H * 0.35) : g.moveTo(x, y + H * 0.35)); g.stroke();
  eye(g, cx + L * 0.42, cy - H * 0.2, H * 0.32);
  g.strokeStyle = 'rgba(40,30,60,0.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + L * 0.47, cy + H * 0.1); g.lineTo(cx + L * 0.43, cy + H * 0.25); g.stroke();
}
function flat(g, a, cx, cy, L) {
  const [back, belly] = a.body; const H = L * 0.42;
  g.fillStyle = shade(back, 0.15); g.beginPath(); g.ellipse(cx, cy, L * 0.42, H * 0.62, 0, 0, 7); g.fill();
  const gr = g.createRadialGradient(cx, cy - H * 0.1, 2, cx, cy, L * 0.4); gr.addColorStop(0, shade(back, 0.1)); gr.addColorStop(1, back); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, L * 0.36, H * 0.5, 0, 0, 7); g.fill(); outline(g, L);
  g.fillStyle = shade(back, -0.25); for (let i = 0; i < 14; i++) { const u = (i * 0.618) % 1, v = (i * 0.41) % 1; g.beginPath(); g.arc(cx - L * 0.28 + u * L * 0.5, cy - H * 0.35 + v * H * 0.7, L * 0.018, 0, 7); g.fill(); }
  g.fillStyle = back; g.beginPath(); g.moveTo(cx - L * 0.34, cy); g.lineTo(cx - L * 0.5, cy - H * 0.3); g.lineTo(cx - L * 0.5, cy + H * 0.3); g.closePath(); g.fill();
  eye(g, cx + L * 0.25, cy - H * 0.2, L * 0.035); eye(g, cx + L * 0.2, cy - H * 0.32, L * 0.035);
}
function puffer(g, a, cx, cy, L) {
  const [back, belly] = a.body, R = L * 0.33;
  g.fillStyle = back; g.beginPath(); g.moveTo(cx - R * 0.8, cy); g.lineTo(cx - R * 1.45, cy - R * 0.35); g.lineTo(cx - R * 1.4, cy + R * 0.35); g.closePath(); g.fill();
  g.strokeStyle = shade(back, -0.2); g.lineWidth = 1; for (let i = 0; i < 26; i++) { const t = i / 26 * 6.28; g.beginPath(); g.moveTo(cx + Math.cos(t) * R * 0.95, cy + Math.sin(t) * R * 0.95); g.lineTo(cx + Math.cos(t) * R * 1.1, cy + Math.sin(t) * R * 1.1); g.stroke(); }
  const gr = g.createLinearGradient(0, cy - R, 0, cy + R); gr.addColorStop(0, back); gr.addColorStop(0.55, back); gr.addColorStop(0.6, belly); gr.addColorStop(1, belly);
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill(); outline(g, L);
  g.fillStyle = a.pc; for (let i = 0; i < 12; i++) { const u = (i * 0.618) % 1, v = (i * 0.37) % 1; g.beginPath(); g.arc(cx - R * 0.6 + u * R * 1.2, cy - R * 0.7 + v * R * 0.6, R * 0.06, 0, 7); g.fill(); }
  eye(g, cx + R * 0.55, cy - R * 0.25, R * 0.16);
  g.fillStyle = '#e88'; g.beginPath(); g.ellipse(cx + R * 0.97, cy + R * 0.1, R * 0.08, R * 0.06, 0, 0, 7); g.fill();
}
function octo(g, a, cx, cy, L) {
  const [c1, c2] = a.body;
  g.strokeStyle = c1; g.lineCap = 'round';
  for (let i = 0; i < 8; i++) { const s = (i - 3.5) / 3.5; g.lineWidth = L * 0.06; g.beginPath(); g.moveTo(cx + s * L * 0.15, cy + L * 0.05); g.bezierCurveTo(cx + s * L * 0.3, cy + L * 0.25, cx + s * L * 0.42, cy + L * 0.2, cx + s * L * 0.38 + Math.sin(i) * L * 0.05, cy + L * 0.36); g.stroke(); }
  g.fillStyle = c2; for (let i = 0; i < 8; i++) { const s = (i - 3.5) / 3.5; g.beginPath(); g.arc(cx + s * L * 0.3, cy + L * 0.22, L * 0.012, 0, 7); g.fill(); }
  const gr = g.createRadialGradient(cx - L * 0.06, cy - L * 0.2, 2, cx, cy - L * 0.08, L * 0.28); gr.addColorStop(0, c2); gr.addColorStop(1, c1);
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy - L * 0.1, L * 0.22, L * 0.24, 0, 0, 7); g.fill(); outline(g, L);
  eye(g, cx - L * 0.08, cy + L * 0.0, L * 0.04); eye(g, cx + L * 0.08, cy + L * 0.0, L * 0.04);
}
function crab(g, a, cx, cy, L) {
  const [c1, c2] = a.body;
  g.strokeStyle = c1; g.lineWidth = Math.max(1, L * 0.01); g.beginPath(); g.moveTo(cx + L * 0.26, cy - L * 0.02); g.quadraticCurveTo(cx + L * 0.45, cy - L * 0.25, cx + L * 0.2, cy - L * 0.32); g.moveTo(cx + L * 0.26, cy + L * 0.0); g.quadraticCurveTo(cx + L * 0.5, cy - L * 0.1, cx + L * 0.48, cy - L * 0.3); g.stroke();
  for (const s of [-1, 1]) { g.fillStyle = c1; g.beginPath(); g.ellipse(cx + L * 0.32, cy + s * L * 0.15, L * 0.11, L * 0.06, s * 0.4, 0, 7); g.fill(); outline(g, L); g.beginPath(); g.ellipse(cx + L * 0.2, cy + s * L * 0.1, L * 0.07, L * 0.03, s * 0.6, 0, 7); g.fill(); }
  for (let i = 0; i < 5; i++) { const x = cx + L * 0.16 - i * L * 0.075; g.fillStyle = i % 2 ? c1 : c2; g.beginPath(); g.ellipse(x, cy, L * 0.06, L * (0.085 - i * 0.008), 0, 0, 7); g.fill(); outline(g, L); }
  g.fillStyle = c1; g.beginPath(); g.moveTo(cx - L * 0.2, cy); g.lineTo(cx - L * 0.32, cy - L * 0.08); g.lineTo(cx - L * 0.34, cy + L * 0.08); g.closePath(); g.fill();
  g.fillStyle = '#231f2e'; g.beginPath(); g.arc(cx + L * 0.21, cy - L * 0.04, L * 0.015, 0, 7); g.arc(cx + L * 0.21, cy + L * 0.04, L * 0.015, 0, 7); g.fill();
}
function seahorse(g, a, cx, cy, L) {
  const [c1, c2] = a.body; g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = c1; g.lineWidth = L * 0.12; g.beginPath(); g.moveTo(cx + L * 0.05, cy - L * 0.25); g.bezierCurveTo(cx + L * 0.2, cy - L * 0.05, cx - L * 0.12, cy + L * 0.1, cx + L * 0.02, cy + L * 0.28); g.stroke();
  g.lineWidth = L * 0.05; g.beginPath(); g.moveTo(cx + L * 0.02, cy + L * 0.28); g.arc(cx - L * 0.05, cy + L * 0.3, L * 0.07, 0, 4.5); g.stroke();
  g.strokeStyle = c2; g.lineWidth = L * 0.04; g.beginPath(); g.moveTo(cx + L * 0.09, cy - L * 0.18); g.bezierCurveTo(cx + L * 0.18, cy - L * 0.02, cx - L * 0.05, cy + L * 0.12, cx + L * 0.05, cy + L * 0.26); g.stroke();
  g.fillStyle = c1; g.beginPath(); g.ellipse(cx + L * 0.06, cy - L * 0.3, L * 0.09, L * 0.07, 0.3, 0, 7); g.fill(); g.lineWidth = L * 0.04; g.strokeStyle = c1; g.beginPath(); g.moveTo(cx + L * 0.1, cy - L * 0.3); g.lineTo(cx + L * 0.25, cy - L * 0.25); g.stroke();
  eye(g, cx + L * 0.08, cy - L * 0.32, L * 0.025);
}
function jelly(g, a, cx, cy, L) {
  g.globalAlpha = 0.85; g.shadowColor = '#bfe0ff'; g.shadowBlur = L * 0.15;
  g.strokeStyle = 'rgba(200,225,255,0.8)'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const x = cx - L * 0.2 + i * L * 0.05; g.beginPath(); g.moveTo(x, cy); g.bezierCurveTo(x + 6, cy + L * 0.12, x - 6, cy + L * 0.24, x + 3, cy + L * 0.38); g.stroke(); }
  const gr = g.createRadialGradient(cx, cy - L * 0.1, 2, cx, cy - L * 0.05, L * 0.28); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(180,215,255,0.55)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, L * 0.27, L * 0.2, 0, Math.PI, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(240,160,220,0.8)'; g.lineWidth = 2; for (const s of [-1, 1]) for (const t of [0.5, 1]) { g.beginPath(); g.arc(cx + s * L * 0.06 * t, cy - L * 0.07, L * 0.035, 0, 7); g.stroke(); }
}
function oar(g, a, cx, cy, L) {
  const [c1, c2] = a.body, fin = a.fin, H = L * 0.07;
  const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([cx + L * 0.47 - u * L * 0.94, cy + Math.sin(u * 5 + 0.5) * L * 0.05 * u]); }
  g.strokeStyle = fin; g.lineWidth = H * 0.5; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y - H * 0.55) : g.moveTo(x, y - H * 0.55)); g.stroke();
  g.lineCap = 'round'; g.strokeStyle = shade(c1, -0.1); g.lineWidth = H * 1.3; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  g.strokeStyle = c2; g.lineWidth = H * 0.7; g.stroke();
  g.strokeStyle = 'rgba(120,140,170,0.6)'; g.lineWidth = 1; for (let i = 2; i < 40; i += 3) { const [x, y] = pts[i]; g.beginPath(); g.moveTo(x, y - H * 0.4); g.lineTo(x - 3, y + H * 0.4); g.stroke(); }
  g.strokeStyle = fin; g.lineWidth = H * 0.35; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(cx + L * 0.43, cy - H * 0.5); g.quadraticCurveTo(cx + L * 0.43 - i * 4, cy - H * 2.5, cx + L * 0.36 - i * 6, cy - H * (3 + i * 0.4)); g.stroke(); }
  eye(g, cx + L * 0.44, cy - H * 0.05, H * 0.35);
}


export function pats(g, a, o) {
  const { L, H, cx, cy, xn, xt, back } = o; const pc = a.pc || shade(back, -0.35);
  if (a.pat === 'line') { g.strokeStyle = pc; g.lineWidth = H * 0.09; g.beginPath(); g.moveTo(xn - L * 0.12, cy - H * 0.04); g.quadraticCurveTo(cx, cy - H * 0.1, xt, cy); g.stroke(); }
  if (a.pat === 'bands') { g.fillStyle = pc; g.globalAlpha = 0.5; for (let i = 0; i < 6; i++) { const x = xt + L * 0.06 + i * L * 0.11; g.fillRect(x, cy - H, L * 0.045, H * 2); } g.globalAlpha = 1; }
  if (a.pat === 'rainbow') { const r = g.createLinearGradient(0, cy - H * 0.14, 0, cy + H * 0.14); r.addColorStop(0, 'rgba(239,143,168,0)'); r.addColorStop(0.5, pc); r.addColorStop(1, 'rgba(239,143,168,0)'); g.fillStyle = r; g.fillRect(xt, cy - H * 0.16, L * 0.8, H * 0.3); }
  if (a.pat === 'wave') { g.strokeStyle = pc; g.lineWidth = H * 0.06; for (let i = 0; i < 7; i++) { const x = xt + L * 0.05 + i * L * 0.1; g.beginPath(); g.moveTo(x, cy - H * 0.55); g.quadraticCurveTo(x + L * 0.05, cy - H * 0.3, x, cy - H * 0.08); g.stroke(); } }
  if (a.pat === 'blotch') { g.fillStyle = pc; g.globalAlpha = 0.55; for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(xt + L * 0.08 + i * L * 0.1, cy + (i % 2 ? -1 : 1) * H * 0.12, L * 0.05, H * 0.2, 0.3, 0, 7); g.fill(); } g.globalAlpha = 1; }
  if (a.pat === 'clown') { for (const [x, w] of [[xn - L * 0.18, 0.07], [cx - L * 0.02, 0.08], [xt + L * 0.05, 0.05]]) { g.fillStyle = '#20161a'; g.fillRect(x - L * (w / 2 + 0.012), cy - H, L * (w + 0.024), H * 2); g.fillStyle = '#fff'; g.fillRect(x - L * w / 2, cy - H, L * w, H * 2); } }
  if (a.pat === 'spots' || a.dots) { g.fillStyle = a.dots === 2 ? '#7fd3ff' : pc; for (let i = 0; i < 16; i++) { const u = (i * 0.618) % 1, v = (i * 0.37) % 1; g.beginPath(); g.arc(xt + L * 0.05 + u * L * 0.6, cy - H * 0.45 + v * H * (a.dots === 2 ? 0.55 : 0.7), L * (a.dots === 2 ? 0.008 : 0.012), 0, 7); g.fill(); } }
  if (a.spot) { g.fillStyle = a.spot; g.beginPath(); g.ellipse(cx + L * 0.2, cy - H * 0.02, L * 0.03, H * 0.1, 0, 0, 7); g.fill(); }
  if (a.scale) { g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(xt + L * 0.06 + i * L * 0.075 + (j % 2) * L * 0.037, cy - H * 0.36 + j * H * 0.22, L * 0.035, -1.2, 1.2); g.stroke(); } }
  if (a.scar) { g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = L * 0.008; g.beginPath(); g.moveTo(cx, cy - H * 0.3); g.lineTo(cx - L * 0.06, cy + H * 0.05); g.stroke(); }
}
