// スポーツ(ゴルフ・フリスビー)で、1ホールごとにもらえる英語の表現(句動詞・慣用句)。
//   [英語, 意味, 例文, 例文の意味]  日付でえらぶ(その日は誰でも同じ5つ)。数を足すだけで増やせる。
const GOLF = [
  ['tee off', 'スタートする・打ちはじめる', "Let's tee off at nine.", '9時にスタートしよう。'],
  ['par for the course', 'よくあること・ふつう', 'Being late is par for the course for him.', '彼が遅れるのはいつものことだ。'],
  ['hit the ground running', '最初から全力で動き出す', 'She hit the ground running in her new job.', '彼女は新しい仕事で最初から全力で動いた。'],
  ['get the ball rolling', '(物事を)始める', "Let's get the ball rolling with a quick idea.", 'まず簡単な案から始めよう。'],
  ['take a swing at', '〜に挑戦してみる', "I'll take a swing at the new project.", '新しい企画にやってみるよ。'],
  ['in the rough', '苦しい状況で', 'Our plan is in the rough right now.', '私たちの計画は今ちょっと苦しい。'],
  ['a hole in one', '一発で大成功', 'That idea was a hole in one.', 'そのアイデアは一発で大成功だった。'],
  ['level the playing field', '条件を平等にする', 'New rules level the playing field.', '新しいルールで条件が平等になる。'],
  ['up to par', '基準に達している', "This work isn't up to par yet.", 'この作品はまだ基準に届いていない。'],
  ['keep your eye on the ball', '目標から目をそらさない', 'Keep your eye on the ball and finish today.', '目標を見失わず、今日終わらせよう。'],
  ['play through', '(困難でも)やり抜く', "She played through the pain.", '彼女は痛みをこらえてやり抜いた。'],
  ['get back on track', '調子を取りもどす', "Let's get back on track after lunch.", '昼食のあとは調子を取りもどそう。'],
];
const DISC = [
  ['throw in the towel', '降参する・あきらめる', "I won't throw in the towel yet.", 'まだあきらめないよ。'],
  ['catch on', '理解する・流行る', 'She caught on to the rules quickly.', '彼女はルールをすぐ理解した。'],
  ['pick up', '拾う・身につける', 'I picked up the disc and threw it again.', '円盤を拾ってもう一度投げた。'],
  ['go with the flow', '流れにまかせる', "The wind is strong, so go with the flow.", '風が強いから流れにまかせよう。'],
  ['give it a shot', 'ためしにやってみる', "Give it a shot, you'll like it.", 'やってみなよ、きっと気に入るよ。'],
  ['out of reach', '手が届かない', 'The goal was out of reach this time.', '今回はゴールに届かなかった。'],
  ['on target', '狙いどおり', 'Your throw was right on target.', '投げ方はぴったり狙いどおりだった。'],
  ['fly off', '飛んでいく', 'The disc flew off to the left.', '円盤は左へ飛んでいった。'],
  ['work out', 'うまくいく・運動する', "It didn't work out the first time.", '1回目はうまくいかなかった。'],
  ['bounce back', '立ち直る', "He bounced back after a bad throw.", '彼は悪い投げのあとで立ち直った。'],
  ['cut it close', 'ぎりぎりになる', 'We cut it close, but we made it.', 'ぎりぎりだったけど間に合った。'],
  ['stay on course', '進路を保つ', 'Stay on course and keep going.', '進路を保ってそのまま進もう。'],
];
function rng(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function holeExpr(kind, key, i) {
  const L = (kind === 'golf' ? GOLF : DISC).slice(), r = rng('expr:' + kind + ':' + key);
  for (let k = L.length - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [L[k], L[j]] = [L[j], L[k]]; }
  const [en, ja, ex, exja] = L[i % L.length]; return { en, ja, ex, exja };
}
