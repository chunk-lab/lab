// ほしみや町:公開 API は mount(要素, 設定) → { unmount, ... } だけ
import * as THREE from 'three';
import { createBus, createStorage, createWallet, angleLerp, clamp } from './core/core.js';
import { createAppHost } from './core/apps.js';
import { createLocalNet, createWsNet } from './core/net.js';
import { createAudio } from './core/audio.js';
import { createAI, buildSystem } from './core/ai.js';
import { openAiSetup, openChat } from './ui/aiui.js';
import { openSoraNote } from './ui/sora.js';
import { openPianoMenu, playSong, runTapGame } from './ui/piano.js';
import { SONGS } from './world/songs.js';
import { furn } from './game/furniture.js';
import { openOgiri } from './ui/ogiri.js';
import { createEnv } from './world/env.js';
import { buildCity } from './world/city.js';
import { buildAmbient } from './world/ambient.js';
import { rollPose, rollReset, makeCharacter, LOOKS, LOOK_IDS, setCharOutline } from './world/character.js';
import { setBuildingOutline, eachFoliage, eachTex } from './world/kit.js';
import { createSeasons, SEASONS, seasonOf } from './world/seasons.js';
import { createSnowballs } from './world/snowballs.js';
import { createSnowBattle } from './world/snowbattle.js';
import { createSport } from './world/sport.js';
import { createResidents, period, findPath, nearestNode } from './game/npc.js';
import { createInput } from './game/input.js';
import { createHud, CSS } from './ui/hud.js';
import { APPS } from './apps/registry.js';
import { openFinder } from './ui/finder.js';
import { openNotes } from './ui/notes.js';
import { snapCanvas, shotCard, flash, photos } from './game/photos.js';
import { createFireworks, FW_TYPES, FW_SHOWS, FW_CENTER } from './world/fireworks.js';
import { createSchedule, EVENT_KINDS } from './world/events.js';

let styleRefs = 0;
const VERSION = '0.1.0';

