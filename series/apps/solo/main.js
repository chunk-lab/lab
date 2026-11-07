/* 単体アプリ：共通部品＋ゲーム1つ。開いたらすぐそのゲーム。どのゲームかは series.config.mjs の APPS で決める */
import { createCore } from '../../core/index.js';
import '../../core/ui.css';
import { GAMES } from '../../games/index.js';
const app = window.__APP__;
const core = createCore({ ...app, backButton: false });
document.body.style.background = '#0b1626';
core.openGame = (g, o) => { if (!GAMES[g]) { core.ui.toast('このアプリには「' + g + '」が入っていません'); return; } Promise.resolve(core.host.open(GAMES[g], o || {})).catch(e => { console.error(e); core.ui.toast('開けませんでした:' + String(e && e.message || e).slice(0, 80)); }); };
core.host.open(GAMES[app.games[0]], app.opts || {});
