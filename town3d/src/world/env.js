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
  const moonU = { uA: { value: moonPhase * Math.PI * 2 }, uO: { value: 0 }, uC: { value: 9 } };   // uC=月食のとき、地球のかげの中心(9=なし)
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: moonU, transparent: true, depthWrite: false, fog: false, toneMapped: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform float uA, uO, uC;
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
        float sh = 1.0 - smoothstep(1.28, 1.58, length(p - vec2(uC, 0.12)));   // 月食:地球のかげ(ふちは赤く、中は暗い赤銅色)
        vec3 red = vec3(0.62, 0.15, 0.07) * shade;
        col = mix(col, mix(red * 1.25, red * 0.55, smoothstep(0.0, 1.0, sh)), sh);
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

  // 日食:太陽(ふだんは出さない)と、それをかくす月。ここは日食のあいだだけ見える
  const discGeo = new THREE.CircleGeometry(1, 40);
  const sunDisc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: 0xfff4d6, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,238,180,0.8)'); gr.addColorStop(0.3, 'rgba(255,230,160,0.4)'); gr.addColorStop(0.55, 'rgba(255,225,155,0.12)'); gr.addColorStop(1, 'rgba(255,225,155,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.8, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  // ダイヤモンドリング:かくれる直前・出た直後に、ふちの一点がまぶしく光る
  const flareTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,250,235,0.9)'); gr.addColorStop(0.35, 'rgba(255,240,200,0.28)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.globalCompositeOperation = 'lighter'; for (const [w, h] of [[128, 5], [5, 128]]) { const l = g.createLinearGradient(0, 0, w > h ? 128 : 0, w > h ? 0 : 128); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,0.9)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(64 - w / 2, 64 - h / 2, w, h); } return new THREE.CanvasTexture(c); })();
  const flare = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: flareTex, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  const coronaTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,250,235,0)'); gr.addColorStop(0.36, 'rgba(255,250,235,0)'); gr.addColorStop(0.41, 'rgba(255,248,225,0.95)'); gr.addColorStop(0.55, 'rgba(255,235,185,0.42)'); gr.addColorStop(0.8, 'rgba(255,225,160,0.1)'); gr.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const corona = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: coronaTex, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  const sunCover = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: 0x07060e, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  for (const m of [sunGlow, sunDisc, sunCover, corona, flare]) { m.visible = false; m.frustumCulled = false; m.renderOrder = -1; scene.add(m); }
  sunGlow.renderOrder = -2; corona.renderOrder = 0; flare.renderOrder = 1;
  // 雨と虹
  const RN = 700, rainPos = new Float32Array(RN * 6), rainSeed = Array.from({ length: RN }, () => [(Math.random() - 0.5) * 70, Math.random() * 30, (Math.random() - 0.5) * 70]);
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xdfe9ff, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat); rainLines.frustumCulled = false; rainLines.visible = false; rainLines.renderOrder = 6; scene.add(rainLines);
  const bow = new THREE.Group(); bow.visible = false;
  { const cols = [0xff5a5a, 0xff9a4a, 0xffe05a, 0x6bdc6b, 0x58b8ff, 0x5a6cff, 0xa06aff];
    cols.forEach((c, i) => { for (const [w, op] of [[7, 0.1], [3.4, 0.28]]) { const r0 = 150 - i * 3.2; const m = new THREE.Mesh(new THREE.RingGeometry(r0 - w / 2, r0 + w / 2, 96, 1, 0, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide })); m.userData.op = op; bow.add(m); } });
  }
  bow.renderOrder = -1; bow.traverse(o => { o.renderOrder = -1; o.frustumCulled = false; }); scene.add(bow);
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
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
    // 時間を止めて、その時刻の空にする(花火・日食のあいだ)。release で元にもどる
    hold(h) { if (!this._held) this._held = { hour: this.hour, speed: this.speed }; this.hour = h; this.speed = 0; },
    release() { if (this._held) { this.hour = this._held.hour; this.speed = this._held.speed; this._held = null; } },
    // 天体イベント:'solar'=日食 'lunar'=月食。dur=秒。ずっと進む(時間は止める)
    startEclipse(kind, dur = 90) {
      this.stopEclipse(); this.hold(kind === 'solar' ? 12.2 : 22.4);
      this.eclipse = { kind, t: 0, dur, cover: 0, moonPhase0: moonPhase };
      if (kind === 'lunar') this.setMoon(0.5);
    },
    stopEclipse() {
      if (!this.eclipse) return; const e = this.eclipse; this.eclipse = null;
      moonU.uC.value = 9; for (const m of [sunGlow, sunDisc, sunCover, corona, flare]) m.visible = false;
      if (e.kind === 'lunar') this.setMoon(e.moonPhase0);
      this.release();
    },
    // ふだんの天気:'sun' / 'cloud' / 'rain'
    setAmbient(kind, snap = false) { const A = this.amb || (this.amb = { r: 0, c: 0, tr: 0, tc: 0 }); A.tr = kind === 'rain' ? 1 : 0; A.tc = kind === 'cloud' || kind === 'rain' ? 1 : 0; if (snap) { A.r = A.tr; A.c = A.tc; } },
    // 天気:'rain' = 雨→あがって虹。dur=秒(全体)
    startWeather(dur = 120) { this.stopWeather(); this.hold(14); this.weather = { t: 0, dur, rain: 0, bow: 0 }; },
    stopWeather() { if (!this.weather) return; this.weather = null; rainLines.visible = false; rainMat.opacity = 0; bow.visible = false; scene.fog.near = 75; scene.fog.far = 210; cm.color.setScalar(1); this.rainLevel = 0; this.release(); },
    skyPos(kind) { return kind === 'solar' ? sunDisc.position.clone() : kind === 'rain' ? bow.position.clone().setY(95) : kind === 'lunar' ? moon.position.clone() : null; },
    meteorNow() { startMeteor(this.camera); },
    setShadows(on, size = 2048) { sun.castShadow = on; if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); sun.shadow.map?.dispose(); sun.shadow.map = null; } },
    update(dt, focus) {
      this.hour = (this.hour + dt * this.speed) % 24;
      const s = sample(this.hour);
      const E = this.eclipse; let ecl = 0;
      if (E) {
        E.t += dt; const p = Math.min(1, E.t / E.dur), u = p * 2 - 1;
        if (E.kind === 'solar') {
          // 太陽と月のずれ d(太陽の半径=1 にして)。真ん中ほどゆっくり動く → 皆既の時間がのびる
          const R = 1, r = 1.06, off = 2.12 * (0.7 * u + 0.3 * u * u * u), d = Math.abs(off);
          let cov; if (d >= R + r) cov = 0; else if (d <= r - R) cov = 1; else { const a = Math.acos((d * d + R * R - r * r) / (2 * d * R)), b = Math.acos((d * d + r * r - R * R) / (2 * d * r)); cov = (R * R * (a - Math.sin(2 * a) / 2) + r * r * (b - Math.sin(2 * b) / 2)) / (Math.PI * R * R); }
          E.cover = ecl = Math.max(0, Math.min(1, cov)); E.off = off;
        } else {
          const cx = 2.4 * (0.6 * u + 0.4 * u * u * u); moonU.uC.value = cx; E.cover = ecl = Math.max(0, 1 - Math.max(0, Math.abs(cx) - 0.45) / 1.9);
        }
        if (p >= 1) { this.stopEclipse(); }
      }
      const W = this.weather;
      if (W) {
        W.t += dt; const p = W.t / W.dur;
        W.rain = sstep(0, 0.1, p) * (1 - sstep(0.52, 0.66, p)); W.bow = sstep(0.6, 0.74, p) * (1 - sstep(0.9, 1, p));
        this.rainLevel = W.rain;
        if (p >= 1) this.stopWeather();
      }
      if (E && E.kind === 'solar') {   // 日食のあいだは、空と光を夕ぐれ→夜に近づける
        const deep = new THREE.Color(0x1d1a40), warm = new THREE.Color(0xb86a5a);
        s.sunI *= 1 - 0.88 * ecl; s.hemiI *= 1 - 0.5 * ecl; s.top.lerp(deep, 0.85 * ecl); s.bottom.lerp(warm, 0.55 * ecl).lerp(deep, 0.25 * ecl);
        s.night = Math.max(s.night, ecl * 0.85);
      }
      // ふだんの天気(game/weather.js)。雨・くもりへ、ゆっくり近づける。雨と虹のイベント中はそちらが優先
      { const A = this.amb || (this.amb = { r: 0, c: 0, tr: 0, tc: 0 }), k = Math.min(1, dt * 0.25); A.r += (A.tr - A.r) * k; A.c += (A.tc - A.c) * k; if (!this.weather) this.rainLevel = A.r; }
      { const rn = this.weather ? this.weather.rain : Math.max(this.amb.r, this.amb.c * 0.45), gr = new THREE.Color(0x7a8499), gb = new THREE.Color(0xb0b7c6);
        s.sunI *= 1 - 0.7 * rn; s.hemiI *= 1 - 0.22 * rn; s.top.lerp(gr, 0.85 * rn); s.bottom.lerp(gb, 0.8 * rn);
        scene.fog.near = 75 - 40 * rn; scene.fog.far = 210 - 95 * rn; cm.color.setScalar(1 - 0.38 * rn);
      }
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
      if (E && this.eclipse) {   // 太陽の向きに、日食の円を置く(カメラのほうを向ける)
        const sd = dir.clone().normalize(), sp = focus.clone().addScaledVector(sd, 330), up = new THREE.Vector3(0, 1, 0), rt = new THREE.Vector3().crossVectors(up, sd).normalize();
        if (E.kind === 'solar') {
          const Rs = 15;
          sunGlow.position.copy(sp); sunGlow.lookAt(focus); sunGlow.scale.setScalar(Rs * 7);
          sunDisc.position.copy(sp); sunDisc.lookAt(focus); sunDisc.scale.setScalar(Rs);
          sunCover.position.copy(sp).addScaledVector(rt, E.off * Rs).addScaledVector(sd, -1); sunCover.lookAt(focus); sunCover.scale.setScalar(Rs * 1.04);
          corona.position.copy(sp).addScaledVector(sd, -2); corona.lookAt(focus); corona.scale.setScalar(Rs * 5); const ad = Math.abs(E.off), w = 1 + ad - 1.06, fl = sstep(0.4, 0.06, w) * sstep(0, 0.035, w), sgn = E.off >= 0 ? -1 : 1;
          corona.material.opacity = Math.max(Math.max(0, (ecl - 0.93) / 0.07), 0.5 * fl);
          flare.position.copy(sp).addScaledVector(rt, sgn * (1 - Math.max(0, w) * 0.5) * Rs).addScaledVector(sd, -3); flare.lookAt(focus); flare.scale.setScalar(Rs * (1.2 + 3 * fl)); flare.material.opacity = fl;
          sunGlow.material.opacity = 0.8 * (1 - ecl);
          for (const m of [sunGlow, sunDisc, sunCover, corona, flare]) m.visible = true;
        }
      }
      { const R = this.weather ? this.weather.rain : this.amb.r, cp = (this.camera && this.camera.position) || focus;
        if (R > 0.01) {
          rainLines.visible = true; rainMat.opacity = 0.55 * R; rainLines.position.set(cp.x, Math.max(0, cp.y - 12), cp.z);
          for (let i = 0; i < RN; i++) { const sd = rainSeed[i]; sd[1] -= 34 * dt; if (sd[1] < 0) sd[1] += 30; rainPos.set([sd[0], sd[1], sd[2], sd[0] - 0.12, sd[1] + 1.1, sd[2]], i * 6); }
          rainGeo.attributes.position.needsUpdate = true;
        } else rainLines.visible = false;
        const W = this.weather;
        if (W && W.bow > 0.01) {
          const hx = -dir.x, hz = -dir.z, hl = Math.hypot(hx, hz) || 1;
          bow.position.set(focus.x + hx / hl * 300, -2, focus.z + hz / hl * 300); bow.lookAt(focus.x, -2, focus.z); bow.visible = true;
          bow.children.forEach(m => { m.material.opacity = m.userData.op * W.bow * 1.6; });
        } else bow.visible = false;
      }
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
