/* エンカウント戦闘(ドラクエ風の英語クイズ): 住人が近づいてきて「クイズ、いい?」と聞く。
   受ける→全画面の戦闘。4択を連続で出し、正解なら例文を呪文のように唱えて(音声)相手にダメージ、まちがえたら自分がダメージ。
   問題は opt.battleQs(n)(本体側:単語テストと同じ4択づくり。その人のレベル帯の単語。例文があれば q.ex={en,ja})から取る。
   例文がない単語は、単語そのものを唱える。例文は core/dict/ex.js に足せば、そのまま使われる。
   戦闘中は町(3D)を止める(enc.active を main の frame が見る)。曲は戦闘が始まってから、終わったら街の曲にもどす。 */
import { social } from './social.js';
import { portrait } from '../ui/portraits.js';

export const ENC = {
  n: 10,                 // 1回の問題数(上限)
  enemyHp: 60, hit: 10,  // 相手の体力と、正解1つぶんのダメージ(6問正解でたおせる)
  myHp: 50, hurt: 10,    // 自分の体力と、まちがい1つぶんのダメージ(5問まちがえると負け)
  win: 5, perfect: 3,    // 勝ったときの好感度(ノーミスなら、さらに +perfect)
  decline: -2,           // ことわったときの好感度
  cool: [120, 240],      // つぎのエンカウントまでの秒数(下限・上限)
};
const LV_NAME = ['しりあい', 'なかよし', 'ともだち', 'しんゆう', 'だいすき'];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));

const CSS = `
.eb{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background:linear-gradient(#1b1340,#2b1d63 55%,#150e33);color:#fff;font-family:inherit;padding:max(10px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));box-sizing:border-box;user-select:none;touch-action:manipulation}
.eb *{box-sizing:border-box}
.eb.eb3{background:transparent}
body.eb-on .tw-root>*:not(.tw-toast):not(.tw-canvas){visibility:hidden}/* 戦闘中は、町の画面のボタンや名前をかくす(外側の画面ぶんは series/apps/town/town.css) */
.eb-top{flex:1 1 0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
.eb-pic{max-height:100%;max-width:70%;object-fit:contain;filter:drop-shadow(0 6px 14px #0008)}
.eb-pic.hit{animation:ebshake .4s}
.eb-bar{height:12px;width:100%;background:#0006;border:2px solid #fff;border-radius:8px;overflow:hidden}
.eb-bar i{display:block;height:100%;width:100%;background:#59d36e;transition:width .5s,background .5s}
.eb-en{width:min(88%,360px);margin:6px auto 0;text-align:left}
.eb-en b,.eb-me b{font-size:15px}
.eb-dmg{position:absolute;left:50%;top:30%;transform:translateX(-50%);font-size:44px;font-weight:900;color:#ffe066;text-shadow:0 3px 0 #b3541e,0 0 12px #ff9;opacity:0;pointer-events:none}
.eb-dmg.go{animation:ebdmg .9s ease-out}
.eb-msg{margin:8px 0;min-height:96px;border:3px solid #fff;border-radius:10px;background:#000c;padding:10px 12px;font-size:16px;line-height:1.55;font-weight:700;white-space:pre-wrap}
.eb-msg small{font-weight:600;color:#ffd9a0;font-size:13px}
.eb-ch{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.eb-ch button,.eb-end button{border:3px solid #fff;border-radius:10px;background:#000c;color:#fff;font-size:16px;font-weight:800;padding:12px 6px;min-height:52px;line-height:1.25;font-family:inherit;cursor:pointer}
.eb-ch button:active,.eb-end button:active{background:#3a2a8a}
.eb-ch button.ok{background:#2c8a46}.eb-ch button.ng{background:#a33}
.eb-ch button:disabled{opacity:.92}
.eb-me{margin-top:8px;width:min(88%,360px);align-self:center;display:flex;align-items:center;gap:8px}
.eb-me .eb-bar{flex:1}.eb-me span{font-size:13px;font-weight:800;min-width:56px;text-align:right}
.eb-end{display:flex;justify-content:center;margin-top:6px}.eb-end button{padding:12px 36px}
.eb.flash{animation:ebflash .35s}
@keyframes ebshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-12px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(5px)}}
@keyframes ebdmg{0%{opacity:0;transform:translate(-50%,10px) scale(.6)}20%{opacity:1;transform:translate(-50%,-6px) scale(1.2)}100%{opacity:0;transform:translate(-50%,-46px) scale(1)}}
@keyframes ebflash{0%,100%{background-color:transparent}30%{background-color:#f003}}`;
let cssOn = false;

