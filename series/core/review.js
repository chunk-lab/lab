/* 1日のふりかえり(「今日はここまで」)と、入り口の「前回のふりかえり」。
   流れ:①時間のグラフ(勉強・遊び・街でまったり) → ②言葉・表現の一覧(音声が順番に流れる) → ③フラッシュカード(右フリック=覚えてる / 左=覚えてない / タップ=めくる)
   - ポイント:今日のふりかえり=review(10) / 前回のふりかえり=prev(10)。忘れていた日は、7日に1回だけ特別にあげる
   - 1日のOK:メイン課題(必須)+ほかの課題(前回・それ以外の勉強・目標時間・おみくじ・ふりかえり)のうち3つ以上 */
import { TOPS, CATS, FORCE_N } from './daylog.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mm = s => { const m = Math.round(s / 60); return s > 0 && m === 0 ? '1分未満' : m + '分'; };
const dayJa = k => { const [, m, d] = k.split('-'); return `${+m}月${+d}日`; };
export const OTHERS = [['prev', '前回のふりかえり'], ['other', 'それ以外の勉強'], ['goal', '目標時間'], ['omikuji', 'おみくじ'], ['review', '今日のふりかえり']];

export function createReview(core) {
  const dl = core.daylog;
  const give = kind => { let g = 0; try { g = core.member.earn(kind); } catch (e) { } dl.flag(kind, true); return g; };
  // ---- 課題の進み具合 ----
  function status() {
    const f = dl.flags(), main = !!core.member.today().task, others = OTHERS.map(([k, n]) => ({ k, n, ok: !!f[k] }));
    const n = others.filter(o => o.ok).length;
    return { main, others, n, ok: main && n >= 3 };
  }
  // 目標時間(勉強の合計が目標に届いた)・それ以外の勉強は、動いている間に見張る
  const watch = () => {
    try {
      const goal = (core.record && core.record.goal && core.record.goal().min) || 15;
      if (!dl.flagged('goal') && dl.summary().study >= goal * 60) { const g = give('goal'); core.ui.toast(`目標の勉強時間になったよ!${g ? ' +' + g + 'コイン' : ''}`); }
    } catch (e) { }
  };
  dl.onChange(watch);
  core.events.on((game, name) => {
    if (name !== 'done' || dl.flagged('other')) return;
    const M = core.mission && core.mission.current && core.mission.current();
    if (!M || (M.done && Date.now() - M.done > 3000) || M.kind !== 'task') { const g = give('other'); core.ui.toast(`ほかの勉強もできたね!${g ? ' +' + g + 'コイン' : ''}`); }
  });

  // ---- 画面 ----
  function open(o = {}) {
    const mode = o.mode === 'prev' ? 'prev' : 'today', day = mode === 'prev' ? (o.day || dl.prevDay()) : dl.dayKey();
    if (!day) { core.ui.toast('まだ記録がありません'); return; }
    const title = mode === 'prev' ? `${dayJa(day)}のふりかえり` : '今日のふりかえり';
    let items = dl.words(day).map(w => ({ ...w }));
    const forced = dl.forced();
    if (forced || mode === 'prev') {   // たまった/3日たった:足りない分は、いままで覚えていなかったものでうめる
      const have = new Set(items.map(w => w.en.toLowerCase())), rest = dl.pending().filter(w => !have.has(w.en.toLowerCase())).sort((a, b) => (b.unk || 0) - (a.unk || 0));
      if (forced) rest.slice(0, Math.max(0, FORCE_N - items.length)).forEach(w => items.push({ ...w, old: true }));
    }
    items.sort((a, b) => (b.miss ? 1 : 0) + (b.multi > 1 ? .5 : 0) - ((a.miss ? 1 : 0) + (a.multi > 1 ? .5 : 0)));
    let stopAudio = () => { };
    core.ui.sheet('<div class="rv"></div>', (ov, close) => {
      const box = ov.querySelector('.rv'), closeBtn = ov.querySelector('.cs-close');
      const orig = closeBtn.onclick; closeBtn.onclick = () => { stopAudio(); orig(); };
      const go = (html, bind) => { box.innerHTML = html; bind && bind(); box.scrollTop = 0; };
      // ① 時間
      function stepTime() {
        const s = dl.summary(day), tops = { study: s.study, play: s.play, relax: s.relax }, tot = s.total || 1;
        const bar = Object.entries(tops).filter(([, v]) => v > 0).map(([k, v]) => `<i style="width:${(v / tot * 100).toFixed(1)}%;background:${TOPS[k].col}" title="${TOPS[k].n}"></i>`).join('');
        const rows = ['study', 'tv', 'sport', 'relax'].map(c => {
          const it = s.items.filter(x => x.cat === c); if (!it.length) return '';
          const top = CATS[c].top;
          return `<div class="rv-g"><b style="color:${CATS[c].col}">${top === 'play' ? '遊び / ' : ''}${CATS[c].n} <span>${mm(s.by[c])}</span></b>${it.map(x => `<small>${esc(x.label)} ${mm(x.sec)}</small>`).join('')}</div>`;
        }).join('');
        let say = '';
        if (mode === 'prev' && s.total > 0 && s.play > s.study * 2) say = '<p class="rv-say">このあいだは遊びが多めだったね。今日は勉強にする?</p>';
        else if (s.total > 0 && s.study === 0) say = '<p class="rv-say">勉強の時間がなかったよ。次はちょっとだけやってみよう!</p>';
        go(`<h3>${title}</h3>${s.total ? `<div class="rv-bar">${bar}</div>
          <div class="rv-leg"><span style="color:${TOPS.study.col}">■勉強 ${mm(s.study)}</span><span style="color:${TOPS.play.col}">■遊び ${mm(s.play)}</span><span style="color:${TOPS.relax.col}">■街でまったり ${mm(s.relax)}</span></div>
          ${rows}${say}` : '<p class="cs-note">この日の時間の記録はありません。</p>'}
          <button class="cs-btn" id="rv-n">${items.length ? 'つぎへ(言葉の一覧)' : 'おわる'}</button>`, () => { box.querySelector('#rv-n').onclick = () => (items.length ? stepList() : finish([])); });
      }
      // ② 一覧+音声
      function stepList() {
        const row = (w, i) => `<li data-i="${i}"><b>${esc(w.en)}</b>${w.multi > 1 ? `<em>＋${w.multi - 1}</em>` : ''}${w.miss ? '<u>まちがえた</u>' : ''}${w.old ? '<u>前から</u>' : ''}<small>${esc(w.ja)}</small></li>`;
        go(`<h3>出会った言葉(${items.length})</h3><p class="cs-note">音声が順番に流れます。「＋」は、ほかの意味もある言葉。</p>
          <ul class="rv-list">${items.map(row).join('')}</ul>
          <div class="rv-two"><button class="cs-btn" id="rv-p">▶ 音声</button><button class="cs-btn" id="rv-n">フラッシュカードへ</button></div>`, () => {
          let on = false, i = 0; const lis = [...box.querySelectorAll('li')], pb = box.querySelector('#rv-p');
          const stop = () => { on = false; core.speech.stop(); pb.textContent = '▶ 音声'; lis.forEach(l => l.classList.remove('now')); };
          stopAudio = stop;
          const next = () => { if (!on) return; if (i >= items.length) return stop(); const w = items[i]; lis.forEach(l => l.classList.remove('now')); lis[i].classList.add('now'); lis[i].scrollIntoView({ block: 'nearest' }); i++; core.speech.speak(w.en, { onend: () => setTimeout(next, 450) }); };
          pb.onclick = () => { if (on) return stop(); on = true; i = 0; pb.textContent = '■ とめる'; next(); };
          box.querySelector('#rv-n').onclick = () => { stop(); stepCards(); };
          if (core.settings.get('voice')) setTimeout(() => { if (box.contains(pb) && !on) pb.click(); }, 400);
        });
      }
      // ③ フラッシュカード
      function stepCards() {
        const res = []; let idx = 0;
        const card = () => {
          if (idx >= items.length) return finish(res);
          const w = items[idx];
          go(`<h3>フラッシュカード <small>${idx + 1}/${items.length}</small></h3>
            <p class="cs-note">右へフリック=覚えてる / 左へフリック=まだ / タップでめくる</p>
            <div class="rv-card" id="rv-c"><div class="f"><b>${esc(w.en)}</b>${w.pos ? `<small>${esc(w.pos)}</small>` : ''}<span class="b" hidden>${esc(w.ja || '(意味の記録なし)')}${w.multi > 1 ? `<em>ほかの意味もあるよ(＋${w.multi - 1})</em>` : ''}</span></div></div>
            <div class="rv-two"><button class="cs-btn rv-no" id="rv-x">← まだ</button><button class="cs-btn rv-ok" id="rv-o">覚えてる →</button></div>`, () => {
            const c = box.querySelector('#rv-c'), back = c.querySelector('.b'); let x0 = null, dx = 0, moved = false, flipped = false;
            core.speech.speak(w.en);
            const answer = known => { res.push({ en: w.en, known, item: w }); c.style.transition = 'transform .18s,opacity .18s'; c.style.transform = `translateX(${known ? 140 : -140}%) rotate(${known ? 14 : -14}deg)`; c.style.opacity = 0; setTimeout(() => { idx++; card(); }, 170); };
            c.onpointerdown = e => { x0 = e.clientX; dx = 0; moved = false; c.setPointerCapture && c.setPointerCapture(e.pointerId); c.style.transition = 'none'; };
            c.onpointermove = e => { if (x0 == null) return; dx = e.clientX - x0; if (Math.abs(dx) > 8) moved = true; c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; c.classList.toggle('r', dx > 40); c.classList.toggle('l', dx < -40); };
            c.onpointerup = () => {
              if (x0 == null) return; x0 = null;
              if (dx > 70) return answer(true); if (dx < -70) return answer(false);
              c.style.transition = 'transform .15s'; c.style.transform = ''; c.classList.remove('r', 'l');
              if (!moved) { flipped = !flipped; back.hidden = !flipped; c.classList.toggle('flip', flipped); if (flipped) core.speech.speak(w.en); }
            };
            box.querySelector('#rv-x').onclick = () => answer(false); box.querySelector('#rv-o').onclick = () => answer(true);
          });
        };
        card();
      }
      // おわり
      function finish(res) {
        stopAudio();
        const ng = res.filter(r => !r.known);
        let g = 0, msg = '';
        if (res.length || !items.length) {
          dl.finishReview(day, res);
          if (mode === 'today') g = give('review'); else if (!o.noPt) g = give('prev');
        }
        go(`<h3>おつかれさま!</h3>${res.length ? `<p>覚えてる ${res.length - ng.length} ・ まだ ${ng.length}</p>${ng.length ? '<p class="cs-note">「まだ」の言葉は、あとで またでてくるよ。</p>' : ''}` : ''}
          ${g ? `<p class="rv-pt">+${g} コイン</p>` : '<p class="cs-note">このふりかえりのコインは、もらえなかったよ(受け取り済み、または忘れた日)。</p>'}
          ${mode === 'today' ? `<p class="cs-note">${statusLine()}</p>` : ''}<button class="cs-btn" id="rv-e">${mode === 'today' ? '今日はここまで!' : 'つづける'}</button>`, () => { box.querySelector('#rv-e').onclick = () => close(); });
      }
      stepTime();
    });
  }
  const statusLine = () => { const s = status(); return s.ok ? '今日の課題はぜんぶOK!また明日ね。' : !s.main ? '今日のメイン課題が まだだよ。' : `ほかの課題は あと${3 - s.n}つ でOK。`; };

  // ---- 入り口:前回のふりかえり / ふりかえりを忘れたとき / 同じ日にもどってきたとき ----
  function entrance() {
    const today = dl.dayKey(), last = dl.lastEnter();
    if (last === today) {   // 同じ日にもどってきた:追加ポイントなし。足りない課題だけ補える
      const s = dl.summary(), goal = (core.record && core.record.goal && core.record.goal().min) || 15, st = status();
      const say = s.study >= goal * 60 ? '勉強がんばったね。ちょっと息抜きする?' : s.study < goal * 20 ? '何か勉強し忘れてた?' : 'おかえり!';
      return { kind: 'again', say, left: [!st.main && 'メイン課題', ...st.others.filter(o => !o.ok && o.k !== 'prev').map(o => o.n)].filter(Boolean) };
    }
    dl.setEnter(today);
    const prev = dl.prevDay(); if (!prev) return { kind: 'first' };
    const forgot = dl.forgotten();
    if (forgot) {
      const gk = dl.graceAt(), can = !gk || (Date.parse(today) - Date.parse(gk)) / 864e5 >= 7;
      if (can) { dl.setGrace(today); }
      return { kind: 'forgot', day: forgot, grace: can, say: `${dayJa(forgot)}のふりかえりを わすれてたよ。${can ? '今回だけ特別にコインをあげるね。でも次からは、ポイントがもらえなくなっちゃうから気をつけてね。' : 'ふりかえりをすると、コインがもらえるよ。もったいないから忘れないでね。'}` };
    }
    return { kind: dl.words(prev).length ? 'prev' : 'none', day: prev };
  }
  // 入り口の流れをそのまま実行する(町に入ったときに呼ぶ)
  function enter() {
    const e = entrance();
    if (e.kind === 'again') { core.ui.toast(e.say); return e; }
    if ((e.kind === 'prev' || e.kind === 'forgot') && dl.words(e.day).length) {
      if (e.kind === 'forgot') core.ui.toast(e.say);
      setTimeout(() => open({ mode: 'prev', day: e.day, noPt: e.kind === 'forgot' && !e.grace }), e.kind === 'forgot' ? 600 : 300);
    }
    return e;
  }
  const mark = k => { if (dl.flagged(k)) return 0; const g = give(k); core.ui.toast(`${OTHERS.find(o => o[0] === k)?.[1] || ''}${g ? ' +' + g + 'コイン' : ''}`); return g; };
  return { open, status, entrance, enter, mark };
}
