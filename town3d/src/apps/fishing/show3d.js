// 釣れた魚を見せる画面(3D)。町と同じキャラが、大きさに合わせたポーズで魚を見せる。負けた方は落ちこむ。
//   createShow(box, { actors:[{ look, pose, sp, size }] , bg }) → { canvas, snap(caption), dispose }
//   pose: 'auto'(大きさで決める) | 'sad' | 'cheer'
import * as THREE from 'three';
import { makeCharacter } from '../../world/character.js';
import { artCanvas } from './art.js';
import { LOOKS } from '../../world/character.js';
import { RESIDENTS } from '../../game/npc.js';
// 見た目:'suna'(砂吹さん) / LOOKS のid / look そのもの
export function lookOf(k) { if (k && typeof k === 'object') return k; if (k === 'suna') return (RESIDENTS.find(r => r.id === 'suna') || {}).look || LOOKS.sora; return LOOKS[k] || LOOKS.mio; }

export function poseFor(sp, size) {
  if (!sp) return 'cheer';
  if (sp.kind !== 'fish') return 'item';
  if (size < 15) return 'dangle';
  if (size < 60) return 'raise';
  if (size < 150) return 'hug';
  return 'hang';
}

// スマホで落ちないように:描画のしくみは1つだけを使い回す(毎回つくらない)、細かさをおさえる、絵は写真のときだけ残す
let shared = null, users = 0;
function getRenderer() {
  if (!shared) {
    shared = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    shared.outputColorSpace = THREE.SRGBColorSpace;
    shared.domElement.addEventListener('webglcontextlost', e => e.preventDefault());
  }
  return shared;
}
export function release() {   // 釣りを閉じたら手放す
  if (!shared || users > 0) return;
  try { shared.dispose(); shared.forceContextLoss(); } catch (e) { }
  shared = null;
}

