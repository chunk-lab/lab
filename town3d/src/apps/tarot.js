// 🃏 ルナのタロット占い(占いの館の中)
// 流れ:占い方をえらぶ → テーマ(と質問) → シャッフル → カット(3つの山) → 78枚から直感でえらぶ → めくる → 鑑定
// 料金:かんたん(ワンオラクル・スリーカード)= 100コイン(ルナと仲良しLv2で半額)。週に1回は無料、仲良しLv3で毎日1回無料
//       じっくり(ケルト十字・10枚)= 3ダイヤ(10回券 25ダイヤ)。ルナの長い鑑定と、鑑定書(記録)
// 鑑定の文:AIがつながっていれば、ルナがAIで読む(英語モードなら英語+訳)。なければ、カードの意味と並び方から組み立てる
// 絵の差し替え:o.artBase に画像の場所を入れると、<artBase><カードid>.webp を使う(なければ下の仮の絵)
import { CARDS, CARD, SUITS } from './tarot_cards.js';

export const TAROT_PRICE = { coin: 100, gem: 3, pack: { n: 10, gem: 25 } };
const SPREADS = {
  one: { n: 'ワンオラクル', en: 'One Card', d: '1枚で、今のあなたへのメッセージ', tier: 'easy', pos: [['今のあなたへのメッセージ', 'Message']] },
  three: { n: 'スリーカード', en: 'Three Cards', d: '過去・現在・未来の流れを読む', tier: 'easy', pos: [['過去', 'Past'], ['現在', 'Present'], ['未来', 'Future']] },
  celtic: { n: 'ケルト十字', en: 'Celtic Cross', d: '10枚で、悩みの根っこから結末まで', tier: 'deep',
    pos: [['現状', 'Present'], ['障害・試練', 'Challenge'], ['目標・意識していること', 'Conscious'], ['根っこ・無意識', 'Foundation'], ['過去', 'Recent Past'], ['近い未来', 'Near Future'], ['あなた自身', 'Yourself'], ['まわりの環境', 'Environment'], ['願いと恐れ', 'Hopes and Fears'], ['最終結果', 'Outcome']] },
};
const THEMES = [['all', '🔮', '総合運'], ['love', '💞', '恋愛'], ['work', '📚', '勉強・仕事'], ['people', '🤝', '人間関係'], ['money', '🪙', 'お金'], ['self', '🌱', '自分のこと']];
const REV_RATE = 0.35;   // 逆位置の出やすさ

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = n => { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; } catch (e) { return Math.floor(Math.random() * n); } };
const dayKey = (d = new Date()) => { const z = new Date(d.getTime() - 4 * 36e5); return `${z.getFullYear()}-${z.getMonth() + 1}-${z.getDate()}`; };
const weekKey = (d = new Date()) => { const z = new Date(d.getTime() - 4 * 36e5); z.setHours(0, 0, 0, 0); z.setDate(z.getDate() - (z.getDay() + 6) % 7); return 'w' + dayKey(new Date(z.getTime() + 5 * 36e5)); };   // 月曜はじまり

// ---------- 仮の絵(SVG) ----------
const PIPS = {
  1: [[60, 98]], 2: [[60, 66], [60, 130]], 3: [[60, 58], [60, 98], [60, 138]], 4: [[42, 66], [78, 66], [42, 130], [78, 130]],
  5: [[42, 62], [78, 62], [60, 98], [42, 134], [78, 134]], 6: [[42, 58], [78, 58], [42, 98], [78, 98], [42, 138], [78, 138]],
  7: [[42, 58], [78, 58], [60, 78], [42, 98], [78, 98], [42, 138], [78, 138]], 8: [[42, 56], [78, 56], [60, 76], [42, 96], [78, 96], [60, 118], [42, 140], [78, 140]],
  9: [[42, 54], [78, 54], [42, 82], [78, 82], [60, 98], [42, 114], [78, 114], [42, 142], [78, 142]],
  10: [[42, 52], [78, 52], [60, 68], [42, 84], [78, 84], [42, 112], [78, 112], [60, 128], [42, 144], [78, 144]],
};
const SYM = {   // 20x20 の中に描く
  wands: '<g transform="rotate(28 10 10)"><rect x="8.7" y="0.5" width="2.6" height="19" rx="1.3"/><circle cx="10" cy="5" r="1.7"/><circle cx="10" cy="12.5" r="1.5"/><path d="M11.5 3.2c2.6-1.8 4.6-1.2 5.6.2-2 .9-3.8.8-5.6-.2zM8.5 8.2c-2.6-1.8-4.6-1.2-5.6.2 2 .9 3.8.8 5.6-.2zM11.5 15c2.2-1.4 4-.9 4.8.3-1.7.7-3.3.7-4.8-.3z"/></g>',
  cups: '<path d="M3.5 2.5h13c0 5.2-2.6 8.4-5.3 8.9V15h3.3v2.5H5.5V15h3.3v-3.6C6.1 10.9 3.5 7.7 3.5 2.5z"/>',
  swords: '<path d="M10 .5l1.8 2.6V12h3.4v2h-3.4v2.2l1 .8v2.5h-5.6V17l1-.8V14H4.8v-2h3.4V3.1z"/>',
  pentacles: '<circle cx="10" cy="10" r="9" fill="none" stroke-width="1.6" stroke="currentColor"/><path d="M10 2.6l2.1 5.2 5.5.3-4.3 3.5 1.5 5.4L10 14l-4.8 3 1.5-5.4-4.3-3.5 5.5-.3z"/>',
};
function faceSVG(c) {
  const S = SUITS[c.suit], gid = 'tg' + c.id;
  let art = '';
  if (c.suit === 'major') {
    art = `<circle cx="60" cy="98" r="40" fill="none" stroke="${S.ink}" stroke-opacity=".5" stroke-width="1"/>
      ${Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<line x1="${60 + Math.cos(a) * 44}" y1="${98 + Math.sin(a) * 44}" x2="${60 + Math.cos(a) * 52}" y2="${98 + Math.sin(a) * 52}" stroke="${S.ink}" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/>`; }).join('')}
      <text x="60" y="113" text-anchor="middle" font-size="42">${c.g}</text>`;
  } else if (c.court) {
    art = `<circle cx="60" cy="92" r="30" fill="${S.ink}" fill-opacity=".14" stroke="${S.ink}" stroke-opacity=".6"/>
      <text x="60" y="105" text-anchor="middle" font-size="34">${c.court}</text>
      <g fill="${S.ink}" color="${S.ink}" transform="translate(49 130) scale(1.1)">${SYM[c.suit]}</g>`;
  } else {
    const big = c.rank === 1, sc = big ? 2.6 : c.rank <= 3 ? 1.5 : c.rank <= 6 ? 1.3 : 1.12;
    art = PIPS[c.rank].map(([x, y]) => `<g fill="${S.ink}" color="${S.ink}" transform="translate(${x - 10 * sc} ${y - 10 * sc}) scale(${sc})">${SYM[c.suit]}</g>`).join('');
  }
  const name = c.en.length > 17 ? c.en.replace(' of ', ' / ') : c.en;
  return `<svg viewBox="0 0 120 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" class="tz-svg">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.col[0]}"/><stop offset="1" stop-color="${S.col[1]}"/></linearGradient></defs>
    <rect x="1" y="1" width="118" height="198" rx="9" fill="url(#${gid})"/>
    <rect x="6" y="6" width="108" height="188" rx="6" fill="none" stroke="${S.ink}" stroke-opacity=".75" stroke-width="1.2"/>
    <rect x="9" y="9" width="102" height="182" rx="4" fill="none" stroke="${S.ink}" stroke-opacity=".3" stroke-width=".7"/>
    <text x="60" y="30" text-anchor="middle" font-family="Georgia,serif" font-size="${c.num.length > 4 ? 11 : 15}" letter-spacing="1" fill="${S.ink}">${esc(c.num)}</text>
    ${art}
    <text x="60" y="170" text-anchor="middle" font-family="Georgia,serif" font-size="${name.length > 14 ? 8.5 : 10}" fill="${S.ink}" letter-spacing=".4">${esc(name)}</text>
    <text x="60" y="184" text-anchor="middle" font-size="9.5" font-weight="700" fill="#fff" fill-opacity=".85">${esc(c.n)}</text>
  </svg>`;
}
const BACK = `<svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" class="tz-svg">
  <defs><linearGradient id="tzbk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b1a55"/><stop offset="1" stop-color="#140b2e"/></linearGradient>
  <pattern id="tzst" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r=".8" fill="#ffd76a" fill-opacity=".55"/><circle cx="14" cy="15" r=".6" fill="#fff" fill-opacity=".45"/></pattern></defs>
  <rect x="1" y="1" width="118" height="158" rx="9" fill="url(#tzbk)"/><rect x="1" y="1" width="118" height="158" rx="9" fill="url(#tzst)"/>
  <rect x="6" y="6" width="108" height="148" rx="6" fill="none" stroke="#ffd76a" stroke-opacity=".8" stroke-width="1.2"/>
  <circle cx="60" cy="80" r="28" fill="none" stroke="#ffd76a" stroke-opacity=".7"/><circle cx="60" cy="80" r="21" fill="none" stroke="#ffd76a" stroke-opacity=".35"/>
  <path d="M66 66a15 15 0 1 0 0 28a12 12 0 1 1 0-28z" fill="#ffd76a"/><path d="M60 24l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM60 120l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffd76a" fill-opacity=".8"/>
