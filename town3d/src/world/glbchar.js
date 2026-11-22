// Mixamoリグ入りのGLB(ちびキャラ)を、makeCharacter と同じ使い方(root/height/update/wave)で動かす。
// 読み込み中・失敗時は、元のコード製キャラのまま動く(落ちない)。
import { makeSeatClips } from './seatanim.js';
import { BOWL, BOWL_HIPS, BOWL_REST } from './bowl_clip.js';
import { bodyFrames, retargetRot, clipSource } from './retarget.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import OCA from './oca_pose.json';
// オカリナを吹くポーズ(ユーザーさん作の mio の姿勢)。骨のねじれ方は体ごとに違うので、「骨の向き(関節→次の関節)」だけを体の向きに合わせて写す
function ocaClip(model) {
  model.updateMatrixWorld(true);
  const by = new Map(); model.traverse(o => { if (o.isBone) by.set(o.name.replace(':', '').replace(/^mixamorig/, ''), o); });
  const g = n => by.get(n); if (!g('Hips') || !g('Spine2') || !g('LeftUpLeg') || !g('RightUpLeg')) return null;
  const inv = new THREE.Matrix4().copy(model.matrixWorld).invert(), m = new THREE.Matrix4(), tv = new THREE.Vector3(), ts = new THREE.Vector3();
  const wp = o => new THREE.Vector3().setFromMatrixPosition(m.multiplyMatrices(inv, o.matrixWorld));
  const wq = o => { const q = new THREE.Quaternion(); m.multiplyMatrices(inv, o.matrixWorld).decompose(tv, q, ts); return q; };
  const up = wp(g('Spine2')).sub(wp(g('Hips'))).normalize(), rt = wp(g('RightUpLeg')).sub(wp(g('LeftUpLeg')));
  rt.addScaledVector(up, -rt.dot(up)).normalize(); const fw = new THREE.Vector3().crossVectors(rt, up);
  const W = new Map(), tracks = [], bones = []; model.traverse(o => { if (o.isBone) bones.push(o); });
  for (const b of bones) {
    const p = b.parent, pW = p && W.has(p) ? W.get(p) : wq(p), rW = wq(b);
    let Wb = pW.clone().multiply(b.quaternion);
    const key = b.name.replace(':', '').replace(/^mixamorig/, ''), d = OCA.d[key], c = d && g(OCA.ch[key]);
    if (c) {
      const v = wp(c).sub(wp(b)).applyQuaternion(Wb.clone().multiply(rW.clone().invert())).normalize();
      const want = new THREE.Vector3().addScaledVector(rt, d[0]).addScaledVector(up, d[1]).addScaledVector(fw, d[2]).normalize();
      Wb = new THREE.Quaternion().setFromUnitVectors(v, want).multiply(Wb);
      const L = pW.clone().invert().multiply(Wb).normalize();
      tracks.push(new THREE.QuaternionKeyframeTrack(b.name + '.quaternion', [0, 1], [L.x, L.y, L.z, L.w, L.x, L.y, L.z, L.w]));
    }
    W.set(b, Wb);
  }
  return new THREE.AnimationClip('oca', 1, tracks);
}

