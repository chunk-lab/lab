import { Art } from './art.js';
import { Snd } from './audio.js';
import { Dict } from './dict.js';
import { Game } from './game.js';
import { G } from './grammar.js';
import { Supply } from './supply.js';
import { Tutorial } from './tutorial.js';
import { UI } from './ui.js';
import { U } from './util.js';
/* ===== app.js:組み込み口(mount / unmount)・アダプタ・画面遷移 ===== */
export var VERSION = '1.0.0';
export var LEVELS = [
  { id: 0, name: 'やさしい', desc: 'ぜんぶ自動で直してくれる。まずはここから', auto: { art: true, prep: true, verb: true, ti: true, er: true }, color: 'pos', maxLevel: 1 },
  { id: 1, name: 'ふつう', desc: '冠詞・前置詞・to/-ing・-er/-est を自分で選ぶ', auto: { art: false, prep: false, verb: true, ti: false, er: false }, color: 'pos', maxLevel: 2 },
  { id: 2, name: 'むずかしい', desc: '動詞の形も自分で。色はチャンクだけ', auto: { art: false, prep: false, verb: false, ti: false, er: false }, color: 'chunk', maxLevel: 3 },
  { id: 3, name: '鬼', desc: '色のヒントなし・ぜんぶ手動', auto: { art: false, prep: false, verb: false, ti: false, er: false }, color: 'none', maxLevel: 4 }
];
export var MODES = [
  { id: 'shot', name: 'ボブル(試作)', desc: '下から撃って、となりの単語とチャンク・文を作って消す', icon: 'magic', bg: 'linear-gradient(160deg,#ff8fb8,#ff5f8f)' },
  { id: 'ta', name: 'タイムアタック', desc: '60秒。長い文ほど時間がのびる', icon: 'play', bg: 'linear-gradient(160deg,#9a80ff,#6a4cf0)' },
  { id: 'over', name: 'あふれ注意', desc: 'バブルがあふれたら終わり', icon: 'magic', bg: 'linear-gradient(160deg,#ffb36b,#ff7a59)' },
  { id: 'free', name: 'フリー', desc: '時間制限なし。じっくり練習', icon: 'info', bg: 'linear-gradient(160deg,#6fe0ad,#2fbf83)' },
  { id: 'daily', name: '日替わりお題', desc: '毎日ちがうお題と盤面で1回勝負', icon: 'star', bg: 'linear-gradient(160deg,#ffd76a,#ffb21f)', premium: true }
];
export var GOALS = [
  { id: 'long', text: '5語以上の文を3つ作る', test: function (s) { return s.list.filter(function (x) { return x.words >= 5; }).length >= 3; } },
  { id: 'past', text: '過去の文を3つ作る', test: function (s) { return s.past >= 3; } },
  { id: 'front', text: '前置きつきの文を2つ作る', test: function (s) { return s.front >= 2; } },
  { id: 'coord', text: 'and / but / so で文をつなぐ', test: function (s) { return s.coord >= 1; } },
  { id: 'clause', text: 'when / if などの節を使う', test: function (s) { return s.clause >= 1; } },
  { id: 'slot', text: 'スロットで文を4つ作る', test: function (s) { return s.slotS >= 4; } },
  { id: 'combo', text: 'コンボを15以上つなぐ', test: function (s) { return s.maxCombo >= 15; } },
  { id: 'many', text: '文を8つ作る', test: function (s) { return s.sentences >= 8; } }
];
export var DEFAULT_SETTINGS = { bgm: .5, sfx: .8, voice: true, rate: 1, hint: 'press', gloss: true, custom: false, auto: { art: false, prep: false, verb: true, ti: false, er: false }, color: 'pos', lite: false, vibe: true };

