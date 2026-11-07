// 「かくれもの」のキラッ:近づくと、隠れている場所がときどき光る。占い・ヒントをもらった場所は、遠くからでもわかる
import * as THREE from 'three';
const NEAR = 9, HINT = 24, POOL = 8;
function tex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 30); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,240,170,.85)'); r.addColorStop(1, 'rgba(255,220,120,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff'; g.beginPath();   // 4つのとがり
  g.moveTo(32, 2); g.quadraticCurveTo(35, 29, 62, 32); g.quadraticCurveTo(35, 35, 32, 62); g.quadraticCurveTo(29, 35, 2, 32); g.quadraticCurveTo(29, 29, 32, 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function createSparkles(scene, finds) {
  const map = tex(), pool = [];
  for (let i = 0; i < POOL; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.visible = false; s.renderOrder = 20; scene.add(s); pool.push(s);
  }
  let t = 0, list = [], listT = 0;
  return {
    update(dt, me) {
      t += dt;
      if ((listT -= dt) <= 0) {   // 候補は0.7秒ごとに集める
        listT = 0.7; const hs = new Set(finds.hinted().map(s => s.key));
        list = finds.spots().map(s => ({ s, d: Math.hypot(s.x - me.x, s.z - me.z), h: hs.has(s.key) })).filter(o => o.d < (o.h ? HINT : NEAR)).sort((a, b) => a.d - b.d).slice(0, POOL);
      }
      pool.forEach((sp, i) => {
        const o = list[i]; if (!o) { sp.visible = false; return; }
        const ph = (o.s.x * 12.9898 + o.s.z * 78.233) % 6.283, k = Math.max(0, Math.sin(t * 1.9 + ph)) ** 8;   // ときどき「キラッ」
        const base = o.h ? 0.55 : 0.28, near = 1 - Math.min(1, o.d / (o.h ? HINT : NEAR)) * 0.5;
        sp.position.set(o.s.x, 0.55 + Math.sin(t * 1.3 + ph) * 0.08 + k * 0.15, o.s.z);
        const sc = (base + k * (o.h ? 1.1 : 0.7)) * near; sp.scale.set(sc, sc, 1);
        sp.material.opacity = 0.25 + 0.75 * k + (o.h ? 0.25 : 0); sp.material.rotation = t * 0.6 + ph; sp.visible = true;
      });
    },
  };
}
