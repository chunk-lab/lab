// 空・光・時間帯。パステルの影(青紫)と、夜の窓・ネオンの明かりを時刻で切り替える
import * as THREE from 'three';
import { glow } from './kit.js';

// [時, 空の上, 空の下, 太陽の色, 太陽の強さ, 環境光, 夜の明かり(0〜1)]
const KEYS = [
  [0, 0x3d3a7e, 0x8a78c4, 0xb4c2ff, 0.7, 0.95, 1],
  [4.8, 0x4a4890, 0x9d86cc, 0xb4c2ff, 0.7, 0.95, 1],
  [6, 0x8b93e6, 0xffc2d1, 0xffc9a8, 0.9, 0.85, 0.5],
  [7.5, 0x9ccbff, 0xffe8e6, 0xfff0d9, 1.7, 1.05, 0],
  [12, 0x8ec5ff, 0xe8f5ff, 0xfffaf0, 2.4, 0.95, 0],
  [16.3, 0xa3b8ff, 0xffdcd0, 0xffeedd, 1.7, 1.05, 0],
  [17.8, 0x9183d9, 0xffb29e, 0xffb38a, 1.1, 0.9, 0.45],
  [19.2, 0x5d58a8, 0xe59cc0, 0xc7b0ff, 0.75, 0.95, 1],
  [24, 0x3d3a7e, 0x8a78c4, 0xb4c2ff, 0.7, 0.95, 1],
];
const ca = new THREE.Color(), cb = new THREE.Color();
function sample(h) {
  let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= h) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = (h - a[0]) / (b[0] - a[0]);
  const col = k => ca.setHex(a[k]).lerp(cb.setHex(b[k]), t).clone();
  const num = k => a[k] + (b[k] - a[k]) * t;
  return { top: col(1), bottom: col(2), sun: col(3), sunI: num(4), hemiI: num(5), night: num(6) };
}

