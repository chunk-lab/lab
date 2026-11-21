// 潮見さん「釣れなくてもいいのさ」。英語の釣り堀の説明。家に帰ると、水槽に潮見さんからの魚。次の日、お礼にいくとオカリナ。
const P = Math.PI;
export async function sunaStory(d, ctx = {}) {
  const S = 'suna', me = (ctx.name && ctx.name()) || 'あなた';
  const pondCam = () => d.cam(55, 3.0, 25.5, 46.8, 1.0, 23.2);
  await d.fade(true, 0.01);
  d.only(['suna']);
  d.hour(10); d.wx('sun', 'snap');
  d.place(S, 46, 22.6, P); d.place('me', -60, 40, 0);
  d.shot(S, null, { yaw: 2.4, dist: 7, h: 2.4, look: 1.0 });
  await d.title('潮見さん', '釣れなくてもいいのさ');
  await d.fade(false, 1.2);
  await d.say('narr', '池のほとり。\n潮見さんが、アヒルをながめながら 釣り糸をたれている。');
  d.place('me', 48.2, 24.6, -P * 0.75); d.face('me', S); d.face(S, 'me');
  pondCam();
  await d.say('me', '「はじめまして」');
  await d.say(S, '「やあ。ここは、のんびりするには いい場所さ」');
  await d.say('me', '「何が釣れるの？」');
  await d.say(S, '「さあな。きょうは、まだ何も」');
  await d.say(S, '「やってみるかい？ 竿なら、貸してやるさ」');
  await d.say(S, '「この池は、英語の釣り堀にもなってる。\n単語の問題に答えると、魚が寄ってくるのさ」');
  await d.say('narr', '英語の釣り堀で、1匹釣ってみよう。\n釣れたら、物語にもどります。');
  await d.app('fishing', { tab: 'en', story: true });
  pondCam();
  await d.say(S, '「やるじゃないか。最初の一匹は、忘れられないもんさ」');
  await d.say(S, '「釣った魚は、家の水槽で育てられる。\nえさは、英語の問題に答えるとできるのさ」');
  // ---- 夕方 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(17.3); d.caption('夕方');
  pondCam();
  await d.fade(false, 0.9);
  await d.say('narr', '夕方。\n潮見さんの竿は、きょうも ぴくりとも動かなかった。');
  d.caption('');
  await d.say('me', '「潮見さん、釣れなくていいの？」');
  await d.say(S, '「釣れるかどうかじゃなく、\n釣りができる この時間が、とても贅沢なのさ」');
  // ---- 家の水槽 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.giftFish('funa', 3, true);
  await d.say('narr', 'その夜。家に帰って 水槽をのぞくと……');
  await d.say('narr', '自分の釣った魚のほかに、\n見覚えのない、大きなフナが3匹。');
  await d.say('narr', 'そばに、小さなメモ。\n「育ちきった魚を3匹そろえると、合成できるのさ。\n(育てないと、合成はできないよ)」');
  await d.say('narr', '……潮見さんは、釣れなかったんじゃない。\n釣った魚を、ぜんぶ こっちに くれていたのだ。');
  await d.say('narr', '水槽で、えさやりと合成をやってみよう。\n終わると、物語にもどります。');
  await d.app('fishing', { tab: 'tank', storyAq: true });
  // ---- 次の日 ----
  d.hideBox(); await d.fade(true, 0.6);
  d.hour(10); d.caption('次の日');
  d.place(S, 46, 22.6, P); d.place('me', 48.2, 24.6, -P * 0.75); d.face('me', S);
  pondCam();
  await d.fade(false, 0.9);
  d.caption('');
  await d.say('me', '「潮見さん。魚、ありがとうございました」');
  d.face(S, 'me');
  await d.say(S, '「何のことかな？」');
  await d.say('me', '「水槽に入れてくれてましたよね？」');
  await d.say(S, '「さぁ、そんなこともあったかな？\nもう忘れたよ」');
  d.hideBox(); d.music();
  d.shot(S, null, { yaw: 2.2, dist: 4.2, h: 1.6, look: 1.2 });
  await d.say('narr', '潮見さんは、おもむろにオカリナを取り出して、\nやさしい曲を 吹きはじめた。', { auto: 4.0 });
  await d.friend(S, 5);
  await d.endCard('潮見さん「釣れなくてもいいのさ」', 'おしまい');
}
