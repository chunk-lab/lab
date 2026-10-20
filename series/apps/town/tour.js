/* 街のツアー（チュートリアル）：建物を1つずつ巡って、説明を聞いて、実際に入って触る。
   コースごとに区切ってあるので、右上の「？」からいつでも見たいところだけ見直せる。
   台本は COURSES を書きかえる（w: g＝女の子／b＝男の子、at: 光らせる建物、tap: その建物をタップするまで待つ）。 */
import { createStore } from '../../core/store.js';
const CH = 'g/chunkchunk/img/chara/';
const face = (w, f) => `${CH}${w === 'g' ? 'girl' : 'boy'}/${f || 'normal'}.webp`;
const NAME = { g: '女の子', b: '男の子' };
const COURSES = [
  { id: 'intro', n: '街のあるきかた', steps: [
    { w: 'g', f: 'joy', t: 'ようこそ、チャンクタウンへ！' },
    { w: 'b', t: 'ここは、英語を楽しく鍛える街だよ。' },
    { w: 'g', t: '建物をタップすると、中に入れるよ。' },
    { w: 'b', t: '中から街にもどるときは、左下の「🏠 街へ」を押してね。' },
    { w: 'g', t: '右上の⚙では、音・読み上げ・見た目を変えられるよ。' },
    { w: 'b', t: '左上のきみの顔は、プロフィール。なまえやアバターを変えられるよ。' },
    { w: 'g', f: 'idea', t: 'それじゃ、建物をひとつずつ回ってみよう！' }] },
  { id: 'school', n: '学校', steps: [
    { w: 'b', t: 'ここは学校。チャンクを練習するところだよ。', at: 'school' },
    { w: 'g', t: 'チャンクは、意味のまとまりのこと。英語は、まとまりごとに読むと分かりやすいんだ。', at: 'school' },
    { w: 'b', t: 'レッスンでは、お話を読みながら、まとまりの切り方を覚えていくよ。', at: 'school' },
    { w: 'g', t: '最初の章から、順番にゲーム感覚で進められるよ。', at: 'school' },
    { w: 'b', f: 'idea', t: 'さっそく入ってみよう。光っている学校をタップ！', tap: 'school' },
    { w: 'g', f: 'joy', t: 'おかえり！ レッスンは、あとから続きができるよ。' }] },
  { id: 'library', n: '図書館', steps: [
    { w: 'g', t: 'ここは図書館。英語の文章を読むところだよ。', at: 'library' },
    { w: 'b', t: '文章を、チャンクごとに区切りながら読めるんだ。', at: 'library' },
    { w: 'g', t: '分からない単語は、辞書で意味を見られるよ。', at: 'library' },
    { w: 'b', t: '「英語脳アプリ」もここにあるよ。絵を見ながら英文を組み立てる、英語のシミュレータだよ。', at: 'library' },
    { w: 'g', f: 'idea', t: '入ってみよう。光っている図書館をタップ！', tap: 'library' },
    { w: 'b', f: 'joy', t: 'おかえり！ 読みたい文章は、いつでも読み直せるよ。' }] },
  { id: 'game', n: 'ゲームセンター', steps: [
    { w: 'b', t: 'ここはゲームセンター。遊びながら英語が鍛えられるよ。', at: 'game' },
    { w: 'g', t: '「チャンクチャンク」は、英文が横に流れてくるよ。', at: 'game' },
    { w: 'g', t: '▶で1語ずつ進めて、意味の切れ目で「区切る」を押してね。', at: 'game' },
    { w: 'b', t: 'まちがえたら、◀で戻れるよ。', at: 'game' },
    { w: 'b', t: '切れ目が合うと点が入って、続けるとコンボになるんだ。', at: 'game' },
    { w: 'b', t: '「チャンクストリーム」は、流れてくる単語やチャンクを4択で答えて、長文を完成させるゲームだよ。', at: 'game' },
    { w: 'g', t: '「ぷにチャンク」は、バブルを英語の順につないで文を作るパズル。', at: 'game' },
    { w: 'b', t: '「チャンク・カード」は、英文で役を作るカードゲーム。CPUとの対戦もあるよ。', at: 'game' },
    { w: 'g', f: 'idea', t: '好きなゲームを1つ触ってみよう。光っているゲームセンターをタップ！', tap: 'game' },
    { w: 'b', f: 'joy', t: 'おかえり！ ほかのゲームも、また遊んでみてね。' }] },
  { id: 'house', n: '自宅', steps: [
    { w: 'g', t: 'ここは自宅。きみのプロフィールが見られるよ。', at: 'house' },
    { w: 'b', t: 'なまえやアバターを変えられるよ。', at: 'house' },
    { w: 'g', f: 'idea', t: 'のぞいてみよう。自宅をタップ！', tap: 'house' }] },
  { id: 'shop', n: 'ショップ', steps: [
    { w: 'b', t: 'ここはショップ。有料のコンテンツを売る予定の場所だよ。', at: 'shop' },
    { w: 'g', t: '今は、まだ準備中。楽しみにしててね。', at: 'shop' }] },
  { id: 'outro', n: 'おわりに', steps: [
    { w: 'g', f: 'joy', t: 'これで、案内はおしまい！' },
    { w: 'b', t: '分からなくなったら、右上の「？」から、いつでも見直せるよ。' },
    { w: 'g', f: 'joy', t: 'さあ、街で遊んでみよう！' }] }
];
const ALL = COURSES.map(c => c.id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createTour(core) {
  const store = createStore('town');
  const load = () => Object.assign({ done: false, courses: {} }, store.get('tour') || {});
  const save = v => store.set('tour', v);
  const map = () => document.getElementById('twMap');
  let queue = [], ci = 0, si = 0, box = null, dim = null, hi = null, touched = false, on = false;

  function clearHi() { if (hi) hi.classList.remove('tour-on'); hi = null; }
  function end(completed) {
    on = false; clearHi();
    if (box) { box.remove(); box = null; } if (dim) { dim.remove(); dim = null; }
    const v = load();
    if (completed) { queue.forEach(id => { v.courses[id] = 1; }); if (queue.length === ALL.length) v.done = true; }
    else v.done = true;   // とばしたら、次から自動では始めない
    save(v); queue = [];
  }
  function cur() { return COURSES.find(c => c.id === queue[ci]).steps[si]; }
  function next() {
    const c = COURSES.find(x => x.id === queue[ci]);
    si++;
    if (si >= c.steps.length) {
      const v = load(); v.courses[c.id] = 1; save(v);
      ci++; si = 0;
      if (ci >= queue.length) return end(true);
    }
    render();
  }
  function render() {
    const s = cur(); touched = false;
    if (!dim) { dim = document.createElement('div'); dim.className = 'tour-dim'; map().appendChild(dim); }
    clearHi();
    const k = s.tap || s.at;
    if (k) { hi = document.querySelector(`.tw-bld[data-k="${k}"]`); if (hi) hi.classList.add('tour-on'); }
    if (!box) {
      box = document.createElement('div'); box.className = 'tour-box';
      box.innerHTML = '<img class="tf" alt=""><div class="tn"></div><div class="tx"></div><button class="tskip">とばす</button><div class="tnx">▶</div>';
      box.onclick = e => { if (e.target.closest('.tskip')) return; if (!cur().tap) next(); else if (e.target.closest('.tnx')) next(); };
      box.querySelector('.tskip').onclick = () => end(false);
      document.body.appendChild(box);
    }
    box.querySelector('.tf').src = face(s.w, s.f);
    const nm = box.querySelector('.tn'); nm.textContent = NAME[s.w]; nm.className = 'tn ' + s.w;
    box.querySelector('.tx').textContent = s.t;
    const nx = box.querySelector('.tnx'); nx.textContent = s.tap ? 'つぎへ ▶' : '▶'; nx.classList.toggle('btn', !!s.tap);
    box.classList.toggle('wait', !!s.tap);
    box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  }
  function start(ids) {
    if (on) end(false);
    queue = ids.slice(); ci = 0; si = 0; on = true; render();
  }
  function menu() {
    const v = load();
    core.ui.sheet(`<h3>街のツアー</h3><ul class="tw-list"><li><button data-c="all">はじめから通して見る<small>${v.done ? '✅' : '›'}</small></button></li>` +
      COURSES.filter(c => c.id !== 'outro').map(c => `<li><button data-c="${c.id}">${esc(c.n)}<small>${v.courses[c.id] ? '✅ 見た' : '見る ›'}</small></button></li>`).join('') + '</ul>',
      (ov, close) => ov.querySelectorAll('button[data-c]').forEach(b => b.onclick = () => { close(); start(b.dataset.c === 'all' ? ALL : [b.dataset.c]); }));
  }
  return {
    /* 初めて街に来たときだけ、自動で始める */
    auto() { if (!load().done && !document.body.classList.contains('cs-in-game')) setTimeout(() => { if (!on && !load().done) start(ALL); }, 700); },
    menu,
    active: () => on,
    /* 建物をタップしたとき：いま待っている建物なら「触った」ことにする */
    tapped(k) { if (on && cur().tap === k) { touched = true; box && box.classList.add('touched'); } },
    /* ゲームから街にもどったとき：触ったあとなら、つぎへ進む */
    afterClose() { if (on && cur().tap && touched) next(); }
  };
}
