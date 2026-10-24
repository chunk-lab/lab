// ショップ(家具を買う)と、あなたの家(家具を置く)。データは src/game/furniture.js
import * as THREE from 'three';
import { ITEMS, ITEM, CATS, U, WALL_H, MAX_OWN, SIDE_MAX, furn, houseData, size, wallLen, kindOf, heightOf, inside, stackY, findSpot } from '../game/furniture.js';

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
    const head = (title, sub) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px 4px"><h2 style="margin:0;font-size:20px">${title}</h2><b style="background:#fff3cf;border-radius:999px;padding:6px 14px">🪙 ${ctx.wallet.get()}</b></div><p style="margin:0;padding:0 16px 8px;font-size:13px;color:#8d7f9e">${sub}</p>`;
    const draw = () => {
      const cart = furn.cart(), total = furn.total(cart), n = Object.values(cart).reduce((a, b) => a + b, 0), coins = ctx.wallet.get();
      if (view === 'cart') {
        const rows = Object.entries(cart).map(([id, q]) => `<div style="display:flex;align-items:center;gap:10px;background:#fff;border-radius:16px;padding:8px 10px;margin-bottom:8px;box-shadow:0 2px 8px #0001">
          ${thumbs.get(id) ? `<img src="${thumbs.get(id)}" width="48" height="48" alt="">` : ''}
          <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">${ITEM[id].name}</div><div style="font-size:12px;color:#8d7f9e">🪙 ${ITEM[id].price} × ${q} = <b style="color:${ink}">${ITEM[id].price * q}</b></div></div>${stepper(id)}</div>`).join('');
        const short = total - coins;
        box.innerHTML = head('カゴ', msg || 'ここで数を変えて、さいごに まとめて払うよ。')
          + `<div style="flex:1;overflow:auto;padding:4px 16px">${rows || '<p style="text-align:center;color:#8d7f9e;margin-top:40px">カゴは空だよ</p>'}</div>
          <div style="padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));background:#fffaf0;box-shadow:0 -2px 10px #0001">
            <div style="display:flex;justify-content:space-between;font-weight:800"><span>ごうけい（${n}点）</span><span>🪙 ${total}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#8d7f9e;margin:2px 0 10px"><span>はらったあとの コイン</span><span>${short > 0 ? `<b style="color:#e0556b">あと ${short} たりない</b>` : '🪙 ' + (coins - total)}</span></div>
            <div style="display:flex;gap:8px"><button data-v="list" style="${btn('#d9d2e3', ink)};flex:1">もどる</button><button data-pay style="${btn(n && short <= 0 ? undefined : '#d9d2e3')};flex:2;${n && short <= 0 ? '' : 'cursor:default'}">まとめて買う</button></div></div>`;
        return;
      }
      box.innerHTML = head('ショップ', msg || '気に入った家具を、カゴに入れよう。お金が減るのは、さいごに「まとめて買う」を押したときだけ。')
        + `<div style="display:flex;gap:6px;overflow-x:auto;padding:0 16px 8px">${CATS.map(c => `<button data-c="${c}" style="${btn(c === cat ? undefined : '#ece7f3', c === cat ? '#fff' : ink)};padding:6px 12px;font-size:13px">${c}</button>`).join('')}</div>
        <div style="flex:1;overflow:auto;padding:4px 16px 12px"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${ITEMS.filter(it => cat === 'すべて' || it.cat === cat).map(it => {
          const own = furn.owned(it.id);
          return `<div style="background:#fff;border-radius:18px;padding:10px;box-shadow:0 2px 10px #0001;text-align:center">
            <div style="height:74px;display:flex;align-items:center;justify-content:center">${thumbs.get(it.id) ? `<img src="${thumbs.get(it.id)}" width="74" height="74" alt="">` : ''}</div>
            <div style="font-weight:800;font-size:14px">${it.name}</div>
            <div style="font-size:12px;color:#8d7f9e;margin:2px 0 6px">🪙 ${it.price}　もっている: ${own}</div>${own >= MAX_OWN ? '<div style="font-size:12px;color:#8d7f9e;height:34px;line-height:34px">これ以上は もてないよ</div>' : stepper(it.id)}</div>`;
        }).join('')}</div></div>
        <div style="padding:10px 16px calc(14px + env(safe-area-inset-bottom,0px));background:#fffaf0;box-shadow:0 -2px 10px #0001;display:flex;align-items:center;gap:12px">
          <div style="flex:1;font-weight:800">カゴ ${n}点<br><span style="font-size:13px;color:#8d7f9e">ごうけい 🪙 ${total}</span></div>
          <button data-v="cart" style="${btn(n ? undefined : '#d9d2e3')};${n ? '' : 'cursor:default'}">カゴを見る</button></div>`;
    };
    box.onclick = e => {
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
      <div class="cv" style="flex:1;position:relative;min-height:0;touch-action:none"></div>
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
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(6, 12, 8); scene.add(sun);
    const lm = c => new THREE.MeshLambertMaterial({ color: c });
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 140);
    const PAL = [[0xf8e6c8, 0xffe9ef, 0xe9f3ff], [0xe8dcc8, 0xe6f4e8, 0xfff3d9], [0xdfe6f3, 0xf3e8ff, 0xe8f6ff], [0xf3dcd0, 0xfff0e0, 0xf0f7ea], [0xe3e8d8, 0xeaf0ff, 0xfdeaf0]];

    let dirty = true, raf = 0;
    const draw = () => { dirty = true; };
    const loop = () => { raf = requestAnimationFrame(loop); if (dirty) { dirty = false; renderer.render(scene, cam); } };

    // 家と配置のデータ
    let house = houseData.get(), curId = house.rooms[0].id, placed = furn.placed(), meshes = new Map(), selUid = null, Y = {};
    const cur = () => house.rooms.find(r => r.id === curId) || house.rooms[0];
    const list = () => placed.filter(p => p.room === cur().id);
    const save = () => furn.savePlaced(placed);
    const uidOf = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // 部屋のかべ・ゆか(広げたときも作りなおす)
    const shell = new THREE.Group(); scene.add(shell);
    const dispose = g => g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    function buildShell() {
      shell.children.slice().forEach(c => { shell.remove(c); dispose(c); });
      const r = cur(), C = r.cols, R = r.rows, pal = PAL[house.rooms.indexOf(r) % PAL.length];
      const floor = new THREE.Mesh(new THREE.BoxGeometry(C, 0.3, R), lm(pal[0])); floor.position.set(C / 2, -0.15, R / 2);
      const grid = new THREE.GridHelper(Math.max(C, R), Math.max(C, R), 0xe9cfa6, 0xeed8b4); grid.scale.set(C / Math.max(C, R), 1, R / Math.max(C, R)); grid.position.set(C / 2, 0.01, R / 2);
      const w1 = new THREE.Mesh(new THREE.BoxGeometry(C, WALL_H, 0.25), lm(pal[1])); w1.position.set(C / 2, WALL_H / 2, -0.125);
      const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, WALL_H, R), lm(pal[2])); w2.position.set(-0.125, WALL_H / 2, R / 2);
      shell.add(floor, grid, w1, w2);
    }
    function resize() {
      const w = cv.clientWidth || 300, h = cv.clientHeight || 300, r = cur(), big = Math.max(r.cols, r.rows);
      renderer.setSize(w, h, false); cam.aspect = w / h;
      const dist = Math.max(15, 6.4 / (cam.aspect * 0.344)) * Math.max(1, big / 8 * 0.97);
      const cx = r.cols / 2, cz = r.rows / 2;
      cam.position.set(cx + dist * 0.62, dist * 0.55, cz + dist * 0.62); cam.lookAt(cx, 0.9, cz);
      cam.updateProjectionMatrix(); draw();
    }
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
      curId = id; selUid = null; bad = false; clearMeshes(); buildShell(); resize(); relayout(); ui();
    }

    function remaining(id) { return furn.owned(id) - placed.filter(p => p.id === id).length; }
    const gemsOf = () => (ctx.gems ? ctx.gems.get() : null);
    function planUI() {
      const xs = house.rooms.map(r => r.sx), ys = house.rooms.map(r => r.sy), x0 = Math.min(...xs), y0 = Math.min(...ys), W = Math.max(...xs) - x0 + 1, H = Math.max(...ys) - y0 + 1;
      const tiles = house.rooms.map(r => `<button data-room="${r.id}" style="grid-column:${r.sx - x0 + 1};grid-row:${r.sy - y0 + 1};${btn(r.id === cur().id ? undefined : '#fff', r.id === cur().id ? '#fff' : ink)};border-radius:10px;padding:4px 6px;font-size:11px;box-shadow:0 1px 5px #0002;min-width:56px;overflow:hidden;text-overflow:ellipsis">${r.name}<br><span style="font-weight:600;opacity:.75">${r.cols}×${r.rows}</span></button>`).join('');
      planEl.innerHTML = `<div style="flex:1;min-width:0;overflow:auto"><div style="display:grid;grid-template-columns:repeat(${W},auto);grid-template-rows:repeat(${H},auto);gap:4px;width:max-content" title="間取り">${tiles}</div></div>
        <div style="text-align:right;font-weight:800;font-size:13px;line-height:1.5;white-space:nowrap">🪙 ${ctx.wallet.get()}${gemsOf() != null ? `<br>💎 ${gemsOf()}` : ''}</div>
        <button data-a="size" style="${btn('linear-gradient(160deg,#9fe3c0,#6fcf9f)')};padding:8px 12px;font-size:13px">🏠 ひろげる</button>`;
    }
    function ui() {
      planUI();
      const p = placed.find(x => x.uid === selUid), k = p && kindOf(p.id);
      tip.textContent = p ? `${ITEM[p.id].name}をえらび中。ドラッグで動かせるよ(半マスずつ)。${k === 'wall' ? 'かべをタップでも動くよ。' : 'ほかの家具の上にも置けるよ。'}` : (Object.keys(furn.inv()).length ? 'かぐをタップするとえらべるよ。下の一覧から出すこともできるよ。' : 'まだ家具がないよ。ショップで買ってこよう。');
      ctl.innerHTML = p ? `${k === 'floor' || k === 'flat' ? `<button data-a="rot" style="${btn('linear-gradient(160deg,#c9b8ea,#b19cd9)')}">まわす</button>` : ''}<button data-a="del" style="${btn('linear-gradient(160deg,#ffcf9f,#ffb27a)')}">しまう</button><button data-a="off" style="${btn('#d9d2e3')}">おわり</button>` : ((ctx.features || []).includes('study') ? `<button data-a="study" style="${btn('linear-gradient(160deg,#ffe08a,#ffc93c)', ink)}">📒 勉強部屋</button>` : '');
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
        <div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">🏠 ${r.name}を ひろげる</h3><b style="background:#fff3cf;border-radius:999px;padding:5px 12px;font-size:13px">🪙 ${ctx.wallet.get()}${g != null ? ` 💎 ${g}` : ''}</b></div>
        <p style="margin:6px 0 10px;font-size:13px;color:#8d7f9e">${sheetMsg || 'いまは ' + r.cols + '列 × ' + r.rows + '行。1列・1行ごとに、コインかダイヤで広げられるよ(かべの反対がわにのびるから、家具は動かないよ)。'}</p>
        ${row('cols', 'よこ（列）を1つ')}${row('rows', 'たて（行）を1つ')}
        ${g != null ? `<div style="background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px #0001"><div style="font-weight:800">もうひとつ、部屋を増やす（${house.rooms.length}部屋）</div><div style="font-size:12px;color:#8d7f9e;margin:2px 0 8px">いまの部屋のとなりに、新しい部屋がつながるよ。ダイヤだけで増やせるよ。</div><button data-x="room" style="${btn(g >= C.gemsPerRoom ? 'linear-gradient(160deg,#9fd8ff,#6cb8f0)' : '#d9d2e3')};width:100%">💎 ${C.gemsPerRoom} で 部屋を増やす</button></div>` : ''}
        <div style="background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:10px;box-shadow:0 2px 8px #0001"><div style="font-weight:800;margin-bottom:6px">部屋の名前</div><input class="nm" value="${r.name}" maxlength="10" style="width:100%;box-sizing:border-box;padding:8px 10px;border-radius:10px;border:2px solid #e3d9f0;font:inherit;color:${ink}"></div>
        <button data-x="close" style="${btn('#d9d2e3', ink)};width:100%">とじる</button></div>`;
    }
    sheet.onclick = e => {
      if (e.target === sheet) { sheet.style.display = 'none'; return; }
      const b = e.target.closest('[data-x]'); if (!b) return;
      const x = b.dataset.x, r = cur();
      if (x === 'close') { const nm = sheet.querySelector('.nm'); if (nm && nm.value.trim() && nm.value !== r.name) { houseData.rename(r.id, nm.value.trim()); house = houseData.get(); } sheet.style.display = 'none'; sheetMsg = ''; ui(); return; }
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
      if (a === 'study') { ctx.emit('study'); return; }   // 組み込み先(チャンクタウン)の勉強部屋を開く
      if (!a || !p) return;
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
      ui(); relayout();
    };
    inv.onclick = e => {
      const id = e.target.closest('[data-i]')?.dataset.i; if (!id || remaining(id) <= 0) return;
      const p = findSpot(cur(), list(), { uid: uidOf(), id, room: cur().id, gx: 0, gz: 0, r: 0 });
      placed.push(p); selUid = p.uid; save(); ui(); relayout();
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
    cv.onpointerdown = e => {
      const u = hitUid(e);
      if (u) {
        selUid = u; const p = placed.find(x => x.uid === u), k = kindOf(p.id); bad = false;
        let off = null;
        if (k !== 'wall') { aim(e); if (ray.ray.intersectPlane(groundAt(Y[u] || 0), pt)) { const [w, d] = k === 'ceil' ? [U, U] : size(p); off = { x: p.gx + w / 2 - pt.x * U, z: p.gz + d / 2 - pt.z * U }; } }
        drag = { p, from: { ...p }, off, moved: false, id: e.pointerId }; cv.setPointerCapture(e.pointerId); ui(); mark(); draw();
      } else if (selUid) {
        const p = placed.find(x => x.uid === selUid), c = p && mover(e, p, null);
        if (c) { const from = { ...p }; Object.assign(p, c); if (inside(cur(), p)) { toTop(p); save(); } else { Object.assign(p, from); tip.textContent = 'そこには置けないよ。'; } relayout(); }
      }
    };
    cv.onpointermove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const c = mover(e, drag.p, drag.off); if (!c) return;
      if (Object.keys(c).some(k => c[k] !== drag.p[k])) { drag.moved = true; Object.assign(drag.p, c); relayout(); }
    };
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = drag.p;
      if (drag.moved && !inside(cur(), p)) { Object.assign(p, drag.from); tip.textContent = 'そこには置けないよ。'; } else if (drag.moved) { toTop(p); save(); }
      drag = null; relayout();
    };
    cv.onpointerup = up; cv.onpointercancel = up;

    buildShell(); resize(); relayout(); ui(); loop();
    const offW = ctx.wallet.onChange ? ctx.wallet.onChange(() => planUI()) : null;
    ctx.setTitle?.('あなたの家');
    return {
      unmount() {
        cancelAnimationFrame(raf); ro.disconnect(); offW && offW();
        clearMeshes(); dispose(shell); outline.geometry.dispose();
        renderer.dispose(); renderer.forceContextLoss?.(); root.remove();
      },
    };
  },
};
