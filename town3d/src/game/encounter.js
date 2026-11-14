/* エンカウント英語クイズ: 住人が近づいてきて「クイズ、いい?」と聞く。
   受ける→4択(英語→日本語)。正解で好感度+、ことわると好感度−、まちがえても減らない。
   問題は opt.quizSet()(本体側:その人のレベルに近い単語+まちがえた単語)から取る。 */
import { social } from './social.js';

export const ENC = { win: 4, lose: -2, cool: [120, 240] };   // 好感度の増減、つぎのエンカウントまでの秒数(下限・上限)

const cut = t => String(t || '').split(/[、,;;／\/]/).map(x => x.trim()).filter(Boolean);
const ja1 = t => (cut(t)[0] || '').replace(/[((][^))]*[))]/g, '').trim();
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function createEncounter(env) {   // env: { hud, opt, hold(r), logWord(en,ja), say(r) }
  let cache = [], loading = false;
  const refill = async () => {
    if (loading || !env.opt.quizSet) return; loading = true;
    try { const s = await env.opt.quizSet(); if (Array.isArray(s)) cache = s.filter(w => w && w.en && ja1(w.ja)); } catch (e) { }
    loading = false;
  };
  function makeQ() {
    if (cache.length < 4) return null;
    const miss = cache.filter(w => w.from === 'missed'), pool = miss.length && Math.random() < 0.5 ? miss : cache;
    const w = pool[Math.floor(Math.random() * pool.length)], ans = ja1(w.ja);
    const wrong = shuffle(cache.filter(x => x !== w && ja1(x.ja) !== ans && x.en.toLowerCase() !== w.en.toLowerCase())).slice(0, 3).map(x => ja1(x.ja));
    if (wrong.length < 3) return null;
    return { w, ans, opts: shuffle([ans, ...wrong]) };
  }
  const heart = (r, n) => {   // 好感度を動かして、上がったらひと言
    const res = social.addAff(r.def.id, n);
    if (res.up) env.hud.toast(`💗 ${r.def.name}と、${['しりあい', 'なかよし', 'ともだち', 'しんゆう', 'だいすき'][res.after]}になった!`);
    return res;
  };
  const end = (r, text, choices) => { env.hold(r); env.hud.dialog({ name: r.def.name, role: r.def.role, text, choices: choices || [{ label: 'またね', fn: () => { } }] }); };
  function quiz(r) {
    const q = makeQ(); if (!q) return end(r, 'あれ、問題を忘れちゃった。また今度ね!');
    env.hold(r);
    env.hud.dialog({
      name: r.def.name, role: r.def.role, text: `「${q.w.en}」って、どういう意味?`,
      choices: q.opts.map(o => ({
        label: o, fn: () => {
          if (o === q.ans) { heart(r, ENC.win); end(r, `せいかい! ✨ すごい!\n「${q.w.en}」=${q.ans}\n(なかよし度 +${ENC.win})`, [{ label: 'もう1問!', fn: () => quiz(r) }, { label: 'ありがとう', fn: () => { } }]); }
          else { env.logWord(q.w.en, q.ans, 'word', 'encounter'); end(r, `ざんねん…\n「${q.w.en}」=${q.ans}\nつぎは、きっとできるよ!`, [{ label: 'もう1問!', fn: () => quiz(r) }, { label: 'またね', fn: () => { } }]); }
        }
      }))
    });
    refill();
  }
  return {
    ready: () => cache.length >= 4,
    warm: refill,
    ask(r) {   // 近づいてきて、聞く(受ける/ことわる)
      env.hold(r);
      env.hud.dialog({
        name: r.def.name, role: r.def.role, text: ['ちょっと待って! 英語クイズ、出していい?', 'あっ、いたいた! 1問だけ、クイズ出していい?', 'ねえねえ、英語の問題、解いてみない?'][Math.floor(Math.random() * 3)],
        choices: [{ label: '⚔ 受ける!', fn: () => quiz(r) }, { label: 'ことわる', fn: () => { const x = heart(r, ENC.lose); end(r, 'そっか…。また今度ね。', [{ label: 'ごめんね', fn: () => { } }]); } }]
      });
    },
  };
}
