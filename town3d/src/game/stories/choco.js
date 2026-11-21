// 大喜利チョコ「勝っても負けても」。選択で大喜利 → 勝っても負けても買い物 → マージ。
const P = Math.PI;
const ODAI = [
  { q: 'お題：こんなお餅はいやだ。どんなお餅？', a: [['「ふわふわで、空に浮いてる」', 2], ['「しゃべる」', 1], ['「かたい」', 0]], mine: ['「のびすぎて、となり町まで行く」', 2] },
  { q: 'お題：図書館で、いちばん言ってはいけないひと言は？', a: [['「この本の犯人、言うてええ？」', 2], ['(大声で)「静かにして！」', 1], ['「本、きらい」', 0]], mine: ['「返却期限？ 知らんなぁ」', 1] },
  { q: 'お題：ハッタリ男爵の、ほんとうの特技は？', a: [['「ハッタリが、たまに本当になる」', 2], ['「ハッタリ」', 1], ['「料理」', 0]], mine: ['「声が大きい」', 1] },
];
const LAUGH = ['……しーん。', 'くすっと、笑いがもれた。', 'どっと、笑いが起きた！'];
export async function chocoStory(d, ctx = {}) {
  const C = 'choco', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['choco', 'mii', 'maru', 'baron']);
  d.hour(12); d.wx('sun', 'snap');
  d.place(C, 2, 6, P * 0.8); d.place('me', -60, 40, 0);
  d.place('mii', -2.6, 9.6, P * 0.7); d.place('maru', 5.6, 9.2, -P * 0.7);
  d.shot(C, null, { yaw: 0.8, dist: 6, h: 2.2, look: 1.0 });
  await d.title('大喜利チョコ', '勝っても負けても');
  await d.fade(false, 1.2);
  await d.say('narr', '昼のほし広場。\n大喜利チョコが、ネタ帳をにらんでいる。');
  d.place('me', 3.8, 8.6, P); d.face('me', C); d.face(C, 'me');
  d.shot('me', C, { yaw: 1.1, dist: 5, h: 2.0, look: 1.0 });
  await d.say('me', '「はじめまして」');
  await d.say(C, '「お、新入りやん。ちょうどええわ」');
  await d.say(C, '「なあ、大喜利で勝負せえへん？ 3問や。\nミイちゃんとマルさんを、たくさん笑わせたほうが勝ち」');
  await d.say(C, '「うちな、勝負のあとは、勝っても負けても 自分にごほうびすんねん。\n負けた日は、憂さ晴らしやけどな」');
  d.face('mii', C); d.face('maru', C);
  let you = 0, her = 0;
  for (const o of ODAI) {
    const c = await d.choose('me', o.q, o.a.map(x => x[0]));
    const pt = o.a[c][1]; you += pt;
    await d.say('narr', LAUGH[pt]);
    await d.say(C, `${o.mine[0]}`);
    her += o.mine[1];
    await d.say('narr', LAUGH[o.mine[1]]);
  }
  const res = you > her ? 'win' : you < her ? 'lose' : 'draw';
  if (res === 'win') await d.say(C, '「……くっ、負けた。やるやん、あんた。\n……こういう日は、憂さ晴らしや！」');
  else if (res === 'lose') await d.say(C, '「よっしゃ、うちの勝ち！ ごほうびの時間や！」');
  else await d.say(C, '「引き分けか……。ほな、ごほうびと憂さ晴らし、両方や！」');
  await d.say(C, '「うちのごほうびは、これ。マージや。\nいろんなもん くっつけて、ええもんにしていくねん。あんたも、やってみ」');
  await d.say('narr', '閉じると、物語にもどります。');
  await d.app('merge', { coach: 'choco', coachName: '大喜利チョコ' });
  d.face(C, 'me');
  d.shot('me', C, { yaw: 1.1, dist: 5, h: 2.0, look: 1.0 });
  await d.say(C, '「な？ くせになるやろ」');
  // ---- おわり ----
  d.hideBox(); await d.fade(true, 0.8);
  d.hour(17.5); d.place('me', -60, 40, 0);
  d.place('baron', -3.6, 25, P / 2); d.place(C, -1.2, 24.8, -P / 2); d.face('baron', C);
  d.shot(C, 'baron', { dist: 4.6, h: 1.9, look: 0.9, side: 1 });
  await d.fade(false, 0.8);
  await d.say(C, '「なあ男爵、大喜利で勝負せえへん？」');
  await d.say('baron', '「ふはは！ 受けて立とうではないか！」');
  await d.say('narr', '今日も大喜利チョコは、だれかに大喜利を挑んでいる。');
  await d.friend(C, 5);
  await d.endCard('大喜利チョコ「勝っても負けても」', 'おしまい');
}
