// AIまわりの画面:つなぎかた(キー取得の案内つき)と、住人とのおしゃべり
import { PROVIDERS } from '../core/ai.js';
import { portrait, charColor } from './portraits.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function openAiSetup({ hud, ai, onDone }) {
  let prov = ai.state.provider;
  const render = () => {
    const P = PROVIDERS[prov], st = ai.state;
    const p = hud.panel(`<h2>AIのキーを入れる</h2>
      <p class="tw-note">住人と自由におしゃべりしたり、そら君に英語の相談をしたりするには、<b>自分のAIのキー</b>(AIを使うための合言葉のような長い文字)が必要です。料金がかかる場合は、あなたのAI会社のアカウントにかかります。町の運営は、キーもお金も受け取りません。</p>
      <p class="tw-note"><b>はじめてなら Gemini がおすすめ</b>(無料で使えます)。下で会社を選ぶと、作り方が出ます。</p>
      <div class="tw-prov">${Object.entries(PROVIDERS).map(([id, v]) => `<button class="tw-btn${id === prov ? ' on' : ''}" data-p="${id}"><b>${esc(v.label)}</b><small>${esc(v.badge)}</small></button>`).join('')}</div>
      <h3 class="tw-h3">作り方(${esc(P.label)})</h3>
      <ol class="tw-steps">${P.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <p class="tw-note">💰 ${esc(P.note)}</p>
      <a class="tw-btn tw-link" href="${P.keyUrl}" target="_blank" rel="noopener noreferrer">キーをつくるページを開く ↗</a>
      <input class="tw-key" type="password" autocomplete="off" spellcheck="false" placeholder="${esc(P.placeholder)}" value="${st.provider === prov && st.hasKey ? '••••••••••••' : ''}" data-saved="${st.provider === prov && st.hasKey ? 1 : 0}">
      <details class="tw-adv"><summary>くわしい設定</summary>
        <label>モデル名<input class="tw-model" placeholder="${esc(P.model)}" value="${esc(st.provider === prov ? st.model : '')}"></label>
        <label>1日の上限回数<input class="tw-cap" type="number" min="1" max="1000" value="${st.cap}"></label>
        <p class="tw-note">きょう ${st.used} / ${st.cap} 回つかいました。</p></details>
      <div class="tw-status" role="status"></div>
      <div class="tw-actions"><button class="tw-btn main" data-a="test">つなげてためす</button><button class="tw-btn" data-a="clear">キーを消す</button><button class="tw-btn" data-a="close">とじる</button></div>
      <details class="tw-adv"><summary>うまくいかないとき</summary><ul class="tw-steps">
        <li>キーの前後に空白や改行が入っていないか確かめる(もう一度コピーし直すのが早い)</li>
        <li>上で選んだ会社と、キーを作った会社が同じか確かめる</li>
        <li>OpenAI・Claude は、チャージ(支払い)をしていないと使えない</li>
        <li>Gemini で「回数の上限」と出たら、その日の無料分を使い切っています。次の日にまた使えます</li>
        <li>それでもだめなら、キーを作り直して貼り直す</li></ul></details>
      <p class="tw-note small">🔒 キーはこの端末の中にだけ保存します。ほかの人に見せないでね(もれたら、キーを作ったページで消して作り直せばOK)。会話の内容は、選んだAI会社に送られるので、個人情報は書かないでね。</p>`);
    const key = p.querySelector('.tw-key'), status = p.querySelector('.tw-status');
    key.addEventListener('keydown', e => e.stopPropagation());
    key.addEventListener('focus', () => { if (key.dataset.saved === '1') { key.value = ''; key.dataset.saved = '0'; } });
    for (const el of p.querySelectorAll('input')) el.addEventListener('keydown', e => e.stopPropagation());
    p.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.p) { prov = b.dataset.p; return render(); }
      if (b.dataset.a === 'close') return hud.closePanel();
      if (b.dataset.a === 'clear') { ai.clear(); status.textContent = 'キーを消しました。'; key.value = ''; key.dataset.saved = '0'; return; }
      if (b.dataset.a === 'test') {
        const typed = key.dataset.saved === '1' ? undefined : key.value.trim();
        if (typed === '') { status.textContent = 'キーを貼ってください。'; return; }
        ai.configure({ provider: prov, key: typed, model: p.querySelector('.tw-model').value, cap: p.querySelector('.tw-cap').value });
        status.textContent = 'つないでいます…'; status.style.color = ''; b.disabled = true;
        try {
          const r = await ai.chat({ system: 'あなたは町の住人です。日本語で、10文字ほどであいさつしてください。', messages: [{ role: 'user', text: 'こんにちは' }], maxTokens: 60, test: true });
          status.textContent = `つながりました!「${r}」`;
          setTimeout(() => { hud.closePanel(); onDone?.(); }, 1200);
        } catch (err) { status.textContent = err.message || 'つながりませんでした'; status.style.color = '#b0605a'; b.disabled = false; }
      }
    });
  };
  render();
}

