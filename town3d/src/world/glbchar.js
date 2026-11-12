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
  luna: { url: 'models/luna.glb', rotY: 0 },
  philosopher: { url: 'models/philosopher.glb', rotY: 0 },
  shiomi: { url: 'models/shiomi.glb', rotY: Math.PI / 2 },
};
const loader = new GLTFLoader();
const cache = new Map();
const load = url => { if (!cache.has(url)) cache.set(url, loader.loadAsync(url)); return cache.get(url); };

export function useGlb(ch, id, { height = 1.3 } = {}) {
  const spec = GLB_MODELS[id]; if (!spec) return ch;
  load(spec.url).then(gltf => {
    // 同じモデルを複数体出してもいいように、骨ごと複製する
    const model = cloneSkinned(gltf.scene);
    const holder = new THREE.Group(); holder.rotation.y = spec.rotY; holder.add(model);
    const box = new THREE.Box3().setFromObject(holder), size = box.getSize(new THREE.Vector3());
    const k = height / size.y; holder.scale.setScalar(k);
    box.setFromObject(holder); const c = box.getCenter(new THREE.Vector3());
    holder.position.set(-c.x, -box.min.y, -c.z);
    const wrap = new THREE.Group(); wrap.add(holder);
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    ch.root.children.slice().forEach(o => { o.visible = false; });   // コード製の体は隠す
    ch.root.add(wrap);
    const mixer = new THREE.AnimationMixer(model);
    const clip = n => gltf.animations.find(a => a.name === n);
    const act = {}; for (const [k2, n] of [['idle', 'Breathing Idle'], ['walk', 'Standard Walk'], ['bow', 'Quick Formal Bow'], ['wave', 'Waving']]) { const c = clip(n); if (c) act[k2] = mixer.clipAction(c); }
    for (const k2 of ['bow', 'wave']) if (act[k2]) { act[k2].setLoop(THREE.LoopOnce, 1); act[k2].clampWhenFinished = true; }
    let cur = null, lock = 0;
    const play = (name, fade = 0.25) => {
      const a = act[name]; if (!a || cur === a) return;
      a.reset().fadeIn(fade).play(); if (cur) cur.fadeOut(fade); cur = a;
    };
    play('idle', 0);
    ch.height = height; ch.glb = true;
    const base = ch.update;
    ch.update = (dt, speed) => {
      if (lock > 0) lock -= dt;
      else play(speed > 0.05 ? 'walk' : 'idle');
      if (cur === act.walk) act.walk.timeScale = Math.max(0.6, Math.min(1.6, speed / 2.2));
      mixer.update(dt);
    };
    ch.wave = () => { if (act.wave) { play('wave', 0.2); lock = 3.2; } };
    ch.bow = () => { if (act.bow) { play('bow', 0.2); lock = 2.2; } };
    void base;
  }).catch(e => console.warn('GLB読み込み失敗(コード製キャラのまま):', spec.url, e));
  return ch;
}

// SkeletonUtils.clone と同じ働き(three/examples の SkeletonUtils を使う)
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