// 住人id → モデル。rotY は「モデルの正面を +z に向ける」補正(ゆず・潮見さんは -x 向きで出てくる)
export const GLB_MODELS = {
  baron: { url: 'models/baron.glb', rotY: 0, sex: 'm' },
  koharu: { url: 'models/koharu.glb', rotY: 0, animFrom: 'hana' },
  yuzu: { url: 'models/yuzu.glb', rotY: 0, animFrom: 'hana' },
  shiori: { url: 'models/shiori.glb', rotY: 0, animFrom: 'hana' },
  maru: { url: 'models/maru.glb', rotY: 0, animFrom: 'hana' },
  mii: { url: 'models/mii.glb', rotY: 0, animFrom: 'hana' },
  gon: { url: 'models/gon.glb', rotY: 0, sex: 'm', animFrom: 'sora' },
  choco: { url: 'models/choco.glb', rotY: 0, sex: 'm', animFrom: 'sora' },
  'player:ren': { url: 'models/player_ren.glb', rotY: 0, sex: 'm' },   // プレイヤー(男の子)
  'player:mio': { url: 'models/player_mio.glb', rotY: 0 },   // プレイヤー(女の子)
  // 「player:」は ほかのプレイヤー(かんたんな体)。自分が操る体は「self:」で別にしてある(動きのデータが入っていない体は animFrom の体の動きを借りる)
  'self:ren': { url: 'models/self_ren.glb', rotY: 0, animFrom: 'sora', sex: 'm' },
  'self:mio': { url: 'models/self_mio.glb', rotY: 0, animFrom: 'hana' },
  luna: { url: 'models/luna.glb', rotY: 0 },
  tetsu: { url: 'models/philosopher.glb', rotY: 0, sex: 'm' },
  suna: { url: 'models/shiomi.glb', rotY: Math.PI / 2 },
  sora: { url: 'models/sora.glb', rotY: 0, sex: 'm' },
  hana: { url: 'models/hana.glb', rotY: 0 },
};
// モデルの場所: town.js を読み込んだ場所の横の models/(1つのHTMLで動かすときは、ページの横の models/)。tarot・bgm と同じやり方
const SCRIPT_SRC = (() => { try { return (document.currentScript && document.currentScript.src) || ''; } catch (e) { return ''; } })();
const urlOf = u => { try { return SCRIPT_SRC ? new URL(u, SCRIPT_SRC).href : u; } catch (e) { return u; } };
const loader = new GLTFLoader();
const cache = new Map();
// 版の印(組み立てのときに作る models/versions.json)。読めなくても、印なしで読みに行く
const verP = {};
const versions = (dir = 'models') => verP[dir] || (verP[dir] = fetch(urlOf(dir + '/versions.json'), { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({})));
// モデルは、版(?v=)つきの名前でブラウザの保存場所(Cache API)に取っておく。2回目からはネットに取りに行かない。版が変わったときだけ入れ替える
const STORE = 'town-glb-v1';
async function fetchGlb(url) {
  let c = null;
  try { c = await caches.open(STORE); const hit = await c.match(url); if (hit) { stat.now = nm(url) + ' を保存から読む'; return await hit.arrayBuffer(); } } catch (e) { c = null; }
  stat.now = nm(url) + ' をダウンロード';
  const r = await fetch(url); if (!r.ok) throw new Error('glb ' + r.status);
  if (c) { try { await c.put(url, r.clone()); const key = new URL(url, location.href).pathname; for (const k of await c.keys()) { const u = new URL(k.url); if (u.pathname === key && k.url !== new URL(url, location.href).href) await c.delete(k); } } catch (e) { } }
  return await r.arrayBuffer();
}
// キャラの絵の画質: 自動(スマホ=軽量 / パソコン=高画質)・高画質・軽量。「せってい」で変えると、次に町を開いたときから
export const TEX_MODE = (() => { let m = 'auto'; try { m = localStorage.getItem('hoshimiya:chartex') || 'auto'; } catch (e) { } if (m !== 'hi' && m !== 'lite') { try { m = matchMedia('(pointer:coarse)').matches ? 'lite' : 'hi'; } catch (e) { m = 'hi'; } } return m; })();
// 読む場所と版の印を決める。軽量版がないモデルは、ふつうの版を読む
async function pickUrl(url) {
  const f = url.split('/').pop();
  if (url.startsWith('paid/')) { const v = await versions('paid'); return urlOf(url) + (v[f] ? '?v=' + v[f] : ''); }
  if (TEX_MODE === 'lite' && url.startsWith('models/')) { const v = await versions('models_lite'); if (v[f]) return urlOf('models_lite/' + f) + '?v=' + v[f]; }
  const v = await versions('models'); return urlOf(url) + (v[f] ? '?v=' + v[f] : '');
}
// 体ごとの「測った値」(背の倍率・足元の高さ・座る位置など)。モデルが同じなら毎回同じなので、前もって測って models/measure.json に入れておく
// (作り方: tools/gen_measure.mjs)。表の値が古い(モデルや動きを差し替えた・測り方を変えた)ときだけ、その場で測る
export const MEASURE_VER = 1;   // 測り方(足元・座る位置の計算)を変えたら 1 増やす → 古い表は使われず、その場で測る
export const glbMeasured = {};   // その場で使った値(表を作るとき用)
let measP = null;
const measures = () => measP || (measP = Promise.all([fetch(urlOf('models/measure.json'), { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({})), versions('models')]).then(([m, v]) => ({ m, v })));
function preOf(T, id, spec) {
  const e = T && T.m[id], f = u => u.split('/').pop(); if (!e || e.cv !== MEASURE_VER || e.mv !== T.v[f(spec.url)]) return null;
  if (spec.animFrom && e.av !== T.v[f(GLB_MODELS[spec.animFrom].url)]) return null;
  return e;
}
// 読みこみは2つずつ順番に(全員いっぺんに読むとスマホが重くなる)。プレイヤーを先に
const queue = []; let running = 0, CONC = 2; const stat = { total: 0, done: 0, now: '' }; const readyScenes = [];   // now = いま何をしているか(読み込み中のバーに出す)
export const glbStat = () => ({ ...stat });
const nm = u => (u.split('/').pop() || '').split('?')[0].replace(/\.glb$/, '');
export const setGlbConc = n => { CONC = n; pump(); };
const pump = () => { while (running < CONC && queue.length) { const j = queue.shift(); running++; j.run().finally(() => { running--; pump(); }); } };
const load = (url, first) => {
  if (!cache.has(url)) cache.set(url, new Promise((ok, ng) => {
    stat.total++; const job = { run: () => pickUrl(url).then(u => fetchGlb(u)).then(buf => { stat.now = nm(url) + ' をひらく'; return buf; }).then(buf => new Promise((res, rej) => loader.parse(buf, '', res, rej))).then(g => { toonify(g.scene); readyScenes.push(g.scene); stat.done++; ok(g); }, e => { stat.done++; ng(e); }) };
    first ? queue.unshift(job) : queue.push(job); pump();
  }));
  return cache.get(url);
};
// 町の明るさに合わせる: Tripo のモデルは絵に陰影が入っているので、町のキャラと同じアニメ調の陰影にして、絵の色を少し自分で光らせる(暗く沈まない)
const ramp = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 245, 245, 245, 255, 255, 255, 255, 255]), 4, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
export const GLB_LOOK = { glow: 0.45 };   // 絵の自分の光り(0〜1)。上げると明るく、平たくなる
function toonify(root) {
  const made = new Map();
  root.traverse(o => {
    if (!o.isMesh) return;
    const conv = m => {
      if (made.has(m)) return made.get(m);
      const t = new THREE.MeshToonMaterial({ map: m.map || null, color: m.map ? 0xffffff : (m.color || new THREE.Color(0xffffff)), gradientMap: ramp, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side,
        emissive: 0xffffff, emissiveMap: m.map || null, emissiveIntensity: GLB_LOOK.glow });
      made.set(m, t); return t;
    };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
}
// 大きさの試し(?sizetest=1 の画面のつまみ)が、出ている全員の大きさを変えられるように
export const glbChars = new Set();
// 大きさ: 住人は2.0・自分は1.7が標準。変えたいときは「せってい」のつまみで(この端末に残る)。URLの ?npcsize= ?playersize= は確認用
const Q = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
const num = k => parseFloat(Q.get(k)) || 0;
const SZ_KEY = 'hoshimiya:size';
const savedSz = (() => { try { return JSON.parse(localStorage.getItem(SZ_KEY)) || {}; } catch (e) { return {}; } })();
export const SIZE_NOW = { npc: num('npcsize') || savedSz.npc || 2.0, player: num('playersize') || savedSz.player || 1.7, mascot: 1.0 };
export function setGlbSize(k, v) {   // 「せってい」のつまみから。出ている全員の背が、その場で変わる
  SIZE_NOW[k] = v; try { localStorage.setItem(SZ_KEY, JSON.stringify({ npc: SIZE_NOW.npc, player: SIZE_NOW.player, mascot: SIZE_NOW.mascot })); } catch (e) { }
  if (k === 'mascot') return;   // チャンクくんは、ふだん1の大きさで固定
  for (const g of glbChars) if (g.player === (k === 'player')) g.ch.setHeight(v);
}

const SIT_HIP = 0.17;   // 腰の骨から座面までの高さ(m)の見当(実機で合わせる)
// 動きは全員共通の道(retarget.js)で当てはめる。基準は各体の「皮膚を付けた時の姿勢」
// 借りる動き(はな・そらの5つ): 体ごとに1回だけ作って、同じ体の2人目からは使い回す
const borrowedClips = new Map();
function borrowClips(key, model, src) {
  if (borrowedClips.has(key)) return borrowedClips.get(key);
  const fr = bodyFrames(model), sf = bodyFrames(src.scene);
  const clips = src.animations.map(cl => new THREE.AnimationClip(cl.name, cl.duration, retargetRot(fr, clipSource(cl, sf)).concat(cl.tracks.filter(t => !/\.quaternion$/.test(t.name)))));
  borrowedClips.set(key, clips); return clips;
}
// ボウリングの投球(外から持ってきたFBXの動き)。腰の上下だけ体の大きさに合わせて残し、前後左右の移動は消す(その場で動く)
let bowlRaw = null;
function bowlClip(model, fr) {
  if (!bowlRaw) bowlRaw = THREE.AnimationClip.parse(BOWL);
  const rest = new Map();   // BOWL_REST は親からの向き。親子をたどって、元の体の基準の向きにする
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
export function useGlb(ch, id, { height } = {}) {
  if (!height) height = 1.3;   // 住人のふだんの背(プレイヤーは約1.65)
  const spec = GLB_MODELS[id]; if (!spec) return ch;
  // 読みこみ中は前のコード製の体を出さない(出てから入れかわると見苦しい)。失敗したときだけ戻す
  const old = ch.root.children.slice(); old.forEach(o => { o.visible = false; });
  const player = id.startsWith('player:') || id.startsWith('self:');
  height = player ? SIZE_NOW.player : (height !== 1.3 ? height : SIZE_NOW.npc);   // 確認用の住人ごとの背(?npcsizes=1)だけは、そちらを優先
  Promise.all([load(spec.url, player), spec.animFrom ? load(GLB_MODELS[spec.animFrom].url, player) : null, measures().catch(() => null)]).then(([gltf0, src, T]) => {
    stat.now = nm(spec.url) + ' の体と動きを準備';
    const gltf = src && !(gltf0.animations && gltf0.animations.length) ? { scene: gltf0.scene, animations: src.animations } : gltf0;
    // 同じモデルを複数体出してもいいように、骨ごと複製する
    const model = cloneSkinned(gltf.scene);
    const holder = new THREE.Group(); holder.rotation.y = spec.rotY; holder.add(model);
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    if (src && gltf !== gltf0) gltf.animations = borrowClips(spec.url, model, src);   // 動きを借りる体(はなの動き→この体の骨の向きに)
    const mixer = new THREE.AnimationMixer(model);
    const clip = n => gltf.animations.find(a => a.name === n);
    const act = {}; for (const [k2, n] of [['idle', 'Breathing Idle'], ['walk', 'Standard Walk'], ['bow', 'Quick Formal Bow'], ['wave', 'Waving'], ['run', 'Standard Run']]) { const c = clip(n); if (c) act[k2] = mixer.clipAction(c); }
    // 座る・寝転ぶ: ミクサモの本物の動き(体に合わせて補正)
    try { const oc = ocaClip(model); if (oc) act.oca = mixer.clipAction(oc); } catch (e) { console.warn('oca', e); }
    const SC = makeSeatClips(model, spec.sex, spec.rotY || 0); if (SC.ok) { if (SC.sit) act.sit = mixer.clipAction(SC.sit); if (SC.lay) { act.lay = mixer.clipAction(SC.lay); if (SC.layLoop) act.lay.setLoop(THREE.LoopRepeat, Infinity); else { act.lay.setLoop(THREE.LoopOnce, 1); act.lay.clampWhenFinished = true; } } for (const k2 of ['rideF', 'rideB']) if (SC[k2]) act[k2] = mixer.clipAction(SC[k2]).setLoop(THREE.LoopRepeat, Infinity);   // チャンクくんに乗る(前むき・後ろむき)
    if (SC.sleep) { act.sleep = mixer.clipAction(SC.sleep); act.sleep.setLoop(THREE.LoopOnce, 1); act.sleep.clampWhenFinished = true; } }
    try { const c = bowlClip(model, bodyFrames(model)); act.bowl = mixer.clipAction(c); act.bowl.setLoop(THREE.LoopOnce, 1); act.bowl.clampWhenFinished = true; } catch (e) { }   // 投球の動き(ボウリング)
    for (const k2 of ['bow', 'wave']) if (act[k2]) { act[k2].setLoop(THREE.LoopOnce, 1); act[k2].clampWhenFinished = true; }
    // 大きさと足元は「待機の姿勢で骨を動かした形」で測る(骨を動かす前の形で測ると、足が地面に埋まる)
    // 待機の動きを何コマか見て、いちばん低い足元・いちばん高い頭で測る(動きの途中で沈まないように)
    const idleBox = () => {
      if (!act.idle) return posedBox(holder);
      act.idle.play(); const dur = act.idle.getClip().duration, all = new THREE.Box3();
      for (let i = 0; i <= 4; i++) { act.idle.time = dur * i / 4; mixer.update(0); all.union(posedBox(holder)); }
      act.idle.time = 0; mixer.update(0); return all;
    };
    const pre0 = id.startsWith('paid:') || window.__glbNoPre ? null : preOf(T, id, spec), pre = pre0 && Object.keys(act).every(n => pre0.foot && pre0.foot[n] != null) ? pre0 : null;
    let k, baseX, baseZ; const footOf = new Map();
    if (pre) { k = pre.k; holder.scale.setScalar(k); baseX = pre.px; baseZ = pre.pz; holder.position.set(baseX, 0, baseZ); for (const [n, a] of Object.entries(act)) footOf.set(a, pre.foot[n]); }   // 前もって測った値
    else {
    const box = idleBox(), size = box.getSize(new THREE.Vector3());
    k = 1 / size.y; holder.scale.setScalar(k);   // ここでは背を1にそろえ、背の高さは外側(wrap)の大きさで決める
    const b2 = idleBox(), c = b2.getCenter(new THREE.Vector3());
    holder.position.set(-c.x, -b2.min.y, -c.z); baseX = -c.x; baseZ = -c.z;
    // 動きごとの足元(歩くと腰が下がる、など)。動きを切りかえたら、その動きの足元に合わせて高さをなめらかに直す
    for (const a of Object.values(act)) {
      const prev = holder.position.y; holder.position.y = 0;
      mixer.stopAllAction(); a.reset().play(); const dur = a.getClip().duration; let m = Infinity;
      for (let i = 0; i <= 14; i++) { a.time = dur * i / 14; mixer.update(0); m = Math.min(m, posedBox(holder).min.y); }
      a.stop(); holder.position.y = prev; footOf.set(a, -m);
    }
    }
    mixer.stopAllAction(); if (act.idle) { act.idle.reset().play(); mixer.update(0); holder.position.y = footOf.get(act.idle); }
    const wrap = new THREE.Group(); wrap.add(holder); wrap.scale.setScalar(height);
    // 座った動きの腰の高さ(背に対する割合)。座面に合わせるときの基準
    let sitHipN = 0; const sitHipOf = () => { mixer.stopAllAction(); act.sit.reset().play(); act.sit.time = act.sit.getClip().duration * 0.5; mixer.update(0); holder.position.y = 0; wrap.updateMatrixWorld(true); const hb = model.getObjectByName('mixamorigHips') || model.getObjectByName('mixamorig:Hips'); const y = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld).y / height; act.sit.stop(); mixer.stopAllAction(); if (act.idle) { act.idle.reset().play(); mixer.update(0); holder.position.y = footOf.get(act.idle); } return y; };
    // 座ったときの、お尻の下の高さ(sitContN)と、腰の前後左右のずれ(sitDX,sitDZ)を、体ごとに測る(体つきがちがっても、座面にぴったり乗せるため)
    let sitContN = 0, sitDX = 0, sitDZ = 0, sitRad = 0.05;
    if (pre && pre.sit) { ({ hip: sitHipN, cont: sitContN, dx: sitDX, dz: sitDZ, rad: sitRad } = pre.sit); }
    else if (act.sit) {
      sitHipN = sitHipOf();
      try {
        mixer.stopAllAction(); act.sit.reset().play(); act.sit.time = act.sit.getClip().duration * 0.5; mixer.update(0); const px = holder.position.x, pz = holder.position.z; holder.position.y = 0; wrap.updateMatrixWorld(true);
        const hb = model.getObjectByName('mixamorigHips') || model.getObjectByName('mixamorig:Hips'), hp = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld).divideScalar(height);
        // お尻の下 = ももの中心線の高さ − ももの太さ(スカートなどの布も含めた太さ)
        const Wp = n => new THREE.Vector3().setFromMatrixPosition((model.getObjectByName('mixamorig' + n) || model.getObjectByName('mixamorig:' + n)).matrixWorld).divideScalar(height);
        const J = Wp('LeftUpLeg'), K = Wp('LeftLeg'), ax = K.clone().sub(J), ax2 = ax.lengthSq(), ds = [], v = new THREE.Vector3(), w = new THREE.Vector3();
        model.traverse(o => {
          if (!o.isSkinnedMesh) return; o.skeleton.update();
          const bn = o.skeleton.bones.map(b => b.name.replace(':', '')), si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight;
          for (let i = 0; i < si.count; i++) {
            let bi = 0, bw = -1; for (let j = 0; j < 4; j++) { const q = sw.getComponent(i, j); if (q > bw) { bw = q; bi = si.getComponent(i, j); } }
            if (bn[bi] !== 'mixamorigLeftUpLeg') continue;
            o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld).divideScalar(height);
            const t = w.copy(v).sub(J).dot(ax) / ax2; if (t < 0.15 || t > 0.85) continue;
            ds.push(w.copy(v).sub(J).addScaledVector(ax, -t).length());
          }
        });
        ds.sort((p, q) => p - q);
        const rad = ds.length > 20 ? ds[Math.floor(ds.length * 0.5)] : 0.04;
        sitRad = rad;
        sitContN = (J.y + K.y) / 2 - rad; sitDX = hp.x - px; sitDZ = hp.z - pz; const ys = ds;
        (window.__seatDbg = window.__seatDbg || {})[id] = { lat: (() => { const a = Wp('LeftUpLeg').sub(Wp('RightUpLeg')); return [+a.x.toFixed(3), +a.z.toFixed(3)]; })(), hip: +sitHipN.toFixed(3), cont: +sitContN.toFixed(3), dz: +sitDZ.toFixed(3), dx: +sitDX.toFixed(3), n: ys.length };
        act.sit.stop(); mixer.stopAllAction(); if (act.idle) { act.idle.reset().play(); mixer.update(0); holder.position.y = footOf.get(act.idle); }
      } catch (e) { sitContN = sitHipN - 0.1; }
    }
    // チャンクくんに乗る姿勢: お尻の下の高さと、腰の前後左右のずれを測る(乗る面に、お尻をぴったり合わせるため)
    const rideM = pre && pre.ride ? { ...pre.ride } : {};
    if (!(pre && pre.ride)) for (const k2 of ['rideF', 'rideB']) if (act[k2]) try {
      const a = act[k2], y0 = holder.position.y, px = holder.position.x, pz = holder.position.z;
      mixer.stopAllAction(); a.reset().play(); a.time = 0; mixer.update(0); holder.position.y = 0; wrap.updateMatrixWorld(true);
      const hb = model.getObjectByName('mixamorigHips') || model.getObjectByName('mixamorig:Hips'), hp = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld).divideScalar(height);
      rideM[k2] = { cont: hp.y - sitRad * 1.25, dx: hp.x - px, dz: hp.z - pz };
      a.stop(); mixer.stopAllAction(); holder.position.y = y0; if (act.idle) { act.idle.reset().play(); mixer.update(0); holder.position.y = footOf.get(act.idle); }
    } catch (e) { }
    { const foot = {}; for (const [n, a] of Object.entries(act)) foot[n] = footOf.get(a); glbMeasured[id] = { cv: MEASURE_VER, k, px: baseX, pz: baseZ, foot, sit: act.sit ? { hip: sitHipN, cont: sitContN, dx: sitDX, dz: sitDZ, rad: sitRad } : null, ride: rideM, pre: !!pre }; }   // 表を作るとき用・点検用
    // すわる・ひざをつく・ピアノ: 骨を直接まげる(3Dの体には、この動きのデータがないので)。まげた分だけ腰を下げて、いすの高さに合わせる
    const hipsV = new THREE.Vector3();
    const Bn = n => (model.getObjectByName('mixamorig' + n) || model.getObjectByName('mixamorig:' + n)), bn = { lu: Bn('LeftUpLeg'), ll: Bn('LeftLeg'), ru: Bn('RightUpLeg'), rl: Bn('RightLeg'), la: Bn('LeftArm'), ra: Bn('RightArm'), lf: Bn('LeftForeArm'), rf: Bn('RightForeArm') };
    const dq = new THREE.Quaternion(), eu = new THREE.Euler(); let poseK = 0, poseName = null;
    const rest = new Map(Object.values(bn).filter(Boolean).map(b => [b, b.quaternion.clone()]));   // 動かす前の向き(毎回ここからまげるので、ずれがたまらない)
    const bend = (b, x, y, z, k) => { if (!b) return; eu.set(x * k, y * k, z * k); dq.setFromEuler(eu); b.quaternion.copy(rest.get(b)).multiply(dq); };
    (window.__glbBones = window.__glbBones || {})[id] = bn; (window.__glbChar = window.__glbChar || {})[id] = ch;   // 点検用
    ch.root.add(wrap);
    ch.setHeight = h => { wrap.scale.setScalar(h); ch.height = h; };
    const entry = { id, player, ch }; glbChars.add(entry); ch.glbOff = () => glbChars.delete(entry);
    // 点検用: いまの足元の高さ(地面=0 からのずれ)を測れるようにしておく
    // (高さを切りかえる途中ではなく、いまの動きで落ちついたときの高さで測る)
    (window.__glbFeet = window.__glbFeet || {})[id] = () => { if (ch.pose === 'sit' || ch.pose === 'piano' || ch.pose === 'lie' || ch.pose === 'ride' || fadeT > 0 || cur === act.walk || cur === act.run) return { foot: 0, top: 0 }; const y = holder.position.y, ty = footOf.get(cur); if (ty !== undefined) holder.position.y = ty; ch.root.updateMatrixWorld(true); const b = posedBox(holder, ch.root); holder.position.y = y; return { foot: +b.min.y.toFixed(3), top: +b.max.y.toFixed(3) }; };;
    let cur = null, lock = 0;
    let prev = null, fadeT = 0;   // 切りかえ中は、前の動きと今の動きの、高いほうの足元に合わせる(まざった姿勢で沈まない)
    const play = (name, fade = 0.25) => {
      const a = act[name]; if (!a || cur === a) return;
      a.reset().fadeIn(fade).play(); if (cur) cur.fadeOut(fade); prev = cur; fadeT = fade; cur = a;
    };
    cur = act.idle || null; if (!cur) play('idle', 0);
    ch.height = height; ch.glb = true; ch.hasLay = !!(act.lay || act.sleep);
    const base = ch.update;
    ch.update = (dt, speed) => {
      const sitK = !!act.sit && (ch.pose === 'sit' || ch.pose === 'piano'), layK = !!(act.lay || act.sleep) && ch.pose === 'lie', goro = layK && ch.lieKind === 'goro' && !!act.lay, lieClip = goro ? 'lay' : act.sleep ? 'sleep' : 'lay';   // ゴロゴロ=lay(男:横向き寝 女:足パタパタ) ねる=sleep(あおむけ)
      const rideN = ch.pose === 'ride' ? (ch.rideKind === 'back' ? 'rideB' : 'rideF') : null, rideK = !!(rideN && act[rideN] && rideM[rideN]);
      if (rideK) play(rideN, 0.35); else if (sitK) play('sit', 0.4); else if (act.oca && ch.pose === 'harp') play('oca', 0.4); else if (layK) play(lieClip, 0.4);
      else if (lock > 0) lock -= dt;
      else play(act.run && (cur === act.run ? speed > 3.0 : speed > 4.2) ? 'run' : speed > 0.05 ? 'walk' : 'idle');   // 歩き⇔走りは少し幅をもたせる(行ったり来たりしない)
      if (cur === act.run) act.run.timeScale = Math.max(0.7, Math.min(1.4, speed / 5));
      if (cur === act.walk) act.walk.timeScale = Math.max(0.6, Math.min(1.6, speed / 2.2));
      mixer.update(dt);
      if (act.lay || act.sleep) wrap.rotation.y = layK ? (lieClip === 'lay' ? Math.PI / 2 : 0) : 0;   // ねる動きは体が横(x)向きなので、キャラの前後(z)に沿うように回す(頭が後ろ側)
      // 座る・寝る: 腰がキャラの真ん中(x,z=0)にくるように、毎コマそろえる(体ごとに腰の位置がちがっても、途中で横にずれたり、寝る場所がずれたりしない)
      if (sitK || layK) { const hb = Bn('Hips'); if (hb) { wrap.updateMatrixWorld(true); hipsV.setFromMatrixPosition(hb.matrixWorld); wrap.worldToLocal(hipsV); holder.position.x -= hipsV.x; holder.position.z -= hipsV.z; } }
      // 家の中などの「寝転ぶ」: あおむけに倒す(3Dの体には寝る動きがないので、向きだけ変える)
      const lie = ch.pose === 'lie' && !act.lay && !act.sleep; if (lie !== !!ch._lie) { ch._lie = lie; wrap.rotation.x = lie ? -Math.PI / 2 : 0; wrap.position.set(0, lie ? 0.12 : 0, lie ? ch.height / 2 : 0); }
      const want = (ch.pose === 'sit' && !act.sit) || ch.pose === 'piano' || ch.pose === 'kneel' ? ch.pose : null;
      if (want) poseName = want; poseK += ((want ? 1 : 0) - poseK) * Math.min(1, dt * 9); if (poseK < 0.01 && !want) { poseK = 0; poseName = null; }
      let drop = 0;
      if (poseK > 0 && poseName) {
        const k = poseK;
        if (poseName === 'kneel') { bend(bn.lu, -1.2, 0, 0, k); bend(bn.ll, 1.25, 0, 0, k); bend(bn.ru, 0.2, 0, 0, k); bend(bn.rl, 1.9, 0, 0, k); drop = 0.19 * ch.height / 1.7 * k; }   // ひざが地面につく高さまで
        else { if (!act.sit) { bend(bn.lu, -1.5, 0, 0.06, k); bend(bn.ru, -1.5, 0, -0.06, k); bend(bn.ll, 1.5, 0, 0, k); bend(bn.rl, 1.5, 0, 0, k); const sc = ch.height / 1.7, u = ch.seatH != null ? (ch.seatH - 0.387 * sc) / 1.8 : 0; drop = (0.035 * ch.height - u) * k; }   // seatH=座面の高さ(m): 腰が座面の少し上にくるように下げる量を決める(測定: 腰=0.452×背/1.7+1.8×u)
   // この体は腰がもともと低い(背の0.27倍)ので、いすの高さまで少しだけ下げる
          if (poseName === 'piano') { bend(bn.la, -1.0, 0, 0, k); bend(bn.ra, -1.0, 0, 0, k); bend(bn.lf, -0.5, 0, 0, k); bend(bn.rf, -0.5, 0, 0, k); } }
        ch.root.updateMatrixWorld(true);
      }
      if (fadeT > 0) fadeT -= dt;
      let ty = -drop +  Math.max(footOf.get(cur) ?? -Infinity, fadeT > 0 && prev ? footOf.get(prev) ?? -Infinity : -Infinity); if (sitK) ty = (ch.seatH != null ? ch.seatH : 0.45) / ch.height - sitContN;   // お尻の下を、座面に合わせる
      if (rideK) ty = (ch.rideY || 0) / ch.height - rideM[rideN].cont;
      if (ty > -Infinity) holder.position.y += (ty - holder.position.y) * (rideK && ch.rideSnap ? 1 : Math.min(1, dt * 8));   // うかんで上下する間は、乗っている人をおくれずに合わせる
      if (!(sitK || layK)) { const tx = rideK ? -rideM[rideN].dx : baseX, tz = rideK ? -rideM[rideN].dz : baseZ, kk = Math.min(1, dt * 8); holder.position.x += (tx - holder.position.x) * kk; holder.position.z += (tz - holder.position.z) * kk; }   // 座るときは、腰が座面の真上に来るように
    };
    (window.__hipsL = window.__hipsL || []).push({ id, f: () => { ch.root.updateMatrixWorld(true); const hb = model.getObjectByName('mixamorigHips') || model.getObjectByName('mixamorig:Hips'); const w = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld), r = new THREE.Vector3().setFromMatrixPosition(ch.root.matrixWorld); return [+(w.x - r.x).toFixed(3), +(w.y - r.y).toFixed(3), +(w.z - r.z).toFixed(3), +holder.position.x.toFixed(3), +holder.position.z.toFixed(3), +(-sitDX).toFixed(3), String(ch.pose), +baseX.toFixed(3)]; } });
    ch.wave = () => { if (act.wave) { play('wave', 0.2); lock = 3.2; } };
    ch.bow = () => { if (act.bow) { play('bow', 0.2); lock = 2.2; } };
    // ボウリング: hold=投球の動きを from 秒めから流して、さいごの姿勢で止める / free=止めた姿勢から、ゆっくり元にもどる
    ch.hand = () => model.getObjectByName('mixamorigRightHand');
    ch.hold = (name, from = 0, fade = 0.15) => { const a = act[name]; if (!a) return false; if (cur === a) { cur = null; } play(name, fade); a.time = from; a.paused = false; lock = 1e9; return true; };
    ch.free = (fade = 0.5) => { lock = 0; if (act.idle) { cur === act.idle ? 0 : play('idle', fade); } };
    void base;
  }).catch(e => { old.forEach(o => { o.visible = true; }); console.warn('GLB読み込み失敗(コード製キャラのまま):', spec.url, e); });
  return ch;
}

