/* チャンクチャンク：街の施設ごとに入口が変わる。opts.face（town の PLACES で指定）
     'lesson'  学校　　　 … Lesson（文を作る＝話す・書く）・Chunk Story（読む・聞く）・Chunk Practice（自分で送って切る・役割も答える）
     'library' 図書館　　 … Reading（共通の読む画面）・My Texts（長文・短文の登録、問題、共有）
     'arcade'  ゲームセンター … さらさら・よーいどん・チャレンジ・ランキング
   中身は src/（engine＝流れる文を切るゲーム本体／pick＝文章を選ぶ／reading＝リーディング／texts＝My Texts と共有／
   shorts＝短文／rank＝チャレンジとランキング／title＝施設の入口／data＝内蔵の文と問題）。画面は src/view.html、見た目は src/cc.css */
import html from './src/view.html';
import './src/cc.css';
import { ENV, init_engine, loadSettings, S, nextRun, clearPop, readTextAloud } from './src/engine.js';
import { sfx, preloadSfx, stopSfxVoice, initSfx } from './src/sfx.js';
import { initBgm } from './src/bgm.js';
import { createMake } from './src/make.js';
import { createStory } from './src/story.js';
import { init_texts, initShared, openMyTexts } from './src/texts.js';
import { init_rank } from './src/rank.js';
import { initTitle, showTitle } from './src/title.js';
const FONT = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Lexend:wght@400;500;700&family=Mochiy+Pop+One&family=Zen+Maru+Gothic:wght@500;700&family=Quicksand:wght@500;700&display=swap';
const NAMES = { lesson: 'チャンクチャンク（学校）', library: 'チャンクチャンク（図書館）', arcade: 'チャンクチャンク', all: 'チャンクチャンク' };

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
    // 無料会員は手打ちだけ：AIを使う登録(コピペ方式・AIで分ける・ファイル用の指示文)を隠す(設計書「共有・自分だけ・会員」)
    const freeMark = () => el.classList.toggle('cc-free', !(ctx.core.member && ctx.core.member.isPaid()));
    freeMark(); const offPlan = ctx.core.member ? ctx.core.member.onChange(freeMark) : null;
    // レッスン（文を作る）。開いている間は「街へ」ボタンを隠す（レッスンの画面が全体をおおうため）
    // コインは全アプリ共通の財布へ（レッスンの初回クリアなど一度きりのごほうび）。前の別財布(createWallet)は使わない
    const wallet = { add: (kind, n) => kind === 'coins' ? ctx.core.member.earn('once', n) > 0 : false };
    ENV.make = createMake({ base: ctx.base, store: ctx.store, Wallet: wallet, sfx, report: (n, d) => ctx.report(n, d), onOpen: () => ctx.showBack(false), onClose: () => ctx.showBack(!el.querySelector('#title').hidden) });
    ENV.story = createStory({ speak: t => readTextAloud(t), base: ctx.base, store: ctx.store, report: ctx.report, onOpen: () => ctx.showBack(false), onClose: () => ctx.showBack(!el.querySelector('#title').hidden) });
    loadSettings(); init_engine(); init_texts(); init_rank(); initTitle(face);
    initBgm(el); initSfx(); preloadSfx();   // 音楽・効果音・声（音量は共通の設定。mp3は小さめに調整済み）
    initShared();   // みんなの長文・難易度（共有データベース）。使えない環境では何も出ない
    // 「街へ」ボタンは入口（メニュー）にいるときだけ出す
    const title = el.querySelector('#title'), mo = new MutationObserver(() => ctx.showBack(!title.hidden && !ctx.core.reader.isOpen && !ENV.make.visible() && !ENV.story.visible()));
    mo.observe(title, { attributes: true, attributeFilter: ['hidden'] });
    showTitle(); ctx.showBack(true);
    if (ctx.opts.storyChapter === 1) ENV.story.open({ chapter: 1 });   // 物語から読む・聞く第1章へ。通常の入口・保存方法は共通
    if (ctx.opts && ctx.opts.lesson) setTimeout(() => { try { ENV.make.openLesson(ctx.opts.lesson === 'next' ? (ENV.make.nextLesson() || {}).id : ctx.opts.lesson); } catch (e) { console.error(e); } }, 60);   // ミッション:レッスンを指定
    if (ctx.opts && ctx.opts.open === 'mytexts') setTimeout(() => { try { el.querySelector('#title').hidden = true; openMyTexts(); } catch (e) { console.error(e); } }, 50);   // 図書館の「自分の本」から
    ctx.report('enter', { face, name: NAMES[face] });
    return {
      unmount() {
        mo.disconnect(); nextRun(); offPlan && offPlan();
        try { if (S) { clearTimeout(S.timer); S.phase = 'ready'; } } catch (e) { }
        try { ctx.core.reader.close(); } catch (e) { }
        try { ENV.make.destroy(); ENV.make = null; } catch (e) { }
        try { ENV.story.destroy(); ENV.story = null; } catch (e) { }
        clearPop(); stopSfxVoice();
        ENV.offs.forEach(f => f()); ENV.offs = [];
        el.innerHTML = '';
      }
    };
  }
};
