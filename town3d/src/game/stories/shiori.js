// しおりさん「白馬の王子様」。図書館。恋のお話にあこがれる司書。長文を読むチュートリアルつき。
const P = Math.PI;
// 練習用の短いお話(3文)と、問題1つ
const PRACTICE = {
  title: 'しおりさんのお話', level: 1,
  list: [
    ['S:Shiori=しおりは | V:works=働いている | P:at the library=図書館で', 'しおりは図書館で働いている。'],
    ['S:She=彼女は | V:loves=大好きだ | O:old love stories=古い恋の物語が', '彼女は古い恋の物語が大好きだ。'],
    ['T:Every evening=毎晩 | S:she=彼女は | V:waits=待っている | M:for a prince=王子様を', '毎晩、彼女は王子様を待っている。'],
  ],
  questions: [{ type: 'choice', q: 'しおりは、毎晩なにを待っている？', options: ['王子様', 'バス', '雨'], correct: 0 }],
};
export async function shioriStory(d, ctx = {}) {
  const S = 'shiori', me = (ctx.name && ctx.name()) || 'あなた';
  await d.fade(true, 0.01);
  d.only(['shiori', 'chunkkun']);
  d.hour(16.5); d.wx('sun', 'snap');
  d.place(S, 3.4, -24.6, -P / 2); d.place('me', -60, 40, 0);
  d.shot(S, null, { yaw: -1.2, dist: 5.5, h: 2.0, look: 1.1 });
  await d.title('しおりさん', '白馬の王子様');
  await d.fade(false, 1.2);
  await d.say('narr', '夕方の図書館。\nしおりさんが、本を胸にかかえて ためいきをついている。');
  await d.say(S, '「……"そのとき、白い馬にのった王子様が、彼女の名前を呼んだ"……」');
  await d.say(S, '「……はあ。いつか、わたしにも……」');
  d.place('me', 0.6, -24.6, P / 2); d.face('me', S);
  d.shot('me', S, { yaw: -1.4, dist: 5, h: 2.0, look: 1.0 });
  await d.say('me', '「はじめまして」');
  d.face(S, 'me');
  await d.say(S, '「ひゃっ！？ い、いつから そこに……」');
  await d.say(S, '「……き、聞こえてました……？」');
  const a = await d.choose('me', `${me}は……`, ['「王子様って？」', '「何も聞いてないよ」']);
  if (a === 0) {
    await d.say('narr', 'しおりさんは、本で顔をかくした。');
    await d.say(S, '「……わ、わすれてください……」');
    await d.say(S, '「……恋のお話が、好きなんです。\n本の中では、いつも誰かが 迎えに来てくれるから」');
  } else {
    await d.say(S, '「……そう、ですか。よかった……」');
    await d.say('narr', 'でも、耳まで真っ赤だ。');
  }
  await d.say(S, '「あ、あの……図書館は はじめてですか？\nここでは、いつでも英語の本が読めるんですよ」');
  await d.say(S, '「読むだけでも いいですし、問題を解きながら 読むこともできます」');
  await d.say(S, '「ためしに、短いお話を ひとつ どうぞ」');
  await d.say('narr', 'まずは「読む」で、ゆっくり読んでみよう。\n読めたら、上の「解く」に切りかえて、問題を1つ答えてみよう。\n閉じると、物語にもどります。');
  await d.read(PRACTICE, { label: 'お試し', view: 'read' });
  await d.say(S, '「……どうでした？\n読むだけの日も、解いてみる日も、あっていいんです」');
  await d.say(S, '「長いお話も、たくさん ありますから。\nまた、いつでも来てくださいね」');
  // ---- 白い……雲 ----
  await d.say('narr', 'そのとき。窓の外を、白いものが ふわっと横切った。');
  d.place('chunkkun', -1.2, -21.8, P / 2); d.face('chunkkun', S);
  d.shot('chunkkun', S, { yaw: -1.6, dist: 6, h: 2.2, look: 0.9 });
  await d.say('chunkkun', '「もちもち〜。しおりさん、また ためいき〜？」');
  await d.say('chunkkun', '「夕やけ、きれいだよ〜。乗ってく〜？」');
  await d.say(S, '「……白い……馬では、ないですけど」');
  const b = await d.choose('me', `${me}は……`, ['「一緒に乗ろうよ」', '「いってらっしゃい」']);
  if (b === 1) await d.say(S, '「……ひとりじゃ、ちょっと はずかしいです。いっしょに、来てくれませんか？」');
  // ---- 夕やけの空へ ----
  d.hideBox();
  d.puff(-1.2, 1.2, -21.8, 14, 1.8);
  d.place('me', -1.2, -21.8, 0.6); d.scale('chunkkun', 3, true);
  d.ride(true, 0.3, S);
  d.shot('me', null, { yaw: -1.2, dist: 8, h: 2.6, look: 1.2 });
  await d.wait(0.9);
  d.setAlt(14);
  d.shot('me', null, { yaw: -2.2, dist: 13, h: 15, look: 14, snap: false });
  const fly = (async () => { for (const [x, z] of [[8, -12], [6, 4], [-8, 2], [-1.2, -21.8]]) await d.walk('me', x, z, 9); })();
  await d.wait(1.0);
  await d.say(S, '「……空から見る町って、まるで 絵本の中みたい」', { auto: 1.6 });
  await fly;
  d.hideBox(); d.setAlt(0); await d.wait(1.3);
  d.ride(false); d.scale('chunkkun', 1, true);
  d.place('me', 0.6, -24.6, P / 2); d.place(S, 3.4, -24.6, -P / 2); d.place('chunkkun', 2, -21.6, P);
  d.face(S, 'me'); d.face('me', S);
  d.shot('me', S, { yaw: -1.4, dist: 5, h: 2.0, look: 1.0 });
  await d.say(S, '「白馬でも、王子様でもないけれど……\nこういうのも、悪くないですね」');
  await d.say(S, '「今度は、あなたの好きな本の話も 聞かせてください。\n……お友だちとして」');
  await d.say('narr', 'しおりさんは、空を見上げて、小さくつぶやいた。');
  await d.say(S, '「……いつかは、ね」');
  await d.friend(S, 5);
  await d.endCard('しおりさん「白馬の王子様」', 'おしまい');
}
