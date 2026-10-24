/* 今日なにする?（ミッション）
   流れ：今日の課題(まだなら) → 勉強気分/遊び気分/自由にする → 時間(5分以内/それ以上/決めてない)
         → 勉強なら中身(単語・熟語/チャンクや文型/読書/英語レッスンを見る/おまかせ) → 1つに決めて「これでいい?」
   - 同じ選び方でも同じ中身にならないように、種類(KINDS)ごとに最近やった日を覚えて、長くやっていない種類を先に出す
   - 「ほかのにする」は必ず別の種類。中身が重なっていてもよい（同じ種類がいくつもの選択肢に入る）
   - 判定はミッションの中身と同じものが「最後まで」終わったときだけ。課題のコインは課題のクリアだけ
   - クリアしたら「これからどうしますか?」（もっとやりたい/おまかせ/自由に遊ぶ/もっとコイン/記録を見る）
   - 実力テストはミッションに入れない（ミッションを10個クリアすると勉強部屋で受けられる） */
import { createStore } from './store.js';
import { weeklyBooks } from '../data/library.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const OPP = { 1: 'mii', 2: 'baron', 3: 'gon' }, OPPN = { mii: 'ミイ', baron: 'ハッタリ男爵', gon: 'ひろい屋ゴン' }, LVN = { 1: '初級', 2: '中級', 3: '上級' };
const CATS = [{ k: 'word', n: '単語・熟語' }, { k: 'chunk', n: 'チャンクや文型' }, { k: 'read', n: '読書' }, { k: 'lesson', n: '英語レッスンを見る' }, { k: 'any', n: 'おまかせ' }];
const DAY = 864e5;
export function createMission(core) {
  const st = createStore('core'), subs = new Set();
  let M = st.get('mission') || null, H = st.get('missionHist') || { kinds: {}, cleared: 0 }, hasGame = () => true;
  const save = () => { st.set('mission', M); st.set('missionHist', H); subs.forEach(f => { try { f(); } catch (e) { } }); };
  const today = () => core.member.keys.dayKey();
  if (M && M.date !== today() && M.kind === 'task') { M = null; save(); }   // 課題はその日だけ
  const lv = () => Math.max(1, (core.level && core.level.lv) || 1);
  const can = g => hasGame(g) && !!core.openGame;
  // ---- 判定 ----
  const match = (c, d) => {
    if (!c || d.play !== c.play) return false;
    if (c.play === 'stream.read') return d.passage === c.passage && d.whole && d.finished;
    if (c.play === 'stream.word') return c.set ? d.set === c.set : c.nb ? String(d.set || '').startsWith('nb-') : true;
    if (c.play === 'cc.read') return d.book === c.book && (c.solved ? d.solved : d.finished);
    if (c.play === 'cards') return !c.opp || d.opp === c.opp;
    if (c.play === 'listen') return d.lv === c.lv && d.n >= 10;
    return true;   // cc.lesson / cc.game
  };
  core.events.on((game, name, d = {}) => {
    if (name !== 'done' || !M || M.done || !match(M.check, d)) return;
    M.got = (M.got || 0) + 1;
    if (M.got < (M.need || 1)) { save(); setTimeout(() => core.ui.toast(`ミッション ${M.got}/${M.need}`), 700); return; }
    M.done = Date.now(); H.cleared = (H.cleared || 0) + 1; H.kinds[M.type] = Date.now(); save();
    let coins = 0; if (M.kind === 'task') coins = core.member.earn('task');
    setTimeout(() => after(coins), 1200);
  });
  // ---- やることの種類（どれも「最後まで」で判定） ----
  function kinds(L) {
    const nb = core.notebook.list({ mark: 'miss' }).filter(x => x.ja), out = [];
    const books = core.books ? core.books.all().filter(b => !b.shared && b.lv === L) : [];
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const unread = f => { const a = books.filter(f), u = a.filter(b => !core.record.bookDone(b.id)); return u.length ? u : a; };
    const k6 = () => Math.floor(Math.random() * 6), k3 = () => Math.floor(Math.random() * 3);
    if (can('stream')) {
      const k = k6(); out.push({ type: 'ws', cats: ['word', 'game'], time: 's', title: `${LVN[L]}の単語 セット${k + 1}`, how: 'ストリームで最後まで練習するとクリア', go: { game: 'stream', opts: { wordset: { lv: L, k } } }, check: { play: 'stream.word', set: `w${L}-${k + 1}` } });
      const i = k3(); out.push({ type: 'wi', cats: ['word'], time: 's', title: `${LVN[L]}の熟語 セット${i + 1}`, how: 'ストリームで最後まで練習するとクリア', go: { game: 'stream', opts: { wordset: { lv: L, k: i, kind: 'i' } } }, check: { play: 'stream.word', set: `i${L}-${i + 1}` } });
      out.push({ type: 'ws2', cats: ['word'], time: 'l', need: 2, title: `${LVN[L]}の単語セットを2つ`, how: 'ストリームの単語練習を2セット、最後までやるとクリア(セットは自由)', go: { game: 'stream', opts: { wordset: { lv: L, k: k6() } } }, check: { play: 'stream.word' } });
      if (nb.length >= 4) out.push({ type: 'nb', cats: ['word'], time: 's', title: `まちがえた言葉 ${Math.min(20, nb.length)}個の練習`, how: 'ストリームで最後まで練習するとクリア', go: { game: 'stream', opts: { words: nb.slice(0, 20).map(x => [x.en, x.ja]), title: '勉強ノート:まちがえた言葉' } }, check: { play: 'stream.word', nb: true } });
      const s = unread(b => b.canStream); if (s.length) { const b = pick(s); out.push({ type: 'st', cats: ['read', 'game'], time: 'l', title: `「${b.title}」をストリームで最初から最後まで`, how: 'ストリームで1段目から通しでクリアするとクリア', go: { game: 'stream', opts: { passage: b.pid, run: true } }, check: { play: 'stream.read', passage: b.pid } }); }
    }
    if (can('listen')) out.push({ type: 'ls', cats: ['word', 'chunk', 'game'], time: 's', title: `ランダムチャンク(${LVN[L]})を10問`, how: '声だけ聞いて意味を選ぶ。10問答えるとクリア', go: { game: 'listen', opts: { lv: L } }, check: { play: 'listen', lv: L } });
    if (can('chunkchunk')) {
      out.push({ type: 'le', cats: ['lesson', 'chunk'], time: 's', title: '英語レッスン(次のレッスンを1つ)', how: 'レッスンを最後まで終えるとクリア', go: { game: 'chunkchunk', opts: { face: 'lesson', lesson: 'next' } }, check: { play: 'cc.lesson' } });
      out.push({ type: 'le2', cats: ['lesson', 'chunk'], time: 'l', need: 2, title: '英語レッスン(次のレッスンを2つ)', how: 'レッスンを2つ、最後まで終えるとクリア', go: { game: 'chunkchunk', opts: { face: 'lesson', lesson: 'next' } }, check: { play: 'cc.lesson' } });
      out.push({ type: 'cg', cats: ['game'], time: 's', title: 'チャンクチャンクのチャレンジを1回', how: 'チャレンジを時間いっぱいまでやるとクリア', go: { game: 'chunkchunk', opts: { face: 'arcade' } }, check: { play: 'cc.game' } });
    }
    if (can('cards')) {
      const o = OPP[L]; out.push({ type: 'ca', cats: ['chunk', 'game'], time: 's', title: `チャンク・カードで${OPPN[o]}と1試合`, how: '試合を最後までやるとクリア(勝ち負けは問わない)', go: { game: 'cards', opts: { cpu: o } }, check: { play: 'cards', opp: o } });
      out.push({ type: 'ca3', cats: ['chunk', 'game'], time: 'l', need: 3, title: 'チャンク・カードで3試合', how: '相手は自由。3試合を最後までやるとクリア', go: { game: 'cards' }, check: { play: 'cards' } });
    }
    const st2 = unread(b => b.src === 'chunkchunk'); if (st2.length) { const b = pick(st2); out.push({ type: 'rs', cats: ['read'], time: 's', title: `お話「${b.title}」を最後まで読む`, how: '読む画面で最後の文まで進むとクリア', go: { book: b.id }, check: { play: 'cc.read', book: b.id } }); }
    const rq = unread(b => b.canRead && (b.story() || {}).questions && b.story().questions.length); if (rq.length) { const b = pick(rq); out.push({ type: 'rq', cats: ['read'], time: 'l', title: `「${b.title}」の問題を全部解く`, how: 'リーディングで問題に全部答えて「答え合わせ」するとクリア(まちがっていてもOK)', go: { book: b.id, view: 'solve' }, check: { play: 'cc.read', book: b.id, solved: true } }); }
    return out;
  }
  // 並べ方：長くやっていない種類ほど先。同じくらいならランダム
  function candidates(cat, time) {
    const all = kinds(lv()), now = Date.now();
    return all.filter(x => (cat === 'any' ? !x.cats.every(c => c === 'game') : x.cats.includes(cat)) && (time === 'any' || x.time === time))
      .map(x => [Math.min(14, (now - (H.kinds[x.type] || 0)) / DAY) + Math.random() * 1.5, x]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  }
  // ---- 今日の課題：今週の課題図書のうち、日ごとに1冊・やり方も決まっている ----
  function task() {   // 今日の課題の本(日ごとに1冊)。やり方は「じっくり」か「ゲーム」かを選ぶ
    if (!core.books) return null;
    const ids = weeklyBooks(today()); if (!ids.length) return null;
    const b = core.books.byId(ids[new Date().getDay() % ids.length]); return b || null;
  }
  function taskWays(b) {
    const out = [];
    if (core.books.hasQ(b)) out.push(['slow', 'じっくり読む(リーディングで問題を解く)', { kind: 'task', type: 'task', cats: ['read'], title: `今日の課題:「${b.title}」の問題を全部解く`, how: 'リーディングで問題に全部答えて「答え合わせ」するとクリア(まちがっていてもOK)', go: { book: b.id, view: 'solve' }, check: { play: 'cc.read', book: b.id, solved: true } }]);
    else out.push(['slow', 'じっくり読む(リーディング)', { kind: 'task', type: 'task', cats: ['read'], title: `今日の課題:「${b.title}」を最後の文まで読む`, how: '読む画面で最後の文まで進むとクリア', go: { book: b.id }, check: { play: 'cc.read', book: b.id } }]);
    if (b.canStream && can('stream')) out.push(['game', 'ゲームで読む(チャンクストリーム)', { kind: 'task', type: 'task', cats: ['read'], title: `今日の課題:「${b.title}」をストリームで最初から最後まで`, how: 'ストリームで1段目から通しでクリアするとクリア', go: { game: 'stream', opts: { passage: b.pid, run: true } }, check: { play: 'stream.read', passage: b.pid } }]);
    return out;
  }
  // ---- 始める ----
  function begin(m) { M = { ...m, kind: m.kind || 'pick', date: today(), at: Date.now(), done: 0, got: 0 }; save(); go(M); }
  function go(m) {
    if (m.go.book) {
      const b = core.books.byId(m.go.book); core.openGame('library', { tab: 'weekly' });
      setTimeout(() => { if (!b) return; if (m.go.view === 'solve') core.books.solveIntro(() => core.books.read(b, { view: 'solve' })); else core.books.read(b); }, 250);
    }
    else core.openGame(m.go.game, m.go.opts || {});
  }
  const sheet = (html, bind) => core.ui.sheet(html, bind);
  const btns = list => list.map(([k, n, cls]) => `<button class="cs-btn ${cls || ''}" data-v="${k}">${n}</button>`).join('');
  const on = (ov, close, map) => ov.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { close(); map[b.dataset.v] && map[b.dataset.v](); });
  // ---- 画面 ----
  async function open(o = {}) {
    if (o.has) hasGame = o.has;
    if (core.books) await core.books.load();
    if (M && !M.done && M.date === today()) return sheet(`<h3>今日なにする?</h3><p class="cs-note">いまのミッション</p><div class="cs-mis"><b>${esc(M.title)}</b><small>${esc(M.how)}${M.need > 1 ? `(${M.got || 0}/${M.need})` : ''}</small></div>${btns([['go', 'つづける', 'cs-go'], ['drop', 'やめて、ほかのことにする']])}`, (ov, close) => on(ov, close, { go: () => go(M), drop: () => { M = null; save(); open(o); } }));
    const t = task();
    if (t && !core.member.today().task && !o.skipTask) {
      const ways = taskWays(t);
      return sheet(`<h3>今日なにする?</h3><div class="cs-mis"><b>今日の課題:「${esc(t.title)}」</b><small>${esc(t.ja || '')} ・ クリアでコイン +${core.econ.daily.task}</small></div><p class="cs-note">どうやって読む?</p>${btns([...ways.map(w => [w[0], w[1], 'cs-go']), ['other', 'ほかのことをする']])}`, (ov, close) => on(ov, close, { ...Object.fromEntries(ways.map(w => [w[0], () => begin(w[2])])), other: () => open({ ...o, skipTask: true }) }));
    }
    mood();
  }
  function mood() {
    sheet(`<h3>今日なにする?</h3><p class="cs-note">どんな気分?</p>${btns([['study', '勉強気分'], ['game', '遊び気分'], ['free', '自由にする']])}`, (ov, close) => on(ov, close, {
      study: () => time(t => catSel(t)), game: () => time(t => result('game', t, 0)), free: () => free(),
    }));
  }
  function time(cb) { sheet(`<h3>今日なにする?</h3><p class="cs-note">時間は?</p>${btns([['s', '5分以内'], ['l', 'それ以上'], ['any', '決めてない']])}`, (ov, close) => on(ov, close, { s: () => cb('s'), l: () => cb('l'), any: () => cb('any') })); }
  function catSel(t) { sheet(`<h3>今日なにする?</h3><p class="cs-note">何を勉強する?</p>${btns(CATS.map(c => [c.k, c.n]))}`, (ov, close) => on(ov, close, Object.fromEntries(CATS.map(c => [c.k, () => result(c.k, t, 0)])))); }
  function result(cat, t, i, shown) {
    const list = candidates(cat, t), seen = shown || [];
    const rest = list.filter(x => !seen.includes(x.type)), m = rest[0] || list[i % Math.max(1, list.length)];
    if (!m) return sheet(`<h3>今日なにする?</h3><p class="cs-note">この組み合わせでできることが、このアプリにはありません。</p>${btns([['back', 'えらびなおす'], ['free', '自由にする']])}`, (ov, close) => on(ov, close, { back: mood, free }));
    sheet(`<h3>これでいい?</h3><div class="cs-mis"><b>${esc(m.title)}</b><small>${esc(m.how)}</small></div>${btns([['ok', 'はじめる', 'cs-go'], ...(list.length > 1 ? [['next', 'ほかのにする']] : []), ['back', 'えらびなおす']])}`, (ov, close) => on(ov, close, {
      ok: () => begin({ ...m, cat }), next: () => result(cat, t, i + 1, rest.length > 1 ? [...seen, m.type] : []), back: mood,
    }));
  }
  // ---- 自由にする：3Dの町(アバター)か、自宅の勉強ノート ----
  function free() {
    const list = [];
    if (core.to3D) list.push(['town', '3Dの町を歩く']);
    list.push(['note', '自宅の勉強ノートから']);
    if (!core.to3D) list.push(['map', '地図から施設を選ぶ']);
    sheet(`<h3>自由にする</h3><p class="cs-note">ミッションなしで、好きに遊べます(記録には入ります)。</p>${btns(list)}`, (ov, close) => on(ov, close, {
      town: () => to3DAt(), note: () => core.study.open({ play: core.openGame, has: hasGame, tab: 'note' }), map: () => { },
    }));
  }
  // ---- クリアのあと：これからどうしますか? ----
  function after(coins) {
    const last = M;
    sheet(`<h3>ミッションクリア!</h3><div class="cs-mis"><b>${esc(last.title)}</b><small>${coins ? `今日の課題のコイン +${coins}` : 'よくできました'}</small></div><p class="cs-note">これからどうしますか?</p>
      ${btns([['more', 'もっとやりたい(同じ系統)'], ['any', 'テキトーにおすすめしてほしい'], ['free', '自由に遊ぶ'], ['coin', 'もっとコインが欲しい'], ['rec', '自分の記録を見る']])}`, (ov, close) => on(ov, close, {
      more: () => result(last.cat && last.cat !== 'any' ? last.cat : (last.cats || ['any'])[0], 'any', 0, [last.type]),
      any: () => result('any', 'any', 0, [last.type]), free: () => free(), coin: () => coinWays(), rec: () => records(),
    }));
  }
  // もっとコイン：今日まだもらえるものだけ。全部もらい終えていたら「今日はここまで」→ 3Dの自宅か町へ
  function coinWays() {
    const d = core.member.today(), E = core.econ, list = [];
    if (d.cmLeft > 0) list.push(['cm', `CMを見る(+${E.daily.cm.each}・今日あと${d.cmLeft}回)`]);
    if (d.gameLeft > 0) list.push(['game', `ゲームのごほうび(今日あと${d.gameLeft}枚まで)`]);
    if (!d.task && task()) list.push(['task', `今日の課題(+${E.daily.task})`]);
    const dd = new Date(), omiKey = `${dd.getFullYear()}${dd.getMonth()}${dd.getDate()}`; let omiDone = false; try { omiDone = JSON.parse(localStorage.getItem('town:app:omikuji:day')) === omiKey; } catch (e) { }   // 3Dの町のおみくじ(1日1回)
    if (core.to3D && !omiDone) list.push(['omi', '3Dの町の神社でおみくじ(1日1回)']);
    const home = core.to3D ? [['home', '3Dの自宅へ'], ['town', '3Dの町へ']] : [['map', '地図へもどる']];
    if (!list.length) {
      return sheet(`<h3>今日はここまで</h3><p class="cs-note">今日もらえるコインは、もう全部もらいました。また明日!</p>${btns(home)}`, (ov, close) => on(ov, close, { home: toHome3D, town: () => to3DAt(), map: () => { } }));
    }
    sheet(`<h3>もっとコインが欲しい</h3><p class="cs-note">今日まだもらえるもの</p>${btns(list)}`, (ov, close) => on(ov, close, {
      cm: () => { const g = core.member.earn('cm'); core.ui.toast(g ? `コイン +${g}(CMはアプリにしたときに本物を入れます)` : '今日はもう見られません'); setTimeout(coinWays, 600); },
      game: () => time(t => result('game', t, 0)), task: () => open({}), omi: () => to3DAt(t => { t.goToApp('omikuji'); core.ui.toast('おさいせん箱の前です。「おまいりする」でおみくじが引けます'); }),
    }));
  }
  // 3Dの町へ行き、最初の画面は飛ばして(前に選んだキャラ・はじめてなら最初のキャラ)、そこで fn
  async function to3DAt(fn) {
    try { core.host.close(); } catch (e) { }   // 開いているゲームは閉じてから
    try { await core.to3D(); } catch (e) { }
    let n = 0; const tick = () => { const t = window.town3d; if (t && t.quickStart) { try { t.quickStart(); fn && fn(t); } catch (e) { console.error(e); } } else if (n++ < 40) setTimeout(tick, 250); };
    setTimeout(tick, 300);
  }
  const toHome3D = () => to3DAt(t => t.openApp('home'));
  // 自分の記録(みんなとのランキングは、アカウントとつないだあと)
  function records() {
    const json = v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return null; } };
    const sv = json(createStore('stream').get('chunkstream.v1')) || {}, cs = json(createStore('chunkchunk').get('ccs3-settings')) || {}, vs = createStore('cards').get('vs') || {};
    const runs = Object.entries(sv.best || {}).filter(([, b]) => b && b.run).map(([id, b]) => `<li><span>ストリーム ${esc(id)} 通し</span><b>${b.run.time}秒 ${b.run.rank}</b></li>`);
    const chal = Object.entries(cs.bestTimed || {}).flatMap(([band, o]) => Object.entries(o || {}).map(([sec, v]) => `<li><span>チャレンジ ${sec}秒(${esc(band)})</span><b>${v}点</b></li>`));
    const cards = Object.entries(vs).map(([id, r]) => `<li><span>カード ${esc(OPPN[id] || id)}</span><b>${r.w}勝 ${r.l}敗</b></li>`);
    const sc = core.level ? core.level.score() : null;
    sheet(`<h3>自分の記録</h3>${sc ? `<ul class="cs-stat"><li><span>総合</span><b>${sc.total}点 ・ ${sc.rank}</b></li><li><span>クリアしたミッション</span><b>${H.cleared || 0}個</b></li></ul>` : ''}
      <ul class="cs-stat">${[...runs, ...chal, ...cards].join('') || '<li><span>まだ記録がありません</span></li>'}</ul><p class="cs-note">みんなとのランキングは、アカウントとつないだあとに出ます。</p>`);
  }
  return { open, after, current: () => M, cleared: () => H.cleared || 0, clear() { M = null; save(); }, onChange(f) { subs.add(f); return () => subs.delete(f); } };
}
