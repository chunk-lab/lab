/* エンカウント戦闘の3D: 話しかけてきた相手の住人「だけ」を3Dで描く(町と、ほかの人は止めたまま描かない)。
   レイヤー5に相手だけを入れ、専用のカメラ・ライト・背景で描く。動きは、いま住人が持っている動き(手をふる・おじぎ)に、
   体を前に出す・のけぞる・はねるを足して作る(新しい動きは足していない)。 */
import * as THREE from 'three';

const L = 5;
export function createStage(renderer, scene) {
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 80); cam.layers.set(L);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9a88c8, 1.7), sun = new THREE.DirectionalLight(0xffffff, 2.3);
  hemi.layers.set(L); sun.layers.set(L); sun.target.layers.set(L);
  let r = null, root = null, S = null, bg = null, fog = null, g = null, aspect = 0, h = 1.7, saved = false;
  const mark = on => root.traverse(o => { if (on) o.layers.enable(L); else o.layers.disable(L); });
  return {
    begin(res) {   // 成功したら true(だめなら、顔絵のまま)
      try {
        r = res; root = r.ch && r.ch.root; if (!root) return false;
        S = { p: root.position.clone(), q: root.quaternion.clone(), s: root.scale.clone() };
        h = Math.max(0.6, Math.min(3.5, r.ch.height || 1.7)); mark(true);
        scene.add(hemi, sun, sun.target); bg = scene.background; fog = scene.fog; saved = true; scene.background = new THREE.Color(0x261b5a); scene.fog = null;
        root.rotation.set(0, 0, 0); g = null; return true;
      } catch (e) { this.end(); return false; }
    },
    act(kind) { g = { kind, t: 0 }; try { if (kind === 'throw' || kind === 'strike' || kind === 'cheer') r.ch.wave && r.ch.wave(); else if (kind === 'bow') r.ch.bow && r.ch.bow(); } catch (e) { } },
    frame(dt) {
      if (!root) return;
      try { r.ch.update(dt, 0); } catch (e) { }
      let ox = 0, oy = 0, oz = 0, rx = 0;
      if (g) {
        const D = { throw: 0.7, strike: 0.9, hit: 0.55, cheer: 1.2, bow: 0.1 }[g.kind] || 0.5; g.t += dt; const u = Math.min(1, g.t / D);
        if (g.kind === 'throw') { oz = Math.sin(Math.PI * u) * 0.35 * h; oy = Math.sin(Math.PI * u) * 0.04 * h; rx = Math.sin(Math.PI * u) * 0.12; }   // ふりかぶって、前へ
        else if (g.kind === 'strike') { oz = Math.sin(Math.PI * u) * 0.8 * h; oy = Math.abs(Math.sin(Math.PI * u * 2)) * 0.1 * h; rx = Math.sin(Math.PI * u) * 0.25; }   // 大きく、前へとびだす
        else if (g.kind === 'hit') { ox = Math.sin(u * 34) * (1 - u) * 0.1 * h; oz = -(1 - u) * Math.sin(Math.PI * Math.min(1, u * 1.5)) * 0.2 * h; rx = -Math.sin(Math.PI * u) * 0.3; }   // のけぞって、ふるえる
        else if (g.kind === 'cheer') { oy = Math.abs(Math.sin(Math.PI * u * 3)) * 0.22 * h; }   // はねてよろこぶ
        if (u >= 1 && g.kind !== 'bow') g = null;
      }
      root.position.set(S.p.x + ox, S.p.y + oy, S.p.z + oz); root.rotation.set(rx, 0, 0);
      const c = renderer.domElement, a = c.clientWidth / Math.max(1, c.clientHeight); if (Math.abs(a - aspect) > 0.001) { aspect = a; cam.aspect = a; cam.updateProjectionMatrix(); }
      const D = h * 4.4;   // 画面の高さの 4割ほどに、全身が入る距離
      cam.position.set(S.p.x, S.p.y + h * 0.6, S.p.z + D); cam.lookAt(S.p.x, S.p.y - h * 0.1, S.p.z);   // 目線より下を見て、相手が画面の上のほうに出るように
      sun.position.set(S.p.x + h * 1.5, S.p.y + h * 3, S.p.z + h * 3); sun.target.position.set(S.p.x, S.p.y + h * 0.5, S.p.z);
      renderer.render(scene, cam);
    },
    end() {
      try {
        if (root && S) { root.position.copy(S.p); root.quaternion.copy(S.q); root.scale.copy(S.s); }
        if (root) mark(false);
        scene.remove(hemi, sun, sun.target); if (saved) { scene.background = bg; scene.fog = fog; saved = false; }
      } catch (e) { }
      r = root = S = null; g = null;
    },
  };
}