export function createShow(box, { actors, bg }) {
  const W = box.clientWidth || 360, H = box.clientHeight || 640, dpr = Math.min(1.25, window.devicePixelRatio || 1);
  const bgc = document.createElement('canvas'); bgc.width = W * dpr; bgc.height = H * dpr; bgc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  const bx = bgc.getContext('2d');
  if (bg) { try { bx.drawImage(bg, 0, 0, bgc.width, bgc.height); } catch (e) { } }
  else { const gr = bx.createLinearGradient(0, 0, 0, bgc.height); gr.addColorStop(0, '#9fd3f0'); gr.addColorStop(0.55, '#e8f4ff'); gr.addColorStop(0.56, '#6fb6d6'); gr.addColorStop(1, '#3a7fa0'); bx.fillStyle = gr; bx.fillRect(0, 0, bgc.width, bgc.height); }
  bx.fillStyle = 'rgba(255,250,240,0.18)'; bx.fillRect(0, 0, bgc.width, bgc.height);
  box.appendChild(bgc);

  const renderer = getRenderer(); users++;
  renderer.setPixelRatio(dpr); renderer.setSize(W, H);
  const cv = renderer.domElement; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; box.appendChild(cv);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a9d9, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(2, 4, 3); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 50);
  // 足もとの丸い影
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x3a3060, transparent: true, opacity: 0.18, depthWrite: false });

  const things = [], disposeList = [];
  const fishMesh = (sp, len) => {
    const tex = new THREE.CanvasTexture(artCanvas(sp, 320, 160)); tex.colorSpace = THREE.SRGBColorSpace; disposeList.push(tex);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, len / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide }));
    disposeList.push(m.geometry, m.material); return m;
  };
  const n = actors.length;
  let minY = 0, maxY = 2.1, minX = -0.8, maxX = 0.8;
  actors.forEach((a, i) => {
    const ch = makeCharacter(a.look);
    const x = n === 1 ? 0 : (i === 0 ? -0.75 : 0.75);
    const pose = a.pose === 'auto' ? poseFor(a.sp, a.size) : a.pose;
    const g = new THREE.Group(); g.position.x = x; scene.add(g); g.add(ch.root);
    ch.root.rotation.y = n === 1 ? 0 : (i === 0 ? 0.25 : -0.25);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; g.add(sh);
    const len = a.sp ? Math.max(0.34, Math.min(3.2, (a.size || 30) / 100 * 1.3)) : 0;   // 小さい魚も見えるように少し大きめ
    const item = { ch, pose, g, len, t: Math.random() * 3 };
    if (a.sp) {
      if (pose === 'item') { const tex = new THREE.CanvasTexture(artCanvas(a.sp, 256, 256)); disposeList.push(tex); item.fish = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })); item.fish.position.set(0.32, 1.32, 0.38); g.add(item.fish); }
      else {
        const f = fishMesh(a.sp, len); item.fish = f;
        if (pose === 'raise') { f.position.set(0, 1.98 + len * 0.25, 0.08); g.add(f); maxY = Math.max(maxY, 2.05 + len * 0.5); }
        else if (pose === 'hug') { f.position.set(0, 1.0, 0.45); g.add(f); minX = Math.min(minX, x - len / 2); maxX = Math.max(maxX, x + len / 2); }
        else if (pose === 'dangle') {   // 竿の糸にぶら下げたまま
          const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.022, 1.5, 6), new THREE.MeshLambertMaterial({ color: 0x8a6b4a })); disposeList.push(rod.geometry, rod.material);
          rod.position.set(0.55, 1.65, 0.35); rod.rotation.z = -0.75; g.add(rod);
          const tip = new THREE.Vector3(0.55 + Math.sin(0.75) * 0.75, 1.65 + Math.cos(0.75) * 0.75, 0.35);
          const line = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.55, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); disposeList.push(line.geometry, line.material);
          line.position.set(tip.x, tip.y - 0.275, tip.z); g.add(line);
          f.position.set(tip.x, tip.y - 0.55 - len * 0.45, tip.z); f.rotation.z = Math.PI / 2; g.add(f); item.tip = tip;
          maxY = Math.max(maxY, tip.y + 0.1); maxX = Math.max(maxX, x + tip.x + 0.3);
        } else if (pose === 'hang') {   // 吊り下げ台
          const wood = new THREE.MeshLambertMaterial({ color: 0x7a5a40 }); disposeList.push(wood);
          const top = len + 0.45, px = 0.75 + len * 0.12;
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, top, 0.1), wood); post.position.set(px + 0.55, top / 2, -0.1); g.add(post); disposeList.push(post.geometry);
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.08), wood); bar.position.set(px + 0.2, top, -0.1); g.add(bar); disposeList.push(bar.geometry);
          const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), new THREE.MeshLambertMaterial({ color: 0xd8c8a0 })); rope.position.set(px, top - 0.15, -0.05); g.add(rope); disposeList.push(rope.geometry, rope.material);
          f.position.set(px, top - 0.3 - len / 2, 0); f.rotation.z = -Math.PI / 2; g.add(f);
          ch.root.position.x = -0.35;
          maxY = Math.max(maxY, top + 0.15); maxX = Math.max(maxX, x + px + 0.65); minX = Math.min(minX, x - 0.8);
        }
      }
    }
    if (pose === 'sad') {   // 頭の上に雨雲
      const cl = new THREE.Group(), cm = new THREE.MeshLambertMaterial({ color: 0x8c8aa0 }); disposeList.push(cm);
      [[-0.14, 0, 0.13], [0.06, 0.05, 0.16], [0.2, -0.01, 0.12], [0, -0.04, 0.12]].forEach(([cx, cy, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cm); s.position.set(cx, cy, 0); cl.add(s); disposeList.push(s.geometry); });
      cl.position.set(0, 2.15, 0); g.add(cl); item.cloud = cl;
      item.drops = Array.from({ length: 8 }, (_, k) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 4), new THREE.MeshBasicMaterial({ color: 0x9fc8ff })); d.position.set(-0.2 + k * 0.06, 2 - Math.random() * 0.5, 0); g.add(d); disposeList.push(d.geometry, d.material); return d; });
      maxY = Math.max(maxY, 2.35);
    }
    things.push(item);
  });
  // カメラ:全員と魚が入るように
  const cy = (minY + maxY) / 2, hh = (maxY - minY) / 2 + 0.25, hw = Math.max(Math.abs(minX), Math.abs(maxX)) + 0.35;
  const fov = camera.fov * Math.PI / 180, dist = Math.max(hh / Math.tan(fov / 2), hw / (Math.tan(fov / 2) * (W / H))) * 1.05;
  camera.position.set(0, cy + 0.25, dist); camera.lookAt(0, cy - 0.05, 0);

  let raf = 0, last = 0, alive = true, intro = 0;
  const loop = ts => {
    if (!alive) return; raf = requestAnimationFrame(loop);
    if (document.hidden || ts - last < (intro < 1 ? 33 : 66)) return;   // 出てくる間は30コマ、そのあとは15コマで十分
    const dt = Math.min(0.08, (ts - (last || ts)) / 1000); last = ts; intro = Math.min(1, intro + dt * 2.2);
    for (const it of things) {
      it.t += dt; const { ch, pose } = it, R = ch.rig;
      ch.update(dt, 0);
      const A = R.arms, b = Math.sin(it.t * 2.4);
      if (pose === 'raise' || pose === 'cheer') { A[0].rotation.set(0, 0, -2.75 - b * 0.05); A[1].rotation.set(0, 0, 2.75 + b * 0.05); if (it.fish) it.fish.position.y = 1.98 + it.len * 0.25 + b * 0.03; R.head.rotation.set(-0.15, 0, 0); if (pose === 'cheer') R.body.position.y = Math.abs(Math.sin(it.t * 4)) * 0.06; }
      else if (pose === 'hug') { A[0].rotation.set(-1.3, 0, 0.3); A[1].rotation.set(-1.3, 0, -0.3); if (it.fish) it.fish.rotation.z = b * 0.04; }
      else if (pose === 'dangle') { A[1].rotation.set(-1.15, 0, 0.35); A[0].rotation.set(0, 0, -0.5 - b * 0.08); if (it.fish) { it.fish.rotation.y = Math.sin(it.t * 1.5) * 0.5; } }
      else if (pose === 'hang') { A[1].rotation.set(0, 0, 2.3 + b * 0.15); A[0].rotation.set(0, 0, -0.35); if (it.fish) it.fish.rotation.y = Math.sin(it.t * 0.9) * 0.15; }
      else if (pose === 'item') { A[1].rotation.set(-1.25, 0, 0.1); if (it.fish) it.fish.position.y = 1.32 + b * 0.02; }
      else if (pose === 'sad') { A[0].rotation.set(0.08, 0, -0.04); A[1].rotation.set(0.08, 0, 0.04); R.head.rotation.set(0.5, 0, 0); R.body.rotation.x = 0.16; R.body.position.y = -0.04; if (it.cloud) it.cloud.position.x = Math.sin(it.t) * 0.05; for (const d of it.drops) { d.position.y -= dt * 1.4; if (d.position.y < 1.55) d.position.y = 2.05; } }
      // 出てくるとき、ぽんっと
      it.g.scale.setScalar(0.6 + 0.4 * (1 - Math.pow(1 - intro, 3)) + Math.sin(intro * Math.PI) * 0.08);
    }
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);
  return {
    canvas: cv,
    // 写真:背景+3D+文字
    snap(caption) {
      renderer.render(scene, camera);
      const out = document.createElement('canvas'), M = 1000, k = M / Math.max(W, H); out.width = Math.round(W * k); out.height = Math.round(H * k);
      const o = out.getContext('2d'); o.drawImage(bgc, 0, 0, out.width, out.height); o.drawImage(cv, 0, 0, out.width, out.height);
      if (caption) {
        o.fillStyle = 'rgba(255,255,255,0.88)'; const ph = out.height * 0.11; o.fillRect(0, out.height - ph, out.width, ph);
        o.fillStyle = '#5a4a6b'; o.textAlign = 'center'; o.font = `900 ${Math.round(ph * 0.36)}px sans-serif`; o.fillText(caption[0], out.width / 2, out.height - ph * 0.52);
        o.font = `700 ${Math.round(ph * 0.22)}px sans-serif`; o.fillText(caption[1] || '', out.width / 2, out.height - ph * 0.17);
      }
      return out.toDataURL('image/jpeg', 0.86);
    },
    dispose() { if (!alive) return; alive = false; cancelAnimationFrame(raf); disposeList.forEach(d => { try { d.dispose(); } catch (e) { } }); scene.traverse(o => { if (o.isMesh) { try { o.geometry.dispose(); [].concat(o.material).forEach(m => m.dispose()); } catch (e) { } } }); scene.clear(); renderer.renderLists.dispose(); cv.remove(); bgc.remove(); users = Math.max(0, users - 1); },
  };
}