export function mount(container, opt = {}) {
  const bus = createBus();
  const storage = opt.storage || createStorage(opt.storagePrefix || 'town:');
  const settings = Object.assign({ quality: matchMedia('(pointer:coarse)').matches ? 'mid' : 'high', timeSpeed: 1, adult: 0, birth: '', en: 0, enLevel: 'easy', tips: 1, look: 'mio', name: '', bgm: 0.5, sfx: 0.7 }, storage.get('settings') || {});
  const save = () => storage.set('settings', settings);
  const wallet = opt.wallet || createWallet(storage, bus);   // 組み込み先から共通の財布を渡せる(2Dと3Dで同じコイン)
  const ai = createAI(storage);
  const PERIOD = { morning: '朝', day: '昼', evening: '夕方', night: '夜' };
  const audio = createAudio(); audio.set({ bgm: settings.bgm, sfx: settings.sfx });
  const offs = [];
  const on = (t, e, f, o) => { t.addEventListener(e, f, o); offs.push(() => t.removeEventListener(e, f, o)); };

  // ---- DOM ----
  if (styleRefs++ === 0) { const s = document.createElement('style'); s.dataset.town = ''; s.textContent = CSS; document.head.appendChild(s); }
  const root = document.createElement('div'); root.className = 'tw-root'; container.appendChild(root);
  const renderer = new THREE.WebGLRenderer({ antialias: settings.quality === 'high', powerPreference: 'high-performance' });
  renderer.domElement.className = 'tw-canvas';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = settings.quality !== 'low';
  renderer.shadowMap.type = THREE.PCFShadowMap;
  root.appendChild(renderer.domElement);
  const applyQuality = () => {
    const lite = !!settings.lite;   // 低負荷モード:解像度・影・光のにじみ・ふちどり・噴水・月をかるくする
    renderer.setPixelRatio(Math.min(devicePixelRatio, lite ? 0.75 : settings.quality === 'high' ? 2 : settings.quality === 'mid' ? 1.25 : 1));
    renderer.shadowMap.enabled = lite || settings.quality !== 'low';
    env.setShadows(lite || settings.quality !== 'low', lite ? 512 : settings.quality === 'high' ? 2048 : 1024);
    setFx(settings.quality === 'high' && !lite); resize?.();
    setCharOutline(!lite); setBuildingOutline(!lite); city.setLite(lite); env.setLite(lite); hud.setLite(lite);
    scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  };

  // ---- 世界 ----
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.2, 600);

  // 仕上げの光(ブルーム)。「きれい」画質のときだけ。夜の窓・街灯・ネオンがやわらかくにじむ
  let fx = null;
  const setFx = on => {
    if (on && !fx) {
      try {
        const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
        const composer = new EffectComposer(renderer, rt);
        composer.addPass(new RenderPass(scene, camera));
        const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.3, 0.6, 1.5);
        composer.addPass(bloom); composer.addPass(new OutputPass());
        fx = { composer, bloom };
      } catch (e) { fx = null; }
    } else if (!on && fx) { fx.composer.dispose(); fx = null; }
  };
  const env = createEnv(scene, { shadows: settings.quality !== 'low' });
  let fwBoomT = 0;
  const fw = createFireworks(scene, { onBoom: (t, sc) => { if (t === 'dai') { audio.play('bigboom'); return; } if (t === 'mini') { if (Math.random() < 0.3) audio.play('boom', sc); return; } audio.play('boom', sc); } });
  env.hour = opt.hour ?? storage.get('hour') ?? 10;
  env.speed = settings.timeSpeed / 60;
  const _d = new Date(), _md = (_d.getMonth() + 1) * 100 + _d.getDate();
  const blossom = opt.blossom ?? (_md >= 325 && _md <= 420);   // 桜は春(3/25〜4/20)だけ
  const city = buildCity(scene, { quality: settings.quality, blossom });
  const ambient = buildAmbient(scene, city, { quality: settings.quality, blossom });
  let blossomOn = blossom, testDate = new Date();
  const setBlossom = on => { blossomOn = on; city.setBlossom(on); ambient.setBlossom(on); };
  const seasons = createSeasons(scene, { eachFoliage, eachTex, trees: city.trees, groundMats: city.groundMats, colliders: city.colliders, storage });
  const curSeason = () => settings.season && settings.season !== 'auto' ? settings.season : seasonOf();
  const applySeason = () => { const s = curSeason(); seasons.set(s); setBlossom(opt.blossom ?? s === 'spring'); };
  const applyDate = d => { testDate = d; env.setMoonDate(d); const md = (d.getMonth() + 1) * 100 + d.getDate(); setBlossom(opt.blossom ?? (md >= 325 && md <= 420)); };
  applySeason();
  const residents = createResidents(scene, city.graph, () => env.hour, (x, z, r) => collide(x, z, r));
  // 町の雪玉(冬だけ)
  const NPC_SNOW = { mii: ['ひゃっ、つめたい〜! もう、やりましたね〜', 1], baron: ['ぬおっ! わが輩に雪玉とは、いい度胸だ!', 2], gon: ['つめてっ! やったな〜!', 3], koharu: ['きゃっ! ふふ、元気ですね', 1], shiori: ['……つめたい。……おかえし、しましょうか', 2], suna: ['おやおや、冷たいねえ', 2], maru: ['うわっ! まいったな〜!', 2], yuzu: ['ひゃっ! び、びっくりしたです', 1], chunkkun: ['ふわっ!? 雪だ〜!', 1] };
  const snow = createSnowballs(scene, {
    camera, meshes: city.meshes, residents,
    getHand: () => snow.making ? new THREE.Vector3(me.x + Math.sin(me.ry) * 0.5, 0.2, me.z + Math.cos(me.ry) * 0.5) : new THREE.Vector3(me.x + Math.sin(me.ry) * 0.38 + Math.cos(me.ry) * 0.22, 1.05, me.z + Math.cos(me.ry) * 0.38 - Math.sin(me.ry) * 0.22),
    onNpcHit(r) {
      const [line, lv] = NPC_SNOW[r.def.id] || ['わっ! つめたい!', 2];
      audio.play('wave'); hud.say('npc:' + r.def.id, line, 3);
      if (battle.active) return;
      setTimeout(() => { if (!started || hud.busy || appHost.current || battle.active) return; hud.dialog({ name: r.def.name, role: r.def.role, text: `${line} 雪合戦で勝負する?`, choices: [{ label: '⛄ ここで勝負!(2対2)', fn: () => battle.start(r, lv) }, { label: '🎮 チャンクボックス版で', fn: () => openApp('snowfight', { npc: { id: r.def.id, name: r.def.name, lv } }) }, { label: 'やめておく', fn: () => { } }] }); }, 1100);
    },
  });

  // ---- 自分 ----
  const me = { id: storage.get('pid') || 'p' + Math.random().toString(36).slice(2, 10), x: 0, z: 13, ry: Math.PI, speed: 0, ch: null };
  let sport = null;   // 季節のスポーツ(ゴルフ・フリスビー)
  // 3Dの雪合戦(町のその場で 2×2)
  const battle = createSnowBattle({
    faceCam: (x, z, ry) => { cam.yaw = ry + Math.PI; cam.x = x; cam.z = z; cam.pitch = 0.3; cam.dist = 7; },   // ほぼ真うしろから(雪合戦中は高さ固定)
    scene, camera, root, me, residents, meshes: city.meshes, collide: (x, z) => collide(x, z), audio, snowFx: (p, n, s) => snow.fx(p, n, s),
    onEnd({ win, quit, opp }) {
      actSport(null);
      if (quit) { if (!goHome()) hud.toast('雪合戦をやめた'); return; }
      setTimeout(() => hud.dialog({ name: opp?.def.name || '雪合戦', text: win ? 'まいった〜! 強いね。' : 'へへっ、こっちの勝ち! また勝負しよう', choices: [{ label: 'もう一回!', fn: () => opp && battle.start(opp, 2) }, { label: backHome ? '🏠 家にもどる' : 'おわる', fn: () => goHome() }] }), 300);
    },
  });  sport = createSport({
    scene, camera, root, me, city, collide: (x, z, r) => collide(x, z, r), audio, wallet, toast: t => hud.toast(t),
    getYaw: () => cam.yaw, setYaw: y => { cam.yaw = y; },
    onEnd({ kind, quit, total, par }) { actSport(null); if (goHome()) return; if (quit) hud.toast(kind === 'golf' ? 'ゴルフをやめた' : 'フリスビーをやめた'); },
  });
  // 英語でのおしゃべりだけ「勉強」。日本語のときは何もしない(街でまったりのまま)。最後に話してから2分で終わり
  let chatT = 0;
  bus.on('chat:say', ({ text }) => {
    const en = (String(text).match(/[A-Za-z]/g) || []).length, ja = (String(text).match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length;
    if (en < 4 || en < ja) return;
    opt.onEvent?.('app:event', { name: 'act', data: { layer: 'chat', cat: 'study', label: '英語のおしゃべり' } });
    clearTimeout(chatT); chatT = setTimeout(() => opt.onEvent?.('app:event', { name: 'act', data: { layer: 'chat', cat: null } }), 120000);
  });
  const actSport = (label) => opt.onEvent?.('app:event', { name: 'act', data: { layer: 'sub', cat: label ? 'sport' : null, label } });   // 季節のスポーツの時間を記録(1日の記録)
  { const b0 = battle.start; battle.start = (...a) => { actSport('雪合戦'); return b0(...a); }; }
  { const s0 = sport.start; sport.start = (k, o) => { markPlay(k); actSport(k === 'golf' ? 'ミニゴルフ' : 'フリスビー'); return s0(k, o); }; }   // 最後に遊んだ日を記録(しばらく遊んでいないものに、さそう)

  storage.set('pid', me.id);
  const last = storage.get('pos'); if (last) { me.x = last[0]; me.z = last[1]; }
  function setLook(id) {
    if (me.ch) scene.remove(me.ch.root);
    me.ch = makeCharacter(LOOKS[id] || LOOKS.mio);
    scene.add(me.ch.root);
  }
  // 自分のキャラは れん(男の子)・みお(女の子)の2人だけ。はな・そらは住人になったので、前に選んでいた人は近いほうへ
  if (!LOOK_IDS.includes(settings.look)) { const was = settings.look, nw = was === 'sora' ? 'ren' : 'mio'; if (!settings.name || settings.name === (LOOKS[was] || {}).name) settings.name = settings.name ? LOOKS[nw].name : settings.name; settings.look = nw; save(); }
  setLook(settings.look);

  const hud = createHud(root, bus);
  const gemsNow = () => (opt.gems ? opt.gems.get() : null);   // ダイヤ(組み込み先があるときだけ表示)
  const appHost = createAppHost({ paramsFor: (id, p) => id === 'home' ? (medalCheck(), { ...(p || {}), guest: hanaGuest() }) : id === 'gamebox' || id === 'amuse' || id === 'snowfight' ? { ...(p || {}), season: curSeason(), guest: hanaGuest() } : id === 'fishing' ? { ...(p || {}), hour: env.hour, season: curSeason(), rain: !!(env.weather && env.weather.rain > 0.2) } : p, root, bus, storage, wallet, getPlayer: () => ({ id: me.id, name: settings.name, look: settings.look }), getAudio: () => audio.get(), getNotes: () => notes.map(n => ({ ...n })), features: opt.features || [], gems: opt.gems || null, house: opt.house || null, photo: opt.photo || null, member: { paid: () => !!(opt.member?.paid?.()) || isBirthMonth(), birthday: () => isBirthMonth() }, dictUrl: opt.dictUrl || null, learn: opt.learn || null });
  APPS.forEach(a => appHost.register(a));
  (opt.apps || []).forEach(a => appHost.register(a)); // 組み込み先から足すアプリ
  { // 運営用:町から直接「英語の釣り堀」を開くボタン(?admin=1 で出る)
    let adm = false; try { const q = new URLSearchParams(location.search).get('admin'); if (q === '1') localStorage.setItem('cs:core:admin', 'true'); else if (q === '0') localStorage.removeItem('cs:core:admin'); adm = JSON.parse(localStorage.getItem('cs:core:admin')) === true; } catch (e) { }
    if (adm) { const b = document.createElement('button'); b.className = 'tw-btn'; b.textContent = '🛠🎣 英語の釣り堀'; b.style.cssText = 'position:absolute;left:12px;bottom:calc(124px + var(--tw-bot));z-index:5;font-weight:800'; b.onclick = () => { if (!started || appHost.current || hud.busy) return; openApp('fishing', { tab: 'en' }); }; root.append(b); const tg = setInterval(() => { b.style.display = (!started || appHost.current || hud.busy) ? "none" : ""; }, 400); offs.push(() => clearInterval(tg)); }
  }
  hud.setCoins(wallet.get(), gemsNow());
  if (opt.gems) { const gi = setInterval(() => hud.setCoins(wallet.get(), gemsNow()), 1500); offs.push(() => clearInterval(gi)); }

  // ---- 他のプレイヤー ----
  const peers = new Map();
  const net = opt.net === 'none' ? null : opt.net && typeof opt.net === 'object' ? opt.net : opt.netUrl ? createWsNet(opt.netUrl, opt.room) : createLocalNet({ graph: city.graph, looks: LOOK_IDS.map(k => LOOKS[k]) });
  if (net) {
    net.on('join', p => {
      if (peers.has(p.id)) return;
      const ch = makeCharacter(typeof p.look === 'string' ? LOOKS[p.look] || LOOKS.ren : p.look || LOOKS.ren);
      ch.root.position.set(p.x ?? 0, 0, p.z ?? 0); scene.add(ch.root);
      peers.set(p.id, { ch, tx: p.x ?? 0, tz: p.z ?? 0, ry: 0, mv: 0, name: p.name });
      hud.tag(p.id, p.name || 'だれか');
    });
    net.on('leave', p => { const q = peers.get(p.id); if (q) { scene.remove(q.ch.root); peers.delete(p.id); hud.untag(p.id); } });
    net.on('state', s => { const q = peers.get(s.id); if (q) { q.tx = s.x; q.tz = s.z; q.ry = s.ry; q.mv = s.mv; } });
    net.on('say', s => hud.say(s.id, s.text));
    net.on('emote', s => peers.get(s.id)?.ch.wave());
  }
  residents.list.forEach(r => hud.tag('npc:' + r.def.id, r.def.name));

  // ---- 入力と会話 ----
  let focus = null, talkingTo = null, started = false;
  const input = createInput(root, { onAction: () => doAction() });

  // ---- ベンチにすわる ----
  let seat = null;
  function sitOnBench(b0) {
    // 背もたれがないので、立っている側を向いてすわる(前からでも後ろからでも)
    const fx = Math.sin(b0.ry), fz = Math.cos(b0.ry), back = (me.x - b0.x) * fx + (me.z - b0.z) * fz < 0;
    const b = { x: b0.x, z: b0.z, ry: back ? b0.ry + Math.PI : b0.ry };
    const c = Math.cos(b.ry), s = Math.sin(b.ry), dx = me.x - b.x, dz = me.z - b.z;
    const hana = residents.list.find(x => x.def.companion && x.follow && !x.pin);
    let lx = Math.max(-0.55, Math.min(0.55, dx * c - dz * s)); const lz = -0.02;
    if (hana) lx = -0.36;   // はなちゃんと2人で:はなちゃんは左どなり
    me.x = b.x + lx * c + lz * s; me.z = b.z - lx * s + lz * c; me.ry = b.ry; me.speed = 0;
    seat = { b }; me.ch.pose = 'sit'; input.clear();
    if (hana) {
      const hx = 0.36; hana.pin = { x: b.x + hx * c + lz * s, z: b.z - hx * s + lz * c, y: -0.04, ry: b.ry, pose: 'sit', bench: true };
      seat.hana = hana; say1(hana, hana.def.id === 'sora' ? ['ふぅ、ちょっと休もうか', 'ここ、いい場所だよな'] : ['ふぅ〜、ちょっと休けい!', 'ここ、すわり心地いいね', 'となり、いい?'], 3);
    }
  }
  const benchSit = () => `いま「${settings.name || 'あなた'}」と、${city.areaName(me.x, me.z)}のベンチにならんですわって、手をつないでいる。`;
  function standFromSeat() {
    if (!seat) return; const b = seat.b, h = seat.hana; seat = null; me.ch.pose = null;
    [me.x, me.z] = collide(b.x + Math.sin(b.ry) * 1.1, b.z + Math.cos(b.ry) * 1.1);
    if (h && h.pin && h.pin.bench) { h.pin = null; h.ch.pose = null; h.ch.root.position.set(me.x + Math.cos(me.ry) * 0.62, 0, me.z - Math.sin(me.ry) * 0.62); h.hold = false; h.reT = 0.5; }
  }
  function doAction() {
    if (!started || appHost.current || hud.busy || !focus) return;
    audio.unlock();
    if (focus.kind === 'stand') { standFromSeat(); return; }
    if (focus.kind === 'benchtalk') { const r = seat.hana; if (!ai.ready) { openAiSetup({ hud, ai, onDone: () => freeChat(r, 'ねえねえ、なに話す?', benchSit(), true) }); return; } freeChat(r, ['ねえねえ、なに話す?', 'のんびりするの、いいね〜', 'ここ、風が気持ちいいね'][Math.floor(Math.random() * 3)], benchSit(), true); return; }
    if (focus.kind === 'bench') { sitOnBench(focus); return; }
    if (focus.kind === 'piano') { pianoMenu(); return; }
    if (focus.kind === 'spot' && focus.id === 'board' && (seasons.season === 'spring' || seasons.season === 'autumn') && !battle.active && !sport.active) {   // 春・秋は、掲示板からゴルフ/フリスビーに出る
      const k = seasons.season === 'spring' ? 'golf' : 'frisbee';
      hud.dialog({ name: 'ほし広場の掲示板', text: k === 'golf' ? '⛳ きょうのミニゴルフコース(5ホール)が貼り出されている。町じゅうがコースだ!' : '🥏 きょうのフリスビーコース(5ホール)が貼り出されている。町じゅうがコースだ!', choices: [{ label: k === 'golf' ? '⛳ ゴルフに出る' : '🥏 フリスビーに出る', fn: () => sport.start(k) }, { label: '📋 お知らせを見る', fn: () => openApp('board', { from: 'board' }) }] });
      return;
    }
    if (focus.kind === 'sport') { if (!battle.active && !sport.active) sport.start(focus.what); return; }
    if (focus.kind === 'mksnow') { const f = seasons.build(me.x + Math.sin(me.ry) * 1.7, me.z + Math.cos(me.ry) * 1.7); if (f) { audio.play('open'); hud.toast('ころころ…雪だるまができた！'); } return; }
    if (focus.kind === 'snowman') { if (seasons.lift(focus.idx)) { audio.play('open'); hud.toast('雪だるまを持った(もういちど押すと置く)'); } return; }
    if (focus.kind === 'putsnow') { const f = seasons.put(me.x + Math.sin(me.ry) * 1.7, me.z + Math.cos(me.ry) * 1.7); if (f) { audio.play('close'); hud.toast('雪だるまを置いた'); } return; }
    if (focus.kind === 'npc') {
      const near = nearNpcs();
      if (near.length >= 2) {   // 団子のときは、だれと話すか選べる
        hud.dialog({ name: 'ちかくの人', text: 'だれと話す?', choices: near.map(r => ({ label: r.def.name, fn: () => talkTo(r) })) });
      } else talkTo(focus.ref);
    } else if (focus.app) openApp(focus.app, { from: focus.id });
    else if (focus.msg) hud.dialog({ name: focus.name, text: focus.msg });
  }
  function nearNpcs() {
    return residents.list.filter(r => r.ch.root.visible).map(r => ({ r, d: Math.hypot(r.ch.root.position.x - me.x, r.ch.root.position.z - me.z) })).filter(o => o.d < 2.8).sort((a, b) => a.d - b.d).map(o => o.r);
  }
  function talkTo(r) {
    input.clear(); r.talking = true; talkingTo = r;
    audio.play('talk');
    let text = residents.lineFor(r, env.hour);
    if (r.def.angler && seasons.season !== 'summer') text = 'のんびり釣りは夏だけのお楽しみでねえ。英語の釣り堀なら、いつでも池においで。';
    if (r.def.companion && r.follow) text = (r.def.id === 'sora' ? ['ん? どうした?', 'なに?', 'おう、どうした?'] : ['なになに?', 'どうしたの?', 'ん? よんだ?'])[Math.floor(Math.random() * 3)];
    const choices = (r.def.menu || []).filter(m => !m.season || m.season === seasons.season).map(m => ({ label: m.act === 'follow' && r.follow ? 'ここでバイバイ' : m.label, fn: () => { if (m.act) return doAct(r, m); openApp(m.app, m.params); if (m.app === 'fishing') { const off = bus.on('app:close', () => { off(); setTimeout(() => { if (!appHost.current && !hud.busy && started) talkTo(r); }, 450); }); } } }));   // 釣りから出たら、砂吹さんとの会話にもどる
    if (r.def.id === 'sora' && r.follow) choices.unshift({ label: ai.ready ? 'おしゃべりする' : 'AIでおしゃべり(設定)', fn: () => { if (ai.ready) freeChat(r, text); else openAiSetup({ hud, ai, onDone: () => freeChat(r, text) }); } });
    if (r.def.id !== 'sora') choices.push({ label: ai.ready ? 'おしゃべりする' : 'AIでおしゃべり(設定)', fn: () => { r.talking = true; talkingTo = r; if (ai.ready) startChat(r, text); else openAiSetup({ hud, ai, onDone: () => startChat(r, text) }); } });   // キー設定の画面を出している間も、住人はその場にいる
    hud.dialog({ name: r.def.name, role: r.def.role, text, choices });
    bus.emit('talk', { npc: r.def.id });
  }
  // ---- ことばノート(英語の単語・フレーズ・文を集める。この端末の中だけに保存) ----
  const esc2 = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const notes = storage.get('notes') || [];
  const saveNotes = () => { storage.set('notes', notes); bus.emit('notes', { count: notes.length }); };
  async function fillMeaning(n) {
    if (n.kind === 'sentence' || n.meaning || n.pending || !ai.ready) return;
    n.pending = true;
    try { n.meaning = await ai.explain(n.text, n.sentence); } catch (_) {} finally { n.pending = false; saveNotes(); }
  }
  function addNote({ kind, text, sentence, npc, meaning }) {
    const key = text.trim().toLowerCase(), hit = notes.find(n => n.kind === kind && n.text.toLowerCase() === key);
    if (hit) { hit.count = (hit.count || 1) + 1; hit.npc = npc; saveNotes(); return `「${text}」をもう一度ほぞん(×${hit.count})`; }
    const n = { id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind, text: text.trim(), sentence, npc, date: new Date().toLocaleDateString('ja-JP'), count: 1, meaning: meaning || '' };
    notes.push(n); saveNotes(); fillMeaning(n);
    opt.onEvent?.('note', { kind, text: n.text, meaning: n.meaning, npc });   // 組み込み先の勉強ノートにも入れる
    return `「${text}」をノートに入れたよ`;
  }
  function openNoteBook() {
    if (!started || appHost.current || hud.busy) return;
    input.clear(); audio.play('tap');
    openNotes({
      hud, getNotes: () => notes,
      onDelete: id => { const i = notes.findIndex(n => n.id === id); if (i >= 0) { notes.splice(i, 1); saveNotes(); } },
      onMeaning: async id => { const n = notes.find(x => x.id === id); if (n) await fillMeaning(n); },
    });
  }

  // ---- すれ違いざまの、英語ひとこと(日本語のヒント。キャラごとに決まったセリフを使いまわす) ----
  let tipCool = 20 + Math.random() * 20;
  const tipCoolNpc = {};
  function tipUpdate(dt) {
    tipCool -= dt;
    for (const k in tipCoolNpc) tipCoolNpc[k] -= dt;
    if (!settings.tips || tipCool > 0 || hud.busy || appHost.current || !started) return;
    for (const r of residents.list) {
      const tips = r.def.tips; if (!tips || !r.ch.root.visible || r.talking || r.speed < 0.3 || (tipCoolNpc[r.def.id] || 0) > 0) continue;
      if (Math.hypot(r.ch.root.position.x - me.x, r.ch.root.position.z - me.z) > 3.2) continue;
      r.tipIdx = ((r.tipIdx ?? Math.floor(Math.random() * tips.length)) + 1 + Math.floor(Math.random() * 2)) % tips.length;
      hud.say('npc:' + r.def.id, tips[r.tipIdx], 5);
      tipCool = 40 + Math.random() * 60; tipCoolNpc[r.def.id] = 180;
      break;
    }
  }
  // ---- おとなトーク(18歳以上の自己申告)。きわどい冗談や本音の会話をAIにゆるす。性的な描写などは、いつも禁止 ----
  const ageOf = ds => { const b = new Date(ds); if (isNaN(b)) return -1; const n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; };
  const ageOk = () => !!settings.birth && ageOf(settings.birth) >= 18;
  function openAdultSetup() {
    const pn = hud.panel(`<h2>おとなトーク</h2>
      <p class="tw-note">18歳以上の人だけが使えます。オンにすると、住人が(キャラの性格に合う範囲で)ブラックジョークや皮肉、お酒・恋愛、ライトなお色気トークなどにも乗ります。ただし、露骨な性描写や、暴力・差別・違法行為のくわしい話は、いつもしません。ゆず(見習い)とチャンクくんは、この設定とは関係なく、いつもの会話です。</p>
      <p class="tw-note">生年月日はこの端末の中だけに保存して、どこにも送りません。年齢の確認はできないので、自己申告です。</p>
      <div class="tw-row">生年月日<span class="tw-bd" style="display:flex;gap:6px;align-items:center"><input class="tw-by" inputmode="numeric" maxlength="4" placeholder="1990" style="width:4.2em;font-size:16px;text-align:center"> 年 <input class="tw-bm" inputmode="numeric" maxlength="2" placeholder="5" style="width:2.6em;font-size:16px;text-align:center"> 月 <input class="tw-bdd" inputmode="numeric" maxlength="2" placeholder="1" style="width:2.6em;font-size:16px;text-align:center"> 日</span></div>
      <p class="tw-note tw-adult-msg">いまは ${settings.adult && ageOk() ? 'オン' : 'オフ'} です。</p>
      <div class="tw-actions"><button class="tw-btn main" data-ad="on">オンにする</button><button class="tw-btn" data-ad="off">オフにする</button><button class="tw-btn" data-ad="close">とじる</button></div>`);
    const msg = pn.querySelector('.tw-adult-msg'), iy = pn.querySelector('.tw-by'), im = pn.querySelector('.tw-bm'), id = pn.querySelector('.tw-bdd');
    const [py, pm, pd] = (settings.birth || '').split('-'); iy.value = py || ''; im.value = pm ? +pm : ''; id.value = pd ? +pd : '';
    [iy, im, id].forEach((el, i, arr) => {
      el.addEventListener('keydown', e => e.stopPropagation());
      el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, ''); if (el.value.length >= el.maxLength && arr[i + 1]) arr[i + 1].focus(); });   // 入れ終わったら、次の欄へ
    });
    const birthStr = () => {   // 正しい日付なら「年-月-日」、そうでなければ ''
      const y = +iy.value, m = +im.value, d = +id.value; if (!y || !m || !d || y < 1900) return '';
      const t = new Date(y, m - 1, d); if (t.getFullYear() !== y || t.getMonth() !== m - 1 || t.getDate() !== d) return '';
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    };
    const inp = { get value() { return settings.birthLock && settings.birth ? settings.birth : birthStr(); } };
    if (settings.birthLock && settings.birth) [iy, im, id].forEach(el => { el.disabled = true; });   // 誕生日はとうろくずみ(変えられない)
    pn.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ad === 'close') return hud.closePanel();
      if (b.dataset.ad === 'off') { settings.adult = 0; save(); msg.textContent = 'オフにしました。'; return; }
      if (b.dataset.ad === 'on') {
        if (!inp.value || ageOf(inp.value) < 0) { msg.textContent = '生年月日を、年・月・日の順に数字で入れてね。'; return; }
        if (ageOf(inp.value) < 18) { settings.adult = 0; if (!settings.birthLock) settings.birth = ''; save(); msg.textContent = '18歳未満の人は使えません。'; return; }
        settings.birth = inp.value; settings.birthLock = 1; settings.adult = 1; save(); msg.textContent = 'オンにしました。';
      }
    });
  }
  // メニューの「act」:大喜利・格言・ハーモニカ(アプリを開かない、住人ならではのあそび)
  function doAct(r, m) {
    if (m.act === 'consult' || m.act === 'soranote') { r.talking = true; talkingTo = r; input.clear(); soraNote(r); return; }
    if (m.act === 'follow') { hanaFollow(r, !r.follow); return; }
    if (m.act === 'date') { startDate(r); return; }
    if (m.act === 'invite') { if (env.hour >= 21 || env.hour < 5) { hud.dialog({ name: r.def.name, role: r.def.role, text: '今日はもう遅いから、また今度ね!' }); return; } r.follow = true; r.hold = false; r.reT = 0; hud.dialog({ name: r.def.name, role: r.def.role, text: 'え、いいの? 行く行く!' }); setTimeout(() => { hud.closeDialog?.(); openApp('home', {}); }, 900); return; }
    if (m.act === 'ogiri') {
      r.talking = true; talkingTo = r; input.clear();   // 大喜利をしている間は、その場にいる
      const go = () => openOgiri({ hud, ai, bus, def: r.def, getEn: () => ({ on: !!settings.en, level: settings.enLevel }), setEn: v => { settings.en = v.on ? 1 : 0; save(); bus.emit('lang', { on: !!settings.en }); } });
      if (ai.ready) go(); else openAiSetup({ hud, ai, onDone: go });
    } else if (m.act === 'quote') showQuote(r);
    else if (m.act === 'harmonica') { audio.unlock(); const tune = audio.pickTune(env.hour), t = audio.play('harmonica', tune) || { sec: 7.6, name: '' }; r.harpT = t.sec; hud.say('npc:' + r.def.id, `♪ ${t.name} ♪`, Math.min(12, t.sec)); }
  }
  function showQuote(r) {
    const qs = r.def.quotes; let i = Math.floor(Math.random() * qs.length); if (i === r.qi) i = (i + 1) % qs.length; r.qi = i;
    const q = qs[i], en = !!settings.en;
    r.talking = true; talkingTo = r; input.clear();
    const choices = [];
    if (en) choices.push({ label: 'ことばノートに入れる', fn: () => hud.toast(addNote({ kind: 'phrase', text: q.en, sentence: `${q.who}の言葉`, meaning: q.ja, npc: r.def.name })) });
    choices.push({ label: 'もうひとつ聞く', fn: () => showQuote(r) });
    hud.dialog({ name: r.def.name, role: r.def.role, text: en ? `"${q.en}"(${q.ja}) ― ${q.who}。${q.note}` : `「${q.ja}」― ${q.who}。${q.note}`, choices });
  }
  function startChat(r, first, situation) {
    if (r.def.free) return freeChat(r, first, situation);
    const hist = []; ai.warm();
    r.talking = true; talkingTo = r; input.clear();
    openChat({
      hud, bus, name: r.def.name, role: r.def.role, first,
      getEn: () => ({ on: !!settings.en, level: settings.enLevel }),
      setEn: v => { settings.en = v.on ? 1 : 0; settings.enLevel = v.level; save(); bus.emit('lang', { on: !!settings.en }); },
      translate: text => ai.translate(text),
      saveNote: it => addNote({ ...it, npc: r.def.name }),
      ask: async (t, onPart) => {
        hist.push({ role: 'user', text: t.slice(0, 80) });
        const H = Math.floor(env.hour), M = Math.floor((env.hour % 1) * 60);
        const system = buildSystem({ npc: r.def, player: settings.name || 'あなた', hourText: `${H}時${M}分`, periodText: PERIOD[period(env.hour)], place: city.areaName(r.ch.root.position.x, r.ch.root.position.z), english: settings.en ? settings.enLevel : '', adult: ageOk() && !!settings.adult && r.def.adult !== false });
        try {
          const out = await ai.chat({ system, messages: [{ role: 'assistant', text: first }, ...hist.slice(-6)], onDelta: onPart, adult: ageOk() && !!settings.adult && r.def.adult !== false, ...(settings.en ? { maxChars: 300, maxTokens: 300 } : { maxChars: (r.def.maxChars || 90) + 240, maxTokens: (r.def.maxTokens || 160) + 200 }) });
          const shown = out.split('|||')[0].trim();   // 英語・日本語の両方が入っている。履歴とふきだしには、話した側だけを使う
          hist.push({ role: 'assistant', text: shown });
          hud.say('npc:' + r.def.id, shown.length > 46 ? shown.slice(0, 44) + '…' : shown, 4);
          return out;
        } catch (e) { hist.pop(); throw e; }
      },
    });
  }
  // ---- そら君ノート(英語の相談) ----
  function soraNote(r) {
    openSoraNote({
      hud, ai, storage, level: settings.enLevel,
      onNote: it => { const m = addNote({ ...it, npc: 'そら' }); hud.toast(m); return m; },
      onSay: t => hud.say('npc:sora', t, 4),
      onDaily: () => opt.onEvent?.('app:event', { name: 'daily' }),
      openSetup: done => openAiSetup({ hud, ai, onDone: done }),
      games: [
        { label: '🎮 チャンクボックス', fn: () => openApp('gamebox', {}) },
        { label: '📒 ことばノート', fn: () => openNoteBook() },
        ...((opt.features || []).includes('study') ? [{ label: '📚 勉強部屋', fn: () => opt.onEvent?.('app:event', { name: 'study' }) }] : []),
      ],
    });
  }
  // ---- いっしょに出かける住人(はなちゃん・そら君):自由なおしゃべり(決まりごとを足さない)、手をつないで歩く、デート、家に招く ----
  const compOf = () => residents.list.find(x => x.def.companion && x.follow);
  const say1 = (r, arr, sec = 3) => hud.say('npc:' + r.def.id, Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : arr, sec);
  function freeChat(r, first, situation, low) {
    const hist = []; ai.warm();
    r.talking = true; talkingTo = r; input.clear();
    openChat({
      hud, bus, name: r.def.name, role: r.def.role, first, maxLen: 400, low,
      getEn: () => ({ on: !!settings.en, level: settings.enLevel }),
      setEn: v => { settings.en = v.on ? 1 : 0; settings.enLevel = v.level; save(); bus.emit('lang', { on: !!settings.en }); },
      translate: text => ai.translate(text),
      saveNote: it => addNote({ ...it, npc: r.def.name }),
      ask: async (t, onPart) => {
        hist.push({ role: 'user', text: t });
        const H = Math.floor(env.hour), M = Math.floor((env.hour % 1) * 60), place = city.areaName(me.x, me.z);
        const sit = situation || (r.follow ? `いま「${settings.name || 'あなた'}」と${r.hold ? '手をつないで' : ''}一緒に町を歩いている。場所は${place}。` : `いま町の${place}で、「${settings.name || 'あなた'}」に話しかけられた。`);
        const system = [
          `あなたは「${r.def.name}」。${r.def.personaOut || r.def.persona}`,
          `季節は${({ spring: '春', summer: '夏', autumn: '秋', winter: '冬' })[seasons.season] || ''}、${PERIOD[period(env.hour)]}の${H}時${M}分。${sit}`,
          settings.en ? `English mode: reply in ${settings.enLevel === 'easy' ? 'simple' : 'natural'} English. After the reply, write " ||| " and a natural Japanese translation.` : '日本語で話す。返事のあとに「 ||| 」と、同じ内容の自然な英語訳を書く。',
        ].join('\n');
        try {
          const out = await ai.chat({ system, messages: [{ role: 'assistant', text: first }, ...hist.slice(-40)], onDelta: onPart, adult: ageOk() && !!settings.adult && r.def.adult !== false, maxTokens: 900, maxChars: 2400 });
          const shown = out.split('|||')[0].trim();
          hist.push({ role: 'assistant', text: shown });
          hud.say('npc:' + r.def.id, shown.length > 46 ? shown.slice(0, 44) + '…' : shown, 4);
          return out;
        } catch (e) { hist.pop(); throw e; }
      },
    });
  }
  // 一緒にいる住人を、家やゲーム機に「お客さん」として渡す
  function hanaGuest() {
    const r = compOf(); if (!r) return null;
    return {
      id: r.def.id, name: r.def.name, look: r.def.look, icon: r.def.icon, lines: r.def.homeLines,
      late: () => env.hour >= 21 || env.hour < 5,
      leave: () => { r.follow = false; r.hold = false; },
      chat: (situation, first) => { if (!ai.ready) { openAiSetup({ hud, ai, onDone: () => freeChat(r, first, situation, true) }); return; } freeChat(r, first, situation, true); },
    };
  }
  const FOLLOW_LINES = { hana: ['いいよ! どこ行く? ついてくね。', 'うん、またね! 楽しかった〜。'], sora: ['いいよ、どこ行く? 付き合うよ。', 'おう、またね! 楽しかったよ。'] };
  function hanaFollow(r, on, quiet) {
    if (on) for (const o of residents.list) if (o !== r && o.def.companion && o.follow) { o.follow = false; o.hold = false; o.ch.holdTo = null; }   // 一緒に歩けるのは1人だけ
    r.follow = on; r.hintT = 25 + Math.random() * 20; r.lastArea = null; r.hold = false; r.reT = 0; r.ev = null; r.lag = r.lagT = 0; r.blockT = 0; r.ch.holdTo = null; me.ch.holdTo = null; guide = null;
    if (!quiet) hud.dialog({ name: r.def.name, role: r.def.role, text: (FOLLOW_LINES[r.def.id] || FOLLOW_LINES.hana)[on ? 0 : 1] });
  }
  // ---- しばらく遊んでいない遊び・勉強を記録して、誘う ----
  const lastPlay = storage.get('lastPlay') || {};
  const markPlay = k => { lastPlay[k] = Date.now(); storage.set('lastPlay', lastPlay); };
  const daysSince = k => lastPlay[k] ? (Date.now() - lastPlay[k]) / 864e5 : 999;
  const spotOf = id => city.interact.find(i => i.app === id || i.id === id);
  // where:連れて行く場所 / go:着いたらすること
  const PLAYSPOTS = [
    { k: 'fishing', n: '釣り', season: 'summer', where: () => ({ x: 46, z: 21 }), go: () => openApp('fishing', {}), ask: '最近、釣りしてないね。砂吹さんの池、行ってみる?' },
    { k: 'golf', n: 'ミニゴルフ', season: 'spring', where: () => spotOf('board'), go: () => sport.start('golf'), ask: '今日のゴルフのコース、もう見た? やりに行こうよ!' },
    { k: 'frisbee', n: 'フリスビー', season: 'autumn', where: () => spotOf('board'), go: () => sport.start('frisbee'), ask: 'ねえ、フリスビーしに行かない? 掲示板にコースが出てるよ' },
    { k: 'chunkcards', n: 'カード', where: () => spotOf('chunkcards'), go: () => openApp('chunkcards', {}), ask: 'カフェでカード勝負、最近してないよね。行ってみる?' },
    { k: 'omikuji', n: 'おみくじ', where: () => spotOf('omikuji'), go: () => openApp('omikuji', {}), ask: '神社のおみくじ、最近ひいてないでしょ? 行こうよ' },
    { k: 'amuse', n: 'アミューズメントセンター', where: () => spotOf('amuse'), go: () => openApp('amuse', {}), ask: 'アミューズメントセンター、久しぶりに行かない?' },
    { k: 'gamebox', n: 'チャンクボックス', where: () => spotOf('home'), go: () => openApp('gamebox', { from: 'home' }), ask: 'ねえ、家のテレビでゲームしようよ! 最近やってないでしょ' },
  ];
  function neglected() {
    return PLAYSPOTS.filter(p => (!p.season || p.season === seasons.season) && daysSince(p.k) >= 3 && p.where()).sort((a, b) => daysSince(b.k) - daysSince(a.k));
  }
  // 勉強(組み込み先の記録から):しばらくしていないもの
  function studyNeglected() {
    let L = []; try { L = opt.studyInfo?.() || []; } catch (e) { }
    return L.filter(x => x.days >= 3).sort((a, b) => b.days - a.days);
  }
  // 連れて行く:手を引いて、道すじを歩く(自分で動かすと、やめる)
  let guide = null;
  function startGuide(r, p) {
    const w = p.where(); if (!w) return;
    const from = nearestNode(city.graph, me.x, me.z), to = nearestNode(city.graph, w.x, w.z);
    guide = { r, p, path: [...findPath(city.graph, from, to).map(id => city.graph.nodes[id]), { x: w.x, z: w.z }], t: 0 };
    r.hold = true; r.holdK = 0; r.lag = 0; r.lagT = 0.45;
    say1(r, r.def.id === 'sora' ? ['よし、こっちだよ!', 'ついてきて!'] : ['こっちこっち! 連れてってあげる!', '行こ行こ!']);
  }
  function guideStep(dt, mag) {
    if (!guide || hud.busy || appHost.current) return false;
    if (mag > 0.3) { const r = guide.r; guide = null; r.lagT = 0; say1(r, r.def.id === 'sora' ? 'お、自分で行く? おっけー' : 'あ、自分で行く? おっけー!'); return false; }
    const n = guide.path[0]; if (!n) { guide = null; return false; }
    const dx = n.x - me.x, dz = n.z - me.z, d = Math.hypot(dx, dz);
    if (d < (guide.path.length > 1 ? 1.2 : 1.6)) {
      guide.path.shift();
      if (!guide.path.length) {
        const { r, p } = guide; guide = null; r.lagT = 0;
        if (p.arrive) { p.arrive(); return true; }
        hud.dialog({ name: r.def.name, role: r.def.role, text: `着いた! ${p.n}、やる?`, choices: [{ label: 'やる!', fn: () => { markPlay(p.k); p.go(); } }, { label: 'また今度', fn: () => {} }] });
      }
      return true;
    }
    me.ry = angleLerp(me.ry, Math.atan2(dx, dz), Math.min(1, dt * 6));
    me.speed += (4.6 - me.speed) * Math.min(1, dt * 6);
    [me.x, me.z] = collide(me.x + Math.sin(me.ry) * me.speed * dt, me.z + Math.cos(me.ry) * me.speed * dt);
    return true;
  }
  const HANA_HINTS = {
    spring: ['春と秋は、掲示板にミニゴルフのコースが貼り出されるんだって。毎日ちがうコースなの!'],
    summer: ['夏は砂吹さんの池で釣りができるよ。夕方と朝は、よく釣れるんだって!', '魚影が見えても、真上に落とすと逃げちゃうんだって。少し先に落とすといいらしいよ'],
    autumn: ['秋は掲示板からフリスビーに出られるよ。風を読むのがコツなんだって'],
    winter: ['雪玉は長押しすると大きくなるよ! 雪だるまも作れるの', '広場で雪合戦できるって知ってた?'],
    any: ['そら君に聞くと、英語の使い方をノートにまとめてくれるよ', '家のテレビで、チャンクボックスのゲームが遊べるんだよ', 'カフェでミイさんとカード勝負できるよ。ミイさん、ああ見えて強いの', '会話の英語をタップすると、ことばノートに入れられるんだって', '神社のおみくじ、毎日ひけるよ'],
  };
  const SORA_HINTS = { any: ['この町、歩いてるだけで楽しいよな', '腹へったな…カフェ寄ってく?', 'ゲーセンのぷにチャンク、けっこうハマるんだよ', '夕方の空、いい色じゃん'], winter: ['雪合戦なら負けないよ?'], summer: ['夏は池で釣りだよな。砂吹さん、たまに大物あげてる'] };
  const PLACE_LINES = {
    hana: [['広場', 'ここ、待ち合わせによく使うんだ〜'], ['カフェ', 'いいにおい…何か飲みたくなっちゃう'], ['公園', 'ここのベンチ、すわると落ちつくよね'], ['神社', 'しーん…ってしてて好きなんだ'], ['図書館', 'しずかにしなきゃね(小声)'], ['学校', 'なつかしい感じするね'], ['ゲームセンター', 'ちょっと遊んでいかない?'], ['ショップ', 'かわいいの売ってるかな?'], ['池', 'アヒルいるかな〜'], ['家', 'ここがあなたの家? いいなぁ']],
    sora: [['広場', '噴水の音、落ちつくよな'], ['カフェ', 'ここのケーキ、うまいんだよ'], ['公園', 'ベンチでぼーっとするの、好きなんだ'], ['神社', 'おみくじ、大吉出たことある?'], ['図書館', 'ここ、よく来るんだ'], ['学校', '懐かしいなぁ'], ['ゲームセンター', '一回だけ遊んでいく?'], ['池', '砂吹さん、今日も釣ってるかな']],
  };
  // 手をつなぐ:プレイヤーの左にならぶ。ときどき少しおくれたり、前へ引っぱったりする(手ははなさない)
  const holdM = new THREE.Vector3();
  let pullBoost = 1;
  function hanaHold(r, dt) {
    const hc = r.ch;
    const seated = r.pin && r.pin.bench;
    if (!r.follow || (r.pin && !seated) || r.hidden) { r.hold = false; hc.holdTo = null; me.ch.holdTo = null; pullBoost = 1; return; }
    if (!seated) {
      const ry = me.ry, tx = me.x + Math.cos(ry) * 0.62, tz = me.z - Math.sin(ry) * 0.62, c = collide(tx, tz, 0.3);
      const blocked = Math.hypot(c[0] - tx, c[1] - tz) > 0.12, P = hc.root.position;
      r.blockT = blocked ? (r.blockT || 0) + dt : 0;
      if (r.hold && r.blockT > 0.9) { r.hold = false; r.holdK = 0; r.reT = 0; r.lag = r.lagT = 0; r.ev = null; pullBoost = 1; }   // 横がずっとふさがっているときだけ、手をはなす
      else if (!r.hold) { r.reT = (blocked || Math.hypot(P.x - tx, P.z - tz) > 3 || r.talking) ? 0 : (r.reT || 0) + dt; if (r.reT > 0.35) { r.hold = true; r.holdK = 0; r.lag = r.lagT = 0; } }
      if (r.hold && !guide) {
        const moving = me.speed > 1;
        r.evT = (r.evT ?? 15 + Math.random() * 15) - (moving ? dt : 0);
        if (!r.ev && r.evT <= 0 && moving && !hud.busy) {
          r.evT = 20 + Math.random() * 25;
          const so = r.def.id === 'sora';
          if (Math.random() < 0.6) { r.ev = { k: 'lag', t: 0 }; say1(r, so ? ['あ、ちょい待って', 'おっと、待って待って'] : ['あっ、待って〜', 'わっ、ちょっと待って!', 'あれ見て…あっ、置いてかないで〜'], 2.5); }
          else { r.ev = { k: 'pull', t: 0 }; say1(r, so ? ['こっち行ってみよう!', 'ほら、早く!'] : ['こっちこっち!', 'ねえ、あっち行ってみよ!', 'はやくはやく〜!'], 2.5); }
        }
        if (r.ev) {
          const e = r.ev; e.t += dt;
          r.lagT = e.k === 'lag' ? (e.t < 1.2 ? -0.5 : 0) : (e.t < 1.6 ? 0.5 : 0);
          pullBoost = e.k === 'pull' && e.t < 1.6 ? 1.25 : 1;
          if (e.t > 2.4) { r.ev = null; r.lagT = 0; pullBoost = 1; }
        }
      } else pullBoost = 1;
      r.lag = (r.lag || 0) + ((r.lagT || 0) - (r.lag || 0)) * Math.min(1, dt * (r.ev && r.ev.k === 'lag' && r.ev.t >= 1.2 ? 3.5 : 2.4));
    }
    if (r.hold || seated) {
      const P = hc.root.position;
      holdM.set((me.x + P.x) / 2, seated ? 0.52 : 0.66, (me.z + P.z) / 2);
      hc.holdTo = holdM; hc.holdArm = 0; me.ch.holdTo = holdM; me.ch.holdArm = 1;
    } else { hc.holdTo = null; me.ch.holdTo = null; }
  }
  function hanaUpdate(dt) {
    const r = compOf();
    if (!r) { if (me.ch.holdTo) me.ch.holdTo = null; pullBoost = 1; guide = null; return; }
    hanaHold(r, dt);
    if (r.pin || hud.busy || appHost.current || !started || r.talking || guide) return;
    const area = city.areaName(me.x, me.z), PL = PLACE_LINES[r.def.id] || PLACE_LINES.hana;
    if (area !== r.lastArea) { r.areaT = (r.areaT || 0) + dt; if (r.areaT > 3) { const prev = r.lastArea; r.lastArea = area; r.areaT = 0; const pl = PL.find(([k]) => area.includes(k)); if (prev && pl && Math.random() < 0.8) { say1(r, pl[1], 4); r.hintT = Math.max(r.hintT, 15); } } }
    else r.areaT = 0;
    r.hintT -= dt;
    if (r.hintT > 0 || r.ev) return;
    r.hintT = 50 + Math.random() * 50;
    // ときどき、しばらくしていない遊び(そら君は勉強も)にさそう
    const so = r.def.id === 'sora';
    if (so && Math.random() < 0.4) {
      const st = studyNeglected()[0];
      if (st) { hud.dialog({ name: r.def.name, role: r.def.role, text: `そういえば、最近「${st.n}」やってないじゃん。ちょっとやってみない?`, choices: [{ label: 'やる', fn: () => { hanaFollow(r, false, true); opt.onEvent?.('app:event', { name: 'play', data: { id: st.id } }); } }, { label: 'また今度', fn: () => {} }] }); return; }
    }
    if (Math.random() < 0.45) {
      const p = neglected()[0];
      if (p) { hud.dialog({ name: r.def.name, role: r.def.role, text: so ? p.ask.replace('しようよ!', 'しようぜ').replace('してないね', 'してないじゃん') : p.ask, choices: [{ label: '行く!', fn: () => startGuide(r, p) }, { label: 'また今度', fn: () => {} }] }); return; }
    }
    const HS = so ? SORA_HINTS : HANA_HINTS, L = [...(HS[seasons.season] || []), ...HS.any];
    let i = Math.floor(Math.random() * L.length); if (i === r.hintI) i = (i + 1) % L.length; r.hintI = i; say1(r, L[i], 6);
  }
  // カフェのテラス席で、向かい合ってすわっておしゃべり
  let date = null;
  function startDate(r) {
    const cafe = city.buildings.find(b => b.cafe); if (!cafe) { hud.toast('カフェが見つからないみたい'); return; }
    if (!ai.ready) { openAiSetup({ hud, ai, onDone: () => startDate(r) }); return; }
    endDate(true);
    const [nx, nz] = cafe.cafe.face, T = cafe.cafe.tables[1], rx = nz, rz = -nx;   // テーブルの左右にすわる
    const pA = { x: T.x + rx * 0.85, z: T.z + rz * 0.85 }, pB = { x: T.x - rx * 0.85, z: T.z - rz * 0.85 };
    const stools = [pA, pB].map(q => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.44, 14), new THREE.MeshLambertMaterial({ color: 0xc9a28c })); m.position.set(q.x, 0.22, q.z); m.castShadow = true; scene.add(m); return m; });
    standFromSeat();
    me.x = pA.x; me.z = pA.z; me.ry = Math.atan2(-rx, -rz); me.speed = 0; seat = { b: { x: pA.x, z: pA.z, ry: me.ry }, date: true }; me.ch.pose = 'sit'; me.ch.holdTo = null;
    r.pin = { x: pB.x, z: pB.z, y: -0.04, ry: Math.atan2(rx, rz), pose: 'sit' };
    const F = { x: T.x + nx * 2.4, z: T.z + nz * 2.4 }; cam.x = F.x; cam.z = F.z; cam.yaw = Math.atan2(nx, nz); cam.pitch = 0.42; cam.dist = 5.5;
    date = { r, stools, focus: F, wasFollow: r.follow, cam0: { pitch: cam.pitch, dist: cam.dist } }; residents.avoid = { x: T.x, z: T.z, r: 3.2 };
    for (const o of residents.list) if (o !== r && !o.hidden && !(o.def.companion && o.follow) && Math.hypot(o.ch.root.position.x - T.x, o.ch.root.position.z - T.z) < 2.4) { const a = Math.atan2(o.ch.root.position.x - T.x, o.ch.root.position.z - T.z); o.ch.root.position.x = T.x + Math.sin(a) * 3.3; o.ch.root.position.z = T.z + Math.cos(a) * 3.3; }
    const H = env.hour, so = r.def.id === 'sora';
    const first = so ? (H < 11 ? '朝のカフェっていいよな。何たのむ?' : H < 17 ? 'ここのケーキ、うまいんだよ。何にする?' : '夜のカフェって、なんか落ちつくよな') : (H < 11 ? 'モーニング、いい感じだね。何たのむ?' : H < 17 ? 'ここ、前から来てみたかったんだ〜。何にする?' : '夜のカフェって、ちょっと大人な感じしない?');
    freeChat(r, first, `いま「${settings.name || 'あなた'}」と、町のカフェのテラス席で向かい合ってすわり、デートしている。`, true);
    const off = bus.on('ui:panelClosed', () => { off(); endDate(); });
    date.off = off;
  }
  function endDate(quiet) {
    if (!date) return; const d = date; date = null;
    d.off?.(); d.stools.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
    d.r.pin = null; d.r.ch.pose = null; residents.avoid = null; d.r.follow = d.wasFollow; d.r.talking = false;
    if (seat && seat.date) { seat = null; me.ch.pose = null; }
    cam.pitch = d.cam0.pitch; cam.dist = d.cam0.dist;
    if (!quiet) say1(d.r, d.r.def.id === 'sora' ? '楽しかったよ。また来よう!' : '楽しかった〜! また来ようね', 4);
  }
  // ---- ストリートピアノ ----
  let pianoGame = null;
  function sitAtPiano() {
    standFromSeat(); const s = city.piano.seat;
    me.x = s.x; me.z = s.z; me.ry = s.ry; me.speed = 0; seat = { b: { x: s.x, z: s.z, ry: 0 }, piano: true }; me.ch.pose = 'piano'; me.ch.holdTo = null; input.clear();
    cam.yaw = 1.2; cam.pitch = 0.32; cam.dist = Math.min(cam.dist, 6);   // ななめ横から(うしろの木にかくれないように)
  }
  function pianoMenu() {
    openPianoMenu({
      hud,
      onAuto: id => { sitAtPiano(); audio.unlock(); const sec = playSong(audio, id), nm = (SONGS.find(x => x.id === id) || {}).name; hud.say(me.id, `♪ ${nm} ♪`, Math.min(10, sec)); const s0 = seat; setTimeout(() => { if (seat === s0) me.ch.pose = 'sit'; }, sec * 1000); },
      onTap: id => { sitAtPiano(); audio.unlock(); pianoGame = runTapGame({ root, audio, id, onEnd: r => { pianoGame = null; if (seat && seat.piano) me.ch.pose = 'sit'; if (r.quit) return; const k = r.total ? r.hit / r.total : 0; hud.dialog({ name: '🎹 ' + r.name, text: `${r.hit}/${r.total} 音 ・ Perfect ${r.per} ・ 最大 ${r.combo} combo — ${k >= 0.95 ? 'すばらしい! 拍手がきこえるよ👏' : k >= 0.75 ? 'じょうず!' : k >= 0.5 ? 'いい感じ! もう一回?' : 'れんしゅうあるのみ!'}`, choices: [{ label: 'もう一回', fn: () => pianoMenu() }, { label: 'おわる', fn: () => {} }] }); } }); },
    });
  }
  // ---- 誕生日 ----
  //   その日(この端末の日付で、登録した月日):住人がみんな1回ずつ「おめでとう」/砂吹さんがハーモニカ/そら君が花束/はなちゃんがピアノ
  //   夜:とくべつな花火+記念写真(アルバムの特別枠・無料)。その月は家のゲーム機が全部無料。翌月はサブスク半額のお知らせ
  let bdayTest = /[?&]bday=1/.test(location.search) ? 'day' : '';
  const bdayMD = () => { const b = settings.birth; if (!b) return null; const [, m, d] = b.split('-').map(Number); return m && d ? { m, d } : null; };
  const isBday = () => { if (bdayTest === 'day' || bdayTest === 'night') return true; const b = bdayMD(), n = new Date(); return !!b && n.getMonth() + 1 === b.m && n.getDate() === b.d; };
  const isBirthMonth = () => { if (bdayTest === 'day' || bdayTest === 'night') return true; const b = bdayMD(); return !!b && new Date().getMonth() + 1 === b.m; };
  const bst = () => { const y = new Date().getFullYear() + (bdayTest ? ':test' : ''); let s = storage.get('bday'); if (!s || s.y !== y) { s = { y, greet: [] }; storage.set('bday', s); } return s; };
  const bsave = s => storage.set('bday', s);
  let bdayCool = 0, bdayHello = false;
  const B_LINES = ['お誕生日おめでとう!', 'Happy birthday! おめでとう!', '今日、誕生日なんだって? おめでとう!', 'おめでとう! すてきな一年になりますように'];
  let bdayShot = null, bdayRelease = 0;
  function birthdayUpdate(dt) {
    if (bdayShot) {
      const b = bdayShot; b.t += dt;
      if (!b.go && b.t > 8) { b.go = true; ['heart', 'kamuro', 'star', 'botan'].forEach(t => fw.launch(t)); }   // 大きな花火を4つ
      else if (b.go && (b.t2 += dt) > 2.8) { bdayShot = null; birthdayPhoto(b.S); bdayRelease = 45; }
    }
    if (bdayRelease > 0 && (bdayRelease -= dt) <= 0) { residents.avoid = null; for (const r of residents.list) if (r.def.companion && r.pin && !r.pin.bench) r.pin = null; }
    if (!started || appHost.current || !isBday()) return;
    const s = bst(), nm = settings.name || 'あなた';
    if (!bdayHello) { bdayHello = true; hud.toast(`🎂 ${nm}さん、お誕生日おめでとう!`); }
    bdayCool -= dt; if (bdayCool > 0 || hud.busy || pianoGame || evt) return;
    const near = r => !r.hidden && r.ch.root.visible && Math.hypot(r.ch.root.position.x - me.x, r.ch.root.position.z - me.z) < 3.6;
    const R = id => residents.list.find(x => x.def.id === id);
    // 夜の花火と記念写真
    if (!s.fw && (bdayTest === 'night' || env.hour >= 19 || env.hour < 3)) { s.fw = 1; bsave(s); birthdayNight(); return; }
    // そら君:花束
    const so = R('sora'); if (so && !s.sora && near(so) && !so.pin) { s.sora = 1; bsave(s); furn.give('bouquet'); hud.dialog({ name: 'そら', role: so.def.role, text: `あ、いたいた! ${nm}、誕生日おめでとう。これ、花束。部屋にかざってよ`, choices: [{ label: 'ありがとう!', fn: () => hud.toast('💐 そら君の花束をもらった! 家にかざれるよ') }] }); bdayCool = 3; return; }
    // はなちゃん:ピアノでハッピーバースデー
    const ha = R('hana'); if (ha && !s.hana && (near(ha) || ha.follow) && !ha.pin && (s.hanaT || 0) < Date.now()) {
      hud.dialog({ name: 'はな', role: ha.def.role, text: `${nm}、お誕生日おめでとう! ねえ、ちょっと来て。プレゼントがあるの!`, choices: [
        { label: 'うん!', fn: () => { s.hana = 1; bsave(s); if (!ha.follow) hanaFollow(ha, true, true); const P = city.piano; startGuide(ha, { n: 'ピアノ', where: () => ({ x: P.x + 1.6, z: P.z + 2.4 }), arrive: () => hanaPiano(ha) }); } },
        { label: 'あとでね', fn: () => { s.hanaT = Date.now() + 120000; bsave(s); } }] });
      bdayCool = 3; return;
    }
    // 砂吹さん:ハーモニカ
    const su = R('suna'); if (su && !s.suna && near(su)) { s.suna = 1; bsave(s); audio.unlock(); const t = audio.play('harmonica', 'bday') || { sec: 10 }; su.harpT = t.sec; hud.say('npc:suna', '♪ Happy Birthday ♪', Math.min(12, t.sec)); setTimeout(() => hud.say('npc:suna', `おめでとさん、${nm}。いい一年をな`, 4), t.sec * 1000); bdayCool = t.sec; return; }
    // ほかの住人:1回ずつ「おめでとう」
    for (const r of residents.list) {
      if (s.greet.includes(r.def.id) || !near(r) || r.talking) continue;
      s.greet.push(r.def.id); bsave(s); hud.say('npc:' + r.def.id, B_LINES[Math.floor(Math.random() * B_LINES.length)], 4); bdayCool = 4; return;
    }
  }
  function hanaPiano(r) {
    const P = city.piano, st = P.seat;
    r.pin = { x: st.x, z: st.z, y: -0.04, ry: st.ry, pose: 'piano' };
    me.x = P.x + 1.3; me.z = P.z + 2.0; me.ry = Math.atan2(st.x - me.x, st.z - me.z);
    audio.unlock(); const sec = playSong(audio, 'bday');
    hud.say('npc:hana', '♪ Happy Birthday to you ♪', Math.min(12, sec));
    setTimeout(() => { r.pin = null; r.ch.pose = null; hud.say('npc:hana', `${settings.name || ''}、お誕生日おめでとう! 🎂`, 5); }, sec * 1000 + 300);
  }
  // 夜:3人で花火を見て、記念写真
  function birthdayNight() {
    const S = { x: 0, z: 11.5 }, so = residents.list.find(x => x.def.id === 'sora'), ha = residents.list.find(x => x.def.id === 'hana');
    standFromSeat(); guide = null;
    me.x = S.x; me.z = S.z; me.ry = 0; me.speed = 0;
    for (const [r, dx] of [[ha, -1.05], [so, 1.05]]) if (r) { r.follow = false; r.hold = false; r.pin = { x: S.x + dx, z: S.z, ry: 0, pose: null }; r.ch.holdTo = null; }
    me.ch.holdTo = null;
    cam.x = S.x; cam.z = S.z; cam.yaw = 0; cam.pitch = 0.15; cam.dist = 6;
    runEvent('fw:digest', { birthday: true });
    hud.say('npc:hana', 'わぁ…! 花火、きれい!', 4); setTimeout(() => hud.say('npc:sora', `${settings.name || ''}、誕生日おめでとう!`, 4), 2500);
    bdayShot = { S, t: 0, t2: 0 };   // 写真は町の時間で数える(重い端末でも、花火が開いた瞬間に撮れるように)
    residents.avoid = { x: S.x, z: S.z + 2.6, r: 5 };   // ほかの住人が、写真の前に入らないように
  }
  function birthdayPhoto(S) {
    try {
      const w = renderer.domElement.width, h = renderer.domElement.height, c = new THREE.PerspectiveCamera(62, w / h, 0.1, 600);
      me.x = S.x; me.z = S.z; me.ry = 0; me.ch.root.position.set(S.x, 0, S.z); me.ch.root.rotation.y = 0; me.ch.root.visible = true;
      c.position.set(S.x, 1.25, S.z + 4.3); c.lookAt(S.x, 9, S.z - 40);
      const hid = residents.list.filter(r => !r.def.companion && r.ch.root.visible && Math.hypot(r.ch.root.position.x - S.x, r.ch.root.position.z - (S.z + 3)) < 7);   // 写真の前にいる住人は、うつさない
      hid.forEach(r => { r.ch.root.visible = false; });
      renderer.render(scene, c);
      hid.forEach(r => { r.ch.root.visible = true; });
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
        const W = cv.width, fs = Math.round(W * 0.11);
        g.textAlign = 'center'; g.font = `900 ${fs}px Georgia, serif`; g.lineWidth = fs * 0.12; g.strokeStyle = 'rgba(90,40,90,0.7)'; g.fillStyle = '#fff4c2';
        const ty = cv.height * (cv.height > W ? 0.43 : 0.5);   // 花火(上)と3人(下)のあいだに
        g.strokeText('Happy Birthday!', W / 2, ty); g.fillText('Happy Birthday!', W / 2, ty);
        g.font = `700 ${Math.round(fs * 0.32)}px sans-serif`; g.fillStyle = '#fff'; g.fillText(`${settings.name || ''}  ${new Date().toLocaleDateString('ja-JP')}  ほしみや町`, W / 2, ty + fs * 0.55);
        photos.addSpecial(cv.toDataURL('image/jpeg', 0.88), 'birthday');
        flash(root); hud.toast('📸 記念写真がアルバムに届いたよ(特別枠)');
      };
      img.src = snapCanvas(renderer.domElement);
    } catch (e) { console.warn('[town] birthday photo', e); }
  }
  // 誕生月がおわった翌月:サブスク半額のお知らせ(1年に1回)
  function birthdayAfter(force) {
    const b = bdayMD(); if (!b && !force) return;
    const n = new Date(), next = b ? b.m % 12 + 1 : 0, key = 'after' + n.getFullYear();
    if (!force && (n.getMonth() + 1 !== next || storage.get('bdayAfter') === key)) return;
    storage.set('bdayAfter', key);
    hud.dialog({ name: '🎁 お誕生月のおまけ', text: '誕生月のゲーム無料はおしまい。ありがとう! いまだけ、サブスクが半額で始められるよ。', choices: [{ label: 'くわしく見る', fn: () => { if (opt.onSubscribe) opt.onSubscribe({ offer: 'birthday-half' }); else hud.toast('アプリ版では、ここから購入の画面が開きます'); } }, { label: 'またあとで', fn: () => {} }] });
  }
  function birthdayTestRun(k) {
    if (k === 'off') { bdayTest = ''; hud.toast('誕生日テストをやめた'); return; }
    if (k === 'after') { birthdayAfter(true); return; }
    bdayTest = k === 'night' ? 'night' : 'day'; storage.set('bday', null); bdayHello = false; bdayCool = 0;
    if (k === 'night') { const s = bst(); s.fw = 0; bsave(s); }
    else { const s = bst(); s.fw = 1; bsave(s); }   // 昼のテストでは、花火は後で(夜のテストで見る)
    hud.toast(k === 'night' ? '🎂 誕生日の夜のテスト:花火と写真' : '🎂 誕生日のテスト:住人に会いに行ってみてね');
  }
  function openApp(id, params) {
    if (['fishing', 'chunkcards', 'omikuji', 'punichunk', 'gamebox', 'amuse'].includes(id)) markPlay(id);
    // 組み込み先(チャンクタウン)が開くアプリ(ゲームなど)は、そちらに任せる
    if (opt.openExternal?.(id, params)) { input.clear(); return; }
    if (!appHost.has(id)) { hud.toast('まだ準備中みたい'); return; }
    audio.play('open'); input.clear(); input.enabled = false;
    appHost.open(id, params);
  }
  offs.push(bus.on('ui:action', doAction));
  offs.push(bus.on('ui:dialogClosed', () => { if (talkingTo) talkingTo.talking = false; talkingTo = null; }));
  offs.push(bus.on('ui:panelClosed', () => { if (talkingTo) talkingTo.talking = false; talkingTo = null; }));
  // 勉強を続けたメダル:もらったら持ち物に入れて知らせる(家の壁にかざれる)
  const medalCheck = () => { try { const nw = furn.grantMedals(opt.medals?.()); if (nw.length) opt.onEvent?.('app:event', { name: 'bonus', data: { kind: 'medal', n: nw.length } }); if (nw.length && started) hud.toast(`🏅 ${nw.map(i => i.name).join('・')}をもらった! 家の壁にかざれるよ`); } catch (e) { } };
  { const mi = setInterval(medalCheck, 15000); offs.push(() => clearInterval(mi)); setTimeout(medalCheck, 3000); }
  offs.push(bus.on('app:close', () => { input.enabled = true; audio.play('close'); hud.setCoins(wallet.get(), gemsNow()); }));
  if (opt.wallet?.onChange) offs.push(opt.wallet.onChange(w => bus.emit('wallet', w)));
  offs.push(bus.on('wallet', w => { hud.setCoins(w.coins, gemsNow()); if (w.delta > 0) { audio.play('coin'); hud.toast(`🪙 +${w.delta}`); } }));
  offs.push(bus.on('toast', t => hud.toast(t)));
  offs.push(bus.on('sfx', n => audio.play(n)));
  const SAY = ['こんにちは!', 'いい天気だね', 'いっしょに遊ぼう!', 'またね〜'];
  let backHome = false;   // 家のゲーム機から始めたら、終わったら家にもどる
  const goHome = () => { if (!backHome) return false; backHome = false; setTimeout(() => openApp('home', {}), 400); return true; };
  // ゲーム機から「町の中で遊ぶ」もの
  offs.push(bus.on('app:event', e => {
    if (e?.name !== 'launch') return;
    const what = e.data?.what; backHome = e.data?.from === 'home';
    setTimeout(() => {
      if (what === 'snow3d') {   // 町のランダムな場所で
        const ids = Object.keys(city.graph.nodes).filter(id => !/^pd|^p\d/.test(id)), n = city.graph.nodes[ids[Math.floor(Math.random() * ids.length)]];
        me.x = n.x; me.z = n.z; me.ry = Math.random() * Math.PI * 2; cam.x = me.x; cam.z = me.z;
        const cand = residents.list.filter(r => r.ch.rig); const opp = cand[Math.floor(Math.random() * cand.length)];
        opp.ch.root.position.set(me.x + Math.sin(me.ry) * 8, 0, me.z + Math.cos(me.ry) * 8);
        battle.start(opp, 2, backHome);
      } else if (what === 'golf' || what === 'frisbee') sport?.start(what, { any: true, home: backHome });
    }, 350);
  }));
  offs.push(bus.on('ui:snow', ph => {
    if (!started || seasons.season !== 'winter') return; audio.unlock();
    if (ph === 'down') { if (!snow.holding) snow.start(); }
    else if (snow.making) { snow.finish(); hud.toast('画面をタップした所へ投げよう'); }
  }));
  // ⛄ 雪合戦と同じボタン:持っていれば置く / 近くに雪だるまがあれば持つ / なければつくる
  offs.push(bus.on('ui:man', () => {
    if (!started || hud.busy || appHost.current || battle.active || sport.active || seasons.season !== 'winter') return; audio.unlock();
    const fx = me.x + Math.sin(me.ry) * 1.7, fz = me.z + Math.cos(me.ry) * 1.7;
    if (seasons.carrying()) { if (seasons.put(fx, fz)) { audio.play('close'); hud.toast('雪だるまを置いた'); } return; }
    if (snow.making || snow.holding) return;
    const sn = seasons.nearest(me.x, me.z, 2.4);
    if (sn) { if (seasons.lift(sn.i)) { audio.play('open'); hud.toast('雪だるまを持った(画面をタップで投げる)'); } }
    else if (seasons.build(fx, fz)) { audio.play('open'); hud.toast('ころころ…雪だるまができた!'); }
  }));
  // 💨 よける(雪合戦と同じ:向いている方・動いている方へすばやく転がる)
  // 投げた雪だるまの当たり判定:壁・地面(あとが残る)と、住人への直接ヒット
  const mcRay = new THREE.Raycaster();
  function manCheck(a, b) {
    const d = b.clone().sub(a), L = d.length(); if (L < 1e-5) return null; d.divideScalar(L);
    for (const r of residents.list) { if (!r.ch.root.visible || r.hidden) continue; const q = r.ch.root.position; if (b.y > -0.1 && b.y < 1.8 && Math.hypot(q.x - b.x, q.z - b.z) < 0.7) return { p: b.clone(), n: d.clone().negate(), npc: r }; }
    mcRay.set(a, d); mcRay.far = L + 0.3; const h = mcRay.intersectObjects(city.meshes, false)[0];
    if (h && h.distance <= L + 0.3 && h.point.y > 0.05) return { p: h.point, n: h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new THREE.Vector3(0, 1, 0) };
    return null;
  }
  let dodgeT = 0, dodgeCd = 0, ddx = 0, ddz = 0, dodgeRot = false;
  offs.push(bus.on('ui:dodge', () => {
    if (!started || hud.busy || appHost.current || battle.active || sport.active || seat || seasons.carrying() || snow.making || dodgeT > 0 || dodgeCd > 0) return;
    const m = lastMoveDir || { x: Math.sin(me.ry), z: Math.cos(me.ry) }; ddx = m.x; ddz = m.z; dodgeT = 0.55; dodgeCd = 1.4; audio.play('wave');
  }));
  { let d0 = null; const cv = renderer.domElement;   // 雪玉を持っているとき:画面をタップした所へ投げる
    cv.addEventListener('pointerdown', e => { d0 = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    const onUp = e => {   // 町の操作が指をつかまえる(capture)ので、はなしたのは window で受ける
      if (!d0 || hud.busy || appHost.current || !(snow.holding || battle.active || seasons.carrying())) { d0 = null; return; }
      const ok = Math.hypot(e.clientX - d0.x, e.clientY - d0.y) < 12 && performance.now() - d0.t < 400; d0 = null; if (!ok) return;
      if (battle.active) { battle.tap(e.clientX, e.clientY, cv.getBoundingClientRect()); return; }
      if (seasons.carrying()) {   // 雪だるまを持っているとき:タップした地面へ投げる(着いたらそこに立つ)
        const rc = cv.getBoundingClientRect(); ndc2.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc2, camera);
        const pt = new THREE.Vector3(); if (!ray.ray.intersectPlane(groundPl, pt)) return;
        if (Math.hypot(pt.x - me.x, pt.z - me.z) > 12) { hud.toast('そこは遠すぎるよ'); return; }
        const [lx, lz] = collide(pt.x, pt.z, 0.5); if (seasons.launch(new THREE.Vector3(me.x, 1.9, me.z), new THREE.Vector3(lx, 0, lz), (x, z, h) => { if (h) { snow.fx(h.p, h.n, 3, h.npc ? h.npc.ch.root : null); if (h.npc) snow.hitNpc(h.npc, 3); } else snow.fx(new THREE.Vector3(x, 0.2, z), new THREE.Vector3(0, 1, 0), 3); }, manCheck)) { audio.play('wave'); me.ch.wave?.(); }
        return;
      }
      const r = snow.throwAt(e.clientX, e.clientY, cv.getBoundingClientRect());
      if (r === 'far') hud.toast('そこは遠すぎるよ'); else if (r) { audio.play('wave'); me.ch.wave?.(); }
    };
    window.addEventListener('pointerup', onUp); offs.push(() => window.removeEventListener('pointerup', onUp)); }
  offs.push(bus.on('ui:emote', k => {
    if (!started) return;
    audio.unlock();
    if (k === 'feed') { if (ambient.feed(me.ch.root.position, me.ch.root.rotation.y)) { hud.toast('🌾 ぱらぱら…'); audio.play('wave'); } else hud.toast('まだ、えさが残ってるよ'); }
    else if (k === 'wave') {
      me.ch.wave(); audio.play('wave'); net?.emote('wave');
      // 目の前の1人だけが、手をふりかえす
      const fx = Math.sin(me.ry), fz = Math.cos(me.ry);
      const cand = residents.list.filter(r => r.ch.root.visible).map(r => { const dx = r.ch.root.position.x - me.x, dz = r.ch.root.position.z - me.z, d = Math.hypot(dx, dz); return { r, d, front: d > 0 ? (dx * fx + dz * fz) / d : 1 }; }).filter(o => o.d < 4.2 && o.front > 0.3).sort((a, b) => a.d - b.d)[0];
      if (cand) {
        const R = cand.r, L = { baron: 'ふはは、わが輩に手をふるとは!', gon: 'おっ、よう!', koharu: 'こんにちは。', maru: 'まいど!', yuzu: 'こんにちは、です', shiori: '……こんにちは', mii: 'あ、こんにちは〜', chunkkun: 'ふわふわ〜' }[R.def.id] || 'やあ!';
        setTimeout(() => { R.ch.wave(); hud.say('npc:' + R.def.id, L, 3); }, 450 + Math.random() * 250);
      }
    }
    else if (k === 'say') { const t = SAY[Math.floor(Math.random() * SAY.length)]; hud.say(me.id, t); net?.say(t); }
  }));
  // ---- さがす(マップ・一覧・ワープ) ----
  const entities = () => {
    const out = residents.list.map(r => ({ id: 'npc:' + r.def.id, kind: 'npc', name: r.def.name, yomi: r.def.yomi, role: r.def.role, x: r.ch.root.position.x, z: r.ch.root.position.z, away: !r.ch.root.visible }));
    for (const [id, q] of peers) out.push({ id, kind: 'player', name: q.name || 'だれか', role: 'プレイヤー', x: q.ch.root.position.x, z: q.ch.root.position.z });
    return out;
  };
  // 立った場所から、いちばん先まで開けている向きをえらぶ(好みの向きがひらけていれば、それを優先)
  function openHeading(x, z, pref) {
    const clear = a => { let d = 0; for (; d < 14; d += 0.7) { const [cx, cz] = collide(x + Math.sin(a) * (d + 0.7), z + Math.cos(a) * (d + 0.7)); if (Math.hypot(cx - (x + Math.sin(a) * (d + 0.7)), cz - (z + Math.cos(a) * (d + 0.7))) > 0.05) break; } return d; };
    if (clear(pref) >= 6) return pref;
    let best = pref, bs = -1e9;
    for (let k = 0; k < 24; k++) {
      const a = pref + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 12);
      const sc = clear(a) - Math.abs(Math.atan2(Math.sin(a - pref), Math.cos(a - pref))) * 1.2;
      if (sc > bs) { bs = sc; best = a; }
    }
    return best;
  }
  function jumpTo(e) {
    // 相手の手前(南側)に立つ。建物の中なら押し出す。向きは、壁でなく開けた方へ
    // 入口のある場所は、入口の正面(そのまま入れる距離 1.6。入口の範囲は 2.4)に立って、入口のほうを向く
    const front = e.kind === 'place' && e.fx !== undefined;
    let [x, z] = front ? [e.x + e.fx * 1.6, e.z + e.fz * 1.6] : e.kind === 'place' || e.kind === 'point' ? [e.x, e.z] : [e.x, e.z + 1.7];
    [x, z] = collide(x, z);
    const ry = front ? Math.atan2(-e.fx, -e.fz) : openHeading(x, z, e.kind === 'place' || e.kind === 'point' ? Math.PI : Math.atan2(e.x - x, e.z - z));
    me.x = x; me.z = z; me.ry = ry; me.speed = 0; cam.yaw = ry + Math.PI; cam.x = x; cam.z = z;
    audio.play('wave');
    if (e.kind === 'npc') {   // 飛んだ先の住人とは、すぐ話せる
      const r = residents.list.find(x => 'npc:' + x.def.id === e.id);
      if (r) setTimeout(() => { if (started && !hud.busy && !appHost.current && r.ch.root.visible) talkTo(r); }, 120);
    } else hud.toast(`${e.name}のところへ`);
  }
  function openFind() {
    if (!started || appHost.current || hud.busy) return;
    input.clear(); audio.unlock(); audio.play('tap');
    openFinder({ hud, city, areaName: city.areaName, getMe: () => me, getEntities: entities, onJump: jumpTo });
  }
  offs.push(bus.on('ui:find', openFind));
  on(window, 'keydown', e => { if (e.code === 'KeyM' && !e.repeat && !e.target.closest?.('input,textarea')) { if (hud.busy) { hud.closePanel(); return; } openFind(); } });
  offs.push(bus.on('ui:lang', () => { settings.en = settings.en ? 0 : 1; save(); bus.emit('lang', { on: !!settings.en }); hud.toast(settings.en ? 'English モード' : '日本語モード'); }));
  bus.emit('lang', { on: !!settings.en });
  // 写真:いま見えている画面のまま撮る(HUDは写らない)。のこすのは はじめ1枚、ダイヤで5枚まで。切り取りはアルバムで
  offs.push(bus.on('app:open', () => root.querySelector('.tw-shot')?.remove()));   // アプリを開いたら写真のカードは消す
  offs.push(bus.on('ui:photo', () => {
    if (!started || appHost.current || hud.busy) return;
    renderer.render(scene, camera);
    const src = snapCanvas(renderer.domElement);
    flash(root); audio.unlock(); audio.play('tap');
    shotCard(root, src, { gems: opt.gems, cfg: opt.photo, openAlbum: () => openApp('album') });
  }));
  offs.push(bus.on('ui:daily', () => { if (started) opt.onEvent?.('app:event', { name: 'daily' }); }));   // 今日はここまで(どこからでも)
  offs.push(bus.on('ui:menu', () => {
    if (!started) return;
    const seg = (key, opts) => `<div class="tw-seg">${opts.map(([v, l]) => `<button class="tw-btn${settings[key] == v ? ' on' : ''}" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const pn = hud.panel(`<h2>せってい</h2>
            <div class="tw-row">ことばノート<button class="tw-btn" data-act="notes" style="padding:6px 14px">ひらく(${notes.length})</button></div>
      <div class="tw-row">画質${seg('quality', [['low', '軽い'], ['mid', 'ふつう'], ['high', 'きれい']])}</div>
      <div class="tw-row">低負荷モード${seg('lite', [[0, 'オフ'], [1, 'オン']])}</div>
      <div class="tw-note">オンにすると、解像度・影・光のにじみ・ふちどり・噴水・月をかるくして、30fpsにします(流れ星は残ります)。</div>
      <div class="tw-row">時間の進み${seg('timeSpeed', [[0, '止める'], [1, 'ふつう'], [4, 'はやい']])}</div>
      <div class="tw-row">効果音${seg('sfx', [[0, 'なし'], [0.4, '小'], [0.7, '中'], [1, '大']])}</div>
      <div class="tw-row">時刻<div class="tw-seg"><button class="tw-btn" data-hour="8">朝</button><button class="tw-btn" data-hour="13">昼</button><button class="tw-btn" data-hour="18">夕</button><button class="tw-btn" data-hour="21">夜</button></div></div>
      <div class="tw-row">テスト:時刻<span style="display:flex;gap:8px;align-items:center;width:62%"><input class="tw-t-hour" type="range" min="0" max="24" step="0.25" value="${env.hour.toFixed(2)}" style="flex:1"><b class="tw-t-hv" style="min-width:3.2em;text-align:right"></b></span></div>
      <div class="tw-row">テスト:日付<span style="display:flex;gap:6px;align-items:center"><input class="tw-t-date" type="date" value="${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}" style="font:inherit;padding:4px 6px;border-radius:10px;border:2px solid #eadff3"><button class="tw-btn" data-act="today" style="padding:6px 10px">きょう</button></span></div>
      <div class="tw-row">桜${'<div class="tw-seg"><button class="tw-btn' + (blossomOn ? ' on' : '') + '" data-bl="1">あり</button><button class="tw-btn' + (!blossomOn ? ' on' : '') + '" data-bl="0">なし</button></div>'}</div>
      <div class="tw-row">流れ星<button class="tw-btn" data-act="meteor" style="padding:6px 14px">いま流す</button></div>
      <div class="tw-row">英語のヒント(すれ違い)${seg('tips', [[0, 'なし'], [1, 'あり']])}</div>
      <div class="tw-row">きせつ(桜・紅葉・雪)<button class="tw-btn" data-act="season" style="padding:6px 14px">${SEASONS[settings.season || 'auto']}</button></div>
      <div class="tw-row">誕生日(花火でお祝い)<button class="tw-btn" data-act="birth" style="padding:6px 14px">${settings.birth ? settings.birth.replace(/-/g, '/') : 'とうろく'}</button></div>
      ${opt.openAdmin ? '<div class="tw-row">運営(花火・日食・月食の予約)<button class="tw-btn" data-act="admin" style="padding:6px 14px">ひらく</button></div>' : ''}
      <div class="tw-row">おとなトーク(18歳以上)<button class="tw-btn" data-act="adult" style="padding:6px 14px">${settings.adult && ageOk() ? 'オン' : 'オフ'}・せってい</button></div>
      <div class="tw-row">AIとおしゃべり<button class="tw-btn" data-act="ai" style="padding:6px 14px">${ai.ready ? 'せってい(つながっています)' : 'つなぐ'}</button></div>
      ${opt.onSwitchMode ? `<div class="tw-row">${opt.switchLabel || 'ほかのモード'}<button class="tw-btn" data-act="mode" style="padding:6px 14px">きりかえる</button></div>` : ''}
      <div class="tw-row">キャラクター<button class="tw-btn" data-act="title" style="padding:6px 14px">えらびなおす</button></div>
      <div class="tw-row" style="border:0;justify-content:center"><button class="tw-btn" data-act="close" style="padding:10px 28px">とじる</button></div>`,
      (e, p) => {
        const b = e.target.closest('button'); if (!b) return;
        audio.play('tap');
        if (b.dataset.k) {
          const v = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v;
          settings[b.dataset.k] = v; save();
          if (b.dataset.k === 'en') bus.emit('lang', { on: !!settings.en });
          p.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach(x => x.classList.toggle('on', x === b));
          if (b.dataset.k === 'quality' || b.dataset.k === 'lite') applyQuality();
          if (b.dataset.k === 'timeSpeed') env.speed = v / 60;
          if (b.dataset.k === 'sfx') audio.set({ sfx: v });
          bus.emit('audio', audio.get());
        }
        if (b.dataset.hour) { env.hour = +b.dataset.hour; const r = p.querySelector('.tw-t-hour'); if (r) r.value = env.hour; }
        if (b.dataset.bl) { setBlossom(b.dataset.bl === '1'); p.querySelectorAll('[data-bl]').forEach(x => x.classList.toggle('on', x === b)); }
        if (b.dataset.act === 'meteor') env.meteorNow();
        if (b.dataset.act === 'adult') { hud.closePanel(); setTimeout(openAdultSetup, 30); }
        if (b.dataset.act === 'notes') { hud.closePanel(); setTimeout(openNoteBook, 30); }
        if (b.dataset.act === 'today') { applyDate(new Date()); const di = p.querySelector('.tw-t-date'); const d = testDate; di.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; p.querySelectorAll('[data-bl]').forEach(x => x.classList.toggle('on', (x.dataset.bl === '1') === blossomOn)); }
        if (b.dataset.act === 'close') hud.closePanel();
        if (b.dataset.act === 'mode') { hud.closePanel(); setTimeout(() => opt.onSwitchMode(), 30); }
        if (b.dataset.act === 'title') { hud.closePanel(); showTitle(); }
        if (b.dataset.act === 'ai') openAiSetup({ hud, ai });
        if (b.dataset.act === 'season') { const ks = Object.keys(SEASONS), n = ks[(ks.indexOf(settings.season || 'auto') + 1) % ks.length]; settings.season = n; save(); b.textContent = SEASONS[n] + (n === 'auto' ? '(' + SEASONS[seasonOf()] + ')' : ''); applySeason(); }
        if (b.dataset.act === 'birth') { hud.closePanel(); setTimeout(openBirthSetup, 30); }
        if (b.dataset.act === 'admin') { hud.closePanel(); setTimeout(() => opt.openAdmin(), 30); }
      });
    const hr = pn.querySelector('.tw-t-hour'), hv = pn.querySelector('.tw-t-hv'), dt = pn.querySelector('.tw-t-date');
    const fmt = v => `${String(Math.floor(v)).padStart(2, '0')}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`;
    hv.textContent = fmt(env.hour);
    hr.addEventListener('input', () => { env.hour = +hr.value; hv.textContent = fmt(+hr.value); });
    dt.addEventListener('change', () => { if (!dt.value) return; const [y, m, d] = dt.value.split('-').map(Number); applyDate(new Date(y, m - 1, d, 12)); pn.querySelectorAll('[data-bl]').forEach(x => x.classList.toggle('on', (x.dataset.bl === '1') === blossomOn)); });
  }));

  function showTitle() {
    started = false;
    hud.title({ look: settings.look, name: settings.name }, startAs);
  }
  // 町へ出かける(最初の画面のボタン・組み込み先からの quickStart の両方)
  function startAs({ look, name }) {
      settings.look = look; settings.name = name; save();
      setLook(look); me.ch.root.position.set(me.x, 0, me.z);
      hud.untag(me.id); hud.tag(me.id, name, true);
      audio.unlock(); audio.play('open'); audio.ambience(true);
      if (!netStarted && net) { net.connect({ id: me.id, name, look }); netStarted = true; }
      started = true;
      if (settings.birth && !settings.birthLock) { settings.birthLock = 1; save(); }
      if (!settings.birth) setTimeout(() => { if (!hud.busy && !appHost.current) openBirthSetup(true); }, 1800);   // はじめに誕生日をとうろく
      else setTimeout(() => birthdayAfter(), 2500);
      bus.emit('start', { name, look });
      opt.onEvent?.('start', { name, look });
  }
  let netStarted = false;
  bus.on('*', (n, d) => { if (n.startsWith('app:') || n === 'talk' || n === 'wallet') opt.onEvent?.(n, d); });

  // ---- カメラ ----
  const CAM_DEF = { pitch: 0.5, dist: 9 };   // ふだんの見え方(引いた位置のうしろから)
  const cam = { yaw: Math.PI, pitch: settings.camView ? settings.camView.pitch : CAM_DEF.pitch, dist: settings.camView ? settings.camView.dist : CAM_DEF.dist, x: me.x, z: me.z };
  // ---- カメラ:ふだん=自分についていく(follow) / 動かす(free:カメラだけ自由に) / 固定(fixed:そこに置いて、自分は歩ける) ----
  let camMode = 'follow';
  const fcam = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0 };
  const heightToV = y => Math.sqrt(Math.max(0, (y - 0.15) / 80)), vToHeight = v => 0.15 + v * v * 80;
  function camFromView() {   // いまの見え方から、動かすカメラの出発点を作る
    const d = new THREE.Vector3(); camera.getWorldDirection(d);
    fcam.x = camera.position.x; fcam.y = camera.position.y; fcam.z = camera.position.z;
    fcam.yaw = Math.atan2(-d.x, -d.z); fcam.pitch = clamp(-Math.asin(clamp(d.y, -1, 1)), -1.5, 1.5);
  }
  function camPreset(name) {
    const sy = cam.yaw, behind = (k) => [me.x + Math.sin(sy) * k, me.z + Math.cos(sy) * k];
    fcam.yaw = sy;
    if (name === 'foot') { [fcam.x, fcam.z] = behind(2.4); fcam.y = 0.22; fcam.pitch = -0.38; }
    else if (name === 'eye') { [fcam.x, fcam.z] = behind(3.4); fcam.y = 1.6; fcam.pitch = 0; }
    else if (name === 'top') { fcam.x = me.x; fcam.z = me.z + 0.001; fcam.y = 40; fcam.pitch = 1.5; }
    else if (name === 'sky') { [fcam.x, fcam.z] = behind(16); fcam.y = 16; fcam.pitch = 0.6; }
    else if (name === 'reset') { delete settings.camView; save(); cam.pitch = CAM_DEF.pitch; cam.dist = CAM_DEF.dist; cam.yaw = me.ry + Math.PI; camMode = 'follow'; me.ch.root.visible = true; hud.toast('カメラをリセットした'); }
    else if (name === 'front') { fcam.x = me.x + Math.sin(me.ry) * 3.4; fcam.z = me.z + Math.cos(me.ry) * 3.4; fcam.y = 1.5; fcam.yaw = me.ry; fcam.pitch = 0.05; }
    camBarDraw();
  }
  const camBar = hud.camBar;
  function camBarDraw() {
    if (camMode === 'follow') { camBar.hidden = true; camBar.innerHTML = ''; return; }
    camBar.hidden = false;
    const free = camMode === 'free';
    camBar.innerHTML = `<div>${free ? '🎥 カメラだけ動かしているよ(左下で移動・ドラッグで向き・ピンチで前後)' : '📌 カメラを固定中。自分は歩けるよ'}</div>
      ${free ? `<div class="r"><button class="tw-btn" data-p="foot">👣 足元から</button><button class="tw-btn" data-p="eye">👀 目の高さ</button><button class="tw-btn" data-p="front">🙂 正面から</button><button class="tw-btn" data-p="sky">🚁 空から</button><button class="tw-btn" data-p="top">🦅 真上から</button><button class="tw-btn" data-p="reset">↺ リセット</button></div>
      <div class="r" style="align-items:center"><span>高さ</span><input type="range" class="hs" min="0" max="1" step="0.005" value="${heightToV(fcam.y).toFixed(3)}"></div>` : ''}
      <div class="r">${free ? '<button class="tw-btn on" data-c="fix">📌 ここで固定</button>' : '<button class="tw-btn on" data-c="free">🎥 また動かす</button>'}<button class="tw-btn" data-c="back">↩ もどす</button></div>`;
  }
  camBar.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; audio.play('tap');
    if (b.dataset.p) camPreset(b.dataset.p);
    else if (b.dataset.c === 'fix') { camMode = 'fixed'; cam.yaw = fcam.yaw; me.ch.root.visible = true; camBarDraw(); hud.toast('カメラをここに固定したよ。📷で撮れるよ'); }
    else if (b.dataset.c === 'free') { camFromView(); camMode = 'free'; camBarDraw(); }
    else if (b.dataset.c === 'back') {   // 合わせたカメラの位置のまま もどる(次からもその見え方。カメラ設定の「リセット」で戻せる)
      const dx = fcam.x - me.x, dz = fcam.z - me.z, dy = fcam.y - 1.3, L = Math.hypot(dx, dy, dz) || 1;
      cam.yaw = Math.atan2(dx, dz); cam.pitch = clamp(Math.asin(clamp(dy / L, -1, 1)), 0.1, 1.2); cam.dist = clamp(L, 3, 14); cam.x = me.x; cam.z = me.z;
      settings.camView = { pitch: +cam.pitch.toFixed(3), dist: +cam.dist.toFixed(2) }; save();
      camMode = 'follow'; camBarDraw(); me.ch.root.visible = true; input.clear();
    }
  };
  camBar.oninput = e => { if (e.target.classList.contains('hs')) fcam.y = vToHeight(+e.target.value); };
  // ---- イベント(花火・日食・月食) ----
  let evt = null, banEl = null;
  const clearBanner = () => { banEl?.remove(); banEl = null; };
  function banner(text, label, fn, ms = 16000) {
    clearBanner(); banEl = document.createElement('div'); banEl.className = 'tw-evt';
    banEl.innerHTML = `<span style="flex:1">${text}</span><button class="tw-btn">${label}</button><button class="tw-btn" data-x style="background:#fff3;color:#fff">×</button>`;
    banEl.querySelector('.tw-btn').onclick = () => { audio.play('tap'); fn && fn(); };
    banEl.querySelector('[data-x]').onclick = clearBanner;
    root.appendChild(banEl); const el = banEl; setTimeout(() => { if (banEl === el) clearBanner(); }, ms);
  }
  function aimAt(x, y, z) {   // 見たい方向へカメラをむける(固定中は動かさない)
    if (camMode === 'fixed') return;
    const bx = camMode === 'free' ? fcam.x : me.x, bz = camMode === 'free' ? fcam.z : me.z, by = camMode === 'free' ? fcam.y : 1.3;
    const dx = x - bx, dz = z - bz, dy = y - by, hl = Math.hypot(dx, dz) || 1;
    if (camMode === 'free') { fcam.yaw = Math.atan2(-dx, -dz); fcam.pitch = clamp(-Math.atan2(dy, hl), -1.5, 1.5); }
    else { cam.yaw = Math.atan2(-dx, -dz); cam.pitch = clamp(-Math.atan2(dy, hl) * 0.9, -1.4, 0.5); }
  }
  const aimFw = () => aimAt(FW_CENTER.x, FW_CENTER.y, FW_CENTER.z);
  const aimSky = kind => { const p = env.skyPos(kind); if (p) aimAt(p.x, p.y, p.z); };
  // 運営が決めた長さ(分)。town:evdur = {fw,solar,lunar,rain} 秒。なければ標準
  const evSec = (k, def) => { const v = +(storage.get('evdur') || {})[k]; return v > 5 ? v : def; };
  function stopEvent() { fw.stop(); env.stopEclipse(); env.stopWeather(); audio.rain(0); if (evt && evt.fw) env.release(); evt = null; clearBanner(); }
  function runEvent(kind, meta = {}) {
    stopEvent(); audio.unlock();
    if (kind === 'rain') {
      env.startWeather(evSec('rain', 120)); evt = { kind, wx: true };
      banner('☔ 雨がふってきたよ。あがったら虹が出るかも', '空を見る', () => aimSky('rain'), 12000);
    } else if (kind === 'solar' || kind === 'lunar') {
      env.startEclipse(kind, evSec(kind, kind === 'solar' ? 100 : 130)); evt = { kind };
      banner(kind === 'solar' ? '🌑 日食がはじまるよ！太陽がかけていくよ' : '🌕 月食がはじまるよ！月が赤くなっていくよ', '空を見る', () => aimSky(kind));
      setTimeout(() => aimSky(kind), 500);
    } else {
      const name = String(kind).replace(/^fw:/, '');
      env.hold(21); fw.show(name, evSec('fw', 0) || 0); evt = { kind, fw: true };
      banner(meta.birthday ? '🎂 お誕生日おめでとう！ 🎆 花火をどうぞ' : '🎆 花火がはじまるよ！北の空を見てね', '花火を見る', aimFw);
      setTimeout(aimFw, 500);
    }
  }
  function endEvent() { if (evt && evt.fw) env.release(); evt = null; clearBanner(); hud.toast('おしまい。また見られるといいね'); }
  const sched = createSchedule({ storage, getBirth: () => settings.birth, canFire: () => started && !appHost.current && !hud.busy && !evt, fire: (ev, meta) => runEvent(ev.kind, meta) });
  let schedT = 2;
  // 誕生日:はじめに1回だけ登録。あとから変えられない(誕生月の無料などのため)
  function openBirthSetup(first) {
    if (settings.birthLock && settings.birth) {
      const [y, m, d] = settings.birth.split('-').map(Number);
      hud.panel(`<h2>誕生日</h2><p class="tw-note">${y}年${m}月${d}日 で登録してあります。誕生日は、あとから変えられません。</p><p class="tw-note">誕生日には、町のみんながお祝いしてくれて、夜にはとくべつな花火が上がるよ。その月は、家のゲーム機のゲームが全部無料!</p><div class="tw-actions"><button class="tw-btn" data-b="close">とじる</button></div>`, e => { if (e.target.closest('[data-b]')) hud.closePanel(); });
      return;
    }
    let sure = '';
    const pn = hud.panel(`<h2>🎂 誕生日をとうろく</h2><p class="tw-note">誕生日には、町のみんながお祝いしてくれます。夜にはあなただけのとくべつな花火と記念写真。その月は、家のゲーム機のゲームが全部無料!</p><p class="tw-note"><b>一度とうろくすると、あとから変えられません。</b>この端末の中だけに保存して、どこにも送りません。</p>
      <div class="tw-row">誕生日<span style="display:flex;gap:6px;align-items:center"><input class="tw-by" inputmode="numeric" maxlength="4" placeholder="2000" style="width:4.2em;font-size:16px;text-align:center"> 年 <input class="tw-bm" inputmode="numeric" maxlength="2" placeholder="5" style="width:2.6em;font-size:16px;text-align:center"> 月 <input class="tw-bdd" inputmode="numeric" maxlength="2" placeholder="20" style="width:2.6em;font-size:16px;text-align:center"> 日</span></div>
      <p class="tw-note tw-bmsg"></p>
      <div class="tw-actions"><button class="tw-btn main" data-b="save">とうろく</button><button class="tw-btn" data-b="close">${first ? 'あとで' : 'とじる'}</button></div>`, (e, p) => {
      const b = e.target.closest('[data-b]')?.dataset.b; if (!b) return;
      const msg = p.querySelector('.tw-bmsg');
      if (b === 'close') { hud.closePanel(); return; }
      const y = +p.querySelector('.tw-by').value, m = +p.querySelector('.tw-bm').value, d = +p.querySelector('.tw-bdd').value, dt = new Date(y, m - 1, d);
      if (!(y > 1900 && y <= new Date().getFullYear()) || dt.getMonth() !== m - 1 || dt.getDate() !== d) { msg.textContent = '日付をたしかめてね'; return; }
      const v = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (sure !== v) { sure = v; msg.innerHTML = `<b>${y}年${m}月${d}日</b> でいい? あとから変えられないよ。もう一度「とうろく」を押すと決まります。`; return; }
      settings.birth = v; settings.birthLock = 1; save(); hud.closePanel(); hud.toast('🎂 誕生日をとうろくしたよ。楽しみにしててね');
    }, { sticky: true });
    pn.querySelectorAll('input').forEach(el => { el.addEventListener('keydown', e => e.stopPropagation()); el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, ''); }); });
  }
  offs.push(bus.on('ui:home', () => {   // 🏠 自宅にもどる(カメラは、カメラボタンを2回押せばもとにもどる)
    if (!started || appHost.current || hud.busy || battle.active || sport.active) return; openApp('home', {});
  }));
  offs.push(bus.on('ui:cam', () => {
    if (!started || appHost.current || hud.busy) return;
    if (camMode === 'follow') { camFromView(); camMode = 'free'; } else { cam.pitch = CAM_DEF.pitch; cam.dist = CAM_DEF.dist; cam.yaw = me.ry + Math.PI; cam.x = me.x; cam.z = me.z; camMode = 'follow'; me.ch.root.visible = true; }   // 2回押し=ふだんの見え方(引いた位置のうしろから)にもどる
    camBarDraw(); input.clear();
  }));
  const ray = new THREE.Raycaster();
  const ndc2 = new THREE.Vector2(), groundPl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); let lastMoveDir = null;

  // ---- 当たり判定 ----
  function collide(x, z, rad = 0.32) {
    for (let k = 0; k < 2; k++) for (const c of city.colliders) {
      if (c.r !== undefined) {
        const dx = x - c.cx, dz = z - c.cz, d = Math.hypot(dx, dz), m = c.r + rad;
        if (d < m && d > 1e-4) { x = c.cx + dx / d * m; z = c.cz + dz / d * m; }
      } else if (x > c.x0 - rad && x < c.x1 + rad && z > c.z0 - rad && z < c.z1 + rad) {
        const l = x - (c.x0 - rad), r = c.x1 + rad - x, t = z - (c.z0 - rad), b = c.z1 + rad - z;
        const m = Math.min(l, r, t, b);
        if (m === l) x = c.x0 - rad; else if (m === r) x = c.x1 + rad; else if (m === t) z = c.z0 - rad; else z = c.z1 + rad;
      }
    }
    return [clamp(x, -70, 70), clamp(z, -78, 70)];
  }

  // ---- ループ ----
  const v3 = new THREE.Vector3(), timer = new THREE.Timer();
  const tagPos = new Map();
  let raf = 0, sendT = 0, saveT = 0, paused = false, held = false, frames = 0, fpsT = 0, fps = 60;
  function resize() {
    const w = root.clientWidth || 1, h = root.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    if (fx) { fx.composer.setPixelRatio(renderer.getPixelRatio()); fx.composer.setSize(w, h); fx.bloom.resolution.set(w, h); }
    camera.fov = w / h < 0.75 ? 62 : 55; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(root); resize(); applyQuality();

  let fpsAcc = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    timer.update(); let dt = Math.min(0.05, timer.getDelta());
    if (settings.lite) { fpsAcc += dt; if (fpsAcc < 0.031) return; dt = Math.min(0.1, fpsAcc); fpsAcc = 0; }   // 低負荷モードは30fps
    if (paused || held || appHost.current) return; // アプリ中は町を止めて電池を節約
    const t = timer.getElapsed();
    const inp = input.read();

    // 自分の移動(カメラの向き基準)
    let mx = inp.mx, my = inp.my;
    if (camMode === 'follow') {
      if (battle.active) { cam.yaw -= inp.camDX * 0.006; cam.pitch = battle.view === 'fp' ? 0.0 : 0.3; cam.dist = battle.view === 'fp' ? 0.2 : 7; me.ch.root.visible = battle.view !== 'fp'; }   // 雪合戦:高さ・距離は固定(ほぼ真うしろ・ほんの少し上)。左右は自由。「👁」で一人称にもできる
      else {
      cam.yaw -= inp.camDX * 0.006; cam.pitch = clamp(cam.pitch + inp.camDY * 0.004, -1.5, 1.5);
      cam.dist = clamp(cam.dist + inp.zoom * 0.6, 1.6, 14);   // もっと近くまで寄れる(寄りすぎたら自分は消える)
      me.ch.root.visible = cam.dist > 1.9; }
    } else if (camMode === 'free') {   // カメラだけ動かす(自分はその場)
      fcam.yaw -= inp.camDX * 0.006; fcam.pitch = clamp(fcam.pitch + inp.camDY * 0.004, -1.5, 1.5);
      const sp = (inp.run ? 24 : 8) * dt, c = Math.cos(fcam.yaw), s = Math.sin(fcam.yaw), cp = Math.cos(fcam.pitch);
      fcam.x += (mx * c + my * s) * sp; fcam.z += (-mx * s + my * c) * sp;
      const z = -inp.zoom * 0.9; fcam.x += -s * cp * z; fcam.y += -Math.sin(fcam.pitch) * z; fcam.z += -c * cp * z;
      fcam.x = clamp(fcam.x, -240, 240); fcam.z = clamp(fcam.z, -240, 240); fcam.y = clamp(fcam.y, 0.15, 90);
      mx = my = 0; me.ch.root.visible = true;
      const hs = camBar.querySelector('.hs'); if (hs && document.activeElement !== hs) hs.value = heightToV(fcam.y).toFixed(3);
    } else me.ch.root.visible = true;
    if (!started || hud.busy) mx = my = 0;
    const bld = seasons.building();
    if (snow.making || bld || battle.making || battle.rolling || sport.active || dodgeT > 0) mx = my = 0;   // 雪玉をつくっている間は動けない(転がり中も)
    if (seat) { if (Math.hypot(mx, my) > 0.35) standFromSeat(); mx = my = 0; }
    const mag = Math.min(1, Math.hypot(mx, my)); let lastMove = null;
    const guided = guideStep(dt, mag);   // 住人に連れて行ってもらっている間は、自動で歩く
    const target = mag > 0.05 ? (inp.run ? 12 : 6.8) * Math.max(mag, 0.4) * pullBoost : 0;
    if (!guided) me.speed += (target - me.speed) * Math.min(1, dt * 10);
    if (mag > 0.05 && !guided) {
      const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
      const wx = (mx * c + my * s) / mag, wz = (-mx * s + my * c) / mag; lastMove = { x: wx, z: wz };
      me.ry = angleLerp(me.ry, Math.atan2(wx, wz), Math.min(1, dt * 12));
      [me.x, me.z] = collide(me.x + wx * me.speed * dt * (seasons.carrying() ? 0.6 : 1), me.z + wz * me.speed * dt * (seasons.carrying() ? 0.6 : 1));   // 雪だるまを持っていると、ゆっくり
    }
    lastMoveDir = lastMove;
    if (dodgeCd > 0) dodgeCd -= dt;
    if (dodgeT > 0) { dodgeT -= dt; me.ry = Math.atan2(ddx, ddz); me.speed = 8; [me.x, me.z] = collide(me.x + ddx * 8.5 * dt, me.z + ddz * 8.5 * dt); }
    me.ch.root.position.set(me.x, seat ? -0.04 : 0, me.z); me.ch.root.rotation.y = me.ry;
    if (!seat && !battle.active) { if (snow.making || bld) me.ch.pose = 'kneel'; else if (me.ch.pose === 'kneel') me.ch.pose = null; }
    me.ch.update(dt, me.speed);
    { const rg = me.ch.rig;   // よけている間はくるっと回る / 雪だるまを持っている間は両手を上げる
      if (rg) { if (dodgeT > 0) { rollPose(rg, 1 - dodgeT / 0.55); dodgeRot = true; } else if (dodgeRot) { rollReset(rg); dodgeRot = false; }
        if ((snow.making || bld) && !battle.active) { rg.body.rotation.x = 0.35; rg.arms[0].rotation.x = rg.arms[1].rotation.x = -1.25; rg.arms[0].rotation.z = -0.1; rg.arms[1].rotation.z = 0.1; } else if (!seasons.carrying() && !dodgeRot && rg.body.rotation.x === 0.35) rg.body.rotation.x = 0;
        if (seasons.carrying()) { rg.arms[0].rotation.x = rg.arms[1].rotation.x = -2.95; rg.arms[0].rotation.z = 0.35; rg.arms[1].rotation.z = -0.35; } } }

    // カメラ:後ろから少し見下ろす。建物にめり込むときは手前に寄せる
    const ft = (date && date.focus) || sport.focus() || me;   // ゴルフ・フリスビーで飛んでいる間は、ボールを追う
    cam.x += (ft.x - cam.x) * Math.min(1, dt * 8); cam.z += (ft.z - cam.z) * Math.min(1, dt * 8);
    if (camMode === 'free') { camera.position.set(fcam.x, fcam.y, fcam.z); const cp = Math.cos(fcam.pitch); camera.lookAt(fcam.x - Math.sin(fcam.yaw) * cp, fcam.y - Math.sin(fcam.pitch), fcam.z - Math.cos(fcam.yaw) * cp); }
    if (camMode === 'follow') {
    const look = v3.set(cam.x, 1.3, cam.z);
    const op = Math.max(cam.pitch, 0.1);   // 下向きは、そのまま見上げる(カメラは地面にもぐらせない)
    const off = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(op), Math.sin(op), Math.cos(cam.yaw) * Math.cos(op));
    let dist = cam.dist;
    ray.set(look, off); ray.far = dist;
    const hit = ray.intersectObjects(city.meshes, false)[0];
    if (hit) dist = Math.max(1.4, hit.distance - 1.0);
    // 建物(ひさし含む)の中にカメラが入らないよう、手前に引き寄せる
    for (let k = 0; k < 14; k++) {
      const px = look.x + off.x * dist, pz = look.z + off.z * dist;
      if (!city.colliders.some(c => c.x0 !== undefined && px > c.x0 - 1.4 && px < c.x1 + 1.4 && pz > c.z0 - 1.4 && pz < c.z1 + 1.4 && !(look.x > c.x0 - 1.4 && look.x < c.x1 + 1.4 && look.z > c.z0 - 1.4 && look.z < c.z1 + 1.4))) break;
      dist = Math.max(1.4, dist - 0.5);
    }
    if (battle.active && battle.view === 'fp') {   // 一人称:自分の目の高さから、向いている方を見る(yaw はカメラ=見ている向き)
      camera.position.set(me.x, 1.55, me.z); camera.lookAt(me.x - Math.sin(cam.yaw), 1.45, me.z - Math.cos(cam.yaw));
    } else {
    camera.position.copy(look).addScaledVector(off, dist);
    camera.lookAt(look);
    if (cam.pitch < 0.1) camera.rotateX(0.1 - cam.pitch);   // 真上まで見上げられる
    }
    }

    if (talkingTo && !hud.busy) { talkingTo.talking = false; talkingTo = null; }   // 会話が終わっているのに止まったままの住人を放す
    for (const r of residents.list) if (r.talking && r !== talkingTo) r.talking = false;
    tipUpdate(dt); hanaUpdate(dt); birthdayUpdate(dt);
    env.camera = camera; env.update(dt, me.ch.root.position);
    seasons.update(dt, camera.position, env.night || 0); seasons.holdAt(me.x, me.z, me.ry);
    if (fw.busy) fw.update(dt, camera, renderer.domElement.clientHeight || 600);
    if (env.weather || evt?.wx) audio.rain(env.rainLevel || 0);
    if (evt?.wx && !evt.bowSaid && env.weather && env.weather.bow > 0.25) { evt.bowSaid = true; banner('🌈 虹が出たよ！', '虹を見る', () => aimSky('rain'), 15000); }
    if (evt) { if (evt.wx ? !env.weather : evt.fw ? !fw.busy : !env.eclipse) endEvent(); }
    if ((schedT -= dt) <= 0) { schedT = 3; sched.check(); }
    city.update(t, env.hour);
    ambient.update(dt, t, me.ch.root.position, env.night, me.speed);
    hud.setFeed(started && !hud.busy && ambient.pigeonsNear(me.ch.root.position, 10));
    { const sn = seasons.carrying() ? null : seasons.nearest(me.x, me.z, 2.4);
      hud.setSnow(started && seasons.season === 'winter' && !battle.active && !sport.active, snow.making ? '❄️\nころころ' : snow.holding ? '❄️\n投げてね' : seasons.carrying() ? '❄️\n雪玉' : '❄️\n雪玉', seasons.carrying() ? '🙌\n雪だるま' : sn ? '🙌\n雪だるま' : '⛄\n雪だるま', snow.making || snow.holding);
      hud.setDodge(started && !battle.active && !sport.active); }
    snow.update(dt);
    battle.update(dt, lastMove);
    sport.update(dt);
    residents.update(dt, env.hour, me);

    // ほかのプレイヤー(なめらかに追いかける)
    for (const [, q] of peers) {
      const p = q.ch.root.position, k = Math.min(1, dt * 8);
      const dx = q.tx - p.x, dz = q.tz - p.z;
      p.x += dx * k; p.z += dz * k;
      q.ch.root.rotation.y = angleLerp(q.ch.root.rotation.y, q.ry, k);
      q.ch.update(dt, q.mv ? Math.min(4, Math.hypot(dx, dz) / dt) || 2.6 : 0);
    }
    sendT += dt;
    if (net && started && sendT > 0.12) { sendT = 0; net.sendState({ x: me.x, z: me.z, ry: me.ry, mv: me.speed > 0.2 ? 1 : 0 }); }

    // 近くの話し相手・入口を探す(前方を優先)
    focus = null;
    if (started && !hud.busy) {
      let best = 1e9;
      const fx = Math.sin(me.ry), fz = Math.cos(me.ry);
      const consider = (o, x, z, r) => {
        const dx = x - me.x, dz = z - me.z, d = Math.hypot(dx, dz);
        if (d > r) return;
        const score = d - ((dx * fx + dz * fz) / (d || 1)) * 0.6;
        if (score < best) { best = score; focus = o; }
      };
      for (const r of residents.list) if (r.ch.root.visible) consider({ kind: 'npc', ref: r, label: `${r.def.name}と話す` }, r.ch.root.position.x, r.ch.root.position.z, 2.3);
      for (const it of city.interact) if (!it.season || it.season === seasons.season) consider(it, it.x, it.z, it.r);
    }
    if (battle.active || sport.active) focus = null;
    if (focus && focus.kind === 'spot' && focus.id === 'board' && (seasons.season === 'spring' || seasons.season === 'autumn')) focus = { ...focus, label: seasons.season === 'spring' ? '📋⛳ 掲示板(きょうのゴルフ)' : '📋🥏 掲示板(きょうのフリスビー)' };
    if (focus && focus.kind === 'npc') { const n = nearNpcs().length; if (n >= 2) focus.label = `ちかくの人と話す(${n}人)`; }
    if (seat && seat.piano) focus = { kind: 'piano', label: '🎹 曲をえらぶ' };
    else if (seat) focus = seat.hana && seat.hana.pin ? { kind: 'benchtalk', label: `💬 ${seat.hana.def.name}と話す` } : { kind: 'stand', label: '🧍 立つ' };
    hud.setAction(focus ? focus.label : null);

    // 名前と吹き出しの位置
    tagPos.clear();
    const W = root.clientWidth, H = root.clientHeight;
    const put = (id, obj, hgt, showName) => {
      v3.set(obj.position.x, hgt, obj.position.z);
      const d = v3.distanceTo(camera.position);
      v3.project(camera);
      tagPos.set(id, { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H, visible: obj.visible && v3.z < 1 && d < 30, showName: showName && d < 18 });
    };
    put(me.id, me.ch.root, 1.95, false);
    for (const [id, q] of peers) put(id, q.ch.root, 1.95, true);
    for (const r of residents.list) put('npc:' + r.def.id, r.ch.root, r.def.mascot ? 1.25 : 1.95, focus?.ref === r || Math.hypot(r.ch.root.position.x - me.x, r.ch.root.position.z - me.z) < 6);
    hud.placeTags(tagPos);

    hud.setArea(city.areaName(me.x, me.z));
    hud.setClock(env.hour);
    saveT += dt;
    if (saveT > 5) { saveT = 0; storage.set('pos', [+me.x.toFixed(1), +me.z.toFixed(1)]); storage.set('hour', +env.hour.toFixed(2)); }

    if (fx) fx.composer.render(dt); else renderer.render(scene, camera);
    frames++; fpsT += dt;
    if (fpsT > 1) { fps = frames / fpsT; frames = 0; fpsT = 0; }
  }

  // バックグラウンドでは止める
  const vis = () => { if (document.hidden) { paused = true; audio.suspend(); } else { paused = false; timer.update(); if (!held) audio.resume(); } };
  on(document, 'visibilitychange', vis);
  on(root, 'pointerdown', () => audio.unlock(), { once: true });

  frame();
  if (opt.skipTitle) { settings.name ||= LOOKS[settings.look].name; started = true; hud.tag(me.id, settings.name, true); net?.connect({ id: me.id, name: settings.name, look: settings.look }); netStarted = true; }
  else showTitle();
  opt.onEvent?.('ready', { version: VERSION });

  return {
    version: VERSION,
    bus, ai: { get ready() { return ai.ready; }, configure: o => ai.configure(o), get state() { return ai.state; } },
    openApp: (id, p) => openApp(id, p),
    closeApp: () => appHost.close(),
    registerApp: def => appHost.register(def),
    setHour: h => { env.hour = h; },
    meteor: () => env.meteorNow(),
    setMoon: ph => env.setMoon(ph),
    notes: () => notes.map(n => ({ ...n })),
    getState: () => ({ speed: +me.speed.toFixed(1), npcs: Object.fromEntries(residents.list.map(r => [r.def.id, [+r.ch.root.position.x.toFixed(1), +r.ch.root.position.z.toFixed(1), r.ch.root.visible]])), cam: [+camera.position.x.toFixed(2), +camera.position.y.toFixed(2), +camera.position.z.toFixed(2)], started, app: appHost.current, area: city.areaName(me.x, me.z), x: me.x, z: me.z, hour: env.hour, coins: wallet.get(), fps: Math.round(fps), peers: peers.size, focus: focus?.label || null }),
    moveNpc: (id, x, z) => { const r = residents.list.find(q => q.def.id === id); if (r) r.ch.root.position.set(x, 0, z); },
    // 最初の画面を飛ばして町へ(前に選んだキャラ。はじめてなら最初のキャラ)
    // イベント(運営画面から。テスト用)
    event: { birthday: k => birthdayTestRun(k), lengths: () => { const o = {}; for (const n of Object.keys(FW_SHOWS)) { fw.show(n); o[n] = Math.round(fw.showLength); } fw.stop(); o.solar = 100; o.lunar = 130; o.rain = 120; return o; }, seek: f => { if (env.eclipse) env.eclipse.t = f * env.eclipse.dur; if (env.weather) env.weather.t = f * env.weather.dur; }, sec: evSec, run: runEvent, stop: stopEvent, kinds: EVENT_KINDS, fwTypes: FW_TYPES, fwShows: FW_SHOWS, check: () => sched.check(), list: () => sched.list(), get now() { return evt ? evt.kind : null; } },
    cameraMode: () => camMode,
    season: s => { if (s) { settings.season = s; save(); applySeason(); } return curSeason(); },
    quickStart: () => { if (started) return; document.querySelectorAll('.tw-title').forEach(e => e.remove()); startAs({ look: settings.look, name: settings.name || LOOKS[settings.look].name }); },
    // 町の中のもの(app の id。例 'omikuji')の前へ飛んで、そちらを向く
    goToApp: id => { const i = city.interact.find(x => x.app === id); if (!i) return false; const x = i.x, z = i.z + 2; me.x = x; me.z = z; me.ry = Math.atan2(i.x - x, i.z - z); me.speed = 0; cam.yaw = me.ry + Math.PI; cam.x = x; cam.z = z; return true; },
    snowState: () => { const B = battle.state; return B && { phase: B.phase, men: B.men.map(m => { const v = new THREE.Vector3(m.x, 0.6, m.z).project(camera); return [m.x, m.z, m.hp, m.g.scale.x, !!m.g.parent, m.g.visible, +v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(3), m.g.children.length, m.g.children[0].visible]; }), me: [me.x, me.z, me.ry], F: B.F.map(f => [f.name, f.x, f.z, f.hp]) }; },
    sportStart: k => sport.start(k),   // テスト用
    npc: id => residents.list.find(x => x.def.id === id),   // テスト用
    benchNear: () => { const b = city.interact.filter(i => i.kind === 'bench').sort((a, c) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(c.x - me.x, c.z - me.z))[0]; me.x = b.x + Math.sin(b.ry) * 1.2; me.z = b.z + Math.cos(b.ry) * 1.2; sitOnBench(b); },   // テスト用
    npcAct: (id, act) => { const r = residents.list.find(x => x.def.id === id); if (!r) return false; const p = r.ch.root.position; me.x = p.x + 1.2; me.z = p.z; if (act) doAct(r, { act }); else talkTo(r); return true; },   // テスト用
    snowBattle: id => battle.start(residents.list.find(r => r.def.id === id) || residents.list[0], 2),   // テスト用
    teleport: (x, z, ry) => { me.x = x; me.z = z; if (ry !== undefined) { me.ry = ry; cam.yaw = ry + Math.PI; } cam.x = x; cam.z = z; },
    action: doAction,
    // 組み込み先がゲームを開いている間は止める(描画も音も)
    pause() { held = true; input.clear(); audio.suspend(); },
    resume() { held = false; timer.update(); input.clear(); audio.resume(); hud.setCoins(wallet.get(), gemsNow()); },
    unmount() {
      fw.dispose(); seasons.dispose(); clearBanner();
      cancelAnimationFrame(raf); ro.disconnect(); offs.forEach(f => f()); appHost.close(); input.dispose(); hud.dispose(); net?.disconnect(); audio.dispose(); bus.clear();
      scene.traverse(o => { o.geometry?.dispose(); });
      renderer.dispose(); renderer.forceContextLoss?.(); root.remove();
      if (--styleRefs === 0) document.querySelector('style[data-town]')?.remove();
    },
  };
}
