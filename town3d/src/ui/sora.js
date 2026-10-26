// そら君ノート:単語や表現を聞くと、そら君(AI)が「例文・場面・ちがい・練習」にまとめてくれる。
// 長いので、ふきだしではなく全画面のノートで見せる。タブで分けて、各タブは最初は3つだけ(「もっと見る」で全部)。
// 聞いたことは、この端末の中に残す(あとで見返せる)。
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KEY = 'soraNote', MAXH = 40, FIRST = 3;
const TABS = [['ex', '例文'], ['scene', '場面'], ['diff', 'ちがい'], ['study', '練習']];

let cssDone = false;
function css() {
  if (cssDone) return; cssDone = true;
  const st = document.createElement('style');
  st.textContent = `
.tw-card.sn-full{width:min(96%,520px);height:92%;max-height:92%;display:flex;flex-direction:column;padding:12px 14px;gap:8px;overflow:hidden}
.sn-head{display:flex;align-items:center;gap:8px}.sn-head h2{margin:0;font-size:18px;flex:1}
.sn-x{width:36px;height:36px;padding:0;font-size:16px}
.sn-ask{display:flex;gap:6px}.sn-ask input{flex:1;min-width:0;font:inherit;font-size:16px;padding:9px 12px;border:2px solid #eadff3;border-radius:14px;background:#fff;color:inherit}
.sn-ask .tw-btn{padding:8px 14px;flex:none}
.sn-hist{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;flex:none;scrollbar-width:none}.sn-hist::-webkit-scrollbar{display:none}
.sn-hist button{flex:none;padding:5px 11px;font-size:12px;box-shadow:none;border:2px solid #eadff3}
.sn-body{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px}
.sn-top{display:flex;align-items:flex-start;gap:8px}.sn-top b{font-size:22px;font-family:Georgia,serif}.sn-top span{font-size:13px;color:#8d7f9e}
.sn-say{background:#fff;border-radius:14px;padding:8px 12px;font-size:13px;font-weight:700;position:relative}
.sn-tabs{display:flex;gap:4px;flex:none}.sn-tabs button{flex:1;padding:8px 0;font-size:13px;box-shadow:none;border:2px solid #eadff3}.sn-tabs button.on{background:var(--tw-pink);border-color:var(--tw-pink);color:#fff}
.sn-list{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:2px 2px 10px;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.sn-item{background:#fff;border-radius:14px;padding:10px 12px;font-size:14px;line-height:1.5}
.sn-item .en{font-family:Georgia,serif;font-size:16px;font-weight:700;color:#3d3150}
.sn-item .ja{font-size:13px;color:#7d6f8e}.sn-item .nt{font-size:12px;color:#a08fb8;margin-top:2px}
.sn-item .ac{display:flex;gap:6px;margin-top:6px}.sn-item .ac button{padding:5px 10px;font-size:12px;box-shadow:none;border:2px solid #eadff3}
.sn-more{align-self:center;padding:7px 16px;font-size:13px}
.sn-empty{color:#8d7f9e;font-size:13px;text-align:center;padding:20px 8px;line-height:1.7}
.sn-wait{text-align:center;padding:30px 0;color:#8d7f9e;font-weight:700}
.sn-games{display:flex;flex-wrap:wrap;gap:6px}.sn-games button{padding:7px 12px;font-size:13px}
`;
  document.head.appendChild(st);
}

function speak(t) {
  try { const s = window.speechSynthesis; if (!s) return; s.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = 0.9; s.speak(u); } catch (e) { }
}

const SYSTEM = level => [
  'あなたは「そら」。ほしみや町に住む、英語が得意で面倒見のいい男の子。日本人の英語学習者の相談にのる。',
  '相談された単語・表現(英語でも日本語でもよい。日本語のときは、それにぴったりの英語表現を選ぶ)について、次のJSONだけを出力する。前後に文章やコードブロックは付けない。',
  '{"word":"見出しの英語","ja":"主な意味(短く)","say":"そら君の一言(くだけた口調で30文字以内)","examples":[{"en":"例文","ja":"自然な訳","note":"ポイント(20文字以内、なければ空)"}],"scenes":["どんな場面で使うか(1つ40文字以内)"],"diffs":[{"vs":"似た表現","point":"ちがい(60文字以内)"}],"study":["身につける練習のしかた(1つ50文字以内)"]}',
  '- examples は5〜6個。日常でそのまま使える自然な文。意味がいくつかあるなら、意味ごとに入れる。',
  level === 'easy' ? '- 例文はやさしめ(中学英語くらい)の単語で。' : '- 例文は自然な日常英語で。',
  '- scenes は3〜5個、diffs は2〜4個(似た表現がなければ、まちがえやすい使い方)、study は3〜4個。',
  '- 日本語の部分は、やさしく、短く。',
].join('\n');

