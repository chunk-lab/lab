import { ENV } from './env.js';
import { loadPlay } from './playsent.js';
// ===== まとまり: 「ゴルフ 5こ」「拾い物 12こ」のように、やったことの単位で、英ラボで消化していく =====
//   送られた言葉は、送った単位(まとまり)ごとに、その言葉の文を順番に動かす。終わったら「やった履歴」へ(あとで見直せる)。
const box = () => ENV.core && ENV.core.eigo;
const all = () => (box() && box().batches()) || [];
const ICON = l => /ゴルフ/.test(l) ? '⛳' : /フリスビー/.test(l) ? '🥏' : /拾い/.test(l) ? '🔍' : /ノート/.test(l) ? '📒' : /スポーツ/.test(l) ? '🏅' : '📥';
const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const day0 = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
const when = t => { const d = new Date(t), diff = Math.round((day0(new Date()) - day0(d)) / 864e5), hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; return diff === 0 ? `今日 ${hm}` : diff === 1 ? `きのう ${hm}` : `${d.getMonth() + 1}/${d.getDate()} ${hm}`; };
export const todo = () => all().filter(b => !b.done && (b.items || []).length).slice().sort((a, b) => b.at - a.at);
export const history = () => all().filter(b => b.done).slice().sort((a, b) => (b.doneAt || b.at) - (a.doneAt || a.at));
const save = b => { const B = all(), i = B.findIndex(x => x.id === b.id); if (i >= 0) B[i] = b; box().saveBatches(B); };
const toast = t => { try { ENV.core.ui.toast(t); } catch (e) { } };

let PILL = null;
const closePill = () => { if (PILL) { PILL.remove(); PILL = null; } };
export function runBatch(id, from) {
  closeList(); closePill();
  const b = all().find(x => x.id === id); if (!b) return;
  const items = (b.items || []).filter(i => i.play);
  if (!items.length) { toast('この まとまりは、文がまだ作れていません(AIのキーを入れると作れます)'); return; }
  let i = Math.max(0, Math.min(from != null ? from : (b.done ? 0 : b.idx || 0), items.length - 1));
  const host = ENV.root && (ENV.root.querySelector('#canvas') || ENV.root); if (!host) return;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const el = document.createElement('div'); PILL = el; el.className = 'eg-btpill';
  el.style.cssText = 'position:absolute;left:8px;top:100px;z-index:30;display:flex;align-items:center;gap:6px;background:#3b3552ee;color:#fff;border-radius:999px;padding:5px 6px 5px 12px;font:800 13px/1 sans-serif;box-shadow:0 2px 8px #0004';
  el.innerHTML = `<span class="t" style="white-space:nowrap"></span><button class="nx" style="border:0;border-radius:999px;padding:7px 12px;background:#ff6f94;color:#fff;font:inherit"></button><button class="qt" aria-label="やめる" style="border:0;border-radius:999px;width:28px;height:28px;background:#ffffff33;color:#fff;font:inherit;padding:0">✕</button>`;
  host.appendChild(el);
  const draw = () => { el.querySelector('.t').textContent = `${ICON(b.label)} ${b.label} ${i + 1}/${items.length}`; el.querySelector('.nx').textContent = i + 1 >= items.length ? 'おわり ✓' : 'つぎへ ▶'; };
  const show = () => { loadPlay(items[i].play); if (!el.isConnected) host.appendChild(el); draw(); };
  el.querySelector('.nx').onclick = () => {
    if (i + 1 >= items.length) { b.done = true; b.doneAt = Date.now(); b.idx = 0; save(b); closePill(); toast(`🎉 ${b.label} ${items.length}こ、おわり! 「やった履歴」に入れたよ`); const rest = todo(); if (rest.length) setTimeout(() => openList('todo'), 500); return; }
    i++; b.idx = i; save(b); show();
  };
  el.querySelector('.qt').onclick = () => { b.idx = i; save(b); closePill(); };
  show();
}

let LIST = null;
const closeList = () => { if (LIST) { LIST.remove(); LIST = null; } };
export function openList(tab) {
  closeList(); const root = ENV.root; if (!root) return;
  const T = todo(), H = history(); tab = tab || (T.length ? 'todo' : 'hist');
  const el = document.createElement('div'); LIST = el; el.className = 'eg-inbox eg-btlist';
  el.addEventListener('click', e => { if (e.target === el) closeList(); });
  el.style.cssText = 'position:absolute;inset:0;z-index:50;background:#0006;display:flex;align-items:center;justify-content:center;padding:16px';
  const rows = tab === 'todo' ? T : H;
  const card = b => {
    const ws = (b.items || []).map(x => x.en), part = ws.length > 5 ? ws.slice(0, 5).join(' · ') + ' …' : ws.join(' · ');
    const prog = !b.done && b.idx > 0 ? `つづき ${b.idx + 1}/${(b.items || []).filter(x => x.play).length}` : '';
    return `<div style="background:#f4f0fa;border-radius:14px;padding:10px 12px;margin-bottom:8px;text-align:left">
      <div style="font-size:15px;font-weight:900">${ICON(b.label)} ${esc(b.label)} <small style="color:#8d7f9e;font-weight:700">${(b.items || []).length}こ ・ ${when(b.done ? (b.doneAt || b.at) : b.at)}${b.done ? ' ・ やった' : ''}</small></div>
      <div style="font-size:12px;color:#6b6280;margin:4px 0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(part)}</div>
      <button data-id="${b.id}" style="width:100%;border:0;border-radius:999px;padding:10px;background:${b.done ? '#d6f0ff' : 'linear-gradient(160deg,#ffd0dc,#ffb3c1)'};color:${b.done ? '#3b3552' : '#fff'};font:inherit;font-size:14px;font-weight:800">${b.done ? '🔁 もういちど' : prog ? '▶ ' + prog : '▶ はじめる'}</button></div>`;
  };
  const tabB = (k, label, n) => `<button data-tab="${k}" style="flex:1;border:0;border-radius:999px;padding:8px;font:inherit;font-size:13px;font-weight:800;background:${tab === k ? '#786184' : '#e9e2f2'};color:${tab === k ? '#fff' : '#66507d'}">${label}(${n})</button>`;
  el.innerHTML = `<div style="background:#fff;border-radius:18px;padding:14px;max-width:360px;width:100%;box-shadow:0 8px 28px #0005;color:#3b3552;font-weight:700">
    <div style="font-size:16px;font-weight:900;text-align:center;margin-bottom:8px">📥 英語のまとまり</div>
    <div style="display:flex;gap:6px;margin-bottom:10px">${tabB('todo', 'これから', T.length)}${tabB('hist', 'やった履歴', H.length)}</div>
    <div style="max-height:46vh;overflow:auto">${rows.length ? rows.map(card).join('') : `<div style="padding:18px 6px;text-align:center;color:#8d7f9e;font-size:13px">${tab === 'todo' ? 'いま やるまとまりは ないよ。町でゴルフや探しものをすると、ここにたまるよ。' : 'まだ ないよ。'}</div>`}</div>
    <button data-x style="width:100%;border:0;background:none;margin-top:6px;padding:8px;font:inherit;font-size:12px;color:#8d7f9e">とじる</button></div>`;
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => openList(b.dataset.tab));
  el.querySelectorAll('button[data-id]').forEach(b => b.onclick = () => runBatch(b.dataset.id));
  el.querySelector('[data-x]').onclick = closeList;
  (root.closest('.cs-mount') || root).appendChild(el);
}
ENV.batchUI = { open: () => openList(), runBatch };
