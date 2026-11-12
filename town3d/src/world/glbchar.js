// Mixamoリグ入りのGLB(ちびキャラ)を、makeCharacter と同じ使い方(root/height/update/wave)で動かす。
// 読み込み中・失敗時は、元のコード製キャラのまま動く(落ちない)。
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 住人id → モデル。rotY は「モデルの正面を +z に向ける」補正(ゆず・潮見さんは -x 向きで出てくる)
export const GLB_MODELS = {
  baron: { url: 'models/baron.glb', rotY: 0 },
  koharu: { url: 'models/koharu.glb', rotY: 0 },
  yuzu: { url: 'models/yuzu.glb', rotY: Math.PI / 2 },
  shiori: { url: 'models/shiori.glb', rotY: 0 },
  maru: { url: 'models/maru.glb', rotY: 0 },
  mii: { url: 'models/mii.glb', rotY: 0 },
  gon: { url: 'models/gon.glb', rotY: 0 },
  choco: { url: 'models/choco.glb', rotY: 0 },
  'player:ren': { url: 'models/player_ren.glb', rotY: 0 },   // プレイヤー(男の子)
  'player:mio': { url: 'models/player_mio.glb', rotY: 0 },   // プレイヤー(女の子)
  luna: { url: 'models/luna.glb', rotY: 0 },
  tetsu: { url: 'models/philosopher.glb', rotY: 0 },
  suna: { url: 'models/shiomi.glb', rotY: Math.PI / 2 },
};
// モデルの場所: town.js を読み込んだ場所の横の models/(1つのHTMLで動かすときは、ページの横の models/)。tarot・bgm と同じやり方
const SCRIPT_SRC = (() => { try { return (document.currentScript && document.currentScript.src) || ''; } catch (e) { return ''; } })();
const urlOf = u => { try { return SCRIPT_SRC ? new URL(u, SCRIPT_SRC).href : u; } catch (e) { return u; } };
const loader = new GLTFLoader();
const cache = new Map();
// 版の印(組み立てのときに作る models/versions.json)。読めなくても、印なしで読みに行く
let verP = null;
const versions = () => verP || (verP = fetch(urlOf('models/versions.json'), { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({})));
const load = url => {
  if (!cache.has(url)) cache.set(url, versions().then(v => { const f = url.split('/').pop(); return loader.loadAsync(urlOf(url) + (v[f] ? '?v=' + v[f] : '')); }));
  return cache.get(url);
};

export function useGlb(ch, id, { height } = {}) {
  if (!height) height = 1.3;   // 住人のふだんの背(プレイヤーは約1.65)
  const spec = GLB_MODELS[id]; if (!spec) return ch;
  load(spec.url).then(gltf => {
    // 同じモデルを複数体出してもいいように、骨ごと複製する
    const model = cloneSkinned(gltf.scene);
    const holder = new THREE.Group(); holder.rotation.y = spec.rotY; holder.add(model);
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(model);
    const clip = n => gltf.animations.find(a => a.name === n);
    const act = {}; for (const [k2, n] of [['idle', 'Breathing Idle'], ['walk', 'Standard Walk'], ['bow', 'Quick Formal Bow'], ['wave', 'Waving'], ['run', 'Standard Run']]) { const c = clip(n); if (c) act[k2] = mixer.clipAction(c); }
    for (const k2 of ['bow', 'wave']) if (act[k2]) { act[k2].setLoop(THREE.LoopOnce, 1); act[k2].clampWhenFinished = true; }
    // 大きさと足元は「待機の姿勢で骨を動かした形」で測る(骨を動かす前の形で測ると、足が地面に埋まる)
    // 待機の動きを何コマか見て、いちばん低い足元・いちばん高い頭で測る(動きの途中で沈まないように)
    const idleBox = () => {
      if (!act.idle) return posedBox(holder);
      act.idle.play(); const dur = act.idle.getClip().duration, all = new THREE.Box3();
      for (let i = 0; i <= 8; i++) { act.idle.time = dur * i / 8; mixer.update(0); all.union(posedBox(holder)); }
      act.idle.time = 0; mixer.update(0); return all;
    };
    const box = idleBox(), size = box.getSize(new THREE.Vector3());
    const k = height / size.y; holder.scale.setScalar(k);
    const b2 = idleBox(), c = b2.getCenter(new THREE.Vector3());
    holder.position.set(-c.x, -b2.min.y, -c.z);
    // 動きごとの足元(歩くと腰が下がる、など)。動きを切りかえたら、その動きの足元に合わせて高さをなめらかに直す
    const footOf = new Map();
    for (const a of Object.values(act)) {
      const prev = holder.position.y; holder.position.y = 0;
      mixer.stopAllAction(); a.reset().play(); const dur = a.getClip().duration; let m = Infinity;
      for (let i = 0; i <= 12; i++) { a.time = dur * i / 12; mixer.update(0); m = Math.min(m, posedBox(holder).min.y); }
      a.stop(); holder.position.y = prev; footOf.set(a, -m);
    }
    mixer.stopAllAction(); if (act.idle) { act.idle.reset().play(); mixer.update(0); holder.position.y = footOf.get(act.idle); }
    const wrap = new THREE.Group(); wrap.add(holder);
    ch.root.children.slice().forEach(o => { o.visible = false; });   // コード製の体は隠す
    ch.root.add(wrap);
    // 点検用: いまの足元の高さ(地面=0 からのずれ)を測れるようにしておく
    (window.__glbFeet = window.__glbFeet || {})[id] = () => { ch.root.updateMatrixWorld(true); const b = posedBox(holder, ch.root); return { foot: +b.min.y.toFixed(3), top: +b.max.y.toFixed(3) }; };;
    let cur = null, lock = 0;
    const play = (name, fade = 0.25) => {
      const a = act[name]; if (!a || cur === a) return;
      a.reset().fadeIn(fade).play(); if (cur) cur.fadeOut(fade); cur = a;
    };
    cur = act.idle || null; if (!cur) play('idle', 0);
    ch.height = height; ch.glb = true;
    const base = ch.update;
    ch.update = (dt, speed) => {
      if (lock > 0) lock -= dt;
      else play(speed > 3.6 && act.run ? 'run' : speed > 0.05 ? 'walk' : 'idle');
      if (cur === act.run) act.run.timeScale = Math.max(0.7, Math.min(1.4, speed / 5));
      if (cur === act.walk) act.walk.timeScale = Math.max(0.6, Math.min(1.6, speed / 2.2));
      mixer.update(dt);
      const ty = footOf.get(cur); if (ty !== undefined) holder.position.y += (ty - holder.position.y) * Math.min(1, dt * 8);
    };
    ch.wave = () => { if (act.wave) { play('wave', 0.2); lock = 3.2; } };
    ch.bow = () => { if (act.bow) { play('bow', 0.2); lock = 2.2; } };
    void base;
  }).catch(e => console.warn('GLB読み込み失敗(コード製キャラのまま):', spec.url, e));
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