// 住人との自由なおしゃべり。ask(text) → Promise<string>
// ストーリーの会話と同じ窓。1セリフ1窓で、左右にフリックすると、自分と相手のセリフが順にめくれる。
export function openChat({ hud, name, role, first, ask, onClose, bus, getEn, setEn, translate, saveNote, onSeen, maxLen = 80, low = false, meName = 'あなた' }) {
  const pic = portrait(name), col = charColor(name);
  const p = hud.panel(`<div class="tc">
    <div class="tc-top"><button class="tw-btn" data-a="en"></button><button class="tw-btn" data-a="lv"></button><span class="tc-sp"></span><button class="tw-btn" data-a="close">${low ? 'おしゃべりをおわる' : 'とじる ✕'}</button></div>
    <div class="tw-tools tc-tools" hidden></div>
    <div class="tc-win"><img class="tc-pic" alt=""><div class="tc-name"></div><button class="tc-tr" data-a="tr" hidden>訳</button><div class="tc-text" aria-live="polite"></div>
      <div class="tc-foot"><span><button class="tc-nav" data-a="prev">◀</button><span class="tc-pos"></span><button class="tc-nav" data-a="next">▶</button></span><button class="tc-latest" data-a="latest" hidden>▼</button></div></div>
    <div class="tc-row"><input class="tw-say" maxlength="${maxLen}" placeholder="話しかける"><button class="tw-btn main" data-a="send">送る</button></div></div>`, null, { sticky: true });
  if (onClose && bus) { const offC = bus.on('ui:panelClosed', () => { offC && offC(); try { onClose(); } catch (e) { } }); }
  const q = x => p.querySelector(x);
  const win = q('.tc-win'), nameEl = q('.tc-name'), picEl = q('.tc-pic'), textEl = q('.tc-text'), trB = q('.tc-tr'), posEl = q('.tc-pos'), latestB = q('.tc-latest'), row = q('.tc-row'), inp = q('.tw-say'), tools = q('.tc-tools');
  const enB = q('[data-a="en"]'), lvB = q('[data-a="lv"]');
  const showEn = () => { const e = getEn(); enB.textContent = 'English: ' + (e.on ? 'ON' : 'OFF'); enB.classList.toggle('on', e.on); lvB.hidden = !e.on; lvB.textContent = e.level === 'easy' ? 'やさしい' : 'ふつう'; };
  showEn();
  const isJa = s => /[぀-ヿ一-鿿]/.test(s);
  // セリフの一覧(自分と相手、ぜんぶ)。相手のセリフは「英語」と「日本語」の両方を持つ
  const items = [{ who: 'npc', en: '', ja: first, flip: false }];
  let idx = 0, words = [], curText = '', sel = null, busy = false;
  const clearSel = () => { sel = null; words.forEach(w => w.classList.remove('sel')); tools.hidden = true; };
  const langOf = it => { const en = getEn().on; let l = en && it.en ? 'en' : !en && it.ja ? 'ja' : it.en ? 'en' : 'ja'; if (it.flip) l = l === 'en' ? 'ja' : 'en'; return l; };
  function draw() {
    const it = items[idx], last = idx === items.length - 1, me = it.who === 'me';
    clearSel(); words = [];
    win.classList.toggle('me', me); win.classList.toggle('npc', !me); win.classList.toggle('wait', !!it.wait); win.classList.toggle('err', !!it.err);
    nameEl.textContent = me ? meName : name;
    if (!me && pic) { picEl.src = pic; picEl.hidden = false; } else picEl.hidden = true;
    textEl.style.color = me ? '#fff' : col;
    textEl.scrollTop = 0; textEl.textContent = '';
    if (me) { curText = it.text; textEl.textContent = it.text; }
    else if (it.wait) { curText = ''; textEl.textContent = it.part || '…'; }
    else if (it.err) { curText = ''; textEl.textContent = it.msg; }
    else {
      const l = langOf(it), t = l === 'en' ? it.en : it.ja; curText = t || '';
      if (l === 'en') curText.split(/([A-Za-z][A-Za-z'’-]*)/).forEach(tok => { if (!tok) return; if (/^[A-Za-z]/.test(tok)) { const w = document.createElement('span'); w.className = 'tw-w'; w.dataset.i = words.length; w.textContent = tok; textEl.appendChild(w); words.push(w); } else textEl.appendChild(document.createTextNode(tok)); });
      else textEl.textContent = t || '…';
    }
    trB.hidden = me || !!it.wait || !!it.err || !(it.en || (it.ja && it.flip));
    trB.textContent = !me && !it.wait && !it.err && langOf(it) === 'en' ? '訳' : '英';
    posEl.textContent = ` ${idx + 1} / ${items.length} `;
    q('[data-a="prev"]').disabled = idx === 0; q('[data-a="next"]').disabled = last;
    latestB.hidden = last; row.hidden = !last;
  }
  draw();
  const go = i => { if (i < 0 || i >= items.length || i === idx) return; idx = i; draw(); };
  // フリック: 左へ=つぎ(新しい方)、右へ=前
  { let sx = 0, sy = 0, st = 0, on = false;
    win.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; on = true; sx = e.clientX; sy = e.clientY; st = Date.now(); });
    win.addEventListener('pointerup', e => { if (!on) return; on = false; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.3 && Date.now() - st < 700) go(idx + (dx < 0 ? 1 : -1)); });
    win.addEventListener('pointercancel', () => { on = false; }); }
  const setPair = (d, parts) => {
    d.en = d.ja = '';
    for (const x of parts.map(t => t.trim().replace(/^["「『]|["」』]$/g, '')).filter(Boolean)) { if (isJa(x)) d.ja = d.ja || x; else d.en = d.en || x; }
  };
  const showTools = () => {
    const txt = words.slice(sel.a, sel.b + 1).map(w => w.textContent).join(' ');
    tools.innerHTML = `<span class="tw-seltxt">${esc(txt)}</span><button class="tw-btn main" data-a="savesel">${sel.a === sel.b ? '単語' : 'フレーズ'}をほぞん</button><button class="tw-btn" data-a="savesent">文ごとほぞん</button><button class="tw-btn" data-a="unsel">×</button>`;
    tools.hidden = false;
  };
  const pick = w => {
    const i = +w.dataset.i;
    if (sel && sel.a === sel.b && i !== sel.a) { sel.b = Math.max(sel.a, i); sel.a = Math.min(sel.a, i); } else sel = { a: i, b: i };
    words.forEach((x, k) => x.classList.toggle('sel', k >= sel.a && k <= sel.b)); showTools();
  };
  const toast = msg => { tools.hidden = false; tools.innerHTML = `<span class="tw-seltxt">${esc(msg)}</span>`; setTimeout(() => { if (!sel) tools.hidden = true; }, 1600); };
  const send = async () => {
    const t = inp.value.trim(); if (!t || busy) return;
    inp.value = ''; busy = true; inp.blur();
    items.push({ who: 'me', text: t }); const w = { who: 'npc', wait: true, part: '', en: '', ja: '', flip: false }; items.push(w); idx = items.length - 1; draw();
    try { bus && bus.emit('chat:say', { name, text: t }); } catch (e) { }
    try {
      const out = await ask(t, part => { w.part = part.split('|||')[0].trim(); if (items[idx] === w) textEl.textContent = w.part; });   // 届いた分から、そのまま出す
      setPair(w, String(out).split('|||')); w.wait = false;
    } catch (e) { w.wait = false; w.err = true; w.msg = e.message || 'うまく話せなかったよ'; }
    if (items[idx] === w) draw(); else if (!w.err) { /* 前のセリフを見ている間に届いた: ▼で最新へ */ latestB.hidden = false; posEl.textContent = ` ${idx + 1} / ${items.length} `; }
    busy = false;
  };
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); } });
  p.addEventListener('click', async e => {
    const w = e.target.closest('.tw-w'); if (w) return pick(w);
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a, it = items[idx];
    if (a === 'send') send();
    else if (a === 'close') hud.closePanel();
    else if (a === 'prev') go(idx - 1);
    else if (a === 'next') go(idx + 1);
    else if (a === 'latest') { idx = items.length - 1; draw(); }
    else if (a === 'en') { const c = getEn(); setEn({ on: !c.on, level: c.level }); }
    else if (a === 'lv') { const c = getEn(); setEn({ on: c.on, level: c.level === 'easy' ? 'normal' : 'easy' }); showEn(); }
    else if (a === 'unsel') clearSel();
    else if (a === 'savesel' && sel) { const txt = words.slice(sel.a, sel.b + 1).map(x => x.textContent).join(' '), single = sel.a === sel.b, sentence = curText; clearSel(); toast(saveNote({ kind: single ? 'word' : 'phrase', text: txt, sentence })); }
    else if (a === 'savesent' && sel) { const sentence = curText; clearSel(); toast(saveNote({ kind: 'sentence', text: sentence, sentence })); }
    else if (a === 'tr' && it && it.who === 'npc') {   // 英語と日本語を、同じ窓の中で切りかえる
      it.flip = !it.flip; draw();
      if (langOf(it) === 'ja' && !it.ja && it.en) { try { it.ja = await translate(it.en); } catch (err) { it.ja = err.message || '訳せなかったよ'; } if (items[idx] === it) draw(); }
      if (langOf(it) === 'ja' && it.ja && it.en && !it._seen && onSeen) { it._seen = 1; try { onSeen(it.en, it.ja); } catch (e) { } }   // 訳を見た英文は、あしたのふりかえりに出す
    }
  });
  // 英日の切りかえ(上のボタンからも)が来たら、いまの窓も切りかえる。パネルを閉じたら受け取りをやめる
  const offLang = bus.on('lang', () => { items.forEach(i => { i.flip = false; }); showEn(); draw(); });
  const offClose = bus.on('ui:panelClosed', () => { offLang(); offClose(); window.removeEventListener('resize', onRs); });
  // キーボードが出ても窓は動かさない: 高さを開いた時の画面の高さに固定して、キーボードは上から被せる。入力欄は画面の上寄り(キーボードに隠れない位置)
  const tc = q('.tc'); let fh = window.innerHeight; tc.style.setProperty('--fh', fh + 'px');
  const onRs = () => { if (window.innerHeight > fh) { fh = window.innerHeight; tc.style.setProperty('--fh', fh + 'px'); } };
  window.addEventListener('resize', onRs);
}
