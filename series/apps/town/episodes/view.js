import { createStore } from '../../../core/store.js';
import { loadScript } from '../../../core/host.js';
import { FIRST_EPISODE } from './first.js';
import { createEpisodeProgress } from './progress.js';
import './view.css';

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NAME = { hana: 'はな', sora: 'そら' };
// 一枚絵の背景。2Dではthree.jsや町を読み込まない。
const ROOM = `<svg viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-label="はなちゃんの勉強部屋" role="img"><defs><linearGradient id="epwall" x2="0" y2="1"><stop stop-color="#f5eee7"/><stop offset="1" stop-color="#e4dfd8"/></linearGradient><linearGradient id="epsky" x2="0" y2="1"><stop stop-color="#b6dce9"/><stop offset="1" stop-color="#edf6e3"/></linearGradient></defs><path fill="url(#epwall)" d="M0 0h900v460H0z"/><path fill="#d6b998" d="M0 460h900v240H0z"/><path stroke="#c3a380" stroke-width="2" d="M0 520h900M0 600h900M80 460 0 700M290 460 240 700M500 460 520 700M710 460 820 700"/><rect x="70" y="65" width="260" height="245" rx="5" fill="#fff9ed"/><rect x="83" y="78" width="234" height="218" fill="url(#epsky)"/><path fill="#adcbac" d="M83 257q60-100 115 0 60-110 119-15v54H83z"/><path stroke="#fffaf0" stroke-width="10" d="M200 78v218M83 186h234"/><rect x="640" y="150" width="150" height="320" rx="4" fill="#ba9878"/><rect x="652" y="162" width="126" height="296" fill="#d5b697"/><circle cx="757" cy="324" r="6" fill="#a67e48"/><rect x="368" y="150" width="192" height="315" fill="#c4a581"/><path fill="#ece1c7" d="M380 164h168v86H380zm0 100h168v86H380zm0 100h168v86H380z"/><g fill="#a1b4b1"><rect x="392" y="185" width="19" height="62"/><rect x="418" y="177" width="17" height="70"/><rect x="464" y="284" width="23" height="63"/></g><g fill="#cd9d9f"><rect x="440" y="183" width="20" height="64"/><rect x="470" y="170" width="19" height="77"/><rect x="393" y="275" width="26" height="72"/></g><path fill="#e5c67d" d="M495 194h35v53h-35zm-64 94h23v59h-23z"/><ellipse cx="400" cy="575" rx="245" ry="62" fill="#bcb8d1"/><path fill="#c5a17d" d="M90 420h275v19H90zM110 439h16v120h-16zM330 439h16v120h-16z"/><path fill="#e3c7a1" d="M90 404h275v22H90z"/><path fill="#655f75" d="m205 331 85 6 9 63h-95z"/><path fill="#c7e7ee" d="m214 340 67 5 8 46h-76z"/><path fill="#9c889c" d="M168 468h87v18h-87zm0 18h12v90h-12zm75 0h12v90h-12z"/><path fill="#caafbb" d="M170 455h82v-58h-82z"/><path fill="#a7785d" d="m800 450 10 62h48l10-62z"/><g fill="#8cac89"><ellipse cx="824" cy="409" rx="15" ry="49" transform="rotate(-26 824 409)"/><ellipse cx="851" cy="405" rx="15" ry="52" transform="rotate(24 851 405)"/></g></svg>`;

