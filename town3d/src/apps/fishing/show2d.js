// 釣れた魚を見せる画面(2D・軽い)。3D描画は使わない(スマホで重くて落ちるため)。
//   createShow(box, { actors:[{ look, pose, sp, size }], bg }) → { canvas, snap(caption), dispose }
//   pose: 'auto' | 'sad' | 'cheer'。描くのは1回だけ(動きはCSSで少しだけ)
import { artCanvas } from './art.js';

export const lookOf = k => k;   // 3D版と同じ形にしておく(見た目は使わない)

export function createShow(box, { actors, bg }) {
  const W = box.clientWidth || 360, H = box.clientHeight || 640, dpr = Math.min(1.5, window.devicePixelRatio || 1);
  const cv = document.createElement('canvas'); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;animation:fsShowIn .35s ease-out';
  const st = document.createElement('style'); st.textContent = '@keyframes fsShowIn{from{transform:scale(1.04);opacity:0}to{transform:none;opacity:1}}'; box.appendChild(st);
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  // 背景
  if (bg) { try { g.drawImage(bg, 0, 0, W, H); } catch (e) { } g.fillStyle = 'rgba(255,250,240,0.35)'; g.fillRect(0, 0, W, H); }
  else { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#9fd3f0'); gr.addColorStop(0.55, '#e8f4ff'); gr.addColorStop(0.56, '#6fb6d6'); gr.addColorStop(1, '#3a7fa0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  // 光
  const cx0 = W / 2, cy0 = H * 0.36, rg = g.createRadialGradient(cx0, cy0, 10, cx0, cy0, Math.max(W, H) * 0.55); rg.addColorStop(0, 'rgba(255,245,200,0.75)'); rg.addColorStop(1, 'rgba(255,245,200,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H);
  const n = actors.length;
  actors.forEach((a, i) => {
    const cx = n === 1 ? W / 2 : W * (i ? 0.73 : 0.27), cy = H * (n === 1 ? 0.34 : 0.36), sad = a.pose === 'sad', sp = a.sp;
    const fw = Math.min(W * (n === 1 ? 0.78 : 0.42), 340), fh = fw * 0.58;
    if (sp && !sad) {
      // 光の輪と魚(大きく)
      g.save(); g.translate(cx, cy); g.rotate(-0.08);
      g.fillStyle = 'rgba(255,255,255,0.65)'; g.beginPath(); g.ellipse(0, 0, fw * 0.58, fh * 0.62, 0, 0, 7); g.fill();
      try { g.drawImage(artCanvas(sp, Math.round(fw), Math.round(fh)), -fw / 2, -fh / 2, fw, fh); } catch (e) { g.font = `${fh * 0.7}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(sp.emoji || '🐟', 0, 0); }
      g.restore();
      for (let k = 0; k < 7; k++) { const ang = k / 7 * Math.PI * 2, r = fw * 0.62; g.fillStyle = '#ffd36b'; g.font = '18px sans-serif'; g.textAlign = 'center'; g.fillText('✦', cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * 0.7); }
      if (sp.kind === 'fish' && a.size) { g.font = '900 22px sans-serif'; g.fillStyle = '#5a4a6b'; g.strokeStyle = '#fff'; g.lineWidth = 5; g.textAlign = 'center'; g.strokeText(`${a.size}cm`, cx, cy + fh * 0.62); g.fillText(`${a.size}cm`, cx, cy + fh * 0.62); }
    } else {
      g.font = `${Math.min(80, W * 0.2)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(sad ? '😢' : '🎣', cx, cy); if (sad) { g.font = `${Math.min(50, W * 0.12)}px sans-serif`; g.fillText('🌧️', cx, cy - Math.min(80, W * 0.2)); }
      g.textBaseline = 'alphabetic';
    }
  });
  box.appendChild(cv);
  return {
    canvas: cv,
    snap(caption) {   // 写真:いまの絵+文字
      const out = document.createElement('canvas'), M = 1000, k = M / Math.max(W, H); out.width = Math.round(W * k); out.height = Math.round(H * k);
      const o = out.getContext('2d'); o.drawImage(cv, 0, 0, out.width, out.height);
      if (caption) {
        o.fillStyle = 'rgba(255,255,255,0.88)'; const ph = out.height * 0.11; o.fillRect(0, out.height - ph, out.width, ph);
        o.fillStyle = '#5a4a6b'; o.textAlign = 'center'; o.font = `900 ${Math.round(ph * 0.36)}px sans-serif`; o.fillText(caption[0], out.width / 2, out.height - ph * 0.52);
        o.font = `700 ${Math.round(ph * 0.22)}px sans-serif`; o.fillText(caption[1] || '', out.width / 2, out.height - ph * 0.17);
      }
      return out.toDataURL('image/jpeg', 0.86);
    },
    dispose() { cv.remove(); st.remove(); },
  };
}
