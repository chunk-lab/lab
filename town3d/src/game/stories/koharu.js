// こはる先生「チャンクで読もう」。広場の英語のお知らせ→チャンクの説明→今スラ(さらさら・30秒チャレンジ)→ランキングに先生の名前→チャンクくん。
const P = Math.PI;
export async function koharuStory(d, ctx = {}) {
  const K = 'koharu', C = 'chunkkun', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['koharu', 'chunkkun']);
  d.hour(10); d.wx('sun', 'snap');
  // 広場の掲示板(-9.5,-9.5)の前。英語のお知らせが読めずに困っていると、こはる先生が通りかかる
  d.place('me', -8.0, -8.0, -3 * P / 4); d.place(K, 30, 30, 0); d.place(C, 60, 60, 0);
  d.shot('me', null, { yaw: P / 4 + 0.6, dist: 6, h: 2.2, look: 1.4 });
  await d.title('こはる先生', 'チャンクで読もう');
  await d.fade(false, 1.2);
  await d.say('narr', 'まちの広場。\n掲示板に、英語のお知らせが はってある。');
  await d.say('narr', 'The library will open a new reading room for children.');
  await d.say('me', '「うーん……長くて、よく分からない……」');
  d.place(K, -5.6, -6.4, 0); d.face(K, 'me');
  d.shot('me', K, { yaw: P / 4, dist: 9, h: 2.6, look: 1.1 });
  await d.say(K, '「どうかしましたか？」');
  d.face('me', K);
  await d.say('me', '「英語のお知らせが、読めなくて……」');
  await d.say(K, '「わたし、学校で英語を教えている こはるです。\nよかったら、いっしょに読んでみましょうか」');
  await d.say(K, '「英語は、"まとまり"ごとに読むと、ぐっと分かりやすくなるんです。\nこのまとまりを、"チャンク"といいます」');
  const q = async (text, opts, ok, hint) => {
    for (;;) {
      const ord = opts.map((_, i) => i).sort(() => Math.random() - 0.5);
      const a = ord[await d.choose(K, text, ord.map(i => opts[i]))];
      if (a === ok) { await d.say(K, '「そうです！」'); return; }
      await d.say(K, hint);
    }
  };
  await q('「このお知らせは、なにについて 言っていそう？(主役)」', ['The library', 'a new reading room', 'children'], 0, '「おしい！ 文のいちばん前を 見てみて」');
  await q('「図書館は、どうするの？(うごき)」', ['will open', 'will', 'open a new'], 0, '「"開きます"で、ひとまとまりです」');
  await q('「なにを 開くの？」', ['a new reading room', 'a new', 'reading room for'], 0, '「"新しい読書室"で、ひとまとまりです」');
  await q('「for children は、どんな役？」', ['主役', 'なにを', 'おまけ(だれのために)'], 2, '「文がなくても 通じる、つけたしの部分です」');
  await d.say(K, '「The library / will open / a new reading room / for children.\n"図書館は" "開きます" "新しい読書室を" "子どもたちのために"。\nまとまりごとに、前から読めばいいんです」');
  await d.say('me', '「読めた！」');
  await d.say(K, '「切れ目を見つける練習なら、今スラがおすすめですよ。\nちょっと、やってみましょうか」');
  d.hideBox();
  await d.game('chunkchunk', { play: 'auto-one', closeOn: ['stage_done'], coach: 'auto' });
  d.shot('me', K, { yaw: 1.3, dist: 9, h: 2.6, look: 1.1 });
  await d.say(K, '「上手です！ 次は、自分で送るタイプ。\n30秒のチャレンジです」');
  d.hideBox();
  await d.game('chunkchunk', { timed: 30, closeOn: ['done'], closeDelay: 4500, coach: 'manual' });
  d.shot('me', K, { yaw: 1.3, dist: 9, h: 2.6, look: 1.1 });
  await d.say(K, '「おつかれさまでした。\nチャレンジの点数は、ランキングに のるんですよ」');
  await d.board('チャレンジ30秒 ランキング', [['Mochi_Master', 5240], ['こはる先生', 5180], ['Star★Reader', 4870], ['Sora', 4710], ['Chunk Hero', 4550]], 'こはる先生');
  await d.say('narr', '上から2番目に……「こはる先生」の名前。');
  await d.say('me', '「……先生、2位？」');
  await d.say(K, '「え、ええと……ちょっと、練習しただけです」');
  await d.say('narr', '(もしかして先生は、ゲーマーなのかもしれない……)');
  await d.say(K, '「と、とにかく！ チャンクです。チャンク、チャンク、\nまとまりで読むのが大事なんです。チャンク、チャンク……」');
  d.place('me', -3.6, -6.0, 0); d.face('me', K);   // カメラの前をふさがない所へ
  d.place(C, -6.2, -3.9, 0); d.face(C, K);
  d.shot(C, null, { yaw: Math.atan2(-5.6 + 6.2, -6.4 + 3.9) + 0.5, dist: 6, h: 2.2, look: 0.8 });   // チャンクくんの顔が見える側(先生のななめ後ろ)から
  await d.say(C, '「呼んだ〜？ もちもち」');
  d.face(K, C);
  await d.say(K, '「……あなたのことでは、ありません」');
  await d.say(C, '「そんなこと言わないでよ〜。もちもち」');
  d.hideBox(); d.scale(C, 1.35, false); await d.wait(0.8);
  await d.say('narr', 'チャンクくんは、おもちのように ぷくーっとふくれた。');
  d.scale(C, 1, false);
  await d.friend(K, 5);
  await d.endCard('こはる先生「チャンクで読もう」', 'おしまい');
}
