// 英語の釣り堀:英語に答えて釣る・水槽で育てる・標本を集める・抜き打ちテスト。
//   釣り堀 = 単語ストリームの単語練習と同じセット(問題はそのセットの単語だけ)
//   出るところ:投げる(熟語・正解でよく寄る) / アタリ(英→日・まちがえると逃げる) / あばれる(熟語・まちがえると外れる) / 取りこむ(日→英・まちがえると逃げる)
//   「完璧」= 続けて PERFECT_C 回正解(ストリームで正解した分も数える=予習になる)。ここでまちがえると完璧が消える
//   セットの単語がぜんぶ完璧 → そのセットの標本(1回だけ)。抜き打ちテストで悪いと、標本にひびが入る(もう一度ぜんぶ完璧で直る)
import { SW } from '../gamebox/stream_words.js';
import { IDIOMS } from './idioms.js';
import { FIMG } from './fishimg.js';
import { SETS, SET, LV_NAME, LV_SUB, TANK_MAX, GROW_NEED, FEED_PER_DAY, FISH_SPEC, spec, condOf, MIX_N, RAR, RAR_PT, DECOR, DECOR_ICON, TANK_RANKS, decorOf, RECIPES, recipeFor, shapeName, FISH_MAX_RANK, RANK_PRE, RANK_MUL } from '../../game/specimen.js';
import { furn } from '../../game/furniture.js';
import { vch, VCH } from '../../game/voucher.js';
import { localLearn } from './learnrec.js';
import { sortReel } from './sortreel.js';

export const PERFECT_C = 2;          // 続けて何回正解で「完璧」
export const GAPS = { 1: 1, 2: 4, 3: 10 };   // 問題が出る間隔(秒):はやい/ふつう/ゆっくり(ポンド画面で選ぶ)
export const T_BITE = 7, T_Q = 10;   // 答える時間(秒)。アタリは短め
const TEST_EVERY = 3, TEST_MIN_OWN = 3, TEST_SETS = 3, TEST_PER = 4, TEST_BAD = 2;   // 抜き打ち:何日ごと・標本いくつから・何セット・1セット何問・何問まちがいでひび
const FOOD_Q = 5;                    // えさを作る問題の数(1問正解=えさ1つ)

