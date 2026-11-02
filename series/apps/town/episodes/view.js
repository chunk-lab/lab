import { createStore } from '../../../core/store.js';
import { FIRST_EPISODE } from './first.js';
import { createEpisodeProgress } from './progress.js';
import './view.css';

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rich = s => esc(s).replace(/want(?:s)? to/gi, text => `<span class="ep-aux">${text}</span>`);
const NAME = { hana: 'はな', sora: 'そら' };
// 一枚絵の背景。2Dではthree.jsや町を読み込まない。
const ROOM = `<svg viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-label="はなちゃんの勉強部屋" role="img"><defs><linearGradient id="epwall" x2="0" y2="1"><stop stop-color="#f5eee7"/><stop offset="1" stop-color="#e4dfd8"/></linearGradient><linearGradient id="epsky" x2="0" y2="1"><stop stop-color="#b6dce9"/><stop offset="1" stop-color="#edf6e3"/></linearGradient></defs><path fill="url(#epwall)" d="M0 0h900v460H0z"/><path fill="#d6b998" d="M0 460h900v240H0z"/><path stroke="#c3a380" stroke-width="2" d="M0 520h900M0 600h900M80 460 0 700M290 460 240 700M500 460 520 700M710 460 820 700"/><rect x="70" y="65" width="260" height="245" rx="5" fill="#fff9ed"/><rect x="83" y="78" width="234" height="218" fill="url(#epsky)"/><path fill="#adcbac" d="M83 257q60-100 115 0 60-110 119-15v54H83z"/><path stroke="#fffaf0" stroke-width="10" d="M200 78v218M83 186h234"/><rect x="640" y="150" width="150" height="320" rx="4" fill="#ba9878"/><rect x="652" y="162" width="126" height="296" fill="#d5b697"/><circle cx="757" cy="324" r="6" fill="#a67e48"/><rect x="368" y="150" width="192" height="315" fill="#c4a581"/><path fill="#ece1c7" d="M380 164h168v86H380zm0 100h168v86H380zm0 100h168v86H380z"/><g fill="#a1b4b1"><rect x="392" y="185" width="19" height="62"/><rect x="418" y="177" width="17" height="70"/><rect x="464" y="284" width="23" height="63"/></g><g fill="#cd9d9f"><rect x="440" y="183" width="20" height="64"/><rect x="470" y="170" width="19" height="77"/><rect x="393" y="275" width="26" height="72"/></g><path fill="#e5c67d" d="M495 194h35v53h-35zm-64 94h23v59h-23z"/><ellipse cx="400" cy="575" rx="245" ry="62" fill="#bcb8d1"/><path fill="#c5a17d" d="M90 420h275v19H90zM110 439h16v120h-16zM330 439h16v120h-16z"/><path fill="#e3c7a1" d="M90 404h275v22H90z"/><path fill="#655f75" d="m205 331 85 6 9 63h-95z"/><path fill="#c7e7ee" d="m214 340 67 5 8 46h-76z"/><path fill="#9c889c" d="M168 468h87v18h-87zm0 18h12v90h-12zm75 0h12v90h-12z"/><path fill="#caafbb" d="M170 455h82v-58h-82z"/><path fill="#a7785d" d="m800 450 10 62h48l10-62z"/><g fill="#8cac89"><ellipse cx="824" cy="409" rx="15" ry="49" transform="rotate(-26 824 409)"/><ellipse cx="851" cy="405" rx="15" ry="52" transform="rotate(24 851 405)"/></g></svg>`;

