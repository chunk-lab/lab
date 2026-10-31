// 買い物の共通部品:①買う前の確認(いくらで、いまいくらあって、買うといくら残るか)②買ったあとのレシート(元いくら − いくら = のこり)
//   どちらも町の上に重ねて出す(画面の上のコイン表示とは別)。コインでもダイヤでも使える。
let css = false;
function addCss() {
  if (css) return; css = true; const s = document.createElement('style');
  s.textContent = `.pay-ov{position:fixed;inset:0;z-index:99998;background:rgba(10,15,30,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit}
.pay-card{width:min(100%,340px);background:#fffaf0;color:#3a2a1a;border:3px solid #b98a52;border-radius:18px;padding:16px;box-shadow:0 8px 30px #0008;text-align:center}
.pay-card h3{margin:0 0 8px;font-size:18px}.pay-card .pay-n{font-size:14px;margin:0 0 8px;opacity:.85}
.pay-card table{width:100%;border-collapse:collapse;font-size:16px;margin:6px 0 12px}.pay-card td{padding:4px 2px}.pay-card td:last-child{text-align:right;font-weight:700}
.pay-card .pay-short{color:#c0392b;font-weight:700;margin:4px 0 10px}
.pay-card .pay-row{display:flex;gap:10px}.pay-card button{flex:1;padding:12px 6px;border-radius:12px;border:2px solid #b98a52;background:#fff;font-size:16px;font-weight:700;color:#3a2a1a}
.pay-card button.go{background:#ffc94d}.pay-card button:disabled{opacity:.4}
.pay-rc{position:fixed;left:50%;bottom:calc(110px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99999;background:#fffaf0;color:#3a2a1a;border:3px solid #b98a52;border-radius:14px;padding:10px 16px;box-shadow:0 6px 20px #0007;text-align:center;font-size:15px;pointer-events:none;animation:payin .25s ease-out}
.pay-rc b{font-size:19px}.pay-rc small{display:block;opacity:.75;margin-bottom:2px}
@keyframes payin{from{opacity:0;transform:translate(-50%,16px)}}`;
  document.head.appendChild(s);
}
const fmt = n => Number(n).toLocaleString('ja-JP');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 買うかどうかを聞く。買う→true / やめる→false。足りないときは「買う」を出さない
export function confirmPay({ label, price, have, icon = '🪙', unit = 'コイン', note = '', yes = '買う', no = 'やめる' }) {
  addCss();
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'pay-ov';
    const ok = have >= price;
    ov.innerHTML = `<div class="pay-card" role="dialog"><h3>🛒 ${esc(label)}</h3>${note ? `<p class="pay-n">${esc(note)}</p>` : ''}
      <table><tr><td>ねだん</td><td>${icon} ${fmt(price)}</td></tr><tr><td>いま持っている</td><td>${icon} ${fmt(have)}</td></tr><tr><td>買ったあと</td><td>${ok ? `${icon} ${fmt(have - price)}` : '―'}</td></tr></table>
      ${ok ? '' : `<p class="pay-short">${unit}が あと ${icon}${fmt(price - have)} たりません</p>`}
      <div class="pay-row">${ok ? `<button class="go" data-y>${esc(yes)}(${icon}${fmt(price)})</button>` : ''}<button data-n>${ok ? esc(no) : 'もどる'}</button></div></div>`;
    const done = v => { ov.remove(); res(v); };
    ov.addEventListener('click', e => { if (e.target === ov) done(false); });
    ov.querySelector('[data-n]').onclick = () => done(false);
    const y = ov.querySelector('[data-y]'); if (y) y.onclick = () => done(true);
    document.body.appendChild(ov);
  });
}
// 買ったあとのレシート(上のコイン表示とは別に、元いくら − いくら = のこり を出す)
let rcEl = null, rcT = 0;
export function receipt({ label = 'おかいもの', before, spent, after, icon = '🪙' }) {
  addCss(); rcEl && rcEl.remove(); clearTimeout(rcT);
  const d = document.createElement('div'); d.className = 'pay-rc';
  d.innerHTML = `<small>🧾 ${esc(label)}</small>${icon} ${fmt(before)} − ${fmt(spent)} = <b>${icon} ${fmt(after)}</b>`;
  document.body.appendChild(d); rcEl = d; rcT = setTimeout(() => { d.remove(); if (rcEl === d) rcEl = null; }, 3800);
}