const POS = { n: '名詞', v: '動詞', a: '形容詞', r: '副詞', pp: '前置詞', cj: '接続詞', pn: '代名詞', ij: '間投詞', ph: '熟語' };
const ICON = { shell: '🐚', conch: '🐚', stone: '🪨', glass: '💠', urchin: '🌰', star: '⭐', coral: '🪸', disc: '⚪', crystal: '🔮', ammonite: '🌀', trilobite: '🪲', tooth: '🦷', amber: '🟠', cube: '🟨', leaf: '🍂', gem: '💎', opal: '🫧', pearl: '🦪', meteor: '☄️' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isAdmin = () => { try { const q = new URLSearchParams(location.search).get('admin'); if (q === '1') localStorage.setItem('cs:core:admin', 'true'); if (q === '0') localStorage.removeItem('cs:core:admin'); } catch (e) { } try { return JSON.parse(localStorage.getItem('cs:core:admin')) === true; } catch (e) { return false; } };   // 運営テスト(アミューズメントと同じ印)
const dayKey = () => { const d = new Date(Date.now() - 4 * 36e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const hexCol = c => '#' + (c >>> 0).toString(16).padStart(6, '0');


const MIXCSS = `
.ens .cell.sel{outline:3px solid #f58aa8;background:#ffe9f0}.ens .cell.used{opacity:.55}.ens .cell .ub{position:absolute;right:4px;top:3px;font-size:10px;background:#efe8f7;border-radius:8px;padding:0 5px;color:#6b4a9a}
.ens .rr{display:inline-block;font-weight:900;font-size:10px;padding:0 6px;border-radius:6px;color:#fff;margin-left:3px}.rr0{background:#8a96a3}.rr1{background:#3b8fe0}.rr2{background:#a456f0}.rr3{background:linear-gradient(90deg,#ff9a00,#ff4d8d,#8a5cff);}
.mixfx{position:absolute;inset:0;z-index:60;background:radial-gradient(circle at 50% 45%,#3a1d6e,#0b0618 70%);display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;overflow:hidden;animation:mxIn .3s}
.mixfx .mxc{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.mixfx .mxi{position:absolute;inset:0;pointer-events:none}.mixfx .mxe{position:absolute;left:0;top:0;width:96px;text-align:center;font-size:56px;will-change:transform}.mixfx .mxe img{width:96px!important;max-width:96px!important;height:auto!important}
.mixfx .mxt{position:absolute;left:0;right:0;top:calc(44% + 150px);text-align:center;font-weight:900;letter-spacing:3px;font-size:20px;text-shadow:0 0 12px var(--g);pointer-events:none}
.mixfx .cd{position:relative}.mixfx .cd .rays{position:absolute;left:50%;top:44%;width:520px;height:520px;margin:-260px 0 0 -260px;z-index:-1;background:repeating-conic-gradient(from 0deg,var(--g) 0 7deg,transparent 7deg 20deg);opacity:.32;-webkit-mask-image:radial-gradient(circle,#000 8%,transparent 66%);mask-image:radial-gradient(circle,#000 8%,transparent 66%);animation:mxSpin 14s linear infinite}@keyframes mxSpin{to{transform:rotate(360deg)}}
.mixfx .ring{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px;border-radius:50%;box-shadow:0 0 40px 16px #b890ff,inset 0 0 20px #fff8;animation:mxRing 1.7s ease-in forwards}
@keyframes mxIn{from{opacity:0}to{opacity:1}}
@keyframes mxOrb{0%{transform:rotate(var(--a)) translateX(95px) rotate(calc(var(--a)*-1)) scale(1)}100%{transform:rotate(calc(var(--a) + 900deg)) translateX(0) rotate(calc(var(--a)*-1 - 900deg)) scale(.15)}}
@keyframes mxRing{0%{transform:scale(.3);opacity:.3}85%{transform:scale(2.4);opacity:1}100%{transform:scale(4.5);opacity:0}}
.mixfx .fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;animation:mxFl .7s ease-out forwards}@keyframes mxFl{0%{opacity:1}100%{opacity:0}}
.mixfx .cd{text-align:center;animation:mxPop .6s cubic-bezier(.2,1.7,.4,1)}@keyframes mxPop{from{transform:scale(.2) rotate(-12deg);opacity:0}to{transform:none;opacity:1}}
.mixfx .cd .ic{font-size:96px;line-height:1.1;filter:drop-shadow(0 0 18px var(--g))}.mixfx .cd .rn{font-size:44px;font-weight:900;letter-spacing:3px;color:var(--g);text-shadow:0 0 16px var(--g),0 3px 0 #0006}
.mixfx .cd b{display:block;font-size:20px;margin-top:6px}.mixfx .cd small{display:block;font-style:italic;color:#d8cdf0}
.mixfx .pt{position:absolute;left:50%;top:44%;font-size:22px;animation:mxPt 1.4s ease-out forwards;pointer-events:none}@keyframes mxPt{0%{transform:translate(0,0) scale(.4);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.3);opacity:0}}
.mixfx button{margin-top:18px}
.ens .admf{position:absolute;left:2px;right:2px;top:2px;display:flex;justify-content:space-between;align-items:center;z-index:2}.ens .admf button{width:30px;height:30px;border-radius:50%;border:0;background:#e0556b;color:#fff;font-size:18px;font-weight:bold}.ens .admf i{font-style:normal;font-weight:bold;font-size:12px;background:#fff;border-radius:8px;padding:2px 5px}
.ens .fdx{position:fixed;inset:0;background:rgba(20,15,40,.62);z-index:20;display:flex;align-items:center;justify-content:center;padding:16px}.ens .fdc{position:relative;width:min(92vw,380px);max-height:92vh;overflow:auto;background:linear-gradient(#fff,#f3eefb);border-radius:22px;padding:16px 16px 18px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.35)}.ens .fdc .x{position:absolute;right:10px;top:10px;width:34px;height:34px;border-radius:50%;border:0;background:#eee;font-size:16px}.ens .fdc .fpic{background:radial-gradient(#e9f6ff,#cfe6f5);border-radius:16px;padding:14px 8px;margin-top:22px}.ens .fdc .rt{display:inline-block;margin-top:10px;font-weight:900;color:#fff;background:#8d7f9e;border-radius:8px;padding:1px 10px;font-size:12px}.ens .fdc h3{margin:6px 0 0;font-size:20px}.ens .fdc .en{color:#8d7f9e;font-size:12px;margin-top:2px}.ens .fdc .tb{display:flex;gap:6px;justify-content:center;margin:10px 0}.ens .fdc .tb button{border:0;border-radius:14px;padding:6px 12px;background:#eee;font-weight:bold;font-size:12px}.ens .fdc .tb button.on{background:#5a4a78;color:#fff}.ens .fdc .tb button:disabled{opacity:.35}.ens .fdc .ds{font-size:14px;margin:6px 0}.ens .fdc table{margin:8px auto;font-size:13px;text-align:left}.ens .fdc th{color:#8d7f9e;padding-right:12px;font-weight:bold}.ens .fdc .sy{font-style:italic;color:#6b5d86;font-size:13px;margin:8px 0 0}
.ens .adm{position:absolute;left:4px;top:3px;width:24px;height:24px;z-index:2;accent-color:#e0556b}
.rcp{margin:6px 0 10px;font-size:12px;line-height:1.9}.rcp .rr{margin:0 4px 0 0}
`;
const CSS = `
.fz .enq.lk .qc{opacity:.45}.fz .enq{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.35);padding:12px;box-sizing:border-box}
.fz .enq .qb{width:100%;max-width:440px;background:#fffdf7;border-radius:22px;padding:14px 14px 16px;box-shadow:0 10px 30px #0006;margin-bottom:calc(8px + env(safe-area-inset-bottom,0px));animation:enUp .18s ease-out}
@keyframes enUp{from{transform:translateY(30px);opacity:0}}
.fz .enq .ql{font-size:13px;font-weight:900;color:#e0556b;display:flex;justify-content:space-between;align-items:center}
.fz .enq .qt{height:6px;border-radius:3px;background:#eee4f2;margin:8px 0 10px;overflow:hidden}.fz .enq .qt i{display:block;height:100%;background:linear-gradient(90deg,#ffb35c,#ff6b8b);width:100%}
.fz .enq .qp{text-align:center;font-size:30px;font-weight:900;line-height:1.2;margin:2px 0 4px;word-break:break-word}
.fz .enq .qp.ja{font-size:22px}.fz .enq .qs{text-align:center;font-size:12px;color:#8d7f9e;margin-bottom:10px}
.fz .enq .qc{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fz .enq .qc button{border:0;border-radius:14px;padding:12px 8px;min-height:54px;font:inherit;font-weight:800;font-size:15px;background:#f1ebf7;color:#5a4a6b;box-shadow:0 3px 0 #d8cde6}
.fz .enq .qc button.en{font-size:16px}
.fz .enq .qc button.ok{background:#8fdcab;color:#fff;box-shadow:0 3px 0 #5fb57f}.fz .enq .qc button.ng{background:#ff9aa6;color:#fff;box-shadow:0 3px 0 #d96b79}
.fz .enq .sp{border:0;background:#f1ebf7;border-radius:999px;padding:4px 10px;font:inherit;font-weight:900;color:#5a4a6b}
.fz .enq .res{text-align:center;font-weight:900;font-size:15px;margin-top:8px;min-height:20px}
.fz .ens{position:absolute;inset:0;z-index:4;overflow:auto;background:linear-gradient(#e8f6ff,#fff7ee);padding:12px 14px 30px;box-sizing:border-box;touch-action:pan-y}
.fz .ens h2{margin:4px 0 2px;font-size:20px}.fz .ens .nt{font-size:12px;color:#8d7f9e;margin:0 0 10px;line-height:1.5}
.fz .ens .top{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;align-items:center}
.fz .ens .tabs{display:flex;gap:6px;margin:8px 0}.fz .ens .tabs button{flex:1;border:0;border-radius:999px;padding:9px 6px;font:inherit;font-weight:900;font-size:13px;background:#fff;color:#5a4a6b;box-shadow:0 2px 6px #0001}
.fz .ens .tabs button.on{background:#5a4a6b;color:#fff}
.fz .ens .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(98px,1fr));gap:8px}
.fz .ens .cell{border:0;border-radius:14px;background:#fff;padding:8px 6px;font:inherit;color:#5a4a6b;box-shadow:0 2px 8px #0001;text-align:center;position:relative;min-height:92px}
.fz .ens .cell b{display:block;font-size:13px}.fz .ens .cell .ic.fa{height:auto;margin-bottom:2px}.fz .ens .cell .ic{font-size:26px;line-height:1.2;display:block}.fz .ens .cell small{display:block;font-size:10px;color:#8d7f9e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fz .ens .cell .pg{height:5px;border-radius:3px;background:#eee4f2;margin-top:5px;overflow:hidden}.fz .ens .cell .pg i{display:block;height:100%;background:#7fcf9f}
.fz .ens .cell.got{background:linear-gradient(160deg,#fffbe6,#fff)}.fz .ens .cell.crk{background:linear-gradient(160deg,#ffe8e8,#fff)}
.fz .ens .cell .dot{position:absolute;right:6px;top:6px;width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 2px #fff}
.fz .ens .row{background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px #0001;display:flex;gap:10px;align-items:center}
.fz .ens .row .fx{flex:1;min-width:0}.fz .ens .row .gb{height:7px;border-radius:4px;background:#eee4f2;overflow:hidden;margin:4px 0}.fz .ens .row .gb i{display:block;height:100%;background:linear-gradient(90deg,#7fd3ff,#7fcf9f)}
.fz .ens .tankv{position:relative;height:200px;border-radius:18px;overflow:hidden;box-shadow:0 4px 14px #0002;margin-bottom:10px;touch-action:pan-y;user-select:none}.fz .ens .tankv::after{content:'';position:absolute;inset:0;border-radius:18px;box-shadow:inset 0 0 0 6px #2b2b30;pointer-events:none;z-index:2}.fz .ens .tankv .tz{position:absolute;inset:0;transform-origin:0 0;background:linear-gradient(#bfe9ff,#5fb3e0 70%,#e8d9b0 70%,#e8d9b0)}.fz .ens .tankv .zh{position:absolute;right:12px;bottom:10px;z-index:3;font-size:11px;color:#fff;background:rgba(0,0,0,.4);border-radius:9px;padding:2px 7px;pointer-events:none}
.fz .ens .tankv canvas{position:absolute;inset:0;width:100%;height:100%}
.fz .ens .sbtn{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:900;font-size:13px;background:#fff;color:#5a4a6b;box-shadow:0 2px 6px #0002}
.fz .ens .sbtn.pri{background:linear-gradient(160deg,#ffd36b,#ffb35c)}.fz .ens .sbtn:disabled{opacity:.45}
.fz .enprog{position:absolute;right:10px;top:46px;z-index:3;background:rgba(255,255,255,.9);border-radius:999px;padding:5px 12px;font-weight:900;font-size:12px;box-shadow:0 2px 8px #0002;pointer-events:none;white-space:nowrap}
`;

export function createEnglish({ root, ctx, sfx, sheet, artCanvas, FISHBY, toast }) {
  // 魚の絵(釣りの本体と同じ絵)を <img> として出す。sil=かげ
  const fishImg = (id, w = 112, sil = false, rk = 0) => { const u = FIMG[id] && FIMG[id][Math.min(2, rk)]; if (!u) return '🐟'; return `<img src="${u}" style="width:100%;max-width:${w}px;height:${Math.round(w * 0.62)}px;object-fit:contain;display:block;margin:0 auto${sil ? ';filter:brightness(0) opacity(.3)' : ''}" alt="">`; };
  if (!document.getElementById('fz-en-css')) { const s = document.createElement('style'); s.id = 'fz-en-css'; s.textContent = CSS + MIXCSS; document.head.appendChild(s); }
  const learn = ctx.learn || localLearn();
  const seen = new Set();
  const emitLearn = (en, ja) => { const k = en.toLowerCase(); if (seen.has(k)) return; seen.add(k); try { ctx.emit('learn', { en, ja, src: 'fishing' }); } catch (e) { } };
  const say = en => { try { const u = new SpeechSynthesisUtterance(en); u.lang = 'en-US'; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } };

  // ---- 問題を作る ----
  function choicesFor(ans, pool, field, n = 4) {
    const parts = t => String(t).split(/[、,，・/／]/).map(x => x.trim()).filter(Boolean), used = new Set(parts(ans)), out = [ans];   // 正解の意味(「〜の上に、〜に」の「〜の上に」など)と重なる選択肢は出さない
    for (const w of shuffle(pool.slice())) { const v = w[field]; if (!v) continue; const pv = parts(v); if (pv.some(x => used.has(x))) continue; pv.forEach(x => used.add(x)); out.push(v); if (out.length >= n) break; }
    return shuffle(out);
  }
  // セットの単語(w=[en,pos,ja])。dir 'ej'=英→日 / 'je'=日→英
  function wordQ(lv, w, dir) {
    const pool = SW[lv].filter(x => x[1] === w[1] && x[0] !== w[0] && x[2] !== w[2]);
    const base = pool.length >= 6 ? pool : SW[lv].filter(x => x[0] !== w[0] && x[2] !== w[2]);
    return dir === 'ej' ? { prompt: w[0], en: w[0], sub: POS[w[1]] || '', choices: choicesFor(w[2], base, 2), ans: w[2], cEn: false, w }
      : { prompt: w[2], en: w[0], sub: (POS[w[1]] || '') + ' ・ 英語は?', choices: choicesFor(w[0], base, 0), ans: w[0], cEn: true, ja: true, w };
  }
  function idiomQ(lv) {
    const L = IDIOMS[lv] || IDIOMS[1], weak = L.filter(x => { const r = learn.get(x[0]); return !r || r.c < PERFECT_C; });
    const w = pick(weak.length ? weak : L), dir = Math.random() < 0.6 ? 'ej' : 'je', base = L.filter(x => x[0] !== w[0] && x[2] !== w[2]);
    return dir === 'ej' ? { prompt: w[0], en: w[0], sub: '熟語', choices: choicesFor(w[2], base, 2), ans: w[2], w, idiom: 1 }
      : { prompt: w[2], en: w[0], sub: '熟語 ・ 英語は?', choices: choicesFor(w[0], base, 0), ans: w[0], cEn: true, ja: true, w, idiom: 1 };
  }
  function freeQ(en, ja) {   // 単語集・記録の言葉(品詞なし)
    const all = SW[1].concat(SW[2]), base = all.filter(x => x[2] !== ja && x[0] !== en);
    return Math.random() < 0.6 ? { prompt: en, en, sub: '', choices: choicesFor(ja, base, 2), ans: ja, w: [en, 'x', ja] }
      : { prompt: ja, en, sub: '英語は?', choices: choicesFor(en, base, 0), ans: en, cEn: true, ja: true, w: [en, 'x', ja] };
  }

  // ---- 問題を出す(答えるまで釣りは止まる) → Promise<boolean> ----
  let busy = false;
  function ask(q, { label = '', time = T_Q, host = root } = {}) {
    return new Promise(res => {
      busy = true; if (ctx.params && ctx.params.debug) window.__enQ = q;   // 確認用
      const ov = document.createElement('div'); ov.className = 'enq';
      ov.innerHTML = `<div class="qb"><div class="ql"><span>${label}</span>${!q.ja ? '<button class="sp" data-sp>🔊</button>' : ''}</div><div class="qt"><i></i></div>
        <div class="qp ${q.ja ? 'ja' : ''}">${esc(q.prompt)}</div><div class="qs">${esc(q.sub || '')}</div>
        <div class="qc">${q.choices.map((c, i) => `<button data-i="${i}" class="${q.cEn ? 'en' : ''}">${esc(c)}</button>`).join('')}</div><div class="res"></div></div>`;
      ov.addEventListener('pointerdown', e => e.stopPropagation()); ov.addEventListener('pointerup', e => e.stopPropagation());
      host.appendChild(ov);
      const bar = ov.querySelector('.qt i');
      requestAnimationFrame(() => { bar.style.transition = `width ${time}s linear`; bar.style.width = '0%'; });
      if (!q.ja) say(q.en);
      let done = false; const t0 = Date.now();   // 出た直後0.7秒は押せない(合わせボタンを押した指が、答えに入ってしまわないように)
      ov.classList.add('lk'); setTimeout(() => ov.classList.remove('lk'), 700);
      const fin = (i) => {
        if (done) return; done = true; clearTimeout(tm);
        const ok = i != null && q.choices[i] === q.ans, bs = ov.querySelectorAll('.qc button');
        bs.forEach((b, k) => { if (q.choices[k] === q.ans) b.classList.add('ok'); else if (k === i) b.classList.add('ng'); b.disabled = true; });
        bar.style.transition = 'none';
        ov.querySelector('.res').innerHTML = ok ? '<span style="color:#3aa067">⭕ せいかい!</span>' : `<span style="color:#e0556b">${i == null ? '⏰ 時間切れ' : '❌ ざんねん'}</span> ・ ${esc(q.w[0])} = ${esc(q.w[2])}`;
        sfx.play(ok ? 'coin' : 'early');
        if (q.ja && ok) say(q.en);
        emitLearn(q.w[0], q.w[2]);
        setTimeout(() => { ov.remove(); busy = false; res(ok); }, ok ? 650 : 1600);
      };
      const tm = setTimeout(() => fin(null), time * 1000);
      ov.onclick = e => { if (Date.now() - t0 < 700) return; if (e.target.closest('[data-sp]')) { say(q.en); return; } const b = e.target.closest('[data-i]'); if (b) fin(+b.dataset.i); };
    });
  }

  // ---- セットの単語の「完璧」 ----
  // 答えを記録して、完璧になった・セットをぜんぶ完璧にした、を返す
  function markSet(setId, idx, ok) {
    const s = SET[setId], w = s.words[idx], r = learn.hit(w[0], ok, { ja: w[2], src: 'fishing' }) || { c: ok ? 1 : 0 };
    const was = !!spec.perf(setId)[idx];
    if (ok && r.c >= PERFECT_C) spec.setPerf(setId, idx, 1); else if (!ok) spec.setPerf(setId, idx, 0);
    const n = spec.perfCount(setId), full = n >= s.words.length;
    let got = null;
    if (full) {
      if (spec.give(setId)) { furn.give('sp_' + setId); got = 'new'; }
      else if (spec.cracked(setId)) { spec.setCrack(setId, 0); got = 'fix'; }
    }
    return { perfNow: !was && !!spec.perf(setId)[idx], lostPerf: was && !ok, n, total: s.words.length, got };
  }
  function nextIdx(setId, recent) {
    const s = SET[setId], p = spec.perf(setId);
    let cand = s.words.map((_, i) => i).filter(i => !p[i] && !recent.includes(i));
    if (!cand.length) cand = s.words.map((_, i) => i).filter(i => !p[i]);
    if (!cand.length) cand = s.words.map((_, i) => i).filter(i => !recent.includes(i));   // ぜんぶ完璧:ふつうの復習
    return pick(cand.length ? cand : [0]);
  }

  const idiom = async (lv, label, host) => { const q = idiomQ(lv), ok = await ask(q, { label, time: T_Q, host }); learn.hit(q.w[0], ok, { ja: q.w[2], src: 'fishing' }); return ok; };
  // ---- 釣りの中の出題(app.js の play から使う) ----
  function playGates(setId, ui, aboveP = () => 0) {
    const s = SET[setId], recent = [];
    spec.markPlayed(setId);
    const prog = document.createElement('div'); prog.className = 'enprog'; ui.appendChild(prog);
    const showProg = () => { const n = spec.perfCount(setId); prog.innerHTML = `📚 ${esc(s.title)} ・ 完璧 ${n} / ${s.words.length}${spec.has(setId) ? (spec.cracked(setId) ? ' 💥' : ' 🏺') : ''}`; };
    showProg();
    const pend = [];
    const word = async (dir, label, time) => {
      const i = nextIdx(setId, recent); recent.push(i); if (recent.length > 4) recent.shift();
      const ok = await ask(wordQ(s.lv, s.words[i], dir), { label, time, host: ui.parentNode });
      const m = markSet(setId, i, ok); showProg();
      if (m.got) pend.push(m.got);   // 標本のお祝いは釣りの途中では出さない(結果画面のあとで flush)
      else if (m.perfNow) toast(`✨ 「${s.words[i][0]}」完璧! (${m.n}/${m.total})`);
      return { ok, m };
    };
    return {
      get busy() { return busy; },
      flush() { while (pend.length) celebrate(setId, pend.shift()); },
      cast: () => idiom(s.lv, '🎯 投げた! 熟語に答えると魚がよく寄る', ui.parentNode),
      bite: () => word('ej', '🎣 合わせそこねた! 正解でもういちどチャンス(まちがえると逃げる)', T_BITE),
      gap: () => GAPS[+(ctx.storage.get('enGap') || 1)] || 2,
      thrash: () => idiom(s.lv, '🌊 最後のあがき! 熟語で落ち着かせろ', ui.parentNode),
      // 取りこむ直前:ふつうの魚は熟語、レアは難しい熟語。まちがえてももう1回、それもだめなら少し小さくなって釣れる
      net: async sp => { const rare = sp.r >= 4, lq = rare ? 3 : s.lv; let ok = await idiom(lq, rare ? '🎣 取りこむ直前! レアは むずかしい熟語' : '🎣 取りこむ直前! 熟語に答えよう', ui.parentNode); if (ok) return { ok: true }; ok = await idiom(lq, '🎣 もう1回チャンス!', ui.parentNode); return ok ? { ok: true } : { ok: true, shrink: true }; },
      // 巻き取り:文の並べ替え(アミューズメントの並べ替えと同じデータ)。大物ほど長い文
      reel: (sp, size, cb) => { const n = sp.r >= 4 ? 5 : (sp.r >= 3 || size >= 60) ? 4 : 3;
        return sortReel(ui, { n, fishName: sp.name, icon: '🐟', volume: ctx.audio && ctx.audio.sfx, pre: +(ctx.storage.get('enPre') ?? 1), mode: ctx.storage.get('enSm') || 'ja', ...cb, onLearn: d => { try { ctx.emit('learn', { ...d, src: '釣りの巻き取り' }); } catch (e) { } } }); },
      // 待っているあいだの問題(どんどん出る)。単語が多め、ときどき熟語
      wait: async () => {
        if (s.lv < 3 && Math.random() < aboveP()) {   // 今より1つ上のレベルの問題(竿が良いほど出にくい)。正解するとメーターが多く上がる
          { const w = pick(SW[s.lv + 1]), ok = await ask(wordQ(s.lv + 1, w, Math.random() < 0.5 ? 'ej' : 'je'), { label: '⏳ ちょっと上のレベル! 単語', time: T_Q + 3, host: ui.parentNode }); return { ok, above: true }; }
        }
        return word(Math.random() < 0.5 ? 'ej' : 'je', '⏳ 気になってる! 単語に答えよう', T_Q);   // 合わせまでは単語だけ
      },
      refresh: showProg,
    };
  }

  // ---- 標本をもらった ----
  function celebrate(setId, kind) {
    const s = SET[setId], L = s.look;
    sfx.play('legend', true);
    const sh = sheet(`<div class="ph" style="justify-content:center;flex-direction:column;gap:2px"><div style="font-size:13px;font-weight:900;color:#e0a000">${kind === 'fix' ? '🔧 標本が直った!' : '🏺 セット完璧!'}</div>
      <h2 style="font-size:22px">${esc(L.name)}の標本</h2><div style="font-family:Georgia,serif;font-style:italic;color:#8d7f9e">${esc(L.en)}</div></div>
      <div class="sc" style="text-align:center"><div style="font-size:64px;line-height:1.2">${ICON[L.shape] || '🏺'}</div>
      <div style="font-size:14px;line-height:1.6">${esc(s.title)}(${esc(s.range)})の${s.words.length}語を、ぜんぶ完璧にした!</div>
      <div style="font-size:12px;color:#8d7f9e;margin-top:6px">${kind === 'fix' ? 'ひびが消えて、元どおり。' : '家の「持ち物」に入ったよ。かざってみよう。'}<br>抜き打ちテストで まちがえすぎると、ひびが入るよ。</div></div>
      <div style="padding:8px 16px 16px;text-align:center"><button class="btn" data-x>やったー</button></div>`, true);
    sh.querySelector('[data-x]').onclick = () => sh.remove();
  }

  // ---- 釣った魚を水槽へ ----
  const tankRoom = () => spec.tank().length < TANK_MAX;
  const boxRoom = () => spec.box().length < spec.boxSlots();
  const keepRoom = () => tankRoom() || boxRoom();
  const BOX_COIN = [300, 1000], BOX_GEM = 30, FULL_COIN = 1;   // 仮:図鑑の枠のねだん(2枠目・3枠目はコイン、4枠目はダイヤ)/満腹コイン
  function keepFish(sp, size) {
    const fish = { uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), id: sp.id, size, g: 0, day: '', n: 0, at: Date.now() };
    if (!tankRoom()) { if (!boxRoom()) return false; const b = spec.box(); b.push(fish); spec.saveBox(b); return 'box'; }   // 水槽がいっぱいなら図鑑の枠へ
    const t = spec.tank(); t.push(fish); spec.saveTank(t);
    if (!spec.hasTank()) { spec.gotTank(); furn.give('tank'); return 'first'; }
    return true;
  }

  // ---- 画面:釣り堀えらび ----
  function pondScreen({ onPick, onBack }) {
    if (needTest()) { testIntro(onBack, () => pondScreen({ onPick, onBack })); return; }
    const sc = document.createElement('div'); sc.className = 'ens'; root.appendChild(sc);
    let lv = +(ctx.storage.get('enLv') || 1);
    const draw = () => {
      const sets = SETS.filter(s => s.lv === lv), own = spec.own(), got = sets.filter(s => own[s.id]).length;
      sc.innerHTML = `<div class="top"><button class="sbtn" data-a="back">← もどる</button><span style="flex:1"></span></div>
        <h2>📚 英語の釣り堀</h2><p class="nt">えらんだセットの単語だけが出るよ。魚が近づいたら単語に答えて「気になり度」をためよう。合わせ損ねた時は単語、あばれた時は熟語、巻き取りは文の並べ替え。<b>セットの単語をぜんぶ完璧</b>(続けて${PERFECT_C}回正解。ストリームで正解した分も入る)にすると、そのセットの標本がもらえる。魚はどのセットでもふつうに釣れるよ。</p>
        <div class="tabs">${[1, 2, 3].map(l => `<button data-lv="${l}" class="${l === lv ? 'on' : ''}">${LV_NAME[l]}<br><small style="font-weight:700;font-size:10px">${LV_SUB[l]}</small></button>`).join('')}</div>
        <p class="nt" style="margin:0 0 8px">標本 ${got} / ${sets.length}</p>
        <p class="nt" style="margin:0 0 8px">巻き取りの並べ替え: ${[[1, '🔊 最初に聞く'], [0, '聞かない']].map(([k, t]) => `<button class="sbtn" data-pre="${k}" style="${(+(ctx.storage.get('enPre') ?? 1)) === k ? 'background:#f58aa8;color:#fff' : ''}">${t}</button>`).join(' ')} ${[['ja', '日本語を並べる'], ['en', '英文を並べる']].map(([k, t]) => `<button class="sbtn" data-sm="${k}" style="${(ctx.storage.get('enSm') || 'ja') === k ? 'background:#f58aa8;color:#fff' : ''}">${t}</button>`).join(' ')}</p>
        <p class="nt" style="margin:0 0 8px">問題の間隔: ${[[1, 'はやい(1秒)'], [2, 'ふつう(4秒)'], [3, 'ゆっくり(10秒)']].map(([k, t]) => `<button class="sbtn" data-gap="${k}" style="${(+(ctx.storage.get('enGap') || 1)) === k ? 'background:#f58aa8;color:#fff' : ''}">${t}</button>`).join(' ')}</p>
        <div class="grid">${sets.map(s => { const n = spec.perfCount(s.id), o = own[s.id]; return `<button class="cell ${o ? (o.crack ? 'crk' : 'got') : ''}" data-s="${s.id}"><b>セット${s.no}</b><span class="ic">${o ? (o.crack ? '💥' : ICON[s.look.shape] || '🏺') : '🎣'}</span><small>${esc(s.words[0][0])}…</small><div class="pg"><i style="width:${n / s.words.length * 100}%"></i></div><small>完璧 ${n}/${s.words.length}</small></button>`; }).join('')}</div>`;
    };
    draw();
    sc.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a, l = e.target.closest('[data-lv]'), c = e.target.closest('[data-s]');
      if (a) sfx.play('tap');
      if (a === 'back') { sc.remove(); onBack(); }
      else if (a === 'tank') { sc.remove(); tankScreen({ onBack: () => pondScreen({ onPick, onBack }) }); }
      else if (a === 'col') { sc.remove(); collection({ onBack: () => pondScreen({ onPick, onBack }) }); }
      else if (e.target.closest('[data-pre]')) { sfx.play('tap'); ctx.storage.set('enPre', +e.target.closest('[data-pre]').dataset.pre); draw(); }
      else if (e.target.closest('[data-sm]')) { sfx.play('tap'); ctx.storage.set('enSm', e.target.closest('[data-sm]').dataset.sm); draw(); }
      else if (e.target.closest('[data-gap]')) { sfx.play('tap'); ctx.storage.set('enGap', +e.target.closest('[data-gap]').dataset.gap); draw(); sc.scrollTop = sc.scrollTop; }
      else if (l) { sfx.play('tap'); lv = +l.dataset.lv; ctx.storage.set('enLv', lv); draw(); sc.scrollTop = 0; }
      else if (c) { sfx.play('tap'); setInfo(SET[c.dataset.s], () => { sc.remove(); onPick(c.dataset.s, SET[c.dataset.s].lv); }); }
    };
  }
  function setInfo(s, go) {
    const o = spec.own()[s.id], n = spec.perfCount(s.id), p = spec.perf(s.id);
    const sh = sheet(`<div class="ph"><h2>${esc(s.title)}</h2></div><div class="sc" style="font-size:13px;line-height:1.6">
      <div style="display:flex;gap:10px;align-items:center;background:#fff8e6;border-radius:14px;padding:8px 10px;margin-bottom:8px"><span style="font-size:36px">${o ? (o.crack ? '💥' : ICON[s.look.shape]) : '❔'}</span>
      <div><b>${o ? esc(s.look.name) + 'の標本' + (o.crack ? '(ひび)' : '') : 'ごほうび:？？？の標本'}</b><br><small>${esc(condOf(s))}</small></div></div>
      <b>完璧 ${n} / ${s.words.length}</b>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${s.words.map((w, i) => `<span style="background:${p[i] ? '#d8f3e2' : '#f1ebf7'};border-radius:8px;padding:2px 7px;font-size:12px">${p[i] ? '✓ ' : ''}${esc(w[0])}</span>`).join('')}</div>
      <p style="font-size:12px;color:#8d7f9e">先にストリームの「単語練習」で同じセット(${esc(s.id)})をやっておくと、完璧が早くなるよ。</p></div>
      <div style="padding:8px 16px 16px;display:flex;gap:8px;justify-content:center"><button class="btn sub" data-n>やめる</button><button class="btn" data-g>🎣 この釣り堀で釣る</button></div>`, true);
    sh.querySelector('[data-n]').onclick = () => sh.remove();
    sh.querySelector('[data-g]').onclick = () => { sh.remove(); go(); };
  }

  // ---- 画面:標本コレクション(入手条件つき) ----
  function collection({ onBack }) {
    const sc = document.createElement('div'); sc.className = 'ens'; root.appendChild(sc);
    let tab = ctx.storage.get('colTab') || 1;
    const boxHTML = () => {   // 図鑑の枠(持ち魚):水槽と出し入れして育てる
      const bx = spec.box(), n = spec.boxSlots(), gem = ctx.gems ? ctx.gems.get() : null;
      const rows = [0, 1, 2, 3].map(i => {
        if (i < n) { const f = bx[i]; if (!f) return `<div class="row"><div class="fx" style="color:#8d7f9e">あき(水槽の魚を「図鑑へ」で入れられるよ)</div></div>`;
          const sp = FISHBY[f.id]; return `<div class="row"><span style="width:56px;flex:none">${fishImg(f.id, 56, false, f.rk || 0)}</span><div class="fx"><b>${esc(RANK_PRE[f.rk || 0] + (sp ? sp.name : f.id))}</b> <small style="color:#8d7f9e">そだち ${f.g}/${GROW_NEED}${spec.full()[f.id] ? ' ・ 満腹ずみ' : ''}</small><div class="gb"><i style="width:${Math.min(100, f.g / GROW_NEED * 100)}%"></i></div></div><button class="sbtn" data-totank="${f.uid}">🐠水槽へ</button></div>`; }
        if (i > n) return `<div class="row"><div class="fx" style="color:#b9aecb">🔒 ${i + 1}つ目の枠</div></div>`;
        return i < 3 ? `<div class="row"><div class="fx">🔒 ${i + 1}つ目の枠</div><button class="sbtn pri" data-unl="coin">🪙 ${BOX_COIN[i - 1]}で開ける</button></div>`
          : `<div class="row"><div class="fx">🔒 4つ目の枠(ダイヤ)</div><button class="sbtn pri" data-unl="gem">💎 ${BOX_GEM}で開ける</button></div>`;
      }).join('');
      return `<h3 style="margin:6px 0">🐟 図鑑の枠 ${bx.length} / ${n}</h3><p class="nt" style="margin:0 0 6px">魚を入れておく枠。水槽(6匹)と出し入れして、育てる魚をかえられる。そだち・満腹の記録は消えないよ。${gem !== null ? ` 💎 ${gem}` : ''}</p>${rows}<h3 style="margin:12px 0 6px">📖 魚ずかん</h3>`;
    };
    const draw = () => {
      const own = spec.own(), adm = isAdmin();
      let body;
      if (tab === 'f') {
        const gr = spec.grown();
        body = boxHTML() + `<p class="nt">水槽で育てきった魚が、アルバムに記録される(えさ${GROW_NEED}回・1日${FEED_PER_DAY}回まで)。</p><div class="grid">${FISH_SPEC.map(f => { const n = gr.includes(f.id) || furn.owned('fs_' + f.id), bk = spec.fishBest()[f.id] || 0; return `<div class="cell ${n ? 'got' : ''}" data-fd="${f.id}">${adm ? `<div class="admf"><button data-admf="${f.id}" data-d="-1">－</button><i>${spec.tank().filter(x => x.id === f.id).length}匹</i><button data-admf="${f.id}" data-d="1">＋</button></div>` : ''}<span class="ic fa">${fishImg(f.id, 112, !n, bk)}</span><b>${n ? esc(f.name) : '？？？'}</b><small>${n ? esc(f.en) + (bk ? ' ・ ' + esc(RANK_PRE[bk]) : '') : '★'.repeat(f.r)}</small></div>`; }).join('')}</div>`;
      } else if (tab === 'd') {
        const dl = spec.decor();
        body = `<p class="nt">標本の形の組み合わせ(レシピ)で、水槽の飾りができる。できた飾りは、ぜんぶここに記録される。「混ぜる」でレシピのヒントが見られるよ。</p><div class="grid">${[1, 2, 3].flatMap(lv => DECOR[lv].map((_, r) => { const n = dl.filter(d => d.lv === lv && d.rar === r).length, k = decorOf({ lv, rar: r }); return `<div class="cell ${n ? 'got' : ''}"><span class="ic">${n ? k.icon : '❔'}</span><b>${n ? esc(k.name) : '？？？'}<span class="rr rr${r}">${RAR[r]}</span></b><small>${n ? esc(k.en) + (n > 1 ? ' ×' + n : '') : LV_NAME[lv]}</small></div>`; })).join('')}</div>`;
      } else {
        const sets = SETS.filter(s => s.lv === tab);
        body = `<p class="nt">入手条件:そのセットの単語をぜんぶ完璧にする。💥=ひび(抜き打ちテストで まちがえすぎた)。🔀=混ぜて飾りになった(アルバムには残る)。</p><div class="grid">${sets.map(s => { const o = own[s.id], n = spec.perfCount(s.id); return `<button class="cell ${o ? (o.crack ? 'crk' : 'got') : ''} ${o && o.used ? 'used' : ''}" data-s="${s.id}">${adm ? `<input type="checkbox" class="adm" data-adm="${s.id}" ${o ? 'checked' : ''}>` : ''}${o && o.used ? '<span class="ub">🔀混ぜた</span>' : ''}${o ? `<i class="dot" style="background:${hexCol(s.look.col)}"></i>` : ''}<span class="ic">${o ? (o.crack ? '💥' : ICON[s.look.shape]) : '❔'}</span><b>${o ? esc(s.look.name) : 'セット' + s.no}</b><small>${o ? esc(s.look.en) : esc(s.words[0][0]) + '…'}</small>${o ? '' : `<div class="pg"><i style="width:${n / s.words.length * 100}%"></i></div>`}</button>`; }).join('')}</div>`;
      }
      const cnt = Object.keys(own).length, avail = Object.keys(own).filter(id => !own[id].used).length;
      sc.innerHTML = `<div class="top"><button class="sbtn" data-a="back">← もどる</button><span style="flex:1"></span><button class="sbtn pri" data-a="mix">🎰 混ぜる</button></div><h2>📖 図鑑</h2>${adm ? `<p class="nt" style="background:#fff0d0;border-radius:10px;padding:6px 10px">🛠 運営テスト:標本はチェック、魚は＋－で水槽に入れる(同じ魚を3匹入れれば混ぜられる)。${typeof tab === 'number' ? `<button class="sbtn" data-a="admall">このレベルを全部ON</button> <button class="sbtn" data-a="admnone">全部OFF</button>` : ''}</p>` : ''}<p class="nt">集めた標本 ${cnt} / ${SETS.length}(いま持っている ${avail}) ・ 飾り ${spec.decor().length} ・ 育てた魚 ${spec.grown().length}。</p>
        <div class="tabs">${[[1, '初級'], [2, '中級'], [3, '上級'], ['f', '魚'], ['d', '飾り']].map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>${body}`;
    };
    draw();
    // 魚をタップ → 大きな絵と説明(持っている強さの絵だけ見られる。まだの魚は「？」)
    const fishDetail = (id, rk0) => {
      const f = FISHBY[id]; if (!f) return;
      const gr = spec.grown().includes(id) || furn.owned('fs_' + id), best = spec.fishBest()[id] || 0, rk = Math.min(rk0 === undefined ? best : rk0, FISH_MAX_RANK);
      let ov = sc.querySelector('.fdx'); if (!ov) { ov = document.createElement('div'); ov.className = 'fdx'; sc.appendChild(ov); }
      const AN = { open: 'ひらけた所', weed: '水草', log: 'しずんだ木', lily: 'ハスの葉', rock: '岩場', deep: 'ふかみ' };
      const TM = { day: '明るいうち', night: '夜', any: 'いつでも' };
      const [lo, hi] = f.size || [10, 20], mul = RANK_MUL[rk];
      const tabs = [0, 1, 2].map(k => `<button class="${k === rk ? 'on' : ''}" data-fr="${k}" ${gr && k <= best ? '' : 'disabled'}>${['ふつう', 'りっぱな', '伝説の'][k]}</button>`).join('');
      ov.innerHTML = `<div class="fdc"><button class="x" data-fx>✕</button><div class="fpic">${fishImg(id, 320, !gr, rk)}</div>
        ${gr ? `<div class="rt">${['N', 'SR', 'SSR'][rk]}</div><h3>${esc(RANK_PRE[rk] + f.name)}</h3><div class="en">${esc(f.en)}　${'★'.repeat(f.r)}</div>
        <div class="tb">${tabs}</div>
        <p class="ds">${esc(f.hint || '')}</p>
        <table><tr><th>大きさ</th><td>${Math.round(lo * 1.5 * mul)}〜${Math.round(hi * 1.5 * mul)}cm</td></tr><tr><th>いる所</th><td>${(f.area || ['open']).map(a => AN[a] || a).join('・')}</td></tr><tr><th>時間</th><td>${TM[f.time] || 'いつでも'}</td></tr></table>
        <p class="sy">“${esc(f.say || '')}”</p>` : `<h3>？？？</h3><div class="en">${'★'.repeat(f.r)}</div><p class="ds">まだ出会っていない魚。水槽で育てきるとアルバムに載るよ。</p>`}</div>`;
      ov.onclick = e => { if (e.target === ov || e.target.closest('[data-fx]')) { sfx.play('tap'); ov.remove(); } else { const r = e.target.closest('[data-fr]'); if (r && !r.disabled) { sfx.play('tap'); fishDetail(id, +r.dataset.fr); } } };
    };
    const admSet = (id, on) => {
      const s = SET[id]; if (!s) return;
      if (on) { if (!spec.own()[id]) { spec.give(id); furn.give('sp_' + id); } else if (spec.isUsed(id)) { const o = spec.own(); o[id].used = 0; spec.setCrack(id, 0); st0(o); furn.give('sp_' + id); } s.words.forEach((_, i) => spec.setPerf(id, i, 1)); }
      else { if (spec.own()[id] && !spec.isUsed(id)) furn.take('sp_' + id); spec.drop(id); }
    };
    const st0 = o => { try { localStorage.setItem('town:spec:own', JSON.stringify(o)); } catch (e) { } };
    sc.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a, t = e.target.closest('[data-t]'), c = e.target.closest('[data-s]');
      const ad = e.target.closest('[data-adm]'), af = e.target.closest('[data-admf]');
      if (ad) { admSet(ad.dataset.adm, e.target.checked); draw(); return; }
      if (af) {
        const id = af.dataset.admf, d = +af.dataset.d, f = FISH_SPEC.find(x => x.id === id);
        let tk = spec.tank();
        if (d > 0) { if (tk.length >= TANK_MAX) { toast('水槽がいっぱい(6匹まで)'); return; } tk.push({ uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), id, size: f && f.size ? f.size[1] : 30, g: GROW_NEED, day: '', n: 0, at: Date.now() }); spec.saveTank(tk); spec.markGrown(id); if (!spec.hasTank()) { spec.gotTank(); furn.give('tank'); } }
        else { const i = tk.map(x => x.id).lastIndexOf(id); if (i >= 0) { tk.splice(i, 1); spec.saveTank(tk); } }
        draw(); return;
      }
      const tt = e.target.closest('[data-totank]'), ul = e.target.closest('[data-unl]');
      if (tt) { const b = spec.box(), i = b.findIndex(x => x.uid === tt.dataset.totank); if (i < 0) return; if (!tankRoom()) { toast('水槽がいっぱい(6匹まで)。水槽から「図鑑へ」入れかえてね'); return; } const t = spec.tank(); t.push(b.splice(i, 1)[0]); spec.saveBox(b); spec.saveTank(t); if (!spec.hasTank()) spec.gotTank(); sfx.play('tap'); toast('🐠 水槽に入れた'); draw(); return; }
      if (ul) {
        if (ul.dataset.unl === 'coin') { const p = BOX_COIN[spec.boxSlots() - 1] ?? BOX_COIN[1]; if (ctx.wallet.get() < p) { toast(`コインがあと ${p - ctx.wallet.get()} たりないよ`); sfx.play('early'); return; } ctx.wallet.add(-p, 'boxslot'); }
        else { if (!ctx.gems) { toast('ダイヤは準備中だよ'); return; } if (!ctx.gems.spend(BOX_GEM)) { toast('ダイヤがたりないよ'); sfx.play('early'); return; } }
        spec.addBoxSlot(); sfx.play('coin'); toast('🔓 図鑑の枠が ふえた!'); draw(); return;
      }
      const fd = e.target.closest('[data-fd]');
      if (fd && !e.target.closest('.admf')) { sfx.play('tap'); fishDetail(fd.dataset.fd); return; }
      if (a === 'admall' && typeof tab === 'number') { SETS.filter(s => s.lv === tab).forEach(s => admSet(s.id, true)); draw(); return; }
      if (a === 'admnone' && typeof tab === 'number') { SETS.filter(s => s.lv === tab).forEach(s => admSet(s.id, false)); draw(); return; }
      if (a === 'back') { sfx.play('tap'); sc.remove(); onBack(); }
      else if (a === 'mix') { sfx.play('tap'); sc.remove(); mixScreen({ onBack: () => collection({ onBack }) }); }
      else if (t) { sfx.play('tap'); tab = t.dataset.t === 'f' || t.dataset.t === 'd' ? t.dataset.t : +t.dataset.t; ctx.storage.set('colTab', tab); draw(); }
      else if (c) { const s = SET[c.dataset.s], o = spec.own()[s.id]; toast(o ? `${s.look.name}(${s.look.en})・${s.title}${o.used ? '・混ぜた' : ''}` : condOf(s)); }
    };
  }

  // ---- 画面:混ぜる ----
  //   飾り:同じレベルの標本を MIX_N つ。形の組み合わせ(レシピ)が合うと決まった飾りができる(運なし)。使った標本は消えて、アルバムには残る
  //   魚:水槽で育てきった同じ種類・同じ段階の魚を MIX_N 匹 → 1つ強い魚(大きく・称号つき)
  function mixScreen({ onBack }) {
    const sc = document.createElement('div'); sc.className = 'ens'; root.appendChild(sc);
    let mode = ctx.storage.get('mixMode') || 'd', lv = +(ctx.storage.get('mixLv') || 1), pick3 = [];
    const avail = l => Object.entries(spec.own()).filter(([id, o]) => SET[id] && SET[id].lv === l && !o.crack && !o.used).map(([id]) => SET[id]);
    const fishAvail = () => spec.tank().filter(f => f.g >= GROW_NEED && (f.rk || 0) < FISH_MAX_RANK);
    const fname = f => { const sp = FISHBY[f.id]; return RANK_PRE[f.rk || 0] + (sp ? sp.name : f.id); };
    const draw = () => {
      const ready = pick3.length === MIX_N, tabs = `<div class="tabs">${[['d', '飾りを作る'], ['f', '魚を強くする']].map(([k, n]) => `<button data-mode="${k}" class="${k === mode ? 'on' : ''}">${n}</button>`).join('')}</div>`;
      let body;
      if (mode === 'd') {
        const list = avail(lv), rc = spec.recipes();
        body = `<p class="nt">同じレベルの標本を${MIX_N}つ選んで混ぜる。<b>形の組み合わせ(レシピ)</b>が合うと、決まった飾りができる。合わないと何も起きず、標本も消えないよ。使った標本は消えるけど、アルバムには残る。</p>
          <div class="tabs">${[1, 2, 3].map(l => `<button data-lv="${l}" class="${l === lv ? 'on' : ''}">${LV_NAME[l]}<br><small style="font-weight:700;font-size:10px">${avail(l).length}こ</small></button>`).join('')}</div>
          <div class="rcp">${RECIPES[lv].map((r, i) => { const k = decorOf({ lv, rar: i }), got = rc.includes(lv + ':' + i); return `<div class="rr3x"><span class="rr rr${i}">${RAR[i]}</span> ${got ? `${k.icon} <b>${esc(k.name)}</b> = ${r.map(x => esc(shapeName(lv, x))).join(' + ')}` : `❔ ??? = <b>${esc(shapeName(lv, r[0]))}</b> + ？ + ？`}</div>`; }).join('')}</div>
          ${list.length ? `<div class="grid">${list.map(s => `<button class="cell got ${pick3.includes(s.id) ? 'sel' : ''}" data-p="${s.id}"><span class="ic">${ICON[s.look.shape]}</span><b>${esc(s.look.name)}</b><small>${esc(shapeName(lv, s.look.shape))}</small></button>`).join('')}</div>` : `<p class="nt">このレベルの標本がまだないよ。英語の釣り堀で、セットの単語を ぜんぶ完璧にしよう。</p>`}`;
      } else {
        const list = fishAvail();
        body = `<p class="nt">水槽で<b>育てきった、同じ種類・同じ強さの魚</b>を${MIX_N}匹選んで混ぜると、1匹の強い魚になる(大きく・称号つき。最大2段階)。元の魚はアルバムに残るよ。</p>
          ${list.length ? `<div class="grid">${list.map(f => `<button class="cell got ${pick3.includes(f.uid) ? 'sel' : ''}" data-p="${f.uid}"><span class="ic fa">${fishImg(f.id, 96, false, f.rk || 0)}</span><b>${esc(fname(f))}</b><small>${Math.round(f.size * 1.5)}cm</small></button>`).join('')}</div>` : `<p class="nt">育ちきった魚がまだいないよ。水槽で魚を育てよう。</p>`}`;
      }
      sc.innerHTML = `<div class="top"><button class="sbtn" data-a="back">← もどる</button></div><h2>🎰 混ぜる</h2>${tabs}${body}
        <div style="position:sticky;bottom:0;padding:10px 0;background:linear-gradient(transparent,#fff8ef 30%)"><button class="btn" data-a="go" style="width:100%" ${ready ? '' : 'disabled'}>混ぜる! (${pick3.length}/${MIX_N})</button></div>`;
    };
    draw();
    sc.onclick = async e => {
      const a = e.target.closest('[data-a]')?.dataset.a, l = e.target.closest('[data-lv]'), p = e.target.closest('[data-p]'), m = e.target.closest('[data-mode]');
      if (a === 'back') { sfx.play('tap'); sc.remove(); onBack(); }
      else if (m) { sfx.play('tap'); mode = m.dataset.mode; ctx.storage.set('mixMode', mode); pick3 = []; draw(); }
      else if (l) { sfx.play('tap'); lv = +l.dataset.lv; ctx.storage.set('mixLv', lv); pick3 = []; draw(); }
      else if (p) {
        sfx.play('tap'); const id = p.dataset.p, i = pick3.indexOf(id);
        if (i >= 0) pick3.splice(i, 1); else if (pick3.length < MIX_N) pick3.push(id);
        draw();
      }
      else if (a === 'go' && pick3.length === MIX_N) {
        if (mode === 'd') {
          const used = pick3.map(id => SET[id]), rar = recipeFor(lv, used.map(x => x.look.shape));
          if (rar < 0) { toast('何も起きなかった…別の組み合わせを試そう(標本は消えてないよ)'); sfx.play('early'); return; }
          pick3 = []; used.forEach(x => { spec.use(x.id); furn.take('sp_' + x.id); });
          const d = { uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), lv, rar, at: Date.now() }; spec.addDecor(d); spec.addRecipe(lv + ':' + rar);
          const k = decorOf(d);
          await gacha(used.map(x => ICON[x.look.shape]), { rar, icon: k.icon, name: k.name, en: k.en, line: (rar >= 2 ? '水槽がぐっと豪華に!' : '水槽に飾られたよ') + ' ・ 水槽ランク: ' + TANK_RANKS[spec.rank()][1] });
        } else {
          const t = spec.tank(), sel = pick3.map(id => t.find(f => f.uid === id)).filter(Boolean);
          if (sel.length !== MIX_N || sel.some(f => f.id !== sel[0].id || (f.rk || 0) !== (sel[0].rk || 0))) { toast('同じ種類・同じ強さの魚を選んでね'); sfx.play('early'); return; }
          pick3 = []; const rk = (sel[0].rk || 0) + 1, size = Math.round(Math.max(...sel.map(f => f.size)) * RANK_MUL[rk] / RANK_MUL[rk - 1]);
          const nf = { uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), id: sel[0].id, size, g: GROW_NEED, day: '', n: 0, at: Date.now(), rk };
          spec.saveTank(t.filter(f => !sel.includes(f)).concat([nf])); spec.markGrown(nf.id, rk);
          await gacha(sel.map(x => fishImg(x.id, 70, false, x.rk || 0)), { rar: rk + 1, icon: fishImg(nf.id, 200, false, rk), name: fname(nf), en: (FISHBY[nf.id] || {}).en || '', line: `${size}cm の強い魚になった! 水槽で泳いでるよ` });
        }
        draw();
      }
    };
  }
  // 混ぜた演出(運ではなく、できるものが決まっている)。c = {rar:0〜3, icon, name, en, line}
  //  素材が渦をまいて寄ってきて重なる → 稲妻がはしる → 閃光・衝撃波・火花 → カードがせり出す。ランクが上ほど長く・派手に
  function gacha(icons, c) {
    return new Promise(res => {
      const rar = Math.min(3, c.rar | 0);
      const G = ['#aab4c0', '#4aa8ff', '#c07bff', '#ffc400'][rar], G2 = ['#e8eef5', '#bfe0ff', '#ecd4ff', '#fff2b0'][rar];
      const tG = [1.4, 1.5, 1.7, 1.9][rar], tC = [0.55, 0.8, 1.1, 1.6][rar], tB = tG + tC;   // 寄る時間 / ため時間 / 爆発の時刻
      const ov = document.createElement('div'); ov.className = 'mixfx'; ov.style.setProperty('--g', G);
      ov.innerHTML = `<canvas class="mxc"></canvas><div class="mxi">${icons.map(ic => `<span class="mxe">${ic}</span>`).join('')}</div><div class="mxt">まざる…!</div>`;
      root.appendChild(ov); sfx.play('whoosh');
      const cv = ov.querySelector('canvas'), els = [...ov.querySelectorAll('.mxe')], tx = ov.querySelector('.mxt');
      const W = ov.clientWidth || 390, H = ov.clientHeight || 700, dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = W / 2, cy = H * 0.44, R0 = Math.min(W, H) * 0.42, n = els.length, off = Math.random() * 6.28;
      const ease = x => x * x * (3 - 2 * x), clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
      const bolts = [], parts = [], rings = [], trail = els.map(() => []);
      let t0 = performance.now(), raf = 0, burst = false, shown = false, flash = 0, shake = 0, nextBolt = 0, closed = false, lastSp = 0;
      const bolt = (x1, y1, x2, y2, life, w, col) => {   // ぎざぎざの稲妻
        const pts = [[x1, y1]], segs = 9, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        for (let i = 1; i < segs; i++) { const k = i / segs, j = (Math.random() - 0.5) * len * 0.16 * Math.sin(k * Math.PI); pts.push([x1 + dx * k + nx * j, y1 + dy * k + ny * j]); }
        pts.push([x2, y2]); bolts.push({ pts, life, max: life, w, col });
        if (Math.random() < 0.5) { const m = pts[3 + Math.floor(Math.random() * 3)], a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.6, L2 = len * 0.3; bolts.push({ pts: [m, [m[0] + Math.cos(a) * L2 * 0.5 + (Math.random() - 0.5) * 12, m[1] + Math.sin(a) * L2 * 0.5], [m[0] + Math.cos(a) * L2, m[1] + Math.sin(a) * L2]], life: life * 0.8, max: life, w: w * 0.55, col }); }
      };
      const spark = (x, y, v, col, life, size = 3) => { const a = Math.random() * 6.28, s = v * (0.3 + Math.random()); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, col, size, g: 260 }); };
      const doBurst = () => {
        burst = true; flash = 1; shake = [5, 9, 15, 24][rar];
        sfx.play(rar >= 2 ? 'legend' : 'coin', rar >= 2);
        for (let i = 0; i < 1 + rar; i++) rings.push({ r: 6, v: 380 + i * 140, life: 0.9 + i * 0.12, max: 0.9 + i * 0.12, col: i % 2 ? G2 : G, delay: i * 0.1 });
        const N = 50 + rar * 60; for (let i = 0; i < N; i++) spark(cx, cy, 300 + rar * 130, Math.random() < 0.4 ? '#fff' : (Math.random() < 0.5 ? G : G2), 0.9 + Math.random() * 1.0, 2 + Math.random() * 3);
        for (let i = 0; i < 6 + rar * 6; i++) { const a = Math.random() * 6.28; bolt(cx, cy, cx + Math.cos(a) * W * (0.5 + Math.random() * 0.3), cy + Math.sin(a) * W * (0.5 + Math.random() * 0.3), 0.35, 3 + rar, G2); }
        if (rar >= 3) setTimeout(() => { if (closed) return; flash = 0.8; shake = 16; sfx.play('coin'); for (let i = 0; i < 80; i++) spark(cx, cy, 460, ['#ffd84a', '#fff', '#ff9a3a', '#ff6fb0', '#7fd7ff'][i % 5], 1.3, 3 + Math.random() * 3); rings.push({ r: 6, v: 760, life: 1.1, max: 1.1, col: '#fff', delay: 0 }); }, 380);
        els.forEach(e => { e.style.visibility = 'hidden'; }); tx.style.display = 'none';
        setTimeout(show, 280);
      };
      const show = () => {
        if (shown || closed) return; shown = true;
        const card = document.createElement('div'); card.className = 'cd';
        card.innerHTML = `<div class="rays"></div><div class="rn">${RAR[rar]}${rar >= 3 ? '!!' : rar === 2 ? '!' : ''}</div><div class="ic">${c.icon}</div><b>${esc(c.name)}</b><small>${esc(c.en)}</small><div style="margin-top:8px;font-size:12px">${esc(c.line)}</div><button class="btn" data-x>やったー</button>`;
        ov.appendChild(card);
        card.querySelector('[data-x]').onclick = e => { e.stopPropagation(); closed = true; cancelAnimationFrame(raf); ov.remove(); res(); };
      };
      ov.onclick = () => { if (!burst) t0 -= Math.max(0, (tB - (performance.now() - t0) / 1000) * 1000); };   // タップで早送り
      const step = now => {
        if (closed) return; raf = requestAnimationFrame(step);
        const t = (now - t0) / 1000, dt = Math.min(0.05, (now - lastSp) / 1000 || 0.016); lastSp = now;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        // 画面のゆれ
        shake = Math.max(0, shake - dt * (rar >= 3 ? 14 : 22)); const sx = (Math.random() - 0.5) * shake * 2, sy = (Math.random() - 0.5) * shake * 2; g.translate(sx, sy); ov.style.setProperty('--sx', sx + 'px'); ov.style.setProperty('--sy', sy + 'px');
        // ためている間の背景の光
        const charge = clamp((t - tG) / tC), pull = clamp(t / tG);
        if (!burst) { const rg = g.createRadialGradient(cx, cy, 0, cx, cy, 40 + 260 * (pull * 0.4 + charge)); rg.addColorStop(0, G + 'cc'); rg.addColorStop(1, G + '00'); g.fillStyle = rg; g.fillRect(-20, -20, W + 40, H + 40); }
        // 素材:渦をまいて寄る → 重なる → ふるえる
        els.forEach((e, i) => {
          if (burst) return;
          const ph = off + i * 6.28 / n, k = ease(pull), rad = R0 * (1 - k), ang = ph + k * (9 + rar * 2) + Math.sin(t * 3 + i) * 0.1;
          let x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.8;
          if (t > tG) { const j = 2 + charge * (5 + rar * 3); x += (Math.random() - 0.5) * j; y += (Math.random() - 0.5) * j; }
          const sc = (1 - 0.25 * k) * (1 + (t > tG ? charge * 0.35 : 0)), rot = (1 - k) * (i % 2 ? 1 : -1) * 0.8;
          e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${rot}rad) scale(${sc})`; e.style.filter = `drop-shadow(0 0 ${6 + charge * 20}px ${G})`;
          const tr = trail[i]; tr.push([x, y]); if (tr.length > 14) tr.shift();
          g.lineCap = 'round'; for (let q = 1; q < tr.length; q++) { g.strokeStyle = G; g.globalAlpha = q / tr.length * 0.55; g.lineWidth = 2 + q * 0.5 + rar; g.beginPath(); g.moveTo(tr[q - 1][0], tr[q - 1][1]); g.lineTo(tr[q][0], tr[q][1]); g.stroke(); } g.globalAlpha = 1;
          if (Math.random() < 0.3 + rar * 0.1) spark(x, y, 40, G2, 0.5, 2);
        });
        // ため:稲妻が走る
        if (!burst && t > tG * 0.75) {
          const rate = [0.14, 0.09, 0.055, 0.035][rar] * (1.1 - charge * 0.6);
          if (t > nextBolt) {
            nextBolt = t + rate * (0.6 + Math.random() * 0.8);
            const a = Math.random() * 6.28, d = Math.min(W, H) * (0.4 + Math.random() * 0.25);
            bolt(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 20, 0.16 + Math.random() * 0.1, 2 + rar + charge * 2, G2);
            if (rar >= 3 && Math.random() < 0.35) bolt(cx + (Math.random() - 0.5) * W * 0.5, -10, cx, cy, 0.22, 7, '#fff7c0');   // 天からの雷(SSR)
            if (rar >= 1 && Math.random() < 0.5 && n > 1) { const i = Math.floor(Math.random() * n), j = (i + 1) % n, a1 = trail[i][trail[i].length - 1], b1 = trail[j][trail[j].length - 1]; if (a1 && b1) bolt(a1[0], a1[1], b1[0], b1[1], 0.14, 2 + rar, G2); }
          }
          if (t > tG && Math.random() < 0.7) spark(cx + (Math.random() - 0.5) * 200, cy + (Math.random() - 0.5) * 200, -80, G2, 0.5, 2);   // 中心へ吸い込まれる火花
          const ch2 = clamp((t - tG) / tC); if (ch2 > 0.02) { const orb = 12 + ch2 * (28 + rar * 18) + Math.sin(t * 40) * 3; const og = g.createRadialGradient(cx, cy, 0, cx, cy, orb); og.addColorStop(0, '#fff'); og.addColorStop(0.5, G2); og.addColorStop(1, G + '00'); g.fillStyle = og; g.beginPath(); g.arc(cx, cy, orb * 1.6, 0, 7); g.fill(); }
          tx.textContent = t < tG ? 'まざる…!' : ['', 'ビリビリ…!', 'バリバリ…!!', 'ゴゴゴゴ…!!!'][rar] || 'ビリビリ…!';
        }
        if (!burst && t >= tB) doBurst();
        // 描画:稲妻・衝撃波・火花(加算合成)
        g.globalCompositeOperation = 'lighter';
        for (let i = bolts.length - 1; i >= 0; i--) { const b = bolts[i]; b.life -= dt; if (b.life <= 0) { bolts.splice(i, 1); continue; } const a = clamp(b.life / b.max * 1.6);
          g.lineJoin = 'round'; g.lineCap = 'round'; g.shadowColor = b.col; g.shadowBlur = 14 + b.w * 3; g.strokeStyle = b.col; g.globalAlpha = a * 0.9; g.lineWidth = b.w * 1.8; g.beginPath(); b.pts.forEach((p, q) => q ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
          g.shadowBlur = 0; g.strokeStyle = '#fff'; g.globalAlpha = a; g.lineWidth = Math.max(1, b.w * 0.6); g.stroke(); }
        g.globalAlpha = 1; g.shadowBlur = 0;
        for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; if (r.delay > 0) { r.delay -= dt; continue; } r.life -= dt; if (r.life <= 0) { rings.splice(i, 1); continue; } r.r += r.v * dt; const a = clamp(r.life / r.max); g.strokeStyle = r.col; g.globalAlpha = a; g.lineWidth = 3 + 14 * a; g.beginPath(); g.arc(cx, cy, r.r, 0, 6.3); g.stroke(); }
        g.globalAlpha = 1;
        for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt * (p.vx < 0 && !burst ? 0 : 1); p.vx *= 0.985; g.globalAlpha = clamp(p.life / p.max); g.fillStyle = p.col; g.beginPath(); g.arc(p.x, p.y, p.size * (0.5 + p.life / p.max * 0.5), 0, 6.3); g.fill(); }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        if (flash > 0) { g.fillStyle = `rgba(255,255,255,${clamp(flash)})`; g.fillRect(-30, -30, W + 60, H + 60); flash = Math.max(0, flash - dt * 2.6); }
      };
      raf = requestAnimationFrame(step);
    });
  }

  // ---- 画面:水槽 ----
  function tankScreen({ onBack }) {
    const sc = document.createElement('div'); sc.className = 'ens'; root.appendChild(sc);
    let raf = 0, swim = [];
    let editMode = false, selUid = null, PL = [], DM = {};   // 飾りを置く画面:えらんだ飾り・置いてある飾り・飾りの一覧
    const tankZoom = { z: 1, x: 0, y: 0 };
    const fx = { pel: [], coin: [], bub: [] };   // えさのつぶ・コイン・もぐもぐの泡
    const today = dayKey();
    function dupPanel(ks, kinds) {   // 同じ飾りをふやす(金券・かけら・ダイヤ)
      const nx = vch.nextExpire(), exp = nx ? ` ・いちばん近い期限 ${new Date(nx).getMonth() + 1}/${new Date(nx).getDate()}` : '';
      const pr = (k) => { const r = +k.split(':')[1], b = [];
        if (VCH.PRICE_V[r] != null) b.push(`<button class="sbtn" data-dup="${k}" data-pay="v" ${vch.total() < VCH.PRICE_V[r] ? 'disabled' : ''}>🎫${VCH.PRICE_V[r]}</button>`);
        if (VCH.PRICE_F[r] != null) b.push(`<button class="sbtn" data-dup="${k}" data-pay="f" ${vch.frag() < VCH.PRICE_F[r] ? 'disabled' : ''}>🧩${VCH.PRICE_F[r]}</button>`);
        b.push(`<button class="sbtn" data-dup="${k}" data-pay="d" ${vch.dia() < VCH.PRICE_D[r] ? 'disabled' : ''}>💎${VCH.PRICE_D[r]}</button>`); return b.join(' '); };
      return `<details style="margin:0 0 10px"><summary class="nt" style="cursor:pointer">➕ 同じ飾りをふやす (🎫金券 ${vch.total()} ・🧩かけら ${vch.frag()} ・💎 ${vch.dia()})</summary>
        <p class="nt" style="margin:6px 0">🎫金券=コインを換金してためる(今日はあと ${vch.todayLeft()} まで・3か月でなくなる${exp}) / 🧩かけら=単語を完璧にするともらえる / 💎ダイヤ=期限なし。値段(仮)はレア度が高いほど高いよ。</p>
        <button class="sbtn" data-a="vx" ${vch.todayLeft() > 0 && ctx.wallet.get() > 0 ? '' : 'disabled'}>🪙→🎫 コイン${Math.min(vch.todayLeft(), ctx.wallet.get())}まいを金券に</button>
        ${ks.map(k => { const it = decorOf(kinds[k][0]); return `<div style="display:flex;align-items:center;gap:6px;margin-top:6px"><span style="flex:1">${it.icon} ${esc(it.name)} <small>${RAR[kinds[k][0].rar]} もっている${kinds[k].length}</small></span>${pr(k)}</div>`; }).join('')}</details>`;
    }
    function decoPalette() {   // 持っている飾りの種類ごと:置く・しまう
      const kinds = {}; spec.decor().forEach(d => { const k = d.lv + ':' + d.rar; (kinds[k] = kinds[k] || []).push(d); });
      const ks = Object.keys(kinds).sort((a, b) => { const [l1, r1] = a.split(':'), [l2, r2] = b.split(':'); return (+r2 - +r1) || (+l2 - +l1); });
      const placedUid = new Set(spec.placed().map(q => q.uid));
      return `<p class="nt" style="margin:0 0 6px">🎨 飾りをタップ → 水槽に出るよ。水槽の中でドラッグして、好きな所へ。しまうときは、えらんで「しまう」。いくつでも置けるよ。</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${ks.map(k => { const ds = kinds[k], d0 = ds[0], it = decorOf(d0), n = ds.filter(d => placedUid.has(d.uid)).length; return `<button class="sbtn" data-dadd="${k}" ${n >= ds.length ? 'disabled' : ''}>${it.icon} ${esc(it.name)} <small>${RAR[d0.rar]} 置いた${n}/${ds.length}</small></button>`; }).join('') || '<span class="nt">まだ飾りがないよ。「🎰 混ぜる」で作ろう。</span>'}</div>
        ${dupPanel(ks, kinds)}
        <div style="display:flex;gap:8px;margin-bottom:10px"><button class="sbtn" data-a="dtake" ${selUid ? '' : 'disabled'}>↩ しまう</button><button class="sbtn" data-a="dtakeall" ${placedUid.size ? '' : 'disabled'}>ぜんぶしまう</button></div>`;
    }
    const draw = () => {
      const t = spec.tank(), food = spec.food(); t.forEach(f => { if (f.g >= GROW_NEED) spec.markGrown(f.id, f.rk || 0); });
      const pts = spec.pts(), rk = spec.rank(), nx = TANK_RANKS[rk + 1];
      PL = spec.placed(); DM = Object.fromEntries(spec.decor().map(d => [d.uid, d]));
      sc.innerHTML = `<div class="top"><button class="sbtn" data-a="back">← もどる</button><span style="flex:1"></span><button class="sbtn ${editMode ? 'pri' : ''}" data-a="decor">🎨 ${editMode ? '飾りをおわる' : '飾る'}</button><button class="sbtn" data-a="mix">🎰 混ぜる</button><span class="sbtn" style="pointer-events:none">🍤 えさ ${food}</span></div>
        <h2>🐠 水槽 <small style="font-size:13px;color:#8d7f9e">${t.length} / ${TANK_MAX}</small></h2>
        <p class="nt">英語の問題に答えて、えさを作ろう(1問正解=1つ)。問題は、あなたが今までにまちがえた言葉や、釣り堀の単語から出るよ。1匹に1日${FEED_PER_DAY}回まで。1日の2回目で満腹になって、その種類ではじめてなら🪙コインがもらえるよ。図鑑の枠に出し入れして、いろんな魚を育てよう。${GROW_NEED}回で育ちきって、アルバムに記録される。</p>
        <p class="nt" style="margin-top:-6px">🏆 水槽ランク: <b>${esc(TANK_RANKS[rk][1])}</b> ・ 飾りポイント ${pts}${nx ? `(あと${nx[0] - pts}で「${esc(nx[1])}」)` : '(最高!)'} ・ 飾り ${spec.decor().length}こ</p>
        <div class="tankv"><div class="tz"><canvas></canvas></div><span class="zh">ピンチで拡大</span></div>
        ${editMode ? decoPalette() : ''}
        <div style="display:flex;gap:8px;margin-bottom:10px"><button class="sbtn pri" data-a="make" style="flex:1">🍤 えさを作る(英語${FOOD_Q}問)</button><button class="sbtn" data-a="all" ${food && t.some(f => (f.day !== today ? 0 : f.n) < FEED_PER_DAY && f.g < GROW_NEED) ? '' : 'disabled'}>みんなにあげる</button></div>
        ${t.length ? t.map(f => { const sp = FISHBY[f.id], n = f.day === today ? f.n : 0, full = f.g >= GROW_NEED, sz = Math.round(f.size * (1 + 0.5 * Math.min(1, f.g / GROW_NEED)) * RANK_MUL[f.rk || 0]); return `<div class="row"><div class="fx"><b>${esc(RANK_PRE[f.rk || 0] + (sp ? sp.name : f.id))}</b> <small style="color:#8d7f9e">${sz}cm ・ ${full ? '育ちきった!' : f.g >= GROW_NEED * 0.6 ? 'りっぱになってきた' : f.g >= GROW_NEED * 0.3 ? '育ちざかり' : 'ちびっこ'}</small><div class="gb"><i style="width:${Math.min(1, f.g / GROW_NEED) * 100}%"></i></div><small style="color:#8d7f9e">きょう ${n}/${FEED_PER_DAY} ・ そだち ${Math.min(f.g, GROW_NEED)}/${GROW_NEED}</small></div>
          ${full ? `<span class="sbtn" style="pointer-events:none;background:#fff3c8">🎉 育ちきった</span>` : `<button class="sbtn" data-feed="${f.uid}" ${food && n < FEED_PER_DAY ? '' : 'disabled'}>🍤 あげる</button>`}<button class="sbtn" data-tobox="${f.uid}">📖図鑑へ</button><button class="sbtn" data-rel="${f.uid}" title="池にかえす">↩</button></div>`; }).join('')
        : `<div class="row"><div class="fx">まだ魚がいないよ。<b>英語の釣り堀</b>で釣った魚を「水槽に入れる」と、ここで育てられる。</div></div>`}`;
      startSwim();
    };
    function startSwim() {
      cancelAnimationFrame(raf);
      const cv = sc.querySelector('.tankv canvas'); if (!cv) return;
      const t = spec.tank(), W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      for (let n = cv; n && n !== sc; n = n.parentElement) n.style.touchAction = editMode ? 'none' : (n.classList.contains('tankv') ? 'pan-y' : '');   // 親のどこかが pan-y だと効かないので、全部しらべて none にする   // スマホで、ドラッグが画面スクロールに取られないように
      if (editMode) {   // 飾りをえらぶ・ドラッグでうごかす(水槽をピンチで拡大している時も、そのまま)
        let drag = null;
        const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
        cv.onpointerdown = e => {
          const [nx, ny] = at(e), x = nx * W, y = ny * H; let hit = null;
          PL.slice().sort((a, b) => b.y - a.y).forEach(q => { if (!hit && Math.abs(x - q.x * W) < 26 && y > q.y * H - 40 && y < q.y * H + 10) hit = q; });
          if (!hit) { if (selUid) { selUid = null; draw(); } return; }
          e.stopPropagation(); selUid = hit.uid; drag = { q: hit, dx: hit.x - nx, dy: hit.y - ny, id: e.pointerId, moved: false };
          try { cv.setPointerCapture(e.pointerId); } catch (x2) { }
          const tb = sc.querySelector('[data-a="dtake"]'); if (tb) tb.disabled = false;
        };
        cv.onpointermove = e => { if (!drag || drag.id !== e.pointerId) return; const [nx, ny] = at(e); drag.q.x = Math.max(0.04, Math.min(0.96, nx + drag.dx)); drag.q.y = Math.max(0.18, Math.min(0.98, ny + drag.dy)); drag.moved = true; };
        const up = e => { if (!drag || drag.id !== e.pointerId) return; spec.placeMove(drag.q.uid, drag.q.x, drag.q.y); drag = null; };
        cv.onpointerup = cv.onpointercancel = up;
      }
      cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const oldSwim = swim;
      swim = t.map((f, i) => { const sp = FISHBY[f.id], k = 0.55 + 0.45 * Math.min(1, f.g / GROW_NEED), w = Math.round(Math.min(150, (40 + Math.sqrt(f.size) * 9) * (1 + 0.25 * (f.rk || 0))) * k * (f.id === 'ryugu' ? 1 : 0.5)); return { uid: f.uid, img: sp ? artCanvas(sp, w * 3, Math.round(w * 1.8), { rk: f.rk || 0 }) : null, w, h: Math.round(w * 0.6), x: Math.random() * (W - w), y: 20 + (i % 3) * (H * 0.18) + Math.random() * 20, vx: (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 18), ph: Math.random() * 6 }; });
      swim.forEach(s => { const o = oldSwim.find(q => q.uid === s.uid); if (o) { s.x = Math.max(4, Math.min(W - s.w - 4, o.x)); s.y = o.y; s.vx = o.vx > 0 ? Math.abs(s.vx) : -Math.abs(s.vx); s.ph = o.ph; s.munch = o.munch || 0; } });   // 描きなおしても魚の位置はそのまま
      // ピンチ・ホイールで拡大(1〜3倍)。拡大中は指1本でずらす。ダブルタップでもどす
      { const box = cv.parentElement.parentElement, tz = cv.parentElement, hint = box.querySelector('.zh'), Zs = tankZoom;
        const clampZ = () => { Zs.z = Math.max(1, Math.min(3, Zs.z)); Zs.x = Math.max(W * (1 - Zs.z), Math.min(0, Zs.x)); Zs.y = Math.max(H * (1 - Zs.z), Math.min(0, Zs.y)); };
        const apply = () => { clampZ(); tz.style.transform = `translate(${Zs.x}px,${Zs.y}px) scale(${Zs.z})`; box.style.touchAction = (editMode || Zs.z > 1.01) ? 'none' : 'pan-y'; if (hint) hint.style.display = Zs.z > 1.01 ? 'none' : ''; };
        const P = new Map(); let g0 = null, lastTap = 0;
        const rel = e => { const r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        const pinchStart = () => { const [a, b] = [...P.values()]; g0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z: Zs.z, cx: ((a[0] + b[0]) / 2 - Zs.x) / Zs.z, cy: ((a[1] + b[1]) / 2 - Zs.y) / Zs.z }; };
        box.onpointerdown = e => { P.set(e.pointerId, rel(e)); try { box.setPointerCapture(e.pointerId); } catch (x) { } if (P.size === 2) pinchStart(); else { const n = Date.now(); if (n - lastTap < 320) { Zs.z = 1; Zs.x = Zs.y = 0; apply(); } lastTap = n; } };
        box.onpointermove = e => {
          if (!P.has(e.pointerId)) return; const old = P.get(e.pointerId), cur = rel(e); P.set(e.pointerId, cur);
          if (P.size === 2 && g0) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; Zs.z = g0.z * d / g0.d; Zs.x = mx - g0.cx * Zs.z; Zs.y = my - g0.cy * Zs.z; apply(); }
          else if (P.size === 1 && Zs.z > 1.01) { Zs.x += cur[0] - old[0]; Zs.y += cur[1] - old[1]; apply(); }
        };
        const up = e => { P.delete(e.pointerId); g0 = null; if (P.size === 1) { /* 2本→1本に戻っても飛ばない */ } };
        box.onpointerup = box.onpointercancel = up;
        box.onwheel = e => { e.preventDefault(); const [mx, my] = rel(e), z0 = Zs.z, cx = (mx - Zs.x) / z0, cy = (my - Zs.y) / z0; Zs.z = z0 * (e.deltaY < 0 ? 1.15 : 1 / 1.15); Zs.x = mx - cx * Zs.z; Zs.y = my - cy * Zs.z; apply(); };
        apply(); }
      const bub = Array.from({ length: 10 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 3 }));
      let last = performance.now();
      const step = ts => {
        if (!sc.isConnected) return; raf = requestAnimationFrame(step); const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
        g.clearRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,.55)'; bub.forEach(b => { b.y -= (12 + b.s * 6) * dt; if (b.y < -5) { b.y = H * 0.7; b.x = Math.random() * W; } g.beginPath(); g.arc(b.x, b.y, b.s, 0, 6.3); g.fill(); });
        { g.textAlign = 'center'; g.font = '34px serif'; PL.slice().sort((a, b2) => a.y - b2.y).forEach((q, i) => { const d = DM[q.uid]; if (!d) return; const k = decorOf(d), x = q.x * W, y = q.y * H; g.save(); if (d.rar >= 2) { g.shadowColor = d.rar === 3 ? '#ffd24a' : '#c07bff'; g.shadowBlur = 10 + 6 * Math.sin(ts / 300 + i); } g.fillText(k.icon, x, y); g.restore(); if (editMode && q.uid === selUid) { g.save(); g.strokeStyle = '#f58aa8'; g.lineWidth = 2.5; g.setLineDash([5, 4]); g.strokeRect(x - 24, y - 38, 48, 46); g.restore(); } }); g.textAlign = 'start'; }
        g.fillStyle = '#3f9a5a'; for (let i = 0; i < 5; i++) { const x = 20 + i * (W - 40) / 4; g.beginPath(); g.moveTo(x, H * 0.7); g.quadraticCurveTo(x + Math.sin(ts / 700 + i) * 10, H * 0.45, x + 4, H * 0.3); g.lineTo(x + 7, H * 0.7); g.fill(); }
        swim.forEach(s => {
          // えさがあれば、いちばん近いつぶへ寄っていく。口(向いている側)で食べる
          const mine = fx.pel.filter(p => p.uid === s.uid && p.y > -4); let eating = false;
          if (mine.length) {
            const dir = s.vx < 0 ? -1 : 1, mx = s.x + (dir > 0 ? s.w * 0.9 : s.w * 0.1), my = s.y + s.h * 0.5;
            const p = mine.reduce((a, b) => Math.hypot(a.x - mx, a.y - my) < Math.hypot(b.x - mx, b.y - my) ? a : b);
            const tw = Math.sign(p.x - mx) || dir; s.vx = tw * Math.max(Math.abs(s.vx), 40); s.y += Math.max(-60, Math.min(60, p.y - my)) * dt * 1.6; s.y = Math.max(10, Math.min(H - s.h - 10, s.y)); eating = true;
          }
          if (!eating && Math.abs(s.vx) > 34) s.vx *= 0.97;
          s.x += s.vx * dt * (eating ? 1.4 : 1); s.ph += dt * 2; if (s.x < 4 || s.x > W - s.w - 4) { s.vx *= -1; s.x = Math.max(4, Math.min(W - s.w - 4, s.x)); }
          if (s.munch > 0) s.munch -= dt;
          const y = s.y + Math.sin(s.ph) * (eating ? 2 : 6); if (!s.img) return;
          const mk = s.munch > 0 ? Math.sin(s.munch * 30) : 0;   // もぐもぐ:口まわりがぱくぱく(ぷるぷる伸び縮み)
          const sx = 1 + 0.09 * mk, sy = 1 - 0.14 * mk;
          g.save(); if (s.vx < 0) { g.translate(s.x + s.w, y + s.h / 2); g.scale(-sx, sy); g.drawImage(s.img, 0, -s.h / 2, s.w, s.h); } else { g.translate(s.x, y + s.h / 2); g.scale(sx, sy); g.drawImage(s.img, 0, -s.h / 2, s.w, s.h); } g.restore();   // 絵は右向き。右へ泳ぐ時はそのまま、左へ泳ぐ時だけ反転
          s.mouth = [s.vx < 0 ? s.x + s.w * 0.08 : s.x + s.w * 0.92, y + s.h * 0.5];
        });
        // えさのつぶ:上からパラパラ落ちて、魚の口もとに入ると食べられる
        fx.pel.forEach(p => {
          p.t += dt; p.y += p.vy * dt; p.x += Math.sin(p.t * 5 + p.ph) * 10 * dt;
          const s = swim.find(q => q.uid === p.uid);
          if (s && p.y > 0 && Math.abs(p.x - (s.mouth ? s.mouth[0] : s.x + s.w / 2)) < s.w * 0.28 && Math.abs(p.y - (s.mouth ? s.mouth[1] : s.y + s.h / 2)) < s.h * 0.4) { p.dead = true; s.munch = 0.7; for (let i = 0; i < 2; i++) fx.bub.push({ x: s.mouth[0], y: s.mouth[1], vx: (Math.random() - 0.5) * 20, vy: -24 - Math.random() * 20, r: 1.5 + Math.random() * 2, life: 0.8 }); }
          else if (p.y > H + 6 || p.t > 6) p.dead = true;
          if (!p.dead) { g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.35, 0, 6.3); g.fill(); }
        });
        fx.pel = fx.pel.filter(p => !p.dead);
        fx.bub.forEach(b => { b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; g.strokeStyle = `rgba(255,255,255,${Math.max(0, b.life)})`; g.lineWidth = 1.2; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 6.3); g.stroke(); });
        fx.bub = fx.bub.filter(b => b.life > 0);
        // コイン:魚からぽんと出て、ふわっと上がって消える
        fx.coin.forEach(c => {
          c.delay -= dt; if (c.delay > 0) return; c.t += dt; const s = swim.find(q => q.uid === c.uid), bx = s ? s.x + s.w / 2 : c.x, by = (s ? s.y : c.y) - 4;
          const k = c.t / 1.1, yy = by - 14 - 46 * (1 - (1 - k) * (1 - k)), a = k < 0.75 ? 1 : Math.max(0, (1 - k) / 0.25);
          if (!c.sound) { c.sound = 1; sfx.play('coin'); }
          g.save(); g.globalAlpha = a; g.translate(bx, yy); const sc2 = Math.abs(Math.cos(c.t * 9));
          if (c.n) { g.fillStyle = '#ffd24a'; g.strokeStyle = '#c98a10'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 9 * Math.max(0.25, sc2), 9, 0, 0, 6.3); g.fill(); g.stroke();
          g.fillStyle = '#fff3b0'; g.beginPath(); g.ellipse(-1.5, -2, 3 * Math.max(0.25, sc2), 4, 0, 0, 6.3); g.fill(); }
          g.font = '900 12px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#a06a00'; g.lineWidth = 3; const lb = c.n ? '満腹! +' + c.n : '満腹!'; g.strokeText(lb, c.n ? 34 : 0, c.n ? 4 : 2); g.fillText(lb, c.n ? 34 : 0, c.n ? 4 : 2); g.restore();
        });
        fx.coin = fx.coin.filter(c => c.t < 1.1);
      };
      raf = requestAnimationFrame(step);
    }
    const feedFx = (uids, fulls = {}) => {
      const W = sc.querySelector('.tankv canvas')?.clientWidth || 320;
      uids.forEach((uid, k) => {
        const s = swim.find(q => q.uid === uid), cx = s ? s.x + s.w * (s.vx < 0 ? 0.2 : 0.8) : W / 2;
        for (let i = 0; i < 12; i++) fx.pel.push({ uid, x: Math.max(6, Math.min(W - 6, cx + (Math.random() - 0.5) * 70)), y: -6 - Math.random() * 40, vy: 55 + Math.random() * 35, r: 2 + Math.random() * 1.6, c: ['#e0883a', '#c9692a', '#f2b45a', '#a8521f'][i % 4], t: 0, ph: Math.random() * 6 });
        if (fulls[uid]) fx.coin.push({ uid, n: fulls[uid] === 'coin' ? FULL_COIN : 0, t: 0, delay: 1.0 + k * 0.12, x: cx, y: 60 });
      });
      const cn = Object.values(fulls).filter(v => v === 'coin').length * FULL_COIN; if (cn) { try { ctx.wallet.add(cn, 'full'); } catch (e) { } }
    };
    const feed = uid => {
      const t = spec.tank(), f = t.find(x => x.uid === uid), food = spec.food(); if (!f || !food) return false;
      if (f.day !== today) { f.day = today; f.n = 0; }
      if (f.n >= FEED_PER_DAY || f.g >= GROW_NEED) return false;
      f.n++; f.g++; spec.setFood(food - 1);
      let r = true;
      if (f.n >= FEED_PER_DAY) { r = 'full'; const fl = spec.full(); if (!fl[f.id]) { fl[f.id] = 1; spec.saveFull(fl); r = 'coin'; } }   // 1日の2回目で満腹。その種類ではじめてならコイン
      spec.saveTank(t); return r;
    };
    draw();
    sc.onclick = async e => {
      const a = e.target.closest('[data-a]')?.dataset.a, fd = e.target.closest('[data-feed]'), sp = e.target.closest('[data-spec]'), rl = e.target.closest('[data-rel]'), tb = e.target.closest('[data-tobox]');
      if (a === 'back') { sfx.play('tap'); cancelAnimationFrame(raf); sc.remove(); onBack(); }
      else if (a === 'mix') { sfx.play('tap'); cancelAnimationFrame(raf); sc.remove(); mixScreen({ onBack: () => tankScreen({ onBack }) }); }
      else if (a === 'decor') { sfx.play('tap'); editMode = !editMode; selUid = null; draw(); }
      else if (e.target.closest('[data-dadd]')) {   // その種類の、まだ置いていない1こを置く
        sfx.play('tap'); const k = e.target.closest('[data-dadd]').dataset.dadd, placed = new Set(spec.placed().map(q => q.uid)), d = spec.decor().find(x => x.lv + ':' + x.rar === k && !placed.has(x.uid));
        if (d) { spec.placeAdd(d.uid, 0.3 + Math.random() * 0.4, 0.74 + Math.random() * 0.2); selUid = d.uid; draw(); }
      }
      else if (a === 'dtake') { if (selUid) { sfx.play('tap'); spec.placeRemove(selUid); selUid = null; draw(); } }
      else if (a === 'vx') { const n = vch.exchange(ctx.wallet, Math.min(vch.todayLeft(), ctx.wallet.get())); if (n) { sfx.play('coin'); toast(`🎫 金券 ${n} まい ためたよ(3か月まで)`); } draw(); }
      else if (e.target.closest('[data-dup]')) {
        const b = e.target.closest('[data-dup]'), k = b.dataset.dup, pay = b.dataset.pay, [lv, rar] = k.split(':').map(Number), src = spec.decor().find(x => x.lv === lv && x.rar === rar);
        if (!src) return; const ok = pay === 'v' ? vch.spend(VCH.PRICE_V[rar]) : pay === 'f' ? vch.spendFrag(VCH.PRICE_F[rar]) : vch.spendDia(VCH.PRICE_D[rar]);
        if (!ok) { toast('たりないよ'); sfx.play('early'); return; }
        spec.addDecor({ uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), lv, rar, at: Date.now() }); sfx.play('coin'); toast('✨ 同じ飾りが ふえた!'); draw();
      }
      else if (a === 'dtakeall') { sfx.play('tap'); spec.placed().forEach(q => spec.placeRemove(q.uid)); selUid = null; draw(); }
      else if (a === 'make') {
        sfx.play('tap'); let got = 0;
        for (const q of reviewQs(FOOD_Q)) { const ok = await ask(q, { label: `🍤 えさを作る(${got}こ)`, time: T_Q }); learn.hit(q.w[0], ok, { ja: q.w[2], src: 'fishing' }); if (ok) got++; }
        spec.setFood(spec.food() + got); toast(`🍤 えさが ${got} こ できた!`); draw();
      }
      else if (a === 'all') { let n = 0; const fed = [], fulls = {}; for (const f of spec.tank()) { let r; while ((r = feed(f.uid))) { n++; fed.push(f.uid); if (r !== true) fulls[f.uid] = r; } } if (n) { sfx.play('nibble'); feedFx(fed, fulls); const cn = Object.values(fulls).filter(v => v === 'coin').length * FULL_COIN; toast(`🍤 ${n}回 あげた${cn ? ' ・ 🪙 +' + cn : ''}`); } draw(); }
      else if (fd) { const r = feed(fd.dataset.feed); if (r) { sfx.play('nibble'); feedFx([fd.dataset.feed], r === true ? {} : { [fd.dataset.feed]: r }); if (r === 'coin') toast(`😋 満腹! 🪙 +${FULL_COIN}`); } draw(); }
      else if (tb) { const t = spec.tank(), i = t.findIndex(x => x.uid === tb.dataset.tobox); if (i < 0) return; if (!boxRoom()) { toast('図鑑の枠がいっぱい(図鑑で枠をふやせるよ)'); return; } const b = spec.box(); b.push(t.splice(i, 1)[0]); spec.saveBox(b); spec.saveTank(t); sfx.play('tap'); toast('📖 図鑑の枠にもどした'); draw(); }
      else if (rl) { if (!rl.dataset.c) { rl.dataset.c = 1; rl.textContent = '池へ?'; return; } spec.saveTank(spec.tank().filter(x => x.uid !== rl.dataset.rel)); draw(); }
    };
  }
  // えさを作る問題:まちがえたことのある言葉(ストリームなども)→ 釣り堀の完璧な単語(忘れないように)→ 初級
  const recentFood = [];   // 直前に出した単語(同じ問題ばかりにならないように)
  function reviewQs(n) {   // えさ用:いまのレベル(最後にあそんだ釣り堀)を中心に、1つ下・1つ上も少し。そのレベルの単語からランダムに幅広く
    const out = [], used = new Set(), weak = shuffle(learn.weak(40));
    const own = (spec.played().map(id => SET[id]).filter(Boolean)[0] || { lv: 1 }).lv;
    for (let k = 0; out.length < n && k < 200; k++) {
      let q = null;
      if (Math.random() < 0.1) { while (weak.length && !q) { const w = weak.pop(); if (!used.has(w.en)) { used.add(w.en); q = freeQ(w.en, w.ja); } } }
      if (!q) {
        const r = Math.random(); let lv = r < 0.7 ? own : r < 0.85 ? own - 1 : own + 1; if (lv < 1 || lv > 3) lv = own;
        const w = pick(SW[lv]); if (used.has(w[0]) || recentFood.includes(w[0])) continue; used.add(w[0]); q = wordQ(lv, w, Math.random() < 0.5 ? 'ej' : 'je');
      }
      out.push(q);
    }
    out.forEach(q => { recentFood.push(q.w[0]); }); while (recentFood.length > 40) recentFood.shift();
    return out;
  }

  // ---- 抜き打ちテスト ----
  function needTest() {
    const own = spec.own(), ok = Object.keys(own).filter(id => !own[id].crack && !own[id].used && SET[id]);
    if (ok.length < TEST_MIN_OWN) return false;
    const T = spec.test(), first = T.last || Math.max(...ok.map(id => own[id].at));
    return Date.now() - first >= TEST_EVERY * 864e5;
  }
  function testIntro(onBack, after) {
    const sh = sheet(`<div class="ph"><h2>📝 抜き打ちテスト!</h2></div><div class="sc" style="font-size:14px;line-height:1.7">
      <div class="say">砂吹さん「Pop quiz! 前に完璧にした単語、まだ覚えてるかな?」</div>
      <p>もらった標本のセットから、いくつかまとめて出すよ。1セットで${TEST_PER}問中${TEST_BAD}問以上まちがえると、その標本に<b>ひび</b>が入る。まちがえた単語は完璧が消えるので、釣り堀でもう一度完璧にすれば直る。</p>
      <p style="font-size:12px;color:#8d7f9e">自分の単語集の言葉も少し出るよ(標本には関係なし)。テストが終わるまで、英語の釣り堀は始められない。</p></div>
      <div style="padding:8px 16px 16px;display:flex;gap:8px;justify-content:center"><button class="btn sub" data-n>あとで</button><button class="btn" data-g>はじめる</button></div>`, true);
    sh.querySelector('[data-n]').onclick = () => { sh.remove(); onBack(); };
    sh.querySelector('[data-g]').onclick = async () => { sh.remove(); await runTest(); after(); };
  }
  async function runTest() {
    const own = spec.own(), ids = shuffle(Object.keys(own).filter(id => !own[id].crack && !own[id].used && SET[id])).slice(0, TEST_SETS), qs = [];
    ids.forEach(id => { const s = SET[id]; shuffle(s.words.map((_, i) => i)).slice(0, TEST_PER).forEach(i => qs.push({ id, i, q: wordQ(s.lv, s.words[i], Math.random() < 0.5 ? 'ej' : 'je') })); });
    myListWords(3).forEach(w => qs.push({ q: freeQ(w[0], w[1]) }));
    shuffle(qs);
    const bad = {};
    let k = 0;
    for (const x of qs) {
      k++; const ok = await ask(x.q, { label: `📝 抜き打ちテスト ${k} / ${qs.length}`, time: T_Q });
      if (x.id) { learn.hit(x.q.w[0], ok, { ja: x.q.w[2] }); if (!ok) { bad[x.id] = (bad[x.id] || 0) + 1; spec.setPerf(x.id, x.i, 0); } }
      else learn.hit(x.q.w[0], ok, { ja: x.q.w[2] });
    }
    const lines = ids.map(id => { const s = SET[id], b = bad[id] || 0, crack = b >= TEST_BAD; if (crack) spec.setCrack(id, 1); return `<div class="row" style="background:${crack ? '#ffe8e8' : '#effaf2'};border-radius:12px;padding:8px 10px;margin-bottom:6px">${crack ? '💥' : '✨'} <b>${esc(s.look.name)}</b>(${esc(s.title)})<br><small>${TEST_PER - b} / ${TEST_PER} 正解 ・ ${crack ? 'ひびが入った…' : b ? '無事。まちがえた単語は完璧が消えた' : 'ばっちり!'}</small></div>`; });
    spec.setTest({ last: Date.now() });
    await new Promise(res => {
      const sh = sheet(`<div class="ph"><h2>📝 テストの結果</h2></div><div class="sc">${lines.join('')}</div><div style="padding:8px 16px 16px;text-align:center"><button class="btn" data-x>OK</button></div>`, true);
      sh.querySelector('[data-x]').onclick = () => { sh.remove(); res(); };
    });
  }
  function myListWords(n) {   // ストリームで作った自分の単語集(同じ端末)。標本には関係しない
    try { const L = JSON.parse(localStorage.getItem('cs-wordlists') || '[]'), all = []; L.forEach(l => (l.lines || []).forEach(x => { const c = String(x).split('\t'); if (c[0] && c[1]) all.push([c[0], c[1]]); })); return shuffle(all).slice(0, n); } catch (e) { return []; }
  }

  return { ask, playGates, pondScreen, tankScreen, collection, mixScreen, keepFish, tankRoom, keepRoom, get busy() { return busy; } };
}
