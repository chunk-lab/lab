/* 街のツアー（チュートリアル）：建物を1つずつ巡って、説明を聞いて、実際に入って触る。
   コースごとに区切ってあるので、右上の「？」からいつでも見たいところだけ見直せる。
   台本は COURSES を書きかえる（w: g＝女の子／b＝男の子、at: 光らせる建物、tap: その建物をタップするまで待つ）。 */
import { createStore } from '../../core/store.js';
const CH = 'g/chunkchunk/img/chara/';
const face = (w, f) => `${CH}${w === 'g' ? 'girl' : 'boy'}/${f || 'normal'}.webp`;
const NAME = { g: '女の子', b: '男の子' };
const COURSES = [
  { id: 'intro', n: '街のしょうかい', steps: [
    { w: 'g', f: 'joy', t: 'ようこそ、チャンクタウンへ！' },
    { w: 'b', t: '建物をタップすると、中に入れるよ。' },
    { w: 'g', t: '学校では、チャンクの練習ができるよ。', at: 'school' },
    { w: 'b', t: '図書館では、英語の文章を読めるよ。', at: 'library' },
    { w: 'g', t: 'ゲームセンターでは、遊びながら英語を鍛えられるよ。', at: 'game' },
    { w: 'b', t: '自宅では、なまえやアバターを変えられるよ。', at: 'house' },
    { w: 'g', f: 'idea', t: '遊び方は、各ゲームの「遊び方」から見られるよ。' },
    { w: 'b', t: '中から街にもどるときは、左下の「🏠 街へ」を押してね。' }] }
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
  function menu() { start(ALL); }
  return {
    /* 初めて街に来たときだけ、自動で始める */
    auto() { if (!load().done && !document.body.classList.contains('cs-in-game')) setTimeout(() => { if (!on && !load().done) start(ALL); }, 700); },
    menu,
    active: () => on,
    /* 建物をタップしたとき：いま待っている建物なら「触った」ことにする */
    tapped(k) { if (on && cur().tap === k) { touched = true; box && box.classList.add('touched'); } },
    entering() { },
    /* ゲームから街にもどったとき：触ったあとなら、つぎへ進む */
    afterClose() { if (on && cur().tap && touched) next(); }
  };
}
