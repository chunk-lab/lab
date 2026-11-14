// ほしみや町:公開 API は mount(要素, 設定) → { unmount, ... } だけ
import { receipt } from './ui/pay.js';
import * as THREE from 'three';
import { createBus, createStorage, createWallet, angleLerp, clamp } from './core/core.js';
import { weather } from './game/weather.js';
import { social, PREFS, memory, DATE_FIRST } from './game/social.js';
import { finds, setAreaName, setSpotValid, loadHuntFile, TREASURES } from './game/finds.js';
import { createSocialUI } from './ui/social_ui.js';
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
import { useGlb, glbStat, glbPreload, glbWarm, setGlbConc, setGlbSize, SIZE_NOW } from './world/glbchar.js';
// プレイヤーの背(3Dモデル)。確認用: URL に ?playersize=1.8 で変えられる
const PLAYER_H = (() => { try { return parseFloat(new URLSearchParams(location.search).get('playersize')) || 1.6; } catch (e) { return 1.6; } })();
import { setBuildingOutline, eachFoliage, eachTex } from './world/kit.js';
import { createSeasons, SEASONS, seasonOf } from './world/seasons.js';
import { createSnowballs } from './world/snowballs.js';
import { createSnowBattle } from './world/snowbattle.js';
import { createSport } from './world/sport.js';
import { createResidents, period, findPath, nearestNode, outingOf } from './game/npc.js';
import { createInput } from './game/input.js';
import { createHud, CSS } from './ui/hud.js';
import { APPS } from './apps/registry.js';
import { openFinder } from './ui/finder.js';
import { openNotes } from './ui/notes.js';
import { createSparkles } from './world/sparkle.js';
import { snapCanvas, shotCard, flash, photos } from './game/photos.js';
import { createFireworks, FW_TYPES, FW_SHOWS, FW_CENTER } from './world/fireworks.js';
import { createSchedule, EVENT_KINDS } from './world/events.js';

let styleRefs = 0;
const VERSION = '0.1.0';

