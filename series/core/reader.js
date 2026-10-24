/* 共通の「読む画面」（全アプリで1つ）。もとはチャンクチャンクのリーディング（みっけ！チャンク）。
   core.reader.open(story, opts) で画面いっぱいに開く。閉じると opts.onClose()。
   story = { title, level, list:[[英語(チャンクの書き方), 訳], …], questions:[…], mode:'test'?（先生のテスト）, hint, hintCost }
     questions の1つ：{ type:'range', si, a, b, q, alts, partials }（範囲を選ぶ）／{ type:'choice', q, options:[…], correct }（選択肢）
                    ／[文の番号, チャンクの番号, 問題文]（そのチャンクを答えにする書き方）
   opts = { label（上に出す名前 例：予習）, backLabel, view（'read'|'solve' 最初の表示）, onClose, onEnd（最後の文まで来た）, onGrade(結果), onSubmit(結果)（テスト）, next:{label, fn}（答え合わせのあとのボタン） }
   見た目は core/reader.css（.cs-reader の中だけ）。設定（文字の大きさ・表示する文の数など）は共通のセーブ "reader" に保存。 */
import { parseSentence, wordRole, gradeRange, RN } from './chunk.js';
import { createStore } from './store.js';
const FONT = { xs: 14, s: 17, m: 20, l: 23, xl: 28 }, FK = Object.keys(FONT);
const POSPREF = { S: ['n', 'pr', 'art', 'det', 'adj', 'num'], O: ['n', 'pr', 'art', 'det', 'adj', 'num'], I: ['pr', 'n'], C: ['adj', 'n', 'pr'],
  P: ['prep', 'n', 'art', 'det', 'adj', 'adv'], T: ['prep', 'conj', 'n', 'adv', 'det', 'art'], M: ['prep', 'adv', 'n', 'art', 'det', 'adj'], R: ['conj', 'prep'], F: ['conj'] };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HTML = `<header class="rdTop"><button class="gear" data-k="back"></button><div class="rdStory" data-k="title"></div>
  <button class="gear" data-k="fontM" aria-label="文字を小さく">A−</button><button class="gear" data-k="fontP" aria-label="文字を大きく">A＋</button><button class="gear" data-k="set" aria-label="表示の設定">⚙</button></header>
<div class="rdModeRow" data-k="modeRow"><div class="rdSeg" data-k="seg"><button data-v="read">読む</button><button data-v="solve">解く</button></div><button class="gear" data-k="gram">チャンク</button><button class="gear" data-k="jaBtn">訳</button><button class="gear" data-k="hint">💡ヒント</button></div>
<div class="rdQ"><button data-k="qPrev" class="qNav" aria-label="前の問題">‹</button>
  <div class="rdQText"><span class="rdQNum" data-k="qNum"></span><b data-k="q"></b><span class="rdAns" data-k="ans"></span></div>
  <button data-k="qNext" class="qNav" aria-label="次の問題">›</button></div>
<div class="rdChoices" data-k="choices"></div>
<div class="rdGest" data-k="gest"><div class="rdPad"><div class="rdPadHint">この広い場所のどこをドラッグしても、英文が動くよ</div>
  <div class="rdCtxBox" data-k="prevLine"></div>
  <section class="rdLane" data-k="lane" aria-label="お話の文"><div class="strip" data-k="strip"></div><div class="cutline" data-k="cutline" data-lbl="線の位置"></div><div class="fadeL"></div><div class="fadeR"></div></section>
  <div class="rdCtxBox" data-k="nextLine"></div></div>
<div class="rdInfo" data-k="info" hidden></div>
<div class="rdSenNav"><button data-k="up" class="navBtn" aria-label="前の文">▲</button><span data-k="senNum"></span><button data-k="down" class="navBtn" aria-label="次の文">▼</button><button data-k="say" class="navBtn wide" aria-label="この文を読み上げる">🔊 聞く</button><button data-k="lines" class="navBtn wide" aria-label="表示する文の数">表示 1</button></div>
<input type="range" data-k="bar" class="scrub" min="0" max="10" step="1" aria-label="文の中の位置">
<p class="rdHelp" data-k="help"></p></div>
<div class="rdBtns" data-k="btns"></div>
<button class="primary rdCheck" data-k="check">答え合わせ</button>
<div class="rdModal" data-k="modal" hidden><div class="rdSheet" data-k="sheet" role="dialog" aria-modal="true"></div></div>`;

