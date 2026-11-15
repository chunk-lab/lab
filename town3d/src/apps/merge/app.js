// マージゲーム(2Dで完結)。町とつながるのは コイン・好感度・英語4択 だけ。
// 盤面 7×9。同じ品を重ねると次のLv。生成機をタップで品が出る(⚡1)。住人のほしい品をわたすと好感度。13人にわたすとチャンクくんのごほうび。
import { social, NPC_NAME, LV, LV_NAME } from '../../game/social.js';
import { portrait } from '../../ui/portraits.js';
import { CFG, LINES, GENS, RECIPES, NPCS, QUIZ_FB, IMG } from './data.js';

const CSS = `
.mg{position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#ffd2c0,#e2c4ff 55%,#b9d6ff);color:#4a3a5e;font-weight:800;user-select:none;-webkit-user-select:none;touch-action:none}
.mg *{box-sizing:border-box}
.mg-top{position:absolute;left:0;right:0;top:0;height:40px;display:flex;align-items:center;gap:5px;padding:0 6px;font-size:13px}
.mg-pill{background:#fff;border-radius:999px;padding:5px 9px;box-shadow:0 2px 0 #b79ad3;white-space:nowrap;display:flex;align-items:center;gap:3px}
.mg-pill small{font-size:10px;color:#8a76a6}
.mg-en b{min-width:24px;text-align:right;display:inline-block}
.mg-qb{border:0;font:inherit;font-size:12px;color:#fff;background:linear-gradient(160deg,#5fb8ff,#3a86e0);border-radius:999px;padding:6px 10px;box-shadow:0 2px 0 #2a63aa}
.mg-qb.need{animation:mgPulse .8s infinite}
.mg-qb.full{filter:grayscale(.7);opacity:.7}
.mg-strip{position:absolute;left:0;right:0;top:40px;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding:3px 6px;touch-action:pan-x;scrollbar-width:none;align-items:stretch}
.mg-strip::-webkit-scrollbar{display:none}
.mg-npc{flex:none;width:var(--cw,108px);height:calc(100% - 4px);margin-top:2px;background:#fff;border-radius:18px;box-shadow:0 3px 0 #a98cc9,0 0 0 2px #cdb6e6;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px 4px;gap:2px;overflow:visible}
.mg-npc img,.mg-npc .mg-np{width:var(--pz,64px);height:var(--pz,64px);border-radius:50%;object-fit:cover;object-position:top;background:#efe3fb;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 0 3px #e8d9f7}
.mg-nm{font-size:11px;line-height:1.1;text-align:center;white-space:nowrap}
.mg-hr{display:flex;align-items:center;gap:3px;font-size:9px;color:#d6457a;width:90%}
.mg-hr i{flex:1;height:7px;border-radius:5px;background:#f3dbe6;overflow:hidden;display:block}
.mg-hr i b{display:block;height:100%;background:linear-gradient(90deg,#ff9fb5,#ff5e8a);border-radius:5px;transition:width .6s}
.mg-ws{display:flex;gap:6px;margin-top:1px}
.mg-w{position:relative;width:var(--ws,36px);height:var(--ws,36px);border-radius:13px;background:var(--c,#f3ecfa);border:2px solid #7d62a0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--ws,36px)*.58);font-weight:400}
.mg-w img{width:80%;height:80%;object-fit:contain}
.mg-w i{position:absolute;right:-4px;bottom:-5px;font-style:normal;font-size:9px;line-height:12px;min-width:13px;text-align:center;background:#4a3a5e;color:#fff;border-radius:8px;padding:0 3px;font-weight:800}
.mg-w.rdy{border-color:#ff5e8a;box-shadow:0 0 0 3px #ffc2d3;animation:mgBob .6s infinite alternate}
.mg-w.got{opacity:.55;filter:grayscale(.5)}
.mg-w.got::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;color:#1f9d55;font-weight:900;text-shadow:0 0 3px #fff,0 0 3px #fff}
.mg-npc.ok{box-shadow:0 3px 0 #d6457a,0 0 0 3px #ff8fb0}
.mg-npc.ok::before{content:'わたせる!';position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#ff5e8a;color:#fff;font-size:10px;border-radius:9px;padding:1px 8px;white-space:nowrap;z-index:2;animation:mgPulse .7s infinite}
.mg-npc.hit{box-shadow:0 0 0 4px #3ecf86,0 3px 0 #1f9d55}
.mg-board{position:absolute;border-radius:14px;background:linear-gradient(180deg,#a98bd0,#8f70bd);box-shadow:inset 0 3px 8px rgba(60,30,90,.35),0 3px 0 #6b4f93}
.mg-cell{position:absolute;border-radius:9px;background:#e4d7f4;box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -2px 0 rgba(90,60,130,.18)}
.mg-cell.d{background:#d6c6ec}
.mg-it{position:absolute;left:0;top:0;transition:transform .16s cubic-bezier(.3,1.3,.5,1);will-change:transform;z-index:2;touch-action:none}
.mg-it.drag{transition:none;z-index:30}
.mg-it.fly{transition:none;z-index:25;pointer-events:none}
.mg-in{position:absolute;inset:2px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--c,#fff);box-shadow:0 0 0 2px rgba(60,35,85,.7),0 3px 0 2px rgba(60,35,85,.45),inset 0 3px 0 rgba(255,255,255,.65),inset 0 -4px 0 rgba(60,35,85,.12)}
.mg-in img{width:78%;height:78%;object-fit:contain;pointer-events:none}
.mg-e{font-weight:400;line-height:1;pointer-events:none}
.mg-lv{position:absolute;right:-1px;bottom:-2px;font-style:normal;font-size:10px;line-height:14px;min-width:15px;text-align:center;background:#4a3a5e;color:#fff;border-radius:8px;padding:0 3px;pointer-events:none;font-weight:800}
.mg-it.drag .mg-in{transform:scale(1.18);box-shadow:0 0 0 2px rgba(60,35,85,.7),0 12px 14px rgba(40,20,60,.4)}
.mg-it.sel .mg-in{box-shadow:0 0 0 3px #1e90ff,0 3px 0 3px rgba(30,100,200,.5)}
.mg-it.can .mg-in{animation:mgGlow .5s infinite alternate}
.mg-it.wig .mg-in{animation:mgWig .5s 2}
.mg-it.lk .mg-in{filter:grayscale(.85) brightness(.82);background:#9c8fb0;box-shadow:inset 0 0 0 2px #6e6086}
.mg-it.lk .mg-in::after{content:'🔒';position:absolute;left:-2px;top:-3px;font-size:12px}
.mg-gen .mg-in{inset:1px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff 0,var(--c) 58%,var(--d) 100%);box-shadow:0 0 0 3px #fff,0 0 0 6px var(--d),0 5px 0 6px rgba(40,20,60,.5),0 0 14px 6px var(--c);}
.mg-gen .mg-e{filter:drop-shadow(0 2px 0 rgba(0,0,0,.3));transform:translateY(-3px)}
.mg-gen .mg-lv{left:50%;right:auto;bottom:-7px;transform:translateX(-50%);background:var(--d);font-size:10px;padding:0 7px;white-space:nowrap;border:2px solid #fff;line-height:13px}
.mg-gen::before{content:'生成機';position:absolute;left:50%;top:-6px;transform:translateX(-50%);background:var(--d);color:#fff;font-size:9px;line-height:12px;padding:0 6px;border-radius:7px;z-index:3;border:1.5px solid #fff;white-space:nowrap;pointer-events:none}
.mg-ch{position:absolute;right:-2px;top:6px;font-size:9px;background:#fff;border-radius:7px;padding:0 4px;line-height:13px;color:#4a3a5e;pointer-events:none;text-decoration:none;box-shadow:0 1px 0 #0003}
.mg-gen.cd .mg-in{filter:grayscale(.55)}
.mg-gen.first .mg-in{animation:mgPulse .7s infinite}
.mg-gen.gl .mg-in{filter:grayscale(1) brightness(.75);animation:none}
.mg-gen.gl .mg-ch{background:#4a3a5e;color:#fff;right:auto;left:50%;transform:translateX(-50%);top:auto;bottom:11px;white-space:nowrap;font-size:9px}
.mg-gen.gl::after{content:'🔒';position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);font-size:20px;pointer-events:none}
.mg-part .mg-in{background:#dfe8f1;box-shadow:0 0 0 2px #5d7690,0 3px 0 2px rgba(60,80,110,.45);border-radius:6px}
.mg-part .mg-e2{position:absolute;left:1px;top:-1px;font-size:11px;font-weight:400}
.mg-info{position:absolute;left:6px;right:6px;height:28px;display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap;overflow:hidden}
.mg-info span{flex:1;overflow:hidden;text-overflow:ellipsis}
.mg-info button,.mg-ovl button{border:0;font:inherit;border-radius:999px;padding:5px 12px;background:#fff;color:#4a3a5e;box-shadow:0 2px 0 #b79ad3}
.mg-bot{position:absolute;left:0;right:0;bottom:0;height:56px;display:flex;align-items:center;gap:5px;padding:0 6px}
.mg-slots{flex:1;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;touch-action:pan-x;height:52px;align-items:center}
.mg-slot{flex:none;border-radius:10px;background:#f4ecfb;box-shadow:inset 0 0 0 2px #9a7fbd}
.mg-slot.add{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;color:#6a548a;line-height:1.2}
.mg-slot.add b{font-size:15px}
.mg-rb{flex:none;width:44px;height:48px;border:0;font:inherit;font-size:9px;border-radius:12px;background:#fff;box-shadow:0 2px 0 #b79ad3;color:#4a3a5e;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;line-height:1.2}
.mg-rb b{font-size:19px;font-weight:400}
.mg-rb em{position:absolute;right:-3px;top:-4px;background:#ff5e8a;color:#fff;font-style:normal;border-radius:9px;min-width:17px;line-height:17px;font-size:10px}
.mg-rb.hot{box-shadow:0 0 0 3px #ffc400;transform:scale(1.08)}
.mg-fx{position:absolute;inset:0;pointer-events:none;z-index:40;overflow:hidden}
.mg-p{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none}
.mg-ft{position:absolute;left:0;top:0;font-size:15px;color:#e8366a;text-shadow:0 1px 0 #fff,0 0 4px #fff,0 0 4px #fff;white-space:nowrap;pointer-events:none}
.mg-ban{position:absolute;left:50%;top:60px;transform:translateX(-50%);background:#fff;border-radius:999px;padding:7px 16px;font-size:13px;box-shadow:0 4px 14px rgba(60,30,90,.3);white-space:nowrap;pointer-events:none;border:2px solid #cdb6e6}
.mg-combo{position:absolute;right:10px;top:60px;font-size:22px;color:#ff8a1e;text-shadow:0 2px 0 #fff,0 0 6px #fff,0 0 6px #fff;pointer-events:none}
.mg-toast{position:absolute;left:50%;bottom:92px;transform:translateX(-50%);background:rgba(60,40,85,.94);color:#fff;border-radius:999px;padding:7px 14px;font-size:12px;white-space:nowrap;pointer-events:none;z-index:45;max-width:94%;overflow:hidden;text-overflow:ellipsis}
.mg-ovl{position:absolute;inset:0;background:rgba(50,30,75,.6);z-index:50;display:flex;align-items:center;justify-content:center;animation:mgFade .2s;touch-action:auto}
.mg-card{width:min(92%,360px);max-height:88%;overflow:auto;background:#fffaf5;border-radius:22px;padding:16px;box-shadow:0 12px 30px rgba(40,25,60,.4);animation:mgPop .28s cubic-bezier(.3,1.5,.5,1);text-align:center}
.mg-card h3{margin:0 0 8px;font-size:16px}
.mg-qw{font-size:30px;margin:10px 0 2px}
.mg-qs{font-size:12px;color:#8a76a6;min-height:16px}
.mg-qc{display:grid;gap:8px;margin:10px 0}
.mg-qc button{padding:12px 8px!important;font-size:15px;border-radius:14px!important}
.mg-qc button.ok{background:#3ecf86!important;color:#fff!important}
.mg-qc button.ng{background:#ff7d93!important;color:#fff!important}
.mg-bk{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin:4px 0 10px}
.mg-bk div{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:400;background:#e3d8ef;color:#a794c0}
.mg-bk div.on{background:var(--c)}
.mg-bkh{font-size:12px;text-align:left;margin-top:6px}
.mg-fin{position:absolute;inset:0;z-index:44;pointer-events:none;overflow:hidden}
.mg-ck{position:absolute;left:0;top:0;width:110px;height:110px;pointer-events:none;z-index:46}
.mg-ck img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 4px rgba(60,30,90,.3))}
@keyframes mgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes mgBob{from{transform:translateY(0)}to{transform:translateY(-3px)}}
@keyframes mgGlow{from{box-shadow:0 0 0 2px #ffc400,0 0 4px #ffc400}to{box-shadow:0 0 0 5px #ffc400,0 0 16px #ff9a1e}}
@keyframes mgWig{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg) scale(1.08)}75%{transform:rotate(9deg) scale(1.08)}}
@keyframes mgFade{from{opacity:0}to{opacity:1}}
@keyframes mgPop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
`;

