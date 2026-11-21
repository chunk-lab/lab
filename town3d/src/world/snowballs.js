// 町の雪玉(冬だけ)。ボタン長おしで雪玉をつくる(長いほど大きい・つくる間は動けない)。画面をタップした所へ投げる。
// 当たると、飛び散る分と、跡になって張りつく分がある。跡は少しして、ポロっと落ちて消える(地面の跡は、そのままとける)。
import * as THREE from 'three';

export function createSnowballs(scene, { camera, meshes, residents, getHand, onNpcHit }) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
  const ballGeo = new THREE.SphereGeometry(1, 14, 10), bitGeo = new THREE.SphereGeometry(1, 6, 4), decalGeo = new THREE.CircleGeometry(1, 16);
  const hand = new THREE.Mesh(ballGeo, mat); hand.visible = false; hand.castShadow = true; scene.add(hand);
  const flying = [], bits = [], decals = [];
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), tmp = new THREE.Vector3();
  let making = -1, size = 0;
  const sizeOf = t => Math.min(1, 0.25 + t / 1.6);   // 長おしで大きく(1.6秒で最大)
  const R = s => 0.07 + s * 0.13;

  function splash(p, n, s, onNpc) {
    const k = 8 + Math.round(s * 10);
    for (let i = 0; i < k; i++) {
      const m = new THREE.Mesh(bitGeo, mat), r = 0.02 + Math.random() * 0.04 * (0.6 + s);
      m.scale.setScalar(r); m.position.copy(p).addScaledVector(n, 0.05);
      const v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2.2, (Math.random() - 0.5) * 3).addScaledVector(n, 1.6 + Math.random() * 1.5).multiplyScalar(0.7 + s * 0.6);
      scene.add(m); bits.push({ m, v, t: 0.5 + Math.random() * 0.4 });
    }
    // 跡(張りつく)
    const d = new THREE.Mesh(decalGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.95, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide }));
    const r = R(s) * (1.6 + Math.random() * 0.6); d.scale.set(r, r * (0.75 + Math.random() * 0.3), r);
    d.position.copy(p).addScaledVector(n, 0.012); d.lookAt(tmp.copy(d.position).add(n)); d.rotateZ(Math.random() * 6.28);
    scene.add(d);
    const floor = n.y > 0.7;
    decals.push({ m: d, t: 0, stick: floor ? 2.2 + s * 2 : 0.9 + Math.random() * 0.9, floor, v: new THREE.Vector3(), spin: (Math.random() - 0.5) * 6, follow: onNpc || null, off: onNpc ? onNpc.worldToLocal(d.position.clone()) : null });
  }

  function pick(cx, cy, rect) {
    ndc.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); ray.far = 60;
    let best = null;
    const h1 = ray.intersectObjects(meshes, false)[0]; if (h1) best = { p: h1.point, n: h1.face ? h1.face.normal.clone().transformDirection(h1.object.matrixWorld) : new THREE.Vector3(0, 1, 0), d: h1.distance };
    for (const r of residents.list) {
      if (!r.ch.root.visible) continue;
      const h = ray.intersectObject(r.ch.root, true)[0];
      if (h && (!best || h.distance < best.d)) best = { p: h.point, n: tmp.copy(ray.ray.direction).negate().clone(), d: h.distance, npc: r };
    }
    if (!best) { const p = ray.ray.intersectPlane(ground, new THREE.Vector3()); if (p) best = { p, n: new THREE.Vector3(0, 1, 0), d: p.distanceTo(ray.ray.origin) }; }
    return best;
  }

  return {
    fx(p, n, s, onNpc) { splash(p, n, s, onNpc || null); },
    hitNpc(r, s) { onNpcHit?.(r, s); },   // 投げた雪だるまが直接当たったとき   // 雪合戦(3D)の当たりにも使う
    get making() { return making >= 0; },
    get holding() { return size > 0 && making < 0; },
    start() { if (making >= 0) return; making = 0; size = sizeOf(0); hand.visible = true; },
    finish() { if (making < 0) return 0; making = -1; return size; },
    cancel() { making = -1; size = 0; hand.visible = false; },
    // 画面の (cx,cy) へ投げる。返り値:'far'(遠すぎる) / true
    throwAt(cx, cy, rect) {
      if (!(size > 0) || making >= 0) return false;
      const hit = pick(cx, cy, rect); if (!hit) return false;
      const from = getHand().clone(), dist = from.distanceTo(hit.p);
      if (dist > 34) return 'far';
      const m = new THREE.Mesh(ballGeo, mat); m.scale.setScalar(R(size)); m.position.copy(from); m.castShadow = true; scene.add(m);
      flying.push({ m, from, to: hit.p.clone(), n: hit.n.clone().normalize(), npc: hit.npc || null, s: size, u: 0, T: Math.max(0.28, dist / 17), arc: Math.min(2.4, dist * 0.09) });
      size = 0; hand.visible = false; return true;
    },
    update(dt) {
      if (making >= 0) { making += dt; size = sizeOf(making); }
      if (hand.visible) { hand.position.copy(getHand()); hand.scale.setScalar(R(size) * (making >= 0 ? 1 + Math.sin(making * 18) * 0.04 : 1)); }
      for (let i = flying.length - 1; i >= 0; i--) {
        const f = flying[i]; f.u += dt / f.T; const u = Math.min(1, f.u);
        f.m.position.lerpVectors(f.from, f.to, u); f.m.position.y += Math.sin(u * Math.PI) * f.arc; f.m.rotation.x += dt * 8;
        if (u >= 1) {
          scene.remove(f.m); flying.splice(i, 1);
          splash(f.to, f.n, f.s, f.npc ? f.npc.ch.root : null);
          if (f.npc) onNpcHit?.(f.npc, f.s);
        }
      }
      for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.t -= dt; b.v.y -= 9.8 * dt; b.m.position.addScaledVector(b.v, dt); if (b.m.position.y < 0.02) { b.m.position.y = 0.02; b.v.multiplyScalar(0.3); } if (b.t <= 0) { scene.remove(b.m); bits.splice(i, 1); } }
      for (let i = decals.length - 1; i >= 0; i--) {
        const d = decals[i]; d.t += dt;
        if (d.follow && d.t < d.stick) d.m.position.copy(d.follow.localToWorld(d.off.clone()));
        if (d.t > d.stick) {
          const k = d.t - d.stick;
          if (d.floor) d.m.material.opacity = Math.max(0, 0.95 - k / 1.6);   // 地面:とける
          else { d.v.y -= 9.8 * dt; d.m.position.addScaledVector(d.v, dt); d.m.rotation.z += d.spin * dt; d.m.rotation.x += dt * 3; d.m.material.opacity = Math.max(0, 0.95 - k / 0.7); }   // ポロっと落ちる
          if (d.m.material.opacity <= 0 || d.m.position.y < -0.5) { scene.remove(d.m); d.m.material.dispose(); decals.splice(i, 1); }
        }
      }
    },
  };
}
