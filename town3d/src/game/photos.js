// 写真のアルバム。「見えたまま」を撮って保存し、あとから切り取り(トリミング)できる。
// 残せるのは はじめ1枚。ダイヤで1枠ずつ、全部で5枚まで増やせる(値段は series の ECON.photo)。
// 保存は town:photo:*(いまは端末の中だけ。投稿・共有するときはここから取り出す)
import { createStorage } from '../core/core.js';

const st = createStorage('town:photo:');
export const PHOTO_DEF = { free: 1, max: 5, gemsPerSlot: 40 };
export const cfgOf = c => Object.assign({}, PHOTO_DEF, c || {});

export const photos = {
  list: () => st.get('list') || [],
  extra: () => st.get('extra') || 0,
  slots(cfg) { const c = cfgOf(cfg); return Math.min(c.max, c.free + this.extra()); },
  // 枠を1つ増やす(ダイヤ)。理由の文字(空なら成功)を返す
  buySlot(gems, cfg) {
    const c = cfgOf(cfg);
    if (this.slots(cfg) >= c.max) return 'もう5枚まで ふやしてあるよ';
    if (!gems) return 'ダイヤが使えない場所だよ';
    if (gems.get() < c.gemsPerSlot) return `ダイヤが足りないよ(あと ${c.gemsPerSlot - gems.get()})`;
    if (!gems.spend(c.gemsPerSlot)) return 'ダイヤが足りないよ';
    st.set('extra', this.extra() + 1); return '';
  },
  // 写真を足す。枠がいっぱいなら null
  add(src, cfg) {
    const l = this.list(); if (l.length >= this.slots(cfg)) return null;
    const p = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: Date.now(), src, crop: null };
    l.push(p); st.set('list', l); return p;
  },
  remove(id) { st.set('list', this.list().filter(p => p.id !== id)); },
  oldest() { return this.list().slice().sort((a, b) => a.t - b.t)[0] || null; },
  setCrop(id, crop) { const l = this.list(), p = l.find(x => x.id === id); if (p) { p.crop = crop; st.set('list', l); } },
};

// 画面(canvas)を、見えたまま画像(JPEG)にする。長いほうを 1000px までにして軽くする
export function snapCanvas(cv, max = 1000) {
  const k = Math.min(1, max / Math.max(cv.width, cv.height)), w = Math.round(cv.width * k), h = Math.round(cv.height * k);
  const o = document.createElement('canvas'); o.width = w; o.height = h;
  o.getContext('2d').drawImage(cv, 0, 0, w, h);
  return o.toDataURL('image/jpeg', 0.85);
}

// 切り取りの形 crop = {a:'free'|'1:1'|'4:3'|'3:4'|'16:9'|'9:16', z:拡大(1以上), x,y:中心(0〜1)}。画像の大きさ iw×ih から、切り取る四角を出す
export const ASPECTS = { free: 0, '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4, '16:9': 16 / 9, '9:16': 9 / 16 };
export function cropRect(iw, ih, crop) {
  const c = Object.assign({ a: 'free', z: 1, x: 0.5, y: 0.5 }, crop || {}), ar = ASPECTS[c.a] || 0;
  let w = iw, h = ih;
  if (ar) { if (iw / ih > ar) w = ih * ar; else h = iw / ar; }
  w /= Math.max(1, c.z); h /= Math.max(1, c.z);
  const x = Math.max(0, Math.min(iw - w, c.x * iw - w / 2)), y = Math.max(0, Math.min(ih - h, c.y * ih - h / 2));
  return { x, y, w, h };
}
export function drawCropped(img, crop, outMax = 1000) {
  const r = cropRect(img.naturalWidth || img.width, img.naturalHeight || img.height, crop), k = Math.min(1, outMax / Math.max(r.w, r.h));
  const cv = document.createElement('canvas'); cv.width = Math.round(r.w * k); cv.height = Math.round(r.h * k);
  cv.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, cv.width, cv.height); return cv;
}

// シャッター後のカード(写真を残す・いっぱいなら入れかえるか選ぶ)。root=重ねる先, gems/cfg=ダイヤと設定, openAlbum=アルバムを開く
export function shotCard(root, src, { gems, cfg, openAlbum, sfx }) {
  root.querySelector('.tw-shot')?.remove();
  const card = document.createElement('div'); card.className = 'tw-shot';
  card.style.cssText = 'position:absolute;z-index:60;right:56px;bottom:calc(10px + env(safe-area-inset-bottom,0px));width:178px;background:#fffaf2;border-radius:16px;padding:8px;box-shadow:0 6px 18px #5a4a6b33;color:#5a4a6b;font:700 12px/1.4 system-ui,sans-serif;text-align:center';
  const bt = (t, bg = '#ffb3c1', fg = '#fff') => `<button style="border:0;border-radius:999px;padding:7px 10px;margin:3px 2px 0;font:inherit;font-weight:800;background:${bg};color:${fg};cursor:pointer">${t}</button>`;
  const img = `<img src="${src}" style="width:100%;border-radius:10px;display:block;margin-bottom:4px">`;
  const close = () => card.remove();
  const done = p => {
    const n = photos.list().length, s = photos.slots(cfg);
    card.innerHTML = `${img}<div>📷 のこしたよ(${n}/${s}枚)</div>${bt('アルバムを見る')}${bt('とじる', '#d9d2e3', '#5a4a6b')}`;
    const [a, c] = card.querySelectorAll('button'); a.onclick = () => { close(); openAlbum && openAlbum(); }; c.onclick = close;
    clearTimeout(card._t); card._t = setTimeout(close, 6000);
  };
  const p = photos.add(src, cfg);
  if (p) done(p);
  else {
    card.innerHTML = `${img}<div>アルバムが いっぱい(${photos.list().length}/${photos.slots(cfg)}枚)</div>${bt('いちばん古いのと入れかえる')}${bt('アルバムを開く', '#c9b8ea')}${bt('やめる', '#d9d2e3', '#5a4a6b')}`;
    const [a, b, c] = card.querySelectorAll('button');
    a.onclick = () => { const o = photos.oldest(); if (o) photos.remove(o.id); photos.add(src, cfg); done(); };
    b.onclick = () => { close(); openAlbum && openAlbum(); };
    c.onclick = close;
  }
  sfx && sfx();
  root.appendChild(card);
}
// シャッターの白いフラッシュ
export function flash(root) {
  const f = document.createElement('div'); f.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:.85;pointer-events:none;z-index:70;transition:opacity .35s';
  root.appendChild(f); requestAnimationFrame(() => { f.style.opacity = '0'; }); setTimeout(() => f.remove(), 450);
}
