// 操作:PC はキーボード(WASD/矢印・Shift で走る・E/Space で調べる)+ドラッグでカメラ。
// スマホは画面の下半分でスティック(移動)、上半分のドラッグで見まわし。最初に触れた側が、離すまで続く。
export function createInput(el, { onAction }) {
  const keys = new Set();
  const st = { mx: 0, my: 0, run: false, camDX: 0, camDY: 0, zoom: 0 };
  let stick = null, look = null;
  const knob = document.createElement('div'); knob.className = 'tw-stick'; knob.innerHTML = '<i></i>'; knob.hidden = true; el.appendChild(knob);
  let look2 = null, pinch0 = 0;

  const kd = e => {
    if (e.target.closest?.('input,textarea')) return;
    keys.add(e.code);
    if ((e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); onAction(); }
  };
  const ku = e => keys.delete(e.code);
  const blur = () => { keys.clear(); stick = look = look2 = null; knob.hidden = true; };

  const pd = e => {
    if (e.target !== el && !e.target.classList?.contains('tw-canvas')) return;
    el.setPointerCapture?.(e.pointerId);
    const left = e.pointerType !== 'mouse' && e.clientY - el.getBoundingClientRect().top >= el.clientHeight * 0.5;   // スマホ:下半分=移動、上半分=見まわし(最初に触れた側のまま、はなれるまで変わらない)
    if (stick && !stick.moved && !look && !look2) {   // 動かしていない指がある状態で、もう1本ふれたら、つまみ(ズーム)にする
      look = { id: stick.id, x: stick.cx, y: stick.cy }; stick = null; knob.hidden = true;
      look2 = { id: e.pointerId, x: e.clientX, y: e.clientY }; pinch0 = Math.hypot(look.x - look2.x, look.y - look2.y);
    } else if (left && !stick) {
      stick = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, dx: 0, dy: 0, moved: false };
      knob.hidden = false; knob.style.transform = `translate(${e.clientX - el.getBoundingClientRect().left - 60}px,${e.clientY - el.getBoundingClientRect().top - 60}px)`;
      knob.firstChild.style.transform = 'translate(0,0)';
    } else if (!look) look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    else if (!look2) { look2 = { id: e.pointerId, x: e.clientX, y: e.clientY }; pinch0 = Math.hypot(look.x - look2.x, look.y - look2.y); }
  };
  const pm = e => {
    if (stick && e.pointerId === stick.id) {
      let dx = e.clientX - stick.x, dy = e.clientY - stick.y; const d = Math.hypot(dx, dy), max = 56;
      stick.cx = e.clientX; stick.cy = e.clientY; if (d > 10) stick.moved = true;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      const m = Math.min(1, d / max), dz = 0.14;   // 中心のあそび(指のぶれで勝手に動かない)+ゆるやかな加速
      const k = m < dz ? 0 : Math.pow((m - dz) / (1 - dz), 1.25);
      const L = Math.hypot(dx, dy) || 1; stick.dx = dx / L * k; stick.dy = dy / L * k;
      knob.firstChild.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (look && e.pointerId === look.id) {
      const ddx = e.clientX - look.x, ddy = e.clientY - look.y; look.x = e.clientX; look.y = e.clientY;
      if (look2) { const d = Math.hypot(look.x - look2.x, look.y - look2.y); st.zoom -= (d - pinch0) / 40; pinch0 = d; }   // 2本指でズーム
      else { const k = e.pointerType === 'mouse' ? 1 : 1.35; st.camDX += ddx * k; st.camDY += ddy * k; }
    } else if (look2 && e.pointerId === look2.id) {
      look2.x = e.clientX; look2.y = e.clientY; const d = Math.hypot(look.x - look2.x, look.y - look2.y); st.zoom -= (d - pinch0) / 40; pinch0 = d;
    }
  };
  const pu = e => {
    if (stick && e.pointerId === stick.id) { stick = null; knob.hidden = true; }
    if (look && e.pointerId === look.id) { look = look2; look2 = null; }
    else if (look2 && e.pointerId === look2.id) look2 = null;
  };
  const wh = e => { st.zoom += Math.sign(e.deltaY); e.preventDefault(); };

  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', blur);
  el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm); el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
  el.addEventListener('wheel', wh, { passive: false });

  return {
    enabled: true,
    read() {
      let x = 0, y = 0;
      if (this.enabled) {
        if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
        if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
        const kl = Math.hypot(x, y); if (kl > 1) { x /= kl; y /= kl; }
        st.run = keys.has('ShiftLeft') || keys.has('ShiftRight');
        if (stick) { x = stick.dx; y = stick.dy; st.run = Math.hypot(x, y) > 0.92; }
      }
      st.mx = x; st.my = y;
      const out = { ...st };
      st.camDX = st.camDY = st.zoom = 0;
      return out;
    },
    clear: blur,
    dispose() {
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
      el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm); el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu);
      el.removeEventListener('wheel', wh); knob.remove();
    },
  };
}
