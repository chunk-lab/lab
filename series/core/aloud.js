/* 単語の読み上げ(どこからでも)。設定 → 一覧(読む/読まない) → 帯で読み上げ → 終わったらフラッシュカード(か一覧)
   - 読む言葉: まちがえた言葉 / まだ覚えていない言葉 / 新しい言葉(レベルで選ぶ)
   - 読み方: 日本語→英語(か英語→日本語)・1〜3回・間の秒数・ランダム(か順番)
   - 帯は画面の上に出るだけ(町を歩きながらでも使える)。会話・アプリを開いている間は止まる
   - 町のチャンクくん乗り物・ローディングも、同じ設定で読む(band / run)
   - 終わったあとの振り分けは review.open({ words }) を使い回す */
import { createStore } from './store.js';
import { isChunk } from './daylog.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const DEF = { v: 2, src: ['missed', 'pending'], bands: [], newN: 20, dir: 'en-ja', reps: 1, gap: 1, order: 'random', after: 'cards' };
const MAXN = 150;
const cut = t => String(t || '').split(/[、,;;／\/]/).map(x => x.trim()).filter(Boolean);
export const jaShort = t => cut(t).slice(0, 2).join('、');
const jaSay = t => (cut(t)[0] || '').replace(/[((][^))]*[))]/g, '').trim();
const shuf = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function createAloud(core) {
  const st = createStore('core'), C = Object.assign({}, DEF, st.get('aloud') || {});
  if (C.v !== 2) { C.v = 2; C.dir = 'en-ja'; }   // 初期値は「英語が先・日本語があと」(前の版で保存された向きはここでそろえる)
  const save = () => st.set('aloud', C);
  let cur = null;   // いま出ている帯(ひとつだけ)

  // ---- 読む言葉を集める ----
  async function collect(o = {}) {
    const dl = core.daylog, m = new Map();
    const ok = w => w && w.en && w.ja && w.kind !== 'sentence' && !isChunk(w) && !/\s/.test(String(w.en).trim());
    const add = w => { if (ok(w)) { const k = w.en.toLowerCase(); if (!m.has(k)) m.set(k, { en: w.en, ja: w.ja, pos: w.pos, kind: w.kind || 'word', multi: w.multi, miss: !!w.miss, src: w.src }); } };
    try { if (C.src.includes('missed')) dl.missed(14).forEach(add); } catch (e) { }
    try { if (C.src.includes('pending')) dl.pending().forEach(add); } catch (e) { }
    if (C.src.includes('new') && !o.noNew && core.level && core.level.wordsOf) {
      try {
        let bs = C.bands.slice(); if (!bs.length) { const v = core.level.vocab() || 1500, B = core.level.bands(); bs = [Math.max(0, B.findIndex(b => b.to > v))]; }
        const ex = new Set([...m.keys(), ...dl.knownKeys()]);
        (await core.level.wordsOf(bs, C.newN, ex)).forEach(add);
      } catch (e) { }
    }
    return [...m.values()].slice(0, MAXN);
  }

  // ---- 読み上げ本体(帯・ローディングで共通) ----
  // ui.show(word, { i, n, first, phase }) first='ja'|'en'(先に読むほう) phase='first'|'second'
  function run(list0, o = {}) {
    const c = Object.assign({}, C, o.cfg || {}), list = c.order === 'random' ? shuf(list0.slice()) : list0.slice();
    let alive = true, token = 0, paused = false, timer = null, i = 0;
    const wait = ms => new Promise(r => { timer = setTimeout(r, ms); });
    const voiceOn = () => { try { return !!core.settings.get('voice'); } catch (e) { return true; } };
    const blocked = () => paused || document.body.classList.contains('tw-talking') || document.body.classList.contains('md-app-open');
    const say = (text, lang, minMs) => new Promise(res => {
      if (!voiceOn()) { wait(Math.max(minMs, 1200)).then(res); return; }
      const t0 = Date.now(); let done = false;
      const fin = () => { if (done) return; done = true; clearTimeout(timer); const rest = minMs - (Date.now() - t0); rest > 0 ? (timer = setTimeout(res, rest)) : res(); };
      timer = setTimeout(fin, 7000);
      try { core.speech.speak(text, { lang, onend: fin }); } catch (e) { fin(); }
    });
    const text = (x, l) => (l === 'en' ? x.en : jaSay(x.ja));
    async function loop(my) {
      const live = () => alive && my === token;
      while (live()) {
        if (i >= list.length) { if (o.loop && list.length) { i = 0; if (c.order === 'random') shuf(list); } else { alive = false; o.onEnd && o.onEnd(true, list.slice()); return; } }
        while (blocked() && live()) await wait(400);   // 会話・アプリを開いている間(と一時停止中)は待つ
        if (!live()) return;
        const x = list[i], first = c.dir === 'en-ja' ? 'en' : 'ja', second = first === 'en' ? 'ja' : 'en', info = { i, n: list.length, first };
        for (let k = 0; k < c.reps && live(); k++) {
          o.ui && o.ui.show(x, { ...info, phase: 'first' });
          await say(text(x, first), first, 900); if (!live()) return;
          await wait(Math.max(0, c.gap) * 1000); if (!live()) return;
          o.ui && o.ui.show(x, { ...info, phase: 'second' });
          await say(text(x, second), second, 800); if (!live()) return;
          await wait(450);
        }
        i++;
      }
    }
    loop(++token);
    return {
      stop() { alive = false; token++; clearTimeout(timer); try { core.speech.stop(); } catch (e) { } },
      pause(on) { paused = !!on; if (paused) { try { core.speech.stop(); } catch (e) { } } },
      restart() { clearTimeout(timer); try { core.speech.stop(); } catch (e) { } loop(++token); },   // ローディング: 最初のタップのあとで、いまの言葉から読み直す
      played: () => list.slice(0, i + 1), get paused() { return paused; },
    };
  }

  // 1語ぶんの表示(先に読むほうを出し、あとから読むほうは「？」から答えを出す)
  function pair(x, info) {
    const t = l => (l === 'en' ? x.en : jaShort(x.ja)), second = info.first === 'en' ? 'ja' : 'en';
    return { a: t(info.first), b: t(second), onA: info.phase === 'first', onB: info.phase === 'second' };
  }

  // ---- 帯 ----
  // host を渡すと、その中に小さく(操作ボタンなし)出す。なければ画面の上に出す。list がなければ設定どおり集める。o.loop=ずっとくり返す
  function band(host, o = {}) {
    if (!host && cur) cur();
    const el = document.createElement('div'); el.className = 'al-band' + (host ? ' in' : '');
    el.innerHTML = '<div class="al-w"><b></b><i>→</i><b></b></div><em></em>' + (host ? '' : '<span class="al-ctl"><button data-a="p" aria-label="一時停止">⏸</button><button data-a="x" aria-label="とめる">■</button></span>');
    (host || document.body).appendChild(el);
    const [eA, eB] = el.querySelectorAll('b'), eN = el.querySelector('em');
    let h = null, dead = false, stopFn;
    const end = (fin, played) => { if (dead) return; dead = true; if (h) h.stop(); el.remove(); if (cur === stopFn) cur = null; o.onEnd && o.onEnd(fin, played); };
    stopFn = () => { if (dead) return; dead = true; if (h) h.stop(); el.remove(); if (cur === stopFn) cur = null; };
    if (!host) cur = stopFn;
    const ui = { show(x, info) { const p = pair(x, info); eA.textContent = p.a; eB.textContent = p.b; eA.classList.toggle('on', p.onA); eB.classList.toggle('on', p.onB); eN.textContent = `${info.i + 1} / ${info.n}`; } };
    const start = list => {
      if (dead) return;
      if (!list.length) { eA.textContent = '読む言葉がありません'; eB.textContent = ''; el.querySelector('i').remove(); setTimeout(() => end(false, []), 1800); return; }
      h = run(list, { loop: !!o.loop, ui, onEnd: (fin, all) => { eA.textContent = 'おわり!'; eB.textContent = ''; setTimeout(() => end(true, all), 500); } });
      const ctl = el.querySelector('.al-ctl');
      if (ctl) ctl.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.a === 'p') { h.pause(!h.paused); b.textContent = h.paused ? '▶' : '⏸'; } else { const pl = h.played(); end(false, pl); } };
    };
    eA.textContent = '…'; if (o.list) start(o.list); else collect({ noNew: o.noNew }).then(start);
    return stopFn;
  }
  const start = () => band(null, { onEnd: (fin, played) => { if (played && played.length) core.review.open({ words: played, after: C.after }); } });   // 設定どおりに、すぐ読む(一覧なし)
  const play = list => band(null, { list, onEnd: (fin, played) => { if (played && played.length) core.review.open({ words: played, after: C.after }); } });

  // ---- 設定 → 一覧 の画面 ----
  function open() {
    core.ui.sheet('<div class="al"></div>', (ov, close) => {
      const box = ov.querySelector('.al'), go = (html, bind) => { box.innerHTML = html; if (bind) bind(); ov.querySelector('.cs-sheet').scrollTop = 0; };
      const seg = (key, opts) => `<div class="al-seg">${opts.map(([v, l]) => `<button data-k="${key}" data-v="${v}" class="${C[key] == v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
      const num = v => (v !== '' && !isNaN(+v) ? +v : v);
      function settingsScreen() {
        const bands = core.level && core.level.bands ? core.level.bands() : [], isNew = C.src.includes('new');
        go(`<h3>📖 単語の読み上げ</h3>
          <p class="cs-note">読む言葉(いくつでも)</p>
          <div class="al-lv">${[['missed', 'まちがえた単語'], ['pending', 'まだ覚えてない単語'], ['new', '新しい単語']].map(([k, l]) => `<button data-s="${k}" class="${C.src.includes(k) ? 'on' : ''}">${l}</button>`).join('')}</div>
          ${isNew ? `<p class="cs-note">新しい単語のレベル(いくつでも)</p><div class="al-lv">${bands.map(b => `<button data-b="${b.i}" class="${C.bands.includes(b.i) ? 'on' : ''}">Lv${b.i + 1} ${esc(b.note)}</button>`).join('')}</div>
          <div class="al-row"><span>新しい単語の数</span>${seg('newN', [[10, '10'], [20, '20'], [30, '30'], [50, '50']])}</div><p class="cs-note">レベルを選ばないときは、いまの実力のレベルから出します。</p>` : ''}
          <div class="al-row"><span>読む向き</span>${seg('dir', [['ja-en', '日本語→英語'], ['en-ja', '英語→日本語']])}</div>
          <div class="al-row"><span>読む回数</span>${seg('reps', [[1, '1回'], [2, '2回'], [3, '3回']])}</div>
          <div class="al-row"><span>間の秒数</span>${seg('gap', [[1, '1秒'], [2, '2秒'], [3, '3秒'], [5, '5秒']])}</div>
          <div class="al-row"><span>順番</span>${seg('order', [['random', 'ランダム'], ['seq', '順番']])}</div>
          <div class="al-row"><span>読んだあと</span>${seg('after', [['cards', 'フラッシュカード'], ['list', '一覧']])}</div>
          <div class="rv-two"><button class="cs-btn" id="al-next">一覧を見る</button><button class="cs-btn rv-ok" id="al-now">▶ このまま読み上げる</button></div>`, () => {
          box.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const k = b.dataset.s; C.src = C.src.includes(k) ? C.src.filter(x => x !== k) : [...C.src, k]; save(); settingsScreen(); });
          box.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const k = +b.dataset.b; C.bands = C.bands.includes(k) ? C.bands.filter(x => x !== k) : [...C.bands, k]; save(); settingsScreen(); });
          box.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { C[b.dataset.k] = num(b.dataset.v); save(); settingsScreen(); });
          box.querySelector('#al-now').onclick = () => { if (!C.src.length) { core.ui.toast('読む言葉を1つ以上えらんでね'); return; } close(); start(); };
          box.querySelector('#al-next').onclick = () => { if (!C.src.length) { core.ui.toast('読む言葉を1つ以上えらんでね'); return; } listScreen(); };
        });
      }
      async function listScreen() {
        go('<h3>📖 単語の読み上げ</h3><p class="cs-note">言葉を集めています…</p>');
        const list = await collect(), off = new Set();
        if (!box.isConnected) return;
        if (!list.length) { go('<h3>📖 単語の読み上げ</h3><p class="cs-note">読む言葉がありません。読む言葉の種類を足すか、新しい単語のレベルを選んでね。</p><button class="cs-btn" id="al-bk">← せってい</button>', () => { box.querySelector('#al-bk').onclick = settingsScreen; }); return; }
        go(`<h3>読み上げの一覧 <small id="al-n"></small></h3>
          <p class="cs-note">はじめは全部「読む」。読まない言葉だけ、右の「読まない」を押してね。</p>
          <button class="cs-btn" id="al-all">ぜんぶ 読む</button>
          <ul class="al-list">${list.map((w, i) => `<li data-i="${i}"><span class="t"><b>${esc(w.en)}</b>${w.miss ? '<u>まちがえた</u>' : ''}<small>${esc(jaShort(w.ja))}</small></span><span class="al-tg"><button class="g on" data-v="1">読む</button><button class="r" data-v="0">読まない</button></span></li>`).join('')}</ul>
          <div class="rv-two"><button class="cs-btn" id="al-bk">← せってい</button><button class="cs-btn rv-ok" id="al-go">▶ 読み上げる</button></div>`, () => {
          const cnt = () => { const n = list.length - off.size; box.querySelector('#al-n').textContent = `(読む ${n} / ${list.length})`; box.querySelector('#al-go').textContent = `▶ 読み上げる(${n})`; };
          const setLi = (li, on) => { const i = +li.dataset.i; on ? off.delete(i) : off.add(i); li.classList.toggle('off', !on); li.querySelector('.g').classList.toggle('on', on); li.querySelector('.r').classList.toggle('on', !on); };
          box.querySelectorAll('.al-tg button').forEach(b => b.onclick = () => { setLi(b.closest('li'), b.dataset.v === '1'); cnt(); });
          box.querySelector('#al-all').onclick = () => { box.querySelectorAll('.al-list li').forEach(li => setLi(li, true)); cnt(); };
          box.querySelector('#al-bk').onclick = settingsScreen;
          box.querySelector('#al-go').onclick = () => { const sel = list.filter((w, i) => !off.has(i)); if (!sel.length) { core.ui.toast('読む言葉がありません'); return; } close(); play(sel); };
          cnt();
        });
      }
      settingsScreen();
    });
  }

  return { open, band, run, collect, play, pair, start, toggle() { if (cur) cur(); else start(); }, stop: () => { if (cur) cur(); }, cfg: () => ({ ...C }), get playing() { return !!cur; } };
}
