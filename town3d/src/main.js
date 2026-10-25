// ほしみや町:公開 API は mount(要素, 設定) → { unmount, ... } だけ
import * as THREE from 'three';
import { createBus, createStorage, createWallet, angleLerp, clamp } from './core/core.js';
import { createAppHost } from './core/apps.js';
import { createLocalNet, createWsNet } from './core/net.js';
import { createAudio } from './core/audio.js';
import { createAI, buildSystem } from './core/ai.js';
import { openAiSetup, openChat } from './ui/aiui.js';
import { openOgiri } from './ui/ogiri.js';
import { createEnv } from './world/env.js';
import { buildCity } from './world/city.js';
import { buildAmbient } from './world/ambient.js';
import { makeCharacter, LOOKS, LOOK_IDS, setCharOutline } from './world/character.js';
import { setBuildingOutline, eachFoliage, eachTex } from './world/kit.js';
import { createSeasons, SEASONS, seasonOf } from './world/seasons.js';
import { createSnowballs } from './world/snowballs.js';
import { createSnowBattle } from './world/snowbattle.js';
import { createResidents, period } from './game/npc.js';
import { createInput } from './game/input.js';
import { createHud, CSS } from './ui/hud.js';
import { APPS } from './apps/registry.js';
import { openFinder } from './ui/finder.js';
import { openNotes } from './ui/notes.js';
import { snapCanvas, shotCard, flash } from './game/photos.js';
import { createFireworks, FW_TYPES, FW_SHOWS, FW_CENTER } from './world/fireworks.js';
import { createSchedule, EVENT_KINDS } from './world/events.js';

let styleRefs = 0;
const VERSION = '0.1.0';

