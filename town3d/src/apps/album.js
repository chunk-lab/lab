// アルバム:撮った写真を見る・切り取る(トリミング)・端末に保存する・消す・枠をダイヤでふやす。データは src/game/photos.js
import { photos, cfgOf, ASPECTS, cropRect, drawCropped } from '../game/photos.js';
import { fmtN } from '../core/core.js';

const ink = '#5a4a6b';
const btn = (bg = 'linear-gradient(160deg,#ffd0dc,#ffb3c1)', fg = '#fff') => `border:0;border-radius:999px;padding:9px 16px;font:inherit;font-weight:800;color:${fg};background:${bg};cursor:pointer;white-space:nowrap`;
const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

export const albumApp = {
  mount(el, ctx) {
    const cfg = ctx.photo || null, C = cfgOf(cfg);
    const box = document.createElement('div');
    box.style.cssText = `position:absolute;inset:0;display:flex;flex-direction:column;font-family:inherit;color:${ink};background:linear-gradient(#fdf0f3,#eaf4ff)`;
    el.appendChild(box);
    let view = 'grid', msg = '', cur = null, img = null, crop = null, sure = false;
    const gemsTxt = () => (ctx.gems ? `　💎 <span data-bind="gems">${fmtN(ctx.gems.get())}</span>` : '');
    const fromHome = ctx.params && ctx.params.from === 'home';   // 家から来たときは「部屋にもどる」を出す
    const head = (t, sub) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 16px 4px"><h2 style="margin:0;font-size:20px">${t}</h2>${fromHome ? `<button data-home style="${btn('linear-gradient(160deg,#9fe3c0,#6fcf9f)')};padding:7px 12px;font-size:13px">🏠 部屋にもどる</button>` : ''}<b style="background:#fff3cf;border-radius:999px;padding:6px 14px;font-size:13px">📷 ${photos.list().length}/${photos.slots(cfg)}${gemsTxt()}</b></div><p style="margin:0;padding:0 16px 8px;font-size:13px;color:#8d7f9e">${sub}</p>`;

    async function thumb(p, w) {
      const i = await loadImg(p.src); if (!i) return '';
      return drawCropped(i, p.crop, w).toDataURL('image/jpeg', 0.8);
    }
    async function grid() {
      view = 'grid'; const all = photos.list(), list = all.filter(p => !p.special), sp = all.filter(p => p.special), slots = photos.slots(cfg), tiles = [];
      for (let k = 0; k < C.max; k++) {
        const p = list[k];
        if (p) tiles.push(`<button data-p="${p.id}" style="border:0;padding:0;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 2px 10px #0002;aspect-ratio:1;cursor:pointer"><img src="${await thumb(p, 320)}" style="width:100%;height:100%;object-fit:cover;display:block" alt=""></button>`);
        else if (k < slots) tiles.push(`<div style="border-radius:16px;background:#ffffffaa;border:2px dashed #cbbfe0;aspect-ratio:1;display:grid;place-items:center;color:#a99bbb;font-size:13px;text-align:center">からっぽ<br>町や家で 📷</div>`);
        else tiles.push(`<button data-buy style="border:2px dashed #cbbfe0;border-radius:16px;background:#fff8;aspect-ratio:1;display:grid;place-items:center;cursor:pointer;font:inherit;color:${ink};font-size:13px;font-weight:800;text-align:center;${k > slots ? 'opacity:.55' : ''}">🔒<br>${k === slots ? `💎 ${C.gemsPerSlot} で<br>1枚ふやす` : 'ひとつ前を<br>ふやすと開く'}</button>`);
      }
      box.innerHTML = head('アルバム', msg || '見えたままの写真を残せるよ。あとから切り取れるよ。') + `<div style="flex:1;overflow:auto;padding:4px 16px 16px">${sp.length ? `<div style="font-weight:800;margin:4px 0 8px">🎂 特別な写真<small style="font-weight:600;color:#8d7f9e;margin-left:6px">(枠を使わないよ)</small></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-bottom:14px">${(await Promise.all(sp.map(async p => `<button data-p="${p.id}" style="border:3px solid #ffd36b;padding:0;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 2px 10px #0002;aspect-ratio:1;cursor:pointer"><img src="${await thumb(p, 320)}" style="width:100%;height:100%;object-fit:cover;display:block" alt=""></button>`))).join('')}</div><div style="font-weight:800;margin:4px 0 8px">📷 写真</div>` : ''}<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">${tiles.join('')}</div></div>`;
    }
    async function open(id) {
      cur = photos.list().find(p => p.id === id); if (!cur) return grid();
      img = await loadImg(cur.src); if (!img) { msg = '写真が読みこめなかったよ'; return grid(); }
      crop = Object.assign({ a: 'free', z: 1, x: 0.5, y: 0.5 }, cur.crop || {}); view = 'edit'; sure = false; edit();
    }
    function preview() {
      const cv = box.querySelector('canvas'); if (!cv) return;
      const r = cropRect(img.naturalWidth, img.naturalHeight, crop), maxW = cv.parentElement.clientWidth || 300, maxH = cv.parentElement.clientHeight || 300, k = Math.min(maxW / r.w, maxH / r.h);
      cv.width = Math.max(1, Math.round(r.w * k)); cv.height = Math.max(1, Math.round(r.h * k));
      cv.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, cv.width, cv.height);
    }
    function edit() {
      const chips = Object.keys(ASPECTS).map(a => `<button data-a="${a}" style="${btn(crop.a === a ? undefined : '#ece7f3', crop.a === a ? '#fff' : ink)};padding:6px 12px;font-size:13px">${a === 'free' ? 'そのまま' : a}</button>`).join('');
      box.innerHTML = head('切り取り', 'ドラッグで位置、スライダーで拡大。もとの写真は残るから、何度でもやり直せるよ。')
        + `<div style="flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:4px 16px;touch-action:none" class="stage"><canvas style="max-width:100%;max-height:100%;border-radius:12px;box-shadow:0 4px 14px #0003;background:#fff;touch-action:none"></canvas></div>
        <div style="display:flex;gap:6px;overflow-x:auto;padding:8px 16px 0">${chips}</div>
        <div style="display:flex;align-items:center;gap:10px;padding:8px 16px"><span style="font-size:13px">拡大</span><input type="range" min="1" max="4" step="0.05" value="${crop.z}" class="zr" style="flex:1"></div>
        <div style="display:flex;gap:8px;padding:0 16px calc(14px + env(safe-area-inset-bottom,0px));flex-wrap:wrap">
          <button data-s style="${btn()};flex:1">この切り取りで保存</button>
          ${navigator.canShare ? `<button data-share style="${btn('linear-gradient(160deg,#9fd8ff,#6cb8f0)')}">共有</button>` : ''}
          <button data-reset style="${btn('#d9d2e3', ink)}">もとにもどす</button>
          <button data-del style="${btn('linear-gradient(160deg,#ffcf9f,#ffb27a)')}">${sure ? 'ほんとうに消す' : '消す'}</button>
          <button data-back style="${btn('#c9b8ea')}">もどる</button></div>`;
      preview();
    }
    const saveCrop = () => photos.setCrop(cur.id, crop);
    const outBlob = () => new Promise(res => drawCropped(img, crop, 1600).toBlob(res, 'image/jpeg', 0.92));

    box.onclick = async e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.home !== undefined) { if (cur && view === 'edit') saveCrop(); ctx.open('home', { walk: !!(ctx.params && ctx.params.walk) }); return; }
      if (t.dataset.p) return open(t.dataset.p);
      if (t.dataset.buy !== undefined) { const err = photos.buySlot(ctx.gems, cfg); msg = err || '枠が1つふえたよ！'; return grid(); }
      if (view !== 'edit') return;
      if (t.dataset.a) { crop.a = t.dataset.a; crop.x = 0.5; crop.y = 0.5; saveCrop(); return edit(); }
      if (t.dataset.reset !== undefined) { crop = { a: 'free', z: 1, x: 0.5, y: 0.5 }; saveCrop(); return edit(); }
      if (t.dataset.back !== undefined) { saveCrop(); msg = ''; return grid(); }
      if (t.dataset.del !== undefined) { if (!sure) { sure = true; return edit(); } photos.remove(cur.id); msg = '写真を消したよ'; return grid(); }
      if (t.dataset.s !== undefined) {
        saveCrop(); const b = await outBlob(); if (!b) return;
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `town-photo-${cur.id}.jpg`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
        t.textContent = '保存したよ！'; return;
      }
      if (t.dataset.share !== undefined) { const b = await outBlob(); if (!b) return; const f = new File([b], 'town-photo.jpg', { type: 'image/jpeg' }); try { if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f] }); } catch (err) { } }
    };
    box.oninput = e => { if (e.target.classList.contains('zr')) { crop.z = +e.target.value; preview(); saveCrop(); } };
    // ドラッグで切り取りの位置を動かす
    let dr = null;
    box.onpointerdown = e => { const cv = e.target.closest('canvas'); if (!cv || view !== 'edit') return; dr = { x: e.clientX, y: e.clientY, cx: crop.x, cy: crop.y, w: cv.clientWidth, h: cv.clientHeight, id: e.pointerId }; cv.setPointerCapture(e.pointerId); };
    box.onpointermove = e => {
      if (!dr || e.pointerId !== dr.id) return;
      const r = cropRect(img.naturalWidth, img.naturalHeight, crop);
      crop.x = Math.max(0, Math.min(1, dr.cx - (e.clientX - dr.x) / dr.w * r.w / img.naturalWidth));
      crop.y = Math.max(0, Math.min(1, dr.cy - (e.clientY - dr.y) / dr.h * r.h / img.naturalHeight)); preview();
    };
    box.onpointerup = box.onpointercancel = () => { if (dr) { dr = null; saveCrop(); } };

    grid(); ctx.setTitle?.('アルバム');
    return { unmount() { box.remove(); } };
  },
};
