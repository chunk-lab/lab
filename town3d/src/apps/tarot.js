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

const CSS = `
.tz{position:absolute;inset:0;overflow:auto;color:#f3eaff;font-family:inherit;padding:12px 14px calc(30px + env(safe-area-inset-bottom,0px));box-sizing:border-box;
  background:radial-gradient(ellipse at 50% -10%,#6a4aa0 0%,#2a1d47 55%,#150d28 100%);-webkit-tap-highlight-color:transparent}
.tz::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.5;background-image:radial-gradient(1px 1px at 20% 30%,#fff,transparent),radial-gradient(1px 1px at 70% 20%,#ffd76a,transparent),radial-gradient(1.5px 1.5px at 85% 60%,#fff,transparent),radial-gradient(1px 1px at 35% 75%,#fff,transparent),radial-gradient(1px 1px at 55% 50%,#cdbbea,transparent),radial-gradient(1px 1px at 10% 85%,#ffd76a,transparent)}
.tz>*{position:relative}
.tz h2{margin:2px 0 2px;font-size:20px;letter-spacing:.05em}.tz h2 small{display:block;font:italic 12px Georgia,serif;color:#cdbbea;letter-spacing:.1em}
.tz .tz-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.tz .tz-pill{display:inline-flex;gap:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:4px 10px;font-weight:900;font-size:13px;white-space:nowrap}
.tz .tz-say{background:rgba(255,255,255,.1);border:1px solid rgba(255,215,106,.35);border-radius:16px;padding:10px 12px;margin:10px 0;font-size:14px;line-height:1.7}
.tz .tz-say b{color:#ffd76a}
.tz .tz-back{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:900;background:rgba(255,255,255,.16);color:#fff;margin:4px 0}
.tz .tz-sp{display:flex;gap:12px;align-items:center;width:100%;text-align:left;border:1px solid rgba(255,215,106,.35);border-radius:18px;padding:12px;margin:8px 0;background:linear-gradient(135deg,rgba(255,255,255,.14),rgba(255,255,255,.04));color:#f3eaff;font:inherit}
.tz .tz-sp.deep{border-color:#ffd76a;background:linear-gradient(135deg,rgba(255,215,106,.25),rgba(120,80,200,.18))}
.tz .tz-sp .mini{display:flex;gap:2px;flex:0 0 auto}.tz .tz-sp .mini i{display:block;width:16px;height:26px;border-radius:3px;background:linear-gradient(#3b2470,#140b2e);border:1px solid #ffd76a99}
.tz .tz-sp b{display:block;font-size:16px}.tz .tz-sp small{display:block;font-size:12px;color:#cdbbea;margin-top:2px}.tz .tz-sp em{font:italic 11px Georgia,serif;color:#ffd76a;margin-left:6px}
.tz .tz-sp .pr{margin-left:auto;text-align:right;font-weight:900;white-space:nowrap;font-size:14px}.tz .tz-sp .pr small{color:#ffd76a;font-size:11px}
.tz .tz-sp:disabled{opacity:.45}
.tz .tz-sub{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.tz .tz-btn{border:0;border-radius:999px;padding:11px 18px;font:inherit;font-weight:900;font-size:15px;background:linear-gradient(160deg,#ffe08a,#ffb94f);color:#3b2470;box-shadow:0 3px 0 #b07a1f}
.tz .tz-btn.sub{background:rgba(255,255,255,.16);color:#fff;box-shadow:none}.tz .tz-btn:disabled{opacity:.5}
.tz .tz-chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.tz .tz-chips button{border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:9px 13px;font:inherit;font-weight:800;font-size:14px;background:rgba(255,255,255,.08);color:#fff}
.tz .tz-chips button.on{background:#ffd76a;color:#3b2470;border-color:#ffd76a}
.tz .tz-q{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.3);border-radius:14px;padding:10px 12px;background:rgba(0,0,0,.25);color:#fff;font:inherit;font-size:15px}
.tz .tz-nt{font-size:12px;color:#cdbbea;line-height:1.6;margin:6px 0}
.tz .tz-c{text-align:center}
.tz-svg{display:block;width:100%;height:100%}
/* カード */
.tz .tc{position:absolute;perspective:700px;cursor:pointer}
.tz .tc-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.3,1.4,.5,1)}
.tz .tc.open .tc-in{transform:rotateY(180deg)}
.tz .tc-f,.tz .tc-b{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:7%;box-shadow:0 4px 14px rgba(0,0,0,.45);overflow:hidden}
.tz .tc-f{transform:rotateY(180deg)}.tz .tc.rev .tc-f>div{transform:rotate(180deg)}.tz .tc-f>div{position:absolute;inset:0}
.tz .tc-f img,.tz .tz-cr .th img,.tz .tz-zoom .z img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tz .tc.glow .tc-b{box-shadow:0 0 0 2px #ffd76a,0 0 18px #ffd76a}
.tz .tc-lab{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:3px;font-size:10px;font-weight:800;color:#ffd76a;white-space:nowrap;text-shadow:0 1px 2px #000}
.tz .tc-no{position:absolute;left:-5px;top:-5px;width:18px;height:18px;border-radius:50%;background:#ffd76a;color:#3b2470;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;z-index:2}
/* シャッフル */
.tz .tz-deck{position:relative;width:120px;height:160px;margin:24px auto 14px;cursor:pointer}
.tz .tz-deck .dk{position:absolute;inset:0;transition:transform .35s}
.tz .tz-deck.sh .dk:nth-child(odd){animation:tzL .45s ease-in-out}.tz .tz-deck.sh .dk:nth-child(even){animation:tzR .45s ease-in-out}
@keyframes tzL{50%{transform:translate(-62px,6px) rotate(-14deg)}}@keyframes tzR{50%{transform:translate(62px,-4px) rotate(12deg)}}
.tz .tz-piles{display:flex;justify-content:center;gap:16px;margin:26px 0}.tz .tz-pile{position:relative;width:84px;height:112px;cursor:pointer;transition:transform .25s}
.tz .tz-pile:hover,.tz .tz-pile:active{transform:translateY(-8px)}.tz .tz-pile .dk{position:absolute;inset:0}
/* えらぶ(扇) */
.tz .tz-fanw{overflow-x:auto;overflow-y:hidden;margin:6px -14px;padding:26px 14px 18px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.tz .tz-fan{position:relative;height:100px}
.tz .tz-fan .fc{position:absolute;top:0;width:70px;height:93px;transition:transform .25s,opacity .4s;transform-origin:50% 140%}
.tz .tz-fan .fc:active{transform:translateY(-14px)}.tz .tz-fan .fc.gone{opacity:0;transform:translateY(-60px) scale(.8);pointer-events:none}
/* 並べ方 */
.tz .tz-lay{position:relative;margin:8px auto 20px}
.tz .tz-read{background:rgba(255,255,255,.96);color:#3b2b55;border-radius:18px;padding:14px;margin:12px 0;line-height:1.75;font-size:15px;animation:tzIn .5s}
.tz .tz-read h3{margin:0 0 6px;font-size:16px;color:#5b3f8c}.tz .tz-read p{margin:6px 0}
.tz .tz-cr{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px dashed #d9cdee}.tz .tz-cr:first-of-type{border-top:0}
.tz .tz-cr .th{flex:0 0 56px;height:75px;position:relative;border-radius:5px;overflow:hidden;box-shadow:0 2px 6px #0003}.tz .tz-cr .th.rev>div{transform:rotate(180deg)}.tz .tz-cr .th>div{position:absolute;inset:0}
.tz .tz-cr .pos{font-size:11px;font-weight:900;color:#8d6cc0}.tz .tz-cr b{font-size:15px}.tz .tz-cr .or{font-size:11px;font-weight:900;border-radius:999px;padding:1px 7px;margin-left:4px;background:#efe6ff;color:#5b3f8c}.tz .tz-cr .or.r{background:#ffe3ea;color:#b0466a}
.tz .tz-cr .en{font:italic 12px Georgia,serif;color:#8d7f9e}
.tz .tz-kw{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}.tz .tz-kw button{border:0;border-radius:999px;padding:3px 9px;font:inherit;font-size:12px;background:#f3ecff;color:#4a3a6b}.tz .tz-kw button i{font-style:normal;color:#8d7f9e;margin-left:3px}
.tz .tz-luna{background:linear-gradient(160deg,#fff8e6,#fff);border:1px solid #f2d58a}
.tz .tz-luna .ai{white-space:pre-wrap}.tz .tz-luna .tr{margin-top:8px;padding-top:8px;border-top:1px dashed #e7cf8f;color:#6b5b80;font-size:14px;white-space:pre-wrap}
.tz .tz-zoom{position:fixed;inset:0;z-index:50;background:rgba(10,5,25,.85);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;animation:tzIn .25s}
.tz .tz-zoom .z{width:min(70vw,300px);aspect-ratio:3/4;position:relative;border-radius:12px;overflow:hidden;box-shadow:0 0 40px #ffd76a66}.tz .tz-zoom .z.rev>div{transform:rotate(180deg)}.tz .tz-zoom .z>div{position:absolute;inset:0}
.tz .tz-zoom p{margin:0;color:#fff;font-weight:800;text-align:center;padding:0 20px;line-height:1.6}
.tz .tz-hist{display:flex;gap:10px;align-items:center;width:100%;border:0;border-radius:14px;padding:10px 12px;margin:6px 0;background:rgba(255,255,255,.1);color:#fff;font:inherit;text-align:left}
.tz .tz-hist small{display:block;color:#cdbbea;font-size:11px}
.tz .tz-spin{display:inline-block;animation:tzSp 1.4s linear infinite}@keyframes tzSp{to{transform:rotate(360deg)}}
@keyframes tzIn{from{opacity:0;transform:translateY(8px)}}
.tz .tz-cert{border:2px solid #d9b24a;border-radius:16px;padding:10px 12px;margin:10px 0;background:rgba(255,215,106,.1);text-align:center;font-size:13px}
`;

