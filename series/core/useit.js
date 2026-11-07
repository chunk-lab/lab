/* この言葉を使ってみる（勉強ノートの言葉から）。3段：
   1. 今ある文から探す（内蔵の長文・お話・勉強ノートの短文。AIなし・無料）＋聞いてまねる
   2. 自分で文を作る：自分のAIキーで「自然な文か」を判定（無料）。英ラボでも作れる
   3. AIで例文3つと短いお話を作る：有料会員は月の回数、超えたら(無料会員は最初から)ダイヤ */
import { ECON } from './economy.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 読む画面の形式「S:My grandmother=私の祖母は | V:lives=…」から英語だけを取り出す
export const plainEn = s => String(s || '').replace(/^@\w /, '').split(' | ').map(u => u.replace(/^[A-Z]:/, '').replace(/=.*$/, '').replace(/#.*$/, '')).join(' ').replace(/\s+/g, ' ').trim();
const wait = ms => new Promise(r => setTimeout(r, ms));
export function createUseit(core) {
  // 文をさがす：本(ストリームの長文・お話・共有の棚)と勉強ノートの短文から
  async function find(en) {
    const w = String(en).trim().toLowerCase(), re = w.includes(' ') ? null : new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es|ed|d|ing)?\\b', 'i');
    const hit = t => re ? re.test(t) : t.toLowerCase().includes(w);
    const out = [], seen = new Set(), push = (e, j, from) => { const k = e.toLowerCase(); if (!seen.has(k) && hit(e)) { seen.add(k); out.push({ en: e, ja: j || '', from }); } };
    if (core.books) {
      await core.books.load();
      for (const b of core.books.all()) { let s = null; try { s = b.story(); } catch (e) { } (s && s.list || []).forEach(x => push(plainEn(x[0]), x[1], b.title)); }
    }
    core.notebook.list({ kind: 'short' }).forEach(x => push(x.en, x.ja, '勉強ノート'));
    return out.slice(0, 8);
  }
  // 文をチャンク(意味のまとまり)に分ける：カンマのあと／前置詞・接続詞の前で区切り、1語だけのかたまりは隣にくっつける
  const BRK = /^(to|in|on|at|with|for|from|of|about|by|into|over|under|after|before|because|when|while|if|that|which|who|and|but|or|so|than|as|until|since|during|through|around|near)$/i;
  const chunksOf = en => {
    const ws = String(en).trim().split(/\s+/).filter(Boolean), out = []; let cur = [];
    ws.forEach((w, i) => { if (cur.length >= 2 && (BRK.test(w.replace(/[^\w']/g, '')) || /[,;:]$/.test(ws[i - 1]))) { out.push(cur); cur = []; } cur.push(w); });
    if (cur.length) out.push(cur);
    for (let i = out.length - 1; i > 0; i--) if (out[i].length === 1) { out[i - 1].push(...out[i]); out.splice(i, 1); }
    if (out.length > 1 && out[0].length === 1) { out[1].unshift(...out[0]); out.shift(); }
    return out;
  };
  // 聞いてまねる：チャンクごとに1回ずつ読み、そのたびにまねする間をあける(全体で1回だけ。文全体のくり返しは、ボタンをまた押す)
  let mimicRun = null;   // いま動いている聞いてまねる({stop})。二重に起動しない
  async function mimic(en, btn) {
    if (mimicRun && mimicRun.btn === btn) return;   // 同じ文を読んでいる最中の押し直しは無視
    if (mimicRun) mimicRun.stop();                   // ほかの文なら、前のを止めてから始める
    const sp = core.speech, li = btn && btn.closest('li'), b = li && li.querySelector('b'), plain = b && b.textContent;
    const parts = chunksOf(en), run = { btn, dead: false, stop() { this.dead = true; try { sp.stop(); } catch (e) { } } };
    mimicRun = run;
    if (btn) { btn.classList.add('cs-busy'); btn.setAttribute('aria-pressed', 'true'); }
    const mark = k => { if (!b) return; b.innerHTML = parts.map((c, j) => j === k ? '<mark class="cs-mimnow">' + esc(c.join(' ')) + '</mark>' : esc(c.join(' '))).join(' '); };
    try {
      for (let k = 0; k < parts.length && !run.dead && (!b || b.isConnected); k++) {
        const text = parts[k].join(' '); mark(k);
        await new Promise(res => { let done = false; const fin = () => { if (!done) { done = true; res(); } }; try { sp.speak(text, { rate: .85, onend: fin }); } catch (e) { fin(); } setTimeout(fin, 1500 + parts[k].length * 700); });
        if (!run.dead) await wait(500 + parts[k].length * 450);   // まねして言う時間
      }
    } finally {
      if (b && plain != null) b.textContent = plain;
      if (btn) { btn.classList.remove('cs-busy'); btn.removeAttribute('aria-pressed'); }
      if (mimicRun === run) mimicRun = null;
    }
  }
  function open(x0) {
    const x = Object.assign({ en: '', ja: '' }, x0 || {});
    const ai = core.ai, M = core.member, aiPrice = M.isPaid() && M.aiLeft() > 0 ? `今月あと${M.aiLeft()}回` : `ダイヤ ${ECON.ai.gems}`;
    const sent = (s, i) => `<li><b>${esc(s.en)}</b><span>${esc(s.ja)}</span><small>${esc(s.from || '')}</small><div class="cs-nb-a"><button data-say="${i}">🔊</button><button data-mim="${i}">聞いてまねる</button><button data-add="${i}">ノートに入れる</button></div></li>`;
    let found = [];
    core.ui.sheet(`<h3>✨ 使ってみる</h3>
      <div class="cs-adm"><input class="cs-ta" data-en placeholder="英語(単語・熟語・チャンク・文 なんでも)" value="${esc(x.en)}" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:100%;box-sizing:border-box;margin-bottom:6px"><input class="cs-ta" data-ja placeholder="日本語(空でもOK)" value="${esc(x.ja)}" autocomplete="off" style="width:100%;box-sizing:border-box">
        ${core.openGame ? '<button class="cs-btn cs-go" data-eigo style="width:100%;margin-top:8px;font-size:16px">🧠 英ラボで文にして、すぐ遊ぶ</button><p class="cs-note">AIがふさわしい文を作って、英ラボにセットします。気に入った文は英ラボの「💾 記憶」で残せます。</p>' : ''}</div>
      <section class="cs-adm"><h4>1. 文の中で見てみる</h4><ul class="cs-nb" data-found><li class="cs-note">さがしています…</li></ul></section>
      <section class="cs-adm"><h4>2. 自分で文を作る</h4>
        <textarea class="cs-ta" data-mine rows="2" placeholder="「${esc(x.en)}」を使って英文を書いてみよう" autocapitalize="off" spellcheck="false"></textarea>
        <div class="cs-adm-row">${ai.ready ? '<button class="cs-btn" data-check>自然な文か判定(AI)</button>' : ''}<button class="cs-btn" data-keep>ノートに入れる</button></div>
        ${ai.ready ? '' : '<p class="cs-note">設定でAIのキーを入れると、自然な文かを判定できます(無料)。</p>'}<p class="cs-note" data-judge></p></section>
      <section class="cs-adm"><h4>3. AIで例文とお話を作る</h4><p class="cs-note">「${esc(x.en)}」を使った例文3つと、短いお話を作ります(${aiPrice})。できた文は勉強ノートに入ります。</p>
        ${ai.ready ? `<button class="cs-btn" data-gen>作る</button>` : '<p class="cs-note">AIのキーが必要です。</p>'}<ul class="cs-nb" data-gened></ul></section>`, (ov) => {
      const q = s => ov.querySelector(s);
      const bindList = (ul, list) => {
        ul.querySelectorAll('[data-say]').forEach(b => b.onclick = () => core.speech.speak(list[+b.dataset.say].en));
        ul.querySelectorAll('[data-mim]').forEach(b => b.onclick = () => mimic(list[+b.dataset.mim].en, b));
        ul.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const s = list[+b.dataset.add]; core.notebook.add({ en: s.en, ja: s.ja, kind: 'short', src: s.src || 'useit' }); b.textContent = '入れました'; b.disabled = true; });
      };
      const doFind = () => { find(x.en).then(list => { found = list; const ul = q('[data-found]'); if (!ul) return; ul.innerHTML = list.length ? list.map(sent).join('') : `<li class="cs-note">内蔵の文には見つかりませんでした。2か3で文を作ってみよう。</li>`; bindList(ul, list); }); };
      q('[data-en]').oninput = e => { x.en = e.target.value; x.kind = ''; }; q('[data-ja]').oninput = e => { x.ja = e.target.value; };
      q('[data-en]').onchange = () => { if (x.en.trim()) doFind(); };
      if (x.en) doFind();
      q('[data-keep]').onclick = () => { const en = q('[data-mine]').value.trim(); if (!/[a-zA-Z]/.test(en)) return core.ui.toast('英文を書いてね'); core.notebook.add({ en, ja: '', kind: 'short', src: 'note' }); core.ui.toast('ノートに入れました'); };
      if (q('[data-eigo]')) q('[data-eigo]').onclick = function () {
        // 1) 押した瞬間に、ボタンそのものの文字を変える(トーストや重なりに頼らない)
        const btn = this, say = t => { btn.textContent = t; };
        const en0 = String(x.en || '').trim(); if (!/[a-zA-Z]/.test(en0)) { say('英語を入れてね'); setTimeout(() => { btn.textContent = '🧠 英ラボで文にして、すぐ遊ぶ'; }, 1500); return; }
        const isSen = x.kind === 'short' || x.kind === 'quote' || /[.!?]$/.test(en0) || en0.split(/\s+/).length >= 6;
        try { if (!core.notebook.list({}).some(n => n.en.toLowerCase() === en0.toLowerCase())) core.notebook.add({ en: en0, ja: x.ja || '', kind: isSen ? 'short' : (/\s/.test(en0) ? 'phrase' : 'word'), src: 'useit' }); } catch (e) { console.error(e); }
        say('⏳ 送っています…');
        try {
          core.eigo.send([{ en: en0, ja: x.ja || '', kind: isSen ? 'sentence' : '', play: true, ex: found[0] && found[0].en, exja: found[0] && found[0].ja }]);   // play=開いたら、完成した文をそのまま「つくる」に出す(見つかった例文があればAIでその文を組み立てる)
          say('✅ 送りました。英ラボを開きます…');
          if (!core.openGame) throw new Error('この画面では英ラボを開けません');
          // 2) 閉じる→開くを同じ瞬間にやらない(閉じる側の後片づけに、開いた画面が巻き込まれないように)
          setTimeout(() => {
            try {
              ov.remove(); core.study && core.study.close();
              setTimeout(() => { try { core.openGame('eigonou'); } catch (e) { console.error(e); core.ui.toast('英ラボを開けませんでした:' + String(e && e.message || e).slice(0, 80)); } }, 120);
            } catch (e) { console.error(e); say('❌ ' + String(e && e.message || e).slice(0, 60)); }
          }, 350);
        } catch (e) { console.error(e); say('❌ 失敗:' + String(e && e.message || e).slice(0, 60)); }
      };
      if (q('[data-check]')) q('[data-check]').onclick = async () => {
        const en = q('[data-mine]').value.trim(), out = q('[data-judge]'); if (!/[a-zA-Z]/.test(en)) return core.ui.toast('英文を書いてね');
        out.textContent = '判定しています…';
        try { const r = await ai.check(en, x.en); out.innerHTML = `<b>${({ o: '◎ 自然な文', t: '△ 通じるけれど少し不自然', x: '× まちがいがある' })[r.ok] || ''}</b><br>${r.fix && r.fix !== en ? '直した文:' + esc(r.fix) + '<br>' : ''}${esc(r.why || '')}`; }
        catch (e) { out.textContent = e.message; }
      };
      if (q('[data-gen]')) q('[data-gen]').onclick = async () => {
        const btn = q('[data-gen]');
        const byGems = !(M.isPaid() && M.aiLeft() > 0);
        if (!M.useAI(byGems ? 'gems' : '')) return core.ui.toast(M.isPaid() ? `今月の回数がなく、ダイヤも足りません(ダイヤ ${ECON.ai.gems})` : `ダイヤが足りません(ダイヤ ${ECON.ai.gems})`);
        btn.disabled = true; btn.textContent = '作っています…';
        try {
          const lv = core.level ? core.level.name() : '';
          const r = await ai.examples(x.en, lv), list = [...(r.examples || []), ...(r.passage || [])].filter(s => s && s.en).map(s => ({ en: s.en, ja: s.ja || '', from: 'AI', src: 'ai' }));
          core.notebook.addMany(list.map(s => ({ en: s.en, ja: s.ja, kind: 'short', src: 'ai' })));
          try { core.eigo.send([{ en: x.en, ja: x.ja || '', ex: list[0] && list[0].en, exja: list[0] && list[0].ja }, ...list.slice(1).map(t => ({ en: t.en, ja: t.ja, kind: 'sentence' }))]); } catch (e) { console.error(e); }   // 英ラボにも自動で登録(次に英ラボを開いたとき)
          const ul = q('[data-gened]'); ul.innerHTML = list.map(sent).join(''); bindList(ul, list); btn.textContent = '勉強ノートと英ラボに入れました';
        } catch (e) { if (byGems) M.addGems(ECON.ai.gems, 'refund'); btn.disabled = false; btn.textContent = '作る'; core.ui.toast(e.message + '(使った分は戻しました)'); }
      };
    });
  }
  return { open, find, mimic };
}