// ---------- 既定のアダプタ ----------
export function localStorageAdapter(prefix) {
  prefix = prefix || 'punichunk:'; var mem = {};
  function ls() { try { var x = window.localStorage; x.setItem(prefix + '__t', '1'); x.removeItem(prefix + '__t'); return x; } catch (e) { return null; } }
  var s = ls();
  return {
    get: function (k) { try { var v = s ? s.getItem(prefix + k) : mem[k]; return v == null ? null : JSON.parse(v); } catch (e) { return null; } },
    set: function (k, v) { var j = JSON.stringify(v); try { if (s) s.setItem(prefix + k, j); else mem[k] = j; } catch (e) { mem[k] = j; } },
    remove: function (k) { try { if (s) s.removeItem(prefix + k); delete mem[k]; } catch (e) { } }
  };
}
export function localRanking(storage) {
  return {
    submit: function (e) { var all = storage.get('rank') || {}, key = e.mode + ':' + e.level, list = all[key] || []; list.push(e); list.sort(function (a, b) { return b.score - a.score; }); all[key] = list.slice(0, 10); storage.set('rank', all); return Promise.resolve({ rank: all[key].indexOf(e) + 1 }); },
    top: function (mode, level) { var all = storage.get('rank') || {}; return Promise.resolve((all[mode + ':' + level] || []).slice()); },
    isLocal: true
  };
}
export function localStore(storage) {
  var PRICE = { premium: '¥480', hint: '¥120', magic: '¥120', auto: '¥120' }, GRANT = { hint: 5, magic: 3, auto: 3 };
  function load() { return storage.get('store') || { premium: false, inv: { hint: 3, magic: 3, auto: 3 } }; }
  function save(d) { storage.set('store', d); }
  return {
    isDummy: true,
    isPremium: function () { return !!load().premium; },
    inventory: function () { return Object.assign({}, load().inv); },
    consume: function (id) { var d = load(); if (!d.inv[id]) return false; d.inv[id]--; save(d); return true; },
    purchase: function (id) { var d = load(); if (id === 'premium') d.premium = true; else d.inv[id] = (d.inv[id] || 0) + (GRANT[id] || 1); save(d); return Promise.resolve(true); },
    price: function (id) { return PRICE[id] || '¥120'; }
  };
}

