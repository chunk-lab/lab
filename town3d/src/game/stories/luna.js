// ルナ「なんでもお見通し」。来ることも答えも当てられる→お祝いのタロット→「素敵な人が現れる」でドギマギ→帰ったあと自嘲→神社のおみくじ「すでに近くにいる」→チャンクくん。
const P = Math.PI;
export async function lunaStory(d, ctx = {}) {
  const L = 'luna', C = 'chunkkun', me = (ctx.name && ctx.name()) || 'あなた';
  const two = () => d.shot('me', L, { yaw: 0.2, dist: 6.5, h: 2.2, look: 1.1 });
  await d.fade(true, 0.01);
  d.only(['luna', 'chunkkun']);
  d.hour(16); d.wx('sun', 'snap');
  // ---- 占いの館 ----
  d.place(L, -36.4, -21.4, P / 2); d.place('me', -60, 40, 0); d.place(C, 60, 60, 0);
  d.shot(L, null, { yaw: 1.2, dist: 5.5, h: 2.0, look: 1.2 });
  await d.title('ルナ', 'なんでもお見通し');
  await d.fade(false, 1.2);
  await d.say('narr', '占いの館を たずねると……\n入り口の前で、ルナが 待っていた。');
  d.place('me', -34.2, -20.6, -P / 2); d.face('me', L); d.face(L, 'me');
  two();
  await d.say(L, `「あなたが、うわさの ${me}ね」`);
  await d.say(L, '「今朝、この町の新人さんが ここに来るって 出ていたけれど……\n案外、遅かったのね」');
  await d.say('me', '「えっ、どうして それを……」');
  await d.say(L, '「ふふ。少し、当ててみましょうか」');
  // ---- 当てられる ----
  await d.say(L, '「あなたの好きな味。……答えは、この紙に 書いておいたわ」');
  const fav = ['甘いもの', 'からいもの', 'すっぱいもの'];
  const a = await d.choose('me', `${me}は……`, fav.map(x => `「${x}」`));
  await d.say('narr', `ルナが、伏せていた紙を めくると……\n「${fav[a]}」と書いてあった。`);
  await d.say('me', '「あ、当たってる……！」');
  await d.say(L, '「じゃあ、今朝 起きて いちばん最初にしたことは？」');
  const b = await d.choose('me', `${me}は……`, ['「あくび」', '「スマホを見た」', '「顔を洗った」']);
  await d.say(L, ['「あくび、でしょう？ 目が まだ少し 眠そうだもの」', '「スマホ、でしょう？ 親指が、まだ 画面をさがしているわ」', '「顔を洗った、でしょう？ 前髪が、少しだけ ぬれているもの」'][b]);
  await d.say('me', '「なんでも 分かるんですね！」');
  await d.say(L, '「……分かるのが、良いことばかりとも 限らないわよ」');
  await d.say('narr', 'ルナは、意味ありげに ほほえんだ。');
  await d.say(L, '「さて。この町に住むことになった お祝いに、\nタロットで 占ってあげるわ。今日は、お代はいらないわ」');
  await d.app('fortune', { storyTarot: true });
  two();
  await d.say(L, '「……あら？」');
  await d.say(L, '「あなたに、素敵な人が 現れるって 出てるわよ」');
  const c = await d.choose('me', `${me}は……`, ['「お姉さんでは、ダメですか？」', '「恋愛のアドバイスを ください」', '「どんな人ですか？」']);
  await d.say(L, ['「お、お、大人を からかっちゃ ダメよ！」', '「れ、恋愛は……自分で 切りひらくものよ！」', '「ど、どんな人って……\nそ、それは、カードに 聞きなさい！」'][c]);
  await d.say('narr', 'ルナの顔が、みるみる 赤くなっていく。');
  await d.say(L, '「きょ、今日の占いは ここまで！ またいらっしゃい！」');
  // ---- 帰ったあと ----
  d.hideBox(); await d.fade(true, 0.8);
  d.place('me', -60, 40, 0);
  d.shot(L, null, { yaw: 1.2, dist: 4.4, h: 1.8, look: 1.2 });
  d.caption(`${me}が 帰ったあと`);
  await d.fade(false, 0.8);
  await d.say(L, '「……はぁ。びっくりした……」');
  d.caption('');
  await d.say('narr', 'ルナは、両手で ほおを おさえた。');
  await d.say(L, '「恋愛なんて、したことも ないのに……。\nアドバイスなんて、できるわけ ないわよね」');
  await d.say('narr', 'ルナは、夕方の空を 見上げて、小さく ため息をついた。');
  // ---- 夕方の神社 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(17.3); d.caption('夕方');
  d.place(L, -44.6, -19.6, P); d.place(C, -36, -16.5, -P / 2);
  d.shot(L, null, { yaw: 0.5, dist: 6, h: 2.0, look: 1.2 });
  await d.fade(false, 0.9);
  await d.say('narr', '夕方の神社。');
  d.caption('');
  await d.say(L, '「……念のため。ほんの、念のためよ」');
  await d.say('narr', 'ルナは、こっそり おみくじを引いた。');
  d.note('恋愛 …… すでに 近くにいる', 'おみくじ');
  await d.say(L, '「す、すでに 近くに……？」');
  d.note('');
  d.walk(C, -52, -16.5, 1.4);
  d.shot(L, C, { yaw: 0.5, dist: 9, h: 2.4, look: 1.0 });
  await d.say(C, '「もちもち〜」');
  await d.say('narr', 'チャンクくんが、ふわふわと 通りすぎていった。');
  d.face(L, C);
  await d.say(L, '「…………」');
  await d.say(L, '「……まさかね」');
  await d.friend(L, 5);
  await d.endCard('ルナ「なんでもお見通し」', 'おしまい');
}
