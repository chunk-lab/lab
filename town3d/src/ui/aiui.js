// AIまわりの画面:つなぎかた(キー取得の案内つき)と、住人とのおしゃべり
import { PROVIDERS } from '../core/ai.js';

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
export function openChat({ hud, name, role, first, ask, onClose, bus, getEn, setEn, translate, saveNote, maxLen = 80, low = false }) {
  const p = hud.panel(`<h2>${esc(name)}<small>${esc(role || '')}</small></h2>
    <div class="tw-enrow"><button class="tw-btn" data-a="en"></button><button class="tw-btn" data-a="lv"></button></div>
    <div class="tw-log" aria-live="polite"></div>
    <div class="tw-tools" hidden></div>
    <div class="tw-chatrow"><input class="tw-say" maxlength="${maxLen}" placeholder="話しかける"><button class="tw-btn main" data-a="send">送る</button></div>
    <div class="tw-actions"><button class="tw-btn" data-a="close">またね</button></div>`);
  if (low) p.classList.add('tw-low');   // 画面の下半分に出す(デート中は、上で2人が見えるように)
  const log = p.querySelector('.tw-log'), inp = p.querySelector('.tw-say'), tools = p.querySelector('.tw-tools');
  const enB = p.querySelector('[data-a="en"]'), lvB = p.querySelector('[data-a="lv"]');
  const showEn = () => { const e = getEn(); enB.textContent = 'English: ' + (e.on ? 'ON' : 'OFF'); enB.classList.toggle('on', e.on); lvB.hidden = !e.on; lvB.textContent = e.level === 'easy' ? 'やさしい' : 'ふつう'; };
  showEn();
  let sel = null;   // 選んだ単語・フレーズ { el, a, b }
  const clearSel = () => { if (sel) sel.el._w.forEach(w => w.classList.remove('sel')); sel = null; tools.hidden = true; };
  const add = (who, text, opt = {}) => {
    const d = document.createElement('div'); d.className = 'tw-msg ' + who;
    const t = document.createElement('span'); t.className = 'tw-t'; t.textContent = text; d.appendChild(t);
    log.appendChild(d); log.scrollTop = log.scrollHeight; d._t = t; return d;
  };
  // 英語の返事:単語ごとにタップできる形にして、「訳」ボタンを付ける
  const isJa = s => /[\u3040-\u30ff\u4e00-\u9fff]/.test(s);
  // 返事は「英語」と「日本語」の両方を持っておき、いまのモードに合わせて見せる(切りかえても、AIを呼びなおさない)
  const msgs = [];
  const render = d => {
    d.querySelectorAll('.tw-trbtn,.tw-tr').forEach(x => x.remove());
    d._w = [];
    const en = getEn().on;
    if (en && d._en) enable(d, d._en);
    else if (!en && d._ja) { d._text = d._ja; d._t.textContent = d._ja; }
    else if (d._en) enable(d, d._en);   // 日本語がないときは、あるほうをそのまま見せる
    else { d._text = d._ja || ''; d._t.textContent = d._ja || ''; }
  };
  const setPair = (d, parts) => {   // 「英語 ||| 日本語」(または逆)を、文字の種類で見わけて入れる
    d._en = d._ja = '';
    for (const x of parts.map(q => q.trim().replace(/^["「『]|["」』]$/g, '')).filter(Boolean)) { if (isJa(x)) d._ja = d._ja || x; else d._en = d._en || x; }
  };
  const enable = (d, text) => {
    d._text = text; d._w = [];
    d._t.textContent = '';
    text.split(/([A-Za-z][A-Za-z'’-]*)/).forEach(tok => {
      if (!tok) return;
      if (/^[A-Za-z]/.test(tok)) { const w = document.createElement('span'); w.className = 'tw-w'; w.dataset.i = d._w.length; w.textContent = tok; d._t.appendChild(w); d._w.push(w); }
      else d._t.appendChild(document.createTextNode(tok));
    });
    const b = document.createElement('button'); b.className = 'tw-trbtn'; b.dataset.a = 'tr'; b.textContent = '訳'; d.appendChild(b);
  };
  const showTools = () => {
    const txt = sel.el._w.slice(sel.a, sel.b + 1).map(w => w.textContent).join(' ');
    tools.innerHTML = `<span class="tw-seltxt">${esc(txt)}</span><button class="tw-btn main" data-a="savesel">${sel.a === sel.b ? '単語' : 'フレーズ'}をほぞん</button><button class="tw-btn" data-a="savesent">文ごとほぞん</button><button class="tw-btn" data-a="unsel">×</button>`;
    tools.hidden = false;
  };
  const pick = w => {
    const d = w.closest('.tw-msg'), i = +w.dataset.i;
    if (sel && sel.el === d && sel.a === sel.b && i !== sel.a) { sel.b = Math.max(sel.a, i); sel.a = Math.min(sel.a, i); }
    else { clearSel(); sel = { el: d, a: i, b: i }; }
    d._w.forEach((x, k) => x.classList.toggle('sel', k >= sel.a && k <= sel.b));
    showTools();
  };
  const toast = msg => { const x = tools; x.hidden = false; x.innerHTML = `<span class="tw-seltxt">${esc(msg)}</span>`; setTimeout(() => { if (!sel) x.hidden = true; }, 1600); };
  { const d0 = add('npc', first); d0._ja = first; msgs.push(d0); render(d0); }
  let busy = false;
  const send = async () => {
    const t = inp.value.trim(); if (!t || busy) return;
    inp.value = ''; busy = true; clearSel(); add('me', t); try { bus && bus.emit('chat:say', { name, text: t }); } catch (e) { }
    const en = getEn().on;
    const wait = add('npc', '…'); wait.classList.add('wait');
    try {
      const out = await ask(t, part => { wait.classList.remove('wait'); wait._t.textContent = part.split('|||')[0].trim(); log.scrollTop = log.scrollHeight; });
      setPair(wait, String(out).split('|||')); msgs.push(wait); render(wait);
      log.scrollTop += wait.getBoundingClientRect().top - log.getBoundingClientRect().top - 6;   // 長い返事は、頭から読めるように
    } catch (e) { wait._t.textContent = e.message || 'うまく話せなかったよ'; wait.classList.add('err'); }
    wait.classList.remove('wait'); busy = false; inp.focus();
  };
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); } });
  p.addEventListener('click', async e => {
    const w = e.target.closest('.tw-w'); if (w) return pick(w);
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'send') send();
    else if (a === 'close') hud.closePanel();
    else if (a === 'en') { const c = getEn(); setEn({ on: !c.on, level: c.level }); }
    else if (a === 'lv') { const c = getEn(); setEn({ on: c.on, level: c.level === 'easy' ? 'normal' : 'easy' }); showEn(); }
    else if (a === 'unsel') clearSel();
    else if (a === 'savesel' && sel) { const txt = sel.el._w.slice(sel.a, sel.b + 1).map(x => x.textContent).join(' '), single = sel.a === sel.b, sentence = sel.el._text; clearSel(); toast(saveNote({ kind: single ? 'word' : 'phrase', text: txt, sentence })); }
    else if (a === 'savesent' && sel) { const sentence = sel.el._text; clearSel(); toast(saveNote({ kind: 'sentence', text: sentence, sentence })); }
    else if (a === 'tr') {
      const d = b.closest('.tw-msg'); let tr = d.querySelector('.tw-tr');
      if (tr) { tr.hidden = !tr.hidden; return; }
      tr = document.createElement('div'); tr.className = 'tw-tr'; tr.textContent = d._ja || '…'; d.appendChild(tr);
      if (!d._ja) { try { d._ja = await translate(d._text); tr.textContent = d._ja; } catch (err) { tr.textContent = err.message || '訳せなかったよ'; } }
      log.scrollTop = log.scrollHeight;
    }
  });
  // 英日の切りかえ(上バーのボタンからも)が来たら、いまある返事も全部切りかえる。パネルを閉じたら受け取りをやめる
  const offLang = bus.on('lang', () => { clearSel(); showEn(); msgs.forEach(render); });
  const offClose = bus.on('ui:panelClosed', () => { offLang(); offClose(); });
  setTimeout(() => inp.focus(), 50);
}
