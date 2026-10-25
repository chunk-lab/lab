// ショップ(家具を買う)と、あなたの家(家具を置く)。データは src/game/furniture.js
import * as THREE from 'three';
import { makeCharacter, LOOKS } from '../world/character.js';
import { createInput } from '../game/input.js';
import { snapCanvas, shotCard, flash } from '../game/photos.js';
import { fmtN, clamp } from '../core/core.js';
import { ITEMS, ITEM, CATS, U, WALL_H, MAX_OWN, SIDE_MAX, furn, houseData, size, wallLen, kindOf, heightOf, inside, stackY, findSpot, ROOM_TYPES } from '../game/furniture.js';

const ink = '#5a4a6b';
const btn = (bg = 'linear-gradient(160deg,#ffd0dc,#ffb3c1)', fg = '#fff') => `border:0;border-radius:999px;padding:9px 16px;font:inherit;font-weight:800;color:${fg};background:${bg};cursor:pointer;white-space:nowrap`;

// 家具の見た目を1つの Group にする(部屋とサムネイルで共通)
function makeModel(id) { const g = new THREE.Group(); ITEM[id].build(g); return g; }

// ショップ用の小さな絵を、1つの描画器でまとめて作る
const thumbs = new Map();
function makeThumbs() {
  if (thumbs.size) return;
  let r;
  try {
    r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(132, 132, false);
    const sc = new THREE.Scene();
    sc.add(new THREE.AmbientLight(0xffffff, 2.1));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(3, 6, 4); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    for (const it of ITEMS) {
      const m = makeModel(it.id); sc.add(m);
      const bb = new THREE.Box3().setFromObject(m), c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
      const dist = Math.max(s.x, s.y * 1.3, s.z) * 2.6 + 1.5;
      cam.position.set(c.x + dist * 0.62, c.y + dist * 0.5, c.z + dist * 0.62); cam.lookAt(c);
      r.render(sc, cam); thumbs.set(it.id, r.domElement.toDataURL('image/png'));
      sc.remove(m);
    }
  } catch (e) { /* 描画できない環境では絵なしで表示する */ } finally { r?.dispose(); r?.forceContextLoss?.(); }
}

export const shopApp = {
  mount(el, ctx) {
    makeThumbs();
    const box = document.createElement('div');
    box.style.cssText = `position:absolute;inset:0;display:flex;flex-direction:column;font-family:inherit;color:${ink}`;
    el.appendChild(box);
    let view = 'list', msg = '', cat = 'すべて';
    const qtyBtn = (id, d, label, on = true) => `<button data-q="${id}" data-d="${d}" style="width:34px;height:34px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:18px;line-height:1;color:#fff;background:${on ? 'linear-gradient(160deg,#c9b8ea,#b19cd9)' : '#d9d2e3'};${on ? 'cursor:pointer' : 'cursor:default'}">${label}</button>`;
    const stepper = id => {
      const c = furn.cart()[id] || 0, room = MAX_OWN - furn.owned(id);
      return `<div style="display:flex;align-items:center;justify-content:center;gap:10px">${qtyBtn(id, -1, '−', c > 0)}<b style="min-width:20px;font-size:16px">${c}</b>${qtyBtn(id, 1, '＋', c < room)}</div>`;
    };
    const head = (title, sub) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px 4px"><h2 style="margin:0;font-size:20px">${title}</h2><b style="background:#fff3cf;border-radius:999px;padding:6px 14px">🪙 ${fmtN(ctx.wallet.get())}${ctx.gems ? ` 💎 ${fmtN(ctx.gems.get())}` : ''}</b></div><p style="margin:0;padding:0 16px 8px;font-size:13px;color:#8d7f9e">${sub}</p>`;
    let lastView = '', lastCat = '';
    const draw = () => {   // 数を変えるたびに作りなおすので、同じ画面なら見ていた位置(スクロール)を保つ
      const keep = lastView === view && lastCat === cat ? (box.querySelector('.sc')?.scrollTop || 0) : 0;
      paint(); lastView = view; lastCat = cat;
      const sc = box.querySelector('.sc'); if (sc) sc.scrollTop = keep;
    };
    const paint = () => {
      const cart = furn.cart(), total = furn.total(cart), n = Object.values(cart).reduce((a, b) => a + b, 0), coins = ctx.wallet.get();
      if (view === 'cart') {
        const rows = Object.entries(cart).map(([id, q]) => `<div style="display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:8px 10px;margin-bottom:8px;box-shadow:0 2px 8px #0001">
          ${thumbs.get(id) ? `<img src="${thumbs.get(id)}" width="48" height="48" alt="">` : ''}
          <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">${ITEM[id].name}</div><div style="font-size:12px;color:#8d7f9e">🪙 ${ITEM[id].price} × ${q} = <b style="color:${ink}">${ITEM[id].price * q}</b></div></div>${stepper(id)}</div>`).join('');
        const short = total - coins;
        box.innerHTML = head('カゴ', msg || 'ここで数を変えて、さいごに まとめて払うよ。')
          + `<div class="sc" style="flex:1;overflow:auto;padding:4px 16px">${rows || '<p style="text-align:center;color:#8d7f9e;margin-top:40px">カゴは空だよ</p>'}</div>
          <div style="padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));background:#fffaf0;box-shadow:0 -2px 10px #0001">
            <div style="display:flex;justify-content:space-between;font-weight:800"><span>ごうけい（${n}点）</span><span>🪙 ${total}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#8d7f9e;margin:2px 0 10px"><span>はらったあとの コイン</span><span>${short > 0 ? `<b style="color:#e0556b">あと ${short} たりない</b>` : '🪙 ' + (coins - total)}</span></div>
            <div style="display:flex;gap:8px"><button data-v="list" style="${btn('#d9d2e3', ink)};flex:1">もどる</button><button data-pay style="${btn(n && short <= 0 ? undefined : '#d9d2e3')};flex:2;${n && short <= 0 ? '' : 'cursor:default'}">まとめて買う</button></div></div>`;
        return;
      }
      box.innerHTML = head('ショップ', msg || '気に入った家具を、カゴに入れよう。お金が減るのは、さいごに「まとめて買う」を押したときだけ。') + `<div style="padding:0 16px 6px"><button data-fish style="border:0;border-radius:999px;padding:7px 14px;font:inherit;font-weight:800;background:#e3f2ff;color:#3d6a8f">🎣 つり道具はこちら</button> <button data-gbox style="border:0;border-radius:999px;padding:7px 14px;font:inherit;font-weight:800;background:#f3e9ff;color:#6b4a9a">🎮 ゲーム機(チャンクボックス)</button></div>`
        + `<div style="display:flex;gap:6px;overflow-x:auto;padding:0 16px 8px">${CATS.map(c => `<button data-c="${c}" style="${btn(c === cat ? undefined : '#ece7f3', c === cat ? '#fff' : ink)};padding:6px 12px;font-size:13px">${c}</button>`).join('')}</div>
        <div class="sc" style="flex:1;overflow:auto;padding:4px 16px 12px"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${ITEMS.filter(it => !it.noshop && (cat === 'すべて' || it.cat === cat)).map(it => {
          const own = furn.owned(it.id);
          return `<div style="background:#fff;border-radius:18px;padding:10px;box-shadow:0 2px 10px #0001;text-align:center">
            <div style="height:74px;display:flex;align-items:center;justify-content:center">${thumbs.get(it.id) ? `<img src="${thumbs.get(it.id)}" width="74" height="74" alt="">` : ''}</div>
            <div style="font-weight:800;font-size:14px">${it.name}</div>
            <div style="font-size:12px;color:#8d7f9e;margin:2px 0 6px">🪙 ${it.price}　もっている: ${own}</div>${own >= MAX_OWN ? '<div style="font-size:12px;color:#8d7f9e;height:34px;line-height:34px">これ以上は もてないよ</div>' : stepper(it.id)}</div>`;
        }).join('')}</div></div>
        <div style="padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));background:#fffaf0;box-shadow:0 -2px 10px #0001;display:flex;align-items:center;gap:12px">
          <div style="flex:1;font-weight:800">カゴ ${n}点<br><span style="font-size:13px;color:#8d7f9e">ごうけい 🪙 ${total}</span></div>
          ${ctx.params && ctx.params.from === 'home' ? `<button data-home style="${btn('#d9d2e3', ink)}">🏠 家へ</button>` : ''}<button data-v="cart" style="${btn(n ? undefined : '#d9d2e3')};${n ? '' : 'cursor:default'}">カゴを見る</button></div>`;
    };
    box.onclick = e => {
      if (e.target.closest('[data-fish]')) { ctx.open('fishing', { tab: 'shop' }); return; }
      if (e.target.closest('[data-gbox]')) { ctx.open('gamebox', { from: 'home' }); return; }
      if (e.target.closest('[data-home]')) { ctx.open('home'); return; }
      const ch = e.target.closest('[data-c]');
      if (ch) { cat = ch.dataset.c; draw(); return; }
      const q = e.target.closest('[data-q]');
      if (q) { const id = q.dataset.q, cur = furn.cart()[id] || 0; furn.setQty(id, cur + +q.dataset.d); msg = ''; draw(); return; }
      const v = e.target.closest('[data-v]')?.dataset.v;
      if (v) { if (v === 'cart' && !Object.keys(furn.cart()).length) return; view = v; msg = ''; draw(); return; }
      if (e.target.closest('[data-pay]')) {
        const items = Object.keys(furn.cart()), err = furn.buyCart(ctx.wallet);
        if (err) msg = err; else { msg = '買ったよ！「あなたの家」に置いてみよう。'; view = 'list'; ctx.emit('buy', { items }); }
        draw();
      }
    };
    draw();
    return { unmount() { box.remove(); } };
  },
};

