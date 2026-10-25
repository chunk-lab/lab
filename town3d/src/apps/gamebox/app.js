// ゲーム機「チャンクボックス」。家とショップから開く。
//   英語対戦ゲーム(無料。無料会員は1日1試合、ゲーム機を1日借りれば何回でも)
//   あそびゲーム(ソフトを借りる。無料会員はゲーム機も借りる。お試しは1日1回)
//   相手:町の住人(CPU)か、1台のスマホを上下で向かい合わせて2人
import { CPUS, cpuById, createSfx, INK } from './kit.js';
import dictq from './games/dictq.js';
import gomoku from './games/gomoku.js';
import listen from './games/listen.js';
import tug from './games/tug.js';
import shiritori from './games/shiritori.js';
import sniper from './games/sniper.js';
import hockey from './games/hockey.js';
import race from './games/race.js';
import party from './games/party.js';
import snow from './games/snow.js';

export const EN_GAMES = [dictq, gomoku, listen, tug, shiritori, sniper];
export const PLAY_GAMES = [hockey, race, party];
const ALL = [...EN_GAMES, ...PLAY_GAMES, snow];
// 値段(あとで変えられるようにここにまとめる)
export const PRICE = { console: 700, title1: 500, title3: 1000, titleAll: 2000, usdMonth1: 1, usdDayAll: 1 };

const CSS = `
.gb{position:absolute;inset:0;overflow:hidden;font-family:inherit;color:${INK};background:linear-gradient(160deg,#2c2a4a,#3c3566);user-select:none;-webkit-user-select:none}
.gb *{box-sizing:border-box}
.gb .scr{position:absolute;inset:0;overflow:auto;padding:14px 14px calc(20px + env(safe-area-inset-bottom,0px));touch-action:pan-y}
.gb .logo{text-align:center;font-weight:900;font-size:26px;letter-spacing:3px;color:#fff;text-shadow:0 3px 0 #ff7aa2,0 6px 14px #0006;margin:6px 0 2px}
.gb .sub{text-align:center;color:#d8d0f0;font-size:12px;font-weight:700;margin-bottom:10px}
.gb .stat{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:6px 0 12px}
.gb .pill{background:rgba(255,255,255,.14);color:#fff;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:800}
.gb .pill.ok{background:#8fe0b0;color:#21503a}.gb .pill.warn{background:#ffd36b;color:#5a3a10}
.gb h3{color:#fff;font-size:15px;margin:14px 2px 8px;display:flex;align-items:center;gap:8px}
.gb .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gb .card{position:relative;background:#fff;border-radius:18px;padding:12px 10px 10px;text-align:center;box-shadow:0 4px 0 rgba(0,0,0,.25);border:0;font:inherit;color:${INK};cursor:pointer}
.gb .card .ic{font-size:34px;line-height:1.1}.gb .card b{display:block;font-size:14px;margin-top:4px}.gb .card small{display:block;font-size:11px;color:#8d7f9e;font-weight:700;margin-top:2px;min-height:2.6em}
.gb .card .tag{position:absolute;top:8px;right:8px;font-size:10px;font-weight:900;border-radius:999px;padding:2px 7px;color:#fff;background:#b9b0cc}
.gb .card .tag.ok{background:#55c08a}.gb .card .tag.try{background:#f0a24a}
.gb .btn{border:0;border-radius:999px;padding:11px 18px;font:inherit;font-weight:900;color:#fff;background:linear-gradient(160deg,#ffb3c6,#f58aa8);box-shadow:0 3px 0 #d0688a;cursor:pointer}
.gb .btn.sub{background:#efe8f7;color:${INK};box-shadow:0 3px 0 #d6cbe6}.gb .btn.gold{background:linear-gradient(160deg,#ffe58a,#f5b83d);color:#5a3a10;box-shadow:0 3px 0 #c98f22}
.gb .btn.blue{background:linear-gradient(160deg,#9fd0ff,#5aa8f0);box-shadow:0 3px 0 #3b7fc4}
.gb .btn:disabled{opacity:.45}
.gb .sheet{position:absolute;inset:0;background:rgba(20,10,40,.55);display:flex;align-items:flex-end;justify-content:center;z-index:20}
.gb .panel{background:#fffaf3;border-radius:22px 22px 0 0;width:100%;max-width:560px;max-height:90%;overflow:auto;padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px));touch-action:pan-y}
.gb .panel h2{margin:0 0 6px;font-size:19px}
.gb .lbl{font-weight:900;font-size:13px;margin:10px 0 4px}
.gb .seg{display:flex;gap:6px;flex-wrap:wrap}
.gb .tab{border:0;border-radius:999px;padding:8px 12px;font:inherit;font-weight:800;font-size:13px;background:#efe8f7;color:${INK};cursor:pointer}
.gb .tab.on{background:${INK};color:#fff}
.gb .row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.gb .note{font-size:12px;color:#8d7f9e;font-weight:700;line-height:1.6}
.gb .stage{position:absolute;inset:0;background:#fff8ef;z-index:10}
.gb .stage .in{position:absolute;left:0;right:0;top:env(safe-area-inset-top,0px);bottom:calc(env(safe-area-inset-bottom,0px) + 14px)}
.gb .quit{position:absolute;left:8px;top:8px;z-index:12;border:0;border-radius:999px;width:34px;height:34px;font:inherit;font-weight:900;background:rgba(255,255,255,.85);color:${INK};box-shadow:0 2px 6px #0003}
.gb .vs{position:absolute;inset:0;z-index:13;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(180deg,#5aa8f0 0%,#5aa8f0 50%,#ff7aa2 50%,#ff7aa2 100%);color:#fff;font-weight:900;animation:gbFade 1.6s forwards}
.gb .vs .n{font-size:26px;text-shadow:0 3px 0 #0003}.gb .vs .x{font-size:44px;background:#fff;color:${INK};border-radius:999px;padding:4px 18px;box-shadow:0 4px 0 #0003}
@keyframes gbFade{0%,75%{opacity:1}100%{opacity:0;visibility:hidden}}
.gb .res{position:absolute;inset:0;z-index:14;display:flex;align-items:center;justify-content:center;background:rgba(20,10,40,.5)}
.gb .res .box{background:#fffaf3;border-radius:22px;padding:18px;width:min(340px,90%);text-align:center;box-shadow:0 10px 30px #0005;animation:gbPop .3s}
@keyframes gbPop{from{transform:scale(.7);opacity:0}}
.gb .res .big{font-size:30px;font-weight:900}
.gb .flipped{transform:rotate(180deg)}
`;

