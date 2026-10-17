/* チャンクチャンク：街の施設ごとに入口が変わる。opts.face（town の PLACES で指定）
     'lesson'  学校　　　 … Chunk Practice（自分で送って切る・役割も答える）
     'library' 図書館　　 … Reading（共通の読む画面）・My Texts（長文・短文の登録、問題、共有）
     'arcade'  ゲームセンター … さらさら・よーいどん・チャレンジ・ランキング
   中身は src/（engine＝流れる文を切るゲーム本体／pick＝文章を選ぶ／reading＝リーディング／texts＝My Texts と共有／
   shorts＝短文／rank＝チャレンジとランキング／title＝施設の入口／data＝内蔵の文と問題）。画面は src/view.html、見た目は src/cc.css */
import html from './src/view.html';
import './src/cc.css';
import { ENV, init_engine, loadSettings, S, nextRun, clearPop, tone, unlockAudio, settings } from './src/engine.js';
import { createWallet } from './src/wallet.js';
import { createMake } from './src/make.js';
import { init_texts, initShared } from './src/texts.js';
import { init_rank } from './src/rank.js';
import { initTitle, showTitle } from './src/title.js';
const FONT = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Lexend:wght@400;500;700&display=swap';
/* レッスン（文を作る）の効果音。ファイルは使わず、電子音で鳴らす（効果音の音量は共通の設定） */
const seq = (list, gap, type, vol) => () => list.forEach((f, i) => setTimeout(() => tone(f, .11, type || 'triangle', vol || .11), i * gap));
const SFX = {
  'se/study_correct': seq([880, 1320], 70, 'sine', .11),
  'se/study_wrong': () => tone(200, .18, 'sawtooth', .05, .7),
  'se/sentence_clear': seq([660, 880, 1100], 70, 'sine', .1),
  'voice/perfect': () => { seq([784, 988, 1175, 1568], 60, 'triangle', .12)(); setTimeout(() => tone(2093, .25, 'sine', .07), 300); },
  'se/newbest': () => { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, .12, 'triangle', .12), i * 90)); setTimeout(() => { tone(1046, .45, 'sine', .09); tone(1318, .45, 'sine', .07); }, 500); }
};
const lessonSfx = (n) => { if (settings.sound === 'off' || settings.sound === 'voice') return; unlockAudio(); const f = SFX[n]; f && f(); };
const NAMES = { lesson: 'チャンクチャンク（学校）', library: 'チャンクチャンク（図書館）', arcade: 'チャンクチャンク' };

/* 前のチャンクチャンク（街の中の枠で動いていたとき）のセーブを、共通のセーブへ1回だけ引っ越す */
function migrate(store) {
  if (store.get('_migrated')) return;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^ccs/.test(k) && store.get(k) == null) store.set(k, localStorage.getItem(k)); } } catch (e) { }
  store.set('_migrated', 1);
}

export default {
  id: 'chunkchunk', name: 'チャンクチャンク', right: 'game:chunkchunk',
  async mount(el, ctx) {
    const face = ctx.opts.face || 'arcade';
    if (!document.querySelector('link[data-ct="cc"]')) { const lk = document.createElement('link'); lk.rel = 'stylesheet'; lk.href = FONT; lk.dataset.ct = 'cc'; document.head.appendChild(lk); }
    Object.assign(ENV, { root: el, ctx, core: ctx.core, offs: [] });
    migrate(ctx.store);
    el.classList.add('ct-cc'); el.innerHTML = html;
    // レッスン（文を作る）。開いている間は「街へ」ボタンを隠す（レッスンの画面が全体をおおうため）
    const wallet = createWallet(ctx.store);
    ENV.make = createMake({ base: ctx.base, store: ctx.store, Wallet: wallet, sfx: lessonSfx, onOpen: () => ctx.showBack(false), onClose: () => ctx.showBack(!el.querySelector('#title').hidden) });
    loadSettings(); init_engine(); init_texts(); init_rank(); initTitle(face);
    initShared();   // みんなの長文・難易度（共有データベース）。使えない環境では何も出ない
    // 「街へ」ボタンは入口（メニュー）にいるときだけ出す
    const title = el.querySelector('#title'), mo = new MutationObserver(() => ctx.showBack(!title.hidden && !ctx.core.reader.isOpen && !ENV.make.visible()));
    mo.observe(title, { attributes: true, attributeFilter: ['hidden'] });
    showTitle(); ctx.showBack(true);
    ctx.report('enter', { face, name: NAMES[face] });
    return {
      unmount() {
        mo.disconnect(); nextRun();
        try { if (S) { clearTimeout(S.timer); S.phase = 'ready'; } } catch (e) { }
        try { ctx.core.reader.close(); } catch (e) { }
        try { ENV.make.destroy(); ENV.make = null; } catch (e) { }
        clearPop();
        ENV.offs.forEach(f => f()); ENV.offs = [];
        el.innerHTML = '';
      }
    };
  }
};
