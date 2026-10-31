// 天気(町と釣りで共通)。本当の時計で3時間ごとに 晴れ/くもり/雨 が決まる(だれの端末でも同じ天気)。
//   割合は仮:晴れ 55% / くもり 25% / 雨 20%。数字はここだけ直せば全体に効く。
export const WX = { BLOCK_H: 3, P: [['sun', 0.55], ['cloud', 0.25], ['rain', 0.20]] };
export const WX_INFO = { sun: { icon: '☀️', night: '🌙', name: '晴れ' }, cloud: { icon: '☁️', name: 'くもり' }, rain: { icon: '☔', name: '雨' } };
const BMS = WX.BLOCK_H * 36e5, JST = 9 * 36e5;
const hash = n => { let x = (n * 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 12; x = Math.imul(x, 0x297a2d39) >>> 0; x ^= x >>> 15; return (x >>> 0) / 4294967296; };
const blockOf = ms => Math.floor((ms + JST) / BMS);
function kindOfBlock(b) {
  const r = hash(b * 7 + 3); let acc = 0;
  for (const [k, p] of WX.P) { acc += p; if (r < acc) return k; }
  return 'sun';
}
// ゆずちゃんの「天気おねがい」:いまのブロックと、次のブロック(=次の予報)まで、その天気がつづく
function ov() { try { const o = JSON.parse(localStorage.getItem('town:wx:ov') || 'null'); return o && WX_INFO[o.kind] ? o : null; } catch (e) { return null; } }
function kindAt(ms) { const o = ov(); return o && ms < o.until ? o.kind : kindOfBlock(blockOf(ms)); }
function forced() { try { const v = localStorage.getItem('town:wx:force'); return v && WX_INFO[v] ? v : null; } catch (e) { return null; } }
export const weather = {
  at(ms = Date.now()) { return forced() || kindAt(ms); },
  // 天気おねがい:いまから「つぎの予報のブロックの終わりまで」kind にする
  call(kind) { try { localStorage.setItem('town:wx:ov', JSON.stringify({ kind, until: (blockOf(Date.now()) + 2) * BMS - JST })); } catch (e) { } },
  now() { return this.at(Date.now()); },
  isRain(ms) { return this.at(ms) === 'rain'; },
  // いまから先の予報:[{ start(ms), kind }] いまのブロックをふくめて n 個
  forecast(n = 4) { const b0 = blockOf(Date.now()), f = forced(); return Array.from({ length: n }, (_, i) => { const start = (b0 + i) * BMS - JST; return { start, kind: f || kindAt(i === 0 ? Date.now() : start) }; }); },
  nextChange() { const b0 = blockOf(Date.now()), k = this.now(); for (let i = 1; i < 16; i++) { const st = (b0 + i) * BMS - JST, kk = kindAt(st); if (kk !== k) return { start: st, kind: kk }; } return null; },
  label(k, night = false) { const i = WX_INFO[k] || WX_INFO.sun; return (night && i.night ? i.night : i.icon) + ' ' + i.name; },
  hm(ms) { const d = new Date(ms + JST); return d.getUTCHours() + '時'; },
};
// 釣りの画面などに出す予報の帯(HTML)。いま + この先3つ
export function wxStrip(rainFish = '') {
  const f = weather.forecast(4), now = f[0];
  const cells = f.map((x, i) => `<span style="display:inline-flex;flex-direction:column;align-items:center;min-width:44px;padding:3px 4px;border-radius:10px;${i === 0 ? 'background:#fff3c8;' : ''}"><small style="font-size:10px;color:#8d7f9e">${i === 0 ? 'いま' : weather.hm(x.start) + '〜'}</small><span style="font-size:18px">${WX_INFO[x.kind].icon}</span></span>`).join('');
  return `<div class="wxs" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin:0 0 8px;font-size:12px"><b style="margin-right:2px">天気よほう</b>${cells}${now.kind === 'rain' && rainFish ? `<small style="flex-basis:100%;color:#3b6fb0">☔ 雨の今だけ出やすい: ${rainFish}</small>` : rainFish ? `<small style="flex-basis:100%;color:#8d7f9e">☔ 雨の日に出やすい: ${rainFish}</small>` : ''}</div>`;
}
