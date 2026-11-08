/* 役割さがし：1文を出して、決められた役割の語(かたまり)だけをタップして選ぶテスト。
   文は、読む画面の本(core.books)に入っている役割つきのチャンクをそのまま使う(新しいデータはいらない)。
   名前は2通り：かんたん(主役・どうしてる？・お相手・どうだ？・飾り)／文法(主語・動詞・目的語・補語・修飾語)。
   大きく出す名前の下に、もう一方を小さく添える(下に付けるときは省略せず、横に付けるときは頭文字)。切り替えは右上。 */
import { createStore } from './store.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 選ぶ役割の組(g)：S主語 V動詞 O目的語 C補語 A飾り(場所・時・様子・理由・条件・その他の修飾語句)。I(誰に)は目的語の仲間として扱う
const GROUPS = [
  { g: 'S', easy: '主役', gram: '主語', ini: '主', roles: 'S' },
  { g: 'V', easy: 'どうしてる？', gram: '動詞', ini: '動', roles: 'V' },
  { g: 'O', easy: 'お相手', gram: '目的語', ini: '目', roles: 'OI' },
  { g: 'C', easy: 'どうだ？', gram: '補語', ini: '補', roles: 'C' },
  { g: 'A', easy: '飾り', gram: '修飾語', ini: '飾', roles: 'PTMRFX' },
];
const gOf = r => (GROUPS.find(x => x.roles.includes(r)) || {}).g;
const shuffle = a => a.slice().sort(() => Math.random() - 0.5);
// 読む画面の形式「S:My grandmother=私の祖母は | V:lives=… 」を [{r,en}] に
export function parseSentence(s) {
  return String(s || '').replace(/^@\w /, '').split(' | ').map(u => { const m = u.match(/^([A-Z]):(.*)$/); if (!m) return null; return { r: m[1], en: m[2].replace(/=.*$/, '').replace(/#.*$/, '').replace(/\s*\/\s*/g, ' ').trim() }; }).filter(x => x && x.en);
}
export function createRoleTest(core) {
  const st = createStore('core');
  let ov = null, disp = st.get('roleDisp') || 'easy', stat = { ok: 0, ng: 0 }, q = null, t0 = 0, pool = null;
  const label = (g, big) => { const x = GROUPS.find(y => y.g === g); return big === 'easy' ? x.easy : x.gram; };
  const both = g => { const x = GROUPS.find(y => y.g === g); return disp === 'easy' ? `<b>${esc(x.easy)}</b><small>${esc(x.gram)}</small>` : `<b>${esc(x.gram)}</b><small>${esc(x.easy)}</small>`; };
  async function load() {
    if (pool) return pool; const B = core.books; if (!B) return (pool = []);
    try { await B.load(); const lv = (core.level && core.level.lv) || 1; if (B.need) await B.need(Math.min(3, Math.max(1, lv > 3 ? lv - 3 : lv))).catch(() => { }); } catch (e) { }
    const out = [];
    for (const b of B.all()) { let s = null; try { s = b.story(); } catch (e) { } ((s && s.list) || []).forEach(x => { const ch = parseSentence(x[0]); if (ch.length >= 3 && ch.length <= 6 && ch.every(c => c.en.split(/\s+/).length <= 7)) out.push({ ch, ja: x[1] || '', from: b.title }); }); }
    return (pool = out);
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  async function open() {
    if (ov) close();
    ov = document.createElement('div'); ov.className = 'cs-ov cs-study-ov';
    ov.innerHTML = `<div class="cs-study" role="dialog" aria-label="役割さがし"><header><b>役割さがし</b><button class="cs-x" data-sw style="font-size:12px;width:auto;padding:0 8px">名前を切り替え</button><button class="cs-x" data-x aria-label="とじる">✕</button></header><main><p class="cs-sub" style="text-align:center">文を集めています…</p></main></div>`;
    core.ui.root.appendChild(ov);
    ov.querySelector('[data-x]').onclick = () => { finish(); close(); }; ov.addEventListener('click', e => { if (e.target === ov) { finish(); close(); } });
    ov.querySelector('[data-sw]').onclick = () => { disp = disp === 'easy' ? 'gram' : 'easy'; st.set('roleDisp', disp); if (q) show(); };
    stat = { ok: 0, ng: 0 }; t0 = Date.now();
    const P = await load(); if (!ov) return;
    if (!P.length) { ov.querySelector('main').innerHTML = '<p class="cs-sub" style="text-align:center">使える文が見つかりませんでした。通信を確かめて、もう一度開いてください。</p>'; return; }
    next();
  }
  function finish() { try { if (stat.ok + stat.ng) core.events.report('role', 'done', { play: 'role.test', min: Math.round((Date.now() - t0) / 6e3) / 10, words: 0, finished: true }); } catch (e) { } stat = { ok: 0, ng: 0 }; }
  function next() {
    // 文を選ぶ → その文にある役割の組から1つ決める(飾りは複数のことがある。選ぶ数が4つ以内の組だけ)
    for (let k = 0; k < 40; k++) {
      const s = pool[Math.floor(Math.random() * pool.length)], gs = [...new Set(s.ch.map(c => gOf(c.r)).filter(Boolean))].filter(g => s.ch.filter(c => gOf(c.r) === g).length <= 3);
      if (!gs.length) continue; const g = gs[Math.floor(Math.random() * gs.length)];
      q = { s, g, sel: new Set(), done: false }; return show();
    }
  }
  function show() {
    const { s, g } = q, ans = s.ch.map((c, i) => gOf(c.r) === g ? i : -1).filter(i => i >= 0), m = ov.querySelector('main');
    m.innerHTML = `<section class="cs-panel" style="text-align:center"><p class="cs-sub">この文で、これにあたる語を ${ans.length > 1 ? 'ぜんぶ ' : ''}タップ</p>
      <div class="rl-q" style="margin:8px 0;line-height:1.25">${both(g).replace('<b>', '<b style="font-size:26px">').replace('<small>', '<br><small style="font-size:12px;color:#789">')}</div>
      <div class="rl-ch" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:14px 0">${s.ch.map((c, i) => `<button data-i="${i}" style="padding:11px 12px;font-size:18px;border-radius:12px;border:2px solid #bcd;background:#fff;color:#123">${esc(c.en)}</button>`).join('')}</div>
      <div data-fb></div><button class="cs-btn cs-go cs-big" data-ok>こたえあわせ</button></section>
      <p class="cs-sub" data-stat style="text-align:center">せいかい ${stat.ok} ・ まちがい ${stat.ng}</p>`;
    const paint = () => m.querySelectorAll('[data-i]').forEach(b => { const on = q.sel.has(+b.dataset.i); b.style.borderColor = on ? '#2d6be0' : '#bcd'; b.style.background = on ? '#e3edff' : '#fff'; });
    m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { if (q.done) return; const i = +b.dataset.i; if (q.sel.has(i)) q.sel.delete(i); else q.sel.add(i); paint(); });
    m.querySelector('[data-ok]').onclick = () => {
      if (q.done) return next();
      if (!q.sel.size) return core.ui.toast('えらんでね');
      q.done = true; const ok = ans.length === q.sel.size && ans.every(i => q.sel.has(i)); stat[ok ? 'ok' : 'ng']++;
      m.querySelectorAll('[data-i]').forEach(b => { const i = +b.dataset.i, isA = ans.includes(i), on = q.sel.has(i); b.style.borderColor = isA ? '#4a4' : on ? '#c55' : '#bcd'; b.style.background = isA ? '#d8f5de' : on ? '#fde0e0' : '#fff'; });
      m.querySelector('[data-fb]').innerHTML = `<p style="font-size:17px"><b>${ok ? '⭕ せいかい' : '✖ ざんねん'}</b></p><p class="cs-sub">${esc(s.ch.map(c => c.en).join(' '))}<br>${esc(s.ja)}</p>
        <p class="cs-sub">${s.ch.map(c => { const x = GROUPS.find(y => y.g === gOf(c.r)); return x ? `${esc(c.en)}＝${esc(label(x.g, disp))}` : ''; }).filter(Boolean).join(' ・ ')}</p>`;
      m.querySelector('[data-ok]').textContent = 'つぎへ';
      m.querySelector('[data-stat]').textContent = `せいかい ${stat.ok} ・ まちがい ${stat.ng}`;
    };
  }
  return { open, close, parseSentence };
}
