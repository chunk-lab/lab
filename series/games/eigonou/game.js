/* 英語脳アプリ（辞書型）：絵を見ながら英文を組み立てる。図書館から入る。
   中身は src/（もとの試作7のファイルのまま分けてある。一覧は README）。とても大きいので app.js には入れず、
   開いたときに g/eigonou/eigo.js（src/main.js から組み立てる）と eigo.css を読み込む。
   セーブ・読み上げは共通の部品。読み込み時に付けていた document の受け口やタイマーは、開いている間だけ動く（src/env.js）。 */
import html from './src/view.html';
import { runCoach } from '../../core/coach.js';
import { mountEpisodeFrame } from './episode-frame.js';
const HOW = [
  { w: 'g', f: 'joy', t: '英語脳アプリは、絵を見ながら英文を組み立てる、英語のシミュレータだよ。' },
  { w: 'b', t: '下のメニューの「つくる」で、文を作ってみよう。' },
  { w: 'g', t: '「れんしゅう」で練習して、「ことば登録」「セット」で、使うことばを増やせるよ。' },
  { w: 'b', f: 'idea', t: '音や読み上げは、「設定」で変えられるよ。' }];
const FONT = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap';
let SAVED = null, SAVED_CLS = '';   // 閉じたときの画面をそのまま取っておき、次に開いたときに戻す（もとは1ページのアプリで、画面は1回だけ作る前提のため）
const link = (href, key) => new Promise(res => { if (document.querySelector(`link[data-ct="${key}"]`)) return res(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.ct = key; l.onload = l.onerror = () => res(); document.head.appendChild(l); });

export default {
  id: 'eigonou', name: '英語脳アプリ', right: 'game:eigonou',
  async mount(el, ctx) {
    if (ctx.opts.episodePractice === 'want-to') return mountEpisodeFrame(el, ctx);
    el.classList.add('ct-eigo');
    el.innerHTML = '<div class="eg-loading" style="display:grid;place-items:center;height:100%;font-weight:700;color:#6b7191">読み込み中…</div>';
    link(FONT, 'eigo-font');
    await Promise.all([link(ctx.base + 'eigo.css', 'eigo'), ctx.loadScript(ctx.base + 'eigo.js')]);
    if (SAVED) { el.innerHTML = ''; el.appendChild(SAVED); el.className = SAVED_CLS; SAVED = null; }
    else el.innerHTML = html;
    window.__EIGONOU.start(el, ctx);
    // 「街へ」は下のメニューと重なるので、共通のボタンは出さずに上の帯に小さく置く（街の中で開いたときだけ）
    ctx.showBack(false);
    const app = window.__APP__ || {};
    if (app.backButton) { const b = document.createElement('button'); b.className = 'ib eg-home'; b.setAttribute('aria-label', app.backLabel || '戻る'); b.textContent = '🏠'; b.onclick = () => ctx.exit(); const top = el.querySelector('.top'); top && top.prepend(b); }
    { const h = document.createElement('button'); h.className = 'ib eg-how'; h.textContent = '❓ 遊び方'; h.style.cssText = 'font-size:12px;padding:4px 8px;white-space:nowrap'; h.onclick = () => runCoach(HOW); const top = el.querySelector('.top'); top && top.appendChild(h); }
    return {
      unmount() {
        try { window.__EIGONOU.stop(); } catch (e) { }
        try { ctx.core.speech.stop(); } catch (e) { }
        SAVED = document.createDocumentFragment(); SAVED_CLS = el.className;
        el.querySelectorAll('.eg-home,.eg-how').forEach(b => b.remove());
        while (el.firstChild) SAVED.appendChild(el.firstChild);
      }
    };
  }
};
