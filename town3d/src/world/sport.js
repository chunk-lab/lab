// 季節のスポーツ(町がコース):春=ミニゴルフ、秋=フリスビー(ディスクゴルフ)。
//   毎日かわるコース(日付でスタートとゴールを決める・5ホール)。ゲーム機からは季節に関係なく遊べる。
//   向き=カメラの向き(ドラッグか ◀▶)。大きいボタンを押している間ゲージが動く → はなすと打つ/投げる
import * as THREE from 'three';
import { holeExpr } from '../game/expressions.js';
import { STREETS, ROAD_HALF, WALK, PLAZA_R } from './town_data.js';

const HOLES = 5, G = 9.8;
const CLUBS = [   // ゴルフのクラブ:飛ぶ距離(m)・打ち出し角
  { id: 'dr', name: 'ドライバー', d: 70, loft: 13 }, { id: 'ir', name: 'アイアン', d: 45, loft: 24 },
  { id: 'wd', name: 'ウェッジ', d: 22, loft: 50 }, { id: 'pt', name: 'パター', d: 16, loft: 0 },
];
const HGTS = [['低め', 0], ['ふつう', 1], ['高め', 2]];   // フリスビーの高さ
function rng(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function createSport({ scene, camera, root, me, city, collide, audio, wallet, getYaw, setYaw, onEnd, onExpr, onGive, exprPool, toast }) {
  const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
  let S = null;
  const css = document.createElement('style');
  css.textContent = `.sp-on .tw-emotes,.sp-on .tw-snowb,.sp-on .tw-action{display:none!important}
.sp-hud{position:absolute;inset:0;pointer-events:none;font-family:inherit;color:#5a4a6b;z-index:6}
.sp-hud button{pointer-events:auto;border:0;font:inherit;font-weight:900;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.sp-top{position:absolute;left:8px;right:8px;top:calc(52px + env(safe-area-inset-top,0px));background:#fffffff0;border-radius:14px;padding:6px 10px;font-size:12px;font-weight:800;box-shadow:0 2px 8px #0002;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.sp-top b{font-size:14px}
.sp-clubs{position:absolute;left:8px;right:8px;bottom:calc(196px + env(safe-area-inset-bottom,0px));display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.sp-clubs button{background:#fff;border-radius:999px;padding:7px 11px;font-size:12px;box-shadow:0 2px 6px #0002}.sp-clubs button.on{background:#ffd36b}
.sp-shot{position:absolute;right:58px;bottom:calc(69px + env(safe-area-inset-bottom,0px));width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe1ea);box-shadow:0 5px 0 #e0a0b4,0 8px 16px #0004;font-size:30px;line-height:1}
.sp-shot small{display:block;font-size:11px}
.sp-aim{position:absolute;bottom:calc(100px + env(safe-area-inset-bottom,0px));width:56px;height:56px;border-radius:50%;background:#fff;box-shadow:0 3px 0 #c9bfd8,0 5px 10px #0003;font-size:20px}
.sp-l{left:16px}.sp-r{left:80px}
.sp-gauge{position:absolute;right:164px;bottom:calc(69px + env(safe-area-inset-bottom,0px));width:18px;height:120px;border-radius:9px;background:#fffffff0;box-shadow:0 2px 6px #0003;overflow:hidden}
.sp-tim{position:absolute;right:16px;bottom:calc(240px + env(safe-area-inset-bottom,0px));width:150px;height:16px;border-radius:8px;background:linear-gradient(90deg,#9fc8ff,#fff 42%,#8fe0b0 44%,#8fe0b0 56%,#fff 58%,#ffb3c1);box-shadow:0 2px 6px #0003}
.sp-tim i{position:absolute;top:-4px;width:4px;height:24px;border-radius:2px;background:#5a4a6b;left:50%}.sp-tim[hidden]{display:none}
.sp-wind{display:inline-block;transition:transform .2s}
.sp-bend{position:absolute;right:16px;bottom:calc(262px + env(safe-area-inset-bottom,0px));width:150px;text-align:center;font-size:12px;font-weight:900;color:#fff;text-shadow:0 1px 3px #000c,0 0 6px #0008;pointer-events:none}.sp-bend[hidden]{display:none}
.sp-swing{position:absolute;left:16px;right:16px;bottom:calc(252px + env(safe-area-inset-bottom,0px));height:30px;border-radius:15px;background:linear-gradient(90deg,#fff 0 7%,#ffe08a 7% 13%,#fff 13%);box-shadow:0 2px 8px #0004;border:2px solid #fff}
.sp-swing .pw{position:absolute;top:0;bottom:0;left:0;border-radius:11px;background:linear-gradient(90deg,#ffd36b,#ff7aa2);opacity:.55}
.sp-swing .mk{position:absolute;top:-6px;width:5px;height:38px;border-radius:3px;background:#5a4a6b}
.sp-swing .set{position:absolute;top:-8px;width:3px;height:42px;background:#ff5a5a}
.sp-swing span{position:absolute;left:10%;top:-20px;transform:translateX(-50%);font-size:10px;font-weight:900;color:#fff;text-shadow:0 1px 3px #000c;white-space:nowrap}
.sp-swing[hidden]{display:none}
.sp-spin{position:absolute;left:4px;bottom:calc(292px + env(safe-area-inset-bottom,0px));width:150px;pointer-events:auto;touch-action:none;text-align:center}
.sp-spin[hidden]{display:none}
.sp-lie{position:absolute;left:10px;right:10px;top:calc(118px + env(safe-area-inset-top,0px));font-size:12px;font-weight:900;color:#fff;text-shadow:0 1px 3px #000c,0 0 8px #0008;pointer-events:none;padding-right:56px}
.sp-mapb{position:absolute;right:10px;top:calc(114px + env(safe-area-inset-top,0px));width:46px;height:46px;border-radius:50%;background:#fff;box-shadow:0 3px 0 #c9bfd8,0 5px 10px #0003;font-size:20px;line-height:1}
.sp-mapb small{display:block;font-size:8px}
.sp-map{position:absolute;inset:0;background:#0007;pointer-events:auto;display:flex;align-items:center;justify-content:center;z-index:3}
.sp-map[hidden]{display:none}
.sp-map div{background:#17402a;border:3px solid #fff;border-radius:16px;padding:8px;box-shadow:0 6px 24px #0008;text-align:center;color:#fff;font-size:11px;font-weight:800}
.sp-map canvas{width:min(86vw,360px);height:min(86vw,360px);display:block;border-radius:10px;margin-bottom:6px}
.sp-spin .dsc{position:relative;width:84px;height:84px;margin:0 auto;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#dcdce8);border:3px solid #fff;box-shadow:0 3px 8px #0006}
.sp-spin .dsc:before,.sp-spin .dsc:after{content:'';position:absolute;background:#0002}.sp-spin .dsc:before{left:50%;top:6px;bottom:6px;width:1px}.sp-spin .dsc:after{top:50%;left:6px;right:6px;height:1px}
.sp-spin .dsc i{position:absolute;width:16px;height:16px;border-radius:50%;background:#ff5a8a;border:2px solid #fff;left:50%;top:50%;transform:translate(-50%,-50%);box-shadow:0 1px 4px #0006}
.sp-spin .dsc em{position:absolute;font-style:normal;font-size:9px;font-weight:900;color:#5a4a6b99}
.sp-spin small{display:block;margin-bottom:3px;white-space:nowrap;font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 3px #000c;line-height:1.25}
.sp-gauge i{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#ff5a5a,#ffd36b,#8fe0b0)}
.sp-quit{position:absolute;left:10px;bottom:calc(20px + env(safe-area-inset-bottom,0px));background:#fffffff0;border-radius:999px;padding:8px 14px;font-size:12px;box-shadow:0 2px 6px #0002}
.sp-msg{position:absolute;left:0;right:0;top:32%;text-align:center;font-size:30px;font-weight:900;color:#fff;text-shadow:0 3px 0 #5a4a6b,0 0 12px #0006;pointer-events:none}
.sp-card{position:absolute;left:50%;top:22%;transform:translateX(-50%);background:#fffffff5;border-radius:18px;padding:14px 16px;pointer-events:auto;box-shadow:0 6px 20px #0003;min-width:260px;text-align:center;font-size:13px}
.sp-card table{margin:8px auto;border-collapse:collapse}.sp-card td{padding:3px 8px;border-bottom:1px solid #eee}
.sp-card .go{background:linear-gradient(160deg,#ffd0dc,#ffb3c1);color:#fff;border-radius:999px;padding:10px 26px;font-size:15px;margin-top:6px}`;
  document.head.appendChild(css);

  // ---- コース(毎日かわる) ----
  function course(kind) {
    const d = new Date(), key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}:${kind}`, r = rng(key);
    const nodes = Object.values(city.graph.nodes).filter(n => !/^pd|^p\d/.test(n.id));
    const [lo, hi] = kind === 'golf' ? [28, 75] : [22, 55], holes = [];
    for (let k = 0; k < HOLES; k++) {
      for (let tries = 0; tries < 200; tries++) {
        const a = nodes[Math.floor(r() * nodes.length)], b = nodes[Math.floor(r() * nodes.length)], L = Math.hypot(a.x - b.x, a.z - b.z);
        if (a === b || L < lo || L > hi) continue;
        let [gx, gz] = collide(b.x + (r() - 0.5) * 6, b.z + (r() - 0.5) * 6, 0.8);
        const dist = Math.hypot(a.x - gx, a.z - gz);
        const wa = r() * Math.PI * 2, ws = Math.round(r() * 40) / 10;   // 風の向きと強さ(0〜4m/s)
        holes.push({ wind: [Math.sin(wa) * ws, Math.cos(wa) * ws, ws], tee: [a.x, a.z], goal: [gx, gz], dist, par: kind === 'golf' ? (dist < 40 ? 3 : dist < 62 ? 4 : 5) : (dist < 35 ? 3 : 4) });
        break;
      }
    }
    return { key, holes };
  }
  // ---- 目印 ----
  function flagMesh(kind) {
    const g = new THREE.Group();
    if (kind === 'golf') {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24), new THREE.MeshBasicMaterial({ color: 0x1a1a1a })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.03; g.add(hole);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8), mat(0xffffff)); pole.position.y = 1.2; g.add(pole);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.7, -0.22); sh.lineTo(0, -0.45);
      const fl = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color: 0xff5a5a, side: THREE.DoubleSide })); fl.position.set(0.01, 2.4, 0); fl.renderOrder = 100; g.add(fl); g.userData.flag = fl;
    } else {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), mat(0xc0c0c8)); pole.position.y = 0.75; g.add(pole);
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.22, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffcf3a, side: THREE.DoubleSide, metalness: 0.4 })); basket.position.y = 0.62; g.add(basket);
      const top = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 24), mat(0xffcf3a)); top.rotation.x = Math.PI / 2; top.position.y = 1.42; g.add(top);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, ch = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.7, 4), mat(0xb8b8c0)); ch.position.set(Math.cos(a) * 0.3, 1.05, Math.sin(a) * 0.3); ch.rotation.z = Math.cos(a) * 0.15; ch.rotation.x = -Math.sin(a) * 0.15; g.add(ch); }
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.8, 32), new THREE.MeshBasicMaterial({ color: 0xffcf3a, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; g.add(ring);
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: kind === 'golf' ? 0xff7aa2 : 0xffcf3a, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 15; g.add(beam);   // 遠くからでも見える光の柱
    return g;
  }
  // ---- はじめる ----
  let camOffset = { x: 0, z: 0 };   // カメラのずらし分(左下スティックで動かす)
  function start(kind, opt = {}) {
    if (S) return;
    const C = course(kind);
    S = { kind, C, i: 0, strokes: [], n: 0, club: 0, curve: 0, hgt: 1, phase: 'aim', obj: null, power: 0, charging: false, cT: 0, last: null, objs: [], home: !!opt.home, hud: hudEl(kind, !!opt.home), flag: null, aimLine: null, msgT: 0 };
    camOffset = { x: 0, z: 0 };
    root.classList.add('sp-on'); toast?.(kind === 'golf' ? `⛳ きょうのゴルフコース(${HOLES}ホール)` : `🥏 きょうのフリスビーコース(${HOLES}ホール)`);
    const pm = kind === 'golf' ? new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), mat(0xffffff)) : (() => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.025, 24), mat(0xff7aa2)); return d; })();
    pm.castShadow = true; scene.add(pm); S.objs.push(pm); S.mesh = pm;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3));
    S.aimLine = new THREE.Line(g, new THREE.LineDashedMaterial({ color: 0xffff00, dashSize: 0.4, gapSize: 0.3, transparent: true, opacity: 1.0, linewidth: 4 })); S.aimLine.frustumCulled = false; scene.add(S.aimLine); S.objs.push(S.aimLine); S.aimLine.material.visible = false;
    { // 予定のコース:太い帯(カメラのほうを向く・画面での太さはほぼ一定・点線もよう)。線の点列(aimLine)を毎フレームこの帯に写す
      const NP = 40, bg = new THREE.BufferGeometry(), idx = [];
      bg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NP * 2 * 3), 3)); bg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(NP * 2 * 2), 2));
      for (let i = 0; i < NP - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } bg.setIndex(idx);
      const cv = document.createElement('canvas'); cv.width = 32; cv.height = 4; const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, 20, 4);
      const tx = new THREE.CanvasTexture(cv); tx.wrapS = THREE.RepeatWrapping; tx.magFilter = THREE.NearestFilter;
      S.band = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ map: tx, color: 0xffff00, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, opacity: 0.95 })); S.band.frustumCulled = false; S.band.renderOrder = 10; scene.add(S.band); S.objs.push(S.band);
    }   // 線の形は毎フレーム変わるので、さいしょの位置で見えなくならないように
    S.land = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })); S.land.rotation.x = -Math.PI / 2; scene.add(S.land); S.objs.push(S.land);
    hole(0);
  }
  function hole(i) {
    S.i = i; S.n = 0; const H = S.C.holes[i]; S.hud.querySelector('.sp-expr')?.remove();
    if (S.flag) scene.remove(S.flag);
    if (S.gMesh) { scene.remove(S.gMesh); S.gMesh = null; } S.gdef = null;
    S.flag = flagMesh(S.kind); S.flag.position.set(H.goal[0], 0, H.goal[1]); scene.add(S.flag);
    if (S.kind === 'golf') { S.gdef = makeGreen(H, rng(S.C.key + ':g' + i)); S.gMesh = greenMesh(S.gdef); }
    S.pos = new THREE.Vector3(H.tee[0], S.kind === 'golf' ? 0.06 : 1.2, H.tee[1]); S.phase = 'aim'; S.club = S.kind === 'golf' ? (H.dist > 55 ? 0 : 1) : 0;
    standAt(S.pos); msg(`ホール ${i + 1}  PAR ${H.par}`); drawHud();
  }
  function standAt(p) {   // ボールのうしろに立って、ゴールの方を向く
    camOffset = { x: 0, z: 0 };
    const H = S.C.holes[S.i], a = Math.atan2(H.goal[0] - p.x, H.goal[1] - p.z);
    me.x = p.x - Math.sin(a) * 0.7 + Math.cos(a) * 0.3; me.z = p.z - Math.cos(a) * 0.7 - Math.sin(a) * 0.3; me.ry = a; setYaw(a + Math.PI);
  }
  function end(quit) {
    const total = S.strokes.reduce((a, b) => a + b, 0), par = S.C.holes.slice(0, S.strokes.length).reduce((a, h) => a + h.par, 0), kind = S.kind;
    S.objs.forEach(o => scene.remove(o)); if (S.flag) scene.remove(S.flag); if (S.gMesh) scene.remove(S.gMesh); S.hud.remove(); root.classList.remove('sp-on');
    S = null;
    onEnd?.({ kind, quit, total, par });
  }
  function msg(t) { if (!S) return; const el = S.hud.querySelector('.sp-msg'); el.textContent = t; S.msgT = 1.8; }
  // ---- 画面 ----
  function hudEl(kind, home) {
    const h = document.createElement('div'); h.className = 'sp-hud';
    h.innerHTML = `<div class="sp-top"></div><div class="sp-lie"></div><div class="sp-msg"></div><div class="sp-clubs"></div>
      <button class="sp-aim sp-l">◀</button><button class="sp-aim sp-r">▶</button>${kind === 'golf' ? '' : '<div class="sp-gauge"><i style="height:0"></i></div>'}
      <div class="sp-tim" hidden><i></i></div><div class="sp-bend" hidden></div>${kind === 'golf' ? '<div class="sp-spin" hidden><small>タップで回転</small><div class="dsc"><em style="top:3px;left:50%;transform:translateX(-50%)">ころがる</em><em style="bottom:3px;left:50%;transform:translateX(-50%)">もどる</em><em style="left:4px;top:50%;transform:translateY(-50%)">左</em><em style="right:4px;top:50%;transform:translateY(-50%)">右</em><i></i></div></div><div class="sp-swing"><div class="pw"></div><div class="set" hidden></div><div class="mk"></div><span>▼ここで3回目</span></div>' : ''}<button class="sp-shot">${kind === 'golf' ? '⛳<small>タップ×3</small>' : '🥏<small>引く↓ ずらす↔</small>'}</button>${kind === 'golf' ? '<button class="sp-mapb">🗺<small>グリーン</small></button><div class="sp-map" hidden><div><canvas width="360" height="360"></canvas>青=ゆるい傾斜 赤=強い傾斜 / 矢印=ボールが流れる向き / 明るい所が高い<br>(さわると閉じる)</div></div>' : ''}<button class="sp-quit">${home ? '🏠 家にもどる' : '✕ やめる'}</button>`;
    root.appendChild(h);
    const shot = h.querySelector('.sp-shot');
    let y0 = 0, x0 = 0;
    shot.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!S || S.phase !== 'aim') return;
      if (S.kind === 'golf') { if (S.sw && S.sw.ph === 'shot') return; swingTap(); return; }   // ゴルフ:タップ3回(スタート → 強さ → 左右)
      S.charging = true; S.cT = 0; S.power = 0; S.bend = 0; y0 = e.clientY; x0 = e.clientX; try { shot.setPointerCapture(e.pointerId); } catch (_) { } });
    shot.addEventListener('pointermove', e => { if (!S || !S.charging || S.kind !== 'frisbee') return; S.power = Math.max(0, Math.min(1, (e.clientY - y0) / 150)); const dx = e.clientX - x0; S.bend = Math.abs(dx) < 6 ? 0 : Math.max(-1, Math.min(1, (dx - Math.sign(dx) * 6) / 64)); });   // 下へ引くほど強い・横へずらすとその向きへ曲がる
    const rel = () => {
      if (!S || !S.charging) return; S.charging = false;
      if (S.kind === 'frisbee') { if (S.power < 0.08) return; const nd = S.needle; S.curve = Math.sign(nd) * Math.pow(Math.abs(nd), 0.8); }   // 少しでもズレると、その分だけ曲がろうとする

      fire();
    };
    { const mb = h.querySelector('.sp-mapb'), mp = h.querySelector('.sp-map'); if (mb) { mb.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!S || !S.gdef) return; mp.hidden = false; drawMap(); }); mp.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); mp.hidden = true; }); } }
    { const sp = h.querySelector('.sp-spin'), dsc = h.querySelector('.dsc');   // ボールのどこに当てるか(中心=ふつう / 下=バックスピン / 上=トップスピン / 横=曲がる)
      const setSpin = e => { if (!S || S.phase !== 'aim') return; const r = dsc.getBoundingClientRect(); let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), y = -(e.clientY - (r.top + r.height / 2)) / (r.height / 2); const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } if (Math.hypot(x, y) < 0.12) { x = y = 0; } S.spin = { x, y }; };
      let dn = false; if (sp) { sp.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); dn = true; try { sp.setPointerCapture(e.pointerId); } catch (_) { } setSpin(e); });
      sp.addEventListener('pointermove', e => { if (dn) setSpin(e); }); sp.addEventListener('pointerup', () => { dn = false; }); sp.addEventListener('pointercancel', () => { dn = false; }); } }
    shot.addEventListener('pointerup', rel); shot.addEventListener('pointercancel', rel); shot.addEventListener('contextmenu', e => e.preventDefault());
    let held = null;
    const aimBtn = (el, d) => { el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); held = d; }); ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, () => (held = null))); };
    aimBtn(h.querySelector('.sp-l'), 1); aimBtn(h.querySelector('.sp-r'), -1);
    h._held = () => held;
    h.querySelector('.sp-clubs').addEventListener('pointerdown', e => { const b = e.target.closest('[data-c]'); if (!b || !S || S.phase !== 'aim') return; e.stopPropagation(); if (S.kind === 'golf') S.club = +b.dataset.c; else S.hgt = +b.dataset.c; drawHud(); audio?.play?.('wave'); });
    h.querySelector('.sp-quit').addEventListener('click', () => S && end(true));
    return h;
  }
  function drawHud() {
    const H = S.C.holes[S.i], dist = Math.hypot(H.goal[0] - S.pos.x, H.goal[1] - S.pos.z), tot = S.strokes.reduce((a, b) => a + b, 0);
    S.hud.querySelector('.sp-top').innerHTML = `<span><b>${S.kind === 'golf' ? '⛳' : '🥏'} ホール ${S.i + 1}/${HOLES}</b> PAR ${H.par}</span><span>${S.n + 1}${S.kind === 'golf' ? '打' : '投'}目 ・ のこり ${Math.round(dist)}m</span><span>風 <span class="sp-wind">⬆</span> ${H.wind[2]}m/s</span><span>合計 ${tot}</span>`;
    S.hud.querySelector('.sp-clubs').innerHTML = S.kind === 'golf'
      ? CLUBS.map((c, i) => `<button data-c="${i}" class="${S.club === i ? 'on' : ''}">${c.name}<br><small>〜${c.d}m</small></button>`).join('')
      : `<span style="pointer-events:none;background:#fffffff0;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:800">高さ</span>` + HGTS.map(([l, v]) => `<button data-c="${v}" class="${S.hgt === v ? 'on' : ''}">${l}</button>`).join('');
  }
  // ---- 打つ・投げる ----
  function aimDir() { const y = getYaw() + Math.PI; return [Math.sin(y), Math.cos(y)]; }   // カメラの向き=ねらう向き
  function fire() {
    camOffset = { x: 0, z: 0 }; const p = Math.max(0.05, S.power); let [dx, dz] = aimDir(); S.n++; S.last = S.pos.clone(); S.phase = 'fly'; S.t = 0; audio?.play?.('wave');
    me.ry = Math.atan2(dx, dz);
    if (S.kind === 'golf') {
      const c = CLUBS[S.club], dv = -(S.dev || 0) * (c.loft === 0 ? 0.08 : 0.06 + c.d / 70 * 0.1), cs = Math.cos(dv), sn = Math.sin(dv);   // 左右のずれ(長いクラブほど大きい)
      { const dev = LIES[lieNow()].dev, e = (Math.random() - 0.5) * 2 * dev, c2 = Math.cos(e), s2 = Math.sin(e); [dx, dz] = [dx * c2 + dz * s2, -dx * s2 + dz * c2]; }   // ラフはねらいがぶれる
      [dx, dz] = [dx * cs + dz * sn, -dx * sn + dz * cs]; msg(S.dev ? (S.dev > 0 ? 'ちょっと右へ…' : 'ちょっと左へ…') : 'ナイスショット!');
      if (c.loft === 0) { const v = Math.sqrt(2 * 1.0 * c.d * p); S.v = new THREE.Vector3(dx * v, 0, dz * v); S.pos.y = 0.06; S.gs = null; }
      else { S.gs = spinOf(); S.v = golfV(c, p, dx, dz, S.gs); S.spin = { x: 0, y: 0 }; }
    } else { const v = 6 + 18 * p; S.v = new THREE.Vector3(dx * v, [0.6, 2.0, 3.6][S.hgt] + p * 1.2, dz * v); S.pos.y = 1.2; S.curveNow = S.curve; S.lastCurve = S.curve; S.bend = S.bend || 0; }
    drawHud();
  }
  function hitWalls(p, v, keep) {   // 建物・木などに当たったら はね返る
    if (p.y > 7) return;
    for (const c of city.colliders) {
      if (c.r !== undefined) { const dx = p.x - c.cx, dz = p.z - c.cz, d = Math.hypot(dx, dz), m = c.r + 0.06; if (d < m && d > 1e-4) { const nx = dx / d, nz = dz / d, vn = v.x * nx + v.z * nz; p.x = c.cx + nx * m; p.z = c.cz + nz * m; if (vn < 0) { v.x -= (1 + keep) * vn * nx; v.z -= (1 + keep) * vn * nz; audio?.play?.('close'); } } }
      else if (p.x > c.x0 && p.x < c.x1 && p.z > c.z0 && p.z < c.z1) {
        const l = p.x - c.x0, r = c.x1 - p.x, t = p.z - c.z0, b = c.z1 - p.z, m = Math.min(l, r, t, b);
        if (m === l) { p.x = c.x0; v.x = -Math.abs(v.x) * keep; } else if (m === r) { p.x = c.x1; v.x = Math.abs(v.x) * keep; } else if (m === t) { p.z = c.z0; v.z = -Math.abs(v.z) * keep; } else { p.z = c.z1; v.z = Math.abs(v.z) * keep; }
        audio?.play?.('close');
      }
    }
  }
  // フリスビーが空を飛ぶ1ステップ(本番と、ねらいの線の先読みで同じ計算をつかう)。st={curveNow, bend}
  function frisAir(p, v, st, H, h) {
    const sp = Math.hypot(v.x, v.z), ux = v.x / (sp || 1), uz = v.z / (sp || 1);
    const head = -(H.wind[0] * ux + H.wind[1] * uz), cross = H.wind[0] * -uz + H.wind[1] * ux;   // 向かい風(+)/追い風(-)、横風(右へ+)
    const lift = Math.max(0, Math.min(0.92, sp / 20 + head * 0.05)); v.y -= G * (1 - lift) * h; v.y *= Math.exp(-0.6 * h);   // 向かい風で浮く、追い風で落ちる
    st.curveNow += cross * 0.06 * h;   // 横風を受けると、そっちへ傾いて曲がりはじめる
    const slow = 1 - Math.min(1, sp / 24), side = (st.curveNow * 3.8 - 0.5) * (0.25 + 0.75 * slow) * h;   // タイミングの針の曲がり(おそくなるほど強い)
    const bs = (st.bend || 0) * 13 * (0.4 + 0.6 * slow) * h;   // 指でずらした分の曲がり:進む向きに対して横へ、大きく旋回する
    v.x += -uz * (side + bs); v.z += ux * (side + bs);   // (-uz, ux) = 進む向きの右
    v.x *= Math.exp(-(0.22 + Math.max(0, head) * 0.03) * h); v.z *= Math.exp(-(0.22 + Math.max(0, head) * 0.03) * h); v.x += H.wind[0] * 0.75 * h; v.z += H.wind[1] * 0.75 * h;   // 風(しっかり流される)
  }
  // いま はなしたら どう飛ぶか(点の列)
  function simFris(power, bend, curve) {
    const H = S.C.holes[S.i], [dx, dz] = aimDir(), p = S.pos.clone(), pw = Math.max(0.05, power), v0 = 6 + 18 * pw;
    p.y = 1.2; const v = new THREE.Vector3(dx * v0, [0.6, 2.0, 3.6][S.hgt] + pw * 1.2, dz * v0), st = { curveNow: curve, bend }, h = 1 / 60, pts = [p.clone()];
    for (let i = 0; i < 480 && p.y > 0.03; i++) { frisAir(p, v, st, H, h); p.addScaledVector(v, h); if (i % 3 === 2) pts.push(p.clone()); }
    pts.push(p.clone()); return pts;
  }
  // ---- ライ(ボールのある場所)とグリーン ----
  const LIES = { fairway: { name: 'フェアウェイ', fr: 1.6, dist: 1, spin: 1, dev: 0 }, rough: { name: 'ラフ', fr: 3.2, dist: 0.78, spin: 0.35, dev: 0.05 }, fringe: { name: 'フリンジ', fr: 2.2, dist: 0.95, spin: 0.8, dev: 0.012 }, green: { name: 'グリーン', fr: 1, dist: 1, spin: 1, dev: 0 } };
  const GG = 9.8 * 0.9, SPEEDS = [['速い', 0.8], ['ふつう', 1.0], ['おそい', 1.3]];
  function lieAt(x, z) {
    const g = S && S.gdef; if (g) { const [lx, ly] = g.toL(x, z), r = Math.hypot(lx, ly), R = g.rad(Math.atan2(ly, lx)); if (r < R) return 'green'; if (r < R + g.fw) return 'fringe'; }
    if (Math.hypot(x, z) < PLAZA_R + 1) return 'fairway';   // 広場・道・歩道はフェアウェイ、それ以外の芝生はラフ
    const hw = ROAD_HALF + WALK; for (const [dir, f, a, b] of STREETS) { if (dir === 'ns' ? (Math.abs(x - f) < hw && z >= a - 1 && z <= b + 1) : (Math.abs(z - f) < hw && x >= a - 1 && x <= b + 1)) return 'fairway'; }
    return 'rough';
  }
  function makeGreen(H, r) {   // その日・そのホールで決まる(同じ日はみんな同じグリーン)
    const a = Math.atan2(H.goal[0] - H.tee[0], H.goal[1] - H.tee[1]), kind = Math.floor(r() * 5);   // 形:0まる 1だ円 2まめ 3くびれ 4ひろめ
    const R0 = [7.2, 6.6, 7.4, 7.8, 9.2][kind] + r() * 1.2, a1 = kind === 2 ? 0.22 : 0.04, a2 = [0.04, 0.26, 0.08, -0.3, 0.12][kind], a3 = 0.03 + r() * 0.07, p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28;
    const g = { a, dx: Math.sin(a), dz: Math.cos(a), rx: Math.cos(a), rz: -Math.sin(a), R0, fw: 1.2 + r() * 1.2, kind };
    g.rad = th => R0 * (1 + a1 * Math.cos(th + p1) + a2 * Math.cos(2 * th + p2) + a3 * Math.cos(3 * th + p3));
    g.Rm = R0 * (1 + Math.abs(a1) + Math.abs(a2) + a3);
    const sp = SPEEDS[Math.floor(r() * 3)]; g.speedName = sp[0]; g.fr = sp[1];
    const tp = r() * 6.28, rho = (0.15 + r() * 0.65) * g.rad(tp) * 0.85; g.pin = [Math.cos(tp) * rho, Math.sin(tp) * rho];   // ピンはグリーンのどこか(端もあり)
    g.cx = H.goal[0] - (g.pin[0] * g.rx + g.pin[1] * g.dx); g.cz = H.goal[1] - (g.pin[0] * g.rz + g.pin[1] * g.dz);
    // 高さ=いくつかの地形の足し算(ひと山だけにならない)
    const F = [], ang = () => { const t = r() * 6.28; return [Math.cos(t), Math.sin(t)]; }, bump = (A, s, sc = 0.7) => { const t = r() * 6.28, rr = r() * g.R0 * sc; F.push({ t: 'bump', x: Math.cos(t) * rr, y: Math.sin(t) * rr, A, s }); };
    const style = Math.floor(r() * 6); g.style = ['ワンスロープ', 'ドーム', 'おわん', '2だん', '谷すじ', 'うねり'][style];
    if (style === 0) { const [nx, ny] = ang(); F.push({ t: 'plane', nx, ny, k: 0.02 + r() * 0.02 }); bump(0.12 * (r() < .5 ? 1 : -1), 2.2); }
    else if (style === 1) { F.push({ t: 'bump', x: (r() - .5) * 3, y: (r() - .5) * 3, A: 0.26 + r() * 0.14, s: g.R0 * 0.42 }); const [nx, ny] = ang(); F.push({ t: 'plane', nx, ny, k: 0.012 }); }
    else if (style === 2) { F.push({ t: 'bump', x: (r() - .5) * 3, y: (r() - .5) * 3, A: -(0.26 + r() * 0.14), s: g.R0 * 0.42 }); const [nx, ny] = ang(); F.push({ t: 'plane', nx, ny, k: 0.012 }); }
    else if (style === 3) { const [nx, ny] = ang(); F.push({ t: 'tier', nx, ny, c: (r() - .5) * 3, A: 0.18 + r() * 0.1, w: 1.3 }); bump(0.14 * (r() < .5 ? 1 : -1), 2); }
    else if (style === 4) { const [nx, ny] = ang(); F.push({ t: 'ridge', nx, ny, c: (r() - .5) * 4, A: -(0.2 + r() * 0.1), w: 2 }); const [mx, my] = ang(); F.push({ t: 'plane', nx: mx, ny: my, k: 0.015 }); }
    else { bump(0.26, 3.4); bump(-0.26, 3.4); bump(0.2 * (r() < .5 ? 1 : -1), 2.6); }
    if (style !== 5) bump(0.1 * (r() < .5 ? 1 : -1), 1.8 + r() * 0.8);
    g.F = F;
    g.h = (x, y) => { let h = 0; for (const f of F) { if (f.t === 'bump') h += f.A * Math.exp(-((x - f.x) ** 2 + (y - f.y) ** 2) / (2 * f.s * f.s)); else if (f.t === 'plane') h += f.k * (f.nx * x + f.ny * y); else { const u = f.nx * x + f.ny * y - (f.c || 0); h += f.t === 'tier' ? f.A * Math.tanh(u / f.w) : f.A * Math.exp(-u * u / (2 * f.w * f.w)); } } return h; };
    g.grad = (x, y) => { let gx = 0, gy = 0; for (const f of F) { if (f.t === 'bump') { const dx = x - f.x, dy = y - f.y, e = f.A * Math.exp(-(dx * dx + dy * dy) / (2 * f.s * f.s)) / (f.s * f.s); gx -= e * dx; gy -= e * dy; } else if (f.t === 'plane') { gx += f.k * f.nx; gy += f.k * f.ny; } else { const u = f.nx * x + f.ny * y - (f.c || 0), d = f.t === 'tier' ? f.A / f.w * (1 - Math.tanh(u / f.w) ** 2) : -f.A * Math.exp(-u * u / (2 * f.w * f.w)) * u / (f.w * f.w); gx += d * f.nx; gy += d * f.ny; } } return [gx, gy]; };
    g.toL = (wx, wz) => { const x = wx - g.cx, z = wz - g.cz; return [x * g.rx + z * g.rz, x * g.dx + z * g.dz]; };
    g.toW = (x, y) => [g.cx + x * g.rx + y * g.dx, g.cz + x * g.rz + y * g.dz];
    g.gradW = (wx, wz) => { const [lx, ly] = g.toL(wx, wz), [gx, gy] = g.grad(lx, ly); return [gx * g.rx + gy * g.dx, gx * g.rz + gy * g.dz]; };   // 世界の向きでの「上り」の向き
    // 地面にはる絵:高低の色 + 傾斜の矢印(青=ゆるい / 赤=強い)
    const N = 384, Sx = g.Rm + g.fw + 0.6, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), im = c.createImageData(N, N);
    let hmin = 9, hmax = -9; for (let x = -g.Rm; x <= g.Rm; x += 0.7) for (let y = -g.Rm; y <= g.Rm; y += 0.7) { const h = g.h(x, y); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); }
    for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
      const x = (px / N * 2 - 1) * Sx, y = (1 - py / N * 2) * Sx, rr = Math.hypot(x, y), R = g.rad(Math.atan2(y, x)), i = (py * N + px) * 4;
      if (rr < R) { const t = (g.h(x, y) - hmin) / ((hmax - hmin) || 1), edge = Math.min(1, (R - rr) / 0.25); im.data[i] = 70 + t * 110; im.data[i + 1] = 150 + t * 80; im.data[i + 2] = 80 + t * 30; im.data[i + 3] = 235 * (0.55 + 0.45 * edge); }
      else if (rr < R + g.fw) { im.data[i] = 120; im.data[i + 1] = 190; im.data[i + 2] = 105; im.data[i + 3] = 150; }
    }
    c.putImageData(im, 0, 0);
    const P = (x, y) => [(x / Sx + 1) / 2 * N, (1 - (y / Sx + 1) / 2) * N]; c.lineCap = 'round';
    for (let x = -g.Rm; x <= g.Rm; x += 1.7) for (let y = -g.Rm; y <= g.Rm; y += 1.7) {
      if (rr2(x, y) > 0.92) continue; const [gx, gy] = g.grad(x, y), m = Math.hypot(gx, gy), st = Math.min(1, m / 0.07); if (st < 0.05) continue;
      const dx = -gx / m, dy = -gy / m, len = (0.45 + st * 0.9) * N / (2 * Sx), [px, py] = P(x, y), ex = px + dx * len / 2, ey = py - dy * len / 2, sx = px - dx * len / 2, sy = py + dy * len / 2, an = Math.atan2(ey - sy, ex - sx), hs = 5 + st * 3;
      c.strokeStyle = `rgb(${Math.round(70 + st * 185)},${Math.round(160 - st * 100)},${Math.round(255 - st * 215)})`; c.lineWidth = 2.2 + st * 1.6; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(ex - Math.cos(an - 0.5) * hs, ey - Math.sin(an - 0.5) * hs); c.moveTo(ex, ey); c.lineTo(ex - Math.cos(an + 0.5) * hs, ey - Math.sin(an + 0.5) * hs); c.stroke();
    }
    function rr2(x, y) { return Math.hypot(x, y) / g.rad(Math.atan2(y, x)); }
    { const [hx, hy] = P(g.pin[0], g.pin[1]); c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(hx, hy, 0.26 * N / (2 * Sx), 0, 7); c.fill(); c.restore(); }   // カップの所だけ、絵をぬく(下のホールが見える)
    g.tex = cv; g.Sx = Sx; return g;
  }
  function greenMesh(g) {   // 町の地面にはる(1まい)。まちは平らなまま、ボールにだけ傾斜が効く
    const Sx = g.Sx, y = 0.035, V = [[-Sx, -Sx, 0, 0], [Sx, -Sx, 1, 0], [Sx, Sx, 1, 1], [-Sx, Sx, 0, 1]], pos = [], uv = [];
    for (const [lx, ly, u, v] of V) { const [wx, wz] = g.toW(lx, ly); pos.push(wx, y, wz); uv.push(u, v); }
    const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); ge.setIndex([0, 1, 2, 0, 2, 3]);
    const tx = new THREE.CanvasTexture(g.tex); tx.anisotropy = 4; const m = new THREE.Mesh(ge, new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.renderOrder = 2; scene.add(m); return m;
  }
  function lieNow() { return lieAt(S.pos.x, S.pos.z); }
  function drawMap() {   // グリーン全体図(真上から・よみとり用)
    const g = S.gdef, cv = S.hud.querySelector('.sp-map canvas'), c = cv.getContext('2d'), N = cv.width, Sx = g.Sx, P = (x, y) => [(x / Sx + 1) / 2 * N, (1 - (y / Sx + 1) / 2) * N];
    c.clearRect(0, 0, N, N); c.fillStyle = '#17402a'; c.fillRect(0, 0, N, N); c.drawImage(g.tex, 0, 0, N, N);
    const [px, py] = P(g.pin[0], g.pin[1]); c.fillStyle = '#111'; c.beginPath(); c.arc(px, py, 6, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - 24); c.stroke(); c.fillStyle = '#ff5a5a'; c.beginPath(); c.moveTo(px, py - 24); c.lineTo(px + 14, py - 19); c.lineTo(px, py - 14); c.fill();
    const [bl, bm] = g.toL(S.pos.x, S.pos.z), [bx, by] = P(bl, bm), [dx, dz] = aimDir(), ax = dx * g.rx + dz * g.rz, ay = dx * g.dx + dz * g.dz, [ex, ey] = P(bl + ax * 40, bm + ay * 40);
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(bx, by, 5, 0, 7); c.fill(); c.strokeStyle = '#555'; c.lineWidth = 1; c.stroke();
  }
  function lieText() {
    const lie = lieNow(), L = LIES[lie], g = S.gdef;
    if (lie === 'green') {
      const [dx, dz] = aimDir(), [gx, gz] = g.gradW(S.pos.x, S.pos.z), al = gx * dx + gz * dz, cr = gx * -dz + gz * dx, t = [];
      t.push(Math.abs(al) < 0.006 ? 'たいら' : al > 0 ? `上り ${Math.round(al * 100)}%` : `下り ${Math.round(-al * 100)}%`);
      if (Math.abs(cr) >= 0.006) t.push(cr > 0 ? `左へ流れる ${Math.round(cr * 100)}%` : `右へ流れる ${Math.round(-cr * 100)}%`);
      return `グリーン(${g.speedName}・${g.style}) ${t.join(' / ')}`;
    }
    return lie === 'fairway' ? 'フェアウェイ' : lie === 'fringe' ? 'フリンジ(すこし重い)' : 'ラフ(飛ばない・スピンがきかない・ぶれる)';
  }
  // ---- ゴルフのスピン:spin={x:横(右+),y:縦(上=トップ+/下=バック-)} ----
  function spinOf() { const sp = S.spin || { x: 0, y: 0 }, k = LIES[lieNow()].spin; return { side: sp.x, back: Math.max(0, -sp.y) * k, top: Math.max(0, sp.y) * k, used: false }; }
  function golfV(c, p, dx, dz, gs) {   // 打ち出し速度。回転をかけるほど少し飛ばなくなる / バックスピンは高く上がる
    const mag = Math.min(1, Math.hypot(gs.side, gs.back + gs.top)), pw = p * (1 - 0.18 * mag) * LIES[lieNow()].dist, th = (c.loft + gs.back * 6) * Math.PI / 180, v = Math.sqrt(c.d * pw * G / Math.sin(2 * Math.min(th, 1.2)));
    const e = gs.side * 0.03, ex = dx - dz * e, ez = dz + dx * e, el = Math.hypot(ex, ez);   // 打ち出しは、曲がる側へほんの少しだけ向く(そこから曲がっていく)
    return new THREE.Vector3(ex / el * v * Math.cos(th), v * Math.sin(th), ez / el * v * Math.cos(th));
  }
  function golfPhys(p, v, h, H, gs, c, snd) {   // 1ステップ(本番とねらい線の先読みで同じ計算)
    if (p.y > 0.06 || v.y > 0) {
      v.y -= G * h; v.multiplyScalar(Math.exp(-0.05 * h)); v.x += H.wind[0] * 0.07 * h; v.z += H.wind[1] * 0.07 * h;
      if (gs && gs.side) { const sp = Math.hypot(v.x, v.z) || 1, ux = v.x / sp, uz = v.z / sp, a = gs.side * (1.2 + 1.2 * c.d / 70) * h; v.x += -uz * a; v.z += ux * a; }   // 横回転:進む向きの右(+)/左(-)へ曲がる
    } else {
      p.y = 0.06;
      if (v.y < -1.5) {
        let f = 0.7; if (gs && !gs.used) { gs.used = true; f = 0.7 * (1 - 1.7 * gs.back + 0.7 * gs.top); if (gs.back > 0.15 && snd) msg('キュキュッ! もどる!'); }   // 落ちた時にスピンが効く:バック=ブレーキや逆もどり、トップ=前へころがる
        v.y = -v.y * (gs && gs.top ? 0.4 : 0.35); { const hs = Math.hypot(v.x, v.z) || 1, kx = gs ? -v.z / hs * gs.side * 0.2 * hs : 0, kz = gs ? v.x / hs * gs.side * 0.2 * hs : 0; v.x = v.x * f + kx; v.z = v.z * f + kz; }   // 横回転は、着地でも少し横へそれる
        if (lieAt(p.x, p.z) === 'rough') { v.x *= 0.6; v.z *= 0.6; v.y *= 0.5; }   // ラフはボールが止まりやすい
        if (snd) audio?.play?.('close');
      } else {   // ころがり:場所(ライ)のまさつ + グリーンの傾斜
        v.y = 0; const lie = lieAt(p.x, p.z), gd = S && S.gdef; let fr = LIES[lie].fr, ax = 0, az = 0;
        if (lie === 'green' && gd) { fr = gd.fr; const [gx, gz] = gd.gradW(p.x, p.z); ax = -gx * GG; az = -gz * GG; }
        const sp = Math.hypot(v.x, v.z);
        if (sp > 0.03) { v.x += ax * h; v.z += az * h; const s2 = Math.hypot(v.x, v.z), dec = fr * h; if (s2 <= dec) { v.x = v.z = 0; } else { v.x *= (s2 - dec) / s2; v.z *= (s2 - dec) / s2; } }
        else if (Math.hypot(ax, az) > fr * 1.05) { v.x += ax * h; v.z += az * h; } else { v.x = v.z = 0; }
      }
    }
    p.addScaledVector(v, h);
  }
  function simGolf(p0, dx, dz, pw) {   // いま打ったらどう飛ぶか(点の列)
    const H = S.C.holes[S.i], c = CLUBS[S.club], gs = spinOf(), p = S.pos.clone(), v = golfV(c, pw, dx, dz, gs), pts = [p.clone()], h = 0.01;
    for (let k = 0; k < 1000; k++) { golfPhys(p, v, h, H, gs, c, false); if (k % 2 === 0) pts.push(p.clone()); if (k > 20 && p.y <= 0.07 && Math.hypot(v.x, v.z) < 0.05) break; }
    pts.push(p.clone()); return pts;
  }
  function stepFly(dt) {
    const H = S.C.holes[S.i], p = S.pos, v = S.v, n = 4, h = dt / n;
    for (let k = 0; k < n; k++) {
      if (S.kind === 'golf') {
        golfPhys(p, v, h, H, S.gs, CLUBS[S.club], true); hitWalls(p, v, 0.45);
        const dh = Math.hypot(p.x - H.goal[0], p.z - H.goal[1]), sp = Math.hypot(v.x, v.z);
        if (dh < 0.34 && p.y < 0.2 && sp < 2.8) return holed();   // カップイン(はやすぎるとはずんで外れる)
      } else {
        const sp = Math.hypot(v.x, v.z);
        if (p.y > 0.03) {
          frisAir(p, v, S, H, h);
        } else { p.y = 0.03; v.y = 0; const dec = 7 * h; if (sp <= dec) { v.x = v.z = 0; } else { v.x *= (sp - dec) / sp; v.z *= (sp - dec) / sp; } }
        p.addScaledVector(v, h); hitWalls(p, v, 0.3);
        const dh = Math.hypot(p.x - H.goal[0], p.z - H.goal[1]);
        if (dh < 0.8 && p.y > 0.05 && p.y < 2.0) return holed();   // バスケットに入った
      }
      if (Math.abs(p.x) > 72 || p.z < -80 || p.z > 72) { msg('OB! もとの場所から(+1)'); S.n++; S.pos.copy(S.last); S.phase = 'aim'; standAt(S.pos); drawHud(); return; }
    }
    if (Math.hypot(v.x, v.z) < 0.08 && (S.kind === 'golf' ? p.y <= 0.07 : p.y <= 0.04)) {   // 止まった
      S.phase = 'aim'; if (S.kind === 'frisbee') p.y = 1.2; standAt(p); drawHud();
      if (S.n >= 12) { msg('ギブアップ… つぎのホールへ'); S.strokes.push(S.n + 1); next(); }
    }
  }
  function holed() {
    const H = S.C.holes[S.i], d = S.n - H.par;
    const nm = S.n === 1 ? 'ホールインワン!!' : d <= -2 ? 'イーグル!' : d === -1 ? 'バーディー!' : d === 0 ? 'パー!' : d === 1 ? 'ボギー' : `${S.n}${S.kind === 'golf' ? '打' : '投'}`;
    msg(nm); audio?.play?.(d <= 0 ? 'coin' : 'open'); S.strokes.push(S.n); S.phase = 'holed'; S.t = 0; giveExpr();
  }
  // 1ホールごとに英語の表現(句動詞・慣用句)を1つもらう
  function giveExpr() {
    const X = holeExpr(exprPool && exprPool(), S.C.key + S.kind, S.i); (S.got = S.got || []).push(X); try { onGive?.(X, S.kind); } catch (e) { console.error(e); }   // もらった瞬間に、勉強ノートと今日の記録へ
    const el = document.createElement('div'); el.className = 'sp-expr';
    el.style.cssText = 'position:absolute;left:12px;right:12px;bottom:calc(150px + env(safe-area-inset-bottom,0px));background:#fffffff2;border-radius:16px;padding:8px 12px;box-shadow:0 4px 14px #0003;text-align:center;font-weight:800;color:#5a4a6b;pointer-events:none';
    el.innerHTML = `<small style="color:#8d7f9e">🎁 ホール${S.i + 1}の英語表現</small><div style="font-size:19px;font-weight:900">${X.en}</div><div style="font-size:12px">${X.ja}</div>`;
    S.hud.appendChild(el);
    try { const u = new SpeechSynthesisUtterance(X.en); u.lang = 'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { }
  }
  function next() {
    if (S.i + 1 >= HOLES) { S.phase = 'done'; showCard(); return; }
    hole(S.i + 1);
  }
  function showCard() {
    const tot = S.strokes.reduce((a, b) => a + b, 0), par = S.C.holes.reduce((a, h) => a + h.par, 0), coins = Math.max(10, 60 - Math.max(0, tot - par) * 5);
    wallet?.add?.(coins, S.kind);
    const c = document.createElement('div'); c.className = 'sp-card';
    c.innerHTML = `<b style="font-size:17px">${S.kind === 'golf' ? '⛳ きょうのゴルフ' : '🥏 きょうのフリスビー'} おわり!</b><table>${S.C.holes.map((h, i) => `<tr><td>ホール${i + 1}</td><td>PAR ${h.par}</td><td><b>${S.strokes[i] ?? '-'}</b></td></tr>`).join('')}<tr><td>合計</td><td>${par}</td><td><b>${tot}</b> (${tot - par >= 0 ? '+' : ''}${tot - par})</td></tr></table>🪙 +${coins}<br>${(S.got || []).length ? `<div style="margin-top:8px;font-size:12px">🎁 もらった表現<br>${S.got.map(x => `<b>${x.en}</b> <small>${x.ja}</small>`).join('<br>')}</div><button class="pr" style="background:#d6f0ff;border-radius:999px;padding:9px 18px;font-size:13px;margin-top:8px">🗣 すぐ使ってみる(英語脳)</button><br>` : ''}<button class="go">${S.home ? '🏠 家にもどる' : 'あとで(今日のふりかえりに出るよ)'}</button>`;
    c.addEventListener('pointerdown', e => e.stopPropagation()); const fin = pr => { const g = S.got || [], kd = S.kind; end(false); try { onExpr?.(g, pr, kd); } catch (e) { console.error(e); } };
    c.querySelector('.go').addEventListener('click', () => fin(false)); c.querySelector('.pr')?.addEventListener('click', () => fin(true));
    S.hud.appendChild(c);
  }
  // ---- ゴルフのスイング(みんゴル式):1回目でスタート → 2回目で強さ → もどってくる印を「インパクト」で3回目 ----
  const IMPACT = 0.1;
  // パター:タップ2回(スタート → 強さ)で打つ。左右のメーターはなし
  // ほかのクラブ:1回目スタート → 2回目で強さ → もどってくる印を「インパクト」で3回目
  //   いちばん上(MAX)で少し止まる。そこで押すとMAXの強さ(3回目あつかいにはしない)。強さを決めた直後のタップは数えない
  function swingTap() {
    const sw = S.sw, putt = CLUBS[S.club].loft === 0;
    if (!sw) { S.sw = { ph: 1, pos: 0, hold: 0, since: 0 }; audio?.play?.('wave'); return; }
    if (sw.ph === 1 || sw.ph === 'top') { S.power = Math.max(0.05, sw.pos); sw.ph = 2; sw.since = 0; audio?.play?.('open'); if (putt) { S.dev = 0; S.sw = null; fire(); } return; }
    if (sw.ph === 2) { if (sw.since < 0.22) return; const d = (sw.pos - IMPACT) / 0.13; S.dev = Math.abs(d) < 0.22 ? 0 : Math.max(-1, Math.min(1, d)); sw.ph = 'shot'; sw.shotT = 0; sw.hitAt = sw.pos; fire(); }
  }
  function swingStep(dt) {
    const sw = S.sw, el = S.hud.querySelector('.sp-swing'); if (!el) return;
    const putt = CLUBS[S.club].loft === 0;
    el.querySelector('span').style.display = putt ? 'none' : '';
    if (sw) {
      sw.since += dt;
      if (sw.ph === 1) { sw.pos += dt * 0.75; if (sw.pos >= 1) { sw.pos = 1; sw.ph = 'top'; sw.hold = 0; } }
      else if (sw.ph === 'top') { sw.hold += dt; if (sw.hold > 0.3) { S.power = 1; if (putt) { S.dev = 0; S.sw = null; fire(); return; } sw.ph = 2; sw.since = 0.3; } }   // MAXで少し止まってから もどる
      else if (sw.ph === 2) { sw.pos -= dt * 0.8; if (sw.pos < -0.06) { S.dev = -1; sw.ph = 'shot'; sw.shotT = 0; sw.hitAt = sw.pos; msg('タイミングが合わなかった…'); fire(); } }
      else if (sw.ph === 'shot') { sw.shotT += dt; if (sw.shotT > 0.9) S.sw = null; }   // 打ったあとも少しだけ結果を見せる
    }
    const cur = S.sw, pos = cur ? (cur.ph === 'shot' ? cur.hitAt : cur.pos) : 0;
    el.querySelector('.mk').style.left = `calc(${Math.max(0, pos) * 100}% - 2px)`;
    el.querySelector('.pw').style.width = `${(cur && (cur.ph === 1 || cur.ph === 'top') ? pos : cur ? S.power : 0) * 100}%`;
    const st = el.querySelector('.set'), showSet = !!(cur && cur.ph !== 1 && cur.ph !== 'top'); st.hidden = !showSet; if (showSet) st.style.left = `calc(${S.power * 100}% - 1px)`;
  }
  // ---- 毎フレーム ----
  const tmp = new THREE.Vector3();
  function update(dt) {
    if (!S) return;
    S.msgT = Math.max(0, S.msgT - dt); if (S.msgT <= 0) S.hud.querySelector('.sp-msg').textContent = '';
    const held = S.hud._held(); if (held && S.phase === 'aim') setYaw(getYaw() + held * dt * 0.9);
    if (S.charging) S.cT += dt;
    if (S.kind === 'golf') swingStep(dt);
    if (S.kind === 'frisbee') { const tm = S.hud.querySelector('.sp-tim'), on = !!S.charging; if (tm.hidden === on) tm.hidden = !on; if (on) { S.needle = Math.sin(S.cT * 2.8); tm.firstChild.style.left = `calc(${50 + S.needle * 48}% - 2px)`; } }
    { const H = S.C.holes[S.i], w = S.hud.querySelector('.sp-wind'); if (w) { const y = getYaw() + Math.PI, fx = Math.sin(y), fz = Math.cos(y), up = H.wind[0] * fx + H.wind[1] * fz, rt = H.wind[0] * -fz + H.wind[1] * fx; w.style.transform = `rotate(${Math.atan2(rt, up) * 180 / Math.PI}deg)`; } }
    const gq = S.hud.querySelector('.sp-gauge i'); if (gq) gq.style.height = `${Math.round((S.charging ? S.power : 0) * 100)}%`;
    if (S.phase === 'fly') { S.t += dt; stepFly(dt); }
    if (S.phase === 'holed') { S.t += dt; if (S.t > 2.2) next(); }
    if (S.phase === 'aim') { me.ry = Math.atan2(...aimDir()); }
    // ボール/ディスク
    if (S.kind === 'frisbee' && S.phase !== 'fly') S.mesh.position.set(me.x + Math.sin(me.ry) * 0.35, 1.1, me.z + Math.cos(me.ry) * 0.35); else S.mesh.position.copy(S.pos);
    if (S.kind === 'frisbee') S.mesh.rotation.y += dt * (S.phase === 'fly' ? 20 : 0);
    if (S.flag?.userData.flag) S.flag.userData.flag.rotation.y = Math.sin(performance.now() / 300) * 0.3;
    if (S.kind === 'golf') { const le = S.hud.querySelector('.sp-lie'); if (le) { const t = S.phase === 'aim' ? lieText() : ''; if (le.textContent !== t) le.textContent = t; } const mp = S.hud.querySelector('.sp-map'); if (mp && !mp.hidden) drawMap(); const mb = S.hud.querySelector('.sp-mapb'); if (mb) mb.style.display = S.phase === 'aim' ? '' : 'none'; }
    // ねらいの線と、だいたいの落ちる場所
    const show = S.phase === 'aim'; S.aimLine.visible = S.land.visible = show;
    { const spEl = S.hud.querySelector('.sp-spin'); if (spEl) spEl.hidden = !(show && S.kind === 'golf' && CLUBS[S.club].loft); if (S.kind === 'golf' && show && !CLUBS[S.club].loft) S.aimLine.material.color.set(0xffffff); } if (S.kind === 'frisbee' && !(show && S.charging)) { const bt = S.hud.querySelector('.sp-bend'); if (bt) bt.hidden = true; }
    if (show) {
      let [dx, dz] = aimDir(); let L;
      if (S.kind === 'golf') { const c = CLUBS[S.club]; L = c.d * (S.sw ? Math.max(0.05, S.sw.ph === 1 ? S.sw.pos : S.power) : 1); } else L = 26 * (S.charging ? Math.max(0.05, S.power) : 1);
      const a = S.aimLine.geometry.attributes.position, y0 = S.kind === 'golf' ? 0.08 : 1.1;
      if (S.kind === 'frisbee' && S.charging) {   // 引いている間は、いま はなしたときの曲がる道すじを見せる
        const pts = simFris(S.power, S.bend || 0, Math.sign(S.needle || 0) * Math.pow(Math.abs(S.needle || 0), 0.8)), a2 = S.aimLine.geometry.attributes.position;
        for (let i = 0; i < 40; i++) { const q = pts[Math.min(pts.length - 1, Math.round(i / 39 * (pts.length - 1)))]; a2.setXYZ(i, q.x, Math.max(0.1, q.y), q.z); }
        a2.needsUpdate = true; S.aimLine.computeLineDistances(); const e = pts[pts.length - 1]; S.land.position.set(e.x, 0.05, e.z);
        const bt = S.hud.querySelector('.sp-bend'), bd = S.bend || 0; bt.hidden = false; bt.textContent = Math.abs(bd) < 0.05 ? '↑ まっすぐ' : `${bd < 0 ? '↰ 左へ' : '右へ ↱'} 曲がる ${Math.round(Math.abs(bd) * 100)}%`;
      } else if (S.kind === 'golf' && CLUBS[S.club].loft) {   // ゴルフ:回転ぶんの曲がりも見せる線(右へ=オレンジ / 左へ=水色 / もどる=ピンク)
        // fireのdevのぶれと同じ修正を適用
        { const c = CLUBS[S.club], dv = -(S.dev || 0) * (c.loft === 0 ? 0.08 : 0.06 + c.d / 70 * 0.1), cs = Math.cos(dv), sn = Math.sin(dv); [dx, dz] = [dx * cs + dz * sn, -dx * sn + dz * cs]; }
        const pw = Math.max(0.05, S.sw ? (S.sw.ph === 1 ? S.sw.pos : S.power) : 1), pts = simGolf(S.pos, dx, dz, pw), a2 = S.aimLine.geometry.attributes.position;
        for (let i = 0; i < 40; i++) { const q = pts[Math.min(pts.length - 1, Math.round(i / 39 * (pts.length - 1)))]; a2.setXYZ(i, q.x, Math.max(0.08, q.y), q.z); }
        a2.needsUpdate = true; S.aimLine.computeLineDistances(); const e = pts[pts.length - 1]; S.land.position.set(e.x, 0.05, e.z);
        const sp = S.spin || { x: 0, y: 0 }; S.aimLine.material.color.set(Math.abs(sp.x) > 0.15 ? (sp.x > 0 ? 0xffa23c : 0x6ad0ff) : sp.y < -0.3 ? 0xff7aa2 : 0xffffff);
        const lb = S.hud.querySelector('.sp-spin small'), t = [];
        if (Math.abs(sp.x) > 0.15) t.push(sp.x > 0 ? `右へ曲がる${Math.round(Math.abs(sp.x) * 100)}%` : `左へ曲がる${Math.round(Math.abs(sp.x) * 100)}%`);
        if (sp.y < -0.15) t.push('もどる'); else if (sp.y > 0.15) t.push('ころがる');
        lb.textContent = t.length ? t.join('+') : 'タップで回転'; lb.style.color = t.length ? '#ffe9a8' : '#fff';
        const dot = S.hud.querySelector('.dsc i'); dot.style.left = `${50 + sp.x * 40}%`; dot.style.top = `${50 - sp.y * 40}%`;
      } else {
      const a = S.aimLine.geometry.attributes.position, y0 = S.kind === 'golf' ? 0.08 : 1.1;
      for (let i = 0; i < 40; i++) { const q = i / 39, h = S.kind === 'golf' && CLUBS[S.club].loft ? Math.sin(q * Math.PI) * L * 0.18 : 0; a.setXYZ(i, S.pos.x + dx * L * q, y0 + h, S.pos.z + dz * L * q); }
      a.needsUpdate = true; S.aimLine.computeLineDistances(); S.land.position.set(S.pos.x + dx * L, 0.05, S.pos.z + dz * L);
      }
    }
    updateBand();
  }
  function updateBand() {   // 点の列(aimLine)を、太い帯にうつす
    const b = S.band; if (!b) return; b.visible = S.aimLine.visible; if (!b.visible) return;
    const a = S.aimLine.geometry.attributes.position, P = b.geometry.attributes.position, U = b.geometry.attributes.uv, cp = camera.position, n = a.count; let len = 0;
    for (let i = 0; i < n; i++) {
      const x = a.getX(i), y = a.getY(i), z = a.getZ(i), j = Math.min(n - 1, i + 1), k = Math.max(0, i - 1);
      let tx = a.getX(j) - a.getX(k), ty = a.getY(j) - a.getY(k), tz = a.getZ(j) - a.getZ(k); const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const vx = cp.x - x, vy = cp.y - y, vz = cp.z - z, vd = Math.hypot(vx, vy, vz) || 1;
      let sx = ty * vz - tz * vy, sy = tz * vx - tx * vz, sz = tx * vy - ty * vx; const sl = Math.hypot(sx, sy, sz) || 1, w = Math.max(0.06, Math.min(0.6, 0.013 * vd)) / 2 / sl; sx *= w; sy *= w; sz *= w;
      P.setXYZ(i * 2, x - sx, y - sy, z - sz); P.setXYZ(i * 2 + 1, x + sx, y + sy, z + sz); U.setXY(i * 2, len / 0.9, 0); U.setXY(i * 2 + 1, len / 0.9, 1);
      if (i < n - 1) len += Math.hypot(a.getX(i + 1) - x, a.getY(i + 1) - y, a.getZ(i + 1) - z);
    }
    P.needsUpdate = U.needsUpdate = true; b.material.color.copy(S.aimLine.material.color);
  }
  // カメラが追う所(飛んでいる間はボール / 2本指でずらしている間は、立っている所+ずらし分)
  function focus() { if (!S) return null; const fly = S.phase === 'fly'; if (!fly && !camOffset.x && !camOffset.z) return null; const b = fly ? S.pos : me; return { x: b.x + camOffset.x, z: b.z + camOffset.z }; }
  // 左下のスティックで、見ている向き基準の前後左右にカメラをずらす(歩く時と同じ向きの対応)
  function pan(mx, my, dt) {
    if (!S) return; const mag = Math.min(1, Math.hypot(mx, my)); if (mag < 0.05) return;
    const y = getYaw(), s = Math.sin(y), c = Math.cos(y), k = 14 * dt;
    camOffset.x += (mx * c + my * s) * k; camOffset.z += (-mx * s + my * c) * k;
    const m = Math.hypot(camOffset.x, camOffset.z); if (m > 40) { camOffset.x *= 40 / m; camOffset.z *= 40 / m; }
  }
  return { get active() { return !!S; }, get busy() { return !!S; }, start, update, focus, pan, quit: () => S && end(true), cheatHole: () => { if (S && S.phase !== 'done') { S.n = S.n || 3; holed(); } } };   // cheatHole＝テスト用
}
