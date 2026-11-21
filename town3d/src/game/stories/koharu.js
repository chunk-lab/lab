// こはる先生「チャンクで読もう」。チャンクの説明→今スラ(さらさら・30秒チャレンジ)→ランキングに先生の名前→チャンクくん。
const P = Math.PI;
export async function koharuStory(d, ctx = {}) {
  const K = 'koharu', C = 'chunkkun', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['koharu', 'chunkkun']);
  d.hour(10); d.wx('sun', 'snap');
  d.place(K, 0, -61.4, 0); d.place('me', -60, 40, 0); d.place(C, 60, 60, 0);
  d.shot(K, null, { yaw: 0.4, dist: 10, h: 3.0, look: 1.2 });
  await d.title('こはる先生', 'チャンクで読もう');
  await d.fade(false, 1.2);
  await d.say('narr', 'まちの学校。\nこはる先生が、校門の前で 生徒を待っている。');
  d.place('me', 0.4, -58.4, P); d.face('me', K); d.face(K, 'me');
  d.shot('me', K, { yaw: 1.3, dist: 9, h: 2.6, look: 1.1 });
  await d.say('me', '「はじめまして」');
  await d.say(K, '「はじめまして。先生の、こはるです。\nよかったら、英語の読みかたのコツを ひとつ教えましょうか」');
  await d.say(K, '「英語は、"まとまり"ごとに読むと、ぐっと分かりやすくなるんです。\nこのまとまりを、"チャンク"といいます」');
  await d.say(K, '「たとえば、この文。\nMy sister bought a new bag for my birthday.」');
  const q = async (text, opts, ok, hint) => {
    for (;;) {
      const ord = opts.map((_, i) => i).sort(() => Math.random() - 0.5);
      const a = ord[await d.choose(K, text, ord.map(i => opts[i]))];
      if (a === ok) { await d.say(K, '「そうです！」'); return; }
      await d.say(K, hint);
    }
  };
  await q('「この文は、だれについて 言っていそう？(主役)」', ['My sister', 'a new bag', 'my birthday'], 0, '「おしい！ 文のいちばん前を 見てみて」');
  await q('「お姉さんは、どうしたの？(うごき)」', ['bought', 'a new', 'for my'], 0, '「"買った"は、どれかな？」');
  await q('「なにを 買ったの？」', ['a new bag', 'a new', 'bag for my'], 0, '「"新しいかばん"で、ひとまとまりです」');
  await q('「for my birthday は、どんな役？」', ['主役', 'なにを', 'おまけ(なんのために)'], 2, '「文がなくても 通じる、つけたしの部分です」');
  await d.say(K, '「My sister / bought / a new bag / for my birthday.\n"姉は" "買った" "新しいかばんを" "わたしの誕生日に"。\nまとまりごとに、前から読めばいいんです」');
  await d.say(K, '「今スラで、切れ目を見つける練習をしてみましょう」');
  d.hideBox();
  await d.game('chunkchunk', { play: 'auto-one', closeOn: ['stage_done'], coach: 'auto' });
  d.shot('me', K, { yaw: 1.3, dist: 9, h: 2.6, look: 1.1 });
  await d.say(K, '「上手です！ 次は、自分で送るタイプ。\n30秒のチャレンジです」');
  d.hideBox();
  await d.game('chunkchunk', { timed: 30, closeOn: ['done'], closeDelay: 4500, coach: 'manual' });
  d.shot('me', K, { yaw: 1.3, dist: 9, h: 2.6, look: 1.1 });
  await d.say(K, '「おつかれさまでした。\nチャレンジの点数は、ランキングに のるんですよ」');
  await d.board('チャレンジ30秒 ランキング', [['Mochi_Master', 1820], ['こはる先生', 1795], ['Star★Reader', 1610], ['Sora', 1540], ['Chunk Hero', 1490]], 'こはる先生');
  await d.say('narr', '上から2番目に……「こはる先生」の名前。');
  await d.say('me', '「……先生、2位？」');
  await d.say(K, '「え、ええと……ちょっと、練習しただけです」');
  await d.say('narr', '(もしかして先生は、ゲーマーなのかもしれない……)');
  await d.say(K, '「と、とにかく！ チャンクです。チャンク、チャンク、\nまとまりで読むのが大事なんです。チャンク、チャンク……」');
  d.place(C, 2.2, -59.2, -P / 2); d.face(C, K);
  d.shot(K, C, { yaw: 1.3, dist: 9, h: 2.6, look: 0.9 });
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
