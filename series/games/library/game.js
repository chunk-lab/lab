/* 図書館：本を選んで「ストリームで読む」か「読む・解く」。棚は 課題図書／話題の本／レベル別／共有の棚／新着(投票)／自分の本。
   運営の本(ストリームの長文・お話)は誰でも読める。共有の棚の本は「枠」に入れて使う（無料1・有料3。数字は core/economy.js）。 */
import { createStore } from '../../core/store.js';
import { myToStory } from '../chunkchunk/src/texts.js';
import { ECON } from '../../core/economy.js';
import './library.css';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const json = v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return null; } };
const TABS = [['weekly', '課題図書'], ['featured', '話題の本'], ['level', 'レベル別'], ['shelf', '共有の棚'], ['new', '新着'], ['mine', '自分の本']];
export default {
  id: 'library', name: '図書館',
  async mount(el, ctx) {
    const core = ctx.core, B = core.books, M = core.member, C = core.cloud;
    el.classList.add('lib'); el.innerHTML = '<div class="lib-wrap"><header class="lib-head"><b>図書館</b><span class="lib-slot"></span></header><nav class="lib-tabs"></nav><main class="lib-main"><p class="lib-note">本を読みこんでいます…</p></main></div>';
    ctx.showBack(true);
    await B.load();
    let tab = (ctx.opts && ctx.opts.tab) || ctx.store.get('tab') || 'weekly', lv = 1;
    const $ = s => el.querySelector(s), main = $('.lib-main');
    const offs = [M.onChange(draw), C.onChange(draw)];
    function head() {
      const sl = M.slots();
      $('.lib-slot').textContent = `${M.isPaid() ? '有料会員' : '無料会員'} ・ 共有の枠 ${sl.length}/${M.slotMax()}`;
      $('.lib-tabs').innerHTML = TABS.map(([k, n]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('');
      el.querySelectorAll('.lib-tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; ctx.store.set('tab', tab); draw(); });
    }
    const card = b => `<button class="lib-book lv${b.lv}" data-id="${esc(b.id)}"><span class="lib-lv">${B.LV[b.lv] || ''}</span><b>${esc(b.title)}</b>${b.ja ? `<small>${esc(b.ja)}</small>` : ''}<i>${esc(b.tag)}${b.canStream ? ' ・ ストリーム' : ''}${b.shared && M.hasSlot(b.sid) ? ' ・ 枠に入れている' : ''}</i></button>`;
    function draw() {
      head(); main.scrollTop = 0;
      let h = '';
      if (tab === 'weekly') { const w = B.weekly(); h = `<p class="lib-note">今週の課題図書。1冊終えると、その日の「今日の課題」(コイン ${ECON.daily.task})がもらえます。</p>` + (w.length ? w.map(card).join('') : '<p class="lib-note">今週の課題図書はまだありません。</p>'); }
      else if (tab === 'featured') h = B.featured().map(card).join('') || '<p class="lib-note">まだありません。</p>';
      else if (tab === 'level') h = `<nav class="lib-lvs">${[1, 2, 3].map(n => `<button data-lv="${n}" class="${n === lv ? 'on' : ''}">${B.LV[n]}</button>`).join('')}</nav>` + B.all().filter(b => b.lv === lv && !b.shared).map(card).join('');
      else if (tab === 'shelf') { const s = B.all().filter(b => b.shared); h = `<p class="lib-note">みんなが書いた本。読むには「枠」に入れます(無料会員 ${ECON.slots.free}つ・有料会員 ${ECON.slots.paid}つ)。</p>` + (s.map(card).join('') || '<p class="lib-note">まだ棚に本がありません。新着の投票で選ばれた本が、ここに並びます。</p>'); }
      else if (tab === 'new') h = newList();
      else h = mine();
      main.innerHTML = h; bind();
    }
    function newList() {
      const n = C.listNew();
      return `<p class="lib-note">新しく共有された本。中身を見て「使いたい」に投票できます(今週あと ${C.votesLeft()} 票)。${C.RULES.VOTE_DAYS}日たつと、票の多い本が共有の棚に並びます。</p>` +
        (n.map(x => `<article class="lib-new"><b>${esc(x.title)}</b><small>${esc(x.author)} ・ ${x.votes}票</small><p>${(x.story.list || []).slice(0, 2).map(s => esc(String(s[1] || '').slice(0, 60))).join('<br>')}</p>
          <div><button data-peek="${x.id}">中身を見る</button><button data-vote="${x.id}" ${C.voted(x.id) ? 'disabled' : ''}>${C.voted(x.id) ? '投票した' : '使いたい'}</button></div></article>`).join('') || '<p class="lib-note">新着はありません。</p>');
    }
    function myTexts() { return (json(createStore('chunkchunk').get('ccs-mytexts')) || []).filter(t => t && t.sents && t.sents.length); }
    function mine() {
      const my = myTexts();
      return `<button class="lib-btn" data-mytexts>My Texts を開く(長文の登録・問題づくり)</button>
        <p class="lib-note">${M.isPaid() ? '自分で書いた文章だけ共有できます。共有すると「新着」に並び、運営が課題図書などに使うことがあります。共有した本は自由に取り下げられません。' : '共有は有料会員だけです。'}</p>` +
        (my.map((t, i) => `<article class="lib-new"><b>${esc(t.title || '無題')}</b><small>${t.sents.length}文</small><div><button data-myread="${i}">読む・解く</button>${M.isPaid() ? `<button data-share="${i}">共有する</button>` : ''}</div></article>`).join('') || '<p class="lib-note">まだ自分の本がありません。</p>');
    }
    function bind() {
      main.querySelectorAll('.lib-book').forEach(b => b.onclick = () => detail(B.byId(b.dataset.id)));
      main.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { lv = +b.dataset.lv; draw(); });
      main.querySelectorAll('[data-vote]').forEach(b => b.onclick = () => { if (!C.vote(b.dataset.vote)) core.ui.toast('今週の票はもうありません'); });
      main.querySelectorAll('[data-peek]').forEach(b => b.onclick = () => peek(C.get(b.dataset.peek)));
      const mt = main.querySelector('[data-mytexts]'); if (mt) mt.onclick = () => core.openGame && core.openGame('chunkchunk', { face: 'library', open: 'mytexts' });
      main.querySelectorAll('[data-myread]').forEach(b => b.onclick = () => { const t = myTexts()[+b.dataset.myread]; try { core.reader.open(myToStory(t), { backLabel: '← 図書館へ' }); } catch (e) { core.ui.toast('この文章は開けませんでした'); } });
      main.querySelectorAll('[data-share]').forEach(b => b.onclick = () => {
        const t = myTexts()[+b.dataset.share];
        core.ui.sheet(`<h3>共有する</h3><p class="cs-note">「${esc(t.title || '無題')}」を共有します。<br>・自分で書いた文章だけ共有できます(本や教科書の文章は不可)<br>・運営が課題図書などに使うことがあります<br>・共有したあと、自由に取り下げることはできません</p><button class="cs-btn" data-ok>同意して共有する</button>`, (ov, close) => ov.querySelector('[data-ok]').onclick = () => {
          let r = { ok: false }; try { r = C.share({ title: t.title || '無題', story: myToStory(t), level: 0, author: core.profile.name || 'だれか' }); } catch (e) { console.error(e); } close();
          core.ui.toast(r.ok ? '共有しました。新着に並びます' : '共有できませんでした');
        });
      });
    }
    function peek(x) {
      if (!x) return;
      core.ui.sheet(`<h3>${esc(x.title)}</h3><p class="cs-note">${esc(x.author)} ・ 新着(投票中)。中身を見ることはできますが、遊ぶことはできません。</p><div class="lib-peek">${(x.story.list || []).map(s => `<p>${esc(String(s[0]).replace(/[A-Z]:|=[^|]*|\|/g, ' ').replace(/\s+/g, ' '))}<br><small>${esc(s[1] || '')}</small></p>`).join('')}</div>`);
    }
    function detail(b) {
      if (!b) return;
      const needSlot = b.shared && !M.hasSlot(b.sid);
      const acts = [];
      if (needSlot) acts.push(`<button class="cs-btn" data-a="slot">枠に入れる(${M.slots().length}/${M.slotMax()})</button>`);
      else {
        if (b.canStream && core.openGame) acts.push(`<button class="cs-btn lib-go" data-a="stream">ストリームで読む</button>`);
        if (b.canRead) acts.push(`<button class="cs-btn" data-a="read">読む・解く</button>`);
      }
      core.ui.sheet(`<h3>${esc(b.title)}</h3><p class="cs-note">${B.LV[b.lv] || ''} ・ ${esc(b.tag)}${b.ja ? '<br>' + esc(b.ja) : ''}</p>${acts.join('')}`, (ov, close) => {
        ov.querySelectorAll('[data-a]').forEach(x => x.onclick = () => {
          const a = x.dataset.a; close();
          if (a === 'stream') core.openGame('stream', { passage: b.pid });
          else if (a === 'read') B.read(b, { onClose: () => b.shared && rateAsk(b) });
          else if (a === 'slot') slotIn(b);
        });
      });
    }
    function rateAsk(b) {
      if (!C.canRate(b.sid)) return;
      core.ui.sheet(`<h3>この本はどうでしたか?</h3><button class="cs-btn" data-r="1">よかった</button><button class="cs-btn" data-r="0">いまいち</button>`, (ov, close) => ov.querySelectorAll('[data-r]').forEach(x => x.onclick = () => { C.rate(b.sid, x.dataset.r === '1'); close(); }));
    }
    function slotIn(b) {
      const sl = M.slots(), full = sl.length >= M.slotMax();
      if (!full) { M.slotIn({ id: b.sid, title: b.title }); core.ui.toast('枠に入れました'); detail(B.byId(b.id)); return; }
      const price = ECON.swap.free;
      core.ui.sheet(`<h3>入れ替える本を選ぶ</h3><p class="cs-note">${M.isPaid() ? '有料会員は入れ替え無料です。' : `無料会員の入れ替えは コイン ${price.coins} か ダイヤ ${price.gems}(持っている:コイン ${core.wallet.get()} ・ ダイヤ ${M.gems()})。`}</p>` +
        sl.map(s => `<button class="cs-btn" data-out="${s.id}">「${esc(s.title)}」と入れ替える</button>`).join('') + (M.isPaid() ? '' : '<label class="cs-row"><span>ダイヤで払う</span><input type="checkbox" data-gems></label>'), (ov, close) => {
        ov.querySelectorAll('[data-out]').forEach(x => x.onclick = () => {
          const g = ov.querySelector('[data-gems]'), r = M.slotIn({ id: b.sid, title: b.title }, { out: x.dataset.out, pay: g && g.checked ? 'gems' : 'coins' }); close();
          core.ui.toast(r.ok ? '入れ替えました' : r.why === 'coins' ? 'コインが足りません' : r.why === 'gems' ? 'ダイヤが足りません' : '入れ替えできませんでした');
        });
      });
    }
    draw();
    return { unmount() { offs.forEach(f => f()); el.innerHTML = ''; } };
  }
};
