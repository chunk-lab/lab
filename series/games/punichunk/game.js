/* ぷにチャンク：バブルを英語の順につないで文を作るパズル。
   中身は src/（grammar＝文の判定／dict・dict_data＝ゲーム用の語の表／seeds・seed_data＝お題の文／supply＝バブルの出し方／
   game＝盤面の動き／art＝絵／audio＝効果音とBGM／ui＝画面／tutorial＝チュートリアル／app＝全体のつなぎ）。
   セーブ・音量・読み上げは共通の部品（core）を使う。 */
import { mount } from './src/app.js';

export default {
  id: 'punichunk', name: 'ぷにチャンク', right: 'game:punichunk',
  async mount(el, ctx) {
    const g = mount(el, {
      startScreen: 'title', storage: ctx.store, core: { sound: ctx.core.sound, speech: ctx.core.speech },
      openSettings: () => ctx.core.ui.settings(),
      onEvent: (n, d) => {
        if (n === 'screen') ctx.showBack(!['game', 'tutorial'].includes(d.name));
        if (n === 'result') ctx.report('result', { mode: d.mode, score: d.score });
      }
    });
    ctx.showBack(true);
    return { unmount() { g.unmount(); } };
  }
};
