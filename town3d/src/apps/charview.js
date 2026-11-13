// キャラを眺める画面(自宅から開く)。自分・住人・ほかのプレイヤーのキャラを1体ずつ回して見る。
// いずれ「着替え」もここに足す(服の選択を、下のならびに追加する)。
import * as THREE from 'three';
import { makeCharacter, LOOKS } from '../world/character.js';
import { useGlb, GLB_MODELS } from '../world/glbchar.js';
import { RESIDENTS } from '../game/npc.js';

const ink = '#5a4a6b';
const chip = (on) => `border:0;border-radius:999px;padding:8px 13px;font:inherit;font-size:13px;font-weight:800;white-space:nowrap;cursor:pointer;color:${on ? '#fff' : ink};background:${on ? 'linear-gradient(160deg,#c9b8ea,#8f7bd0)' : '#fff'};box-shadow:0 1px 6px #0002`;

// 見られるキャラの一覧
function roster(player) {
  const myLook = player && typeof player.look === 'string' && LOOKS[player.look] ? player.look : 'mio';
  const list = [{ key: 'me', name: '自分', glb: myLook === 'ren' ? 'self:ren' : 'self:mio', look: LOOKS[myLook] }];
  list.push({ key: 'pm', name: '他の人(女)', glb: 'player:mio', look: LOOKS.mio }, { key: 'pr', name: '他の人(男)', glb: 'player:ren', look: LOOKS.ren });
  for (const r of RESIDENTS) if (GLB_MODELS[r.id]) list.push({ key: r.id, name: r.name || r.id, glb: r.id, look: r.look });
  return list;
}

export function openCharView(host, ctx = {}, onClose) {
  const list = roster(ctx.player);
  const root = document.createElement('div');
  root.style.cssText = `position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;font-family:inherit;color:${ink};background:linear-gradient(#fdf0f3,#e4efff);touch-action:none`;
  root.innerHTML = `<div style="display:flex;align-items:center;gap:8px;padding:10px 12px 4px"><button data-x="back" style="${chip(false)}">← もどる</button><b class="nm" style="flex:1;text-align:center;font-size:15px"></b><button data-x="spin" style="${chip(true)}">🔄 まわる</button></div>
    <div class="cv" style="flex:1;position:relative;min-height:0"></div>
    <div style="text-align:center;font-size:11px;color:#8d7f9e;padding:2px">ドラッグでまわす・ピンチで大きさ</div>
    <div class="mo" style="display:flex;gap:8px;justify-content:center;padding:4px 10px"></div>
    <div class="ls" style="display:flex;gap:8px;overflow-x:auto;padding:6px 12px calc(14px + env(safe-area-inset-bottom,0px))"></div>`;
  host.appendChild(root);
  const cv = root.querySelector('.cv'), nm = root.querySelector('.nm'), mo = root.querySelector('.mo'), ls = root.querySelector('.ls'), spinB = root.querySelector('[data-x=spin]');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none';
  cv.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  scene.add(new THREE.AmbientLight(0xffffff, 1.1)); const sun = new THREE.DirectionalLight(0xffffff, 1.3); sun.position.set(2, 4, 3); scene.add(sun);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.001; scene.add(floor);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.45, 16), new THREE.MeshLambertMaterial({ color: 0xc9a28c })); stool.position.set(0, 0.225, 0); stool.visible = false; scene.add(stool);

  let ch = null, cur = list[0], motion = 'idle', spin = true, yaw = 0.35, pitch = 0.12, zoom = 1, framed = false, h = 1.5, alive = true, last = performance.now(), waveT = 0;

  function show(c) {
    cur = c;
    if (ch) { scene.remove(ch.root); ch = null; }
    framed = false;
    ch = useGlb(makeCharacter(c.look), c.glb);
    ch.root.position.set(0, 0, 0); scene.add(ch.root); setMotion('idle');
    nm.textContent = c.name;
    [...ls.children].forEach(b => { b.style.cssText = chip(b.dataset.k === c.key); });
  }
  function setMotion(m) {
    motion = m; if (!ch) return;
    ch.pose = m === 'sit' ? 'sit' : null; ch.seatH = m === 'sit' ? 0.45 : null; stool.visible = m === 'sit';
    if (m === 'wave' && ch.wave) { ch.wave(); waveT = 3.2; }
    [...mo.children].forEach(b => { b.style.cssText = chip(b.dataset.m === m); });
  }
  mo.innerHTML = [['idle', 'たつ'], ['walk', 'あるく'], ['wave', '手をふる'], ['sit', 'すわる']].map(([m, t]) => `<button data-m="${m}" style="${chip(false)}">${t}</button>`).join('');
  ls.innerHTML = list.map(c => `<button data-k="${c.key}" style="${chip(false)}">${c.name}</button>`).join('');
  mo.onclick = e => { const m = e.target.closest('[data-m]')?.dataset.m; if (m) setMotion(m); };
  ls.onclick = e => { const k = e.target.closest('[data-k]')?.dataset.k; const c = list.find(x => x.key === k); if (c) show(c); };
  spinB.onclick = () => { spin = !spin; spinB.style.cssText = chip(spin); };

  // ドラッグ=回す、ピンチ=大きさ
  const ptr = new Map(); let pd = 0;
  const el = renderer.domElement;
  el.onpointerdown = e => { el.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pd = Math.hypot(a.x - b.x, a.y - b.y); } spin = false; spinB.style.cssText = chip(false); };
  el.onpointermove = e => {
    const p = ptr.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptr.size === 1) { yaw -= dx * 0.012; pitch = Math.max(-0.35, Math.min(0.9, pitch + dy * 0.006)); }
    else if (ptr.size === 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pd > 0) zoom = Math.max(0.5, Math.min(2.6, zoom * d / pd)); pd = d; }
  };
  el.onpointerup = el.onpointercancel = e => { ptr.delete(e.pointerId); pd = 0; };
  el.onwheel = e => { e.preventDefault(); zoom = Math.max(0.5, Math.min(2.6, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); };

  let sw = 0, sh = 0;
  function frame(now) {
    if (!alive) return; requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const w = cv.clientWidth, hh = cv.clientHeight; if (w && hh && (w !== sw || hh !== sh)) { sw = w; sh = hh; renderer.setSize(w, hh, false); cam.aspect = w / hh; cam.updateProjectionMatrix(); }
    if (ch) {
      if (ch.glb && !framed) { framed = true; h = ch.height || 1.5; }
      if (waveT > 0) { waveT -= dt; if (waveT <= 0 && motion === 'wave') setMotion('idle'); }
      ch.update(dt, motion === 'walk' ? 1.6 : 0);
    }
    if (spin) yaw += dt * 0.6;
    const R = h * 3.0 / zoom, ty = h * (motion === 'sit' ? 0.5 : 0.52);
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * R, ty + Math.sin(pitch) * R, Math.cos(yaw) * Math.cos(pitch) * R); cam.lookAt(0, ty, 0);
    floor.scale.setScalar(h / 1.5);
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  show(cur);

  const close = () => { alive = false; if (ch) scene.remove(ch.root); renderer.dispose(); root.remove(); onClose?.(); };
  root.querySelector('[data-x=back]').onclick = close;
  return { close };
}
