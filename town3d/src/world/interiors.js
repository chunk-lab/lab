// 物語で使う「建物の中」。もようがえの家具(furniture.js の ITEM)で組み立てて、町から離れた所に置く。
// かべは内がわから見える面だけ(外から撮っても、中が見える)。天井はなし。使うときに1回だけ作る。
import * as THREE from 'three';
import { ITEM, WALL_H } from '../game/furniture.js';

// at=部屋の左奥の角(町の座標)。items: [家具id, x, z, 向き, 高さ](部屋の中の座標。奥のかべ z=0、手前 z=d)
export const INTERIORS = {
  library: {
    name: '図書館の中', at: [150, 150], w: 14, d: 11, floor: 0xc89f74, wall: 0xf3ead8, side: 0xe8dcc4,
    items: [
      ['shelf', 1.4, 0.5], ['shelf', 3.4, 0.5], ['shelf', 5.4, 0.5], ['window', 7.0, 0.06, 0, 1.0], ['shelf', 8.6, 0.5], ['shelf', 10.6, 0.5], ['shelf', 12.6, 0.5],
      ['shelf', 0.5, 3.2, Math.PI / 2], ['shelf', 0.5, 5.4, Math.PI / 2], ['shelf', 0.5, 7.6, Math.PI / 2],
      ['shelf', 13.5, 3.2, -Math.PI / 2], ['shelf', 13.5, 5.4, -Math.PI / 2],
      ['dining', 5.0, 5.6], ['chair', 3.8, 5.6, Math.PI / 2], ['chair', 6.2, 5.6, -Math.PI / 2], ['bookstack', 5.0, 5.4, 0, 0.77],
      ['dining', 9.0, 5.6], ['chair', 7.8, 5.6, Math.PI / 2], ['chair', 10.2, 5.6, -Math.PI / 2], ['lamp', 9.0, 5.8, 0, 0.77],
      ['desk', 11.6, 8.6, Math.PI], ['bookstack', 11.9, 8.6, Math.PI, 0.77], ['rug', 7.0, 8.4],
      ['plant', 1.0, 10.2], ['plant', 13.0, 10.2], ['floorlamp', 13.2, 7.6], ['clock', 7.0, 0.06, 0, 2.7],
    ],
  },
  cafe: {
    name: 'カフェの中', at: [150, 178], w: 10, d: 8, floor: 0xb98a62, wall: 0xffe8d6, side: 0xf6d9c4,
    items: [
      ['counter', 1.6, 0.6], ['counter', 3.6, 0.6], ['kettle', 1.4, 0.6, 0, 0.92], ['cupboard', 5.8, 0.5], ['wallshelf', 2.6, 0.06, 0, 1.9],
      ['window', 8.2, 0.06, 0, 1.0], ['poster', 5.8, 0.06, 0, 2.4],
      ['dining', 3.0, 4.4], ['chair', 1.8, 4.4, Math.PI / 2], ['chair', 4.2, 4.4, -Math.PI / 2], ['vase', 3.0, 4.4, 0, 0.77],
      ['dining', 7.2, 4.4], ['chair', 6.0, 4.4, Math.PI / 2], ['chair', 8.4, 4.4, -Math.PI / 2], ['candle', 7.2, 4.4, 0, 0.77],
      ['plant', 0.8, 7.2], ['plant', 9.2, 7.2], ['floorlamp', 9.2, 1.0], ['rug', 5.0, 6.4],
    ],
  },
};

export function createInteriors(scene) {
  const built = {};
  function build(k) {
    const S = INTERIORS[k], g = new THREE.Group(), [ax, az] = S.at, W = S.w, D = S.d;
    g.position.set(ax, 0, az);
    const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.2, D), mat(S.floor)); floor.position.set(W / 2, -0.08, D / 2); floor.receiveShadow = true; g.add(floor);
    const wall = (w, c, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WALL_H), mat(c)); m.position.set(x, WALL_H / 2, z); m.rotation.y = ry; g.add(m); };
    wall(W, S.wall, W / 2, 0, 0); wall(D, S.side, 0, D / 2, Math.PI / 2); wall(D, S.side, W, D / 2, -Math.PI / 2); wall(W, S.wall, W / 2, D, Math.PI);
    for (const [id, x, z, ry = 0, y] of S.items) {
      const it = ITEM[id]; if (!it) continue;
      const f = new THREE.Group(); it.build(f); f.position.set(x, y != null ? y : it.wall ? (it.y0 ?? 1.2) : 0, z); f.rotation.y = ry;
      f.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.add(f);
    }
    scene.add(g); return g;
  }
  return {
    use(k) { if (!INTERIORS[k]) return null; if (!built[k]) built[k] = build(k); built[k].visible = true; return INTERIORS[k]; },
    // 部屋の中の座標 → 町の座標
    at(k, x, z) { const S = INTERIORS[k]; return [S.at[0] + x, S.at[1] + z]; },
  };
}
