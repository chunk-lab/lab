// 前もって1回だけ: 座る・寝る・乗る・投球の動きを、全員共通の骨の数値にした「決まったデータ」にする(町では計算しない)
// 骨の初期の数値は全員同じ(tools/unify_bones.py)なので、回転は全員同じ。腰の位置(体の大きさで変わる)だけ体ごとに書き出す
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { makeSeatClips } from './seatanim.js';
import { bodyFrames, retargetRot } from './retarget.js';
import { BOWL, BOWL_HIPS, BOWL_REST } from '../../src/world/bowl_clip.js';
function bowlClip(model, fr) {
  const bowlRaw = THREE.AnimationClip.parse(BOWL);
  const rest = new Map();
  fr.bones.forEach(b => { const l = BOWL_REST[b.name]; if (!l) return; const p = b.parent && rest.get(b.parent.name); rest.set(b.name, (p ? p.clone() : new THREE.Quaternion()).multiply(new THREE.Quaternion(l[0], l[1], l[2], l[3]))); });
  const src = { rest, top: new Map(), tracks: new Map() };
  bowlRaw.tracks.forEach(t => { const m = t.name.match(/^(.*)\.quaternion$/); if (m) src.tracks.set(m[1], { times: t.times, values: t.values }); });
  const tracks = retargetRot(fr, src);
  const hb = fr.bones[0], ht = bowlRaw.tracks.find(t => t.name === hb.name + '.position');
  if (ht) {
    model.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(model.matrixWorld).invert(), hw = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().multiplyMatrices(inv, hb.matrixWorld));
    const pInv = new THREE.Matrix4().multiplyMatrices(inv, hb.parent.matrixWorld).invert(), k = hw.y / BOWL_HIPS, out = [], v = new THREE.Vector3();
    for (let i = 0; i < ht.times.length; i++) { v.set(hw.x, hw.y + (ht.values[i * 3 + 1] - BOWL_HIPS) * k, hw.z).applyMatrix4(pInv); out.push(v.x, v.y, v.z); }
    tracks.push(new THREE.VectorKeyframeTrack(hb.name + '.position', ht.times, out));
  }
  return new THREE.AnimationClip('bowl', bowlRaw.duration, tracks);
}
const BODIES = window.__BODIES;   // [file, sex]
const r5 = a => Array.from(a, x => Math.round(x * 1e5) / 1e5);
(async () => {
  const L = new GLTFLoader(), rot = {}, dur = {}, hips = {}, diff = {}, log = [];
  for (const [file, sex] of BODIES) {
    const g = await L.loadAsync(window.__BASE + file); const model = g.scene;
    const S = makeSeatClips(model, sex, 0);
    const got = { [sex === 'm' ? 'sitM' : 'sitW']: S.sit, [sex === 'm' ? 'lay' : 'flutter']: S.lay, sleep: S.sleep, rideF: S.rideF, rideB: S.rideB, bowl: bowlClip(model, bodyFrames(model)) };
    // 男女で使わない方も作っておく(同じ体で、もう片方の性別のぶん)
    const S2 = makeSeatClips(model, sex === 'm' ? 'w' : 'm', 0);
    got[sex === 'm' ? 'sitW' : 'sitM'] = S2.sit; got[sex === 'm' ? 'flutter' : 'lay'] = S2.lay;
    hips[file] = {};
    for (const [key, c] of Object.entries(got)) {
      if (!c) continue; dur[key] = c.duration;
      for (const t of c.tracks) {
        if (t.name.endsWith('.position')) { hips[file][key] = { t: r5(t.times), v: r5(t.values) }; continue; }
        const b = t.name.replace('.quaternion', ''); rot[key] = rot[key] || {};
        const e = rot[key][b];
        if (!e) { rot[key][b] = { t: r5(t.times), v: r5(t.values) }; continue; }
        let m = 0; for (let i = 0; i < t.values.length; i++) m = Math.max(m, Math.abs(t.values[i] - e.v[i]));   // 全員同じになっているか(ちがえば止める)
        diff[key] = Math.max(diff[key] || 0, m);
      }
    }
    log.push(file);
  }
  window.__OUT = { rot, dur, hips, diff, log };
})().catch(e => { window.__ERR = String(e.stack || e); });
