// ゴン「ボタンの落とし主」。ミステリー。真相:潮見さんが昔この町の夏祭りで恋人に贈った上着のボタン。
// 恋人はある日突然いなくなり、潮見さんは彼女をさがして旅を続けている(2026-11-21 ユーザーと決めた設定)。
const P = Math.PI;
export async function gonStory(d, ctx = {}) {
  const G = 'gon', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['gon', 'shiori', 'maru', 'baron', 'luna', 'suna']);
  d.hour(9); d.wx('sun', 'snap');
  // ---- 事件 ----
  d.place(G, -2, 6, 0.6); d.place('me', -60, 40, 0);
  d.shot(G, null, { yaw: 0.9, dist: 6, h: 2.2, look: 0.9 });
  await d.title('ゴン', 'ボタンの落とし主');
  await d.fade(false, 1.2);
  await d.say('narr', '朝のほし広場。\nゴンが、石だたみのすきまから 何かを拾い上げた。');
  await d.say(G, '「おっ……？ ボタンだ。花のもようが彫ってある」');
  await d.say(G, '「こりゃ、女もんだな。……しかも、だいぶ古い」');
  d.place('me', 0.8, 8.2, P); d.face('me', G); d.face(G, 'me');
  d.shot('me', G, { yaw: 1.0, dist: 5, h: 2.0, look: 1.0 });
  await d.say('me', '「はじめまして」');
  await d.say(G, '「おう、新入りか！ ちょうどいいとこに来た」');
  await d.say(G, '「拾ったもんにはな、ぜんぶ物語があるんだぜ。\nこいつの持ち主、さがしに行くぞ。おまえ、今日から おれの助手な」');
  const a = await d.choose('me', `${me}は……`, ['「助手になる！」', '「……しぶしぶ付き合う」']);
  await d.say(G, a === 0 ? '「いい返事だ！ 名探偵ゴンと、その助手の誕生だな」' : '「しぶしぶでも、助手は助手だ。ほら、行くぞ」');
  // ---- 手がかり1: 図書館 ----
  d.hideBox(); await d.fade(true, 0.6);
  d.place('shiori', 3.4, -24.6, -P / 2); d.place(G, 0.8, -23.4, P / 2); d.place('me', 0.6, -25.8, P / 2);
  d.face('shiori', G);
  d.cam(-5.5, 2.8, -24.6, 2.0, 1.0, -24.6);
  d.caption('手がかり1　図書館');
  await d.fade(false, 0.6);
  await d.say('shiori', '「古いボタン……ですか？ ……少し、待っていてください」');
  await d.say('narr', 'しおりさんが、町の古い写真集を持ってきた。');
  await d.say('shiori', '「この写真……何十年も前の、夏祭りです」');
  await d.say(G, '「おい、この人の上着！ 同じ花のボタンじゃねえか！」');
  await d.say('narr', '写っているのは、女の人の後ろ姿。\n顔は、わからない。');
  await d.say('shiori', '「ずいぶん良い上着ですね。……この町で売っていたのなら、マルさんのお店かも」');
  d.caption('');
  // ---- 手がかり2: ショップ ----
  d.hideBox(); await d.fade(true, 0.6);
  d.place('maru', 3.6, 25.4, -P / 2); d.place(G, 1.0, 24.4, P / 2); d.place('me', 0.9, 26.6, P / 2);
  d.face('maru', G);
  d.shot(G, 'maru', { dist: 4.6, h: 1.9, look: 0.9, side: -1 });
  d.caption('手がかり2　ショップ');
  await d.fade(false, 0.6);
  await d.say('maru', '「花のボタンの上着？ じいちゃんの帳簿なら、ありますよ！ えーっと……」');
  await d.say('narr', '「花のボタンの上着。贈り物用の包み。\n買った人……S」');
  await d.say('maru', '「名前は、頭文字の"S"だけですね。じいちゃん、書くのめんどくさがったな〜」');
  await d.say(G, '「贈り物、か……。Sのつくやつ、この町に いたかな」');
  d.caption('');
  // ---- 容疑者えらび(どちらも外れ) ----
  const left = ['しおりさん', 'ハッタリ男爵'];
  while (left.length) {
    const c = await d.choose('me', 'Sのつく人……。だれに聞いてみる？', left.map(x => `「${x}？」`));
    const who = left.splice(c, 1)[0];
    d.hideBox(); await d.fade(true, 0.4);
    if (who === 'しおりさん') {
      d.place('shiori', 3.4, -24.6, -P / 2); d.place(G, 0.8, -23.4, P / 2); d.place('me', 0.6, -25.8, P / 2); d.face('shiori', 'me');
      d.cam(-5.5, 2.8, -24.6, 2.0, 1.0, -24.6);
      await d.fade(false, 0.4);
      await d.say('shiori', '「わたし、ですか？ "しおり"の S……」');
      await d.say('shiori', '「……でも、そのころ わたし、まだ生まれていません」');
      await d.say(G, '「そりゃそうだ」');
    } else {
      d.place('baron', -3.6, 25, P / 2); d.place(G, -1.0, 24.0, -P / 2); d.place('me', -0.9, 26.2, -P / 2); d.face('baron', G);
      d.shot(G, 'baron', { dist: 4.6, h: 1.9, look: 0.9, side: 1 });
      await d.fade(false, 0.4);
      await d.say('baron', '「ふはは！ それは わが輩が、若き日に 町一番の美女に贈ったものよ！」');
      await d.say(G, '「男爵、あんたの名前、Sで始まんねえだろ」');
      await d.say('baron', '「……む。……わが輩の本名は、ひみつである」');
      await d.say('narr', 'ハッタリだった。');
    }
  }
  await d.say(G, '「手づまりだな……。よし、こういう時は 占いだ」');
  // ---- 手がかり3: 占いの館 ----
  d.hideBox(); await d.fade(true, 0.6);
  d.hour(18.5);
  d.place('luna', -40.9, -17.4, 0); d.place(G, -42.4, -15.2, P * 0.8); d.place('me', -39.4, -15.2, -P * 0.8);
  d.face('luna', 'me');
  d.shot('luna', null, { yaw: 0.2, dist: 6.5, h: 2.2, look: 1.0 });
  d.caption('手がかり3　占いの館');
  await d.fade(false, 0.6);
  await d.say('luna', '「……そのボタン。ずっと、だれかに さがされているわね」');
  await d.say('luna', '「贈った人は、今も旅をしているわ。\n……この町にも、それで来たのね」');
  await d.say(G, '「旅……？ ……あっ」');
  d.caption('');
  // ---- 推理 ----
  const wrong = { 'チャンクくん': '「チャンクくんは、ボタンどころか 服も着てねえよ」', 'ゴン': '「おれかよ！ ……ちがうちがう。おれのボタンは、もっと安もんだ」' };
  for (;;) {
    const c = await d.choose('me', '持ち主は……', ['「潮見さん」', '「チャンクくん」', '「ゴン」']);
    if (c === 0) break;
    await d.say(G, wrong[c === 1 ? 'チャンクくん' : 'ゴン']);
  }
  await d.say(G, '「……やるじゃねえか、助手。\n旅人で、Sのつくやつ。潮見さんだ」');
  // ---- 真相: 夜の池 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(21);
  d.place('suna', 46, 22.2, P); d.place(G, 44.6, 24.6, P * 0.85); d.place('me', 47.4, 24.6, -P * 0.85);
  d.shot('suna', null, { yaw: 2.6, dist: 6.5, h: 2.2, look: 1.0 });
  d.caption('夜の池');
  await d.fade(false, 1.0);
  await d.say('narr', '夜の池。潮見さんが、ひとりで 釣り糸をたれている。');
  await d.say(G, '「なあ、潮見さん。……これ」');
  d.face('suna', G); d.shot(G, 'suna', { yaw: 2.6, dist: 5, h: 1.9, look: 1.0 });
  await d.say('narr', '潮見さんは、ボタンを見て、しばらく だまっていた。');
  await d.say('suna', '「……どこで、これを」');
  await d.say(G, '「広場だ。昔の夏祭りの写真に、これと同じボタンの上着が写ってた」');
  await d.say('suna', '「……そうか。こんなところに、あったのか」');
  await d.say('suna', '「むかし、この町に 好きな人がいたのさ。\nそのボタンの上着は、おれが あいつに贈ったものだ」');
  await d.say('suna', '「ある日、あいつは 何も言わずに いなくなった。\nどこへ行ったのかも、わからない」');
  await d.say('suna', '「それから、ずっと旅をしてる。……あいつを さがしてな」');
  const b = await d.choose('me', `${me}は……`, ['「見つかるといいね」', '(何も言わず、うなずく)']);
  await d.say('suna', b === 0 ? '「……ああ。そうだな」' : '「……」');
  await d.say('suna', '「……ありがとう。また、旅をつづける理由ができたさ」');
  // ---- おわり ----
  d.hideBox(); await d.fade(true, 0.8);
  d.place('suna', 60, 60, 0); d.place(G, -1.4, 6.6, 0.6); d.place('me', 0.9, 8.4, P);
  d.face(G, 'me'); d.face('me', G);
  d.shot('me', G, { yaw: 1.0, dist: 5, h: 2.0, look: 1.0 });
  d.caption('');
  await d.fade(false, 0.8);
  await d.say(G, '「……な？ 拾ったもんにはな、ぜんぶ物語があるんだぜ」');
  await d.say(G, '「助手、おつかれさん。お礼に、コツを教えてやるよ。\n町の中で ときどき キラッと光る所があったら、近づいて調べてみな」');
  await d.say(G, '「かくしものが、見つかることがあるぜ」');
  await d.friend(G, 5);
  await d.endCard('ゴン「ボタンの落とし主」', 'おしまい');
}