export function createReader(core) {
  const store = createStore('reader');
  const S = Object.assign({ font: 'm', lines: 1, seg: true, role: true, ja: true, always: false, view: 'read', disp: 'easy' }, store.get('settings') || {});
  const save = () => store.set('settings', S);
  let cur = null;

  function open(story, opts = {}) {
    if (cur) cur.close(true);
    const root = document.createElement('div'); root.className = 'cs-reader'; root.innerHTML = HTML; document.body.appendChild(root);
    const $ = k => root.querySelector(`[data-k="${k}"]`);
    const dict = core.dict; let dictReady = dict.loaded;
    const sens = story.list.map(([en, ja]) => parseSentence(en, ja));
    const qs = (story.questions || []).map(q => {
      if (Array.isArray(q)) { const [si, ui, qq] = q, u = sens[si].units[ui]; return { type: 'range', si, a: u.s, b: u.e, alts: [], partials: [], q: qq, ans: null }; }
      return { alts: [], partials: [], ...q, ans: null };
    });
    const test = story.mode === 'test';
    const RD = { qi: 0, si: 0, p: 0, start: null, sel: null, hints: 0, hintOn: false, hintQ: new Set(), gpos: [], view: opts.view || S.view, gramOn: !!S.always, showJa: false, info: null, fullOpen: false, saying: false,
      hintPolicy: test ? (story.hint || 'none') : 'grammar', hintCost: test ? (story.hintCost == null ? 20 : +story.hintCost) : 0 };
    const sen = () => sens[RD.si];
    const view = () => test ? 'solve' : (qs.length ? RD.view : 'read');
    const applyFont = () => root.style.setProperty('--laneFont', FONT[S.font] + 'px');
    const speak = t => core.speech.speak(t, { rate: 0.9 });
    const stopSay = () => { core.speech.stop(); RD.saying = false; $('say').textContent = '🔊 聞く'; };
    const beep = k => { const s = core.sound; ({ mini: () => s.beep(1250, .04, 'triangle', .07), great: () => s.beep(988, .09, 'sine', .13), excellent: () => { s.beep(880, .07, 'sine', .14); setTimeout(() => s.beep(1320, .09, 'sine', .12), 55); } }[k] || (() => {}))(); };
    const lineX = () => Math.round($('lane').clientWidth * 0.34);
    const ro = new ResizeObserver(() => render(true));
    if (!dictReady) dict.ready().then(() => { dictReady = true; if (cur && cur.root === root) infoUI(); }, () => {});

    /* ---- 小さな画面（設定・答え合わせ） ---- */
    const sheet = (html, closable = true) => { $('sheet').innerHTML = html; $('modal').hidden = false; $('modal').onclick = e => { if (closable && e.target === $('modal')) closeSheet(); }; };
    const closeSheet = () => { $('modal').hidden = true; $('sheet').innerHTML = ''; };
    const ask = (msg, yes) => new Promise(ok => { sheet(`<p class="note" style="white-space:pre-line;font-size:14px">${esc(msg)}</p><div class="btns"><button class="ghost" data-a="no">やめる</button><button class="primary" data-a="yes">${esc(yes)}</button></div>`, false);
      $('sheet').querySelector('[data-a=no]').onclick = () => { closeSheet(); ok(false); }; $('sheet').querySelector('[data-a=yes]').onclick = () => { closeSheet(); ok(true); }; });

    function modeUI(v) {
      const hasQ = qs.length > 0;
      $('seg').hidden = test || !hasQ;
      $('seg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
      $('gram').hidden = v !== 'read'; $('gram').classList.toggle('on', !!RD.gramOn);
      $('jaBtn').hidden = v !== 'read' || test || S.ja === false; $('jaBtn').classList.toggle('on', !!RD.showJa);
      $('hint').hidden = v !== 'solve' || RD.hintPolicy === 'none'; $('hint').classList.toggle('on', !!RD.hintOn);
      $('hint').textContent = '💡ヒント' + (RD.hintCost ? `（−${RD.hintCost}点）` : '');
      $('modeRow').hidden = [...$('modeRow').children].every(c => c.hidden);
    }
    function wordInfoHTML(sn, wi, ja) {
      const raw = sn.words[wi], clean = raw.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'’]+$/g, ''), u = sn.units[sn.unitOf[wi]];
      let pref = POSPREF[u.role] || [];
      if (u.role === 'V') pref = wi < u.e ? ['aux', 'v'] : ['v', 'aux'];   // 後ろに動詞が続くなら助動詞
      const e = dict.lookup(raw, pref);   // lives → 動詞なら live、主語なら life
      const ph = dict.phraseAt(sn.words, wi), phH = ph ? `<div class="riNote">熟語・複合語：<b>${esc(ph.ws.join(' '))}</b>${ja ? ` ＝ ${esc(ph.m)}` : ''}</div>` : '';
      if (!e) return `<div><span class="posTag">${!dictReady ? '辞書を読み込み中…' : /^[A-Z]/.test(clean) && wi > 0 ? '名前など' : '辞書にない単語'}</span> <b>${esc(clean)}</b>${phH}</div>`;
      if (u.role === 'V' && wi < u.e && !e.pos.some(p => p[0] === 'aux')) pref = ['v', 'aux'];
      const rk = t => { const i = pref.indexOf(t); return i < 0 ? 99 : i; };
      const [main, ...rest] = [...e.pos].sort((x, y) => rk(x[0]) - rk(y[0]));
      const P = dict.POSN, base = e.w.toLowerCase() !== clean.toLowerCase() ? `<small class="riBase">（元の形 ${esc(e.w)}${e.neg ? '＋not' : ''}）</small>` : '';
      return `<div><span class="posTag">${P[main[0]] || main[0]}</span> <b>${esc(clean)}</b>${base}${ja ? ` ＝ ${esc(main[1])}` : ''}`
        + (rest.length ? `<div class="riNote">ほかに：${rest.map(([t, m]) => (P[t] || t) + (ja ? `（${esc(m)}）` : '')).join('、')}</div>` : '') + phH + '</div>';
    }
    function infoUI() {
      const el = $('info'); if (view() !== 'read') { el.innerHTML = ''; el.hidden = true; return; }
      const sn = sen(), d = S.disp, ja = RD.showJa, roleOn = RD.gramOn && S.role !== false; let h = '';
      const inf = RD.info && RD.info.si === RD.si && RD.info.chunk === !!RD.gramOn ? RD.info : null;
      if (inf && inf.chunk) {
        const u = sn.units[inf.u], rn = RN[u.role] || ['', u.role], note = u.note || [];
        const tag = d === 'gram' ? rn[1] : d === 'both' ? `${rn[0]}／${rn[1]}` : rn[0];
        const nt = d === 'gram' ? (note[1] || '') : d === 'both' ? [note[0], note[1]].filter(Boolean).join('／') : (note[0] || '');
        h += `<div><span class="roleTag r${u.role}">${esc(tag) || '　'}</span> <b>${esc(u.text)}</b>${ja && u.jp ? ` ＝ ${esc(u.jp)}` : ''}${nt ? `<div class="riNote">${esc(nt)}</div>` : ''}</div>`;
      }
      if (inf && !inf.chunk) h += wordInfoHTML(sn, inf.wi, ja);
      if (ja) {
        h += `<button class="riFull" data-a="full">全文の訳 ${RD.fullOpen ? '▲' : '▼'}</button>`;
        if (RD.fullOpen) {
          if (sn.units.some(u => u.jp)) h += `<div class="il">${sn.units.map(u => `<span class="ilItem"${roleOn ? ` style="--c:var(--c${u.role})"` : ''}><span class="ilEn">${esc(u.text)}</span>${u.jp ? `<span class="ilJp">${esc(u.jp)}</span>` : ''}</span>`).join('')}</div>`;
          if (sn.ja) h += `<div class="riJa">${esc(sn.ja)}</div>`;
        }
      }
      el.innerHTML = h; el.hidden = !h;
      const f = el.querySelector('[data-a=full]'); if (f) f.onclick = () => { RD.fullOpen = !RD.fullOpen; infoUI(); };
    }
    function infoTap(wi) {
      if (wi < 0) { RD.info = null; render(true); return; }
      const sn = sen(), ui = sn.unitOf[wi], u = sn.units[ui], chunk = !!RD.gramOn;
      if (!test) { stopSay(); speak(chunk ? u.text : sn.words[wi].replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9'’]+$/g, '')); }
      const same = RD.info && RD.info.si === RD.si && RD.info.chunk === chunk && (chunk ? RD.info.u === ui : RD.info.wi === wi);
      RD.info = same ? null : chunk ? { si: RD.si, chunk: true, u: ui, s: u.s, e: u.e } : { si: RD.si, chunk: false, wi, s: wi, e: wi };
      render(true);
    }
    function settingsUI() {
      const sel = (k, v, list) => `<select data-s="${k}">${list.map(([a, b]) => `<option value="${a}"${String(v) === a ? ' selected' : ''}>${b}</option>`).join('')}</select>`;
      const onoff = (k, v) => sel(k, v ? 'on' : 'off', [['on', 'オン'], ['off', 'オフ']]);
      sheet(`<h2>表示の設定</h2>
        ${test ? '' : `<p class="note">「読む」で「チャンク」を押したときの見え方を選べます。</p>
        <div class="row"><label>区切り</label>${onoff('seg', S.seg !== false)}</div>
        <div class="row"><label>役割の色</label>${onoff('role', S.role !== false)}</div>
        <div class="row"><label>日本語の「訳」ボタン</label>${onoff('ja', S.ja !== false)}</div>
        <div class="row"><label>最初からチャンクで見る</label>${onoff('always', !!S.always)}</div>
        <div class="row"><label>役割の名前</label>${sel('disp', S.disp, [['easy', 'かんたん（誰が・する）'], ['gram', '文法（主語・動詞）'], ['both', '両方']])}</div>`}
        <div class="row"><label>表示する文の数</label>${sel('lines', S.lines, [['1', '1文（今の文だけ）'], ['2', '2文（次の文も）'], ['3', '3文（前後の文も）']])}</div>
        <p class="note" style="font-size:10px">単語の辞書：EJDict（CC0）／品詞：WordNet 3.1（Princeton University）／語の選び方：FrequencyWords（CC BY-SA 4.0）</p>
        <div class="btns"><button class="primary" data-a="close">閉じる</button></div>`);
      $('sheet').querySelectorAll('select').forEach(s => s.onchange = () => {
        const k = s.dataset.s, v = s.value;
        if (k === 'lines') S.lines = +v; else if (k === 'disp') S.disp = v; else { S[k] = v === 'on'; if (k === 'always') RD.gramOn = S.always; }
        save();
      });
      $('sheet').querySelector('[data-a=close]').onclick = () => { closeSheet(); render(true); };
    }
    function range() {
      if (RD.sel && RD.sel.si === RD.si) return [RD.sel.a, RD.sel.b];
      if (RD.start && RD.start.si === RD.si) { const g1 = Math.min(RD.start.g, RD.p), g2 = Math.max(RD.start.g, RD.p); return [g1, g2 - 1]; }
      return [-1, -2];
    }
    function render(noAnim) {
      if (!root.isConnected) return;
      const sn = sen(), n = sn.words.length, [ra, rb] = range(), q = qs[RD.qi];
      const unitEnds = new Set(sn.units.map(u => u.e));
      const v = view(), gOn = v === 'read' ? RD.gramOn : (RD.hintOn && RD.hintPolicy === 'grammar');
      const segOn = gOn && (v !== 'read' || S.seg !== false), roleOn = gOn && (v !== 'read' || S.role !== false);
      const st = $('strip');
      const selOn = RD.sel && RD.sel.si === RD.si, startOn = RD.start && RD.start.si === RD.si;
      st.innerHTML = sn.words.map((w, i) => {
        let cls = 'w'; if (i >= ra && i <= rb) cls += ' sel'; else if (roleOn) cls += ' r' + wordRole(sn, i);
        if (RD.info && RD.info.si === RD.si && i >= RD.info.s && i <= RD.info.e) cls += ' hl';
        const pre = (selOn && i === ra) || (startOn && i === RD.start.g) ? '<span class="cutmark brk">［</span>' : '';
        let post = selOn && i === rb ? '<span class="cutmark brk">］</span>' : '';
        if (!post && segOn && unitEnds.has(i) && i < n - 1) post = '<span class="cutmark hint">｜</span>';
        return `${pre}<span class="${cls}">${esc(w)}</span>${post}`;
      }).join('');
      const ws = [...st.querySelectorAll('.w')]; RD.gpos = [];
      for (let g = 0; g <= n; g++) {
        if (g === 0) RD.gpos.push(ws[0].offsetLeft - 4);
        else if (g === n) RD.gpos.push(ws[n - 1].offsetLeft + ws[n - 1].offsetWidth + 6);
        else RD.gpos.push((ws[g - 1].offsetLeft + ws[g - 1].offsetWidth + ws[g].offsetLeft) / 2);
      }
      st.classList.toggle('step', !noAnim);
      st.style.transform = `translate(${lineX() - RD.gpos[RD.p]}px,-50%)`;
      $('cutline').style.left = lineX() + 'px';
      const bar = $('bar'); bar.max = n; bar.value = RD.p;
      const k = S.lines === 3 ? 2 : S.lines === 2 ? 1 : 0, ctxL = (step, mark) => { const out = []; for (let j = 1; j <= k; j++) { const t = sens[RD.si + step * j]; if (t) out.push(`<div class="rdCtx${j > 1 ? ' far' : ''}">${mark} ${esc(t.en)}</div>`); } return out; };
      $('prevLine').innerHTML = ctxL(-1, '▲').reverse().join(''); $('nextLine').innerHTML = ctxL(1, '▼').join('');
      $('lines').textContent = '表示 ' + S.lines; $('say').hidden = test;
      $('senNum').textContent = `${RD.si + 1} / ${sens.length} 文目`;
      $('up').disabled = RD.si === 0; $('down').disabled = RD.si === sens.length - 1;
      root.classList.toggle('vRead', v === 'read');
      modeUI(v); infoUI();
      if (v === 'read') { $('help').textContent = RD.gramOn ? `チャンクをタップすると、発音して役割${RD.showJa ? 'と意味' : ''}が出ます` : `単語をタップすると、発音して品詞${RD.showJa ? 'と意味' : ''}が出ます。「チャンク」でチャンクごとに見られます`; return; }
      if (!q) { $('qNum').textContent = ''; $('q').textContent = '（問題なし：読むだけ）'; $('ans').textContent = ''; $('choices').innerHTML = ''; $('btns').innerHTML = ''; $('help').textContent = '左右・上下にドラッグして読めます'; $('check').hidden = true; return; }
      $('check').hidden = false;
      $('qNum').textContent = `Q${RD.qi + 1} / ${qs.length}`; $('q').textContent = q.q;
      $('qPrev').disabled = RD.qi === 0; $('qNext').disabled = RD.qi === qs.length - 1;
      const answered = qs.filter(x => x.ans).length;
      $('check').textContent = test ? `提出する（${answered}/${qs.length}問）` : `答え合わせ（${answered}/${qs.length}問）`;
      if (q.type === 'choice') {
        $('ans').textContent = q.ans ? 'あなたの答え：' + q.options[q.ans.choice] : '';
        $('choices').innerHTML = q.options.map((o, i) => `<button data-c="${i}" class="${q.ans && q.ans.choice === i ? 'on' : ''}">${String.fromCharCode(65 + i)}. ${esc(o)}</button>`).join('');
        $('choices').querySelectorAll('button').forEach(b => b.onclick = () => { q.ans = { choice: +b.dataset.c }; beep('mini'); render(true); const qi = RD.qi; setTimeout(() => { if (RD.qi === qi) nextUnanswered(); }, 350); });
        $('btns').innerHTML = ''; $('help').textContent = '英文を読んで、選択肢から答えを選ぼう'; return;
      }
      $('choices').innerHTML = '';
      $('ans').textContent = q.ans ? 'あなたの答え：' + sens[q.ans.si].words.slice(q.ans.a, q.ans.b + 1).join(' ') : '';
      const help = RD.sel ? 'この範囲でいい？' : startOn ? '答えの終わりを線に合わせて「ここまで ］」' : '答えの始まりを線に合わせて「［ ここから」（レーンを左右にドラッグして動かす）';
      $('help').textContent = (RD.hintQ.has(RD.qi) && q.si != null ? `💡 答えは ${q.si + 1} 文目にあるよ。 ` : '') + help;
      $('btns').innerHTML = RD.sel ? '<button data-a="redo">選びなおし</button><button data-a="ok" class="ok">決定</button>'
        : `${startOn ? '<button data-a="redo">やめる</button>' : ''}<button data-a="cut" class="cutMain">${startOn ? 'ここまで ］' : '［ ここから'}</button>`;
      const B = a => $('btns').querySelector(`[data-a=${a}]`);
      if (B('redo')) B('redo').onclick = () => { RD.sel = null; RD.start = null; render(true); };
      if (B('ok')) B('ok').onclick = decide;
      if (B('cut')) B('cut').onclick = cut;
    }
    function cut() {
      if (RD.sel) return;
      if (!RD.start || RD.start.si !== RD.si) RD.start = { si: RD.si, g: RD.p };
      else { if (RD.p === RD.start.g) return; RD.sel = { si: RD.si, a: Math.min(RD.start.g, RD.p), b: Math.max(RD.start.g, RD.p) - 1 }; RD.start = null; }
      beep('mini');
      const lw = $('lane'); lw.classList.remove('flash'); void lw.offsetWidth; lw.classList.add('flash');
      render(true);
    }
    function decide() { const q = qs[RD.qi]; q.ans = RD.sel; RD.sel = null; RD.start = null; beep('great'); nextUnanswered(); }
    function nextUnanswered() {
      const next = qs.findIndex((x, i) => i > RD.qi && !x.ans), first = qs.findIndex(x => !x.ans), to = next >= 0 ? next : first;
      if (to >= 0 && to !== RD.qi) { RD.qi = to; render(true); qFlash(1); }
      else { render(true); if (to < 0) toast(test ? '全部答えました。下の「提出する」へ' : '全部答えました。下の「答え合わせ」へ'); }
    }
    const qFlash = d => $('q').animate(reduce ? [{ opacity: .4 }, { opacity: 1 }] : [{ transform: `translateX(${d * 30}px)`, opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    const toast = t => { const el = $('help'); el.textContent = t; el.animate([{ color: 'var(--accent)' }, { color: 'var(--muted)' }], { duration: 1600 }); };
    const goQ = (i, d) => { if (i < 0 || i >= qs.length || i === RD.qi) return; RD.qi = i; RD.hintOn = false; RD.sel = null; RD.start = null; render(true); qFlash(d); };
    const move = (p, noAnim) => { const n = sen().words.length; p = Math.max(0, Math.min(n, p)); if (p === RD.p) return; RD.p = p; render(noAnim); };
    function say() {
      if (test) return;
      if (RD.saying) { stopSay(); return; }
      if (!core.settings.get('voice')) { toast('読み上げがオフになっています（⚙ 設定で変えられます）'); return; }
      RD.saying = true; $('say').textContent = '■ 止める';
      core.speech.speak(sen().en, { rate: 0.9, onend: () => { if (RD.saying) { RD.saying = false; $('say').textContent = '🔊 聞く'; } } });
    }
    function sentence(d) {
      const si = RD.si + d; if (si < 0 || si >= sens.length) return;
      stopSay(); RD.si = si; RD.p = 0; if (si === sens.length - 1 && opts.onEnd && !RD.ended) { RD.ended = true; try { opts.onEnd(); } catch (e) { } } RD.fullOpen = false; RD.start = null; if (RD.sel && RD.sel.si !== si) RD.sel = null; render(true);
      $('lane').animate(reduce ? [{ opacity: .4 }, { opacity: 1 }] : [{ transform: `translateY(${d * 18}px)`, opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
    /* ---- 振り返りの全文読み上げ：1文ずつ順番に（一時停止は、その文の頭から再開） ---- */
    const RV = { i: 0, on: false, tok: 0 };
    const rvStop = () => { RV.on = false; RV.tok++; core.speech.stop(); };
    const rvUI = () => { const b = $('sheet').querySelector('[data-a=rvPlay]'); if (!b) return; b.textContent = RV.on ? '⏸ 一時停止' : RV.i > 0 ? '▶ つづき' : '▶ 最初から';
      $('sheet').querySelectorAll('.rvSen').forEach(el => el.classList.toggle('on', RV.on && +el.dataset.i === RV.i)); };
    function rvSpeak() {
      if (RV.i >= sens.length) { RV.on = false; RV.i = 0; rvUI(); return; }
      const tok = ++RV.tok; RV.on = true; rvUI();
      const el = $('sheet').querySelector(`.rvSen[data-i="${RV.i}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      core.speech.speak(sens[RV.i].en, { rate: 0.9, onend: () => { if (tok !== RV.tok || !RV.on) return; RV.i++; rvSpeak(); } });
    }
    const judge = q => q.type === 'choice' ? (q.ans && q.ans.choice === q.correct ? 'o' : 'x') : gradeRange(sens[q.si], q, q.ans).mark;
    const spanHTML = (sn, exp, mine) => sn.words.map((w, i) => { const e = exp && i >= exp.a && i <= exp.b, m = mine && mine.si === exp.si && i >= mine.a && i <= mine.b; return `<span class="spw${e ? ' spE' : ''}${m ? ' spM' : ''}">${esc(w)}</span>`; }).join(' ');
    const summary = () => qs.map((q, i) => {
      if (q.type === 'choice') return { q: q.q, mine: q.ans ? q.options[q.ans.choice] : '', mark: judge(q), why: '', pts: q.pts || 100, hint: RD.hintQ.has(i) };
      const g = gradeRange(sens[q.si], q, q.ans);
      return { q: q.q, mine: q.ans ? sens[q.ans.si].words.slice(q.ans.a, q.ans.b + 1).join(' ') : '', mark: g.mark, why: g.why, pts: q.pts || 100, hint: RD.hintQ.has(i) };
    });
    async function grade() {
      const pending = RD.sel || RD.start ? RD.qi : -1;
      const un = qs.map((q, i) => !q.ans ? i : -1).filter(i => i >= 0), names = un.map(i => `Q${i + 1}`).join('・');
      const pendNote = pending >= 0 && !qs[pending].ans ? `<p class="note">Q${pending + 1} は範囲を選びかけたまま「決定」されていません。</p>` : '';
      const goUn = () => { closeSheet(); if (!(pending >= 0 && un[0] === pending)) goQ(un[0], 1); };
      if (un.length && !test) {
        sheet(`<h2>まだ答えていない問題があります</h2><p class="note">${names} に答えてから、答え合わせをしましょう。</p>${pendNote}<div class="btns"><button class="primary" data-a="go">${names.split('・')[0]} へ</button></div>`);
        $('sheet').querySelector('[data-a=go]').onclick = goUn; return;
      }
      if (test) {
        if (un.length) {
          const go = await new Promise(ok => { sheet(`<h2>未回答の問題があります</h2><p class="note"><b>${names}</b> が未回答です。<br>未回答の問題は点数が入りません。本当に提出しますか？</p>${pendNote}
            <div class="btns"><button class="primary" data-a="go">未回答の問題へ</button><button class="ghost" data-a="force">それでも提出する</button></div>`);
            $('sheet').querySelector('[data-a=go]').onclick = () => ok(false); $('sheet').querySelector('[data-a=force]').onclick = () => ok(true); });
          if (!go) { goUn(); return; }
          if (!(await ask(`もう一度確認します。\n${names} は0点になります。提出すると答えは変えられません。提出しますか？`, '提出する'))) return;
        } else if (!(await ask('提出しますか？\n提出すると答えは変えられません。', '提出する'))) return;
        const sm = summary(), cost = RD.hintCost;
        const score = sm.reduce((a, x) => a + Math.max(0, Math.round(x.pts * ({ o: 1, t: .4, x: 0 })[x.mark]) - (x.hint ? cost : 0)), 0), max = sm.reduce((a, x) => a + x.pts, 0);
        opts.onSubmit && opts.onSubmit({ answers: sm, score, max });
        sheet('<h2>提出しました</h2><p class="note">答えは先生が確認します。</p><div class="btns"><button class="primary" data-a="back">もどる</button></div>', false);
        $('sheet').querySelector('[data-a=back]').onclick = () => close(); return;
      }
      const res = qs.map(judge), pts = res.reduce((a, r, i) => a + Math.round((qs[i].pts || 100) * ({ o: 1, t: .4, x: 0 })[r]), 0);
      beep(res.every(r => r === 'o') ? 'excellent' : 'great');
      core.events.report('reader', 'grade', { title: story.title, n: qs.length, o: res.filter(r => r === 'o').length, hints: RD.hints });
      const extra = opts.onGrade ? opts.onGrade({ res, pts, hints: RD.hints, n: qs.length, answered: qs.filter(x => x.ans).length }) : '';
      const MK = { o: ['◯', 'k-excellent'], t: ['△', 'k-good'], x: ['×', 'k-miss'] };
      sheet(`<h2>答え合わせ</h2>
        <div class="big">${Math.max(0, pts)} pt <span style="font-size:14px;color:var(--muted)">◯${res.filter(r => r === 'o').length}／${qs.length}問　ヒント使用${RD.hints}問</span></div>
        ${extra ? `<p class="note" style="color:var(--accent);font-weight:800">${esc(extra)}</p>` : ''}
        ${qs.map((q, i) => {
          const r = res[i];
          if (q.type === 'choice') return `<div class="rvw"><span class="lab">Q${i + 1}. ${esc(q.q)}</span><div class="en"><span class="mk ${MK[r][1]}">${MK[r][0]}</span>あなた：${q.ans ? esc(q.options[q.ans.choice]) : '（未回答）'}</div><div class="en">答え：${esc(q.options[q.correct] || '')}</div></div>`;
          const sn = sens[q.si], g = gradeRange(sn, q, q.ans);
          return `<div class="rvw"><span class="lab">Q${i + 1}. ${esc(q.q)}</span><div class="en"><span class="mk ${MK[g.mark][1]}">${MK[g.mark][0]}</span>${g.why ? `<small class="why">${esc(g.why)}</small>` : ''}</div>
            <div class="en">${spanHTML(sn, q, q.ans)}</div><small class="legendSp"><span class="spE">想定した答え</span>　<span class="spM">あなたの選択</span></small><div class="ja">${esc(sn.ja)}</div></div>`;
        }).join('')}
        <div class="rvAll"><div class="rvAllHead"><b>全文を聞く</b><button class="primary" data-a="rvPlay">▶ 最初から</button></div><small class="note">文をタップすると、そこから下を読みます。</small>
          ${sens.map((sn, i) => `<div class="rvSen" data-i="${i}"><div class="en">${esc(sn.en)}</div><div class="ja">${esc(sn.ja)}</div></div>`).join('')}</div>
        <div class="btns"><button class="ghost" data-a="back">${esc(opts.backLabel || 'もどる')}</button><button class="ghost" data-a="again">もう一度</button>${opts.next ? `<button class="primary" data-a="next">${esc(opts.next.label)}</button>` : ''}</div>`, false);
      const B = a => $('sheet').querySelector(`[data-a=${a}]`);
      RV.i = 0; RV.on = false; RV.tok++; rvUI();
      B('rvPlay').onclick = () => { if (RV.on) { rvStop(); rvUI(); } else rvSpeak(); };
      $('sheet').querySelectorAll('.rvSen').forEach(el => el.onclick = () => { RV.i = +el.dataset.i; RV.tok++; rvSpeak(); });
      B('back').onclick = () => close();
      B('again').onclick = () => { rvStop(); closeSheet(); open(story, opts); };
      if (B('next')) B('next').onclick = () => { rvStop(); close(true); opts.next.fn(); };
    }

    /* ---- 操作：左右ドラッグで位置、上下ドラッグで前後の文、タップで単語・チャンク（解くときは切る） ---- */
    const gest = $('gest'); let d = null;
    $('set').onclick = settingsUI;
    $('lines').onclick = () => { S.lines = S.lines >= 3 ? 1 : S.lines + 1; save(); render(true); };
    $('seg').querySelectorAll('button').forEach(b => b.onclick = () => { S.view = b.dataset.v; save(); RD.view = b.dataset.v; RD.sel = null; RD.start = null; RD.info = null; RD.hintOn = false; render(true); });
    $('gram').onclick = () => { RD.gramOn = !RD.gramOn; RD.info = null; render(true); };
    $('jaBtn').onclick = () => { RD.showJa = !RD.showJa; RD.fullOpen = false; render(true); };
    gest.addEventListener('pointerdown', e => {
      if (e.target.closest('button,.rdInfo')) return;
      const onBar = e.target.dataset.k === 'bar';
      if (!onBar) { e.preventDefault(); try { gest.setPointerCapture(e.pointerId); } catch (_) { } }
      const w = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList && x.classList.contains('w') && root.contains(x));
      d = { onBar, onLane: !onBar, wi: w ? [...$('strip').querySelectorAll('.w')].indexOf(w) : -1, x: e.clientX, y: e.clientY, g0: RD.gpos[RD.p], moved: false, axis: null };
    });
    gest.addEventListener('pointermove', e => {
      if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.axis && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) d.axis = Math.abs(dy) >= Math.abs(dx) * 2 ? 'y' : 'x';   // 縦は「はっきり縦」のときだけ
      if (d.axis === 'x' && !d.onBar) { d.moved = true; const target = d.g0 + dx; let best = 0; RD.gpos.forEach((g, i) => { if (Math.abs(g - target) < Math.abs(RD.gpos[best] - target)) best = i; }); move(best, true); }
      if (d.axis === 'y') {
        d.moved = true;
        if (!d.done && Math.abs(dy) >= 20) { d.done = true; sentence(dy < 0 ? 1 : -1); $('senNum').animate([{ color: 'var(--accent)', transform: 'scale(1.25)' }, { color: 'var(--muted)', transform: 'none' }], { duration: 500 }); }
      }
    });
    const end = e => { if (!d) return; if (!d.moved && e.type === 'pointerup' && d.onLane) { if (view() === 'read') infoTap(d.wi); else cut(); } d = null; };
    gest.addEventListener('pointerup', end); gest.addEventListener('pointercancel', end);
    $('bar').addEventListener('input', e => move(+e.target.value, true));
    $('say').onclick = say;
    $('up').onclick = () => sentence(-1); $('down').onclick = () => sentence(1);
    $('qPrev').onclick = () => goQ(RD.qi - 1, -1); $('qNext').onclick = () => goQ(RD.qi + 1, 1);
    { const box = $('q').parentElement; let dd = null;   // 問題文の枠を左右にフリックで前後の問題へ
      box.addEventListener('pointerdown', e => { dd = { x: e.clientX, y: e.clientY, done: false }; });
      box.addEventListener('pointermove', e => { if (!dd || dd.done) return; const dx = e.clientX - dd.x, dy = e.clientY - dd.y; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) { dd.done = true; dx < 0 ? goQ(RD.qi + 1, 1) : goQ(RD.qi - 1, -1); } });
      ['pointerup', 'pointercancel'].forEach(ev => box.addEventListener(ev, () => { dd = null; })); }
    $('back').textContent = opts.backLabel || '← もどる'; $('back').onclick = () => close();
    $('fontM').onclick = () => { const i = FK.indexOf(S.font); if (i > 0) { S.font = FK[i - 1]; save(); applyFont(); render(true); } };
    $('fontP').onclick = () => { const i = FK.indexOf(S.font); if (i < FK.length - 1) { S.font = FK[i + 1]; save(); applyFont(); render(true); } };
    $('hint').onclick = () => {   // ヒント：答えが何文目か＋役割の色と区切り（もう一度押すと消える）
      if (RD.hintOn) { RD.hintOn = false; render(true); return; }
      const q = qs[RD.qi];
      if (q && q.type === 'choice' && RD.hintPolicy !== 'grammar') { toast('この問題では、ヒントは使えません'); return; }
      RD.hintOn = RD.hintPolicy === 'grammar';
      if (!RD.hintQ.has(RD.qi)) { RD.hintQ.add(RD.qi); RD.hints++; }
      render(true);
    };
    $('check').onclick = grade;
    $('title').textContent = `${opts.label ? opts.label + '｜' : test ? 'TEST｜' : ''}${story.title || ''}${story.level && !opts.label ? `（Lv${story.level}）` : ''}`;

    function close(silent) {
      if (!cur || cur.root !== root) return;
      cur = null; RV.tok++; core.speech.stop(); ro.disconnect(); root.remove();
      if (!silent && opts.onClose) opts.onClose();
    }
    cur = { root, close };
    applyFont(); ro.observe($('lane')); render(true);
    core.events.report('reader', 'open', { title: story.title });
    return { close: () => close(true) };
  }
  return { open, close: () => cur && cur.close(true), get isOpen() { return !!cur; } };
}