export function mount(container, opt = {}) {
  const bus = createBus();
  const storage = opt.storage || createStorage(opt.storagePrefix || 'town:');
  const settings = Object.assign({ quality: matchMedia('(pointer:coarse)').matches ? 'mid' : 'high', timeSpeed: 1, replyLen: 'normal', adult: 0, birth: '', en: 1, enShort: 0, enLevel: 'easy', tips: 1, look: 'mio', name: '', bgm: 0.5, sfx: 0.7 }, storage.get('settings') || {});
  const save = () => storage.set('settings', settings);
  const wallet = opt.wallet || createWallet(storage, bus);   // 組み込み先から共通の財布を渡せる(2Dと3Dで同じコイン)
  const ai = createAI(storage);
  const PERIOD = { morning: '朝', day: '昼', evening: '夕方', night: '夜' };
  const audio = createAudio(); audio.set({ bgm: settings.bgm, sfx: settings.sfx });
  const offs = [];
  if (!opt.openAdmin) { SIZE_NOW.npc = 2.0; SIZE_NOW.player = 1.7; SIZE_NOW.mascot = 1.0; }   // 大きさを変えられるのは運営だけ(一般は 住人2.0・自分1.7 で固定)
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
  let curWx = weather.now(); env.setAmbient(curWx, true);   // ふだんの天気(3時間ごと。町と釣りで共通)
  const _d = new Date(), _md = (_d.getMonth() + 1) * 100 + _d.getDate();
  const blossom = opt.blossom ?? (_md >= 325 && _md <= 420);   // 桜は春(3/25〜4/20)だけ
  const city = buildCity(scene, { quality: settings.quality, blossom });
  setSpotValid((x, z) => { const c = collide(x, z, 1.0); return Math.hypot(c[0] - x, c[1] - z) < 0.01; });   // ひろいものは、池・噴水・建物・柵の中や、近づけない所に置かない
  setAreaName((x, z) => city.areaName(x, z)); loadHuntFile();   // 調べる:場所の名前・運営の宝探し(apps/hunt.json)
  const ambient = buildAmbient(scene, city, { quality: settings.quality, blossom });
  let blossomOn = blossom, testDate = new Date();
  const setBlossom = on => { blossomOn = on; city.setBlossom(on); ambient.setBlossom(on); seasons.petals(on); };
  const seasons = createSeasons(scene, { eachFoliage, eachTex, trees: city.trees, groundMats: city.groundMats, colliders: city.colliders, storage });
  const curSeason = () => settings.season && settings.season !== 'auto' ? settings.season : seasonOf();
  const applySeason = () => { const s = curSeason(); seasons.set(s); setBlossom(opt.blossom ?? s === 'spring'); };
  const applyDate = d => { testDate = d; env.setMoonDate(d); const md = (d.getMonth() + 1) * 100 + d.getDate(); setBlossom(opt.blossom ?? (md >= 325 && md <= 420)); };
  applySeason();
  let sportHid = null;
  const residents = createResidents(scene, city.graph, () => env.hour, (x, z, r) => collide(x, z, r));
  residents.outing = outingOf(testDate);   // お出かけの日(ルナ)
  // 町の雪玉(冬だけ)
  const NPC_SNOW = { mii: ['ひゃっ、つめたい〜! もう、やりましたね〜', 1], baron: ['ぬおっ! わが輩に雪玉とは、いい度胸だ!', 2], gon: ['つめてっ! やったな〜!', 3], koharu: ['きゃっ! ふふ、元気ですね', 1], shiori: ['……つめたい。……おかえし、しましょうか', 2], suna: ['おやおや、冷たいねえ', 2], maru: ['うわっ! まいったな〜!', 2], yuzu: ['ひゃっ! び、びっくりしたです', 1], chunkkun: ['ふわっ!? 雪だ〜!', 1] };
  const snow = createSnowballs(scene, {
    camera, meshes: city.meshes, residents,
    getHand: () => snow.making ? new THREE.Vector3(me.x + Math.sin(me.ry) * 0.5, 0.2, me.z + Math.cos(me.ry) * 0.5) : new THREE.Vector3(me.x + Math.sin(me.ry) * 0.38 + Math.cos(me.ry) * 0.22, 1.05, me.z + Math.cos(me.ry) * 0.38 - Math.sin(me.ry) * 0.22),
    onNpcHit(r) {
      const [line, lv] = NPC_SNOW[r.def.id] || ['わっ! つめたい!', 2];
      audio.play('wave'); hud.say('npc:' + r.def.id, line, 3);
      if (battle.active) return;
      setTimeout(() => { if (!started || hud.busy || appHost.current || battle.active) return; hud.dialog({ name: r.def.name, role: r.def.role, text: `${line} 雪合戦で勝負する?`, choices: [{ label: '⛄ ここで勝負!(2対2)', fn: () => battle.start(r, lv) }, { label: 'やめておく', fn: () => { } }] }); }, 1100);
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
    exprPool: () => opt.exprPool?.() || null,
    onGive(x, kind) {   // 1ホールごとにもらった表現:その場で勉強ノートと今日のふりかえりに入れる
      opt.onEvent?.('app:event', { name: 'learn', data: { kind: 'expr', en: x.en, ja: x.ja, src: '今日の表現' } });
    },
    onExpr(list, practice, kind) {   // ホールでもらった表現:勉強ノート・今日のふりかえり・英ラボ(自動登録)へ。開くのは「英ラボで使ってみる」を押したときだけ
      const src = '今日の表現';
      list.forEach(x => opt.onEvent?.('app:event', { name: 'learn', data: { kind: 'expr', en: x.en, ja: x.ja, src, ex: x.ex, exja: x.exja } }));
      if (list.length) opt.onEvent?.('app:event', { name: 'eigo', data: { open: !!practice, items: list.map((x, i) => ({ en: x.en, ja: x.ja, ex: x.ex, exja: x.exja, ai: x.ai, play: !!practice && i === 0 })) } });
    },
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
  { const s0 = sport.start; sport.start = (k, o) => { opt.exprPool?.(); markPlay(k); actSport(k === 'golf' ? 'ミニゴルフ' : 'フリスビー'); return s0(k, o); }; }   // 最後に遊んだ日を記録(しばらく遊んでいないものに、さそう)

  storage.set('pid', me.id);
  const last = storage.get('pos'); if (last) { me.x = last[0]; me.z = last[1]; }
  function setLook(id) {
    if (me.ch) scene.remove(me.ch.root);
    me.ch = useGlb(makeCharacter(LOOKS[id] || LOOKS.mio), (id === 'ren' ? 'self:ren' : id === 'mio' ? 'self:mio' : 'player:' + (LOOKS[id] ? id : 'mio')), { height: PLAYER_H });
    scene.add(me.ch.root);
  }
  // 自分のキャラは れん(男の子)・みお(女の子)の2人だけ。はな・そらは住人になったので、前に選んでいた人は近いほうへ
  if (!LOOK_IDS.includes(settings.look)) { const was = settings.look, nw = was === 'sora' ? 'ren' : 'mio'; if (!settings.name || settings.name === (LOOKS[was] || {}).name) settings.name = settings.name ? LOOKS[nw].name : settings.name; settings.look = nw; save(); }
  setLook(settings.look);

  const hud = createHud(root, bus);
  const gemsNow = () => (opt.gems ? opt.gems.get() : null);   // ダイヤ(組み込み先があるときだけ表示)
  const appHost = createAppHost({ route: (id, p) => openApp(id, p), paramsFor: (id, p) => id === 'fortune' ? { ...(p || {}), ...fortuneParams() } : id === 'home' ? (medalCheck(), { ...(p || {}), guest: hanaGuest() }) : id === 'gamebox' || id === 'amuse' ? { ...(p || {}), season: curSeason(), guest: hanaGuest() } : id === 'fishing' ? { ...(p || {}), hour: env.hour, season: curSeason(), rain: !!(env.weather && env.weather.rain > 0.2) } : p, root, bus, storage, wallet, getPlayer: () => ({ id: me.id, name: settings.name, look: settings.look }), getAudio: () => audio.get(), getNotes: () => notes.map(n => ({ ...n })), features: opt.features || [], gems: opt.gems || null, house: opt.house || null, photo: opt.photo || null, member: { paid: () => !!(opt.member?.paid?.()) || isBirthMonth(), birthday: () => isBirthMonth() }, dictUrl: opt.dictUrl || null, learn: opt.learn || null });
  APPS.forEach(a => appHost.register(a));
  (opt.apps || []).forEach(a => appHost.register(a)); // 組み込み先から足すアプリ
  { // 運営用:町から直接「英語の釣り堀」を開くボタン(?admin=1 で出る)
    let adm = false; try { const q = new URLSearchParams(location.search).get('admin'); if (q === '1') localStorage.setItem('cs:core:admin', 'true'); else if (q === '0') localStorage.removeItem('cs:core:admin'); adm = JSON.parse(localStorage.getItem('cs:core:admin')) === true; } catch (e) { }
    if (adm) { const b = document.createElement('button'); b.className = 'tw-btn'; b.textContent = '🛠🎣 英語の釣り堀'; b.style.cssText = 'position:absolute;left:12px;bottom:calc(124px + var(--tw-bot));z-index:5;font-weight:800'; b.onclick = () => { if (!started || appHost.current || hud.busy) return; openApp('fishing', { tab: 'en' }); }; root.append(b); const tg = setInterval(() => { b.style.display = (!started || appHost.current || hud.busy) ? "none" : ""; }, 400); offs.push(() => clearInterval(tg)); }
  }
  hud.setCoins(wallet.get(), gemsNow());
  if (opt.gems?.onChange) offs.push(opt.gems.onChange(() => bus.emit('wallet', { coins: wallet.get(), delta: 0, reason: 'sync' })));   // ダイヤが変わったら、コインと同じ知らせで表示を書きかえる(定期的な読み直しはしない)

  // ---- 他のプレイヤー ----
  const peers = new Map();
  const net = opt.net === 'none' ? null : opt.net && typeof opt.net === 'object' ? opt.net : opt.netUrl ? createWsNet(opt.netUrl, opt.room) : createLocalNet({ graph: city.graph, looks: LOOK_IDS.map(k => LOOKS[k]) });
  if (net) {
    net.on('join', p => {
      if (peers.has(p.id)) return;
      const ch = useGlb(makeCharacter(typeof p.look === 'string' ? LOOKS[p.look] || LOOKS.ren : p.look || LOOKS.ren), 'player:' + (p.look === 'mio' ? 'mio' : 'ren'), { height: PLAYER_H });   // ほかのプレイヤーは、かんたんな体(player:)。自分の体(self:)とは別
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
    const hana = residents.list.find(x => isComp(x) && x.follow && !x.pin);
    let lx = Math.max(-0.55, Math.min(0.55, dx * c - dz * s)); const lz = -0.02;
    if (hana) lx = -0.36;   // はなちゃんと2人で:はなちゃんは左どなり
    me.x = b.x + lx * c + lz * s; me.z = b.z - lx * s + lz * c; me.ry = b.ry; me.speed = 0;
    seat = { b }; me.ch.pose = 'sit'; me.ch.seatH = 0.54; input.clear();
    if (hana) {
      const hx = 0.36; hana.pin = { x: b.x + hx * c + lz * s, z: b.z - hx * s + lz * c, y: 0, ry: b.ry, pose: 'sit', bench: true }; hana.ch.seatH = 0.54;
      seat.hana = hana; say1(hana, hana.def.id === 'sora' ? ['ふぅ、ちょっと休もうか', 'ここ、いい場所だよな'] : ['ふぅ〜、ちょっと休けい!', 'ここ、すわり心地いいね', 'となり、いい?'], 3);
    }
  }
  const benchSit = () => `いま「${settings.name || 'あなた'}」と、${city.areaName(me.x, me.z)}のベンチにならんですわって、手をつないでいる。`;
  function standFromSeat() {
    if (!seat) return; const b = seat.b, h = seat.hana; seat = null; me.ch.pose = null; me.ch.seatH = null; if (h) h.ch.seatH = null;
    [me.x, me.z] = collide(b.x + Math.sin(b.ry) * 1.1, b.z + Math.cos(b.ry) * 1.1);
    if (h && h.pin && h.pin.bench) { h.pin = null; h.ch.pose = null; h.ch.root.position.set(me.x + Math.cos(me.ry) * 0.62, 0, me.z - Math.sin(me.ry) * 0.62); h.hold = false; h.reT = 0.5; }
  }
  function doAction() {
    if (!started || appHost.current || hud.busy || !focus) return;
    audio.unlock();
    if (focus.kind === 'stand') { standFromSeat(); return; }
    if (focus.kind === 'benchtalk') { const r = seat.hana; if (!ai.ready) { openAiSetup({ hud, ai, onDone: () => freeChat(r, 'ねえねえ、なに話す?', benchSit(), true) }); return; } freeChat(r, ['ねえねえ、なに話す?', 'のんびりするの、いいね〜', 'ここ、風が気持ちいいね'][Math.floor(Math.random() * 3)], benchSit(), true); return; }
    if (focus.kind === 'bench') { sitOnBench(focus); return; }
    if (focus.kind === 'find') { soc.takeFind(focus.ref); return; }
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
  const bumpUse = k => { const u = storage.get('menuUsed') || {}; u[k] = (u[k] || 0) + 1; storage.set('menuUsed', u); };   // 項目を使った回数(あまりやらない遊びを勧めるのに使う)
  function talkTo(r) {
    input.clear(); r.talking = true; talkingTo = r;
    audio.play('talk');
    let text = residents.lineFor(r, env.hour);
    if (r.def.angler && seasons.season !== 'summer') text = 'のんびり釣りは夏だけのお楽しみでねえ。英語の釣り堀なら、いつでも池においで。';
    const lunaOut = r.def.id === 'luna' && r.ch.root.visible && !appHost.current;   // ルナが外にいる=お出かけ中(館の道具がないので占いはできない)
    if (lunaOut) text = ['たまには外の空気を吸わないとね。星も、昼は休んでいるのよ。', 'あら、こんなところで会うなんて。…これも星の導きかしら。', '夕方には館にもどるわ。占いはそれからね。'][Math.floor(Math.random() * 3)];
    if (isComp(r) && r.follow) text = (r.def.id === 'sora' ? ['ん? どうした?', 'なに?', 'おう、どうした?'] : ['なになに?', 'どうしたの?', 'ん? よんだ?'])[Math.floor(Math.random() * 3)];
    soc.onTalk(r);
    // ---- 話しかけたときのメニュー: ひと言(自動)のあとに「勉強」と「遊び」だけ。くわしい項目は、おして出た2段目に ----
    const kindOf = m => (['school', 'library'].includes(m.app) || ['consult', 'soranote', 'quote'].includes(m.act)) ? 'study' : ['follow', 'date', 'invite'].includes(m.act) ? 'bond' : 'play';
    const DESC = { school: '英語の練習ができるよ', library: '長い英文が読めるよ', shop: 'おみやげが買えるよ', omikuji: '運だめしができるよ', fortune: '星で占ってくれるよ', fishing: 'のんびり釣りができるよ', chunkcards: 'カードで勝負できるよ', ogiri: '大喜利で勝負できるよ', quote: '格言を聞けるよ', consult: '英語の相談にのるよ', follow: '一緒に歩けるよ', date: 'カフェでデートできるよ', harmonica: 'オカリナを吹いてもらえるよ' };
    const usedM = storage.get('menuUsed') || {}, APPK = ['school', 'library', 'shop', 'omikuji', 'fortune', 'fishing', 'chunkcards', 'fishing-en'], markM = k => { if (k && !APPK.includes(k)) bumpUse(k); };   // アプリは openApp の中で数える(二重に数えない)
    const backToTalk = () => { const off = bus.on('app:close', () => { off(); setTimeout(() => { if (!appHost.current && !hud.busy && started) talkTo(r); }, 450); }); };   // 釣りから出たら、会話にもどる
    const items = (r.def.menu || []).filter(m => (!m.season || m.season === seasons.season) && soc.menuOk(m) && !(lunaOut && m.app === 'fortune')).map(m => ({ k: kindOf(m), key: m.app || m.act, label: m.act === 'follow' && r.follow ? 'ここでバイバイ' : m.label, fn: () => { if (m.act) return doAct(r, m); openApp(m.app, m.params); if (m.app === 'fishing') backToTalk(); } }));
    if (r.def.id === 'suna') items.push({ k: 'study', key: 'fishing-en', label: '🎣 英語の釣り堀', fn: () => { openApp('fishing', { tab: 'en' }); backToTalk(); } });
    items.push(...soc.choices(r));
    if (!r.def.companion && isComp(r)) items.push({ k: 'bond', key: 'follow', label: r.follow ? 'ここでバイバイ' : '手をつないで一緒に歩こう', fn: () => hanaFollow(r, !r.follow) }, { k: 'bond', key: 'invite', label: '家においでよ', fn: () => doAct(r, { act: 'invite' }) });   // デートできるようになった人
    { const other = residents.list.find(o => o !== r && isComp(o) && o.follow); if (other && !r.follow) for (let i = items.length - 1; i >= 0; i--) if (items[i].key === 'follow' || items[i].key === 'invite') items.splice(i, 1); }   // ほかの人と手をつないで歩いている間は、2人目とは つなげない(先に バイバイしてから)
    if (r.def.mascot) items.push({ k: 'play', key: 'ride', label: ride ? '⬇ 降りる' : '☁️ 乗る', fn: () => { try { hud.closeDialog && hud.closeDialog(); } catch (e) { } r.talking = false; talkingTo = null; ride ? rideEnd() : rideAsk(r); } });
    const chat = en => () => { r.talking = true; talkingTo = r; if (r.def.id === 'sora') { if (ai.ready) freeChat(r, text); else openAiSetup({ hud, ai, onDone: () => freeChat(r, text) }); return; } if (ai.ready) startChat(r, text, undefined, en); else openAiSetup({ hud, ai, onDone: () => startChat(r, text, undefined, en) }); };
    if (r.def.id !== 'sora' || r.follow) { const lb = ai.ready ? '' : '(AIの設定)'; items.push({ k: 'study', key: 'chat-en', label: '💬 英語でおしゃべり' + lb, fn: chat(true) }, { k: 'bond', key: 'chat', label: '💬 おしゃべり' + lb, fn: chat(false) }); }
    for (const it of items) { const f = it.fn, key = it.key || it.label; it.fn = () => { markM(key); f(); }; it.ukey = key; }
    // ひと言に足すもの: ゴンのひろいもの・好みのにおわせ・ミイのプレゼント話。なければ、まだ使っていない項目の説明を、たまに
    if (r.def.id === 'gon') { const g = soc.gonDaily(); if (g) text += '\n' + g; }
    const hint = lunaOut || (isComp(r) && r.follow) ? '' : soc.hintLine(r);
    if (hint) text += '\n' + hint;
    else if (Math.random() < 0.15) { const un = items.filter(it => DESC[it.key] && !usedM[it.ukey]); if (un.length) { const it = un[Math.floor(Math.random() * un.length)]; text += `\n「${it.label}」って、まだ試してないよね? ${DESC[it.key]}。`; } }
    // ランダムなおすすめ: だれが言うかに関係なく、町のどの遊び・勉強でも、本当にランダムに(4回に1回ほど)
    const SUGG = [
      { key: 'chunkcards', say: 'カードで勝負してみない?', ok: () => soc.menuOk({ app: 'chunkcards' }), fn: () => openApp('chunkcards', { cpu: 'baron' }) },
      { key: 'school', study: 1, say: '学校で英語の練習、一緒にしない?', fn: () => openApp('school') }, { key: 'library', study: 1, say: '図書館で、長い英文を読んでみない?', fn: () => openApp('library') },
      { key: 'shop', say: 'お店をのぞいてみない? おみやげが買えるよ。', fn: () => openApp('shop') }, { key: 'omikuji', say: 'おみくじ、ひいてみない?', fn: () => openApp('omikuji') },
      { key: 'fortune', say: '占ってもらうのはどう?', ok: () => !lunaOut, fn: () => openApp('fortune') }, { key: 'fishing', say: '池で、のんびり釣りしてみない?', fn: () => { openApp('fishing'); backToTalk(); } },
      { key: 'fishing-en', study: 1, say: '英語の釣り堀、行ってみない?', fn: () => { openApp('fishing', { tab: 'en' }); backToTalk(); } },
      { say: 'AIとおしゃべりもできるって知ってる? 設定してみない?', ok: () => !ai.ready, w: 3, fn: () => openAiSetup({ hud, ai, onDone: () => { } }) },
    ].filter(x => !x.ok || x.ok());
    const lessPlayed = list => { const u = storage.get('menuUsed') || {}, m = Math.min(...list.map(x => u[x.key] || 0)); const c = list.filter(x => (u[x.key] || 0) === m); return c[Math.floor(Math.random() * c.length)]; };
    const forMii = r.def.id === 'mii' && !hint && Math.random() < 0.6 ? lessPlayed(SUGG.filter(x => !x.study && x.key)) : null;   // ミイ: あまりやっていないゲームを勧める
    const forKoharu = r.def.id === 'koharu' && !hint && Math.random() < 0.7 ? lessPlayed(SUGG.filter(x => x.study)) : null;   // こはる先生: まだやっていない勉強を勧める
    let sg = forMii ? { ...forMii, say: 'そういえば、あまりやってないよね? ' + forMii.say } : forKoharu ? { ...forKoharu, say: 'まだあまりやってない勉強があるわね。' + forKoharu.say } : !hint && Math.random() < 0.25 && SUGG.length ? (() => { const bag = SUGG.flatMap(x => Array(x.w || 1).fill(x)); return bag[Math.floor(Math.random() * bag.length)]; })() : null;
    if (r.def.mascot && !ride && Math.random() < 0.45) sg = { say: 'ふわ… ぼくに、乗る?', label: '乗る!', fn: () => rideAsk(r) };   // チャンクくんのほうから、たまに聞いてくる
    if (r.visitSg) { sg = r.visitSg; r.visitSg = null; text = sg.say; }   // 自分から話しかけに来たときは、その用件をひと言に
    if (sg && sg.say !== text) text += '\n' + sg.say;
    const role = PREFS[r.def.id] ? `${r.def.role} ・ ${soc.heart(r.def.id)}` : r.def.role;
    const top = () => { r.talking = true; talkingTo = r; hud.dialog({ name: r.def.name, role, text, choices: [...(sg && sg.fn ? [{ label: sg.label || 'やってみる!', fn: sg.fn }] : []), ...(items.some(it => it.k === 'study') ? [{ label: '📖 勉強', fn: () => shelf('study') }] : []), ...(items.some(it => it.k === 'play') ? [{ label: '🎮 遊び', fn: () => shelf('play') }] : []), { label: '💗 仲良くなる', fn: () => shelf('bond') }, ...items.filter(it => it.key === 'ride' && !(sg && sg.label)).map(it => ({ label: it.label, fn: it.fn })), ...items.filter(it => it.k === 'bond' && (/デート|家においで|お家/.test(it.label) || (r.follow && it.key === 'follow'))).map(it => ({ label: it.label, fn: it.fn }))] }); };   // デート・家に誘うは、仲良くなったら最初の画面にも出す
    const shelf = kind => {
      r.talking = true; talkingTo = r;
      const b = kind === 'bond' ? soc.bondTalk(r) : { text: kind === 'study' ? 'なにを勉強する?' : 'なにして遊ぶ?', extra: [] };
      hud.dialog({ name: r.def.name, role, text: b.text, choices: [...b.extra, ...items.filter(it => it.k === kind), { label: '← もどる', fn: top }] });
    };
    top();
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
  // 会話で出会った言葉を、その日の記録に入れる(あしたの「前回のふりかえり」の一覧とフラッシュカードに出る)
  const logWord = (en, ja, kind, src) => { en = String(en || '').trim().slice(0, 160); if (en) opt.onEvent?.('app:event', { name: 'learn', data: { en, ja: String(ja || '').slice(0, 80), kind, src: src || 'chat' } }); };
  const seenLine = (en, ja) => logWord(en, ja, 'sentence', 'chat');   // 「訳」を見た文
  // 会話の終わりに、AIが「覚えると役立つ英語の表現」を最大5つ拾って、あしたのふりかえりに入れる(英語のやりとりが3往復以上のときだけ・1回だけ)
  const isEnText = t => { const en = (String(t).match(/[A-Za-z]/g) || []).length, ja = (String(t).match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || []).length; return en >= 8 && en > ja * 2; };
  async function pickPhrases(r, hist) {
    if (!ai.ready || !hist) return;
    const enA = hist.filter(m => m.role === 'assistant' && isEnText(m.text)).length, enU = hist.filter(m => m.role === 'user' && isEnText(m.text)).length;
    if (Math.min(enA, enU) < 3 && enA < 4) return;
    const talk = hist.slice(-24).map(m => (m.role === 'user' ? 'Me: ' : r.def.name + ': ') + m.text).join('\n').slice(-5000);
    try {
      const out = await ai.chat({ system: 'You help a Japanese learner of English review a chat. From the conversation, pick up to 5 natural, reusable English expressions (phrases or short sentences, 2-8 words, as they appeared or in base form) worth remembering. Prefer everyday idioms and collocations over single easy words. Reply ONLY with JSON: [{"en":"...","ja":"自然な日本語の意味"}]', messages: [{ role: 'user', text: talk }], maxTokens: 600, maxChars: 2000 });
      const m = String(out).match(/\[[\s\S]*\]/); if (!m) return;
      const list = JSON.parse(m[0]).filter(x => x && x.en && /[A-Za-z]/.test(x.en)).slice(0, 5);
      list.forEach(x => logWord(String(x.en).trim(), String(x.ja || '').trim(), String(x.en).trim().split(/\s+/).length <= 4 ? 'word' : 'sentence', 'chat'));
      if (list.length) hud.toast(`📝 きょうの表現 ${list.length}こ を、ふりかえりに入れたよ`);
    } catch (e) { }
  }
  function addNote({ kind, text, sentence, npc, meaning }) {
    const key = text.trim().toLowerCase(), hit = notes.find(n => n.kind === kind && n.text.toLowerCase() === key);
    if (hit) { hit.count = (hit.count || 1) + 1; hit.npc = npc; saveNotes(); logWord(hit.text, hit.meaning, kind === 'sentence' ? 'sentence' : 'word', 'chat'); return `「${text}」をもう一度ほぞん(×${hit.count})`; }
    const n = { id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind, text: text.trim(), sentence, npc, date: new Date().toLocaleDateString('ja-JP'), count: 1, meaning: meaning || '' };
    notes.push(n); saveNotes(); fillMeaning(n);
    logWord(n.text, n.meaning, kind === 'sentence' ? 'sentence' : 'word', 'chat');
    opt.onEvent?.('note', { kind, text: n.text, meaning: n.meaning, npc });   // 組み込み先の勉強ノートにも入れる
    return `「${text}」をノートに入れたよ`;
  }
  // ---- 住人との仲(プレゼント・頼みごと)・調べる・宝探し ----
  const sparkles = createSparkles(scene, finds);
  social.onInfo = finds.onChange = () => opt.onEvent?.('app:event', { name: 'snap', data: townSnap() });   // 勉強ノートの「町のひみつ」を、ふえるたびに最新にする
  setTimeout(() => social.onInfo(), 3000);
  const soc = createSocialUI({ hud, wallet, audio, addNote,
    onAllFound: () => {   // きょうのかくしもの、ぜんぶ見つけた! → 見つけた言葉を英ラボで使ってみるか聞く(断れる)
      const list = finds.dailyFound().filter(s => ['word', 'phrase', 'proverb', 'passage'].includes(s.kind)).map(s => ({ en: s.c[0], ja: s.c[1], sen: s.kind === 'passage' || s.kind === 'proverb' || /[.!?]$/.test(s.c[0]) }));
      if (!list.length) return;
      hud.dialog({ name: '🎉 ぜんぶ見つけた!', role: 'きょうのかくしもの', text: `きょうのかくしもの ${list.length}こ、ぜんぶ見つけたね! 見つけた言葉を、英ラボで文にして使ってみる?`, choices: [
        { label: '🧠 使ってみる', fn: () => opt.onEvent?.('app:event', { name: 'eigo', data: { open: true, items: list.map((x, i) => ({ en: x.en, ja: x.ja, kind: x.sen ? 'sentence' : '', play: i === 0 })) } }) },
        { label: 'あとで', fn: () => { } }] });
    }, startDate: r => startDate(r), invite: r => doAct(r, { act: 'invite' }), setRain: () => { curWx = weather.now(); env.setAmbient(curWx); }, areaName: (x, z) => city.areaName(x, z), getMe: () => me, canAct: () => started && !appHost.current && !hud.busy, ai, player: () => settings.name || 'あなた' });
  // 「宝を隠す」は、せってい →「運営」タブの中
  const townSnap = () => { const got = finds.treasures(); return { info: social.info(), tre: TREASURES.map(t => ({ i: t[0], n: t[1], g: got.includes(t[1]) })), at: Date.now() }; };   // 勉強ノートの「町のひみつ」に渡す
  function openNoteBook() {
    if (!started || appHost.current || hud.busy) return;
    input.clear(); audio.play('tap');
    if ((opt.features || []).includes('study')) { opt.onEvent?.('app:event', { name: 'study', data: { tab: 'note', sec: 'words', snap: townSnap() } }); return; }   // 勉強ノートにまとめた(単語・表現・文は、ふだんから勉強ノートへ入っている)
    openNotes({
      hud, getNotes: () => notes, getInfo: () => social.info(), getTreasures: () => ({ got: finds.treasures(), all: TREASURES }),
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
  // メニューの「act」:大喜利・格言・オカリナ(アプリを開かない、住人ならではのあそび)
  function doAct(r, m) {
    if (m.act === 'consult' || m.act === 'soranote') { r.talking = true; talkingTo = r; input.clear(); soraNote(r); return; }
    if (m.act === 'follow') { if (!r.follow && residents.list.some(o => o !== r && isComp(o) && o.follow)) { hud.dialog({ name: r.def.name, role: r.def.role, text: 'いま ほかの人と一緒みたいだから、また今度ね!' }); return; } hanaFollow(r, !r.follow); return; }
    if (m.act === 'date') { startDate(r); return; }
    if (m.act === 'invite') { if (env.hour >= 21 || env.hour < 5) { hud.dialog({ name: r.def.name, role: r.def.role, text: '今日はもう遅いから、また今度ね!' }); return; } if (!r.follow && residents.list.some(o => o !== r && isComp(o) && o.follow)) { hud.dialog({ name: r.def.name, role: r.def.role, text: 'いま ほかの人と一緒みたいだから、また今度ね!' }); return; } hanaFollow(r, true, true); r.hold = false; hud.dialog({ name: r.def.name, role: r.def.role, text: 'え、いいの? 行く行く!' }); setTimeout(() => { hud.closeDialog?.(); openApp('home', {}); }, 900); return; }
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
  function startChat(r, first, situation, forceEn) {
    if (r.def.free) return freeChat(r, first, situation);
    const hist = []; ai.warm();
    r.talking = true; talkingTo = r; input.clear();
    const enS = () => !!(forceEn || (settings.en && settings.enShort));   // ふだんの短いおしゃべりは、設定で英語にできる(みじかい返事だと不自然になりやすいので、はじめは日本語)
    openChat({
      hud, bus, name: r.def.name, role: r.def.role, first, onClose: () => { soc.remember(r, hist); pickPhrases(r, hist); },
      getEn: () => ({ on: enS(), level: settings.enLevel }),
      setEn: v => { if (v.on) { settings.en = 1; settings.enShort = 1; } else settings.en = 0; settings.enLevel = v.level; save(); bus.emit('lang', { on: !!settings.en }); },
      translate: text => ai.translate(text),
      saveNote: it => addNote({ ...it, npc: r.def.name }),
      onSeen: seenLine,
      ask: async (t, onPart) => {
        hist.push({ role: 'user', text: t.slice(0, 80) });
        const H = Math.floor(env.hour), M = Math.floor((env.hour % 1) * 60);
        const system = buildSystem({ npc: r.def, player: settings.name || 'あなた', hourText: `${H}時${M}分`, periodText: PERIOD[period(env.hour)], place: city.areaName(r.ch.root.position.x, r.ch.root.position.z), english: enS() ? settings.enLevel : '', adult: ageOk() && !!settings.adult && r.def.adult !== false }) + (memory.prompt(r.def.id, settings.name || 'あなた') ? '\n' + memory.prompt(r.def.id, settings.name || 'あなた') : '');
        try {
          const out = await ai.chat({ system, messages: [{ role: 'assistant', text: first }, ...hist.slice(-6)], onDelta: onPart, adult: ageOk() && !!settings.adult && r.def.adult !== false, ...(enS() ? { maxChars: 300, maxTokens: 300 } : { maxChars: (r.def.maxChars || 90) + 240, maxTokens: (r.def.maxTokens || 160) + 200 }) });
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
        ...((opt.features || []).includes('study') ? [{ label: '📚 勉強部屋', fn: () => opt.onEvent?.('app:event', { name: 'study', data: { snap: townSnap() } }) }] : []),
      ],
    });
  }
  // ---- いっしょに出かける住人(はなちゃん・そら君):自由なおしゃべり(決まりごとを足さない)、手をつないで歩く、デート、家に招く ----
  // いっしょに歩く・家に呼べる人:はな・そら、と、デートできるようになった人(好感度でデートが開いた住人)
  const isComp = r => !!(r.def.companion || social.has(r.def.id, 'date'));
  const compOf = () => residents.list.find(x => isComp(x) && x.follow);
  const say1 = (r, arr, sec = 3) => hud.say('npc:' + r.def.id, Array.isArray(arr) ? arr[Math.floor(Math.random() * arr.length)] : arr, sec);
  function freeChat(r, first, situation, low) {
    const hist = []; ai.warm();
    r.talking = true; talkingTo = r; input.clear();
    openChat({
      hud, bus, name: r.def.name, role: r.def.role, first, maxLen: 400, low, onClose: () => { soc.remember(r, hist); pickPhrases(r, hist); },
      onSeen: seenLine,
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
          memory.prompt(r.def.id, settings.name || 'あなた'),
          `返事の長さは会話に合わせて自然に。長く話す場面では「${({ short: '短め', normal: 'ふつう', long: '長め' })[settings.replyLen] || 'ふつう'}」を目安にする。`,
          settings.en ? `English mode: reply in ${settings.enLevel === 'easy' ? 'simple' : 'natural'} English. After the reply, write " ||| " and a natural Japanese translation.` : '日本語で話す。返事のあとに「 ||| 」と、同じ内容の自然な英語訳を書く。',
        ].join('\n');
        try {
          const out = await ai.chat({ system, messages: [{ role: 'assistant', text: first }, ...hist.slice(-40)], onDelta: onPart, adult: ageOk() && !!settings.adult && r.def.adult !== false, maxTokens: 2048, maxChars: 8000 });
          const shown = out.split('|||')[0].trim();
          hist.push({ role: 'assistant', text: shown });
          hud.say('npc:' + r.def.id, shown.length > 46 ? shown.slice(0, 44) + '…' : shown, 4);
          return out;
        } catch (e) { hist.pop(); throw e; }
      },
    });
  }
  // 一緒にいる住人を、家やゲーム機に「お客さん」として渡す
  const DEFAULT_HOME_LINES = { enter: ['おじゃまします。いい部屋ですね', 'へぇ、ここがあなたの家?'], goro: ['ごろごろ…いい気持ち', 'ふぁ〜、落ちつくなあ'], talk: ['なにを話そうか', 'いい部屋だね'], sit: ['となり、すわるね'], lie: ['ならんで、ごろん'], talkLie: ['こうしてると、話しやすいね'] };
  function hanaGuest() {
    const r = compOf(); if (!r) return null;
    return {
      id: r.def.id, name: r.def.name, look: r.def.look, icon: r.def.icon, lines: r.def.homeLines || DEFAULT_HOME_LINES,
      late: () => env.hour >= 21 || env.hour < 5,
      leave: () => { r.follow = false; r.hold = false; },
      chat: (situation, first) => { if (!ai.ready) { openAiSetup({ hud, ai, onDone: () => freeChat(r, first, situation, true) }); return; } freeChat(r, first, situation, true); },
    };
  }
  const FOLLOW_LINES = { hana: ['いいよ! どこ行く? ついてくね。', 'うん、またね! 楽しかった〜。'], sora: ['いいよ、どこ行く? 付き合うよ。', 'おう、またね! 楽しかったよ。'] };
  function hanaFollow(r, on, quiet) {
    if (on) for (const o of residents.list) if (o !== r && isComp(o) && o.follow) { o.follow = false; o.hold = false; o.ch.holdTo = null; }   // 一緒に歩けるのは1人だけ
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
    { k: 'fishing', n: '釣り', season: 'summer', where: () => ({ x: 46, z: 21 }), go: () => openApp('fishing', {}), ask: '最近、釣りしてないね。潮見さんの池、行ってみる?' },
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
    const px = me.x, pz = me.z;
    [me.x, me.z] = collide(me.x + Math.sin(me.ry) * me.speed * dt, me.z + Math.cos(me.ry) * me.speed * dt);
    // 途中で何かにぶつかって進めないとき:道すじを今いる所から引きなおす。それでもだめなら次の目印へ進む(案内は最後まで続ける)
    guide.stuck = Math.hypot(me.x - px, me.z - pz) < me.speed * dt * 0.3 ? (guide.stuck || 0) + dt : 0;
    if (guide.stuck > 0.8) {
      guide.stuck = 0; guide.fix = (guide.fix || 0) + 1;
      const dest = guide.path[guide.path.length - 1];
      if (guide.fix % 2 === 1 && dest) { const fr = nearestNode(city.graph, me.x, me.z), to = nearestNode(city.graph, dest.x, dest.z); guide.path = [...findPath(city.graph, fr, to).map(id => city.graph.nodes[id]), dest]; }
      else if (guide.path.length > 1) guide.path.shift();
      else { [me.x, me.z] = [n.x, n.z]; }   // 最後の1歩でも進めないときだけ、その場所に着いたことにする
    }
    return true;
  }
  const HANA_HINTS = {
    spring: ['春と秋は、掲示板にミニゴルフのコースが貼り出されるんだって。毎日ちがうコースなの!'],
    summer: ['夏は潮見さんの池で釣りができるよ。夕方と朝は、よく釣れるんだって!', '魚影が見えても、真上に落とすと逃げちゃうんだって。少し先に落とすといいらしいよ'],
    autumn: ['秋は掲示板からフリスビーに出られるよ。風を読むのがコツなんだって'],
    winter: ['雪玉は長押しすると大きくなるよ! 雪だるまも作れるの', '広場で雪合戦できるって知ってた?'],
    any: ['そら君に聞くと、英語の使い方をノートにまとめてくれるよ', '家のテレビで、チャンクボックスのゲームが遊べるんだよ', 'カフェでミイさんとカード勝負できるよ。ミイさん、ああ見えて強いの', '会話の英語をタップすると、ことばノートに入れられるんだって', '神社のおみくじ、毎日ひけるよ'],
  };
  const SORA_HINTS = { any: ['この町、歩いてるだけで楽しいよな', '腹へったな…カフェ寄ってく?', 'ゲーセンのぷにチャンク、けっこうハマるんだよ', '夕方の空、いい色じゃん'], winter: ['雪合戦なら負けないよ?'], summer: ['夏は池で釣りだよな。潮見さん、たまに大物あげてる'] };
  const PLACE_LINES = {
    hana: [['広場', 'ここ、待ち合わせによく使うんだ〜'], ['カフェ', 'いいにおい…何か飲みたくなっちゃう'], ['公園', 'ここのベンチ、すわると落ちつくよね'], ['神社', 'しーん…ってしてて好きなんだ'], ['図書館', 'しずかにしなきゃね(小声)'], ['学校', 'なつかしい感じするね'], ['ゲームセンター', 'ちょっと遊んでいかない?'], ['ショップ', 'かわいいの売ってるかな?'], ['池', 'アヒルいるかな〜'], ['家', 'ここがあなたの家? いいなぁ']],
    sora: [['広場', '噴水の音、落ちつくよな'], ['カフェ', 'ここのケーキ、うまいんだよ'], ['公園', 'ベンチでぼーっとするの、好きなんだ'], ['神社', 'おみくじ、大吉出たことある?'], ['図書館', 'ここ、よく来るんだ'], ['学校', '懐かしいなぁ'], ['ゲームセンター', '一回だけ遊んでいく?'], ['池', '潮見さん、今日も釣ってるかな']],
  };
  // ---- チャンクくんに乗る: 自分は前むき。手をつないでいる相手がいれば、後ろに背中合わせで乗る。乗っている間、チャンクくんは大きくなる(1人=2 / 2人=3) ----
  let ride = null, rideUIel = null, rideLift = 0;
  const chunkOf = () => residents.list.find(x => x.def.mascot);
  const rideRay = new THREE.Raycaster(), rideDown = new THREE.Vector3(0, -1, 0), rideV = new THREE.Vector3();
  const cloudTop = (root, x, z, fb) => { try { rideRay.set(rideV.set(x, 30, z), rideDown); rideRay.far = 40; const h = rideRay.intersectObject(root, true).find(q => q.object.visible); return h ? h.point.y : fb; } catch (e) { return fb; } };   // 雲の上の面の高さ(ふくらみに合わせて動く)
  function rideDrillOn() { ride.stop = rideDrill(rideUIel.querySelector('[data-r=drill]')); if (ride.paused && ride.stop && ride.stop.pause) ride.stop.pause(true); }
  function rideDrill(box) {   // 単語の読み上げの設定どおりに(なければ、まちがえた言葉などをランダムに「英語 → 日本語」で2回ずつ)読み上げる
    if (opt.aloudBand) return opt.aloudBand(box);
    let list = []; try { list = (opt.reviewWords && opt.reviewWords()) || []; } catch (e) { }
    if (!list.length) return () => { };
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[list[i], list[j]] = [list[j], list[i]]; }
    const cut = t => String(t).split(/[、,;;／\/]/).map(x => x.trim()).filter(Boolean);
    const el = document.createElement('div'); el.style.cssText = 'pointer-events:none;background:rgba(255,250,242,.92);border-radius:14px;padding:6px 12px;box-shadow:0 2px 8px #0002;color:#5a4a6b;font-weight:800;max-width:100%;line-height:1.3';
    el.innerHTML = '<b style="font-size:17px"></b><span style="font-size:12px;color:#c9bcd8"> → </span><span style="font-size:14px"></span>'; box.appendChild(el);
    const eEn = el.children[0], eJa = el.children[2]; let alive = true, i = 0, timer = null;
    const say = (text, lang, minMs) => new Promise(res => { const t0 = Date.now(); let done = false; const fin = () => { if (done) return; done = true; clearTimeout(timer); const rest = minMs - (Date.now() - t0); rest > 0 ? (timer = setTimeout(res, rest)) : res(); }; timer = setTimeout(fin, 6000); try { opt.speak ? opt.speak(text, { lang, onend: fin }) : fin(); } catch (e) { fin(); } });
    (async () => {
      while (alive) {
        const w = list[i % list.length]; eEn.textContent = w.en; eJa.textContent = cut(w.ja).slice(0, 2).join('、');
        for (let k = 0; k < 2 && alive; k++) { eEn.style.color = '#e8668a'; await say(w.en, 'en', 900); eEn.style.color = ''; if (!alive) return; eJa.style.color = '#e8668a'; await say((cut(w.ja)[0] || '').replace(/[((][^))]*[))]/g, ''), 'ja', 800); eJa.style.color = ''; }
        if (!alive) return; await new Promise(r => { timer = setTimeout(r, 500); }); i++;
      }
    })();
    return () => { alive = false; clearTimeout(timer); try { opt.speakStop && opt.speakStop(); } catch (e) { } el.remove(); };
  }
  // 周遊コース: 道すじの点をたどって、町をひとまわりして広場にもどる
  const TOUR = ['p0', 'ns-16', 'ns-25', 'ns-36', 'nc18', 'nc30', 'nc18', 'ns-36', 'nc-18', 'nc-30', 'nc-18', 'ns-36', 'ns-25', 'ns-16', 'p0', 'p1', 'p2', 'ew16', 'ew24', 'ew30', 'ew40', 'pk1', 'pk2', 'pk3', 'pk4', 'pk5', 'pk1', 'ew40', 'ew30', 'ew24', 'ew16', 'p2', 'p3', 'p4', 'ns16', 'ns25', 'ns36', 'sc18', 'sc30', 'sc18', 'ns36', 'sc-18', 'sc-30', 'sc-18', 'ns36', 'ns25', 'ns16', 'p4', 'p5', 'p6', 'ew-16', 'ew-25', 'ew-36', 'ew-45', 'sh1', 'sh2', 'sh1', 'ew-45', 'ew-36', 'ew-25', 'ew-16', 'p6', 'p7', 'p0'];
  function tourPath() {
    const G = city.graph, from = nearestNode(G, me.x, me.z), ids = [...findPath(G, from, 'p0'), ...TOUR.slice(1)];
    return ids.map(id => G.nodes[id]).filter(Boolean).map(n => ({ x: n.x, z: n.z }));
  }
  function rideAsk(r) {   // 乗り方をえらぶ
    r.talking = true; talkingTo = r;
    const done = f => () => { try { hud.closeDialog && hud.closeDialog(); } catch (e) { } r.talking = false; talkingTo = null; f && f(); };
    const tour = () => hud.dialog({ name: r.def.name, role: r.def.role, text: 'ふわ… 町をひとまわりするよ。英語も聞く?', choices: [{ label: '🔊 英語を聞きながら', fn: done(() => rideStart('tour', true)) }, { label: '💬 のんびり(おしゃべりだけ)', fn: done(() => rideStart('tour', false)) }, { label: '← もどる', fn: top }] });
    const top = () => hud.dialog({ name: r.def.name, role: r.def.role, text: 'ふわ… どっちにする?', choices: [{ label: '🕹 フリー(自分で動かす)', fn: done(() => rideStart('free', true)) }, { label: '🗺 周遊コース(町をひとまわり)', fn: tour }, { label: 'やめておく', fn: done() }] });
    top();
  }
  function rideTalk() {   // 乗っている間のおしゃべり: 後ろに乗っている人がいればその人と、いなければチャンクくんと
    if (!ride || hud.busy) return; const q = ride.pax || ride.r, nm = settings.name || 'あなた';
    const first = ride.pax ? (q.def.id === 'sora' ? 'おお、高いな! なに話す?' : 'わ〜、高いね! なに話す?') : 'ふわ〜。なに話す?';
    const sit = ride.pax ? `いま「${nm}」と一緒に、町のマスコットの雲「チャンクくん」の背中に乗って、町をのんびり回っている。場所は${city.areaName(me.x, me.z)}。` : `いま「${nm}」を背中に乗せて、町をのんびり回っている。場所は${city.areaName(me.x, me.z)}。`;
    const go = () => startChat(q, first, sit);
    if (ai.ready) go(); else openAiSetup({ hud, ai, onDone: go });
  }
  function rideStart(plan = 'free', listen = true) {
    const r = chunkOf(); if (!r || ride || seat || battle.active || sport.active) return;
    const pax = residents.list.find(o => o !== r && isComp(o) && o.follow && !o.hidden && !o.pin) || null;
    try { hud.closeDialog && hud.closeDialog(); } catch (e) { } r.talking = false; if (talkingTo === r) talkingTo = null; approach = null; goTo = null; lookAtR = null; guide = null;
    ride = { r, pax, plan, listen, n: pax ? 3 : 2, stop: null, tour: plan === 'tour' ? tourPath() : null };
    r.ride = true; r.ch.rideScale = ride.n; r.path = []; r.idle = null; r.hidden = false; r.ch.root.visible = true;
    me.x = r.ch.root.position.x; me.z = r.ch.root.position.z; me.ry = r.ch.root.rotation.y; me.speed = 0;
    me.ch.pose = 'ride'; me.ch.rideKind = 'front'; me.ch.holdTo = null;
    if (pax) { pax.ride = true; pax.hold = false; pax.ch.holdTo = null; pax.ch.pose = 'ride'; pax.ch.rideKind = 'back'; pax.path = []; pax.talking = false; }
    if (view !== 'far') { view = 'far'; me.ch.root.visible = true; } camGoal = { dist: pax ? 13 : 10, pitch: 0.42 };   // 乗っている姿が見える近さに
    rideUIel = document.createElement('div'); rideUIel.style.cssText = 'position:absolute;left:12px;right:12px;top:calc(56px + var(--tw-top, 0px));display:flex;gap:8px;align-items:flex-start;justify-content:space-between;pointer-events:none;z-index:6';
    rideUIel.innerHTML = '<div data-r="drill" style="flex:1;min-width:0;display:flex"></div><span style="flex:none;display:flex;flex-direction:column;gap:6px;align-items:flex-end"><button class="tw-btn" data-r="off" style="padding:8px 14px;font-size:13px">⬇ 降りる</button>' + (listen && opt.openAloud ? '<button class="tw-btn" data-r="rp" style="padding:8px 14px;font-size:13px">⏸ 読み上げ</button><button class="tw-btn" data-r="rs" style="padding:8px 14px;font-size:13px">⚙ 読み上げ設定</button>' : '') + (plan === 'tour' ? '<button class="tw-btn" data-r="talk" style="padding:8px 14px;font-size:13px">💬 話す</button>' : '') + '</span>';
    root.appendChild(rideUIel); rideUIel.querySelector('[data-r=off]').onclick = e => { e.stopPropagation(); rideEnd(); };
    rideUIel.querySelector('[data-r=off]').onpointerdown = e => e.stopPropagation();
    { const tb = rideUIel.querySelector('[data-r=talk]'); if (tb) { tb.onclick = e => { e.stopPropagation(); rideTalk(); }; tb.onpointerdown = e => e.stopPropagation(); } }
    { const pb = rideUIel.querySelector('[data-r=rp]'); if (pb) { pb.onclick = e => { e.stopPropagation(); ride.paused = !ride.paused; if (ride.stop && ride.stop.pause) ride.stop.pause(ride.paused); pb.textContent = ride.paused ? '▶ 読み上げ' : '⏸ 読み上げ'; }; pb.onpointerdown = e => e.stopPropagation(); }   // 読み上げの一時停止/つづき
      const sb = rideUIel.querySelector('[data-r=rs]'); if (sb) { sb.onclick = e => { e.stopPropagation(); if (ride.stop) { ride.stop(); ride.stop = null; } ride.settings = true; opt.openAloud(); setTimeout(() => { const iv = setInterval(() => { if (!document.querySelector('.cs-ov')) { clearInterval(iv); if (ride) ride.settings = false; } }, 400); }, 700); }; sb.onpointerdown = e => e.stopPropagation(); } }   // 設定を開く(閉じたら、新しい設定で読み直す)
    if (listen) rideDrillOn();
    say1(r, ['ふわ〜、しっかりつかまっててね', 'ふわっ、出発〜'], 2.5);
  }
  function rideEnd() {
    if (!ride) return; const { r, pax } = ride; if (ride.stop) ride.stop(); ride = null; rideLift = 0;
    if (rideUIel) { rideUIel.remove(); rideUIel = null; }
    r.ride = false; r.ch.rideScale = 1; r.rideSpeed = 0; r.wait = 3;
    me.ch.pose = null; me.ch.rideY = 0; me.speed = 0;
    const sx = Math.cos(me.ry), sz = -Math.sin(me.ry), cx = r.ch.root.position.x, cz = r.ch.root.position.z;
    [me.x, me.z] = collide(cx + sx * 1.3, cz + sz * 1.3);   // チャンクくんの横に降りる
    if (pax) { pax.ride = false; pax.ch.pose = null; pax.ch.rideY = 0; const c = collide(cx - sx * 1.3, cz - sz * 1.3, 0.3); pax.ch.root.position.set(c[0], 0, c[1]); pax.reT = 0; }
    camGoal = { dist: CAM_DEF.dist, pitch: CAM_DEF.pitch };
  }
  function rideStep(dt) {   // 毎コマ: チャンクくんと後ろの人を、自分に合わせて動かす(自分の位置=チャンクくんのまん中より少し前)
    if (!ride) return; const { r, pax } = ride;
    if (appHost.current || battle.active || sport.active || seat || !r.ch.root.visible && !sportHid) { rideEnd(); return; }
    if (ride.listen && rideUIel) { if (hud.busy && ride.stop) { ride.stop(); ride.stop = null; } else if (!hud.busy && !ride.stop && !ride.settings) rideDrillOn(); }   // 会話などの間は、読み上げを止める
    const sk = r.ch.scaleNow || 1, fx = Math.sin(me.ry), fz = Math.cos(me.ry), off = (pax ? 0.17 : 0.03) * sk, back = 0.2 * sk;
    const cx = me.x - fx * off, cz = me.z - fz * off;
    r.ch.root.position.set(cx, 0, cz); r.ch.root.rotation.y = me.ry; r.rideSpeed = me.speed; r.speed = me.speed; r.hidden = false;
    r.ch.root.updateMatrixWorld(true);
    const fb = 0.7 * sk, top = cloudTop(r.ch.root, me.x, me.z, fb);
    me.ch.rideY = top - 0.02 * sk; rideLift += (me.ch.rideY - rideLift) * Math.min(1, dt * 4);
    if (pax) { const bx = cx - fx * back, bz = cz - fz * back; pax.ch.root.position.set(bx, 0, bz); pax.ch.root.rotation.y = me.ry + Math.PI; pax.ch.rideY = cloudTop(r.ch.root, bx, bz, fb) - 0.05 * sk; pax.hidden = false; pax.ch.root.visible = true; }
  }
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
    if (r.ride) { pullBoost = 1; return; }   // チャンクくんに乗っている間
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
    me.x = pA.x; me.z = pA.z; me.ry = Math.atan2(-rx, -rz); me.speed = 0; seat = { b: { x: pA.x, z: pA.z, ry: me.ry }, date: true }; me.ch.pose = 'sit'; me.ch.seatH = 0.44; me.ch.holdTo = null;
    r.pin = { x: pB.x, z: pB.z, y: 0, ry: Math.atan2(rx, rz), pose: 'sit' }; r.ch.seatH = 0.44;
    const F = { x: T.x + nx * 2.4, z: T.z + nz * 2.4 }; cam.x = F.x; cam.z = F.z; cam.yaw = Math.atan2(nx, nz); cam.pitch = 0.42; cam.dist = 5.5;
    date = { r, stools, focus: F, wasFollow: r.follow, cam0: { pitch: cam.pitch, dist: cam.dist } }; residents.avoid = { x: T.x, z: T.z, r: 3.2 };
    for (const o of residents.list) if (o !== r && !o.hidden && !(isComp(o) && o.follow) && Math.hypot(o.ch.root.position.x - T.x, o.ch.root.position.z - T.z) < 2.4) { const a = Math.atan2(o.ch.root.position.x - T.x, o.ch.root.position.z - T.z); o.ch.root.position.x = T.x + Math.sin(a) * 3.3; o.ch.root.position.z = T.z + Math.cos(a) * 3.3; }
    const H = env.hour, so = r.def.id === 'sora';
    const first = so ? (H < 11 ? '朝のカフェっていいよな。何たのむ?' : H < 17 ? 'ここのケーキ、うまいんだよ。何にする?' : '夜のカフェって、なんか落ちつくよな') : (H < 11 ? 'モーニング、いい感じだね。何たのむ?' : H < 17 ? 'ここ、前から来てみたかったんだ〜。何にする?' : '夜のカフェって、ちょっと大人な感じしない?');
    freeChat(r, DATE_FIRST[r.def.id] || first, `いま「${settings.name || 'あなた'}」と、町のカフェのテラス席で向かい合ってすわり、デートしている。`, true);
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
    me.x = s.x; me.z = s.z; me.ry = s.ry; me.speed = 0; seat = { b: { x: s.x, z: s.z, ry: 0 }, piano: true }; me.ch.pose = 'piano'; me.ch.seatH = 0.5; me.ch.holdTo = null; input.clear();
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
  //   その日(この端末の日付で、登録した月日):住人がみんな1回ずつ「おめでとう」/潮見さんがオカリナ/そら君が花束/はなちゃんがピアノ
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
  // ---- 住人のほうから話しかけに来る(ごくたまに): 仲良しがそばにいるとき/勉強をしばらくしていないとき/まだやっていないことがあるとき ----
  let visitCk = 60 + Math.random() * 60, visitCool = 0, visiting = null;
  function visitUpdate(dt) {
    if (visiting) {
      const r = visiting;
      if (!r.visit) { visiting = null; return; }
      if (hud.busy || appHost.current || seat || battle.active || sport.active || camMode !== 'follow') { r.visit = null; visiting = null; return; }
      if (r.visit.arrived) { visiting = null; r.visit = null; lookAtR = null; talkTo(r); }
      return;
    }
    visitCool -= dt; visitCk -= dt; if (visitCk > 0 || visitCool > 0) return;
    visitCk = 20 + Math.random() * 20;
    if (!started || hud.busy || appHost.current || seat || battle.active || sport.active || camMode !== 'follow' || guide || snow.holding || env.hour < 7 || env.hour >= 21 || Math.random() > 0.3) return;
    const near = residents.list.filter(r => r.ch.root.visible && !r.hidden && !r.pin && !r.follow && !r.talking && !r.summonT && !r.def.mascot && !r.def.free && PREFS[r.def.id]).map(r => ({ r, d: Math.hypot(r.ch.root.position.x - me.x, r.ch.root.position.z - me.z) })).filter(o => o.d > 5 && o.d < 20);
    if (!near.length) return;
    const who = o => o.r.def.id, pickR = a => a[Math.floor(Math.random() * a.length)];
    let o = null, sg = null; const nm = settings.name || 'あなた';
    const neg = studyNeglected();
    if (neg.length && Math.random() < 0.6) { const t = neg[0]; o = near.find(x => ['koharu', 'sora', 'shiori'].includes(who(x))) || pickR(near); sg = { say: `${nm}、さいきん「${t.n}」、やってないよね? いっしょにやってみない?`, fn: () => opt.onEvent?.('app:event', { name: 'play', data: { id: t.id } }) }; }
    if (!sg && Math.random() < 0.5) {   // まだやっていないこと
      const used = storage.get('menuUsed') || {}, TRY = [['school', '学校で英語の練習'], ['library', '図書館で長い英文を読むこと'], ['omikuji', 'おみくじ'], ['fortune', '占い'], ['fishing', '釣り'], ['shop', 'お店めぐり']].filter(t => !used[t[0]] && !(t[0] === 'fortune' && residents.list.find(x => x.def.id === 'luna' && !x.ch.root.visible)));
      if (TRY.length) { const t = pickR(TRY); o = pickR(near); sg = { say: `${t[1]}、まだ一回もしてないよね? 行ってみない?`, fn: () => openApp(t[0]) }; }
    }
    if (!sg) { const fr = near.filter(x => social.level(who(x)) >= 3); if (fr.length && Math.random() < 0.6) { o = pickR(fr); sg = { say: pickR([`あっ、${nm}! ちょうどよかった、ちょっといい?`, `${nm}〜! ひさしぶり、元気だった?`, `見つけた! ちょっとおしゃべりしよう?`]) }; } }
    if (!o || !sg) return;
    o.r.visit = { t: 0 }; o.r.visitSg = { ...sg, label: 'やってみる!' }; visiting = o.r; visitCool = 240 + Math.random() * 240;   // つぎの訪問まで、4〜8分あける
  }
  function birthdayUpdate(dt) {
    if (bdayShot) {
      const b = bdayShot; b.t += dt;
      if (!b.go && b.t > 8) { b.go = true; ['heart', 'kamuro', 'star', 'botan'].forEach(t => fw.launch(t)); }   // 大きな花火を4つ
      else if (b.go && (b.t2 += dt) > 2.8) { bdayShot = null; birthdayPhoto(b.S); bdayRelease = 45; }
    }
    if (bdayRelease > 0 && (bdayRelease -= dt) <= 0) { residents.avoid = null; for (const r of residents.list) if (isComp(r) && r.pin && !r.pin.bench) r.pin = null; }
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
    // 潮見さん:オカリナ
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
      const hid = residents.list.filter(r => !isComp(r) && r.ch.root.visible && Math.hypot(r.ch.root.position.x - S.x, r.ch.root.position.z - (S.z + 3)) < 7);   // 写真の前にいる住人は、うつさない
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
        g.font = `700 ${Math.round(fs * 0.32)}px sans-serif`; g.fillStyle = '#fff'; g.fillText(`${settings.name || ''}  ${new Date().toLocaleDateString('ja-JP')}  かまってチャンクTOWN`, W / 2, ty + fs * 0.55);
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
    bumpUse(id === 'fishing' && params && params.tab === 'en' ? 'fishing-en' : id);
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
  offs.push(bus.on('app:open', () => soundSync()));
  offs.push(bus.on('app:close', () => { setTimeout(soundSync, 0); input.enabled = true; audio.play('close'); hud.setCoins(wallet.get(), gemsNow()); }));
  if (opt.wallet?.onChange) offs.push(opt.wallet.onChange(w => bus.emit('wallet', w)));
  const PAYN = [['fortune', '占いの館'], ['tarot', 'タロット'], ['cafe', 'カフェ'], ['gamebox', 'ゲーム'], ['furniture', '家具'], ['voucher', '商品券'], ['fishing', '釣りのお店'], ['photo', '写真'], ['luna', '占い']];
  offs.push(bus.on('wallet', w => {
    hud.setCoins(w.coins, gemsNow());
    if (w.delta > 0) { audio.play('coin'); hud.toast(`🪙 +${w.delta}`); }
    else if (w.delta < 0) { audio.play('pay'); try { receipt({ label: (PAYN.find(([k]) => String(w.reason || '').includes(k)) || [0, 'おかいもの'])[1], before: w.coins - w.delta, spent: -w.delta, after: w.coins }); } catch (e) { console.error(e); } }   // 買ったら、音と一緒に「元いくら − いくら = のこり」を出す
  }));
  offs.push(bus.on('toast', t => hud.toast(t)));
  offs.push(bus.on('sfx', n => audio.play(n)));
  const SAY = ['こんにちは!', 'いい天気だね', 'いっしょに遊ぼう!', 'またね〜'];
  let backHome = false;   // 家のゲーム機から始めたら、終わったら家にもどる
  const goHome = () => { if (!backHome) return false; backHome = false; setTimeout(() => openApp('home', {}), 400); return true; };
  // ゲーム機から「町の中で遊ぶ」もの
  // 町の中の外遊びを始める(ゲーム機・タイトルの「アミューズメント」から)
  const launchOutdoor = what => {
      if (what === 'snow3d') {   // 町のランダムな場所で
        const ids = Object.keys(city.graph.nodes).filter(id => !/^pd|^p\d/.test(id)), n = city.graph.nodes[ids[Math.floor(Math.random() * ids.length)]];
        me.x = n.x; me.z = n.z; me.ry = Math.random() * Math.PI * 2; cam.x = me.x; cam.z = me.z;
        const cand = residents.list.filter(r => r.ch.rig); const opp = cand[Math.floor(Math.random() * cand.length)];
        opp.ch.root.position.set(me.x + Math.sin(me.ry) * 8, 0, me.z + Math.cos(me.ry) * 8);
        battle.start(opp, 2, backHome);
      } else if (what === 'golf' || what === 'frisbee') sport?.start(what, { any: true, home: backHome });
  };
  offs.push(bus.on('app:event', e => {
    if (e?.name !== 'launch') return;
    const what = e.data?.what; backHome = e.data?.from === 'home';
    setTimeout(() => launchOutdoor(what), 350);
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
  { let t0 = null; const cv = renderer.domElement;   // 住人をタップ=そっちを向く(自分視点)、ダブルタップ=駆けよって話しかける
    root.addEventListener('pointerdown', e => { t0 = e.target === cv || e.target === root || e.target.classList?.contains('tw-canvas') ? { x: e.clientX, y: e.clientY, t: e.timeStamp } : null; }, true);
    const pick = (cx, cy) => {
      const rc = cv.getBoundingClientRect(); let best = null, bd = Infinity; const v = new THREE.Vector3();
      for (const r of residents.list) {
        if (!r.ch.root.visible || r.def.mascot) continue;
        const H = r.ch.glb ? r.ch.height : 1.6, p = r.ch.root.position;
        v.set(p.x, H * 0.55, p.z).project(camera); if (v.z > 1) continue;
        const sx = rc.left + (v.x + 1) / 2 * rc.width, sy = rc.top + (1 - v.y) / 2 * rc.height;
        v.set(p.x, H, p.z).project(camera); const top = rc.top + (1 - v.y) / 2 * rc.height, half = Math.max(28, Math.abs(sy - top) * 1.1);
        const d = Math.hypot(cx - sx, (cy - sy) * 0.6); if (d < half && d < bd) { bd = d; best = r; }
      }
      return best;
    };
    const up = e => {
      const s0 = t0; t0 = null;
      if (!s0 || !started || hud.busy || appHost.current || battle.active || sport.active || seat || camMode !== 'follow' || snow.holding || seasons.carrying()) return;
      if (Math.hypot(e.clientX - s0.x, e.clientY - s0.y) > 12 || e.timeStamp - s0.t > (window.__tapMs || 450)) return;   // 指を置いた時刻・はなした時刻で比べる(重いときも正しく)
      const r = pick(e.clientX, e.clientY), now = e.timeStamp;
      // 2回目のタップ:1回目で向きが変わり始めて相手が画面上で少し動くので、外れても1回目の相手へ
      if (lastTap && (!r || lastTap.r === r) && now - lastTap.t < (window.__tapMs || 380)) { const R = lastTap.r; lastTap = null; approach = { r: R, stuck: 0 }; lookAtR = R; return; }
      if (!r) {   // 自分をタップ:引き → 寄り → 一人称
        const H = me.ch.glb ? me.ch.height : 1.6, rc = cv.getBoundingClientRect(), v = new THREE.Vector3(me.x, H * 0.55, me.z).project(camera);
        const sx = rc.left + (v.x + 1) / 2 * rc.width, sy = rc.top + (1 - v.y) / 2 * rc.height; v.set(me.x, H, me.z).project(camera);
        const top = rc.top + (1 - v.y) / 2 * rc.height, half = Math.max(34, Math.abs(sy - top) * 1.2);
        if (v.z < 1 && Math.hypot(e.clientX - sx, (e.clientY - sy) * 0.6) < half) {
          lastAct = performance.now();
          if (view === 'far') { view = 'near'; camGoal = { dist: 7, pitch: 0.5 }; }
          else if (view === 'near') { view = 'fp'; fpPitch = 0; camGoal = null; me.ch.root.visible = false; }
          return;
        }
        // 地面を2回タップ=そこへ走っていく(途中でスティックを動かす・住人をタップする、などをしたら中止)
        { const ndc = new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1); ray.setFromCamera(ndc, camera);
          const hit = ray.ray.intersectPlane(groundPl, new THREE.Vector3());
          if (!hit || Math.hypot(hit.x - camera.position.x, hit.z - camera.position.z) > 90) { lastGround = null; return; }
          if (lastGround && now - lastGround.t < (window.__tapMs || 380) && Math.hypot(e.clientX - lastGround.sx, e.clientY - lastGround.sy) < 48) {
            lastGround = null; approach = null; lookAtR = null; lastAct = performance.now(); goTo = { x: clamp(hit.x, -240, 240), z: clamp(hit.z, -240, 240), stuck: 0 }; return;
          }
          lastGround = { t: now, sx: e.clientX, sy: e.clientY }; }
        return;
      }
      goTo = null; lastGround = null;
      lastTap = { r, t: now }; lookAtR = r; approach = null;
    };
    window.addEventListener('pointerup', up); offs.push(() => window.removeEventListener('pointerup', up)); }
  offs.push(bus.on('ui:emote', k => {
    if (!started) return;
    audio.unlock();
    if (k === 'feed') { if (ambient.feed(me.ch.root.position, me.ch.root.rotation.y)) { hud.toast('🌾 ぱらぱら…'); audio.play('wave'); } else hud.toast('まだ、えさが残ってるよ'); }
    else if (k === 'wave') {
      me.ch.wave(); audio.play('wave'); net?.emote('wave');
      // 目の前の1人だけが、手をふりかえす
      const fx = Math.sin(me.ry), fz = Math.cos(me.ry);
      const cand = residents.list.filter(r => r.ch.root.visible && !r.ride).map(r => { const dx = r.ch.root.position.x - me.x, dz = r.ch.root.position.z - me.z, d = Math.hypot(dx, dz); return { r, d, front: d > 0 ? (dx * fx + dz * fz) / d : 1 }; }).filter(o => o.d < 4.2 && o.front > 0.3).sort((a, b) => a.d - b.d)[0];
      if (cand) {
        const R = cand.r, L = { baron: 'ふはは、わが輩に手をふるとは!', gon: 'おっ、よう!', koharu: 'こんにちは。', maru: 'まいど!', yuzu: 'こんにちは、です', shiori: '……こんにちは', mii: 'あ、こんにちは〜', chunkkun: 'ふわふわ〜' }[R.def.id] || 'やあ!';
        setTimeout(() => { R.ch.wave(); hud.say('npc:' + R.def.id, L, 3); }, 450 + Math.random() * 250);
      }
    }
    else if (k === 'say') { const t = SAY[Math.floor(Math.random() * SAY.length)]; hud.say(me.id, t); net?.say(t); }
  }));
  // ---- 占いの館(ルナは館の中。タロットにはAI・英語モード・ふりかえりを渡す) ----
  function fortuneParams() {
    const luna = () => residents.list.find(x => x.def.id === 'luna');
    return {
      ai, hour: () => env.hour, getEn: () => ({ on: !!settings.en, level: settings.enLevel }),
      lunaOut: () => { const r = luna(); return !!(r && r.ch.root.visible); },
      talkLuna: () => { const r = luna(); if (!r) return; appHost.close(); setTimeout(() => { if (!hud.busy) talkTo(r); }, 200); },
      logWord: (en, ja, kind) => logWord(en, ja, kind, 'tarot'),
      rec: (cat, text, key) => social.putInfo(cat, text, key),   // 占いの結果を「町のひみつ」へ
      saveWord: (en, ja) => hud.toast(addNote({ kind: 'word', text: en, meaning: ja, npc: 'タロット占い' })),   // 単語ノートへ(タップで選んだときだけ)
      tarotArt: opt.tarotArt || '',   // タロットの絵の差し替え先(<ここ><カードid>.webp)
    };
  }
  // ---- さがす(マップ・一覧・ワープ) ----
  const entities = () => {
    const out = residents.list.map(r => r.def.id === 'luna' && !r.ch.root.visible ? { id: 'npc:luna', kind: 'npc', name: r.def.name, yomi: r.def.yomi, role: r.def.role, x: -40.5, z: -20, inside: '占いの館の中' }   // ルナは館の中(入口へ飛べる)
      : ({ id: 'npc:' + r.def.id, kind: 'npc', name: r.def.name, yomi: r.def.yomi, role: r.def.role, x: r.ch.root.position.x, z: r.ch.root.position.z, away: !r.ch.root.visible }));
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
    if (e.kind === 'npc' && e.inside) return jumpTo({ id: 'pl:fortune', kind: 'place', name: '占いの館', x: -40.5, z: -20, fx: -1, fz: 0 });   // ルナは館の中:館の入口へ
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
    openFinder({ hud, city, areaName: city.areaName, getMe: () => me, getEntities: entities, onJump: jumpTo,
      onCall: e => {   // 休み中の人: 「呼び出しますか?」→ すぐ目の前にあらわれる
        const r = residents.list.find(x => 'npc:' + x.def.id === e.id); if (!r) return;
        hud.dialog({ name: r.def.name, role: '休み中', text: `${r.def.name}を、ここに呼び出しますか?`, choices: [{ label: '呼び出す', fn: () => {
          const [x, z] = collide(me.x + Math.sin(me.ry) * 1.9, me.z + Math.cos(me.ry) * 1.9);
          residents.summon(r.def.id, x, z); audio.play('wave'); lookAtR = null; setTimeout(() => { try { r.ch.wave?.(); } catch (e2) { } }, 400);
        } }, { label: 'やめる', fn: () => { } }] });
      }, getHints: () => finds.hinted() });
  }
  offs.push(bus.on('ui:find', openFind));
  on(window, 'keydown', e => { if (e.code === 'KeyM' && !e.repeat && !e.target.closest?.('input,textarea')) { if (hud.busy) { hud.closePanel(); return; } openFind(); } });
  offs.push(bus.on('ui:notes', () => openNoteBook()));
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
      <div class="tw-row">住人との会話${seg('en', [[1, '英語'], [0, '日本語']])}</div>
      <div class="tw-row">画質${seg('quality', [['low', '軽い'], ['mid', 'ふつう'], ['high', 'きれい']])}</div>
      ${opt.openAdmin ? `<div class="tw-row">住人の大きさ<span style="display:flex;gap:8px;align-items:center;width:62%"><input class="tw-sz" data-k="npc" type="range" min="1" max="3" step="0.05" value="${SIZE_NOW.npc}" style="flex:1"><b class="tw-szv" style="width:2.8em;text-align:right">${SIZE_NOW.npc.toFixed(2)}</b></span></div>` : ''}
      ${opt.openAdmin ? `<div class="tw-row">自分の大きさ<span style="display:flex;gap:8px;align-items:center;width:62%"><input class="tw-sz" data-k="player" type="range" min="1" max="3" step="0.05" value="${SIZE_NOW.player}" style="flex:1"><b class="tw-szv" style="width:2.8em;text-align:right">${SIZE_NOW.player.toFixed(2)}</b></span></div>` : ''}
      <div class="tw-row">低負荷モード${seg('lite', [[0, 'オフ'], [1, 'オン']])}</div>
      <div class="tw-note">オンにすると、解像度・影・光のにじみ・ふちどり・噴水・月をかるくして、30fpsにします(流れ星は残ります)。</div>
      <div class="tw-row">時間の進み${seg('timeSpeed', [[0, '止める'], [1, 'ふつう'], [4, 'はやい']])}</div>
      <div class="tw-row">効果音${seg('sfx', [[0, 'なし'], [0.4, '小'], [0.7, '中'], [1, '大']])}</div>
      <div class="tw-row">時刻<div class="tw-seg"><button class="tw-btn" data-hour="8">朝</button><button class="tw-btn" data-hour="13">昼</button><button class="tw-btn" data-hour="18">夕</button><button class="tw-btn" data-hour="21">夜</button></div></div>
      <div class="tw-row">テスト:時刻<span style="display:flex;gap:8px;align-items:center;width:62%"><input class="tw-t-hour" type="range" min="0" max="24" step="0.25" value="${env.hour.toFixed(2)}" style="flex:1"><b class="tw-t-hv" style="min-width:3.2em;text-align:right"></b></span></div>
      <div class="tw-row">テスト:日付<span style="display:flex;gap:6px;align-items:center"><input class="tw-t-date" type="date" value="${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}-${String(testDate.getDate()).padStart(2, '0')}" style="font:inherit;padding:4px 6px;border-radius:10px;border:2px solid #eadff3"><button class="tw-btn" data-act="today" style="padding:6px 10px">きょう</button></span></div>
      ${opt.openAdmin ? `<div class="tw-row">桜${'<div class="tw-seg"><button class="tw-btn' + (blossomOn ? ' on' : '') + '" data-bl="1">あり</button><button class="tw-btn' + (!blossomOn ? ' on' : '') + '" data-bl="0">なし</button></div>'}</div>` : ''}
      <div class="tw-row">宝さがし大会<button class="tw-btn" data-act="hunt" style="padding:6px 14px">🛠🔍 宝を隠す</button></div>
      <div class="tw-row">流れ星<button class="tw-btn" data-act="meteor" style="padding:6px 14px">いま流す</button></div>
      <div class="tw-row">英語のヒント(すれ違い)${seg('tips', [[0, 'なし'], [1, 'あり']])}</div>
      ${opt.openAdmin ? `<div class="tw-row">きせつ(桜・紅葉・雪)<button class="tw-btn" data-act="season" style="padding:6px 14px">${SEASONS[settings.season || 'auto']}</button></div>` : ''}
      ${opt.openAloud ? '<div class="tw-row">単語の読み上げ<button class="tw-btn" data-act="aloud" style="padding:6px 14px">ひらく</button></div>' : ''}
      <div class="tw-row">誕生日(花火でお祝い)<button class="tw-btn" data-act="birth" style="padding:6px 14px">${settings.birth ? settings.birth.replace(/-/g, '/') : 'とうろく'}</button></div>
      ${opt.openAdmin ? '<div class="tw-row">運営(花火・日食・月食の予約)<button class="tw-btn" data-act="admin" style="padding:6px 14px">ひらく</button></div>' : ''}
      <div class="tw-row">おとなトーク(18歳以上)<button class="tw-btn" data-act="adult" style="padding:6px 14px">${settings.adult && ageOk() ? 'オン' : 'オフ'}・せってい</button></div>
      <div class="tw-row">ふだんの短いおしゃべりも英語${seg('enShort', [[0, '日本語'], [1, '英語']])}</div>
      <div class="tw-row">おしゃべりの返事の長さ${seg('replyLen', [['short', '短め'], ['normal', 'ふつう'], ['long', '長め']])}</div>
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
        if (b.dataset.act === 'aloud') { hud.closePanel(); setTimeout(() => opt.openAloud(), 30); }
        if (b.dataset.act === 'hunt') { hud.closePanel(); setTimeout(() => soc.adminHunt(), 30); return; }
        if (b.dataset.act === 'admin') { hud.closePanel(); setTimeout(() => opt.openAdmin(), 30); }
      }, { outside: true });
    {   // 一般 / 運営 のタブ。運営の項目は、運営のときだけ「運営」タブに出る(一般の人には、タブも項目も出ない)
      const ADM = ['住人の大きさ', '自分の大きさ', '時間の進み', '時刻', 'テスト:', '桜', '流れ星', 'きせつ', '運営(', '宝さがし大会'], isAdm = !!opt.openAdmin || social.admin();
      const rows = [...pn.querySelectorAll('.tw-row')]; rows.forEach(r => { const t = (r.firstChild && r.firstChild.nodeType === 3 ? r.firstChild.textContent : '').trim(); if (ADM.some(a => t.startsWith(a))) r.dataset.tab = 'adm'; });
      const show = tab => rows.forEach(r => { if (r.querySelector('[data-act="close"]')) return; r.style.display = (r.dataset.tab === 'adm') === (tab === 'adm') ? '' : 'none'; }), note = pn.querySelector('.tw-note');
      show('gen');
      if (isAdm) {
        const bar = document.createElement('div'); bar.className = 'tw-seg'; bar.style.cssText = 'display:flex;gap:6px;margin:0 0 8px';
        bar.innerHTML = '<button class="tw-btn on" data-tab="gen" style="flex:1">一般</button><button class="tw-btn" data-tab="adm" style="flex:1">🛠 運営</button>';
        pn.querySelector('h2').after(bar);
        bar.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); bar.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); show(b.dataset.tab); if (note) note.style.display = b.dataset.tab === 'gen' ? '' : 'none'; });
      }
    }
    pn.querySelectorAll('.tw-sz').forEach(el => el.addEventListener('input', () => { const v = +el.value; setGlbSize(el.dataset.k, v); el.parentNode.querySelector('.tw-szv').textContent = v.toFixed(2); }));
    const hr = pn.querySelector('.tw-t-hour'), hv = pn.querySelector('.tw-t-hv'), dt = pn.querySelector('.tw-t-date');
    const fmt = v => `${String(Math.floor(v)).padStart(2, '0')}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`;
    hv.textContent = fmt(env.hour);
    hr.addEventListener('input', () => { env.hour = +hr.value; hv.textContent = fmt(+hr.value); });
    dt.addEventListener('change', () => { if (!dt.value) return; const [y, m, d] = dt.value.split('-').map(Number); applyDate(new Date(y, m - 1, d, 12)); pn.querySelectorAll('[data-bl]').forEach(x => x.classList.toggle('on', (x.dataset.bl === '1') === blossomOn)); });
  }));

  function showTitle(intro = false) {
    root.querySelectorAll('.tw-title').forEach(el => el.remove());
    started = false;
    hud.title({ look: settings.look, name: settings.name || (opt.playerName && opt.playerName()) || '', intro }, startAs);
  }
  // 外の音(水音・ざわめき・曲)は、街を歩いているときだけ。アプリ(家・ショップなど)を開いたら止める
  let wasWalk = null;
  function soundSync() {
    const w = !!started && !appHost.current;
    if (w === wasWalk) return; wasWalk = w;
    audio.ambience(w); audio.bgm(w); if (!w) audio.rain(0);
  }
  // 町へ出かける(最初の画面のボタン・組み込み先からの quickStart の両方)
  function startAs({ look, name }) {
      settings.look = look; settings.name = name; save();
      setLook(look); me.ch.root.position.set(me.x, 0, me.z);
      hud.untag(me.id); hud.tag(me.id, name, true);
      audio.unlock(); audio.play('open'); started = true; soundSync();
      if (!netStarted && net) { net.connect({ id: me.id, name, look }); netStarted = true; }
      started = true;
      if (settings.birth && !settings.birthLock) { settings.birthLock = 1; save(); }
      setTimeout(() => { if (soc.gonDaily()) hud.toast('🎒 ゴンが、きょうの拾いものをしてくれたよ'); }, 5000);   // ゴン: 何もしなくても1日1つ
      if (!settings.birth) setTimeout(() => { if (!hud.busy && !appHost.current) openBirthSetup(true); }, 1800);   // はじめに誕生日をとうろく
      else setTimeout(() => birthdayAfter(), 2500);
      bus.emit('start', { name, look });
      opt.onEvent?.('start', { name, look });
  }
  let netStarted = false;
  bus.on('*', (n, d) => { if (n.startsWith('app:') || n === 'talk' || n === 'wallet') opt.onEvent?.(n, d); });

  // ---- カメラ ----
  const CAM_DEF = { pitch: 0.85, dist: 36 };   // ふだんの見え方(斜め上から、かなり引いて町を見わたす)。🎥のダブルタップで距離を変えられる
  if (settings.camVer !== 2) { delete settings.camView; settings.camVer = 2; save(); }   // 新しい標準の見え方にそろえる(前に保存した距離はリセット)
  const camOk = settings.camView && settings.camView.pitch >= 0.1 && settings.camView.dist >= 3;   // 近すぎ・低すぎの保存値は使わない
  const cam = { yaw: Math.PI, pitch: camOk ? settings.camView.pitch : CAM_DEF.pitch, dist: camOk ? settings.camView.dist : CAM_DEF.dist, x: me.x, z: me.z };
  // ---- カメラ:ふだん=自分についていく(follow) / 動かす(free:カメラだけ自由に) / 固定(fixed:そこに置いて、自分は歩ける) ----
  let camMode = 'follow';
  // 視点: 'far'=引いて見る(ふだん) / 'fp'=自分視点。🎥を押すと切りかえ。
  // 住人をタップ=そっちを向いて自分視点(動きだしたら引いた視点にもどる)、話している間=自分視点で相手を正面に(終わったら もどる)
  let talkF_on = false, view = 'far', camGoal = null, lastAct = performance.now(), lookAtR = null, fpPitch = 0, approach = null, lastTap = null, goTo = null, lastGround = null;
  const fpOn = () => !ride && camMode === 'follow' && !battle.active && !sport.active && !seat && (view === 'fp' || !!lookAtR || (!!talkingTo && hud.busy));
  const eyeH = () => (me.ch.glb ? me.ch.height * 0.86 : 1.5);
  on(root, 'pointerdown', () => { lastAct = performance.now(); });
  const panOff = { x: 0, z: 0 };   // 2本指でずらしたカメラ位置
  {   // 2本指ドラッグ:真上から見た地図をずらす感覚で、見ている向き基準の前後左右にカメラ位置をずらす(ゴルフ中に使っていたものと同じ)
    let t1 = null, t2 = null;
    const tg = e => !appHost.current && camMode === 'follow' && !battle.active;
    root.addEventListener('touchstart', e => { if (e.touches.length === 2) { t1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }; t2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }; } }, { passive: true });
    root.addEventListener('touchmove', e => {
      if (e.touches.length !== 2 || !t1 || !t2) return;
      const dx = (e.touches[0].clientX - t1.x + e.touches[1].clientX - t2.x) / 2, dy = (e.touches[0].clientY - t1.y + e.touches[1].clientY - t2.y) / 2;
      t1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }; t2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
      if (!tg(e)) return;
      lastAct = performance.now(); const y = cam.yaw, fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y), k = 0.015 + cam.dist * 0.004;   // 見ている向き(前)と右。指についてくる=カメラは逆へ
      panOff.x += rx * -dx * k + fx * dy * k; panOff.z += rz * -dx * k + fz * dy * k;
      const m = Math.hypot(panOff.x, panOff.z); if (m > 140) { panOff.x *= 140 / m; panOff.z *= 140 / m; }
    }, { passive: true });
    root.addEventListener('touchend', e => { if (e.touches.length < 2) { t1 = null; t2 = null; } }, { passive: true });
  }
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
  let camSetOpen = false;   // 🎥の長押しで出す設定(カメラだけ動かす・引く距離)
  offs.push(bus.on('ui:camlong', () => { if (!started || appHost.current || hud.busy || camMode !== 'follow') return; camSetOpen = !camSetOpen; camBarDraw(); audio.play('tap'); }));
  function camBarDraw() {
    if (camMode === 'follow' && camSetOpen) {
      camBar.hidden = false;
      camBar.innerHTML = `<div>🎥 カメラの設定(🎥を押すと、引いて見る ⇔ 自分視点)</div>
        <div class="r" style="align-items:center"><span>引く距離</span><input type="range" class="fd" min="4" max="50" step="0.5" value="${cam.dist.toFixed(1)}"><b class="fdv">${cam.dist.toFixed(1)}</b></div>
        <div class="r"><button class="tw-btn" data-c="free">🎥 カメラだけ動かす</button><button class="tw-btn on" data-c="close">とじる</button></div>`;
      const fd = camBar.querySelector('.fd');
      fd.oninput = () => { cam.dist = +fd.value; camBar.querySelector('.fdv').textContent = cam.dist.toFixed(1); if (view === 'fp') { view = 'far'; settings.view = view; } settings.camView = { pitch: +cam.pitch.toFixed(3), dist: +cam.dist.toFixed(2) }; save(); };
      ['pointerdown', 'touchstart'].forEach(t => fd.addEventListener(t, e => e.stopPropagation(), { passive: true }));
      return;
    }
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
    else if (b.dataset.c === 'free') { camSetOpen = false; camFromView(); camMode = 'free'; camBarDraw(); }
    else if (b.dataset.c === 'close') { camSetOpen = false; camBarDraw(); }
    else if (b.dataset.c === 'back') {   // 合わせたカメラの位置のまま もどる(次からもその見え方。カメラ設定の「リセット」で戻せる)
      const dx = fcam.x - me.x, dz = fcam.z - me.z, dy = fcam.y - 1.3, L = Math.hypot(dx, dy, dz) || 1;
      cam.yaw = Math.atan2(dx, dz); cam.pitch = clamp(Math.asin(clamp(dy / L, -1, 1)), 0.1, 1.5); cam.dist = clamp(L, 3, 40);   // 合わせた見え方をそのまま(丸めない) cam.x = me.x; cam.z = me.z;
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
  offs.push(bus.on('ui:apps', () => {   // 🎮 ぜんぶの入口(組み込み先が一覧を持っているときだけ)
    if (!started || appHost.current || hud.busy || battle.active || sport.active) return; opt.openLauncher?.();
  }));
  offs.push(bus.on('ui:home', () => {   // 🏠 自宅にもどる(カメラは、カメラボタンを2回押せばもとにもどる)
    if (!started || appHost.current || hud.busy || battle.active || sport.active) return; openApp('home', {});
  }));
  offs.push(bus.on('ui:cam', () => {   // 🎥を押す:引いて見る ⇔ 自分視点(自由カメラ・固定中なら、ふつうの視点にもどす)
    if (!started || appHost.current || hud.busy) return;
    if (camMode === 'follow' && !battle.active && !sport.active) {
      if (lookAtR) { lookAtR = null; view = 'far'; } else view = view === 'fp' ? 'far' : 'fp';
      settings.view = view; save(); if (view === 'fp') fpPitch = 0; me.ch.root.visible = view !== 'fp'; camSetOpen = false; camBarDraw(); input.clear(); return;
    }
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
  // キーボードが出ている間は、おしゃべりの枠をコンパクトにして、直前のセリフが見えるようにする(画面そのものは動かさない。ページ側で interactive-widget=resizes-content を指定)
  {
    const typing = t => !!t && /^(INPUT|TEXTAREA)$/.test(t.tagName) && !/^(range|checkbox|radio|button)$/.test(t.type || '');
    const f = () => { setTimeout(() => { root.classList.toggle('tw-kb', typing(document.activeElement)); root.querySelectorAll('.tw-log').forEach(l => { l.scrollTop = l.scrollHeight; }); }, 50); };
    root.addEventListener('focusin', f); root.addEventListener('focusout', f);
  }

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
      if (inp.camDX || inp.camDY || inp.zoom) { lastAct = performance.now(); camGoal = null; }
      if (hud.busy || talkingTo || lookAtR) lastAct = performance.now();
      if (view !== 'far' && !lookAtR && performance.now() - lastAct > 10000) { view = 'far'; camGoal = { dist: CAM_DEF.dist, pitch: CAM_DEF.pitch }; panOff.x = panOff.z = 0; me.ch.root.visible = true; }   // 10秒なにもしなければ、引きにもどる
      if (camGoal && !fpOn()) { const k = Math.min(1, dt * 3.5); cam.dist += (camGoal.dist - cam.dist) * k; cam.pitch += (camGoal.pitch - cam.pitch) * k; if (Math.abs(camGoal.dist - cam.dist) < 0.1) camGoal = null; }
      if (view === 'fp' && inp.zoom > 0.3) { view = 'near'; cam.dist = 3; cam.pitch = 0.4; me.ch.root.visible = true; }   // 一人称でひろげる=寄りにもどる
      cam.yaw -= inp.camDX * 0.01;
      if (fpOn()) { fpPitch = clamp(fpPitch - inp.camDY * 0.007, -1.1, 1.1); me.ch.root.visible = false; }   // 自分視点:自分は消す(上下ドラッグで見上げる・見下ろす)
      else { cam.pitch = clamp(cam.pitch + inp.camDY * 0.007, -1.5, 1.5);
      cam.dist = clamp(cam.dist + inp.zoom * (1.2 + cam.dist * 0.12), 1.6, 60);   // ピンチで寄る・引く(寄りすぎたら自分は消える)
      me.ch.root.visible = true; } }   // 寄っても自分は消さない(低い位置から接写で見上げる写真を撮れるように)
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
    if (sport.active && camMode === 'follow' && started && !hud.busy) sport.pan(mx, my, dt);   // ゴルフ中は、左下スティック=カメラを前後左右にずらす
    if (snow.making || bld || battle.making || battle.rolling || sport.active || dodgeT > 0) mx = my = 0;   // 雪玉をつくっている間は動けない(転がり中も)
    if (seat) { if (Math.hypot(mx, my) > 0.35) standFromSeat(); mx = my = 0; }
    const mag = Math.min(1, Math.hypot(mx, my)); let lastMove = null;
    if (lookAtR && mag > 0.05) lookAtR = null;   // タップで向いたあと、自分で動きだしたら引いた視点にもどる
    if (goTo && (ride || mag > 0.3 || appHost.current || talkingTo || seat || battle.active || sport.active || camMode !== 'follow' || approach || dodgeT > 0 || snow.making || seasons.building())) goTo = null;   // スティックを動かすなど、ほかの操作をしたら、そちらを優先
    if (goTo) {   // 地面を2回タップした場所へ走っていく。着いたら止まる(カメラやメニューを動かしても、その間に着く)
      const dx = goTo.x - me.x, dz = goTo.z - me.z, d = Math.hypot(dx, dz);
      if (d < 0.5) { goTo = null; me.speed = 0; }
      else {
        me.ry = angleLerp(me.ry, Math.atan2(dx, dz), Math.min(1, dt * 10)); me.speed += (Math.min(9, 3 + d * 3) - me.speed) * Math.min(1, dt * 6);
        const px = me.x, pz = me.z, st = Math.min(me.speed * dt, d); [me.x, me.z] = collide(me.x + Math.sin(me.ry) * st, me.z + Math.cos(me.ry) * st);
        goTo.stuck = Math.hypot(me.x - px, me.z - pz) < st * 0.3 ? goTo.stuck + dt : 0;
        if (goTo.stuck > 0.8) { goTo = null; me.speed = 0; }   // 壁などでこれ以上すすめない
      }
    }
    if (approach && (mag > 0.3 || hud.busy || !approach.r.ch.root.visible)) approach = null;
    if (approach) {   // ダブルタップした住人のところへ駆けよって、着いたら話しかける
      const r = approach.r, dx = r.ch.root.position.x - me.x, dz = r.ch.root.position.z - me.z, d = Math.hypot(dx, dz);
      if (d < 1.9) { approach = null; lookAtR = null; me.speed = 0; talkTo(r); }
      else {
        me.ry = angleLerp(me.ry, Math.atan2(dx, dz), Math.min(1, dt * 10)); me.speed += (9 - me.speed) * Math.min(1, dt * 6);
        const px = me.x, pz = me.z; [me.x, me.z] = collide(me.x + Math.sin(me.ry) * me.speed * dt, me.z + Math.cos(me.ry) * me.speed * dt);
        approach.stuck = Math.hypot(me.x - px, me.z - pz) < me.speed * dt * 0.3 ? approach.stuck + dt : 0;
        if (approach.stuck > 1.2) { approach = null; lookAtR = null; if (d < 4) talkTo(r); else hud.toast('うまく近づけなかったよ'); }
      }
    }
    if (ride && ride.tour) {   // 周遊コース: 道すじをたどって自動で進む
      const n = ride.tour[0];
      if (!n) { ride.tour = null; me.speed = 0; say1(ride.r, 'ふわ〜、ひとまわりしたよ。このまま自由に動けるよ', 4); }
      else { const dx = n.x - me.x, dz = n.z - me.z, d = Math.hypot(dx, dz);
        if (d < 0.8) ride.tour.shift();
        else { me.ry = angleLerp(me.ry, Math.atan2(dx, dz), Math.min(1, dt * 3.5)); me.speed += (6 - me.speed) * Math.min(1, dt * 3); const st = Math.min(me.speed * dt, d), k = Math.max(0.35, Math.cos(Math.atan2(dx, dz) - me.ry)); me.x += Math.sin(me.ry) * st * k + dx / d * st * (1 - k); me.z += Math.cos(me.ry) * st * k + dz / d * st * (1 - k); } }
    }
    const guided = guideStep(dt, mag) || !!approach || !!goTo || !!(ride && ride.tour);   // 住人に連れて行ってもらっている間は、自動で歩く
    const rideT = Math.max(0, Math.min(1, (mag - 0.55) / 0.45));   // 乗っている間: 軽くたおす=歩く速さ、思いきりたおす=走りの2倍
    const target = mag > 0.05 ? (ride ? 6.8 * Math.max(mag, 0.4) + (24 - 6.8) * rideT * rideT : (inp.run ? 12 : 6.8) * Math.max(mag, 0.4) * pullBoost) : 0;
    if (!guided) me.speed += (target - me.speed) * Math.min(1, dt * 10);
    if (mag > 0.05 && !guided) {
      const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
      const wx = (mx * c + my * s) / mag, wz = (-mx * s + my * c) / mag; lastMove = { x: wx, z: wz };
      me.ry = angleLerp(me.ry, Math.atan2(wx, wz), Math.min(1, dt * 12));
      if (ride) { const n = Math.max(1, Math.ceil(me.speed * dt / 0.25)), rad = 0.3 * (ride.r.ch.scaleNow || 1); for (let i = 0; i < n; i++) [me.x, me.z] = collide(me.x + wx * me.speed * dt / n, me.z + wz * me.speed * dt / n, rad); }   // 速いので、こまかく進めて壁をすりぬけないように
      else [me.x, me.z] = collide(me.x + wx * me.speed * dt * (seasons.carrying() ? 0.6 : 1), me.z + wz * me.speed * dt * (seasons.carrying() ? 0.6 : 1));   // 雪だるまを持っていると、ゆっくり
    }
    lastMoveDir = lastMove;
    if (dodgeCd > 0) dodgeCd -= dt;
    if (dodgeT > 0) { dodgeT -= dt; me.ry = Math.atan2(ddx, ddz); me.speed = 8; [me.x, me.z] = collide(me.x + ddx * 8.5 * dt, me.z + ddz * 8.5 * dt); }
    me.ch.root.position.set(me.x, seat ? -0.04 : 0, me.z); me.ch.root.rotation.y = me.ry;
    rideStep(dt);
    if (!seat && !battle.active) { if (snow.making || bld) me.ch.pose = 'kneel'; else if (me.ch.pose === 'kneel') me.ch.pose = null; }
    me.ch.update(dt, me.speed);
    { const rg = me.ch.rig;   // よけている間はくるっと回る / 雪だるまを持っている間は両手を上げる
      if (rg) { if (dodgeT > 0) { rollPose(rg, 1 - dodgeT / 0.55); dodgeRot = true; } else if (dodgeRot) { rollReset(rg); dodgeRot = false; }
        if ((snow.making || bld) && !battle.active) { rg.body.rotation.x = 0.35; rg.arms[0].rotation.x = rg.arms[1].rotation.x = -1.25; rg.arms[0].rotation.z = -0.1; rg.arms[1].rotation.z = 0.1; } else if (!seasons.carrying() && !dodgeRot && rg.body.rotation.x === 0.35) rg.body.rotation.x = 0;
        if (seasons.carrying()) { rg.arms[0].rotation.x = rg.arms[1].rotation.x = -2.95; rg.arms[0].rotation.z = 0.35; rg.arms[1].rotation.z = -0.35; } } }

    // カメラ:後ろから少し見下ろす。建物にめり込むときは手前に寄せる
    if (mag > 0.05 || battle.active) { const dk = Math.max(0, 1 - dt * 4); panOff.x *= dk; panOff.z *= dk; }   // 歩きだしたら、もとの位置へもどる
    const ft0 = (date && date.focus) || sport.focus() || me, ft = { x: ft0.x + panOff.x, z: ft0.z + panOff.z };   // ゴルフ・フリスビーで飛んでいる間は、ボールを追う
    cam.x += (ft.x - cam.x) * Math.min(1, dt * 8); cam.z += (ft.z - cam.z) * Math.min(1, dt * 8);
    if (camMode === 'free') { camera.position.set(fcam.x, fcam.y, fcam.z); const cp = Math.cos(fcam.pitch); camera.lookAt(fcam.x - Math.sin(fcam.yaw) * cp, fcam.y - Math.sin(fcam.pitch), fcam.z - Math.cos(fcam.yaw) * cp); }
    if (camMode === 'follow') {
    const look = v3.set(cam.x, 1.3 + rideLift, cam.z);
    const op = cam.pitch;   // 低い位置まで下げられる(地面だけ下で止める)
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
    const tgt = lookAtR || (talkingTo && hud.busy ? talkingTo : null);
    const talkF = !ride && talkingTo && hud.busy && camMode === 'follow' && !battle.active && !sport.active && !seat && talkingTo.ch.root.visible;
    if (talkF) {   // 会話中: 画面の「会話パネルより上」に、相手の顔と全身が必ず収まるように、カメラを置く(視点の設定に関わらず)
      const r = talkingTo, tp = r.ch.root.position, H = r.ch.glb ? r.ch.height : 1.6;
      const W = root.clientWidth || 1, Hh = root.clientHeight || 1, rr = root.getBoundingClientRect();
      const pe = root.querySelector('.tw-dialog, .tw-card'); let top = 0.97;
      if (pe) { const pr = pe.getBoundingClientRect(); if (pr.height > 0) top = Math.min(0.97, Math.max(0.3, (pr.top - rr.top) / Hh)); }
      const hudTop = 0.2, regionH = Math.max(0.2, top - hudTop - 0.03), yc = hudTop + 0.015 + regionH / 2;   // 相手を置く帯(画面の割合)
      const tanH = Math.tan(camera.fov * Math.PI / 360);
      const D = Math.max(2.4, (H * 1.12) / (regionH * 2 * tanH));   // 帯の高さに、背がちょうど収まる距離
      let dx = me.x - tp.x, dz = me.z - tp.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
      const cx = tp.x + dx * D, cz = tp.z + dz * D, cy = H * 0.55;
      camera.position.set(cx, cy, cz); camera.lookAt(tp.x, cy, tp.z);
      const shift = (0.5 - yc) * Hh;   // 相手が帯の真ん中に来るよう、絵ごと上にずらす
      camera.setViewOffset(W, Hh, 0, shift, W, Hh);
      me.ch.root.visible = false; talkF_on = true;
      cam.yaw = angleLerp(cam.yaw, Math.atan2(dx, dz), Math.min(1, dt * 6));
    } else if (talkF_on) { camera.clearViewOffset(); talkF_on = false; }
    if (talkF) { /* 上で決めた */ } else if (fpOn() && !battle.active) {   // 自分視点:目の高さから。相手がいれば、相手の顔の方へゆっくり向く
      if (tgt) {
        const dx = tgt.ch.root.position.x - me.x, dz = tgt.ch.root.position.z - me.z, d = Math.max(0.5, Math.hypot(dx, dz));
        cam.yaw = angleLerp(cam.yaw, Math.atan2(-dx, -dz), Math.min(1, dt * 5));
        const face = (tgt.ch.glb ? tgt.ch.height : 1.6) * 0.8;
        fpPitch += (Math.atan2(face - eyeH(), d) - fpPitch) * Math.min(1, dt * 5);
        if (mag < 0.05) me.ry = angleLerp(me.ry, Math.atan2(dx, dz), Math.min(1, dt * 8));
      } else if (mag < 0.05) me.ry = angleLerp(me.ry, cam.yaw + Math.PI, Math.min(1, dt * 6));
      const e = eyeH(), cp = Math.cos(fpPitch);
      camera.position.set(me.x, e, me.z); camera.lookAt(me.x - Math.sin(cam.yaw) * cp, e + Math.sin(fpPitch), me.z - Math.cos(cam.yaw) * cp);
      me.ch.root.visible = false;
    } else if (battle.active && battle.view === 'fp') {   // 一人称:自分の目の高さから、向いている方を見る(yaw はカメラ=見ている向き)
      camera.position.set(me.x, 1.55, me.z); camera.lookAt(me.x - Math.sin(cam.yaw), 1.45, me.z - Math.cos(cam.yaw));
    } else {
    camera.position.copy(look).addScaledVector(off, dist);
    if (camera.position.y < 0.2) camera.position.y = 0.2;   // 地面より下には行かない
    camera.lookAt(look);
    }
    }

    if (talkingTo && !hud.busy) { talkingTo.talking = false; talkingTo = null; }   // 会話が終わっているのに止まったままの住人を放す
    for (const r of residents.list) if (r.talking && r !== talkingTo) r.talking = false;
    tipUpdate(dt); hanaUpdate(dt); birthdayUpdate(dt); visitUpdate(dt);
    env.camera = camera; env.update(dt, me.ch.root.position);
    seasons.update(dt, camera.position, env.night || 0); seasons.holdAt(me.x, me.z, me.ry);
    if (fw.busy) fw.update(dt, camera, renderer.domElement.clientHeight || 600);
    if (env.weather || evt?.wx || (env.rainLevel || 0) > 0.01) audio.rain(evt?.wx && !appHost.current ? env.rainLevel || 0 : 0);   // 雨の音は、にわか雨(虹の出るイベント)のときだけ
    if (evt?.wx && !evt.bowSaid && env.weather && env.weather.bow > 0.25) { evt.bowSaid = true; banner('🌈 虹が出たよ！', '虹を見る', () => aimSky('rain'), 15000); }
    if (evt) { if (evt.wx ? !env.weather : evt.fw ? !fw.busy : !env.eclipse) endEvent(); }
    sparkles.update(dt, me);
    if ((schedT -= dt) <= 0) { schedT = 3; sched.check(); curWx = weather.now(); env.setAmbient(curWx); }
    city.update(t, env.hour);
    ambient.update(dt, t, me.ch.root.position, env.night, me.speed);
    hud.setFeed(started && !hud.busy && ambient.pigeonsNear(me.ch.root.position, 10));
    { const sn = seasons.carrying() ? null : seasons.nearest(me.x, me.z, 2.4);
      hud.setSnow(started && seasons.season === 'winter' && !battle.active && !sport.active, snow.making ? '❄️\nころころ' : snow.holding ? '❄️\n投げてね' : seasons.carrying() ? '❄️\n雪玉' : '❄️\n雪玉', seasons.carrying() ? '🙌\n雪だるま' : sn ? '🙌\n雪だるま' : '⛄\n雪だるま', snow.making || snow.holding);
      hud.setDodge(started && !battle.active && !sport.active); }
    snow.update(dt);
    battle.update(dt, lastMove);
    sport.update(dt);
    if (sport.active) {   // ゴルフ・フリスビーなどの間は、ほかの人を止めて見えなくする(軽くなる・じゃまにならない)
      if (!sportHid) { sportHid = new Map(); for (const r of residents.list) { sportHid.set(r.ch.root, r.ch.root.visible); r.ch.root.visible = false; } for (const [, q] of peers) { sportHid.set(q.ch.root, q.ch.root.visible); q.ch.root.visible = false; } }
    } else {
      if (sportHid) { for (const [o, v] of sportHid) o.visible = v; sportHid = null; }
      residents.update(dt, env.hour, me);
    }

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
      for (const r of residents.list) if (r.ch.root.visible && !r.ride) consider({ kind: 'npc', ref: r, label: `${r.def.name}と話す` }, r.ch.root.position.x, r.ch.root.position.z, 2.3);
      for (const it of city.interact) if (!it.season || it.season === seasons.season) consider(it, it.x, it.z, it.r);
      { const fs = soc.nearFind(me.x, me.z); if (fs) consider({ kind: 'find', ref: fs, label: '🔍 調べる' }, fs.x, fs.z, 1.6); }
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
    for (const r of residents.list) put('npc:' + r.def.id, r.ch.root, r.def.mascot ? 1.25 * (r.ch.scaleNow || 1) + (r.ride ? 0.9 : 0) : (r.ch.glb ? r.ch.height + 0.35 : 1.95), !(r.ride || r.follow || r.pin) && (focus?.ref === r || Math.hypot(r.ch.root.position.x - me.x, r.ch.root.position.z - me.z) < 6));   // 乗っている・手をつないでいる・カフェ/家で一緒のときは、絵が見えるように名前を出さない
    hud.placeTags(tagPos);

    hud.setArea(city.areaName(me.x, me.z));
    hud.setClock(env.hour, curWx);
    saveT += dt;
    if (saveT > 5) { saveT = 0; residents.outing = outingOf(testDate); storage.set('pos', [+me.x.toFixed(1), +me.z.toFixed(1)]); storage.set('hour', +env.hour.toFixed(2)); }

    if (fx) fx.composer.render(dt); else renderer.render(scene, camera);
    frames++; fpsT += dt;
    if (fpsT > 1) { fps = frames / fpsT; frames = 0; fpsT = 0; }
  }

  // バックグラウンドでは止める
  const vis = () => { if (document.hidden) { paused = true; audio.suspend(); } else { paused = false; timer.update(); if (!held) audio.resume(); } };
  on(document, 'visibilitychange', vis);
  on(root, 'pointerdown', () => audio.unlock(), { once: true });

  // ---- 読み込み画面: キャラを全部読み込んで、画面に出せる準備まで終えてから町を見せる(入ってから読み込んでカクつかないように) ----
  let loadFin, loadPct = 0; const loadP = new Promise(r => { loadFin = r; });
  {
    const lo = document.createElement('div'); lo.className = 'tw-loading';
    lo.innerHTML = '<div class="lt">町のじゅんびをしています…</div><div class="lb"><i></i></div><div class="lp">0%</div><button class="tw-btn" hidden>このまま入る</button>';
    root.appendChild(lo);
    const bar = lo.querySelector('i'), pct = lo.querySelector('.lp'), skip = lo.querySelector('button'), t0 = performance.now();
    let fin = false, warming = false, shown = 0;
    setGlbConc(4); glbPreload(['self:ren', 'self:mio', 'sora', 'hana', 'player:ren', 'player:mio']);
    const finish = () => { if (fin) return; fin = true; loadPct = 1; setGlbConc(2); lo.remove(); loadFin(); };
    skip.onclick = finish;
    const tick = async () => {
      if (fin) return;
      const s = glbStat(), p = s.total ? s.done / s.total : 0;
      shown = Math.max(shown, warming ? 0.97 : p * 0.9); bar.style.width = (shown * 100).toFixed(0) + '%'; pct.textContent = Math.round(shown * 100) + '%'; loadPct = Math.min(0.99, shown);
      if (s.total && s.done >= s.total && !warming) { warming = true; try { await glbWarm(renderer, camera); } catch (e) { } bar.style.width = '100%'; pct.textContent = '100%'; setTimeout(finish, 150); return; }
      const el = performance.now() - t0; if (!s.total && el > 2500) { finish(); return; }
      if (el > 20000) skip.hidden = false;
      setTimeout(tick, 120);
    };
    tick();
  }

  frame();
  if (opt.skipTitle) { settings.name ||= LOOKS[settings.look].name; started = true; hud.tag(me.id, settings.name, true); net?.connect({ id: me.id, name: settings.name, look: settings.look }); netStarted = true; }
  else loadP.then(() => { if (!started) showTitle(); });   // 読み込みがおわってから、タイトルを出す
  opt.onEvent?.('ready', { version: VERSION });

  return {
    version: VERSION,
    bus, ai: { get ready() { return ai.ready; }, configure: o => ai.configure(o), get state() { return ai.state; } },
    openApp: (id, p) => openApp(id, p),
    closeApp: () => appHost.close(),
    registerApp: def => appHost.register(def),
    setHour: h => { env.hour = h; },
    weather: () => ({ kind: curWx, rain: env.rainLevel || 0, amb: env.amb ? { ...env.amb } : null }),
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
    showArrival: () => showTitle(true),
    launchOutdoor: what => { backHome = false; setTimeout(() => launchOutdoor(what), 350); },   // タイトルのアミューズメントから
    quickStart: () => { if (started) return; document.querySelectorAll('.tw-title').forEach(e => e.remove()); startAs({ look: settings.look, name: settings.name || LOOKS[settings.look].name }); },
    // 町の中のもの(app の id。例 'omikuji')の前へ飛んで、そちらを向く
    goToApp: id => { const i = city.interact.find(x => x.app === id); if (!i) return false; const x = i.x, z = i.z + 2; me.x = x; me.z = z; me.ry = Math.atan2(i.x - x, i.z - z); me.speed = 0; cam.yaw = me.ry + Math.PI; cam.x = x; cam.z = z; return true; },
    snowState: () => { const B = battle.state; return B && { phase: B.phase, men: B.men.map(m => { const v = new THREE.Vector3(m.x, 0.6, m.z).project(camera); return [m.x, m.z, m.hp, m.g.scale.x, !!m.g.parent, m.g.visible, +v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(3), m.g.children.length, m.g.children[0].visible]; }), me: [me.x, me.z, me.ry], F: B.F.map(f => [f.name, f.x, f.z, f.hp]) }; },
    sportStart: k => sport.start(k), sportCheat: () => sport.cheatHole(),   // テスト用
    npc: id => residents.list.find(x => x.def.id === id),   // テスト用
    finds: () => finds.spots().map(s => ({ key: s.key, x: s.x, z: s.z, kind: s.kind })),   // テスト用
    benchNear: () => { const b = city.interact.filter(i => i.kind === 'bench').sort((a, c) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(c.x - me.x, c.z - me.z))[0]; me.x = b.x + Math.sin(b.ry) * 1.2; me.z = b.z + Math.cos(b.ry) * 1.2; sitOnBench(b); },   // テスト用
    npcAct: (id, act) => { const r = residents.list.find(x => x.def.id === id); if (!r) return false; const p = r.ch.root.position; me.x = p.x + 1.2; me.z = p.z; if (act) doAct(r, { act }); else talkTo(r); return true; },   // テスト用
    snowBattle: id => battle.start(residents.list.find(r => r.def.id === id) || residents.list[0], 2),   // テスト用
    talk: id => { const r = residents.list.find(x => x.def.id === id); if (r) talkTo(r); },   // 点検用
    hideNpc: id => { const r = residents.list.find(x => x.def.id === id); if (r) { r.hidden = true; r.ch.root.visible = false; } },   // 点検用: 休み中の状態を作る
    debugPose: (pose, d) => { me.ch.pose = pose; if (d) { cam.dist = d; cam.pitch = 0.15; cam.yaw = me.ry + Math.PI / 2; } },   // 点検用
    debugVisit: id => { const r = residents.list.find(x => x.def.id === id); if (!r) return; r.ch.root.position.set(me.x + 9, 0, me.z + 3); r.ch.root.visible = true; r.hidden = false; r.visit = { t: 0 }; r.visitSg = { say: 'テスト: やってみない?', fn: () => hud.toast('やってみる!を押した') }; visiting = r; },   // 点検用
    debugVisitInfo: id => { const r = residents.list.find(x => x.def.id === id); return JSON.stringify({ visit: r.visit, visiting: !!visiting, busy: hud.busy, app: !!appHost.current, cm: camMode, started, d: Math.hypot(r.ch.root.position.x - me.x, r.ch.root.position.z - me.z), talking: r.talking, pin: !!r.pin }); },
    progress: () => loadPct,   // 読み込みの進み具合(0〜1)
    ready: loadP,   // 読み込みと準備が全部おわったら解決
    teleport: (x, z, ry) => { me.x = x; me.z = z; if (ry !== undefined) { me.ry = ry; cam.yaw = ry + Math.PI; } cam.x = x; cam.z = z; },
    action: doAction,
    // 組み込み先がゲームを開いている間は止める(描画も音も)
    audioState: () => audio.state(),
    pause() { held = true; input.clear(); audio.suspend(); },
    resume() { held = false; timer.update(); input.clear(); audio.resume(); hud.setCoins(wallet.get(), gemsNow()); },
    unmount() {
      // どれかの後始末でエラーが出ても、ほかの後始末(特に音を止める)が必ず動くように、1つずつ守る
      const t = f => { try { f(); } catch (e) { console.error(e); } };
      t(() => audio.dispose());   // 音は、まっさきに止める
      t(() => fw.dispose()); t(() => seasons.dispose()); t(() => clearBanner());
      t(() => cancelAnimationFrame(raf)); t(() => ro.disconnect()); t(() => offs.forEach(f => f())); t(() => appHost.close()); t(() => input.dispose()); t(() => hud.dispose()); t(() => net?.disconnect()); t(() => bus.clear());
      scene.traverse(o => { o.geometry?.dispose(); });
      renderer.dispose(); renderer.forceContextLoss?.(); root.remove();
      if (--styleRefs === 0) document.querySelector('style[data-town]')?.remove();
    },
  };
}
