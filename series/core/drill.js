/* 勉強ノート＝ドリルだけをする画面。
   言葉は、最初に1回だけ分ける：わからない／わかるけど使えない(意味は分かるが口から出ない)／もう知っている・押しまちがい(外す)。
   外す以外は、ノートから消さずに、日をあけて何度も出す(まちがい率が高いほど間隔を短く)。「覚えたつもり」で卒業はさせない。
   わからない＝英語を見て意味を選ぶ／使えない＝日本語を見て英語を選ぶ。わからないで続けて正解したら、使えない(言える形)へ進む。
   ノートの一覧・登録・書き出しは、この画面の「言葉の一覧」から。 */
import { KINDS } from './notebook.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DAY = 864e5;
const IV = { unk: [1, 2, 4, 7, 14, 30, 60], cant: [2, 4, 8, 16, 30, 60] };   // 正解が続くたびに広げる間隔(日)
const SN = { unk: 'わからない', cant: '使えない', off: '外した' };
const SRC = { stream: 'ストミン', chunkchunk: '今スラ！', eigonou: '英ラボ', cards: 'カード', town3d: '3Dの町', note: '手打ち' };
const dayNo = t => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / DAY);
const shuffle = a => a.slice().sort(() => Math.random() - 0.5);
const drillable = x => x.ja && (x.kind === 'word' || x.kind === 'phrase');
// 答えたあとの記録：正解なら間隔を広げ、まちがえたら戻す。同じ日に何回正解しても1回分しか進めない
export function advance(sr, ok, now = Date.now()) {
  const s = Object.assign({ box: 0, n: 0, w: 0, ok: 0, last: 0 }, sr), same = s.last && dayNo(s.last) === dayNo(now);
  s.n++; s.last = now;
  if (ok) { s.ok++; if (!same) s.box++; } else { s.w++; s.ok = 0; s.box = Math.max(0, s.box - 2); }
  if (s.s === 'unk' && ok && s.box >= 3) { s.s = 'cant'; s.box = 1; }
  if (!ok) { s.due = now + 10 * 60e3; return s; }
  const tb = IV[s.s] || IV.unk, d = tb[Math.min(tb.length - 1, Math.max(0, s.box - 1))], rate = s.n >= 4 ? s.w / s.n : 0;
  s.due = now + Math.max(0.5, d * (1 - Math.min(0.5, rate))) * DAY;
  return s;
}
const CSS = `.dr-card{text-align:center;padding:18px 10px}.dr-card small{color:#789}.dr-card h2{font-size:30px;margin:8px 0}.dr-card p{margin:4px 0 12px;color:#456;font-size:16px}
.dr-ch{display:grid;gap:8px;margin:12px 0}.dr-ch button{padding:13px 10px;font-size:16px;border-radius:12px;border:1px solid #bcd;background:#fff;color:#123;text-align:left}
.dr-ch button.ok{background:#d8f5de;border-color:#4a4}.dr-ch button.ng{background:#fde0e0;border-color:#c55}
.dr-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:8px 0}.dr-row .cs-btn{flex:1 1 auto}
.dr-st{display:inline-block;font-size:11px;padding:1px 6px;border-radius:8px;background:#e8eef5;color:#456;margin-left:6px}.dr-st.unk{background:#fde7d6}.dr-st.cant{background:#fff3c4}.dr-st.off{background:#e5e5e5}
.dr-n{display:flex;gap:6px;justify-content:center;margin:6px 0}.dr-n b{font-size:20px}`;
export function createDrill(core) {
  const nb = core.notebook;
  let t0 = Date.now(), ov = null, view = 'home', offs = [], Q = [], stat = { ok: 0, ng: 0 }, opt = {}, lkind = 'word';
  const find = id => nb.list().find(x => x.id === id);
  const pool = () => nb.list().filter(drillable);
  const counts = () => {
    const L = pool(), on = L.filter(x => !(x.sr && x.sr.s === 'off')), now = Date.now();
    return { fresh: on.filter(x => !x.sr), due: on.filter(x => x.sr && x.sr.due <= now), unk: on.filter(x => x.sr && x.sr.s === 'unk').length, cant: on.filter(x => x.sr && x.sr.s === 'cant').length, off: L.filter(x => x.sr && x.sr.s === 'off').length, noJa: nb.list().filter(x => (x.kind === 'word' || x.kind === 'phrase') && !x.ja).length };
  };
  function close() { if (!ov) return; ov.remove(); ov = null; offs.forEach(f => f()); offs = []; }
  function open(o = {}) {
    opt = o; if (ov) close();
    if (!document.getElementById('dr-css')) { const s = document.createElement('style'); s.id = 'dr-css'; s.textContent = CSS; document.head.appendChild(s); }
    ov = document.createElement('div'); ov.className = 'cs-ov cs-study-ov';
    ov.innerHTML = `<div class="cs-study" role="dialog" aria-label="勉強ノート"><header><button class="cs-x dr-back" aria-label="もどる" hidden>←</button><b>勉強ノート</b><button class="cs-x" aria-label="とじる">✕</button></header><main></main></div>`;
    core.ui.root.appendChild(ov); core.ui.scrollHint && core.ui.scrollHint(ov.querySelector('main'));
    ov.querySelectorAll('.cs-x')[1].onclick = close; ov.addEventListener('click', e => { if (e.target === ov) close(); });
    ov.querySelector('.dr-back').onclick = () => { view = 'home'; draw(); };
    offs.push(nb.onChange(() => { if (view === 'list') draw(true); }));
    view = o.kind || o.list ? 'list' : 'home'; if (o.kind) lkind = o.kind; draw();
  }
  function draw(keep) {
    if (!ov) return; const m = ov.querySelector('main'), top = keep ? m.scrollTop : 0;
    ov.querySelector('.dr-back').hidden = view === 'home';
    if (view === 'quiz') { m.scrollTop = 0; return; }
    m.innerHTML = view === 'home' ? home() : list();
    bind(m); m.scrollTop = top;
  }
  function home() {
    const c = counts(), n = c.fresh.length + c.due.length;
    return `<section class="cs-panel"><div class="dr-n"><span>復習 <b>${c.due.length}</b></span><span>新しく分ける <b>${c.fresh.length}</b></span></div>
      ${n ? `<button class="cs-btn cs-go cs-big" data-start>はじめる(${Math.min(12, c.due.length) + Math.min(5, c.fresh.length)}個)</button>` : '<p class="cs-sub" style="text-align:center">いまやる分はありません。時間がたつと、また出てきます。</p>'}
      <p class="cs-sub" style="text-align:center">わからない ${c.unk} ・ わかるけど使えない ${c.cant} ・ 外した ${c.off}</p>
      ${c.noJa ? `<p class="cs-note">日本語がない言葉が ${c.noJa}個あります(ドリルには出ません)。一覧から日本語を入れてね。</p>` : ''}</section>
      <div class="cs-io"><button class="cs-btn" data-list>言葉の一覧・登録(${nb.count()})</button></div>
      <div class="cs-io"><button class="cs-btn" data-free>✨ 使ってみる(英語を打ち込む)</button></div>
      ${typeof core.drill.provider === 'function' ? '<div class="cs-io"><button class="cs-btn" data-more>もっとやる(種類とレベルをえらぶ)</button></div>' : ''}`;
  }
  // ---- ドリル本体 ----
  function start() {
    const c = counts(); Q = [...c.due.sort((a, b) => a.sr.due - b.sr.due).slice(0, 12).map(x => ({ id: x.id, t: 'q' })), ...c.fresh.slice(0, 5).map(x => ({ id: x.id, t: 'c' }))];
    stat = { ok: 0, ng: 0 }; t0 = Date.now(); view = 'quiz'; draw(); step();
  }
  const sub = h => { ov.querySelector('main').innerHTML = h; return ov.querySelector('main'); };
  function step() {
    if (!ov) return; if (!Q.length) return done();
    const it = Q.shift(), x = find(it.id); if (!x || (x.sr && x.sr.s === 'off')) return step();
    if (it.t === 'c') return classify(x);
    quiz(x, it);
  }
  function classify(x) {   // 英語だけ見せて、自分で分ける(答えの日本語は、分けたあとに見せる)
    const m = sub(`<section class="cs-panel dr-card"><small>この言葉は、どう？</small><h2>${esc(x.en)}</h2><div class="dr-row"><button class="cs-btn" data-say>🔊 きく</button></div>
      <div class="dr-ch"><button data-c="unk">わからない</button><button data-c="cant">意味はわかるけど、自分では使えない</button><button data-c="off">もう知っている・押しまちがい(出さない)</button></div></section>`);
    m.querySelector('[data-say]').onclick = () => core.speech.speak(x.en);
    m.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
      const c = b.dataset.c; if (c === 'off') { nb.sr(x.id, { s: 'off', at: Date.now() }); core.ui.toast('外しました(一覧から戻せます)'); return step(); }
      nb.sr(x.id, { s: c, box: 0, n: 0, w: 0, ok: 0, last: 0, due: Date.now() + 0.7 * DAY });   // 見せたばかりなので、すぐには出さない(あしたまた出る)
      const mm = sub(`<section class="cs-panel dr-card"><small>${c === 'unk' ? 'この意味です' : '言えるように、声に出してみよう'}</small><h2>${esc(x.en)}</h2><p style="font-size:20px">${esc(x.ja)}</p>
        <div class="dr-row"><button class="cs-btn" data-say>🔊 きく</button><button class="cs-btn" data-eg>例文を見る</button></div><button class="cs-btn cs-go cs-big" data-next>つぎへ</button></section>`);
      core.speech.speak(x.en);
      mm.querySelector('[data-say]').onclick = () => core.speech.speak(x.en); mm.querySelector('[data-eg]').onclick = () => core.useit.open(x); mm.querySelector('[data-next]').onclick = step;
    });
  }
  function quiz(x, it) {
    const s = (x.sr && x.sr.s) || 'unk', toEn = s === 'cant', L = pool().filter(y => y.id !== x.id);
    const key = y => toEn ? y.en : y.ja, ans = key(x);
    const bad = shuffle([...new Set(L.filter(y => y.kind === x.kind).map(key).concat(L.map(key)))].filter(v => v && v !== ans && v.toLowerCase() !== ans.toLowerCase())).slice(0, 3);
    const self = bad.length < 3, opts = self ? [] : shuffle([ans, ...bad]);
    const m = sub(`<section class="cs-panel dr-card"><small>${toEn ? '英語で言うと？' : 'この意味は？'}${it.rq ? '(もう一度)' : ''}</small><h2>${esc(toEn ? x.ja : x.en)}</h2>
      ${toEn ? '' : '<div class="dr-row"><button class="cs-btn" data-say>🔊 きく</button></div>'}
      ${self ? `<div class="dr-ch"><button data-show>答えを見る</button></div>` : `<div class="dr-ch">${opts.map((o, i) => `<button data-o="${i}">${esc(o)}</button>`).join('')}</div>`}
      <div data-fb></div></section>`);
    if (m.querySelector('[data-say]')) m.querySelector('[data-say]').onclick = () => core.speech.speak(x.en);
    const finish = ok => {
      nb.sr(x.id, advance(x.sr, ok)); stat[ok ? 'ok' : 'ng']++; if (!ok && !it.rq) Q.push({ id: x.id, t: 'q', rq: 1 });
      if (ok || toEn) try { core.speech.speak(x.en); } catch (e) { }
      const fb = m.querySelector('[data-fb]');
      fb.innerHTML = `<p style="font-size:17px"><b>${ok ? '⭕ せいかい' : '✖ ざんねん'}</b><br>${esc(x.en)} = ${esc(x.ja)}</p>
        <div class="dr-row"><button class="cs-btn" data-say2>🔊</button><button class="cs-btn" data-eg>例文を見る</button><button class="cs-btn" data-off>外す</button></div>
        <button class="cs-btn cs-go cs-big" data-next>つぎへ</button>`;
      fb.querySelector('[data-say2]').onclick = () => core.speech.speak(x.en);
      fb.querySelector('[data-eg]').onclick = () => core.useit.open(x);
      fb.querySelector('[data-off]').onclick = () => { nb.sr(x.id, { s: 'off', at: Date.now() }); core.ui.toast('外しました(一覧から戻せます)'); step(); };
      fb.querySelector('[data-next]').onclick = step; fb.querySelector('[data-next]').focus && fb.querySelector('[data-next]').focus();
    };
    if (self) { m.querySelector('[data-show]').onclick = () => { m.querySelector('.dr-ch').innerHTML = `<p style="font-size:18px">${esc(ans)}</p><button data-y>${toEn ? '言えた' : 'わかった'}</button><button data-n>${toEn ? '言えない' : 'わからない'}</button>`; m.querySelector('[data-y]').onclick = () => { m.querySelector('.dr-ch').remove(); finish(true); }; m.querySelector('[data-n]').onclick = () => { m.querySelector('.dr-ch').remove(); finish(false); }; }; return; }
    m.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
      const ok = opts[+b.dataset.o] === ans; m.querySelectorAll('[data-o]').forEach(z => { z.disabled = true; if (opts[+z.dataset.o] === ans) z.classList.add('ok'); }); if (!ok) b.classList.add('ng'); finish(ok);
    });
  }
  function done() {
    const c = counts(), more = c.due.length + c.fresh.length;
    sub(`<section class="cs-panel dr-card"><h2>おつかれさま</h2><p>せいかい ${stat.ok} ・ まちがい ${stat.ng}</p><p class="cs-sub">まちがえた言葉は、短い間隔でまた出ます。正解が続くほど、間があきます。</p>
      ${more ? '<button class="cs-btn cs-go cs-big" data-again>つづけてやる</button>' : ''}<button class="cs-btn" data-home>もどる</button></section>`);
    const m = ov.querySelector('main'); if (m.querySelector('[data-again]')) m.querySelector('[data-again]').onclick = start; m.querySelector('[data-home]').onclick = () => { view = 'home'; draw(); };
    try { if (stat.ok + stat.ng) core.events.report('note', 'done', { play: 'note.practice', min: Math.round((Date.now() - t0) / 6e3) / 10, words: stat.ok + stat.ng, finished: true }); } catch (e) { }
  }
  // ---- 言葉の一覧・登録(ノートの管理) ----
  function list() {
    const items = nb.list({ kind: lkind });
    return `<nav class="cs-chips">${KINDS.map(k => `<button data-kind="${k.k}" class="${k.k === lkind ? 'on' : ''}">${k.n} ${nb.count(k.k)}</button>`).join('')}</nav>
      <form class="cs-add" data-add><input name="en" placeholder="英語" autocomplete="off" autocapitalize="off" spellcheck="false" required><input name="ja" placeholder="日本語" autocomplete="off"><button class="cs-btn">登録</button></form>
      <div class="cs-io"><button class="cs-btn" data-exp>📤 書き出す</button><button class="cs-btn" data-imp>📥 読み込む</button><small>ノートはこの端末の中だけに保存。機種変更のときは書き出したファイルを新しい端末で読み込んでね</small></div>
      ${items.length ? `<ul class="cs-nb">${items.slice(0, 300).map(x => { const s = x.sr && x.sr.s; return `<li data-id="${x.id}"><div class="cs-nb-t"><b>${esc(x.en)}</b><span>${esc(x.ja)}</span><small>${esc(SRC[x.src] || x.src)}</small>${s ? `<span class="dr-st ${s}">${SN[s]}</span>` : ''}</div>
          <div class="cs-nb-a"><button data-say aria-label="読み上げ">🔊</button><button data-use class="cs-use">使ってみる</button>${drillable(x) || (x.kind === 'word' || x.kind === 'phrase') ? `<button data-s="unk">わからない</button><button data-s="cant">使えない</button><button data-s="${s === 'off' ? 'back' : 'off'}">${s === 'off' ? 'もどす' : '外す'}</button>` : ''}<button data-del class="cs-del" aria-label="消す">🗑</button></div></li>`; }).join('')}</ul>`
        : '<p class="cs-sub">まだありません。ゲームでまちがえた言葉や、各アプリで登録した言葉がここに集まります。上の欄から手打ちでも登録できます。</p>'}`;
  }
  function bind(m) {
    const q = s => m.querySelector(s);
    if (q('[data-start]')) q('[data-start]').onclick = start;
    if (q('[data-list]')) q('[data-list]').onclick = () => { view = 'list'; draw(); };
    if (q('[data-free]')) q('[data-free]').onclick = () => core.useit.open({});
    if (q('[data-more]')) q('[data-more]').onclick = () => core.drill.provider(core, { addToNote: items => nb.addMany(items), refresh: () => draw() });
    m.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { lkind = b.dataset.kind; draw(); });
    if (q('[data-exp]')) q('[data-exp]').onclick = async () => {
      const txt = nb.exportText(), d = new Date(), name = `chunk-note-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
      try { const f = new File([txt], name, { type: 'application/json' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: '勉強ノート' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
      try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); core.ui.toast('書き出しました'); }
      catch (e) { try { await navigator.clipboard.writeText(txt); core.ui.toast('コピーしました(メモなどに貼って保存してね)'); } catch (e2) { core.ui.toast('書き出せませんでした'); } }
    };
    if (q('[data-imp]')) q('[data-imp]').onclick = () => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json,text/plain';
      inp.onchange = async () => { const f = inp.files && inp.files[0]; if (!f) return; const n = nb.importText(await f.text()); core.ui.toast(n < 0 ? 'ノートのファイルではないみたい' : `${n}個 ふえました`); };
      inp.click();
    };
    if (q('[data-add]')) q('[data-add]').onsubmit = e => {
      e.preventDefault(); const f = e.target, en = f.en.value.trim(), ja = f.ja.value.trim();
      if (!/[a-zA-Z]/.test(en)) { core.ui.toast('英語を入れてください'); return; }
      const it = nb.add({ en, ja, kind: lkind === 'quote' ? 'quote' : undefined, src: 'note' });
      if (it && it.kind !== lkind) { lkind = it.kind; draw(); }
      core.ui.toast('登録しました');
    };
    m.querySelectorAll('.cs-nb li').forEach(li => {
      const id = li.dataset.id, x = find(id);
      li.querySelector('[data-say]').onclick = () => core.speech.speak(x.en);
      li.querySelector('[data-use]').onclick = () => core.useit.open(x);
      li.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
        const v = b.dataset.s; if (v === 'back') nb.srClear(id); else if (v === 'off') nb.sr(id, { s: 'off', at: Date.now() }); else nb.sr(id, { s: v, box: 0, n: 0, w: 0, ok: 0, last: 0, due: Date.now() });
      });
      li.querySelector('[data-del]').onclick = () => nb.remove(id);
    });
  }
  return { open, close, provider: null, get isOpen() { return !!ov; } };
}
