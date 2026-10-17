/* 英語脳アプリ（辞書型）：絵を見ながら英文を組み立てる。図書館から入る。
   中身は src/（もとの試作7のファイルのまま分けてある。一覧は README）。とても大きいので app.js には入れず、
   開いたときに g/eigonou/eigo.js（src/main.js から組み立てる）と eigo.css を読み込む。
   セーブ・読み上げは共通の部品。読み込み時に付けていた document の受け口やタイマーは、開いている間だけ動く（src/env.js）。 */
import html from './src/view.html';
const FONT = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap';
let SAVED = null, SAVED_CLS = '';   // 閉じたときの画面をそのまま取っておき、次に開いたときに戻す（もとは1ページのアプリで、画面は1回だけ作る前提のため）
const link = (href, key) => new Promise(res => { if (document.querySelector(`link[data-ct="${key}"]`)) return res(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.dataset.ct = key; l.onload = l.onerror = () => res(); document.head.appendChild(l); });

export default {
  id: 'eigonou', name: '英語脳アプリ', right: 'game:eigonou',
  async mount(el, ctx) {
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
    return {
      unmount() {
        try { window.__EIGONOU.stop(); } catch (e) { }
        try { ctx.core.speech.stop(); } catch (e) { }
        SAVED = document.createDocumentFragment(); SAVED_CLS = el.className;
        el.querySelectorAll('.eg-home').forEach(b => b.remove());
        while (el.firstChild) SAVED.appendChild(el.firstChild);
      }
    };
  }
};
