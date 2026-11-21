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
  await d.say(M, '「あら、新しく来た方ですね〜。いらっしゃいませ。\nここは、町のみんなが集まるカフェなんですよ〜」');
  await d.say(M, '「お菓子や飲みもの、おみやげも買えますよ〜。\n町のだれかにプレゼントすると、きっと喜ばれますよ〜」');
  await d.say(M, '「好きなものをあげると、とっても喜ぶんです。\nだれが何を好きか、お話ししながら探してみてくださいね〜」');
  const a = await d.choose('me', `${me}は……`, ['「中を見てもいい？」', '「また今度来るね」']);
  if (a === 0) {
    await d.say(M, '「もちろんです〜。ゆっくり見ていってくださいね」');
    await d.say('narr', 'カフェの中を見てみよう。\nおみやげを1つ買うと、物語にもどります(見るだけなら、右上で閉じてね)。');
    await d.app('cafe', { story: true });
    d.shot('me', M, { dist: 4.6, h: 1.9, look: 1.0, side: -1 });
  }
  await d.say(M, '「それと……ここ、デートで来る人も多いんですよ〜」');
  await d.say(M, '「いつか、あなたに恋人ができたら、連れてきてくださいね〜」');
  await d.say('narr', 'ミイが、ぱちんとウインクした。');
  await d.say(M, '「ところで、あなたは ふだん何をしているんですか〜？」');
  await d.say('me', '「英語の勉強で、けっこう いそがしくて……」');
  await d.say(M, '「え〜、勉強ばかりしてるんですか〜？\nたまには息抜きしないと、だめですよ〜！」');
  await d.say(M, '「……よし！」');
  await d.say('narr', 'ミイが、ぽんと手をたたいた。');
  await d.say(M, '「決めました〜。次のお休みの日、わたしに付き合ってもらいますからね〜」');
  const b = await d.choose('me', `${me}は……`, ['「えっ、でも勉強が……」', '「……はい」']);
  await d.say(M, b === 0 ? '「だ〜め。もう決めちゃいました〜」' : '「ふふ、よろしい、です〜」');
  // ---- 次の休みの日 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(11); d.caption('次のお休みの日');
  d.place(M, 3.2, 9.4, P); d.place('me', 1.6, 9.4, P);
  d.shot('me', M, { yaw: 0.2, dist: 6, h: 2.2, look: 1.0 });
  await d.fade(false, 0.9);
  await d.say(M, '「さあ、行きますよ〜！ 今日は、英語のことは忘れてくださいね」');
  d.caption('');
  // ---- アミューズメントセンター ----
  d.hideBox(); await d.fade(true, 0.6);
  d.place(M, -3.4, 24.2, P / 2); d.place('me', -1.6, 25.6, -P / 2); d.face(M, 'me'); d.face('me', M);
  d.shot('me', M, { dist: 4.6, h: 1.9, look: 1.0, side: -1 });
  await d.fade(false, 0.6);
  await d.say(M, '「ここです〜、アミューズメントセンター。\nゲームがいっぱいあるんですよ〜」');
  await d.say(M, '「まずは、ボウリングで勝負です〜。手かげんは、しませんからね？」');
  await d.say('narr', 'ボウリングを1ゲーム。\n終わると、物語にもどります。');
  await d.app('amuse', { game: 'bowling', npc: 'mii', opts: { fr: 3 }, closeOnEnd: true });
  d.face(M, 'me'); d.shot('me', M, { dist: 4.6, h: 1.9, look: 1.0, side: -1 });
  await d.say(M, '「ふふ、楽しかったでしょう〜？」');
  await d.say(M, '「ほかにも、ゲームがたくさんあるんですよ〜。\nまた、いつでも遊びに来てくださいね」');
  await d.say(M, '「どうですか〜？ たまには、こういう日も悪くないでしょう？」');
  const c = await d.choose('me', `${me}は……`, ['「うん、楽しかった」', '「……明日は勉強するね」']);
  await d.say(M, c === 0 ? '「でしょう〜？ また、連れ出してあげますからね〜」' : '「ふふ、まじめですね〜。\nでも、また サボらせに来ますから、覚悟してくださいね〜」');
  await d.friend(M, 5);
  await d.endCard('ミイ「たまには息抜き」', 'おしまい');
}
