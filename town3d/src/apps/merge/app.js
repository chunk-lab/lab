// マージゲーム(2Dで完結)。町とつながるのは コイン・好感度・英語4択 だけ。
// 盤面 7×9。同じ品を重ねると次のLv。生成機をタップで品が出る(⚡1)。住人のほしい品をわたすと好感度。13人にわたすとチャンクくんのごほうび。
import { social, NPC_NAME, LV, LV_NAME } from '../../game/social.js';
import { portrait } from '../../ui/portraits.js';
import { CFG, LINES, GENS, RECIPES, NPCS, QUIZ_FB, IMG, GOALS, TEND, PATTERNS, LVR } from './data.js';

const CSS = `
.mg{position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#ffd2c0,#e2c4ff 55%,#b9d6ff);color:#4a3a5e;font-weight:800;user-select:none;-webkit-user-select:none;touch-action:none}
.mg *{box-sizing:border-box}
.mg-goal{position:absolute;left:6px;right:6px;top:calc(var(--sf,0px) + 36px);height:16px;line-height:16px;font-size:12px;font-weight:700;color:#7a3b00;background:#fff3c4;border-radius:9px;padding:0 8px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;z-index:2}.mg-goal b{color:#e8366a}
.mg-top{position:absolute;left:0;right:0;top:var(--sf,0px);height:36px;display:flex;align-items:center;gap:5px;padding:0 6px;font-size:13px}
.mg-pill{background:#fff;border-radius:999px;padding:5px 9px;box-shadow:0 2px 0 #b79ad3;white-space:nowrap;display:flex;align-items:center;gap:3px}
.mg-pill small{font-size:10px;color:#8a76a6}
.mg-en b{min-width:24px;text-align:right;display:inline-block}
.mg-qb{border:0;font:inherit;font-size:12px;color:#fff;background:linear-gradient(160deg,#5fb8ff,#3a86e0);border-radius:999px;padding:6px 10px;box-shadow:0 2px 0 #2a63aa}
.mg-qb.need{animation:mgPulse .8s infinite}
.mg-qb.full{filter:grayscale(.7);opacity:.7}
.mg-strip{position:absolute;left:0;right:0;top:54px;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;padding:3px 6px;touch-action:pan-x;scrollbar-width:none;align-items:stretch}
.mg-strip::-webkit-scrollbar{display:none}
.mg-npc{flex:none;width:var(--cw,108px);height:calc(100% - 4px);margin-top:2px;background:#fff;border-radius:18px;box-shadow:0 3px 0 #a98cc9,0 0 0 2px #cdb6e6;position:relative;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;padding:3px 6px;gap:6px;overflow:visible}
.mg-pc{display:flex;flex-direction:column;align-items:center;gap:1px;width:calc(var(--pz,60px) + 4px);flex:none}
.mg-npc img,.mg-npc .mg-np{width:var(--pz,64px);height:var(--pz,64px);border-radius:50%;object-fit:cover;object-position:top;background:#efe3fb;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 0 3px #e8d9f7}
.mg-nm{font-size:11px;line-height:1.1;text-align:center;white-space:nowrap}
.mg-strip.tiny .mg-nm,.mg-strip.tiny .mg-hr{display:none}
.mg-hr{display:flex;align-items:center;gap:2px;font-size:8px;color:#d6457a;width:100%}
.mg-hr i{flex:1;height:7px;border-radius:5px;background:#f3dbe6;overflow:hidden;display:block}
.mg-hr i b{display:block;height:100%;background:linear-gradient(90deg,#ff9fb5,#ff5e8a);border-radius:5px;transition:width .6s}
.mg-ws{display:flex;gap:5px;flex:1;justify-content:center}
.mg-w{position:relative;width:var(--ws,36px);height:var(--ws,36px);border-radius:13px;background:var(--c,#f3ecfa);border:2px solid #7d62a0;display:flex;align-items:center;justify-content:center;font-size:calc(var(--ws,36px)*.58);font-weight:400}
.mg-w img{width:94%;height:94%;object-fit:contain}
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
.mg-gen{z-index:3}
.mg-in{position:absolute;inset:2px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--c,#fff);box-shadow:0 0 0 2px rgba(60,35,85,.7),0 3px 0 2px rgba(60,35,85,.45),inset 0 3px 0 rgba(255,255,255,.65),inset 0 -4px 0 rgba(60,35,85,.12)}
.mg-it.img .mg-in{inset:1px}
.mg-gen.img .mg-in{inset:-3px;background:none;box-shadow:none;border-radius:0;filter:drop-shadow(0 0 4px var(--c)) drop-shadow(0 2px 2px rgba(0,0,0,.4))}
.mg-gen.img.sel .mg-in{border-radius:22%;box-shadow:0 0 0 3px #1e90ff}
.mg-gen.img .mg-in img{width:100%;height:100%}
.mg-it.img .mg-in img{width:94%;height:94%}
.mg-in img{width:78%;height:78%;object-fit:contain;pointer-events:none}
.mg-e{font-weight:400;line-height:1;pointer-events:none}
.mg-lv{position:absolute;right:-1px;bottom:-2px;font-style:normal;font-size:10px;line-height:14px;min-width:15px;text-align:center;background:#4a3a5e;color:#fff;border-radius:8px;padding:0 3px;pointer-events:none;font-weight:800}
.mg-it.drag .mg-in{transform:scale(1.18);box-shadow:0 0 0 2px rgba(60,35,85,.7),0 12px 14px rgba(40,20,60,.4)}
.mg-it.sel .mg-in{box-shadow:0 0 0 3px #1e90ff,0 3px 0 3px rgba(30,100,200,.5)}
.mg-it.can .mg-in{animation:mgGlow .5s infinite alternate}
.mg-it.wig .mg-in{animation:mgWig .5s 2}
.mg-it.lk .mg-in{background-image:linear-gradient(rgba(255,255,255,.38),rgba(255,255,255,.38));background-color:var(--c);box-shadow:0 0 0 2px #5a4a7a,inset 0 0 0 3px rgba(255,255,255,.7);filter:saturate(.7)}
.mg-it.lk .mg-in::before{content:'';position:absolute;inset:2px;border-radius:9px;border:2px dashed #5a4a7a;pointer-events:none}
.mg-it.lk .mg-in::after{content:'🔒';position:absolute;left:-5px;top:-7px;font-size:15px;filter:drop-shadow(0 1px 0 #fff) drop-shadow(0 0 2px #fff)}
.mg-it.lk .mg-e{opacity:.9}
.mg-gen .mg-in{inset:1px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#fff 0,var(--c) 58%,var(--d) 100%);box-shadow:0 0 0 3px #fff,0 0 0 6px var(--d),0 5px 0 6px rgba(40,20,60,.5),0 0 14px 6px var(--c);}
.mg-gen .mg-e{filter:drop-shadow(0 2px 0 rgba(0,0,0,.3));transform:translateY(-3px)}
.mg-gen::before{display:none}
.mg-ch{position:absolute;left:-2px;top:-3px;z-index:3;font-size:9px;background:#fff;border-radius:7px;padding:0 4px;line-height:13px;color:#4a3a5e;pointer-events:none;text-decoration:none;box-shadow:0 1px 0 #0003}
.mg-gen.cd .mg-in{filter:grayscale(.55)}
.mg-gen.first .mg-in{animation:mgPulse .7s infinite}
.mg-gen.gl .mg-in{filter:grayscale(1) brightness(.75);animation:none}
.mg-gen.gl .mg-ch{background:#4a3a5e;color:#fff;right:auto;left:50%;transform:translateX(-50%);top:auto;bottom:11px;white-space:nowrap;font-size:9px}
.mg-gen.gl::after{content:'🔒';position:absolute;left:50%;top:34%;transform:translate(-50%,-50%);font-size:20px;pointer-events:none}
.mg-part .mg-in{background:#dfe8f1;box-shadow:0 0 0 2px #5d7690,0 3px 0 2px rgba(60,80,110,.45);border-radius:6px}
.mg-part .mg-e2{position:absolute;left:1px;top:-1px;font-size:11px;font-weight:400}
.mg-lv:empty{display:none}
.mg-tool .mg-in{outline:3px solid #ffb300;outline-offset:-3px;background:#fff6c9;border-radius:14px}
.mg-it.hint .mg-in{animation:mgHint .55s ease-in-out infinite alternate}
@keyframes mgHint{from{transform:scale(1);filter:brightness(1)}to{transform:scale(1.18);filter:brightness(1.35) drop-shadow(0 0 8px #fff3a0)}}
.mg-info{position:absolute;left:6px;right:6px;top:calc(var(--sf,0px) + 34px);height:20px;z-index:4;background:#fff3c4;border-radius:10px;padding:0 6px;color:#5a2d00;font-weight:700;display:flex;align-items:center;gap:6px;font-size:12px;white-space:nowrap;overflow:hidden}
.mg-info span{flex:1;overflow:hidden;text-overflow:ellipsis}
.mg-info button{padding:1px 10px!important;font-size:11px}
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
<div class="mg-goal"></div><div class="mg-strip"></div><div class="mg-board"></div><div class="mg-info"><span></span></div>
<div class="mg-bot"><button class="mg-rb mg-home" aria-label="町にもどる"><b>🏠</b></button><div class="mg-slots"></div><button class="mg-rb mg-inb"><b>🎁</b>とどいた</button><button class="mg-rb mg-sell"><b>🪙</b>うる</button></div>
<div class="mg-fx"></div>`;
      host.appendChild(root);
      const $ = q => root.querySelector(q);
      const elStrip = $('.mg-strip'), elBoard = $('.mg-board'), elInfo = $('.mg-info'), elSlots = $('.mg-slots'), elFx = $('.mg-fx'), elEn = $('.mg-en'), elQb = $('.mg-qb'), elInb = $('.mg-inb'), elSell = $('.mg-sell');

      // ---- 状態 ----
      let S = null;
      const studySec = () => { try { return env.studySec ? env.studySec() : 0; } catch (e) { return 0; } };
      const genOpen = () => true;   // 生成機は ぜんぶ使える(使いすぎると ひとやすみ → ほかの勉強で すぐ再開)
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
      function newWants(cycle = S.cycle, id) {
        const pool = Object.keys(LINES).filter(ln => Object.keys(GENS).some(g => genOpen(g) && GENS[g].lines.includes(ln))), T = TEND[id] || { fav: [], lv: 0 };
        if (!S.rw) S.rw = [];
        const tot = PATTERNS.reduce((a, p) => a + p[2], 0); let q = Math.random() * tot, pat = PATTERNS[0]; for (const p of PATTERNS) { if ((q -= p[2]) < 0) { pat = p; break; } }
        const mine = S.act.flatMap(a => a.w), out = [];
        [pat[0], pat[1]].sort(() => Math.random() - 0.5).forEach(kind => {
          let best = null;
          for (let t = 0; t < 10 && !best; t++) {
            const cand = pool.filter(ln => !out.some(x => x.ln === ln)), cnt = ln => mine.filter(x => x.ln === ln).length + out.filter(x => x.ln === ln).length;
            const wt = ln => (T.fav.includes(ln) ? 2.2 : 1) / (1 + cnt(ln) * 1.5);   // 好みの系統は出やすい。でも、いま場に多いラインは出にくい
            let tot2 = cand.reduce((a, ln) => a + wt(ln), 0), q2 = Math.random() * tot2, ln = cand[0] || pool[0]; for (const c of cand) { if ((q2 -= wt(c)) < 0) { ln = c; break; } }
            const L = LINES[ln], top = Math.min(7, (L.mergeMax || L.items.length) - 1), rg = LVR[kind];
            let lv = rg[rnd(rg.length)] + (T.lv > 0 && kind !== 'e' ? 0 : 0); lv = Math.max(kind === 'x' ? 1 : 2, Math.min(top, lv + (kind !== 'x' && T.lv < 0 && lv > 4 && Math.random() < 0.5 ? -1 : 0) + (kind !== 'x' && T.lv > 0 && lv < 7 && Math.random() < 0.4 ? 1 : 0) + (cycle >= 3 && kind === 'h' && lv < top ? 1 : 0)));
            const key = ln + lv, dup = mine.some(x => x.ln === ln && x.lv === lv) || S.rw.includes(key) || mine.filter(x => x.ln === ln).length >= 3;
            if (!dup || t === 9) best = { ln, lv, got: false };
          }
          out.push(best);
        });
        out.forEach(w => { S.rw.push(w.ln + w.lv); }); if (S.rw.length > 30) S.rw.splice(0, S.rw.length - 30);
        return out;
      }
      function fillAct(cycle) { while (S.act.length < CFG.vis && S.queue.length) { const id = S.queue.shift(); if (S.act.some(a => a.id === id)) continue; S.act.push({ id, w: newWants(cycle, id) }); } }
      if (S.goal == null) S.goal = 0; if (!S.gp) S.gp = {};
      if (!S.act.length && S.queue.length) fillAct();
      const TOOLS = { cut: { icon: '✂️', name: 'ハサミ', tip: '品にドラッグ → Lvを1つ下げて2つに分ける(空きマスが1つ必要)' }, up: { icon: '⬆️', name: 'アップグレード', tip: '品にドラッグ → Lvが1つ上がる(Lv5まで)' }, swap: { icon: '🔄', name: 'しゅるい変換', tip: '品にドラッグ → Lvは1つ下がるけど、ほしがられてる別のラインの品に変わる' } };
      const defOf = o => o.t === 'it' ? { name: LINES[o.ln].items[o.lv - 1][0], icon: LINES[o.ln].items[o.lv - 1][1], color: LINES[o.ln].color, key: o.ln + o.lv, en: LINES[o.ln].items[o.lv - 1][2] || '' }
        : o.t === 'tool' ? { name: TOOLS[o.k].name, icon: TOOLS[o.k].icon, color: '#fff0b3', key: 'tool_' + o.k }
        : o.t === 'gen' ? { name: GENS[o.g].name, icon: GENS[o.g].icon, color: GENS[o.g].color, key: 'gen_' + o.g }
          : { name: GENS[o.g].name + 'のパーツ', icon: '⚙️', color: '#dfe8f1', key: 'part_' + o.g };
      const art = (d, cls = 'mg-e') => IMG[d.key] ? `<img src="${IMG[d.key]}" alt="">` : `<b class="${cls}">${d.icon}</b>`;
      const is = (o, p) => o.t === 'it' && o.ln === p[0] && o.lv === p[1];
      function mergeOf(a, b) {
        if (!a || !b || a === b || a.lk || a.t !== b.t || a.t === 'tool') return null;   // ロック品(b)には、同じものを重ねられる(ひらく)
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
      function safeTop() { try { const t = document.createElement('div'); t.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:var(--tw-top,0px);visibility:hidden'; root.appendChild(t); const h = t.offsetHeight; t.remove(); return h || 0; } catch (e) { return 0; } }
      function layout() {
        const W = root.clientWidth, H = root.clientHeight; if (!W || !H) return;
        const SAFE = safeTop(); root.style.setProperty('--sf', SAFE + 'px');
        const TOP = SAFE + 54, BOT = 56;   // 上のバー+お題の行 / 下のボタン列
        const SP0 = 38, rowsH = CFG.rows, MINSH = 60;   // 盤面がいちばん大事: 横いっぱいを先に決め、縦がたりなければ住人カードを小さくする。それでもたりないときだけ盤面を小さくする
        let cw = W >= 520 ? 230 : Math.floor((W - 18) / 2);
        CS = Math.floor((W - 4) / CFG.cols);
        const bw = CS * CFG.cols + 4, bh = CS * rowsH + 4, spare = H - TOP - bh - BOT - 6;
        SH = Math.max(MINSH, Math.min(spare, 64 + SP0)); const off = Math.max(0, Math.floor((spare - SH) / 2));
        const tiny = SH < 96; elStrip.classList.toggle('tiny', tiny);   // 縦がせまい画面: 名前とハートを消して、絵だけにする
        const pz = tiny ? Math.max(30, Math.min(60, SH - 12)) : Math.max(44, Math.min(64, Math.round(cw * 0.33), SH - SP0)), ws = Math.max(28, Math.min(56, Math.floor((cw - pz - 24) / 2), tiny ? SH - 14 : 56));
        BX = Math.round((W - bw) / 2) + 2; BY = TOP + off + SH + 6;
        elStrip.style.height = SH + 'px'; elStrip.style.top = (TOP + off) + 'px';
        elStrip.style.setProperty('--cw', cw + 'px'); elStrip.style.setProperty('--pz', pz + 'px'); elStrip.style.setProperty('--ws', ws + 'px');
        elBoard.style.cssText = `left:${BX - 2}px;top:${BY - 2}px;width:${bw}px;height:${bh}px`;
        if (!elBoard.children.length) for (let i = 0; i < N; i++) { const c = document.createElement('div'); c.className = 'mg-cell' + ((i + Math.floor(i / CFG.cols) * (CFG.cols % 2 ? 0 : 1)) % 2 ? ' d' : ''); elBoard.appendChild(c); }
        [...elBoard.children].forEach((c, i) => { c.style.cssText = `left:${2 + (i % CFG.cols) * CS + 1}px;top:${2 + Math.floor(i / CFG.cols) * CS + 1}px;width:${CS - 2}px;height:${CS - 2}px`; });
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
        el.className = 'mg-it' + (IMG[d.key] ? ' img' : '') + (o.t === 'gen' ? ' mg-gen' : o.t === 'part' ? ' mg-part' : o.t === 'tool' ? ' mg-tool' : '') + (o.lk ? ' lk' : ''); el.dataset.u = o.u;
        const gd = o.t === 'gen' ? GENS[o.g] : null;
        el.innerHTML = `<div class="mg-in" style="--c:${d.color};${gd ? `--d:${gd.dark}` : ''}">${art(d)}${o.t === 'part' ? `<b class="mg-e2">${GENS[o.g].icon}</b>` : ''}<i class="mg-lv">${o.t === 'tool' ? (o.n > 1 ? '×' + o.n : '') : o.t === 'gen' ? 'Lv ' + o.lv : o.t === 'part' ? o.lv : ''}</i>${o.t === 'gen' ? '<u class="mg-ch"></u>' : ''}</div>`;
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
        el.classList.toggle('cd', !!o.cd); el.querySelector('.mg-ch').textContent = o.cd ? `⏳${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : `⚡${o.ch}回`;
      }
      const center = o => { const p = posOf(o); return { x: p.x + CS / 2, y: p.y + CS / 2 }; };
      // ---- ひとやすみ中の生成機: 待つか、ほかの勉強で すぐ再開 ----
      const studyList = () => { try { const L = env.studyList ? env.studyList() : []; return L.slice().sort((x, y) => (y.days == null || y.days > 900 ? 999 : y.days) - (x.days == null || x.days > 900 ? 999 : x.days) || Math.random() - 0.5).filter(x => x.days !== 0).concat(L.filter(x => x.days === 0)); } catch (e) { return []; } };
      function restDialog(g) {
        const L = studyList(); let i = 0; const gd = GENS[g.g];
        const o = overlay('');
        const draw = () => {
          const left = g.cd ? Math.max(0, Math.ceil((g.cd - Date.now()) / 1000)) : 0, x = L[i % Math.max(1, L.length)];
          o.querySelector('.mg-card').innerHTML = `<h3>${gd.icon} ${gd.name}は ひとやすみ中</h3><p style="font-size:13px;margin:4px 0 10px">あと ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} で もどるよ。<br>ほかの勉強をすると、<b style="color:#e8366a">すぐ再開</b>できる!</p>`
            + (x ? `<div style="background:#fff;border-radius:16px;padding:12px;box-shadow:inset 0 0 0 2px #cdb6e6;margin-bottom:10px"><div style="font-size:11px;color:#8a76a6">📚 おすすめ</div><div style="font-size:19px;margin:4px 0">${esc(x.n)}</div><div style="font-size:11px;color:#8a76a6">${x.days == null || x.days > 900 ? 'まだ やったことがないよ' : x.days === 0 ? 'きょうも やったよ' : `${x.days}日ぶり`}</div></div><button data-go style="background:linear-gradient(160deg,#ff9fb5,#ff6f91)!important;color:#fff!important;font-size:15px;padding:10px 24px!important;box-shadow:0 3px 0 #c2335b!important">これをやる!</button> ${L.length > 1 ? '<button data-other>ほかのにする</button>' : ''} <button data-x>まつ</button>` : '<p style="font-size:12px">いまは おすすめできる勉強が ないみたい。ちょっと まってね。</p><button data-x>まつ</button>');
          o.querySelector('[data-other]')?.addEventListener('click', () => { i++; sfx('tap'); draw(); });
          o.querySelector('[data-go]')?.addEventListener('click', e => { e.stopPropagation(); sfx('give'); S.recov = { id: x.id, n: x.n, base: studySec(), pl: (env.studyPlays ? env.studyPlays(x.id) : 0), t: Date.now() }; save(); o.remove(); try { ctx.close(); } catch (er) { } setTimeout(() => { try { env.studyGo && env.studyGo(x.id); } catch (er) { } }, 250); });
        };
        draw();
      }
      function releaseAll(why) {
        const rest = S.cells.filter(o => o && o.t === 'gen' && o.cd); S.recov = null; if (!rest.length) return; save();
        rest.forEach(o => { o.cd = 0; o.ch = CFG.genCharge(o.lv); genUI(o); const c = center(o); setTimeout(() => { burst(c.x, c.y, 16, ['#ffc400', '#fff', GENS[o.g].color]); sfx('unlock'); pop(els.get(o.u), 1.4); }, 700); });
        setTimeout(() => toast(`✨ ${why || '勉強ありがとう!'} 生成機が すぐ使えるよ`), 700);
      }
      function checkRecov() {
        if (!S.recov) return; const rest = S.cells.some(o => o && o.t === 'gen' && o.cd); if (!rest) { S.recov = null; return; }
        let done = false; try { if (env.studyPlays && env.studyPlays(S.recov.id) > (S.recov.pl || 0)) done = true; } catch (e) { }   // 終わりまでやった
        if (!done && studySec() - S.recov.base >= 60) done = true;   // 勉強の時間が1分たまった
        if (!done && S.recov.t && Date.now() - S.recov.t >= 120000) done = true;   // 離れて2分以上たった(途中でやめても解放)
        if (done) releaseAll(`「${S.recov.n}」ありがとう!`);
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
        if (g.cd) { shake(el); sfx('bad'); restDialog(g); return; }
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
      // ---- お題: 作ったものが目標に入っていたら進む。達成でコイン→つぎのお題 ----
      function goalOn(key) {
        const G = GOALS[S.goal % GOALS.length]; if (!G.keys.includes(key) || S.gp[key]) return; S.gp[key] = 1; const n = Object.keys(S.gp).length;
        if (n >= G.n) { const dk = new Date().toDateString(); if (!S.gd || S.gd.d !== dk) S.gd = { d: dk, n: 0 }; const got = S.gd.n < 3 ? ctx.wallet.give(Math.max(1, Math.round(G.coin / 10)), 'merge:goal') : 0; S.gd.n++; S.goal++; S.gp = {}; setTimeout(() => giveTool('up'), 1600); setTimeout(() => { banner('🎉 お題クリア!' + (got ? ` <small>🪙+${got}</small>` : '')); sfx('fanfare'); goalDraw(); }, 900); } else goalDraw();
        save();
      }
      function goalDraw() { const G = GOALS[S.goal % GOALS.length], n = Object.keys(S.gp).length; $('.mg-goal').innerHTML = `📌 今日のお題 ${(S.goal % GOALS.length) + 1}/${GOALS.length}: ${esc(G.t)} <b>${n}/${G.n}</b> ・🪙${G.coin}`; }
      function see(o) {
        const d0 = defOf(o); if (o.t === 'it') { try { social.markMade(d0.key); } catch (e) { } goalOn(d0.key); }
        const d = d0; if (o.t !== 'it' || S.seen[d.key]) return; S.seen[d.key] = 1;
        if (['cafeB8', 'cafeA9', 'cafeB9'].includes(d.key)) setTimeout(() => toast('カフェの新メニューになったよ!(町のカフェで買える)'), 1600);
        if (o.lv >= 3) { banner(`✨ NEW! ${d.icon} ${esc(d.name)}`); sfx('new'); }
      }

      // ---- マージ ----
      let combo = 0, comboT = 0;
      // ---- 道具: ハサミ(Lv-1で2つ)・アップグレード(Lv+1)・しゅるい変換(Lv-1で、ほしがられてる別ライン) ----
      const topOf = ln => (LINES[ln].mergeMax || LINES[ln].items.length);
      function toolOk(o, t) { if (!t || t.t !== 'it' || t.b == null) return false; if (o.k === 'cut') return t.lv >= 2 && nearestEmpty(t.b) >= 0; if (o.k === 'up') return t.lv <= 4 && t.lv < topOf(t.ln); return t.lv >= 2 && swapLines(t).length > 0; }
      function swapLines(t) {
        const open = Object.keys(LINES).filter(ln => ln !== t.ln && Object.keys(GENS).some(g => genOpen(g) && GENS[g].lines.includes(ln)));
        const want = S.act.flatMap(a => a.w).filter(w => !w.got).map(w => w.ln).filter(ln => open.includes(ln));
        return want.length ? want : open;
      }
      function reform(t, ln, lv) { const idx = t.b, c = center(t); take(t); rm(t); const o = { u: ++S.n, t: 'it', ln, lv, b: null, s: null }; S.cells[idx] = o; o.b = idx; const el = mk(o); el.querySelector('.mg-in').animate([{ transform: 'scale(.3)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' }); burst(c.x, c.y, 10, ['#ffc400', '#fff', '#8fd3ff']); see(o); return o; }
      function useTool(o, t) {
        if (!toolOk(o, t)) return false; const c = center(t);
        if (o.k === 'cut') { const to = nearestEmpty(t.b), ln = t.ln, lv = t.lv - 1; reform(t, ln, lv); dropIn({ u: ++S.n, t: 'it', ln, lv, b: null, s: null }, to, c); }
        else if (o.k === 'up') reform(t, t.ln, t.lv + 1);
        else { const L = swapLines(t); reform(t, L[rnd(L.length)], t.lv - 1); }
        if ((o.n || 1) > 1) { o.n--; tooLabel(o); moveEl(o); } else { take(o); rm(o); }
        sel = null; sfx('merge'); ftext(c.x, c.y - CS * 0.3, TOOLS[o.k].icon, '#e87a00'); save(); refresh(); return true;
      }
      function tooLabel(o) { const e = els.get(o.u); if (e) { const l = e.querySelector('.mg-lv'); if (l) l.textContent = o.n > 1 ? '×' + o.n : ''; } }
      const stackOf = k => k === 'cut' ? [...S.cells, ...S.store].find(x => x && x.t === 'tool' && x.k === 'cut') : null;   // ハサミだけは、重ねて持てる
      function giveTool(k, from) {
        const ex = stackOf(k); if (ex) { ex.n = (ex.n || 1) + 1; tooLabel(ex); const e = els.get(ex.u); if (e) pop(e, 1.25); sfx('pop'); toast(`${TOOLS[k].icon} ${TOOLS[k].name}をもらった!(×${ex.n})`); save(); return; }
        const ibx = k === 'cut' ? S.inbox.find(x => x.t === 'tool' && x.k === 'cut') : null; if (ibx) { ibx.n = (ibx.n || 1) + 1; toast(`${TOOLS[k].icon} ${TOOLS[k].name}をもらった!(🎁とどいた)`); save(); refresh(); return; }
        const to = nearestEmpty(Math.floor(N / 2)), f = from || { x: root.clientWidth / 2, y: root.clientHeight / 2 };
        if (to >= 0) { dropIn({ u: ++S.n, t: 'tool', k, b: null, s: null }, to, f); sfx('pop'); } else S.inbox.push({ t: 'tool', k });
        toast(`${TOOLS[k].icon} ${TOOLS[k].name}をもらった!` + (to < 0 ? '(🎁とどいた)' : '')); save(); refresh();
      }
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
        return `<div class="mg-npc" data-npc="${id}"><div class="mg-pc">${pic ? `<img src="${pic}" alt="">` : `<div class="mg-np">${esc((NPC_NAME[id] || id).slice(0, 2))}</div>`}<div class="mg-nm">${esc(NPC_NAME[id] || id)}</div><div class="mg-hr">💗<i><b style="width:${g.pct}%"></b></i></div></div><div class="mg-ws">${a.w.map((w, k) => { const d = defOf({ t: 'it', ln: w.ln, lv: w.lv }); return `<div class="mg-w" data-w="${k}" style="--c:${d.color}">${art(d, 'mg-we')}</div>`; }).join('')}</div></div>`;
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
          const n = CFG.affOf(w.lv); let up = null; try { up = social.addAff(id, n); social.mergeNote(id, d.name, d.icon, w.lv); } catch (e) { } try { env.speak && d.en && env.speak(d.en); } catch (e) { }
          sfx('heart'); try { if (w.lv >= 5) social.addCredit(id, 1); } catch (e) { } S.gave++;
          ftext(to.x, to.y - 10, `💗 好感度 +${n}`, '#e8366a', true);
          ['💗', '💕', '💗'].forEach((h, i) => setTimeout(() => ftext(to.x + (i - 1) * 22, to.y + 14, h), 120 + i * 120));
          const gf = card.querySelector('.mg-hr b'); if (gf) { const g = gaugeOf(id); gf.style.width = g.pct + '%'; }
          card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 320 });
          slot.classList.remove('rdy'); slot.classList.add('got');
          banner(`${esc(NPC_NAME[id] || id)}「ありがとう!」 <small>💗+${n}</small>${w.lv >= 5 ? ' <small>🎁とっておき+1</small>' : ''}` + (up && up.up ? ` <small>✨なかよし度アップ!</small>` : ''));
          if (Math.random() < CFG.partChance) { const gk = Object.keys(GENS); S.inbox.push({ t: 'part', g: gk[rnd(gk.length)], lv: 1 }); setTimeout(() => { fly('⚙️', to, rel(elInb), 520, () => pop2(elInb)); toast('生成機のパーツをもらった!(🎁とどいた から出せるよ)'); refresh(); }, 500); }
          save();
          if (a.w.every(x => x.got)) { if (!a.leaving) { a.leaving = true; setTimeout(() => leave(id), 650); } } else { sig = ''; refresh(); }
        }), 60);
      }
      // お返し: 帰る人が、渡した品とは ちがうラインの品を1つだけくれる(レベルは渡した2つの低いほう以上。ときどき、いま必要な最高Lvの1つ下)
      function thanksGift(a, card) {
        const lows = a.w.map(w => w.lv), lo = Math.min(...lows), hi = Math.max(...lows), used = a.w.map(w => w.ln);
        const open = Object.keys(LINES).filter(ln => !used.includes(ln) && Object.keys(GENS).some(g => genOpen(g) && GENS[g].lines.includes(ln)));
        const others = S.act.flatMap(x => x.w).filter(w => !w.got).sort((x, y) => y.lv - x.lv);
        let ln, lv, jack = false;
        if (others.length && Math.random() < 0.07) { const t = others[0]; ln = t.ln; lv = Math.max(2, t.lv - 1); jack = true; }
        else {
          const want = others.map(w => w.ln).filter(l => !used.includes(l)); ln = (want.length && Math.random() < 0.5 ? want : open)[rnd((want.length && Math.random() < 0.5 ? want : open).length)] || open[rnd(open.length)] || Object.keys(LINES)[0];
          lv = lo + rnd(hi - lo + 1);
        }
        const L = LINES[ln]; lv = Math.max(1, Math.min(lv, (L.mergeMax || L.items.length) - 1));
        const o = { t: 'it', ln, lv }, d = defOf(o), from = card ? rel(card) : { x: root.clientWidth / 2, y: BY }, to = nearestEmpty(Math.floor(N / 2));
        setTimeout(() => {
          if (to >= 0) dropIn({ u: ++S.n, ...o, b: null, s: null }, to, from); else { S.inbox.push(o); refresh(); }
          sfx('pop'); banner(`${esc(NPC_NAME[a.id] || a.id)}の お返し: ${d.icon} ${esc(d.name)} Lv${lv}${jack ? ' ✨とっておき!' : ''}` + (to < 0 ? ' <small>(🎁とどいたへ)</small>' : '')); if (jack) setTimeout(() => giveTool('up'), 900); else if (Math.random() < 0.03) setTimeout(() => giveTool(Math.random() < 0.5 ? 'cut' : 'swap'), 900); save();
        }, 560);
      }
      function leave(id) {   // 2つそろった人は、よろこんで帰り、あたらしい人が来る
        const c = elStrip.querySelector(`[data-npc="${id}"]`), ai = S.act.findIndex(x => x.id === id); if (ai < 0) return;
        leavingN++;
        const done = () => {
          leavingN = Math.max(0, leavingN - 1); const ix = S.act.findIndex(x => x.id === id); if (ix < 0) return; const gone = S.act[ix]; S.act.splice(ix, 1); try { thanksGift(gone, c); } catch (e) { } S.served++; fillAct(); sig = ''; save();
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
        try { env.speak && d.en && env.speak("I'd love a " + d.en + '!'); } catch (e) { }
        if (1) { evoPop(w.ln, w.lv, true); S.cells.forEach(x => { if (x && x.t === 'gen' && x.g === gk) { const e = els.get(x.u); e.classList.remove('wig'); void e.offsetWidth; e.classList.add('wig'); } }); return; }
        toast(`${NPC_NAME[id] || id}「I'd love ${d.en}!」(${d.name} Lv${w.lv}) → ${GENS[gk].icon}${GENS[gk].name}${genOpen(gk) ? '' : '(ロック中)'}`);
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
        if (Math.random() < 0.4) { const tk = Math.random() < 0.5 ? 'cut' : 'swap'; setTimeout(() => giveTool(tk), 2200); }
        save();
        const f = document.createElement('div'); f.className = 'mg-fin'; root.appendChild(f);
        const ck = document.createElement('div'); ck.className = 'mg-ck'; ck.innerHTML = pic ? `<img src="${pic}" alt="">` : '<b style="font-size:70px;font-weight:400">☁️</b>'; root.appendChild(ck);
        banner('🎉 13人ぜんいんに わたせた!'); sfx('fanfare');
        const y0 = BY + CS * 2.2, amp = CS * 1.5, x0 = -130, x1 = W + 40, T = 3100;
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
      const priceOf = o => o.t === 'it' ? Math.max(1, Math.round((CFG.sell[o.lv - 1] || 1) / 5)) : Math.max(1, Math.round(CFG.partSell * o.lv / 5));
      function sell(o) {
        if (o.t === 'gen' || o.t === 'tool' || o.lk) { sfx('bad'); toast(o.lk ? 'ロック中は売れないよ' : o.t === 'tool' ? '道具は売れないよ' : '生成機は売れないよ'); moveEl(o); return; }
        const c = rel(els.get(o.u)), got = ctx.wallet.give(priceOf(o), 'merge:sell'); take(o); rm(o); sel = null;
        fly('🪙', c, rel(root.querySelector('[data-bind="coins"]')), 520); ftext(rel(elSell).x, rel(elSell).y - 30, `🪙+${got}`, '#d68600'); sfx('sell'); save(); refresh();
      }
      function buySlot() {
        const p = CFG.slotPrice(S.slots); if (ctx.wallet.get() < p) { sfx('bad'); toast(`コインが足りないよ(🪙${p})`); return; }
        if (!ctx.wallet.spend(p, 'merge:slot')) return; S.slots++; sfx('unlock'); drawSlots(); save(); toast('保管枠が ふえた!');
      }
      $('.mg-home').onclick = () => { sfx('tap'); try { ctx.close(); } catch (e) { } };
      elInb.onclick = () => {
        if (!S.inbox.length) { sfx('tap'); toast('とどいた物は ないよ(住人にわたすと、ときどきパーツがとどく)'); return; }
        const to = nearestEmpty(Math.floor(N / 2)); if (to < 0) { sfx('bad'); toast('盤面がいっぱい!'); return; }
        const it = S.inbox.shift(), o = { u: ++S.n, ...it, b: null, s: null }; dropIn(o, to, rel(elInb)); sfx('pop'); save(); refresh();
      };
            // ---- 進化のみちポップアップ: 生成機・Lv1→最大・いまの段階・あといくつ必要か ----
      function evoPop(ln, lv, want) {
        const L = LINES[ln], gk = Object.keys(GENS).find(g => GENS[g].lines.includes(ln)), G = GENS[gk], mx = L.mergeMax || L.items.length;
        const cnt = Array.from({ length: mx + 1 }, (_, i) => S.cells.filter(o => o && o.t === 'it' && o.ln === ln && o.lv === i && !o.lk).length);
        let have = 0; for (let i = 1; i <= lv; i++) have += cnt[i] * Math.pow(2, i - 1); const need = Math.pow(2, lv - 1), lack = Math.max(0, need - have);
        const row = L.items.slice(0, mx).map((it, i) => { const n = i + 1, on = n === lv, c = cnt[n] || 0; return `<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:10px;${on ? 'background:#ffe48a;font-weight:800' : ''}"><span style="width:34px;font-size:12px">Lv${n}</span><span style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:22px">${IMG[ln + n] ? `<img src="${IMG[ln + n]}" style="width:30px;height:30px;object-fit:contain" alt="">` : it[1]}</span><span style="flex:1;font-size:12px">${true ? esc(it[0]) + (it[2] ? ' <small style="color:#888">' + esc(it[2]) + '</small>' : '') : '？'}</span><span style="font-size:12px;color:${c ? '#1f9d63' : '#bbb'}">${c ? 'いま ' + c + 'こ' : '−'}</span></div>`; }).join('<div style="text-align:center;font-size:10px;color:#b79ad3;line-height:8px">▼ 同じものを2つ</div>');
        const head = want ? `${esc(L.items[lv - 1][1])} <b>${esc(L.items[lv - 1][0])}</b> (Lv${lv}) がほしいんだって` : `${esc(L.items[lv - 1][1])} <b>${esc(L.items[lv - 1][0])}</b> Lv${lv}`;
        const st = lv >= mx ? 'いちばん上のレベルだよ!' : want ? (cnt[lv] ? '✨ もう持ってる! 渡せるよ' : lack === 0 ? '材料はそろってる! あとは かさねるだけ' : `Lv1に直すと、あと <b>${lack}こ</b> ぶん たりないよ`) : `つぎ → Lv${lv + 1}(同じものをもう1つ かさねる)`;
        sfx('tap'); overlay(`<h3>${head}</h3><div style="font-size:12px;margin-bottom:6px">${G.icon} <b>${esc(G.name)}</b> から出てくるよ${genOpen(gk) ? '' : '(いまロック中)'} ・ ${st}</div>${row}<div style="text-align:center;margin-top:8px"><button data-x>とじる</button></div>`);
      }
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
        let got = 0, open = true, streak = 0;
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
            if (ok) { streak++; const bonus = Math.min(4, Math.floor(streak / 3)), g = addEn(CFG.quizGain + bonus, rel(b)); got += g; sfx('quizok'); gg.textContent = `⚡+${got}` + (streak >= 3 ? ` ・ 🔥${streak}連続!` : ''); sub.textContent = (streak >= 3 ? `🔥${streak}連続! ⚡+${CFG.quizGain + bonus} ` : '') + (Q.ex ? Q.ex.en : 'せいかい!'); } else { streak = 0; sfx('quizng'); sub.textContent = `こたえ: ${Q.ans}`; }
            save(); setTimeout(() => { if (open) ask(); }, ok ? 700 : 1400);
          });
        };
        ask();
      };

      // ---- 情報の行 ----
      let sel = null;
      function info() {
        els.forEach((e, u) => { e.classList.toggle('sel', !!sel && sel.u === u); const t = byU(u); e.classList.toggle('hint', !!(sel && t && t !== sel && (t.b != null) && (sel.t === 'tool' ? toolOk(sel, t) : mergeOf(sel, t)))); });
        const sp = elInfo.querySelector('span'); elInfo.querySelector('button')?.remove();
        if (sel && byU(sel.u)) {
          const d = defOf(sel);
          if (sel.t === 'tool') sp.textContent = `${TOOLS[sel.k].icon} ${TOOLS[sel.k].name} ・ ${TOOLS[sel.k].tip}`;
          else if (sel.t === 'gen') sp.textContent = sel.gl ? `🔒 ${d.name} ・ ほかの勉強をあと${leftMin(sel.g)}分で使えるよ` : `${d.icon} ${d.name} Lv${sel.lv} ・ タップで品が出る(⚡1)。同じLvを重ねると強くなる`;
          else if (sel.lk) sp.textContent = `🔒 ${d.name} Lv${sel.lv} ・ 同じものを重ねると ひらく`;
          else { const L = sel.t === 'it' ? LINES[sel.ln] : null, nx = L && L.items[sel.lv] ? ` → つぎ: ${S.seen[sel.ln + (sel.lv + 1)] ? L.items[sel.lv][0] : '？'}` : ''; sp.textContent = `${d.icon} ${d.name} Lv${sel.lv}${nx}`; const b = document.createElement('button'); b.textContent = `売る 🪙${priceOf(sel)}`; b.onclick = () => { const o = sel; if (o && byU(o.u)) sell(o); }; elInfo.appendChild(b); }
        } else sp.textContent = '';
        elInfo.style.display = sp.textContent ? 'flex' : 'none';
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
        if (o.t === 'it') drag.lp = setTimeout(() => { if (drag && drag.o === o && !drag.moved) { drag.long = 1; sfx('tap'); evoPop(o.ln, o.lv, false); } }, 480);   // 長押し: 進化のみち
        try { el.setPointerCapture(e.pointerId); } catch (er) { }
      }
      function move(e) {
        if (!drag || e.pointerId !== drag.id) return; const d = drag;
        if (!d.moved) { if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8 || d.o.lk || d.o.gl) return; clearTimeout(d.lp); d.moved = true; d.el.classList.add('drag'); sfx('tap'); marks(true); }
        const R = root.getBoundingClientRect(); tf(d.el, e.clientX - R.left - d.ox, e.clientY - R.top - d.oy - 6);
        const r = elSell.getBoundingClientRect(); elSell.classList.toggle('hot', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top - 10);
      }
      function up(e) {
        if (!drag || e.pointerId !== drag.id) return; const d = drag, o = d.o; clearTimeout(d.lp); drag = null; marks(false); d.el.classList.remove('drag');
        if (!d.moved) { if (e.type === 'pointercancel' || d.long) return; if (o.t === 'gen' && o.b != null) { sel = o; spawn(o); info(); } else { sel = sel === o ? null : o; sfx('tap'); pop(d.el, 1.12); info(); } return; }
        if (e.type === 'pointercancel') { moveEl(o); return; }
        const R = root.getBoundingClientRect(), x = e.clientX - R.left, y = e.clientY - R.top, cx = Math.floor((x - BX) / CS), cy = Math.floor((y - BY) / CS);
        const from = o.b != null ? { b: o.b } : { s: o.s };
        if (cx >= 0 && cx < CFG.cols && cy >= 0 && cy < CFG.rows) {
          const i = cy * CFG.cols + cx, t = S.cells[i];
          if (!t) { put(o, { b: i }); sfx('land'); }
          else if (t === o) moveEl(o);
          else if (o.t === 'tool' && o.k === 'cut' && t.t === 'tool' && t.k === 'cut') { t.n = (t.n || 1) + (o.n || 1); take(o); rm(o); tooLabel(t); sfx('merge'); sel = null; save(); refresh(); }
          else if (o.t === 'tool') { if (!useTool(o, t)) { moveEl(o); shake(els.get(t.u)); sfx('bad'); toast('そこには使えないよ'); } return; }
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
      const tick = setInterval(() => { if (!alive) return; enTick(); checkRecov(); S.cells.forEach(o => { if (o && o.t === 'gen') genUI(o); }); if (!drag && !finBusy && !root.querySelector('.mg-ovl') && ++idle % 7 === 0) hint(); }, 1000);
      const onRz = () => layout(); window.addEventListener('resize', onRz);

      // ---- はじめ ----
      layout(); goalDraw(); S.cells.forEach(o => o && mk(o)); S.store.forEach((o, i) => { if (o) { if (i >= S.slots) { S.store[i] = null; S.inbox.push({ t: o.t, ln: o.ln, g: o.g, lv: o.lv }); } else mk(o); } });
      if (S.first) S.cells.forEach(o => { if (o && o.t === 'gen' && genOpen(o.g)) els.get(o.u).classList.add('first'); });
      sig = ''; enTick(); refresh(); checkRecov();
      requestAnimationFrame(() => { if (alive) layout(); });
      try { ctx.setTitle('チャンクマージ'); } catch (e) { }

      return { unmount() { alive = false; clearInterval(tick); clearTimeout(saveT); clearTimeout(banT); clearTimeout(toastT); window.removeEventListener('resize', onRz); try { ctx.storage.set('s', S); } catch (e) { } try { env.speakStop && env.speakStop(); } catch (e) { } root.remove(); ck_cleanup(); } };
      function ck_cleanup() { document.querySelectorAll('.mg-ck').forEach(e => e.remove()); }
    },
  };
}
