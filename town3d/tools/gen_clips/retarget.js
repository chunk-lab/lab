// 動きを体に当てはめる、ただ1つの道(全員共通)。
// 基準は「皮膚を付けた時の姿勢(bind)」。動きのデータを「元の体の基準の姿勢からの回り方」にして、
// それを この体の骨の向き(bind)に掛けなおす。体ごとに骨のねじれ方がちがっても、同じ見た目の動きになる。
// 借りる動き(はな・そらの5つ)・座る/寝る(seat_anims)・ボウリングの投球、すべてここを通す。
import * as THREE from 'three';

// この体の骨ごとの基準の向き(体の根から見た向き。rotY=正面を+zに向ける回転を含む)。動きを流す前に呼ぶこと
export function bodyFrames(model, rotY = 0) {
  model.updateMatrixWorld(true);
  const Ry = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
  // 骨の向きは「動かす前(読みこんだまま)」の姿勢で測る。どの体も、この姿勢が皮膚を付けた時の姿勢と同じ(three.js で全員確認ずみ)
  const B = new Map(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const skinned = new Set(); model.traverse(o => { if (o.isSkinnedMesh) o.skeleton.bones.forEach(b => skinned.add(b)); });
  skinned.forEach(b => { m.multiplyMatrices(inv, b.matrixWorld).decompose(v, q, s); B.set(b.name, Ry.clone().multiply(q).normalize()); });
  const bones = []; model.traverse(o => { if (o.isBone && B.has(o.name)) bones.push(o); });   // 親が先に来る順
  const top = new Map();   // いちばん上の骨(腰)の、骨でない親の向き
  bones.forEach(b => { if (b.parent && b.parent.isBone && B.has(b.parent.name)) return; m.multiplyMatrices(inv, b.parent.matrixWorld).decompose(v, q, s); top.set(b.name, Ry.clone().multiply(q).normalize()); });
  return { B, bones, top };
}

// src: { rest: name→元の体の基準の向き(世界), top: name→腰の親の向き(なければ単位), tracks: name→{times, values(xyzw)} }
// 戻り値: この体用の回転トラック(全部の骨のぶん。データのない骨は基準の姿勢のまま)
export function retargetRot(fr, src) {
  const names = fr.bones.map(b => b.name);
  const tset = new Set(); src.tracks.forEach(t => t.times.forEach(x => tset.add(+x.toFixed(5))));
  const times = Float32Array.from([...tset].sort((a, b) => a - b)); if (!times.length) return [];
  const N = times.length;
  const samp = new Map(); src.tracks.forEach((t, n) => { const kt = new THREE.QuaternionKeyframeTrack(n + '.quaternion', t.times, t.values); samp.set(n, kt.createInterpolant(new Float32Array(4))); });
  const parentOf = new Map(fr.bones.map(b => [b.name, b.parent && b.parent.isBone && fr.B.has(b.parent.name) ? b.parent.name : null]));
  const restW = n => src.rest.get(n);
  const out = new Map(names.map(n => [n, new Float32Array(N * 4)]));
  const Ws = new Map(), Wt = new Map(), q = new THREE.Quaternion(), tmp = new THREE.Quaternion();
  for (let i = 0; i < N; i++) {
    for (const n of names) {
      const p = parentOf.get(n), Bt = fr.B.get(n), Ss = restW(n);
      const pS = p ? Ws.get(p) : (src.top.get(n) || new THREE.Quaternion());
      let ws;
      if (samp.has(n)) { const r = samp.get(n).evaluate(times[i]); ws = pS.clone().multiply(tmp.set(r[0], r[1], r[2], r[3]).normalize()); }
      else if (Ss) { const pr = p ? restW(p) : (src.top.get(n) || new THREE.Quaternion()); ws = pS.clone().multiply(pr.clone().invert().multiply(Ss)); }   // データのない骨は、元の体の基準の形のまま
      else ws = null;
      // この体の向き = 元の向き × 元の基準⁻¹ × この体の基準(元のデータにない骨は、親にくっついて基準のまま)
      const wt = ws && Ss ? ws.clone().multiply(Ss.clone().invert()).multiply(Bt) : (p ? Wt.get(p).clone().multiply(fr.B.get(p).clone().invert()).multiply(Bt) : Bt.clone());
      Ws.set(n, ws || pS.clone()); Wt.set(n, wt);
      const pT = p ? Wt.get(p) : (fr.top.get(n) || new THREE.Quaternion());
      q.copy(pT).invert().multiply(wt).normalize();
      const a = out.get(n); a[i * 4] = q.x; a[i * 4 + 1] = q.y; a[i * 4 + 2] = q.z; a[i * 4 + 3] = q.w;
    }
  }
  return names.map(n => new THREE.QuaternionKeyframeTrack(n + '.quaternion', times, out.get(n)));
}

// three.js のクリップ(はな・そらの動き)を、元の体の基準つきで読む
export function clipSource(clip, srcFrames) {
  const tracks = new Map();
  clip.tracks.forEach(t => { const m = t.name.match(/^(.*)\.quaternion$/); if (m) tracks.set(m[1], { times: t.times, values: t.values }); });
  return { rest: srcFrames.B, top: srcFrames.top, tracks };
}