export function createEncounter(env) {   // env: { hud, opt, name(自分の名前), hold(r), release(r), music(on), stage(3Dの舞台) }
  let cache = [], loading = false, active = false;
  const refill = async () => {
    if (loading || !env.opt.battleQs) return; loading = true;
    try { const s = await env.opt.battleQs(ENC.n); if (Array.isArray(s) && s.length) cache = s; } catch (e) { }
    loading = false;
  };
  const heart = (r, n) => {   // 好感度を動かして、上がったらひと言
    const res = social.addAff(r.def.id, n);
    if (res.up) env.hud.toast(`💗 ${r.def.name}と、${LV_NAME[res.after]}になった!`);
    return res;
  };
  const end = (r, text, label) => { env.hold(r); env.hud.dialog({ name: r.def.name, role: r.def.role, text, choices: [{ label: label || 'またね', fn: () => { } }] }); };

  // ---- 戦闘 ----
  async function battle(r) {
    const qs = cache.splice(0); refill();
    if (qs.length < 3) return end(r, 'あれ、問題を忘れちゃった。また今度ね!');
    if (!cssOn) { cssOn = true; const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); }
    const me = env.name() || 'あなた', pic = portrait(r.def.name);
    const ov = document.createElement('div'); ov.className = 'eb';
    ov.innerHTML = `<div class="eb-top">${pic ? `<img class="eb-pic" alt="" src="${pic}">` : `<div style="font-size:90px">🙂</div>`}<div class="eb-dmg"></div></div>
      <div class="eb-en"><b>${esc(r.def.name)}</b><div class="eb-bar"><i id="eb-eh"></i></div></div>
      <div class="eb-msg" id="eb-msg"></div><div class="eb-ch" id="eb-ch"></div>
      <div class="eb-me"><b>${esc(me)}</b><div class="eb-bar"><i id="eb-mh"></i></div><span id="eb-mt"></span></div>`;
    document.body.appendChild(ov); document.body.classList.add('tw-talking', 'eb-on'); active = true;
    try { env.hud.closeDialog(); } catch (e) { }
    const d3 = !!(env.stage && env.stage.begin(r));   // 相手だけ3Dで(だめなら顔絵)
    if (d3) { ov.classList.add('eb3'); const im = ov.querySelector('.eb-pic'); if (im) im.remove(); }
    const act = k => { if (d3) try { env.stage.act(k); } catch (e) { } };
    env.music(true);   // 曲は、戦闘が始まってから
    const $ = s => ov.querySelector(s), msgEl = $('#eb-msg'); let chEl = $('#eb-ch'); const picEl = ov.querySelector('.eb-pic'), dmgEl = $('.eb-dmg');
    let E = ENC.enemyHp, P = ENC.myHp, typeT = 0, alive = true;
    const bar = (id, v, max) => { const el = $(id); el.style.width = Math.max(0, v / max * 100) + '%'; el.style.background = v / max > .5 ? '#59d36e' : v / max > .25 ? '#f0c040' : '#e5533d'; };
    const draw = () => { bar('#eb-eh', E, ENC.enemyHp); bar('#eb-mh', P, ENC.myHp); $('#eb-mt').textContent = `HP ${Math.max(0, P)}`; };
    const say = (html, fast) => new Promise(res => {   // 文字送り(<small>だけ書式として使う)
      clearInterval(typeT); const chars = []; html.split(/(<small>[\s\S]*?<\/small>)/).filter(Boolean).forEach(p => { if (p.startsWith('<small>')) chars.push({ raw: p }); else [...p].forEach(c => chars.push({ c })); });
      let i = 0; const tick = () => { i++; msgEl.innerHTML = chars.slice(0, i).map(x => x.raw || esc(x.c)).join(''); if (i >= chars.length) { clearInterval(typeT); res(); } };
      typeT = setInterval(tick, fast ? 8 : 22); tick();
    });
    const pop = (txt, hitEnemy) => { dmgEl.textContent = txt; dmgEl.classList.remove('go'); void dmgEl.offsetWidth; dmgEl.classList.add('go'); if (hitEnemy && picEl) { picEl.classList.remove('hit'); void picEl.offsetWidth; picEl.classList.add('hit'); } };
    const speak = (text, minMs) => new Promise(res => {   // 音声で読んで、読み終わる(最低でも minMs)まで待つ
      let done = false, timer = null; const t0 = Date.now();
      const fin = () => { if (done) return; done = true; clearTimeout(timer); const rest = minMs - (Date.now() - t0); rest > 0 ? setTimeout(res, rest) : res(); };
      timer = setTimeout(fin, 9000);
      try { env.opt.speak ? env.opt.speak(text, { onend: fin }) : fin(); } catch (e) { fin(); }
    });
    const close = () => {
      alive = false; clearInterval(typeT); try { env.opt.speakStop && env.opt.speakStop(); } catch (e) { }
      ov.remove(); document.body.classList.remove('tw-talking', 'eb-on'); if (d3) try { env.stage.end(); } catch (e) { } active = false; env.music(false); env.release(r);
    };
    const finish = async (win, nOk) => {
      let line;
      if (win) { const g = ENC.win + (nOk >= qs.length && P >= ENC.myHp ? ENC.perfect : 0); heart(r, g); line = `${r.def.name}は ${me}の えいごに かんしんした!\n💗 なかよしど +${g}`; }
      else line = `${me}は やられてしまった…\nでも ぜんぶ きろくに のこったよ。またちょうせんしてね!`;
      act(win ? 'bow' : 'cheer');
      chEl.innerHTML = ''; await say(`${win ? '🎉 しょうり!' : '💦 まけてしまった…'}\n${line}\n<small>せいかい ${nOk} / ${qs.length}</small>`);
      if (!alive) return; const b = document.createElement('div'); b.className = 'eb-end'; b.innerHTML = '<button>もどる</button>'; chEl.replaceWith(b); b.firstChild.onclick = close;
    };
    draw();
    await say(`${r.def.name}が あらわれた!\n<small>えいごクイズで しょうぶ!</small>`); await wait(900);
    let nOk = 0;
    for (let i = 0; i < qs.length && alive; i++) {
      const Q = qs[i];
      act('throw');   // 問題を出すたびに、相手が「なげる」ような動き
      await say(`Q${i + 1}/${qs.length}\n「${Q.w.en}」の いみは?`, true);
      try { env.opt.speak && env.opt.speak(Q.w.en); } catch (e) { }
      const tQ = Date.now();   // 答えるまでの時間(10秒以上なやんだ言葉は、あとでもう一度出す)
      const k = await new Promise(res => {
        chEl.innerHTML = Q.ch.map((c, j) => `<button data-k="${j}">${esc(c)}</button>`).join('');
        chEl.querySelectorAll('button').forEach(b => b.onclick = () => res(+b.dataset.k));
      });
      if (!alive) return;
      const ok = Q.ch[k] === Q.ans; chEl.querySelectorAll('button').forEach(b => { b.disabled = true; if (Q.ch[+b.dataset.k] === Q.ans) b.classList.add('ok'); else if (+b.dataset.k === k) b.classList.add('ng'); });
      try { env.opt.battleRecord && env.opt.battleRecord(Q, ok, (Date.now() - tQ) / 1000 > 10); } catch (e) { }
      if (ok) {   // 例文を呪文のように唱えて、ダメージ
        nOk++; const t = Q.ex ? Q.ex.en : Q.w.en;
        const sp = speak(t, Math.min(4500, Math.max(1700, t.length * 55)));
        E -= ENC.hit; pop(`-${ENC.hit}`, true); draw(); act('hit');
        await say(`✨ ${me}は じゅもんを となえた!\n「${t}」\n<small>${Q.ex && Q.ex.ja ? Q.ex.ja : `${Q.w.en} = ${Q.ans}`}</small>`);
        await sp;
      } else {
        P -= ENC.hurt; act('strike'); ov.classList.remove('flash'); void ov.offsetWidth; ov.classList.add('flash'); draw();
        await say(`ざんねん! ${r.def.name}の こうげき!\n${me}は ${ENC.hurt}の ダメージを うけた\n<small>「${Q.w.en}」= ${Q.ans}</small>`);
        await wait(1300);
      }
      if (!alive) return;
      if (E <= 0) return finish(true, nOk);
      if (P <= 0) return finish(false, nOk);
    }
    if (alive) finish(E <= 0, nOk);
  }

  return {
    get active() { return active; },
    ready: () => cache.length >= 3,
    warm: refill,
    ask(r) {   // 近づいてきて、聞く(受ける/ことわる)。曲はまだ鳴らさない
      env.hold(r);
      env.hud.dialog({
        name: r.def.name, role: r.def.role, text: ['ちょっと待って! 英語クイズで しょうぶしない?', 'あっ、いたいた! 英語の問題で、しょうぶよ!', 'ねえねえ、英語クイズ、やってみない?'][Math.floor(Math.random() * 3)],
        choices: [{ label: '⚔ うけて立つ!', fn: () => battle(r) }, { label: 'ことわる', fn: () => { heart(r, ENC.decline); end(r, 'そっか…。また今度ね。', 'ごめんね'); } }]
      });
    },
  };
}