export function createEpisodes(core, { games, depart, pauseTown = () => {}, resumeTown = () => {}, onStop = () => {} }) {
  const episode = FIRST_EPISODE;
  const progress = createEpisodeProgress(createStore('town-episodes'), episode);
  let root = null, bar = null, scene = null, stage = null, content = null, active = false, waiting = null, epoch = 0, error = '', pending = false, busy = false;
  let sizer = null, offEvent = null, offClose = null, previousFocus = null, background = [];
  const face = (who, f = 'normal') => core.base + 'g/chunkchunk/img/chara/' + (who === 'sora' ? 'boy' : 'girl') + '/' + f + '.webp';
  const stateText = () => progress.state.completed ? '第1話をもう一度見る' : progress.state.index ? '第1話のつづき' : '第1話をはじめる';
  function disposeScene() { scene?.dispose(); scene = null; }
  function stop(options = {}) {
    if (!active) return;
    active = false; epoch++; waiting = null; offEvent?.(); offClose?.(); offEvent = offClose = null;
    bar?.remove(); bar = null; sizer?.disconnect(); sizer = null;
    disposeScene(); root?.remove(); root = null; stage = content = null;
    background.forEach(([el, inert]) => { el.inert = inert; }); background = [];
    document.body.classList.remove('ep-on'); core.speech.stop(); resumeTown(); previousFocus?.focus();
    onStop({ departed: options.departed === true });
  }
  function button(label, action, cls = '') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ep-btn ' + cls; b.textContent = label; b.onclick = action; return b;
  }
  function pauseMenu() {
    const menu = document.createElement('details'); menu.className = 'ep-menu';
    const toggle = document.createElement('summary'); toggle.textContent = '物語メニュー';
    const body = document.createElement('div'); body.className = 'ep-menu-body';
    const note = document.createElement('p'); note.textContent = '進み具合を保存して勉強部屋にもどります。';
    body.append(note, button('物語を中断する', () => {
      const game = waiting?.game; stop();
      if (game && core.host.current === game) core.host.close();
    }), button('閉じて続ける', () => { menu.open = false; toggle.focus(); }));
    menu.append(toggle, body); return menu;
  }
  function build() {
    root = document.createElement('section'); root.className = 'ep-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', '第1話 ちょっと、外に出たい');
    background = [...document.querySelectorAll('.hm-ov,.tw-view,.tw-top,.tw-dock')].map(el => [el, el.inert]);
    background.forEach(([el]) => { el.inert = true; });
    root.innerHTML = `<header class="ep-head"><div><small>かまってチャンクTOWNの物語 ／ はなちゃんの視点</small><b>第1話　${episode.title}</b></div><nav></nav></header><div class="ep-stage">${ROOM}<div class="ep-portraits"><img class="ep-hana" alt="はな"><img class="ep-sora" alt="そら"></div></div><div class="ep-content" aria-live="polite"></div>`;
    document.body.appendChild(root); stage = root.querySelector('.ep-stage'); content = root.querySelector('.ep-content');
    try { let boxMax = 0; sizer = new ResizeObserver(() => { if (!stage || !content) return; boxMax = Math.max(boxMax, content.offsetHeight); stage.style.setProperty('--ep-box', boxMax + 'px'); }); sizer.observe(content); } catch (e) { }   // 小さくはしない=文の長さでキャラが上下にぶれない。会話枠の高さぶん、キャラを上にずらして重ならないように
    root.querySelector('.ep-hana').src = face('hana'); root.querySelector('.ep-sora').src = face('sora');
    const nav = root.querySelector('nav');
    nav.append(pauseMenu());
    document.body.classList.add('ep-on');
  }
  function drawBar() {
    bar?.remove(); bar = null;
    if (waiting?.game === 'eigonou') return;
    bar = document.createElement('aside'); bar.className = 'ep-gamebar'; bar.setAttribute('aria-label', '物語の進行');
    const tools = document.createElement('div'); tools.className = 'ep-game-tools'; tools.append(pauseMenu()); bar.append(tools);
    if (progress.state.passed) bar.append(button('物語のつづきへ', () => {
      if (waiting && core.host.current === waiting.game) core.host.close();
    }, 'ep-primary'));
    else if (waiting?.game === 'eigonou') { /* 体験の終了ボタンは英文組み立てラボ内にある */ }
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
      const vocab = +(core.level && core.level.vocab && core.level.vocab()) || 0, lvNow = !vocab ? 1 : vocab < 2500 ? 1 : vocab < 6000 ? 2 : 3;   // 推定語彙に合う単語セット(単語練習のレベルは、1:〜2500語 2:〜6000語 3:それ以上)   // 単語力テストの結果に合う単語セット(テストなしは初級)
      const opts = { ...s.opts }; if (opts.wordset) opts.wordset = { ...opts.wordset, lv: lvNow };
      const ok = await core.host.open(game, opts);
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
  async function leave(mode = '3d') {
    if (busy) return; busy = true;
    progress.mode(mode);
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
      content.innerHTML = `<div class="ep-dialog"><b class="ep-name">${NAME[s.who]}</b><p class="ep-line">${rich(s.text)}</p>${s.en ? `<div class="ep-expression"><strong lang="en">${rich(s.en)}</strong><span>${esc(s.ja)}</span></div>` : ''}<div class="ep-actions"></div>${err}</div>`;
      const actions = content.querySelector('.ep-actions');
      if (s.en) actions.append(button('英語を聞く', () => core.speech.speak(s.en, { lang: 'en-US' })));
      actions.append(button('つぎへ', () => { core.speech.stop(); error = ''; progress.next(); render(); }, 'ep-primary'));
    } else if (s.type === 'name') {
      content.innerHTML = `<div class="ep-dialog"><b class="ep-name">${NAME[s.who || 'hana']}</b><p class="ep-line">${rich(s.text)}</p><input class="ep-input" maxlength="8" placeholder="なまえ" aria-label="あなたの名前" value="${esc(core.profile.name || '')}"><div class="ep-actions"></div></div>`;
      const inp = content.querySelector('.ep-input'), go = () => { const v = inp.value.trim(); if (v) core.profile.setName(v); progress.next(); render(); };
      content.querySelector('.ep-actions').append(button('きめた', go, 'ep-primary'));
      inp.onkeydown = e => { if (e.key === 'Enter') go(); };
    } else if (s.type === 'level') {
      content.innerHTML = `<div class="ep-card"><small>はじめに</small><h2>${esc(s.title)}</h2><p>${rich(s.text)}</p><div class="ep-actions"></div></div>`;
      const acts = content.querySelector('.ep-actions'), skip = () => { progress.next(); render(); };
      acts.append(button('テストをはじめる', async () => {
        root.hidden = true; document.body.classList.add('ep-level');
        try { await core.level.placement(); } catch (e) { console.error(e); }
        // テストの画面が閉じるまで待ってから、物語にもどる(結果が出ていなくても、やめたなら先へ進む)
        let gone = 0; const tm = setInterval(() => { if (!active) { clearInterval(tm); document.body.classList.remove('ep-level'); return; } gone = document.querySelector('.cs-ov') ? 0 : gone + 1; if (gone >= 3) { clearInterval(tm); document.body.classList.remove('ep-level'); root.hidden = false; skip(); } }, 500);
      }, 'ep-primary'), button('あとで（初級から）', skip));
    } else if (s.type === 'game') {
      content.innerHTML = `<div class="ep-card"><small>やってみよう</small><h2>${esc(s.title)}</h2><p>${rich(s.text)}</p>${err}</div>`;
      const card = content.firstChild;
      if (progress.state.passed) card.append(button('物語のつづきへ', () => { progress.next(); render(); }, 'ep-primary'));
      else { card.append(button(error ? 'もう一度開く' : 'はじめる', launch, 'ep-primary')); if (error) card.append(button('あとで(先へ進む)', () => { error = ''; progress.skip(); render(); })); }
    } else {
      content.innerHTML = `<div class="ep-card"><small>第1話のおわり</small><h2>二人で、町へ。</h2><p>はな「I <span class="ep-aux">want to</span> go out!」<br>そら「行こう！」</p>${err}</div>`;
      content.firstChild.append(button('ドアを開けて3Dの町へ', () => leave('3d'), 'ep-primary'), button('軽い2Dの町へ', () => leave('2d')));
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
    if (progress.state.completed) progress.restart();
    render();
  }
  return { open, stop, label: stateText, get active() { return active; } };
}