export const homeApp = {
  mount(el, ctx) {
    const root = document.createElement('div');
    root.style.cssText = `position:absolute;inset:0;display:flex;flex-direction:column;font-family:inherit;color:${ink};background:linear-gradient(#fdf0f3,#eaf4ff)`;
    root.innerHTML = `<div class="plan" style="display:flex;align-items:center;gap:8px;padding:8px 10px 2px"></div>
      <div class="cv" style="flex:1;position:relative;min-height:0;touch-action:none"><div class="zm" style="position:absolute;right:8px;bottom:8px;display:flex;flex-direction:column;gap:6px;z-index:3"></div></div>
      <div class="tip" style="text-align:center;font-size:12px;color:#8d7f9e;padding:4px 10px;min-height:18px"></div>
      <div class="ctl" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:0 10px 6px"></div>
      <div class="inv" style="display:flex;gap:8px;overflow-x:auto;padding:6px 10px 12px"></div>
      <div class="sheet" style="position:absolute;inset:0;background:#0006;display:none;align-items:flex-end;justify-content:center"></div>`;
    el.appendChild(root);
    const cv = root.querySelector('.cv'), tip = root.querySelector('.tip'), ctl = root.querySelector('.ctl'), inv = root.querySelector('.inv'), planEl = root.querySelector('.plan'), sheet = root.querySelector('.sheet');

    // 部屋の3D(必要なときだけ描き直す)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    cv.appendChild(renderer.domElement);
    renderer.domElement.className = 'tw-canvas'; renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(6, 12, 8); scene.add(sun);
    const lm = c => new THREE.MeshLambertMaterial({ color: c });
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 140);
    const PAL = [[0xf8e6c8, 0xffe9ef, 0xe9f3ff], [0xe8dcc8, 0xe6f4e8, 0xfff3d9], [0xdfe6f3, 0xf3e8ff, 0xe8f6ff], [0xf3dcd0, 0xfff0e0, 0xf0f7ea], [0xe3e8d8, 0xeaf0ff, 0xfdeaf0]];

    let dirty = true, raf = 0, walk = false, last = performance.now();
    const draw = () => { dirty = true; };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (walk) { updateWalk(dt); renderer.render(scene, cam); }
      else if (dirty) { dirty = false; renderer.render(scene, cam); }
    };

    // 家と配置のデータ
    let house = houseData.get(), curId = house.rooms[0].id, placed = furn.placed(), meshes = new Map(), selUid = null, Y = {};
    const cur = () => house.rooms.find(r => r.id === curId) || house.rooms[0];
    const list = () => placed.filter(p => p.room === cur().id);
    const save = () => furn.savePlaced(placed);
    const uidOf = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    // ひとつもどる(何手か前まで)・一時記憶
    const hist = [], snap = () => JSON.stringify(placed);
    const remember = before => { if (before !== snap()) { hist.push(before); if (hist.length > 40) hist.shift(); } };
    const restore = st => { placed = JSON.parse(st); save(); if (!placed.some(p => p.uid === selUid)) selUid = null; drag = null; bad = false; relayout(); ui(); };

    // 部屋のかべ・ゆか(広げたときも作りなおす)
    const shell = new THREE.Group(); scene.add(shell);
    let walls = null;
    const wallVis = () => { if (!walls) return; walls.n.visible = Math.cos(camYaw) > -0.05; walls.w.visible = Math.sin(camYaw) > -0.05; };   // カメラ側の壁は消す(向こうが見えるように)
    const dispose = g => g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    function buildShell() {
      shell.children.slice().forEach(c => { shell.remove(c); dispose(c); });
      const r = cur(), C = r.cols, R = r.rows, pal = r.type === 'kitchen' ? [0xeef1f4, 0xfffaf0, 0xf2f7ee] : r.type === 'bath' ? [0xdff0f6, 0xf2fbfd, 0xe6f4fa] : PAL[house.rooms.indexOf(r) % PAL.length];
      const tile = () => { if (!r.type) return null; const gh = new THREE.GridHelper(Math.max(C, R), Math.max(C, R) * 2, 0xc8d3dc, 0xc8d3dc); gh.scale.set(C / Math.max(C, R), 1, R / Math.max(C, R)); gh.position.set(C / 2, 0.012, R / 2); return gh; };   // キッチン・おふろはタイルの床
      if (walk) {   // 歩くとき:かべは「中から見える面だけ」の板(外から見ると消えるので、カメラが外に出ても部屋が見える)
        const fl = new THREE.Mesh(new THREE.BoxGeometry(C, 0.3, R), lm(pal[0])); fl.position.set(C / 2, -0.15, R / 2);
        const wl = (w, c, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WALL_H), lm(c)); m.position.set(x, WALL_H / 2, z); m.rotation.y = ry; return m; };
        shell.add(fl, wl(C, pal[1], C / 2, 0, 0), wl(R, pal[2], 0, R / 2, Math.PI / 2), wl(R, pal[2], C, R / 2, -Math.PI / 2), wl(C, pal[1], C / 2, R, Math.PI)); const tg = tile(); if (tg) shell.add(tg);
        return;
      }
      const floor = new THREE.Mesh(new THREE.BoxGeometry(C, 0.3, R), lm(pal[0])); floor.position.set(C / 2, -0.15, R / 2);
      const grid = new THREE.GridHelper(Math.max(C, R), Math.max(C, R), 0xe9cfa6, 0xeed8b4); grid.scale.set(C / Math.max(C, R), 1, R / Math.max(C, R)); grid.position.set(C / 2, 0.01, R / 2);
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(C, WALL_H, 0.25), lm(pal[1])); w1.position.set(C / 2, WALL_H / 2, -0.125);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, WALL_H, R), lm(pal[2])); w2.position.set(-0.125, WALL_H / 2, R / 2);
      shell.add(floor, grid, w1, w2); walls = { n: w1, w: w2 }; wallVis();
    }
    // 拡大・縮小(ボタン・マウスのホイール・ピンチ)と、拡大中のスクロール(2本指でうごかす)
    let zoom = 1, panX = 0, panZ = 0, baseDist = 15, camYaw = Math.PI / 4, camPitch = 0.56;   // 見る向き(ドラッグ・↺↻で変えられる)
    const ZMIN = 0.45, ZMAX = 3.2;
    const setZoom = z => { zoom = Math.max(ZMIN, Math.min(ZMAX, z)); resize(); };
    function resize() {
      const w = cv.clientWidth || 300, h = cv.clientHeight || 300, r = cur(), big = Math.max(r.cols, r.rows);
      renderer.setSize(w, h, false); cam.aspect = w / h;
      if (walk) { cam.fov = 55; cam.updateProjectionMatrix(); return; }
      cam.fov = 38;   // 歩いているときのカメラは毎フレーム決める
      baseDist = Math.max(15, 6.4 / (cam.aspect * 0.344)) * Math.max(1, big / 8 * 0.97);
      const dist = baseDist / zoom, cx = r.cols / 2 + panX, cz = r.rows / 2 + panZ;
      const D = dist * 1.04, cp = Math.cos(camPitch); cam.position.set(cx + Math.sin(camYaw) * cp * D, Math.sin(camPitch) * D, cz + Math.cos(camYaw) * cp * D); cam.lookAt(cx, 0.9, cz); wallVis();
      cam.updateProjectionMatrix(); draw();
    }
    const zm = root.querySelector('.zm'), zb = 'width:40px;height:40px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:20px;line-height:1;color:#fff;background:linear-gradient(160deg,#c9b8ea,#b19cd9);box-shadow:0 2px 6px #0003;cursor:pointer';
    zm.innerHTML = `<button data-z="in" style="${zb}" aria-label="拡大">＋</button><button data-z="out" style="${zb}" aria-label="縮小">−</button><button data-z="reset" style="${zb};font-size:14px;background:#d9d2e3;color:${ink}" aria-label="もとの大きさ">⟲</button>`;
    zm.onpointerdown = e => e.stopPropagation();
    zm.onclick = e => { const z = e.target.closest('[data-z]')?.dataset.z; if (!z) return; if (z === 'reset') { panX = 0; panZ = 0; camYaw = Math.PI / 4; camPitch = 0.56; setZoom(1); } else setZoom(zoom * (z === 'in' ? 1.3 : 1 / 1.3)); };
    // 左下:見る向き・一時記憶・記憶までもどる・ひとつもどる
    const hz = document.createElement('div'); hz.style.cssText = 'position:absolute;left:8px;bottom:8px;display:flex;gap:6px;z-index:3'; cv.appendChild(hz);
    const hb = (k, ic, lab) => `<button data-h="${k}" style="${zb};width:46px;height:46px;font-size:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;color:${ink}" aria-label="${lab}">${ic}<span style="font-size:8px;font-weight:800;margin-top:1px">${lab}</span></button>`;
    hz.innerHTML = hb('l', '↺', '向き') + hb('r', '↻', '向き') + hb('memo', '💽', '記憶') + hb('back', '⏪', '記憶へ') + hb('undo', '↩️', 'ひとつ');
    hz.onpointerdown = e => e.stopPropagation();
    hz.onclick = e => {
      const h = e.target.closest('[data-h]')?.dataset.h; if (!h) return;
      if (h === 'l' || h === 'r') { camYaw += (h === 'l' ? -1 : 1) * Math.PI / 4; resize(); return; }
      if (h === 'memo') { const m = snap(); ctx.storage.set('memo', m); tip.textContent = '💽 いまの配置を記憶したよ。⏪でここまで戻れるよ。'; return; }
      if (h === 'back') { const m = ctx.storage.get('memo'); if (!m) { tip.textContent = 'まだ記憶していないよ。💽で記憶してね。'; return; } const before = snap(); restore(m); remember(before); tip.textContent = '⏪ 記憶した配置に戻したよ。(↩️でやり直しも取り消せる)'; return; }
      if (h === 'undo') { if (!hist.length) { tip.textContent = 'これより前には戻れないよ。'; return; } restore(hist.pop()); tip.textContent = `↩️ ひとつ戻したよ。(あと${hist.length}回戻れる)`; }
    };
    cv.addEventListener('wheel', e => { if (walk) return; e.preventDefault(); setZoom(zoom * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    const ro = new ResizeObserver(resize); ro.observe(cv);

    // 家具の表示
    const outline = new THREE.BoxHelper(new THREE.Object3D(), 0xff7fa0); outline.visible = false; outline.renderOrder = 9; outline.material.depthTest = false; scene.add(outline);
    function clearMeshes() { for (const m of meshes.values()) { scene.remove(m); dispose(m); } meshes = new Map(); }
    function make(p) {
      const g = makeModel(p.id), pick = new THREE.Group(); pick.add(g); pick.userData.uid = p.uid;
      g.traverse(o => { if (o.isMesh) o.userData.uid = p.uid; });
      scene.add(pick); meshes.set(p.uid, pick);
    }
    // いまの部屋の家具を、重ねる高さも含めてぜんぶ置きなおす
    function relayout() {
      const L = list(); Y = stackY(L);
      for (const p of L) {
        if (!meshes.has(p.uid)) make(p);
        const m = meshes.get(p.uid), k = kindOf(p.id), y = Y[p.uid] || 0;
        if (k === 'wall') {
          const len = wallLen(p) / U, a = p.gx / U + len / 2;
          if (p.wall === 'w') { m.position.set(0, y, a); m.rotation.y = Math.PI / 2; } else { m.position.set(a, y, 0); m.rotation.y = 0; }
        } else if (k === 'ceil') { m.position.set((p.gx + U / 2) / U, y, (p.gz + U / 2) / U); m.rotation.y = 0; }
        else { const [w, d] = size(p); m.position.set((p.gx + w / 2) / U, y, (p.gz + d / 2) / U); m.rotation.y = -p.r * Math.PI / 2; }
      }
      for (const [uid, m] of meshes) if (!L.some(p => p.uid === uid)) { scene.remove(m); dispose(m); meshes.delete(uid); }
      mark(); draw();
    }
    let bad = false;
    function mark() {
      const m = selUid && meshes.get(selUid);
      outline.visible = !!m; if (m) { outline.setFromObject(m); outline.material.color.set(bad ? 0xff3030 : 0xff7fa0); }
    }
    function enterRoom(id) {
      curId = id; selUid = null; bad = false; zoom = 1; panX = 0; panZ = 0; clearMeshes(); buildShell(); resize(); relayout(); ui();
    }

    function remaining(id) { return furn.owned(id) - placed.filter(p => p.id === id).length; }
    const gemsOf = () => (ctx.gems ? ctx.gems.get() : null);
    function planUI() {
      const xs = house.rooms.map(r => r.sx), ys = house.rooms.map(r => r.sy), x0 = Math.min(...xs), y0 = Math.min(...ys), W = Math.max(...xs) - x0 + 1, H = Math.max(...ys) - y0 + 1;
      const tiles = house.rooms.map(r => `<button data-room="${r.id}" style="grid-column:${r.sx - x0 + 1};grid-row:${r.sy - y0 + 1};${btn(r.id === cur().id ? undefined : '#fff', r.id === cur().id ? '#fff' : ink)};border-radius:10px;padding:4px 6px;font-size:11px;box-shadow:0 1px 5px #0002;min-width:56px;overflow:hidden;text-overflow:ellipsis">${r.name}<br><span style="font-weight:600;opacity:.75">${r.cols}×${r.rows}</span></button>`).join('');
      planEl.innerHTML = `<div style="flex:1;min-width:0;overflow:auto"><div style="display:grid;grid-template-columns:repeat(${W},auto);grid-template-rows:repeat(${H},auto);gap:4px;width:max-content" title="間取り">${tiles}</div></div>
        <div style="text-align:right;font-weight:800;font-size:13px;line-height:1.5;white-space:nowrap">🪙 ${fmtN(ctx.wallet.get())}${gemsOf() != null ? `<br>💎 ${fmtN(gemsOf())}` : ''}</div>
        <button data-a="size" style="${btn('linear-gradient(160deg,#9fe3c0,#6fcf9f)')};padding:8px 12px;font-size:13px">🏠 ひろげる</button>`;
    }
    function ui() {
      planUI();
      const p = placed.find(x => x.uid === selUid), k = p && kindOf(p.id);
      tip.textContent = p ? `${ITEM[p.id].name}をえらび中。ドラッグで動かせるよ。ほかの家具はダブルタップでえらぶ。` : (Object.keys(furn.inv()).length ? '家具はダブルタップでえらぶよ。何もない所をドラッグで向きを変えられるよ。' : 'まだ家具がないよ。ショップで買ってこよう。');
      ctl.innerHTML = p ? `${k === 'floor' || k === 'flat' ? `<button data-a="rot" style="${btn('linear-gradient(160deg,#c9b8ea,#b19cd9)')}">まわす</button>` : ''}<button data-a="del" style="${btn('linear-gradient(160deg,#ffcf9f,#ffb27a)')}">しまう</button><button data-a="off" style="${btn('#d9d2e3')}">おわり</button>` : (`<button data-a="walk" style="${btn('linear-gradient(160deg,#9fe3c0,#6fcf9f)')}">🚶 中に入る</button><button data-a="shop" style="${btn('linear-gradient(160deg,#ffd0dc,#ffb3c1)')}">🛒 ネットで買う</button><button data-a="album" style="${btn('linear-gradient(160deg,#c9b8ea,#b19cd9)')}">🖼 アルバム</button><button data-a="gbox" style="${btn('linear-gradient(160deg,#b9d8ff,#8fbaf0)')}">🎮 ゲーム機</button>` + ((ctx.features || []).includes('study') ? `<button data-a="study" style="${btn('linear-gradient(160deg,#ffe08a,#ffc93c)', ink)}">📒 勉強部屋</button>` : ''));
      const owned = ITEMS.filter(it => furn.owned(it.id) > 0);
      inv.innerHTML = owned.map(it => { const r = remaining(it.id); return `<button data-i="${it.id}" style="${btn(r > 0 ? '#fff' : '#ece7f3', r > 0 ? ink : '#a99bbb')};box-shadow:0 1px 6px #0002;${r > 0 ? '' : 'cursor:default'}">${it.name} ×${r}</button>`; }).join('');
    }

    // ひろげる・部屋を増やす
    let sheetMsg = '';
    function openSheet() {
      const r = cur(), C = houseData.cost(ctx.house), g = gemsOf();
      const row = (axis, label) => {
        const full = r[axis] >= SIDE_MAX;
        return `<div style="background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px #0001">
          <div style="font-weight:800">${label}（いま ${r[axis]}マス${full ? '・これ以上は広げられないよ' : ''}）</div>
          ${full ? '' : `<div style="display:flex;gap:8px;margin-top:8px"><button data-x="${axis}" data-via="coins" style="${btn(ctx.wallet.get() >= C.coinsPerLine ? undefined : '#d9d2e3')};flex:1">🪙 ${C.coinsPerLine}</button>${g != null ? `<button data-x="${axis}" data-via="gems" style="${btn(g >= C.gemsPerLine ? 'linear-gradient(160deg,#9fd8ff,#6cb8f0)' : '#d9d2e3')};flex:1">💎 ${C.gemsPerLine}</button>` : ''}</div>`}</div>`;
      };
      sheet.style.display = 'flex';
      sheet.innerHTML = `<div style="background:#fffaf0;border-radius:22px 22px 0 0;width:min(520px,100%);max-height:88%;overflow:auto;padding:14px 16px calc(16px + env(safe-area-inset-bottom,0px))">
        <div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">🏠 ${r.name}を ひろげる</h3><b style="background:#fff3cf;border-radius:999px;padding:5px 12px;font-size:13px">🪙 ${fmtN(ctx.wallet.get())}${g != null ? ` 💎 ${fmtN(g)}` : ''}</b></div>
        <p style="margin:6px 0 10px;font-size:13px;color:#8d7f9e">${sheetMsg || 'いまは ' + r.cols + '列 × ' + r.rows + '行。1列・1行ごとに、コインかダイヤで広げられるよ(かべの反対がわにのびるから、家具は動かないよ)。'}</p>
        ${row('cols', 'よこ（列）を1つ')}${row('rows', 'たて（行）を1つ')}
        ${g != null ? `<div style="background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px #0001"><div style="font-weight:800">もうひとつ、部屋を増やす（${house.rooms.length}部屋）</div><div style="font-size:12px;color:#8d7f9e;margin:2px 0 8px">いまの部屋のとなりに、新しい部屋がつながるよ。ダイヤだけで増やせるよ。</div><button data-x="room" style="${btn(g >= C.gemsPerRoom ? 'linear-gradient(160deg,#9fd8ff,#6cb8f0)' : '#d9d2e3')};width:100%">💎 ${C.gemsPerRoom} で 部屋を増やす</button></div>` : ''}
        <div style="background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px #0001"><div style="font-weight:800;margin-bottom:6px">部屋の種類</div><div style="display:flex;gap:6px">${ROOM_TYPES.map(([k, n]) => `<button data-x="type" data-t="${k}" style="${btn((r.type || '') === k ? undefined : '#ece7f3', (r.type || '') === k ? '#fff' : ink)};flex:1;padding:8px 0;font-size:13px">${n}</button>`).join('')}</div><div style="font-size:12px;color:#8d7f9e;margin-top:6px">キッチン・バスルームは、床がタイルになるよ。家具はショップの「キッチン・おふろ」から。</div></div>
        <div style="background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:10px;box-shadow:0 2px 8px #0001"><div style="font-weight:800;margin-bottom:6px">部屋の名前</div><input class="nm" value="${r.name}" maxlength="10" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:2px solid #e3d9f0;font:inherit;color:${ink}"></div>
        <button data-x="close" style="${btn('#d9d2e3', ink)};width:100%">とじる</button></div>`;
    }
    sheet.onclick = e => {
      if (e.target === sheet) { sheet.style.display = 'none'; return; }
      const b = e.target.closest('[data-x]'); if (!b) return;
      const x = b.dataset.x, r = cur();
      if (x === 'close') { const nm = sheet.querySelector('.nm'); if (nm && nm.value.trim() && nm.value !== r.name) { houseData.rename(r.id, nm.value.trim()); house = houseData.get(); } sheet.style.display = 'none'; sheetMsg = ''; ui(); return; }
      if (x === 'type') { houseData.setType(r.id, b.dataset.t); house = houseData.get(); buildShell(); ui(); openSheet(); return; }
      if (x === 'room') {
        const res = houseData.addRoom(r.id, ctx);
        if (res.err) sheetMsg = res.err; else { house = houseData.get(); sheetMsg = ''; sheet.style.display = 'none'; enterRoom(res.room.id); tip.textContent = `「${res.room.name}」ができたよ！ 家具を置いてみよう。`; return; }
        openSheet(); return;
      }
      const err = houseData.expand(r.id, x, b.dataset.via, ctx);
      sheetMsg = err || `${x === 'cols' ? 'よこ' : 'たて'}に 1マス 広がったよ！`;
      house = houseData.get(); buildShell(); resize(); relayout(); ui(); openSheet();
    };

    // 操作
    planEl.onclick = e => {
      const id = e.target.closest('[data-room]')?.dataset.room; if (id && id !== cur().id) { enterRoom(id); return; }
      if (e.target.closest('[data-a="size"]')) { sheetMsg = ''; openSheet(); }
    };
    ctl.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a, p = placed.find(x => x.uid === selUid);
      if (a === 'walk') { enterWalk(); return; }
      if (a === 'album') { ctx.open('album', { from: 'home' }); return; }
      if (a === 'shop') { ctx.open('shop', { from: 'home' }); return; }   // ネットショッピング(家からそのままショップへ)
      if (a === 'gbox') { ctx.open('gamebox', { from: 'home' }); return; }   // チャンクボックス(英語対戦・あそびゲーム)
      if (a === 'study') { ctx.emit('study'); return; }   // 組み込み先(チャンクタウン)の勉強部屋を開く
      if (!a || !p) return;
      const before = snap();
      if (a === 'off') selUid = null;
      else if (a === 'del') { placed = placed.filter(x => x !== p); selUid = null; save(); }
      else if (a === 'rot') {
        const rm = cur();
        for (const r of [1, 2, 3]) {
          const q = { ...p, r: (p.r + r) % 4 };
          // 回したあとにはみ出すときは、はみ出さないようにずらして試す
          const [w, d] = size(q); q.gx = Math.min(q.gx, rm.cols * U - w); q.gz = Math.min(q.gz, rm.rows * U - d);
          if (inside(rm, q)) { Object.assign(p, q); save(); break; }
        }
      }
      remember(before); ui(); relayout();
    };
    inv.onclick = e => {
      const id = e.target.closest('[data-i]')?.dataset.i; if (!id || remaining(id) <= 0) return;
      const rm = cur(), near = { x: Math.max(0, Math.min(rm.cols, cam.position.x)) * U, z: Math.max(0, Math.min(rm.rows, cam.position.z)) * U };   // カメラにいちばん近い所(手前)に出す
      const before = snap(), p = findSpot(rm, list(), { uid: uidOf(), id, room: rm.id, gx: 0, gz: 0, r: 0 }, near);
      placed.push(p); selUid = p.uid; save(); remember(before); ui(); relayout();
    };

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), pt = new THREE.Vector3();
    const groundAt = y => new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
    function aim(e) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); }
    function hitUid(e) { aim(e); const h = ray.intersectObjects([...meshes.values()], true)[0]; return h?.object.userData.uid || null; }
    // ゆか側：つかんだ位置からのずれ off を保ったまま、半マスにそろえる
    function cellFor(e, p, off) {
      aim(e); const k = kindOf(p.id);
      if (!ray.ray.intersectPlane(groundAt(k === 'ceil' ? Y[p.uid] : (Y[p.uid] || 0)), pt)) return null;
      const rm = cur(), [w, d] = k === 'ceil' ? [U, U] : size(p), cx = pt.x * U + (off ? off.x : 0), cz = pt.z * U + (off ? off.z : 0);
      return { gx: Math.max(0, Math.min(rm.cols * U - w, Math.round(cx - w / 2))), gz: Math.max(0, Math.min(rm.rows * U - d, Math.round(cz - d / 2))) };
    }
    // かべ側：どちらの壁か・壁にそった位置・高さ
    const wallN = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), wallW = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), v2 = new THREE.Vector3();
    function wallFor(e, p) {
      aim(e); const rm = cur(), len = wallLen(p), hh = heightOf(p.id); let best = null;
      if (ray.ray.intersectPlane(wallN, v2) && v2.x >= 0 && v2.x <= rm.cols && v2.y >= 0 && v2.y <= WALL_H) best = { side: 'n', a: v2.x, y: v2.y, t: v2.distanceTo(ray.ray.origin) };
      if (ray.ray.intersectPlane(wallW, v2) && v2.z >= 0 && v2.z <= rm.rows && v2.y >= 0 && v2.y <= WALL_H) { const t = v2.distanceTo(ray.ray.origin); if (!best || t < best.t) best = { side: 'w', a: v2.z, y: v2.y, t }; }
      if (!best) return null;
      const total = (best.side === 'n' ? rm.cols : rm.rows) * U;
      return { wall: best.side, gx: Math.max(0, Math.min(total - len, Math.round(best.a * U - len / 2))), y: Math.round(Math.max(0.1, Math.min(WALL_H - hh - 0.05, best.y - hh / 2)) * 10) / 10 };
    }
    const mover = (e, p, off) => (kindOf(p.id) === 'wall' ? wallFor(e, p) : cellFor(e, p, off));
    const toTop = p => { placed = placed.filter(x => x !== p); placed.push(p); };   // 動かした家具は一番上にのる
    let drag = null;
    // この部屋の操作は、外側(町の操作)に伝えない(伝わると、町のほうが指を横取りして動けなくなる)
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) cv.addEventListener(t, e => e.stopPropagation());
    const ptrs = new Map(); let pinch = null;
    const pinchState = () => { const [a, b] = [...ptrs.values()]; return { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }; };
    cv.onpointerdown = e => {
      if (walk) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {   // 2本指：つかんでいた家具はもとにもどして、拡大・縮小とスクロールに切りかえる
        if (drag) { Object.assign(drag.p, drag.from); drag = null; relayout(); }
        turn = null; pinch = { ...pinchState(), zoom }; return;
      }
      if (ptrs.size > 2) return;
      const u = hitUid(e);
      if (u && u === selUid) {   // えらんでいる家具だけ、つかんで動かせる
        const p = placed.find(x => x.uid === u), k = kindOf(p.id); bad = false;
        let off = null;
        if (k !== 'wall') { aim(e); if (ray.ray.intersectPlane(groundAt(Y[u] || 0), pt)) { const [w, d] = k === 'ceil' ? [U, U] : size(p); off = { x: p.gx + w / 2 - pt.x * U, z: p.gz + d / 2 - pt.z * U }; } }
        drag = { p, from: { ...p }, before: snap(), off, moved: false, id: e.pointerId }; cv.setPointerCapture(e.pointerId); mark(); draw();
        return;
      }
      // それ以外:ドラッグなら見る向きを変える。タップなら(はなしたときに)ダブルタップの判定・えらび中の家具をそこへ
      turn = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: camYaw, pitch: camPitch, moved: false, uid: u }; cv.setPointerCapture(e.pointerId);
    };
    let turn = null, lastTap = null;
    function tapAt(e, u) {
      const now = performance.now();
      if (u) {
        if (lastTap && lastTap.uid === u && now - lastTap.t < 450) { selUid = u; bad = false; lastTap = null; ui(); mark(); draw(); return; }   // ダブルタップでえらぶ
        lastTap = { uid: u, t: now };
        if (u !== selUid) tip.textContent = 'えらぶときは、ダブルタップしてね。';
        return;
      }
      lastTap = null;
      if (selUid) {
        const p = placed.find(x => x.uid === selUid), c = p && mover(e, p, null);
        if (c) { const before = snap(), from = { ...p }; Object.assign(p, c); if (inside(cur(), p)) { toTop(p); save(); remember(before); } else { Object.assign(p, from); tip.textContent = 'そこには置けないよ。'; } relayout(); }
      }
    }
    cv.onpointermove = e => {
      if (walk) return;
      if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && ptrs.size >= 2) {
        const c = pinchState(), k = baseDist / zoom * 2 * Math.tan(19 * Math.PI / 180) / (cv.clientHeight || 300);
        const dx = c.mx - pinch.mx, dy = c.my - pinch.my, r = cur();
        const rx = Math.cos(camYaw), rz = -Math.sin(camYaw), fx = -Math.sin(camYaw), fz = -Math.cos(camYaw); panX = Math.max(-r.cols / 2, Math.min(r.cols / 2, panX + k * (-rx * dx + fx * dy))); panZ = Math.max(-r.rows / 2, Math.min(r.rows / 2, panZ + k * (-rz * dx + fz * dy)));
        pinch.mx = c.mx; pinch.my = c.my; zoom = Math.max(ZMIN, Math.min(ZMAX, pinch.zoom * c.d / pinch.d)); resize(); return;
      }
      if (turn && e.pointerId === turn.id) {
        const dx = e.clientX - turn.x, dy = e.clientY - turn.y; if (Math.hypot(dx, dy) > 8) turn.moved = true;
        if (turn.moved) { camYaw = turn.yaw - dx * 0.008; camPitch = Math.max(0.22, Math.min(1.4, turn.pitch + dy * 0.005)); resize(); }
        return;
      }
      if (!drag || e.pointerId !== drag.id) return;
      const c = mover(e, drag.p, drag.off); if (!c) return;
      if (Object.keys(c).some(k => c[k] !== drag.p[k])) { drag.moved = true; Object.assign(drag.p, c); relayout(); }
    };
    const up = e => {
      ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
      if (turn && e.pointerId === turn.id) { const t0 = turn; turn = null; if (!t0.moved && e.type === 'pointerup') tapAt(e, t0.uid); return; }
      if (!drag || e.pointerId !== drag.id) return;
      const p = drag.p;
      if (drag.moved && !inside(cur(), p)) { Object.assign(p, drag.from); tip.textContent = 'そこには置けないよ。'; } else if (drag.moved) { toTop(p); save(); remember(drag.before); }
      drag = null; relayout();
    };
    cv.onpointerup = up; cv.onpointercancel = up;

    // ---- 歩く(自分が部屋の中に立って、歩きまわる。写真も撮れる) ----
    // お客さん(はなちゃん):手をつないで歩く・となりにすわる/ねる・話す
    const guest = ctx.params && ctx.params.guest || null;
    const GL = k => { const L = (guest && guest.lines && guest.lines[k]) || ['…']; return L[Math.floor(Math.random() * L.length)]; };
    let gch = null, gPose = null, gHold = false, gK = 0, gx = 0, gz = 0, gry = 0, gBub = null, gBubT = 0;
    const holdP = new THREE.Vector3();
    let wPose = null, wy = 0, wLast = '', wInput = null, wme = null, wyaw = 0.8, wpitch = 0.3, wdist = 4.2, wx = 0, wz = 0, wry = 0, wspeed = 0, blockers = [], wUI = null;
    const editEls = [planEl, tip, ctl, inv, zm, hz];
    function calcBlockers() {   // ゆかにじかに置いてある背の高い家具は、とおれない
      blockers = []; Y = stackY(list());
      for (const p of list()) {
        const k = kindOf(p.id); if (k !== 'floor' || (Y[p.uid] || 0) > 0.05 || heightOf(p.id) < 0.35) continue;
        const [w, d] = size(p); blockers.push({ x0: p.gx / U + 0.05, x1: (p.gx + w) / U - 0.05, z0: p.gz / U + 0.05, z1: (p.gz + d) / U - 0.05 });
      }
    }
    function walkTo(nx, nz) {
      const rm = cur(), R = 0.33;
      nx = clamp(nx, R + 0.05, rm.cols - R - 0.05); nz = clamp(nz, R + 0.05, rm.rows - R - 0.05);
      for (let it = 0; it < 2; it++) for (const b of blockers) {
        const cx = clamp(nx, b.x0, b.x1), cz = clamp(nz, b.z0, b.z1), dx = nx - cx, dz = nz - cz, d = Math.hypot(dx, dz);
        if (d < R) { if (d > 1e-4) { nx = cx + dx / d * R; nz = cz + dz / d * R; } else { nx = b.x0 - R; } }   // めりこんだら外へ
      }
      return [clamp(nx, R + 0.05, rm.cols - R - 0.05), clamp(nz, R + 0.05, rm.rows - R - 0.05)];
    }
    function updateWalk(dt) {
      const inp = wInput.read();
      wyaw -= inp.camDX * 0.006; wpitch = clamp(wpitch + inp.camDY * 0.004, 0.04, 1.3); wdist = clamp(wdist + inp.zoom * 0.6, 1.5, 9);
      const mag = Math.min(1, Math.hypot(inp.mx, inp.my)), target = mag > 0.05 && !wPose ? (inp.run ? 5.5 : 3.2) * Math.max(mag, 0.4) : 0;
      if (wPose && mag > 0.3) standUp();   // 動こうとしたら、立つ
      wspeed += (target - wspeed) * Math.min(1, dt * 10);
      if (mag > 0.05 && !wPose) {
        const sn = Math.sin(wyaw), cs = Math.cos(wyaw), vx = (inp.mx * cs + inp.my * sn) / mag, vz = (-inp.mx * sn + inp.my * cs) / mag;
        let d = Math.atan2(vx, vz) - wry; d = Math.atan2(Math.sin(d), Math.cos(d)); wry += d * Math.min(1, dt * 12);
        [wx, wz] = walkTo(wx + vx * wspeed * dt, wz + vz * wspeed * dt);
      }
      if (gch) guestUpdate(dt);
      wme.root.position.set(wx, wPose ? wy : 0, wz); wme.root.rotation.y = wry; wme.update(dt, wspeed); wme.root.visible = wdist > 1.9;
      const look = new THREE.Vector3(wx, 1.1, wz), op = wpitch;
      if (wPose) { const lie = wme.pose === 'lie'; const mx = gPose ? (wx + gx) / 2 : wx, mz = gPose ? (wz + gz) / 2 : wz, k = lie ? 0.1 : 0.7; look.set(mx + Math.sin(wyaw) * k, lie ? wy : 0.6 + wy * 0.5, mz + Math.cos(wyaw) * k); }   // すわる・ねるときは、2人が画面の上のほうに見えるように
      cam.position.set(wx + Math.sin(wyaw) * Math.cos(op) * wdist, 1.1 + Math.sin(op) * wdist, wz + Math.cos(wyaw) * Math.cos(op) * wdist);
      cam.lookAt(look);
      cv.dataset.wp = wx.toFixed(2) + ',' + wz.toFixed(2);
      // 近くに座れる・寝られる家具があれば、ボタンを出す
      const near = wPose ? wPose.p : seatNear(), door = !wPose && !near ? doorNear() : null;
      const label = wPose ? '🧍 立つ' : near ? (ITEM[near.id].lie ? '🛏 寝る' : near.id === 'bathtub' ? '🛁 入る' : '🪑 座る') : door ? '🚪 となりの部屋へ' : '';
      if (label !== wLast && wUI) { wLast = label; const b = wUI.querySelector('[data-w="act"]'); b.style.display = label ? '' : 'none'; b.textContent = label; }
    }
    function guestSay(t, sec = 3) {
      if (!wUI) return; gBub?.remove(); gBub = document.createElement('div'); gBub.textContent = `${guest.name}「${t}」`;
      gBub.style.cssText = 'position:absolute;left:50%;top:64px;transform:translateX(-50%);max-width:80%;background:#fffaf2;color:#5a4a6b;border-radius:16px;padding:8px 14px;font-size:14px;font-weight:700;box-shadow:0 2px 8px #0003;pointer-events:none;z-index:5;text-align:center';
      wUI.appendChild(gBub); gBubT = sec;
    }
    function guestUpdate(dt) {
      if (gBubT > 0 && (gBubT -= dt) <= 0) { gBub?.remove(); gBub = null; }
      let sp = 0;
      if (gPose) { gx = gPose.x; gz = gPose.z; gry = gPose.ry; }
      else {
        const tx = wx + Math.cos(wry) * 0.62, tz = wz - Math.sin(wry) * 0.62, [cx, cz] = walkTo(tx, tz), free = Math.hypot(cx - tx, cz - tz) < 0.06;
        if (gHold && !free) gHold = false; else if (!gHold && free && Math.hypot(gx - tx, gz - tz) < 1.6) { gHold = true; gK = 0; }
        const ox = gx, oz = gz;
        if (gHold) { gK = Math.min(1, gK + dt * 2.5); const k = gK < 1 ? 1 - Math.exp(-dt * 8) : 1; gx += (tx - gx) * k; gz += (tz - gz) * k; gry = wry; }
        else {   // 手をはなしているときは、うしろについてくる
          const bx = wx - Math.sin(wry) * 0.9, bz = wz - Math.cos(wry) * 0.9, d = Math.hypot(bx - gx, bz - gz);
          if (d > 0.3) { const v = Math.min(d * 3, 4) * dt; [gx, gz] = walkTo(gx + (bx - gx) / d * v, gz + (bz - gz) / d * v); gry = Math.atan2(bx - ox, bz - oz); }
        }
        sp = Math.hypot(gx - ox, gz - oz) / Math.max(dt, 1e-3);
      }
      gch.pose = gPose ? gPose.pose : null;
      gch.root.position.set(gx, gPose ? gPose.y : 0, gz); gch.root.rotation.y = gry;
      if ((gHold && !wPose) || (gPose && wPose)) { holdP.set((wx + gx) / 2, gPose ? gPose.y + (gPose.pose === 'lie' ? 0.12 : 0.55) : 0.66, (wz + gz) / 2); gch.holdTo = holdP; gch.holdArm = 0; wme.holdTo = holdP; wme.holdArm = 1; }
      else { gch.holdTo = null; wme.holdTo = null; }
      gch.update(dt, sp < 0.08 ? 0 : sp);
    }
    // となりにすわる/ねる(自分の左)
    function guestPose(pose, y) {
      if (!gch) return;
      const sn = Math.sin(wry), cs = Math.cos(wry);
      gPose = { x: wx + cs * 0.6, z: wz - sn * 0.6, ry: wry, y, pose };
    }
    function floorLie() {   // 家具がなくても、床にゴロゴロ
      const sn = Math.sin(wry), cs = Math.cos(wry);
      if (gch) { [wx, wz] = walkTo(wx - cs * 0.3, wz + sn * 0.3); }
      // 頭はうしろへのびるので、2人とも頭までへやの中に入るように、ずらす
      for (let k = 0; k < 3; k++) for (const [ox, oz] of [[0, 0], [-Math.sin(wry) * 1.3, -Math.cos(wry) * 1.3], ...(gch ? [[cs * 0.6, -sn * 0.6], [cs * 0.6 - Math.sin(wry) * 1.3, -sn * 0.6 - Math.cos(wry) * 1.3]] : [])]) { const [ax, az] = walkTo(wx + ox, wz + oz); wx += ax - (wx + ox); wz += az - (wz + oz); }
      wy = 0.14; wPose = { p: null, floor: true, stand: [0, 0.6], yaw: wry, cx: wx, cz: wz }; wme.pose = 'lie'; wspeed = 0; wyaw = wry; wpitch = 0.95; wdist = 3.0;
      guestPose('lie', 0.14);
      if (gch) guestSay(GL('goro'));
    }
    function guestTalk() {
      if (!gch) return;
      const where = wPose ? (wme.pose === 'lie' ? (wPose.floor ? '床にならんでゴロゴロ寝転んで' : 'ベッドにならんで寝転んで') : 'ならんですわって') : '部屋でくつろいで';
      const first = wPose && wme.pose === 'lie' ? GL('talkLie') : GL('talk');
      guest.chat(`いま「${ctx.player?.name || 'あなた'}」の家に遊びに来ていて、${where}、手をつないでおしゃべりしている。`, first);
    }
    function doorNear() {   // ドアのそば(壁かけのドア)
      for (const p of list()) {
        if (!ITEM[p.id].door) continue;
        const a = p.gx / U + wallLen(p) / U / 2, dx = p.wall === 'w' ? 0.45 : a, dz = p.wall === 'w' ? a : 0.45;
        if (Math.hypot(wx - dx, wz - dz) < 1.1) return p;
      }
      return null;
    }
    function goThroughDoor() {
      const others = house.rooms.filter(r => r.id !== cur().id);
      if (!others.length) { if (gch) guestSay('部屋をふやすと、ここから行けるんだって'); else { tip.textContent = '部屋をふやすと、ドアからとなりの部屋へ行けるよ'; } return; }
      const go = id => {
        curId = id; selUid = null; clearMeshes(); buildShell(); relayout(); calcBlockers();
        const d = list().find(p => ITEM[p.id].door), rm = cur();
        if (d) { const a = d.gx / U + wallLen(d) / U / 2; [wx, wz] = walkTo(d.wall === 'w' ? 0.8 : a, d.wall === 'w' ? a : 0.8); wry = d.wall === 'w' ? Math.PI / 2 : 0; }
        else { [wx, wz] = walkTo(rm.cols / 2, rm.rows - 1); wry = Math.PI; }
        wyaw = wry + Math.PI; wPose = null; wme.pose = null; wLast = '';
        if (gch) { gPose = null; gHold = false; gx = wx + Math.cos(wry) * 0.62; gz = wz - Math.sin(wry) * 0.62; [gx, gz] = walkTo(gx, gz); }
        resize();
      };
      if (others.length === 1) return go(others[0].id);
      const pick = document.createElement('div'); pick.style.cssText = 'position:absolute;left:50%;bottom:80px;transform:translateX(-50%);background:#fffaf2;border-radius:18px;padding:10px;box-shadow:0 4px 16px #0003;z-index:6;display:flex;flex-direction:column;gap:6px;min-width:180px';
      pick.innerHTML = `<b style="font-size:13px;color:${ink};text-align:center">どの部屋へ?</b>` + others.map(r => `<button data-r="${r.id}" style="border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:800;background:#ffe9a8;color:${ink}">${r.name}</button>`).join('') + `<button data-r="" style="border:0;border-radius:999px;padding:7px;font:inherit;background:#ece7f3;color:${ink}">やめる</button>`;
      pick.onclick = e => { const b = e.target.closest('[data-r]'); if (!b) return; pick.remove(); if (b.dataset.r) go(b.dataset.r); };
      wUI.appendChild(pick);
    }
    function seatNear() {
      let best = null, bd = 0.8;
      for (const p of list()) {
        const it = ITEM[p.id]; if (!(it.sit || it.lie)) continue;
        const [w, d] = size(p), dx = Math.max(p.gx / U - wx, 0, wx - (p.gx + w) / U), dz = Math.max(p.gz / U - wz, 0, wz - (p.gz + d) / U), dd = Math.hypot(dx, dz);
        if (dd < bd) { bd = dd; best = p; }
      }
      return best;
    }
    // 家具に座る/寝る(家具のむきに合わせる)。立つときは、家具の前(ベッドは横)へ
    function takePose(p) {
      const it = ITEM[p.id], [w, d] = size(p), cx = (p.gx + w / 2) / U, cz = (p.gz + d / 2) / U, yaw = -p.r * Math.PI / 2, sn = Math.sin(yaw), cs = Math.cos(yaw);
      let lx = (wx - cx) * cs - (wz - cz) * sn, lz;
      const pair = gch && (it.lie || it.w / 2 - 0.5 >= 0.3);   // お客さんと2人:自分は右、お客さんは左
      if (it.sit) { const lim = Math.max(0, it.w / 2 - 0.5); lx = pair ? -0.3 : clamp(lx, -lim, lim); lz = -0.02; } else { lx = pair ? -0.3 : 0; lz = 0.8; }
      wx = cx + lx * cs + lz * sn; wz = cz - lx * sn + lz * cs; wry = yaw;
      wy = (Y[p.uid] || 0) + (it.sit ? it.sit - 0.58 : it.lie + 0.14);
      wPose = { p, lx, stand: it.sit ? [lx, it.d / 2 + 0.6] : [it.w / 2 + 0.55, 0.3], yaw, cx, cz };
      wme.pose = it.sit ? 'sit' : 'lie'; wspeed = 0; if (it.lie) { wyaw = wry; wpitch = 0.95; wdist = 3.0; }
      if (pair) { guestPose(it.sit ? 'sit' : 'lie', wy); guestSay(GL(it.sit ? 'sit' : 'lie')); }
    }
    function standUp() {
      if (!wPose) return;
      const { stand, yaw, cx, cz } = wPose, sn = Math.sin(yaw), cs = Math.cos(yaw);
      [wx, wz] = walkTo(cx + stand[0] * cs + stand[1] * sn, cz - stand[0] * sn + stand[1] * cs);
      wPose = null; wme.pose = null; wy = 0;
      if (gPose) { gPose = null; gHold = false; gK = 0; gx = wx + Math.cos(wry) * 0.62; gz = wz - Math.sin(wry) * 0.62; [gx, gz] = walkTo(gx, gz); }
    }
    function enterWalk() {
      if (walk) return;
      const rm = cur(); selUid = null; mark(); drag = null; ptrs.clear(); pinch = null;
      walk = true; buildShell(); outline.visible = false;
      calcBlockers();
      editEls.forEach(e => { e._d = e.style.display; e.style.display = 'none'; });
      wme = makeCharacter(typeof ctx.player?.look === 'string' ? LOOKS[ctx.player.look] || LOOKS.mio : LOOKS.mio); scene.add(wme.root);
      // はじめは、かべぎわのあいた場所
      wPose = null; wLast = ''; wx = rm.cols / 2; wz = rm.rows - 1; [wx, wz] = walkTo(wx, wz); wry = Math.PI; wyaw = 0.2; wpitch = 0.3; wdist = 4.2; wspeed = 0;
      if (guest && !gch) {
        if (guest.late && guest.late()) { setTimeout(() => { guestSayLate(); }, 300); guest.leave?.(); }
        else { gch = makeCharacter(guest.look); scene.add(gch.root); gx = wx - 0.9; gz = wz; gry = wry; gPose = null; gHold = false; }
      }
      wInput = createInput(cv, { onAction: () => {} });
      wUI = document.createElement('div');
      const wb = 'position:absolute;z-index:4;border:0;border-radius:999px;font:inherit;font-weight:800;box-shadow:0 2px 8px #0003;cursor:pointer';
      wUI.innerHTML = `<button data-w="back" style="${wb};left:10px;top:10px;padding:9px 14px;background:#fffaf2;color:${ink}">✏️ へんしゅうにもどる</button>
        <button data-w="shot" aria-label="写真をとる" style="${wb};right:12px;bottom:12px;width:58px;height:58px;font-size:26px;background:linear-gradient(160deg,#ffd0dc,#ffb3c1)">📷</button>
        <button data-w="album" style="${wb};right:12px;bottom:80px;padding:8px 12px;font-size:13px;background:#fffaf2;color:${ink}">🖼 アルバム</button>
        <button data-w="act" style="${wb};left:50%;transform:translateX(-50%);bottom:18px;padding:12px 22px;font-size:16px;background:linear-gradient(160deg,#ffe08a,#ffc93c);color:${ink};display:none">座る</button>
        ${gch ? `<button data-w="talk" style="${wb};left:10px;bottom:18px;padding:11px 16px;font-size:14px;background:#fffaf2;color:${ink}">💬 ${guest.name}と話す</button>` : ''}<button data-w="goro" style="${wb};right:12px;bottom:148px;padding:8px 12px;font-size:13px;background:#fffaf2;color:${ink}">🛌 ゴロゴロ</button>
        <div data-w="hint" style="position:absolute;left:0;right:0;top:56px;text-align:center;font-size:12px;color:#fff;text-shadow:0 1px 3px #0008;pointer-events:none">下を なぞって歩く／上を なぞって見まわす／ピンチで近づく(パソコンは WASD・ドラッグ・ホイール)</div>`;
      cv.appendChild(wUI); setTimeout(() => wUI && wUI.querySelector('[data-w="hint"]')?.remove(), 6000);
      wUI.onpointerdown = e => e.stopPropagation();
      wUI.onclick = e => {
        const w = e.target.closest('[data-w]')?.dataset.w;
        if (w === 'back') exitWalk();
        else if (w === 'album') ctx.open('album', { from: 'home', walk: true });
        else if (w === 'act') { if (wPose) standUp(); else { const n = seatNear(); if (n) takePose(n); else if (doorNear()) goThroughDoor(); } }
        else if (w === 'talk') guestTalk();
        else if (w === 'goro') { if (wPose) standUp(); floorLie(); }
        else if (w === 'shot') {   // 見えたまま撮る(ボタンなどは写らない)
          const was = wme.root.visible; renderer.render(scene, cam);
          const src = snapCanvas(renderer.domElement); flash(root);
          shotCard(root, src, { gems: ctx.gems, cfg: ctx.photo, openAlbum: () => ctx.open('album', { from: 'home', walk: true }) });
        }
      };
      resize();
    }
    function exitWalk() {
      if (!walk) return;
      walk = false; wInput && wInput.dispose(); wInput = null; wUI && wUI.remove(); wUI = null;
      if (wme) { scene.remove(wme.root); dispose(wme.root); wme = null; }
      if (gch) { scene.remove(gch.root); dispose(gch.root); gch = null; gPose = null; } gBub = null;
      editEls.forEach(e => { e.style.display = e._d || ''; });
      buildShell(); resize(); relayout(); ui();
    }

    buildShell(); resize(); relayout(); ui(); loop();
    if (ctx.params && (ctx.params.walk || guest)) enterWalk();   // お客さんがいるときは、はじめから歩く(部屋の中で一緒に)
    if (gch) setTimeout(() => guestSay(GL('enter')), 400);
    function guestSayLate() { const b = document.createElement('div'); b.textContent = `${guest.name}「今日はもう遅いから、帰るね。また遊ぼ!」`; b.style.cssText = 'position:absolute;left:50%;top:64px;transform:translateX(-50%);max-width:80%;background:#fffaf2;color:#5a4a6b;border-radius:16px;padding:8px 14px;font-size:14px;font-weight:700;box-shadow:0 2px 8px #0003;z-index:30'; root.appendChild(b); setTimeout(() => b.remove(), 3500); }   // アルバムから「部屋にもどる」で、歩いていたところへ
    const offW = ctx.wallet.onChange ? ctx.wallet.onChange(() => planUI()) : null;
    ctx.setTitle?.('あなたの家');
    return {
      unmount() {
        cancelAnimationFrame(raf); ro.disconnect(); offW && offW(); if (walk) exitWalk();
        clearMeshes(); dispose(shell); outline.geometry.dispose();
        renderer.dispose(); renderer.forceContextLoss?.(); root.remove();
      },
    };
  },
};
