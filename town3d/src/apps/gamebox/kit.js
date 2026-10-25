// ゲーム機の共通部品:キャンバス・2人(上下)の入力・文字・ボタン・効果音・CPUの相手
// 画面は縦。下=プレイヤー1(手前)、上=プレイヤー2(向かい側。2人で遊ぶときは上下さかさまに表示)

export const INK = '#5a4a6b';
export const COL = { p1: '#ff7aa2', p2: '#5aa8f0', p1d: '#d4517c', p2d: '#3b7fc4', gold: '#ffd36b', mint: '#8fe0b0', bg: '#fff8ef' };

// CPU の相手(町の住人)。lv:1よわい〜3つよい
export const CPUS = [
  { id: 'chunk', name: 'チャンクくん', lv: 1, icon: '☁️', say: ['Let\'s play!', 'Oops!', 'Yay!'] },
  { id: 'mii', name: 'ミイ', lv: 1, icon: '🐱', say: ['Good luck~', 'Nice one!', 'Hehe, I won!'] },
  { id: 'suna', name: '砂吹さん', lv: 2, icon: '🎣', say: ['Take it easy.', 'Well done.', 'Not bad, huh?'] },
  { id: 'baron', name: 'ハッタリ男爵', lv: 2, icon: '🎩', say: ['Splendid!', 'Impossible!', 'Ha ha ha!'] },
  { id: 'gon', name: 'ゴン', lv: 3, icon: '🦊', say: ['Bring it on!', 'No way!', 'Too easy!'] },
];
export const cpuById = id => CPUS.find(c => c.id === id) || CPUS[0];

// キャンバス(画面の大きさに合わせる)
export function surface(box) {
  const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block';
  box.appendChild(cv);
  const g = cv.getContext('2d'); const S = { cv, g, W: 10, H: 10, dpr: 1 };
  S.resize = () => { const r = box.getBoundingClientRect(); S.dpr = Math.min(2, window.devicePixelRatio || 1); S.W = Math.max(10, r.width); S.H = Math.max(10, r.height); cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr); };
  S.resize();
  S.begin = () => { g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); };
  return S;
}

// 指(マルチタッチ)。onDown/onMove/onUp(p) p={id,x,y,side:0(下)|1(上),t}
export function pointers(cv, h) {
  const live = new Map();
  const pos = e => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; return { id: e.pointerId, x, y, side: y < r.height / 2 ? 1 : 0, t: performance.now() }; };
  const dn = e => { e.preventDefault(); const p = pos(e); live.set(e.pointerId, p); try { cv.setPointerCapture(e.pointerId); } catch (_) { } h.onDown && h.onDown(p); };
  const mv = e => { if (!live.has(e.pointerId)) return; const p = pos(e); p.side = live.get(e.pointerId).side; live.set(e.pointerId, p); h.onMove && h.onMove(p); };
  const up = e => { if (!live.has(e.pointerId)) return; const p = pos(e); p.side = live.get(e.pointerId).side; live.delete(e.pointerId); h.onUp && h.onUp(p); };
  cv.addEventListener('pointerdown', dn); cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  return { live, off() { cv.removeEventListener('pointerdown', dn); cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); } };
}