const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const endOfDay = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };

export const gameboxApp = {
  mount(el, ctx) {
    if (!document.getElementById('gb-css')) { const s = document.createElement('style'); s.id = 'gb-css'; s.textContent = CSS; document.head.appendChild(s); }
    const st = ctx.storage, P = ctx.params || {};
    const root = document.createElement('div'); root.className = 'gb'; el.appendChild(root);
    const sfx = createSfx(ctx.audio && ctx.audio.sfx != null ? ctx.audio.sfx : 0.6);
    root.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
    ctx.setTitle('チャンクボックス');
    const paid = () => !!(ctx.member && ctx.member.paid && ctx.member.paid());
    const admin = () => { try { return JSON.parse(localStorage.getItem('cs:core:admin')) === true; } catch (e) { return false; } };
    // ---- レンタルの記録 ----
    const R = () => {
      const r = Object.assign({ console: '', titles: {}, all: 0, trial: { day: '', used: '' }, en: { day: '', n: 0 } }, st.get('rent') || {});
      if (r.trial.day !== dayKey()) r.trial = { day: dayKey(), used: '' };
      if (r.en.day !== dayKey()) r.en = { day: dayKey(), n: 0 };
      return r;
    };
    const saveR = r => st.set('rent', r);
    const consoleOk = () => paid() || R().console === dayKey();
    const titleUntil = id => { const r = R(); return Math.max(r.titles[id] || 0, r.all || 0); };
    const titleOk = id => titleUntil(id) > Date.now();
    const enLeft = () => (paid() || consoleOk() ? Infinity : Math.max(0, 1 - R().en.n));

    let cur = null;   // 遊んでいるゲーム
    function clear() { if (cur) { try { cur.stop(); } catch (e) { } cur = null; } root.innerHTML = ''; }
    function sheet(html) { const s = document.createElement('div'); s.className = 'sheet'; s.innerHTML = `<div class="panel">${html}</div>`; s.addEventListener('pointerdown', e => { if (e.target === s) s.remove(); }); root.appendChild(s); return s; }
    function msg(t, sub) { const s = sheet(`<h2>${t}</h2><p class="note">${sub || ''}</p><div class="row"><button class="btn sub" data-x>とじる</button></div>`); s.querySelector('[data-x]').onclick = () => s.remove(); return s; }

    // ================= ホーム =================
    function home() {
      clear(); ctx.setTitle('チャンクボックス');
      const r = R(), sc = document.createElement('div'); sc.className = 'scr'; root.appendChild(sc);
      const consoleTxt = paid() ? '本体:有料会員はいつでも' : r.console === dayKey() ? '本体:きょうは借りている' : `本体:借りていない(1日 🪙${PRICE.console})`;
      const winter = P.season === 'winter' || (!P.season && [12, 1, 2].includes(new Date().getMonth() + 1));
      sc.innerHTML = `<div class="logo">CHUNK BOX</div><div class="sub">チャンクボックス ・ 1台で2人対戦</div>
        <div class="stat"><span class="pill ${consoleOk() ? 'ok' : ''}">🎮 ${consoleTxt}</span><span class="pill">🪙 ${ctx.wallet.get()}</span>${!consoleOk() ? `<span class="pill warn">英語ゲーム無料 あと${enLeft()}試合</span>` : ''}</div>
        <div class="row" style="margin:0 0 4px">${!consoleOk() ? `<button class="btn gold" data-rent="console">🎮 本体を1日借りる 🪙${PRICE.console}</button>` : ''}<button class="btn blue" data-rent="titles">📀 ソフトを借りる</button></div>
        <h3>📚 英語対戦ゲーム <span class="pill ok">無料</span></h3><div class="grid">${EN_GAMES.map(card).join('')}</div>
        <h3>🎉 あそびゲーム</h3><div class="grid">${PLAY_GAMES.map(card).join('')}${winter ? card(snow) : ''}</div>
        <p class="note" style="color:#d8d0f0;margin-top:14px">英語ゲーム:無料会員は1日1試合(本体を借りた日は何回でも)。有料会員はいつでも。<br>あそびゲーム:ソフトを借りると遊べる(無料会員は本体も)。お試しは1日1回(どれか1本)。</p>`;
      sc.onclick = e => {
        const c = e.target.closest('[data-g]'), rb = e.target.closest('[data-rent]');
        if (c) { sfx.play('tap'); setup(ALL.find(g => g.id === c.dataset.g)); }
        if (rb) { sfx.play('tap'); rb.dataset.rent === 'console' ? rentConsole() : rentTitles(); }
      };
    }
    function card(g) {
      let tag = '';
      if (g.en || g.free) tag = '<span class="tag ok">無料</span>';
      else if (titleOk(g.id)) tag = '<span class="tag ok">レンタル中</span>';
      else if (!R().trial.used) tag = '<span class="tag try">お試しOK</span>';
      else tag = '<span class="tag">借りる</span>';
      return `<button class="card" data-g="${g.id}">${tag}<div class="ic">${g.icon}</div><b>${g.title}</b><small>${g.desc}</small></button>`;
    }

    // ================= レンタル =================
    function payCoins(n) { if (ctx.wallet.get() < n) return false; ctx.wallet.add(-n, 'gamebox'); sfx.play('item'); return true; }
    function payUsd(label, fn) {   // 本物の支払いはアプリ版で(いまは運営テストのみ)
      if (admin()) { fn(); sfx.play('item'); msg('テスト:借りました', `${label}(運営テスト。本当のお支払いはしていません)`); return; }
      msg('💳 お支払いは準備中', `${label}は、アプリ版のお支払い(App Store / Google Play)とつないでから使えるようになります。いまはコインで借りられます。`);
    }
    function rentConsole(after) {
      if (consoleOk()) { after && after(); return; }
      const s = sheet(`<h2>🎮 本体を借りる</h2><p class="note">きょう1日、ゲーム機が使えます(英語ゲームは何回でも)。<br>有料会員は、いつでも無料で使えます。</p>
        <div class="row"><button class="btn sub" data-x>やめる</button><button class="btn gold" data-ok>🪙 ${PRICE.console} で借りる</button></div>`);
      s.querySelector('[data-x]').onclick = () => s.remove();
      s.querySelector('[data-ok]').onclick = () => { if (!payCoins(PRICE.console)) { s.remove(); msg('コインがたりない', `あと 🪙${PRICE.console - ctx.wallet.get()}`); return; } const r = R(); r.console = dayKey(); saveR(r); s.remove(); after ? after() : home(); };
    }
    function rentTitles(preset) {
      let mode = 'one', picks = preset ? [preset] : [];
      const s = sheet('');
      const draw = () => {
        const need = mode === 'one' ? 1 : mode === 'three' ? 3 : 0;
        s.querySelector('.panel').innerHTML = `<h2>📀 ソフトを借りる</h2>
          <div class="lbl">🪙 コインで(きょう1日)</div><div class="seg">
            <button class="tab ${mode === 'one' ? 'on' : ''}" data-m="one">1本 🪙${PRICE.title1}</button>
            <button class="tab ${mode === 'three' ? 'on' : ''}" data-m="three">3本 🪙${PRICE.title3}</button>
            <button class="tab ${mode === 'all' ? 'on' : ''}" data-m="all">ぜんぶ 🪙${PRICE.titleAll}</button></div>
          ${need ? `<div class="lbl">えらぶ(${picks.length}/${need})</div><div class="seg">${PLAY_GAMES.map(g => `<button class="tab ${picks.includes(g.id) ? 'on' : ''}" data-p="${g.id}">${g.icon} ${g.title}${titleOk(g.id) ? '(借りている)' : ''}</button>`).join('')}</div>` : ''}
          <div class="row"><button class="btn gold" data-coin ${need && picks.length !== need ? 'disabled' : ''}>🪙 で借りる</button></div>
          <div class="lbl" style="margin-top:16px">💳 お金で</div><div class="seg">
            <button class="tab" data-usd="month">1本を1か月 $${PRICE.usdMonth1}${picks[0] ? '(' + ALL.find(g => g.id === picks[0]).title + ')' : ''}</button>
            <button class="tab" data-usd="day">ぜんぶを1日 $${PRICE.usdDayAll}</button></div>
          ${!paid() ? `<p class="note">無料会員は、遊ぶ日に本体(🪙${PRICE.console})も借りてね。</p>` : '<p class="note">有料会員は本体が無料。</p>'}
          <div class="row"><button class="btn sub" data-x>もどる</button></div>`;
      };
      draw();
      s.onclick = e => {
        const m = e.target.closest('[data-m]'), p = e.target.closest('[data-p]'), coin = e.target.closest('[data-coin]'), usd = e.target.closest('[data-usd]');
        if (e.target.closest('[data-x]')) { s.remove(); home(); return; }
        if (m) { mode = m.dataset.m; picks = picks.slice(0, mode === 'one' ? 1 : 3); draw(); }
        if (p) { const id = p.dataset.p, max = mode === 'one' ? 1 : 3; picks = picks.includes(id) ? picks.filter(x => x !== id) : mode === 'one' ? [id] : picks.length < max ? [...picks, id] : picks; draw(); }
        if (coin) {
          const cost = mode === 'one' ? PRICE.title1 : mode === 'three' ? PRICE.title3 : PRICE.titleAll;
          if (!payCoins(cost)) { msg('コインがたりない', `あと 🪙${cost - ctx.wallet.get()}`); return; }
          const r = R(); if (mode === 'all') r.all = Math.max(r.all, endOfDay()); else picks.forEach(id => { r.titles[id] = Math.max(r.titles[id] || 0, endOfDay()); }); saveR(r);
          s.remove(); home(); msg('借りました!', 'きょう1日あそべます。' + (consoleOk() ? '' : `<br>本体(🪙${PRICE.console})も借りてね。`));
        }
        if (usd) {
          if (usd.dataset.usd === 'month') { if (!picks[0]) { msg('ソフトをえらんでね', '上で1本えらんでから'); return; } const id = picks[0]; payUsd('1本を1か月', () => { const r = R(); r.titles[id] = Math.max(r.titles[id] || 0, Date.now() + 30 * 864e5); saveR(r); s.remove(); home(); }); }
          else payUsd('ぜんぶを1日', () => { const r = R(); r.all = Math.max(r.all, endOfDay()); saveR(r); s.remove(); home(); });
        }
      };
    }

    // ================= 対戦の準備 =================
    function setup(G) {
      const saved = st.get('opt:' + G.id) || {};
      let opp = saved.opp || 'mii', opts = {};
      for (const o of G.options || []) opts[o.key] = saved[o.key] ?? o.def;
      const s = sheet('');
      const draw = () => {
        s.querySelector('.panel').innerHTML = `<h2>${G.icon} ${G.title}</h2><p class="note">${G.rule}</p>
          <div class="lbl">あいて</div><div class="seg">${CPUS.map(c => `<button class="tab ${opp === c.id ? 'on' : ''}" data-o="${c.id}">${c.icon} ${c.name}${'★'.repeat(c.lv)}</button>`).join('')}
            ${G.no2p ? '' : `<button class="tab ${opp === '2p' ? 'on' : ''}" data-o="2p">👥 2人で(1台を向かい合って)</button>`}</div>
          ${(G.options || []).filter(o => !o.only || o.only(opts, opp)).map(o => `<div class="lbl">${o.label}</div><div class="seg">${o.choices.map(([v, l]) => `<button class="tab ${opts[o.key] === v ? 'on' : ''}" data-k="${o.key}" data-v="${v}">${l}</button>`).join('')}</div>`).join('')}
          <div class="row"><button class="btn sub" data-x>もどる</button><button class="btn" data-go>${gateLabel(G)}</button></div>`;
      };
      draw();
      s.onclick = e => {
        const o = e.target.closest('[data-o]'), k = e.target.closest('[data-k]');
        if (e.target.closest('[data-x]')) { s.remove(); return; }
        if (o) { opp = o.dataset.o; sfx.play('tap'); draw(); }
        if (k) { const def = G.options.find(x => x.key === k.dataset.k); const raw = k.dataset.v; opts[k.dataset.k] = typeof def.def === 'number' ? +raw : raw; sfx.play('tap'); draw(); }
        if (e.target.closest('[data-go]')) {
          st.set('opt:' + G.id, { ...opts, opp });
          gate(G, trial => { s.remove(); play(G, opp, { ...opts, trial }); });
        }
      };
    }
    function gateLabel(G) {
      if (G.free) return 'はじめる!';
      if (G.en) return enLeft() > 0 ? 'はじめる!' : '本体を借りて はじめる';
      if (titleOk(G.id) && consoleOk()) return 'はじめる!';
      if (!R().trial.used) return 'お試しで あそぶ';
      return '借りて あそぶ';
    }
    // 遊べるか(必要なら借りる)。cb(trial)
    function gate(G, cb) {
      if (G.free) return cb(false);
      if (G.en) {
        if (enLeft() > 0) { if (!consoleOk()) { const r = R(); r.en.n++; saveR(r); } return cb(false); }
        return rentConsole(() => cb(false));
      }
      if (titleOk(G.id) && consoleOk()) return cb(false);
      if (titleOk(G.id)) return rentConsole(() => cb(false));
      const r = R();
      if (!r.trial.used) {
        const s = sheet(`<h2>お試しで あそぶ</h2><p class="note">お試しは1日1回(どれか1本)。短めの試合になります。<br>ちゃんと遊ぶときは、ソフトを借りてね${paid() ? '' : '(無料会員は本体も)'}。</p>
          <div class="row"><button class="btn sub" data-r>ソフトを借りる</button><button class="btn" data-t>お試しする</button></div>`);
        s.querySelector('[data-t]').onclick = () => { const r2 = R(); r2.trial.used = G.id; saveR(r2); s.remove(); cb(true); };
        s.querySelector('[data-r]').onclick = () => { s.remove(); rentTitles(G.id); };
        return;
      }
      rentTitles(G.id);
    }

    // ================= 試合 =================
    function play(G, opp, opts) {
      clear(); ctx.setTitle(G.title);
      const two = opp === '2p', cpu = two ? null : typeof opp === 'object' ? { id: 'npc', icon: '🙂', say: ['勝負だ!', 'やられた〜', 'へへっ'], lv: 2, ...opp } : cpuById(opp);   // opp は CPU の id か、町の住人 {name, lv}
      const me = { name: ctx.player?.name || 'あなた', icon: '🙂' };
      const players = [{ name: two ? 'プレイヤー1' : me.name, cpu: null, icon: '🙂' }, two ? { name: 'プレイヤー2', cpu: null, icon: '😎' } : { name: cpu.name, cpu, icon: cpu.icon }];
      const stage = document.createElement('div'); stage.className = 'stage'; root.appendChild(stage);
      const inner = document.createElement('div'); inner.className = 'in'; stage.appendChild(inner);   // スマホの下のバーにかからないように
      const quit = document.createElement('button'); quit.className = 'quit'; quit.textContent = '✕'; root.appendChild(quit);
      quit.onclick = () => { const s = sheet(`<h2>やめる?</h2><div class="row"><button class="btn sub" data-n>つづける</button><button class="btn" data-y>やめる</button></div>`); s.querySelector('[data-n]').onclick = () => s.remove(); s.querySelector('[data-y]').onclick = () => { s.remove(); home(); }; };
      const vs = document.createElement('div'); vs.className = 'vs';
      vs.innerHTML = `<div class="n ${two ? 'flipped' : ''}">${players[1].icon} ${players[1].name}</div><div class="x">VS</div><div class="n">${players[0].icon} ${players[0].name}</div>`;
      root.appendChild(vs); setTimeout(() => vs.remove(), 1700); sfx.play('whoosh');
      let done = false;
      const host = {
        box: inner, sfx, players, two, opts, dictUrl: ctx.dictUrl || P.dictUrl, season: P.season,
        end(res) {
          if (done) return; done = true;
          setTimeout(() => result(G, opp, opts, players, res), 900);
        },
      };
      setTimeout(() => { if (!stage.isConnected) return; cur = G.start(host); }, 1500);
    }
    function result(G, opp, opts, players, res) {
      const w = res.winner, two = opp === '2p';
      const title = w === -1 ? 'ひきわけ' : two ? `${players[w].name} のかち!` : w === 0 ? '🏆 かち!' : 'まけ…';
      sfx.play(w === 0 || (two && w >= 0) ? 'win' : w === 1 ? 'lose' : 'point');
      const cpu = players[1].cpu, line = cpu ? cpu.say[w === 1 ? 2 : w === 0 ? 1 : 0] : '';
      const box = document.createElement('div'); box.className = 'res';
      box.innerHTML = `<div class="box"><div class="big">${title}</div>
        ${res.score ? `<div style="font-size:22px;font-weight:900;margin:6px 0">${players[0].name} ${res.score[0]} - ${res.score[1]} ${players[1].name}</div>` : ''}
        ${res.text ? `<p class="note">${res.text}</p>` : ''}
        ${cpu ? `<p style="background:#fff;border-radius:14px;padding:8px;box-shadow:0 2px 8px #0001">${cpu.icon} ${cpu.name}「${line}」</p>` : ''}
        ${opts.trial ? '<p class="note">お試しはここまで。ソフトを借りると、ちゃんとした試合ができるよ。</p>' : ''}
        <div class="row"><button class="btn sub" data-m>えらびなおす</button>${opts.trial ? '<button class="btn gold" data-rent>ソフトを借りる</button>' : '<button class="btn" data-a>もう一回</button>'}</div></div>`;
      root.appendChild(box);
      box.querySelector('[data-m]').onclick = () => home();
      const a = box.querySelector('[data-a]'); if (a) a.onclick = () => gate(G, trial => play(G, opp, { ...opts, trial }));
      const rb = box.querySelector('[data-rent]'); if (rb) rb.onclick = () => { home(); rentTitles(G.id); };
    }

    if (P.game && P.npc) { const G = ALL.find(g => g.id === P.game); home(); if (G) { const o = {}; for (const x of G.options || []) o[x.key] = x.def; play(G, P.npc, o); } }   // 町で雪玉を当てた住人と、すぐ勝負
    else if (P.game) { const G = ALL.find(g => g.id === P.game); if (G) { home(); setup(G); } else home(); }
    else home();
    return { unmount() { clear(); sfx.close(); root.remove(); try { speechSynthesis.cancel(); } catch (e) { } } };
  },
};

// 雪合戦だけを開くアプリ(冬の町の広場から。ゲーム機なしで遊べる)
export const snowApp = {
  mount(el, ctx) { return gameboxApp.mount(el, { ...ctx, params: { ...(ctx.params || {}), game: 'snow', season: 'winter' } }); },
};
