/* そら・はなの案内。ストーリーと同じ形の会話の窓(下に名前札つきの窓・顔絵・タップで次へ・選択肢は大きいボタン)。
   そら: 「教えて」=勉強の仕方(少しずつ進む)・レッスン(読む・聞く/話す・書く)、「今日なにする?」
   はな: キャラストーリーの一覧
   町(3D)の中からも、タイトルからも、同じものを開く(ここ1か所だけで作る)。 */
import { SORA, HANA } from './guide_pics.js';
import { runCoach } from './coach.js';
import { createStore } from './store.js';
import { WANTS, TIMES, MOODS } from './plays.js';
import './guide.css';
const NAME = { sora: 'そら', hana: 'はな' }, PIC = { sora: SORA, hana: HANA };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const STOP = { stop: true };
const dayKey = () => { const d = new Date(Date.now() + 9 * 36e5); return d.toISOString().slice(0, 10); };

export function createGuide(core, deps = {}) {
  const st = createStore('guide');
  const has = g => (deps.has ? deps.has(g) : true);
  const admin = () => !!(core.admin && core.admin.on && core.admin.on());
  let ov = null, pend = null;
  // ---- 会話の窓 ----
  function mount() {
    if (ov) return;
    ov = document.createElement('div'); ov.className = 'gd-ov';
    ov.innerHTML = '<div class="gd-dim"></div><button class="gd-x" type="button">とじる ✕</button><div class="gd-ch"></div><div class="gd-box"><img class="gd-pic" alt=""><div class="gd-name"></div><div class="gd-text"></div><div class="gd-more">▼</div></div>';
    document.body.appendChild(ov);
    ov.querySelector('.gd-x').onclick = e => { e.stopPropagation(); close(); };
    ov.addEventListener('click', () => { if (pend && pend.tap) pend.tap(); });
  }
  function close() {
    if (pend) { const p = pend; pend = null; clearInterval(p.tick); p.rej(STOP); }
    if (ov) { ov.remove(); ov = null; }
  }
  const q = s => ov.querySelector(s);
  function head(who) {
    q('.gd-name').textContent = NAME[who] || '';
    const pic = q('.gd-pic'); if (PIC[who]) pic.src = PIC[who]; else pic.removeAttribute('src');
  }
  function say(who, text) {
    mount(); head(who);
    const box = q('.gd-box'), tx = q('.gd-text'); q('.gd-ch').innerHTML = ''; ov.classList.remove('asking'); box.classList.remove('done');
    return new Promise((res, rej) => {
      const chars = [...text]; let i = 0;
      const p = pend = { rej };
      const finish = () => { clearInterval(p.tick); tx.textContent = text; box.classList.add('done'); p.done = true; };
      p.tick = setInterval(() => { i++; tx.textContent = chars.slice(0, i).join(''); if (i >= chars.length) finish(); }, 32);
      p.tap = () => { if (!p.done) { finish(); return; } pend = null; res(); };
    });
  }
  // opts: [{ t:'ボタンの文字', sub:'小さい説明', mark:'✓', off:true(押せない) }] → 選んだ番号
  function ask(who, text, opts) {
    mount(); head(who);
    const box = q('.gd-box'); q('.gd-text').textContent = text; box.classList.add('done'); ov.classList.add('asking');
    const ch = q('.gd-ch'); ch.innerHTML = opts.map((o, i) => `<button type="button" data-i="${i}" class="${o.off ? 'off' : ''}${o.main ? ' main' : ''}">${o.mark ? `<i>${esc(o.mark)}</i>` : ''}<span>${esc(o.t)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span></button>`).join('');
    ch.scrollTop = 0;
    return new Promise((res, rej) => {
      pend = { rej, tap: null };
      ch.onclick = e => { e.stopPropagation(); const b = e.target.closest('button'); if (!b) return; pend = null; ch.innerHTML = ''; ov.classList.remove('asking'); res(+b.dataset.i); };
    });
  }
  // 会話を1つ始める(前の会話は閉じる)。とじる✕で止めたときは、なにもしない
  async function run(fn) { close(); try { await fn(); } catch (e) { if (e !== STOP) console.error(e); } }
  const away = () => close();   // アプリやゲームへ移るとき

  // ---- そら: 勉強の仕方(1日に1つずつ進む) ----
  const mst = () => Object.assign({ done: [], day: '' }, st.get('method') || {});
  const METHOD = [
    { id: 'word', title: '単語を覚えて、英ラボで使う', run: mWord },
    { id: 'pos', title: '品詞ってなに?', run: mPos },
    { id: 'chunk', title: 'チャンクで読む', run: mChunk },
    { id: 'box', title: 'いろんなゲームで鍛える', run: mBox },
  ];
  const markDone = id => { const s = mst(); if (!s.done.includes(id)) { s.done.push(id); s.day = dayKey(); st.set('method', s); } };
  const nextM = () => { const s = mst(); return METHOD.find(m => !s.done.includes(m.id)) || null; };
  const waitToday = () => { const s = mst(); return !admin() && s.day === dayKey(); };   // 今日もう1つ進めた
  async function methodMenu() {
    const s = mst(), nx = nextM(), wait = waitToday();
    const opts = METHOD.map((m, i) => {
      const done = s.done.includes(m.id), isNext = nx && nx.id === m.id;
      return { t: `${i + 1}. ${m.title}`, mark: done ? '✓' : isNext && !wait ? '▶' : '🔒', sub: done ? 'もう一度聞く' : isNext ? (wait ? 'また明日、教えるね' : 'つぎはこれ!') : '', off: !done && !(isNext && !wait), main: isNext && !wait };
    });
    const i = await ask('sora', nx ? (wait ? '「今日はもう1つ進んだね! つづきは、また明日。\nおさらいなら、いつでもどうぞ」' : '「どれを聞く? 少しずつ進もうね」') : '「ぜんぶ教えたよ! おさらいも、いつでもどうぞ」', [...opts, { t: '← もどる' }]);
    if (i >= METHOD.length) return teach();
    if (opts[i].off) { await say('sora', '「それは、前のを聞いてからね」'); return methodMenu(); }
    return METHOD[i].run();
  }
  async function mWord() {
    await say('sora', '「英語の勉強で、まず大事なのは単語だよね」');
    await say('sora', '「でも、覚えるだけじゃもったいない!\n覚えた単語は、使ってみてはじめて、自分のものになるんだ」');
    await say('sora', '「このアプリでは、覚えたい単語を『英ラボ』(英文組み立てラボ)に登録すると、すぐに文の中で使えるよ」');
    const c = await ask('sora', '「いっしょに、やってみよう!」', [{ t: 'やってみる', main: true }, { t: 'あとで' }]);
    if (c) return;
    away(); let saved = false;
    const off = core.events.on((game, name) => { if (game === 'eigonou' && name === 'word') saved = true; });
    core.openGame('eigonou');
    const E = s => document.querySelector('.ct-eigo ' + s), vis = s => { const el = E(s); return !!el && !el.hidden; };
    const t0 = Date.now(); while (!E('.nav [data-v="reg"]') && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 300));
    if (!E('.nav [data-v="reg"]')) { off(); return; }
    const val = s => ((E(s) || {}).value || '').trim();
    runCoach([
      { w: 'b', t: '下の「ことば登録」を押してね。', sel: '.ct-eigo .nav [data-v="reg"]', wait: () => vis('[data-view="reg"]') },
      { w: 'b', t: '「英語」と「日本語」に、覚えたい単語を入れてね。\n思いつかなければ、a latte(ラテ)でもいいよ。', sel: '.ct-eigo .regf', wait: () => saved || (val('#rEn') && val('#rJa') && !['rEn', 'rJa'].includes((document.activeElement || {}).id)) },
      { w: 'b', t: 'どこで使う言葉かは、自動で決まるよ。\n下の「この言葉を登録してゲームで使う」を押してね。', sel: '#rSave', wait: () => saved },
      { w: 'b', f: 'joy', t: '登録できた!\nつぎは、下の「つくる」を押してみて。', sel: '.ct-eigo .nav [data-v="make"]', wait: () => vis('[data-view="make"]') },
      { w: 'b', t: '言葉が入る場所をタップすると、登録した単語を選べるよ。\nいろいろ組み合わせて、文を作ってみてね!' },
      { w: 'b', f: 'idea', t: '覚える → 使う。\nこれが、単語を自分のものにするコツだよ!' },
    ], { face: () => SORA, names: { b: 'そら' }, onDone: ok => { off(); if (ok || saved) markDone('word'); } });
  }
  async function mPos() {
    const k = await ask('sora', '「ねえ、『品詞』って知ってる?」', [{ t: '知ってる!' }, { t: '聞いたことはある' }, { t: '知らない' }]);
    if (k === 0) await say('sora', '「さすが! じゃあ、ここは軽くおさらいだけね」');
    else {
      await say('sora', '「単語には、それぞれ『役割』があるんだ。\nその役割のことを、『品詞』っていうよ」');
      await say('sora', '「たとえば、apple は『もの』。eat は『する』。red は『どんな』」');
      await say('sora', '「かんたんに言うと、\n『なかよしになれる組み合わせがある』ってこと」');
    }
    const a = await ask('sora', '「red(赤い)と なかよしなのは、どっち?」', [{ t: 'apple(りんご)' }, { t: 'eat(食べる)' }]);
    await say('sora', a === 0 ? '「正解! red apple(赤いりんご)。\n『どんな』は、『もの』となかよしなんだ」' : '「おしい! red eat(赤く食べる?)は、ちょっと変だよね。\nred apple(赤いりんご)。『どんな』は、『もの』となかよしなんだ」');
    await say('sora', '「英ラボで、言葉が『人・もの』『する』『どんな』に分かれていたでしょ? あれが、この役割だよ」');
    markDone('pos');
    await say('sora', '「文法の用語は、たくさんあるけど、振り回されなくて大丈夫」');
    await say('sora', '「どの言葉と、どの言葉が なかよしか。\nそれが分かれば、英語はもっとシンプルになるよ!」');
    await say('sora', '「次は、このアプリのいちばんの特徴、『チャンク』を教えるね。\nまた今度!」');
  }
  async function mChunk() {
    await say('sora', '「チャンクっていうのは、『意味のかたまり』のこと」');
    await say('sora', '「英語を1語ずつ訳すと、頭がこんがらがるよね。\nだから、かたまりごとに区切って、前から順に意味をつかむんだ」');
    await say('sora', '「I went / to the park / with my friend.\nわたしは行った / 公園に / 友だちと」');
    await say('sora', '「ね? 英語の順番のままで、ちゃんと分かるでしょ」');
    const a = await ask('sora', '「じゃあ問題。She plays tennis after school.\nいい区切り方は、どっち?」', [{ t: 'She plays tennis / after school.' }, { t: 'She / plays tennis after / school.' }]);
    await say('sora', a === 0 ? '「正解! 彼女はテニスをする / 放課後に。\nかたまりごとだと、すっと入ってくるよね」' : '「おしい! after school(放課後に)で、ひとかたまり。\n彼女はテニスをする / 放課後に、だね」');
    markDone('chunk');
    await say('sora', '「完璧な英語を目指さなくていいんだ。\nかたまりで、シンプルに分かれば、それでOK!」');
    const c = await ask('sora', '「チャンクで読む練習は、『今スラ!』でできるよ。\n1回やってみる?」', [{ t: 'やってみる', main: true }, { t: 'またあとで' }]);
    if (c === 0 && has('chunkchunk')) { away(); core.openGame('chunkchunk', { face: 'arcade' }); }
  }
  async function mBox() {
    await say('sora', '「単語とチャンクのほかにも、英語の力をつけるゲームが、いろいろあるんだ」');
    await say('sora', '「家のテレビの『チャンクボックス』には、\n文の並べ替え・聞き取り早押し・チャンクレース・単語ダッシュ…\n英語のミニゲームが入ってるよ」');
    await say('sora', '「勉強っぽくなくても、遊んでいるうちに、\n英語の順番や音に、だんだん慣れてくるんだ」');
    markDone('box');
    const c = await ask('sora', '「たまには、いっしょに遊ぼうね! いま行ってみる?」', [{ t: '遊んでみる', main: true }, { t: 'またあとで' }]);
    if (c === 0 && deps.openTownApp) { away(); deps.openTownApp('gamebox'); }
  }
  // ---- そら: レッスン ----
  async function lessons() {
    const i = await ask('sora', '「どのレッスンにする?」', [
      { t: '📖 読む・聞く', sub: 'チャンクで読んで、聞くお話' },
      { t: '✏️ 話す・書く', sub: '文を作るレッスン(つづきから)' },
      { t: '← もどる' }]);
    if (i === 2) return teach();
    if (!has('chunkchunk')) { await say('sora', '「ごめん、このアプリには、まだ入っていないんだ」'); return; }
    away(); core.openGame('chunkchunk', i === 0 ? { face: 'lesson', open: 'story' } : { face: 'lesson', lesson: 'next' });
  }
  async function teach(first) {
    const nx = nextM();
    const i = await ask('sora', first || '「なにを教えてほしい?」', [
      { t: '📘 勉強の仕方', sub: nx ? (waitToday() ? 'つづきは、また明日' : `つぎ: ${nx.title}`) : 'ぜんぶ聞いたよ(おさらい)', main: !!nx && !waitToday() },
      { t: '📖 レッスン', sub: '読む・聞く / 話す・書く' },
      { t: 'またあとで' }]);
    if (i === 0) return methodMenu();
    if (i === 1) return lessons();
    close();
  }
  // ---- そら: 今日なにする? ----
  async function today() {
    const last = core.record && core.record.last && core.record.last();
    const resume = last && last.game && has(last.game) ? { t: `▶ つづきから`, sub: last.label || '' } : null;
    const W = await ask('sora', '「今日は、なにしたい?」', [...(resume ? [resume] : []), ...WANTS.map(x => ({ t: x.n })), { t: 'またあとで' }]);
    if (resume && W === 0) { away(); core.openGame(last.game, last.opts); return; }
    const wi = W - (resume ? 1 : 0); if (wi >= WANTS.length) { close(); return; }
    const T = await ask('sora', '「時間は、どのくらいある?」', TIMES.map(x => ({ t: x.n })));
    const M = await ask('sora', '「気分は?」', MOODS.map(x => ({ t: x.n })));
    const ok = p => !p.go.game || has(p.go.game);
    const rec = core.today.pick({ want: WANTS[wi].k, time: TIMES[T].k, mood: MOODS[M].k }).filter(ok).slice(0, 3);
    if (!rec.length) { await say('sora', '「ごめん、その組み合わせのは、まだないんだ。\nほかのにしてみて!」'); return today(); }
    const i = await ask('sora', '「それなら、これがおすすめ!」', [...rec.map((p, k) => ({ t: p.n, sub: k === 0 ? 'いちばんのおすすめ' : '', main: k === 0 })), { t: '← えらびなおす' }]);
    if (i >= rec.length) return today();
    away(); core.today.go(rec[i]);
  }
  // ---- はな: キャラストーリー ----
  async function stories() {
    const L = deps.storyList ? deps.storyList() : [];
    const first = L.findIndex(e => !e.done), open = i => admin() || L[i].done || first < 0 || i <= first;
    const i = await ask('hana', '「どのお話を見る?」', [...L.map((e, k) => ({ t: e.label ? `${e.label}「${e.title}」` : `第${e.no}話「${e.title}」`, mark: e.done ? '✓' : open(k) ? '▶' : '🔒', sub: e.done ? 'もう一度見る' : open(k) ? (e.started ? 'つづきから' : 'つぎはこれ!') : '前のお話を見ると、見られるよ', off: !open(k), main: k === first })), { t: 'またあとで' }]);
    if (i >= L.length) { close(); return; }
    if (!open(i)) { await say('hana', '「そのお話は、前のお話を見てからね!」'); return stories(); }
    away(); deps.openStory && deps.openStory(L[i].i);
  }
  return {
    sora: (first) => run(() => teach(first)),
    today: () => run(today),
    stories: () => run(stories),
    close,
    get open() { return !!ov; },
  };
}