export function createEnv(scene, { shadows = true } = {}) {
  const skyU = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
      vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vp; void main(){ float h = clamp(vp.y*1.6+0.15,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.8)),1.0);\n#include <colorspace_fragment>\n}',
    })
  );
  sky.renderOrder = -1;
  scene.add(sky);

  // 星
  const sg = new THREE.BufferGeometry(); const pts = [];
  for (let i = 0; i < 500; i++) { const u = Math.random(), v = Math.random() * 0.45 + 0.08; const th = u * Math.PI * 2; pts.push(Math.cos(th) * 380 * Math.cos(v), Math.sin(v) * 380, Math.sin(th) * 380 * Math.cos(v)); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xfff7e6, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  scene.add(stars);

  // 月(その日の月齢で満ち欠けが変わる)
  const synodic = 29.530588853, jd = Date.now() / 86400000 + 2440587.5;
  let moonPhase = (((jd - 2451550.1) / synodic) % 1 + 1) % 1;   // 0=新月, 0.5=満月
  const moonU = { uA: { value: moonPhase * Math.PI * 2 }, uO: { value: 0 } };
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: moonU, transparent: true, depthWrite: false, fog: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA, uO;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      void main(){
        vec2 p = (vUv - 0.5) * 2.0; float r2 = dot(p,p); if (r2 > 1.0) discard;
        vec3 n = vec3(p, sqrt(1.0 - r2)); vec3 L = normalize(vec3(sin(uA), 0.0, -cos(uA)));
        float lit = smoothstep(-0.03, 0.06, dot(n, L));
        float shade = 0.9 + 0.1 * dot(normalize(vec3(-0.4, 0.5, 0.8)), n);          // やわらかい丸みの陰影
        float limb = 0.82 + 0.18 * pow(n.z, 0.6);                                     // ふちを少しだけ暗く
        vec3 col = vec3(1.0, 0.9, 0.66) * shade * limb;                              // 白でなく、ほんのり黄色い月
        vec3 dark = vec3(0.16, 0.18, 0.3);
        float edge = 1.0 - smoothstep(0.94, 1.0, sqrt(r2));
        gl_FragColor = vec4(col, lit * edge * uO);
      }`,
  }));
  moon.renderOrder = -1; moon.frustumCulled = false; scene.add(moon);
  // 低負荷モード用:満ち欠けの一枚絵(12枚)を切りかえる月
  let moonLite = false, moonTex = null;
  const moonSpriteMat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false, toneMapped: false });
  const makeMoonTex = () => Array.from({ length: 12 }, (_, i) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), im = g.createImageData(128, 128), a = i / 12 * Math.PI * 2, Lx = Math.sin(a), Lz = -Math.cos(a);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const px = (x + 0.5) / 64 - 1, py = (y + 0.5) / 64 - 1, r2 = px * px + py * py; if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2), d = px * Lx + nz * Lz, lit = Math.min(1, Math.max(0, (d + 0.03) / 0.09)), edge = 1 - Math.min(1, Math.max(0, (Math.sqrt(r2) - 0.94) / 0.06));
      const sh = (0.9 + 0.1 * (-0.4 * px + 0.5 * -py + 0.8 * nz)) * (0.82 + 0.18 * Math.pow(nz, 0.6)), o = (y * 128 + x) * 4;
      im.data[o] = 255 * sh; im.data[o + 1] = 230 * sh; im.data[o + 2] = 168 * sh; im.data[o + 3] = 255 * lit * edge;
    }
    g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  const moonShaderMat = moon.material;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,248,220,.55)'); gr.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  halo.renderOrder = -2; halo.frustumCulled = false; scene.add(halo);

  // 雲(ぽってりした球の集まり)
  const clouds = new THREE.Group();
  const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92, fog: false });
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    for (let j = 0; j < 5; j++) { const s = new THREE.Mesh(new THREE.SphereGeometry(6 + Math.random() * 5, 10, 8), cm); s.position.set(j * 7 - 14, Math.random() * 3, Math.random() * 5); s.scale.y = 0.6; c.add(s); }
    const a = Math.random() * Math.PI * 2, r = 180 + Math.random() * 120;
    c.position.set(Math.cos(a) * r, 70 + Math.random() * 40, Math.sin(a) * r);
    c.lookAt(0, c.position.y, 0);
    clouds.add(c);
  }
  scene.add(clouds);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9a9d9, 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = shadows;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 160;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog(0xffffff, 75, 210);


  // 流れ星:夜に5〜15秒に1つ。カメラが向いている方向の空に、1〜2秒。細くて短い(7%だけやや大きめ)
  const mTex = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 8; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,248,230,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 2, 128, 4); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const meteor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: mTex, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  meteor.visible = false; meteor.frustumCulled = false; meteor.renderOrder = -1; scene.add(meteor);
  const M = { t: -1, life: 1.5, wait: 4 + Math.random() * 6, p0: new THREE.Vector3(), d: new THREE.Vector3(), len: 20, wid: 1, run: 120 };
  const startMeteor = cam => {
    let az = Math.random() * Math.PI * 2, el = 0.5 + Math.random() * 0.4;
    if (cam) { const d = new THREE.Vector3(); cam.getWorldDirection(d); az = Math.atan2(d.z, d.x) + (Math.random() - 0.5) * 0.9; el = Math.min(1.1, Math.max(0.3, Math.asin(Math.max(-1, Math.min(1, d.y))) + 0.1 + Math.random() * 0.28)); }
    M.p0.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).multiplyScalar(330);
    const rad = M.p0.clone().normalize(), up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3().crossVectors(up, rad).normalize();
    M.d.copy(side).multiplyScalar((Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.6)).addScaledVector(up, -(0.35 + Math.random() * 0.5)).normalize();
    const big = Math.random() < 0.07;
    M.t = 0; M.life = 1 + Math.random(); M.len = big ? 55 + Math.random() * 25 : 10 + Math.random() * 25; M.wid = big ? 2.2 + Math.random() * 0.6 : 0.5 + Math.random() * 0.9; M.run = 90 + Math.random() * 80;
  };

  const env = {
    hour: 10, speed: 1 / 60, // 実時間1秒 = 1分(1日24分)
    night: 0,
    setLite(on) {
      moonLite = on; if (on && !moonTex) moonTex = makeMoonTex();
      moon.material = on ? moonSpriteMat : moonShaderMat;
    },
    setMoonDate(d) { const j = d.getTime() / 86400000 + 2440587.5; moonPhase = (((j - 2451550.1) / synodic) % 1 + 1) % 1; moonU.uA.value = moonPhase * Math.PI * 2; },
    setMoon(ph) { moonPhase = ((ph % 1) + 1) % 1; moonU.uA.value = moonPhase * Math.PI * 2; },
    meteorNow() { startMeteor(this.camera); },
    setShadows(on, size = 2048) { sun.castShadow = on; if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); sun.shadow.map?.dispose(); sun.shadow.map = null; } },
    update(dt, focus) {
      this.hour = (this.hour + dt * this.speed) % 24;
      const s = sample(this.hour);
      skyU.top.value.copy(s.top); skyU.bottom.value.copy(s.bottom);
      scene.fog.color.copy(s.bottom).lerp(s.top, 0.25);
      hemi.color.copy(s.top).lerp(new THREE.Color(0xffffff), 0.55);
      hemi.groundColor.setHex(0xb39fe0).lerp(s.bottom, 0.25);
      hemi.intensity = s.hemiI;
      sun.color.copy(s.sun); sun.intensity = s.sunI;
      // 太陽(夜は月)の向き。真上にならないよう傾けて影を長めに
      const day = this.hour >= 6 && this.hour < 18.5;
      const t = day ? (this.hour - 6) / 12.5 : ((this.hour + 24 - 18.5) % 24) / 11.5;
      const ang = t * Math.PI;
      const dir = new THREE.Vector3(Math.cos(ang) * 0.8, Math.max(0.35, Math.sin(ang)) * 1.0, 0.55).normalize();
      sun.position.copy(focus).addScaledVector(dir, 70);
      sun.target.position.copy(focus);
      sky.position.copy(focus); stars.position.copy(focus);
      clouds.rotation.y += dt * 0.004;
      clouds.position.set(focus.x, 0, focus.z);
      this.night = s.night;
      { // 月:夜のあいだ、東からのぼって西へ。満ち欠けは日ごとに変わる
        const nt = ((this.hour + 24 - 18.5) % 24) / 11.5, ang = Math.min(1, Math.max(0, nt)) * Math.PI;
        const md = new THREE.Vector3(Math.cos(ang) * 0.8 + 0.3, 0.62 + Math.sin(ang) * 0.3, -0.45).normalize();
        const op = Math.max(0, Math.min(1, (s.night - 0.2) / 0.4)) * (nt > 0 && nt < 1 ? 1 : 0);
        moon.position.copy(focus).addScaledVector(md, 320); moon.lookAt(focus); moon.scale.setScalar(46);
        halo.position.copy(moon.position); halo.quaternion.copy(moon.quaternion); halo.scale.setScalar(120);
        moonU.uO.value = op; moon.visible = op > 0.01;
        if (moonLite) { moonSpriteMat.map = moonTex[Math.round(moonPhase * 12) % 12]; moonSpriteMat.opacity = op; moonSpriteMat.needsUpdate = true; } halo.visible = false; halo.material.opacity = op * (0.1 + 0.6 * Math.sin(moonPhase * Math.PI));
      }
      stars.material.opacity = Math.max(0, s.night - 0.3);
      if (M.t < 0) { if (s.night > 0.55) { M.wait -= dt; if (M.wait <= 0) { startMeteor(this.camera); M.wait = 5 + Math.random() * 10; } } }
      else {
        M.t += dt; const u = M.t / M.life;
        if (u >= 1) { M.t = -1; meteor.visible = false; }
        else {
          const head = M.p0.clone().addScaledVector(M.d, u * M.run).add(focus);
          meteor.position.copy(head).addScaledVector(M.d, -M.len * 0.5);
          const zax = focus.clone().sub(meteor.position).normalize(), xax = M.d.clone().negate().sub(zax.clone().multiplyScalar(M.d.dot(zax) * -1)).normalize().negate(), yax = new THREE.Vector3().crossVectors(zax, xax);
          meteor.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xax, yax, zax));
          meteor.scale.set(M.len, M.wid, 1); meteor.visible = true; meteor.material.opacity = Math.sin(Math.PI * Math.min(1, u * 1.1)) * Math.min(1, s.night * 1.6);
        }
      }
      for (const m of glow.window) m.emissiveIntensity = 0.04 + s.night * 0.72;
      for (const m of glow.lamp) m.emissiveIntensity = 0.08 + s.night * 1.45;
      for (const m of glow.vend) m.emissiveIntensity = 0.1 + s.night * 0.65;
      for (const m of glow.neon) m.emissiveIntensity = (0.2 + s.night * 1.0) * (m.userData.max ?? 1);
    },
  };
  return env;
}
