// 釣り(砂吹さんの池)。町のアプリ(mount(el, ctx) → {unmount})。
//   のんびり釣り / 釣り勝負(2画面:砂吹さん・友だちの挑戦状・前回の自分) / 図鑑 / 道具屋
import { FISH, ITEMS, ALL, BYID, LETTERS, RARITY, RARITY_COL, GEAR, gearById, DEX_REWARDS, DAILY_COIN_CAP, RULES, DURATIONS, AREAS, areaAt } from './data.js';
import { createEngine, createBot, replayAt, timeOf } from './engine.js';
import { createView } from './view.js';
import { artCanvas } from './art.js';
import { createSfx } from './sfx.js';

const ink = '#5a4a6b';
const CSS = `
.fz{position:absolute;inset:0;overflow:hidden;font-family:inherit;color:${ink};user-select:none;-webkit-user-select:none;touch-action:none;background:#2b3a5a}
.fz canvas{position:absolute;left:0;width:100%;display:block}
.fz .ui{position:absolute;inset:0;pointer-events:none}
.fz .ui > *{pointer-events:auto}
.fz .bar{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:8px;padding:8px 10px;pointer-events:none}
.fz .bar > *{pointer-events:auto}
.fz .chip{border:0;border-radius:999px;padding:7px 12px;font:inherit;font-weight:800;font-size:13px;background:rgba(255,255,255,.88);color:${ink};box-shadow:0 2px 8px #0002;white-space:nowrap}
.fz .hint{position:absolute;left:50%;transform:translateX(-50%);top:52px;max-width:92%;background:rgba(40,30,70,.55);color:#fff;font-weight:700;font-size:13px;padding:6px 12px;border-radius:12px;text-align:center;pointer-events:none;transition:opacity .3s;line-height:1.45}
.fz .big{position:absolute;right:18px;bottom:calc(22px + env(safe-area-inset-bottom,0px));width:108px;height:108px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:17px;color:#fff;background:radial-gradient(circle at 35% 30%,#ffb3c6,#f07a98);box-shadow:0 6px 0 #c9577a,0 10px 20px #0004;touch-action:none}
.fz .big.on{transform:translateY(4px);box-shadow:0 2px 0 #c9577a,0 6px 12px #0004}
.fz .big small{display:block;font-size:11px;font-weight:700;opacity:.9}
.fz .hk{position:absolute;left:18px;bottom:calc(30px + env(safe-area-inset-bottom,0px));width:86px;height:86px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:16px;color:${ink};background:radial-gradient(circle at 35% 30%,#fff,#ffe9a8);box-shadow:0 5px 0 #d8b45a,0 8px 16px #0004;touch-action:none}
.fz .hk.alert{animation:fzPulse .35s infinite alternate;background:radial-gradient(circle at 35% 30%,#fff,#ffcf4a)}
.fz .hk:active{transform:translateY(3px)}
@keyframes fzPulse{to{transform:scale(1.12)}}
.fz .thr{position:absolute;right:132px;bottom:calc(30px + env(safe-area-inset-bottom,0px));width:12px;height:90px;border-radius:8px;background:rgba(255,255,255,.35);overflow:hidden;pointer-events:none}
.fz .thr i{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#ffe36b,#7fd38c);border-radius:8px}
.fz .gauge{position:absolute;left:50%;transform:translateX(-50%);top:96px;width:min(78%,360px);pointer-events:none}
.fz .gauge .t{height:16px;border-radius:10px;background:linear-gradient(90deg,#7fd38c 0%,#c8e86b 45%,#ffd84a 66%,#ff9a5a 80%,#ff4f6a 100%);box-shadow:0 2px 8px #0003;position:relative;border:2px solid #fff}
.fz .gauge .t b{position:absolute;top:-6px;width:6px;height:26px;margin-left:-3px;border-radius:3px;background:#2b2140;box-shadow:0 0 0 2px #fff}
.fz .gauge .row{display:flex;justify-content:space-between;color:#fff;font-weight:800;font-size:12px;margin-top:4px;text-shadow:0 1px 3px #0008}
.fz .gauge .brk{height:4px;margin-top:3px;border-radius:2px;background:#ff4f6a;transform-origin:left;transform:scaleX(0)}
.fz .toast{position:absolute;left:50%;top:70%;transform:translate(-50%,-50%);background:rgba(255,255,255,.95);border-radius:18px;padding:12px 18px;font-weight:900;font-size:20px;box-shadow:0 8px 24px #0004;pointer-events:none;text-align:center;animation:fzPop .25s ease-out}
.fz .toast.hit{background:#ffe36b;font-size:30px;color:#c0392b}
@keyframes fzPop{from{transform:translate(-50%,-50%) scale(.6);opacity:0}}
.fz .sheet{position:absolute;inset:0;background:rgba(40,30,70,.45);display:flex;align-items:flex-end;justify-content:center;z-index:5}
.fz .panel{background:#fffaf3;border-radius:22px 22px 0 0;width:100%;max-width:560px;max-height:88%;display:flex;flex-direction:column;box-shadow:0 -6px 24px #0003}
.fz .panel.center{border-radius:22px;margin:auto 14px;max-height:92%}
.fz .panel h2{margin:0;font-size:19px}
.fz .ph{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 16px 8px}
.fz .sc{overflow:auto;padding:4px 14px 14px;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.fz .btn{border:0;border-radius:999px;padding:11px 20px;font:inherit;font-weight:800;color:#fff;background:linear-gradient(160deg,#ffb3c6,#f58aa8);box-shadow:0 3px 0 #d0688a;cursor:pointer}
.fz .btn.sub{background:#efe8f7;color:${ink};box-shadow:0 3px 0 #d6cbe6}
.fz .btn.gold{background:linear-gradient(160deg,#ffe58a,#f5b83d);color:#5a3a10;box-shadow:0 3px 0 #c98f22}
.fz .btn:disabled{opacity:.45}
.fz .menu{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:20px;background:linear-gradient(180deg,rgba(255,255,255,0) 0%,rgba(255,250,243,.15) 30%,rgba(255,250,243,.6) 100%)}
.fz .title{font-size:30px;font-weight:900;color:#fff;text-shadow:0 3px 0 #c9577a,0 6px 16px #0005;margin:0;letter-spacing:2px;text-align:center}
.fz .mb{width:min(300px,86%);display:flex;align-items:center;gap:10px;justify-content:flex-start;font-size:17px;padding:14px 18px;border-radius:18px}
.fz .mb span{flex:1;text-align:left}.fz .mb small{font-size:11px;opacity:.85;font-weight:700}
.fz .say{background:#fff;border-radius:16px;padding:8px 14px;font-weight:700;font-size:13px;box-shadow:0 3px 10px #0002;max-width:86%;text-align:center}
.fz .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.fz .card{background:#fff;border-radius:14px;padding:6px 4px 8px;text-align:center;box-shadow:0 2px 8px #0001;font-size:12px;font-weight:800;position:relative}
.fz .card canvas{position:static;width:100%;height:auto}
.fz .card small{display:block;font-weight:700;color:#8d7f9e;font-size:11px}
.fz .ph,.fz .tabs{flex-shrink:0}
.fz .tabs{display:flex;gap:6px;padding:0 14px 8px;overflow:auto}
.fz .tab{border:0;border-radius:999px;padding:7px 12px;font:inherit;font-weight:800;font-size:13px;background:#efe8f7;color:${ink};white-space:nowrap}
.fz .tab.on{background:${ink};color:#fff}
.fz .item{display:flex;gap:10px;align-items:center;background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px #0001}
.fz .item .ic{font-size:28px;width:40px;text-align:center}
.fz .stat{display:flex;align-items:center;gap:6px;font-size:11px;color:#8d7f9e;font-weight:700}
.fz .stat i{display:inline-block;height:6px;border-radius:3px;background:#f58aa8}
.fz .vsbar{position:absolute;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:linear-gradient(90deg,#6b5aa8,#f07a98);color:#fff;font-weight:900;font-size:14px;box-shadow:0 2px 8px #0004;z-index:2}
.fz .vsbar .tm{background:#fff;color:${ink};border-radius:999px;padding:2px 12px;font-size:16px;min-width:64px;text-align:center}
.fz .bub{position:absolute;left:10px;top:34px;background:#fff;border-radius:12px;padding:4px 10px;font-weight:800;font-size:12px;box-shadow:0 2px 8px #0003;pointer-events:none;animation:fzPop .2s}
.fz .count{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:84px;font-weight:900;color:#fff;text-shadow:0 4px 0 #c9577a,0 8px 20px #0006;pointer-events:none;z-index:4}
.fz textarea{width:100%;box-sizing:border-box;border-radius:12px;border:2px solid #d6cbe6;padding:8px;font:12px/1.4 monospace;color:${ink};background:#fff;touch-action:auto;user-select:text;-webkit-user-select:text}
.fz .seg{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 12px}
.fz .seg button{flex:1;min-width:84px}
.fz .lbl{font-weight:900;font-size:14px;margin-top:6px}
`;

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const seasonOf = d => { const m = d.getMonth() + 1; return m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'; };
const fmtT = s => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SEASON_JP = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }, TIME_JP = { morning: '朝', day: '昼', evening: '夕方', night: '夜' };
const SUNA_SAY = { catch: ['Got one!', 'Not bad.', 'Nice and easy.', 'There we go.'], lost: ['Oops.', 'It got away...', 'Next time.'], big: ['Whoa, a big one!', 'Look at that!'] };
const LOST_JP = { snap: '糸が切れた…', slack: 'バレた…(糸がゆるんで外れた)', jump: 'はねて外れた…' };

