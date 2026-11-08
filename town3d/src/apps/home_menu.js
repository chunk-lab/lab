// あなたの家の下のメニュー：アイコンが横一列にならんだ、ループするスライダー。
// 真ん中の1つが「いまえらんでいるもの」。スライドすると上の部屋でその家具が光る。
// 真ん中のアイコン・部屋の家具をタップすると、その画面が開く(横のアイコンをタップすると、真ん中に寄るだけ)。
//
// ここに1行足せば、メニューが増える。need が false のあいだは出さない(まだ持っていない家具など)。
//   k: しるし / ic: アイコン / n: 名前 / sub: ひとこと / fur: 部屋で光らせる家具のid(先にあるものほど優先) / act: 開く画面
//   これから足す予定:✉ メール(お知らせ)・📅 カレンダー(約束)・住人を呼ぶ・クローゼット(服) … 画面ができたら1行足す
export const HOME_MENU = [
  { k: 'note', ic: '📒', n: '勉強ノート・記録', sub: '覚えたことばの復習と、きょうの記録', fur: ['desk'], need: c => (c.features || []).includes('study'), act: 'study' },
  { k: 'shop', ic: '🛒', n: 'ネットショップ', sub: '家具を買う', fur: [], act: 'shop' },
  { k: 'gbox', ic: '🎮', n: 'チャンクボックス', sub: '英語で対戦・あそぶゲーム機', fur: ['tv'], act: 'gbox' },
  { k: 'tank', ic: '🐠', n: '水槽', sub: '釣った魚を育てる', fur: ['tank'], need: (c, f) => f.owned('tank') > 0, act: 'tank' },
  { k: 'album', ic: '🖼', n: 'アルバム', sub: '撮った写真', fur: ['frame'], act: 'album' },
  { k: 'walk', ic: '🚶', n: '部屋を歩く', sub: '中に入って、座ったり写真をとったり', fur: [], act: 'walk' },
  { k: 'deco', ic: '🛋', n: 'もようがえ', sub: '家具を置く・動かす・部屋を広げる', fur: ['sofa', 'armchair', 'floorlamp', 'lamp'], act: 'deco' },
  { k: 'out', ic: '🚪', n: '町へ出かける', sub: '', fur: ['door'], act: 'out' },
];

const CSS = `.hmc{position:relative;flex:none;padding:6px 0 calc(10px + env(safe-area-inset-bottom,0px));background:linear-gradient(#ffffffb0,#fff8f1f0);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 -6px 18px #5a4a6b14;user-select:none;-webkit-user-select:none}
.hmc-tr{position:relative;height:84px;overflow:hidden;touch-action:pan-y;cursor:grab}
.hmc-s{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border:0;border-radius:20px;background:#fff;box-shadow:0 2px 8px #5a4a6b1f;font-size:30px;line-height:60px;padding:0;cursor:pointer;will-change:transform,opacity;color:inherit}
.hmc-s.on{background:linear-gradient(160deg,#fff,#fff4d6);box-shadow:0 0 0 3px #ffc93c,0 6px 18px #ffb3006b}
.hmc-lb{text-align:center;min-height:38px}
.hmc-lb b{display:inline-block;font-size:16px;letter-spacing:.02em;padding:3px 14px;border-radius:999px;background:#5a4a6b;color:#fff}
.hmc-lb small{display:block;font-size:11px;color:#8d7f9e;margin-top:3px;min-height:14px}
.hmc-ar{position:absolute;top:36px;width:34px;height:34px;margin-top:-17px;border:0;border-radius:50%;background:#ffffffd9;color:#5a4a6b;font:inherit;font-size:18px;font-weight:900;box-shadow:0 1px 5px #0002;cursor:pointer;z-index:2}
.hmc-ar.l{left:6px}.hmc-ar.r{right:6px}`;

