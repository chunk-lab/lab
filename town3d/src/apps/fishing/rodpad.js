// 釣りの「竿の動き」:矢印の向きに指をスライドさせる(持ち上げる=↑ / 魚が走る=← → / 魚がはねた=↓)。できたら onDone。
//   巻き取り(reelwheel.js)の前に出す。reelwheel と同じ場所・同じ大きさ。
//   opt: {kind:'lift'|'left'|'right'|'down', label, sfx, onMove(p 0..1), onDone()}
const DIR = { lift: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export function rodPad(parent, opt) {
  const S = Math.min(250, Math.round(Math.min(parent.clientWidth || 360, parent.clientHeight || 640) * 0.62));
  const [ux, uy] = DIR[opt.kind] || DIR.lift, need = S * 0.42;
  const el = document.createElement('div'); el.className = 'fz-rodpad';
  el.style.cssText = `position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);width:${S}px;height:${S}px;margin-left:${-S / 2}px;z-index:3;touch-action:none;pointer-events:auto;user-select:none;-webkit-user-select:none`;
  const rot = Math.atan2(uy, ux) * 180 / Math.PI + 90;   // 矢印(上向き)を向きに合わせて回す
  el.innerHTML = `<style>@keyframes fzrp{0%{transform:translateY(16px);opacity:.25}50%{opacity:1}100%{transform:translateY(-16px);opacity:.25}}.fz-rodpad .ar{animation:fzrp .9s ease-in-out infinite}.fz-rodpad.go .ar{animation:none;opacity:1}</style>
    <div style="position:absolute;left:50%;top:-30px;transform:translateX(-50%);white-space:nowrap;font-weight:900;font-size:20px;color:#fff;background:#e0556b;border-radius:999px;padding:4px 16px;box-shadow:0 2px 8px #0005;pointer-events:none">${opt.label || '🎣 竿を持ち上げろ！'}</div>
    <svg viewBox="0 0 100 100" width="${S}" height="${S}" style="display:block;overflow:visible">
      <circle cx="50" cy="50" r="48" fill="rgba(20,30,50,.45)"/>
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="3" stroke-dasharray="3 5"/>
      <g transform="rotate(${rot} 50 50)"><g class="ar"><path d="M50 14 L74 44 L58 44 L58 78 L42 78 L42 44 L26 44 Z" fill="#fff" stroke="#e0556b" stroke-width="3" stroke-linejoin="round"/></g></g>
      <path class="pg" d="" fill="none" stroke="#ffd166" stroke-width="6" stroke-linecap="round"/>
    </svg>`;
  parent.appendChild(el);
  const pg = el.querySelector('.pg');
  let pid = null, x0 = 0, y0 = 0, done = false, prog = 0;
  const draw = p => {   // ふちの黄色い線で「あとどのくらい」を見せる
    const a = Math.max(0.001, p) * 2 * Math.PI - Math.PI / 2, s = -Math.PI / 2;
    pg.setAttribute('d', p <= 0 ? '' : `M${50 + 44 * Math.cos(s)} ${50 + 44 * Math.sin(s)} A44 44 0 ${p > .5 ? 1 : 0} 1 ${50 + 44 * Math.cos(a)} ${50 + 44 * Math.sin(a)}`);
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (done) return; pid = e.pointerId; x0 = e.clientX; y0 = e.clientY; try { el.setPointerCapture(pid); } catch (x) { } el.classList.add('go'); try { opt.sfx && opt.sfx.unlock && opt.sfx.unlock(); } catch (x) { } });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== pid || done) return; e.preventDefault();
    const dx = e.clientX - x0, dy = e.clientY - y0, along = dx * ux + dy * uy, across = Math.abs(dx * uy) + Math.abs(dy * ux);
    prog = Math.max(0, Math.min(1, along / need)); if (across > along + 30) prog *= 0.5;   // 向きがちがうと進みにくい
    draw(prog); try { opt.onMove && opt.onMove(prog); } catch (x) { }
    if (prog >= 1) fin();
  });
  const up = e => { if (e.pointerId !== pid) return; pid = null; el.classList.remove('go'); if (!done) { prog = 0; draw(0); try { opt.onMove && opt.onMove(0); } catch (x) { } } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  function fin() { if (done) return; done = true; try { opt.sfx && opt.sfx.play && opt.sfx.play('whoosh'); } catch (x) { } try { navigator.vibrate && navigator.vibrate(18); } catch (x) { } el.style.transition = 'opacity .15s'; el.style.opacity = '0'; try { opt.onDone && opt.onDone(); } catch (x) { } }
  return { destroy() { done = true; el.remove(); } };
}
