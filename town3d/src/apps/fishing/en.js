// 英語の釣り堀:英語に答えて釣る・水槽で育てる・標本を集める・抜き打ちテスト。
//   釣り堀 = 単語ストリームの単語練習と同じセット(問題はそのセットの単語だけ)
//   出るところ:投げる(熟語・正解でよく寄る) / アタリ(英→日・まちがえると逃げる) / あばれる(熟語・まちがえると外れる) / 取りこむ(日→英・まちがえると逃げる)
//   「完璧」= 続けて PERFECT_C 回正解(ストリームで正解した分も数える=予習になる)。ここでまちがえると完璧が消える
//   セットの単語がぜんぶ完璧 → そのセットの標本(1回だけ)。抜き打ちテストで悪いと、標本にひびが入る(もう一度ぜんぶ完璧で直る)
import { SW } from '../gamebox/stream_words.js';
import { IDIOMS } from './idioms.js';
import { SETS, SET, LV_NAME, LV_SUB, TANK_MAX, GROW_NEED, FEED_PER_DAY, FISH_SPEC, spec, condOf } from '../../game/specimen.js';
import { furn } from '../../game/furniture.js';
import { localLearn } from './learnrec.js';
import { sortReel } from './sortreel.js';

export const PERFECT_C = 2;          // 続けて何回正解で「完璧」
export const GAPS = { 1: 2, 2: 6, 3: 12 };   // 問題が出る間隔(秒):はやい/ふつう/ゆっくり(ポンド画面で選ぶ)
export const T_BITE = 7, T_Q = 10;   // 答える時間(秒)。アタリは短め
const TEST_EVERY = 3, TEST_MIN_OWN = 3, TEST_SETS = 3, TEST_PER = 4, TEST_BAD = 2;   // 抜き打ち:何日ごと・標本いくつから・何セット・1セット何問・何問まちがいでひび
const FOOD_Q = 5;                    // えさを作る問題の数(1問正解=えさ1つ)

