// ビリヤード台の3D表示(暗い部屋・ランプの光・ラシャ・つやのある木のレール・真鍮のポケット・番号入りの球・キュー)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { W2, L2, R, RAILS, POCKETS } from './phys.js';

const CW = 0.05, RW = 0.14, CH = 0.04, RAILTOP = 0.046;   // クッションの幅・木のレールの幅・クッションの高さ
export const CLOTHS = [['ふかみどり', 0x0e5a3c, 0x1d7a52], ['ネイビー', 0x123a68, 0x2a5a96], ['ボルドー', 0x5a1626, 0x7d2a3a], ['チャコール', 0x2c3238, 0x454d55]];
export const BALL_COL = ['#f6f2e8', '#f2b705', '#1d45a8', '#c8152d', '#4c2a85', '#f06a14', '#0d7044', '#7c1d22', '#151515'];

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
// 球の模様(正距円筒図法。赤道の前後に番号の白丸)
function ballTex(n) {
  return canvasTex(512, 256, (g, w, h) => {
    const col = BALL_COL[n > 8 ? n - 8 : n];
    if (n === 0) {   // 手球:白に小さな赤い点(回転が見える)
      g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8152d';
      [[0.125, 0.5], [0.375, 0.5], [0.625, 0.5], [0.875, 0.5]].forEach(([u, v]) => { g.beginPath(); g.arc(u * w, v * h, 7, 0, 7); g.fill(); });
      g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); return;
    }
    if (n > 8) { g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, w, h); g.fillStyle = col; g.fillRect(0, h * 0.27, w, h * 0.46); }
    else { g.fillStyle = col; g.fillRect(0, 0, w, h); }
    for (const u of [0.25, 0.75]) {
      g.fillStyle = '#f7f4ec'; g.beginPath(); g.ellipse(u * w, h / 2, 34, 34, 0, 0, 7); g.fill();
      g.fillStyle = '#141414'; g.font = `900 ${n > 9 ? 36 : 42}px Georgia, "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(n), u * w, h / 2 + 2); if (n === 6 || n === 9) g.fillRect(u * w - 9, h / 2 + 22, 18, 3);
    }
  });
}
const clothTex = () => canvasTex(512, 512, (g, w, h) => {   // フェルトの細かい毛並み(明るさのノイズ)
  const im = g.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { const v = 200 + Math.random() * 55; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
});
const woodTex = () => canvasTex(1024, 256, (g, w, h) => {   // ウォルナット(濃い木目)
  g.fillStyle = '#3a2216'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    const y = Math.random() * h, a = 0.04 + Math.random() * 0.12; g.strokeStyle = Math.random() < 0.5 ? `rgba(20,10,5,${a})` : `rgba(120,70,40,${a})`; g.lineWidth = 0.6 + Math.random() * 2.5;
    g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 4 + Math.sin(x * 0.043 + i * 3) * 1.5); g.stroke();
  }
});

export function createView(box, { cloth = 0 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block';
  box.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0807);
  const pm = new THREE.PMREMGenerator(renderer); const envRT = pm.fromScene(new RoomEnvironment(), 0.04); scene.environment = envRT.texture; scene.environmentIntensity = 0.32; pm.dispose();
  const cam = new THREE.PerspectiveCamera(40, 1, 0.02, 30);
  const disp = [];   // あとで消すもの
  const D = o => { disp.push(o); return o; };

  // ---- 光:台の上だけを照らすランプ(3灯)+ うすい部屋の明かり ----
  scene.add(new THREE.HemisphereLight(0x8a7a66, 0x0a0806, 0.25));
  const key = new THREE.SpotLight(0xfff1dc, 26, 6, 0.75, 0.75, 1.6); key.position.set(0, 1.75, 0); key.target.position.set(0, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.01; key.shadow.radius = 4; key.shadow.camera.near = 0.6; key.shadow.camera.far = 3;
  scene.add(key, key.target);
  for (const z of [-0.85, 0.85]) { const s = new THREE.SpotLight(0xffecd2, 9, 4, 0.7, 0.9, 1.6); s.position.set(0, 1.15, z); s.target.position.set(0, 0, z); scene.add(s, s.target); }

  // ---- 床・台の脚 ----
  const floor = new THREE.Mesh(D(new THREE.PlaneGeometry(14, 14)), D(new THREE.MeshStandardMaterial({ color: 0x1a120d, roughness: 0.85 })));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.76; floor.receiveShadow = true; scene.add(floor);
  const wt = D(woodTex()); wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(1.2, 1.2);
  const woodM = D(new THREE.MeshPhysicalMaterial({ map: wt, color: 0xb08a70, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.1 }));
  const X = W2 + CW, Z = L2 + CW, OX = X + RW, OZ = Z + RW;
  const apron = new THREE.Mesh(D(new THREE.BoxGeometry(OX * 2 - 0.03, 0.17, OZ * 2 - 0.03)), woodM); apron.position.y = -0.135; apron.castShadow = apron.receiveShadow = true; scene.add(apron);
  for (const sx of [-1, 1]) for (const sz of [-1, 0.0001, 1]) { const leg = new THREE.Mesh(D(new THREE.CylinderGeometry(0.07, 0.05, 0.56, 16)), woodM); leg.position.set(sx * (OX - 0.16), -0.5, sz * (OZ - 0.22)); leg.castShadow = true; scene.add(leg); }

  // ---- ラシャ(ポケットの穴あき)----
  const ct = D(clothTex()); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(9, 18);
  const clothM = D(new THREE.MeshPhysicalMaterial({ color: CLOTHS[cloth][1], map: ct, roughness: 0.92, specularIntensity: 0.08, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color(CLOTHS[cloth][2]) }));
  const PR = [0.064, 0.064, 0.064, 0.064, 0.062, 0.062];   // 穴の半径
  {
    const sh = new THREE.Shape(); sh.moveTo(-OX + 0.02, -OZ + 0.02); sh.lineTo(OX - 0.02, -OZ + 0.02); sh.lineTo(OX - 0.02, OZ - 0.02); sh.lineTo(-OX + 0.02, OZ - 0.02); sh.closePath();
    POCKETS.forEach((p, i) => { const h = new THREE.Path(); h.absarc(p.x, -p.z, PR[i], 0, Math.PI * 2, true); sh.holes.push(h); });
    const bed = new THREE.Mesh(D(new THREE.ShapeGeometry(sh, 24)), clothM); bed.rotation.x = -Math.PI / 2; bed.receiveShadow = true; scene.add(bed);
    // 台の中央のヘッドスポット・フットスポット(小さな印)
    for (const z of [-L2 / 2, L2 / 2]) { const d = new THREE.Mesh(D(new THREE.CircleGeometry(0.006, 16)), D(new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9 }))); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.0006, z); scene.add(d); }
  }
  // ---- クッション(ラシャ張り。ポケット側の端はジョーの角度で切る)----
  const cushM = D(new THREE.MeshPhysicalMaterial({ color: new THREE.Color(CLOTHS[cloth][1]).multiplyScalar(0.92), map: ct, roughness: 0.9, specularIntensity: 0.08, sheen: 0.3, sheenRoughness: 0.6, sheenColor: new THREE.Color(CLOTHS[cloth][2]) }));
  const jaws = RAILS.filter(s => s.jaw);
  RAILS.filter(s => !s.jaw).forEach(s => {
    const ox = Math.sign(s.ax) * (Math.abs(s.ax - s.bx) < 1e-6 ? 1 : 0), oz = Math.sign(s.az) * (Math.abs(s.az - s.bz) < 1e-6 ? 1 : 0);   // 外向き
    const outer = (px, pz) => { const j = jaws.find(q => Math.abs(q.ax - px) < 1e-6 && Math.abs(q.az - pz) < 1e-6); let ux = ox, uz = oz; if (j) { const l = Math.hypot(j.bx - j.ax, j.bz - j.az); ux = (j.bx - j.ax) / l; uz = (j.bz - j.az) / l; } const k = CW / (ux * ox + uz * oz); return [px + ux * k, pz + uz * k]; };
    const a2 = outer(s.ax, s.az), b2 = outer(s.bx, s.bz);
    const sh = new THREE.Shape([[s.ax, s.az], [s.bx, s.bz], b2, a2].map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = D(new THREE.ExtrudeGeometry(sh, { depth: CH - 0.006, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.0035, bevelSegments: 3 }));
    geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, cushM); m.position.y = 0.003; m.castShadow = true; m.receiveShadow = true; scene.add(m);
  });
  // ---- 木のレール(1枚の板。ポケットの所は丸く切る)----
  {
    const sh = new THREE.Shape(), rr = 0.05;
    sh.moveTo(-OX + rr, -OZ); sh.lineTo(OX - rr, -OZ); sh.quadraticCurveTo(OX, -OZ, OX, -OZ + rr); sh.lineTo(OX, OZ - rr); sh.quadraticCurveTo(OX, OZ, OX - rr, OZ); sh.lineTo(-OX + rr, OZ); sh.quadraticCurveTo(-OX, OZ, -OX, OZ - rr); sh.lineTo(-OX, -OZ + rr); sh.quadraticCurveTo(-OX, -OZ, -OX + rr, -OZ);
    // 穴:内側の長方形 + ポケットの円 をつないだ輪郭(x-z で作って y=-z にする)
    const pts = [], add = (x, z) => pts.push(new THREE.Vector2(x, -z));
    const arc = (cx, cz, r, x0, z0, x1, z1) => {
      let a0 = Math.atan2(z0 - cz, x0 - cx), a1 = Math.atan2(z1 - cz, x1 - cx);
      const out = a => { const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; return Math.abs(x) > X + 1e-4 || Math.abs(z) > Z + 1e-4; };
      let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      if (!out(a0 + da / 2)) da = da > 0 ? da - 2 * Math.PI : da + 2 * Math.PI;
      for (let i = 0; i <= 20; i++) { const a = a0 + da * i / 20; add(cx + Math.cos(a) * r, cz + Math.sin(a) * r); }
    };
    const cp = (sx, sz) => { const p = POCKETS.find(q => q.corner && Math.sign(q.x) === sx && Math.sign(q.z) === sz), r = PR[0] + 0.004; const dx = X - Math.abs(p.x), dz = Z - Math.abs(p.z); return { p, r, ez: Math.abs(p.z) - Math.sqrt(r * r - dx * dx), ex: Math.abs(p.x) - Math.sqrt(r * r - dz * dz) }; };
    const sp = sx => { const p = POCKETS.find(q => !q.corner && Math.sign(q.x) === sx), r = PR[4] + 0.004, dx = X - Math.abs(p.x); return { p, r, e: Math.sqrt(r * r - dx * dx) }; };
    const c1 = cp(1, -1), c2 = cp(1, 1), c3 = cp(-1, 1), c4 = cp(-1, -1), s1 = sp(1), s2 = sp(-1);
    add(X, -c1.ez); add(X, -s1.e); arc(s1.p.x, 0, s1.r, X, -s1.e, X, s1.e); add(X, c2.ez);
    arc(c2.p.x, c2.p.z, c2.r, X, c2.ez, c2.ex, Z); add(-c3.ex, Z); arc(c3.p.x, c3.p.z, c3.r, -c3.ex, Z, -X, c3.ez);
    add(-X, s2.e); arc(s2.p.x, 0, s2.r, -X, s2.e, -X, -s2.e); add(-X, -c4.ez);
    arc(c4.p.x, c4.p.z, c4.r, -X, -c4.ez, -c4.ex, -Z); add(c1.ex, -Z); arc(c1.p.x, c1.p.z, c1.r, c1.ex, -Z, X, -c1.ez);
    sh.holes.push(new THREE.Path(pts));
    const geo = D(new THREE.ExtrudeGeometry(sh, { depth: RAILTOP + 0.045, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.007, bevelSegments: 4, curveSegments: 24 }));
    geo.rotateX(-Math.PI / 2); const rail = new THREE.Mesh(geo, woodM); rail.position.y = -0.053; rail.castShadow = true; rail.receiveShadow = true; scene.add(rail);
    // ポケットの中(黒い革の筒)と真鍮のふち
    const holeM = D(new THREE.MeshBasicMaterial({ color: 0x020202, side: THREE.DoubleSide }));
    const brass = D(new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.28 }));
    POCKETS.forEach((p, i) => {
      const cyl = new THREE.Mesh(D(new THREE.CylinderGeometry(PR[i], PR[i] * 0.9, 0.14, 28, 1, true)), holeM); cyl.position.set(p.x, -0.07, p.z); scene.add(cyl);
      const bot = new THREE.Mesh(D(new THREE.CircleGeometry(PR[i], 24)), holeM); bot.rotation.x = -Math.PI / 2; bot.position.set(p.x, -0.12, p.z); scene.add(bot);
      // 真鍮:外側半分だけの輪
      const ang = Math.atan2(-p.z, p.x);   // シェイプ座標での向き
      const ring = new THREE.Mesh(D(new THREE.TorusGeometry(PR[i] + 0.012, 0.0085, 10, 40, p.corner ? Math.PI * 1.25 : Math.PI)), brass);
      ring.rotation.x = -Math.PI / 2; ring.rotation.z = ang - (p.corner ? Math.PI * 0.625 : Math.PI / 2); ring.position.set(p.x, RAILTOP + 0.001, p.z); ring.scale.z = 0.5; scene.add(ring);
    });
    // ダイヤモンド(真珠の目印)
    const pearl = D(new THREE.MeshPhysicalMaterial({ color: 0xf3eee4, roughness: 0.2, iridescence: 1, iridescenceIOR: 1.6, clearcoat: 1 }));
    const dg = D(new THREE.OctahedronGeometry(0.01, 0)); dg.scale(1, 0.25, 0.55);
    const dia = (x, z, rot) => { const m = new THREE.Mesh(dg, pearl); m.position.set(x, RAILTOP + 0.0025, z); m.rotation.y = rot; scene.add(m); };
    for (const sx of [-1, 1]) for (const k of [-3, -2, -1, 1, 2, 3]) dia(sx * (X + RW / 2 - 0.01), k * L2 / 4, Math.PI / 2);
    for (const sz of [-1, 1]) for (const k of [-1, 0, 1]) dia(k * W2 / 2, sz * (Z + RW / 2 - 0.01), 0);
  }
  // ランプ(手球視点のときだけ見える。上から見る時は じゃまなので消す)
  const lamp = new THREE.Group();
  { const shade = new THREE.Mesh(D(new THREE.BoxGeometry(0.42, 0.12, 1.9)), D(new THREE.MeshStandardMaterial({ color: 0x0f2a1e, metalness: 0.6, roughness: 0.35 }))); lamp.add(shade);
    const glow = new THREE.Mesh(D(new THREE.PlaneGeometry(0.38, 1.85)), D(new THREE.MeshBasicMaterial({ color: 0xfff1d6 }))); glow.rotation.x = Math.PI / 2; glow.position.y = -0.061; lamp.add(glow);
    lamp.position.set(0, 1.25, 0); lamp.visible = false; scene.add(lamp); }

  // ---- 球 ----
  const ballGeo = D(new THREE.SphereGeometry(R, 48, 32));
  const meshes = new Map();
  function ballMesh(n) {
    let m = meshes.get(n); if (m) return m;
    const tex = D(ballTex(n)), mat = D(new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 }));
    m = new THREE.Mesh(ballGeo, mat); m.castShadow = true; m.receiveShadow = true;
    m.quaternion.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    if (n !== 0) m.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2 + (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 0.5, 'YXZ'));   // 番号の丸が だいたい上を向くように
    scene.add(m); meshes.set(n, m); return m;
  }
  const dq = new THREE.Quaternion(), ax = new THREE.Vector3();
  const drops = [];   // ポケットに落ちていく球 {m, x,z,vx,vz,y,t, px,pz}
  function sync(balls, dt) {
    for (const b of balls) {
      const m = ballMesh(b.n);
      if (b.on) {
        m.visible = true; m.position.set(b.x, R, b.z);
        const w = Math.hypot(b.wx, b.wy, b.wz); if (w > 1e-3 && dt > 0) { ax.set(b.wx / w, b.wy / w, b.wz / w); dq.setFromAxisAngle(ax, w * dt); m.quaternion.premultiply(dq); }
      } else if (!drops.some(d => d.m === m)) m.visible = false;
    }
    for (let i = drops.length - 1; i >= 0; i--) {   // ポケットへ吸いこまれて落ちる
      const d = drops[i]; d.t += dt; const k = Math.min(1, d.t * 5);
      d.x += (d.px - d.x) * k * 0.5; d.z += (d.pz - d.z) * k * 0.5; d.vy -= 9.8 * dt; d.y += d.vy * dt;
      d.m.position.set(d.x, Math.max(-0.1, d.y), d.z); d.m.visible = true;
      if (d.t > 0.7) { d.m.visible = false; drops.splice(i, 1); }
    }
  }
  function drop(n, p, x, z) { const m = ballMesh(n), P = POCKETS[p]; drops.push({ m, x, z, px: P.x, pz: P.z, y: R, vy: 0, t: 0 }); }

  // ---- キュー ----
  const cue = new THREE.Group(); cue.visible = false; scene.add(cue);
  {
    const part = (r0, r1, len, z0, mat) => { const g = D(new THREE.CylinderGeometry(r1, r0, len, 24)); g.rotateX(Math.PI / 2); const m = new THREE.Mesh(g, mat); m.position.z = -(z0 + len / 2); m.castShadow = true; cue.add(m); };
    const M = (c, o = {}) => D(new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, ...o }));
    part(0.0062, 0.0062, 0.004, 0, M(0x2f6fb5, { roughness: 0.9, clearcoat: 0 }));   // チョークのついたタップ
    part(0.0062, 0.0063, 0.022, 0.004, M(0xf2efe6));                                   // 先角(白)
    part(0.0063, 0.0105, 0.70, 0.026, M(0xe2c99a));                                    // シャフト(メープル)
    part(0.0105, 0.0108, 0.018, 0.726, D(new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.25 })));   // ジョイント(真鍮)
    part(0.0108, 0.0128, 0.32, 0.744, M(0x2a140c));                                    // バット(黒檀風)
    part(0.0128, 0.0138, 0.25, 1.064, M(0x111111, { roughness: 0.7, clearcoat: 0 }));  // グリップ
    part(0.0138, 0.0145, 0.12, 1.314, M(0x2a140c));
    part(0.0145, 0.0145, 0.012, 1.434, M(0x111111));
  }
  function setCue(on, x, z, ang, back = 0) {
    cue.visible = on; if (!on) return;
    const tilt = 0.07, d = R + 0.008 + back;
    cue.position.set(x - Math.sin(ang) * d, R + Math.sin(tilt) * d + 0.004, z - Math.cos(ang) * d);
    cue.rotation.set(0, 0, 0); cue.rotateY(ang); cue.rotateX(tilt);
  }

  // ---- カメラ ----
  let camMode = 'top', aspect = 1; const cp = new THREE.Vector3(), cl = new THREE.Vector3(), tp = new THREE.Vector3(), tl = new THREE.Vector3(); let first = true, fov = 40, tfov = 40, mt = 0, mb = 0, offY = 0, toff = 0, vw = 1, vh = 1;
  function camTarget(mode, cx, cz, ang) {
    if (mode === 'top') {
      tfov = 38; const t = Math.tan(THREE.MathUtils.degToRad(tfov) / 2), band = Math.max(0.4, (vh - mt - mb) / vh), need = Math.max((OZ + 0.05) / (t * band), (OX + 0.04) / (t * aspect)), tilt = 0.2;
      toff = -(mt - mb) / 2;   // 上の名前・下のボタンにかからない帯の まん中に台がくるように
      tp.set(0, need * Math.cos(tilt), -need * Math.sin(tilt) - 0.02); tl.set(0, 0, 0.0);
    } else {
      toff = 0; tfov = 52; const dx = Math.sin(ang), dz = Math.cos(ang);
      tp.set(cx - dx * 0.95, 0.46, cz - dz * 0.95); tl.set(cx + dx * 0.85, 0, cz + dz * 0.85);
    }
  }
  function setCam(mode, cx, cz, ang, dt = 1) {
    camMode = mode; camTarget(mode, cx, cz, ang); lamp.visible = mode !== 'top';
    const k = first ? 1 : Math.min(1, dt * 6); first = false;
    cp.lerp(tp, k); cl.lerp(tl, k); fov += (tfov - fov) * k;
    offY += (toff - offY) * k; cam.setViewOffset(vw, vh, 0, offY, vw, vh);
    cam.position.copy(cp); cam.lookAt(cl); cam.fov = fov; cam.updateProjectionMatrix();
  }

  function resize() { const w = box.clientWidth || 300, h = box.clientHeight || 300; renderer.setSize(w, h, false); aspect = w / h; vw = w; vh = h; cam.aspect = aspect; cam.updateProjectionMatrix(); }
  resize();
  const v3 = new THREE.Vector3();
  const project = (x, y, z) => { v3.set(x, y, z).project(cam); const w = box.clientWidth, h = box.clientHeight; return [(v3.x + 1) / 2 * w, (1 - v3.y) / 2 * h, v3.z]; };
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -R), hitP = new THREE.Vector3();
  const pick = (sx, sy) => { const r = renderer.domElement.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((sx / r.width) * 2 - 1, -(sy / r.height) * 2 + 1), cam); return ray.ray.intersectPlane(plane, hitP) ? { x: hitP.x, z: hitP.z } : null; };
  const render = () => renderer.render(scene, cam);
  function dispose() {
    disp.forEach(o => o.dispose && o.dispose()); envRT.dispose(); renderer.dispose(); renderer.forceContextLoss?.(); renderer.domElement.remove();
  }
  const setMargins = (t, b) => { mt = t; mb = b; };
  return { setMargins, renderer, scene, cam, sync, drop, setCue, setCam, resize, project, pick, render, dispose, get camMode() { return camMode; }, meshes };
}