const rnd = n => Math.floor(Math.random() * n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const N = CFG.cols * CFG.rows;

export function createMergeApp(env = {}) {
  return {
    mount(host, ctx) {
      if (!document.getElementById('mg-css')) { const st = document.createElement('style'); st.id = 'mg-css'; st.textContent = CSS; document.head.appendChild(st); }
      const sfx = (k, a) => { try { env.sfx && env.sfx(k, a); } catch (e) { } };
      const root = document.createElement('div'); root.className = 'mg';
      root.innerHTML = `<div class="mg-top"><div class="mg-pill mg-en">⚡<b>0</b><small></small></div><button class="mg-qb">✏️ 英語で回復</button><span style="flex:1"></span><div class="mg-pill mg-cy">👥 <b>0</b>/13</div><div class="mg-pill">🪙<b data-bind="coins">${Math.floor(ctx.wallet.get()).toLocaleString('ja-JP')}</b></div></div>
<div class="mg-strip"></div><div class="mg-board"></div><div class="mg-info"><span></span></div>
<div class="mg-bot"><div class="mg-slots"></div><button class="mg-rb mg-inb"><b>🎁</b>とどいた</button><button class="mg-rb mg-book"><b>📖</b>ずかん</button><button class="mg-rb mg-sell"><b>🪙</b>うる</button></div>
<div class="mg-fx"></div>`;
      host.appendChild(root);
      const $ = q => root.querySelector(q);
      const elStrip = $('.mg-strip'), elBoard = $('.mg-board'), elInfo = $('.mg-info'), elSlots = $('.mg-slots'), elFx = $('.mg-fx'), elEn = $('.mg-en'), elQb = $('.mg-qb'), elInb = $('.mg-inb'), elSell = $('.mg-sell');

      // ---- 状態 ----
      let S = null;
      const studySec = () => { try { return env.studySec ? env.studySec() : 0; } catch (e) { return 0; } };
      const genOpen = g => !!(S && S.unl[g]);
      const gain = () => Math.max(0, studySec() - (S ? S.base : 0));
      const shuf = a => a.sort(() => Math.random() - 0.5);
      try { S = ctx.storage.get('s'); } catch (e) { }
      if (!S || S.v !== 2 || !Array.isArray(S.cells) || S.cells.length !== N) S = fresh();
      S.cells.forEach((o, i) => { if (o) { o.b = i; o.s = null; } }); S.store.forEach((o, i) => { if (o) { o.s = i; o.b = null; } });
      let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { ctx.storage.set('s', S); } catch (e) { } }, 300); };
      function fresh() {
        const s = { v: 2, n: 0, cells: Array(N).fill(null), store: [], slots: CFG.slots0, en: CFG.enStart, enT: Date.now(), act: [], queue: shuf(NPCS.slice()), served: 0, cycle: 0, seen: {}, inbox: [], first: true, gave: 0, unl: { cafe: 1 }, base: 0, recent: [] };
        s.base = studySec();
        const ln = Object.keys(LINES), gk = Object.keys(GENS), at = (r, c) => r * CFG.cols + c;
        for (let r = 0; r < CFG.rows; r++) for (let c = 0; c < CFG.cols; c++) {
          if (r > 0 && r < CFG.rows - 1 && c > 0 && c < CFG.cols - 1) continue;
          const corner = (r === 0 || r === CFG.rows - 1) && (c === 0 || c === CFG.cols - 1);
          s.cells[at(r, c)] = { u: ++s.n, t: 'it', ln: ln[(r * 3 + c * 5) % ln.length], lv: corner ? 4 : 1 + (r * 7 + c * 3) % 3, lk: 1 };
        }
        [[0, 3], [8, 3], [4, 0], [4, 6]].forEach(([r, c], i) => { s.cells[at(r, c)] = { u: ++s.n, t: 'part', g: gk[i], lv: 1, lk: 1 }; });
        [[3, 2], [3, 4], [5, 2], [5, 4]].forEach(([r, c], i) => { s.cells[at(r, c)] = { u: ++s.n, t: 'gen', g: gk[i], lv: 1, ch: CFG.genCharge(1), cd: 0 }; });
        return s;
      }
      // 住人がほしがる品(2つ)。使える生成機のラインから出す
      function newWants(cycle = S.cycle) {
        const pool = Object.keys(LINES).filter(ln => Object.keys(GENS).some(g => genOpen(g) && GENS[g].lines.includes(ln))), out = [];
        shuf(pool.slice()).slice(0, CFG.wants).forEach(ln => { const L = LINES[ln], top = Math.min(7, (L.mergeMax || L.items.length) - 1); out.push({ ln, lv: Math.max(2, Math.min(top, CFG.orderLv(cycle) - 1 + rnd(3))), got: false }); });
        return out;
      }
      function fillAct(cycle) { while (S.act.length < CFG.vis && S.queue.length) { const id = S.queue.shift(); if (S.act.some(a => a.id === id)) continue; S.act.push({ id, w: newWants(cycle) }); } }
      if (!S.act.length && S.queue.length) fillAct();
      const defOf = o => o.t === 'it' ? { name: LINES[o.ln].items[o.lv - 1][0], icon: LINES[o.ln].items[o.lv - 1][1], color: LINES[o.ln].color, key: o.ln + o.lv }
        : o.t === 'gen' ? { name: GENS[o.g].name, icon: GENS[o.g].icon, color: GENS[o.g].color, key: 'gen_' + o.g }
          : { name: GENS[o.g].name + 'のパーツ', icon: '⚙️', color: '#dfe8f1', key: 'part_' + o.g };
      const art = (d, cls = 'mg-e') => IMG[d.key] ? `<img src="${IMG[d.key]}" alt="">` : `<b class="${cls}">${d.icon}</b>`;
      const is = (o, p) => o.t === 'it' && o.ln === p[0] && o.lv === p[1];
      function mergeOf(a, b) {
        if (!a || !b || a === b || a.lk || a.t !== b.t) return null;   // ロック品(b)には、同じものを重ねられる(ひらく)
        if (a.t === 'gen' && (a.gl || b.gl)) return null;
        if (a.t === 'it') {
          if (a.ln === b.ln && a.lv === b.lv) { const L = LINES[a.ln]; return a.lv < (L.mergeMax || L.items.length) ? { t: 'it', ln: a.ln, lv: a.lv + 1 } : null; }
          for (const r of RECIPES) if ((is(a, r.a) && is(b, r.b)) || (is(a, r.b) && is(b, r.a))) return { t: 'it', ln: r.out[0], lv: r.out[1] };
          return null;
        }
        if (a.g !== b.g || a.lv !== b.lv) return null;
        if (a.t === 'gen') return a.lv < CFG.genMax ? { t: 'gen', g: a.g, lv: a.lv + 1, ch: CFG.genCharge(a.lv + 1), cd: 0 } : null;
        return a.lv < CFG.partMax ? { t: 'part', g: a.g, lv: a.lv + 1 } : { t: 'gen', g: a.g, lv: 1, ch: CFG.genCharge(1), cd: 0 };
      }

      // ---- 配置(画面いっぱいに) ----
      let CS = 48, BX = 0, BY = 0, SH = 130, slotPos = [], alive = true;
      const els = new Map();
      function layout() {
        const W = root.clientWidth, H = root.clientHeight; if (!W || !H) return;
        const TOP = 40, INFO = 24, BOT = 56, MINS = 132;
        CS = Math.floor(Math.min((W - 8) / CFG.cols, (H - TOP - INFO - BOT - MINS - 10) / CFG.rows));
        const bw = CS * CFG.cols + 8, bh = CS * CFG.rows + 8;
        SH = Math.max(MINS, Math.min(210, H - TOP - bh - INFO - BOT - 4));
        BX = Math.round((W - bw) / 2) + 4; BY = TOP + SH + 4 + 4;
        elStrip.style.height = SH + 'px';
        const ws = SH >= 170 ? 38 : 34, cw = Math.max(92, Math.min(120, Math.round(W / 3.4))), pz = Math.max(38, Math.min(92, SH - ws - 62));
        elStrip.style.setProperty('--cw', cw + 'px'); elStrip.style.setProperty('--pz', pz + 'px'); elStrip.style.setProperty('--ws', ws + 'px');
        elBoard.style.cssText = `left:${BX - 4}px;top:${BY - 4}px;width:${bw}px;height:${bh}px`;
        if (!elBoard.children.length) for (let i = 0; i < N; i++) { const c = document.createElement('div'); c.className = 'mg-cell' + ((i + Math.floor(i / CFG.cols) * (CFG.cols % 2 ? 0 : 1)) % 2 ? ' d' : ''); elBoard.appendChild(c); }
        [...elBoard.children].forEach((c, i) => { c.style.cssText = `left:${4 + (i % CFG.cols) * CS + 1}px;top:${4 + Math.floor(i / CFG.cols) * CS + 1}px;width:${CS - 2}px;height:${CS - 2}px`; });
        elInfo.style.top = (BY + bh - 4) + 'px';
        drawSlots(); els.forEach((el, u) => { const o = byU(u); if (o) { size(el); moveEl(o, false); } });
      }
      const byU = u => S.cells.find(o => o && o.u === u) || S.store.find(o => o && o.u === u);
      const size = el => { el.style.width = el.style.height = CS + 'px'; const e = el.querySelector('.mg-e'); if (e) e.style.fontSize = Math.round(CS * (el.classList.contains('mg-gen') ? 0.5 : 0.56)) + 'px'; };
      function drawSlots() {
        const z = Math.min(46, CS); elSlots.innerHTML = '';
        for (let i = 0; i < S.slots; i++) { const d = document.createElement('div'); d.className = 'mg-slot'; d.dataset.slot = i; d.style.cssText = `width:${z}px;height:${z}px`; elSlots.appendChild(d); }
        if (S.slots < CFG.slotsMax) { const d = document.createElement('div'); d.className = 'mg-slot add'; d.style.cssText = `width:${z}px;height:${z}px`; d.innerHTML = `<b>＋</b>🪙${CFG.slotPrice(S.slots)}`; d.onclick = buySlot; elSlots.appendChild(d); }
        readSlots();
      }
      function readSlots() { const R = root.getBoundingClientRect(); slotPos = [...elSlots.querySelectorAll('[data-slot]')].map(d => { const r = d.getBoundingClientRect(); return { x: r.left - R.left + (r.width - CS) / 2, y: r.top - R.top + (r.height - CS) / 2 }; }); }
      const posOf = o => o.b != null ? { x: BX + (o.b % CFG.cols) * CS, y: BY + Math.floor(o.b / CFG.cols) * CS } : (slotPos[o.s] || { x: 0, y: -200 });
      const tf = (el, x, y) => { el.style.transform = `translate(${x}px,${y}px)`; };
      function moveEl(o, anim = true) { const el = els.get(o.u); if (!el) return; const p = posOf(o); if (!anim) { el.style.transition = 'none'; tf(el, p.x, p.y); void el.offsetWidth; el.style.transition = ''; } else tf(el, p.x, p.y); }
      function mk(o) {
        const d = defOf(o), el = document.createElement('div');
        el.className = 'mg-it' + (o.t === 'gen' ? ' mg-gen' : o.t === 'part' ? ' mg-part' : '') + (o.lk ? ' lk' : ''); el.dataset.u = o.u;
        const gd = o.t === 'gen' ? GENS[o.g] : null;
        el.innerHTML = `<div class="mg-in" style="--c:${d.color};${gd ? `--d:${gd.dark}` : ''}">${art(d)}${o.t === 'part' ? `<b class="mg-e2">${GENS[o.g].icon}</b>` : ''}<i class="mg-lv">${o.t === 'gen' ? 'Lv ' : ''}${o.lv}</i>${o.t === 'gen' ? '<u class="mg-ch"></u>' : ''}</div>`;
        if (gd) el.style.setProperty('--d', gd.dark);
        size(el); root.insertBefore(el, elFx); els.set(o.u, el); moveEl(o, false); if (o.t === 'gen') genUI(o); return el;
      }
      function rm(o) { const el = els.get(o.u); if (el) { el.remove(); els.delete(o.u); } }
      function take(o) { if (o.b != null) S.cells[o.b] = null; if (o.s != null) S.store[o.s] = null; o.b = o.s = null; }
      function put(o, loc, anim = true) { take(o); if (loc.b != null) { S.cells[loc.b] = o; o.b = loc.b; } else { S.store[loc.s] = o; o.s = loc.s; } moveEl(o, anim); }
      const leftMin = g => Math.max(1, Math.ceil((CFG.genUnlock[g] - gain()) / 60));
      function genUI(o) {
        const el = els.get(o.u); if (!el) return; const now = Date.now();
        o.gl = !genOpen(o.g); el.classList.toggle('gl', o.gl);
        if (o.gl) { el.querySelector('.mg-ch').textContent = `📚あと${leftMin(o.g)}分`; return; }
        if (o.cd && now >= o.cd) { o.cd = 0; o.ch = CFG.genCharge(o.lv); pop(el); }
        const left = o.cd ? Math.ceil((o.cd - now) / 1000) : 0;
        el.classList.toggle('cd', !!o.cd); el.querySelector('.mg-ch').textContent = o.cd ? `⏳${left}` : `⚡${o.ch}回`;
      }
      const center = o => { const p = posOf(o); return { x: p.x + CS / 2, y: p.y + CS / 2 }; };
      function checkUnlock(first) {
        Object.keys(CFG.genUnlock).forEach(g => {
          if (!S.unl[g] && gain() >= CFG.genUnlock[g]) {
            S.unl[g] = 1; save();
            S.cells.forEach(o => { if (o && o.t === 'gen' && o.g === g) { genUI(o); const c = center(o); setTimeout(() => { burst(c.x, c.y, 18, ['#ffd36b', '#fff', GENS[g].color]); sfx('unlock'); toast(`${GENS[g].icon} ${GENS[g].name}が 使えるようになった! (ほかの勉強ありがとう)`); pop(els.get(o.u), 1.4); }, first ? 900 : 0); } });
          }
        });
      }

      // ---- 演出 ----
      const pop = (el, k = 1.25) => { const i = el && el.querySelector('.mg-in'); i && i.animate([{ transform: `scale(${k})` }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' }); };
      const shake = el => { const i = el.querySelector('.mg-in') || el; i.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 240 }); };
      function burst(x, y, n = 10, colors = ['#ffc400', '#ff6f91', '#4cb8ff', '#fff']) {
        for (let i = 0; i < n; i++) {
          const p = document.createElement('div'), a = Math.random() * 6.28, d = CS * (0.5 + Math.random() * 0.8), z = 4 + rnd(6);
          p.className = 'mg-p'; p.style.cssText = `width:${z}px;height:${z}px;background:${colors[i % colors.length]}`; elFx.appendChild(p);
          p.animate([{ transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d + 8}px) scale(.2)`, opacity: 0 }], { duration: 420 + rnd(200), easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => p.remove();
        }
        const ring = document.createElement('div'); ring.className = 'mg-p'; ring.style.cssText = `width:${CS}px;height:${CS}px;border:3px solid #fff;background:none`; elFx.appendChild(ring);
        ring.animate([{ transform: `translate(${x - CS / 2}px,${y - CS / 2}px) scale(.4)`, opacity: .9 }, { transform: `translate(${x - CS / 2}px,${y - CS / 2}px) scale(1.7)`, opacity: 0 }], { duration: 380, easing: 'ease-out' }).onfinish = () => ring.remove();
      }
      function ftext(x, y, t, color, big) {
        const e = document.createElement('div'); e.className = 'mg-ft'; e.textContent = t; if (color) e.style.color = color; if (big) e.style.fontSize = '22px'; elFx.appendChild(e);
        e.animate([{ transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.6)`, opacity: 0 }, { transform: `translate(${x}px,${y - 16}px) translate(-50%,-50%) scale(1.15)`, opacity: 1, offset: .25 }, { transform: `translate(${x}px,${y - 50}px) translate(-50%,-50%) scale(1)`, opacity: 0 }], { duration: 1000, easing: 'ease-out' }).onfinish = () => e.remove();
      }
      function fly(html, from, to, ms = 480, done) {
        const e = document.createElement('div'); e.className = 'mg-ft'; e.style.fontSize = Math.round(CS * 0.55) + 'px'; e.style.fontWeight = '400'; e.innerHTML = html; elFx.appendChild(e);
        const mx = (from.x + to.x) / 2, my = Math.min(from.y, to.y) - 50;
        e.animate([{ transform: `translate(${from.x}px,${from.y}px) translate(-50%,-50%) scale(1)` }, { transform: `translate(${mx}px,${my}px) translate(-50%,-50%) scale(1.25)`, offset: .5 }, { transform: `translate(${to.x}px,${to.y}px) translate(-50%,-50%) scale(.6)` }], { duration: ms, easing: 'ease-in-out' }).onfinish = () => { e.remove(); done && done(); };
      }
      let banT = 0;
      function banner(html) { root.querySelector('.mg-ban')?.remove(); const b = document.createElement('div'); b.className = 'mg-ban'; b.innerHTML = html; elFx.appendChild(b); b.animate([{ opacity: 0, marginTop: '-14px' }, { opacity: 1, marginTop: '0' }], { duration: 220 }); clearTimeout(banT); banT = setTimeout(() => { b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => b.remove(); }, 2000); }
      let toastT = 0;
      function toast(t) { root.querySelector('.mg-toast')?.remove(); const e = document.createElement('div'); e.className = 'mg-toast'; e.textContent = t; root.appendChild(e); clearTimeout(toastT); toastT = setTimeout(() => e.remove(), 2400); }
      const rel = el => { const r = el.getBoundingClientRect(), R = root.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2 }; };

      // ---- エネルギー(上限100) ----
      function enTick() {
        const now = Date.now(), step = CFG.regenSec * 1000;
        if (S.en >= CFG.enMax) S.enT = now; else while (now - S.enT >= step && S.en < CFG.enMax) { S.en++; S.enT += step; }
        const left = S.en >= CFG.enMax ? 'MAX' : (() => { const s = Math.ceil((step - (now - S.enT)) / 1000); return `+1 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; })();
        elEn.querySelector('b').textContent = S.en; elEn.querySelector('small').textContent = left; elQb.classList.toggle('need', S.en <= 0); elQb.classList.toggle('full', S.en >= CFG.enMax);
      }
      function addEn(n, from) { const g = Math.min(n, CFG.enMax - S.en); if (g <= 0) return 0; S.en += g; enTick(); save(); if (from) fly('⚡', from, rel(elEn), 420, () => pop2(elEn)); else pop2(elEn); return g; }
      const pop2 = el => el.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 220 });

      // ---- 生成 ----
      function nearestEmpty(i) {
        const r0 = Math.floor(i / CFG.cols), c0 = i % CFG.cols; let best = -1, bd = 1e9;
        for (let k = 0; k < N; k++) if (!S.cells[k]) { const d = Math.hypot(Math.floor(k / CFG.cols) - r0, (k % CFG.cols) - c0) + Math.random() * 0.3; if (d < bd) { bd = d; best = k; } }
        return best;
      }
      function spawn(g) {
        const el = els.get(g.u); idle = 0;
        if (g.gl) { shake(el); sfx('bad'); const m = leftMin(g.g); toast(`${GENS[g.g].icon}${GENS[g.g].name}は ロック中。ほかの勉強(カード・学校・図書館・英語のおしゃべり…)をあと${m}分すると使えるよ`); return; }
        if (g.cd) { shake(el); sfx('bad'); toast(`${GENS[g.g].name}は ひとやすみ中(あと${Math.ceil((g.cd - Date.now()) / 1000)}秒)`); return; }
        if (S.en <= 0) { shake(el); sfx('bad'); toast('⚡エネルギーがないよ。英語で回復しよう!'); pop2(elQb); return; }
        const to = nearestEmpty(g.b); if (to < 0) { shake(el); sfx('bad'); toast('盤面がいっぱい! 重ねるか、売るか、保管しよう'); return; }
        S.en--; g.ch--; if (g.ch <= 0) g.cd = Date.now() + CFG.genRecharge * 1000; S.first = false; root.querySelectorAll('.first').forEach(e => e.classList.remove('first'));
        const top = CFG.spawnTop(g.lv), r = CFG.spawnR(g.lv); let w = [], sum = 0; for (let l = 1; l <= top; l++) { w.push(Math.pow(r, l - 1)); sum += w[l - 1]; }
        let x = Math.random() * sum, lv = 1; for (let l = 0; l < top; l++) { x -= w[l]; if (x <= 0) { lv = l + 1; break; } }
        const o = { u: ++S.n, t: 'it', ln: GENS[g.g].lines[rnd(2)], lv, b: null, s: null };
        dropIn(o, to, center(g)); pop(el, 1.15); sfx('pop'); const c = center(g); ftext(c.x, c.y - CS * 0.4, '⚡-1', '#2a7ae0'); enTick(); genUI(g); see(o); save(); refresh();
      }
      function dropIn(o, to, from) {
        S.cells[to] = o; o.b = to; o.s = null; const el = mk(o), p = posOf(o), fx = from.x - CS / 2, fy = from.y - CS / 2;
        el.classList.add('fly');
        el.animate([{ transform: `translate(${fx}px,${fy}px) scale(.3)` }, { transform: `translate(${(fx + p.x) / 2}px,${Math.min(fy, p.y) - CS * 0.7}px) scale(1.15)`, offset: .55 }, { transform: `translate(${p.x}px,${p.y}px) scale(1)` }], { duration: 300, easing: 'ease-out' }).onfinish = () => { el.classList.remove('fly'); pop(el, 1.2); };
      }
      function see(o) {
        const d = defOf(o); if (o.t !== 'it' || S.seen[d.key]) return; S.seen[d.key] = 1;
        if (o.lv >= 3) { const c = CFG.newCoin(o.lv), got = ctx.wallet.give(c, 'merge:new'); banner(`✨ NEW! ${d.icon} ${esc(d.name)} <small>🪙+${got}</small>`); sfx('new'); }
      }

      // ---- マージ ----
      let combo = 0, comboT = 0;
      function doMerge(a, b, res) {
        const idx = b.b, wasLk = b.lk, ea = els.get(a.u), eb = els.get(b.u), c = center(b);
        take(a); take(b); els.delete(a.u); els.delete(b.u);
        ea.classList.remove('drag', 'sel'); ea.classList.add('fly'); tf(ea, c.x - CS / 2, c.y - CS / 2);
        [ea, eb].forEach(e => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' }).onfinish = () => e.remove());
        const o = { u: ++S.n, ...res, b: null, s: null }; S.cells[idx] = o; o.b = idx; const el = mk(o);
        el.querySelector('.mg-in').animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.35)' }, { transform: 'scale(.9)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
        burst(c.x, c.y, 8 + Math.min(10, o.lv * 2), wasLk ? ['#9c8fb0', '#fff', '#ffc400'] : undefined);
        sfx(o.t === 'gen' ? 'gen' : wasLk ? 'unlock' : 'merge', o.lv);
        ftext(c.x, c.y - CS * 0.3, o.t === 'gen' && res.lv === 1 ? '生成機ができた!' : `Lv.${o.lv}`, '#e87a00');
        const now = Date.now(); combo = now - comboT < CFG.comboSec * 1000 ? combo + 1 : 1; comboT = now;
        if (combo >= 3) { root.querySelector('.mg-combo')?.remove(); const e = document.createElement('div'); e.className = 'mg-combo'; e.textContent = `${combo}コンボ!`; elFx.appendChild(e); e.animate([{ transform: 'scale(.5) rotate(-8deg)', opacity: 0 }, { transform: 'scale(1.2) rotate(4deg)', opacity: 1, offset: .3 }, { transform: 'scale(1)', opacity: 1, offset: .8 }, { transform: 'scale(1)', opacity: 0 }], { duration: 1100 }).onfinish = () => e.remove(); sfx('combo', combo); }
        if (combo > 0 && combo % CFG.comboEnergy === 0) addEn(1, c);
        see(o); sel = null; save(); refresh();
      }

      // ---- 住人(最大7人。1人2つ。ひとつでもそろった人は先頭へ) ----
      const findW = w => S.cells.find(o => o && !o.lk && o.t === 'it' && o.ln === w.ln && o.lv === w.lv);
      const scoreOf = a => a.w.filter(w => !w.got && findW(w)).length * 10 + a.w.filter(w => w.got).length * 6;
      const sorted = () => S.act.map((a, i) => ({ a, i, sc: scoreOf(a) })).sort((x, y) => y.sc - x.sc || x.i - y.i).map(x => x.a);
      let sig = '', leavingN = 0;
      function gaugeOf(id) { const a = social.aff(id), l = social.level(id), lo = LV[l], hi = LV[l + 1]; return { name: LV_NAME[l] || '', pct: hi == null ? 100 : Math.max(4, Math.round((a - lo) / (hi - lo) * 100)), l }; }
      function cardHtml(a) {
        const id = a.id, pic = portrait(id), g = gaugeOf(id);
        return `<div class="mg-npc" data-npc="${id}"><div style="position:relative">${pic ? `<img src="${pic}" alt="">` : `<div class="mg-np">${esc((NPC_NAME[id] || id).slice(0, 2))}</div>`}</div><div class="mg-nm">${esc(NPC_NAME[id] || id)}</div><div class="mg-hr">💗<i><b style="width:${g.pct}%"></b></i></div><div class="mg-ws">${a.w.map((w, k) => { const d = defOf({ t: 'it', ln: w.ln, lv: w.lv }); return `<div class="mg-w" data-w="${k}" style="--c:${d.color}">${art(d, 'mg-we')}<i>${w.lv}</i></div>`; }).join('')}</div></div>`;
      }
      function drawStrip(flip) {
        const old = {}; if (flip) elStrip.querySelectorAll('[data-npc]').forEach(c => { old[c.dataset.npc] = c.getBoundingClientRect().left; });
        const list = sorted(), first0 = elStrip.querySelector('[data-npc]')?.dataset.npc;
        elStrip.innerHTML = list.map(cardHtml).join('');
        elStrip.querySelectorAll('.mg-w').forEach(e => { const k = +e.dataset.w, id = e.closest('[data-npc]').dataset.npc, a = S.act.find(x => x.id === id); if (a && a.w[k].got) e.classList.add('got'); else if (a && findW(a.w[k])) e.classList.add('rdy'); });
        elStrip.querySelectorAll('[data-npc]').forEach(c => { const a = S.act.find(x => x.id === c.dataset.npc); c.classList.toggle('ok', !!a && a.w.some(w => !w.got && findW(w))); const nl = c.querySelector('.mg-hr'); if (nl) nl.title = gaugeOf(a.id).name; });
        if (flip) elStrip.querySelectorAll('[data-npc]').forEach(c => { const o = old[c.dataset.npc]; if (o == null) { c.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' }); } else { const d = o - c.getBoundingClientRect().left; if (Math.abs(d) > 2) c.animate([{ transform: `translateX(${d}px)` }, { transform: 'translateX(0)' }], { duration: 380, easing: 'cubic-bezier(.3,1.2,.5,1)' }); } });
        if (list[0] && first0 !== list[0].id) elStrip.scrollTo({ left: 0, behavior: 'smooth' });
        $('.mg-cy b').textContent = S.served;
      }
      function refresh() {
        const sg = sorted().map(a => a.id + ':' + a.w.map(w => (w.got ? 2 : findW(w) ? 1 : 0)).join('')).join('|');
        if (sg !== sig && !leavingN) { const flip = !!sig; sig = sg; drawStrip(flip); }
        elInb.querySelector('em')?.remove(); if (S.inbox.length) { const e = document.createElement('em'); e.textContent = S.inbox.length; elInb.appendChild(e); }
        info();
      }
      function deliver(id, k, o) {
        const a = S.act.find(x => x.id === id), w = a && a.w[k], card = elStrip.querySelector(`[data-npc="${id}"]`); if (!w || w.got || !card) return;
        const slot = card.querySelector(`[data-w="${k}"]`), d = defOf(o), from = center(o);
        take(o); rm(o); sel = null; w.got = true; sfx('give');
        card.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        setTimeout(() => fly(art(d), from, rel(slot), 440, () => {
          const to = rel(slot); burst(to.x, to.y, 12, ['#ff6f91', '#ffc400', '#fff']);
          const n = CFG.affOf(w.lv); let up = null; try { up = social.addAff(id, n); } catch (e) { }
          const got = ctx.wallet.give(CFG.coinOf(w.lv), 'merge:give'); sfx('heart'); S.gave++;
          ftext(to.x, to.y - 10, `💗 好感度 +${n}`, '#e8366a', true);
          ['💗', '💕', '💗'].forEach((h, i) => setTimeout(() => ftext(to.x + (i - 1) * 22, to.y + 14, h), 120 + i * 120));
          const gf = card.querySelector('.mg-hr b'); if (gf) { const g = gaugeOf(id); gf.style.width = g.pct + '%'; }
          card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 320 });
          slot.classList.remove('rdy'); slot.classList.add('got');
          banner(`${esc(NPC_NAME[id] || id)}「ありがとう!」 <small>💗+${n} 🪙+${got}</small>` + (up && up.up ? ` <small>✨なかよし度アップ!</small>` : ''));
          if (Math.random() < CFG.partChance) { const gk = Object.keys(GENS); S.inbox.push({ t: 'part', g: gk[rnd(gk.length)], lv: 1 }); setTimeout(() => { fly('⚙️', to, rel(elInb), 520, () => pop2(elInb)); toast('生成機のパーツをもらった!(🎁とどいた から出せるよ)'); refresh(); }, 500); }
          save();
          if (a.w.every(x => x.got)) { if (!a.leaving) { a.leaving = true; setTimeout(() => leave(id), 650); } } else { sig = ''; refresh(); }
        }), 60);
      }
      function leave(id) {   // 2つそろった人は、よろこんで帰り、あたらしい人が来る
        const c = elStrip.querySelector(`[data-npc="${id}"]`), ai = S.act.findIndex(x => x.id === id); if (ai < 0) return;
        leavingN++;
        const done = () => {
          leavingN = Math.max(0, leavingN - 1); const ix = S.act.findIndex(x => x.id === id); if (ix < 0) return; S.act.splice(ix, 1); S.served++; fillAct(); sig = ''; save();
          $('.mg-cy b').textContent = S.served; refresh();
          if (!S.act.length && !S.queue.length) setTimeout(finale, 700);
        };
        if (c) { const r = rel(c); burst(r.x, r.y, 14, ['#ffc400', '#ff6f91', '#fff', '#3ecf86']); sfx('coin'); c.animate([{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: 'translateY(-14px) scale(1.12)', opacity: 1, offset: .35 }, { transform: 'translateY(-40px) scale(.5)', opacity: 0 }], { duration: 520, easing: 'ease-in', fill: 'forwards' }); setTimeout(done, 540); } else done();
      }
      function npcTap(id, k) {
        const a = S.act.find(x => x.id === id); if (!a) return;
        const ready = a.w.map((w, i) => ({ w, i, o: w.got ? null : findW(w) })).filter(x => x.o);
        if (k != null && a.w[k] && !a.w[k].got) { const o = findW(a.w[k]); if (o) { deliver(id, k, o); return; } }
        if (ready.length) { ready.forEach((x, n) => setTimeout(() => { const o = findW(x.w); if (o) deliver(id, x.i, o); }, n * 350)); return; }
        const w = a.w.find(x => !x.got); if (!w) return; sfx('tap');
        const d = defOf({ t: 'it', ln: w.ln, lv: w.lv }), gk = Object.keys(GENS).find(g => GENS[g].lines.includes(w.ln));
        toast(`${NPC_NAME[id] || id}は「${d.name}」(Lv${w.lv})がほしい → ${GENS[gk].icon}${GENS[gk].name}${genOpen(gk) ? '' : '(ロック中)'}`);
        S.cells.forEach(x => { if (x && x.t === 'gen' && x.g === gk) { const e = els.get(x.u); e.classList.remove('wig'); void e.offsetWidth; e.classList.add('wig'); } });
      }

      // ---- 13人完了: チャンクくんが画面を飛んで、次の周に必要な素材を運んでくる ----
      let finBusy = false;
      function finale() {
        if (!alive || finBusy) return; finBusy = true;
        const coin = CFG.cycleCoin(S.cycle), pic = portrait('chunkkun'), W = root.clientWidth, H = root.clientHeight;
        // 周をすすめて、つぎの住人とほしい品を先に決める → いちばん素材がかかる(Lvの高い)ほしい品のラインを優先して、低〜中Lvの素材を運ぶ
        S.cycle++; S.served = 0; S.queue = shuf(NPCS.slice()); S.act = []; fillAct(S.cycle); sig = '';
        const wants = S.act.flatMap(a => a.w).sort((x, y) => y.lv - x.lv), gifts = [];
        for (let i = 0; i < CFG.giftN; i++) { const w = wants[i % Math.max(1, wants.length)]; if (!w) break; gifts.push({ t: 'it', ln: w.ln, lv: Math.max(CFG.giftMin, Math.min(CFG.giftMax, w.lv - 1 - (i >= wants.length ? 1 : 0))) }); }
        ctx.wallet.give(coin, 'merge:cycle'); save();
        const f = document.createElement('div'); f.className = 'mg-fin'; root.appendChild(f);
        const ck = document.createElement('div'); ck.className = 'mg-ck'; ck.innerHTML = pic ? `<img src="${pic}" alt="">` : '<b style="font-size:70px;font-weight:400">☁️</b>'; root.appendChild(ck);
        banner(`🎉 13人ぜんいんに わたせた! <small>🪙+${coin}</small>`); sfx('fanfare');
        const y0 = BY + CS * 2.2, amp = CS * 1.5, x0 = -130, x1 = W + 40, T = 6200;
        const path = t => ({ x: x0 + (x1 - x0) * t, y: y0 + Math.sin(t * Math.PI * 3.2) * amp + Math.sin(t * 9) * 8 });
        const t0 = performance.now(); let gi = 0, drop = 0.14;
        const frame = now => {
          if (!alive || !ck.isConnected) return;
          const t = Math.min(1, (now - t0) / T), p = path(t), q = path(Math.min(1, t + 0.01));
          ck.style.transform = `translate(${p.x - 55}px,${p.y - 55}px) rotate(${Math.max(-14, Math.min(14, (q.y - p.y) * 1.4))}deg) scale(${1 + Math.sin(now / 120) * 0.04})`;
          if (gi < gifts.length && t >= drop) {
            const to = nearestEmpty(Math.floor(N / 2)); drop += 0.8 / gifts.length;
            if (to >= 0) { const o = { u: ++S.n, ...gifts[gi], b: null, s: null }; dropIn(o, to, { x: p.x, y: p.y + 30 }); sfx('pop'); see(o); sparkle(p.x, p.y); }
            gi++;
          }
          if (t < 1) requestAnimationFrame(frame); else { ck.remove(); f.remove(); finBusy = false; sfx('fanfare2'); toast(`チャンクくんが つぎの ${S.cycle + 1}しゅう目の 素材を くばっていったよ!`); drawStrip(true); refresh(); save(); }
        };
        requestAnimationFrame(frame);
      }
      function sparkle(x, y) { for (let i = 0; i < 5; i++) { const p = document.createElement('div'); p.className = 'mg-p'; p.style.cssText = 'width:6px;height:6px;background:#ffd36b'; elFx.appendChild(p); p.animate([{ transform: `translate(${x}px,${y}px)`, opacity: 1 }, { transform: `translate(${x + rnd(60) - 30}px,${y + 20 + rnd(40)}px)`, opacity: 0 }], { duration: 600 }).onfinish = () => p.remove(); } }

      // ---- 売る・保管・とどいた・ずかん ----
      const priceOf = o => o.t === 'it' ? CFG.sell[o.lv - 1] || 1 : CFG.partSell * o.lv;
      function sell(o) {
        if (o.t === 'gen' || o.lk) { sfx('bad'); toast(o.lk ? 'ロック中は売れないよ' : '生成機は売れないよ'); moveEl(o); return; }
        const c = rel(els.get(o.u)), got = ctx.wallet.give(priceOf(o), 'merge:sell'); take(o); rm(o); sel = null;
        fly('🪙', c, rel(root.querySelector('[data-bind="coins"]')), 520); ftext(rel(elSell).x, rel(elSell).y - 30, `🪙+${got}`, '#d68600'); sfx('sell'); save(); refresh();
      }
      function buySlot() {
        const p = CFG.slotPrice(S.slots); if (ctx.wallet.get() < p) { sfx('bad'); toast(`コインが足りないよ(🪙${p})`); return; }
        if (!ctx.wallet.spend(p, 'merge:slot')) return; S.slots++; sfx('unlock'); drawSlots(); save(); toast('保管枠が ふえた!');
      }
      elInb.onclick = () => {
        if (!S.inbox.length) { sfx('tap'); toast('とどいた物は ないよ(住人にわたすと、ときどきパーツがとどく)'); return; }
        const to = nearestEmpty(Math.floor(N / 2)); if (to < 0) { sfx('bad'); toast('盤面がいっぱい!'); return; }
        const it = S.inbox.shift(), o = { u: ++S.n, ...it, b: null, s: null }; dropIn(o, to, rel(elInb)); sfx('pop'); save(); refresh();
      };
      $('.mg-book').onclick = () => {
        sfx('tap'); const all = Object.values(LINES).reduce((a, L) => a + L.items.length, 0), n = Object.keys(S.seen).length;
        overlay(`<h3>📖 ずかん <small>${n} / ${all}</small></h3>` + Object.keys(GENS).map(g => `<div class="mg-bkh">${GENS[g].icon} ${GENS[g].name}</div>` + GENS[g].lines.map(ln => `<div class="mg-bk">${LINES[ln].items.map((it, i) => S.seen[ln + (i + 1)] ? `<div class="on" style="--c:${LINES[ln].color}" title="${esc(it[0])}">${IMG[ln + (i + 1)] ? `<img src="${IMG[ln + (i + 1)]}" style="width:80%">` : it[1]}</div>` : '<div>?</div>').join('')}${LINES[ln].items.length < 9 ? '<span></span>' : ''}</div>`).join('')).join('') + `<p style="font-size:11px;color:#8a76a6;margin:4px 0 10px">Lv9 は とくべつな組み合わせで作れるよ</p><button data-x>とじる</button>`);
      };
      function overlay(html) { const o = document.createElement('div'); o.className = 'mg-ovl'; o.innerHTML = `<div class="mg-card">${html}</div>`; root.appendChild(o); o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-x]')) { sfx('tap'); o.remove(); o.onclose && o.onclose(); } }); return o; }

      // ---- 英語4択で回復(同じ問題がつづかないよう、さいきんの問題は外す) ----
      let qPool = [];
      const recent = () => new Set(S.recent);
      async function nextQ() {
        if (!qPool.length) {
          try {
            const rc = recent(), s = env.quiz ? await env.quiz(40, rc) : null;
            if (Array.isArray(s) && s.length) { const fresh = s.filter(q => !rc.has(String(q.w.en).toLowerCase())); qPool = shuf((fresh.length >= 3 ? fresh : s).slice()); }
          } catch (e) { }
        }
        if (!qPool.length) { const rc = recent(), sh = shuf(QUIZ_FB.slice()), fr = sh.filter(w => !rc.has(w[0])), use = (fr.length >= 4 ? fr : sh); qPool = use.slice(0, 8).map(w => ({ w: { en: w[0] }, ans: w[1], ch: shuf([w[1], ...sh.filter(x => x !== w).slice(0, 3).map(x => x[1])]), fb: true })); }
        const q = qPool.shift(); if (q) { S.recent.push(String(q.w.en).toLowerCase()); if (S.recent.length > 200) S.recent.splice(0, S.recent.length - 200); }
        return q;
      }
      elQb.onclick = () => {
        sfx('tap'); if (S.en >= CFG.enMax) { toast('⚡は いっぱい! 生成機で つかってから また来てね'); return; }
        let got = 0, open = true;
        const o = overlay(`<h3>✏️ 英語で ⚡回復 <small class="mg-qg"></small></h3><div class="mg-qw">…</div><div class="mg-qs"></div><div class="mg-qc"></div><button data-x>もどる</button>`);
        o.onclose = () => { open = false; try { env.speakStop && env.speakStop(); } catch (e) { } };
        const w = o.querySelector('.mg-qw'), sub = o.querySelector('.mg-qs'), ch = o.querySelector('.mg-qc'), gg = o.querySelector('.mg-qg');
        const ask = async () => {
          if (S.en >= CFG.enMax) { w.textContent = '⚡ まんたん!'; sub.textContent = '生成機で使ってから、また来てね'; ch.innerHTML = ''; return; }
          const Q = await nextQ(); if (!open || !o.isConnected || !Q) return;
          w.textContent = Q.w.en; sub.textContent = 'いみは どれ?'; try { env.speak && env.speak(Q.w.en); } catch (e) { }
          ch.innerHTML = Q.ch.map((c, i) => `<button data-k="${i}">${esc(c)}</button>`).join('');
          ch.querySelectorAll('button').forEach(b => b.onclick = () => {
            const ok = Q.ch[+b.dataset.k] === Q.ans; ch.querySelectorAll('button').forEach(x => { x.disabled = true; if (Q.ch[+x.dataset.k] === Q.ans) x.classList.add('ok'); else if (x === b) x.classList.add('ng'); });
            try { !Q.fb && env.record && env.record(Q, ok); } catch (e) { }
            if (ok) { const g = addEn(CFG.quizGain, rel(b)); got += g; sfx('quizok'); gg.textContent = `⚡+${got}`; sub.textContent = Q.ex ? Q.ex.en : 'せいかい!'; } else { sfx('quizng'); sub.textContent = `こたえ: ${Q.ans}`; }
            save(); setTimeout(() => { if (open) ask(); }, ok ? 700 : 1400);
          });
        };
        ask();
      };

      // ---- 情報の行 ----
      let sel = null;
      function info() {
        els.forEach((e, u) => e.classList.toggle('sel', !!sel && sel.u === u));
        const sp = elInfo.querySelector('span'); elInfo.querySelector('button')?.remove();
        if (sel && byU(sel.u)) {
          const d = defOf(sel);
          if (sel.t === 'gen') sp.textContent = sel.gl ? `🔒 ${d.name} ・ ほかの勉強をあと${leftMin(sel.g)}分で使えるよ` : `${d.icon} ${d.name} Lv${sel.lv} ・ タップで品が出る(⚡1)。同じLvを重ねると強くなる`;
          else if (sel.lk) sp.textContent = `🔒 ${d.name} Lv${sel.lv} ・ 同じものを重ねると ひらく`;
          else { const L = sel.t === 'it' ? LINES[sel.ln] : null, nx = L && L.items[sel.lv] ? ` → つぎ: ${S.seen[sel.ln + (sel.lv + 1)] ? L.items[sel.lv][0] : '？'}` : ''; sp.textContent = `${d.icon} ${d.name} Lv${sel.lv}${nx}`; const b = document.createElement('button'); b.textContent = `売る 🪙${priceOf(sel)}`; b.onclick = () => { const o = sel; if (o && byU(o.u)) sell(o); }; elInfo.appendChild(b); }
        } else sp.textContent = '';
      }

      // ---- 操作(ドラッグ・タップ) ----
      let drag = null, idle = 0;
      const wantsOf = o => { const r = []; if (o.t !== 'it') return r; S.act.forEach(a => a.w.forEach((w, k) => { if (!w.got && w.ln === o.ln && w.lv === o.lv) r.push([a.id, k]); })); return r; };
      const marks = on => { els.forEach(e => e.classList.remove('can')); elStrip.querySelectorAll('.hit').forEach(c => c.classList.remove('hit')); elSell.classList.remove('hot'); if (!on || !drag) return; const a = drag.o; S.cells.forEach(t => { if (t && mergeOf(a, t)) els.get(t.u)?.classList.add('can'); }); wantsOf(a).forEach(([id]) => elStrip.querySelector(`[data-npc="${id}"]`)?.classList.add('hit')); };
      function down(e) {
        if (drag || finBusy || root.querySelector('.mg-ovl')) return; const el = e.target.closest('.mg-it'); if (!el || el.classList.contains('fly')) return;
        const o = byU(+el.dataset.u); if (!o) return; e.preventDefault(); idle = 0;
        const R = root.getBoundingClientRect(), p = posOf(o);
        drag = { o, el, id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: e.clientX - R.left - p.x, oy: e.clientY - R.top - p.y, moved: false };
        try { el.setPointerCapture(e.pointerId); } catch (er) { }
      }
      function move(e) {
        if (!drag || e.pointerId !== drag.id) return; const d = drag;
        if (!d.moved) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8 || d.o.lk || d.o.gl) return; d.moved = true; d.el.classList.add('drag'); sfx('tap'); marks(true); }
        const R = root.getBoundingClientRect(); tf(d.el, e.clientX - R.left - d.ox, e.clientY - R.top - d.oy - 6);
        const r = elSell.getBoundingClientRect(); elSell.classList.toggle('hot', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 10);
      }
      function up(e) {
        if (!drag || e.pointerId !== drag.id) return; const d = drag, o = d.o; drag = null; marks(false); d.el.classList.remove('drag');
        if (!d.moved) { if (e.type === 'pointercancel') return; if (o.t === 'gen' && o.b != null) { sel = o; spawn(o); info(); } else { sel = sel === o ? null : o; sfx('tap'); pop(d.el, 1.12); info(); } return; }
        if (e.type === 'pointercancel') { moveEl(o); return; }
        const R = root.getBoundingClientRect(), x = e.clientX - R.left, y = e.clientY - R.top, cx = Math.floor((x - BX) / CS), cy = Math.floor((y - BY) / CS);
        const from = o.b != null ? { b: o.b } : { s: o.s };
        if (cx >= 0 && cx < CFG.cols && cy >= 0 && cy < CFG.rows) {
          const i = cy * CFG.cols + cx, t = S.cells[i];
          if (!t) { put(o, { b: i }); sfx('land'); }
          else if (t === o) moveEl(o);
          else { const res = mergeOf(o, t); if (res) { doMerge(o, t, res); return; } if (t.lk || t.gl || (from.s != null && t.t === 'gen')) { moveEl(o); shake(els.get(t.u)); sfx('bad'); } else { take(o); put(t, from); put(o, { b: i }); sfx('land'); } }
        } else {
          d.el.style.pointerEvents = 'none'; const hit = document.elementFromPoint(e.clientX, e.clientY); d.el.style.pointerEvents = '';
          const sl = hit && hit.closest('[data-slot]'), np = hit && hit.closest('[data-npc]'), se = hit && hit.closest('.mg-sell');
          if (se) { sell(o); return; }
          if (np && o.t === 'it') { const m = wantsOf(o).find(([id]) => id === np.dataset.npc); if (m) { deliver(m[0], m[1], o); return; } toast('それは その人の ほしい物と ちがうみたい'); sfx('bad'); moveEl(o); }
          else if (sl) { const j = +sl.dataset.slot, t = S.store[j]; readSlots(); if (o.t === 'gen') { toast('生成機は しまえないよ'); sfx('bad'); moveEl(o); } else if (!t) { put(o, { s: j }); sfx('land'); } else if (t === o) moveEl(o); else { take(o); put(t, from); put(o, { s: j }); sfx('land'); } }
          else moveEl(o);
        }
        save(); refresh();
      }
      root.addEventListener('pointerdown', down); root.addEventListener('pointermove', move); root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
      elStrip.addEventListener('click', e => { const c = e.target.closest('[data-npc]'); if (c) { const w = e.target.closest('[data-w]'); npcTap(c.dataset.npc, w ? +w.dataset.w : null); } });
      elSell.onclick = () => { if (sel && byU(sel.u) && sel.t !== 'gen' && !sel.lk) sell(sel); else { sfx('tap'); toast('売りたい品をえらんでから押すか、ここへドラッグしてね'); } };
      elSlots.addEventListener('scroll', () => { readSlots(); S.store.forEach(o => o && moveEl(o, false)); });

      function hint() {
        const free = S.cells.filter(o => o && !o.lk);
        for (const a of free) for (const b of S.cells) if (b && a !== b && mergeOf(a, b)) { [a, b].forEach(o => { const e = els.get(o.u); if (e) { e.classList.remove('wig'); void e.offsetWidth; e.classList.add('wig'); } }); return; }
      }
      const tick = setInterval(() => { if (!alive) return; enTick(); S.cells.forEach(o => { if (o && o.t === 'gen') genUI(o); }); if (!drag && !finBusy && !root.querySelector('.mg-ovl') && ++idle % 7 === 0) hint(); }, 1000);
      const onRz = () => layout(); window.addEventListener('resize', onRz);

      // ---- はじめ ----
      layout(); S.cells.forEach(o => o && mk(o)); S.store.forEach((o, i) => { if (o) { if (i >= S.slots) { S.store[i] = null; S.inbox.push({ t: o.t, ln: o.ln, g: o.g, lv: o.lv }); } else mk(o); } });
      if (S.first) S.cells.forEach(o => { if (o && o.t === 'gen' && genOpen(o.g)) els.get(o.u).classList.add('first'); });
      sig = ''; enTick(); refresh(); checkUnlock(true);
      requestAnimationFrame(() => { if (alive) layout(); });
      try { ctx.setTitle('チャンクマージ'); } catch (e) { }

      return { unmount() { alive = false; clearInterval(tick); clearTimeout(saveT); clearTimeout(banT); clearTimeout(toastT); window.removeEventListener('resize', onRz); try { ctx.storage.set('s', S); } catch (e) { } try { env.speakStop && env.speakStop(); } catch (e) { } root.remove(); ck_cleanup(); } };
      function ck_cleanup() { document.querySelectorAll('.mg-ck').forEach(e => e.remove()); }
    },
  };
}
