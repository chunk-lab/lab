/* チャンクストリーム：流れてくる単語・チャンクを4択で答えて、長文を完成させるゲーム。
   中身は src/（base＝共通部品とのつなぎ・セーブ／sound＝効果音・BGM・読み上げ／screens＝タイトル・ホーム・詳細・設定・本文を読む／
   words＝単語練習と単語集／play＝ゲームの流れと4択／fx＝チャンク君の顔・花火／finish＝一時停止・段の終わり・結果）。
   画面は src/stream.html、見た目は src/stream.css（.ct-stream の中だけに効く）。
   データ（長文・単語・予習の文章）は data/ の別ファイルで、開くときに読み込む（tools/ の道具で作る）。 */
import html from './src/stream.html';
import './src/stream.css';
import { ENV, loadSave, stopAll } from './src/base.js';
import { init_screens } from './src/screens.js';
import { init_play, endRun } from './src/play.js';
import { init_fx } from './src/fx.js';

import { hush, bgmStop } from './src/sound.js';
const FONT = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Lexend:wght@400;500;600;700&display=swap';
export default {
  id: 'stream', name: 'チャンクストリーム', right: 'game:stream',
  async mount(el, ctx) {
    for (const f of ['data.js', 'pool.js', 'words.js', 'texts.js']) await ctx.loadScript(ctx.base + f);
    if (!document.querySelector('link[data-ct="stream"]')) { const lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = FONT; lk.dataset.ct = 'stream'; document.head.appendChild(lk); }
    Object.assign(ENV, { root: el, ctx, core: ctx.core, base: ctx.base, offs: [] });
    el.classList.add('ct-stream');
    el.innerHTML = html.replace(/(src|href)="(img|audio)\//g, (m, at, d) => `${at}="${ctx.base}${d}/`);
    loadSave(); init_screens(); init_play(); init_fx();
    ctx.showBack(true);
    return {
      unmount() {
        try { ctx.core.reader.close(); } catch (e) { } try { endRun(); } catch (e) { } try { hush(); } catch (e) { } try { bgmStop(); } catch (e) { }
        try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }
        stopAll(); el.innerHTML = '';
      }
    };
  }
};
