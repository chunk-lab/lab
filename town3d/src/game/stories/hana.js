// はな「Two Umbrellas」。映画館デート(長文ストリームで映画を見る)→外は雨→相合い傘→チャンクくんが雲の傘に。
const P = Math.PI;
export async function hanaStory(d, ctx = {}) {
  const H = 'hana', C = 'chunkkun', me = (ctx.name && ctx.name()) || 'あなた';
  const two = () => d.shot('me', H, { yaw: 1.4, dist: 6.5, h: 2.2, look: 1.0 });
  await d.fade(true, 0.01);
  d.only(['hana', 'chunkkun']);
  d.hour(13); d.wx('sun', 'snap');
  // ---- 映画館の前 ----
  d.place(H, 3.6, 46.8, -P / 2); d.place('me', -60, 40, 0); d.place(C, 60, 60, 0);
  d.shot(H, null, { yaw: 1.6, dist: 6, h: 2.2, look: 1.0 });
  await d.title('はな', 'Two Umbrellas');
  await d.fade(false, 1.2);
  await d.say('narr', 'お休みの日。映画館の前。');
  await d.say(H, '「あ、来た来た！ こっちだよ〜！」');
  d.place('me', 3.6, 49.2, P); d.face('me', H); d.face(H, 'me');
  two();
  await d.say(H, '「今日の映画、ずっと 楽しみにしてたんだ！\n"Two Umbrellas"っていう、英語の映画なんだよ」');
  await d.say('me', '「英語の映画……わかるかな」');
  await d.say(H, '「だいじょうぶ！ この映画館はね、\n"Storyミング"っていう見かたが できるの」');
  await d.say(H, '「ひとつのお話を、少しずつ 覚えながら見ていくんだよ。\nステージは4つ。始まったら、説明が出るからね！」');
  await d.say(H, '「さ、入ろ入ろ！」');
  d.hideBox(); await d.fade(true, 0.7);
  await d.game('stream', { passage: 'umb1', run: true, coach: true, closeOn: ['done'], closeDelay: 4000 });
  // ---- 映画のあと:雨 ----
  d.hour(16.5); d.wx('rain', 'snap');
  d.place(H, 3.6, 47.4, P / 2); d.place('me', 3.6, 48.8, P / 2); d.face(H, 'me'); d.face('me', H);
  two();
  await d.fade(false, 0.9);
  await d.say('narr', '映画館を出ると……雨が 降っていた。');
  await d.say(H, '「……いいお話 だったね」');
  await d.say(H, '「あの男の子、ほんとに 帰ってきたのかなぁ……」');
  const a = await d.choose('me', `${me}は……`, ['「きっと、帰ってきたよ」', '「どうだろうね」']);
  await d.say(H, a === 0 ? '「……うん。そうだよね。そうだといいな」' : '「もう〜！ そこは"きっと"って言うところだよ〜」');
  await d.say(H, '「あっ……。傘、1本しか 持ってきてない……」');
  await d.say(H, '「……じゃあ、いっしょに 入ろっか」');
  await d.say('narr', '1本の傘に、ふたりで入る。\n肩が、少しだけ ふれた。');
  await d.say(H, '「なんだか、映画みたいだね……」');
  // ---- チャンクくん ----
  d.place(C, 3.6, 48.1, P / 2); d.set(C, { y: 3.0, bob: 0.06 }); d.scale(C, 0.6, true);
  d.puff(3.6, 2.8, 48.1, 14, 1.4);
  d.scale(C, 2.4, false);   // ふたりを おおう、傘の大きさ(最後まで このまま)
  d.shot('me', H, { yaw: 1.4, dist: 8, h: 2.6, look: 1.8 });
  await d.say(C, '「もちもち〜！」');
  await d.say('narr', 'チャンクくんが、ふたりの上で ぷくーっと ふくらんだ。\n……雲の傘だ。');
  await d.say(H, '「……あはは。チャンクくん、ありがとう」');
  await d.say(H, '(……もう。いいところ だったのに〜)');
  await d.friend(H, 5);
  await d.endCard('はな「Two Umbrellas」', 'おしまい');
}
