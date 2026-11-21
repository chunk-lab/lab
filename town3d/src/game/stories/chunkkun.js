// チャンクくん「もちもち」。3Dの町で演じる台本。
// 設定: チャンクくんは雲。でもお餅のフリをしている。夜だけ気をぬいて雲にもどる。声をかけられると、あわててお餅になる。
// 町の住人はみんな一度はチャンクくんに乗ったことがあり、知っていて黙っている。
const P = Math.PI;
export const CHUNKKUN_STORY = { id: 'chunkkun', title: 'もちもち' };

export async function chunkkunStory(d, ctx = {}) {
  const C = 'chunkkun', me = (ctx.name && ctx.name()) || 'あなた';
  const cloud = (snap = true) => { d.scale(C, 4.2, snap); d.set(C, { y: 0.5, bob: 0.25 }); };
  const mochi = () => { d.scale(C, 1, true); d.set(C, { y: 0, bob: 0 }); };

  // ---- 夜明け前の広場 ----
  await d.fade(true, 0.01);
  d.only(['chunkkun', 'mii', 'maru']);
  d.hour(4.7);
  d.place(C, 5, 7, -0.6); cloud();
  d.place('me', 0, 30, P);
  d.shot(C, null, { yaw: 1.0, dist: 11, h: 3.6, look: 1.8 });
  await d.title('チャンクくん', 'もちもち');
  await d.fade(false, 1.4);
  await d.say('narr', '夜明け前のほし広場。\n大きな雲が、ふわふわと ねむっている。');
  d.shot(C, null, { yaw: 1.0, dist: 8, h: 3.2, look: 1.6 });
  await d.say('narr', 'チチチ……。\n鳥が鳴いた。');
  d.set(C, { bob: 0 });
  await d.say(C, '「…はっ！ あ、朝だ！」');
  d.hideBox();
  d.puff(5, 1.6, 7, 16, 2.2); mochi();
  d.shot(C, null, { yaw: 1.0, dist: 4.2, h: 1.5, look: 0.5 });
  await d.wait(0.9);
  await d.say('narr', 'ぎゅっ、と体をちぢめる。\nまんまるの、お餅になった。');
  await d.say(C, '「もちもち。もちもち〜。…よし、お餅だよ〜」');
  // いきなり、あいさつ(歩いてこない)
  d.place('me', 3.4, 9.4, 0); d.face('me', C); d.face(C, 'me');
  d.shot('me', C, { yaw: 1.2, dist: 5.5, h: 2.0, look: 0.9 });
  await d.say('me', '「はじめまして」');
  await d.say(C, '「わっ！？ も、もちもち〜！」');
  await d.say('narr', '見た目は、お餅。\nでも心の中は、大さわぎ。');
  await d.say(C, '(わ、人だ！ 見られてないよね？ はじっこ、まだ雲のままじゃない？)');
  const a = await d.choose('me', `${me}は、チャンクくんを見て…`, ['「お餅みたいだね」', '「ふわふわだね」']);
  if (a === 0) { await d.say(C, '「そ、そう〜？ お餅だよ、ぼく！ もちもち〜！」'); await d.say(C, '(ほっ……)'); }
  else { await d.say(C, '「ふ、ふわふわの お餅なんだよ〜。そういう お餅なの〜」'); await d.say(C, '(あ、あぶなかった……)'); }

  // ---- 昼: カフェ ----
  d.hideBox(); await d.fade(true, 0.7);
  d.hour(13); d.place('me', 40, 70, 0);
  d.place('mii', -3.6, 47.4, P / 2); d.place(C, -1.4, 46.6, -P / 2);
  d.face(C, 'mii'); d.face('mii', C);
  d.shot(C, 'mii', { dist: 4.2, h: 1.7, look: 0.8, side: -1 });
  d.caption('昼');
  await d.fade(false, 0.7);
  await d.say('narr', '昼。お餅のフリは、けっこうたいへんだ。\n風がふけば、体がふわっと流されそうになる。');
  await d.say('mii', '「あら、チャンクくん〜。きょうは風が強いですね〜」');
  await d.say('mii', '「カフェで、ゆっくりしていきませんか〜？ 窓ぎわの席、あいてますよ〜」');
  await d.say(C, '「わあい、ありがとう〜。もちもち〜」');
  d.caption('');

  // ---- 昼: ショップ ----
  d.hideBox(); await d.fade(true, 0.6);
  d.hour(15.5); d.place('mii', -30, 70, 0);
  d.place('maru', 3.6, 25.4, -P / 2); d.place(C, 1.6, 26.2, P / 2);
  d.face(C, 'maru'); d.face('maru', C);
  d.shot(C, 'maru', { dist: 4.2, h: 1.7, look: 0.8, side: -1 });
  await d.fade(false, 0.6);
  await d.say('narr', 'ぽつ、ぽつ。雨のにおいがしてきた。\n雲のからだは、しめると ふくらんでしまう。');
  await d.say('maru', '「おっと、ひと雨来そうですね！ うちの店の中で、雨やどりしていきなよ！」');
  await d.say(C, '「いいの〜？ ありがとう〜」');
  await d.say(C, '「みんな、しんせつだなあ。……お餅だから、かな〜？」');

  // ---- 真夜中の広場 ----
  d.hideBox(); await d.fade(true, 0.9);
  d.hour(21.5); d.place('maru', 30, 70, 0);
  d.place(C, 5, 7, -0.6); mochi(); d.place('me', 0, 30, P);
  d.shot(C, null, { yaw: 1.0, dist: 7, h: 2.6, look: 0.8 });
  d.caption('真夜中');
  await d.fade(false, 1.0);
  await d.say('narr', '真夜中。町じゅうが、ねむりについた。');
  await d.say(C, '「……だれも、いないよね〜」');
  d.hideBox();
  d.puff(5, 0.8, 7, 14, 1.6); cloud(false);
  d.shot(C, null, { yaw: 1.0, dist: 11, h: 3.6, look: 1.8 });
  await d.wait(1.6);
  await d.say(C, '「ふわ〜〜。らくだなあ〜」');
  d.caption('');
  // いきなり、見つかる(歩いてこない)
  d.place('me', 2.2, 12.2, 0); d.face('me', C);
  d.shot('me', C, { yaw: -1.9, dist: 7, h: 2.8, look: 1.4 });
  await d.say('me', '「……チャンクくん？」');
  d.face(C, 'me');
  await d.say(C, '「わわわっ！？」');
  await d.say(C, '「み、見ちゃった……？」');
  await d.say(C, '「ねえ……このこと、だまっててくれる〜？」');
  const plead = ['「そんなこと言わずに〜……」', '「ね、ね、おねがい〜。約束してくれたら、お礼もするよ〜」', '「ぼく、お餅でいたいんだよ〜……」', '「お礼、すっごくいいやつだよ〜？ ねえ〜」'];
  let ok = false, i = 0;
  while (!ok) {
    const last = i >= 2;
    const c = await d.choose('me', `${me}は……`, last ? ['「いいよ」', '(根負けして)「……わかったよ」'] : ['「いいよ」', '「言いふらす」']);
    if (c === 0 || last) ok = true; else { await d.say(C, plead[i % plead.length]); i++; }
  }
  await d.say(C, '「ほんと！？ やったあ〜！」');
  await d.say(C, '「じゃあ、お礼に……背中に乗って〜！」');

  // ---- 月を背にして、空へ ----
  d.hideBox();
  d.puff(5, 1.2, 7, 16, 2.0);
  d.place('me', 5, 7, 0.4); d.scale(C, 3, true);
  d.ride(true, 0.3);
  d.shot('me', null, { yaw: 1.4, dist: 7, h: 2.4, look: 1.2 });
  await d.wait(1.0);
  d.setAlt(16);
  d.shot('me', null, { moon: true, dist: 12, snap: false });
  const fly = (async () => { for (const [x, z] of [[12, -8], [-6, -16], [-14, 4], [5, 7]]) await d.walk('me', x, z, 11); })();
  await d.wait(1.0);
  await d.say('narr', '月を背にして、雲は夜空をすべっていく。\n町の屋根が、ずっと下で ねむっている。', { auto: 1.6 });
  await d.say(C, '「ふわ〜〜。夜の空は、ぼくのお気に入りなんだ〜」', { auto: 1.4 });
  await fly;
  d.hideBox();
  d.setAlt(0); d.shot('me', null, { yaw: 1.4, dist: 8, h: 2.6, look: 1.0, snap: false });
  await d.wait(1.3);
  d.ride(false); d.scale(C, 1, true); d.set(C, { y: 0, bob: 0 });
  d.place('me', 3.4, 9.6, 0); d.place(C, 5, 7, -0.6); d.face('me', C); d.face(C, 'me');
  d.shot('me', C, { yaw: 1.2, dist: 5.5, h: 2.0, look: 0.9 });
  await d.say(C, '「町で声かけてくれたら、いつでも乗せてあげるよ〜」');
  await d.say(C, '「でも、ないしょだよ〜。……もちもち」');

  // ---- オチ ----
  d.hideBox(); await d.fade(true, 1.0);
  await d.say('narr', `この町の住人は、みんな一度は チャンクくんに乗ったことがある。\n……${me}は、まだそれを知らない。`);
  d.hideBox();
  d.hour(8.3); d.place('me', 40, -40, 0);
  d.place(C, -4, 9, P / 2);
  d.shot(C, null, { yaw: 0.2, dist: 7, h: 2.2, look: 0.6 });
  d.caption('朝');
  await d.fade(false, 1.0);
  const stroll = d.walk(C, 2, 9, 1.4);
  d.shot(C, null, { yaw: 0.2, dist: 7, h: 2.2, look: 0.6, snap: false });
  await d.say('narr', '今日もチャンクくんは、おもちになりきって\n街を散歩しています。', { auto: 1.0 });
  await d.say(C, '「もちもち〜」', { auto: 0.8 });
  await stroll;
  d.caption('');
  await d.endCard('チャンクくん「もちもち」', 'おしまい');
}
