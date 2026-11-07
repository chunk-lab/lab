// ゴルフ用:描かれている物の形そのままの当たり判定(ベンチ・噴水・街灯・自販機など)
import * as THREE from 'three';
const CELL = 6, tmpV = new THREE.Vector3();
export function makeSolids(parts, geoKey) {
  const grid = new Map(), out = [], box = new THREE.Box3(), c8 = [];
  for (const [g, m, mat] of parts) {
    if (mat.userData && mat.userData.vc === 'foliage') continue;   // 葉はすりぬける(幹は当たる)
    const ty = g.type, P = g.parameters || {};
    if (!['BoxGeometry', 'RoundedBoxGeometry', 'CylinderGeometry', 'SphereGeometry', 'ConeGeometry', 'TorusGeometry'].includes(ty)) continue;
    if (ty === 'CylinderGeometry' && P.openEnded && geoKey.get(g) !== 'fwall') continue;   // 屋根のひさしなど(噴水の壁だけ輪っかで判定)
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox; box.makeEmpty(); c8.length = 0;
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) box.expandByPoint(tmpV.set(x, y, z).applyMatrix4(m));
    if (box.max.y < 0.2 || box.min.y > 9.5 || box.max.x - box.min.x > 40 || box.max.z - box.min.z > 40) continue;   // 地面・道・屋根の上
    const sz = new THREE.Vector3(); bb.getSize(sz); const sc = new THREE.Vector3().setFromMatrixScale(m);
    if (Math.min(sz.x * sc.x, sz.y * sc.y, sz.z * sc.z) < 0.04 && ty !== 'TorusGeometry' && !(ty === 'CylinderGeometry' && P.openEnded)) continue;   // 板・看板・窓など うすいもの
    if (Math.max(box.max.x - box.min.x, box.max.z - box.min.z) < 0.08) continue;
    const s = { g, ty, P, inv: m.clone().invert(), bb, x0: box.min.x - 0.15, x1: box.max.x + 0.15, z0: box.min.z - 0.15, z1: box.max.z + 0.15, y1: box.max.y + 0.15, cx: (box.min.x + box.max.x) / 2, cz: (box.min.z + box.max.z) / 2, ring: ty === 'CylinderGeometry' && P.openEnded };
    out.push(s);
    for (let i = Math.floor(s.x0 / CELL); i <= Math.floor(s.x1 / CELL); i++) for (let j = Math.floor(s.z0 / CELL); j <= Math.floor(s.z1 / CELL); j++) { const k = i * 4096 + j; (grid.get(k) || grid.set(k, []).get(k)).push(s); }
  }
  const R = 0.1, q = new THREE.Vector3();
  function inside(s, p) {
    if (p.x < s.x0 || p.x > s.x1 || p.z < s.z0 || p.z > s.z1 || p.y > s.y1) return false;
    q.copy(p).applyMatrix4(s.inv); const P = s.P, bb = s.bb;
    switch (s.ty) {
      case 'SphereGeometry': return q.length() < P.radius + R;
      case 'TorusGeometry': return Math.hypot(Math.hypot(q.x, q.y) - P.radius, q.z) < P.tube + R;
      case 'CylinderGeometry': { const h = P.height; if (q.y < -h / 2 - R || q.y > h / 2 + R) return false; const rad = P.radiusBottom + (P.radiusTop - P.radiusBottom) * Math.min(1, Math.max(0, (q.y + h / 2) / h)), d = Math.hypot(q.x, q.z); return s.ring ? Math.abs(d - rad) < 0.2 : d < rad + R; }
      case 'ConeGeometry': { const h = P.height; if (q.y < -h / 2 - R || q.y > h / 2 + R) return false; return Math.hypot(q.x, q.z) < P.radius * (1 - Math.min(1, Math.max(0, (q.y + h / 2) / h))) + R; }
      default: return q.x > bb.min.x - R && q.x < bb.max.x + R && q.y > bb.min.y - R && q.y < bb.max.y + R && q.z > bb.min.z - R && q.z < bb.max.z + R;
    }
  }
  // ボール位置pが物にめりこんでいたら、その物を返す
  function hit(p) { const l = grid.get(Math.floor(p.x / CELL) * 4096 + Math.floor(p.z / CELL)); if (l) for (const s of l) if (inside(s, p)) return s; return null; }
  return { hit, count: out.length };
}
