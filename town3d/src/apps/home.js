// ショップ(家具を買う)と、あなたの家(家具を置く)。データは src/game/furniture.js
import * as THREE from 'three';
import { ITEMS, ITEM, ROOM, MAX_OWN, furn, fits, size, findSpot } from '../game/furniture.js';

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
    let view = 'list', msg = '';
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
        + `<div style="flex:1;overflow:auto;padding:4px 16px 12px"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${ITEMS.map(it => {
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
    root.innerHTML = `<div class="cv" style="flex:1;position:relative;min-height:0;touch-action:none"></div>
      <div class="tip" style="text-align:center;font-size:12px;color:#8d7f9e;padding:4px 10px;min-height:18px"></div>
      <div class="ctl" style="display:flex;gap:8px;justify-content:center;padding:0 10px 6px"></div>
      <div class="inv" style="display:flex;gap:8px;overflow-x:auto;padding:6px 10px 12px"></div>`;
    el.appendChild(root);
    const cv = root.querySelector('.cv'), tip = root.querySelector('.tip'), ctl = root.querySelector('.ctl'), inv = root.querySelector('.inv');

    // 部屋の3D(必要なときだけ描き直す)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    cv.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(6, 12, 8); scene.add(sun);
    const lm = c => new THREE.MeshLambertMaterial({ color: c });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM, 0.3, ROOM), lm(0xf8e6c8)); floor.position.set(ROOM / 2, -0.15, ROOM / 2); scene.add(floor);
    const grid = new THREE.GridHelper(ROOM, ROOM, 0xe9cfa6, 0xeed8b4); grid.position.set(ROOM / 2, 0.01, ROOM / 2); scene.add(grid);
    const wallH = 3.2;
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(ROOM, wallH, 0.25), lm(0xffe9ef)); w1.position.set(ROOM / 2, wallH / 2, -0.125);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, wallH, ROOM), lm(0xe9f3ff)); w2.position.set(-0.125, wallH / 2, ROOM / 2);
    scene.add(w1, w2);
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const sel = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xff7fa0, transparent: true, opacity: 0.45, depthTest: false }));
    sel.rotation.x = -Math.PI / 2; sel.position.y = 0.06; sel.renderOrder = 5; sel.visible = false; scene.add(sel);

    let dirty = true, raf = 0, dead = false;
    const draw = () => { dirty = true; };
    const loop = () => { raf = requestAnimationFrame(loop); if (dirty) { dirty = false; renderer.render(scene, cam); } };
    function resize() {
      const w = cv.clientWidth || 300, h = cv.clientHeight || 300;
      renderer.setSize(w, h, false); cam.aspect = w / h;
      const dist = Math.max(15, 6.4 / (cam.aspect * 0.344));
      cam.position.set(ROOM / 2 + dist * 0.62, dist * 0.55, ROOM / 2 + dist * 0.62); cam.lookAt(ROOM / 2, 0.4, ROOM / 2);
      cam.updateProjectionMatrix(); draw();
    }
    const ro = new ResizeObserver(resize); ro.observe(cv);

    // 配置データ
    let room = furn.room(), meshes = new Map(), selUid = null;
    const save = () => furn.saveRoom(room);
    const uidOf = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    function place(p) {
      const g = makeModel(p.id), it = ITEM[p.id];
      const pick = new THREE.Group(); pick.add(g); pick.userData.uid = p.uid;
      g.traverse(o => { if (o.isMesh) o.userData.uid = p.uid; });
      scene.add(pick); meshes.set(p.uid, pick); put(p); return pick;
    }
    function put(p, ghost) {
      const m = meshes.get(p.uid); if (!m) return;
      const [w, d] = size(p);
      m.position.set(p.gx + w / 2, 0, p.gz + d / 2); m.rotation.y = -p.r * Math.PI / 2;
      if (selUid === p.uid) { sel.visible = true; sel.scale.set(w, d, 1); sel.position.set(p.gx + w / 2, 0.06, p.gz + d / 2); sel.material.color.set(ghost === false ? 0xff4040 : 0xff7fa0); }
      draw();
    }
    room.forEach(place);

    function remaining(id) { return furn.owned(id) - room.filter(p => p.id === id).length; }
    function ui() {
      const p = room.find(x => x.uid === selUid);
      sel.visible = !!p; if (p) put(p);
      tip.textContent = p ? `${ITEM[p.id].name}をえらび中。ドラッグか、ゆかをタップで動かせるよ。` : (Object.keys(furn.inv()).length ? 'かぐをタップするとえらべるよ。下の一覧から出すこともできるよ。' : 'まだ家具がないよ。ショップで買ってこよう。');
      ctl.innerHTML = p ? `<button data-a="rot" style="${btn('linear-gradient(160deg,#c9b8ea,#b19cd9)')}">まわす</button><button data-a="del" style="${btn('linear-gradient(160deg,#ffcf9f,#ffb27a)')}">しまう</button><button data-a="off" style="${btn('#d9d2e3')}">おわり</button>` : '';
      const owned = ITEMS.filter(it => furn.owned(it.id) > 0);
      inv.innerHTML = owned.map(it => { const r = remaining(it.id); return `<button data-i="${it.id}" style="${btn(r > 0 ? '#fff' : '#ece7f3', r > 0 ? ink : '#a99bbb')};box-shadow:0 1px 6px #0002;${r > 0 ? '' : 'cursor:default'}">${it.name} ×${r}</button>`; }).join('');
    }
    ui();

    // 操作
    ctl.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a, p = room.find(x => x.uid === selUid); if (!a || !p) return;
      if (a === 'off') selUid = null;
      else if (a === 'del') { scene.remove(meshes.get(p.uid)); meshes.delete(p.uid); room = room.filter(x => x !== p); selUid = null; save(); }
      else if (a === 'rot') {
        for (const r of [1, 2, 3]) {
          const q = { ...p, r: (p.r + r) % 4 };
          // 回したあとにはみ出すときは、はみ出さないようにずらして試す
          const [w, d] = size(q); q.gx = Math.min(q.gx, ROOM - w); q.gz = Math.min(q.gz, ROOM - d);
          if (fits(room, q, p.uid)) { Object.assign(p, q); save(); break; }
        }
      }
      ui(); draw();
    };
    inv.onclick = e => {
      const id = e.target.closest('[data-i]')?.dataset.i; if (!id || remaining(id) <= 0) return;
      const p = findSpot(room, { uid: uidOf(), id, gx: 0, gz: 0, r: 0 });
      if (!p) { tip.textContent = 'おく場所がないよ。ほかの家具をしまってね。'; return; }
      room.push(p); place(p); selUid = p.uid; save(); ui();
    };

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), pt = new THREE.Vector3();
    function aim(e) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); }
    function hitUid(e) { aim(e); const h = ray.intersectObjects([...meshes.values()], true)[0]; return h?.object.userData.uid || null; }
    function cellFor(e, p) { aim(e); if (!ray.ray.intersectPlane(plane, pt)) return null; const [w, d] = size(p); return { gx: Math.max(0, Math.min(ROOM - w, Math.round(pt.x - w / 2))), gz: Math.max(0, Math.min(ROOM - d, Math.round(pt.z - d / 2))) }; }
    let drag = null;
    cv.onpointerdown = e => {
      const u = hitUid(e);
      if (u) { selUid = u; ui(); const p = room.find(x => x.uid === u); drag = { p, from: { gx: p.gx, gz: p.gz }, moved: false, id: e.pointerId }; cv.setPointerCapture(e.pointerId); }
      else if (selUid) {
        const p = room.find(x => x.uid === selUid), c = p && cellFor(e, p);
        if (c) { const q = { ...p, ...c }; if (fits(room, q, p.uid)) { Object.assign(p, c); save(); put(p); } else tip.textContent = 'そこには置けないよ。'; }
      }
    };
    cv.onpointermove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const c = cellFor(e, drag.p); if (!c) return;
      if (c.gx !== drag.p.gx || c.gz !== drag.p.gz) { drag.moved = true; Object.assign(drag.p, c); put(drag.p, fits(room, drag.p, drag.p.uid)); }
    };
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = drag.p;
      if (drag.moved && !fits(room, p, p.uid)) { Object.assign(p, drag.from); tip.textContent = 'そこには置けないよ。'; } else if (drag.moved) save();
      put(p); drag = null;
    };
    cv.onpointerup = up; cv.onpointercancel = up;

    resize(); loop();
    ctx.setTitle?.('あなたの家');
    return {
      unmount() {
        dead = true; cancelAnimationFrame(raf); ro.disconnect();
        scene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
        renderer.dispose(); renderer.forceContextLoss?.(); root.remove();
      },
    };
  },
};
