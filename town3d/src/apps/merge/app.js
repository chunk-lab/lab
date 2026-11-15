// マージゲーム(2Dで完結)。町とつながるのは コイン・好感度・英語4択 だけ。
// 盤面 7×9。同じ品を重ねると次のLv。生成機をタップで品が出る(⚡1)。住人のほしい品をわたすと好感度。13人にわたすとチャンクくんのごほうび。
import { social, NPC_NAME } from '../../game/social.js';
import { portrait } from '../../ui/portraits.js';
import { CFG, LINES, GENS, RECIPES, NPCS, QUIZ_FB, IMG } from './data.js';

const CSS = `
.mg{position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#fff4ec,#f4ecff 60%,#e9f4ff);color:#5a4a6b;font-weight:800;user-select:none;-webkit-user-select:none;touch-action:none}
.mg *{box-sizing:border-box}
.mg-top{position:absolute;left:0;right:0;top:0;height:40px;display:flex;align-items:center;gap:6px;padding:0 8px;font-size:13px}
.mg-pill{background:#fff;border-radius:999px;padding:5px 10px;box-shadow:0 2px 0 #e3d8ee;white-space:nowrap;display:flex;align-items:center;gap:4px}
.mg-pill small{font-size:10px;color:#a394b8}
.mg-en b{min-width:22px;text-align:right;display:inline-block}
.mg-qb{border:0;font:inherit;font-size:12px;color:#fff;background:linear-gradient(160deg,#8fd3ff,#6aa8f0);border-radius:999px;padding:6px 10px;box-shadow:0 2px 0 #4f86c9}
.mg-qb.need{animation:mgPulse .8s infinite}
.mg-strip{position:absolute;left:0;right:0;top:40px;height:76px;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding:4px 8px;touch-action:pan-x;scrollbar-width:none}
.mg-strip::-webkit-scrollbar{display:none}
.mg-npc{flex:none;width:62px;height:68px;background:#fff;border-radius:14px;box-shadow:0 2px 0 #e3d8ee;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:3px}
.mg-npc img,.mg-npc .mg-np{width:30px;height:30px;border-radius:50%;object-fit:cover;object-position:top;background:#f1e9f7;display:flex;align-items:center;justify-content:center;font-size:12px}
.mg-want{position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:38px;height:36px;border-radius:12px;background:#fdf6ff;border:2px solid #e3d8ee;display:flex;align-items:center;justify-content:center;font-size:20px}
.mg-want i{position:absolute;right:-5px;bottom:-4px;font-style:normal;font-size:9px;background:#5a4a6b;color:#fff;border-radius:8px;padding:0 4px}
.mg-want img{width:26px;height:26px;object-fit:contain}
.mg-npc.ok{box-shadow:0 0 0 3px #ffb3c1,0 2px 0 #e3d8ee;animation:mgBob .7s infinite alternate}
.mg-npc.ok .mg-want{background:#fff0f3;border-color:#ffb3c1}
.mg-npc.ok::after{content:'わたす';position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);background:#ff8fa8;color:#fff;font-size:9px;border-radius:8px;padding:1px 6px;white-space:nowrap}
.mg-npc.hit{box-shadow:0 0 0 3px #7fd6a0}
.mg-npc .mg-st{position:absolute;right:-3px;top:-3px;width:18px;height:18px;border-radius:50%;background:#7fd6a0;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;z-index:1}
.mg-board{position:absolute;border-radius:14px;background:#efe4f6;box-shadow:inset 0 2px 6px #d9cbe6}
.mg-cell{position:absolute;border-radius:9px;background:#fbf6ff}
.mg-cell.d{background:#f5eefb}
.mg-it{position:absolute;left:0;top:0;transition:transform .16s cubic-bezier(.3,1.3,.5,1);will-change:transform;z-index:2;touch-action:none}
.mg-it.drag{transition:none;z-index:30}
.mg-it.fly{transition:none;z-index:25;pointer-events:none}
.mg-in{position:absolute;inset:3px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:var(--c,#fff);box-shadow:0 2px 0 rgba(90,74,107,.18),inset 0 -3px 0 rgba(90,74,107,.07),inset 0 2px 0 rgba(255,255,255,.7)}
.mg-in img{width:78%;height:78%;object-fit:contain;pointer-events:none}
.mg-e{font-weight:400;line-height:1;pointer-events:none}
.mg-lv{position:absolute;right:1px;bottom:0;font-style:normal;font-size:9px;line-height:13px;min-width:13px;text-align:center;background:rgba(90,74,107,.82);color:#fff;border-radius:7px;padding:0 3px;pointer-events:none}
.mg-it.drag .mg-in{transform:scale(1.18);box-shadow:0 10px 14px rgba(90,74,107,.28)}
.mg-it.sel .mg-in{box-shadow:0 0 0 3px #8fd3ff,0 2px 0 rgba(90,74,107,.18)}
.mg-it.can .mg-in{animation:mgGlow .5s infinite alternate}
.mg-it.wig .mg-in{animation:mgWig .5s 2}
.mg-it.lk .mg-in{filter:grayscale(.75) brightness(.92);background:#ddd3e6;box-shadow:inset 0 0 0 2px #cbbfd8}
.mg-it.lk .mg-in::after{content:'🔒';position:absolute;left:0;top:-2px;font-size:10px}
.mg-gen .mg-in{background:radial-gradient(circle at 50% 30%,#fff,var(--c));box-shadow:0 3px 0 rgba(90,74,107,.3),0 0 0 2px #fff,0 0 10px var(--c)}
.mg-gen .mg-lv{left:1px;right:auto;background:#f5a623}
.mg-ch{position:absolute;right:0;top:-1px;font-size:9px;text-decoration:none;background:#fff;border-radius:7px;padding:0 3px;line-height:13px;color:#5a4a6b;pointer-events:none}
.mg-gen.cd .mg-in{filter:grayscale(.6)}
.mg-gen.first .mg-in{animation:mgPulse .8s infinite}
.mg-part .mg-in{background:#eef3f7;border:2px dashed #b9c6d3}
.mg-part .mg-e2{position:absolute;left:1px;top:0;font-size:11px;font-weight:400}
.mg-info{position:absolute;left:8px;right:8px;height:30px;display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap;overflow:hidden}
.mg-info span{flex:1;overflow:hidden;text-overflow:ellipsis}
.mg-info button,.mg-ovl button{border:0;font:inherit;border-radius:999px;padding:5px 12px;background:#fff;color:#5a4a6b;box-shadow:0 2px 0 #e3d8ee}
.mg-bot{position:absolute;left:0;right:0;bottom:0;height:58px;display:flex;align-items:center;gap:5px;padding:0 8px}
.mg-slots{flex:1;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;touch-action:pan-x;height:52px;align-items:center}
.mg-slot{flex:none;border-radius:10px;background:#fff;box-shadow:inset 0 0 0 2px #e3d8ee}
.mg-slot.add{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:9px;color:#a394b8;line-height:1.2}
.mg-slot.add b{font-size:15px}
.mg-rb{flex:none;width:44px;height:48px;border:0;font:inherit;font-size:9px;border-radius:12px;background:#fff;box-shadow:0 2px 0 #e3d8ee;color:#5a4a6b;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;line-height:1.2}
.mg-rb b{font-size:19px;font-weight:400}
.mg-rb em{position:absolute;right:-3px;top:-4px;background:#ff8fa8;color:#fff;font-style:normal;border-radius:9px;min-width:17px;line-height:17px;font-size:10px}
.mg-rb.hot{box-shadow:0 0 0 3px #ffd36b;transform:scale(1.08)}
.mg-fx{position:absolute;inset:0;pointer-events:none;z-index:40;overflow:hidden}
.mg-p{position:absolute;left:0;top:0;border-radius:50%;pointer-events:none}
.mg-ft{position:absolute;left:0;top:0;font-size:14px;color:#ff7f9f;text-shadow:0 1px 0 #fff,0 0 4px #fff;white-space:nowrap;pointer-events:none}
.mg-ban{position:absolute;left:50%;top:86px;transform:translateX(-50%);background:#fff;border-radius:999px;padding:7px 16px;font-size:13px;box-shadow:0 4px 14px rgba(90,74,107,.25);white-space:nowrap;pointer-events:none}
.mg-combo{position:absolute;right:10px;top:92px;font-size:20px;color:#ff9f43;text-shadow:0 2px 0 #fff,0 0 6px #fff;pointer-events:none}
.mg-toast{position:absolute;left:50%;bottom:96px;transform:translateX(-50%);background:rgba(90,74,107,.92);color:#fff;border-radius:999px;padding:7px 14px;font-size:12px;white-space:nowrap;pointer-events:none;z-index:45;max-width:94%;overflow:hidden;text-overflow:ellipsis}
.mg-ovl{position:absolute;inset:0;background:rgba(60,45,80,.55);z-index:50;display:flex;align-items:center;justify-content:center;animation:mgFade .2s;touch-action:auto}
.mg-card{width:min(92%,360px);max-height:88%;overflow:auto;background:#fffaf5;border-radius:22px;padding:16px;box-shadow:0 12px 30px rgba(40,25,60,.35);animation:mgPop .28s cubic-bezier(.3,1.5,.5,1);text-align:center}
.mg-card h3{margin:0 0 8px;font-size:16px}
.mg-qw{font-size:28px;margin:10px 0 2px}
.mg-qs{font-size:11px;color:#a394b8;min-height:16px}
.mg-qc{display:grid;gap:8px;margin:10px 0}
.mg-qc button{padding:11px 8px!important;font-size:14px;border-radius:14px!important}
.mg-qc button.ok{background:#7fd6a0!important;color:#fff!important}
.mg-qc button.ng{background:#ff9aa8!important;color:#fff!important}
.mg-bk{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;margin:4px 0 10px}
.mg-bk div{aspect-ratio:1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:400;background:#f1e9f7;color:#c9bcd8}
.mg-bk div.on{background:var(--c)}
.mg-bkh{font-size:12px;text-align:left;margin-top:6px}
.mg-fin{position:absolute;inset:0;z-index:60;background:radial-gradient(circle at 50% 40%,rgba(255,244,214,.97),rgba(255,214,226,.97));display:flex;flex-direction:column;align-items:center;justify-content:center;animation:mgFade .4s;overflow:hidden;touch-action:auto}
.mg-fin h2{font-size:22px;margin:0;color:#ff7f9f;text-shadow:0 2px 0 #fff;animation:mgPop .5s cubic-bezier(.3,1.6,.5,1)}
.mg-fin p{margin:6px 0 0;font-size:13px}
.mg-ck{position:absolute;left:0;top:0;width:120px;height:120px;font-size:84px;display:flex;align-items:center;justify-content:center;pointer-events:none}
.mg-ck img{width:100%;height:100%;object-fit:contain}
.mg-rw{display:flex;gap:10px;margin-top:150px;min-height:74px}
.mg-rw div{width:74px;background:#fff;border-radius:16px;padding:8px 4px;font-size:12px;box-shadow:0 4px 0 #f0d9c0;animation:mgPop .4s cubic-bezier(.3,1.6,.5,1)}
.mg-rw div b{display:block;font-size:26px;font-weight:400}
.mg-fin button{margin-top:18px;border:0;font:inherit;font-size:16px;color:#fff;background:linear-gradient(160deg,#ffb3c1,#ff8fa8);border-radius:999px;padding:12px 34px;box-shadow:0 4px 0 #e0708a;animation:mgPop .4s}
@keyframes mgPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes mgBob{from{transform:translateY(0)}to{transform:translateY(-3px)}}
@keyframes mgGlow{from{box-shadow:0 0 0 2px #ffd36b,0 0 4px #ffd36b}to{box-shadow:0 0 0 4px #ffd36b,0 0 14px #ffb347}}
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
      root.innerHTML = `<div class="mg-top"><div class="mg-pill mg-en">⚡<b>0</b><small></small></div><button class="mg-qb">✏️ 英語で回復</button><span style="flex:1"></span><div class="mg-pill mg-cy">🎁 <b>0</b>/13</div><div class="mg-pill">🪙<b data-bind="coins">${Math.floor(ctx.wallet.get()).toLocaleString('ja-JP')}</b></div></div>