export function createEpisodes(core, { games, depart, pauseTown = () => {}, resumeTown = () => {}, onStop = () => {} }) {
  const episode = FIRST_EPISODE;
  const progress = createEpisodeProgress(createStore('town-episodes'), episode);
  let root = null, bar = null, scene = null, stage = null, content = null, active = false, waiting = null, epoch = 0, error = '', pending = false, busy = false;
  let offEvent = null, offClose = null, previousFocus = null, background = [];
  const face = (who, f = 'normal') => core.base + 'g/chunkchunk/img/chara/' + (who === 'sora' ? 'boy' : 'girl') + '/' + f + '.webp';
  const stateText = () => progress.state.completed ? '第1話をもう一度見る' : progress.state.index ? '第1話のつづき' : '第1話をはじめる';
  function disposeScene() { scene?.dispose(); scene = null; }
  function stop(options = {}) {
    if (!active) return;
    active = false; epoch++; waiting = null; offEvent?.(); offClose?.(); offEvent = offClose = null;
    bar?.remove(); bar = null;
    disposeScene(); root?.remove(); root = null; stage = content = null;
    background.forEach(([el, inert]) => { el.inert = inert; }); background = [];
    document.body.classList.remove('ep-on'); core.speech.stop(); resumeTown(); previousFocus?.focus();
    onStop({ departed: options.departed === true });
  }
  function button(label, action, cls = '') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ep-btn ' + cls; b.textContent = label; b.onclick = action; return b;
  }
  function build() {
    root = document.createElement('section'); root.className = 'ep-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', '第1話 ちょっと、外に出たい');
    background = [...document.querySelectorAll('.hm-ov,.tw-view,.tw-top,.tw-dock')].map(el => [el, el.inert]);
    background.forEach(([el]) => { el.inert = true; });
    root.innerHTML = `<header class="ep-head"><div><small>ほしみや町の物語 ／ はなちゃんの視点</small><b>第1話　${episode.title}</b></div><nav></nav></header><div class="ep-stage">${ROOM}<div class="ep-portraits"><img class="ep-hana" alt="はな"><img class="ep-sora" alt="そら"></div></div><div class="ep-content" aria-live="polite"></div>`;
    document.body.appendChild(root); stage = root.querySelector('.ep-stage'); content = root.querySelector('.ep-content');
    root.querySelector('.ep-hana').src = face('hana'); root.querySelector('.ep-sora').src = face('sora');
    const nav = root.querySelector('nav');
    nav.append(button('2D / 3D', () => chooseMode()), button('中断', stop));
    document.body.classList.add('ep-on');
  }
  async function setMode(mode) {
    const ticket = ++epoch;
    pending = true; progress.mode(mode); disposeScene(); root.classList.remove('ep-3d');
    if (mode === '2d') { pending = false; return; }
    content.innerHTML = '<div class="ep-card"><h2>部屋を準備しています…</h2><p>重いときは「2Dで続ける」を選べます。</p></div>';
    content.firstChild.append(button('2Dで続ける', async () => { await setMode('2d'); render(); }));
    try {
      await loadScript(core.base + 'g/town3d/three.js');
      if (!active || ticket !== epoch) return;
      await loadScript(core.base + 'g/town3d/town.js');
      if (!active || ticket !== epoch) return;
      const target = document.createElement('div'); target.className = 'ep-webgl'; stage.appendChild(target);
      try {
        scene = window.Hoshimiya.mountEpisodeRoom(target, { onError: () => {
          if (active) { setMode('2d').then(() => { error = '3Dを続けられなかったため、2Dに切り替えました。'; render(); }); }
        } });
      } catch (e) { target.remove(); throw e; }
      // 独立した舞台。町や家具・アバターの保存を変更しない。
      const oldDispose = scene.dispose; scene.dispose = () => { oldDispose(); target.remove(); };
      root.classList.add('ep-3d');
    } catch (e) {
      console.error(e); if (!active || ticket !== epoch) return;
      progress.mode('2d'); error = '3Dの準備ができなかったため、2Dで続けます。';
    } finally { if (active && ticket === epoch) pending = false; }
  }
  function chooseMode() {
    if (!active || waiting) return;
    scene?.pause();
    content.innerHTML = `<div class="ep-card"><small>第1話</small><h2>${episode.title}</h2><p>はなちゃんを操作して、単語練習から始めよう。途中で中断しても続きから再開できます。</p><p class="ep-note">3Dと2Dで、物語と遊べる内容は同じです。</p></div>`;
    const card = content.firstChild;
    for (const [mode, label] of [['3d', '3Dで進める'], ['2d', '軽い2Dで進める']]) card.append(button(label, async () => {
      if (progress.state.completed) progress.restart();
      await setMode(mode); if (active && !pending) render();
    }, mode === '3d' ? 'ep-primary' : ''));
    card.append(button('勉強部屋にもどる', stop));
    card.querySelector('button')?.focus();
  }
  function drawBar() {
    bar?.remove();
    bar = document.createElement('aside'); bar.className = 'ep-gamebar'; bar.setAttribute('aria-label', '物語の進行');
    bar.append(button('物語を中断', () => { const game = waiting?.game; stop(); if (game && core.host.current === game) core.host.close(); }));
    if (progress.state.passed) bar.append(button('物語のつづきへ', () => {
      if (waiting && core.host.current === waiting.game) core.host.close();
    }, 'ep-primary'));
    else if (waiting?.game === 'eigonou') { /* 体験の終了ボタンは英語脳アプリ内にある */ }
    document.body.appendChild(bar);
  }
  async function launch() {
    if (waiting || busy || pending) return;
    const s = progress.step, game = games[s.game];
    if (!game) { error = 'このアプリでは開けません。'; render(); return; }
    if (core.host.current) { error = '開いているゲームを閉じてから、もう一度試してください。'; render(); return; }
    waiting = { game: s.game }; error = ''; scene?.pause();
    content.innerHTML = `<div class="ep-card" role="status"><h2>${esc(s.title)}を読み込んでいます…</h2></div>`;
    drawBar();
    const request = waiting;
    try {
      const ok = await core.host.open(game, { ...s.opts });
      if (!active || waiting !== request) return;
      if (ok) root.hidden = true;
      if (!ok) {
        // 読み込み失敗や権限不足では進行しない。
        error = 'ゲームを開けませんでした。もう一度試すか、物語を中断できます。';
        if (core.host.current === s.game) core.host.close();
        else { waiting = null; root.hidden = false; bar?.remove(); bar = null; render(); }
      }
    } catch (e) {
      console.error(e); if (!active || waiting !== request) return;
      error = 'ゲームを開けませんでした。もう一度試してください。';
      if (core.host.current === s.game) core.host.close();
      else { waiting = null; root.hidden = false; bar?.remove(); bar = null; render(); }
    }
  }
  async function leave() {
    if (busy) return; busy = true;
    const mode = progress.state.mode;
    disposeScene();
    content.innerHTML = '<div class="ep-card"><h2>二人は町へ出かけます…</h2></div>';
    try {
      await depart(mode);
      if (!active) return;
      progress.complete(); stop({ departed: true });
    } catch (e) {
      console.error(e); error = '町を開けませんでした。2Dに切り替えて出かけることもできます。'; render();
    } finally { busy = false; }
  }
  function render() {
    if (!active || pending || waiting) return;
    const s = progress.step;
    scene?.resume(); scene?.setSpeaker(s.who || 'hana');
    const img = root.querySelector(s.who === 'sora' ? '.ep-sora' : '.ep-hana');
    img.src = face(s.who || 'hana', s.face || 'normal');
    root.querySelector('.ep-hana').classList.toggle('ep-speaking', s.who === 'hana');
    root.querySelector('.ep-sora').classList.toggle('ep-speaking', s.who === 'sora');
    const err = error ? `<p class="ep-error" role="alert">${esc(error)}</p>` : '';
    if (s.type === 'say') {
      content.innerHTML = `<div class="ep-dialog"><b class="ep-name">${NAME[s.who]}</b><p class="ep-line">${esc(s.text)}</p>${s.en ? `<div class="ep-expression"><strong lang="en">${esc(s.en)}</strong><span>${esc(s.ja)}</span></div>` : ''}<div class="ep-actions"></div>${err}</div>`;
      const actions = content.querySelector('.ep-actions');
      if (s.en) actions.append(button('英語を聞く', () => core.speech.speak(s.en, { lang: 'en-US' })));
      actions.append(button('つぎへ', () => { core.speech.stop(); error = ''; progress.next(); render(); }, 'ep-primary'));
    } else if (s.type === 'game') {
      content.innerHTML = `<div class="ep-card"><small>やってみよう</small><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p>${err}</div>`;
      const card = content.firstChild;
      if (progress.state.passed) card.append(button('物語のつづきへ', () => { progress.next(); render(); }, 'ep-primary'));
      else card.append(button(error ? 'もう一度開く' : 'はじめる', launch, 'ep-primary'));
    } else {
      content.innerHTML = `<div class="ep-card"><small>第1話のおわり</small><h2>二人で、町へ。</h2><p>はな「I want to go out!」<br>そら「行こう！」</p>${err}</div>`;
      content.firstChild.append(button('ドアを開けて町へ', leave, 'ep-primary'));
    }
    content.querySelector('.ep-primary')?.focus({ preventScroll: true });
  }
  function open() {
    if (active) return;
    if (core.host.current) { core.ui.toast('ゲームを閉じてから物語を始めてください'); return; }
    active = true; previousFocus = document.activeElement; error = ''; pending = false; busy = false; pauseTown(); build();
    offEvent = core.events.on((game, name, data) => {
      if (!active || !waiting || waiting.game !== game) return;
      if (progress.accept(game, name, data)) drawBar();
    });
    offClose = core.host.onClose(game => {
      if (!active || waiting?.game !== game) return;
      waiting = null; bar?.remove(); bar = null; root.hidden = false;
      if (progress.state.passed) progress.next();
      else if (!error) error = '途中で戻りました。練習を終えると、物語の続きへ進めます。';
      pauseTown(); render();
    });
    chooseMode();
  }
  return { open, stop, label: stateText, get active() { return active; } };
}
