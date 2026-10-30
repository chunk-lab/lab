// カフェ(おみやげを買う)と、占いの館(住人の好物・飾りのレシピ・かくれもののありかなどを教えてくれる)
import { social, ITEMS, CAFE_MENU, PREFS, NPC_NAME } from '../game/social.js';
import { spec, SET, LV_NAME, RAR, DECOR, decorOf, RECIPES, shapeName } from '../game/specimen.js';
import { finds } from '../game/finds.js';
import { weather, WX_INFO } from '../game/weather.js';
import { mountTarot, TAROT_PRICE } from './tarot.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CSS = `
.sx{position:absolute;inset:0;overflow:auto;font-family:inherit;color:#5a4a6b;padding:14px 14px calc(30px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
.sx.cafe{background:linear-gradient(#fff4e6,#ffe9d6)}.sx.ft{background:radial-gradient(circle at 50% 0%,#5b3f8c,#2a1d47 70%);color:#f3eaff}
.sx h2{margin:2px 0 4px;font-size:20px}.sx .say{background:#fff;border-radius:16px;padding:10px 12px;margin:8px 0 12px;font-size:14px;line-height:1.6;box-shadow:0 2px 8px #0001;color:#5a4a6b}
.sx.ft .say{background:rgba(255,255,255,.12);color:#f3eaff;box-shadow:none;border:1px solid rgba(255,255,255,.25)}
.sx .pill{display:inline-block;background:#fff;border-radius:999px;padding:4px 10px;font-weight:900;font-size:13px;box-shadow:0 1px 4px #0001;color:#5a4a6b}
.sx .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
.sx .it{border:0;border-radius:16px;background:#fff;padding:10px 6px;font:inherit;color:#5a4a6b;text-align:center;box-shadow:0 2px 8px #0001}
.sx .it .ic{font-size:34px;display:block;line-height:1.2}.sx .it b{display:block;font-size:13px}.sx .it small{display:block;font-size:11px;color:#8d7f9e}
.sx .it .pr{display:inline-block;margin-top:6px;background:linear-gradient(160deg,#ffd36b,#ffb35c);border-radius:999px;padding:4px 12px;font-weight:900;font-size:13px}
.sx .it:disabled{opacity:.5}
.sx h3{margin:14px 0 6px;font-size:15px}.sx .nt{font-size:12px;color:#8d7f9e;line-height:1.6;margin:6px 0}.sx.ft .nt{color:#cdbbea}
.sx .bag{display:flex;flex-wrap:wrap;gap:6px}.sx .bag span{background:#fff;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:800}
.sx .opt{display:flex;align-items:center;gap:10px;width:100%;border:0;border-radius:16px;padding:12px 14px;margin-bottom:8px;font:inherit;text-align:left;background:rgba(255,255,255,.12);color:#f3eaff;border:1px solid rgba(255,255,255,.22)}
.sx .opt .ic{font-size:26px}.sx .opt b{display:block;font-size:15px}.sx .opt small{font-size:12px;color:#cdbbea}.sx .opt .c{margin-left:auto;font-weight:900;white-space:nowrap}
.sx .chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}.sx .chips button{border:0;border-radius:999px;padding:8px 12px;font:inherit;font-weight:800;font-size:13px;background:rgba(255,255,255,.16);color:#fff}
.sx .chips button:disabled{opacity:.4}
.sx .back{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:900;background:rgba(255,255,255,.18);color:#fff;margin-bottom:6px}
.sx .res{background:rgba(255,255,255,.95);color:#4a3a6b;border-radius:18px;padding:14px;margin:10px 0;font-size:15px;line-height:1.7;animation:sxIn .4s}
@keyframes sxIn{from{transform:scale(.9);opacity:0}}
`;
function frame(el, cls) { if (!document.getElementById('sx-css')) { const s = document.createElement('style'); s.id = 'sx-css'; s.textContent = CSS; document.head.appendChild(s); } const box = document.createElement('div'); box.className = 'sx ' + cls; el.appendChild(box); return box; }
const toast = (box, t) => { const d = document.createElement('div'); d.textContent = t; d.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(40,30,60,.92);color:#fff;padding:10px 16px;border-radius:999px;font-weight:800;font-size:14px;z-index:99;pointer-events:none'; box.appendChild(d); setTimeout(() => d.remove(), 1800); };

// ================= ☕ カフェ =================
export const cafeApp = {
  mount(el, ctx) {
    const box = frame(el, 'cafe');
    const draw = () => {
      const bag = social.bag(), menu = CAFE_MENU.filter(k => !ITEMS[k].secret || social.has(ITEMS[k].secret, 'secret'));
      box.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h2>☕ カフェ「ほしの木」</h2><span class="pill">🪙 ${ctx.wallet.get()}</span></div>
        <div class="say">マスター「いらっしゃい。ぜんぶ、おみやげにできますよ。町のみんなにも好きなものがあってね…だれが何を好きかは、占いの館のルナさんがよく知ってるみたいです」</div>
        <div class="grid">${menu.map(k => { const it = ITEMS[k]; return `<button class="it" data-buy="${k}" ${ctx.wallet.get() < it.price ? 'disabled' : ''}><span class="ic">${it.icon}</span><b>${esc(it.name)}</b><small>${esc(it.en)}</small><span class="pr">🪙 ${it.price}</span></button>`; }).join('')}</div>
        <h3>🎒 もっているおみやげ</h3><div class="bag">${Object.keys(bag).length ? Object.entries(bag).map(([k, n]) => `<span>${ITEMS[k] ? ITEMS[k].icon + ' ' + esc(ITEMS[k].name) : k} ×${n}</span>`).join('') : '<span style="opacity:.6">まだないよ</span>'}</div>
        <p class="nt">住人に話しかけて「🎁 プレゼントする」で渡せるよ(1人に1日1回)。好きなものだと仲良くなれて、ゲームや頼みごと、お話が増えていく。<br>🃏 カード対戦は、アミューズメントセンターに引っ越しました(ハッタリ男爵と仲良くなると遊べる)。</p>`;
    };
    draw();
    box.onclick = e => {
      const b = e.target.closest('[data-buy]'); if (!b) return; const k = b.dataset.buy, it = ITEMS[k];
      if (ctx.wallet.get() < it.price) { toast(box, 'コインがたりないよ'); return; }
      ctx.wallet.add(-it.price, 'cafe'); social.addItem(k); toast(box, `${it.icon} ${it.name} を買った!`); draw();
    };
    return { unmount() { box.remove(); } };
  },
};

// ================= 🔮 占いの館 =================
const ASK_NPCS = Object.keys(PREFS);
export const fortuneApp = {
  mount(el, ctx) {
    const box = frame(el, 'ft'), P = ctx.params || {};
    const price = () => (social.has('luna', 'discount') ? 5 : 10);
    let view = 'top', result = '', tarot = null;
    // ルナは館の中で、何かをしている(入るたびに変わる)。お出かけの日の昼すぎ〜夕方は、館にいない
    const H = typeof P.hour === 'function' ? P.hour() : 12;
    const DOING = H < 10 ? ['朝の光で、水晶玉をみがいていた', 'ハーブティーを いれていた', '窓をあけて、空気を入れかえていた']
      : H < 17 ? ['タロットカードを1枚ずつ、ていねいに並べていた', '古い星の本を読んでいた', '水晶玉を、じっとのぞきこんでいた', 'カードを静かにシャッフルしていた']
      : ['ろうそくに火をともしていた', '星図に、何かを書きこんでいた', '窓から、夜空をながめていた', 'カードを月の光に当てていた'];
    const doing = DOING[Math.floor(Math.random() * DOING.length)];
    const out = typeof P.lunaOut === 'function' && P.lunaOut();
    const openTarot = () => {
      box.style.display = 'none';
      tarot = mountTarot(el, { ctx, social, ai: P.ai, getEn: P.getEn, artBase: P.tarotArt || '', logWord: P.logWord, onRead: P.onTarot, rec: P.rec, saveWord: P.saveWord, dictUrl: ctx.dictUrl || '',
        lunaLine: 'カードは、あなたの心をうつす鏡。…なにを たずねたいの?',
        onExit: () => { tarot && tarot.unmount(); tarot = null; box.style.display = ''; draw(); } });
    };
    const pay = () => { const p = price(); if (ctx.wallet.get() < p) { toast(box, `コインが ${p} まい いるわ`); return false; } ctx.wallet.add(-p, 'fortune'); return true; };
    const say = t => `<div class="say">🔮 ルナ「${t}」</div>`;
    const draw = () => {
      let h = `<div style="display:flex;justify-content:space-between;align-items:center"><h2>🔮 占いの館</h2><span class="pill">🪙 ${ctx.wallet.get()}</span></div>`;
      if (view !== 'top') h += `<button class="back" data-v="top">← もどる</button>`;
      if (result) h += `<div class="res">${result}</div>`;
      if (out) {
        h += `<p class="nt" style="font-size:14px;color:#e7dcff">(館の中は、しんとしている。テーブルに置き手紙がある)</p>${say('ちょっと町を散歩してくるわ。夕方にはもどるから、またいらっしゃい。 ― ルナ')}`;
        h += `<p class="nt">お出かけの日は、昼すぎから夕方まで館にいません。町のどこかで会えるかも…。</p>`;
        box.innerHTML = h; return;
      }
      if (view === 'top') {
        if (!result) h += `<p class="nt" style="font-size:13px;color:#e7dcff;margin:4px 0 0">(ルナは${doing})</p>`;
        h += `<button class="opt" data-v="tarot" style="border:1px solid #ffd76a;background:linear-gradient(135deg,rgba(255,215,106,.28),rgba(255,255,255,.08))"><span class="ic">🃏</span><span><b>タロット占い</b><small>78枚のカードで、本格的に占う(かんたん・じっくり)</small></span><span class="c">🪙${social.has('luna', 'discount') ? TAROT_PRICE.coin / 2 : TAROT_PRICE.coin}〜</span></button>`;
        h += say(result ? 'ほかにも、知りたいことはあるかしら?' : 'ようこそ、星の館へ…。ひとつ ' + price() + 'コインで、なんでも占ってあげる。わかったことは、ことばノートの「情報」に書いておきなさいね');
        h += [['pref', '💝', 'だれかの好きなもの', '住人の好物・にがてなものを1つ'], ['recipe', '🪸', '飾りのレシピ', 'まだ知らない飾りの材料(合成のレシピ帳に入る)'], ['show', '🐚', '標本を見せる', '見せた標本が、どの飾りの材料になるか'], ['hide', '🔍', 'かくれもののありか', '町に隠れているものが、どのあたりにあるか'], ['sky', '☀️', '天気を占う', 'この先1日の天気']]
          .map(([v, ic, t, s]) => `<button class="opt" data-v="${v}"><span class="ic">${ic}</span><span><b>${t}</b><small>${s}</small></span><span class="c">🪙${price()}</span></button>`).join('');
        h += `<p class="nt">占い師ルナと仲良くなると、占いが安くなるかも…。</p>`;
        if (P.talkLuna) h += `<button class="opt" data-v="talk"><span class="ic">💬</span><span><b>ルナとおしゃべり・プレゼント</b><small>仲良くなると、いいことがあるかも</small></span></button>`;
      } else if (view === 'pref') {
        h += say('だれのことを知りたいの?');
        const K = social.knownPrefs();
        h += `<div class="chips">${ASK_NPCS.map(id => { const p = PREFS[id], all = [...p.love, ...p.like, ...p.no], left = all.filter(it => !K[id + ':' + it]).length; return `<button data-np="${id}" ${left ? '' : 'disabled'}>${esc(NPC_NAME[id])}${left ? '' : ' ✓'}</button>`; }).join('')}</div>`;
      } else if (view === 'recipe') {
        h += say('どの飾りの秘密を知りたいの?');
        const known = new Set(spec.recipes().concat(spec.known()));
        h += [1, 2, 3].map(lv => `<p class="nt" style="margin-bottom:2px">${LV_NAME[lv]}</p><div class="chips">${DECOR[lv].map((_, r) => { const k = lv + ':' + r, kn = known.has(k), d = decorOf({ lv, rar: r }); return `<button data-rk="${k}" ${kn ? 'disabled' : ''}>${kn ? d.icon + ' ' + esc(d.name) + ' ✓' : `？？？ ${RAR[r]}`}</button>`; }).join('')}</div>`).join('');
      } else if (view === 'show') {
        h += say('見せてごらん。どの標本?');
        const own = spec.own(), ids = Object.keys(own).filter(id => SET[id] && !own[id].used);
        h += ids.length ? `<div class="chips">${ids.map(id => `<button data-sp="${id}">${esc(SET[id].look.name)}</button>`).join('')}</div>` : `<p class="nt">見せられる標本がないわ。英語の釣り堀で、セットの単語をぜんぶ完璧にするともらえるのよ。</p>`;
      }
      box.innerHTML = h;
    };
    const rec = (cat, text, key) => social.addInfo(cat, text, key);
    box.onclick = e => {
      const v = e.target.closest('[data-v]'); if (v) {
        const k = v.dataset.v; result = '';
        if (k === 'tarot') { openTarot(); return; }
        if (k === 'talk') { P.talkLuna(); return; }
        if (k === 'hide') { if (!pay()) return; const a = finds.hint(); result = a ? `🔍 きょうは「<b>${esc(a)}</b>」のあたりに、なにかが隠れているわ。近くで「調べる」をしてみなさい` : 'きょうは もう、ぜんぶ見つけたみたいね'; if (a) rec('かくれもの', `${new Date().getMonth() + 1}/${new Date().getDate()}:${a}のあたりに何かある(ルナ)`); view = 'top'; }
        else if (k === 'sky') { if (!pay()) return; const f = weather.forecast(8); result = '☀️ この先の天気よ<br>' + f.map(x => `${weather.hm(x.start)}〜 ${WX_INFO[x.kind].icon}`).join(' ・ '); rec('天気', f.map(x => `${weather.hm(x.start)}${WX_INFO[x.kind].icon}`).join(' ') + '(ルナ)'); view = 'top'; }
        else view = k;
        draw(); return;
      }
      const np = e.target.closest('[data-np]'); if (np) {
        const id = np.dataset.np, p = PREFS[id], K = social.knownPrefs();
        const order = [...p.love.map(x => [x, 'love']), ...p.no.map(x => [x, 'no']), ...p.like.map(x => [x, 'like'])].filter(([x]) => !K[id + ':' + x]);
        if (!order.length) return; if (!pay()) return;
        const [it, r] = order[0]; social.learnPref(id, it, r);
        result = `💝 ${esc(NPC_NAME[id])}は… ${ITEMS[it].icon} <b>${esc(ITEMS[it].name)}</b> が ${{ love: '<b>大好物</b>', like: '好き', no: 'にがて' }[r]} みたいね`; view = 'top'; draw(); return;
      }
      const rk = e.target.closest('[data-rk]'); if (rk) {
        if (!pay()) return; const [lv, r] = rk.dataset.rk.split(':').map(Number), d = decorOf({ lv, rar: r }), parts = RECIPES[lv][r].map(x => shapeName(lv, x));
        spec.knowRecipe(lv + ':' + r); rec('レシピ', `${d.icon}${d.name}(${LV_NAME[lv]} ${RAR[r]})= ${parts.join(' + ')}`, 'rcp:' + lv + ':' + r);
        result = `🪸 ${d.icon} <b>${esc(d.name)}</b> は… ${parts.map(esc).join(' + ')} を混ぜるとできるわ。<br><small>アクアリウムの合成のレシピ帳にも書いておいたわよ</small>`; view = 'top'; draw(); return;
      }
      const sp = e.target.closest('[data-sp]'); if (sp) {
        if (!pay()) return; const s = SET[sp.dataset.sp], lv = s.lv, sh = s.look.shape;
        const uses = RECIPES[lv].map((rr, i) => rr.includes(sh) ? i : -1).filter(i => i >= 0);
        const txt = uses.length ? uses.map(i => { const d = decorOf({ lv, rar: i }); return `${d.icon}${d.name}(${RAR[i]})`; }).join('、') : 'どの飾りにも使わない';
        rec('レシピ', `${s.look.name}(${shapeName(lv, sh)})→ ${txt}`, 'use:' + lv + ':' + sh);
        result = `🐚 ${esc(s.look.name)}(${esc(shapeName(lv, sh))})は… ${uses.length ? `<b>${esc(txt)}</b> の材料になるわ` : 'いまのところ、どの飾りにも使わないみたい'}`; view = 'top'; draw(); return;
      }
    };
    draw();
    if (P.tarot) openTarot();   // 「タロットで占って」から来たとき
    return { unmount() { tarot && tarot.unmount(); box.remove(); } };
  },
};
