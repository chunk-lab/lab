// ゆず「何歳に見えますか？」。雨の神社。ゆずは大人(背が小さいので子どもに見られるのを気にしている)。
const P = Math.PI;
export async function yuzuStory(d, ctx = {}) {
  const Y = 'yuzu', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['yuzu', 'hana', 'sora', 'chunkkun', 'mii', 'maru', 'gon']);
  d.hour(10); d.wx('rain', 'snap');
  d.place(Y, -43.6, -20.6, P); d.place('me', -60, 40, 0);
  d.shot(Y, null, { yaw: -0.6, dist: 6.5, h: 2.4, look: 1.0 });
  await d.title('ゆず', '何歳に見えますか？');
  await d.fade(false, 1.2);
  await d.say('narr', '雨のほしみや神社。\n小さな巫女さんが、おみくじを結んでいる。');
  await d.say(Y, '「よいしょ……よいしょ……。\nうう、上のほうは、とどかないのです……」');
  await d.say(Y, '「凶のおみくじは、ここに結んでおけば、いいことに変わるのです。\nおさいせん箱の前で おまいりすると、だれでも引けるのですよ」');
  // あいさつ(歩いてこない)
  d.place('me', -43.6, -17.4, P); d.face(Y, 'me'); d.face('me', Y);
  d.shot('me', Y, { yaw: -1.5, dist: 5, h: 2.0, look: 0.9 });
  await d.say('me', '「はじめまして」');
  await d.say(Y, '「わっ、はじめまして！ ゆずと申します。\nこの神社で、巫女のおつとめをしているのです」');
  await d.say('me', '「そんなに若いのに、えらいね」');
  await d.say(Y, '「……えっ」');
  await d.say(Y, '「……わたし、何歳に見えますか？」');
  const a = await d.choose('me', `${me}は……`, ['「10歳くらい？」', '「中学生？」', '「……20歳以上？」']);
  if (a === 0) {
    await d.say('narr', 'ゆずのほっぺたが、おもちみたいに ぷくーっとふくらんだ。');
    await d.say(Y, '「ゆずは、おとななのです！ ちゃんとした、おとななのですっ！」');
  } else if (a === 1) {
    await d.say('narr', 'ゆずは、目に見えて しょんぼりした。');
    await d.say(Y, '「ちゅ、中学生……。せめて、高校生と……。\nいえ、それもちがうのですけど……」');
  } else {
    await d.say('narr', 'ゆずの顔が、ぱあっとかがやいた。');
    await d.say(Y, '「そうなのです！ わかる人には、わかるのです！」');
    await d.say(Y, '「……でも今、ちょっと考えましたよね？」');
  }
  await d.say(Y, '「みんな、ゆずを子どもあつかいするのです。\n背が、ちょっとちっちゃいだけなのに……」');
  await d.say(Y, '「それにしても、よく降りますね。\n……ちょっとだけ、晴らしてみましょうか」');
  await d.say('me', '「えっ？」');
  await d.say(Y, '「ゆずは、少しのあいだだけ、お天気をお願いできるのです」');
  d.face(Y, P); d.shot(Y, null, { yaw: -0.4, dist: 5.5, h: 1.6, look: 1.2 });
  await d.say(Y, '「お天道さま、お天道さま……。\nどうか、少しだけ 顔を見せてくださいな」');
  d.hideBox(); d.wx('sun', true);
  d.shot('me', Y, { yaw: -1.5, dist: 9, h: 3.2, look: 2.0, snap: false });
  await d.wait(2.6);
  await d.say('narr', '雨が、やんだ。\n雲のすきまから、光がさしこんでくる。');
  d.face(Y, 'me');
  await d.say('me', '「すごい……！」');
  await d.say(Y, '「えっへん、なのです」');
  d.hideBox(); await d.wait(1.0); d.wx('rain', true); await d.wait(1.8);
  await d.say('narr', '……ぽつ、ぽつ。');
  await d.say(Y, '「あ……。少しの時間しか、効き目がないんですけどね」');
  await d.say(Y, '「なかよくなったら、あなたのためにも お願いしてあげるのです」');
  await d.friend(Y, 5);

  // ---- 雨上がりの虹 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(15); d.place('me', -60, 40, 0);
  d.place('hana', -2.5, 10, 0); d.place('sora', -0.5, 10.6, 0); d.place('chunkkun', 1.6, 10.2, 0); d.place('mii', -4.6, 9.2, 0); d.place('maru', 3.8, 9.4, 0); d.place('gon', 5.6, 8.6, 0);
  d.rainbow(70);
  d.faceSky(['hana', 'sora', 'chunkkun', 'mii', 'maru', 'gon'], 'rain');
  d.shot('sora', null, { sky: 'rain', dist: 9 });
  await d.fade(false, 1.0);
  await d.wait(1.0);
  await d.say('narr', '夕方。雨があがった。');
  await d.say('hana', '「あっ、見て！ 虹！」');
  await d.say('chunkkun', '「ふわ〜〜……」');
  await d.say('narr', '町のみんなが、同じ空を見上げていた。');
  d.place(Y, -43.6, -20.6, 0); d.faceSky([Y], 'rain');
  d.shot(Y, null, { sky: 'rain', dist: 6 });
  await d.say(Y, '「今日も、いい日になりそうなのです」');
  await d.endCard('ゆず「何歳に見えますか？」', 'おしまい');
}
