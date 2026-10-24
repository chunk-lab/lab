import { shopApp, homeApp } from './home.js';
import { albumApp } from './album.js';
import { fishingApp } from './fishing/app.js';
// 町に置くアプリの一覧。新しい単発アプリを足すときは、ここに1行足して town_data.js の建物か NPC の menu に id を書く。
const css = `font-family:inherit;color:#5a4a6b;padding:20px;max-width:560px;margin:0 auto;line-height:1.7`;
const btn = `border:0;border-radius:999px;padding:12px 26px;font:inherit;font-weight:800;color:#fff;background:linear-gradient(160deg,#ffd0dc,#ffb3c1);cursor:pointer`;

function simple(render) {
  return { mount(el, ctx) { const box = document.createElement('div'); box.style.cssText = css; el.appendChild(box); const off = render(box, ctx); return { unmount() { off?.(); box.remove(); } }; } };
}

// 準備中の建物(何が入る予定かを見せておく)
function soon(title, text) {
  return simple(box => { box.innerHTML = `<h2 style="margin:8px 0">${title}</h2><p>${text}</p><p style="color:#8d7f9e;font-size:13px">いまは準備中です。</p>`; });
}

const board = simple((box, ctx) => {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const notes = [
    ['きょうのお知らせ', `${today.getMonth() + 1}月${today.getDate()}日。ゲームセンターで「ぷにチャンク」が遊べます。`],
    ['カフェより', 'カードの対戦相手を募集中。ミイ・ハッタリ男爵・ゴンが待っています。'],
    ['神社より', 'おみくじは1日1回。よいことがありますように。'],
    ['町内会', 'となり町へのバスは、ただいま準備中です。'],
  ];
  box.innerHTML = `<h2 style="margin:4px 0 12px">ほし広場の掲示板</h2>` + notes.map(([t, b], i) => `<div style="background:${['#fff0f3', '#eefaf4', '#f3efff', '#fff8e6'][i]};border-radius:16px;padding:12px 14px;margin:10px 0;transform:rotate(${(i % 2 ? 0.6 : -0.6)}deg)"><b>${t}</b><br>${b}</div>`).join('') + `<p style="font-size:12px;color:#8d7f9e">${key}</p>`;
});

const omikuji = simple((box, ctx) => {
  const d = new Date(), key = `${d.getFullYear()}${d.getMonth()}${d.getDate()}`;
  const got = ctx.storage.get('day') === key;
  const R = [['大吉', 30, 'すごくいい日。何をしてもうまくいきそう。'], ['中吉', 15, '会話がはずむ日。だれかに話しかけてみよう。'], ['小吉', 10, '小さなしあわせが見つかる日。'], ['吉', 8, 'いつもどおりがいちばん。'], ['末吉', 5, 'あとから運が向いてくる日。']];
  box.innerHTML = `<div style="text-align:center"><h2>おみくじ</h2><div class="r" style="font-size:44px;font-weight:900;margin:24px 0;color:#f59a8c">？</div><p class="t"></p><button style="${btn}">${got ? 'きょうはもう引いたよ' : 'ひく'}</button></div>`;
  const b = box.querySelector('button');
  if (got) { const last = ctx.storage.get('last'); if (last) { box.querySelector('.r').textContent = last[0]; box.querySelector('.t').textContent = last[2]; } b.disabled = true; b.style.opacity = 0.6; }
  b.onclick = () => {
    if (ctx.storage.get('day') === key) return;
    const x = R[Math.floor(Math.random() * R.length)];
    ctx.storage.set('day', key); ctx.storage.set('last', x);
    box.querySelector('.r').textContent = x[0]; box.querySelector('.t').textContent = `${x[2]}(🪙+${x[1]})`;
    ctx.wallet.add(x[1], 'omikuji'); ctx.emit('omikuji', { result: x[0] });
    b.disabled = true; b.style.opacity = 0.6; b.textContent = 'またあした';
  };
});

export const APPS = [
  { id: 'board', title: '掲示板', type: 'module', module: board },
  { id: 'omikuji', title: 'おみくじ', type: 'module', module: omikuji },
  // 既存アプリ:dist/apps/<id>/ にファイルを置くと動く
  {
    id: 'punichunk', title: 'ぷにチャンク', type: 'script', src: 'apps/punichunk/punichunk.js', global: 'PuniChunk',
    hint: 'apps/punichunk/punichunk.js を置くと遊べます',
    options: ctx => ({
      startScreen: 'title', storage: ctx.storage, storagePrefix: 'town:app:punichunk:',
      audio: { bgm: ctx.audio.bgm, sfx: ctx.audio.sfx, voice: ctx.audio.voice },
      onEvent: (name, data) => {
        ctx.emit(name, data);
        if (name === 'result' && data) ctx.wallet.add(Math.min(60, Math.floor((data.score || 0) / 200)), 'score');
      },
    }),
  },
  { id: 'chunkcards', title: 'チャンク・カード', type: 'iframe', url: 'apps/chunkcards/index.html', hint: 'apps/chunkcards/index.html を置くと遊べます(sdk/town-sdk.js を読み込むと町とつながります)' },
  { id: 'school', title: 'まちの学校', type: 'iframe', url: 'apps/sample/index.html' },
  { id: 'library', title: '図書館', type: 'module', module: soon('図書館', '集めた単語、作った文、名コンビ図鑑を読み返せる場所になります。') },
  { id: 'shop', title: 'ショップ', type: 'module', module: shopApp },
  { id: 'home', title: 'あなたの家', type: 'module', module: homeApp },
  { id: 'album', title: 'アルバム', type: 'module', module: albumApp },
  { id: 'fishing', title: '砂吹さんの池', type: 'module', module: fishingApp },
];
