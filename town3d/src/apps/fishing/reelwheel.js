// 英語の釣りの「リールを巻く」:円をぐるぐるなぞって巻き取る。いっぱい巻くと done。
//   parent の下に重ねる。opt: {turns(必要な回数), gain(): 0..1 (魚が走っている時は小さくする), onProgress(p 0..1), onDone(), sfx}
export function reelWheel(parent, opt) {
  const S = Math.min(250, Math.round(Math.min(parent.clientWidth || 360, parent.clientHeight || 640) * 0.62));
  const el = document.createElement('div'); el.className = 'fz-wheel';
  el.style.cssText = `position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);width:${S}px;height:${S}px;margin-left:${-S / 2}px;z-index:3;touch-action:none;pointer-events:auto;user-select:none;-webkit-user-select:none`;
  const R = 44, C = 2 * Math.PI * R;
  el.innerHTML = `<style>@keyframes fzw{to{transform:rotate(360deg)}}.fz-wheel .spin{transform-origin:50px 50px;animation:fzw 1.6s linear infinite}.fz-wheel.go .spin{animation:none}</style>
    <div style="position:absolute;left:50%;top:-30px;transform:translateX(-50%);white-space:nowrap;font-weight:900;font-size:20px;color:#fff;background:#e0556b;border-radius:999px;padding:4px 16px;box-shadow:0 2px 8px #0005;pointer-events:none">🎣 巻き取れ！</div>
    <svg viewBox="0 0 100 100" width="${S}" height="${S}" style="display:block;overflow:visible">
      <circle cx="50" cy="50" r="48" fill="rgba(20,30,50,.45)"/>
      <circle cx="50" cy="50" r="${R}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="7"/>
      <circle class="pg" cx="50" cy="50" r="${R}" fill="none" stroke="#ffd166" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 50 50)"/>
      <g class="spin"><path d="M50 14 A36 36 0 1 1 20 31" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M12 24 L22 38 L31 24 Z" fill="#fff" transform="rotate(8 20 31)"/></g>
      <g class="kn"><circle cx="50" cy="${50 - R}" r="7" fill="#fff" stroke="#e0556b" stroke-width="3"/></g>
      <text x="50" y="56" text-anchor="middle" font-size="16" font-weight="900" fill="#fff" class="pc">0%</text>
    </svg>`;
  parent.appendChild(el);
  const pg = el.querySelector('.pg'), kn = el.querySelector('.kn'), pc = el.querySelector('.pc');
  let pid = null, last = 0, ang = 0, p = 0, done = false, snd = 0;
  const ang0 = e => { const r = el.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
  const draw = () => { pg.setAttribute('stroke-dashoffset', String(C * (1 - p))); kn.setAttribute('transform', `rotate(${ang * 180 / Math.PI} 50 50)`); pc.textContent = Math.round(p * 100) + '%'; };
  el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (done) return; pid = e.pointerId; try { el.setPointerCapture(pid); } catch (x) { } last = ang0(e); el.classList.add('go'); try { opt.sfx && opt.sfx.unlock && opt.sfx.unlock(); } catch (x) { } });
  el.addEventListener('pointermove', e => {
    if (e.pointerId !== pid || done) return; e.preventDefault();
    const r = el.getBoundingClientRect(); if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < r.width * 0.12) return;   // まん中すぎは数えない
    const a = ang0(e); let d = a - last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; last = a; ang += d;
    const g = Math.max(0, Math.min(1, opt.gain ? opt.gain() : 1));
    p = Math.min(1, p + Math.abs(d) / (2 * Math.PI) / opt.turns * g); draw();
    try { opt.sfx && opt.sfx.reel(Math.min(1, 0.3 + Math.abs(d) * 4) * (g < 1 ? 0.5 : 1)); } catch (x) { }
    if (performance.now() - snd > 260) { snd = performance.now(); try { navigator.vibrate && navigator.vibrate(g < 1 ? 5 : 12); } catch (x) { } }
    try { opt.onProgress && opt.onProgress(p); } catch (x) { }
    if (p >= 1) fin();
  });
  const up = e => { if (e.pointerId !== pid) return; pid = null; el.classList.remove('go'); try { opt.sfx && opt.sfx.reel(0); } catch (x) { } };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  function fin() { if (done) return; done = true; try { opt.sfx && opt.sfx.reel(0); } catch (x) { } try { opt.onDone && opt.onDone(); } catch (x) { } }
  return { destroy() { done = true; try { opt.sfx && opt.sfx.reel(0); } catch (x) { } el.remove(); } };
}