// 骨を動かしたあとの形の箱(base を基準の座標で)。base を省くと holder の親の座標
function posedBox(holder, base) {
  holder.updateMatrixWorld(true);
  const inv = base ? new THREE.Matrix4().copy(base.matrixWorld).invert() : (holder.parent ? new THREE.Matrix4().copy(holder.parent.matrixWorld).invert() : new THREE.Matrix4());
  const box = new THREE.Box3(), b = new THREE.Box3();
  holder.traverse(o => {
    if (!o.isMesh) return;
    if (o.isSkinnedMesh) { o.skeleton.update(); o.computeBoundingBox(); b.copy(o.boundingBox); }
    else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox); }
    box.union(b.applyMatrix4(o.matrixWorld).applyMatrix4(inv));
  });
  return box;
}

// SkeletonUtils.clone と同じ働き(three/examples の SkeletonUtils を使う)
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';

// 読み込み画面用: プレイヤー2人ぶんなど、まだ頼まれていないモデルも先に読み込んでおく

// 町のマスコット「チャンクくん」:動きの入った雲のGLB。移動中は Cloud_Crawl、止まっているときは Cloud_Idle をループ再生する
// (体のゆがみ・6本の足の動きもそのまま再生。人間用の動きの自動適用はしない。位置と向きは、ゲーム側が root で動かす)
const mascotModels = [], MORPH_GAIN = 2.5;
export function useChunkkunGlb(ch) {
  const old = ch.root.children.slice(); old.forEach(o => { o.visible = false; });
  load('models/chunkkun.glb', false).then(gltf => {
    const model = cloneSkinned(gltf.scene); toonify(model);
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    model.scale.setScalar(1.25 * SIZE_NOW.mascot); mascotModels.push(model);   // 足元は y=0、顔は +z(ゲームの前向き)
    ch.root.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const act = {}; for (const [k, n] of [['idle', 'Cloud_Idle'], ['crawl', 'Cloud_Crawl']]) { const c = THREE.AnimationClip.findByName(gltf.animations, n); if (c) act[k] = mixer.clipAction(c).setLoop(THREE.LoopRepeat, Infinity); }
    if (!act.idle && !act.crawl) { old.forEach(o => { o.visible = true; }); ch.root.remove(model); return; }
    let cur = null;
    const go = a => { if (!a || a === cur) return; a.reset().play(); if (cur) a.crossFadeFrom(cur, 0.25, false); cur = a; };
    go(act.idle || act.crawl);
    const morphs = []; model.traverse(o => { if (o.isMesh && o.morphTargetInfluences && o.morphTargetInfluences.length) morphs.push(o); });
    let wt = 0;
    let sk = 1;
    ch.update = (dt, speed) => {
      if (ch.snapScale) { sk = ch.rideScale || 1; ch.snapScale = false; }   // 物語: ぽんっと一瞬で大きさを変える
      sk += ((ch.rideScale || 1) - sk) * Math.min(1, dt * 3); model.scale.setScalar(1.25 * sk);   // 乗っている間は大きくなる(1人=2 / 2人=3)。ゆっくり変わる
      ch.scaleNow = sk;
      const mv = speed > 0.05; go(mv ? (act.crawl || act.idle) : (act.idle || act.crawl)); mixer.update(dt);
      wt += dt * (mv ? 3.2 : 1.9);   // ふくらみを大きく(動きの値を増幅)+待機中もずっとふわふわ(ゆっくりした波を重ねる)
      for (const m of morphs) { const a = m.morphTargetInfluences; for (let i = 0; i < a.length; i++) a[i] = a[i] * MORPH_GAIN + (Math.sin(wt - i * 1.7) * 0.5 + 0.5) * (mv ? 0.5 : 0.4); }
    };
  }).catch(() => { old.forEach(o => { o.visible = true; }); });
  return ch;
}
// 表を作るとき用(tools/gen_measure.mjs): 全員を、その場で測って glbMeasured に入れる
if (typeof window !== 'undefined') { window.__glbMeasured = glbMeasured; window.__glbLoadAll = () => Object.keys(GLB_MODELS).filter(id => !id.startsWith('paid:')).forEach(id => useGlb({ root: new THREE.Group(), update() { } }, id));   // 点検用: 町では出番の人だけ読むので、点検のときは全員を読む
  window.__glbMeasureAll = () => { window.__glbNoPre = true; const ids = Object.keys(GLB_MODELS).filter(id => !id.startsWith('paid:')); ids.forEach(id => useGlb({ root: new THREE.Group(), update() { } }, id)); return ids; }; }
export function glbPreload(ids) { for (const id of ids) { const m = GLB_MODELS[id]; if (m) load(m.url, false).catch(() => { }); } }
// 画面に出す準備(絵をGPUに送る・光り方を作る)を、1体ずつ間をあけて済ませる。町に入ってからのカクつきをなくす
export async function glbWarm(renderer, camera) {
  stat.now = 'えがく準備(色と光の計算)';
  for (const sc of readyScenes) {
    sc.traverse(o => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) for (const k of ['map', 'emissiveMap']) if (m && m[k]) { try { renderer.initTexture(m[k]); } catch (e) { } } });
    try { renderer.compile(sc, camera); } catch (e) { }
    await new Promise(r => requestAnimationFrame(() => r()));
  }
}