// el:入れる場所 / items():いま出すもの / onPick(item):真ん中が変わった / onOpen(item):開く
export function createHomeMenu(el, { items, onPick, onOpen, startKey }) {
  if (!document.getElementById('hmc-css')) { const s = document.createElement('style'); s.id = 'hmc-css'; s.textContent = CSS; document.head.appendChild(s); }
  el.className = 'hmc';
  el.innerHTML = `<div class="hmc-tr" role="listbox" aria-label="家のメニュー"></div><button class="hmc-ar l" aria-label="前へ">‹</button><button class="hmc-ar r" aria-label="次へ">›</button><div class="hmc-lb" aria-live="polite"><b></b><small></small></div>`;
  const tr = el.querySelector('.hmc-tr'), lb = el.querySelector('.hmc-lb'), SLOTS = 7, GAP = 76;
  const slots = Array.from({ length: SLOTS }, () => { const b = document.createElement('button'); b.className = 'hmc-s'; tr.appendChild(b); return b; });
  let list = items(), pos = Math.max(0, list.findIndex(m => m.k === startKey)), cur = -1, anim = 0, drag = null;
  const mod = (a, n) => ((a % n) + n) % n;
  function paint() {
    const n = list.length; if (!n) { el.style.display = 'none'; return; }
    const base = Math.round(pos), half = (SLOTS - 1) / 2;
    slots.forEach((b, j) => {
      const k = j - half, it = list[mod(base + k, n)], off = base + k - pos, d = Math.abs(off);
      if (b.dataset.k !== it.k) { b.dataset.k = it.k; b.textContent = it.ic; b.setAttribute('aria-label', it.n); }
      b.dataset.off = k;
      const s = Math.max(0.62, 1.22 - d * 0.3);
      b.style.transform = `translateX(${off * GAP}px) scale(${s})`;
      b.style.opacity = d > 2.6 ? 0 : Math.max(0.25, 1 - d * 0.28);
      b.style.zIndex = 10 - Math.round(d);
      b.classList.toggle('on', d < 0.5);
    });
    const i = mod(base, n);
    if (i !== cur) { cur = i; const it = list[i]; lb.querySelector('b').textContent = it.n; lb.querySelector('small').textContent = it.sub || ''; }
  }
  let picked = null;   // 部屋を切りかえるのは、止まったときだけ(すべっている途中は文字だけ変える)
  function go(to) {   // なめらかに to の位置へ
    cancelAnimationFrame(anim); const from = pos, t0 = performance.now(), T = 260;
    const step = now => { const t = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - t, 3); pos = from + (to - from) * e; paint(); if (t < 1) anim = requestAnimationFrame(step); else { pos = to; settle(); } };
    anim = requestAnimationFrame(step);
  }
  function settle() { paint(); const it = list[cur]; if (it && it !== picked) { picked = it; onPick(it); } }
  tr.onpointerdown = e => { cancelAnimationFrame(anim); drag = { x: e.clientX, p: pos, t: performance.now(), v: 0, lx: e.clientX, lt: performance.now(), moved: false, id: e.pointerId }; tr.setPointerCapture(e.pointerId); e.stopPropagation(); };
  tr.onpointermove = e => {
    if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6) drag.moved = true;
    const now = performance.now(); if (now > drag.lt) { drag.v = (e.clientX - drag.lx) / (now - drag.lt); drag.lx = e.clientX; drag.lt = now; }
    if (drag.moved) { pos = drag.p - dx / GAP; paint(); }
  };
  const up = e => {
    if (!drag || e.pointerId !== drag.id) return; const d = drag; drag = null;
    if (!d.moved) {   // タップ:真ん中なら開く、横なら真ん中へ寄せる
      const r = tr.getBoundingClientRect(), k = Math.round((e.clientX - (r.left + r.width / 2)) / GAP);   // 指をつかまえているので、位置からどれを押したか決める
      if (Math.abs(k) > 3) { settle(); return; } if (k === 0) { settle(); onOpen(list[cur]); } else go(Math.round(pos) + k);
      return;
    }
    go(Math.round(pos - d.v * 4.2));   // はじいた勢いで少し先まで進む
  };
  tr.onpointerup = up; tr.onpointercancel = up;
  el.querySelector('.l').onclick = () => go(Math.round(pos) - 1);
  el.querySelector('.r').onclick = () => go(Math.round(pos) + 1);
  el.onpointerdown = e => e.stopPropagation();
  settle();
  return {
    // 持ちものがふえた・へったとき(いまのものを真ん中にしたまま、出すものを作りなおす)
    refresh() { const k = list[cur] && list[cur].k; list = items(); const i = list.findIndex(m => m.k === k); pos = i >= 0 ? i : 0; cur = -1; slots.forEach(b => { b.dataset.k = ''; }); settle(); },
    // 部屋の家具をタップしたとき:その項目を真ん中にする
    select(k) { const i = list.findIndex(m => m.k === k); if (i < 0) return; const n = list.length, base = Math.round(pos); let to = base + (mod(i - base, n) > n / 2 ? mod(i - base, n) - n : mod(i - base, n)); go(to); },
    current: () => list[cur],
    itemFor: id => list.find(m => (m.fur || []).includes(id)),
  };
}
