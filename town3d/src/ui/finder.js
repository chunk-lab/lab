// 「さがす」画面:町のマップ+名前検索+一覧。タップでその人・場所のところへとんでいける
import { STREETS, ROAD_HALF, WALK, PLAZA_R, LANDMARKS, AREAS } from '../world/town_data.js';

const X0 = -70, X1 = 70, Z0 = -78, Z1 = 70;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SHORT = { school: '学校', library: '図書館', gamecenter: 'GAME', shop: 'ショップ', cafe: 'カフェ', home: 'おうち' };
const COL = new Intl.Collator('ja');
const kana = e => (e.yomi || e.name).replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));   // カタカナはひらがなにそろえて並べる
const PYOMI = { school: 'まちのがっこう', library: 'としょかん', gamecenter: 'げーむせんたー', shop: 'しょっぷ', cafe: 'かふぇ', home: 'あなたのいえ', plaza: 'ほしひろば', park: 'こもれびこうえん', shrine: 'ほしみやじんじゃ', bus: 'ばすてい' };
const hex = n => '#' + n.toString(16).padStart(6, '0');

export function openFinder({ hud, city, getMe, getEntities, areaName, onJump, getHints = () => [] }) {
  const places = [
    ...city.interact.filter(i => i.kind === 'door').map(d => ({ id: 'pl:' + d.id, kind: 'place', name: d.name, role: '建物', yomi: PYOMI[d.id], x: d.x, z: d.z, fx: d.fx, fz: d.fz, face: 0 })),
    { id: 'pl:plaza', yomi: PYOMI.plaza, kind: 'place', name: 'ほし広場(噴水)', role: '広場', x: 0, z: 11, face: 0 },
    { id: 'pl:park', yomi: PYOMI.park, kind: 'place', name: AREAS.park.name, role: '公園', x: 40, z: 12.5, face: 0 },
    { id: 'pl:shrine', yomi: PYOMI.shrine, kind: 'place', name: AREAS.shrine.name, role: '神社', x: -45, z: -5, face: 0 },
    { id: 'pl:fortune', yomi: 'うらないのやかた', kind: 'place', name: '占いの館', role: '占い', x: -40.5, z: -20, fx: -1, fz: 0, face: 0 },   // 入口(西)の正面に立つ
    { id: 'pl:bus', yomi: PYOMI.bus, kind: 'place', name: 'バス停', role: 'バス停', x: -58, z: 3.5, face: 0 },
  ];
  let tab = 'people', q = '', sel = null, timer = 0, sort = 'near';

  const p = hud.panel(`<h2>町をさがす</h2>
    <canvas class="tw-map" aria-label="町のマップ"></canvas>
    <div class="tw-ftabs"><button class="tw-btn on" data-t="people">ひと</button><button class="tw-btn" data-t="places">ばしょ</button></div>
    <div class="tw-ftabs tw-sort"><button class="tw-btn on" data-s="near">ちかい順</button><button class="tw-btn" data-s="kana">あいうえお順</button></div>
    <input class="tw-fq" type="search" placeholder="名前・場所でさがす" autocomplete="off">
    <div class="tw-flist" role="list"></div>
    <div class="tw-actions"><button class="tw-btn" data-a="close">とじる</button></div>`);
  const cv = p.querySelector('.tw-map'), list = p.querySelector('.tw-flist'), inp = p.querySelector('.tw-fq');
  inp.addEventListener('keydown', e => e.stopPropagation());
  const ctx = cv.getContext('2d');
  let W = 0, H = 0;
  const sx = x => (x - X0) / (X1 - X0) * W, sz = z => (z - Z0) / (Z1 - Z0) * H;

  function size() {
    const w = cv.clientWidth || 320, dpr = Math.min(2, window.devicePixelRatio || 1);
    W = w; H = Math.round(w * (Z1 - Z0) / (X1 - X0));
    cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 背景(道・建物・広場)は変わらないので、いちど描いて使いまわす
  let bg = null;
  function drawBg() {
    bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
    const g = bg.getContext('2d'); g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    g.fillStyle = '#cfe9c3'; g.fillRect(0, 0, W, H);
    const rect = (x0, x1, z0, z1, fill, stroke) => { g.fillStyle = fill; g.fillRect(sx(x0), sz(z0), sx(x1) - sx(x0), sz(z1) - sz(z0)); if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.strokeRect(sx(x0), sz(z0), sx(x1) - sx(x0), sz(z1) - sz(z0)); } };
    rect(AREAS.park.x0, AREAS.park.x1, AREAS.park.z0, AREAS.park.z1, '#b4dca6');
    rect(AREAS.shrine.x0, AREAS.shrine.x1, AREAS.shrine.z0, AREAS.shrine.z1, '#dccff0');
    const half = ROAD_HALF + WALK;
    for (const [dir, f, a, b] of STREETS) dir === 'ns' ? rect(f - half, f + half, a, b, '#f4ecf6') : rect(a, b, f - half, f + half, '#f4ecf6');
    g.fillStyle = '#ffe3ea'; g.beginPath(); g.arc(sx(0), sz(0), PLAZA_R / (X1 - X0) * W, 0, 7); g.fill();
    g.strokeStyle = '#f2b8c6'; g.lineWidth = 1.5; g.stroke();
    for (const c of city.colliders) if (c.x0 !== undefined && (c.x1 - c.x0) * (c.z1 - c.z0) > 18) rect(c.x0, c.x1, c.z0, c.z1, '#d9c9ee', '#b9a5d9');
    g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const L of LANDMARKS) {
      const w = L.face === 'e' || L.face === 'w' ? L.d : L.w, d = L.face === 'e' || L.face === 'w' ? L.w : L.d;
      rect(L.x - w / 2, L.x + w / 2, L.z - d / 2, L.z + d / 2, hex(L.wall), '#8d7f9e');
      g.fillStyle = '#5a4a6b'; g.fillText(SHORT[L.id] || L.name, sx(L.x), sz(L.z));
    }
    g.fillStyle = '#7a9f6e'; g.fillText('公園', sx(41), sz(19)); g.fillStyle = '#9a85c0'; g.fillText('神社', sx(-45), sz(-19)); g.fillStyle = '#d98fa5'; g.fillText('広場', sx(0), sz(-6));
  }

  const all = () => [...(tab === 'people' ? getEntities() : places)];
  const matches = e => !q || (e.name + ' ' + (e.role || '') + ' ' + (e.area || '')).toLowerCase().includes(q);

  function drawMap() {
    ctx.clearRect(0, 0, W, H); ctx.drawImage(bg, 0, 0, W, H);
    const me = getMe();
    const dot = (e, col, r) => {
      ctx.beginPath(); ctx.arc(sx(e.x), sz(e.z), r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
    };
    const ents = getEntities();
    for (const e of ents) {
      if (e.away) continue;
      const hit = matches({ ...e, area: areaName(e.x, e.z) });
      ctx.globalAlpha = hit ? 1 : 0.25;
      dot(e, e.kind === 'npc' ? '#43bf94' : '#9a7fd6', 8.5);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText([...(e.name || '?')][0], sx(e.x), sz(e.z) + 0.5);   // 頭文字だけ
      ctx.globalAlpha = 1;
    }
    for (const h of getHints()) {   // 占い・ヒントでおしえてもらった「かくれもの」の印(きらきら)
      const px = sx(h.x), pz = sz(h.z), k = 0.5 + 0.5 * Math.sin(Date.now() / 260);
      ctx.beginPath(); ctx.arc(px, pz, 13 + k * 5, 0, 7); ctx.fillStyle = `rgba(255,214,102,${0.18 + 0.2 * k})`; ctx.fill();
      ctx.fillStyle = '#ffb300'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, r = i % 2 ? 4 : 9; ctx.lineTo(px + Math.cos(a) * r, pz + Math.sin(a) * r); }
      ctx.closePath(); ctx.stroke(); ctx.fill();
    }
    dot(me, '#ff6f91', 6.5);
    ctx.lineWidth = 2; ctx.strokeStyle = '#ff6f91'; ctx.beginPath(); ctx.arc(sx(me.x), sz(me.z), 10 + (Date.now() / 200 % 3), 0, 7); ctx.globalAlpha = 0.4; ctx.stroke(); ctx.globalAlpha = 1;
    // 選んだ人の名前
    const t = [...ents, ...places].find(e => e.id === sel);
    if (t) {
      ctx.beginPath(); ctx.arc(sx(t.x), sz(t.z), 11, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = '#ffb347'; ctx.stroke();
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      const w = ctx.measureText(t.name).width + 12, bx = Math.max(w / 2, Math.min(W - w / 2, sx(t.x)));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(bx - w / 2, sz(t.z) - 36, w, 20, 10); ctx.fill();
      ctx.fillStyle = '#5a4a6b'; ctx.fillText(t.name, bx, sz(t.z) - 20);
    }
  }

  function render(noScroll) {
    const me = getMe();
    const rows = all().map(e => ({ ...e, area: e.kind === 'place' ? e.role : e.inside || areaName(e.x, e.z), dist: Math.hypot(e.x - me.x, e.z - me.z) })).filter(matches).sort(sort === 'kana' ? (a, b) => COL.compare(kana(a), kana(b)) : (a, b) => a.dist - b.dist);
    list.innerHTML = rows.length ? rows.map(e => `<div class="tw-frow${e.id === sel ? ' sel' : ''}" role="listitem" data-id="${esc(e.id)}"><i class="tw-fdot ${e.kind}"></i><span class="tw-fname"><b>${esc(e.name)}</b><small>${esc(e.role || '')} ・ ${e.away ? 'おやすみ中' : esc(e.area)} ・ ${e.away ? '—' : Math.round(e.dist) + 'm'}</small></span><button class="tw-btn" data-go="${esc(e.id)}"${e.away ? ' disabled' : ''}>とぶ</button></div>`).join('') : '<p class="tw-note">見つかりませんでした。</p>';
    if (!noScroll) list.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });   // マップをタップしたときは動かさない(ダブルタップがずれるため)
  }

  function jump(id) {
    const e = [...getEntities(), ...places].find(x => x.id === id);
    if (!e || e.away) return;
    hud.closePanel(); clearInterval(timer);
    onJump(e);
  }

  p.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (b?.dataset.go) return jump(b.dataset.go);
    if (b?.dataset.t) { tab = b.dataset.t; sel = null; p.querySelectorAll('.tw-ftabs:not(.tw-sort) .tw-btn').forEach(x => x.classList.toggle('on', x === b)); return render(); }
    if (b?.dataset.s) { sort = b.dataset.s; p.querySelectorAll('.tw-sort .tw-btn').forEach(x => x.classList.toggle('on', x === b)); return render(); }
    if (b?.dataset.a === 'close') return hud.closePanel();
    const row = ev.target.closest('.tw-frow'); if (row) { sel = row.dataset.id; render(); drawMap(); }
  });
  inp.addEventListener('input', () => { q = inp.value.trim().toLowerCase(); render(); drawMap(); });
  // マップをタップ → いちばん近い点を選ぶ(1回で選ぶ、すばやく2回で、そこへとぶ。何もない所でもOK)
  let last = { id: null, at: 0, x: 0, y: 0 };
  cv.style.touchAction = 'manipulation';
  cv.addEventListener('click', ev => {
    const r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, now = performance.now();
    // 同じあたりをすばやく2回タップ(ダブルタップ)したら、そこへとぶ。点があればその人・場所へ、なければタップした地面へ
    if (last.at && now - last.at < 450 && Math.hypot(x - last.x, y - last.y) < 26) {
      const id = last.id, wx = X0 + last.x / W * (X1 - X0), wz = Z0 + last.y / H * (Z1 - Z0); last = { id: null, at: 0, x: 0, y: 0 };
      if (id) return jump(id);
      // 建物の上(壁ぎわ)をタップしたら、その建物の入口の正面へ。入口のない建物は、いちばん近い入口へ
      const bs = city.buildings || [], M = 3;
      const hitB = bs.find(b => wx > b.x0 - M && wx < b.x1 + M && wz > b.z0 - M && wz < b.z1 + M);
      if (hitB) {
        const doors = bs.filter(b => b.door).map(b => b.door);
        const d = hitB.door || doors.sort((a, b) => Math.hypot(a.x - wx, a.z - wz) - Math.hypot(b.x - wx, b.z - wz))[0];
        if (d) { hud.closePanel(); clearInterval(timer); return onJump({ id: 'pl:' + d.id, kind: 'place', name: d.name, x: d.x, z: d.z, fx: d.fx, fz: d.fz }); }
      }
      hud.closePanel(); clearInterval(timer); return onJump({ id: 'pt', kind: 'point', name: 'そこ', x: wx, z: wz });
    }
    let best = null, bd = 18;
    for (const e of [...getEntities().filter(e => !e.away), ...(tab === 'places' ? places : [])]) { const d = Math.hypot(sx(e.x) - x, sz(e.z) - y); if (d < bd) { bd = d; best = e; } }
    if (best && !(best.kind === 'place' && tab !== 'places')) {
      last = { id: best.id, at: now, x, y };
      sel = best.id; render(true); drawMap();
    } else last = { id: null, at: now, x, y };
  });

  size(); drawBg(); render(); drawMap();
  timer = setInterval(() => { if (!cv.isConnected) return clearInterval(timer); drawMap(); }, 400);
  let down = false;   // 指が乗っている間は一覧を作り直さない(押しそこないを防ぐ)
  list.addEventListener('pointerdown', () => { down = true; });
  window.addEventListener('pointerup', () => { down = false; }, { once: false });
  let slow = setInterval(() => { if (!cv.isConnected) { clearInterval(slow); return; } if (!down && document.activeElement !== inp) render(); }, 2500);
}
