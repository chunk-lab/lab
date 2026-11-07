// 本格3Dビリヤード(9ボール / 8ボール)。物理は ./billiards/phys.js、見た目は view.js、ルールは rules.js、CPUは ai.js
//   ねらう:台をさわった方へ(手球視点では左右ドラッグ)/ 下の帯=微調整 / 右のキューを下へ引いて はなす=突く(引くほど強い)
//   回転:左下の手球をタップ → 当てる点をえらぶ(上=押し・下=引き・左右=ひねり)/ 📷=視点の切りかえ
import * as P from './billiards/phys.js';
import { createView, CLOTHS } from './billiards/view.js';
import { judge, legalFirst, lowest, cleared, grp, GNAME } from './billiards/rules.js';
import { plan } from './billiards/ai.js';
import { loop } from '../kit.js';

const CSS = `.bd{position:absolute;inset:0;pointer-events:none;font-family:inherit;user-select:none;-webkit-user-select:none;color:#f3ead8}
.bd *{box-sizing:border-box}
.bd .pw,.bd .bot>*,.bd .skip,.bd .ov{pointer-events:auto}
.bd .vg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 48%,transparent 55%,rgba(0,0,0,.55))}
.bd .hud{position:absolute;left:8px;right:8px;top:8px;display:flex;gap:6px;pointer-events:none}
.bd .pl{flex:1;min-width:0;padding:6px 9px;border-radius:12px;background:rgba(16,12,10,.62);border:1px solid rgba(201,162,90,.25);font-size:12px;line-height:1.35;transition:all .25s}
.bd .pl.on{border-color:#c9a25a;box-shadow:0 0 0 2px rgba(201,162,90,.35),0 4px 14px #0008;background:rgba(36,26,16,.8)}
.bd .pl b{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bd .pl .w{color:#c9a25a;font-size:11px}
.bd .pl .bl{display:flex;flex-wrap:wrap;gap:2px;margin-top:3px;min-height:14px}
.bd .bi{width:14px;height:14px;border-radius:50%;font-size:8px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;color:#111;box-shadow:inset -2px -2px 3px rgba(0,0,0,.35)}
.bd .bi.gone{opacity:.22}
.bd .msg{position:absolute;left:50%;top:22%;transform:translate(-50%,-50%);padding:9px 18px;border-radius:14px;background:rgba(10,8,6,.78);border:1px solid rgba(201,162,90,.5);font-weight:800;font-size:15px;text-align:center;pointer-events:none;opacity:0;transition:opacity .25s;max-width:86%;white-space:pre-line}
.bd .msg.on{opacity:1}.bd .msg small{display:block;font-size:11px;font-weight:600;color:#d8c9a8}
.bd .tip{position:absolute;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);font-size:11px;color:#e8dcc0;background:rgba(10,8,6,.55);padding:4px 10px;border-radius:10px;pointer-events:none;white-space:nowrap}
.bd .pw{position:absolute;right:6px;top:26%;height:44%;width:38px;border-radius:19px;background:linear-gradient(rgba(28,21,16,.72),rgba(42,31,23,.72));border:1px solid rgba(201,162,90,.4);touch-action:none;box-shadow:inset 0 2px 8px #000a;overflow:visible}
.bd .pw .clip{position:absolute;inset:0;border-radius:19px;overflow:hidden;pointer-events:none}
.bd .pw i{position:absolute;left:4px;right:4px;top:4px;height:0;border-radius:15px;background:linear-gradient(#f3d27a,#e0762c 70%,#c8152d)}
.bd .pw em{position:absolute;left:50%;top:6px;transform:translateX(-50%);width:10px;height:calc(100% - 12px);border-radius:5px;background:linear-gradient(#e9d6ad,#e2c99a 55%,#2a140c 56%,#2a140c 78%,#111 79%);pointer-events:none;transition:transform .05s}
.bd .pw span{position:absolute;left:50%;top:-30px;transform:translateX(-50%);font-size:10px;line-height:1.2;text-align:center;color:#d8c9a8;white-space:nowrap;text-shadow:0 1px 2px #000}
.bd .bot{position:absolute;left:8px;right:8px;bottom:calc(10px + env(safe-area-inset-bottom,0px));display:flex;gap:8px;align-items:center}
.bd .sp{width:62px;height:62px;flex:none;border-radius:50%;border:2px solid rgba(201,162,90,.6);background:radial-gradient(circle at 38% 32%,#fff,#ece6d8 55%,#b9b2a2);position:relative;touch-action:none}
.bd .sp i,.bd .spp i{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#c8152d;box-shadow:0 0 0 2px #fff8}
.bd .fine{flex:1;height:52px;border-radius:14px;border:1px solid rgba(201,162,90,.4);background:#17110d repeating-linear-gradient(90deg,rgba(233,214,173,.55) 0 1px,transparent 1px 12px);touch-action:none;position:relative;overflow:hidden}
.bd .fine::after{content:'◀ 微調整 ▶';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#f3ead8;text-shadow:0 1px 3px #000}
.bd .cb{width:52px;height:52px;flex:none;border-radius:14px;border:1px solid rgba(201,162,90,.5);background:rgba(23,17,13,.85);color:#f3ead8;font:inherit;font-size:20px}
.bd .skip{position:absolute;right:8px;bottom:calc(84px + env(safe-area-inset-bottom,0px));border:1px solid rgba(201,162,90,.5);background:rgba(23,17,13,.85);color:#f3ead8;font:inherit;font-weight:800;font-size:12px;padding:8px 12px;border-radius:12px}
.bd .ov{position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px}
.bd .spp{width:min(64vw,250px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 38% 32%,#fff,#ece6d8 55%,#a9a292);position:relative;touch-action:none;box-shadow:0 10px 30px #000a}
.bd .spp::before{content:'';position:absolute;inset:10%;border-radius:50%;border:1px dashed rgba(0,0,0,.25)}
.bd .ov p{margin:0;font-size:12px;color:#e8dcc0;text-align:center;line-height:1.6}
.bd .ov .row{display:flex;gap:10px}.bd .ov button{border:1px solid rgba(201,162,90,.6);background:#2a1f17;color:#f3ead8;font:inherit;font-weight:800;padding:10px 18px;border-radius:12px}
.bd .tag{position:absolute;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:5px 11px 5px 7px;border-radius:999px;background:rgba(10,8,6,.85);border:1px solid rgba(201,162,90,.7);font-size:13px;white-space:nowrap;pointer-events:none;box-shadow:0 3px 10px #0008}.bd .tag .bi{width:22px;height:22px;font-size:12px}
.bd [hidden]{display:none!important}`;
const BC = ['#f6f2e8', '#f2b705', '#1d45a8', '#c8152d', '#4c2a85', '#f06a14', '#0d7044', '#7c1d22', '#151515'];
const bicon = (n, gone) => { const c = BC[n > 8 ? n - 8 : n]; return `<span class="bi ${gone ? 'gone' : ''}" style="background:${n > 8 ? `linear-gradient(#f6f2e8 25%,${c} 25% 75%,#f6f2e8 75%)` : c};${n === 8 ? 'color:#fff' : ''}">${n}</span>`; };
const speedOf = p => 0.25 + 7.1 * Math.pow(p, 1.6);   // 力(0〜1) → 手球の速さ m/秒

// ---- 音(その場で作る:球のカチッ・クッションのドン・ポケットのゴロゴロ・キューのコツ)----
function createSound(vol = 0.7) {
  let ac = null; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
  const out = ac && ac.createGain(); if (out) { out.gain.value = vol; out.connect(ac.destination); }
  let noiseBuf = null; const noise = () => { if (noiseBuf) return noiseBuf; noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return noiseBuf; };
  let last = 0;
  const tone = (f, dur, g, type = 'sine', f2) => { const t = ac.currentTime, o = ac.createOscillator(), e = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(e); e.connect(out); o.start(t); o.stop(t + dur + 0.02); };
  const burst = (dur, g, fq, q = 1, type = 'bandpass') => { const t = ac.currentTime, s = ac.createBufferSource(), f = ac.createBiquadFilter(), e = ac.createGain(); s.buffer = noise(); f.type = type; f.frequency.value = fq; f.Q.value = q; e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(e); e.connect(out); s.start(t); s.stop(t + dur + 0.02); };
  return {
    resume() { ac && ac.state === 'suspended' && ac.resume(); },
    clack(v) { if (!ac) return; const now = ac.currentTime; if (now - last < 0.012) return; last = now; const g = Math.min(1, v / 3) * 0.9 + 0.04; tone(2900 + Math.random() * 500, 0.045, g * 0.55); tone(5200, 0.025, g * 0.25); burst(0.03, g * 0.5, 3500, 1.2); },
    rail(v) { if (!ac) return; const g = Math.min(1, v / 3) * 0.7 + 0.03; tone(140, 0.09, g * 0.6, 'sine', 70); burst(0.05, g * 0.35, 600, 0.8, 'lowpass'); },
    pocket() { if (!ac) return; tone(220, 0.08, 0.35, 'triangle', 90); setTimeout(() => { burst(0.35, 0.25, 260, 0.7, 'lowpass'); tone(95, 0.3, 0.25, 'sine', 60); }, 90); },
    cue(v) { if (!ac) return; const g = Math.min(1, v / 5) * 0.6 + 0.12; tone(820, 0.04, g * 0.5, 'triangle', 500); burst(0.04, g * 0.5, 1800, 1); },
    dispose() { try { ac && ac.close(); } catch (e) { } },
  };
}

export default {
  id: 'billiards', title: 'ビリヤード', icon: '🎱', desc: '本格3Dビリヤード(9ボール・8ボール)', pass: 1,
  rule: '台をさわった方向にねらいます(手球視点では左右にドラッグ)。下の帯で微調整。右のキューを下へ引いて はなすと突きます(引くほど強い)。左下の手球で、当てる点(押し・引き・ひねり)をえらべます。9ボール:いちばん小さい番号に先に当てる。9番を入れたら勝ち。8ボール:自分の組(ソリッドかストライプ)を全部入れてから8番を入れたら勝ち。ファウルのあとは相手が手球を好きな所に置けます。',
  options: [
    { key: 'kind', label: '種目', choices: [[9, '9ボール'], [8, '8ボール']], def: 9 },
    { key: 'to', label: '何ゲーム先取', choices: [[1, '1ゲーム'], [2, '2ゲーム'], [3, '3ゲーム']], def: 1 },
    { key: 'gd', label: 'ねらいの線', choices: [[2, '長い(的球の行き先も)'], [1, '短い'], [0, 'なし(上級)']], def: 2 },
    { key: 'cl', label: 'ラシャの色', choices: CLOTHS.map((c, i) => [i, c[0]]), def: 0 },
  ],
  start(host) {
    const box = host.box, two = host.two, O = host.opts, KIND = +O.kind || 9, TO = O.trial ? 1 : +O.to || 1, GD = O.gd == null ? 2 : +O.gd;
    const pl = host.players, cpuLv = pl[1].cpu ? pl[1].cpu.lv : 2;
    if (!document.getElementById('bd-css')) { const s = document.createElement('style'); s.id = 'bd-css'; s.textContent = CSS; document.head.appendChild(s); }
    const V = createView(box, { cloth: +O.cl || 0 }), snd = createSound();
    const ov = document.createElement('canvas'); ov.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; box.appendChild(ov); const g = ov.getContext('2d');
    const ui = document.createElement('div'); ui.className = 'bd'; box.appendChild(ui);
    ui.innerHTML = `<div class="vg"></div><div class="hud"><div class="pl" data-p="0"></div><div class="pl" data-p="1"></div></div><div class="msg"></div><div class="tip" hidden></div>
      <div class="pw"><div class="clip"><i></i><em></em></div><span>引いて<br>はなす</span></div><button class="skip" hidden>⏩ とばす</button>
      <div class="bot"><div class="sp"><i></i></div><div class="fine"></div><button class="cb">📷</button></div>
      <div class="ov" hidden><div class="spp"><i></i></div><p>当てる点をえらぶ<br>上=押し(前へ転がる) 下=引き(もどる) 左右=ひねり</p><div class="row"><button data-c>まん中にもどす</button><button data-ok>OK</button></div></div>`;
    const $ = s => ui.querySelector(s), msgEl = $('.msg'), tipEl = $('.tip'), pwEl = $('.pw'), pwFill = $('.pw i'), pwCue = $('.pw em'), spEl = $('.sp'), spDot = $('.sp i'), ovEl = $('.ov'), sppEl = $('.spp'), sppDot = $('.spp i'), skipEl = $('.skip');
    function margins() { const r = box.getBoundingClientRect(), a = $('.hud').getBoundingClientRect(), b = $('.bot').getBoundingClientRect(); V.setMargins(Math.max(0, a.bottom - r.top + 4), Math.max(0, r.bottom - b.top + 4)); }
    function resize() { V.resize(); margins(); const w = box.clientWidth, h = box.clientHeight; ov.width = w * 2; ov.height = h * 2; g.setTransform(2, 0, 0, 2, 0, 0); }
    resize(); const ro = new ResizeObserver(resize); ro.observe(box);

    // ---- 試合の状態 ----
    let balls = [], cur = 0, breaker = 0, groups = [null, null], inHand = true, kitchen = true, breakShot = true, wins = [0, 0], over = false;
    let phase = 'wait', aim = 0, power = 0, spin = { a: 0, b: 0 }, camMode = 'top', shotEv = [], shotInfo = null, settleT = 0, strikeT = 0, cpuJob = null, msgT = 0, ff = 1;
    const potted = [];   // 落ちた球の番号(順番)
    const mine = () => phase === 'aim' && !pl[cur].cpu;
    function say(text, sub = '', t = 2.2) { msgEl.innerHTML = text + (sub ? `<small>${sub}</small>` : ''); msgEl.classList.add('on'); msgT = t; }
    function hud() {
      [0, 1].forEach(i => {
        const el = ui.querySelector(`.pl[data-p="${i}"]`), G = groups[i];
        let info = '', icons = '';
        if (KIND === 9) { const lo = lowest(balls); info = i === cur && lo ? `ねらう球 ${bicon(lo)}` : ''; }
        else if (G) { const ns = G === 'solid' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]; icons = ns.map(n => bicon(n, !balls.find(b => b.n === n && b.on))).join(''); info = GNAME[G]; if (cleared(balls, G)) info += ' → 8番へ'; }
        else info = breakShot ? (i === cur ? 'ブレイク' : '') : 'まだ組は決まっていない';
        el.innerHTML = `<b>${pl[i].icon || ''} ${pl[i].name}</b><span class="w">${TO > 1 ? `${wins[i]}/${TO}勝 ` : ''}</span><span>${info}</span><div class="bl">${icons}</div>`;
        el.classList.toggle('on', i === cur);
      });
      margins();
    }
    function newRack() {
      balls = P.rack(KIND); potted.length = 0; groups = [null, null]; cur = breaker; inHand = true; kitchen = true; breakShot = true;
      aim = 0; spin = { a: 0, b: 0 }; dotPos(); phase = 'aim'; V.sync(balls, 0); hud();
      say(`${pl[cur].name} のブレイク`, pl[cur].cpu ? '' : '手球を動かして(線より手前)、思いきり突こう', 2.6);
      turnStart();
    }
    function turnStart() {
      phase = 'aim'; power = 0; setPow(0); hud();
      tipEl.hidden = !(inHand && !pl[cur].cpu); tipEl.textContent = kitchen ? '✋ 手球をドラッグで動かせます(線より手前)' : '✋ ファウルのあと:手球を好きな所へ動かせます';
      skipEl.hidden = true;
      if (pl[cur].cpu) { cpuJob = { t: 0, dur: 0.9 + Math.random() * 0.5 }; skipEl.hidden = false; }
      else if (!breakShot) { const lo = legalFirst(KIND, balls, groups[cur]); const t = balls.find(b => b.on && lo.includes(b.n)); if (t && !inHand) aim = Math.atan2(t.x - balls[0].x, t.z - balls[0].z); }
      if (breakShot && !pl[cur].cpu) { const apex = balls.filter(b => b.on && b.n).sort((p, q) => p.z - q.z)[0]; aim = Math.atan2(apex.x - balls[0].x, apex.z - balls[0].z); }
    }
    // ---- 打つ ----
    function shoot(p) {
      if (phase !== 'aim') return;
      phase = 'strike'; strikeT = 0; power = p; tipEl.hidden = true; snd.resume();
      shotInfo = { low: lowest(balls), clr: cleared(balls, groups[cur]), pottedBefore: potted.length };
    }
    function doStrike() {
      const c = balls[0], v = speedOf(power); P.strike(c, aim, v, spin.a, spin.b); snd.cue(v);
      shotEv = []; settleT = 0; phase = 'roll'; V.setCue(false);
    }
    function afterShot() {
      const s = { kind: KIND, ev: shotEv, shooter: cur, groups, breakShot, low: shotInfo.low, clr: shotInfo.clr };
      const j = judge(s); const name = pl[cur].name, opp = 1 - cur;
      j.respot.forEach(n => { const b = balls.find(q => q.n === n); P.spot(balls, b); const i = potted.lastIndexOf(n); if (i >= 0) potted.splice(i, 1); });
      if (j.assign) { groups[cur] = j.assign; groups[opp] = j.assign === 'solid' ? 'stripe' : 'solid'; }
      if (j.win != null) {
        const w = j.win ? cur : opp; wins[w]++; hud();
        say(j.win ? `🏆 ${pl[w].name} の勝ち!` : `${name}:8番を落として負け`, j.win ? (KIND === 9 ? '9番が入った!' : '8番が入った!') : j.why || '', 3);
        phase = 'wait'; host.sfx.play(w === 0 || two ? 'win' : 'lose');
        setTimeout(() => {
          if (wins[w] >= TO) { over = true; host.end({ winner: w, score: [...wins], text: `${KIND}ボール ${wins[0]}-${wins[1]}` }); }
          else { breaker = 1 - breaker; newRack(); }
        }, 2600 / FAST);
        return;
      }
      if (j.scratch) { balls[0].on = true; balls[0].x = 0; balls[0].z = P.HEAD_Z; P.spot(balls, balls[0]); balls[0].x = 0; const z0 = -P.L2 / 2; let z = z0; while (!P.freeAt(balls, 0, z, balls[0])) z -= 0.01; balls[0].z = z; }
      const was = breakShot; breakShot = false; kitchen = false;
      if (j.foul) { say(`ファウル:${j.why}`, `${pl[opp].name} は手球を好きな所に置ける`, 2.6); cur = opp; inHand = true; host.sfx.play('ng'); }
      else if (j.cont) { inHand = false; say(j.assign ? `${name} は ${GNAME[j.assign]}` : was ? 'ブレイクで入った! つづけて' : 'ナイス!', j.assign ? 'つづけて どうぞ' : '', 1.4); host.sfx.play('point'); }
      else { inHand = false; cur = opp; say(`${pl[cur].name} の番`, '', 1.4); }
      setTimeout(turnStart, (j.foul ? 900 : 400) / FAST); phase = 'wait';
    }
    // ---- CPU ----
    function cpuThink() {
      const r = plan({ balls: P.clone(balls), kind: KIND, shooter: cur, groups, breakShot, inHand, kitchen, lv: cpuLv });
      if (r.place) { balls[0].x = r.place.x; balls[0].z = r.place.z; }
      cpuJob.plan = r; cpuJob.a0 = aim; cpuJob.t = 0; cpuJob.dur = 0.9;
      let d = r.ang - aim; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; cpuJob.da = d;
    }
    function cpuStep(dt) {
      cpuJob.t += dt * ff * FAST;
      if (!cpuJob.plan) { if (cpuJob.t > cpuJob.dur) cpuThink(); return; }
      const k = Math.min(1, cpuJob.t / cpuJob.dur), e = 1 - Math.pow(1 - k, 3); aim = cpuJob.a0 + cpuJob.da * e; spin = { a: cpuJob.plan.a, b: cpuJob.plan.b };
      const pp = Math.min(1, Math.pow(Math.max(0, (cpuJob.plan.v - 0.25) / 7.1), 1 / 1.6));
      if (k >= 1) { const t2 = cpuJob.t - cpuJob.dur; setPow(Math.min(pp, t2 * 1.2) ); if (t2 * 1.2 >= pp + 0.15) { cpuJob = null; setPow(0); power = pp; shoot(pp); } }
    }
    // ---- 入力 ----
    const cv = V.renderer.domElement; let drag = null;
    const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    // ---- さわる:球をタップ=番号を見る / ドラッグ=ねらう / 2本の指=ひろげて拡大・とじて縮小 ----
    const pts = new Map(); let pinch = null, tapB = null, tagT = 0;
    const tag = document.createElement('div'); tag.className = 'tag'; tag.hidden = true; ui.appendChild(tag);
    const ballAt = (x, y) => {   // 画面の(x,y)にある球(手前のもの)。手球もふくむ
      let best = null, bd = 1e9;
      for (const b of balls) { if (!b.on) continue; const [bx, by, bz] = V.project(b.x, P.R, b.z), [ex] = V.project(b.x + P.R, P.R, b.z), r = Math.max(20, Math.abs(ex - bx) * 2.2), d = Math.hypot(x - bx, y - by); if (d < r && d < bd) { bd = d; best = b; } }
      return best;
    };
    function showTag(b) {
      const [bx, by] = V.project(b.x, P.R, b.z), kind = b.n === 0 ? '手球' : b.n === 8 && KIND === 8 ? '8番(ブラック)' : b.n === 9 && KIND === 9 ? '9番(ここを入れたら勝ち)' : KIND === 8 ? `${b.n}番 ${grp(b.n) === 'solid' ? 'ソリッド' : 'ストライプ'}` : `${b.n}番`;
      tag.innerHTML = (b.n ? bicon(b.n) : '<span class="bi" style="background:#f7f4ec"></span>') + `<b>${kind}</b>`;
      tag.hidden = false; tag.style.left = `${Math.max(70, Math.min(box.clientWidth - 70, bx))}px`; tag.style.top = `${Math.max(100, by - 34)}px`; tagT = 2.4;
    }
    cv.addEventListener('pointerdown', e => {
      snd.resume(); const [x, y] = local(e); pts.set(e.pointerId, [x, y]); try { cv.setPointerCapture(e.pointerId); } catch (_) { }
      if (pts.size === 2 && camMode === 'top') {   // ピンチはじめ
        const [p1, p2] = [...pts.values()], mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
        drag = null; tag.hidden = true; pinch = { d0: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) || 1, z0: V.zoom, anchor: V.pick(mx, my) }; return;
      }
      if (pts.size > 1) return;
      const hb = ballAt(x, y);
      if (!mine()) { if (hb) showTag(hb); return; }
      const c = balls[0], [bx, by] = V.project(c.x, P.R, c.z), [ex] = V.project(c.x + P.R, P.R, c.z), rp = Math.max(26, Math.abs(ex - bx) * 3);
      if (inHand && Math.hypot(x - bx, y - by) < rp) drag = { kind: 'ball' };
      else if (hb && hb.n) { drag = { kind: 'tap', x0: x, y0: y, b: hb, a0: aim }; return; }   // 動かさず離したら「番号を見る」
      else drag = { kind: 'aim', x0: x, a0: aim };
      move(x, y);
    });
    cv.addEventListener('pointermove', e => {
      const [x, y] = local(e); if (pts.has(e.pointerId)) pts.set(e.pointerId, [x, y]);
      if (pinch && pts.size >= 2) {
        const [p1, p2] = [...pts.values()], mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2, d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
        V.setZoom(pinch.z0 * d / pinch.d0, null, null, true);
        const q = V.pick(mx, my); if (q && pinch.anchor) V.panBy(pinch.anchor.x - q.x, pinch.anchor.z - q.z, true);
        const q2 = V.pick(mx, my); if (q2 && pinch.anchor) V.panBy(pinch.anchor.x - q2.x, pinch.anchor.z - q2.z, true);
        return;
      }
      if (!drag) return;
      if (drag.kind === 'tap') { if (Math.hypot(x - drag.x0, y - drag.y0) < 9) return; drag = { kind: 'aim', x0: drag.x0, a0: drag.a0 }; }
      move(x, y);
    });
    const up = e => {
      pts.delete(e.pointerId);
      if (drag && drag.kind === 'tap') showTag(drag.b);
      if (pts.size < 2) pinch = null; if (pts.size === 0) drag = null;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    function move(x, y) {
      if (!mine()) return; const c = balls[0];
      if (drag.kind === 'ball') {
        const p = V.pick(x, y); if (!p) return;
        let nx = Math.max(-P.W2 + P.R, Math.min(P.W2 - P.R, p.x)), nz = Math.max(-P.L2 + P.R, Math.min(P.L2 - P.R, p.z)); if (kitchen) nz = Math.min(nz, P.HEAD_Z);
        if (P.freeAt(balls, nx, nz, c)) { c.x = nx; c.z = nz; }
        return;
      }
      if (camMode === 'top') { const p = V.pick(x, y); if (p && Math.hypot(p.x - c.x, p.z - c.z) > 0.02) aim = Math.atan2(p.x - c.x, p.z - c.z); }
      else aim = drag.a0 - (x - drag.x0) * 0.004;
    }
    // 微調整の帯
    { const f = $('.fine'); let fx = null, a0 = 0; f.addEventListener('pointerdown', e => { if (!mine()) return; fx = e.clientX; a0 = aim; f.setPointerCapture?.(e.pointerId); });
      f.addEventListener('pointermove', e => { if (fx == null || !mine()) return; aim = a0 - (e.clientX - fx) * 0.0007; f.style.backgroundPosition = `${(e.clientX - fx)}px 0`; });
      const end = () => { fx = null; }; f.addEventListener('pointerup', end); f.addEventListener('pointercancel', end); }
    // 力(キューを下へ引く)
    function setPow(p) { pwFill.style.height = `calc(${p * 100}% - ${p * 8}px)`; pwCue.style.transform = `translate(-50%, ${p * 38}%)`; }
    { let y0 = null; pwEl.addEventListener('pointerdown', e => { if (!mine()) return; snd.resume(); y0 = e.clientY; power = 0; pwEl.setPointerCapture?.(e.pointerId); });
      pwEl.addEventListener('pointermove', e => { if (y0 == null) return; power = Math.max(0, Math.min(1, (e.clientY - y0) / (pwEl.clientHeight * 0.92))); setPow(power); });
      const end = () => { if (y0 == null) return; y0 = null; if (power > 0.025 && mine()) shoot(power); else { power = 0; setPow(0); } };
      pwEl.addEventListener('pointerup', end); pwEl.addEventListener('pointercancel', () => { y0 = null; power = 0; setPow(0); }); }
    // 回転(当てる点)
    function dotPos() { [[spDot, spEl], [sppDot, sppEl]].forEach(([d]) => { d.style.left = `${50 + spin.a * 40}%`; d.style.top = `${50 - spin.b * 40}%`; }); }
    dotPos();
    spEl.addEventListener('click', () => { if (phase === 'aim' && !pl[cur].cpu) ovEl.hidden = false; });
    { let on = false; const setSp = e => { const r = sppEl.getBoundingClientRect(); let a = ((e.clientX - r.left) / r.width - 0.5) / 0.4, b = -((e.clientY - r.top) / r.height - 0.5) / 0.4; const l = Math.hypot(a, b); if (l > 1) { a /= l; b /= l; } spin = { a, b }; dotPos(); };
      sppEl.addEventListener('pointerdown', e => { on = true; sppEl.setPointerCapture?.(e.pointerId); setSp(e); }); sppEl.addEventListener('pointermove', e => { if (on) setSp(e); }); sppEl.addEventListener('pointerup', () => { on = false; });
      $('[data-c]').onclick = () => { spin = { a: 0, b: 0 }; dotPos(); }; $('[data-ok]').onclick = () => { ovEl.hidden = true; }; }
    $('.cb').onclick = () => { camMode = camMode === 'top' ? 'cue' : 'top'; host.sfx.play('tap'); };
    skipEl.onclick = () => { ff = 6; };   // CPUの番を早送り

    // ---- ねらいの線(手球 → 最初に当たる所)----
    function guide() {
      const c = balls[0], dx = Math.sin(aim), dz = Math.cos(aim);
      let best = 9, hit = null;
      for (const b of balls) {   // 球:半径 2R の円との交点
        if (!b.on || b.n === 0) continue; const ox = b.x - c.x, oz = b.z - c.z, t = ox * dx + oz * dz; if (t <= 0) continue;
        const d2 = ox * ox + oz * oz - t * t, rr = 4 * P.R * P.R; if (d2 > rr) continue; const s = t - Math.sqrt(rr - d2); if (s < best) { best = s; hit = b; }
      }
      for (const s of P.RAILS) {   // クッション:R だけ内側の線で近似
        for (let t = 0.002; t < Math.min(best, 3.2); t += 0.004) { const x = c.x + dx * t, z = c.z + dz * t, ex = s.bx - s.ax, ez = s.bz - s.az, l2 = ex * ex + ez * ez; let u = ((x - s.ax) * ex + (z - s.az) * ez) / l2; u = Math.max(0, Math.min(1, u)); if (Math.hypot(x - s.ax - ex * u, z - s.az - ez * u) < P.R) { if (t < best) { best = t; hit = null; } break; } }
      }
      return { gx: c.x + dx * best, gz: c.z + dz * best, hit };
    }
    function drawGuide(W, H) {
      if (phase !== 'aim' || GD === 0) return;
      const c = balls[0], G = guide(), y = P.R;
      const A = V.project(c.x, y, c.z), B = V.project(G.gx, y, G.gz);
      g.save(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,255,255,.75)'; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke(); g.setLineDash([]);
      // ゴーストボール
      g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, q = V.project(G.gx + Math.cos(a) * P.R, y, G.gz + Math.sin(a) * P.R); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();
      if (G.hit && GD >= 2) {
        const nx = G.hit.x - G.gx, nz = G.hit.z - G.gz, nl = Math.hypot(nx, nz), ux = nx / nl, uz = nz / nl, dx = Math.sin(aim), dz = Math.cos(aim), cs = dx * ux + dz * uz;
        const legal = legalFirst(KIND, balls, groups[cur]).includes(G.hit.n) || breakShot;
        const L1 = 0.12 + 0.3 * cs, a1 = V.project(G.hit.x, y, G.hit.z), b1 = V.project(G.hit.x + ux * L1, y, G.hit.z + uz * L1);
        g.strokeStyle = legal ? 'rgba(255,226,140,.95)' : 'rgba(255,90,90,.95)'; g.lineWidth = 2; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.stroke();
        const tx = dx - cs * ux, tz = dz - cs * uz, tl = Math.hypot(tx, tz);
        if (tl > 0.02) { const L2b = 0.1 * tl / 1, a2 = B, b2 = V.project(G.gx + tx / tl * L2b, y, G.gz + tz / tl * L2b); g.strokeStyle = 'rgba(160,210,255,.8)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(a2[0], a2[1]); g.lineTo(b2[0], b2[1]); g.stroke(); }
        if (!legal) { const q = V.project(G.hit.x, y + P.R * 2.2, G.hit.z); g.fillStyle = '#ff6b6b'; g.font = '900 13px sans-serif'; g.textAlign = 'center'; g.fillText('✕', q[0], q[1]); }
      }
      g.restore();
    }
    function drawHand() {   // 動かせる手球のしるし
      if (!(phase === 'aim' && inHand && !pl[cur].cpu)) return;
      const c = balls[0], q = V.project(c.x, P.R, c.z), e = V.project(c.x + P.R * 1.9, P.R, c.z), r = Math.abs(e[0] - q[0]) + 4, t = performance.now() / 300;
      g.save(); g.strokeStyle = `rgba(255,226,140,${0.55 + Math.sin(t) * 0.3})`; g.lineWidth = 2; g.beginPath(); g.arc(q[0], q[1], r, 0, 7); g.stroke();
      if (kitchen) { const a = V.project(-P.W2, 0.001, P.HEAD_Z), b = V.project(P.W2, 0.001, P.HEAD_Z); g.setLineDash([4, 6]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      g.restore();
    }

    // ---- 毎フレーム ----
    let lastPot = 0, FAST = 1;
    const stop = loop(dt0 => {
      const dt = Math.min(0.05, dt0), W = box.clientWidth, H = box.clientHeight;
      if (msgT > 0) { msgT -= Math.min(0.5, dt0); if (msgT <= 0) msgEl.classList.remove('on'); }
      if (tagT > 0) { tagT -= dt; if (tagT <= 0) tag.hidden = true; }
      if (phase === 'strike' || phase === 'roll') tag.hidden = true;
      if (phase === 'aim' && pl[cur].cpu && cpuJob) cpuStep(dt);
      if (phase === 'strike') {   // キューを少し引いてから、すばやく前へ
        strikeT += dt * ff * FAST; const back = 0.03 + power * 0.22, k = strikeT < 0.18 ? strikeT / 0.18 : 1, f = strikeT < 0.18 ? 0 : Math.min(1, (strikeT - 0.18) / 0.07);
        V.setCue(true, balls[0].x, balls[0].z, aim, back * (k * (1 - f)) + (power * 0.22 * (1 - k)) * 0);
        if (f >= 1) doStrike();
      } else if (phase === 'aim') {
        V.setCue(true, balls[0].x, balls[0].z, aim, 0.02 + power * 0.22);
      }
      if (phase === 'roll') {
        const n0 = shotEv.length; for (let i = 0; i < ff * FAST; i++) P.advance(balls, dt, shotEv);
        for (let i = n0; i < shotEv.length; i++) { const e = shotEv[i]; if (e.t === 'hit') snd.clack(e.v); else if (e.t === 'rail') snd.rail(e.v); else if (e.t === 'pot') { snd.pocket(); V.drop(e.n, e.p, e.x, e.z); potted.push(e.n); lastPot = 0; hud(); } }
        lastPot += dt * FAST;
        if (!P.anyMoving(balls)) { settleT += dt; if (settleT > 0.35 && lastPot > 0.5) { ff = 1; phase = 'wait'; afterShot(); } } else settleT = 0;
      }
      const c = balls[0], camNow = (phase === 'roll' || phase === 'wait') && camMode === 'cue' ? 'top' : camMode;
      V.setCam(camNow, c.x, c.z, aim, dt); V.sync(balls, dt * (phase === 'roll' ? ff : 1)); V.render();
      g.clearRect(0, 0, W, H); drawGuide(W, H); drawHand();
    });
    newRack();
    return {
      _dbg: () => ({ proj: n => { const b = balls.find(q => q.n === n); return V.project(b.x, P.R, b.z); }, zoom: () => V.zoom, fast: v => { FAST = v; }, phase, cur, balls, aim, groups, inHand, wins, shoot: p => shoot(p), setAim: a => { aim = a; }, setSpin: (a, b) => { spin = { a, b }; }, cam: m => { camMode = m; }, place: (x, z) => { balls[0].x = x; balls[0].z = z; } }),
      stop() { over = true; stop(); ro.disconnect(); V.dispose(); snd.dispose(); ov.remove(); ui.remove(); },
    };
  },
};