// 挑戦状のコード(記録をちぢめて文字にする)
const b64u = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function pack(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  try { if (window.CompressionStream) { const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(raw); w.close(); return 'TSURI1.' + b64u(new Uint8Array(await new Response(cs.readable).arrayBuffer())); } } catch (e) { }
  return 'TSURI0.' + b64u(raw);
}
async function unpack(code) {
  code = String(code || '').trim().replace(/\s+/g, ''); const m = code.match(/TSURI([01])\.([A-Za-z0-9_-]+)/); if (!m) throw new Error('code');
  let u = unb64u(m[2]);
  if (m[1] === '1') { const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(u); w.close(); u = new Uint8Array(await new Response(ds.readable).arrayBuffer()); }
  const o = JSON.parse(new TextDecoder().decode(u)); if (!o || o.v !== 1 || typeof o.s !== 'string') throw new Error('bad'); return o;
}

export const fishingApp = {
  mount(el, ctx) {
    if (!document.getElementById('fz-css')) { const st = document.createElement('style'); st.id = 'fz-css'; st.textContent = CSS; document.head.appendChild(st); }
    const st = ctx.storage, P = ctx.params || {};
    const now = new Date();
    const baseCond = { hour: P.hour ?? now.getHours() + now.getMinutes() / 60, season: P.season || seasonOf(now), rain: !!P.rain };
    const sfx = createSfx(ctx.audio && ctx.audio.sfx != null ? ctx.audio.sfx : 0.7);
    const root = document.createElement('div'); root.className = 'fz'; el.appendChild(root);
    ctx.setTitle('砂吹さんの池');

    // ---- 保存 ----
    const own = Object.assign({ rod: ['bamboo'], reel: ['basic'], line: ['nylon'], bait: ['worm'] }, st.get('own') || {});
    const eq = Object.assign({ rod: 'bamboo', reel: 'basic', line: 'nylon', bait: 'worm' }, st.get('eq') || {});
    const dex = st.get('dex') || {}, stats = Object.assign({ casts: 0, catches: 0, win: 0, lose: 0, draw: 0, today: 0, todayKey: '' }, st.get('stats') || {});
    const letters = st.get('letters') || [], claimed = st.get('claimed') || [];
    const save = () => { st.set('own', own); st.set('eq', eq); st.set('dex', dex); st.set('stats', stats); st.set('letters', letters); st.set('claimed', claimed); };
    if (stats.todayKey !== todayKey()) { stats.todayKey = todayKey(); stats.today = 0; stats.coinsToday = 0; }
    function giveCoins(n, why) {   // 1日の上限つき
      const left = Math.max(0, DAILY_COIN_CAP - (stats.coinsToday || 0)), k = Math.min(left, Math.round(n));
      if (k > 0) { stats.coinsToday = (stats.coinsToday || 0) + k; ctx.wallet.add(k, why || 'fish'); sfx.play('coin'); }
      save(); return k;
    }

    let screen = null, cleanup = [];
    const clear = () => { cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = []; root.innerHTML = ''; sfx.stopLoops(); };
    let raf = 0, last = 0, frame = null;
    const loop = ts => { raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts; frame && frame(dt); };
    raf = requestAnimationFrame(loop);
    const unlock = () => sfx.unlock(); root.addEventListener('pointerdown', unlock, { once: true });

    // ================= メニュー =================
    function menu() {
      clear(); screen = 'menu'; ctx.setTitle('砂吹さんの池');
      const cv = document.createElement('canvas'); cv.style.cssText = 'top:0;height:100%'; root.appendChild(cv);
      const view = createView(cv, baseCond); view.resize();
      const ro = new ResizeObserver(() => view.resize()); ro.observe(cv); cleanup.push(() => ro.disconnect());
      const fake = createEngine({ seed: 99, cond: baseCond, gear: eq });
      frame = dt => { fake.update(dt); view.draw(vsOf(fake, true), dt); };
      const found = Object.keys(dex).length, tm = timeOf(baseCond.hour);
      const ui = document.createElement('div'); ui.className = 'menu';
      ui.innerHTML = `<p class="title">🎣 ほしみや池の釣り</p>
        <div class="say">砂吹さん「${esc(pickSay())}」</div>
        <div class="chip" style="pointer-events:none">${TIME_JP[tm]}・${SEASON_JP[baseCond.season]}${baseCond.rain ? '・雨' : ''} ／ きょうのコイン あと ${Math.max(0, DAILY_COIN_CAP - (stats.coinsToday || 0))}</div>
        <button class="btn mb" data-m="free">🎣<span>のんびり釣る<br><small>時間を気にせず、好きなだけ</small></span></button>
        <button class="btn mb gold" data-m="vs">⚔️<span>釣り勝負<br><small>砂吹さん・友だちと2画面で対戦</small></span></button>
        <button class="btn mb sub" data-m="dex">📖<span>図鑑<br><small>${found} / ${ALL.length} 見つけた</small></span></button>
        <button class="btn mb sub" data-m="shop">🧰<span>道具屋<br><small>竿・リール・糸・エサ・ルアー</small></span></button>
        <button class="btn sub" data-m="help" style="margin-top:4px">？ あそびかた</button>`;
      root.appendChild(ui);
      ui.onclick = e => { const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return; sfx.play('tap'); ({ free: () => play({}), vs: vsSetup, dex: dexScreen, shop: () => shop(), help: () => help() })[m](); };
      if (P.vs) { const o = P.vs; P.vs = null; setTimeout(() => vsSetup(o === 'hard' ? 'hard' : 'easy'), 0); }
      else if (P.tab === 'shop') { P.tab = null; setTimeout(() => shop(), 0); }
      else if (!st.get('tut')) setTimeout(() => help(), 300);
    }
    function pickSay() {
      const tm = timeOf(baseCond.hour);
      const L = { morning: 'Good morning. The fish are hungry in the morning.', day: 'Take it easy. The fish will come.', evening: 'Evening is a good time. Try a lure.', night: 'At night... something big lives in the deep.' };
      return baseCond.rain ? 'Rainy days are lucky days, you know.' : L[tm];
    }

    // ================= あそびかた =================
    function help(after) {
      const s = sheet(`<div class="ph"><h2>あそびかた</h2></div><div class="sc" style="font-size:14px;line-height:1.7">
        <p><b>① ねらって投げる</b><br>水面を左右にドラッグでねらう。🎣ボタンを<b>おしたまま</b>にすると力がたまる(行ったり来たり)。<b>はなすと投げる</b>。魚のかげの少し先に落とすのがコツ。</p>
        <p><b>② さそう</b><br>エサ(ウキ)はじっと待つ。ルアーは🎣をおしたままで<b>巻く</b>(おしたまま上にずらすと速く)。左のボタンで<b>しゃくる</b>と強い魚がよってくる。</p>
        <p><b>③ アタリとあわせ</b><br>ウキがツンツン→<b>グッとしずんだら</b>左の<b>「あわせ」</b>! 早すぎると逃げられる。ルアーは「！」が出たらすぐ。</p>
        <p><b>④ ファイト</b><br>🎣で巻く。上のメーターが<b>赤</b>になったら手をはなしてゆるめる(切れる)。ゆるめすぎると外れる。魚が走る方向と<b>反対側に</b>画面をドラッグ(竿をたおす)と早く弱る。はねたらゆるめて!</p>
        <p><b>⑤ 集める・きそう</b><br>釣れた魚は図鑑へ。時間(朝・昼・夕方・夜)・季節・雨・場所・エサで釣れる魚がかわる。道具屋で道具をそろえて、大物と伝説をねらおう。</p>
      </div><div style="padding:10px 16px 16px;text-align:center"><button class="btn" data-x>わかった</button></div>`, true);
      s.querySelector('[data-x]').onclick = () => { st.set('tut', 1); s.remove(); after && after(); };
    }
    function sheet(html, center) {
      const s = document.createElement('div'); s.className = 'sheet'; s.innerHTML = `<div class="panel ${center ? 'center' : ''}">${html}</div>`;
      s.addEventListener('pointerdown', e => e.stopPropagation());
      root.appendChild(s); return s;
    }

    // ================= 釣り(のんびり・勝負の自分側) =================
    // mode: {vs:{...}} があれば勝負
    function play(opt) {
      clear(); screen = 'play'; const vs = opt.vs;
      ctx.setTitle(vs ? '釣り勝負' : 'のんびり釣り');
      const cond = vs ? vs.cond : baseCond;
      const topH = vs ? 0.3 : 0;
      // 相手の画面
      let oppView = null, oppCv = null;
      if (vs) { oppCv = document.createElement('canvas'); oppCv.style.cssText = `top:0;height:${topH * 100}%`; root.appendChild(oppCv); oppView = createView(oppCv, cond, { mini: true }); }
      const cv = document.createElement('canvas'); cv.style.cssText = `top:${topH * 100}%;height:${(1 - topH) * 100}%`; root.appendChild(cv);
      const view = createView(cv, cond);
      const ui = document.createElement('div'); ui.className = 'ui'; ui.style.top = topH * 100 + '%'; root.appendChild(ui);
      const resize = () => { view.resize(); oppView && oppView.resize(); };
      const ro = new ResizeObserver(resize); ro.observe(root); cleanup.push(() => ro.disconnect()); resize();
      sfx.ambience(true);

      let E = null, startT = 0, ended = false, oppScore = { count: 0, big: 0, point: 0 }, oppSeen = 0, oppE = null, bot = null;
      const onEv = (type, d) => handleEv(type, d);
      const mk = () => createEngine({ seed: vs ? vs.seed : (Math.random() * 1e9) | 0, cond, gear: eq, onEvent: onEv, record: !!vs });
      E = mk(); if (P.debug) { window.__fzE = E; window.__fzOpp = () => oppE; }
      if (vs && vs.bot) { oppE = createEngine({ seed: vs.seed, cond, gear: vs.bot === 'hard' ? { rod: 'carbon', reel: 'smooth', line: 'fluoro', bait: pickBotBait(cond) } : { rod: 'bamboo', reel: 'basic', line: 'nylon', bait: 'worm' }, onEvent: (t, d) => { oppE.onBot && oppE.onBot(t, d); oppEvent(t, d); } }); bot = createBot(oppE, vs.bot, vs.seed + 5); }

      // ---- 画面の部品 ----
      ui.innerHTML = `<div class="bar"><button class="chip" data-b="back">≡</button><span style="flex:1"></span><span class="chip" data-b="info" style="pointer-events:none"></span><button class="chip" data-b="tackle"></button><button class="chip" data-b="help">？</button></div>
        <div class="hint"></div>
        <div class="gauge" hidden><div class="t"><b></b></div><div class="brk"></div><div class="row"><span class="gl"></span><span class="gs"></span></div></div>
        <div class="thr" hidden><i></i></div>
        <button class="hk">あわせ</button><button class="big">投げる<small>長おし</small></button>`;
      const $ = s => ui.querySelector(s);
      const hintEl = $('.hint'), gauge = $('.gauge'), thrEl = $('.thr'), bigB = $('.big'), hkB = $('.hk');
      let vsBar = null, bubEl = null;
      if (vs) {
        vsBar = document.createElement('div'); vsBar.className = 'vsbar'; vsBar.style.top = `calc(${topH * 100}% - 30px)`; $('[data-b="info"]').style.display = 'none';
        vsBar.innerHTML = `<span class="on"></span><span class="tm"></span><span class="me"></span>`; root.appendChild(vsBar);
        $('[data-b="back"]').textContent = '×';
      }
      const tackleChip = () => { const b = gearById('bait', eq.bait); $('[data-b="tackle"]').textContent = `${b.icon} ${b.name}`; };
      tackleChip();
      ui.querySelector('.bar').onclick = e => {
        const b = e.target.closest('[data-b]')?.dataset.b; if (!b) return; sfx.play('tap');
        if (b === 'back') { if (vs && !ended) { confirmQuit(); return; } menu(); }
        if (b === 'tackle') { if (E.S.ph !== 'ready') { toast('投げる前に変えられるよ', 1200); return; } tackleSheet(() => { for (const k of ['rod', 'reel', 'line', 'bait']) E.setGear(k, eq[k]); tackleChip(); }); }
        if (b === 'help') help();
      };
      function confirmQuit() { const s = sheet(`<div class="ph"><h2>勝負をやめる?</h2></div><div class="sc">やめると負けになります。</div><div style="display:flex;gap:10px;padding:12px 16px 18px;justify-content:center"><button class="btn sub" data-n>つづける</button><button class="btn" data-y>やめる</button></div>`, true); s.querySelector('[data-n]').onclick = () => s.remove(); s.querySelector('[data-y]').onclick = () => { s.remove(); stats.lose++; save(); menu(); }; }

      // ---- 入力 ----
      let reelPid = null, reelY0 = 0, thr = 0, waterPid = null, wx0 = 0, sideT = 0, keyReel = false;
      const W = () => cv.getBoundingClientRect();
      bigB.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); sfx.unlock(); if (ended || E.S.locked) return;
        bigB.setPointerCapture(e.pointerId); reelPid = e.pointerId; reelY0 = e.clientY; bigB.classList.add('on');
        if (E.S.ph === 'ready') { E.castStart(); }
        else if (E.S.ph === 'landed' || E.S.ph === 'lost') { if (!vs) closeCard(); }
        else thr = 0.55;
      });
      bigB.addEventListener('pointermove', e => { if (e.pointerId !== reelPid) return; if (E.S.ph === 'water' || E.S.ph === 'fight') thr = Math.max(0.15, Math.min(1, 0.55 + (reelY0 - e.clientY) / 110)); });
      const reelUp = e => { if (e.pointerId !== reelPid) return; reelPid = null; bigB.classList.remove('on'); thr = 0; if (E.S.ph === 'charge') { E.castRelease(); stats.casts++; } };
      bigB.addEventListener('pointerup', reelUp); bigB.addEventListener('pointercancel', reelUp);
      hkB.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sfx.unlock(); if (ended) return; if (E.S.ph === 'water') E.hookPress(); else if ((E.S.ph === 'landed' || E.S.ph === 'lost') && !vs) closeCard(); });
      cv.addEventListener('pointerdown', e => { if (waterPid != null) return; waterPid = e.pointerId; wx0 = e.clientX; cv.setPointerCapture(e.pointerId); aimFrom(e); });
      cv.addEventListener('pointermove', e => { if (e.pointerId !== waterPid) return; aimFrom(e); });
      const wUp = e => { if (e.pointerId === waterPid) { waterPid = null; sideT = 0; } };
      cv.addEventListener('pointerup', wUp); cv.addEventListener('pointercancel', wUp);
      function aimFrom(e) { const r = W(); if (E.S.ph === 'ready' || E.S.ph === 'charge') E.setAim((e.clientX - r.left - r.width / 2) / (r.width * 0.4)); else if (E.S.ph === 'fight') sideT = Math.max(-1, Math.min(1, (e.clientX - wx0) / (r.width * 0.22))); }
      const kd = e => {
        if (e.repeat) return; const k = e.key;
        if (k === ' ' || k === 'Enter') { e.preventDefault(); if (E.S.ph === 'ready') E.castStart(); else if (E.S.ph === 'landed' || E.S.ph === 'lost') { !vs && closeCard(); } else { keyReel = true; thr = 0.6; } }
        if (k === 'f' || k === 'F' || k === 'ArrowUp') { if (E.S.ph === 'water') E.hookPress(); }
        if (k === 'ArrowLeft' || k === 'a') { if (E.S.ph === 'fight') sideT = -1; else E.setAim(E.S.aim - 0.15); }
        if (k === 'ArrowRight' || k === 'd') { if (E.S.ph === 'fight') sideT = 1; else E.setAim(E.S.aim + 0.15); }
        if (k === 'Shift') thr = 1;
      };
      const ku = e => { const k = e.key; if (k === ' ' || k === 'Enter') { keyReel = false; thr = 0; if (E.S.ph === 'charge') { E.castRelease(); stats.casts++; } } if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') sideT = 0; if (k === 'Shift' && keyReel) thr = 0.6; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); cleanup.push(() => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); });

      // ---- 出来事 ----
      let toastEl = null, toastT = 0, card = null;
      function toast(text, ms = 1100, cls = '') { toastEl?.remove(); toastEl = document.createElement('div'); toastEl.className = 'toast ' + cls; toastEl.innerHTML = text; ui.appendChild(toastEl); toastT = ms / 1000; }
      function handleEv(type, d) {
        const L = E.S.lure;
        if (type === 'cast') sfx.play('whoosh');
        if (type === 'land') { sfx.play('plop'); view.splash(d.x, d.d, 8, 0.6); }
        if (type === 'nibble') sfx.play('nibble');
        if (type === 'bite') { sfx.play('bite'); if (E.G.bait.type !== 'bait') view.splash(L.x, L.d, 6, 0.7); }
        if (type === 'hooked') { sfx.play('hook'); toast(d.item ? 'なにか引っかかった!' : 'ヒット!', 900, 'hit'); view.splash(L.x, L.d, 12, 1); }
        if (type === 'early') { sfx.play('early'); toast('はやすぎた!', 900); }
        if (type === 'miss') { toast('のがした…', 900); }
        if (type === 'stolen') { toast('エサをとられた…<br><small style="font-size:13px">巻いて回収しよう</small>', 1400); }
        if (type === 'twitch') { view.splash(L.x, L.d, 3, 0.4); }
        if (type === 'jump') { sfx.play('jump'); view.splash(L.x, L.d, 22, 1.6); toast('はねた! ゆるめて!', 800); }
        if (type === 'lost') { sfx.play(d.reason === 'snap' ? 'snap' : 'lost'); if (vs) toast(LOST_JP[d.reason], 1300); else showLost(d); }
        if (type === 'catch') onCatch(d);
      }
      function oppEvent(type, d) {
        if (type === 'catch') { const sp = BYID[d.id]; oppPop(sp, d); }
        if (type === 'lost' && Math.random() < 0.6) bubble(SUNA_SAY.lost[Math.floor(Math.random() * 3)]);
        if (type === 'land') oppView.splash(d.x, d.d, 5, 0.5);
        if (type === 'hooked') oppView.splash(oppE.S.lure.x, oppE.S.lure.d, 8, 0.8);
      }
      function oppPop(sp, d) {
        if (!sp) return;
        bubble(`${sp.name}${sp.kind === 'fish' ? ' ' + d.size + 'cm' : ''}!` + (vs.bot ? ' ' + (sp.r >= 3 ? SUNA_SAY.big[0] : SUNA_SAY.catch[Math.floor(Math.random() * 4)]) : ''));
      }
      function bubble(text) { bubEl?.remove(); bubEl = document.createElement('div'); bubEl.className = 'bub'; bubEl.textContent = (vs.bot ? '砂吹さん: ' : vs.name + ': ') + text; root.appendChild(bubEl); const b = bubEl; setTimeout(() => { if (bubEl === b) { b.remove(); bubEl = null; } }, 2200); }

      function record(d) {
        const sp = BYID[d.id], r = dex[d.id] || { n: 0, best: 0, first: todayKey() }, isNew = !dex[d.id], best = sp.kind === 'fish' && d.size > r.best;
        r.n++; if (sp.kind === 'fish') r.best = Math.max(r.best, d.size); dex[d.id] = r;
        stats.catches++; if (sp.kind === 'fish') stats.today++;
        let extra = '', coins = sp.kind === 'fish' ? Math.max(1, Math.round(d.pts / 3)) : 0;
        if (sp.coins === 'chest') coins = 120 + Math.floor(Math.random() * 180); else if (sp.coins) coins = sp.coins;
        if (sp.letter) { const left = LETTERS.map((_, i) => i).filter(i => !letters.includes(i)); const i = left.length ? left[Math.floor(Math.random() * left.length)] : Math.floor(Math.random() * LETTERS.length); if (!letters.includes(i)) letters.push(i); extra = `<div style="background:#fff8e6;border-radius:12px;padding:8px 10px;margin-top:8px;font-size:14px"><b style="font-family:Georgia,serif">“${esc(LETTERS[i][0])}”</b><br><small>${esc(LETTERS[i][1])}</small></div>`; }
        if (sp.gift) { const L = ['spoon', 'minnow', 'frog', 'glow'].find(id => !own.bait.includes(id)); if (L) { own.bait.push(L); extra = `<div style="margin-top:6px">🎁 <b>${gearById('bait', L).name}</b> を手に入れた!</div>`; } else coins = 100; }
        const got = coins ? giveCoins(coins, 'fish') : 0;
        save(); checkDex();
        return { sp, isNew, best, coins: got, wanted: coins, extra, r };
      }
      function onCatch(d) {
        const info = record(d), sp = info.sp;
        sfx.play(sp.r >= 5 ? 'legend' : 'catch', sp.r >= 3);
        if (vs) { toast(`${sp.emoji || '🐟'} ${sp.name}${sp.kind === 'fish' ? ` <small>${d.size}cm</small>` : ''}${info.isNew ? ' <small style="color:#e0556b">NEW!</small>' : ''}`, 1300); return; }
        showCard(d, info);
      }
      function showCard(d, info) {
        const sp = info.sp, a = artCanvas(sp, 260, 150);
        card?.remove(); card = sheet(`<div class="ph" style="justify-content:center;flex-direction:column;gap:2px;padding-bottom:0">
          <div style="font-size:12px;font-weight:900;color:${RARITY_COL[sp.r]}">${'★'.repeat(sp.r)}${'☆'.repeat(5 - sp.r)} ${RARITY[sp.r] || 'はずれ'}</div>
          <h2 style="font-size:24px">${esc(sp.name)}${info.isNew ? ' <span style="color:#e0556b;font-size:14px">NEW!</span>' : ''}</h2>
          <div style="font-family:Georgia,serif;font-style:italic;color:#8d7f9e">${esc(sp.en)}</div></div>
          <div class="sc" style="text-align:center;padding-top:0"><div class="art" style="margin:4px auto;width:260px;max-width:100%"></div>
          ${sp.kind === 'fish' ? `<div style="font-size:28px;font-weight:900">${d.size}<small style="font-size:14px">cm</small>${info.best && !info.isNew ? ' <span style="font-size:13px;color:#e0556b">記録更新!</span>' : ''}</div><div style="font-size:12px;color:#8d7f9e">自己ベスト ${info.r.best}cm ・ ${info.r.n}匹目</div>` : ''}
          ${info.extra}
          <div class="say" style="margin:10px auto 0">砂吹さん「${esc(sp.say || 'Nice!')}」</div>
          ${info.wanted ? `<div style="margin-top:8px;font-weight:900">🪙 +${info.coins}${info.coins < info.wanted ? ' <small style="color:#8d7f9e">(きょうの上限)</small>' : ''}</div>` : ''}
          </div><div style="padding:8px 16px 18px;text-align:center"><button class="btn" data-x>つづける</button></div>`, true);
        card.querySelector('.art').appendChild(a); a.style.cssText = 'width:100%;height:auto;position:static';
        card.querySelector('[data-x]').onclick = closeCard;
      }
      function showLost(d) { toast(LOST_JP[d.reason] + `<br><small style="font-size:13px">${BYID[d.id] && BYID[d.id].r >= 3 ? 'おしい! 大物だった…' : ''}</small>`, 1500); setTimeout(() => { if (E.S.ph === 'lost') E.ack(); }, 1400); }
      function closeCard() { card?.remove(); card = null; E.ack(); }

      // ---- 勝負 ----
      let countT = vs ? 3.2 : 0, countEl = null;
      if (vs) { E.lock(true); countEl = document.createElement('div'); countEl.className = 'count'; root.appendChild(countEl); }
      const scoreOf = (sc, rule) => rule === 'count' ? sc.count : rule === 'big' ? sc.big : sc.point;
      function finish() {
        ended = true; E.lock(true); sfx.play('whistle'); thr = 0; sfx.reel(0); sfx.creak(0);
        if (vs.ghost) oppScore = ghostScore(vs.ghost, vs.dur);
        const me = scoreOf(E.S.score, vs.rule), op = scoreOf(vs.bot ? oppE.S.score : oppScore, vs.rule);
        const res = me > op ? 'win' : me < op ? 'lose' : 'draw';
        stats[res]++; save();
        const myRec = { v: 1, n: ctx.player?.name || 'ともだち', r: vs.rule, du: vs.dur, sd: vs.seed, h: Math.round(cond.hour * 10) / 10, se: cond.season, rn: cond.rain ? 1 : 0, s: E.log.s, e: E.S.catches.map(c => [Math.round(c.t * 10), c.id, c.size, c.pts]), sc: me };
        st.set('ghost', myRec);
        setTimeout(() => vsResult({ vs, me, op, res, myRec, catches: E.S.catches.slice() }), 1400);
        toast('しゅうりょう!', 1300, 'hit');
      }

      // ---- 毎フレーム ----
      let hintKey = '', gaugeOn = false;
      frame = dt => {
        if (vs && countT > 0) {
          const k = Math.ceil(countT - 0.2); countT -= dt;
          const txt = countT > 0.2 ? String(k) : 'スタート!';
          if (countEl.textContent !== txt) { countEl.textContent = txt; sfx.play(countT > 0.2 ? 'count' : 'go'); }
          if (countT <= 0) { countEl.remove(); E.lock(false); startT = 0; }
        } else if (vs && !ended) {
          startT += dt; if (startT >= vs.dur) finish();
        }
        // 入力をエンジンへ
        E.input.reel = (reelPid != null || keyReel) && (E.S.ph === 'water' || E.S.ph === 'fight') ? thr || 0.55 : 0;
        E.input.side += (sideT - E.input.side) * Math.min(1, dt * 6);
        if (!(vs && countT > 0)) E.update(dt);
        if (vs && E.S.ph === 'landed' && E.S.resultT > 0.9) E.ack();
        if (vs && E.S.ph === 'lost' && E.S.resultT > 1.1) E.ack();
        view.draw(vsOf(E, true), dt);
        // 相手
        if (vs) {
          const t = Math.min(startT, vs.dur);
          if (bot) { if (!(countT > 0) && !ended) { bot.update(dt); oppE.update(dt); } oppView.draw(vsOf(oppE, false), dt); }
          else if (vs.ghost) {
            const s = replayAt(vs.ghost, t); oppView.draw(vsOfSnap(s), dt);
            while (oppSeen < vs.ghost.e.length && vs.ghost.e[oppSeen][0] / 10 <= t) { const c = vs.ghost.e[oppSeen++]; oppScore.point += c[3]; const sp = BYID[c[1]]; if (sp && sp.kind === 'fish') { oppScore.count++; oppScore.big = Math.max(oppScore.big, c[2]); } oppPop(sp, { size: c[2] }); }
          }
          const R = RULES[vs.rule], ms = scoreOf(E.S.score, vs.rule), os = scoreOf(bot ? oppE.S.score : oppScore, vs.rule);
          vsBar.querySelector('.on').textContent = `${vs.bot ? '砂吹さん' : vs.name} ${os}${R.unit}`;
          vsBar.querySelector('.me').textContent = `あなた ${ms}${R.unit}`;
          vsBar.querySelector('.tm').textContent = countT > 0 ? fmtT(vs.dur) : fmtT(vs.dur - startT);
        } else $('[data-b="info"]').textContent = `きょう ${stats.today}匹`;
        // ボタンと案内
        const ph = E.S.ph, lure = E.G.bait.type === 'lure', h = E.S.hooked;
        bigB.innerHTML = ph === 'ready' ? '投げる<small>長おし→はなす</small>' : ph === 'charge' ? 'はなす!<small>いまの力で</small>' : ph === 'fight' ? '巻く<small>上にずらすと強く</small>' : ph === 'water' ? '巻く<small>上で速く</small>' : ph === 'fly' ? '…' : vs ? '…' : 'つぎへ';
        hkB.textContent = ph === 'water' ? (E.S.bite ? 'あわせ!' : lure ? 'しゃくる' : 'あわせ') : !vs && (ph === 'landed' || ph === 'lost') ? 'つぎへ' : 'あわせ';
        hkB.classList.toggle('alert', !!E.S.bite);
        hkB.style.opacity = ph === 'water' || (!vs && (ph === 'landed' || ph === 'lost')) ? 1 : 0.45;
        const showThr = (reelPid != null || keyReel) && (ph === 'water' || ph === 'fight');
        thrEl.hidden = !showThr; if (showThr) thrEl.firstChild.style.height = Math.round(E.input.reel * 100) + '%';
        if (ph === 'fight' && h) {
          if (!gaugeOn) { gauge.hidden = false; gaugeOn = true; }
          gauge.querySelector('b').style.left = Math.min(100, h.T / 1.3 * 100) + '%';
          gauge.querySelector('.brk').style.transform = `scaleX(${Math.min(1, h.bm)})`;
          gauge.querySelector('.gl').textContent = `糸 ${Math.round(h.L * 30)}m`;
          gauge.querySelector('.gs').textContent = h.S < 0.3 ? '弱ってきた!' : h.mode === 'run' ? (h.dir < 0 ? '← 左へ走る' : '右へ走る →') : 'ひと休み中';
        } else if (gaugeOn) { gauge.hidden = true; gaugeOn = false; }
        let hint = '';
        if (ended) hint = '';
        else if (ph === 'ready') hint = stats.casts < 3 ? '水面を左右になぞってねらう → 🎣を長おし、はなして投げる' : `${E.S.baitOk ? '' : ''}ねらい:${areaName(E.target(1))}`;
        else if (ph === 'charge') hint = '黄色の輪がねらいの場所。いいところで、はなす!';
        else if (ph === 'water') hint = !E.S.baitOk ? 'エサがない。🎣で巻いて回収' : E.S.bite ? '今だ! あわせ!' : lure ? (stats.catches < 3 ? '🎣おしたままで巻く(上にずらすと速く)。左でしゃくる' : '') : (stats.catches < 3 ? 'ウキがグッとしずんだら「あわせ」' : '');
        else if (ph === 'fight' && h) hint = h.jump > 0 ? 'はねた! ゆるめて!' : h.T > 1 ? 'あぶない! ゆるめて!' : h.T < 0.08 ? 'ゆるみすぎ! 巻いて!' : h.mode === 'run' ? (h.dir > 0 ? '← 左へドラッグして竿をたおせ!' : '右へドラッグして竿をたおせ! →') : '今のうちに巻け!';
        if (hint !== hintKey) { hintKey = hint; hintEl.textContent = hint; hintEl.style.opacity = hint ? 1 : 0; }
        // 音
        sfx.reel(E.input.reel); sfx.creak(ph === 'fight' && h ? h.T : 0);
        if (toastEl && (toastT -= dt) <= 0) { toastEl.remove(); toastEl = null; }
      };
      cleanup.push(() => { frame = null; sfx.ambience(false); });
    }
    const areaName = ([x, d]) => { const a = areaAt(x, d); return a === 'open' ? 'ひらけた所' : AREAS[a].name; };
    function pickBotBait(cond) { const tm = timeOf(cond.hour); return tm === 'night' ? 'worm' : tm === 'morning' ? 'spoon' : tm === 'evening' ? 'minnow' : 'bread'; }
    function ghostScore(g, dur) { const sc = { count: 0, big: 0, point: 0 }; for (const c of g.e) { if (c[0] / 10 > dur) continue; sc.point += c[3]; const sp = BYID[c[1]]; if (sp && sp.kind === 'fish') { sc.count++; sc.big = Math.max(sc.big, c[2]); } } return sc; }

    // エンジン → 絵の状態
    function vsOf(E, withFish) {
      const S = E.S, ph = S.ph, v = { ph, aim: S.aim, p: S.p, isLure: E.G.bait.type === 'lure', moving: E.input.reel > 0.05, side: E.input.side };
      if (ph === 'ready' || ph === 'charge') { v.target = E.target(); v.maxTarget = ph === 'charge' ? E.target() : E.target(1); v.areaName = areaName(E.target(1)); if (ph === 'charge') v.maxTarget = E.target(1); }
      v.lure = { x: S.lure.x, d: S.lure.d, h: S.lure.h };
      v.nib = S.bob.nib; v.bite = !!S.bite; v.sunk = !!S.bite && !v.isLure;
      const h = S.hooked;
      if (h) v.hooked = { T: h.T, run: h.mode === 'run', jump: h.jump > 0, jumpK: 1 - h.jump / 0.9, len: h.size || 25, sp: h.sp };
      if (withFish) v.fish = S.fish.map(f => ({ x: f.x, d: f.d, len: Math.max(6, f.size), vis: f.vis * (f.st === 'flee' ? 0.7 : 1), hx: f.hx || 1, hd: f.hd || 0, wig: f.wig, glow: f.sp.art && f.sp.art.glow }));
      return v;
    }
    function vsOfSnap(s) {
      if (!s) return { ph: 'ready', aim: 0, maxTarget: [0, 0.5] };
      const v = { ph: s.ph, isLure: s.lure, side: 0 };
      if (s.ph === 'ready' || s.ph === 'charge') { v.aim = s.x * 2; const a = v.aim * 0.78; v.maxTarget = [Math.sin(a) * 0.62, Math.cos(a) * 0.58]; if (s.ph === 'charge') { const dist = 0.1 + s.d * 0.55; v.target = [Math.sin(a) * dist * 1.08, Math.cos(a) * dist]; } }
      else { v.lure = { x: s.x, d: s.d, h: s.ph === 'fly' ? s.T : 0 }; v.nib = s.bite === 1 ? 1 : 0; v.bite = s.bite === 2; v.sunk = s.bite === 2 && !s.lure; v.moving = false; }
      if (s.ph === 'fight') v.hooked = { T: s.T, run: s.T > 0.65, jump: s.jump, len: [12, 30, 60, 130][s.sz], sp: null };
      return v;
    }

    // ================= 道具をえらぶ =================
    function tackleSheet(done) {
      const s = sheet(`<div class="ph"><h2>道具をえらぶ</h2><button class="chip" data-shop>🧰 道具屋へ</button></div><div class="sc"></div><div style="padding:8px 16px 16px;text-align:center"><button class="btn" data-x>これで釣る</button></div>`);
      const sc = s.querySelector('.sc');
      const draw = () => {
        sc.innerHTML = ['bait', 'rod', 'reel', 'line'].map(slot => `<div class="lbl">${{ bait: 'エサ・ルアー', rod: '竿', reel: 'リール', line: '糸' }[slot]}</div><div class="seg">${own[slot].map(id => { const g = gearById(slot, id); return `<button class="tab ${eq[slot] === id ? 'on' : ''}" data-s="${slot}" data-id="${id}">${g.icon ? g.icon + ' ' : ''}${g.name}</button>`; }).join('')}</div>`).join('')
          + `<p style="font-size:12px;color:#8d7f9e">いまのエサ:${esc(gearById('bait', eq.bait).desc)}</p>`;
      };
      draw();
      sc.onclick = e => { const b = e.target.closest('[data-s]'); if (!b) return; eq[b.dataset.s] = b.dataset.id; save(); sfx.play('tap'); draw(); };
      s.querySelector('[data-x]').onclick = () => { s.remove(); done && done(); };
      s.querySelector('[data-shop]').onclick = () => { s.remove(); shop(() => { tackleSheet(done); }); };
    }

    // ================= 道具屋 =================
    function shop(back) {
      const s = sheet(`<div class="ph"><h2>🧰 道具屋</h2><b class="wal" style="font-size:13px;text-align:right"></b></div><div class="tabs"></div><div class="sc"></div><div style="padding:8px 16px 16px;text-align:center"><button class="btn sub" data-x>もどる</button></div>`);
      let tab = 'bait', msg = '';
      const tabs = s.querySelector('.tabs'), sc = s.querySelector('.sc');
      const bar = (label, v, max) => `<span class="stat">${label}<i style="width:${Math.round(v / max * 60)}px"></i></span>`;
      const draw = () => {
        const g = ctx.gems ? ctx.gems.get() : null;
        s.querySelector('.wal').innerHTML = `🪙 ${ctx.wallet.get()}${g != null ? `<br>💎 ${g}` : ''}`;
        tabs.innerHTML = [['bait', 'エサ・ルアー'], ['rod', '竿'], ['reel', 'リール'], ['line', '糸']].map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('');
        sc.innerHTML = (msg ? `<p style="text-align:center;font-weight:800;color:#e0556b">${esc(msg)}</p>` : '') + GEAR[tab].map(it => {
          const has = own[tab].includes(it.id), on = eq[tab] === it.id;
          const gemsP = it.gems && !ctx.gems ? null : it.gems, coinP = it.gems && !ctx.gems ? it.gems * 150 : it.price;
          const price = gemsP ? `💎 ${gemsP}` : `🪙 ${coinP}`;
          const stats = tab === 'rod' ? bar('飛距離', it.dist, 1) + bar('パワー', it.power, 1.8) + bar('ねらい', it.acc, 1) : tab === 'reel' ? bar('巻く速さ', it.speed, 1.7) + bar('ドラグ', it.drag, 1) : tab === 'line' ? bar('強さ', it.str, 2.2) : '';
          return `<div class="item"><div class="ic">${it.icon || { rod: '🎣', reel: '⚙️', line: '🧵' }[tab]}</div><div style="flex:1;min-width:0"><b>${it.name}</b><div style="font-size:12px;color:#8d7f9e">${esc(it.desc)}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:3px">${stats}</div></div>
            <div>${has ? (on ? '<span class="chip" style="background:#e9f7ec">使用中</span>' : `<button class="btn sub" data-use="${it.id}" style="padding:8px 14px">使う</button>`) : `<button class="btn ${gemsP ? 'gold' : ''}" data-buy="${it.id}" style="padding:8px 12px;font-size:13px">${price}</button>`}</div></div>`;
        }).join('');
      };
      draw();
      tabs.onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; msg = ''; sfx.play('tap'); draw(); };
      sc.onclick = e => {
        const u = e.target.closest('[data-use]'), b = e.target.closest('[data-buy]');
        if (u) { eq[tab] = u.dataset.use; save(); sfx.play('tap'); draw(); }
        if (b) {
          const it = GEAR[tab].find(x => x.id === b.dataset.buy);
          if (it.gems && ctx.gems) { if (!ctx.gems.spend(it.gems)) { msg = 'ダイヤがたりないよ'; draw(); return; } }
          else { const p = it.gems ? it.gems * 150 : it.price; if (ctx.wallet.get() < p) { msg = `コインがあと ${p - ctx.wallet.get()} たりないよ`; draw(); return; } ctx.wallet.add(-p, 'gear'); }
          own[tab].push(it.id); eq[tab] = it.id; msg = `${it.name} を買った!`; save(); sfx.play('coin'); draw();
        }
      };
      s.querySelector('[data-x]').onclick = () => { s.remove(); back && back(); };
    }

    // ================= 図鑑 =================
    function checkDex() {
      const r = Object.keys(dex).length / ALL.length;
      for (const [k, c] of DEX_REWARDS) if (r >= k && !claimed.includes(k)) { claimed.push(k); save(); ctx.wallet.add(c, 'dex'); setTimeout(() => { const s = sheet(`<div class="ph" style="justify-content:center"><h2>📖 図鑑 ${Math.round(k * 100)}% たっせい!</h2></div><div class="sc" style="text-align:center;font-size:18px;font-weight:900">🪙 +${c}</div><div style="padding:8px 16px 16px;text-align:center"><button class="btn" data-x>やった!</button></div>`, true); s.querySelector('[data-x]').onclick = () => s.remove(); sfx.play('legend'); }, 600); }
    }
    function dexScreen() {
      const s = sheet(`<div class="ph"><h2>📖 図鑑</h2><b class="pr" style="font-size:13px"></b></div><div class="tabs"></div><div class="sc"></div><div style="padding:8px 16px 16px;text-align:center"><button class="btn sub" data-x>もどる</button></div>`);
      let tab = 'all';
      const tabs = s.querySelector('.tabs'), sc = s.querySelector('.sc');
      const found = Object.keys(dex).length, next = DEX_REWARDS.find(([k]) => !claimed.includes(k));
      s.querySelector('.pr').innerHTML = `${found}/${ALL.length}(${Math.round(found / ALL.length * 100)}%)${next ? `<br><small>${Math.round(next[0] * 100)}%で 🪙${next[1]}</small>` : ''}`;
      const draw = () => {
        tabs.innerHTML = [['all', 'すべて'], ['fish', '魚'], ['item', 'アイテム'], ['letter', '手紙']].map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('');
        if (tab === 'letter') { sc.innerHTML = letters.length ? letters.map(i => `<div class="item" style="display:block"><b style="font-family:Georgia,serif">“${esc(LETTERS[i][0])}”</b><div style="font-size:12px;color:#8d7f9e">${esc(LETTERS[i][1])}</div></div>`).join('') : '<p style="text-align:center;color:#8d7f9e">ビンの手紙を釣ると、ここにたまるよ</p>'; return; }
        const list = ALL.filter(x => tab === 'all' || (tab === 'fish' ? x.kind === 'fish' : x.kind !== 'fish'));
        sc.innerHTML = `<div class="grid">${list.map(x => { const d = dex[x.id]; return `<div class="card" data-id="${x.id}"><div class="ar"></div><div style="color:${RARITY_COL[x.r]};font-size:10px">${'★'.repeat(x.r)}</div>${d ? esc(x.name) : '？？？'}<small>${d ? (x.kind === 'fish' ? `最大 ${d.best}cm` : `${d.n}こ`) : '&nbsp;'}</small></div>`; }).join('')}</div>`;
        sc.querySelectorAll('.card').forEach(c => { const x = BYID[c.dataset.id], cv = artCanvas(x, 110, 64, { sil: !dex[x.id] }); cv.style.cssText = 'width:100%;height:auto;position:static'; c.querySelector('.ar').appendChild(cv); });
      };
      draw();
      tabs.onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; tab = b.dataset.t; draw(); };
      sc.onclick = e => {
        const c = e.target.closest('[data-id]'); if (!c) return; const x = BYID[c.dataset.id], d = dex[x.id]; sfx.play('tap');
        const m = sheet(`<div class="ph" style="flex-direction:column;gap:2px"><div style="font-size:12px;font-weight:900;color:${RARITY_COL[x.r]}">${'★'.repeat(x.r)} ${RARITY[x.r] || 'はずれ'}</div><h2>${d ? esc(x.name) : '？？？'}</h2>${d ? `<div style="font-family:Georgia,serif;font-style:italic;color:#8d7f9e">${esc(x.en)}</div>` : ''}</div>
          <div class="sc" style="text-align:center"><div class="ar" style="width:240px;max-width:100%;margin:0 auto"></div>
          ${d ? `<p>${x.kind === 'fish' ? `最大 <b>${d.best}cm</b>(${x.size[0]}〜${x.size[1]}cm)・` : ''}${d.n}${x.kind === 'fish' ? '匹' : 'こ'}・はじめて ${d.first}</p>` : ''}
          <p style="background:#fff;border-radius:12px;padding:8px">ヒント:${esc(x.hint || '')}${x.kind === 'fish' ? `<br><small>${x.time !== 'any' ? TIME_JP[x.time] + 'に ' : ''}${x.season ? x.season.map(s => SEASON_JP[s]).join('・') + 'だけ ' : ''}${x.rain ? '雨が好き ' : ''}場所:${x.area.map(a => a === 'open' ? 'ひらけた所' : AREAS[a].name).join('・')}</small>` : ''}</p>
          ${d && x.say ? `<div class="say" style="margin:0 auto">“${esc(x.say)}”</div>` : ''}</div><div style="padding:8px 16px 16px;text-align:center"><button class="btn sub" data-x>とじる</button></div>`, true);
        const cv = artCanvas(x, 240, 140, { sil: !d }); cv.style.cssText = 'width:100%;height:auto;position:static'; m.querySelector('.ar').appendChild(cv);
        m.querySelector('[data-x]').onclick = () => m.remove();
      };
      s.querySelector('[data-x]').onclick = () => s.remove();
    }

    // ================= 勝負の準備 =================
    function vsSetup(prefBot) {
      let rule = st.get('vsRule') || 'count', dur = st.get('vsDur') || 120, opp = prefBot || 'easy';
      const ghost = st.get('ghost');
      const s = sheet(`<div class="ph"><h2>⚔️ 釣り勝負</h2><span class="chip" style="pointer-events:none">${stats.win}勝 ${stats.lose}敗 ${stats.draw}分</span></div><div class="sc"></div><div style="display:flex;gap:10px;padding:8px 16px 16px;justify-content:center"><button class="btn sub" data-x>もどる</button><button class="btn gold" data-go>はじめる!</button></div>`);
      const sc = s.querySelector('.sc');
      const draw = () => {
        sc.innerHTML = `<div class="lbl">ルール</div><div class="seg">${Object.entries(RULES).map(([k, r]) => `<button class="tab ${rule === k ? 'on' : ''}" data-r="${k}">${r.name}</button>`).join('')}</div><p style="font-size:12px;color:#8d7f9e;margin:-6px 0 8px">${RULES[rule].desc}で勝負</p>
          <div class="lbl">時間</div><div class="seg">${DURATIONS.map(d => `<button class="tab ${dur === d ? 'on' : ''}" data-d="${d}">${d / 60}分</button>`).join('')}</div>
          <div class="lbl">あいて</div><div class="seg" style="flex-direction:column">
            <button class="tab ${opp === 'easy' ? 'on' : ''}" data-o="easy">🧢 砂吹さん(のんびり)</button>
            <button class="tab ${opp === 'hard' ? 'on' : ''}" data-o="hard">🔥 砂吹さん(ほんき)</button>
            <button class="tab ${opp === 'code' ? 'on' : ''}" data-o="code">✉️ 友だちの挑戦状をうける</button>
            ${ghost ? `<button class="tab ${opp === 'self' ? 'on' : ''}" data-o="self">👤 前回の自分(${RULES[ghost.r].name}・${ghost.du / 60}分)</button>` : ''}
          </div>
          ${opp === 'code' ? `<textarea rows="4" placeholder="友だちからもらった挑戦状(TSURI…)をここにはりつけ"></textarea><p class="cmsg" style="font-size:12px;color:#e0556b"></p>` : ''}
          <p style="font-size:12px;color:#8d7f9e">上の画面に相手、下の画面に自分。おわったら自分の記録を「挑戦状」にして友だちに送れるよ。</p>`;
      };
      draw();
      sc.onclick = e => {
        const r = e.target.closest('[data-r]'), d = e.target.closest('[data-d]'), o = e.target.closest('[data-o]');
        if (r) rule = r.dataset.r; if (d) dur = +d.dataset.d; if (o) opp = o.dataset.o;
        if (r || d || o) { sfx.play('tap'); draw(); }
      };
      s.querySelector('[data-x]').onclick = () => s.remove();
      s.querySelector('[data-go]').onclick = async () => {
        st.set('vsRule', rule); st.set('vsDur', dur); sfx.play('tap');
        if (opp === 'code') {
          const ta = sc.querySelector('textarea'), msg = sc.querySelector('.cmsg');
          try { const g = await unpack(ta.value); s.remove(); startGhost(g, g.n || 'ともだち'); } catch (err) { msg.textContent = '挑戦状が読めなかったよ。ぜんぶコピーできているか見てね'; }
          return;
        }
        if (opp === 'self') { s.remove(); startGhost(ghost, '前回の自分'); return; }
        s.remove();
        play({ vs: { rule, dur, bot: opp, seed: (Math.random() * 1e9) | 0, cond: baseCond } });
      };
    }
    function startGhost(g, name) {
      const cond = { hour: g.h ?? 12, season: g.se || 'summer', rain: !!g.rn };
      play({ vs: { rule: g.r, dur: g.du, seed: g.sd, cond, ghost: { s: g.s, e: g.e || [] }, name } });
    }

    // ================= 勝負の結果 =================
    function vsResult({ vs, me, op, res, myRec, catches }) {
      const R = RULES[vs.rule], coins = giveCoins(res === 'win' ? 60 : res === 'draw' ? 25 : 10, 'fishvs');
      const head = res === 'win' ? '🏆 かち!' : res === 'lose' ? 'まけ…' : 'ひきわけ';
      if (res === 'win') sfx.play('legend'); else sfx.play(res === 'lose' ? 'lost' : 'catch');
      const list = catches.length ? catches.map(c => { const sp = BYID[c.id]; return `${sp.emoji || '🐟'} ${esc(sp.name)}${sp.kind === 'fish' ? ` ${c.size}cm` : ''} <small style="color:#8d7f9e">${c.pts}pt</small>`; }).join('<br>') : '<span style="color:#8d7f9e">なし</span>';
      const s = sheet(`<div class="ph" style="justify-content:center"><h2 style="font-size:28px">${head}</h2></div>
        <div class="sc" style="text-align:center">
          <div style="display:flex;justify-content:center;gap:16px;align-items:center;font-weight:900"><div>あなた<br><span style="font-size:32px">${me}</span>${R.unit}</div><div style="font-size:20px">vs</div><div>${vs.bot ? '砂吹さん' : esc(vs.name)}<br><span style="font-size:32px">${op}</span>${R.unit}</div></div>
          <p style="font-size:12px;color:#8d7f9e">${R.name}・${vs.dur / 60}分</p>
          <div style="background:#fff;border-radius:12px;padding:8px;text-align:left;font-size:13px;line-height:1.7">${list}</div>
          ${coins ? `<p style="font-weight:900">🪙 +${coins}</p>` : ''}
          ${vs.bot ? `<div class="say" style="margin:6px auto">砂吹さん「${res === 'win' ? 'You got me. Well done.' : res === 'lose' ? 'Better luck next time.' : 'A tie! Good game.'}」</div>` : ''}
          <div class="code" hidden><p style="font-size:12px;margin:6px 0">この文字をぜんぶコピーして友だちに送ってね(友だちは「釣り勝負 → 友だちの挑戦状をうける」にはりつけ)</p><textarea rows="4" readonly></textarea><div style="display:flex;gap:8px;justify-content:center;margin-top:6px"><button class="btn sub" data-copy>コピー</button>${navigator.share ? '<button class="btn sub" data-share>送る</button>' : ''}</div></div>
        </div>
        <div style="display:flex;gap:8px;padding:8px 12px 16px;justify-content:center;flex-wrap:wrap"><button class="btn sub" data-m>メニュー</button><button class="btn gold" data-c>✉️ 挑戦状をつくる</button><button class="btn" data-a>もういちど</button></div>`, true);
      s.querySelector('[data-m]').onclick = () => { s.remove(); menu(); };
      s.querySelector('[data-a]').onclick = () => { s.remove(); if (vs.bot) play({ vs: { ...vs, seed: (Math.random() * 1e9) | 0 } }); else play({ vs }); };
      s.querySelector('[data-c]').onclick = async () => {
        const code = await pack(myRec), box = s.querySelector('.code'), ta = box.querySelector('textarea'); box.hidden = false; ta.value = code;
        box.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(code); box.querySelector('[data-copy]').textContent = 'コピーした!'; } catch (e) { ta.select(); document.execCommand && document.execCommand('copy'); } };
        const sh = box.querySelector('[data-share]'); if (sh) sh.onclick = () => navigator.share({ text: `釣り勝負の挑戦状だよ!(${RULES[myRec.r].name}・${myRec.du / 60}分・${myRec.sc}${RULES[myRec.r].unit})\n${code}` }).catch(() => { });
      };
    }

    menu();
    return {
      unmount() { cancelAnimationFrame(raf); clear(); frame = null; sfx.close(); root.remove(); },
    };
  },
};