// 文字。flip=上の人向け(さかさま)
export function txt(g, s, x, y, o = {}) {
  const { size = 16, color = INK, align = 'center', weight = 800, flip = false, stroke = null, sw = 4, base = 'middle', font = 'sans-serif', maxW } = o;
  g.save(); g.translate(x, y); if (flip) g.rotate(Math.PI);
  g.font = `${weight} ${size}px ${font}`; g.textAlign = align; g.textBaseline = base;
  if (stroke) { g.lineJoin = 'round'; g.lineWidth = sw; g.strokeStyle = stroke; g.strokeText(s, 0, 0, maxW); }
  g.fillStyle = color; g.fillText(s, 0, 0, maxW); g.restore();
}
// 折り返し文字(行の配列を返して描く)
export function wrapTxt(g, s, x, y, w, o = {}) {
  const size = o.size || 16, lh = o.lh || size * 1.35; g.font = `${o.weight || 800} ${size}px sans-serif`;
  const lines = []; let cur = '';
  for (const ch of String(s)) { if (ch === '\n') { lines.push(cur); cur = ''; continue; } if (g.measureText(cur + ch).width > w && cur) { lines.push(cur); cur = ch; } else cur += ch; }
  if (cur) lines.push(cur);
  const top = y - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => { const yy = o.flip ? y + (lines.length - 1) * lh / 2 - i * lh : top + i * lh; txt(g, l, x, yy, o); });
  return lines.length;
}
export function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
// ボタン(描画とあたり判定)
export function btn(g, b, o = {}) {
  const { fill = '#fff', color = INK, size = 15, flip = false, shadow = true, border = null, alpha = 1, font, weight } = o;
  g.save(); g.globalAlpha = alpha;
  if (shadow) { g.fillStyle = 'rgba(0,0,0,0.15)'; rr(g, b.x, b.y + 3, b.w, b.h, b.r ?? 14); g.fill(); }
  g.fillStyle = fill; rr(g, b.x, b.y, b.w, b.h, b.r ?? 14); g.fill();
  if (border) { g.lineWidth = 2.5; g.strokeStyle = border; g.stroke(); }
  if (b.label != null) txt(g, b.label, b.x + b.w / 2, b.y + b.h / 2 + (flip ? -1 : 1), { size, color, flip, maxW: b.w - 8, font, weight });
  g.restore();
}
export const hit = (b, p) => b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

export function shuffle(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;

// 効果音(その場で作る)
export function createSfx(vol = 0.6) {
  let ac = null, out = null, nb = null;
  const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = vol; out.connect(ac.destination); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; };
  const noise = () => { if (!nb) { const a = ctx(); nb = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nb; };
  function tone(f, dur, { type = 'sine', g = 0.18, slide = 1, delay = 0 } = {}) {
    const a = ctx(); if (!a || vol <= 0) return; const t = a.currentTime + delay, o = a.createOscillator(), v = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(g, t + 0.006); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v).connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function burst(dur, { f = 1200, q = 0.8, type = 'bandpass', g = 0.25, slide = 1, delay = 0 } = {}) {
    const a = ctx(); if (!a || vol <= 0) return; const t = a.currentTime + delay, s = a.createBufferSource(); s.buffer = noise();
    const fl = a.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); if (slide !== 1) fl.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    const v = a.createGain(); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl).connect(v).connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };
  const S = {
    tap: () => tone(880, 0.06, { type: 'triangle', g: 0.12 }),
    pick: () => tone(660, 0.07, { type: 'triangle', g: 0.13, slide: 1.3 }),
    ok: () => { tone(784, 0.1, { type: 'triangle' }); tone(1175, 0.16, { type: 'triangle', delay: 0.07 }); },
    ng: () => { tone(220, 0.22, { type: 'square', g: 0.06, slide: 0.7 }); vib(60); },
    buzz: () => { tone(1046, 0.18, { type: 'square', g: 0.08 }); vib(30); },
    point: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.14, { type: 'triangle', g: 0.14, delay: i * 0.07 })); },
    hit: v => { tone(300 + (v || 0.5) * 300, 0.06, { type: 'square', g: 0.07 + 0.06 * (v || 0.5) }); burst(0.05, { f: 2400, g: 0.12 }); },
    wall: () => tone(180, 0.05, { type: 'triangle', g: 0.1 }),
    goal: () => { burst(0.4, { f: 900, g: 0.25, slide: 0.5 }); [392, 523, 659, 784].forEach((f, i) => tone(f, 0.16, { type: 'triangle', g: 0.14, delay: i * 0.06 })); vib([40, 30, 60]); },
    boom: () => { burst(0.7, { f: 400, type: 'lowpass', g: 0.5, slide: 0.3 }); tone(70, 0.6, { g: 0.35, slide: 0.4 }); vib([120, 50, 120]); },
    tick: k => tone(1400 + (k || 0) * 300, 0.03, { type: 'square', g: 0.04 }),
    pop: () => { burst(0.25, { f: 2000, g: 0.4, slide: 0.3 }); vib(50); },
    whoosh: () => burst(0.3, { f: 600, slide: 4, q: 1.2, g: 0.2 }),
    item: () => { [880, 1175, 1568].forEach((f, i) => tone(f, 0.09, { type: 'square', g: 0.05, delay: i * 0.05 })); },
    count: () => tone(660, 0.12, { type: 'triangle', g: 0.15 }),
    go: () => { tone(988, 0.3, { type: 'triangle', g: 0.18 }); tone(1318, 0.3, { type: 'triangle', g: 0.1 }); },
    win: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.2, { type: 'triangle', g: 0.15, delay: i * 0.1 })); },
    lose: () => { [392, 330, 262].forEach((f, i) => tone(f, 0.25, { type: 'triangle', g: 0.13, delay: i * 0.14 })); },
    throw: () => burst(0.18, { f: 1400, slide: 0.5, g: 0.15 }),
    splat: () => { burst(0.2, { f: 700, type: 'lowpass', g: 0.35 }); vib(30); },
  };
  return { play(n, a) { try { S[n] && S[n](a); } catch (e) { } }, unlock() { ctx(); }, vib, tone, burst, close() { try { ac && ac.close(); } catch (e) { } ac = null; } };
}