export function mount(container, options) {
  if (!container || !container.appendChild) throw new Error('PuniChunk.mount: 要素を指定してください');
  options = options || {};
  UI.injectCSS();
  var listeners = [], raf = 0, dead = false, ro = null;
  function listen(t, ev, fn, o) { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); }
  var root = U.el('div', { class: 'pc-root' }), stageEl = U.el('div', { class: 'pc-stage' });
  var bg = U.el('canvas', { class: 'pc-bg', 'aria-hidden': 'true' }), cv = U.el('canvas', { class: 'pc-cv', 'aria-label': 'ゲーム画面' }), probe = U.el('div', { class: 'pc-probe' });
  stageEl.appendChild(bg); stageEl.appendChild(cv); root.appendChild(probe); root.appendChild(stageEl); container.appendChild(root);
  var storage = options.storage || localStorageAdapter(options.storagePrefix);
  var dict = options.dict ? Dict.validate(options.dict) : Dict.makeDefault();
  var settings = Object.assign({}, DEFAULT_SETTINGS, storage.get('settings') || {}); settings.auto = Object.assign({}, DEFAULT_SETTINGS.auto, settings.auto || {});
  if (options.audio) { ['bgm', 'sfx', 'voice', 'rate'].forEach(function (k) { if (options.audio[k] != null) settings[k] = options.audio[k]; }); }
  var state = Object.assign({ level: 0, tutorialDone: false }, storage.get('state') || {});
  var services = Object.assign({ ranking: localRanking(storage), store: localStore(storage) }, options.services || {});
  var reduced = false; try { reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  var app = {
    version: VERSION, LEVELS: LEVELS, MODES: MODES, dict: dict, settings: settings, state: state, services: services, storage: storage, reduced: reduced,
    dictCredit: options.dictCredit || '辞書データ:「英語脳ゲーム」(eigo_nou)の手作り辞書をもとに作成。',
    stage: { w: 360, h: 640, top: 0, bottom: 0 }, dpr: 1, scene: 'title', game: null
  };
  app.openCommonSettings = options.openSettings || null;
  app.emit = function (name, data) { if (name === 'chunk') vibrate(10); else if (name === 'sentence') vibrate([18, 40, 18]); else if (name === 'fail') vibrate(30); if (options.onEvent) { try { options.onEvent(name, data || {}); } catch (e) { } } };
  function vibrate(p) { if (settings.vibe && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { } } }
  app.audio = Snd.create({ core: options.core });
  app.applyAudio = function () { app.audio.set({ vol: { bgm: settings.bgm, sfx: settings.sfx }, on: { bgm: settings.bgm > 0, sfx: settings.sfx > 0, voice: settings.voice }, rate: settings.rate }); };
  app.applyAudio();
  app.saveSettings = function () { storage.set('settings', settings); app.applyAudio(); };
  app.saveState = function () { storage.set('state', state); };
  app.best = function (mode, level) { var b = storage.get('best') || {}; return b[mode + ':' + level] || 0; };
  app.lifetime = function () { return Object.assign({ plays: 0, sentences: 0, maxCombo: 0, longestN: 0, longest: '' }, storage.get('life') || {}); };
  app.resetData = function () { ['rank', 'best', 'life', 'state', 'settings', 'daily'].forEach(function (k) { storage.remove(k); }); Object.assign(settings, JSON.parse(JSON.stringify(DEFAULT_SETTINGS))); state.level = 0; state.tutorialDone = false; app.applyAudio(); };
  var ui = app.ui = UI.create(app, stageEl);

  // ---------- 大きさ ----------
  var ctx = cv.getContext('2d'), bctx = bg.getContext('2d'), needResize = true;
  function measure() {
    var r = stageEl.getBoundingClientRect(), cs = getComputedStyle(probe);
    var top = options.insets && options.insets.top != null ? options.insets.top : parseFloat(cs.paddingTop) || 0;
    var bot = options.insets && options.insets.bottom != null ? options.insets.bottom : parseFloat(cs.paddingBottom) || 0;
    app.stage = { w: Math.max(280, r.width), h: Math.max(420, r.height), top: top, bottom: bot };
    app.dpr = Math.min(3, window.devicePixelRatio || 1);
    [cv, bg].forEach(function (c) { c.width = Math.round(app.stage.w * app.dpr); c.height = Math.round(app.stage.h * app.dpr); });
    root.style.setProperty('--pc-top', top + 'px'); root.style.setProperty('--pc-bottom', bot + 'px');
    if (app.game) { app.game.layout(); ui.itemsPos(app.game.L.lane.y + app.game.L.lane.h / 2); }
    needResize = false;
  }
  if (window.ResizeObserver) { ro = new ResizeObserver(function () { needResize = true; var r = stageEl.getBoundingClientRect(); setAwayRef && setAwayRef('zero', r.width < 2 || r.height < 2); }); ro.observe(stageEl); }
  var setAwayRef = null;
  listen(window, 'resize', function () { needResize = true; });

  // ---------- 背景・タイトルの飾り ----------
  var city = Art.City(options.citySeed || 2024), decor = [];
  function makeDecor() {
    decor = [];
    var words = dict.getWords({ pos: 'noun', maxLevel: 1, count: 3 }).map(function (e) { return { k: 'n', e: e }; })
      .concat(dict.getWords({ pos: 'verb', maxLevel: 1, count: 3, tag: { simple: 1 } }).map(function (e) { return { k: 'v', e: e }; }))
      .concat(dict.getWords({ pos: 'adj', maxLevel: 1, count: 2 }).map(function (e) { return { k: 'adj', e: e }; }))
      .concat([{ k: 'det', v: 'the' }]);
    var W0 = Math.max(300, Math.min(520, container.clientWidth || 390)), H0 = Math.max(500, container.clientHeight || 800);
    words.forEach(function (w, i) {
      var text = G.wordText(w, { auto: LEVELS[0].auto }), r = U.clamp(Art.measure(text, 15) / 2 + 13, 23, 44), best = null;
      for (var t = 0; t < 40; t++) { var x = .1 + Math.random() * .8, y = .24 + Math.random() * .28, md = 1e9; decor.forEach(function (d) { md = Math.min(md, Math.hypot((d.x - x) * W0, (d.y - y) * H0) - d.r - r); }); if (!best || md > best.md) best = { x: x, y: y, md: md }; if (md > 8) break; }
      decor.push({ w: w, text: text, r: r, x: best.x, y: best.y, vx: (Math.random() - .5) * .02, vy: (Math.random() - .5) * .02, ph: Math.random() * 6 });
    });
  }
  makeDecor();
  var T = 0, last = performance.now(), blink = 2, kunExpr = 'normal';
  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    if (needResize) measure();
    var W = app.stage.w, H = app.stage.h, d = app.dpr, g = app.game;
    bctx.setTransform(d, 0, 0, d, 0, 0);
    var p = .32, lit = .25;
    if (g) { p = g.mode === 'over' ? .15 + .8 * U.clamp(g.items.length / 34, 0, 1) : g.mode === 'free' || g.mode === 'tutorial' ? .2 + .25 * (Math.sin(T * .02) + 1) / 2 : U.clamp(.08 + g.t / 140, 0, .97); lit = U.clamp(g.score / 4000, .1, 1); }
    else if (app.scene === 'result') { p = .78; lit = .9; }
    city.draw(bctx, W, H, p, lit, T, d);
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    if (g) { g.update(dt); if (app.game === g) g.draw(ctx); }
    else drawDecor(dt, W, H, app.scene === 'title' && app.decor);
  }
  function drawDecor(dt, W, H, show) {
    var light = settings.lite || reduced;
    if (show && !light) for (var i = 0; i < decor.length; i++) for (var j = i + 1; j < decor.length; j++) { if (j >= U.clamp(Math.floor(((app.band || { y0: .22, y1: .55 }).y1 - (app.band || { y0: .22, y1: .55 }).y0) * H * W / 10500), 3, decor.length)) break; var p = decor[i], q = decor[j], dx = (q.x - p.x) * W, dy = (q.y - p.y) * H, dd = Math.hypot(dx, dy) || 1, mn = p.r + q.r + 6; if (dd < mn) { var o = (mn - dd) / 2 / dd; p.x -= dx * o / W; p.y -= dy * o / H; q.x += dx * o / W; q.y += dy * o / H; } }
    var bd0 = app.band || { y0: .22, y1: .55 }, capN = U.clamp(Math.floor((bd0.y1 - bd0.y0) * H * W / 10500), 3, decor.length);
    if (show) decor.slice(0, capN).forEach(function (b) {
      if (!light) { b.x += b.vx * dt; b.y += b.vy * dt; }
      var mx = (b.r + 6) / W; if (b.x < mx) { b.x = mx; b.vx = Math.abs(b.vx); } if (b.x > 1 - mx) { b.x = 1 - mx; b.vx = -Math.abs(b.vx); }
      var bd = app.band || { y0: .22, y1: .55 }, y0 = bd.y0 + (b.r + 4) / H, y1 = Math.max(y0, bd.y1 - (b.r + 4) / H); if (b.y < y0) { b.y = y0; b.vy = Math.abs(b.vy); } if (b.y > y1) { b.y = y1; b.vy = -Math.abs(b.vy); }
      var sp = Art.sprite({ text: b.text, col: Art.colorKeyOfWord(b.w), r: b.r, kind: 'word', shape: 'round', dpr: app.dpr });
      var w = Math.sin(T * 2 + b.ph) * .03, x = b.x * W, y = b.y * H;
      ctx.save(); ctx.globalAlpha = .9; ctx.translate(x, y); ctx.scale(1 + w, 1 - w); ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore();
    });
    blink -= dt; if (blink < -.12) blink = 2 + Math.random() * 3;
    if (app.kun === false || (app.scene === 'result' && H < 760)) return;
    var s = Math.min(1.25, W / 330, H / 760), y = H - app.stage.bottom - 66 * s;
    Art.chunkKun(ctx, W / 2 - 40 * s, y, { segs: 2, expr: app.scene === 'result' ? 'joy' : kunExpr, t: T, blink: blink < 0 ? .1 : 1, scale: s, wave: app.scene !== 'result' && Math.sin(T * .7) > .6, walk: false });
  }

  // ---------- 入力 ----------
  function pos(e) { var r = stageEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  var activePtr = null;
  // 読み上げ・音の解錠は「指を離したとき」も行う(iPhone はタッチの pointerdown をユーザー操作とみなさない)
  listen(root, 'pointerup', function () { app.audio.unlock(); }, true); listen(root, 'touchend', function () { app.audio.unlock(); }, true);
  listen(cv, 'pointerdown', function (e) { app.audio.unlock(); if (!app.game || activePtr != null) return; activePtr = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (x) { } var p = pos(e); app.game.down(p.x, p.y); e.preventDefault(); });
  listen(cv, 'pointermove', function (e) { if (!app.game || e.pointerId !== activePtr) return; var p = pos(e); app.game.move(p.x, p.y); e.preventDefault(); });
  listen(cv, 'pointerup', function (e) { if (e.pointerId !== activePtr) return; activePtr = null; if (!app.game) return; var p = pos(e); app.game.up(p.x, p.y); });
  listen(cv, 'pointercancel', function (e) { if (e.pointerId !== activePtr) return; activePtr = null; if (app.game) app.game.cancel(); });
  listen(root, 'contextmenu', function (e) { e.preventDefault(); });
  listen(root, 'gesturestart', function (e) { e.preventDefault(); });
  listen(root, 'dblclick', function (e) { e.preventDefault(); });
  // 画面から外れたら静かにする:タブ切替・フォーカスが外れた(埋め込み先で閉じた等)・表示領域から消えた・大きさ0
  var away = {};
  function setAway(why, on) {
    var was = Object.keys(away).length > 0; if (on) away[why] = 1; else delete away[why];
    var now = Object.keys(away).length > 0; if (was === now) return;
    if (now) { app.audio.suspend(); if (app.game && app.game.state !== 'over' && app.game.mode !== 'tutorial') showPause(); app.emit('away', {}); }
    else app.audio.resume();
  }
  listen(document, 'visibilitychange', function () { setAway('hidden', document.hidden); });
  listen(window, 'pagehide', function () { setAway('hidden', true); });
  listen(window, 'pageshow', function () { setAway('hidden', false); });
  if (options.pauseOnBlur !== false) { listen(window, 'blur', function () { setAway('blur', true); }); listen(window, 'focus', function () { setAway('blur', false); }); listen(root, 'pointerdown', function () { setAway('blur', false); }); }
  setAwayRef = setAway; var io = null;
  if (window.IntersectionObserver) { io = new IntersectionObserver(function (es) { es.forEach(function (e) { setAway('offscreen', !e.isIntersecting); }); }); io.observe(root); }
  listen(window, 'keydown', function (e) { if (e.key === 'Escape' && app.game && app.game.state !== 'over' && !pauseEl) showPause(); });

  // ---------- 画面遷移 ----------
  var pauseEl = null, tut = null, lastMode = 'ta';
  function toTitle() { endGame(); app.scene = 'title'; app.decor = true; app.kun = true; app.audio.music('title'); ui.title({ play: toPlay, tutorial: function () { startTutorial(toTitle); }, records: function () { app.decor = false; app.kun = false; ui.records({ back: toTitle }); }, shop: function () { app.decor = false; app.kun = false; ui.shop({ back: toTitle }); }, settings: function () { app.decor = false; app.kun = false; ui.settings({ back: toTitle }); }, credits: function () { app.decor = false; app.kun = false; ui.credits({ back: toTitle }); } }); app.emit('screen', { name: 'title' }); }
  function toPlay() { if (!state.tutorialDone) startTutorial(toModes); else toModes(); }
  function toModes() { endGame(); app.scene = 'title'; app.decor = false; app.kun = true; app.audio.music('title'); ui.modes({ back: toTitle, start: startGame, shop: function () { app.kun = false; ui.shop({ back: toModes }); } }); app.emit('screen', { name: 'modes' }); }
  function endGame() { if (tut) { tut.stop(); tut = null; } if (app.game) { app.game.destroy(); app.game = null; } ui.hudHide(); if (pauseEl) { pauseEl.remove(); pauseEl = null; } ui.unsay(); ui.unskip(); }
  function cfgFor(level) { var L = LEVELS[level] || LEVELS[0]; return settings.custom ? { auto: Object.assign({}, settings.auto), color: settings.color, maxLevel: L.maxLevel } : { auto: Object.assign({}, L.auto), color: L.color, maxLevel: L.maxLevel }; }
  function startGame(mode) {
    endGame(); lastMode = mode; app.scene = 'game'; ui.clear(); app.audio.music(null);
    var level = state.level, c = cfgFor(level), seed = null, goal = null, practice = false;
    if (mode === 'daily') { var day = U.today(); seed = U.hash('daily:' + day); goal = GOALS[seed % GOALS.length]; practice = !!(storage.get('daily') || {})[day]; }
    var g = Game.create(app, { mode: mode, level: level, auto: c.auto, colorMode: c.color, maxLevel: c.maxLevel, seed: seed, freeSlot: services.store.isPremium() });
    g.goal = goal; g.practice = practice; app.game = g;
    ui.hudShow({ pause: showPause, inv: function () { return services.store.inventory(); }, useItem: useItem });
    g.start(); ui.itemsPos(mode === 'shot' ? -200 : g.L.lane.y + g.L.lane.h / 2);
    if (goal) { ui.goal = goal.text + (practice ? '(練習)' : ''); ui.preview('', ''); }
    app.emit('screen', { name: 'game', mode: mode });
  }
  function useItem(id) { var g = app.game; if (!g || g.state !== 'play') return; if (!services.store.consume(id)) return; if (!g.useItem(id)) services.store.purchase && services.store.isDummy && refund(id); ui.itemsRender(services.store.inventory(), useItem); app.emit('item', { id: id }); }
  function refund(id) { var d = storage.get('store'); if (d && d.inv) { d.inv[id] = (d.inv[id] || 0) + 1; storage.set('store', d); } }
  function startTutorial(after) {
    endGame(); app.scene = 'game'; ui.clear(); app.audio.music('title');
    var L = LEVELS[0], g = Game.create(app, { mode: 'tutorial', level: 0, auto: L.auto, colorMode: 'pos', maxLevel: 1 });
    app.game = g; ui.hudShow({ pause: showPause, inv: function () { return {}; }, useItem: function () { } }); g.start(); ui.itemsPos(-200);
    tut = Tutorial.run(app, g, function () { state.tutorialDone = true; app.saveState(); tut = null; after(); });
    app.emit('screen', { name: 'tutorial' });
  }
  function showPause() {
    var g = app.game; if (!g || pauseEl) return; g.pause(); app.audio.music(null); app.emit('pause', {});
    pauseEl = ui.pause({
      resume: function () { pauseEl.remove(); pauseEl = null; g.resume(); if (g.state === 'play') app.audio.music('play'); app.emit('resume', {}); },
      retry: function () { if (g.mode === 'tutorial') { startTutorial(toModes); return; } startGame(g.mode); },
      finish: g.mode === 'free' ? function () { pauseEl.remove(); pauseEl = null; g.resume(); g.finish('おしまい!'); } : null,
      settings: function () { var s = ui.settings({ back: function () { s.classList.add('out'); setTimeout(function () { s.remove(); }, 200); } }); s.style.zIndex = 45; },
      title: toTitle
    });
  }
  app.onGameEnd = function (g) {
    if (app.game !== g) return;
    var st = g.stats, score = g.score, goalRes = null;
    if (g.goal) { var ok = g.goal.test(st); goalRes = { text: g.goal.text, done: ok, bonus: 1500 }; if (ok) score += 1500; }
    var key = g.mode + ':' + g.level, bests = storage.get('best') || {}, prev = bests[key] || 0, practice = g.practice, newBest = !practice && score > prev && score > 0;
    if (!practice) {
      if (newBest) { bests[key] = score; storage.set('best', bests); }
      services.ranking.submit({ mode: g.mode, level: g.level, score: score, sentences: st.sentences, longest: st.longest, date: U.today() });
      if (g.mode === 'daily') { var dl = storage.get('daily') || {}; dl[U.today()] = score; storage.set('daily', dl); }
    }
    var life = app.lifetime(); life.plays++; life.sentences += st.sentences; life.maxCombo = Math.max(life.maxCombo, st.maxCombo); if (st.longestN > life.longestN) { life.longestN = st.longestN; life.longest = st.longest; } storage.set('life', life);
    var mode = MODES.filter(function (m) { return m.id === g.mode; })[0] || MODES[0];
    endGame(); app.scene = 'result'; app.kun = true; app.audio.music('result'); if (newBest) setTimeout(function () { app.audio.sfx('best'); }, 700);
    var res = { mode: g.mode, level: g.level, score: score, stats: st, newBest: newBest, best: Math.max(prev, newBest ? score : 0), goal: goalRes, practice: practice, modeName: mode.name, levelName: LEVELS[g.level].name };
    ui.result(res, { retry: function () { startGame(lastMode); }, modes: toModes, title: toTitle });
    app.emit('result', { mode: res.mode, level: res.level, score: score, newBest: newBest, stats: { sentences: st.sentences, chunks: st.chunks, maxCombo: st.maxCombo, longest: st.longest } });
  };

  // ---------- 開始 ----------
  measure();
  raf = requestAnimationFrame(frame);
  var start = options.startScreen || 'splash';
  if (start === 'title') toTitle(); else if (start === 'modes') toModes(); else if (start === 'game') startGame(options.initialMode || 'ta');
  else { app.decor = true; ui.splash(function () { toTitle(); }); }
  app.emit('ready', { version: VERSION });

  var api = {
    unmount: function () {
      if (dead) return; dead = true; cancelAnimationFrame(raf);
      endGame(); listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); listeners = [];
      if (ro) ro.disconnect(); if (io) io.disconnect(); app.audio.destroy(); ui.destroy(); root.remove(); UI.removeCSS();
    },
    pause: function () { if (app.game && app.game.state !== 'over') showPause(); },
    resume: function () { if (pauseEl) pauseEl.querySelector('.pc-btn').click(); },
    setAudio: function (o) { ['bgm', 'sfx', 'voice', 'rate'].forEach(function (k) { if (o[k] != null) settings[k] = o[k]; }); app.saveSettings(); },
    show: function (name, mode) { if (name === 'title') toTitle(); else if (name === 'modes') toModes(); else if (name === 'game') startGame(mode || 'ta'); else if (name === 'tutorial') startTutorial(toModes); },
    getState: function () { var g = app.game; return { scene: app.scene, mode: g && g.mode, score: g && g.score, playing: !!(g && g.state === 'play') }; },
    _app: app
  };
  return api;
}
export var ADAPTERS = { dict: function (data) { return Dict.makeDefault(data); } };