<div class="mg-strip"></div><div class="mg-board"></div><div class="mg-info"><span></span></div>
<div class="mg-bot"><div class="mg-slots"></div><button class="mg-rb mg-inb"><b>🎁</b>とどいた</button><button class="mg-rb mg-book"><b>📖</b>ずかん</button><button class="mg-rb mg-sell"><b>🪙</b>うる</button></div>
<div class="mg-fx"></div>`;
      host.appendChild(root);
      const $ = q => root.querySelector(q);
      const elStrip = $('.mg-strip'), elBoard = $('.mg-board'), elInfo = $('.mg-info'), elSlots = $('.mg-slots'), elFx = $('.mg-fx'), elEn = $('.mg-en'), elQb = $('.mg-qb'), elInb = $('.mg-inb'), elSell = $('.mg-sell');

      // ---- 状態 ----
      let S = null; try { S = ctx.storage.get('s'); } catch (e) { }
      if (!S || S.v !== 1 || !Array.isArray(S.cells) || S.cells.length !== N) S = fresh();
      S.cells.forEach((o, i) => { if (o) { o.b = i; o.s = null; } }); S.store.forEach((o, i) => { if (o) { o.s = i; o.b = null; } });
      NPCS.forEach(id => { if (!S.ord[id]) S.ord[id] = newOrder(); });
      let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { ctx.storage.set('s', S); } catch (e) { } }, 300); };
      function fresh() {
        const s = { v: 1, n: 0, cells: Array(N).fill(null), store: [], slots: CFG.slots0, en: CFG.enStart, enT: Date.now(), ord: {}, done: {}, cycle: 0, seen: {}, inbox: [], first: true, gave: 0 };
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
      function newOrder() {
        const ks = Object.keys(LINES), ln = ks[rnd(ks.length)], L = LINES[ln], top = Math.min(7, (L.mergeMax || L.items.length) - 1);
        return { ln, lv: Math.max(2, Math.min(top, CFG.orderLv((S && S.cycle) || 0) + rnd(3) - 1)) };
      }
      const defOf = o => o.t === 'it' ? { name: LINES[o.ln].items[o.lv - 1][0], icon: LINES[o.ln].items[o.lv - 1][1], color: LINES[o.ln].color, key: o.ln + o.lv }
        : o.t === 'gen' ? { name: GENS[o.g].name, icon: GENS[o.g].icon, color: GENS[o.g].color, key: 'gen_' + o.g }
          : { name: GENS[o.g].name + 'のパーツ', icon: '⚙️', color: '#eef3f7', key: 'part_' + o.g };
      const art = (d, cls = 'mg-e') => IMG[d.key] ? `<img src="${IMG[d.key]}" alt="">` : `<b class="${cls}">${d.icon}</b>`;
      const is = (o, p) => o.t === 'it' && o.ln === p[0] && o.lv === p[1];
      function mergeOf(a, b) {
        if (!a || !b || a === b || a.lk || a.t !== b.t) return null;
        if (a.t === 'it') {
          if (a.ln === b.ln && a.lv === b.lv) { const L = LINES[a.ln]; return a.lv < (L.mergeMax || L.items.length) ? { t: 'it', ln: a.ln, lv: a.lv + 1 } : null; }
          for (const r of RECIPES) if ((is(a, r.a) && is(b, r.b)) || (is(a, r.b) && is(b, r.a))) return { t: 'it', ln: r.out[0], lv: r.out[1] };
          return null;
        }
        if (a.g !== b.g || a.lv !== b.lv) return null;
        if (a.t === 'gen') return a.lv < CFG.genMax ? { t: 'gen', g: a.g, lv: a.lv + 1, ch: CFG.genCharge(a.lv + 1), cd: 0 } : null;
        return a.lv < CFG.partMax ? { t: 'part', g: a.g, lv: a.lv + 1 } : { t: 'gen', g: a.g, lv: 1, ch: CFG.genCharge(1), cd: 0 };
      }

      // ---- 配置 ----
      let CS = 48, BX = 0, BY = 0, slotPos = [], alive = true;
      const els = new Map();
      function layout() {
        const W = root.clientWidth, H = root.clientHeight; if (!W || !H) return;
        CS = Math.floor(Math.min((W - 12) / CFG.cols, (H - 40 - 76 - 30 - 58 - 14) / CFG.rows));
        const bw = CS * CFG.cols + 8, bh = CS * CFG.rows + 8; BX = Math.round((W - bw) / 2) + 4; BY = 40 + 76 + 4 + 4;
        elBoard.style.cssText = `left:${BX - 4}px;top:${BY - 4}px;width:${bw}px;height:${bh}px`;
        if (!elBoard.children.length) for (let i = 0; i < N; i++) { const c = document.createElement('div'); c.className = 'mg-cell' + ((i + Math.floor(i / CFG.cols) * (CFG.cols % 2 ? 0 : 1)) % 2 ? ' d' : ''); elBoard.appendChild(c); }
        [...elBoard.children].forEach((c, i) => { c.style.cssText = `left:${4 + (i % CFG.cols) * CS + 1}px;top:${4 + Math.floor(i / CFG.cols) * CS + 1}px;width:${CS - 2}px;height:${CS - 2}px`; });
        elInfo.style.top = (BY + bh) + 'px';
        drawSlots(); els.forEach((el, u) => { const o = byU(u); if (o) { size(el); moveEl(o, false); } });
      }
      const byU = u => S.cells.find(o => o && o.u === u) || S.store.find(o => o && o.u === u);
      const size = el => { el.style.width = el.style.height = CS + 'px'; const e = el.querySelector('.mg-e'); if (e) e.style.fontSize = Math.round(CS * 0.54) + 'px'; };
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
        el.innerHTML = `<div class="mg-in" style="--c:${d.color}">${art(d)}${o.t === 'part' ? `<b class="mg-e2">${GENS[o.g].icon}</b>` : ''}<i class="mg-lv">${o.t === 'gen' ? 'Lv' : ''}${o.lv}</i>${o.t === 'gen' ? '<u class="mg-ch"></u>' : ''}</div>`;
        size(el); root.insertBefore(el, elFx); els.set(o.u, el); moveEl(o, false); if (o.t === 'gen') genUI(o); return el;
      }
      function rm(o) { const el = els.get(o.u); if (el) { el.remove(); els.delete(o.u); } }
      function take(o) { if (o.b != null) S.cells[o.b] = null; if (o.s != null) S.store[o.s] = null; o.b = o.s = null; }
      function put(o, loc, anim = true) { take(o); if (loc.b != null) { S.cells[loc.b] = o; o.b = loc.b; } else { S.store[loc.s] = o; o.s = loc.s; } moveEl(o, anim); }
      function genUI(o) {
        const el = els.get(o.u); if (!el) return; const now = Date.now();
        if (o.cd && now >= o.cd) { o.cd = 0; o.ch = CFG.genCharge(o.lv); pop(el); }
        const left = o.cd ? Math.ceil((o.cd - now) / 1000) : 0;
        el.classList.toggle('cd', !!o.cd); el.querySelector('.mg-ch').textContent = o.cd ? `⏳${left}` : o.ch;
      }
      const center = o => { const p = posOf(o); return { x: p.x + CS / 2, y: p.y + CS / 2 }; };

      // ---- 演出 ----
      const pop = (el, k = 1.25) => { const i = el.querySelector('.mg-in'); i && i.animate([{ transform: `scale(${k})` }, { transform: 'scale(.92)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' }); };
      const shake = el => { const i = el.querySelector('.mg-in') || el; i.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 240 }); };
      function burst(x, y, n = 10, colors = ['#ffd36b', '#ff9fb5', '#8fd3ff', '#fff']) {
        for (let i = 0; i < n; i++) {
          const p = document.createElement('div'), a = Math.random() * 6.28, d = CS * (0.5 + Math.random() * 0.8), z = 4 + rnd(6);
          p.className = 'mg-p'; p.style.cssText = `width:${z}px;height:${z}px;background:${colors[i % colors.length]}`; elFx.appendChild(p);
          p.animate([{ transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d + 8}px) scale(.2)`, opacity: 0 }], { duration: 420 + rnd(200), easing: 'cubic-bezier(.1,.7,.3,1)' }).onfinish = () => p.remove();
        }
        const ring = document.createElement('div'); ring.className = 'mg-p'; ring.style.cssText = `width:${CS}px;height:${CS}px;border:3px solid #fff;background:none`; elFx.appendChild(ring);
        ring.animate([{ transform: `translate(${x - CS / 2}px,${y - CS / 2}px) scale(.4)`, opacity: .9 }, { transform: `translate(${x - CS / 2}px,${y - CS / 2}px) scale(1.7)`, opacity: 0 }], { duration: 380, easing: 'ease-out' }).onfinish = () => ring.remove();
      }
      function ftext(x, y, t, color) {
        const e = document.createElement('div'); e.className = 'mg-ft'; e.textContent = t; if (color) e.style.color = color; elFx.appendChild(e);
        e.animate([{ transform: `translate(${x}px,${y}px) translate(-50%,-50%) scale(.6)`, opacity: 0 }, { transform: `translate(${x}px,${y - 16}px) translate(-50%,-50%) scale(1.15)`, opacity: 1, offset: .25 }, { transform: `translate(${x}px,${y - 44}px) translate(-50%,-50%) scale(1)`, opacity: 0 }], { duration: 900, easing: 'ease-out' }).onfinish = () => e.remove();
      }
      function fly(html, from, to, ms = 480, done) {   // 小さな絵を from → to へ弧をえがいて飛ばす
        const e = document.createElement('div'); e.className = 'mg-ft'; e.style.fontSize = Math.round(CS * 0.5) + 'px'; e.style.fontWeight = '400'; e.innerHTML = html; elFx.appendChild(e);
        const mx = (from.x + to.x) / 2, my = Math.min(from.y, to.y) - 50;
        e.animate([{ transform: `translate(${from.x}px,${from.y}px) translate(-50%,-50%) scale(1)` }, { transform: `translate(${mx}px,${my}px) translate(-50%,-50%) scale(1.25)`, offset: .5 }, { transform: `translate(${to.x}px,${to.y}px) translate(-50%,-50%) scale(.5)` }], { duration: ms, easing: 'ease-in-out' }).onfinish = () => { e.remove(); done && done(); };
      }
      let banT = 0;
      function banner(html) { root.querySelector('.mg-ban')?.remove(); const b = document.createElement('div'); b.className = 'mg-ban'; b.innerHTML = html; elFx.appendChild(b); b.animate([{ opacity: 0, marginTop: '-14px' }, { opacity: 1, marginTop: '0' }], { duration: 220 }); clearTimeout(banT); banT = setTimeout(() => { b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).onfinish = () => b.remove(); }, 1700); }
      let toastT = 0;
      function toast(t) { root.querySelector('.mg-toast')?.remove(); const e = document.createElement('div'); e.className = 'mg-toast'; e.textContent = t; root.appendChild(e); clearTimeout(toastT); toastT = setTimeout(() => e.remove(), 2200); }
      const rel = el => { const r = el.getBoundingClientRect(), R = root.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2 }; };

      // ---- エネルギー ----
      function enTick() {
        const now = Date.now(), step = CFG.regenSec * 1000;
        if (S.en >= CFG.enMax) S.enT = now; else while (now - S.enT >= step && S.en < CFG.enMax) { S.en++; S.enT += step; }
        const left = S.en >= CFG.enMax ? '' : (() => { const s = Math.ceil((step - (now - S.enT)) / 1000); return `+1 ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; })();
        elEn.querySelector('b').textContent = S.en; elEn.querySelector('small').textContent = left; elQb.classList.toggle('need', S.en <= 0);
      }
      function addEn(n, from) { S.en = Math.min(999, S.en + n); enTick(); save(); const to = rel(elEn); if (from) fly('⚡', from, to, 420, () => pop2(elEn)); else pop2(elEn); }
      const pop2 = el => el.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 220 });

      // ---- 生成 ----
      function nearestEmpty(i) {
        const r0 = Math.floor(i / CFG.cols), c0 = i % CFG.cols; let best = -1, bd = 1e9;
        for (let k = 0; k < N; k++) if (!S.cells[k]) { const d = Math.hypot(Math.floor(k / CFG.cols) - r0, (k % CFG.cols) - c0) + Math.random() * 0.3; if (d < bd) { bd = d; best = k; } }
        return best;
      }
      function spawn(g) {
        const el = els.get(g.u); idle = 0;
        if (g.cd) { shake(el); sfx('bad'); toast(`${GENS[g.g].name}は ひとやすみ中(あと${Math.ceil((g.cd - Date.now()) / 1000)}秒)`); return; }
        if (S.en <= 0) { shake(el); sfx('bad'); toast('⚡エネルギーがないよ。英語で回復しよう!'); pop2(elQb); return; }
        const to = nearestEmpty(g.b); if (to < 0) { shake(el); sfx('bad'); toast('盤面がいっぱい! 重ねるか、売るか、保管しよう'); return; }
        S.en--; g.ch--; if (g.ch <= 0) g.cd = Date.now() + CFG.genRecharge * 1000; S.first = false; el.classList.remove('first');
        const top = CFG.spawnTop(g.lv), r = CFG.spawnR(g.lv); let w = [], sum = 0; for (let l = 1; l <= top; l++) { w.push(Math.pow(r, l - 1)); sum += w[l - 1]; }
        let x = Math.random() * sum, lv = 1; for (let l = 0; l < top; l++) { x -= w[l]; if (x <= 0) { lv = l + 1; break; } }
        const o = { u: ++S.n, t: 'it', ln: GENS[g.g].lines[rnd(2)], lv, b: null, s: null };
        dropIn(o, to, center(g)); pop(el, 1.15); sfx('pop'); const c = center(g); ftext(c.x, c.y - CS * 0.4, '⚡-1', '#6aa8f0'); enTick(); genUI(g); see(o); save(); refresh();
      }
      function dropIn(o, to, from) {   // from(画面上の点)から、盤面の to へ飛びこむ
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
        burst(c.x, c.y, 8 + Math.min(10, o.lv * 2), wasLk ? ['#cbbfd8', '#fff', '#ffd36b'] : undefined);
        sfx(o.t === 'gen' ? 'gen' : wasLk ? 'unlock' : 'merge', o.lv);
        ftext(c.x, c.y - CS * 0.3, o.t === 'gen' && res.lv === 1 ? '生成機ができた!' : `Lv.${o.lv}`, '#ff9f43');
        const now = Date.now(); combo = now - comboT < CFG.comboSec * 1000 ? combo + 1 : 1; comboT = now;
        if (combo >= 3) { root.querySelector('.mg-combo')?.remove(); const e = document.createElement('div'); e.className = 'mg-combo'; e.textContent = `${combo}コンボ!`; elFx.appendChild(e); e.animate([{ transform: 'scale(.5) rotate(-8deg)', opacity: 0 }, { transform: 'scale(1.2) rotate(4deg)', opacity: 1, offset: .3 }, { transform: 'scale(1)', opacity: 1, offset: .8 }, { transform: 'scale(1)', opacity: 0 }], { duration: 1100 }).onfinish = () => e.remove(); sfx('combo', combo); }
        if (combo > 0 && combo % CFG.comboEnergy === 0) addEn(1, c);
        see(o); sel = null; save(); refresh();
      }

      // ---- 住人 ----
      function drawStrip() {
        elStrip.innerHTML = NPCS.map(id => {
          const q = S.ord[id], d = defOf({ t: 'it', ln: q.ln, lv: q.lv }), pic = portrait(id);
          return `<div class="mg-npc" data-npc="${id}">${S.done[id] ? '<span class="mg-st">✓</span>' : ''}<div class="mg-want">${art(d, 'mg-w')}<i>${q.lv}</i></div>${pic ? `<img src="${pic}" alt="">` : `<div class="mg-np">${esc((NPC_NAME[id] || id).slice(0, 2))}</div>`}</div>`;
        }).join('');
        $('.mg-cy b').textContent = Object.keys(S.done).length;
      }
      const findFor = id => { const q = S.ord[id]; return S.cells.find(o => o && !o.lk && o.t === 'it' && o.ln === q.ln && o.lv === q.lv); };
      function refresh() {
        elStrip.querySelectorAll('.mg-npc').forEach(c => c.classList.toggle('ok', !!findFor(c.dataset.npc)));
        elInb.querySelector('em')?.remove(); if (S.inbox.length) { const e = document.createElement('em'); e.textContent = S.inbox.length; elInb.appendChild(e); }
        info();
      }
      function deliver(id, o) {
        const card = elStrip.querySelector(`[data-npc="${id}"]`), d = defOf(o), from = center(o), q = S.ord[id]; if (!card) return;
        take(o); rm(o); sel = null; card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        sfx('give');
        setTimeout(() => fly(art(d), from, rel(card), 460, () => {
          const to = rel(card); burst(to.x, to.y, 12, ['#ff9fb5', '#ffd36b', '#fff']); ['💗', '💗', '💕'].forEach((h, i) => setTimeout(() => ftext(to.x + (i - 1) * 16, to.y - 6, h), i * 110));
          let up = null; try { up = social.addAff(id, CFG.affOf(q.lv)); } catch (e) { }
          const got = ctx.wallet.give(CFG.coinOf(q.lv), 'merge:give'); sfx('heart');
          banner(`${esc(NPC_NAME[id] || id)}「ありがとう!」 <small>💗+${CFG.affOf(q.lv)} 🪙+${got}</small>` + (up && up.up ? ' <small>なかよし度アップ!</small>' : ''));
          S.done[id] = 1; S.gave++; S.ord[id] = newOrder();
          if (Math.random() < CFG.partChance) { const gk = Object.keys(GENS); S.inbox.push({ t: 'part', g: gk[rnd(gk.length)], lv: 1 }); setTimeout(() => { fly('⚙️', to, rel(elInb), 520, () => pop2(elInb)); toast('生成機のパーツをもらった!(🎁とどいた から出せるよ)'); refresh(); }, 500); }
          drawStrip(); refresh(); save();
          if (Object.keys(S.done).length >= NPCS.length) setTimeout(finale, 1300);
        }), 60);
      }
      function npcTap(id) {
        const o = findFor(id), q = S.ord[id], d = defOf({ t: 'it', ln: q.ln, lv: q.lv }), gk = Object.keys(GENS).find(k => GENS[k].lines.includes(q.ln));
        if (o) deliver(id, o); else { sfx('tap'); toast(`${NPC_NAME[id] || id}は「${d.name}」(Lv${q.lv})がほしい → ${GENS[gk].icon}${GENS[gk].name}`); S.cells.forEach(x => { if (x && x.t === 'gen' && x.g === gk) { const e = els.get(x.u); e.classList.remove('wig'); void e.offsetWidth; e.classList.add('wig'); } }); }
      }

      // ---- 13人完了: チャンクくん ----
      function finale() {
        if (!alive || root.querySelector('.mg-fin')) return;
        const coin = CFG.cycleCoin(S.cycle), pic = portrait('chunkkun'), W = root.clientWidth, H = root.clientHeight;
        const f = document.createElement('div'); f.className = 'mg-fin';
        f.innerHTML = `<h2>🎉 13人 ぜんいんに わたせた!</h2><p>チャンクくんが ごほうびを もってきたよ</p><div class="mg-ck">${pic ? `<img src="${pic}" alt="">` : '☁️'}</div><div class="mg-rw"></div>`;
        root.appendChild(f); sfx('fanfare');
        const ck = f.querySelector('.mg-ck'), rw = f.querySelector('.mg-rw'), cy = H * 0.5 - 70, mid = W / 2 - 60;
        for (let i = 0; i < 24; i++) setTimeout(() => { if (f.isConnected) { const p = document.createElement('div'); p.className = 'mg-p'; const z = 6 + rnd(6); p.style.cssText = `width:${z}px;height:${z * 1.6}px;border-radius:2px;background:${['#ffd36b', '#ff9fb5', '#8fd3ff', '#b6e3a8'][i % 4]}`; f.appendChild(p); const x = rnd(W); p.animate([{ transform: `translate(${x}px,-20px) rotate(0)` }, { transform: `translate(${x + rnd(80) - 40}px,${H + 20}px) rotate(${360 + rnd(360)}deg)` }], { duration: 1800 + rnd(1200), easing: 'ease-in' }).onfinish = () => p.remove(); } }, i * 90);
        const enter = ck.animate([{ transform: `translate(${-140}px,${cy - 40}px) rotate(-8deg)` }, { transform: `translate(${mid * 0.5}px,${cy + 18}px) rotate(6deg)`, offset: .5 }, { transform: `translate(${mid}px,${cy}px) rotate(0)` }], { duration: 1300, easing: 'ease-out', fill: 'forwards' });
        const bob = () => ck.animate([{ transform: `translate(${mid}px,${cy}px)` }, { transform: `translate(${mid}px,${cy - 10}px)` }], { duration: 700, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
        const gifts = [['🪙', `+${coin}`], ['⚡', `+${CFG.cycleEnergy}`], ['⚙️', `×${CFG.cycleParts}`]];
        enter.onfinish = () => {
          const b = bob();
          gifts.forEach((g, i) => setTimeout(() => {
            if (!f.isConnected) return; sfx('pop'); ck.animate([{ transform: `translate(${mid}px,${cy}px) scale(1.12,.9)` }, { transform: `translate(${mid}px,${cy}px) scale(1)` }], { duration: 200 });
            const d = document.createElement('div'); d.innerHTML = `<b>${g[0]}</b>${g[1]}`; rw.appendChild(d); sfx('coin');
          }, 350 + i * 550));
          setTimeout(() => {
            if (!f.isConnected) return; const bt = document.createElement('button'); bt.textContent = 'うけとる!'; f.appendChild(bt);
            bt.onclick = () => {
              bt.remove(); sfx('fanfare2'); b.cancel();
              ctx.wallet.give(coin, 'merge:cycle'); S.en = Math.min(999, S.en + CFG.cycleEnergy); const gk = Object.keys(GENS); for (let i = 0; i < CFG.cycleParts; i++) S.inbox.push({ t: 'part', g: gk[rnd(gk.length)], lv: 1 });
              S.cycle++; S.done = {}; save();
              f.querySelector('p').textContent = `うけとったよ! つぎは ${S.cycle + 1}しゅう目。またね〜`;
              ck.animate([{ transform: `translate(${mid}px,${cy}px) rotate(0)` }, { transform: `translate(${mid - 20}px,${cy - 14}px) rotate(-10deg)`, offset: .25 }, { transform: `translate(${W + 160}px,${cy - 90}px) rotate(12deg)` }], { duration: 1200, easing: 'ease-in', fill: 'forwards' }).onfinish = () => { f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350 }).onfinish = () => { f.remove(); drawStrip(); enTick(); refresh(); }; };
            };
          }, 350 + gifts.length * 550 + 300);
        };
      }

      // ---- 売る・保管・とどいた・ずかん ----
      const priceOf = o => o.t === 'it' ? CFG.sell[o.lv - 1] || 1 : CFG.partSell * o.lv;
      function sell(o) {
        if (o.t === 'gen' || o.lk) { sfx('bad'); toast(o.lk ? 'ロック中は売れないよ' : '生成機は売れないよ'); moveEl(o); return; }
        const c = rel(els.get(o.u)), got = ctx.wallet.give(priceOf(o), 'merge:sell'); take(o); rm(o); sel = null;
        fly('🪙', c, rel(root.querySelector('[data-bind="coins"]')), 520); ftext(rel(elSell).x, rel(elSell).y - 30, `🪙+${got}`, '#f5a623'); sfx('sell'); save(); refresh();
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
        overlay(`<h3>📖 ずかん <small>${n} / ${all}</small></h3>` + Object.keys(GENS).map(g => `<div class="mg-bkh">${GENS[g].icon} ${GENS[g].name}</div>` + GENS[g].lines.map(ln => `<div class="mg-bk">${LINES[ln].items.map((it, i) => S.seen[ln + (i + 1)] ? `<div class="on" style="--c:${LINES[ln].color}" title="${esc(it[0])}">${IMG[ln + (i + 1)] ? `<img src="${IMG[ln + (i + 1)]}" style="width:80%">` : it[1]}</div>` : '<div>?</div>').join('')}${LINES[ln].items.length < 9 ? '<span></span>' : ''}</div>`).join('')).join('') + `<p style="font-size:11px;color:#a394b8;margin:4px 0 10px">Lv9 は とくべつな組み合わせで作れるよ</p><button data-x>とじる</button>`);
      };
      function overlay(html) { const o = document.createElement('div'); o.className = 'mg-ovl'; o.innerHTML = `<div class="mg-card">${html}</div>`; root.appendChild(o); o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-x]')) { sfx('tap'); o.remove(); o.onclose && o.onclose(); } }); return o; }

      // ---- 英語4択で回復 ----
      let qPool = [];
      async function nextQ() {
        if (!qPool.length) { try { const s = env.quiz ? await env.quiz(10) : null; if (Array.isArray(s) && s.length) qPool = s.slice(); } catch (e) { } }
        if (!qPool.length) { const sh = QUIZ_FB.slice().sort(() => Math.random() - 0.5); qPool = sh.slice(0, 8).map(w => ({ w: { en: w[0] }, ans: w[1], ch: [w[1], ...sh.filter(x => x !== w).slice(0, 3).map(x => x[1])].sort(() => Math.random() - 0.5), fb: true })); }
        return qPool.shift();
      }
      elQb.onclick = () => {
        sfx('tap'); let got = 0, open = true;
        const o = overlay(`<h3>✏️ 英語で ⚡回復 <small class="mg-qg"></small></h3><div class="mg-qw">…</div><div class="mg-qs"></div><div class="mg-qc"></div><button data-x>もどる</button>`);
        o.onclose = () => { open = false; try { env.speakStop && env.speakStop(); } catch (e) { } };
        const w = o.querySelector('.mg-qw'), sub = o.querySelector('.mg-qs'), ch = o.querySelector('.mg-qc'), gg = o.querySelector('.mg-qg');
        const ask = async () => {
          const Q = await nextQ(); if (!open || !o.isConnected) return;
          w.textContent = Q.w.en; sub.textContent = 'いみは どれ?'; try { env.speak && env.speak(Q.w.en); } catch (e) { }
          ch.innerHTML = Q.ch.map((c, i) => `<button data-k="${i}">${esc(c)}</button>`).join('');
          ch.querySelectorAll('button').forEach(b => b.onclick = () => {
            const ok = Q.ch[+b.dataset.k] === Q.ans; ch.querySelectorAll('button').forEach(x => { x.disabled = true; if (Q.ch[+x.dataset.k] === Q.ans) x.classList.add('ok'); else if (x === b) x.classList.add('ng'); });
            try { !Q.fb && env.record && env.record(Q, ok); } catch (e) { }
            if (ok) { got += CFG.quizGain; sfx('quizok'); addEn(CFG.quizGain, rel(b)); gg.textContent = `⚡+${got}`; sub.textContent = Q.ex ? Q.ex.en : 'せいかい!'; } else { sfx('quizng'); sub.textContent = `こたえ: ${Q.ans}`; }
            setTimeout(() => { if (open) ask(); }, ok ? 700 : 1400);
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
          if (sel.t === 'gen') sp.textContent = `${d.icon} ${d.name} Lv${sel.lv} ・ タップで品が出る(⚡1)。同じLvの生成機を重ねると強くなる`;
          else if (sel.lk) sp.textContent = `🔒 ${d.name} Lv${sel.lv} ・ 同じものを重ねると ひらく`;
          else { const L = sel.t === 'it' ? LINES[sel.ln] : null, nx = L && L.items[sel.lv] ? ` → つぎ: ${S.seen[sel.ln + (sel.lv + 1)] ? L.items[sel.lv][0] : '？'}` : ''; sp.textContent = `${d.icon} ${d.name} Lv${sel.lv}${nx}`; const b = document.createElement('button'); b.textContent = `売る 🪙${priceOf(sel)}`; b.onclick = () => { const o = sel; if (o && byU(o.u)) sell(o); }; elInfo.appendChild(b); }
        } else sp.textContent = S.first ? '👆 光っている生成機をタップ! 品物が出るよ' : S.gave < 1 ? '同じ品を重ねてLvアップ → 上の住人がほしい品を作って わたそう' : `${S.cycle + 1}しゅう目 ・ 13人ぜんいんに わたすと、チャンクくんのごほうび!`;
      }

      // ---- 操作(ドラッグ・タップ) ----
      let drag = null, idle = 0;
      const marks = on => { els.forEach(e => e.classList.remove('can')); elStrip.querySelectorAll('.hit').forEach(c => c.classList.remove('hit')); elSell.classList.remove('hot'); if (!on || !drag) return; const a = drag.o; S.cells.forEach(t => { if (t && mergeOf(a, t)) els.get(t.u)?.classList.add('can'); }); if (a.t === 'it') NPCS.forEach(id => { const q = S.ord[id]; if (q.ln === a.ln && q.lv === a.lv) elStrip.querySelector(`[data-npc="${id}"]`)?.classList.add('hit'); }); };
      function down(e) {
        if (drag || root.querySelector('.mg-ovl,.mg-fin')) return; const el = e.target.closest('.mg-it'); if (!el || el.classList.contains('fly')) return;
        const o = byU(+el.dataset.u); if (!o) return; e.preventDefault(); idle = 0;
        const R = root.getBoundingClientRect(), p = posOf(o);
        drag = { o, el, id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: e.clientX - R.left - p.x, oy: e.clientY - R.top - p.y, moved: false };
        try { el.setPointerCapture(e.pointerId); } catch (er) { }
      }
      function move(e) {
        if (!drag || e.pointerId !== drag.id) return; const d = drag;
        if (!d.moved) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8 || d.o.lk) return; d.moved = true; d.el.classList.add('drag'); sfx('tap'); marks(true); }
        const R = root.getBoundingClientRect(); tf(d.el, e.clientX - R.left - d.ox, e.clientY - R.top - d.oy - 6);
        const r = elSell.getBoundingClientRect(); elSell.classList.toggle('hot', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 10);
      }
      function up(e) {
        if (!drag || e.pointerId !== drag.id) return; const d = drag, o = d.o; drag = null; marks(false); d.el.classList.remove('drag');
        if (!d.moved) { if (e.type === 'pointercancel') return; if (o.t === 'gen' && o.b != null && !o.lk) { sel = o; spawn(o); info(); } else { sel = sel === o ? null : o; sfx('tap'); pop(d.el, 1.12); info(); } return; }
        if (e.type === 'pointercancel') { moveEl(o); return; }
        const R = root.getBoundingClientRect(), x = e.clientX - R.left, y = e.clientY - R.top, cx = Math.floor((x - BX) / CS), cy = Math.floor((y - BY) / CS);
        const from = o.b != null ? { b: o.b } : { s: o.s };
        if (cx >= 0 && cx < CFG.cols && cy >= 0 && cy < CFG.rows) {
          const i = cy * CFG.cols + cx, t = S.cells[i];
          if (!t) { put(o, { b: i }); sfx('land'); }
          else if (t === o) moveEl(o);
          else { const res = mergeOf(o, t); if (res) { doMerge(o, t, res); return; } if (t.lk || (from.s != null && t.t === 'gen')) { moveEl(o); shake(els.get(t.u)); sfx('bad'); } else { take(o); put(t, from); put(o, { b: i }); sfx('land'); } }
        } else {
          d.el.style.pointerEvents = 'none'; const hit = document.elementFromPoint(e.clientX, e.clientY); d.el.style.pointerEvents = '';
          const sl = hit && hit.closest('[data-slot]'), np = hit && hit.closest('[data-npc]'), se = hit && hit.closest('.mg-sell');
          if (se) { sell(o); return; }
          if (np && o.t === 'it') { const q = S.ord[np.dataset.npc]; if (q.ln === o.ln && q.lv === o.lv) { deliver(np.dataset.npc, o); return; } toast('それは ほしい物と ちがうみたい'); sfx('bad'); moveEl(o); }
          else if (sl) { const j = +sl.dataset.slot, t = S.store[j]; readSlots(); if (o.t === 'gen') { toast('生成機は しまえないよ'); sfx('bad'); moveEl(o); } else if (!t) { put(o, { s: j }); sfx('land'); } else if (t === o) moveEl(o); else { take(o); put(t, from); put(o, { s: j }); sfx('land'); } }
          else moveEl(o);
        }
        save(); refresh();
      }
      root.addEventListener('pointerdown', down); root.addEventListener('pointermove', move); root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
      elStrip.addEventListener('click', e => { const c = e.target.closest('[data-npc]'); if (c) npcTap(c.dataset.npc); });
      elSell.onclick = () => { if (sel && byU(sel.u) && sel.t !== 'gen' && !sel.lk) sell(sel); else { sfx('tap'); toast('売りたい品をえらんでから押すか、ここへドラッグしてね'); } };
      elSlots.addEventListener('scroll', () => { readSlots(); S.store.forEach(o => o && moveEl(o, false)); });

      // ---- ヒント(しばらく何もしないと、重ねられる2つがゆれる) ----
      function hint() {
        const free = S.cells.filter(o => o && !o.lk);
        for (const a of free) for (const b of S.cells) if (b && a !== b && mergeOf(a, b)) { [a, b].forEach(o => { const e = els.get(o.u); if (e) { e.classList.remove('wig'); void e.offsetWidth; e.classList.add('wig'); } }); return; }
      }
      const tick = setInterval(() => { if (!alive) return; enTick(); S.cells.forEach(o => { if (o && o.t === 'gen') genUI(o); }); if (!drag && !root.querySelector('.mg-ovl,.mg-fin') && ++idle % 7 === 0) hint(); }, 1000);
      const onRz = () => layout(); window.addEventListener('resize', onRz);

      // ---- はじめ ----
      layout(); S.cells.forEach(o => o && mk(o)); S.store.forEach((o, i) => { if (o) { if (i >= S.slots) { S.store[i] = null; S.inbox.push({ t: o.t, ln: o.ln, g: o.g, lv: o.lv }); } else mk(o); } });
      if (S.first) S.cells.forEach(o => { if (o && o.t === 'gen') els.get(o.u).classList.add('first'); });
      drawStrip(); enTick(); refresh();
      requestAnimationFrame(() => { if (alive) layout(); });
      if (Object.keys(S.done).length >= NPCS.length) setTimeout(finale, 600);
      try { ctx.setTitle('チャンクマージ'); } catch (e) { }

      return { unmount() { alive = false; clearInterval(tick); clearTimeout(saveT); clearTimeout(banT); clearTimeout(toastT); window.removeEventListener('resize', onRz); try { ctx.storage.set('s', S); } catch (e) { } try { env.speakStop && env.speakStop(); } catch (e) { } root.remove(); } };
    },
  };
}
