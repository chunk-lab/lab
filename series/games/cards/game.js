/* チャンク・カード：英文で「役」を作るローグライク。判定・語の表はぷにチャンクの部品（games/punichunk/src）を使う。
   中身は src/（base＝共通の道具とセーブ／sound＝効果音と読み上げ／rules＝カード・判定・ジョーカー・ボス／
   play＝ゲームの進行と画面／vs＝CPU対戦／cards.css＝見た目）。音量・読み上げ・セーブは共通の部品（core）を使う。 */
import './src/cards.css';
import { bindStore } from './src/base.js';
import { bindCore } from './src/sound.js';
import { mount, registerVS } from './src/play.js';
import { VS } from './src/vs.js';
registerVS(VS);

/* 前のチャンク・カード（chunkcards: で始まる保存）を、共通のセーブへ1回だけ引っ越す */
function migrate(store) {
  if (store.get('_migrated')) return;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('chunkcards:')) { const n = k.slice(11); if (store.get(n) == null) store.set(n, JSON.parse(localStorage.getItem(k))); } } } catch (e) { }
  store.set('_migrated', 1);
}

export default {
  id: 'cards', name: 'チャンク・カード', right: 'game:cards',
  async mount(el, ctx) {
    migrate(ctx.store); bindStore(ctx.store); bindCore({ sound: ctx.core.sound, speech: ctx.core.speech });
    el.classList.add('ct-cards');
    const root = document.createElement('div'); root.className = 'cc-app'; el.appendChild(root);
    const off = mount(root);
    const mo = new MutationObserver(() => ctx.showBack(!!(root.querySelector('#go') || root.querySelector('.end'))));   /* ゲーム中（ステージ・お店）以外は「街へ」を出す */
    mo.observe(root, { childList: true, subtree: true }); ctx.showBack(true);
    return { unmount() { mo.disconnect(); off && off(); try { ctx.core.speech.stop(); } catch (e) { } root.remove(); } };
  }
};