const POS = { n: '名詞', v: '動詞', a: '形容詞', r: '副詞', pp: '前置詞', cj: '接続詞', pn: '代名詞', ij: '間投詞', ph: '熟語' };
const ICON = { shell: '🐚', conch: '🐚', stone: '🪨', glass: '💠', urchin: '🌰', star: '⭐', coral: '🪸', disc: '⚪', crystal: '🔮', ammonite: '🌀', trilobite: '🪲', tooth: '🦷', amber: '🟠', cube: '🟨', leaf: '🍂', gem: '💎', opal: '🫧', pearl: '🦪', meteor: '☄️' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dayKey = () => { const d = new Date(Date.now() - 4 * 36e5); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const hexCol = c => '#' + (c >>> 0).toString(16).padStart(6, '0');

const CSS = `
.fz .enq{position:absolute;inset:0;z-index:30;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,20,40,.35);padding:12px;box-sizing:border-box}
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
.fz .ens .cell b{display:block;font-size:13px}.fz .ens .cell .ic{font-size:26px;line-height:1.2;display:block}.fz .ens .cell small{display:block;font-size:10px;color:#8d7f9e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fz .ens .cell .pg{height:5px;border-radius:3px;background:#eee4f2;margin-top:5px;overflow:hidden}.fz .ens .cell .pg i{display:block;height:100%;background:#7fcf9f}
.fz .ens .cell.got{background:linear-gradient(160deg,#fffbe6,#fff)}.fz .ens .cell.crk{background:linear-gradient(160deg,#ffe8e8,#fff)}
.fz .ens .cell .dot{position:absolute;right:6px;top:6px;width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 2px #fff}
.fz .ens .row{background:#fff;border-radius:16px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px #0001;display:flex;gap:10px;align-items:center}
.fz .ens .row .fx{flex:1;min-width:0}.fz .ens .row .gb{height:7px;border-radius:4px;background:#eee4f2;overflow:hidden;margin:4px 0}.fz .ens .row .gb i{display:block;height:100%;background:linear-gradient(90deg,#7fd3ff,#7fcf9f)}
.fz .ens .tankv{position:relative;height:200px;border-radius:18px;overflow:hidden;background:linear-gradient(#bfe9ff,#5fb3e0 70%,#e8d9b0 70%,#e8d9b0);box-shadow:inset 0 0 0 6px #2b2b30,0 4px 14px #0002;margin-bottom:10px}
.fz .ens .tankv canvas{position:absolute;inset:0;width:100%;height:100%}
.fz .ens .sbtn{border:0;border-radius:999px;padding:9px 14px;font:inherit;font-weight:900;font-size:13px;background:#fff;color:#5a4a6b;box-shadow:0 2px 6px #0002}
.fz .ens .sbtn.pri{background:linear-gradient(160deg,#ffd36b,#ffb35c)}.fz .ens .sbtn:disabled{opacity:.45}
.fz .enprog{position:absolute;right:10px;top:46px;z-index:3;background:rgba(255,255,255,.9);border-radius:999px;padding:5px 12px;font-weight:900;font-size:12px;box-shadow:0 2px 8px #0002;pointer-events:none;white-space:nowrap}
`;

export function createEnglish({ root, ctx, sfx, sheet, artCanvas, FISHBY, toast }) {
  if (!document.getElementById('fz-en-css')) { const s = document.createElement('style'); s.id = 'fz-en-css'; s.textContent = CSS; document.head.appendChild(s); }
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
      let done = false;
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
      ov.onclick = e => { if (e.target.closest('[data-sp]')) { say(q.en); return; } const b = e.target.closest('[data-i]'); if (b) fin(+b.dataset.i); };
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
    const word = async (dir, label, time) => {
      const i = nextIdx(setId, recent); recent.push(i); if (recent.length > 4) recent.shift();
      const ok = await ask(wordQ(s.lv, s.words[i], dir), { label, time, host: ui.parentNode });
      const m = markSet(setId, i, ok); showProg();
      if (m.got) celebrate(setId, m.got);
      else if (m.perfNow) toast(`✨ 「${s.words[i][0]}」完璧! (${m.n}/${m.total})`);
      return { ok, m };
    };
    return {
      get busy() { return busy; },
      cast: () => idiom(s.lv, '🎯 投げた! 熟語に答えると魚がよく寄る', ui.parentNode),
      bite: () => word('ej', '🎣 合わせそこねた! 正解でもういちどチャンス(まちがえると逃げる)', T_BITE),
      gap: () => GAPS[+(ctx.storage.get('enGap') || 1)] || 2,
      thrash: () => idiom(s.lv, '🌊 最後のあがき! 熟語で落ち着かせろ', ui.parentNode),
      // 取りこむ直前:ふつうの魚は熟語、レアは難しい熟語。まちがえてももう1回、それもだめなら少し小さくなって釣れる
      net: async sp => { const rare = sp.r >= 4, lq = rare ? 3 : s.lv; let ok = await idiom(lq, rare ? '🎣 取りこむ直前! レアは むずかしい熟語' : '🎣 取りこむ直前! 熟語に答えよう', ui.parentNode); if (ok) return { ok: true }; ok = await idiom(lq, '🎣 もう1回チャンス!', ui.parentNode); return ok ? { ok: true } : { ok: true, shrink: true }; },
      // 巻き取り:文の並べ替え(アミューズメントの並べ替えと同じデータ)。大物ほど長い文
      reel: (sp, size, cb) => { const n = sp.r >= 4 ? 5 : (sp.r >= 3 || size >= 60) ? 4 : 3;
        return sortReel(ui, { n, fishName: sp.name, icon: '🐟', volume: ctx.audio && ctx.audio.sfx, ...cb, onLearn: d => { try { ctx.emit('learn', { ...d, src: '釣りの巻き取り' }); } catch (e) { } } }); },
      // 待っているあいだの問題(どんどん出る)。単語が多め、ときどき熟語
      wait: async () => {
        if (s.lv < 3 && Math.random() < aboveP()) {   // 今より1つ上のレベルの問題(竿が良いほど出にくい)。正解するとメーターが多く上がる
          if (Math.random() < 0.7) { const w = pick(SW[s.lv + 1]), ok = await ask(wordQ(s.lv + 1, w, Math.random() < 0.5 ? 'ej' : 'je'), { label: '⏳ ちょっと上のレベル! 単語', time: T_Q + 3, host: ui.parentNode }); return { ok, above: true }; }
          return { ok: await idiom(s.lv + 1, '⏳ ちょっと上のレベル! 熟語', ui.parentNode), above: true };
        }
        return Math.random() < 0.25 ? idiom(s.lv, '⏳ 気になってる! 熟語に答えよう', ui.parentNode).then(ok => ({ ok })) : word(Math.random() < 0.5 ? 'ej' : 'je', '⏳ 気になってる! 単語に答えよう', T_Q);
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
  function keepFish(sp, size) {
    const t = spec.tank(); if (t.length >= TANK_MAX) return false;
    t.push({ uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), id: sp.id, size, g: 0, day: '', n: 0, at: Date.now() }); spec.saveTank(t);
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
      sc.innerHTML = `<div class="top"><button class="sbtn" data-a="back">← もどる</button><span style="flex:1"></span><button class="sbtn" data-a="tank">🐠 水槽</button><button class="sbtn" data-a="col">🏺 標本</button></div>
        <h2>📚 英語の釣り堀</h2><p class="nt">えらんだセットの単語だけが出るよ。魚が近づいたら単語に答えて「気になり度」をためよう。合わせ損ねた時は単語、あばれた時は熟語、巻き取りは文の並べ替え。<b>セットの単語をぜんぶ完璧</b>(続けて${PERFECT_C}回正解。ストリームで正解した分も入る)にすると、そのセットの標本がもらえる。魚はどのセットでもふつうに釣れるよ。</p>
        <div class="tabs">${[1, 2, 3].map(l => `<button data-lv="${l}" class="${l === lv ? 'on' : ''}">${LV_NAME[l]}<br><small style="font-weight:700;font-size:10px">${LV_SUB[l]}</small></button>`).join('')}</div>
        <p class="nt" style="margin:0 0 8px">標本 ${got} / ${sets.length}</p>
        <p class="nt" style="margin:0 0 8px">問題の間隔: ${[[1, 'はやい'], [2, 'ふつう'], [3, 'ゆっくり']].map(([k, t]) => `<button class="sbtn" data-gap="${k}" style="${(+(ctx.storage.get('enGap') || 1)) === k ? 'background:#f58aa8;color:#fff' : ''}">${t}</button>`).join(' ')}</p>
        <div class="grid">${sets.map(s => { const n = spec.perfCount(s.id), o = own[s.id]; return `<button class="cell ${o ? (o.crack ? 'crk' : 'got') : ''}" data-s="${s.id}"><b>セット${s.no}</b><span class="ic">${o ? (o.crack ? '💥' : ICON[s.look.shape] || '🏺') : '🎣'}</span><small>${esc(s.words[0][0])}…</small><div class="pg"><i style="width:${n / s.words.length * 100}%"></i></div><small>完璧 ${n}/${s.words.length}</small></button>`; }).join('')}</div>`;
    };
    draw();
    sc.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a, l = e.target.closest('[data-lv]'), c = e.target.closest('[data-s]');
      if (a) sfx.play('tap');
      if (a === 'back') { sc.remove(); onBack(); }
      else if (a === 'tank') { sc.remove(); tankScreen({ onBack: () => pondScreen({ onPick, onBack }) }); }
      else if (a === 'col') { sc.remove(); collection({ onBack: () => pondScreen({ onPick, onBack }) }); }
      else if (e.target.closest('[data-gap]')) { sfx.play('tap'); ctx.storage.set('enGap', +e.target.closest('[data-gap]').dataset.gap); draw(); sc.scrollTop = sc.scrollTop; }
      else if (l) { sfx.play('tap'); lv = +l.dataset.lv; ctx.storage.set('enLv', lv); draw(); sc.scrollTop = 0; }
      else if (c) { sfx.play('tap'); setInfo(SET[c.dataset.s], () => { sc.remove(); onPick(c.dataset.s); }); }
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
    const draw = () => {
      const own = spec.own();
      let body;
      if (tab === 'f') {
        body = `<p class="nt">水槽で育てきった魚から作れる。入手条件:その魚を英語の釣り堀で釣って、水槽で育てきる(えさ${GROW_NEED}回・1日${FEED_PER_DAY}回まで)。</p><div class="grid">${FISH_SPEC.map(f => { const n = furn.owned('fs_' + f.id); return `<div class="cell ${n ? 'got' : ''}"><span class="ic">${n ? '🐟' : '❔'}</span><b>${n ? esc(f.name) : '？？？'}</b><small>${n ? esc(f.en) + (n > 1 ? ' ×' + n : '') : '★'.repeat(f.r)}</small></div>`; }).join('')}</div>`;
      } else {
        const sets = SETS.filter(s => s.lv === tab);
        body = `<p class="nt">入手条件:そのセットの単語をぜんぶ完璧にする。💥=ひび(抜き打ちテストで まちがえすぎた)。もう一度ぜんぶ完璧にすると直る。</p><div class="grid">${sets.map(s => { const o = own[s.id], n = spec.perfCount(s.id); return `<button class="cell ${o ? (o.crack ? 'crk' : 'got') : ''}" data-s="${s.id}">${o ? `<i class="dot" style="background:${hexCol(s.look.col)}"></i>` : ''}<span class="ic">${o ? (o.crack ? '💥' : ICON[s.look.shape]) : '❔'}</span><b>${o ? esc(s.look.name) : 'セット' + s.no}</b><small>${o ? esc(s.look.en) : esc(s.words[0][0]) + '…'}</small>${o ? '' : `<div class="pg"><i style="width:${n / s.words.length * 100}%"></i></div>`}</button>`; }).join('')}</div>`;
      }
      const cnt = Object.keys(own).length, fc = FISH_SPEC.filter(f => furn.owned('fs_' + f.id)).length;
      sc.innerHTML = `<div class="top"><button class="sbtn" data-a="back">← もどる</button></div><h2>🏺 標本コレクション</h2><p class="nt">集めた標本 ${cnt} / ${SETS.length} ・ 魚の標本 ${fc} / ${FISH_SPEC.length}。家の「持ち物」から、かざれるよ。</p>
        <div class="tabs">${[[1, '初級'], [2, '中級'], [3, '上級'], ['f', '魚']].map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>${body}`;
    };
    draw();
    sc.onclick = e => {
      const a = e.target.closest('[data-a]')?.dataset.a, t = e.target.closest('[data-t]'), c = e.target.closest('[data-s]');
      if (a === 'back') { sfx.play('tap'); sc.remove(); onBack(); }
      else if (t) { sfx.play('tap'); tab = t.dataset.t === 'f' ? 'f' : +t.dataset.t; ctx.storage.set('colTab', tab); draw(); }
      else if (c) { const s = SET[c.dataset.s], o = spec.own()[s.id]; toast(o ? `${s.look.name}(${s.look.en})・${s.title}` : condOf(s)); }
    };
  }

  // ---- 画面:水槽 ----
  function tankScreen({ onBack }) {
    const sc = document.createElement('div'); sc.className = 'ens'; root.appendChild(sc);
    let raf = 0, swim = [];
    const today = dayKey();
    const draw = () => {
      const t = spec.tank(), food = spec.food();
      sc.innerHTML = `<div class="top"><button class="sbtn" data-a="back">← もどる</button><span style="flex:1"></span><span class="sbtn" style="pointer-events:none">🍤 えさ ${food}</span></div>
        <h2>🐠 水槽 <small style="font-size:13px;color:#8d7f9e">${t.length} / ${TANK_MAX}</small></h2>
        <p class="nt">英語の問題に答えて、えさを作ろう(1問正解=1つ)。問題は、あなたが今までにまちがえた言葉や、釣り堀の単語から出るよ。1匹に1日${FEED_PER_DAY}回まで。${GROW_NEED}回で育ちきって、標本にできる。</p>
        <div class="tankv"><canvas></canvas></div>
        <div style="display:flex;gap:8px;margin-bottom:10px"><button class="sbtn pri" data-a="make" style="flex:1">🍤 えさを作る(英語${FOOD_Q}問)</button><button class="sbtn" data-a="all" ${food && t.some(f => (f.day !== today ? 0 : f.n) < FEED_PER_DAY && f.g < GROW_NEED) ? '' : 'disabled'}>みんなにあげる</button></div>
        ${t.length ? t.map(f => { const sp = FISHBY[f.id], n = f.day === today ? f.n : 0, full = f.g >= GROW_NEED, sz = Math.round(f.size * (1 + 0.5 * Math.min(1, f.g / GROW_NEED))); return `<div class="row"><div class="fx"><b>${esc(sp ? sp.name : f.id)}</b> <small style="color:#8d7f9e">${sz}cm ・ ${full ? '育ちきった!' : f.g >= GROW_NEED * 0.6 ? 'りっぱになってきた' : f.g >= GROW_NEED * 0.3 ? '育ちざかり' : 'ちびっこ'}</small><div class="gb"><i style="width:${Math.min(1, f.g / GROW_NEED) * 100}%"></i></div><small style="color:#8d7f9e">きょう ${n}/${FEED_PER_DAY} ・ そだち ${Math.min(f.g, GROW_NEED)}/${GROW_NEED}</small></div>
          ${full ? `<button class="sbtn pri" data-spec="${f.uid}">🏺 標本にする</button>` : `<button class="sbtn" data-feed="${f.uid}" ${food && n < FEED_PER_DAY ? '' : 'disabled'}>🍤 あげる</button>`}<button class="sbtn" data-rel="${f.uid}" title="池にかえす">↩</button></div>`; }).join('')
        : `<div class="row"><div class="fx">まだ魚がいないよ。<b>英語の釣り堀</b>で釣った魚を「水槽に入れる」と、ここで育てられる。</div></div>`}`;
      startSwim();
    };
    function startSwim() {
      cancelAnimationFrame(raf);
      const cv = sc.querySelector('.tankv canvas'); if (!cv) return;
      const t = spec.tank(), W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = W * dpr; cv.height = H * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      swim = t.map((f, i) => { const sp = FISHBY[f.id], k = 0.55 + 0.45 * Math.min(1, f.g / GROW_NEED), w = Math.round(Math.min(120, 40 + Math.sqrt(f.size) * 9) * k); return { img: sp ? artCanvas(sp, w, Math.round(w * 0.6)) : null, w, h: Math.round(w * 0.6), x: Math.random() * (W - w), y: 20 + (i % 3) * (H * 0.18) + Math.random() * 20, vx: (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 18), ph: Math.random() * 6 }; });
      const bub = Array.from({ length: 10 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 3 }));
      let last = performance.now();
      const step = ts => {
        raf = requestAnimationFrame(step); const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
        g.clearRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,.55)'; bub.forEach(b => { b.y -= (12 + b.s * 6) * dt; if (b.y < -5) { b.y = H * 0.7; b.x = Math.random() * W; } g.beginPath(); g.arc(b.x, b.y, b.s, 0, 6.3); g.fill(); });
        g.fillStyle = '#3f9a5a'; for (let i = 0; i < 5; i++) { const x = 20 + i * (W - 40) / 4; g.beginPath(); g.moveTo(x, H * 0.7); g.quadraticCurveTo(x + Math.sin(ts / 700 + i) * 10, H * 0.45, x + 4, H * 0.3); g.lineTo(x + 7, H * 0.7); g.fill(); }
        swim.forEach(s => {
          s.x += s.vx * dt; s.ph += dt * 2; if (s.x < 4 || s.x > W - s.w - 4) { s.vx *= -1; s.x = Math.max(4, Math.min(W - s.w - 4, s.x)); }
          const y = s.y + Math.sin(s.ph) * 6; if (!s.img) return;
          g.save(); if (s.vx > 0) { g.translate(s.x + s.w, y); g.scale(-1, 1); g.drawImage(s.img, 0, 0, s.w, s.h); } else g.drawImage(s.img, s.x, y, s.w, s.h); g.restore();
        });
      };
      raf = requestAnimationFrame(step);
    }
    const feed = uid => {
      const t = spec.tank(), f = t.find(x => x.uid === uid), food = spec.food(); if (!f || !food) return false;
      if (f.day !== today) { f.day = today; f.n = 0; }
      if (f.n >= FEED_PER_DAY || f.g >= GROW_NEED) return false;
      f.n++; f.g++; spec.saveTank(t); spec.setFood(food - 1); return true;
    };
    draw();
    sc.onclick = async e => {
      const a = e.target.closest('[data-a]')?.dataset.a, fd = e.target.closest('[data-feed]'), sp = e.target.closest('[data-spec]'), rl = e.target.closest('[data-rel]');
      if (a === 'back') { sfx.play('tap'); cancelAnimationFrame(raf); sc.remove(); onBack(); }
      else if (a === 'make') {
        sfx.play('tap'); let got = 0;
        for (const q of reviewQs(FOOD_Q)) { const ok = await ask(q, { label: `🍤 えさを作る(${got}こ)`, time: T_Q }); learn.hit(q.w[0], ok, { ja: q.w[2], src: 'fishing' }); if (ok) got++; }
        spec.setFood(spec.food() + got); toast(`🍤 えさが ${got} こ できた!`); draw();
      }
      else if (a === 'all') { let n = 0; for (const f of spec.tank()) while (feed(f.uid)) n++; if (n) { sfx.play('nibble'); toast(`🍤 ${n}回 あげた`); } draw(); }
      else if (fd) { if (feed(fd.dataset.feed)) { sfx.play('nibble'); } draw(); }
      else if (sp) {
        const t = spec.tank(), f = t.find(x => x.uid === sp.dataset.spec); if (!f) return; const fs = FISHBY[f.id];
        spec.saveTank(t.filter(x => x !== f)); furn.give('fs_' + f.id); sfx.play('legend', true);
        toast(`🏺 ${fs ? fs.name : ''}の標本(${fs ? fs.en : ''})ができた! 家の持ち物に入ったよ`); draw();
      }
      else if (rl) { if (!rl.dataset.c) { rl.dataset.c = 1; rl.textContent = '池へ?'; return; } spec.saveTank(spec.tank().filter(x => x.uid !== rl.dataset.rel)); draw(); }
    };
  }
  // えさを作る問題:まちがえたことのある言葉(ストリームなども)→ 釣り堀の完璧な単語(忘れないように)→ 初級
  function reviewQs(n) {
    const out = [], used = new Set();
    for (const w of shuffle(learn.weak(40))) { if (out.length >= Math.ceil(n * 0.6)) break; if (used.has(w.en)) continue; used.add(w.en); out.push(freeQ(w.en, w.ja)); }
    const pl = spec.played().map(id => SET[id]).filter(Boolean);
    for (let k = 0; out.length < n && k < 40; k++) {
      const s = pl.length ? pick(pl) : SETS[0], w = pick(s.words); if (used.has(w[0])) continue; used.add(w[0]); out.push(wordQ(s.lv, w, Math.random() < 0.5 ? 'ej' : 'je'));
    }
    return out;
  }

  // ---- 抜き打ちテスト ----
  function needTest() {
    const own = spec.own(), ok = Object.keys(own).filter(id => !own[id].crack && SET[id]);
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
    const own = spec.own(), ids = shuffle(Object.keys(own).filter(id => !own[id].crack && SET[id])).slice(0, TEST_SETS), qs = [];
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

  return { ask, playGates, pondScreen, tankScreen, collection, keepFish, tankRoom, get busy() { return busy; } };
}