function parse(txt) {
  const a = txt.indexOf('{'), b = txt.lastIndexOf('}'); if (a < 0 || b <= a) return null;
  try {
    const d = JSON.parse(txt.slice(a, b + 1));
    const arr = x => Array.isArray(x) ? x : [];
    return {
      word: String(d.word || ''), ja: String(d.ja || ''), say: String(d.say || ''),
      examples: arr(d.examples).filter(x => x && x.en).map(x => ({ en: String(x.en), ja: String(x.ja || ''), note: String(x.note || '') })),
      scenes: arr(d.scenes).map(String).filter(Boolean),
      diffs: arr(d.diffs).filter(x => x && (x.vs || x.point)).map(x => ({ vs: String(x.vs || ''), point: String(x.point || '') })),
      study: arr(d.study).map(String).filter(Boolean),
    };
  } catch (e) { return null; }
}

// openSoraNote({ hud, ai, storage, level, onNote(it)→メッセージ, onSay(text), games:[{label,fn}], openSetup(onDone), first })
export function openSoraNote(o) {
  css();
  const { hud, ai, storage } = o;
  let hist = storage.get(KEY) || [], cur = hist[0] || null, tab = 'ex', more = {}, busy = false;
  const p = hud.panel(`<div class="sn-head"><h2>📘 そら君ノート</h2>${o.onDaily ? '<button class="tw-btn" data-a="daily" style="margin-left:auto;padding:6px 10px;font-size:12px">🌙 今日はここまで</button>' : ''}<button class="tw-btn sn-x" data-a="close" aria-label="とじる">✕</button></div>
    <div class="sn-ask"><input class="sn-q" maxlength="60" placeholder="単語や表現(英語でも日本語でも)" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="tw-btn main" data-a="ask">聞く</button></div>
    <div class="sn-hist"></div><div class="sn-body"></div>`, null, { sticky: true });
  const card = p.querySelector('.tw-card'); card.classList.add('sn-full');
  const q = p.querySelector('.sn-q'), body = p.querySelector('.sn-body'), hb = p.querySelector('.sn-hist');
  q.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); ask(); } });
  const save = () => { try { storage.set(KEY, hist.slice(0, MAXH)); } catch (e) { } };

  function drawHist() { hb.innerHTML = hist.map((h, i) => `<button class="tw-btn${h === cur ? ' on' : ''}" data-h="${i}">${esc(h.data.word || h.q)}</button>`).join(''); hb.hidden = !hist.length; }
  function draw() {
    drawHist();
    if (busy) { body.innerHTML = `<div class="sn-wait">そら君がまとめてるよ…</div>`; return; }
    if (!ai.ready) {
      body.innerHTML = `<div class="sn-empty">そら君に相談するには、自分のAIのキーが必要だよ。<br>キーの作り方は、画面の順番どおりにやれば5分くらい。<br><br><button class="tw-btn main" data-a="setup">キーの作り方を見る</button></div>`;
      return;
    }
    if (!cur) { body.innerHTML = `<div class="sn-empty">使いたい単語や表現を入れてね。<br>例文・使う場面・似た表現とのちがい・練習のしかたを、そら君がまとめるよ。<br><br>例:「apparently」「気をつけてね」「make sense」</div>`; return; }
    const d = cur.data, items = listOf(d, tab), n = more[tab] ? items.length : Math.min(FIRST, items.length);
    body.innerHTML = `<div class="sn-top"><div style="flex:1"><b>${esc(d.word || cur.q)}</b><br><span>${esc(d.ja)}</span></div><button class="tw-btn" data-a="word" style="padding:6px 10px;font-size:12px">＋ノート</button></div>
      ${d.say ? `<div class="sn-say">そら「${esc(d.say)}」</div>` : ''}
      <div class="sn-tabs">${TABS.map(([k, t]) => `<button class="tw-btn${k === tab ? ' on' : ''}" data-t="${k}">${t}</button>`).join('')}</div>
      <div class="sn-list">${items.slice(0, n).map(it => it).join('') || '<div class="sn-empty">ここは、まとめがなかったよ</div>'}
        ${items.length > n ? `<button class="tw-btn sn-more" data-a="more">もっと見る(あと${items.length - n})</button>` : ''}
        ${tab === 'study' && o.games?.length ? `<div class="sn-item"><div class="nt" style="margin:0 0 6px">町で練習する</div><div class="sn-games">${o.games.map((g, i) => `<button class="tw-btn" data-g="${i}">${esc(g.label)}</button>`).join('')}</div></div>` : ''}</div>`;
  }
  function listOf(d, t) {
    if (t === 'ex') return d.examples.map((x, i) => `<div class="sn-item"><div class="en">${esc(x.en)}</div><div class="ja">${esc(x.ja)}</div>${x.note ? `<div class="nt">💡 ${esc(x.note)}</div>` : ''}<div class="ac"><button class="tw-btn" data-say="${i}">🔊 聞く</button><button class="tw-btn" data-add="${i}">＋ノート</button></div></div>`);
    if (t === 'scene') return d.scenes.map(x => `<div class="sn-item">${esc(x)}</div>`);
    if (t === 'diff') return d.diffs.map(x => `<div class="sn-item"><div class="en">${esc(x.vs)}</div><div>${esc(x.point)}</div></div>`);
    return d.study.map(x => `<div class="sn-item">${esc(x)}</div>`);
  }
  async function ask(text) {
    const t = (text ?? q.value).trim(); if (!t || busy) return;
    if (!ai.ready) { draw(); return; }
    busy = true; q.value = ''; tab = 'ex'; more = {}; draw();
    try {
      const out = await ai.chat({ system: SYSTEM(o.level), messages: [{ role: 'user', text: t }], maxTokens: 1600, maxChars: 8000 });
      const d = parse(out); if (!d || !d.examples.length) throw new Error('うまくまとめられなかった…もう一回聞いてみて');
      hist = hist.filter(h => (h.data.word || h.q).toLowerCase() !== (d.word || t).toLowerCase());
      cur = { q: t, at: Date.now(), data: d }; hist.unshift(cur); save();
      o.onSay?.(d.say || `「${d.word || t}」、まとめたよ!`);
    } catch (e) { busy = false; draw(); body.insertAdjacentHTML('afterbegin', `<div class="sn-empty" style="color:#b0605a">${esc(e.message || 'うまくいかなかったよ')}</div>`); return; }
    busy = false; draw();
  }
  p.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'close') return hud.closePanel();
    if (a === 'daily') { hud.closePanel(); return o.onDaily(); }
    if (a === 'ask') return ask();
    if (a === 'setup') return o.openSetup?.(() => openSoraNote(o));
    if (a === 'more') { more[tab] = true; return draw(); }
    if (a === 'word' && cur) { const w = cur.data.word || cur.q; b.textContent = o.onNote({ kind: /\s/.test(w.trim()) ? 'phrase' : 'word', text: w, meaning: cur.data.ja }) ? '登録したよ' : '＋ノート'; b.disabled = true; return; }
    if (b.dataset.t) { tab = b.dataset.t; return draw(); }
    if (b.dataset.h != null) { cur = hist[+b.dataset.h]; tab = 'ex'; more = {}; return draw(); }
    if (b.dataset.say != null && cur) return speak(cur.data.examples[+b.dataset.say].en);
    if (b.dataset.add != null && cur) { const x = cur.data.examples[+b.dataset.add]; o.onNote({ kind: 'sentence', text: x.en, meaning: x.ja }); b.textContent = '登録したよ'; b.disabled = true; return; }
    if (b.dataset.g != null) { const g = o.games[+b.dataset.g]; hud.closePanel(); g.fn(); }
  });
  draw();
  if (o.first) ask(o.first);
  else setTimeout(() => q.focus(), 60);
}
