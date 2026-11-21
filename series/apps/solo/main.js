/* 単体アプリ：共通部品＋ゲーム1つ。開いたらすぐそのゲーム。どのゲームかは series.config.mjs の APPS で決める */
import { createCore } from '../../core/index.js';
import '../../core/ui.css';
import { GAMES } from '../../games/index.js';
const app = window.__APP__;
const core = createCore({ ...app, backButton: false });
document.body.style.background = '#0b1626';
core.openGame = (g, o) => { if (!GAMES[g]) { core.ui.toast('このアプリには「' + g + '」が入っていません'); return; } Promise.resolve(core.host.open(GAMES[g], o || {})).catch(e => { console.error(e); core.ui.toast('開けませんでした:' + String(e && e.message || e).slice(0, 80)); }); };
core.host.open(GAMES[app.games[0]], app.opts || {});

// 勉強ノート(ドリル)の入口：どの単体アプリにも、右はしに小さく出す(置き場所はあとで決める)
{
  const b = document.createElement('button'); b.textContent = '📒'; b.setAttribute('aria-label', '勉強ノート');
  b.style.cssText = 'position:fixed;right:0;top:46%;z-index:2147483000;width:34px;height:46px;border:0;border-radius:12px 0 0 12px;background:#ffc93ccc;font-size:20px;line-height:1;padding:0;box-shadow:-2px 2px 8px #0004';
  b.onclick = () => core.drill.open({}); document.body.appendChild(b);
}
