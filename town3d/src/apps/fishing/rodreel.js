// 釣りの「竿をうごかして巻く」を、指を離さない1本の操作にしたもの。
//   ① 矢印の向きにスライド(持ち上げる↑ / 左右にたおす←→ / はねたら下げる↓。大物は持ち上げ2回)
//   ② 指を離さずに、そのまま画面のどこでもぐるぐる回す → 回した分だけじわじわ巻ける(円の中心は指の動きから自動で測る)
//   指を離すと巻きは止まる(進みは残る)。もう一度さわると、①からやりなおし。
//   opt: {kind:'lift'|'left'|'right'|'down', lifts(1|2), turns, label, sfx, onStroke(), onMove(p), onProgress(p 0..1), onDone()}
const DIR = { lift: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LAB = { lift: ['🎣 竿を持ち上げろ！', '🎣 もういちど持ち上げろ！'], down: ['⬇ はねた！ 竿を下げろ！'], left: ['⬅ 左にたおせ！'], right: ['右にたおせ！ ➡'] };
export function rodReel(parent, opt) {
  const kind = DIR[opt.kind] ? opt.kind : 'lift', [ux, uy] = DIR[kind];
  const S = Math.min(250, Math.round(Math.min(parent.clientWidth || 360, parent.clientHeight || 640) * 0.62)), need = Math.max(70, S * 0.38);
  const root = document.createElement('div'); root.className = 'fz-rodreel';
  root.style.cssText = 'position:absolute;left:0;right:0;top:60px;bottom:0;z-index:3;touch-action:none;pointer-events:auto;user-select:none;-webkit-user-select:none';
  const rot = Math.atan2(uy, ux) * 180 / Math.PI + 90, C = 2 * Math.PI * 44;
  root.innerHTML = `<style>@keyframes fzrp{0%{transform:translateY(16px);opacity:.25}50%{opacity:1}100%{transform:translateY(-16px);opacity:.25}}@keyframes fzrs{to{transform:rotate(360deg)}}
    .fz-rodreel .ar{animation:fzrp .9s ease-in-out infinite}.fz-rodreel .sp{transform-origin:50px 50px;animation:fzrs 1.6s linear infinite}.fz-rodreel.hold .ar,.fz-rodreel.hold .sp{animation-play-state:paused}</style>
    <div class="hud" style="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);width:${S}px;height:${S}px;margin-left:${-S / 2}px;pointer-events:none">
      <div class="lb" style="position:absolute;left:50%;top:-30px;transform:translateX(-50%);white-space:nowrap;font-weight:900;font-size:20px;color:#fff;background:#e0556b;border-radius:999px;padding:4px 16px;box-shadow:0 2px 8px #0005"></div>
      <svg viewBox="0 0 100 100" width="${S}" height="${S}" style="display:block;overflow:visible">
        <circle cx="50" cy="50" r="48" fill="rgba(20,30,50,.45)"/>
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="7"/>
        <circle class="pg" cx="50" cy="50" r="44" fill="none" stroke="#ffd166" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 50 50)"/>
        <g class="gs"><g transform="rotate(${rot} 50 50)"><g class="ar"><path d="M50 16 L72 44 L58 44 L58 76 L42 76 L42 44 L28 44 Z" fill="#fff" stroke="#e0556b" stroke-width="3" stroke-linejoin="round"/></g></g></g>
        <g class="gr" style="display:none"><g class="sp"><path d="M50 18 A32 32 0 1 1 22 34" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M13 27 L24 41 L33 27 Z" fill="#fff" transform="rotate(8 22 34)"/></g></g>
        <text x="50" y="57" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" class="pc" style="display:none">0%</text>
      </svg></div>`;
  parent.appendChild(root);
  const lb = root.querySelector('.lb'), pg = root.querySelector('.pg'), gs = root.querySelector('.gs'), gr = root.querySelector('.gr'), pc = root.querySelector('.pc');
  const lifts = kind === 'lift' ? (opt.lifts || 1) : 1;
  let stroke = 0, mode = 'stroke', pid = null, x0 = 0, y0 = 0, p = 0, done = false, snd = 0, pts = [], recent = [];
  const turns = Math.max(0.3, opt.turns || 1.5);
  const label = () => { lb.textContent = mode === 'stroke' ? (opt.label || (LAB[kind][stroke] || LAB[kind][0])) : '🎣 指を離さずに、ぐるぐる回して巻け！'; };
  const show = () => { gs.style.display = mode === 'stroke' ? '' : 'none'; gr.style.display = mode === 'reel' ? '' : 'none'; pc.style.display = mode === 'reel' || p > 0 ? '' : 'none'; label(); };
  const draw = () => { pg.setAttribute('stroke-dashoffset', String(C * (1 - p))); pc.textContent = Math.round(p * 100) + '%'; };
  show(); draw();
  const sfx = opt.sfx;
  root.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); if (done) return; pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; pts = [[e.clientX, e.clientY]]; recent = [];
    try { root.setPointerCapture(pid); } catch (x) { } root.classList.remove('hold'); try { sfx && sfx.unlock && sfx.unlock(); } catch (x) { }
    if (mode === 'reel') { mode = 'stroke'; stroke = 0; show(); }   // 離したあとは、持ち上げからやりなおし
  });
  root.addEventListener('pointermove', e => {
    if (e.pointerId !== pid || done) return; e.preventDefault();
    const x = e.clientX, y = e.clientY;
    if (mode === 'stroke') {
      const dx = x - x0, dy = y - y0, along = dx * ux + dy * uy, across = Math.abs(dx * uy) + Math.abs(dy * ux), q = Math.max(0, Math.min(1, along / need)) * (across > along + 30 ? 0.5 : 1);
      try { opt.onMove && opt.onMove(q); } catch (z) { }
      if (q >= 1) {
        stroke++; try { navigator.vibrate && navigator.vibrate(18); } catch (z) { } try { sfx && sfx.play && sfx.play('whoosh'); } catch (z) { }
        if (stroke >= lifts) { mode = 'reel'; try { opt.onStroke && opt.onStroke(); } catch (z) { } pts = [[x, y]]; recent = []; }
        else { x0 = x; y0 = y; }   // 持ち上げ2回めは、そのまま続けてもういちど
        show();
      }
      return;
    }
    // 巻く:指が回った角度を、指のうごきの中心(直近の点の平均)から測る
    pts.push([x, y]); if (pts.length > 14) pts.shift(); if (pts.length < 4) return;
    let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length;
    const a = pts[pts.length - 2], b = pts[pts.length - 1], r = Math.hypot(b[0] - cx, b[1] - cy);
    if (r < 10 || r > 160) return;
    let d = Math.atan2(b[1] - cy, b[0] - cx) - Math.atan2(a[1] - cy, a[0] - cx); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    recent.push(d); if (recent.length > 8) recent.shift(); const dom = recent.reduce((s, v) => s + v, 0);
    if (d * dom <= 0) return;   // 同じ向きに回っている時だけ数える(行ったり来たりは数えない)
    p = Math.min(1, p + Math.abs(d) / (2 * Math.PI) / turns); draw();
    try { sfx && sfx.reel(Math.min(1, 0.3 + Math.abs(d) * 4)); } catch (z) { }
    if (performance.now() - snd > 260) { snd = performance.now(); try { navigator.vibrate && navigator.vibrate(12); } catch (z) { } }
    try { opt.onProgress && opt.onProgress(p); } catch (z) { }
    if (p >= 1) fin();
  });
  const up = e => { if (e.pointerId !== pid) return; pid = null; root.classList.add('hold'); try { sfx && sfx.reel(0); } catch (x) { } try { opt.onMove && opt.onMove(0); } catch (x) { } };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  function fin() { if (done) return; done = true; try { sfx && sfx.reel(0); } catch (x) { } try { opt.onDone && opt.onDone(); } catch (x) { } }
  return { destroy() { done = true; try { sfx && sfx.reel(0); } catch (x) { } root.remove(); } };
}
