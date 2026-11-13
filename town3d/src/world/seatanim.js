// 座る・寝転ぶ: ミクサモの本物の動き(FBX)を、どの体にも合わせて使う。
// FBXの動きは「ミクサモ標準の骨」用なので、体ごとの骨の向き(はじめの姿勢)のちがいを補正して、AnimationClip にする。
// 動きのデータ(seat_anims.json)は tools/ で FBX から作ったもの。
import * as THREE from 'three';
import DATA from './seat_anims.json';

const SRC_HIPS_Y = DATA.rest.mixamorigHips.y;
const q4 = a => new THREE.Quaternion(a[0], a[1], a[2], a[3]);
const norm = n => n.replace(':', '');

// model: 体の根(骨を含む)。この体の「はじめの姿勢」で補正する。戻り値: { sit, lay, ok }
export function makeSeatClips(model, sex) {
  model.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert(), m = new THREE.Matrix4(), qa = new THREE.Quaternion();
  const T = {};
  model.traverse(b => {
    if (!b.isBone) return;
    const wq = o => { m.multiplyMatrices(inv, o.matrixWorld); return m.decompose(new THREE.Vector3(), qa, new THREE.Vector3()), qa.clone(); };
    T[norm(b.name)] = { b, S: wq(b), P: b.parent ? wq(b.parent) : new THREE.Quaternion() };
  });
  const hips = T.mixamorigHips; if (!hips) return { ok: false };
  const hipsW = new THREE.Vector3().setFromMatrixPosition(m.multiplyMatrices(inv, hips.b.matrixWorld));
  const k = hipsW.y / SRC_HIPS_Y, parentInv = new THREE.Matrix4().multiplyMatrices(inv, hips.b.parent.matrixWorld).invert();
  const build = (name, key) => {
    const c = DATA.clips[key]; if (!c) return null;
    const tracks = [];
    for (const [n, tr] of Object.entries(c.tr)) {
      const t = T[n]; if (!t) continue;
      const s = DATA.rest[n], Ps = q4(s.p), Ss = q4(s.s).invert();
      if (tr.quaternion) {
        const out = [], PtI = t.P.clone().invert();
        for (let i = 0; i < tr.quaternion.t.length; i++) {
          const v = tr.quaternion.v, q = new THREE.Quaternion(v[i * 4], v[i * 4 + 1], v[i * 4 + 2], v[i * 4 + 3]);
          const r = PtI.clone().multiply(Ps).multiply(q).multiply(Ss).multiply(t.S); out.push(r.x, r.y, r.z, r.w);
        }
        tracks.push(new THREE.QuaternionKeyframeTrack(t.b.name + '.quaternion', tr.quaternion.t, out));
      }
      if (n === 'mixamorigHips' && tr.position) {
        const out = [], v = tr.position.v, p0 = s.pos, vv = new THREE.Vector3();
        for (let i = 0; i < tr.position.t.length; i++) {
          vv.set(hipsW.x + (v[i * 3] - p0[0]) * k, hipsW.y + (v[i * 3 + 1] - p0[1]) * k, hipsW.z + (v[i * 3 + 2] - p0[2]) * k).applyMatrix4(parentInv); out.push(vv.x, vv.y, vv.z);
        }
        tracks.push(new THREE.VectorKeyframeTrack(t.b.name + '.position', tr.position.t, out));
      }
    }
    return new THREE.AnimationClip(name, c.d, tracks);
  };
  return { ok: true, sit: build('Sit', sex === 'm' ? 'sitM' : 'sitW'), lay: build('Lay', 'lay') };
}
