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
  sora: { url: 'models/sora.glb', rotY: 0 },
  hana: { url: 'models/hana.glb', rotY: 0 },
};
// モデルの場所: town.js を読み込んだ場所の横の models/(1つのHTMLで動かすときは、ページの横の models/)。tarot・bgm と同じやり方
const SCRIPT_SRC = (() => { try { return (document.currentScript && document.currentScript.src) || ''; } catch (e) { return ''; } })();
const urlOf = u => { try { return SCRIPT_SRC ? new URL(u, SCRIPT_SRC).href : u; } catch (e) { return u; } };
const loader = new GLTFLoader();
const cache = new Map();
// 版の印(組み立てのときに作る models/versions.json)。読めなくても、印なしで読みに行く
let verP = null;
const versions = () => verP || (verP = fetch(urlOf('models/versions.json'), { cache: 'no-cache' }).then(r => (r.ok ? r.json() : {})).catch(() => ({})));
// モデルは、版(?v=)つきの名前でブラウザの保存場所(Cache API)に取っておく。2回目からはネットに取りに行かない。版が変わったときだけ入れ替える
const STORE = 'town-glb-v1';
async function fetchGlb(url) {
  let c = null;
  try { c = await caches.open(STORE); const hit = await c.match(url); if (hit) return await hit.arrayBuffer(); } catch (e) { c = null; }
  const r = await fetch(url); if (!r.ok) throw new Error('glb ' + r.status);
  if (c) { try { await c.put(url, r.clone()); const key = new URL(url, location.href).pathname; for (const k of await c.keys()) { const u = new URL(k.url); if (u.pathname === key && k.url !== new URL(url, location.href).href) await c.delete(k); } } catch (e) { } }
  return await r.arrayBuffer();
}
// 読みこみは2つずつ順番に(全員いっぺんに読むとスマホが重くなる)。プレイヤーを先に
const queue = []; let running = 0, CONC = 2; const stat = { total: 0, done: 0 }; const readyScenes = [];
export const glbStat = () => ({ ...stat });
export const setGlbConc = n => { CONC = n; pump(); };
const pump = () => { while (running < CONC && queue.length) { const j = queue.shift(); running++; j.run().finally(() => { running--; pump(); }); } };
const load = (url, first) => {
  if (!cache.has(url)) cache.set(url, new Promise((ok, ng) => {
    stat.total++; const job = { run: () => versions().then(v => { const f = url.split('/').pop(); return fetchGlb(urlOf(url) + (v[f] ? '?v=' + v[f] : '')); }).then(buf => new Promise((res, rej) => loader.parse(buf, '', res, rej))).then(g => { toonify(g.scene); readyScenes.push(g.scene); stat.done++; ok(g); }, e => { stat.done++; ng(e); }) };
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
export const SIZE_NOW = { npc: num('npcsize') || savedSz.npc || 2.0, player: num('playersize') || savedSz.player || 1.7 };
export function setGlbSize(k, v) {   // 「せってい」のつまみから。出ている全員の背が、その場で変わる
  SIZE_NOW[k] = v; try { localStorage.setItem(SZ_KEY, JSON.stringify({ npc: SIZE_NOW.npc, player: SIZE_NOW.player })); } catch (e) { }
  for (const g of glbChars) if (g.player === (k === 'player')) g.ch.setHeight(v);
}

export function useGlb(ch, id, { height } = {}) {
  if (!height) height = 1.3;   // 住人のふだんの背(プレイヤーは約1.65)
  const spec = GLB_MODELS[id]; if (!spec) return ch;
  // 読みこみ中は前のコード製の体を出さない(出てから入れかわると見苦しい)。失敗したときだけ戻す
  const old = ch.root.children.slice(); old.forEach(o => { o.visible = false; });
  const player = id.startsWith('player:');
  height = player ? SIZE_NOW.player : (height !== 1.3 ? height : SIZE_NOW.npc);   // 確認用の住人ごとの背(?npcsizes=1)だけは、そちらを優先
  load(spec.url, player).then(gltf => {
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
    const k = 1 / size.y; holder.scale.setScalar(k);   // ここでは背を1にそろえ、背の高さは外側(wrap)の大きさで決める
    const b2 = idleBox(), c = b2.getCenter(new THREE.Vector3());
    holder.position.set(-c.x, -b2.min.y, -c.z);
    // 動きごとの足元(歩くと腰が下がる、など)。動きを切りかえたら、その動きの足元に合わせて高さをなめらかに直す
    const footOf = new Map();
    for (const a of Object.values(act)) {
      const prev = holder.position.y; holder.position.y = 0;
      mixer.stopAllAction(); a.reset().play(); const dur = a.getClip().duration; let m = Infinity;
      for (let i = 0; i <= 40; i++) { a.time = dur * i / 40; mixer.update(0); m = Math.min(m, posedBox(holder).min.y); }
      a.stop(); holder.position.y = prev; footOf.set(a, -m);
    }
    mixer.stopAllAction(); if (act.idle) { act.idle.reset().play(); mixer.update(0); holder.position.y = footOf.get(act.idle); }
    const wrap = new THREE.Group(); wrap.add(holder); wrap.scale.setScalar(height);
    ch.root.add(wrap);
    ch.setHeight = h => { wrap.scale.setScalar(h); ch.height = h; };
    glbChars.add({ id, player, ch });
    // 点検用: いまの足元の高さ(地面=0 からのずれ)を測れるようにしておく
    // (高さを切りかえる途中ではなく、いまの動きで落ちついたときの高さで測る)
    (window.__glbFeet = window.__glbFeet || {})[id] = () => { const y = holder.position.y, ty = footOf.get(cur); if (ty !== undefined) holder.position.y = ty; ch.root.updateMatrixWorld(true); const b = posedBox(holder, ch.root); holder.position.y = y; return { foot: +b.min.y.toFixed(3), top: +b.max.y.toFixed(3) }; };;
    let cur = null, lock = 0;
    let prev = null, fadeT = 0;   // 切りかえ中は、前の動きと今の動きの、高いほうの足元に合わせる(まざった姿勢で沈まない)
    const play = (name, fade = 0.25) => {
      const a = act[name]; if (!a || cur === a) return;
      a.reset().fadeIn(fade).play(); if (cur) cur.fadeOut(fade); prev = cur; fadeT = fade; cur = a;
    };
    cur = act.idle || null; if (!cur) play('idle', 0);
    ch.height = height; ch.glb = true;
    const base = ch.update;
    ch.update = (dt, speed) => {
      if (lock > 0) lock -= dt;
      else play(act.run && (cur === act.run ? speed > 3.0 : speed > 4.2) ? 'run' : speed > 0.05 ? 'walk' : 'idle');   // 歩き⇔走りは少し幅をもたせる(行ったり来たりしない)
      if (cur === act.run) act.run.timeScale = Math.max(0.7, Math.min(1.4, speed / 5));
      if (cur === act.walk) act.walk.timeScale = Math.max(0.6, Math.min(1.6, speed / 2.2));
      mixer.update(dt);
      // 家の中などの「寝転ぶ」: あおむけに倒す(3Dの体には寝る動きがないので、向きだけ変える)
      const lie = ch.pose === 'lie'; if (lie !== !!ch._lie) { ch._lie = lie; wrap.rotation.x = lie ? -Math.PI / 2 : 0; wrap.position.set(0, lie ? 0.12 : 0, lie ? ch.height / 2 : 0); }
      if (fadeT > 0) fadeT -= dt;
      const ty = Math.max(footOf.get(cur) ?? -Infinity, fadeT > 0 && prev ? footOf.get(prev) ?? -Infinity : -Infinity); if (ty > -Infinity) holder.position.y += (ty - holder.position.y) * Math.min(1, dt * 8);
    };
    ch.wave = () => { if (act.wave) { play('wave', 0.2); lock = 3.2; } };
    ch.bow = () => { if (act.bow) { play('bow', 0.2); lock = 2.2; } };
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
export function glbPreload(ids) { for (const id of ids) { const m = GLB_MODELS[id]; if (m) load(m.url, false).catch(() => { }); } }
// 画面に出す準備(絵をGPUに送る・光り方を作る)を、1体ずつ間をあけて済ませる。町に入ってからのカクつきをなくす
export async function glbWarm(renderer, camera) {
  for (const sc of readyScenes) {
    sc.traverse(o => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) for (const k of ['map', 'emissiveMap']) if (m && m[k]) { try { renderer.initTexture(m[k]); } catch (e) { } } });
    try { renderer.compile(sc, camera); } catch (e) { }
    await new Promise(r => requestAnimationFrame(() => r()));
  }
}
