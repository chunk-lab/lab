/* 物語の芝居(カットシーン)。3Dの町で、台本どおりにキャラを歩かせ、カメラを動かし、RPGふうのセリフ枠で話を進める。
   操作は「タップで次へ」と「選択肢」だけ(文字の入力はなし)。
   台本は async 関数 (d) => { await d.say(...); ... }。d の命令は下の dir を見る。 */
import * as THREE from 'three';
import { portrait } from '../ui/portraits.js';

const CSS = `
.tw-cut{position:absolute;inset:0;z-index:60;pointer-events:none;font-family:inherit}
.tw-cut .cs-fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .6s;pointer-events:none}
.tw-cut .cs-box,.tw-cut .cs-ch{z-index:3}.tw-cut .cs-fade{z-index:2}.tw-cut .cs-skip{z-index:4}.tw-cut .cs-title{z-index:5}   /* 暗転中でもセリフ枠は見える */
.tw-cut .cs-skip{position:absolute;right:12px;top:calc(12px + env(safe-area-inset-top,0px));pointer-events:auto;border:2px solid #fff;border-radius:999px;background:#1d2340cc;color:#fff;font:800 13px inherit;padding:8px 16px}
.tw-cut .cs-tap{position:absolute;inset:0;pointer-events:auto}
.tw-cut .cs-box{position:absolute;left:10px;right:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));min-height:clamp(130px,24vh,200px);background:#141a36e6;border:3px solid #fff;border-radius:12px;box-shadow:0 0 0 3px #141a36,0 8px 24px #0006;color:#fff;padding:16px 18px 30px;pointer-events:auto;display:none}
.tw-cut .cs-box.on{display:block}
.tw-cut .cs-name{position:absolute;left:14px;top:-17px;background:#141a36;border:3px solid #fff;border-radius:8px;padding:3px 14px;font-weight:900;font-size:15px;letter-spacing:.05em}
.tw-cut .cs-name:empty{display:none}
.tw-cut .cs-pic{position:absolute;right:10px;bottom:calc(100% + 2px);width:min(34vw,150px);pointer-events:none;filter:drop-shadow(0 4px 10px #0006)}
.tw-cut .cs-pic:not([src]),.tw-cut .cs-pic[src=""]{display:none}
.tw-cut .cs-text{font-size:var(--tw-dfs,19px);line-height:1.7;white-space:pre-wrap;font-weight:700;min-height:3.4em}
.tw-cut .cs-box.narr .cs-text{color:#dfe6ff;font-weight:600}
.tw-cut .cs-more{position:absolute;right:16px;bottom:8px;font-size:14px;animation:csb .8s infinite alternate;opacity:0}
.tw-cut .cs-box.done .cs-more{opacity:1}.tw-cut .cs-box.auto .cs-more{display:none}
@keyframes csb{to{transform:translateY(4px)}}
.tw-cut .cs-ch{position:absolute;right:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px) + clamp(130px,24vh,200px) + 16px);display:none;flex-direction:column;gap:8px;pointer-events:auto;max-width:86%}
.tw-cut .cs-ch.on{display:flex}
.tw-cut .cs-ch button{background:#141a36ee;color:#fff;border:3px solid #fff;border-radius:10px;padding:12px 18px;font:800 16px inherit;text-align:left;box-shadow:0 0 0 3px #141a36}
.tw-cut .cs-ch button::before{content:'▶ ';color:#ffd166}
.tw-cut .cs-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-shadow:0 2px 10px #000;opacity:0;transition:opacity .8s;pointer-events:none}
.tw-cut .cs-title.on{opacity:1}
.tw-cut .cs-title small{font-size:15px;letter-spacing:.3em}.tw-cut .cs-title b{font-size:34px;margin-top:8px}
.tw-cut .cs-cap{position:absolute;left:50%;top:calc(60px + env(safe-area-inset-top,0px));transform:translateX(-50%);background:#141a36cc;color:#fff;border:2px solid #fff;border-radius:999px;padding:6px 18px;font-weight:900;font-size:14px;opacity:0;transition:opacity .5s;white-space:nowrap}
.tw-cut .cs-cap.on{opacity:1}
.tw-cut .cs-note{position:absolute;left:14px;right:14px;top:calc(64px + env(safe-area-inset-top,0px));background:#fffaf0;color:#2c2418;border:3px solid #8a6a3a;border-radius:10px;padding:8px 12px 10px;font-weight:800;font-size:18px;line-height:1.45;text-align:center;box-shadow:0 4px 12px #0005;display:none;z-index:3}
.tw-cut .cs-note span{white-space:pre-line;display:block}.tw-cut .cs-note small{display:block;font-size:12px;color:#8a6a3a;margin-bottom:2px}
.tw-cut .cs-note.on{display:block}
body.tw-cuton .tw-root>:not(.tw-canvas):not(.tw-cut){visibility:hidden!important}
`;

function puffTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.6, 'rgba(250,250,255,.8)'); r.addColorStop(1, 'rgba(240,240,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createCutscene({ root, scene, residents, me, env, input, names = {}, blockers = [], openApp = null, bus = null, openReader = null, reward = null, openGame = null, tune = null, giftFish = null, warm = null, interiors = null }) {
  if (!document.getElementById('tw-cut-css')) { const st = document.createElement('style'); st.id = 'tw-cut-css'; st.textContent = CSS; document.head.appendChild(st); }
  let camDirty = 3, camFix = null;
  let on = false, el = null, skipped = false, meAct = null, camT = null, camP = new THREE.Vector3(), camL = new THREE.Vector3(), camSnap = false, follow = null, camInit = false, offY = 0, riding = false, alt = 0;
  const ray = new THREE.Raycaster(), rv = new THREE.Vector3();
  const puffs = []; let ptex = null, cameraRef = null;
  const who = id => id === 'me' ? null : residents.list.find(r => r.def.id === id);
  const pos = id => { if (id === 'me') return { x: me.x, z: me.z, y: 0 }; const r = who(id); const p = r.ch.root.position; return { x: p.x, z: p.z, y: p.y }; };
  const NAME = id => id === 'narr' ? '' : id === 'me' ? (names.me ? names.me() : 'あなた') : (names[id] || (who(id) && who(id).def.name) || id);
  // 表を作る道具(tools/gen_storycams.mjs)が、物語を早回しして場面ごとのカメラ位置を書き出すとき(REC)だけ: 待たない・アプリは開かない・選択肢は決めた番号
  const REC = () => typeof window !== 'undefined' && !!window.__storyRec;
  const sleep = s => new Promise(res => setTimeout(res, (REC() ? Math.min(s, 0.12) : s) * 1000));
  const guard = () => { if (skipped) throw new Error('skip'); };

  function build() {
    el = document.createElement('div'); el.className = 'tw-cut';
    el.innerHTML = `<div class="cs-tap"></div><div class="cs-title"><small></small><b></b></div><div class="cs-cap"></div><div class="cs-note"></div><div class="cs-ch"></div><div class="cs-box"><img class="cs-pic" alt=""><div class="cs-name"></div><div class="cs-text"></div><div class="cs-more">▼</div></div><div class="cs-fade"></div><button class="cs-skip" type="button">スキップ ▶▶</button>`;
    root.appendChild(el);
    el.querySelector('.cs-skip').onclick = e => { e.stopPropagation(); skipped = true; tapFn && tapFn(); chFn && chFn(-1); };
  }
  let tapFn = null, chFn = null;
  const q = s => el.querySelector(s);

  // ---- 1文字ずつ出す。1回目のタップで全部出し、2回目で次へ ----
  function say(id, text, o = {}) {
    guard();
    if (REC()) return sleep(0.15).then(guard);
    return new Promise(res => {
      const box = q('.cs-box'), tx = q('.cs-text'); box.classList.add('on'); box.classList.remove('done'); box.classList.toggle('auto', !!o.auto); box.classList.toggle('narr', id === 'narr');
      q('.cs-name').textContent = NAME(id);
      const pic = q('.cs-pic'), src = id !== 'narr' && id !== 'me' ? portrait(o.face || id) : null; if (src) pic.src = src; else pic.removeAttribute('src');
      const chars = [...text]; let i = 0, done = false; tx.textContent = '';
      const tick = setInterval(() => { i += 1; tx.textContent = chars.slice(0, i).join(''); if (i >= chars.length) finish(); }, 38);
      function finish() { clearInterval(tick); tx.textContent = text; done = true; box.classList.add('done'); if (o.auto) setTimeout(() => { if (tapFn) { tapFn = null; res(); } }, o.auto * 1000); }   // auto: 押さなくても、出しきってから o.auto 秒で次へ(▼なし)
      tapFn = () => { if (skipped) { clearInterval(tick); tapFn = null; res(); return; } if (o.auto) return; if (!done) { finish(); return; } tapFn = null; res(); };
    }).then(guard);
  }
  function choose(id, text, opts) {
    guard();
    if (REC()) return sleep(0.15).then(() => Math.min(window.__storyRecK || 0, opts.length - 1));
    return new Promise(res => {
      const box = q('.cs-box'); box.classList.add('on', 'done'); box.classList.toggle('narr', id === 'narr');
      q('.cs-name').textContent = NAME(id); q('.cs-pic').removeAttribute('src'); q('.cs-text').textContent = text;
      const ch = q('.cs-ch'); ch.innerHTML = ''; ch.classList.add('on');
      opts.forEach((t, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = e => { e.stopPropagation(); chFn(i); }; ch.appendChild(b); });
      chFn = i => { chFn = null; ch.classList.remove('on'); ch.innerHTML = ''; res(i); };
    }).then(v => { guard(); return v; });
  }
  const hideBox = () => { q('.cs-box').classList.remove('on'); };
  async function fade(out, sec = 0.6) { const f = q('.cs-fade'); f.style.transition = `opacity ${sec}s`; f.style.opacity = out ? 1 : 0; await sleep(sec); }
  async function title(small, big, sec = 2.4) { const t = q('.cs-title'); t.querySelector('small').textContent = small; t.querySelector('b').textContent = big; t.classList.add('on'); await sleep(sec); if (pre || preA) { try { for (const k of preRooms) interiors && interiors.use(k); } catch (e) { } await Promise.race([Promise.all([pre, preA]), sleep(10)]); pre = null; preA = null; try { warm && warm(); } catch (e) { } } t.classList.remove('on'); await sleep(0.8); }
  function note(text, head = '') { const c = q('.cs-note'); if (!text) { c.classList.remove('on'); return; } c.innerHTML = (head ? '<small></small>' : '') + '<span></span>'; if (head) c.querySelector('small').textContent = head; c.querySelector('span').textContent = text; c.classList.add('on'); }   // 画面の上に、ずっと出しておく文(掲示板の英文など)
  function caption(text) { const c = q('.cs-cap'); if (!text) { c.classList.remove('on'); return; } c.textContent = text; c.classList.add('on'); }

  function act(id) { const r = who(id); if (!r) return null; residents.load && residents.load(id); r.act = r.act || {}; r.talking = false; r.follow = false; r.visit = null; r.pin = null; return r.act; }
  function place(id, x, z, ry = 0) {
    camDirty = 3;
    if (id === 'me') { me.x = x; me.z = z; me.ry = ry; me.speed = 0; meAct = null; return; }
    const r = who(id), A = act(id); if (!r) return; r.ch.root.position.set(x, A.y || 0, z); r.ch.root.rotation.y = ry; A.ry = ry; A.tx = A.tz = null; A.vis = true;
  }
  function walk(id, x, z, spd) {
    guard();
    if (REC()) { place(id, x, z); return sleep(0.1); }   // 表を作るときは歩かずに置く
    if (id === 'me') return new Promise(res => { meAct = { x, z, spd: spd || 2.6, done: res }; });
    const A = act(id); return new Promise(res => { A.tx = x; A.tz = z; A.spd = spd; A.done = res; });
  }
  function face(id, target) {   // target: 'me' / 住人id / 角度
    const a = typeof target === 'number' ? target : (() => { const p = pos(id), t = pos(target); return Math.atan2(t.x - p.x, t.z - p.z); })();
    if (id === 'me') { me.ry = a; return; } const A = act(id); if (A) A.ry = a;
  }
  function set(id, o) { const A = act(id); if (A) Object.assign(A, o); }
  function scale(id, s, snap = false) { const r = who(id); if (!r) return; r.ch.rideScale = s; if (snap) r.ch.snapScale = true; }
  function hide(id) { const A = act(id); if (A) A.vis = false; }
  function puff(x, y, z, n = 10, size = 1.2) {
    ptex = ptex || puffTex();
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ptex, transparent: true, depthWrite: false })); const a = i / n * Math.PI * 2;
      s.position.set(x, y, z); s.scale.setScalar(size * 0.5); scene.add(s);
      puffs.push({ s, vx: Math.cos(a) * 2.2, vy: 0.8 + Math.random(), vz: Math.sin(a) * 2.2, t: 0, size });
    }
  }
  // カメラ: 位置と注目点。snap=true で一瞬で切りかえ
  function cam(px, py, pz, lx, ly, lz, snap = true) { follow = null; camDirty = 3; camT = { p: new THREE.Vector3(px, py, pz), l: new THREE.Vector3(lx, ly, lz) }; camSnap = snap; }
  function shot(a, b, o = {}) {   // a(と b)が並んで見えるように、よこから撮る。o: dist, h, side(+1/-1), look(注目の高さ), snap
    follow = { a, b, ...o }; camSnap = o.snap !== false; camDirty = 3;   // ふつうは一瞬で切りかえる(建物の中を通らないように)
  }
  // カメラは、場面ごとに前もって決めた位置(models/storycams.json)に置くだけ。表に無い場面だけ、その場で1回決める
  let camTab = null;
  const r1 = v => Math.round(v * 10) / 10;
  function camKey() {
    if (!follow) return camT ? 'c:' + [camT.p.x, camT.p.y, camT.p.z, camT.l.x, camT.l.y, camT.l.z].map(r1).join(',') : null;
    const A = pos(follow.a), B = follow.b ? pos(follow.b) : null, o = { ...follow }; delete o.a; delete o.b;
    return 's:' + [r1(A.x), r1(A.z)].join(',') + (B ? '|' + [r1(B.x), r1(B.z)].join(',') : '') + '|' + JSON.stringify(o);
  }
  function camAim() {
    const key = camKey(), hit = key && camTab && camTab[key];
    if (hit) return { p: new THREE.Vector3(hit[0], hit[1], hit[2]), l: new THREE.Vector3(hit[3], hit[4], hit[5]) };
    const T = camAim0(); if (T && key && REC()) (window.__storyCamsRec = window.__storyCamsRec || {})[key] = [T.p.x, T.p.y, T.p.z, T.l.x, T.l.y, T.l.z].map(v => Math.round(v * 100) / 100);
    return T;
  }
  function camAim0() {   // 場面のカメラ位置を決める(建物にさえぎられたら、回りこみ・上・手前を探す)。表に無いときだけ
    const T0 = follow ? shotTarget(cameraRef) : camT; if (!T0) return null;
    const T = { p: T0.p.clone(), l: T0.l.clone() };
    if (blockers.length) {   // 見たい所とカメラの間に建物があれば、手前に寄せる(壁しか映らないのを防ぐ)
        rv.subVectors(T.p, T.l); const dd = rv.length(); rv.normalize(); ray.set(T.l, rv); ray.far = dd;
        let h = ray.intersectObjects(blockers, false)[0];
        if (h) {   // まず、同じ距離のまま 少し回りこんだ所・少し上を探す(寄りすぎて誰かしか映らないのを防ぐ)
          const ox = T.p.x - T.l.x, oz = T.p.z - T.l.z, oy = T.p.y - T.l.y;
          for (const [ang, up] of [[0.35, 0], [-0.35, 0], [0.7, 0], [-0.7, 0], [0, 2.5], [1.05, 0], [-1.05, 0], [0.35, 2.5], [-0.35, 2.5], [Math.PI, 0]]) {
            const c = Math.cos(ang), sn = Math.sin(ang), P = new THREE.Vector3(T.l.x + ox * c + oz * sn, T.l.y + oy + up, T.l.z - ox * sn + oz * c);
            rv.subVectors(P, T.l); const d2 = rv.length(); rv.normalize(); ray.set(T.l, rv); ray.far = d2;
            if (!ray.intersectObjects(blockers, false)[0]) { T.p.copy(P); h = null; break; }
          }
          if (h) { rv.subVectors(T0.p, T.l); rv.normalize(); T.p.copy(T.l).addScaledVector(rv, Math.max(1.2, h.distance - 0.6)); }
        }
      }
    return T;
  }
  function shotTarget(camera) {
    if (follow.moon || follow.sky) {   // 月(虹)を背にして: 空のものと反対がわの下から、相手ごしに空を見る
      const A = pos(follow.a), y = (follow.a === 'me' ? alt + 1 : (who(follow.a)?.ch.root.position.y || 0) + 1), mp = env.skyPos ? env.skyPos(follow.sky || 'lunar') : null;
      const c = new THREE.Vector3(A.x, y, A.z), md = mp ? mp.clone().sub(c).normalize() : new THREE.Vector3(0, 0.6, -1).normalize();
      const hx = -md.x, hz = -md.z, hl = Math.hypot(hx, hz) || 1, dist = follow.dist || 12;
      // 月と反対がわ・少し下から、相手と月の間を見る(相手の向こうに月が入る)
      return { p: new THREE.Vector3(c.x + hx / hl * dist, c.y - 1.5, c.z + hz / hl * dist), l: c.clone().addScaledVector(md, dist * 0.45) };
    }
    const f = follow, A = pos(f.a), B = f.b ? pos(f.b) : A;
    const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz);
    let nx, nz;
    if (d > 0.3) { nx = -dz / d; nz = dx / d; const side = f.side || 1; nx *= side; nz *= side; }   // 2人: 2人を結ぶ線の真横から(左右に並んで見える)
    else { nx = Math.sin(f.yaw ?? 0); nz = Math.cos(f.yaw ?? 0); }
    if (d > 0.3 && f.yaw != null) { const sx = Math.sin(f.yaw), sz = Math.cos(f.yaw); if (nx * sx + nz * sz < 0) { nx = -nx; nz = -nz; } }   // yaw に近い側から撮る
    const hf = Math.atan(Math.tan((camera.fov * Math.PI / 180) / 2) * (camera.aspect || 0.6));   // 横の画角の半分(たて長の画面は狭い)
    const need = d > 0.3 ? (d / 2 + 1.2) / Math.tan(hf) : 0;
    const dist = Math.max(f.dist || 5.5, need), hh = (f.h ?? 2.2) + Math.max(0, dist - (f.dist || 5.5)) * 0.18, ly = f.look ?? 1.0;
    return { p: new THREE.Vector3(mx + nx * dist, hh, mz + nz * dist), l: new THREE.Vector3(mx, ly, mz) };
  }

  // 芝居に出ない住人は、しばらく消しておく(夜中に通りかかったりしないように)
  let extras = [];
  // 物語の最初(タイトルの間)に、出る住人の体・顔の絵を先に読みこむ(途中でカクカクしないように)
  let pre = null, preA = null, preRooms = [];   // preA: その話で開くゲームのデータ / preRooms: その話で使う部屋。どちらも物語のはじめ(題名の間)に用意する
  function only(ids) { pre = Promise.all(ids.map(id => { try { const im = new Image(); const s = portrait(id); if (s) im.src = s; } catch (e) { } return residents.ready ? residents.ready(id).then(() => { const r = who(id); if (r && r.ch._lazy) { r.ch._lazy('oca'); r.ch._lazy('throwin'); } }).catch(() => { }) : null; })); extras = residents.list.filter(r => !ids.includes(r.def.id)); for (const r of extras) { r.act = { vis: false }; r.talking = false; r.follow = false; r.visit = null; } }
  function endCard(small, big, btn = 'タイトルへもどる') { if (REC()) return Promise.resolve();   // 物語のおわり: 暗転した画面の真ん中に、はっきり「おしまい」。押すまで待つ
    return new Promise(res => {
      hideBox(); const f = q('.cs-fade'); f.style.transition = 'opacity .8s'; f.style.opacity = 1;
      const t = q('.cs-title'); t.querySelector('small').textContent = small; t.querySelector('b').textContent = big; t.classList.add('on'); t.style.pointerEvents = 'auto'; t.style.zIndex = 5;
      const b = document.createElement('button'); b.type = 'button'; b.textContent = btn; b.style.cssText = 'margin-top:28px;border:3px solid #fff;border-radius:12px;background:#141a36;color:#fff;font:800 17px inherit;padding:12px 26px;box-shadow:0 0 0 3px #141a36';
      b.onclick = e => { e.stopPropagation(); res(); }; t.appendChild(b); q('.cs-skip').style.display = 'none';
    });
  }
  let paxId = null;
  const ride = (on, a = 0, pax = null) => { riding = on; alt = a; paxId = on ? pax : null; };
  function faceSky(ids, kind = 'rain') { const mp = env.skyPos && env.skyPos(kind); if (!mp) return; for (const id of ids) { const p = pos(id); face(id, Math.atan2(mp.x - p.x, mp.z - p.z)); } }
  // 天気: 芝居の間だけ、雨・くもり・晴れを決める(fast=はやく変わる)。rainbow=雨上がりから虹へ
  let wxK = null, wxFast = false;
  function wx(kind, fast = false) { wxK = kind; wxFast = fast; env.setAmbient && env.setAmbient(kind, fast === 'snap'); }
  function rainbow(dur = 40) { env.weather = { t: dur * 0.67, dur, rain: 0, bow: 0 }; wx('sun', true); }
  // 芝居の途中で、本物のアプリ・読む画面を開く。閉じたら芝居にもどる
  function away() { el.style.display = 'none'; document.body.classList.remove('tw-cuton'); }
  function back() { el.style.display = ''; document.body.classList.add('tw-cuton'); input.enabled = false; input.clear && input.clear(); camSnap = true; }
  async function app(id, params) { if (REC()) return null;
    guard(); hideBox(); if (!openApp || !bus) return;
    away();
    await new Promise(res => { const off = bus.on('app:close', () => { off(); res(); }); let r; try { r = openApp(id, params); } catch (e) { r = false; } Promise.resolve(r).then(v => { if (v === false) { off(); res(); } }); });
    back(); guard();
  }
  async function game(id, o) { if (REC()) return null; guard(); hideBox(); if (!openGame) return null; away(); const r = await openGame(id, o); back(); guard(); return r; }
  // ランキングの札(物語の小道具)。rows: [[名前, 点], …]。タップで閉じる
  function board(title, rows, mark) { if (REC()) return null;
    guard(); hideBox();
    return new Promise(res => {
      const b = document.createElement('div'); b.style.cssText = 'position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:min(86vw,360px);z-index:6;background:#141a36f2;border:3px solid #fff;border-radius:14px;box-shadow:0 0 0 3px #141a36;color:#fff;padding:14px 16px;pointer-events:auto;font-weight:800';
      b.innerHTML = `<div style="text-align:center;color:#ffd166;margin-bottom:8px">${title}</div>` + rows.map(([n, sc], i) => `<div style="display:flex;justify-content:space-between;padding:5px 8px;border-radius:8px;${n === mark ? 'background:#ff7fa055' : ''}"><span>${i + 1}位　${n}</span><span>${sc}</span></div>`).join('') + '<div style="text-align:center;font-size:12px;color:#c9d2ff;margin-top:8px">タップで閉じる</div>';
      el.appendChild(b); tapFn = () => { tapFn = null; b.remove(); res(); };
    }).then(guard);
  }
  async function read(story, o) { if (REC()) return null; guard(); hideBox(); if (!openReader) return null; away(); const r = await openReader(story, o); back(); guard(); return r; }
  // 話の終わりのなかよし: 上がった量・次に開くもの。はじめての時だけ、しくみの説明
  async function friend(id, n = 5) { if (REC()) return null;
    if (!reward) return; const r = reward(id, n); if (!r) return;
    const nm = NAME(id);
    await say('narr', `💗 ${nm}と、なかよしになった！${r.gained ? '' : '（もう上がっています）'}\nいま：${r.lvName}` + (r.next ? `\nあと ${r.next.left} で「${r.next.label}」が開くよ` : ''));
    if (r.firstTime) await say('narr', 'なかよしは、毎日話しかけたり、マージで作った「ほしい品」をわたしたりすると上がります。\n上がるたびに、その人にたのめることや、遊べるものが増えていきます。');
  }
  const dir = { room: k => { const S = interiors && interiors.use(k); return (x, z) => S ? [S.at[0] + x, S.at[1] + z] : [x, z]; }, note, giftFish: (...a) => { try { giftFish && giftFish(...a); } catch (e) { console.error(e); } }, only, endCard, ride, faceSky, wx, rainbow, app, read, game, board, music: () => { try { return tune && tune(); } catch (e) { return null; } }, friend, setAlt: a => { alt = a; }, say, choose, hideBox, fade, title, caption, place, walk, face, set, scale, hide, puff, cam, shot, pos,
    wait: async s => { guard(); await sleep(s); guard(); }, hour: h => { env.hour = h; }, both: (...ps) => Promise.all(ps) };

  async function play(script, cams, preApps, rooms) {
    if (on) return false;
    camTab = cams || null; preA = preApps || null; preRooms = rooms || [];
    on = true; skipped = false; camInit = false; build(); document.body.classList.add('tw-cuton');
    input.clear && input.clear(); const inputWas = input.enabled; input.enabled = false;
    const tap = e => { if (e.target.closest('.cs-skip, .cs-ch button')) return; tapFn && tapFn(); };
    el.addEventListener('pointerup', tap);
    const castIds = new Set();
    const realAct = act; // 誰を動かしたか覚えておき、最後に放す
    dir.place = (id, ...a) => { castIds.add(id); return place(id, ...a); }; dir.walk = (id, ...a) => { castIds.add(id); return walk(id, ...a); }; dir.set = (id, o) => { castIds.add(id); return set(id, o); };
    let ok = true;
    try { await script(dir); } catch (e) { if (e.message !== 'skip') console.error(e); ok = false; }
    try { if (skipped) await fade(true, 0.3); } catch (e) { }
    for (const r of extras) r.act = null; extras = [];
    for (const id of castIds) { const r = who(id); if (r) { r.act = null; r.ch.rideScale = 1; r.ch.snapScale = true; r.ch.root.position.y = 0; } }
    riding = false; alt = 0; paxId = null; wxK = null; wxFast = false; meAct = null; follow = null; camT = null; offY = 0; try { cameraRef && cameraRef.clearViewOffset(); } catch (e) { } puffs.splice(0).forEach(p => { scene.remove(p.s); p.s.material.dispose(); });
    el.removeEventListener('pointerup', tap); el.remove(); el = null; document.body.classList.remove('tw-cuton'); input.enabled = inputWas !== false; on = false;
    void realAct;
    return ok && !skipped;
  }

  return {
    get on() { return on; }, get wx() { return wxK; }, get pax() { return paxId; }, get riding() { return riding; }, get alt() { return alt; }, play,
    meStep(dt, collide) {   // main の frame から: 自分のキャラを台本どおりに歩かせる
      if (!meAct) { me.speed += (0 - me.speed) * Math.min(1, dt * 8); return; }
      const dx = meAct.x - me.x, dz = meAct.z - me.z, d = Math.hypot(dx, dz);
      if (d < 0.08) { const f = meAct.done; meAct = null; me.speed = 0; f && f(); return; }
      me.ry = Math.atan2(dx, dz); me.speed = meAct.spd; const st = Math.min(d, me.speed * dt); me.x += dx / d * st; me.z += dz / d * st;
    },
    camStep(dt, camera) {
      cameraRef = camera;
      if (wxK && wxFast && env.amb) { const A = env.amb, k = Math.min(1, dt * 1.5); A.r += (A.tr - A.r) * k; A.c += (A.tc - A.c) * k; }
      for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.t += dt; p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.position.z += p.vz * dt; p.vx *= 0.94; p.vz *= 0.94; p.s.scale.setScalar(p.size * (0.5 + p.t * 1.6)); p.s.material.opacity = Math.max(0, 1 - p.t / 0.9); if (p.t > 0.9) { scene.remove(p.s); p.s.material.dispose(); puffs.splice(i, 1); } }
      // カメラの位置は、場面(shot/cam/place)が変わった時に1回だけ決める。毎コマは計算しない(空を飛ぶ場面だけは追いかける)
      if (camDirty > 0 || !camFix || riding) { camFix = camAim(); if (camDirty > 0) camDirty--; }   // 置いた直後の数コマだけ(位置が反映されるまで)
      const T = camFix; if (!T) return;
      if (camSnap || !camInit) { camP.copy(T.p); camL.copy(T.l); camSnap = false; camInit = true; } else { const k = Math.min(1, dt * 2.4); camP.lerp(T.p, k); camL.lerp(T.l, k); }
      camera.position.copy(camP); camera.lookAt(camL);
      { const W = root.clientWidth || 1, H = root.clientHeight || 1, box = el && el.querySelector('.cs-box.on');   // セリフ枠に隠れないよう、絵を上へずらす
        const sh = box ? Math.min(H * 0.22, box.getBoundingClientRect().height * 0.55) : 0; offY += (sh - offY) * Math.min(1, dt * 5);
        if (offY > 1) camera.setViewOffset(W, H, 0, offY, W, H); else camera.clearViewOffset(); }
    },
  };
}
