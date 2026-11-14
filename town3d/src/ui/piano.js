// ストリートピアノ:曲をえらぶ → 「おまかせで弾く」(キャラが自動で弾く)/「自分で弾く」(落ちてくる音符をタップ)
import { SONGS, songNotes } from '../world/songs.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function openPianoMenu({ hud, onAuto, onTap, onClose }) {
  const p = hud.panel(`<h2>🎹 ストリートピアノ</h2>
    <p class="tw-note">曲をえらんでね。「おまかせ」はキャラが弾くよ。「自分で」は落ちてくる音符を、線のところでタップ。</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin:8px 0">${SONGS.map(s => `<div style="display:flex;align-items:center;gap:6px;background:#fff;border-radius:14px;padding:8px 10px"><b style="flex:1;font-size:14px">${esc(s.name)}</b><button class="tw-btn" data-auto="${s.id}" style="padding:7px 12px;font-size:13px">▶ おまかせ</button><button class="tw-btn main" data-tap="${s.id}" style="padding:7px 12px;font-size:13px">🎹 自分で</button></div>`).join('')}</div>
    <div class="tw-actions"><button class="tw-btn" data-x>とじる</button></div>`, (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.auto) { hud.closePanel(); onAuto(b.dataset.auto); }
    else if (b.dataset.tap) { hud.closePanel(); onTap(b.dataset.tap); }
    else if (b.hasAttribute('data-x')) { hud.closePanel(); onClose?.(); }
  });
  p.classList.add('tw-low');
}

// おまかせで弾く:音を予約して、長さ(秒)を返す
export function playSong(audio, id, rate = 1) {
  const notes = songNotes(id); let end = 0;
  for (const n of notes) { audio.play('piano', [n.f, n.d / rate, n.t / rate + 0.15, 1]); end = Math.max(end, (n.t + n.d) / rate); }
  return end + 0.6;
}

// 自分で弾く:4つのレーン。音符は高さの順にレーンへ。線(下のほう)にきたらタップ
export function runTapGame({ root, audio, id, onEnd }) {
  const notes = songNotes(id).map(n => ({ ...n, lane: Math.min(3, Math.floor(n.k / Math.max(1, n.n) * 4)), hit: 0 }));
  const name = (SONGS.find(s => s.id === id) || {}).name || '';
  const ov = document.createElement('div');
  ov.style.cssText = 'position:absolute;inset:0;z-index:40;background:linear-gradient(#2a2240ee,#3d3157ee);touch-action:none;user-select:none;-webkit-user-select:none';
  ov.innerHTML = `<canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas><button data-q style="position:absolute;left:10px;top:10px;z-index:2;border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:800;background:#fffaf2;color:#5a4a6b">✕ やめる</button>`;
  root.appendChild(ov);
  const cv = ov.querySelector('canvas'), g = cv.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const size = () => { W = ov.clientWidth; H = ov.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size();
  const LEAD = 2.0, LINE = () => H - 150, laneX = i => (W / 4) * i, t0 = performance.now() / 1000 + 1.6;
  let combo = 0, best = 0, flash = [0, 0, 0, 0], msg = '', msgT = 0, raf = 0, done = false;
  const now = () => performance.now() / 1000 - t0;
  const end = notes.length ? notes[notes.length - 1].t + notes[notes.length - 1].d + 1.2 : 2;
  function hitLane(i) {
    const t = now(); flash[i] = 0.18;
    let best = null, bd = 0.2;
    for (const n of notes) if (!n.hit && n.lane === i) { const d = Math.abs(n.t - t); if (d < bd) { bd = d; best = n; } }
    if (best) { best.hit = bd < 0.08 ? 2 : 1; audio.play('piano', [best.f, best.d, 0, 1]); combo++; if (combo > best_c()) setBest(combo); msg = best.hit === 2 ? 'Perfect!' : 'Good'; msgT = 0.5; }
    else { combo = 0; }
  }
  let bestC = 0; const best_c = () => bestC, setBest = v => { bestC = v; };
  ov.addEventListener('pointerdown', e => {
    if (e.target.closest('[data-q]')) { finish(true); return; }
    const r = cv.getBoundingClientRect(); hitLane(Math.max(0, Math.min(3, Math.floor((e.clientX - r.left) / (r.width / 4)))));
  });
  const keyMap = { d: 0, f: 1, j: 2, k: 3 };
  const kd = e => { if (e.key in keyMap) { e.preventDefault(); hitLane(keyMap[e.key]); } };
  window.addEventListener('keydown', kd);
  let last = performance.now();
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    const t = now();
    for (const n of notes) if (!n.hit && t > n.t + 0.2) { n.hit = -1; combo = 0; }
    g.clearRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)'; g.fillRect(laneX(i), 0, W / 4, H);
      if (flash[i] > 0) { flash[i] -= dt; g.fillStyle = `rgba(255,214,107,${flash[i] * 2})`; g.fillRect(laneX(i), LINE() - 30, W / 4, 60); }
    }
    g.fillStyle = '#ffd36b'; g.fillRect(0, LINE() - 2, W, 4);
    for (const n of notes) {
      if (n.hit > 0) continue;
      const y = LINE() - (n.t - t) / LEAD * (LINE() - 40); if (y < -40 || y > H + 40) continue;
      const h = Math.max(22, n.d / LEAD * (LINE() - 40) * 0.6);
      g.fillStyle = n.hit < 0 ? 'rgba(255,255,255,0.25)' : ['#ff9fb4', '#ffd36b', '#9fe0c0', '#a8c8ff'][n.lane];
      g.beginPath(); g.roundRect(laneX(n.lane) + 8, y - h, W / 4 - 16, h, 10); g.fill();
    }
    g.fillStyle = '#fff'; g.font = '800 15px sans-serif'; g.textAlign = 'center';
    g.fillText(`🎹 ${name}`, W / 2, 30);
    if (combo > 1) { g.font = '900 26px sans-serif'; g.fillText(`${combo} combo`, W / 2, H * 0.35); }
    if (msgT > 0) { msgT -= dt; g.font = '900 22px sans-serif'; g.fillStyle = '#ffd36b'; g.fillText(msg, W / 2, LINE() - 50); }
    if (t < 0) { g.font = '900 40px sans-serif'; g.fillStyle = '#fff'; g.fillText(String(Math.ceil(-t)), W / 2, H * 0.45); }
    g.font = '700 12px sans-serif'; g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 4; i++) g.fillText('タップ', laneX(i) + W / 8, LINE() + 30);
    if (t > end && !done) finish(false);
  }
  raf = requestAnimationFrame(frame);
  function finish(quit) {
    if (done) return; done = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); ov.remove();
    const hit = notes.filter(n => n.hit > 0).length, per = notes.filter(n => n.hit === 2).length;
    onEnd?.({ quit, hit, per, total: notes.length, combo: bestC, name });
  }
  return { stop: () => finish(true) };
}