export function mount(container, opt = {}) {
  const bus = createBus();
  const storage = opt.storage || createStorage(opt.storagePrefix || 'town:');
  const settings = Object.assign({ quality: matchMedia('(pointer:coarse)').matches ? 'mid' : 'high', timeSpeed: 1, adult: 0, birth: '', en: 0, enLevel: 'easy', tips: 1, look: 'hana', name: '', bgm: 0.5, sfx: 0.7 }, storage.get('settings') || {});
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
  const residents = createResidents(scene, city.graph, () => env.hour);
  // 町の雪玉(冬だけ)
  const NPC_SNOW = { mii: ['ひゃっ、つめたい〜! もう、やりましたね〜', 1], baron: ['ぬおっ! わが輩に雪玉とは、いい度胸だ!', 2], gon: ['つめてっ! やったな〜!', 3], koharu: ['きゃっ! ふふ、元気ですね', 1], shiori: ['……つめたい。……おかえし、しましょうか', 2], suna: ['おやおや、冷たいねえ', 2], maru: ['うわっ! まいったな〜!', 2], yuzu: ['ひゃっ! び、びっくりしたです', 1], chunkkun: ['ふわっ!? 雪だ〜!', 1] };
  const snow = createSnowballs(scene, {
    camera, meshes: city.meshes, residents,
    getHand: () => new THREE.Vector3(me.x + Math.sin(me.ry) * 0.38 + Math.cos(me.ry) * 0.22, 1.05, me.z + Math.cos(me.ry) * 0.38 - Math.sin(me.ry) * 0.22),
    onNpcHit(r) {
      const [line, lv] = NPC_SNOW[r.def.id] || ['わっ! つめたい!', 2];
      audio.play('wave'); hud.say('npc:' + r.def.id, line, 3);
      if (battle.active) return;
      setTimeout(() => { if (!started || hud.busy || appHost.current || battle.active) return; hud.dialog({ name: r.def.name, role: r.def.role, text: `${line} 雪合戦で勝負する?`, choices: [{ label: '⛄ ここで勝負!(2対2)', fn: () => battle.start(r, lv) }, { label: '🎮 チャンクボックス版で', fn: () => openApp('snowfight', { npc: { id: r.def.id, name: r.def.name, lv } }) }, { label: 'やめておく', fn: () => { } }] }); }, 1100);
    },
  });

  // ---- 自分 ----
  const me = { id: storage.get('pid') || 'p' + Math.random().toString(36).slice(2, 10), x: 0, z: 13, ry: Math.PI, speed: 0, ch: null };
  // 3Dの雪合戦(町のその場で 2×2)
  const battle = createSnowBattle({
    faceCam: (x, z, ry) => { cam.yaw = ry + Math.PI; cam.x = x; cam.z = z; cam.pitch = 0.8; cam.dist = 11.5; },   // 引いた斜め上から
    scene, camera, root, me, residents, meshes: city.meshes, collide: (x, z) => collide(x, z), audio, snowFx: (p, n, s) => snow.fx(p, n, s),
    onEnd({ win, quit, opp }) {
      if (quit) { hud.toast('雪合戦をやめた'); return; }
      if (win) { wallet.add(30, 'snowfight'); }
      setTimeout(() => hud.dialog({ name: opp?.def.name || '雪合戦', text: win ? 'まいった〜! 強いね。(🪙+30)' : 'へへっ、こっちの勝ち! また勝負しよう', choices: [{ label: 'もう一回!', fn: () => opp && battle.start(opp, 2) }, { label: 'おわる', fn: () => { } }] }), 300);
    },
  });
  storage.set('pid', me.id);
  const last = storage.get('pos'); if (last) { me.x = last[0]; me.z = last[1]; }
  function setLook(id) {
    if (me.ch) scene.remove(me.ch.root);
    me.ch = makeCharacter(LOOKS[id] || LOOKS.hana);
    scene.add(me.ch.root);
  }
  setLook(settings.look);

  const hud = createHud(root, bus);
  const gemsNow = () => (opt.gems ? opt.gems.get() : null);   // ダイヤ(組み込み先があるときだけ表示)
  const appHost = createAppHost({ paramsFor: (id, p) => id === 'gamebox' || id === 'snowfight' ? { ...(p || {}), season: curSeason() } : id === 'fishing' ? { ...(p || {}), hour: env.hour, season: curSeason(), rain: !!(env.weather && env.weather.rain > 0.2) } : p, root, bus, storage, wallet, getPlayer: () => ({ id: me.id, name: settings.name, look: settings.look }), getAudio: () => audio.get(), getNotes: () => notes.map(n => ({ ...n })), features: opt.features || [], gems: opt.gems || null, house: opt.house || null, photo: opt.photo || null, member: opt.member || null, dictUrl: opt.dictUrl || null });
  APPS.forEach(a => appHost.register(a));
  (opt.apps || []).forEach(a => appHost.register(a)); // 組み込み先から足すアプリ
  hud.setCoins(wallet.get(), gemsNow());
  if (opt.gems) { const gi = setInterval(() => hud.setCoins(wallet.get(), gemsNow()), 1500); offs.push(() => clearInterval(gi)); }

  // ---- 他のプレイヤー ----
  const peers = new Map();
  const net = opt.net === 'none' ? null : opt.net && typeof opt.net === 'object' ? opt.net : opt.netUrl ? createWsNet(opt.netUrl, opt.room) : createLocalNet({ graph: city.graph, looks: LOOK_IDS.map(k => LOOKS[k]) });
  if (net) {
    net.on('join', p => {
      if (peers.has(p.id)) return;
      const ch = makeCharacter(typeof p.look === 'string' ? LOOKS[p.look] || LOOKS.sora : p.look || LOOKS.sora);
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
  function sitOnBench(b) {
    const c = Math.cos(b.ry), s = Math.sin(b.ry), dx = me.x - b.x, dz = me.z - b.z;
    const lx = Math.max(-0.55, Math.min(0.55, dx * c - dz * s)), lz = -0.02;
    me.x = b.x + lx * c + lz * s; me.z = b.z - lx * s + lz * c; me.ry = b.ry; me.speed = 0;
    seat = { b }; me.ch.pose = 'sit'; input.clear();
  }
  function standFromSeat() {
    if (!seat) return; const b = seat.b; seat = null; me.ch.pose = null;
    [me.x, me.z] = collide(b.x + Math.sin(b.ry) * 1.1, b.z + Math.cos(b.ry) * 1.1);
  }

  function doAction() {
    if (!started || appHost.current || hud.busy || !focus) return;
    audio.unlock();
    if (focus.kind === 'stand') { standFromSeat(); return; }
    if (focus.kind === 'bench') { sitOnBench(focus); return; }
    if (focus.kind === 'mksnow') { const f = seasons.build(me.x + Math.sin(me.ry) * 1.7, me.z + Math.cos(me.ry) * 1.7); if (f) { audio.play('open'); hud.toast('ころころ…雪だるまができた！'); } return; }
    if (focus.kind === 'snowman') { seasons.remove(focus.idx); audio.play('close'); hud.toast('雪だるまをくずしたよ'); return; }
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
    const text = residents.lineFor(r, env.hour);
    const choices = (r.def.menu || []).map(m => ({ label: m.label, fn: () => (m.act ? doAct(r, m) : openApp(m.app, m.params)) }));
    choices.push({ label: ai.ready ? 'おしゃべりする' : 'AIでおしゃべり(設定)', fn: () => { r.talking = true; talkingTo = r; if (ai.ready) startChat(r, text); else openAiSetup({ hud, ai, onDone: () => startChat(r, text) }); } });   // キー設定の画面を出している間も、住人はその場にいる
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
    const inp = { get value() { return birthStr(); } };
    pn.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ad === 'close') return hud.closePanel();
      if (b.dataset.ad === 'off') { settings.adult = 0; save(); msg.textContent = 'オフにしました。'; return; }
      if (b.dataset.ad === 'on') {
        if (!inp.value || ageOf(inp.value) < 0) { msg.textContent = '生年月日を、年・月・日の順に数字で入れてね。'; return; }
        if (ageOf(inp.value) < 18) { settings.adult = 0; settings.birth = ''; save(); msg.textContent = '18歳未満の人は使えません。'; return; }
        settings.birth = inp.value; settings.adult = 1; save(); msg.textContent = 'オンにしました。';
      }
    });
  }
  // メニューの「act」:大喜利・格言・ハーモニカ(アプリを開かない、住人ならではのあそび)
  function doAct(r, m) {
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
  function startChat(r, first) {
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
  function openApp(id, params) {
    // 組み込み先(チャンクタウン)が開くアプリ(ゲームなど)は、そちらに任せる
    if (opt.openExternal?.(id, params)) { input.clear(); return; }
    if (!appHost.has(id)) { hud.toast('まだ準備中みたい'); return; }
    audio.play('open'); input.clear(); input.enabled = false;
    appHost.open(id, params);
  }
  offs.push(bus.on('ui:action', doAction));
  offs.push(bus.on('ui:dialogClosed', () => { if (talkingTo) talkingTo.talking = false; talkingTo = null; }));
  offs.push(bus.on('ui:panelClosed', () => { if (talkingTo) talkingTo.talking = false; talkingTo = null; }));
  offs.push(bus.on('app:close', () => { input.enabled = true; audio.play('close'); hud.setCoins(wallet.get(), gemsNow()); }));
  if (opt.wallet?.onChange) offs.push(opt.wallet.onChange(w => bus.emit('wallet', w)));
  offs.push(bus.on('wallet', w => { hud.setCoins(w.coins, gemsNow()); if (w.delta > 0) { audio.play('coin'); hud.toast(`🪙 +${w.delta}`); } }));
  offs.push(bus.on('toast', t => hud.toast(t)));
  offs.push(bus.on('sfx', n => audio.play(n)));
  const SAY = ['こんにちは!', 'いい天気だね', 'いっしょに遊ぼう!', 'またね〜'];
  offs.push(bus.on('ui:snow', ph => {
    if (!started || seasons.season !== 'winter') return; audio.unlock();
    if (ph === 'down') { if (!snow.holding) snow.start(); }
    else if (snow.making) { snow.finish(); hud.toast('画面をタップした所へ投げよう'); }
  }));
  { let d0 = null; const cv = renderer.domElement;   // 雪玉を持っているとき:画面をタップした所へ投げる
    cv.addEventListener('pointerdown', e => { d0 = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    const onUp = e => {   // 町の操作が指をつかまえる(capture)ので、はなしたのは window で受ける
      if (!d0 || hud.busy || appHost.current || !(snow.holding || battle.active)) { d0 = null; return; }
      const ok = Math.hypot(e.clientX - d0.x, e.clientY - d0.y) < 12 && performance.now() - d0.t < 400; d0 = null; if (!ok) return;
      if (battle.active) { battle.tap(e.clientX, e.clientY, cv.getBoundingClientRect()); return; }
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
      bus.emit('start', { name, look });
      opt.onEvent?.('start', { name, look });
  }
  let netStarted = false;
  bus.on('*', (n, d) => { if (n.startsWith('app:') || n === 'talk' || n === 'wallet') opt.onEvent?.(n, d); });

  // ---- カメラ ----
  const cam = { yaw: Math.PI, pitch: 0.42, dist: 7.5, x: me.x, z: me.z };
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
    else if (name === 'front') { fcam.x = me.x + Math.sin(me.ry) * 3.4; fcam.z = me.z + Math.cos(me.ry) * 3.4; fcam.y = 1.5; fcam.yaw = me.ry; fcam.pitch = 0.05; }
    camBarDraw();
  }
  const camBar = hud.camBar;
  function camBarDraw() {
    if (camMode === 'follow') { camBar.hidden = true; camBar.innerHTML = ''; return; }
    camBar.hidden = false;
    const free = camMode === 'free';
    camBar.innerHTML = `<div>${free ? '🎥 カメラだけ動かしているよ(左下で移動・ドラッグで向き・ピンチで前後)' : '📌 カメラを固定中。自分は歩けるよ'}</div>
      ${free ? `<div class="r"><button class="tw-btn" data-p="foot">👣 足元から</button><button class="tw-btn" data-p="eye">👀 目の高さ</button><button class="tw-btn" data-p="front">🙂 正面から</button><button class="tw-btn" data-p="sky">🚁 空から</button><button class="tw-btn" data-p="top">🦅 真上から</button></div>
      <div class="r" style="align-items:center"><span>高さ</span><input type="range" class="hs" min="0" max="1" step="0.005" value="${heightToV(fcam.y).toFixed(3)}"></div>` : ''}
      <div class="r">${free ? '<button class="tw-btn on" data-c="fix">📌 ここで固定</button>' : '<button class="tw-btn on" data-c="free">🎥 また動かす</button>'}<button class="tw-btn" data-c="back">↩ もどす</button></div>`;
  }
  camBar.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; audio.play('tap');
    if (b.dataset.p) camPreset(b.dataset.p);
    else if (b.dataset.c === 'fix') { camMode = 'fixed'; cam.yaw = fcam.yaw; me.ch.root.visible = true; camBarDraw(); hud.toast('カメラをここに固定したよ。📷で撮れるよ'); }
    else if (b.dataset.c === 'free') { camFromView(); camMode = 'free'; camBarDraw(); }
    else if (b.dataset.c === 'back') { camMode = 'follow'; camBarDraw(); }
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
  function openBirthSetup() {
    const [py, pm, pd] = (settings.birth || '').split('-');
    const pn = hud.panel(`<h2>誕生日をとうろく</h2><p class="tw-note">誕生日の夜に、町であなただけの花火が上がります。この端末の中だけに保存します。</p>
      <div class="tw-row">誕生日<span style="display:flex;gap:6px;align-items:center"><input class="tw-by" inputmode="numeric" maxlength="4" placeholder="1990" value="${py || ''}" style="width:4.2em;font-size:16px;text-align:center"> 年 <input class="tw-bm" inputmode="numeric" maxlength="2" placeholder="5" value="${pm ? +pm : ''}" style="width:2.6em;font-size:16px;text-align:center"> 月 <input class="tw-bdd" inputmode="numeric" maxlength="2" placeholder="20" value="${pd ? +pd : ''}" style="width:2.6em;font-size:16px;text-align:center"> 日</span></div>
      <p class="tw-note tw-bmsg"></p>
      <div class="tw-actions"><button class="tw-btn main" data-b="save">ほぞん</button><button class="tw-btn" data-b="clear">けす</button><button class="tw-btn" data-b="close">とじる</button></div>`, (e, p) => {
      const b = e.target.closest('[data-b]')?.dataset.b; if (!b) return;
      const msg = p.querySelector('.tw-bmsg');
      if (b === 'close') { hud.closePanel(); return; }
      if (b === 'clear') { settings.birth = ''; settings.adult = 0; save(); msg.textContent = 'けしました'; return; }
      const y = +p.querySelector('.tw-by').value, m = +p.querySelector('.tw-bm').value, d = +p.querySelector('.tw-bdd').value, dt = new Date(y, m - 1, d);
      if (!(y > 1900 && y <= new Date().getFullYear()) || dt.getMonth() !== m - 1 || dt.getDate() !== d) { msg.textContent = '日付をたしかめてね'; return; }
      settings.birth = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; save(); msg.textContent = 'ほぞんしました。誕生日を楽しみにしててね';
    });
  }
  offs.push(bus.on('ui:cam', () => {
    if (!started || appHost.current || hud.busy) return;
    if (camMode === 'follow') { camFromView(); camMode = 'free'; } else camMode = 'follow';
    camBarDraw(); input.clear();
  }));
  const ray = new THREE.Raycaster();

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
      cam.yaw -= inp.camDX * 0.006; cam.pitch = clamp(cam.pitch + inp.camDY * 0.004, -1.5, 1.5);
      cam.dist = clamp(cam.dist + inp.zoom * 0.6, 1.6, 14);   // もっと近くまで寄れる(寄りすぎたら自分は消える)
      me.ch.root.visible = cam.dist > 1.9;
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
    if (snow.making || battle.making || battle.rolling) mx = my = 0;   // 雪玉をつくっている間は動けない(転がり中も)
    if (seat) { if (Math.hypot(mx, my) > 0.35) standFromSeat(); mx = my = 0; }
    const mag = Math.min(1, Math.hypot(mx, my)); let lastMove = null;
    const target = mag > 0.05 ? (inp.run ? 12 : 6.8) * Math.max(mag, 0.4) : 0;
    me.speed += (target - me.speed) * Math.min(1, dt * 10);
    if (mag > 0.05) {
      const s = Math.sin(cam.yaw), c = Math.cos(cam.yaw);
      const wx = (mx * c + my * s) / mag, wz = (-mx * s + my * c) / mag; lastMove = { x: wx, z: wz };
      me.ry = angleLerp(me.ry, Math.atan2(wx, wz), Math.min(1, dt * 12));
      [me.x, me.z] = collide(me.x + wx * me.speed * dt, me.z + wz * me.speed * dt);
    }
    me.ch.root.position.set(me.x, seat ? -0.04 : 0, me.z); me.ch.root.rotation.y = me.ry;
    me.ch.update(dt, me.speed);

    // カメラ:後ろから少し見下ろす。建物にめり込むときは手前に寄せる
    cam.x += (me.x - cam.x) * Math.min(1, dt * 8); cam.z += (me.z - cam.z) * Math.min(1, dt * 8);
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
    camera.position.copy(look).addScaledVector(off, dist);
    camera.lookAt(look);
    if (cam.pitch < 0.1) camera.rotateX(0.1 - cam.pitch);   // 真上まで見上げられる
    }

    if (talkingTo && !hud.busy) { talkingTo.talking = false; talkingTo = null; }   // 会話が終わっているのに止まったままの住人を放す
    for (const r of residents.list) if (r.talking && r !== talkingTo) r.talking = false;
    tipUpdate(dt);
    env.camera = camera; env.update(dt, me.ch.root.position);
    seasons.update(dt, camera.position, env.night || 0);
    if (fw.busy) fw.update(dt, camera, renderer.domElement.clientHeight || 600);
    if (env.weather || evt?.wx) audio.rain(env.rainLevel || 0);
    if (evt?.wx && !evt.bowSaid && env.weather && env.weather.bow > 0.25) { evt.bowSaid = true; banner('🌈 虹が出たよ！', '虹を見る', () => aimSky('rain'), 15000); }
    if (evt) { if (evt.wx ? !env.weather : evt.fw ? !fw.busy : !env.eclipse) endEvent(); }
    if ((schedT -= dt) <= 0) { schedT = 3; sched.check(); }
    city.update(t, env.hour);
    ambient.update(dt, t, me.ch.root.position, env.night, me.speed);
    hud.setFeed(started && !hud.busy && ambient.pigeonsNear(me.ch.root.position, 10));
    hud.setSnow(started && seasons.season === 'winter' && !battle.active, snow.making ? '❄️ ころころ' : snow.holding ? '❄️ 投げてね' : '❄️ 雪玉');
    snow.update(dt);
    battle.update(dt, lastMove);
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
    if (battle.active) focus = null;
    else if (!focus && !seat && seasons.season === 'winter') { const sn = seasons.nearest(me.x, me.z, 1.5); focus = sn ? { kind: 'snowman', idx: sn.i, label: '⛄ こわす' } : { kind: 'mksnow', label: '⛄ 雪だるまをつくる' }; }
    if (focus && focus.kind === 'npc') { const n = nearNpcs().length; if (n >= 2) focus.label = `ちかくの人と話す(${n}人)`; }
    if (seat) focus = { kind: 'stand', label: '🧍 立つ' };
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
    event: { lengths: () => { const o = {}; for (const n of Object.keys(FW_SHOWS)) { fw.show(n); o[n] = Math.round(fw.showLength); } fw.stop(); o.solar = 100; o.lunar = 130; o.rain = 120; return o; }, seek: f => { if (env.eclipse) env.eclipse.t = f * env.eclipse.dur; if (env.weather) env.weather.t = f * env.weather.dur; }, sec: evSec, run: runEvent, stop: stopEvent, kinds: EVENT_KINDS, fwTypes: FW_TYPES, fwShows: FW_SHOWS, check: () => sched.check(), list: () => sched.list(), get now() { return evt ? evt.kind : null; } },
    cameraMode: () => camMode,
    season: s => { if (s) { settings.season = s; save(); applySeason(); } return curSeason(); },
    quickStart: () => { if (started) return; document.querySelectorAll('.tw-title').forEach(e => e.remove()); startAs({ look: settings.look, name: settings.name || LOOKS[settings.look].name }); },
    // 町の中のもの(app の id。例 'omikuji')の前へ飛んで、そちらを向く
    goToApp: id => { const i = city.interact.find(x => x.app === id); if (!i) return false; const x = i.x, z = i.z + 2; me.x = x; me.z = z; me.ry = Math.atan2(i.x - x, i.z - z); me.speed = 0; cam.yaw = me.ry + Math.PI; cam.x = x; cam.z = z; return true; },
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
