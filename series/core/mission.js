/* 今日なにする?（ミッション）：選んでいくと、やることが1つに決まる。最後に「これでいい?」で確認してから始める。
   - 今日の課題があれば、まずそれ。課題を選んだら、課題の本しか出さない（課題図書のうち今日の1冊・やり方も決まっている）
   - ほかのことをするなら：したいこと → 時間 → 気分 → 1つに決めて「これでいい?」（ほかのにする／自由に遊ぶ もできる）
   - 判定はミッションの中身と同じものが「最後まで」終わったときだけ（ほかの遊びでは数えない）
   - 課題のコイン(今日の課題)はミッションをクリアしたときだけ */
import { createStore } from './store.js';
import { WANTS, MOODS, TIMES } from './plays.js';
import { weeklyBooks } from '../data/library.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const OPP = { 1: 'mii', 2: 'baron', 3: 'gon' }, OPPN = { mii: 'ミイ', baron: 'ハッタリ男爵', gon: 'ひろい屋ゴン' };
export function createMission(core) {
  const st = createStore('core'), subs = new Set();
  let M = st.get('mission') || null, hasGame = () => true;
  const save = () => { st.set('mission', M); subs.forEach(f => { try { f(); } catch (e) { } }); };
  const today = () => core.member.keys.dayKey();
  if (M && M.date !== today() && M.kind === 'task') { M = null; save(); }   // 課題はその日だけ
  const lv = () => Math.max(1, (core.level && core.level.lv) || 1);
  const can = g => hasGame(g) && !!core.openGame;
  // 判定：done の報告がミッションの条件に合うか
  const match = (c, d) => {
    if (!c || d.play !== c.play) return false;
    if (c.play === 'stream.read') return d.passage === c.passage && d.whole && d.finished;
    if (c.play === 'stream.word') return c.set ? d.set === c.set : String(d.set || '').startsWith('nb-');
    if (c.play === 'cc.read') return d.book === c.book && d.finished;
    if (c.play === 'cc.lesson') return !c.lesson || d.lesson === c.lesson;
    if (c.play === 'cards') return d.opp === c.opp;
    if (c.play === 'listen') return d.lv === c.lv && d.n >= 10;
    return !!d.finished;
  };
  core.events.on((game, name, d = {}) => {
    if (name !== 'done' || !M || M.done || !match(M.check, d)) return;
    M.done = Date.now(); save();
    let msg = `ミッションクリア!「${M.title}」`;
    if (M.kind === 'task') { const g = core.member.earn('task'); if (g) msg += ` コイン +${g}`; }
    setTimeout(() => core.ui.toast(msg), 700);
  });
  // ---- やることの候補(1つずつ、上から) ----
  function bookTask(b) {   // 本を1冊：ストリームで通しクリア、ストリームがない本は「最後の文まで読む・解く」
    if (b.canStream && can('stream')) return { title: `「${b.title}」をストリームで最初から最後まで`, how: 'ストリームで1段目から通しでクリアするとクリア', go: { game: 'stream', opts: { passage: b.pid, run: true } }, check: { play: 'stream.read', passage: b.pid } };
    return { title: `「${b.title}」を最後の文まで読む`, how: '読む画面で最後の文まで進むか、「解く」を終えるとクリア', go: { book: b.id }, check: { play: 'cc.read', book: b.id } };
  }
  function task() {   // 今日の課題：今週の課題図書のうち、日ごとに1冊
    if (!core.books) return null;
    const ids = weeklyBooks(today()); if (!ids.length) return null;
    const b = core.books.byId(ids[new Date().getDay() % ids.length]); if (!b) return null;   // その日の1冊(本のデータを読み込んでから決める)
    return { kind: 'task', ...bookTask(b), title: '今日の課題:' + bookTask(b).title };
  }
  function candidates(want, time, mood) {
    const L = lv(), out = [], nb = core.notebook.list({ mark: 'miss' }).filter(x => x.ja);
    const books = core.books ? core.books.all().filter(b => !b.shared && b.lv === L) : [];
    const unread = books.filter(b => !core.record.bookDone(b.id)), pool = unread.length ? unread : books;
    if (want === 'word') {
      if (nb.length >= 4 && can('stream')) out.push({ title: `まちがえた言葉 ${Math.min(20, nb.length)}個をストリームで練習`, how: '最後まで練習するとクリア', go: { game: 'stream', opts: { words: nb.slice(0, 20).map(x => [x.en, x.ja]), title: '勉強ノート:まちがえた言葉' } }, check: { play: 'stream.word' }, mood: 'both' });
      if (can('stream')) { const k = Math.floor(Math.random() * 6); out.push({ title: `${['', '初級', '中級', '上級'][L]}の単語 セット${k + 1} をストリームで`, how: '最後まで練習するとクリア', go: { game: 'stream', opts: { wordset: { lv: L, k } } }, check: { play: 'stream.word', set: `w${L}-${k + 1}` }, mood: 'both' }); }
      if (core.level && core.member.canTest() && can('stream')) out.push({ title: '実力テスト', how: '最後の問題まで答えるとクリア', go: { test: true }, check: { play: 'test' }, mood: 'study' });
    } else if (want === 'read') {
      const s = pool.filter(b => b.canStream), r = pool.filter(b => b.canRead);
      if (mood !== 'study' && s.length) out.push({ ...bookTask(s[Math.floor(Math.random() * s.length)]), mood: 'game' });
      if (r.length) { const b = r[Math.floor(Math.random() * r.length)]; out.push({ title: `「${b.title}」を最後の文まで読む`, how: '最後の文まで進むか、「解く」を終えるとクリア', go: { book: b.id }, check: { play: 'cc.read', book: b.id }, mood: 'study' }); }
    } else if (want === 'make') {
      if (can('chunkchunk')) out.push({ title: '次のチャンクレッスンを1つ', how: 'レッスンを最後まで終えるとクリア', go: { game: 'chunkchunk', opts: { face: 'lesson', lesson: 'next' } }, check: { play: 'cc.lesson' }, mood: 'study' });
      if (can('cards')) { const o = OPP[L]; out.push({ title: `チャンク・カードで${OPPN[o]}と1試合`, how: '試合を最後までやるとクリア(勝ち負けは問わない)', go: { game: 'cards', opts: { cpu: o } }, check: { play: 'cards', opp: o }, mood: 'game' }); }
    } else if (want === 'talk') {
      if (can('listen')) out.push({ title: `ランダムチャンク(${['', '初級', '中級', '上級'][L]})を10問`, how: '10問答えて、まねして言うとクリア', go: { game: 'listen', opts: { lv: L } }, check: { play: 'listen', lv: L }, mood: 'both' });
    }
    // 時間：5分なら短いものを先に、じっくりなら読む・レッスンを先に
    const w = x => (mood === 'any' ? 0 : x.mood === mood ? -2 : x.mood === 'both' ? -1 : 0) + (time === 5 && /読む|レッスン/.test(x.title) ? 1 : 0) + (time === 30 && /読む|レッスン/.test(x.title) ? -1 : 0);
    return out.sort((a, b) => w(a) - w(b));
  }
  // ---- 始める ----
  function begin(m) {
    M = { ...m, kind: m.kind || 'pick', date: today(), at: Date.now(), done: 0 }; delete M.mood; save();
    go(M);
  }
  function go(m) {
    if (m.go.test) core.level.test();
    else if (m.go.book) { const b = core.books.byId(m.go.book); core.openGame('library', { tab: 'weekly' }); setTimeout(() => b && core.books.read(b), 250); }
    else core.openGame(m.go.game, m.go.opts || {});
  }
  // ---- 画面：1つずつ聞いて、最後に「これでいい?」 ----
  async function open(o = {}) {
    if (o.has) hasGame = o.has;
    if (core.books) await core.books.load();
    const step = (html, bind) => core.ui.sheet(`<h3>今日なにする?</h3>${html}`, bind);
    // いまのミッションが終わっていなければ、まずそれ
    if (M && !M.done && M.date === today()) return step(`<p class="cs-note">いまのミッション</p><div class="cs-mis"><b>${esc(M.title)}</b><small>${esc(M.how)}</small></div>
      <button class="cs-btn cs-go" data-a="go">つづける</button><button class="cs-btn" data-a="drop">やめて、ほかのことにする</button>`, (ov, close) => {
      ov.querySelector('[data-a=go]').onclick = () => { close(); go(M); };
      ov.querySelector('[data-a=drop]').onclick = () => { close(); M = null; save(); open(o); };
    });
    const t = task(), taskDone = core.member.today().task;
    if (t && !taskDone && !o.skipTask) return step(`<div class="cs-mis"><b>${esc(t.title)}</b><small>${esc(t.how)} ・ コイン +${core.econ.daily.task}</small></div>
      <button class="cs-btn cs-go" data-a="task">これをやる</button><button class="cs-btn" data-a="other">ほかのことをする</button>`, (ov, close) => {
      ov.querySelector('[data-a=task]').onclick = () => { close(); begin(t); };
      ov.querySelector('[data-a=other]').onclick = () => { close(); open({ ...o, skipTask: true }); };
    });
    pickWant(o);
  }
  function choose(title, list, cb, extra = '') {
    core.ui.sheet(`<h3>今日なにする?</h3><p class="cs-note">${title}</p>${list.map(x => `<button class="cs-btn" data-v="${x.k}">${esc(x.n)}</button>`).join('')}${extra}`, (ov, close) => {
      ov.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { close(); cb(b.dataset.v); });
      const f = ov.querySelector('[data-free]'); if (f) f.onclick = () => { close(); free(); };
    });
  }
  const freeBtn = '<button class="cs-btn" data-free>決めずに自由に遊ぶ</button>';
  function pickWant(o) { choose('したいことは?', WANTS, want => want === 'chill' ? free('chill') : choose('時間は?', TIMES, time => choose('気分は?', MOODS, mood => result(want, +time, mood, 0))), freeBtn); }
  function result(want, time, mood, i) {
    const list = candidates(want, time, mood);
    if (!list.length) return core.ui.sheet(`<h3>今日なにする?</h3><p class="cs-note">この組み合わせでできることが、このアプリにはありません。</p>${freeBtn}`, (ov, close) => { ov.querySelector('[data-free]').onclick = () => { close(); free(); }; });
    const m = list[i % list.length];
    core.ui.sheet(`<h3>これでいい?</h3><div class="cs-mis"><b>${esc(m.title)}</b><small>${esc(m.how)}</small></div>
      <button class="cs-btn cs-go" data-a="ok">はじめる</button>${list.length > 1 ? '<button class="cs-btn" data-a="next">ほかのにする</button>' : ''}${freeBtn}`, (ov, close) => {
      ov.querySelector('[data-a=ok]').onclick = () => { close(); begin(m); };
      const n = ov.querySelector('[data-a=next]'); if (n) n.onclick = () => { close(); result(want, time, mood, i + 1); };
      ov.querySelector('[data-free]').onclick = () => { close(); free(); };
    });
  }
  // 自由に遊ぶ：ミッションなし。施設を選ぶだけ(まったりは3Dの町か英語脳)
  function free(kind) {
    const opts = [];
    if (core.to3D) opts.push(['3d', '3Dの町を歩く(住人・大喜利・おみくじ)']);
    if (can('eigonou')) opts.push(['eigonou', '英語脳で気になる言葉を調べる']);
    if (can('library')) opts.push(['library', '図書館で本を選ぶ']);
    if (kind !== 'chill') opts.push(['map', '地図から施設を選ぶ']);
    core.ui.sheet(`<h3>自由に遊ぶ</h3><p class="cs-note">ミッションなしで、好きに遊べます(記録には入ります)。</p>${opts.map(([k, n]) => `<button class="cs-btn" data-f="${k}">${n}</button>`).join('')}`, (ov, close) => {
      ov.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { close(); const k = b.dataset.f; if (k === '3d') core.to3D(); else if (k !== 'map') core.openGame(k); });
    });
  }
  return { open, current: () => M, clear() { M = null; save(); }, onChange(f) { subs.add(f); return () => subs.delete(f); } };
}