</svg>`;
const BACK_URL = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(BACK.replace(' class="tz-svg"', '')) + '")';
const BW = 120, BH = 160;   // 儀式で動かすカードの元の大きさ(表示の大きさは scale で決める。小さくして使うので、ぼやけない)

const CSS = `
.tz{position:absolute;inset:0;overflow:hidden;color:#f3eaff;font-family:inherit;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;
  background:radial-gradient(ellipse at 50% -10%,#6a4aa0 0%,#2a1d47 52%,#110922 100%)}
.tz-sky{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.tz-pg{position:absolute;inset:0;overflow:auto;padding:12px 14px calc(30px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
.tz-pg.rit{overflow:hidden;display:flex;flex-direction:column;padding-bottom:calc(10px + env(safe-area-inset-bottom,0px))}
.tz h2{margin:2px 0 2px;font-size:20px;letter-spacing:.05em}.tz h2 small{display:block;font:italic 12px Georgia,serif;color:#cdbbea;letter-spacing:.12em}
.tz .tz-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.tz .tz-pill{display:inline-flex;gap:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:4px 10px;font-weight:900;font-size:13px;white-space:nowrap}
.tz .tz-say{background:rgba(255,255,255,.08);border:1px solid rgba(255,215,106,.35);border-radius:16px;padding:10px 12px;margin:10px 0;font-size:14px;line-height:1.7}
.tz .tz-say b{color:#ffd76a}
.tz .tz-back{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:900;background:rgba(255,255,255,.14);color:#fff;margin:4px 0}
.tz .tz-sp{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:1px solid rgba(255,215,106,.35);border-radius:18px;padding:12px;margin:8px 0;background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(255,255,255,.03));color:#f3eaff;font:inherit}
.tz .tz-sp.deep{border-color:#ffd76a;background:linear-gradient(135deg,rgba(255,215,106,.24),rgba(120,80,200,.16))}
.tz .tz-sp .mini{display:flex;gap:2px;flex:0 0 auto}.tz .tz-sp .mini i{display:block;width:16px;height:22px;border-radius:3px;background:${BACK_URL} center/100% 100%}
.tz .tz-sp b{display:block;font-size:16px}.tz .tz-sp small{display:block;font-size:12px;color:#cdbbea;margin-top:2px}.tz .tz-sp em{font:italic 11px Georgia,serif;color:#ffd76a;margin-left:6px}
.tz .tz-sp .pr{margin-left:auto;text-align:right;font-weight:900;white-space:nowrap;font-size:14px}.tz .tz-sp .pr small{color:#ffd76a;font-size:11px}
.tz .tz-sub{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.tz .tz-btn{border:0;border-radius:999px;padding:11px 18px;font:inherit;font-weight:900;font-size:15px;background:linear-gradient(160deg,#ffe08a,#ffb94f);color:#3b2470;box-shadow:0 3px 0 #b07a1f,0 0 18px rgba(255,200,90,.25)}
.tz .tz-btn.sub{background:rgba(255,255,255,.14);color:#fff;box-shadow:none;border:1px solid rgba(255,255,255,.18)}.tz .tz-btn:disabled{opacity:.4}
.tz .tz-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.tz .tz-chips button{border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:9px 13px;font:inherit;font-weight:800;font-size:14px;background:rgba(255,255,255,.08);color:#fff}
.tz .tz-chips button.on{background:#ffd76a;color:#3b2470;border-color:#ffd76a}
.tz .tz-q{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:10px 12px;background:rgba(0,0,0,.25);color:#fff;font:inherit;font-size:15px;user-select:text;-webkit-user-select:text}
.tz .tz-nt{font-size:12px;color:#cdbbea;line-height:1.6;margin:6px 0}
.tz .tz-c{text-align:center}
.tz .tz-in{animation:tzUp .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes tzUp{from{opacity:0;transform:translateY(16px)}}
@keyframes tzFade{from{opacity:0}}
.tz-svg{display:block;width:100%;height:100%}
/* 儀式の画面 */
.tz .tz-lu{min-height:46px;margin:6px 0 0;font-size:14px;line-height:1.65;text-align:center;color:#f3eaff;text-shadow:0 0 12px rgba(180,140,255,.6)}
.tz .tz-lu i{font-style:normal;color:#ffd76a}
.tz .tz-lu.on{animation:tzLu .9s ease both}@keyframes tzLu{from{opacity:0;filter:blur(4px);transform:translateY(4px)}}
.tz .tz-stage{position:relative;z-index:1;flex:1;min-height:250px;margin:2px -14px 0;overflow:hidden;touch-action:none}
.tz .tz-ring{position:absolute;left:50%;top:50%;width:min(96vw,440px);aspect-ratio:1;transform:translate(-50%,-50%);opacity:.32;pointer-events:none;transition:opacity 1s}
.tz .tz-ring svg{width:100%;height:100%;animation:tzRot 90s linear infinite}.tz .tz-ring.hot{opacity:.7}
@keyframes tzRot{to{transform:rotate(360deg)}}
.tz .tz-ctl{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;padding:8px 0 0;min-height:50px;align-items:center}
.tz .tz-ctl .tz-btn{animation:tzUp .5s both}
.tz .tz-hint{font-size:12px;color:#cdbbea;width:100%;text-align:center;margin-top:-2px}
.tz .tc{position:absolute;left:0;top:0;width:${BW}px;height:${BH}px;cursor:pointer;transform-origin:50% 50%}
.tz .tc-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .9s cubic-bezier(.25,.9,.3,1.12)}
.tz .tc.open .tc-in{transform:rotateY(180deg)}.tz .tc.nt .tc-in{transition:none}
.tz .tc-b,.tz .tc-f{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:7%;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.55)}
.tz .tc-b{background:${BACK_URL} center/100% 100%}
.tz .tc-f{transform:rotateY(180deg);background:#1b1038}
.tz .tc.rev .tc-f>div{transform:rotate(180deg)}.tz .tc-f>div{position:absolute;inset:0}
.tz .tc-f img,.tz .tz-cr .th img,.tz .tz-zoom .z img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tz .tc.glow .tc-b{box-shadow:0 0 0 2px #ffd76a,0 0 22px 4px rgba(255,215,106,.75)}
.tz .tc.pulse .tc-b{animation:tzPulse 1.8s ease-in-out infinite}
@keyframes tzPulse{50%{box-shadow:0 0 0 2px #ffd76a,0 0 26px 6px rgba(255,215,106,.8)}}
.tz .tc.shine::after{content:"";position:absolute;inset:-3%;border-radius:9%;box-shadow:0 0 30px 8px rgba(255,225,140,.9);animation:tzShine 1.8s ease-out both;pointer-events:none}
@keyframes tzShine{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
.tz .tz-slot{position:absolute;border:1.5px dashed rgba(255,215,106,.5);border-radius:7%;box-sizing:border-box;background:rgba(255,215,106,.05);animation:tzFade .8s both}
.tz .tz-lab{position:absolute;transform:translateX(-50%);font-size:11px;font-weight:900;color:#ffd76a;white-space:nowrap;letter-spacing:.08em;text-shadow:0 1px 3px #000;animation:tzFade .8s both;pointer-events:none}
.tz .tz-spk{position:absolute;left:0;top:0;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:radial-gradient(circle,#fff 0,#ffe6a0 35%,rgba(255,200,90,0) 70%);pointer-events:none;z-index:60}
.tz .tz-fx{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 28%,rgba(70,36,130,.6),rgba(8,4,20,.93) 72%);animation:tzFade .6s both}
.tz .tz-fx.sum{background:linear-gradient(rgba(8,4,20,0) 0,rgba(8,4,20,.15) 38%,rgba(8,4,20,.9) 52%)}
.tz .tz-fx.out{animation:tzOut .5s both}@keyframes tzOut{to{opacity:0}}
.tz .tz-big{z-index:45;cursor:default}
.tz .tz-halo{position:absolute;z-index:44;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(255,230,160,.55),rgba(160,110,255,.18) 45%,transparent 70%);animation:tzHalo 3s ease-in-out infinite}
@keyframes tzHalo{50%{transform:scale(1.08);opacity:.75}}
.tz .tz-np{flex:1;min-height:0;overflow:auto;margin:0 12px calc(10px + env(safe-area-inset-bottom,0px));padding:14px 14px 10px;border-radius:18px;background:rgba(20,10,40,.55);border:1px solid rgba(255,215,106,.4);box-shadow:0 0 30px rgba(140,90,255,.25) inset;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:tzUp .7s both}
.tz .tz-np .pl{font-size:12px;color:#ffd76a;letter-spacing:.18em;font-weight:900}.tz .tz-np .pl em{font:italic 12px Georgia,serif;letter-spacing:.06em;color:#cdbbea;margin-left:6px}
.tz .tz-np .nm{font-size:22px;font-weight:900;margin-top:4px;letter-spacing:.06em}.tz .tz-np .ne{font:italic 15px Georgia,serif;color:#e6d4ff}
.tz .tz-np .or{display:inline-block;font-size:11px;font-weight:900;border-radius:999px;padding:2px 9px;margin-left:6px;vertical-align:3px;background:rgba(255,215,106,.2);color:#ffd76a;border:1px solid rgba(255,215,106,.5)}.tz .tz-np .or.r{background:rgba(255,120,160,.18);color:#ffb3c8;border-color:rgba(255,150,180,.5)}
.tz .tz-np .kw{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 2px}.tz .tz-np .kw button{border:1px solid rgba(255,215,106,.45);border-radius:999px;padding:4px 10px;font:inherit;font-size:12.5px;background:rgba(255,215,106,.08);color:#fff;animation:tzUp .5s both}.tz .tz-np .kw button i{font-style:normal;color:#cdbbea;margin-left:4px}
.tz .tz-np .tx{font-size:15px;line-height:1.9;margin-top:8px;white-space:pre-wrap}.tz .tz-np .tr{font-size:13.5px;color:#cdbbea;line-height:1.75;margin-top:8px;white-space:pre-wrap;animation:tzFade 1s both}
.tz .tz-np .cur::after{content:"✦";color:#ffd76a;margin-left:2px;animation:tzBl .9s steps(1) infinite}@keyframes tzBl{50%{opacity:0}}
.tz .tz-np .go{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}
.tz .tz-np .wait{display:flex;gap:10px;align-items:center;justify-content:center;padding:20px 0;color:#e6d4ff}
.tz .tz-orb{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,#c9a7ff 40%,#5b3f8c 75%);box-shadow:0 0 16px #b48cff;animation:tzOrb 1.6s ease-in-out infinite}@keyframes tzOrb{50%{transform:scale(.8);box-shadow:0 0 28px #ffd76a}}
.tz .tz-cert{border:1.5px solid #d9b24a;border-radius:14px;padding:8px 10px;margin:10px 0 0;background:rgba(255,215,106,.08);text-align:center;font-size:12.5px}
/* くわしく(結果の一覧) */
.tz .tz-read{background:rgba(255,255,255,.96);color:#3b2b55;border-radius:18px;padding:14px;margin:12px 0;line-height:1.75;font-size:15px;animation:tzUp .5s both}
.tz .tz-read h3{margin:0 0 6px;font-size:16px;color:#5b3f8c}.tz .tz-read p{margin:6px 0;white-space:pre-wrap}
.tz .tz-read .pp{font-size:12px;font-weight:900;color:#8d6cc0;margin-top:10px}.tz .tz-read .tr{color:#6b5b80;font-size:13.5px}
.tz .tz-cr{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px dashed #d9cdee}.tz .tz-cr:first-of-type{border-top:0}
.tz .tz-cr .th{flex:0 0 58px;height:77px;position:relative;border-radius:5px;overflow:hidden;box-shadow:0 2px 6px #0003;cursor:pointer}.tz .tz-cr .th.rev>div{transform:rotate(180deg)}.tz .tz-cr .th>div{position:absolute;inset:0}
.tz .tz-cr .pos{font-size:11px;font-weight:900;color:#8d6cc0}.tz .tz-cr b{font-size:15px}.tz .tz-cr .or{font-size:11px;font-weight:900;border-radius:999px;padding:1px 7px;margin-left:4px;background:#efe6ff;color:#5b3f8c}.tz .tz-cr .or.r{background:#ffe3ea;color:#b0466a}
.tz .tz-cr .en{font:italic 12px Georgia,serif;color:#8d7f9e}
.tz .tz-kw{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}.tz .tz-kw button{border:0;border-radius:999px;padding:3px 9px;font:inherit;font-size:12px;background:#f3ecff;color:#4a3a6b}.tz .tz-kw button i{font-style:normal;color:#8d7f9e;margin-left:3px}
.tz .tz-zoom{position:absolute;inset:0;z-index:70;background:rgba(10,5,25,.88);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;animation:tzFade .25s both}
.tz .tz-zoom .z{width:min(70vw,300px);aspect-ratio:3/4;position:relative;border-radius:12px;overflow:hidden;box-shadow:0 0 40px #ffd76a66}.tz .tz-zoom .z.rev>div{transform:rotate(180deg)}.tz .tz-zoom .z>div{position:absolute;inset:0}
.tz .tz-zoom p{margin:0;color:#fff;font-weight:800;text-align:center;padding:0 20px;line-height:1.6}
.tz .tz-hist{display:flex;gap:10px;align-items:center;width:100%;border:0;border-radius:14px;padding:10px 12px;margin:6px 0;background:rgba(255,255,255,.1);color:#fff;font:inherit;text-align:left}
.tz .tz-hist small{display:block;color:#cdbbea;font-size:11px}
`;
// 魔法陣(テーブルの下でゆっくり回る)
const RING = `<svg viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ffd76a">
  <circle r="96" stroke-width=".6"/><circle r="90" stroke-width=".3"/><circle r="62" stroke-width=".5"/><circle r="40" stroke-width=".3" stroke-dasharray="2 3"/>
  <path d="M0-90L78 45H-78z M0 90L-78-45H78z" stroke-width=".45"/>
  ${Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12, r1 = 90, r2 = i % 2 ? 84 : 80; return `<line x1="${(Math.sin(a) * r1).toFixed(1)}" y1="${(-Math.cos(a) * r1).toFixed(1)}" x2="${(Math.sin(a) * r2).toFixed(1)}" y2="${(-Math.cos(a) * r2).toFixed(1)}" stroke-width=".5"/>`; }).join('')}
  ${['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g, i) => { const a = (i + 0.5) * Math.PI / 6; return `<text x="${(Math.sin(a) * 74).toFixed(1)}" y="${(-Math.cos(a) * 74 + 3).toFixed(1)}" font-size="8" fill="#ffd76a" stroke="none" text-anchor="middle">${g}</text>`; }).join('')}
</svg>`;

function faceHTML(c, artBase) {
  return `<div>${faceSVG(c)}${artBase ? `<img src="${esc(artBase + c.id)}.webp" alt="${esc(c.en)}" decoding="async" onerror="this.remove()">` : ''}</div>`;
}

// ---------- 鑑定の言葉(AIなし) ----------
const INTRO = {
  one: ['いまのあなたへのメッセージとして現れたのは'],
  three: ['過去の場所に眠っていたのは', 'いまのあなたを映しているのは', 'この先の未来に待っているのは'],
  celtic: ['いま、あなたの中心にあるのは', 'その中心に、試練として交差しているのは', 'あなたが意識し、めざしているのは', '心の根っこ、無意識の底にあるのは', '少しずつ遠ざかっていく過去は', '近い未来に、やってくるのは', 'あなた自身の姿を映すのは', 'あなたをとりまく環境が示すのは', '心の奥の、願いと恐れは', 'そして、最後に待つ結末は'],
};
function narrBuilt(sp, d, i) {
  const c = CARD[d.id], o = d.rev ? c.rv : c.up;
  let t = `${INTRO[sp][i]}……\n《${c.n}》の${d.rev ? '逆位置' : '正位置'}。\n\nこのカードが語るのは「${o.kw[0][1]}」、そして「${o.kw[1][1]}」。\n${o.m}`;
  if (d.rev) t += '\n逆位置は、その力がまだ内側で眠っているしるし。向きを変えれば、そのまま追い風になるわ。';
  if (sp === 'one') t += `\n\nきょうの合言葉は「${o.kw[0][0]}」——${o.kw[0][1]}よ。`;
  if ((sp === 'three' && i === 2) || (sp === 'celtic' && i === 9)) t += d.rev ? '\n…でも、未来はまだ書きかえられる。カードは「気をつけて」と言っているだけよ。' : '\nこの流れを、信じて進みなさい。';
  return t;
}
function sumBuilt(sp, draws, theme) {
  const C = draws.map(d => ({ ...d, c: CARD[d.id], o: d.rev ? CARD[d.id].rv : CARD[d.id].up })), kw = x => `「${x.o.kw[0][1]}」`;
  const tLine = { all: 'あなたの今とこれから', love: 'あなたの恋のゆくえ', work: '勉強やお仕事のこと', people: 'まわりの人とのこと', money: 'お金とくらしのこと', self: 'あなた自身のこと' }[theme] || 'あなたの今とこれから';
  const out = [`${tLine}について、カードたちの声を聞いたわ。`];
  if (sp === 'one') out.push(`《${C[0].c.n}》は、きょうのあなたにそっと寄りそうカード。${kw(C[0])}を心のすみに置いて、一日をすごしてみて。`);
  else if (sp === 'three') out.push(`過去の${kw(C[0])}から、いまの${kw(C[1])}へ。そして${kw(C[2])}へと向かう流れね。`);
  else out.push(`いまの${kw(C[0])}に、${kw(C[1])}が交差している。でも心の根には${kw(C[3])}があって、最後に待つのは${kw(C[9])}。`);
  if (C.length >= 3) {
    const maj = C.filter(x => x.c.suit === 'major').length, rev = C.filter(x => x.rev).length;
    if (maj / C.length >= 0.5) out.push('大アルカナがたくさん出ているわ。いまは自分の力だけでは動かせない、大きな流れの中にいるの。流れに逆らわず、ここぞという時に動いて。');
    const cnt = {}; C.forEach(x => { if (x.c.suit !== 'major') cnt[x.c.suit] = (cnt[x.c.suit] || 0) + 1; });
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= Math.max(2, Math.ceil(C.length * 0.3))) out.push(`${SUITS[top[0]].n}(${SUITS[top[0]].el})が多いわね。${SUITS[top[0]].theme}。`);
    if (rev / C.length >= 0.5) out.push('逆位置が多いのは、物事がとどこおりやすい時期のしるし。でも逆位置は「内側に向かう力」でもあるの。あせらず、自分の中を整える時よ。');
    else if (rev === 0) out.push('すべて正位置。カードたちが、まっすぐな言葉で話しかけているわ。');
    if (C.filter(x => x.c.court).length >= 2) out.push('人物のカードが何枚も出ているわ。まわりのだれかが、カギをにぎっているかも。');
    if (C.filter(x => x.c.rank === 1).length >= 2) out.push('エースが重なるのは、新しい始まりのしるし。');
  }
  out.push(C[C.length - 1].rev ? '未来は、今日からの選び方でいくらでも変わるわ。' : 'カードは、あなたの味方よ。');
  return out.join('\n');
}
function parseAI(t, n) {   // 「#1 …」「#2 …」「#S …」に分ける。AIの書き方がゆれても読めるように(**#2**、＃2、【2】、行の途中の #2 など)
  t = String(t || '').replace(/\*\*/g, '').replace(/＃/g, '#').replace(/Ｓ/g, 'S').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  const out = {}, re = /(?:^|\s)[\[【(（]?\s*#\s*(\d{1,2}|S)\b\s*[\]】)）]?\s*[:：.、]?\s*/g, idx = []; let m;
  while ((m = re.exec(t))) { const k = m[1].toUpperCase(); if (k === 'S' || (+k >= 1 && +k <= n)) idx.push([k, m.index, re.lastIndex]); }
  const put = (k, body, done) => { body = body.trim().replace(/^[-—–]+\s*/, ''); const [en, ja] = body.split('|||'); out[k] = { body: body.replace(/\s*\|\|\|\s*/, '\n'), en: (en || '').trim(), ja: (ja || '').trim(), done }; };
  if (idx.length) idx.forEach((x, i) => put(x[0], t.slice(x[2], i + 1 < idx.length ? idx[i + 1][1] : t.length), i + 1 < idx.length));
  else {   // 番号がまったく無いとき:空行で分かれた段落を、カードの順に当てはめる(まとめを含めて n+1 段落か、n 段落のときだけ)
    const ps = t.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    if (ps.length === n + 1 || ps.length === n) ps.forEach((p, i) => put(i < n ? String(i + 1) : 'S', p, true));
  }
  return out;
}

// 絵の場所:組みこみ先が town.js を読みこんだ場所の横の tarot/(1つのHTMLで動かすときは、ページの横の tarot/)
const ART_BASE = (() => { try { const s = document.currentScript && document.currentScript.src; return s ? new URL('tarot/', s).href : 'tarot/'; } catch (e) { return 'tarot/'; } })();
const ease = t => 1 - Math.pow(1 - t, 3), easeBack = t => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function mountTarot(box, o) {
  const { ctx, social, ai, getEn } = o;
  if (o.artBase == null || o.artBase === '') o = { ...o, artBase: ART_BASE };
  if (!document.getElementById('tz-css')) { const s = document.createElement('style'); s.id = 'tz-css'; s.textContent = CSS; document.head.appendChild(s); }
  const root = document.createElement('div'); root.className = 'tz'; box.appendChild(root);
  root.innerHTML = '<canvas class="tz-sky"></canvas><div class="tz-pg"></div>';
  const sky = root.querySelector('.tz-sky'), pg = root.querySelector('.tz-pg');
  const st = Object.assign({ wk: '', dk: '', tk: 0, hist: [] }, ctx.storage.get('tarot') || {});
  const save = () => ctx.storage.set('tarot', st);
  const S = { step: 'menu', sp: null, theme: 'all', q: '', deck: [], draws: [], shuffles: 0, narr: [], sum: null, aiRaw: '', aiState: '', aiP: {}, t: 0 };
  const discount = () => social.has('luna', 'discount'), dailyFree = () => social.has('luna', 'tarot');
  const coinPrice = () => discount() ? TAROT_PRICE.coin / 2 : TAROT_PRICE.coin;
  const freeNow = () => dailyFree() ? st.dk !== dayKey() : st.wk !== weekKey();
  const gems = () => (ctx.gems ? ctx.gems.get() : null);
  const enMode = () => !!(getEn && getEn().on);
  const snd = n => { try { ctx.audio && ctx.audio.play && ctx.audio.play(n); } catch (e) { } };
  const toast = t => { const d = document.createElement('div'); d.textContent = t; d.style.cssText = 'position:absolute;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(40,30,60,.94);color:#fff;padding:10px 16px;border-radius:999px;font-weight:800;font-size:14px;z-index:99;pointer-events:none;max-width:86%;text-align:center'; root.appendChild(d); setTimeout(() => d.remove(), 2000); };
  const speak = t => { try { const s = window.speechSynthesis; if (!s) return; s.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = 0.9; s.speak(u); } catch (e) { } };
  const head = (sub) => `<div class="tz-top"><h2>🃏 タロット<small>${esc(sub || 'Tarot Reading')}</small></h2><span class="tz-pill">🪙 ${ctx.wallet.get()}${gems() != null ? ` ・ 💎 ${gems()}` : ''}${st.tk ? ` ・ 🎫 ${st.tk}` : ''}</span></div>`;
  let dead = false, raf = 0, frame = null, last = performance.now(), T = 0;

  // ---------- 星空(背景) ----------
  const stars = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28, s: 0.6 + Math.random() * 1.6, g: Math.random() < 0.18 }));
  const motes = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), v: 0.01 + Math.random() * 0.025, r: 0.8 + Math.random() * 1.8, p: Math.random() * 6.28 }));
  function drawSky(dt) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = root.clientWidth, h = root.clientHeight;
    if (sky.width !== Math.round(w * dpr) || sky.height !== Math.round(h * dpr)) { sky.width = Math.round(w * dpr); sky.height = Math.round(h * dpr); }
    const g = sky.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(T * s.s + s.p)); g.globalAlpha = a; g.fillStyle = s.g ? '#ffe39a' : '#ffffff'; g.beginPath(); g.arc(s.x * w, s.y * h, s.r, 0, 6.283); g.fill(); }
    for (const m of motes) { m.y -= m.v * dt; if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); } const x = (m.x + Math.sin(T * 0.4 + m.p) * 0.02) * w; g.globalAlpha = 0.25 + 0.25 * Math.sin(T * 1.3 + m.p); const gr = g.createRadialGradient(x, m.y * h, 0, x, m.y * h, m.r * 4); gr.addColorStop(0, 'rgba(255,225,150,.9)'); gr.addColorStop(1, 'rgba(255,225,150,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, m.y * h, m.r * 4, 0, 6.283); g.fill(); }
    g.globalAlpha = 1;
  }
  const loop = t => { if (dead) return; const dt = Math.min(0.033, (t - last) / 1000); last = t; T += dt; drawSky(dt); if (frame) frame(dt); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);

  // ---------- カード(儀式用) ----------
  const mk = (stage, id, rev) => {
    const el = document.createElement('div'); el.className = 'tc' + (rev ? ' rev' : '');
    el.innerHTML = `<div class="tc-in"><div class="tc-b"></div><div class="tc-f">${id ? faceHTML(CARD[id], o.artBase) : ''}</div></div>`;
    stage.appendChild(el);
    return { el, x: 0, y: 0, r: 0, s: 1, vx: 0, vy: 0, vr: 0, vs: 0, tx: null, ty: 0, tr: 0, ts: 1, k: 90, o: 1 };
  };
  const put = c => { c.el.style.transform = `translate3d(${(c.x - BW / 2).toFixed(1)}px,${(c.y - BH / 2).toFixed(1)}px,0) rotate(${c.r.toFixed(2)}deg) scale(${c.s.toFixed(3)})`; if (c.o !== c._o) { c._o = c.o; c.el.style.opacity = c.o.toFixed(2); } };
  const spring = (c, dt) => {
    if (c.tx == null) return; const k = c.k, d = 2 * Math.sqrt(k);
    c.vx += ((c.tx - c.x) * k - c.vx * d) * dt; c.vy += ((c.ty - c.y) * k - c.vy * d) * dt; c.vr += ((c.tr - c.r) * k - c.vr * d) * dt; c.vs += ((c.ts - c.s) * k - c.vs * d) * dt;
    c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; c.s += c.vs * dt;
  };
  const z = (c, n) => { c.el.style.zIndex = n; c.z = n; };
  function sparks(parent, x, y, n = 22, spread = 90) {   // 光のつぶがはじける
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div'); s.className = 'tz-spk'; parent.appendChild(s);
      const a = Math.random() * 6.283, d = spread * (0.4 + Math.random() * 0.8), sc = 0.6 + Math.random() * 1.6;
      s.animate([{ transform: `translate(${x}px,${y}px) scale(${sc})`, opacity: 1 }, { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d - 20}px) scale(0)`, opacity: 0 }], { duration: 700 + Math.random() * 700, easing: 'cubic-bezier(.1,.8,.3,1)' }).onfinish = () => s.remove();
    }
  }

  // ---------- 支払い ----------
  function pay() {
    const sp = SPREADS[S.sp];
    if (sp.tier === 'deep') {
      if (st.tk > 0) { st.tk--; save(); return 'ticket'; }
      if (!ctx.gems) { toast('ダイヤは チャンクタウンで使えます'); return null; }
      if (!ctx.gems.spend(TAROT_PRICE.gem, 'tarot')) { toast(`ダイヤが ${TAROT_PRICE.gem}こ いるわ`); return null; }
      return 'gem';
    }
    if (freeNow()) { if (dailyFree()) st.dk = dayKey(); else st.wk = weekKey(); save(); return 'free'; }
    const p = coinPrice(); if (ctx.wallet.get() < p) { toast(`コインが ${p}まい いるわ`); return null; }
    ctx.wallet.add(-p, 'tarot'); return 'coin';
  }
  function buyPack() {
    if (!ctx.gems) return toast('ダイヤは チャンクタウンで使えます');
    if (!ctx.gems.spend(TAROT_PRICE.pack.gem, 'tarot-pack')) return toast(`ダイヤが ${TAROT_PRICE.pack.gem}こ いるわ`);
    st.tk += TAROT_PRICE.pack.n; save(); toast(`🎫 ケルト十字の券を ${TAROT_PRICE.pack.n}まい 受け取ったわ`); page();
  }
  function startDeck() {
    const ids = CARDS.map(c => c.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = rnd(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    S.deck = ids.map(id => ({ id, rev: rnd(1000) < REV_RATE * 1000 }));
  }

  // ---------- ふつうの画面(メニュー・テーマ・記録・くわしく) ----------
  const D = i => ` style="animation-delay:${(i * 0.07).toFixed(2)}s"`;
  function page() {
    frame = null; pg.className = 'tz-pg';
    pg.innerHTML = { menu, theme, hist, detail }[S.step](); pg.scrollTop = 0;
  }
  function menu() {
    const free = freeNow(), cp = coinPrice();
    const easyPr = free ? `無料<small>${dailyFree() ? 'きょうの1回' : '今週の1回'}</small>` : `🪙 ${cp}${discount() ? '<small>仲良し割</small>' : ''}`;
    const deepPr = st.tk ? `🎫 1まい<small>のこり ${st.tk}</small>` : `💎 ${TAROT_PRICE.gem}`;
    const mini = n => `<span class="mini">${'<i></i>'.repeat(n)}</span>`;
    return head() + `<div class="tz-say tz-in">🔮 ルナ「${esc(o.lunaLine || 'カードは、あなたの心をうつす鏡。…なにを たずねたいの?')}」</div>
      ${Object.entries(SPREADS).map(([id, sp], i) => `<button class="tz-sp ${sp.tier} tz-in"${D(i + 1)} data-sp="${id}">${mini(Math.min(sp.pos.length, 5))}<span><b>${sp.n}<em>${sp.en}</em></b><small>${sp.d}</small>${sp.tier === 'deep' ? '<small>✨ ルナのくわしい鑑定・鑑定書つき</small>' : ''}</span><span class="pr">${sp.tier === 'deep' ? deepPr : easyPr}</span></button>`).join('')}
      <div class="tz-sub tz-in"${D(4)}>${ctx.gems ? `<button class="tz-btn sub" data-a="pack">🎫 ケルト十字 ${TAROT_PRICE.pack.n}回券(💎${TAROT_PRICE.pack.gem})</button>` : ''}<button class="tz-btn sub" data-a="hist">📜 鑑定の記録${st.hist.length ? `(${st.hist.length})` : ''}</button></div>
      <p class="tz-nt tz-in"${D(5)}>かんたん占いは${dailyFree() ? '<b>毎日1回</b>' : '<b>週に1回</b>'}無料。${dailyFree() ? '' : 'ルナともっと仲良くなると、毎日1回無料になるかも…。'}<br>${ai && ai.ready ? 'AIがつながっているので、ルナがあなたのためだけに鑑定します。' : 'AIをつなぐと、ルナが質問に合わせて鑑定してくれます(設定 → AIとおしゃべり)。'}<br>カードの英語の名前とキーワードは、あしたのふりかえりにも出ます。</p>
      <button class="tz-back tz-in"${D(6)} data-a="exit">← 館のメニューへ</button>`;
  }
  function theme() {
    const sp = SPREADS[S.sp];
    return head(sp.en) + `<div class="tz-say tz-in">🔮 ルナ「${sp.n}ね。…なにについて、たずねる?」</div>
      <div class="tz-chips tz-in"${D(1)}>${THEMES.map(([id, ic, n]) => `<button data-th="${id}" class="${S.theme === id ? 'on' : ''}">${ic} ${n}</button>`).join('')}</div>
      <input class="tz-q tz-in"${D(2)} maxlength="80" placeholder="たずねたいこと(書かなくてもOK)" value="${esc(S.q)}">
      <p class="tz-nt tz-in"${D(3)}>質問を心の中で思いうかべながら、カードを混ぜてね。${ai && ai.ready ? '書いた質問は、ルナの鑑定に使われます。' : ''}</p>
      <div class="tz-c tz-in"${D(4)} style="margin-top:14px"><button class="tz-btn" data-a="go">✦ 儀式を始める(${sp.tier === 'deep' ? (st.tk ? '🎫1まい' : '💎' + TAROT_PRICE.gem) : freeNow() ? '無料' : '🪙' + coinPrice()})</button></div>
      <button class="tz-back tz-in"${D(5)} data-a="menu">← もどる</button>`;
  }
  function hist() {
    return head('Records') + `<div class="tz-say tz-in">🔮 ルナ「これまでの鑑定よ。カードは、あとから見返すと意味がわかることも多いの」</div>
      ${st.hist.length ? st.hist.slice().reverse().map((h, i) => { const sp = SPREADS[h.sp]; return `<button class="tz-hist tz-in"${D(Math.min(i + 1, 8))} data-h="${st.hist.length - 1 - i}"><span style="font-size:24px">${sp.tier === 'deep' ? '📜' : '🃏'}</span><span><b>${esc(sp.n)}</b> ・ ${esc((THEMES.find(t => t[0] === h.th) || THEMES[0])[2])}<small>${new Date(h.t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ・ ${h.d.map(d => CARD[d[0]].n + (d[1] ? '(逆)' : '')).slice(0, 3).join('、')}${h.d.length > 3 ? '…' : ''}</small></span></button>`; }).join('') : '<p class="tz-nt">まだ記録はないわ。</p>'}
      <button class="tz-back" data-a="menu">← もどる</button>`;
  }
  function detail() {
    const sp = SPREADS[S.sp];
    const narr = S.draws.map((d, i) => { const n = S.narr[i]; return n ? `<div class="pp">${S.sp === 'celtic' ? i + 1 + '. ' : ''}${esc(sp.pos[i][0])} ・ ${esc(CARD[d.id].n)}${d.rev ? '(逆)' : ''}</div><p>${esc(n.text)}</p>${n.tr ? `<p class="tr">${esc(n.tr)}</p>` : ''}` : ''; }).join('');
    const sum = S.sum ? `<div class="pp">✦ まとめ</div><p>${esc(S.sum.text)}</p>${S.sum.tr ? `<p class="tr">${esc(S.sum.tr)}</p>` : ''}` : '';
    const rows = S.draws.map((d, i) => {
      const c = CARD[d.id], or = d.rev ? c.rv : c.up;
      return `<div class="tz-cr"><div class="th${d.rev ? ' rev' : ''}" data-zm="${i}">${faceHTML(c, o.artBase)}</div><div style="flex:1;min-width:0">
        <div class="pos">${S.sp === 'celtic' ? i + 1 + '. ' : ''}${esc(sp.pos[i][0])} <span style="font-weight:400;font-family:Georgia,serif;font-style:italic">${esc(sp.pos[i][1])}</span></div>
        <b>${esc(c.n)}</b><span class="or${d.rev ? ' r' : ''}">${d.rev ? '逆位置' : '正位置'}</span><div class="en">${esc(c.en)}${d.rev ? ' (Reversed)' : ''}</div>
        <div class="tz-kw">${or.kw.map(([en, ja]) => `<button data-say="${esc(en)}">🔊 ${esc(en)}<i>${esc(ja)}</i></button>`).join('')}</div><div>${esc(or.m)}</div></div></div>`;
    }).join('');
    const cert = sp.tier === 'deep' ? `<div class="tz-cert">📜 <b>鑑定書</b> ・ ${new Date(S.t || Date.now()).toLocaleDateString('ja-JP')} ・ 占い師ルナ</div>` : '';
    return head(sp.en) + cert + `<div class="tz-read"><h3>🔮 ルナの鑑定</h3>${S.q ? `<p style="font-size:13px;color:#8d7f9e">「${esc(S.q)}」</p>` : ''}${narr || `<p>${esc(sumBuilt(S.sp, S.draws, S.theme))}</p>`}${sum}</div>
      <div class="tz-read"${D(1)}><h3>🃏 カードの意味</h3>${rows}</div>
      <div class="tz-c tz-sub" style="justify-content:center"><button class="tz-btn" data-a="again">もう一度 占う</button><button class="tz-btn sub" data-a="menu">メニューへ</button></div>`;
  }

  // ---------- 儀式の画面(混ぜる → 切る → えらぶ → 読む) ----------
  let R = null;   // { stage, W, H, cards, ... }
  function ritual() {
    pg.className = 'tz-pg rit';
    pg.innerHTML = head(SPREADS[S.sp].en) + `<div class="tz-lu"></div><div class="tz-stage"><div class="tz-ring">${RING}</div></div><div class="tz-ctl"></div>`;
    const stage = pg.querySelector('.tz-stage');
    R = { stage, W: stage.clientWidth, H: stage.clientHeight, cards: [], ptr: { down: false, x: 0, y: 0, vx: 0, vy: 0, t: 0 }, lastSpk: 0 };
    stage.addEventListener('pointerdown', e => R.onDown && R.onDown(e));
    stage.addEventListener('pointermove', e => R.onMove && R.onMove(e));
    const up = e => R && R.onUp && R.onUp(e); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    shuffleStage();
  }
  const luna = t => { const el = pg.querySelector('.tz-lu'); if (!el) return; el.classList.remove('on'); void el.offsetWidth; el.innerHTML = t; el.classList.add('on'); };
  const ctl = h => { const el = pg.querySelector('.tz-ctl'); if (el) el.innerHTML = h; };
  const local = e => { const r = R.stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const ring = on => { const r = pg.querySelector('.tz-ring'); r && r.classList.toggle('hot', !!on); };

  // ---- 1. 混ぜる ----
  function shuffleStage() {
    const { stage, W, H } = R, N = 26, cx = W / 2, cy = H / 2, sc = Math.min(84, W * 0.21) / BW;
    R.sc = sc; R.mode = 'idle'; R.energy = 0; R.busy = true;
    for (let i = 0; i < N; i++) { const c = mk(stage); c.x = cx + (Math.random() - 0.5) * 30; c.y = -BH; c.r = (Math.random() - 0.5) * 60; c.s = sc; c.ts = sc; c.tx = cx + i * 0.25; c.ty = cy - i * 0.6; c.tr = 0; c.k = 70; c.wait = 0.2 + i * 0.035; z(c, i); R.cards.push(c); }
    luna('目をとじて、たずねたいことを心にうかべて…<br>カードに、あなたの気配をうつしましょう');
    ctl(''); setTimeout(() => { if (R && R.mode === 'idle') { R.busy = false; mixButtons(); } }, 1400);
    R.script = null;
    frame = dt => {
      if (R.script) R.script(dt);
      if (R.mode === 'wash') wash(dt);
      else for (const c of R.cards) { if (c.wait > 0) { c.wait -= dt; continue; } spring(c, dt); }
      for (const c of R.cards) put(c);
    };
    R.onDown = e => {
      if (R.mode === 'cut') return cutTap(e);
      if (R.busy || (R.mode !== 'idle' && R.mode !== 'wash')) return;
      R.stage.setPointerCapture && R.stage.setPointerCapture(e.pointerId);
      const [x, y] = local(e); Object.assign(R.ptr, { down: true, x, y, vx: 0, vy: 0, t: performance.now() });
      if (R.mode === 'idle') washStart(false);
    };
    R.onMove = e => {
      if (!R.ptr.down) return; const [x, y] = local(e), now = performance.now(), dt = Math.max(8, now - R.ptr.t) / 1000;
      R.ptr.vx = R.ptr.vx * 0.5 + ((x - R.ptr.x) / dt) * 0.5; R.ptr.vy = R.ptr.vy * 0.5 + ((y - R.ptr.y) / dt) * 0.5; R.ptr.x = x; R.ptr.y = y; R.ptr.t = now;
      if (now - R.lastSpk > 45) { R.lastSpk = now; sparks(R.stage, x, y, 2, 26); }
    };
    R.onUp = () => { R.ptr.down = false; R.ptr.vx = R.ptr.vy = 0; };
  }
  function mixButtons() {
    const ok = S.shuffles > 0;
    ctl(`<button class="tz-btn sub" data-a="automix">✦ おまかせで混ぜる</button>${ok ? '<button class="tz-btn" data-a="mixok">これでいい</button>' : ''}<div class="tz-hint">テーブルを指でぐるぐるなぞると、自分の手で混ぜられます</div>`);
  }
  function washStart(burst) {
    R.mode = 'wash'; ring(true);
    for (const c of R.cards) { c.tx = null; c.wait = 0; const a = Math.random() * 6.283, p = burst ? 1 : 0.6; c.vx += Math.cos(a) * (120 + Math.random() * 220) * p; c.vy += Math.sin(a) * (90 + Math.random() * 170) * p; c.vr += (Math.random() - 0.5) * 500 * p; }
    luna('両手でテーブルをなでるように…<br>ぐるぐると、<i>心ゆくまで</i>混ぜて');
    ctl('<button class="tz-btn" data-a="gather">まとめる</button><div class="tz-hint">もっと混ぜたいときは、そのまま なぞり続けて</div>');
  }
  function wash(dt) {   // 手で混ぜる:指のまわりのカードが、指の動きについてきて回る。テーブルの外へは出ない。重なりすぎない
    const { W, H, ptr } = R, sc = R.sc, cw = BW * sc, hw = cw / 2, hh = BH * sc / 2, Rr = Math.max(W, H) * 0.32, cx = W / 2, cy = H / 2;
    if (ptr.down) R.energy += Math.hypot(ptr.vx, ptr.vy) * dt;
    const cs = R.cards;
    for (let a = 0; a < cs.length; a++) for (let b = a + 1; b < cs.length; b++) {   // ゆるく離れる
      const p = cs[a], q = cs[b], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) + 0.01, m = cw * 0.55;
      if (d < m) { const f = (m - d) * 7 * dt / d; p.vx -= dx * f * 40; p.vy -= dy * f * 40; q.vx += dx * f * 40; q.vy += dy * f * 40; }
    }
    for (const c of cs) {
      if (ptr.down) {
        const dx = c.x - ptr.x, dy = c.y - ptr.y, d = Math.hypot(dx, dy);
        if (d < Rr) {
          const f = Math.pow(1 - d / Rr, 1.4);
          c.vx += (ptr.vx * 0.85 - c.vx) * f * dt * 6; c.vy += (ptr.vy * 0.85 - c.vy) * f * dt * 6;
          c.vr += -((ptr.vx * dy - ptr.vy * dx) / Rr) * f * dt * 4;   // 指のまわりで、くるりと回る
          if (Math.hypot(ptr.vx, ptr.vy) > 250 && f > 0.35 && Math.random() < dt * 5) z(c, (R.zTop = (R.zTop || 100) + 1));   // 速く動いたカードが上に重なる
        }
      }
      const ex = (c.x - cx) / (W * 0.4), ey = (c.y - cy) / (H * 0.4), e2 = ex * ex + ey * ey;
      if (e2 > 1) { c.vx -= ex * (e2 - 1) * 900 * dt; c.vy -= ey * (e2 - 1) * 900 * dt; }   // テーブルのふちで、やわらかく押しもどす
      const fr = Math.exp(-dt * 2.6); c.vx *= fr; c.vy *= fr; c.vr *= Math.exp(-dt * 2.2);
      const vm = Math.hypot(c.vx, c.vy); if (vm > 800) { c.vx *= 800 / vm; c.vy *= 800 / vm; }
      if (Math.abs(c.vr) > 720) c.vr = Math.sign(c.vr) * 720;
      c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt;
      c.x = clamp(c.x, hw * 0.6, W - hw * 0.6); c.y = clamp(c.y, hh * 0.6, H - hh * 0.6);
    }
  }
  function gather() {   // 散らばったカードを、ひとつの山にまとめる
    if (R.mode !== 'wash') return; R.mode = 'gather'; R.busy = true; ring(false); ctl('');
    const { W, H } = R, cx = W / 2, cy = H / 2, ord = [...R.cards].sort((a, b) => (a.z || 0) - (b.z || 0)); let t = 0;
    luna('…ひとつに、まとめましょう');
    R.script = dt => {
      t += dt;
      ord.forEach((c, i) => { if (t > i * 0.03 && c.tx == null) { c.k = 120; c.tx = cx + (i % 2 ? 1 : -1) * 0.5; c.ty = cy - i * 0.6; c.tr = (Math.random() - 0.5) * 6; c.ts = R.sc; z(c, i); if (i % 5 === 0) snd('tap'); } });
      if (t > ord.length * 0.03 + 0.5) { ord.forEach(c => { c.tr = 0; c.k = 200; }); }
      if (t > ord.length * 0.03 + 0.8) { R.script = null; mixed(); }
    };
    for (const c of R.cards) { c.vr = 0; }
  }
  function autoMix() {   // おまかせ:広げる → うず → 2つの山 → リフル → そろえる
    if (R.busy) return; R.busy = true; R.mode = 'auto'; ring(true); ctl('');
    luna('星の流れに、カードをゆだねて……');
    const { W, H } = R, cx = W / 2, cy = H / 2, R0 = Math.min(W, H), sc = R.sc, hw = BW * sc / 2, hh = BH * sc / 2;
    const P = R.cards.map(() => ({ rad: R0 * (0.12 + Math.random() * 0.28), a: Math.random() * 6.283, w: 2.2 + Math.random() * 1.2, sx: hw + Math.random() * (W - hw * 2), sy: hh + Math.random() * (H - hh * 2), sr: (Math.random() - 0.5) * 300 }));
    let t = 0, landed = 0;
    snd('wave');
    R.script = dt => {
      t += dt;
      R.cards.forEach((c, i) => {
        const p = P[i], L = i % 2 === 0, j = Math.floor(i / 2);
        if (t < 0.6) { c.k = 60; c.tx = p.sx; c.ty = p.sy; c.tr = p.sr; c.wait = 0; }
        else if (t < 2.6) { const u = t - 0.6, a = p.a + u * p.w, rr = p.rad * (1 + 0.18 * Math.sin(u * 3 + i)); c.k = 45; c.tx = cx + Math.cos(a) * rr * 1.2; c.ty = cy + Math.sin(a) * rr * 0.8; c.tr = a * 57.3 + 90; }
        else if (t < 3.2) { if (!c.nr) { c.nr = 1; c.r = ((c.r % 360) + 540) % 360 - 180; c.vr = 0; } c.k = 110; c.tx = cx + (L ? -1 : 1) * W * 0.22; c.ty = cy - j * 0.7; c.tr = c.tr % 360; c.tr = L ? -8 : 8; z(c, j); }
        else if (t < 4.4) { const ord = j * 2 + (L ? 0 : 1); if (t - 3.2 > ord * 0.04) { if (!c.ld) { c.ld = 1; landed++; if (landed % 4 === 0) snd('tap'); } c.k = 170; c.tx = cx + (L ? -3 : 3); c.ty = cy - ord * 0.5; c.tr = L ? -3 : 3; z(c, 100 + ord); } }
        else { c.k = 220; c.tx = cx; c.ty = cy - ((c.z || 100) - 100) * 0.5; c.tr = 0; }
      });
      if (t > 4.4 && !R.tapped) { R.tapped = 1; sparks(R.stage, cx, cy, 14, 70); }
      if (t > 4.8) { R.script = null; R.tapped = 0; R.cards.forEach(c => { c.ld = 0; c.nr = 0; }); ring(false); mixed(); }
    };
  }
  function mixed() {
    startDeck(); S.shuffles++; R.mode = 'idle'; R.busy = false;
    luna(S.shuffles === 1 ? 'いい混ざり具合ね……<br>もういいと思ったら「これでいい」を' : 'カードが、あなたの気配をおぼえたわ');
    mixButtons();
  }

  // ---- 2. 切る(3つの山) ----
  function toCut() {
    R.mode = 'cutting'; R.busy = true; ctl('');
    luna('山を3つに分けるわ……<br><i>直感で</i>、ひとつ選んで');
    const { W, H } = R, cy = H / 2, px = [W * 0.2, W * 0.5, W * 0.8], ord = [...R.cards].sort((a, b) => (b.z || 0) - (a.z || 0)), per = Math.ceil(ord.length / 3); let t = 0;
    R.piles = [[], [], []];
    ord.forEach((c, i) => { const p = Math.floor(i / per); R.piles[p].push(c); c.pile = p; });
    R.script = dt => {
      t += dt;
      ord.forEach((c, i) => { const p = c.pile, j = per - 1 - (i % per); if (t > p * 0.32 + (i % per) * 0.025 && !c.cm) { c.cm = 1; c.k = 110; c.tx = px[p]; c.ty = cy - j * 0.7; c.tr = (p - 1) * 5; z(c, p * 40 + j); } });
      if (t > 1.5) { R.script = null; R.mode = 'cut'; R.busy = false; R.piles.forEach(pl => { const top = pl.reduce((a, b) => ((a.z || 0) > (b.z || 0) ? a : b)); top.el.classList.add('pulse'); }); }
    };
  }
  function cutTap(e) {
    const [x, y] = local(e), { W } = R, px = [W * 0.2, W * 0.5, W * 0.8], w = BW * R.sc, h = BH * R.sc;
    const k = px.findIndex(p => Math.abs(x - p) < w * 0.75 && Math.abs(y - R.H / 2) < h * 0.8); if (k < 0) return;
    R.mode = 'cutdone'; R.busy = true; snd('tap');
    R.cards.forEach(c => c.el.classList.remove('pulse'));
    // えらんだ山を いちばん上に
    const n = Math.floor(S.deck.length / 3), parts = [S.deck.slice(0, n), S.deck.slice(n, n * 2), S.deck.slice(n * 2)];
    S.deck = [parts[k], ...parts.filter((_, i) => i !== k)].flat();
    const sel = R.piles[k], cx = R.W / 2, cy = R.H / 2; let t = 0;
    sel.forEach(c => { c.ty -= 34; c.ts = R.sc * 1.08; c.el.classList.add('glow'); });
    sparks(R.stage, px[k], cy - 30, 16, 60);
    luna('……それが、あなたの選んだ山');
    R.script = dt => {
      t += dt;
      if (t > 0.6 && !R.c1) { R.c1 = 1; R.piles.forEach((pl, i) => { if (i === k) return; pl.forEach(c => { c.k = 90; c.tx = cx; c.ty = cy - (c.z % 40) * 0.6; c.tr = 0; z(c, (i < k ? i : i) * 40 + (c.z % 40)); }); }); }
      if (t > 1.2 && !R.c2) { R.c2 = 1; sel.forEach(c => { c.k = 110; c.tx = cx; c.ty = cy - 30 - (c.z % 40) * 0.6; c.tr = 0; z(c, 200 + (c.z % 40)); }); }
      if (t > 1.6 && !R.c3) { R.c3 = 1; sel.forEach(c => { c.ty += 30; c.ts = R.sc; c.el.classList.remove('glow'); }); snd('tap'); }
      if (t > 2.1) { R.script = null; R.c1 = R.c2 = R.c3 = 0; toPick(); }
    };
  }

  // ---- 3. えらぶ(78枚の円環) ----
  function toPick() {
    const { stage, W, H } = R, n = SPREADS[S.sp].pos.length;
    // 受け皿(下)
    const sw = n > 3 ? Math.min(40, (W - 40) / 5.8) : Math.min(62, W * 0.17), sh = sw * 4 / 3, rows = n > 5 ? 2 : 1;
    const trayH = rows * (sh + 8) + (n <= 3 ? 20 : 6) + 6, trayTop = H - trayH;
    R.slots = Array.from({ length: n }, (_, i) => { const row = rows === 2 ? Math.floor(i / 5) : 0, col = rows === 2 ? i % 5 : i, cols = rows === 2 ? 5 : n, gap = sw * 1.25; return { x: W / 2 + (col - (cols - 1) / 2) * gap, y: trayTop + 6 + sh / 2 + row * (sh + 8) }; });
    R.slots.forEach((s, i) => { const d = document.createElement('div'); d.className = 'tz-slot'; d.style.cssText = `left:${s.x - sw / 2}px;top:${s.y - sh / 2}px;width:${sw}px;height:${sh}px;animation-delay:${0.8 + i * 0.08}s`; stage.appendChild(d);
      if (n <= 3) { const l = document.createElement('div'); l.className = 'tz-lab'; l.style.cssText = `left:${s.x}px;top:${s.y + sh / 2 + 2}px;animation-delay:${0.9 + i * 0.08}s`; l.textContent = SPREADS[S.sp].pos[i][0].replace('今のあなたへのメッセージ', 'メッセージ'); stage.appendChild(l); } });
    R.slotSc = sw / BW;
    // 円環
    const cw = clamp(W / 6.6, 46, 68), csc = cw / BW, ch = cw * 4 / 3, Rr = clamp(Math.min(W * 0.64, (trayTop - ch) * 0.95), cw * 3.6, 320), top = ch * 0.6 + 6, cy0 = top + Rr, cx = W / 2, Hw = trayTop - 4;
    const dA = 6.2832 / 78, from = { x: W / 2, y: H / 2 };
    // 混ぜたカードの山は、そのまま78枚の円環の中に消える
    R.cards.forEach(c => c.el.remove());
    const wheel = S.deck.map((d, i) => { const c = mk(stage); c.x = from.x; c.y = from.y - i * 0.2; c.s = R.sc; c.i = i; c.e = 0; c.lift = 0; c.lt = 0; c.o = 1; z(c, 10 + i); return c; });
    R.cards = wheel; R.picked = []; R.phi = -Math.PI * 0.12; R.om = 0.0; R.mode = 'pick'; R.busy = true;
    luna(`カードを広げたわ……<br>心がひかれるものを <i>${n}枚</i>、えらんで`);
    ctl(`<div class="tz-hint">左右になぞると、カードの輪がまわります ・ <b style="color:#ffd76a" class="tz-cnt">0 / ${n}</b></div>`);
    let t = 0;
    const ang = c => { let a = R.phi + c.i * dA; a = ((a + Math.PI) % 6.2832 + 6.2832) % 6.2832 - Math.PI; return a; };
    frame = dt => {
      t += dt;
      if (!R.ptr.down) { R.phi += (R.om + 0.035) * dt; R.om *= Math.exp(-dt * 2.2); }
      for (const c of R.cards) {
        if (c.pk) { spring(c, dt); put(c); continue; }
        const a = ang(c), br = Math.sin(T * 1.6 + c.i * 0.5) * 1.6;
        c.lift += (c.lt - c.lift) * Math.min(1, dt * 14);
        const rr = Rr + c.lift + br, wx = cx + Math.sin(a) * rr, wy = cy0 - Math.cos(a) * rr;
        const delay = 0.15 + Math.abs(a) * 0.55; c.e = clamp((t - delay) / 0.7, 0, 1);
        const e = easeBack(c.e);
        c.x = from.x + (wx - from.x) * e; c.y = from.y + (wy - from.y) * e; c.r = a * 57.3 * e; c.s = R.sc + (csc - R.sc) * Math.min(1, e);
        const vis = Math.abs(a) < 1.75 && wy < Hw - ch * 0.15;
        c.o = vis ? clamp((Hw - ch * 0.1 - wy) / (ch * 0.7), 0, 1) : 0;
        c.el.style.visibility = c.o > 0.01 ? 'visible' : 'hidden';
        z(c, 10 + Math.round(200 - Math.abs(a) * 100));
        put(c);
      }
      if (t > 1.4 && R.busy && R.picked.length < SPREADS[S.sp].pos.length) R.busy = false;
    };
    R.onDown = e => {
      if (R.mode !== 'pick' || R.busy) return;
      R.stage.setPointerCapture && R.stage.setPointerCapture(e.pointerId);
      const [x, y] = local(e), tc = e.target.closest('.tc'), c = tc && R.cards.find(q => q.el === tc && !q.pk);
      Object.assign(R.ptr, { down: true, x, y, x0: x, y0: y, vx: 0, t: performance.now(), card: c || null, moved: 0 });
      if (c) c.lt = 16;
    };
    R.onMove = e => {
      if (!R.ptr.down || R.mode !== 'pick') return; const [x, y] = local(e), now = performance.now(), dt = Math.max(8, now - R.ptr.t) / 1000, dx = x - R.ptr.x;
      R.ptr.moved += Math.abs(dx) + Math.abs(y - R.ptr.y); R.phi += dx / Rr * 1.15; R.om = R.om * 0.5 + (dx / Rr * 1.15 / dt) * 0.5; R.ptr.x = x; R.ptr.y = y; R.ptr.t = now;
      if (R.ptr.card && R.ptr.moved > 10) { R.ptr.card.lt = 0; R.ptr.card = null; }
    };
    R.onUp = () => {
      if (!R.ptr.down) return; R.ptr.down = false; const c = R.ptr.card; R.ptr.card = null;
      if (c && R.ptr.moved < 10) pickCard(c); else if (c) c.lt = 0;
    };
  }
  function pickCard(c) {
    const n = SPREADS[S.sp].pos.length; if (R.picked.length >= n) return;
    c.pk = 1; c.lt = 0; const k = R.picked.length; R.picked.push(c); snd('tap');
    const dk = S.deck[c.i]; c.el.querySelector('.tc-f').innerHTML = faceHTML(CARD[dk.id], o.artBase); if (dk.rev) c.el.classList.add('rev');
    c.el.classList.add('glow'); z(c, 600 + k); c.o = 1; c.el.style.visibility = 'visible';
    const s = R.slots[k], a = Math.atan2(c.x - R.W / 2, -(c.y - (R.H)));
    c.vx = Math.sin(a) * 260; c.vy = -260; c.k = 60; c.tx = s.x; c.ty = s.y; c.tr = 0; c.ts = R.slotSc; c.vs = 0.6;
    sparks(R.stage, c.x, c.y, 12, 50);
    setTimeout(() => { c.el.classList.remove('glow'); c.k = 120; sparks(R.stage, s.x, s.y, 8, 30); }, 650);
    const cnt = pg.querySelector('.tz-cnt'); if (cnt) cnt.textContent = `${R.picked.length} / ${n}`;
    if (R.picked.length >= n) {
      R.busy = true; luna('……そろったわね');
      S.draws = R.picked.map(q => S.deck[q.i]);
      S.draws.forEach(d => { const im = new Image(); im.src = o.artBase + d.id + '.webp'; });
      setTimeout(startExit, 700);
    }
  }
  function startExit() {   // 円環が静かに閉じる
    // 円環のカードを、中心へ吸いこむ
    R.cards.forEach(c => { if (!c.pk) c.el.animate([{ opacity: c.o }, { opacity: 0 }], { duration: 600, delay: 100 + Math.random() * 300, fill: 'forwards' }); });
    setTimeout(() => { R.cards.filter(c => !c.pk).forEach(c => c.el.remove()); R.cards = R.picked.slice(); R.stage.querySelectorAll('.tz-slot,.tz-lab').forEach(x => x.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' })); finishPick(); }, 1100);
  }
  function finishPick() {
    // 記録・ふりかえり
    S.draws.forEach(d => { const c = CARD[d.id], k = (d.rev ? c.rv : c.up).kw[0]; o.logWord && o.logWord(k[0], k[1], 'word'); });
    S.t = Date.now(); S.narr = []; S.sum = null;
    st.hist.push({ t: S.t, sp: S.sp, th: S.theme, q: S.q, d: S.draws.map(d => [d.id, d.rev ? 1 : 0]) }); while (st.hist.length > 40) st.hist.shift(); save();
    o.onRead && o.onRead(S.sp);
    aiStart();
    toLay();
  }

  // ---- 4. 並べる → 1枚ずつ読む ----
  function spreadPos(W, H) {
    const sp = S.sp;
    if (sp === 'one') { const w = Math.min(150, W * 0.42, H * 0.78 * 0.75); return { w, P: [[W / 2, H / 2 - 8, 0]] }; }
    if (sp === 'three') { const w = Math.min(118, W / 3.5, H * 0.74 * 0.75), g = w * 1.16; return { w, P: [-1, 0, 1].map(i => [W / 2 + i * g, H / 2 - 8, 0]) }; }
    const h = Math.min(H / 4.35, (W / 6.15) * 4 / 3), w = h * 0.75, off = (W - w * 6.1) / 2, cx = off + w * 2.3, sx = off + w * 5.5, cy = H / 2;
    return { w, P: [[cx, cy, 0], [cx, cy, 90], [cx, cy - h * 1.08, 0], [cx, cy + h * 1.08, 0], [cx - w * 1.45, cy, 0], [cx + w * 1.45, cy, 0], [sx, cy + h * 1.62, 0], [sx, cy + h * 0.54, 0], [sx, cy - h * 0.54, 0], [sx, cy - h * 1.62, 0]] };
  }
  function toLay() {
    const { W, H } = R, L = spreadPos(W, H), sc = L.w / BW;
    luna('カードを、あるべき場所へ……');
    ctl('');
    R.mode = 'lay'; R.lay = L;
    R.cards.forEach((c, i) => { setTimeout(() => { c.k = 70; c.tx = L.P[i][0]; c.ty = L.P[i][1]; c.tr = L.P[i][2]; c.ts = sc; z(c, i === 1 && S.sp === 'celtic' ? 50 : 10 + i); snd('tap'); }, 200 + i * 230); });
    if (S.sp !== 'celtic') setTimeout(() => L.P.forEach((p, i) => { const l = document.createElement('div'); l.className = 'tz-lab'; l.style.cssText = `left:${p[0]}px;top:${p[1] + L.w * 2 / 3 + 6}px;animation-delay:${i * 0.15}s`; l.textContent = SPREADS[S.sp].pos[i][0].replace('今のあなたへのメッセージ', 'あなたへのメッセージ'); R.stage.appendChild(l); }), 400);
    frame = dt => { for (const c of R.cards) { spring(c, dt); put(c); } };
    setTimeout(() => { luna(S.sp === 'one' ? 'では……カードの声を聞きましょう' : 'では……1枚ずつ、読んでいくわね'); ctl('<button class="tz-btn" data-a="read">✦ カードを開く</button>'); R.cards.forEach(c => c.el.classList.add('pulse')); }, 600 + R.cards.length * 230);
  }

  // 1枚を大きく呼び出して、めくり、語る
  let readI = 0;
  async function readAll() {
    ctl(''); R.cards.forEach(c => c.el.classList.remove('pulse'));
    for (readI = 0; readI < S.draws.length; readI++) { if (dead || !R) return; await focusCard(readI); }
    await summary();
  }
  function rectOf(c) { const sr = R.stage.getBoundingClientRect(), rr = root.getBoundingClientRect(); return { x: sr.left - rr.left + c.x, y: sr.top - rr.top + c.y }; }
  function narrFor(i) {
    const a = S.aiP[String(i + 1)], en = enMode();
    if (a && (a.done || S.aiState === 'done') && a.body.length > 12 && a.body.length < (en ? 1100 : 600)) return en && a.ja ? { text: a.en, tr: a.ja, ai: 1 } : { text: a.body.replace(/\|\|\|[\s\S]*$/, '').trim(), tr: '', ai: 1 };
    return { text: narrBuilt(S.sp, S.draws[i], i), tr: '' };
  }
  function typeOut(el, text, speed = 26) {   // 1文字ずつ。タップで最後まで
    let i = 0, done = false, tm = 0, res; const p = new Promise(r => res = r);
    el.classList.add('cur'); el.textContent = '';
    const step = () => { if (done) return; i += text[i] === '\n' ? 1 : 1; el.textContent = text.slice(0, i); if (i >= text.length) return fin(); tm = setTimeout(step, /[。、…!?]/.test(text[i - 1]) ? speed * 7 : speed); };
    const fin = () => { if (done) return; done = true; clearTimeout(tm); el.textContent = text; el.classList.remove('cur'); res(); };
    tm = setTimeout(step, 200); return { p, fin };
  }
  function focusCard(i) {
    return new Promise(async resolve => {
      const c = R.cards[i], d = S.draws[i], card = CARD[d.id], or = d.rev ? card.rv : card.up, sp = SPREADS[S.sp];
      const rw = root.clientWidth, rh = root.clientHeight, bw = Math.min(rw * 0.5, 210, rh * 0.36 * 0.75), bh = bw * 4 / 3, bx = rw / 2, by = 16 + bh / 2 + 8;
      const fx = document.createElement('div'); fx.className = 'tz-fx';
      fx.innerHTML = `<div style="flex:0 0 ${bh + 40}px"></div><div class="tz-np"><div class="pl">${S.sp === 'celtic' ? i + 1 + ' ・ ' : ''}${esc(sp.pos[i][0])}<em>${esc(sp.pos[i][1])}</em></div><div class="nm" style="opacity:0"></div><div class="ne" style="opacity:0"></div><div class="kw"></div><div class="tx"></div><div class="tr" hidden></div><div class="go"></div></div>`;
      root.appendChild(fx);
      const halo = document.createElement('div'); halo.className = 'tz-halo'; halo.style.cssText = `left:${bx - bw * 1.1}px;top:${by - bw * 1.1}px;width:${bw * 2.2}px;height:${bw * 2.2}px;opacity:0`; root.appendChild(halo);
      const big = document.createElement('div'); big.className = 'tc tz-big' + (d.rev ? ' rev' : ''); big.style.cssText = `width:${bw}px;height:${bh}px`;
      big.innerHTML = `<div class="tc-in"><div class="tc-b"></div><div class="tc-f">${faceHTML(card, o.artBase)}</div></div>`; root.appendChild(big);
      const p0 = rectOf(c), s0 = c.s * BW / bw;
      const T0 = `translate(${p0.x - bw / 2}px,${p0.y - bh / 2}px) rotate(${c.r}deg) scale(${s0})`, T1 = `translate(${bx - bw / 2}px,${by - bh / 2}px) rotate(0deg) scale(1)`;
      big.style.transform = T0; c.el.style.visibility = 'hidden';
      snd('wave');
      await big.animate([{ transform: T0 }, { transform: `translate(${(p0.x + bx) / 2 - bw / 2}px,${Math.min(p0.y, by) - bh / 2 - 30}px) rotate(${c.r / 2 - 6}deg) scale(${(s0 + 1) / 2})`, offset: 0.55 }, { transform: T1 }], { duration: 900, easing: 'cubic-bezier(.3,.7,.2,1)' }).finished.catch(() => { });
      big.style.transform = T1;
      halo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards' });
      await sleep(250);
      // めくる(少し浮いて、光がはじける)
      big.animate([{ transform: T1 }, { transform: T1 + ' translateY(-10px) scale(1.06)', offset: 0.5 }, { transform: T1 }], { duration: 900, easing: 'ease-in-out' });
      big.classList.add('open'); setTimeout(() => { sparks(root, bx, by, 30, bw * 0.9); snd('coin'); }, 380);
      await sleep(800);
      const np = fx.querySelector('.tz-np'), nm = np.querySelector('.nm'), ne = np.querySelector('.ne'), kw = np.querySelector('.kw'), tx = np.querySelector('.tx'), tr = np.querySelector('.tr'), go = np.querySelector('.go');
      nm.innerHTML = `${esc(card.n)}<span class="or${d.rev ? ' r' : ''}">${d.rev ? '逆位置' : '正位置'}</span>`; ne.textContent = card.en + (d.rev ? ' — Reversed' : '');
      nm.animate([{ opacity: 0, letterSpacing: '.5em', filter: 'blur(6px)' }, { opacity: 1, letterSpacing: '.06em', filter: 'blur(0)' }], { duration: 900, easing: 'ease-out', fill: 'forwards' });
      ne.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 300, fill: 'forwards' });
      kw.innerHTML = or.kw.map(([en, ja], k) => `<button data-say="${esc(en)}" style="animation-delay:${0.5 + k * 0.12}s">🔊 ${esc(en)}<i>${esc(ja)}</i></button>`).join('');
      await sleep(700);
      const nr = narrFor(i); S.narr[i] = nr;
      const ty = typeOut(tx, nr.text); np.onclick = e => { if (!e.target.closest('button')) ty.fin(); };
      await ty.p;
      if (nr.tr) { tr.hidden = false; tr.textContent = nr.tr; }
      const lastOne = i === S.draws.length - 1;
      go.innerHTML = `<button class="tz-btn" data-nx="1">${lastOne ? (S.draws.length > 1 ? '✦ ルナのまとめを聞く' : '✦ ルナの言葉を聞く') : 'つぎのカードへ ›'}</button>`;
      go.querySelector('[data-nx]').onclick = async () => {
        go.innerHTML = ''; fx.classList.add('out'); halo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
        const p1 = rectOf(c), T2 = `translate(${p1.x - bw / 2}px,${p1.y - bh / 2}px) rotate(${c.r}deg) scale(${c.s * BW / bw})`;
        await big.animate([{ transform: T1 }, { transform: T2 }], { duration: 650, easing: 'cubic-bezier(.5,0,.2,1)' }).finished.catch(() => { });
        c.el.classList.add('nt', 'open'); c.el.style.visibility = 'visible'; void c.el.offsetWidth; c.el.classList.remove('nt');
        c.el.classList.add('shine'); sparks(R.stage, c.x, c.y, 10, 36);
        big.remove(); halo.remove(); fx.remove(); resolve();
      };
    });
  }
  async function summary() {
    // 並んだカードを上にまとめて、下でまとめを語る
    const rh = root.clientHeight, sr = R.stage.getBoundingClientRect(), rr = root.getBoundingClientRect(), topOff = sr.top - rr.top, avail = Math.max(140, rh * 0.44 - topOff);
    const L = spreadPos(R.W, avail), sc = L.w / BW;
    R.stage.querySelectorAll('.tz-lab').forEach(x => x.remove());
    pg.querySelector('.tz-lu').innerHTML = ''; ctl('');
    R.cards.forEach((c, i) => { c.k = 60; c.tx = L.P[i][0]; c.ty = L.P[i][1]; c.ts = sc; });
    await sleep(500);
    R.cards.forEach((c, i) => setTimeout(() => { c.el.classList.remove('shine'); void c.el.offsetWidth; c.el.classList.add('shine'); }, i * 160));
    const fx = document.createElement('div'); fx.className = 'tz-fx sum';
    const deep = SPREADS[S.sp].tier === 'deep';
    fx.innerHTML = `<div style="flex:0 0 46%"></div><div class="tz-np"><div class="pl">✦ ルナの言葉<em>Luna's Reading</em></div><div class="tx"></div><div class="tr" hidden></div>${deep ? `<div class="tz-cert" style="display:none">📜 <b>鑑定書</b> ・ ${new Date(S.t).toLocaleDateString('ja-JP')} ・ 占い師ルナ<br><small>この鑑定は「鑑定の記録」にのこしたわ</small></div>` : ''}<div class="go"></div></div>`;
    root.appendChild(fx);
    const np = fx.querySelector('.tz-np'), tx = np.querySelector('.tx'), tr = np.querySelector('.tr'), go = np.querySelector('.go');
    if (S.aiState === 'wait' || S.aiState === 'stream') {
      tx.innerHTML = '<div class="wait"><span class="tz-orb"></span>ルナが、星の声を聞いています……</div>';
      await Promise.race([S.aiPromise, sleep(25000)]);
    }
    const a = S.aiP.S, en = enMode();
    S.sum = a && a.body.length > 12 && a.body.length < 2400 ? (en && a.ja ? { text: a.en, tr: a.ja } : { text: a.body.replace(/\|\|\|[\s\S]*$/, '').trim(), tr: '' }) : { text: sumBuilt(S.sp, S.draws, S.theme), tr: '' };
    const h = st.hist.find(x => x.t === S.t); if (h) { h.narr = S.narr; h.sum = S.sum; save(); }
    if (en && a && a.en) o.logWord && o.logWord(a.en.split(/(?<=[.!?])\s+/)[0], (a.ja.split(/(?<=[。!?])/)[0] || ''), 'sentence');
    const ty = typeOut(tx, S.sum.text, 28); np.onclick = e => { if (!e.target.closest('button')) ty.fin(); };
    await ty.p;
    if (S.sum.tr) { tr.hidden = false; tr.textContent = S.sum.tr; }
    const ce = np.querySelector('.tz-cert'); if (ce) { ce.style.display = ''; ce.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 600 }); }
    go.innerHTML = '<button class="tz-btn sub" data-a="detail">カードの意味をくわしく</button><button class="tz-btn" data-a="again">もう一度 占う</button><button class="tz-btn sub" data-a="menu">メニューへ</button>';
  }

  // ---------- AI(ルナの声) ----------
  function aiStart() {
    S.aiState = ''; S.aiRaw = ''; S.aiP = {}; S.aiPromise = Promise.resolve();
    if (!(ai && ai.ready)) return;
    const sp = SPREADS[S.sp], en = enMode(), deep = sp.tier === 'deep', n = S.draws.length;
    const th = (THEMES.find(t => t[0] === S.theme) || THEMES[0])[2];
    const list = S.draws.map((d, i) => { const c = CARD[d.id], or = d.rev ? c.rv : c.up; return `${i + 1}. ${sp.pos[i][0]}(${sp.pos[i][1]}): ${c.n} / ${c.en} — ${d.rev ? '逆位置' : '正位置'}(${or.kw.map(k => k[0] + '=' + k[1]).join(', ')})`; }).join('\n');
    const system = [
      'あなたは町の占い師「ルナ」。なぞめいて、やさしく、少し芝居がかった口調で「〜わ」「〜なさい」と話す。タロットの伝統的な意味をふまえ、カード同士のつながり(流れ・対比・くり返し)を読み、相談者の質問に寄りそう。',
      '断定的な予言や、こわがらせる言い方はしない。健康・お金・法律の大きな決断は専門家に相談するよう、必要ならさりげなく添える。',
      `カード1枚ずつ、順番に語る(1つのかたまりに、1枚のカードのことだけ)。必ず次の形だけで出力する。番号の行は「#1」のように、それだけを1行に書く。#Sは全体のまとめ。前置き・見出し・箇条書き・太字・記号の飾りは書かない。\n` + [...Array.from({ length: n }, (_, k) => `#${k + 1}\n(${k + 1}枚目「${sp.pos[k][0]}」のカードの語り)`), '#S\n(全体のまとめ)'].join('\n'),
      deep ? '各カードは2〜3文。#S は4〜6文で、全体の流れと、今日からできる具体的な助言を1つ。' : (n === 1 ? '#1 は3〜4文。#S は1〜2文の短い言葉。' : '各カードは2〜3文。#S は3〜4文で、過去→現在→未来の流れと助言。'),
      en ? `Write every paragraph in ${getEn().level === 'easy' ? 'simple, easy' : 'natural'} English (keep the mysterious, gentle tone). In each block, write the English, then " ||| ", then a natural Japanese translation. Keep the "#1" … "#S" lines exactly as shown.` : '日本語で書く。',
    ].join('\n');
    const user = `占い方:${sp.n}\nテーマ:${th}\n${S.q ? '質問:' + S.q + '\n' : ''}出たカード:\n${list}`;
    S.aiState = 'wait';
    S.aiPromise = ai.chat({ system, messages: [{ role: 'user', text: user }], maxTokens: deep ? 2600 : 1400, maxChars: deep ? 7000 : 3500, onDelta: part => { S.aiState = 'stream'; S.aiRaw = part; S.aiP = parseAI(part, n); } })
      .then(out => { S.aiRaw = String(out); S.aiP = parseAI(S.aiRaw, n); Object.values(S.aiP).forEach(x => { x.done = true; }); S.aiState = 'done'; })
      .catch(() => { S.aiState = 'err'; });
  }

  // ---------- 操作 ----------
  function zoom(i) {
    const d = S.draws[i], c = CARD[d.id], or = d.rev ? c.rv : c.up, zz = document.createElement('div'); zz.className = 'tz-zoom';
    zz.innerHTML = `<div class="z${d.rev ? ' rev' : ''}">${faceHTML(c, o.artBase)}</div><p>${esc(c.n)}(${d.rev ? '逆位置' : '正位置'})<br><span style="font:italic 14px Georgia,serif;color:#ffd76a">${esc(c.en)}</span></p><p style="font-weight:400;font-size:14px">${esc(or.m)}</p>`;
    zz.onclick = () => zz.remove(); root.appendChild(zz);
  }
  const leaveRitual = () => { root.querySelectorAll('.tz-fx,.tz-big,.tz-halo,.tz-spk').forEach(x => x.remove()); R = null; };
  root.addEventListener('click', e => {
    const t = e.target.closest('[data-a],[data-sp],[data-th],[data-h],[data-zm],[data-say]'); if (!t) return;
    const a = t.dataset.a;
    if (t.dataset.say) return speak(t.dataset.say);
    if (t.dataset.zm != null) return zoom(+t.dataset.zm);
    if (t.dataset.sp) { S.sp = t.dataset.sp; S.step = 'theme'; return page(); }
    if (t.dataset.th) { S.q = (pg.querySelector('.tz-q') || {}).value || S.q; S.theme = t.dataset.th; pg.querySelectorAll('[data-th]').forEach(b => b.classList.toggle('on', b === t)); return; }
    if (t.dataset.h != null) {
      const h = st.hist[+t.dataset.h]; if (!h) return;
      Object.assign(S, { sp: h.sp, theme: h.th, q: h.q || '', draws: h.d.map(([id, r]) => ({ id, rev: !!r })), narr: h.narr || [], sum: h.sum || null, step: 'detail', t: h.t });
      return page();
    }
    if (a === 'exit') return o.onExit && o.onExit();
    if (a === 'menu') { leaveRitual(); S.step = 'menu'; return page(); }
    if (a === 'hist') { S.step = 'hist'; return page(); }
    if (a === 'pack') return buyPack();
    if (a === 'detail') { leaveRitual(); S.step = 'detail'; return page(); }
    if (a === 'again') { leaveRitual(); S.step = 'theme'; return page(); }
    if (a === 'go') {
      S.q = ((pg.querySelector('.tz-q') || {}).value || '').trim().slice(0, 80);
      const how = pay(); if (!how) return;
      if (how === 'free') toast('きょうは、お代はいらないわ');
      startDeck(); S.shuffles = 0; S.step = 'ritual'; return ritual();
    }
    if (!R) return;
    if (a === 'automix') return autoMix();
    if (a === 'gather') return gather();
    if (a === 'mixok') { if (!R.busy && R.mode === 'idle') toCut(); return; }
    if (a === 'read') return readAll();
  });
  pg.addEventListener('input', e => { if (e.target.classList.contains('tz-q')) S.q = e.target.value; });
  page();
  return { el: root, unmount() { dead = true; cancelAnimationFrame(raf); root.remove(); } };
}