function faceHTML(c, artBase) {
  return `<div>${faceSVG(c)}${artBase ? `<img src="${esc(artBase + c.id)}.webp" alt="${esc(c.en)}" decoding="async" onerror="this.remove()">` : ''}</div>`;
}

// AIなしの鑑定(カードの意味と並び方から組み立てる)
function compose(sp, draws, theme) {
  const C = draws.map(d => ({ ...d, c: CARD[d.id], o: d.rev ? CARD[d.id].rv : CARD[d.id].up }));
  const gist = x => `《${x.c.n}》${x.rev ? '(逆)' : ''}が示す「${x.o.kw[0][1]}」`;
  const th = THEMES.find(t => t[0] === theme) || THEMES[0], out = [];
  const tLine = { all: 'あなたの今とこれからを', love: 'あなたの恋のゆくえを', work: '勉強やお仕事のことを', people: 'まわりの人とのことを', money: 'お金とくらしのことを', self: 'あなた自身のことを' }[th[0]];
  out.push(`${tLine}、カードにたずねたわ。`);
  if (sp === 'one') {
    const x = C[0];
    out.push(`出てきたのは<b>${esc(x.c.n)}</b>の${x.rev ? '逆位置' : '正位置'}。${esc(x.o.m)}`);
    out.push(`きょうの合言葉は「<b>${esc(x.o.kw[0][0])}</b>」——${esc(x.o.kw[0][1])}よ。${x.rev ? '逆位置は、力が内側にこもっているしるし。向きを変えれば、そのまま追い風になるわ。' : '素直に受け取って、一日の中で思い出してみて。'}`);
  } else if (sp === 'three') {
    const [a, b, c] = C;
    out.push(`過去には${gist(a)}。それが、いまの${gist(b)}につながっている。このまま進めば、${gist(c)}へ向かうわ。`);
    out.push(c.rev ? `未来のカードは逆位置。決まった運命ではなく「このままだと」というしるしよ。${esc(c.o.m)}` : `未来のカードは正位置。${esc(c.o.m)}`);
    out.push(`いまのあなたへのいちばんの助言は、まんなかのカードから。${esc(b.o.m)}`);
  } else {
    const P = i => C[i];
    out.push(`いまの中心にあるのは${gist(P(0))}。そこに${gist(P(1))}が、試練として交差しているわ。`);
    out.push(`あなたが意識しているのは${gist(P(2))}。でも心の根っこには${gist(P(3))}がある。`);
    out.push(`過去の${gist(P(4))}は少しずつ遠ざかり、近い未来には${gist(P(5))}がやってくる。`);
    out.push(`あなた自身は${gist(P(6))}。まわりは${gist(P(7))}。そして心の奥の願いと恐れは${gist(P(8))}。`);
    out.push(`最後に出たのは<b>${esc(P(9).c.n)}</b>の${P(9).rev ? '逆位置' : '正位置'}。${esc(P(9).o.m)}`);
  }
  // 並び方のくせ
  const maj = C.filter(x => x.c.suit === 'major').length, rev = C.filter(x => x.rev).length;
  if (C.length >= 3) {
    if (maj / C.length >= 0.5) out.push('大アルカナがたくさん出ているわ。いまは自分の力だけでは動かせない、大きな流れの中にいるの。流れに逆らわず、ここぞという時に動いて。');
    const cnt = {}; C.forEach(x => { if (x.c.suit !== 'major') cnt[x.c.suit] = (cnt[x.c.suit] || 0) + 1; });
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= Math.max(2, Math.ceil(C.length * 0.3))) out.push(`${SUITS[top[0]].n}(${SUITS[top[0]].el})が多いわね。${SUITS[top[0]].theme}。`);
    if (rev / C.length >= 0.5) out.push('逆位置が多いのは、物事がとどこおりやすい時期のしるし。でも逆位置は「内側に向かう力」でもあるの。あせらず、自分の中を整える時よ。');
    else if (rev === 0) out.push('すべて正位置。カードたちが、まっすぐな言葉で話しかけているわ。');
    const court = C.filter(x => x.c.court).length; if (court >= 2) out.push('人物のカードが何枚も出ているわ。まわりのだれかが、カギをにぎっているかも。');
    const ace = C.filter(x => x.c.rank === 1).length; if (ace >= 2) out.push('エースが重なるのは、新しい始まりのしるし。');
  }
  const last = C[C.length - 1];
  out.push(last.rev ? '未来は、今日からの選び方でいくらでも変わるわ。カードは「気をつけて」と言っているだけ。' : 'カードは、あなたの味方よ。');
  return out;
}

