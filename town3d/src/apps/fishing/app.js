// 釣り(砂吹さんの池)。町のアプリ(mount(el, ctx) → {unmount})。
//   のんびり釣り / 釣り勝負(2画面:砂吹さん・友だちの挑戦状・前回の自分) / 図鑑 / 道具屋
import { FISH, ITEMS, ALL, BYID, LETTERS, RARITY, RARITY_COL, GEAR, gearById, DEX_REWARDS, DAILY_COIN_CAP, RULES, DURATIONS, AREAS, areaAt, TANA, tanaOf, BAIT_EN, SPEED_JP, SPEED_EN } from './data.js';
import { askScreen, adviceFor } from './ask.js';
import { createEngine, createBot, replayAt, timeOf, REACH } from './engine.js';
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
.fz .chip{border:0;border-radius:999px;padding:7px 10px;font:inherit;font-weight:800;font-size:12px;background:rgba(255,255,255,.88);color:${ink};box-shadow:0 2px 8px #0002;white-space:nowrap}
.fz .hint{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(36px + env(safe-area-inset-bottom,0px));max-width:calc(100% - 262px);box-sizing:border-box;margin-left:-14px;font-size:12px !important;background:rgba(40,30,70,.55);color:#fff;font-weight:700;font-size:13px;padding:6px 12px;border-radius:12px;text-align:center;pointer-events:none;transition:opacity .3s;line-height:1.45}
.fz .big{position:absolute;right:18px;bottom:calc(22px + env(safe-area-inset-bottom,0px));width:108px;height:108px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:17px;color:#fff;background:radial-gradient(circle at 35% 30%,#ffb3c6,#f07a98);box-shadow:0 6px 0 #c9577a,0 10px 20px #0004;touch-action:none}
.fz .big.on{transform:translateY(4px);box-shadow:0 2px 0 #c9577a,0 6px 12px #0004}
.fz .big small{display:block;font-size:11px;font-weight:700;opacity:.9}
.fz .hk{position:absolute;left:18px;bottom:calc(30px + env(safe-area-inset-bottom,0px));width:86px;height:86px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:16px;color:${ink};background:radial-gradient(circle at 35% 30%,#fff,#ffe9a8);box-shadow:0 5px 0 #d8b45a,0 8px 16px #0004;touch-action:none}
.fz .hk.alert{animation:fzPulse .35s infinite alternate;background:radial-gradient(circle at 35% 30%,#fff,#ffcf4a)}
.fz .hk:active{transform:translateY(3px)}
@keyframes fzPulse{to{transform:scale(1.12)}}
.fz .flash{position:absolute;inset:0;background:#fff;pointer-events:none;animation:fzFlash .35s ease-out forwards;z-index:3}
@keyframes fzFlash{from{opacity:.85}to{opacity:0}}
.fz .hitTxt{position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);font-size:64px;font-weight:900;color:#ffe36b;-webkit-text-stroke:3px #c0392b;text-shadow:0 6px 0 #c0392b,0 10px 24px #0007;pointer-events:none;z-index:4;animation:fzHit .9s ease-out forwards;white-space:nowrap;letter-spacing:2px}
@keyframes fzHit{0%{transform:translate(-50%,-50%) scale(2.4);opacity:0}15%{transform:translate(-50%,-50%) scale(1);opacity:1}75%{opacity:1}100%{transform:translate(-50%,-70%) scale(1.05);opacity:0}}
.fz .boss{position:absolute;left:0;right:0;top:44%;transform:translateY(-50%);text-align:center;padding:12px 0;background:linear-gradient(90deg,transparent,rgba(20,10,40,.85) 15%,rgba(20,10,40,.85) 85%,transparent);color:#fff;font-weight:900;font-size:22px;letter-spacing:3px;pointer-events:none;z-index:4;animation:fzBoss 2.2s ease-out forwards}
.fz .boss small{display:block;font-size:12px;letter-spacing:1px;color:#ffd36b}
@keyframes fzBoss{0%{opacity:0;transform:translateY(-50%) scaleY(0)}12%{opacity:1;transform:translateY(-50%) scaleY(1)}80%{opacity:1}100%{opacity:0}}
.fz .vign{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 45%,rgba(30,0,40,.55));transition:opacity .6s;opacity:0;z-index:1}
.fz.shake{animation:fzShake .45s}
@keyframes fzShake{20%{transform:translate(-6px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-4px,2px)}80%{transform:translate(3px,-1px)}}
.fz .conf{position:absolute;top:-10px;width:8px;height:12px;border-radius:2px;animation:fzConf 1.6s ease-in forwards;pointer-events:none}
@keyframes fzConf{to{transform:translateY(520px) rotate(720deg);opacity:.2}}
.fz .show{position:absolute;inset:0;z-index:6;background:#2b3a5a;overflow:hidden}
.fz .show .info{position:absolute;left:12px;right:12px;top:10px;background:rgba(255,250,243,.92);border-radius:18px;padding:8px 12px;text-align:center;box-shadow:0 4px 14px #0003}
.fz .show .acts{position:absolute;left:0;right:0;bottom:calc(16px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:0 10px}
.fz .show .say{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(76px + env(safe-area-inset-bottom,0px))}
.fz .badge{display:inline-block;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:900;color:#fff;vertical-align:middle}
.fz .opflash{position:absolute;left:0;right:0;top:0;pointer-events:none;background:#fff;animation:fzFlash .5s ease-out forwards;z-index:2}
.fz .thr{position:absolute;right:132px;bottom:calc(30px + env(safe-area-inset-bottom,0px));width:12px;height:90px;border-radius:8px;background:rgba(255,255,255,.35);overflow:hidden;pointer-events:none}
.fz .thr i{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(#ffe36b,#7fd38c);border-radius:8px}
.fz .area{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));background:rgba(40,30,70,.55);color:#fff;font-weight:800;font-size:12px;padding:4px 10px;border-radius:999px;pointer-events:none;white-space:nowrap}
.fz .pw{position:absolute;right:132px;bottom:calc(30px + env(safe-area-inset-bottom,0px));width:16px;height:120px;border-radius:9px;background:rgba(255,255,255,.4);border:2px solid #fff;pointer-events:none;overflow:hidden}
.fz .pw .band{position:absolute;left:0;right:0;background:#ffe36b}
.fz .pw b{position:absolute;left:-2px;right:-2px;height:4px;margin-bottom:-2px;background:#c0392b}
.fz .ez{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);font-size:30px;font-weight:900;color:#fff;-webkit-text-stroke:2px #5a3a8a;text-shadow:0 4px 0 #5a3a8a,0 8px 16px #0006;pointer-events:none;white-space:nowrap;animation:fzPulse .4s infinite alternate;z-index:3}
.fz .ez.l{left:30%}.fz .ez.r{left:70%}
.fz .gauge{position:absolute;left:50%;transform:translateX(-50%);top:calc(max(46px, 7%) + 25.5% + 44px);width:min(78%,360px);pointer-events:none}
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
const LOST_JP = { snap: '糸が切れた…', slack: 'バレた…(糸がゆるんで外れた)', jump: 'はねて外れた…', hook: '針が外れた…(針が小さかったかも)' };

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
    const own = Object.assign({ rod: ['bamboo'], reel: ['basic'], line: ['nylon'], bait: ['worm'], eye: ['none'] }, st.get('own') || {}); own.hook = ['s', 'm', 'l']; if (!own.eye) own.eye = ['none'];
    const eq = Object.assign({ rod: 'bamboo', reel: 'basic', line: 'nylon', bait: 'worm', hook: 'm', eye: 'none', tana: 0.5 }, st.get('eq') || {});
    const skill = st.get('skill') || [];   // 最近の出来事(腕のアドバイス用)
    const note = k => { skill.push(k); if (skill.length > 40) skill.shift(); st.set('skill', skill); };
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
        <button class="btn mb sub" data-m="ask">💬<span>砂吹さんに聞く<br><small>狙いの魚・いまのおすすめ・腕のアドバイス</small></span></button>
        <button class="btn mb sub" data-m="shop">🧰<span>道具屋<br><small>竿・リール・糸・エサ・ルアー・見る道具</small></span></button>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="chip" data-m="mode">${st.get('mode') === 'easy' ? '🟢 かんたん' : '🔵 ほんかく'}</button><button class="chip" data-m="fx">${st.get('fx') === 'calm' ? '🍵 演出おとなしめ' : '🎆 演出 派手'}</button><button class="chip" data-m="help">？ あそびかた</button></div>`;
      root.appendChild(ui);
      ui.onclick = e => { const m = e.target.closest('[data-m]')?.dataset.m; if (!m) return; sfx.play('tap'); ({ free: () => play({}), vs: vsSetup, dex: dexScreen, shop: () => shop(), ask: () => ask(), help: () => help(), mode: () => { st.set('mode', st.get('mode') === 'easy' ? 'real' : 'easy'); menu(); }, fx: () => { st.set('fx', st.get('fx') === 'calm' ? 'high' : 'calm'); menu(); } })[m](); };
      if (P.vs) { const o = P.vs; P.vs = null; setTimeout(() => vsSetup(o === 'hard' ? 'hard' : 'easy'), 0); }
      else if (P.tab === 'shop') { P.tab = null; setTimeout(() => shop(), 0); }
      else if (P.tab === 'ask') { P.tab = null; setTimeout(() => ask(), 0); }
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
        <p><b>① ねらって投げる</b><br>池を<b>タップ</b>でそこへ、<b>はじく</b>と大きく、<b>なぞる</b>と細かく、狙いの円が動く(池のどこでもOK)。🎣を<b>おしたまま</b>で力がたまり、ゲージが<b>黄色の帯</b>に入ったら<b>はなす</b>。円に落とせば魚が寄りやすく、真ん中なら<b>パーフェクト</b>!</p>
        <p><b>② さそう</b><br>しずむと水の中の画面に切りかわる。エサは<b>上下にはじくとタナ(深さ)</b>が変わる。エサ(ウキ)はじっと待つ。ルアーは🎣をおしたままで<b>巻く</b>(おしたまま上にずらすと速く)。左のボタンで<b>しゃくる</b>と強い魚がよってくる。</p>
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
      const topH = vs ? 0.3 : 0, STRIP = 34;
      const easy = vs ? !!vs.easy : st.get('mode') === 'easy', calm = vs ? !!vs.calm : st.get('fx') === 'calm';
      // 自分の画面(いちばん下)と、相手の画面(上。自分がファイト中は細い帯にたたむ)
      const cv = document.createElement('canvas'); cv.style.cssText = 'top:0;height:100%'; root.appendChild(cv);
      let oppView = null, oppCv = null;
      if (vs) { oppCv = document.createElement('canvas'); oppCv.style.cssText = `top:0;height:${topH * 100}%;z-index:1`; root.appendChild(oppCv); oppView = createView(oppCv, cond, { mini: true }); }
      const view = createView(cv, cond, { under: true });
      const ui = document.createElement('div'); ui.className = 'ui'; root.appendChild(ui);
      let y0Max = 0, y0 = 0;
      const resize = () => { y0Max = vs ? Math.round(root.clientHeight * topH) : 0; y0 = y0Max; view.resize(y0Max); oppView && oppView.resize(); ui.style.top = y0 + 'px'; };
      const ro = new ResizeObserver(resize); ro.observe(root); cleanup.push(() => ro.disconnect()); resize();
      sfx.ambience(true);

      let E = null, startT = 0, ended = false, oppScore = { count: 0, big: 0, point: 0 }, oppSeen = 0, oppE = null, bot = null;
      const onEv = (type, d) => handleEv(type, d);
      const mk = () => createEngine({ seed: vs ? vs.seed : (Math.random() * 1e9) | 0, cond, gear: eq, onEvent: onEv, record: !!vs, easy });
      E = mk(); if (P.debug) { window.__fzE = E; window.__fzOpp = () => oppE; }
      if (vs && vs.bot) { oppE = createEngine({ seed: vs.seed, cond, gear: vs.bot === 'hard' ? { rod: 'carbon', reel: 'smooth', line: 'fluoro', bait: pickBotBait(cond), hook: 'm', tana: 0.85 } : { rod: 'bamboo', reel: 'basic', line: 'nylon', bait: 'worm', hook: 'm', tana: 0.5 }, onEvent: (t, d) => { oppE.onBot && oppE.onBot(t, d); oppEvent(t, d); }, easy }); bot = createBot(oppE, vs.bot, vs.seed + 5); }

      // ---- 画面の部品 ----
      ui.innerHTML = `<div class="bar"><button class="chip" data-b="back">≡</button><span style="flex:1"></span><span class="chip" data-b="info" style="pointer-events:none"></span><button class="chip" data-b="tackle"></button><button class="chip" data-b="tana"></button>${vs ? '' : '<button class="chip" data-b="ask">💬</button>'}<button class="chip" data-b="help">？</button></div>
        <div class="hint"></div><div class="area" hidden></div><div class="pw" hidden><i class="band"></i><b></b></div><div class="ez" hidden></div>
        <div class="gauge" hidden><div class="t"><b></b></div><div class="brk"></div><div class="row"><span class="gl"></span><span class="gs"></span></div></div>
        <div class="thr" hidden><i></i></div>
        <button class="hk">あわせ</button><button class="big">投げる<small>長おし</small></button>`;
      const $ = s => ui.querySelector(s);
      const hintEl = $('.hint'), gauge = $('.gauge'), thrEl = $('.thr'), bigB = $('.big'), hkB = $('.hk');
      let vsBar = null, bubEl = null;
      if (vs) {
        vsBar = document.createElement('div'); vsBar.className = 'vsbar'; vsBar.style.zIndex = 2; $('[data-b="info"]').style.display = 'none';
        vsBar.innerHTML = `<span class="on"></span><span class="tm"></span><span class="me"></span>`; root.appendChild(vsBar);
        $('[data-b="back"]').textContent = '×';
      }
      const tackleChip = () => { const b = gearById('bait', eq.bait); $('[data-b="tackle"]').textContent = `${b.icon} ${b.name}・${gearById('hook', eq.hook).name}`; const tc = $('[data-b="tana"]'); tc.style.display = b.type === 'lure' ? 'none' : ''; tc.textContent = TANA[tanaOf(E.S.tana)].name; };
      tackleChip();
      ui.querySelector('.bar').onclick = e => {
        const b = e.target.closest('[data-b]')?.dataset.b; if (!b) return; sfx.play('tap');
        if (b === 'back') { if (vs && !ended) { confirmQuit(); return; } menu(); }
        if (b === 'tackle') { if (E.S.ph !== 'ready') { toast('投げる前に変えられるよ', 1200); return; } tackleSheet(() => { for (const k of ['rod', 'reel', 'line', 'bait', 'hook', 'eye']) E.setGear(k, eq[k]); E.setTana(eq.tana); tackleChip(); }); }
        if (b === 'help') help();
        if (b === 'ask') ask();
        if (b === 'tana') { const order = ['top', 'mid', 'bottom'], nx = order[(order.indexOf(tanaOf(E.S.tana)) + 1) % 3]; E.setTana(TANA[nx].y); eq.tana = E.S.tana; save(); tackleChip(); }
      };
      onEqChange = () => { if (E.S.ph === 'ready') { for (const k of ['rod', 'reel', 'line', 'bait', 'hook', 'eye']) E.setGear(k, eq[k]); E.setTana(eq.tana); } tackleChip(); };
      cleanup.push(() => { onEqChange = null; });
      function confirmQuit() { const s = sheet(`<div class="ph"><h2>勝負をやめる?</h2></div><div class="sc">やめると負けになります。</div><div style="display:flex;gap:10px;padding:12px 16px 18px;justify-content:center"><button class="btn sub" data-n>つづける</button><button class="btn" data-y>やめる</button></div>`, true); s.querySelector('[data-n]').onclick = () => s.remove(); s.querySelector('[data-y]').onclick = () => { s.remove(); stats.lose++; save(); menu(); }; }

      // ---- 入力 ----
      let reelPid = null, reelY0 = 0, thr = 0, waterPid = null, wx0 = 0, sideT = 0, keyReel = false;
      const W = () => cv.getBoundingClientRect();
      // 🎣ボタンだけで全部できる:
      //   投げる前 … その場で長おし=力をためる / 指を動かす=狙いを動かす(なぞる=細かく・はじく=大きく)
      //   しずんだあと … 長おし=巻く(上にずらすと速く) / 上下にはじく=タナを1段かえる
      //   ファイト … 長おし=巻く、左右にずらす=竿をたおす
      let bt = null;
      const bpt = e => ({ x: e.clientX, y: e.clientY, t: performance.now() });
      bigB.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation(); sfx.unlock(); if (ended || E.S.locked) return;
        bigB.setPointerCapture(e.pointerId); reelPid = e.pointerId; reelY0 = e.clientY; bigB.classList.add('on');
        const p = bpt(e), ph = E.S.ph;
        bt = { p0: p, last: p, hist: [p], moved: 0, mode: ph === 'ready' ? 'pending' : ph === 'water' ? 'pendingW' : ph === 'fight' ? 'reel' : 'none' };
        if (bt.mode === 'reel') thr = 0.55;
        if ((ph === 'landed' || ph === 'lost') && !vs && !leap) closeCard();
      });
      bigB.addEventListener('pointermove', e => {
        if (e.pointerId !== reelPid || !bt) return; const p = bpt(e), dx = p.x - bt.p0.x, dy = p.y - bt.p0.y;
        bt.moved = Math.max(bt.moved, Math.hypot(dx, dy)); bt.hist.push(p); if (bt.hist.length > 6) bt.hist.shift();
        if (bt.mode === 'pending' && bt.moved > 10) bt.mode = 'aim';
        if (bt.mode === 'aim' && (E.S.ph === 'ready')) E.setTarget(E.S.aimT.x + (p.x - bt.last.x) * 0.0042, E.S.aimT.d - (p.y - bt.last.y) * 0.0032);
        if (bt.mode === 'pendingW' && Math.abs(dy) > 16) bt.mode = 'flickW';
        if (bt.mode === 'reel') { thr = Math.max(0.15, Math.min(1, 0.55 + (bt.p0.y - p.y) / 110)); if (E.S.ph === 'fight') sideT = Math.max(-1, Math.min(1, dx / 70)); }
        bt.last = p;
      });
      const reelUp = e => {
        if (e.pointerId !== reelPid) return; reelPid = null; bigB.classList.remove('on'); thr = 0; sideT = 0;
        const b = bt; bt = null; if (!b) return;
        const p = bpt(e), h0 = b.hist[0], dt = Math.max(16, p.t - h0.t), vx = (p.x - h0.x) / dt * 1000, vy = (p.y - h0.y) / dt * 1000;
        if (E.S.ph === 'charge') { E.castRelease(); stats.casts++; return; }
        if (b.mode === 'aim' && E.S.ph === 'ready' && Math.hypot(vx, vy) > 650) { E.setTarget(E.S.aimT.x + vx * 0.00055, E.S.aimT.d - vy * 0.00045); sfx.play('whoosh'); }   // はじく=大きく
        if (b.mode === 'pending' && E.S.ph === 'ready') toast('長おしで投げる・指を動かすと狙いが動くよ', 1200);
        if ((b.mode === 'flickW' || b.mode === 'pendingW') && E.S.ph === 'water' && E.G.bait.type !== 'lure' && Math.abs(p.y - b.p0.y) > 16) {   // 上下にはじく=タナ
          const order = ['top', 'mid', 'bottom'], i = order.indexOf(tanaOf(E.S.tana)), ni = Math.max(0, Math.min(2, i + (p.y > b.p0.y ? 1 : -1)));
          E.setTana(TANA[order[ni]].y); eq.tana = E.S.tana; save(); sfx.play('tap'); toast('タナ:' + TANA[order[ni]].name, 700); tackleChip();
        }
      };
      bigB.addEventListener('pointerup', reelUp); bigB.addEventListener('pointercancel', reelUp);
      hkB.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); sfx.unlock(); if (ended) return; if (E.S.ph === 'water') E.hookPress(); else if ((E.S.ph === 'landed' || E.S.ph === 'lost') && !vs) closeCard(); });
      // 画面をさわる:池=狙いを動かす(フリックで大きく・なぞって細かく・タップでそこへ) / 水中=タナ(上下フリックで1段・なぞって細かく) / ファイト=竿をたおす
      let tanaDrag = false, pt = null;
      const local = e => { const r = W(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
      const camMode = () => { const ph = E.S.ph; return ph === 'fight' ? 'fight' : ph === 'water' && underReady ? 'under' : 'pond'; };
      const inUnder = p => { const u = view.underRect(); return u && p.x >= u.x && p.x <= u.x + u.w && p.y >= u.y && p.y <= u.y + u.h; };
      const tanaFrom = p => { const u = view.underRect(), ld = E.S.lure.d, b = 0.55 + 0.45 * Math.min(1, ld / 0.6); E.setTana((p.y - u.y - 12) / ((u.h - 18 - view.underPad()) * b)); eq.tana = E.S.tana; };
      cv.addEventListener('pointerdown', e => {
        if (waterPid != null) return; waterPid = e.pointerId; wx0 = e.clientX; cv.setPointerCapture(e.pointerId);
        const p = local(e); pt = { p0: p, last: p, hist: [p], moved: 0, mode: camMode() };
        tanaDrag = pt.mode === 'under' && E.G.bait.type !== 'lure' && inUnder(p);
      });
      cv.addEventListener('pointermove', e => {
        if (e.pointerId !== waterPid || !pt) return; const p = local(e);
        pt.moved += Math.hypot(p.x - pt.last.x, p.y - pt.last.y); pt.hist.push(p); if (pt.hist.length > 6) pt.hist.shift();
        if (pt.mode === 'pond' && (E.S.ph === 'ready' || E.S.ph === 'charge')) {
          const a = view.toPond(pt.last.x, pt.last.y), b = view.toPond(p.x, p.y);
          if (a && b) E.setTarget(E.S.aimT.x + (b.x - a.x) * 0.6, E.S.aimT.d + (b.d - a.d) * 0.6);   // なぞる=細かく
        } else if (pt.mode === 'under' && tanaDrag && Math.abs(p.y - pt.p0.y) > 10 && performance.now() - pt.p0.t > 140) tanaFrom(p);
        else if (E.S.ph === 'fight') sideT = Math.max(-1, Math.min(1, (e.clientX - wx0) / (W().width * 0.22)));
        pt.last = p;
      });
      const wUp = e => {
        if (e.pointerId !== waterPid) return; waterPid = null; sideT = 0;
        if (pt) {
          const p = local(e), h0 = pt.hist[0], dt = Math.max(16, p.t - h0.t), vx = (p.x - h0.x) / dt * 1000, vy = (p.y - h0.y) / dt * 1000, fast = Math.hypot(vx, vy) > 650;
          if (pt.mode === 'pond' && (E.S.ph === 'ready' || E.S.ph === 'charge')) {
            if (fast) { const a = view.toPond(p.x, p.y), b = view.toPond(p.x + vx * 0.15, p.y + vy * 0.15); if (a && b) { E.setTarget(E.S.aimT.x + (b.x - a.x), E.S.aimT.d + (b.d - a.d)); sfx.play('whoosh'); } }   // はじく=大きく
            else if (pt.moved < 8) { const q = view.toPond(p.x, p.y); if (q && q.d > 0.02) { E.setTarget(q.x, q.d); sfx.play('tap'); } }   // タップ=そこへ
          } else if (pt.mode === 'under' && E.G.bait.type !== 'lure' && fast && Math.abs(vy) > Math.abs(vx)) {   // 上下フリック=1段
            const order = ['top', 'mid', 'bottom'], i = order.indexOf(tanaOf(E.S.tana)), ni = Math.max(0, Math.min(2, i + (vy > 0 ? 1 : -1)));
            E.setTana(TANA[order[ni]].y); eq.tana = E.S.tana; sfx.play('tap'); toast('タナ:' + TANA[order[ni]].name, 700);
          }
          if (tanaDrag) save();
        }
        pt = null; tanaDrag = false; tackleChip();
      };
      cv.addEventListener('pointerup', wUp); cv.addEventListener('pointercancel', wUp);
      function aimFrom() { }
      const kd = e => {
        if (e.repeat) return; const k = e.key;
        if (k === ' ' || k === 'Enter') { e.preventDefault(); if (E.S.ph === 'ready') E.castStart(); else if (E.S.ph === 'landed' || E.S.ph === 'lost') { !vs && closeCard(); } else { keyReel = true; thr = 0.6; } }
        if (k === 'f' || k === 'F') { if (E.S.ph === 'water') E.hookPress(); }
        if (k === 'ArrowUp') { if (E.S.ph === 'water') E.hookPress(); else E.setTarget(E.S.aimT.x, E.S.aimT.d + 0.06); }
        if (k === 'ArrowLeft' || k === 'a') { if (E.S.ph === 'fight') sideT = -1; else E.setTarget(E.S.aimT.x - 0.08, E.S.aimT.d); }
        if (k === 'ArrowRight' || k === 'd') { if (E.S.ph === 'fight') sideT = 1; else E.setTarget(E.S.aimT.x + 0.08, E.S.aimT.d); }
        if (k === 'ArrowDown') E.setTarget(E.S.aimT.x, E.S.aimT.d - 0.06);
        if (k === 'Shift') thr = 1;
        if (k === 'w' || k === 'PageUp') E.setTana(E.S.tana - 0.1);
        if (k === 's' || k === 'PageDown') E.setTana(E.S.tana + 0.1);
      };
      const ku = e => { const k = e.key; if (k === ' ' || k === 'Enter') { keyReel = false; thr = 0; if (E.S.ph === 'charge') { E.castRelease(); stats.casts++; } } if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') sideT = 0; if (k === 'Shift' && keyReel) thr = 0.6; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); cleanup.push(() => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); });

      // ---- 出来事 ----
      let toastEl = null, toastT = 0, card = null, castQ = '', underReady = false, landT = 0, lastCam = 'pond';
      function toast(text, ms = 1100, cls = '') { toastEl?.remove(); toastEl = document.createElement('div'); toastEl.className = 'toast ' + cls; toastEl.innerHTML = text; ui.appendChild(toastEl); toastT = ms / 1000; }
      function handleEv(type, d) {
        const L = E.S.lure;
        if (type === 'cast') { sfx.play('whoosh'); if (d.q) castQ = d.q; }
        if (type === 'land') { sfx.play('plop'); view.splash(d.x, d.d, 8, 0.6); underReady = false; landT = 0; if (castQ) { toast(castQ === 'perfect' ? '<span style="font-size:24px;color:#e08a00">✨パーフェクト!!✨</span><br><small style="font-size:12px">まわりの魚がとても寄ってくる</small>' : 'ナイスキャスト!<br><small style="font-size:12px">魚が寄りやすい</small>', 1200); if (castQ === 'perfect') sfx.play('coin'); castQ = ''; } }
        if (type === 'nibble') sfx.play('nibble');
        if (type === 'bite') { sfx.play('bite'); if (E.G.bait.type !== 'bait') view.splash(L.x, L.d, 6, 0.7); }
        if (type === 'hooked') onHit(d);
        if (type === 'early') { sfx.play('early'); toast('はやすぎた!', 900); note('early'); }
        if (type === 'miss') { toast('のがした…', 900); note('late'); }
        if (type === 'look') { toast('迷ってる…! 小さく誘え<br><small style="font-size:12px">「' + (E.G.bait.type === 'lure' ? 'しゃくる' : 'あわせ') + '」をちょんと</small>', 1500); sfx.play('nibble'); }
        if (type === 'entice') { note('entice'); }
        if (type === 'pass') { toast('見切られた…', 1000); note('pass'); }
        if (type === 'spook') { toast('バシャッ! 魚がおどろいた<br><small style="font-size:12px">真上より、進む向きの少し先に落とそう</small>', 1500); note('land'); }
        if (type === 'spooked') { toast('おどろいて逃げた…', 1000); note('spook'); }
        if (type === 'stolen') { note('late'); toast('エサをとられた…<br><small style="font-size:13px">巻いて回収しよう</small>', 1400); }
        if (type === 'twitch') { view.splash(L.x, L.d, 3, 0.4); }
        if (type === 'jump') { sfx.play('jump'); view.splash(L.x, L.d, 22, 1.6); toast('はねた! ゆるめて!', 800); }
        if (type === 'lost') { endFightFx(); note(d.reason); sfx.play(d.reason === 'snap' ? 'snap' : 'lost'); if (vs) toast(LOST_JP[d.reason], 1300); else showLost(d); }
        if (type === 'catch') onCatch(d);
      }
      function oppEvent(type, d) {
        if (type === 'catch') { const sp = BYID[d.id]; oppPop(sp, d); }
        if (type === 'lost' && Math.random() < 0.6) bubble(SUNA_SAY.lost[Math.floor(Math.random() * 3)]);
        if (type === 'land') oppView.splash(d.x, d.d, 5, 0.5);
        if (type === 'hooked') { oppView.splash(oppE.S.lure.x, oppE.S.lure.d, 8, 0.8); oppHit(); }
      }
      function oppPop(sp, d) {
        if (!sp) return;
        bubble(`${sp.name}${sp.kind === 'fish' ? ' ' + d.size + 'cm' : ''}!` + (vs.bot ? ' ' + (sp.r >= 3 ? SUNA_SAY.big[0] : SUNA_SAY.catch[Math.floor(Math.random() * 4)]) : ''));
      }
      function bubble(text) { bubEl?.remove(); bubEl = document.createElement('div'); bubEl.className = 'bub'; bubEl.textContent = (vs.bot ? '砂吹さん: ' : vs.name + ': ') + text; root.appendChild(bubEl); const b = bubEl; setTimeout(() => { if (bubEl === b) { b.remove(); bubEl = null; } }, 2200); }

      // ---- 演出 ----
      let hitStop = 0, hitBig = false, leap = null, vign = null;
      function onHit(d) {
        const L = E.S.lure, h = E.S.hooked, sp = h && h.sp, big = sp && sp.kind === 'fish' && (sp.r >= 4 || h.size >= 70), legend = sp && sp.r >= 5;
        sfx.play('hook'); view.splash(L.x, L.d, 16, 1.2);
        if (d.item) { toast('なにか引っかかった…?', 1000); sfx.fight(0.4); return; }
        hitStop = calm ? 0.1 : big ? 0.45 : 0.22; hitBig = big;
        const ht = document.createElement('div'); ht.className = 'hitTxt'; ht.textContent = big ? 'HIT!!!' : 'HIT!!'; ui.appendChild(ht); setTimeout(() => ht.remove(), 950);
        sfx.vib(big ? [80, 40, 160] : [60, 30, 90]);
        if (big && !calm) {
          root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake');
          const bo = document.createElement('div'); bo.className = 'boss'; bo.innerHTML = legend ? '⚠ とてつもない引き…!!<small>伝説の魚かもしれない</small>' : '!? 大物だ!!<small>ていねいにいこう</small>'; ui.appendChild(bo); setTimeout(() => bo.remove(), 2300);
        }
        if (!vign) { vign = document.createElement('div'); vign.className = 'vign'; ui.prepend(vign); }
        vign.style.opacity = calm ? 0 : legend ? 1 : big ? 0.6 : 0.25;
        sfx.fight(legend ? 1 : big ? 0.75 : 0.5);
      }
      function endFightFx() { sfx.fight(0); if (vign) vign.style.opacity = 0; }
      function oppHit() { const r = oppCv.getBoundingClientRect(), rr = root.getBoundingClientRect(), fl = document.createElement('div'); fl.className = 'opflash'; fl.style.height = r.height + 'px'; root.appendChild(fl); setTimeout(() => fl.remove(), 520); bubble('HIT!'); sfx.play('nibble'); }
      function confetti(where) { const cols = ['#ff8fab', '#ffd36b', '#7fd3ff', '#9be08f', '#c9a0ff']; for (let i = 0; i < 36; i++) { const c = document.createElement('i'); c.className = 'conf'; c.style.left = Math.random() * 100 + '%'; c.style.background = cols[i % 5]; c.style.animationDelay = Math.random() * 0.5 + 's'; where.querySelector('.panel').appendChild(c); setTimeout(() => c.remove(), 2300); } }
      function record(d) {
        const sp = BYID[d.id], r = dex[d.id] || { n: 0, best: 0, first: todayKey() }, isNew = !dex[d.id], best = sp.kind === 'fish' && d.size > r.best;
        r.n++; r.modes = r.modes || {}; { const mk = easy ? 'easy' : 'real'; r.modes[mk] = Math.max(r.modes[mk] || 0, sp.kind === 'fish' ? d.size : 1); } if (sp.kind === 'fish') { r.best = Math.max(r.best, d.size); r.combo = [E.G.bait.id, E.G.bait.type === 'lure' ? '' : tanaOf(E.S.tana), E.G.hook.id]; } dex[d.id] = r; note('catch');
        stats.catches++; if (sp.kind === 'fish') stats.today++;
        let extra = '', coins = sp.kind === 'fish' ? Math.max(1, Math.round(d.pts / 3)) : 0;
        if (sp.coins === 'chest') coins = 120 + Math.floor(Math.random() * 180); else if (sp.coins) coins = sp.coins;
        if (sp.letter) { const left = LETTERS.map((_, i) => i).filter(i => !letters.includes(i)); const i = left.length ? left[Math.floor(Math.random() * left.length)] : Math.floor(Math.random() * LETTERS.length); if (!letters.includes(i)) letters.push(i); extra = `<div style="background:#fff8e6;border-radius:12px;padding:8px 10px;margin-top:8px;font-size:14px"><b style="font-family:Georgia,serif">“${esc(LETTERS[i][0])}”</b><br><small>${esc(LETTERS[i][1])}</small></div>`; }
        if (sp.gift) { const L = ['spoon', 'minnow', 'frog', 'glow'].find(id => !own.bait.includes(id)); if (L) { own.bait.push(L); extra = `<div style="margin-top:6px">🎁 <b>${gearById('bait', L).name}</b> を手に入れた!</div>`; } else coins = 100; }
        if (easy) coins = Math.round(coins / 2);   // かんたんはコイン半分
        const got = coins ? giveCoins(coins, 'fish') : 0;
        save(); checkDex();
        return { sp, isNew, best, coins: got, wanted: coins, extra, r };
      }
      function onCatch(d) {
        const info = record(d), sp = info.sp;
        endFightFx();
        sfx.play(sp.r >= 5 ? 'legend' : 'catch', sp.r >= 3);
        // 水からとび出す(スロー)→カード
        leap = { sp, x: E.S.lure.x, d: E.S.lure.d, len: d.size || 30, t: 0, dur: vs ? 0.7 : 1.15, then: () => { if (vs) return; showCatch(d, info); } };
        if (vs) { toast(`${sp.emoji || '🐟'} ${sp.name}${sp.kind === 'fish' ? ` <small>${d.size}cm</small>` : ''}${info.isNew ? ' <small style="color:#e0556b">NEW!</small>' : ''}`, 1300); return; }
      }
      // 自分のキャラが魚を見せる(3Dが使えないときはカード)
      async function showCatch(d, info) {
        const sp = info.sp; card = { remove() {} };
        const head = `<div style="font-size:12px;font-weight:900;color:${RARITY_COL[sp.r]}">${'★'.repeat(sp.r)}${'☆'.repeat(5 - sp.r)} ${RARITY[sp.r] || 'はずれ'} ${MODE_BADGE(easy ? 'easy' : 'real')}</div>
          <div style="font-size:22px;font-weight:900">${esc(sp.name)}${info.isNew ? ' <span style="color:#e0556b;font-size:13px">NEW!</span>' : ''}</div>
          <div style="font-family:Georgia,serif;font-style:italic;color:#8d7f9e;font-size:13px">${esc(sp.en)}</div>
          ${sp.kind === 'fish' ? `<div style="font-size:24px;font-weight:900">${d.size}<small style="font-size:13px">cm</small>${info.best && !info.isNew ? ' <span style="font-size:12px;color:#e0556b">記録更新!</span>' : ''}</div>` : ''}
          ${info.extra}${info.wanted ? `<div style="font-weight:900;font-size:13px">🪙 +${info.coins}${info.coins < info.wanted ? ' <small style="color:#8d7f9e">(きょうの上限)</small>' : ''}</div>` : ''}`;
        const r = await showScreen({ actors: [{ look: ctx.player?.look, pose: 'auto', sp, size: d.size }], bg: cv, infoHtml: head, sayText: `砂吹さん「${esc(sp.say || 'Nice!')}」`, caption: [`${sp.name}${sp.kind === 'fish' ? ' ' + d.size + 'cm' : ''}`, `ほしみや池 ${new Date().toLocaleDateString()}`], confettiOn: info.isNew || info.best || sp.r >= 4, buttons: [['つづける', '', () => closeCard()]] });
        if (!r) { card = null; showCard(d, info); } else card = { remove: r.close };
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
        if (info.isNew || info.best || sp.r >= 4) confetti(card);
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
        const oppC = bot ? oppE.S.catches.map(c => ({ id: c.id, size: c.size, pts: c.pts })) : (vs.ghost.e || []).filter(c => c[0] / 10 <= vs.dur).map(c => ({ id: c[1], size: c[2], pts: c[3] }));
        myRec.mo = easy ? 1 : 0;
        setTimeout(() => vsShow({ vs, me, op, res, myRec, catches: E.S.catches.slice(), oppC }), 1400);
        toast('しゅうりょう!', 1300, 'hit');
      }

      // ---- 毎フレーム ----
      let hintKey = '', gaugeOn = false, lastGhostPh = null, ezKey = '';
      const pwEl = $('.pw'), ezEl = $('.ez'), areaEl = $('.area');
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
        if (bt && bt.mode === 'pending' && performance.now() - bt.p0.t > 170) { if (E.S.ph === 'ready') { bt.mode = 'charge'; E.castStart(); } else bt.mode = 'none'; }
        if (bt && bt.mode === 'pendingW' && performance.now() - bt.p0.t > 140) { bt.mode = 'reel'; thr = 0.55; }
        if (bt && bt.mode === 'flickW' && performance.now() - bt.p0.t > 450) { bt.mode = 'reel'; thr = 0.55; }   // ゆっくり動かしたら巻く
        if (bt && bt.mode === 'reel' && E.S.ph !== 'water' && E.S.ph !== 'fight') bt.mode = 'none';
        if (bt && bt.mode !== 'reel' && E.S.ph === 'fight') { bt.mode = 'reel'; thr = 0.55; }
        const reeling = (bt && bt.mode === 'reel') || keyReel;
        E.input.reel = reeling && (E.S.ph === 'water' || E.S.ph === 'fight') ? thr || 0.55 : 0;
        E.input.side += (sideT - E.input.side) * Math.min(1, dt * 6);
        if (hitStop > 0) hitStop -= dt; else if (!(vs && countT > 0)) E.update(dt);
        if (leap) { leap.t += dt / leap.dur; if (leap.t >= 1) { const fn = leap.then; leap = null; fn && fn(); } }
        if (vs && E.S.ph === 'landed' && E.S.resultT > 0.9) E.ack();
        if (vs && E.S.ph === 'lost' && E.S.resultT > 1.1) E.ack();
        // カメラ:投げるまで=池 / しずんだら=水中+ウキの小窓 / ヒット=池と水中を半分ずつ
        if (E.S.ph === 'water') { landT += dt; if (!underReady && landT > 0.55) underReady = true; } else if (E.S.ph !== 'fight') underReady = false;
        const cm = leap || card ? 'pond' : camMode();
        if (cm !== lastCam) { if (cm === 'under') { view.fx('dive'); if (!calm) sfx.play('splash'); } else if (cm === 'fight') view.fx('hit', hitBig); else if (lastCam === 'fight') view.fx('surface'); lastCam = cm; }
        if (vs) { const tgt = E.S.ph === 'fight' ? STRIP : y0Max; y0 += (tgt - y0) * Math.min(1, dt * 6); ui.style.top = y0 + 'px'; oppCv.style.clipPath = `inset(0 0 ${Math.max(0, y0Max - y0)}px 0)`; vsBar.style.top = Math.max(2, y0 - 30) + 'px'; }
        { const v = vsOf(E, true); v.under = underOf(E); v.cam = cm; v.focus = { x: E.S.lure.x, d: E.S.lure.d }; v.y0 = y0; v.calm = calm; if (leap) v.leap = leap; view.draw(v, dt); }
        // 相手
        if (vs) {
          const t = Math.min(startT, vs.dur);
          if (bot) { if (!(countT > 0) && !ended) { bot.update(dt); oppE.update(dt); } oppView.draw(vsOf(oppE, false), dt); }
          else if (vs.ghost) {
            const s = replayAt(vs.ghost, t); oppView.draw(vsOfSnap(s), dt);
            if (s && s.ph === 'fight' && lastGhostPh !== 'fight') oppHit(); lastGhostPh = s ? s.ph : null;
            while (oppSeen < vs.ghost.e.length && vs.ghost.e[oppSeen][0] / 10 <= t) { const c = vs.ghost.e[oppSeen++]; oppScore.point += c[3]; const sp = BYID[c[1]]; if (sp && sp.kind === 'fish') { oppScore.count++; oppScore.big = Math.max(oppScore.big, c[2]); } oppPop(sp, { size: c[2] }); }
          }
          const R = RULES[vs.rule], ms = scoreOf(E.S.score, vs.rule), os = scoreOf(bot ? oppE.S.score : oppScore, vs.rule);
          const oph = bot ? oppE.S.ph : (replayAt(vs.ghost, t) || {}).ph;
          vsBar.querySelector('.on').textContent = `${vs.bot ? '砂吹さん' : vs.name} ${os}${R.unit}${oph === 'fight' ? ' 🎣ファイト中!' : ''}`;
          vsBar.querySelector('.me').textContent = `あなた ${ms}${R.unit}`;
          vsBar.querySelector('.tm').textContent = countT > 0 ? fmtT(vs.dur) : fmtT(vs.dur - startT);
        } else $('[data-b="info"]').textContent = `🐟${stats.today}`;
        // ボタンと案内
        const ph = E.S.ph, lure = E.G.bait.type === 'lure', h = E.S.hooked;
        bigB.innerHTML = ph === 'ready' ? '投げる<small>長おし/動かして狙う</small>' : ph === 'charge' ? 'はなす!<small>いまの力で</small>' : ph === 'fight' ? '巻く<small>上にずらすと強く</small>' : ph === 'water' ? '巻く<small>上で速く</small>' : ph === 'fly' ? '…' : vs ? '…' : 'つぎへ';
        hkB.textContent = ph === 'water' ? (E.S.bite ? 'あわせ!' : lure ? 'しゃくる' : 'あわせ') : !vs && (ph === 'landed' || ph === 'lost') ? 'つぎへ' : 'あわせ';
        hkB.classList.toggle('alert', !!E.S.bite);
        hkB.style.opacity = ph === 'water' || (!vs && (ph === 'landed' || ph === 'lost')) ? 1 : 0.45;
        const showThr = reeling && (ph === 'water' || ph === 'fight');
        thrEl.hidden = !showThr; if (showThr) thrEl.firstChild.style.height = Math.round(E.input.reel * 100) + '%';
        if (ph === 'fight' && h) {
          if (!gaugeOn) { gauge.hidden = false; gaugeOn = true; }
          gauge.querySelector('b').style.left = Math.min(100, h.T / 1.3 * 100) + '%';
          gauge.querySelector('.brk').style.transform = `scaleX(${Math.min(1, h.bm)})`;
          gauge.querySelector('.gl').textContent = `糸 ${Math.round(h.L * 30)}m`;
          gauge.querySelector('.gs').textContent = h.S < 0.3 ? '弱ってきた!' : h.mode === 'run' ? (h.dir < 0 ? '← 左へ走る' : '右へ走る →') : 'ひと休み中';
        } else if (gaugeOn) { gauge.hidden = true; gaugeOn = false; }
        { const ar = ph === 'ready' || ph === 'charge' ? '📍 ' + areaName([E.S.aimT.x, E.S.aimT.d]) : ''; if (areaEl.textContent !== ar) { areaEl.textContent = ar; areaEl.hidden = !ar; } }
        // 力のゲージ(ちょうどいい帯)
        if (ph === 'charge') { pwEl.hidden = false; const need = E.pNeed(), bw = Math.max(0.03, E.ringR() / REACH); pwEl.querySelector('.band').style.cssText = `bottom:${Math.max(0, need - bw) * 100}%;height:${Math.min(1, bw * 2) * 100}%`; pwEl.querySelector('b').style.bottom = E.S.p * 100 + '%'; } else pwEl.hidden = true;
        // かんたんモードの大きな案内
        let ez = '';
        if (easy && !ended) {
          if (ph === 'water' && E.S.bite) ez = '<span style="color:#ffe36b">今!</span> あわせ!';
          else if (ph === 'fight' && h) ez = h.jump > 0 || h.T > 0.85 ? '✋ ゆるめて!' : h.mode === 'run' ? (h.dir > 0 ? '⬅⬅ こっちにたおす!' : 'こっちにたおす! ➡➡') : h.T < 0.3 ? '🎣 巻いて!' : '';
        }
        if (ez !== ezKey) { ezKey = ez; ezEl.innerHTML = ez; ezEl.hidden = !ez; ezEl.className = 'ez' + (ez.includes('⬅') ? ' l' : ez.includes('➡') ? ' r' : ''); }
        let hint = '';
        if (ended) hint = '';
        else if (ph === 'ready') hint = stats.casts < 3 ? '🎣を押したまま指を動かすと狙いが動く・その場で長おしで投げる' : '';
        else if (ph === 'charge') hint = 'ゲージが黄色の帯に入ったら、はなす!';
        else if (ph === 'water' && underReady && !lure && stats.casts < 6) hint = '🎣を上下にはじくとタナが変わる';
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
      if (ph === 'ready' || ph === 'charge') { v.aimT = S.aimT; v.ringR = E.ringR(); v.areaName = areaName([S.aimT.x, S.aimT.d]); if (ph === 'charge') v.land = E.target(); }
      v.bonus = S.bonus;
      v.lure = { x: S.lure.x, d: S.lure.d, h: S.lure.h };
      v.nib = S.bob.nib; v.bite = !!S.bite; v.sunk = !!S.bite && !v.isLure;
      const h = S.hooked;
      if (h) v.hooked = { T: h.T, run: h.mode === 'run', jump: h.jump > 0, jumpK: 1 - h.jump / 0.9, len: h.size || 25, sp: h.sp };
      if (withFish) v.fish = S.fish.map(f => ({ x: f.x, d: f.d, len: Math.max(6, f.size), vis: f.vis * (f.st === 'flee' ? 0.7 : 1), hx: f.hx || 1, hd: f.hd || 0, wig: f.wig, int: f.st === 'roam' ? f.int || 0 : 0, glow: f.sp.art && f.sp.art.glow }));
      return v;
    }
    function underOf(E) {
      const S = E.S, ph = S.ph, lure = E.G.bait.type === 'lure';
      let lx = S.lure.x, ld = S.lure.d;
      if (ph === 'ready' || ph === 'charge' || ph === 'fly') { lx = S.aimT.x; ld = S.aimT.d; }
      const vis = E.G.eye.vis, wid = vis >= 2 ? 0.2 : 0.14, ll = Math.hypot(lx, ld) || 1;
      const fish = S.fish.filter(f => f.vis > 0.5 && f.st !== 'gone' && Math.abs(lx * f.d - ld * f.x) / ll < wid).map(f => ({ d: f.d, y: f.y, len: Math.max(6, f.size), sp: f.sp, st: f.st, wig: f.wig, hd: f.hd || 0, int: f.st === 'roam' ? f.int || 0 : 0 }));
      const h = S.hooked;
      return { ph, lx, ld, depth: ph === 'water' || ph === 'fight' ? (h ? h.y : S.depth) : S.tana, tana: S.tana, isLure: lure, bait: E.G.bait.id, vis, eyeName: E.G.eye.icon + ' ' + E.G.eye.name, fish, canTana: !lure, nib: S.bob.nib, sunk: !!S.bite && !lure,
        hooked: h ? { len: h.size || 25, sp: h.sp, run: h.mode === 'run', big: h.size >= 60 } : null };
    }
    function vsOfSnap(s) {
      if (!s) return { ph: 'ready', aim: 0, maxTarget: [0, 0.5] };
      const v = { ph: s.ph, isLure: s.lure, side: 0 };
      if (s.ph === 'ready' || s.ph === 'charge') { v.aimT = { x: s.x, d: s.d }; v.ringR = 0.07; }
      else { v.lure = { x: s.x, d: s.d, h: s.ph === 'fly' ? s.T : 0 }; v.nib = s.bite === 1 ? 1 : 0; v.bite = s.bite === 2; v.sunk = s.bite === 2 && !s.lure; v.moving = false; }
      if (s.ph === 'fight') v.hooked = { T: s.T, run: s.T > 0.65, jump: s.jump, len: [12, 30, 60, 130][s.sz], sp: null };
      return v;
    }

    // ================= 見せる画面(3D) =================
    let showMod = null;
    const loadShow = () => (showMod ? Promise.resolve(showMod) : import('./show3d.js').then(m => (showMod = m)).catch(e => { console.warn('[fishing] show3d', e); return null; }));
    const MODE_BADGE = m => m === 'easy' ? '<span class="badge" style="background:#7fcf8f">かんたん</span>' : '<span class="badge" style="background:#7aa8e8">ほんかく</span>';
    // actors:[{look,pose,sp,size}] / infoHtml / sayText / buttons:[[label, cls, fn]] / caption:[title, sub]
    async function showScreen({ actors, bg, infoHtml, sayText, buttons, caption, confettiOn }) {
      const m = await loadShow(); if (!m) return null;
      const el = document.createElement('div'); el.className = 'show'; root.appendChild(el);
      el.addEventListener('pointerdown', e => e.stopPropagation());
      const sc = m.createShow(el, { actors: actors.map(a => ({ ...a, look: m.lookOf(a.look) })), bg });
      el.insertAdjacentHTML('beforeend', `<div class="info">${infoHtml}</div>${sayText ? `<div class="say">${sayText}</div>` : ''}<div class="acts"></div>`);
      const acts = el.querySelector('.acts');
      const close = () => { sc.dispose(); el.remove(); };
      const photoBtn = document.createElement('button'); photoBtn.className = 'btn gold'; photoBtn.textContent = '📷 写真を撮る';
      photoBtn.onclick = async () => {
        const src = sc.snap(caption); sfx.play('coin');
        try { const P2 = await import('../../game/photos.js'); P2.flash(root); P2.shotCard(root, src, { gems: ctx.gems, cfg: ctx.photo, openAlbum: () => ctx.open('album'), sfx: () => {} }); }
        catch (e) { const a = document.createElement('a'); a.href = src; a.download = 'fish.jpg'; a.click(); }
      };
      acts.appendChild(photoBtn);
      for (const [label, cls, fn] of buttons) { const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = label; b.onclick = () => { close(); fn && fn(); }; acts.appendChild(b); }
      if (confettiOn) { const cols = ['#ff8fab', '#ffd36b', '#7fd3ff', '#9be08f', '#c9a0ff']; for (let i = 0; i < 40; i++) { const c = document.createElement('i'); c.className = 'conf'; c.style.left = Math.random() * 100 + '%'; c.style.background = cols[i % 5]; c.style.animationDelay = Math.random() * 0.6 + 's'; el.appendChild(c); setTimeout(() => c.remove(), 2600); } }
      return { el, close };
    }

    // ================= 砂吹さんに聞く =================
    let onEqChange = null;
    function ask(tab) {
      askScreen({ sheet, dex, cond: baseCond, eq, own, st, sfx, skill, tab, onSet: (c, bb) => {
        if (c.bait) eq.bait = c.bait; eq.tana = c.tana; eq.hook = c.hook; save(); onEqChange && onEqChange();
        return c.bait ? 'セットした!' : `針とタナはセット。${gearById('bait', bb[0]).name}は道具屋で`;
      } });
    }

    // ================= 道具をえらぶ =================
    function tackleSheet(done) {
      const s = sheet(`<div class="ph"><h2>道具をえらぶ</h2><button class="chip" data-shop>🧰 道具屋へ</button></div><div class="sc"></div><div style="padding:8px 16px 16px;text-align:center"><button class="btn" data-x>これで釣る</button></div>`);
      const sc = s.querySelector('.sc');
      const draw = () => {
        const lureNow = gearById('bait', eq.bait).type === 'lure';
        sc.innerHTML = `<div class="lbl">タナ(エサの深さ)</div><div class="seg">${lureNow ? '<span style="font-size:12px;color:#8d7f9e">ルアーは巻く速さで深さが変わるよ</span>' : Object.entries(TANA).map(([k, t]) => `<button class="tab ${tanaOf(eq.tana) === k ? 'on' : ''}" data-tana="${t.y}">${t.name}</button>`).join('')}</div>`
          + ['bait', 'hook', 'eye', 'rod', 'reel', 'line'].map(slot => `<div class="lbl">${{ bait: 'エサ・ルアー', hook: '針', eye: '見る道具', rod: '竿', reel: 'リール', line: '糸' }[slot]}</div><div class="seg">${own[slot].map(id => { const g = gearById(slot, id); return `<button class="tab ${eq[slot] === id ? 'on' : ''}" data-s="${slot}" data-id="${id}">${g.icon ? g.icon + ' ' : ''}${g.name}</button>`; }).join('')}</div>`).join('')
          + `<p style="font-size:12px;color:#8d7f9e">いまのエサ:${esc(gearById('bait', eq.bait).desc)}</p>`;
      };
      draw();
      sc.onclick = e => { const tn = e.target.closest('[data-tana]'); if (tn) { eq.tana = +tn.dataset.tana; save(); sfx.play('tap'); draw(); return; } const b = e.target.closest('[data-s]'); if (!b) return; eq[b.dataset.s] = b.dataset.id; save(); sfx.play('tap'); draw(); };
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
        tabs.innerHTML = [['bait', 'エサ・ルアー'], ['eye', '見る道具'], ['rod', '竿'], ['reel', 'リール'], ['line', '糸']].map(([k, n]) => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('');
        sc.innerHTML = (msg ? `<p style="text-align:center;font-weight:800;color:#e0556b">${esc(msg)}</p>` : '') + GEAR[tab].map(it => {
          const has = own[tab].includes(it.id), on = eq[tab] === it.id;
          const gemsP = it.gems && !ctx.gems ? null : it.gems, coinP = it.gems && !ctx.gems ? it.gems * 150 : it.price;
          const price = gemsP ? `💎 ${gemsP}` : `🪙 ${coinP}`;
          const stats = tab === 'rod' ? bar('飛距離', it.dist, 1) + bar('パワー', it.power, 1.8) + bar('ねらい', it.acc, 1) : tab === 'reel' ? bar('巻く速さ', it.speed, 1.7) + bar('ドラグ', it.drag, 1) : tab === 'line' ? bar('強さ', it.str, 2.2) : '';
          return `<div class="item"><div class="ic">${it.icon || { rod: '🎣', reel: '⚙️', line: '🧵', eye: '👀' }[tab]}</div><div style="flex:1;min-width:0"><b>${it.name}</b><div style="font-size:12px;color:#8d7f9e">${esc(it.desc)}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:3px">${stats}</div></div>
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
          ${d ? `<p>${x.kind === 'fish' ? `最大 <b>${d.best}cm</b>(${x.size[0]}〜${x.size[1]}cm)・` : ''}${d.n}${x.kind === 'fish' ? '匹' : 'こ'}・はじめて ${d.first}</p>${d.modes ? `<p style="margin:-6px 0 6px">${Object.entries(d.modes).map(([k, v]) => MODE_BADGE(k) + (x.kind === 'fish' ? ` 最大${v}cm` : '')).join(' ')}</p>` : ''}` : ''}
          <p style="background:#fff;border-radius:12px;padding:8px">ヒント:${esc(x.hint || '')}${x.kind === 'fish' ? `<br><small>${x.time !== 'any' ? TIME_JP[x.time] + 'に ' : ''}${x.season ? x.season.map(s => SEASON_JP[s]).join('・') + 'だけ ' : ''}${x.rain ? '雨が好き ' : ''}場所:${x.area.map(a => a === 'open' ? 'ひらけた所' : AREAS[a].name).join('・')}</small>` : ''}</p>
          ${d && x.say ? `<div class="say" style="margin:0 auto">“${esc(x.say)}”</div>` : ''}</div><div style="padding:8px 16px 16px;text-align:center"><button class="btn sub" data-x>とじる</button></div>`, true);
        const cv = artCanvas(x, 240, 140, { sil: !d }); cv.style.cssText = 'width:100%;height:auto;position:static'; m.querySelector('.ar').appendChild(cv);
        m.querySelector('[data-x]').onclick = () => m.remove();
      };
      s.querySelector('[data-x]').onclick = () => s.remove();
    }

    // ================= 勝負の準備 =================
    function vsSetup(prefBot) {
      let rule = st.get('vsRule') || 'count', dur = st.get('vsDur') || 120, opp = prefBot || 'easy', mode = st.get('mode') || 'real', fx = st.get('fx') || 'high';
      const ghost = st.get('ghost');
      const s = sheet(`<div class="ph"><h2>⚔️ 釣り勝負</h2><span class="chip" style="pointer-events:none">${stats.win}勝 ${stats.lose}敗 ${stats.draw}分</span></div><div class="sc"></div><div style="display:flex;gap:10px;padding:8px 16px 16px;justify-content:center"><button class="btn sub" data-x>もどる</button><button class="btn gold" data-go>はじめる!</button></div>`);
      const sc = s.querySelector('.sc');
      const draw = () => {
        sc.innerHTML = `<div class="lbl">ルール</div><div class="seg">${Object.entries(RULES).map(([k, r]) => `<button class="tab ${rule === k ? 'on' : ''}" data-r="${k}">${r.name}</button>`).join('')}</div><p style="font-size:12px;color:#8d7f9e;margin:-6px 0 8px">${RULES[rule].desc}で勝負</p>
          <div class="lbl">時間</div><div class="seg">${DURATIONS.map(d => `<button class="tab ${dur === d ? 'on' : ''}" data-d="${d}">${d / 60}分</button>`).join('')}</div>
          <div class="lbl">モード(ふたりとも同じ)</div><div class="seg"><button class="tab ${mode === 'real' ? 'on' : ''}" data-mo="real">🔵 ほんかく</button><button class="tab ${mode === 'easy' ? 'on' : ''}" data-mo="easy">🟢 かんたん</button></div>
          <div class="lbl">演出</div><div class="seg"><button class="tab ${fx === 'high' ? 'on' : ''}" data-fx="high">🎆 派手</button><button class="tab ${fx === 'calm' ? 'on' : ''}" data-fx="calm">🍵 おとなしめ</button></div>
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
        const r = e.target.closest('[data-r]'), d = e.target.closest('[data-d]'), o = e.target.closest('[data-o]'), mo = e.target.closest('[data-mo]'), fxb = e.target.closest('[data-fx]');
        if (r) rule = r.dataset.r; if (d) dur = +d.dataset.d; if (o) opp = o.dataset.o; if (mo) mode = mo.dataset.mo; if (fxb) fx = fxb.dataset.fx;
        if (r || d || o || mo || fxb) { sfx.play('tap'); draw(); }
      };
      s.querySelector('[data-x]').onclick = () => s.remove();
      s.querySelector('[data-go]').onclick = async () => {
        st.set('vsRule', rule); st.set('vsDur', dur); st.set('mode', mode); st.set('fx', fx); sfx.play('tap');
        if (opp === 'code') {
          const ta = sc.querySelector('textarea'), msg = sc.querySelector('.cmsg');
          try { const g = await unpack(ta.value); s.remove(); startGhost(g, g.n || 'ともだち'); } catch (err) { msg.textContent = '挑戦状が読めなかったよ。ぜんぶコピーできているか見てね'; }
          return;
        }
        if (opp === 'self') { s.remove(); startGhost(ghost, '前回の自分'); return; }
        s.remove();
        play({ vs: { rule, dur, bot: opp, seed: (Math.random() * 1e9) | 0, cond: baseCond, easy: mode === 'easy', calm: fx === 'calm' } });
      };
    }
    function startGhost(g, name) {
      const cond = { hour: g.h ?? 12, season: g.se || 'summer', rain: !!g.rn };
      play({ vs: { rule: g.r, dur: g.du, seed: g.sd, cond, ghost: { s: g.s, e: g.e || [] }, name, easy: !!g.mo, calm: st.get('fx') === 'calm' } });   // 挑戦状のモードに合わせる
    }

    // ================= 勝負の結果 =================
    // 勝った方が魚を見せて、負けた方は落ちこむ
    async function vsShow(o) {
      const { vs, res, catches, oppC } = o;
      const best = l => { const f = l.filter(c => BYID[c.id] && BYID[c.id].kind === 'fish'); if (!f.length) return null; return f.slice().sort((a, b) => vs.rule === 'big' ? b.size - a.size : b.pts - a.pts)[0]; };
      const mb = best(catches), ob = best(oppC), oppLook = vs.bot ? 'suna' : vs.name === '前回の自分' ? ctx.player?.look : 'sora';
      const actor = (look, b, win) => ({ look, pose: win === false ? 'sad' : 'auto', sp: b ? BYID[b.id] : null, size: b ? b.size : 0 });
      const head = res === 'win' ? '🏆 かち!' : res === 'lose' ? 'まけ…' : 'ひきわけ';
      const R = RULES[vs.rule], oname = vs.bot ? '砂吹さん' : vs.name;
      const r = await showScreen({
        actors: [actor(ctx.player?.look, mb, res === 'lose' ? false : true), actor(oppLook, ob, res === 'win' ? false : true)], bg: null,
        infoHtml: `<div style="font-size:24px;font-weight:900">${head}</div><div style="font-weight:900">あなた ${o.me}${R.unit}　vs　${esc(oname)} ${o.op}${R.unit}</div><div style="font-size:12px;color:#8d7f9e">${R.name}・${vs.dur / 60}分 ${MODE_BADGE(vs.easy ? 'easy' : 'real')}</div>`,
        sayText: vs.bot ? `砂吹さん「${res === 'win' ? 'You got me. Well done.' : res === 'lose' ? 'Better luck next time.' : 'A tie! Good game.'}」` : '',
        caption: [`釣り勝負 ${head}`, `${R.name} ${o.me}${R.unit} vs ${o.op}${R.unit}  ほしみや池`], confettiOn: res === 'win',
        buttons: [['結果を見る', '', () => vsResult(o)]],
      });
      if (!r) vsResult(o);
    }
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
