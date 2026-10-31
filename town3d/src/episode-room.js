// 物語専用の舞台。町・自宅の保存や、プレイヤーの姿・家具の配置には触れない。
import * as THREE from 'three';
import { makeCharacter, LOOKS } from './world/character.js';
import { ITEM } from './game/furniture.js';

export function mountEpisodeRoom(container, { onError = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xe8edf4);
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  scene.add(new THREE.HemisphereLight(0xfffaf0, 0xaaa8c5, 2.5));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.2); sun.position.set(-3, 7, 4); scene.add(sun);
  const owned = [];
  function box(w, h, d, color, x, y, z) {
    const geometry = new THREE.BoxGeometry(w, h, d), material = new THREE.MeshStandardMaterial({ color, roughness: .85 });
    owned.push(geometry, material);
    const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z); scene.add(m); return m;
  }
  box(7, .16, 5.8, 0xe5c6a3, 0, -.09, 0);
  for (let i = -3; i <= 3; i++) box(.018, .006, 5.8, 0xd0ad89, i, 0, 0);
  box(7, 3.3, .13, 0xf6e9e0, 0, 1.6, -2.75);
  box(.13, 3.3, 5.8, 0xe5ecdf, -3.45, 1.6, 0);
  box(7, .12, .18, 0xc3ac95, 0, .06, -2.62);
  box(.18, .12, 5.8, 0xc3ac95, -3.32, .06, 0);
  box(2.05, 1.55, .09, 0xfff9ee, -1.65, 2, -2.63);
  box(1.85, 1.35, .1, 0xb9dff0, -1.65, 2, -2.56);
  box(.06, 1.35, .12, 0xfffcf4, -1.65, 2, -2.48);
  box(1.85, .06, .12, 0xfffcf4, -1.65, 2, -2.48);
  box(1.05, 2.3, .15, 0xd6b797, 2.55, 1.12, -2.57);
  box(.72, 1.9, .06, 0xe6c9ad, 2.55, 1.15, -2.45);
  box(.08, .08, .12, 0xba9460, 2.83, 1.1, -2.37);
  box(3.6, .025, 2.1, 0xcac6e5, .1, .02, .5);
  function furniture(id, x, z, ry = 0, y = 0) {
    const group = new THREE.Group(); ITEM[id].build(group); group.position.set(x, y, z); group.rotation.y = ry; scene.add(group); return group;
  }
  furniture('desk', -.95, -1.65);
  furniture('chair', -.95, -.85, Math.PI);
  furniture('bookstack', -1.5, -1.65, 0, .77);
  furniture('shelf', -2.7, -.9, Math.PI / 2);
  furniture('plant', 1.45, -2.1);
  const tablet = box(.62, .4, .055, 0x55506b, -.75, 1.02, -1.7); tablet.rotation.x = -.2;
  const screen = box(.53, .31, .06, 0xd9edff, -.75, 1.02, -1.66); screen.rotation.x = -.2;
  const hana = makeCharacter(LOOKS.hana), sora = makeCharacter(LOOKS.sora);
  hana.root.position.set(-.6, .05, .6); sora.root.position.set(.85, .05, .3);
  hana.root.rotation.y = .4; sora.root.rotation.y = -.5;
  scene.add(hana.root, sora.root);
  let raf = 0, alive = true, paused = false, last = 0, who = 'hana';
  const resize = () => {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const narrow = camera.aspect < .85;
    camera.position.set(narrow ? 3.3 : 4.8, narrow ? 4.5 : 4.1, narrow ? 8.8 : 7.8);
    camera.lookAt(-.1, .85, -.3); camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  const frame = now => {
    if (!alive || paused) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
    hana.update(dt, 0); sora.update(dt, 0);
    const active = who === 'sora' ? sora : hana;
    active.head.rotation.z = Math.sin(now * .0018) * .025;
    renderer.render(scene, camera); raf = requestAnimationFrame(frame);
  };
  const lost = e => { e.preventDefault(); pause(); onError(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  function pause() { paused = true; cancelAnimationFrame(raf); }
  function resume() { if (!alive) return; paused = false; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  resume();
  return {
    setSpeaker(id) { if (id !== who) { who = id; (id === 'sora' ? sora : hana).wave(); } },
    pause, resume,
    dispose() {
      alive = false; pause(); ro.disconnect(); renderer.domElement.removeEventListener('webglcontextlost', lost);
      // キャラと家具の形状・材質は本編と共有のキャッシュ。ここでは破棄しない。
      owned.forEach(x => x.dispose()); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
