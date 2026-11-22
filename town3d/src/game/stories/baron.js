// ハッタリ男爵「ハッタリも楽じゃない」。上から目線で教えに来る→カード(案内つき)→長くするコツ→1回勝負→別の夜、こっそり練習を見る。
const P = Math.PI;
export async function baronStory(d, ctx = {}) {
  const B = 'baron', me = (ctx.name && ctx.name()) || 'あなた';
  const two = () => d.shot('me', B, { yaw: 0.6, dist: 7, h: 2.3, look: 1.0 });
  await d.fade(true, 0.01);
  d.only(['baron']);
  d.hour(15); d.wx('sun', 'snap');
  // ---- アミューズメントセンターの前 ----
  d.place('me', -1.2, 25.6, -P / 2); d.place(B, -60, 60, 0);
  d.shot('me', null, { yaw: 1.4, dist: 6, h: 2.2, look: 1.0 });
  await d.title('ハッタリ男爵', 'ハッタリも楽じゃない');
  await d.fade(false, 1.2);
  await d.say('narr', 'アミューズメントセンターの前。');
  d.place(B, -3.6, 24.6, P / 2); d.face(B, 'me'); d.face('me', B);
  two();
  await d.say(B, '「ふはは！ そなたが うわさの新入りか」');
  await d.say(B, '「わが輩はハッタリ男爵。\nカード対戦では、一度も負けたことがない！」');
  await d.say(B, '「見たところ、英語の文づくりは まだまだのようじゃな。\n……よかろう。わが輩が、手ほどきしてやろう！」');
  const a = await d.choose('me', `${me}は……`, ['「お願いします」', '「……べつに、いいです」']);
  await d.say(B, a === 0 ? '「うむ、素直でよろしい！」' : '「遠慮はいらぬ！ わが輩は心が広いのでな！」');
  await d.say(B, '「まずは、カードで文を並べてみるのじゃ。やってみよ！」');
  await d.game('cards', { tut: true, closeOn: ['story_step'], closeDelay: 1500 });
  two();
  await d.say(B, '「ふむ、悪くない。\nでは、とっておきのコツを 教えてやろう」');
  d.note('I / ate / cake.', 'みじかい文');
  await d.say(B, '「この文は、みじかい。点も低い」');
  d.note('I / ate / a big cake / in the park / yesterday.\n\na big cake …… 名詞を くわしく\nin the park …… どこで\nyesterday …… いつ', '長くするコツ');
  await d.say(B, '「名詞に"a big"を足して、くわしくする。\n"in the park"で場所、"yesterday"で時を足す」');
  await d.say(B, '「どうじゃ、ぐっと長くなったであろう？\n文は、長いほど 点が高いのじゃ！」');
  d.note('');
  await d.say(B, '「では、勝負じゃ！ 1回きりの、真剣勝負！」');
  const r = await d.game('cards', { cpu: 'baron', hands: 1, closeOn: ['done'], closeDelay: 3500 });
  two();
  if (r && r.won) {
    await d.say(B, '「……ふ、ふむ」');
    await d.say(B, '「今のは、練習じゃ！」');
    await d.say('narr', '男爵は、帽子をくいっと かぶり直した。');
    await d.say(B, '「……しかし、そなたは なかなか 見どころがあるようじゃ」');
    await d.say('narr', 'くるりと背を向ける男爵。');
    d.face(B, P / 2);
    await d.say(B, '「今度、わが輩の無敗記録に 挑戦させてやろう」');
    d.face(B, 'me');
    await d.say(B, '「また来るがよいぞ！ ふはははは！」');
  } else {
    await d.say(B, '「ふはは！ 落ち込む必要はないぞ！\n天才の わが輩とは、ちがうのだからな」');
    await d.say(B, '「せいぜい、練習に励むがよい！」');
    await d.say('narr', '男爵は、胸をはって 去っていく。');
    d.face(B, P / 2);
    await d.say(B, '(……ふぅ。あ、危なかった……)');
  }
  // ---- 別の日の夜 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(22); d.caption('別の日の夜');
  d.place(B, -4.0, 21.6, P); d.place('me', -1.0, 26.4, -P * 0.8); d.face('me', B);
  d.shot(B, null, { yaw: 2.4, dist: 6, h: 2.2, look: 1.0 });
  await d.fade(false, 0.9);
  await d.say('narr', '夜。アミューズメントセンターの前を通りかかると……');
  d.caption('');
  await d.say(B, '「……ここで"a big"を足して……\nいや、"in the park"が先か……？」');
  await d.say('narr', 'ネオンの下で、男爵が ひとり、カードを並べていた。');
  await d.say(B, '「次こそ、ぶっちぎりで勝たねば……。\n無敗の男爵の名が、泣くわい」');
  d.shot('me', B, { yaw: 0.2, dist: 7, h: 2.3, look: 1.0 });
  await d.say('me', '(男爵、こっそり練習してたんだ……)');
  await d.say('me', '(ハッタリを続けるのも、大変なんだなぁ)');
  await d.say('narr', `${me}は、そっと その場をはなれた。`);
  await d.friend(B, 5);
  await d.endCard('ハッタリ男爵「ハッタリも楽じゃない」', 'おしまい');
}
