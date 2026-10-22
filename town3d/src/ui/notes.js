// ことばノート:住人との会話で集めた英語(単語・フレーズ・文)の一覧
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const KIND = { word: '単語', phrase: 'フレーズ', sentence: '文' };

export function openNotes({ hud, getNotes, onDelete, onMeaning }) {
  let tab = 'all';
  const p = hud.panel(`<h2>ことばノート</h2>
    <div class="tw-ftabs"><button class="tw-btn on" data-t="all">ぜんぶ</button><button class="tw-btn" data-t="word">単語</button><button class="tw-btn" data-t="phrase">フレーズ</button><button class="tw-btn" data-t="sentence">文</button></div>
    <div class="tw-nlist" role="list"></div>
    <div class="tw-actions"><button class="tw-btn" data-a="close">とじる</button></div>`);
  const list = p.querySelector('.tw-nlist');
  const render = () => {
    const rows = getNotes().filter(n => tab === 'all' || n.kind === tab).slice().reverse();
    list.innerHTML = rows.length ? rows.map(n => `<div class="tw-nrow" role="listitem"><div><span class="tw-kind">${KIND[n.kind] || ''}</span><b>${esc(n.text)}</b>${n.count > 1 ? ` <small style="display:inline">×${n.count}</small>` : ''}</div>
      ${n.kind === 'sentence' ? '' : `<div class="tw-nm">${n.meaning ? esc(n.meaning) : `<button class="tw-btn" data-m="${esc(n.id)}" style="padding:3px 10px;font-size:12px">${n.pending ? '…' : '意味を調べる'}</button>`}</div>`}
      ${n.kind === 'sentence' ? '' : `<small>${esc(n.sentence)}</small>`}
      <small>${esc(n.npc || '')} ・ ${esc(n.date || '')} <button class="tw-btn" data-d="${esc(n.id)}" style="padding:2px 9px;font-size:11px;margin-left:6px">けす</button></small></div>`).join('')
      : '<p class="tw-note">まだ何もありません。住人の英語の返事の単語をタップして、「ほぞん」を押してみてね。</p>';
  };
  p.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.a === 'close') return hud.closePanel();
    if (b.dataset.t) { tab = b.dataset.t; p.querySelectorAll('.tw-ftabs .tw-btn').forEach(x => x.classList.toggle('on', x === b)); return render(); }
    if (b.dataset.d) { onDelete(b.dataset.d); return render(); }
    if (b.dataset.m) { b.textContent = '…'; await onMeaning(b.dataset.m); if (p.isConnected) render(); }
  });
  render();
}