// 絵の場所:組みこみ先が town.js を読みこんだ場所の横の tarot/(1つのHTMLで動かすときは、ページの横の tarot/)
const ART_BASE = (() => { try { const s = document.currentScript && document.currentScript.src; return s ? new URL('tarot/', s).href : 'tarot/'; } catch (e) { return 'tarot/'; } })();
export function mountTarot(box, o) {
  const { ctx, social, ai, getEn } = o;
  if (o.artBase == null || o.artBase === '') o = { ...o, artBase: ART_BASE };
  if (!document.getElementById('tz-css')) { const s = document.createElement('style'); s.id = 'tz-css'; s.textContent = CSS; document.head.appendChild(s); }
  const el = document.createElement('div'); el.className = 'tz'; box.appendChild(el);
  const st = Object.assign({ wk: '', dk: '', tk: 0, hist: [] }, ctx.storage.get('tarot') || {});
  const save = () => ctx.storage.set('tarot', st);
  const S = { step: 'menu', sp: null, theme: 'all', q: '', deck: [], picked: [], draws: [], opened: new Set(), shuffles: 0, ai: '', aiTr: '', aiState: '' };
  const discount = () => social.has('luna', 'discount'), dailyFree = () => social.has('luna', 'tarot');
  const coinPrice = () => discount() ? TAROT_PRICE.coin / 2 : TAROT_PRICE.coin;
  const freeNow = () => dailyFree() ? st.dk !== dayKey() : st.wk !== weekKey();
  const gems = () => (ctx.gems ? ctx.gems.get() : null);
  const toast = t => { const d = document.createElement('div'); d.textContent = t; d.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(40,30,60,.94);color:#fff;padding:10px 16px;border-radius:999px;font-weight:800;font-size:14px;z-index:99;pointer-events:none;max-width:86vw;text-align:center'; el.appendChild(d); setTimeout(() => d.remove(), 2000); };
  const speak = t => { try { const s = window.speechSynthesis; if (!s) return; s.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = 0.9; s.speak(u); } catch (e) { } };
  const head = (sub) => `<div class="tz-top"><h2>🃏 タロット<small>${esc(sub || 'Tarot Reading')}</small></h2><span class="tz-pill">🪙 ${ctx.wallet.get()}${gems() != null ? ` ・ 💎 ${gems()}` : ''}${st.tk ? ` ・ 🎫 ${st.tk}` : ''}</span></div>`;

  // ---- 支払い ----
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
    st.tk += TAROT_PRICE.pack.n; save(); toast(`🎫 ケルト十字の券を ${TAROT_PRICE.pack.n}まい 受け取ったわ`); draw();
  }

  // ---- 画面 ----
  function draw() {
    const f = { menu, theme, shuffle, cut, pick, spread, hist }[S.step]; el.innerHTML = f(); el.scrollTop = 0;
    if (S.step === 'spread') layout();
  }
  function menu() {
    const free = freeNow(), cp = coinPrice();
    const easyPr = free ? `無料<small>${dailyFree() ? 'きょうの1回' : '今週の1回'}</small>` : `🪙 ${cp}${discount() ? '<small>仲良し割</small>' : ''}`;
    const deepPr = st.tk ? `🎫 1まい<small>のこり ${st.tk}</small>` : `💎 ${TAROT_PRICE.gem}`;
    const mini = n => `<span class="mini">${'<i></i>'.repeat(n)}</span>`;
    return head() + `<div class="tz-say">🔮 ルナ「${esc(o.lunaLine || 'カードは、あなたの心をうつす鏡。…なにを たずねたいの?')}」</div>
      ${Object.entries(SPREADS).map(([id, sp]) => `<button class="tz-sp ${sp.tier}" data-sp="${id}">${mini(Math.min(sp.pos.length, 5))}<span><b>${sp.n}<em>${sp.en}</em></b><small>${sp.d}</small>${sp.tier === 'deep' ? '<small>✨ ルナのくわしい鑑定・鑑定書つき</small>' : ''}</span><span class="pr">${sp.tier === 'deep' ? deepPr : easyPr}</span></button>`).join('')}
      <div class="tz-sub">${ctx.gems ? `<button class="tz-btn sub" data-a="pack">🎫 ケルト十字 ${TAROT_PRICE.pack.n}回券(💎${TAROT_PRICE.pack.gem})</button>` : ''}<button class="tz-btn sub" data-a="hist">📜 鑑定の記録${st.hist.length ? `(${st.hist.length})` : ''}</button></div>
      <p class="tz-nt">かんたん占いは${dailyFree() ? '<b>毎日1回</b>' : '<b>週に1回</b>'}無料。${dailyFree() ? '' : 'ルナともっと仲良くなると、毎日1回無料になるかも…。'}<br>${ai && ai.ready ? 'AIがつながっているので、ルナがあなたのためだけに鑑定文を書きます。' : 'AIをつなぐと、ルナが質問に合わせて鑑定文を書いてくれます(設定 → AIとおしゃべり)。'}<br>カードの英語の名前とキーワードは、あしたのふりかえりにも出ます。</p>
      <button class="tz-back" data-a="exit">← 館のメニューへ</button>`;
  }
  function theme() {
    const sp = SPREADS[S.sp];
    return head(sp.en) + `<div class="tz-say">🔮 ルナ「${sp.n}ね。…なにについて、たずねる?」</div>
      <div class="tz-chips">${THEMES.map(([id, ic, n]) => `<button data-th="${id}" class="${S.theme === id ? 'on' : ''}">${ic} ${n}</button>`).join('')}</div>
      <input class="tz-q" maxlength="80" placeholder="たずねたいこと(書かなくてもOK)" value="${esc(S.q)}">
      <p class="tz-nt">質問を心の中で思いうかべながら、シャッフルしてね。${ai && ai.ready ? '書いた質問は、ルナの鑑定文に使われます。' : ''}</p>
      <div class="tz-c" style="margin-top:14px"><button class="tz-btn" data-a="go">シャッフルを始める(${sp.tier === 'deep' ? (st.tk ? '🎫1まい' : '💎' + TAROT_PRICE.gem) : freeNow() ? '無料' : '🪙' + coinPrice()})</button></div>
      <button class="tz-back" data-a="menu">← もどる</button>`;
  }
  const deckStack = n => Array.from({ length: n }, (_, i) => `<div class="dk" style="transform:translate(${i * 0.6}px,${-i * 0.8}px)">${BACK}</div>`).join('');
  function shuffle() {
    return head('Shuffle') + `<div class="tz-say">🔮 ルナ「目をとじて、質問を心にうかべて…。カードの山にふれて、まぜてちょうだい」</div>
      <div class="tz-deck" data-a="mix">${deckStack(6)}</div>
      <p class="tz-nt tz-c">山をタップしてシャッフル(${S.shuffles}回)。いいと思ったところで止めてね。</p>
      <div class="tz-c"><button class="tz-btn" data-a="cutgo" ${S.shuffles < 1 ? 'disabled' : ''}>これでいい</button></div>`;
  }
  function cut() {
    return head('Cut') + `<div class="tz-say">🔮 ルナ「山を3つに分けたわ。…直感で、ひとつ えらんで」</div>
      <div class="tz-piles">${[0, 1, 2].map(i => `<div class="tz-pile" data-cut="${i}">${deckStack(4)}</div>`).join('')}</div>`;
  }
  function pick() {
    const n = SPREADS[S.sp].pos.length, W = 70, gap = 19;
    return head('Choose your cards') + `<div class="tz-say">🔮 ルナ「カードを広げたわ。気になるものを <b>${n}枚</b>、えらんで。…考えないで、感じるままに」</div>
      <p class="tz-c" style="font-weight:900;font-size:16px;margin:4px 0">${S.picked.length} / ${n}</p>
      <div class="tz-fanw"><div class="tz-fan" style="width:${(S.deck.length - 1) * gap + W}px">${S.deck.map((d, i) => `<div class="fc${S.picked.includes(i) ? ' gone' : ''}" data-pk="${i}" style="left:${i * gap}px;transform:rotate(${(i / (S.deck.length - 1) - 0.5) * 10}deg)">${BACK}</div>`).join('')}</div></div>
      <p class="tz-nt tz-c">← 横にすべらせると、ぜんぶの78枚が見られます →</p>`;
  }
  function spread() {
    const sp = SPREADS[S.sp], all = S.opened.size >= S.draws.length;
    return head(sp.en) + `<div class="tz-say">🔮 ルナ「${all ? 'すべて開いたわ。…読んでいくわね' : 'カードをタップして、1枚ずつ めくって'}」</div>
      <div class="tz-lay"></div>
      ${all ? '' : `<div class="tz-c"><button class="tz-btn sub" data-a="openall">まとめて めくる</button></div>`}
      <div class="tz-out">${all ? readingHTML() : ''}</div>`;
  }
  function hist() {
    return head('Records') + `<div class="tz-say">🔮 ルナ「これまでの鑑定よ。カードは、あとから見返すと意味がわかることも多いの」</div>
      ${st.hist.length ? st.hist.slice().reverse().map((h, i) => { const sp = SPREADS[h.sp]; return `<button class="tz-hist" data-h="${st.hist.length - 1 - i}"><span style="font-size:24px">${sp.tier === 'deep' ? '📜' : '🃏'}</span><span><b>${esc(sp.n)}</b> ・ ${esc((THEMES.find(t => t[0] === h.th) || THEMES[0])[2])}<small>${new Date(h.t).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ・ ${h.d.map(d => CARD[d[0]].n + (d[1] ? '(逆)' : '')).slice(0, 3).join('、')}${h.d.length > 3 ? '…' : ''}</small></span></button>`; }).join('') : '<p class="tz-nt">まだ記録はないわ。</p>'}
      <button class="tz-back" data-a="menu">← もどる</button>`;
  }

  // ---- 並べる(ケルト十字は、中心に十字・右に4枚の柱) ----
  function layout() {
    const lay = el.querySelector('.tz-lay'), Wb = Math.min(el.clientWidth - 28, 520), sp = S.sp;
    let w, P;
    if (sp === 'one') { w = Math.min(170, Wb / 2.2); P = [[Wb / 2, w * 2 / 3 + 4]]; }
    else if (sp === 'three') { w = Math.min(110, Wb / 3.6); const g = w * 1.14; P = [-1, 0, 1].map(i => [Wb / 2 + i * g, w * 2 / 3 + 4]); }
    else {
      w = Math.min(84, Wb / 6.1); const h = w * 4 / 3, cx = w * 2.35, cy = h * 2.05, sx = w * 5.35;
      P = [[cx, cy], [cx, cy], [cx, cy - h * 1.12], [cx, cy + h * 1.12], [cx - w * 1.5, cy], [cx + w * 1.5, cy], [sx, h * 3.55], [sx, h * 2.45], [sx, h * 1.35], [sx, h * 0.25 + h * 0.0]];
      P = P.map(([x, y]) => [x + (Wb - w * 6.1) / 2, y]);
    }
    const h = w * 4 / 3, H = sp === 'celtic' ? h * 4.2 + 14 : h + 40;
    lay.style.cssText = `width:${Wb}px;height:${H}px`;
    lay.innerHTML = S.draws.map((d, i) => {
      const c = CARD[d.id], [x, y] = P[i], open = S.opened.has(i), rot = sp === 'celtic' && i === 1 ? 'transform:rotate(90deg);z-index:3;' : '';
      return `<div class="tc${open ? ' open' : ''}${d.rev ? ' rev' : ''}${open ? '' : ' glow'}" data-op="${i}" style="left:${x - w / 2}px;top:${y - h / 2 + (sp === 'celtic' ? 0 : 6)}px;width:${w}px;height:${h}px;${rot}">
        ${sp === 'celtic' ? `<span class="tc-no">${i + 1}</span>` : ''}<div class="tc-in"><div class="tc-b">${BACK}</div><div class="tc-f">${faceHTML(c, o.artBase)}</div></div>
        ${sp !== 'celtic' ? `<span class="tc-lab">${esc(SPREADS[sp].pos[i][0])}</span>` : ''}</div>`;
    }).join('');
  }

  // ---- 鑑定 ----
  function readingHTML() {
    const sp = SPREADS[S.sp];
    const rows = S.draws.map((d, i) => {
      const c = CARD[d.id], or = d.rev ? c.rv : c.up;
      return `<div class="tz-cr"><div class="th${d.rev ? ' rev' : ''}" data-zm="${i}">${faceHTML(c, o.artBase)}</div><div style="flex:1;min-width:0">
        <div class="pos">${S.sp === 'celtic' ? i + 1 + '. ' : ''}${esc(sp.pos[i][0])} <span style="font-weight:400;font-family:Georgia,serif;font-style:italic">${esc(sp.pos[i][1])}</span></div>
        <b>${esc(c.n)}</b><span class="or${d.rev ? ' r' : ''}">${d.rev ? '逆位置' : '正位置'}</span><div class="en">${esc(c.en)}${d.rev ? ' (Reversed)' : ''}</div>
        <div class="tz-kw">${or.kw.map(([en, ja]) => `<button data-say="${esc(en)}">🔊 ${esc(en)}<i>${esc(ja)}</i></button>`).join('')}</div>
        <div>${esc(or.m)}</div></div></div>`;
    }).join('');
    const comp = compose(S.sp, S.draws, S.theme).map(t => `<p>${t}</p>`).join('');
    let luna;
    if (S.aiState === 'wait') luna = `<p><span class="tz-spin">🔮</span> ルナがカードを読んでいます…</p>`;
    else if (S.aiState === 'done' || S.aiState === 'stream') luna = `<div class="ai">${esc(S.ai)}</div>${S.aiTr ? `<div class="tr">${esc(S.aiTr)}</div>` : ''}`;
    else luna = comp;
    const cert = sp.tier === 'deep' ? `<div class="tz-cert">📜 <b>鑑定書</b> ・ ${new Date(S.t || Date.now()).toLocaleDateString('ja-JP')} ・ 占い師ルナ<br><small>この鑑定は「鑑定の記録」にのこしたわ</small></div>` : '';
    return `<div class="tz-read tz-luna"><h3>🔮 ルナの鑑定</h3>${S.q ? `<p style="font-size:13px;color:#8d7f9e">「${esc(S.q)}」</p>` : ''}${luna}
      ${(S.aiState === 'done' || S.aiState === 'err') ? `<details style="margin-top:8px"><summary style="font-size:13px;color:#8d6cc0;font-weight:800">カードの並びから読んだこと</summary>${comp}</details>` : ''}</div>
      ${cert}<div class="tz-read"><h3>🃏 カードの意味</h3>${rows}</div>
      <div class="tz-c tz-sub" style="justify-content:center"><button class="tz-btn" data-a="again">もう一度 占う</button><button class="tz-btn sub" data-a="menu">メニューへ</button></div>`;
  }
  function refreshOut() { const out = el.querySelector('.tz-out'); if (out) out.innerHTML = readingHTML(); }

  async function aiRead() {
    if (!(ai && ai.ready)) return;
    const sp = SPREADS[S.sp], en = getEn && getEn().on, deep = sp.tier === 'deep';
    const th = (THEMES.find(t => t[0] === S.theme) || THEMES[0])[2];
    const list = S.draws.map((d, i) => { const c = CARD[d.id], or = d.rev ? c.rv : c.up; return `${i + 1}. ${sp.pos[i][0]}(${sp.pos[i][1]}): ${c.n} / ${c.en} — ${d.rev ? '逆位置' : '正位置'}(${or.kw.map(k => k[0] + '=' + k[1]).join(', ')})`; }).join('\n');
    const system = [
      'あなたは町の占い師「ルナ」。なぞめいて、やさしく、少し芝居がかった口調で「〜わ」「〜なさい」と話す。タロットの伝統的な意味をふまえ、カード同士のつながり(流れ・対比・くり返し)を読み、相談者に寄りそう。',
      '断定的な予言や、こわがらせる言い方はしない。健康・お金・法律の大きな決断は専門家に相談するよう、さりげなく添える。',
      deep ? '長めの本格的な鑑定(8〜12文)。各位置のカードを順に読み、最後に全体のまとめと、今日からできる具体的な助言を1つ。' : (S.sp === 'one' ? '短い鑑定(3〜4文)。' : '中くらいの鑑定(5〜7文)。過去→現在→未来の流れを読む。'),
      en ? `Write the reading in ${getEn().level === 'easy' ? 'simple, easy' : 'natural'} English (keep the mysterious, gentle tone). Then write " ||| " and a natural Japanese translation.` : '日本語で書く。見出しや記号の箇条書きは使わない。',
    ].join('\n');
    const user = `占い方:${sp.n}\nテーマ:${th}\n${S.q ? '質問:' + S.q + '\n' : ''}出たカード:\n${list}`;
    S.aiState = 'wait'; S.ai = S.aiTr = ''; refreshOut();
    try {
      const out = await ai.chat({ system, messages: [{ role: 'user', text: user }], maxTokens: deep ? 2400 : 1200, maxChars: deep ? 6000 : 3000,
        onDelta: part => { S.aiState = 'stream'; S.ai = part.split('|||')[0].trim(); const a = el.querySelector('.tz-luna .ai'); if (a) a.textContent = S.ai; else refreshOut(); } });
      const [a, b] = String(out).split('|||'); S.ai = (a || '').trim(); S.aiTr = (b || '').trim(); S.aiState = 'done';
      if (en && S.ai) o.logWord && o.logWord(S.ai.split(/(?<=[.!?])\s+/)[0], (S.aiTr.split(/(?<=[。!?])/)[0] || ''), 'sentence');   // 鑑定の最初の1文もふりかえりへ
    } catch (e) { S.aiState = 'err'; S.ai = ''; toast(e.message || 'ルナの声が、とぎれてしまったわ'); }
    const h = st.hist[st.hist.length - 1]; if (h && h.t === S.t) { h.ai = S.ai; h.tr = S.aiTr; save(); }
    refreshOut();
  }
  function finishOpen() {
    // ふりかえり:出たカードのいちばん目のキーワードを、英単語として入れる
    S.draws.forEach(d => { const c = CARD[d.id], k = (d.rev ? c.rv : c.up).kw[0]; o.logWord && o.logWord(k[0], k[1], 'word'); });
    S.t = Date.now();
    st.hist.push({ t: S.t, sp: S.sp, th: S.theme, q: S.q, d: S.draws.map(d => [d.id, d.rev ? 1 : 0]) }); while (st.hist.length > 40) st.hist.shift(); save();
    o.onRead && o.onRead(S.sp);
    setTimeout(() => { draw(); aiRead(); }, 650);
  }
  function openCard(i) {
    if (S.opened.has(i)) { zoom(i); return; }
    S.opened.add(i); const t = el.querySelector(`[data-op="${i}"]`); if (t) { t.classList.add('open'); t.classList.remove('glow'); }
    try { ctx.audio && ctx.audio.play && ctx.audio.play('tap'); } catch (e) { }
    if (S.opened.size >= S.draws.length) finishOpen();
  }
  function zoom(i) {
    const d = S.draws[i], c = CARD[d.id], or = d.rev ? c.rv : c.up, z = document.createElement('div'); z.className = 'tz-zoom';
    z.innerHTML = `<div class="z${d.rev ? ' rev' : ''}">${faceHTML(c, o.artBase)}</div><p>${esc(c.n)}(${d.rev ? '逆位置' : '正位置'})<br><span style="font:italic 14px Georgia,serif;color:#ffd76a">${esc(c.en)}</span></p><p style="font-weight:400;font-size:14px">${esc(or.m)}</p>`;
    z.onclick = () => z.remove(); el.appendChild(z);
  }
  function startDeck() {
    const ids = CARDS.map(c => c.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = rnd(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    S.deck = ids.map(id => ({ id, rev: rnd(1000) < REV_RATE * 1000 }));
  }

  el.addEventListener('click', e => {
    const t = e.target.closest('[data-a],[data-sp],[data-th],[data-cut],[data-pk],[data-op],[data-h],[data-zm],[data-say]'); if (!t) return;
    const a = t.dataset.a;
    if (t.dataset.say) return speak(t.dataset.say);
    if (t.dataset.zm != null) return zoom(+t.dataset.zm);
    if (t.dataset.sp) { S.sp = t.dataset.sp; S.step = 'theme'; return draw(); }
    if (t.dataset.th) { S.q = (el.querySelector('.tz-q') || {}).value || S.q; S.theme = t.dataset.th; return draw(); }
    if (t.dataset.cut != null) {   // えらんだ山を上に
      const k = +t.dataset.cut, n = Math.floor(S.deck.length / 3), parts = [S.deck.slice(0, n), S.deck.slice(n, n * 2), S.deck.slice(n * 2)];
      S.deck = [parts[k], ...parts.filter((_, i) => i !== k)].flat(); S.step = 'pick'; return draw();
    }
    if (t.dataset.pk != null) {
      const i = +t.dataset.pk, n = SPREADS[S.sp].pos.length; if (S.picked.includes(i) || S.picked.length >= n) return;
      S.picked.push(i); t.classList.add('gone'); el.querySelector('.tz-c[style*="font-size:16px"]').textContent = `${S.picked.length} / ${n}`;
      if (S.picked.length >= n) { S.draws = S.picked.map(k => S.deck[k]); S.draws.forEach(d => { const im = new Image(); im.src = o.artBase + d.id + '.webp'; }); S.opened = new Set(); setTimeout(() => { S.step = 'spread'; draw(); }, 450); }
      return;
    }
    if (t.dataset.op != null) return openCard(+t.dataset.op);
    if (t.dataset.h != null) {   // 記録を見る
      const h = st.hist[+t.dataset.h]; if (!h) return;
      Object.assign(S, { sp: h.sp, theme: h.th, q: h.q || '', draws: h.d.map(([id, r]) => ({ id, rev: !!r })), ai: h.ai || '', aiTr: h.tr || '', aiState: h.ai ? 'done' : '', step: 'spread', t: h.t });
      S.opened = new Set(S.draws.map((_, i) => i)); return draw();
    }
    if (a === 'exit') return o.onExit && o.onExit();
    if (a === 'menu') { S.step = 'menu'; return draw(); }
    if (a === 'hist') { S.step = 'hist'; return draw(); }
    if (a === 'pack') return buyPack();
    if (a === 'again') { S.step = 'theme'; S.aiState = ''; return draw(); }
    if (a === 'go') {
      S.q = ((el.querySelector('.tz-q') || {}).value || '').trim().slice(0, 80);
      const how = pay(); if (!how) return;
      if (how === 'free') toast('きょうは、お代はいらないわ');
      startDeck(); S.shuffles = 0; S.picked = []; S.aiState = ''; S.ai = S.aiTr = ''; S.step = 'shuffle'; return draw();
    }
    if (a === 'mix') {
      const d = el.querySelector('.tz-deck'); d.classList.remove('sh'); void d.offsetWidth; d.classList.add('sh');
      startDeck(); S.shuffles++; try { ctx.audio && ctx.audio.play && ctx.audio.play('tap'); } catch (e) { }
      const nt = el.querySelector('.tz-nt'); if (nt) nt.textContent = `山をタップしてシャッフル(${S.shuffles}回)。いいと思ったところで止めてね。`;
      el.querySelector('[data-a="cutgo"]').disabled = false; return;
    }
    if (a === 'cutgo') { S.step = 'cut'; return draw(); }
    if (a === 'openall') { S.draws.forEach((_, i) => { if (!S.opened.has(i)) setTimeout(() => openCard(i), i * 160); }); return; }
  });
  el.addEventListener('input', e => { if (e.target.classList.contains('tz-q')) S.q = e.target.value; });
  draw();
  return { el, unmount() { el.remove(); } };
}
