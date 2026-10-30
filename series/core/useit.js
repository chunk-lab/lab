/* この言葉を使ってみる（勉強ノートの言葉から）。3段：
   1. 今ある文から探す（内蔵の長文・お話・勉強ノートの短文。AIなし・無料）＋聞いてまねる
   2. 自分で文を作る：自分のAIキーで「自然な文か」を判定（無料）。英語脳でも作れる
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
  // 聞いてまねる：ゆっくり→ふつう→ふつう。間に、まねする時間をあける
  async function mimic(en, btn) {
    const sp = core.speech, gap = Math.min(6000, 1200 + en.split(/\s+/).length * 450);
    for (const [i, r] of [[1, .8], [2, 1], [3, 1]]) {
      if (btn) btn.textContent = `${i}回目:聞いて…`; sp.speak(en, { rate: r }); await wait(gap);
      if (btn) btn.textContent = `${i}回目:まねして言ってみよう`; await wait(gap);
    }
    if (btn) btn.textContent = '聞いてまねる';
  }
  function open(x) {
    const ai = core.ai, M = core.member, aiPrice = M.isPaid() && M.aiLeft() > 0 ? `今月あと${M.aiLeft()}回` : `ダイヤ ${ECON.ai.gems}`;
    const sent = (s, i) => `<li><b>${esc(s.en)}</b><span>${esc(s.ja)}</span><small>${esc(s.from || '')}</small><div class="cs-nb-a"><button data-say="${i}">🔊</button><button data-mim="${i}">聞いてまねる</button><button data-add="${i}">ノートに入れる</button></div></li>`;
    let found = [];
    core.ui.sheet(`<h3>${esc(x.en)}</h3><p class="cs-note">${esc(x.ja)}</p>
      <section class="cs-adm"><h4>1. 文の中で見てみる</h4><ul class="cs-nb" data-found><li class="cs-note">さがしています…</li></ul></section>
      <section class="cs-adm"><h4>2. 自分で文を作る</h4>
        <textarea class="cs-ta" data-mine rows="2" placeholder="「${esc(x.en)}」を使って英文を書いてみよう" autocapitalize="off" spellcheck="false"></textarea>
        <div class="cs-adm-row">${ai.ready ? '<button class="cs-btn" data-check>自然な文か判定(AI)</button>' : ''}<button class="cs-btn" data-keep>ノートに入れる</button>${core.openGame ? '<button class="cs-btn" data-eigo>英語脳で作る</button>' : ''}</div>
        ${ai.ready ? '' : '<p class="cs-note">設定でAIのキーを入れると、自然な文かを判定できます(無料)。</p>'}<p class="cs-note" data-judge></p></section>
      <section class="cs-adm"><h4>3. AIで例文とお話を作る</h4><p class="cs-note">「${esc(x.en)}」を使った例文3つと、短いお話を作ります(${aiPrice})。できた文は勉強ノートに入ります。</p>
        ${ai.ready ? `<button class="cs-btn" data-gen>作る</button>` : '<p class="cs-note">AIのキーが必要です。</p>'}<ul class="cs-nb" data-gened></ul></section>`, (ov) => {
      const q = s => ov.querySelector(s);
      const bindList = (ul, list) => {
        ul.querySelectorAll('[data-say]').forEach(b => b.onclick = () => core.speech.speak(list[+b.dataset.say].en));
        ul.querySelectorAll('[data-mim]').forEach(b => b.onclick = () => mimic(list[+b.dataset.mim].en, b));
        ul.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const s = list[+b.dataset.add]; core.notebook.add({ en: s.en, ja: s.ja, kind: 'short', src: s.src || 'useit' }); b.textContent = '入れました'; b.disabled = true; });
      };
      find(x.en).then(list => { found = list; const ul = q('[data-found]'); if (!ul) return; ul.innerHTML = list.length ? list.map(sent).join('') : `<li class="cs-note">内蔵の文には見つかりませんでした。2か3で文を作ってみよう。</li>`; bindList(ul, list); });
      q('[data-keep]').onclick = () => { const en = q('[data-mine]').value.trim(); if (!/[a-zA-Z]/.test(en)) return core.ui.toast('英文を書いてね'); core.notebook.add({ en, ja: '', kind: 'short', src: 'note' }); core.ui.toast('ノートに入れました'); };
      if (q('[data-eigo]')) q('[data-eigo]').onclick = () => { core.eigo.send([{ en: x.en, ja: x.ja || '', kind: x.kind === 'short' ? 'sentence' : '' }]); core.ui.toast(`「${x.en}」を英語脳に送ったよ。マイことばに入っているから、文を作って使ってみよう`); ov.remove(); core.study && core.study.close(); core.openGame('eigonou'); };
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
          const ul = q('[data-gened]'); ul.innerHTML = list.map(sent).join(''); bindList(ul, list); btn.textContent = '勉強ノートに入れました';
        } catch (e) { if (byGems) M.addGems(ECON.ai.gems, 'refund'); btn.disabled = false; btn.textContent = '作る'; core.ui.toast(e.message + '(使った分は戻しました)'); }
      };
    });
  }
  return { open, find, mimic };
}