// 英語の読み上げ(なければ null を返す)
export function speak(text, rate = 0.92) {
  try {
    if (!window.speechSynthesis) return false;
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = rate;
    const v = speechSynthesis.getVoices().find(v => /en[-_]US/i.test(v.lang)) || speechSynthesis.getVoices().find(v => /^en/i.test(v.lang)); if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
  } catch (e) { return false; }
}

// 毎フレーム(止めるときは戻り値を呼ぶ)
export function loop(fn) {
  let raf = 0, last = 0, alive = true;
  const f = ts => { if (!alive) return; raf = requestAnimationFrame(f); const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts; fn(dt); };
  raf = requestAnimationFrame(f);
  return () => { alive = false; cancelAnimationFrame(raf); };
}
// 両方の人に見える大きな文字(2人のときは上にもさかさまで)
export function banner(g, S, two, text, o = {}) {
  const y = o.y ?? S.H * 0.5;
  txt(g, text, S.W / 2, two ? S.H * 0.75 : y, { size: o.size || 34, color: o.color || '#fff', stroke: o.stroke || INK, sw: 6 });
  if (two) txt(g, text, S.W / 2, S.H * 0.25, { size: o.size || 34, color: o.color || '#fff', stroke: o.stroke || INK, sw: 6, flip: true });
}

// 上下の半分ずつ描く。ローカル座標は「中央線が y=0、自分の手前(画面のはし)へ向かって y が増える」
//   half(side, fn(up)) : up=true は CPU 側(上)で、文字をさかさにしない描き方をする(txt の flip に up を渡す)
//   local(p, side) : 画面の点 → その人のローカル座標
export function halves(S, two) {
  const g = S.g;
  return {
    half(side, fn) { const h = S.H / 2; g.save(); if (side === 0) g.translate(0, h); else { g.translate(S.W, h); g.rotate(Math.PI); } fn(side === 1 && !two); g.restore(); },
    local(p, side) { const h = S.H / 2; return side === 0 ? { x: p.x, y: p.y - h } : { x: S.W - p.x, y: h - p.y }; },
    T(up, s, x, y, o = {}) { const a = o.align; txt(g, s, x, y, { ...o, flip: up, align: up && a ? (a === 'left' ? 'right' : a === 'right' ? 'left' : a) : a }); },
  };
}
// 英字キーボード(半分の中に描く)。押された文字を返す
export function keyboard(W, y0) {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'], keys = [], kw = (W - 16) / 10, kh = 40;
  rows.forEach((r, i) => { const off = (W - r.length * kw) / 2; [...r].forEach((ch, j) => keys.push({ x: off + j * kw + 2, y: y0 + i * (kh + 4), w: kw - 4, h: kh, label: ch, k: ch })); });
  const by = y0 + 3 * (kh + 4); keys.push({ x: 8, y: by, w: W * 0.3, h: kh, label: '⌫', k: 'del' }); keys.push({ x: W * 0.3 + 14, y: by, w: W * 0.7 - 22, h: kh, label: 'これで答える', k: 'ok' });
  return keys;
}
