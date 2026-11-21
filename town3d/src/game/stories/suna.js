// 潮見さん「釣れなくてもいいのさ」。英語の釣り堀の説明役。オカリナ・アヒル・のんびり。
const P = Math.PI;
export async function sunaStory(d, ctx = {}) {
  const S = 'suna', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['suna']);
  d.hour(10); d.wx('sun', 'snap');
  d.place(S, 46, 22.6, P); d.place('me', -60, 40, 0);
  d.shot(S, null, { yaw: 2.4, dist: 7, h: 2.4, look: 1.0 });
  await d.title('潮見さん', '釣れなくてもいいのさ');
  await d.fade(false, 1.2);
  await d.say('narr', '池のほとり。\n潮見さんが、アヒルをながめながら 釣り糸をたれている。');
  d.place('me', 48.2, 24.6, -P * 0.75); d.face('me', S);
  d.cam(55, 3.0, 25.5, 46.8, 1.0, 23.2);
  await d.say('me', '「はじめまして」');
  d.face(S, 'me');
  await d.say(S, '「やあ。ここは、のんびりするには いい場所さ」');
  await d.say('me', '「何が釣れるの？」');
  await d.say(S, '「さあな。きょうは、まだ何も」');
  await d.say(S, '「やってみるかい？ 竿なら、貸してやるさ」');
  const a = await d.choose('me', `${me}は……`, ['「やってみる」', '「見てるだけでいいよ」']);
  if (a === 1) await d.say(S, '「そう言わずに。一匹くらい、手ごたえを知っておくといいさ」');
  await d.say(S, '「その前に……」');
  d.hideBox(); d.music();
  d.shot(S, null, { yaw: 2.2, dist: 4.2, h: 1.6, look: 1.2 });
  await d.say('narr', '潮見さんが、オカリナを吹いた。\nやさしい音が、水面をわたっていく。', { auto: 3.0 });
  d.face(S, 'me'); d.cam(55, 3.0, 25.5, 46.8, 1.0, 23.2);
  await d.say(S, '「魚も、いい音が好きなのさ」');
  await d.say(S, '「この池は、英語の釣り堀にもなってる。\n単語の問題に答えると、魚が寄ってくるのさ」');
  await d.say('narr', '英語の釣り堀で、1匹釣ってみよう。\n釣れたら、物語にもどります。');
  await d.app('fishing', { tab: 'en', story: true });
  await d.say(S, '「やるじゃないか。最初の一匹は、忘れられないもんさ」');
  await d.say(S, '「その魚は、水槽に入れておいたさ。\n水槽で育てられる。えさは、英語の問題に答えるとできるのさ」');
  await d.say(S, '「毎日ちょっとずつ、な。\n水槽は、家でも、上の🐠からでも見られるさ」');
  // ---- 夕方 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(17.3); d.caption('夕方');
  d.place(S, 46, 22.6, P); d.place('me', 48.2, 24.6, -P * 0.75); d.face('me', S);
  d.cam(55.5, 3.4, 26, 46.8, 1.0, 23.2);
  await d.fade(false, 0.9);
  await d.say('narr', '夕方。\n潮見さんの竿は、きょうも ぴくりとも動かなかった。');
  d.caption('');
  await d.say('me', '「潮見さん、釣れなくていいの？」');
  d.face(S, 'me');
  await d.say(S, '「釣れるかどうかじゃなく、\n釣りができる この時間が、とても贅沢なのさ」');
  await d.friend(S, 5);
  await d.endCard('潮見さん「釣れなくてもいいのさ」', 'おしまい');
}
