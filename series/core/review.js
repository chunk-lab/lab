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
        const res = stepCards.resume || []; stepCards.resume = null; let idx = res.length;
        const card = () => {
          if (idx >= items.length) return stepCheck(res);
          const w = items[idx];
          go(`<h3>フラッシュカード <small>${idx + 1}/${items.length}</small></h3>
            <p class="cs-note">右へチョン=覚えてる / 左へチョン=まだ / タップでめくる</p>
            <div class="rv-card" id="rv-c"><div class="f"><b>${esc(w.en)}</b>${w.pos ? `<small>${esc(w.pos)}</small>` : ''}<span class="b" hidden>${esc(w.ja || '(意味の記録なし)')}${w.multi > 1 ? `<em>ほかの意味もあるよ(＋${w.multi - 1})</em>` : ''}</span></div></div>
            <div class="rv-two"><button class="cs-btn rv-no" id="rv-x">← まだ</button><button class="cs-btn rv-ok" id="rv-o">覚えてる →</button></div>
            ${idx > 0 ? '<button class="cs-btn" id="rv-b">↩ ひとつ もどる</button>' : ''}`, () => {
            const c = box.querySelector('#rv-c'), back = c.querySelector('.b'); let x0 = null, dx = 0, moved = false, flipped = false, done = false;
            core.speech.speak(w.en);
            const answer = known => { if (done) return; done = true; res.push({ en: w.en, known, item: w }); c.style.transition = 'transform .12s,opacity .12s'; c.style.transform = `translateX(${known ? 140 : -140}%) rotate(${known ? 14 : -14}deg)`; c.style.opacity = 0; setTimeout(() => { idx++; card(); }, 110); };
            // ちょっと動かしただけで、すぐ反応する(ドラッグしきらなくてよい)
            const FLICK = 22;
            c.onpointerdown = e => { x0 = e.clientX; dx = 0; moved = false; c.setPointerCapture && c.setPointerCapture(e.pointerId); c.style.transition = 'none'; };
            c.onpointermove = e => { if (x0 == null || done) return; dx = e.clientX - x0; if (Math.abs(dx) > 6) moved = true; c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; c.classList.toggle('r', dx > 10); c.classList.toggle('l', dx < -10); if (dx > FLICK) answer(true); else if (dx < -FLICK) answer(false); };
            c.onpointerup = () => {
              if (x0 == null || done) { x0 = null; return; } x0 = null;
              c.style.transition = 'transform .15s'; c.style.transform = ''; c.classList.remove('r', 'l');
              if (!moved) { flipped = !flipped; back.hidden = !flipped; c.classList.toggle('flip', flipped); if (flipped) core.speech.speak(w.en); }
            };
            box.querySelector('#rv-x').onclick = () => answer(false); box.querySelector('#rv-o').onclick = () => answer(true);
            const bb = box.querySelector('#rv-b'); if (bb) bb.onclick = () => { res.pop(); idx--; card(); };   // まちがえたら もどれる
          });
        };
        card();
      }
      // さいごに一覧で、チェックボックスでまとめて直せる(チェック=覚えてる)
      function stepCheck(res) {
        go(`<h3>さいごに かくにん</h3><p class="cs-note">チェックが入っている言葉は「覚えてる」。まちがいは、ここで直せます。</p>
          <div class="rv-two"><button class="cs-btn" id="rv-all">ぜんぶ 覚えてる</button><button class="cs-btn" id="rv-none">ぜんぶ まだ</button></div>
          <ul class="rv-list rv-chk">${res.map((r, i) => `<li><label><input type="checkbox" data-i="${i}" ${r.known ? 'checked' : ''}><b>${esc(r.en)}</b><small>${esc(r.item.ja || '')}</small></label></li>`).join('')}</ul>
          <div class="rv-two"><button class="cs-btn" id="rv-bk">↩ カードにもどる</button><button class="cs-btn rv-ok" id="rv-d">これで決定</button></div>`, () => {
          const cbs = [...box.querySelectorAll('input[type=checkbox]')];
          box.querySelector('#rv-all').onclick = () => cbs.forEach(c => { c.checked = true; });
          box.querySelector('#rv-none').onclick = () => cbs.forEach(c => { c.checked = false; });
          box.querySelector('#rv-bk').onclick = () => { res.pop(); stepCardsFrom(res); };
          box.querySelector('#rv-d').onclick = () => { cbs.forEach(c => { res[+c.dataset.i].known = c.checked; }); finish(res); };
        });
      }
      function stepCardsFrom(res) {   // さいごの1枚から やりなおす
        const keep = res.slice(); stepCards.resume = keep; stepCards();
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
          ${mode === 'today' ? `<p class="cs-note">${statusLine()}</p>` : ''}<button class="cs-btn" id="rv-e">${mode === 'today' ? '今日はここまで!' : 'つづける'}</button>${dl.pool().length >= 4 ? '<button class="cs-btn" id="rv-t">単語テストもやる</button>' : ''}`, () => { box.querySelector('#rv-e').onclick = () => close(); const tb = box.querySelector('#rv-t'); if (tb) tb.onclick = () => { close(); test(); }; });
      }
      // 今日のふりかえりは、まちがって押しても勝手に終わらないよう、先に「ここまでにする?」と聞く
      if (mode === 'today' && !o.noConfirm) go(`<h3>今日はここまでにする?</h3><p class="cs-note">この日のふりかえり(時間・言葉・カード)をして、今日を終わります。</p><p class="cs-note">${statusLine()}</p>
        <button class="cs-btn" id="rv-y">ここまでにして、ふりかえる</button><button class="cs-btn" id="rv-no">まだ あそぶ</button>`, () => { box.querySelector('#rv-y').onclick = stepTime; box.querySelector('#rv-no').onclick = close; });
      else stepTime();
    });
  }
  const statusLine = () => { const s = status(); return s.ok ? '今日の課題はぜんぶOK!また明日ね。' : !s.main ? '今日のメイン課題が まだだよ。' : `ほかの課題は あと${3 - s.n}つ でOK。`; };


  // ---- 定期の単語テスト(いままで出会った言葉から、ランダムに10問。3日に1回すすめる) ----
  const TEST_N = 10, TEST_DAYS = 3, SLOW = 10;
  const testDue = () => { const p = dl.pool(); if (p.length < 8) return false; const l = dl.lastTest(); return !l || (Date.parse(dl.dayKey()) - Date.parse(l)) / 864e5 >= TEST_DAYS; };
  function test() {
    const pool = dl.pool(); if (pool.length < 4) { core.ui.toast('テストできる言葉が、まだ少ないよ'); return; }
    const first = w => String(w.ja).split(/[、,・]/)[0].trim();
    const qs = pool.slice().sort(() => Math.random() - 0.5).slice(0, TEST_N).map(w => {
      const bad = pool.filter(x => x.en !== w.en && first(x) !== first(w)).sort(() => Math.random() - 0.5).slice(0, 3).map(first);
      return { w, ans: first(w), ch: [first(w), ...bad].sort(() => Math.random() - 0.5) };
    });
    core.ui.sheet('<div class="rv"></div>', (ov, close) => {
      const box = ov.querySelector('.rv'); let i = 0; const res = []; let t0 = 0;
      const q = () => {
        if (i >= qs.length) return end();
        const Q = qs[i]; t0 = Date.now(); core.speech.speak(Q.w.en);
        box.innerHTML = `<h3>単語テスト <small>${i + 1}/${qs.length}</small></h3><div class="rv-card" style="cursor:default"><div class="f"><b>${esc(Q.w.en)}</b>${Q.w.pos ? `<small>${esc(Q.w.pos)}</small>` : ''}</div></div>
          <div class="rv-ch">${Q.ch.map((c, k) => `<button class="cs-btn" data-k="${k}">${esc(c)}</button>`).join('')}</div><p class="cs-note">10秒以上なやんだ言葉は、あとでもう一度出ます。</p>`;
        box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
          const ok = Q.ch[+b.dataset.k] === Q.ans, slow = (Date.now() - t0) / 1000 > SLOW;
          res.push({ ok, slow, w: Q.w }); b.style.background = ok ? '#bff0cf' : '#ffc9c9';
          box.querySelectorAll('[data-k]').forEach(x => { x.disabled = true; if (Q.ch[+x.dataset.k] === Q.ans) x.style.background = '#bff0cf'; });
          setTimeout(() => { i++; q(); }, ok ? 450 : 1100);
        });
      };
      function end() {
        const again = res.filter(r => !r.ok || r.slow).map(r => r.w); if (again.length) dl.enqueue(again); dl.setTest(dl.dayKey());
        box.innerHTML = `<h3>テストおわり</h3><p style="text-align:center;font-size:20px;font-weight:900">${res.filter(r => r.ok).length} / ${res.length} 正解</p>
          ${again.length ? `<p class="cs-note">まちがえた言葉・10秒以上なやんだ言葉 ${again.length}こ は、あとの復習に入れたよ。</p>` : '<p class="cs-note">ぜんぶ すばやく正解!</p>'}<button class="cs-btn" id="rv-e">おわる</button>`;
        box.querySelector('#rv-e').onclick = close;
      }
      q();
    });
  }

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
    if (!(e.kind === 'prev' || e.kind === 'forgot') && testDue()) { core.ui.toast('単語テストの日だよ!'); setTimeout(test, 1200); }
    return e;
  }
  const mark = k => { if (dl.flagged(k)) return 0; const g = give(k); core.ui.toast(`${OTHERS.find(o => o[0] === k)?.[1] || ''}${g ? ' +' + g + 'コイン' : ''}`); return g; };
  return { open, status, entrance, enter, mark, test, testDue };
}
