// 釣りの「竿をあやつって巻く」:指を置いたままの1本の操作。
//   ・指を置いた位置から、指(円の中心)を上下左右にずらすと、画面の竿がそのまま(大げさに)動く。
//   ・竿を持ち上げたまま、指を離さずに、画面のどこでもぐるぐる回すと、回した分だけじわじわ巻ける。
//   ・竿が上がっていない時だけ「持ち上げろ！」が出る。魚が走る(←→)/はねる(↓)時は、その向きに竿を動かさないと巻きが遅くなる(止まりはしない)。
//   ・指を離すと巻きは止まる(進みは残る)。
//   opt: {turns, events(魚が走る/はねる回数), jump(はねる魚か), sfx, onEvent('left'|'right'|'jump'|'end'), onPose({x,y}|null), onProgress(p), onDone()}
const ARROW = { lift: 0, right: 90, down: 180, left: 270 };
export function rodReel(parent, opt) {
  const S = Math.min(250, Math.round(Math.min(parent.clientWidth || 360, parent.clientHeight || 640) * 0.62)), reach = Math.max(70, S * 0.42);
  const root = document.createElement('div'); root.className = 'fz-rodreel';
  root.style.cssText = 'position:absolute;left:0;right:0;top:60px;bottom:0;z-index:3;touch-action:none;pointer-events:auto;user-select:none;-webkit-user-select:none';
  const C = 2 * Math.PI * 44;
  root.innerHTML = `<style>@keyframes fzrp{0%{transform:translateY(16px);opacity:.25}50%{opacity:1}100%{transform:translateY(-16px);opacity:.25}}@keyframes fzrs{to{transform:rotate(360deg)}}
    .fz-rodreel .ar{animation:fzrp .9s ease-in-out infinite}.fz-rodreel .sp{transform-origin:50px 50px;animation:fzrs 1.6s linear infinite}.fz-rodreel.hold .sp{animation-play-state:paused}</style>
    <div class="hud" style="position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);width:${S}px;height:${S}px;margin-left:${-S / 2}px;pointer-events:none">
      <div class="lb" style="position:absolute;left:50%;top:-30px;transform:translateX(-50%);white-space:nowrap;font-weight:900;font-size:20px;color:#fff;background:#e0556b;border-radius:999px;padding:4px 16px;box-shadow:0 2px 8px #0005"></div>
      <svg viewBox="0 0 100 100" width="${S}" height="${S}" style="display:block;overflow:visible">
        <circle cx="50" cy="50" r="48" fill="rgba(20,30,50,.45)"/>
        <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="7"/>
        <circle class="pg" cx="50" cy="50" r="44" fill="none" stroke="#ffd166" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 50 50)"/>
        <g class="gs" style="display:none"><g class="ro"><g class="ar"><path d="M50 16 L72 44 L58 44 L58 76 L42 76 L42 44 L28 44 Z" fill="#fff" stroke="#e0556b" stroke-width="3" stroke-linejoin="round"/></g></g></g>
        <g class="gr"><g class="sp"><path d="M50 18 A32 32 0 1 1 22 34" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M13 27 L24 41 L33 27 Z" fill="#fff" transform="rotate(8 22 34)"/></g></g>
        <text x="50" y="57" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" class="pc">0%</text>
      </svg></div>`;
  parent.appendChild(root);
  const lb = root.querySelector('.lb'), pg = root.querySelector('.pg'), gs = root.querySelector('.gs'), ro = root.querySelector('.ro'), gr = root.querySelector('.gr'), pc = root.querySelector('.pc');
  const turns = Math.max(0.5, opt.turns || 4);
  let pid = null, ax = 0, ay = 0, pts = [], recent = [], pose = { x: 0, y: 0 }, p = 0, done = false, snd = 0, ev = null, evLeft = opt.events || 0, shown = '';
  const thr = evLeft >= 2 ? [0.28, 0.62] : [0.45];
  const okNow = () => { const k = ev ? ev.kind : 'lift'; return k === 'lift' ? pose.y > 0.35 : k === 'left' ? pose.x < -0.35 : k === 'right' ? pose.x > 0.35 : pose.y < 0.1; };
  const need = () => ev ? (ev.kind === 'jump' ? 'down' : ev.kind) : 'lift';
  const LAB = { lift: '🎣 竿を持ち上げろ！', left: '⬅ 左にたおせ！', right: '右にたおせ！ ➡', down: '⬇ はねた！ 竿を下げろ！' };
  const ui = () => {   // 出す文字・矢印は、足りない時だけ
    let key, lab, arrow = null;
    if (pid == null) { key = 'idle'; lab = '👆 指をおいて、持ち上げて、ぐるぐる回そう'; arrow = ev ? need() : 'lift'; }
    else if (!okNow()) { key = 'need' + need(); lab = LAB[need()]; arrow = need(); }
    else { key = 'ok'; lab = '🎣 ぐるぐる回して巻け！'; }
    if (key === shown) return; shown = key; lb.textContent = lab;
    gs.style.display = arrow ? '' : 'none'; gr.style.display = arrow ? 'none' : ''; if (arrow) ro.setAttribute('transform', `rotate(${ARROW[arrow]} 50 50)`);
  };
  const draw = () => { pg.setAttribute('stroke-dashoffset', String(C * (1 - p))); pc.textContent = Math.round(p * 100) + '%'; };
  const emitPose = () => { try { opt.onPose && opt.onPose(pid == null ? null : pose); } catch (x) { } };
  const sfx = opt.sfx;
  draw(); ui();
  const tick = setInterval(() => {   // 魚が走る/はねる合図と、その終わり
    if (done) return;
    if (ev) { ev.t += 0.1; if (pid != null && okNow()) ev.hold += 0.1; if (ev.hold >= 1.1 || ev.t > 7) { ev = null; shown = ''; try { opt.onEvent && opt.onEvent('end'); } catch (x) { } ui(); } }
    else if (pid != null && evLeft > 0 && p >= thr[(opt.events || 0) - evLeft]) {
      evLeft--; const r = Math.random(), kind = opt.jump && r < 0.35 ? 'jump' : r < 0.675 ? 'left' : 'right'; ev = { kind, t: 0, hold: 0 }; shown = '';
      if (kind === 'jump') { try { sfx && sfx.play && sfx.play('jump'); } catch (x) { } } try { opt.onEvent && opt.onEvent(kind); } catch (x) { } ui();
    }
    ui();
  }, 100);
  root.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation(); if (done) return; pid = e.pointerId; ax = e.clientX; ay = e.clientY; pts = [[ax, ay]]; recent = []; pose = { x: 0, y: 0 };
    try { root.setPointerCapture(pid); } catch (x) { } root.classList.remove('hold'); try { sfx && sfx.unlock && sfx.unlock(); } catch (x) { } shown = ''; ui(); emitPose();
  });
  root.addEventListener('pointermove', e => {
    if (e.pointerId !== pid || done) return; e.preventDefault();
    const x = e.clientX, y = e.clientY; pts.push([x, y]); if (pts.length > 14) pts.shift();
    let cx = 0, cy = 0; for (const q of pts) { cx += q[0]; cy += q[1]; } cx /= pts.length; cy /= pts.length;
    const tx = Math.max(-1, Math.min(1, (cx - ax) / reach)), ty = Math.max(-1, Math.min(1, -(cy - ay) / reach));
    pose.x += (tx - pose.x) * 0.4; pose.y += (ty - pose.y) * 0.4; emitPose(); ui();
    // 巻く:指が回った角度を、指のうごきの中心から測る
    if (pts.length < 5) return;
    const a = pts[pts.length - 2], b = pts[pts.length - 1], r = Math.hypot(b[0] - cx, b[1] - cy);
    if (r < 10 || r > 170) return;
    let d = Math.atan2(b[1] - cy, b[0] - cx) - Math.atan2(a[1] - cy, a[0] - cx); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    recent.push(d); if (recent.length > 8) recent.shift(); const dom = recent.reduce((s, v) => s + v, 0);
    if (d * dom <= 0) return;   // 同じ向きに回っている時だけ数える
    const g = okNow() ? 1 : 0.3;   // 竿の向きが合っていないと、巻きが遅い(止まりはしない)
    p = Math.min(1, p + Math.abs(d) / (2 * Math.PI) / turns * g); draw();
    try { sfx && sfx.reel(Math.min(1, 0.3 + Math.abs(d) * 4) * (g < 1 ? 0.5 : 1)); } catch (z) { }
    if (performance.now() - snd > 260) { snd = performance.now(); try { navigator.vibrate && navigator.vibrate(g < 1 ? 5 : 12); } catch (z) { } }
    try { opt.onProgress && opt.onProgress(p); } catch (z) { }
    if (p >= 1) fin();
  });
  const up = e => { if (e.pointerId !== pid) return; pid = null; root.classList.add('hold'); try { sfx && sfx.reel(0); } catch (x) { } shown = ''; ui(); emitPose(); };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
  function stop() { done = true; clearInterval(tick); try { sfx && sfx.reel(0); } catch (x) { } try { opt.onPose && opt.onPose(null); } catch (x) { } if (ev) { ev = null; try { opt.onEvent && opt.onEvent('end'); } catch (x) { } } }
  function fin() { if (done) return; stop(); try { opt.onDone && opt.onDone(); } catch (x) { } }
  return { destroy() { if (!done) stop(); root.remove(); } };
}
