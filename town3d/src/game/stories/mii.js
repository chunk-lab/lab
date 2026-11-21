// ミイ「たまには息抜き」。カフェの説明。世話焼きお姉さんのミイに、休みの日に連れ出される。
const P = Math.PI;
export async function miiStory(d, ctx = {}) {
  const M = 'mii', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['mii', 'hana', 'sora']);
  d.hour(15); d.wx('sun', 'snap');
  // ---- カフェの前 ----
  d.place(M, -3.6, 47.4, P / 2); d.place('me', -60, 40, 0);
  d.shot(M, null, { yaw: 1.2, dist: 6, h: 2.2, look: 1.0 });
  await d.title('ミイ', 'たまには息抜き');
  await d.fade(false, 1.2);
  await d.say('narr', '昼下がりのカフェ。\nミイが、店の前の花に水をやっている。');
  d.place('me', -0.8, 47.4, -P / 2); d.face('me', M); d.face(M, 'me');
  d.shot('me', M, { dist: 4.6, h: 1.9, look: 1.0, side: -1 });
  await d.say('me', '「はじめまして」');
  await d.say(M, '「あら、新しく来た子ね。いらっしゃい。\nここは、町のみんなが集まるカフェよ」');
  await d.say(M, '「お菓子や飲みもの、おみやげも買えるわ。\n町のだれかにプレゼントすると、きっと喜ばれるわよ」');
  await d.say(M, '「好きなものをあげると、とっても喜ぶの。\nだれが何を好きか、話しながら探してみてね」');
  const a = await d.choose('me', `${me}は……`, ['「中を見てもいい？」', '「また今度来るね」']);
  if (a === 0) {
    await d.say(M, '「もちろん。ゆっくり見ていって」');
    await d.say('narr', 'カフェの中を見てみよう。\n閉じると、物語にもどります。');
    await d.app('cafe');
    d.shot('me', M, { dist: 4.6, h: 1.9, look: 1.0, side: -1 });
  }
  await d.say(M, '「それと……ここ、デートで来る人も多いのよ」');
  await d.say(M, '「いつか、あなたに恋人ができたら、連れてきたら良いわよ」');
  await d.say('narr', 'ミイが、ぱちんとウインクした。');
  await d.say(M, '「で、あなたは ふだん何してるの？」');
  await d.say('me', '「英語の勉強で、けっこう いそがしくて……」');
  await d.say(M, '「え〜、勉強ばかりしてるの？\nたまには息抜きしないと！」');
  await d.say(M, '「決めた。次のお休みの日、わたしに付き合いなさい」');
  const b = await d.choose('me', `${me}は……`, ['「えっ、でも勉強が……」', '「……はい」']);
  await d.say(M, b === 0 ? '「だめ。もう決めたの」' : '「よろしい」');
  // ---- 次の休みの日 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(11); d.caption('次のお休みの日');
  d.place(M, 3.2, 9.4, P); d.place('me', 1.6, 9.4, P);
  d.shot('me', M, { yaw: 0.2, dist: 6, h: 2.2, look: 1.0 });
  await d.fade(false, 0.9);
  await d.say(M, '「さあ、行くわよ！ 今日は、英語のことは忘れなさい」');
  d.caption('');
  d.hideBox();
  const w1 = d.walk(M, 6, -2, 1.8), w2 = d.walk('me', 4.6, -2.4, 1.8);
  d.shot('me', M, { yaw: 1.6, dist: 7, h: 2.4, look: 1.0, snap: false });
  await d.say('narr', '噴水のまわりを歩いて、', { auto: 1.0 });
  await w1; await w2;
  d.place(M, -3.4, 46.4, -P / 2); d.place('me', -1.8, 47.4, -P / 2);
  d.face(M, 'me'); d.face('me', M);
  d.shot('me', M, { dist: 4.6, h: 1.9, look: 1.0, side: -1 });
  await d.say('narr', 'カフェで、ケーキを食べて、', { auto: 1.2 });
  d.place(M, 41, 24, 0); d.place('me', 42.6, 24, 0);
  d.shot('me', M, { yaw: 3.0, dist: 6, h: 2.2, look: 1.0 });
  await d.say('narr', '公園で、ひなたぼっこをした。', { auto: 1.2 });
  await d.say(M, '「どう？ たまには、こういう日も悪くないでしょ？」');
  const c = await d.choose('me', `${me}は……`, ['「うん、楽しかった」', '「……明日は勉強するね」']);
  await d.say(M, c === 0 ? '「でしょう？ また、連れ出してあげる」' : '「ふふ、まじめね。\nでも、またサボらせに来るから覚悟しなさい」');
  await d.friend(M, 5);
  await d.endCard('ミイ「たまには息抜き」', 'おしまい');
}
