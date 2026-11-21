// 第5話「もちもち」(チャンクくん)。3Dの町で演じる台本。
// 設定: チャンクくんは雲。でもお餅のフリをしている。夜だけ気をぬいて雲にもどる。声をかけられると、あわててお餅になる。みんなは知っていて、黙っている。
const P = Math.PI;
export const CHUNKKUN_STORY = { id: 'chunkkun', no: 5, title: 'もちもち' };

export async function chunkkunStory(d) {
  const C = 'chunkkun';
  const cloud = (snap = true) => { d.scale(C, 4.2, snap); d.set(C, { y: 0.5, bob: 0.25 }); };
  const mochi = () => { d.scale(C, 1, true); d.set(C, { y: 0, bob: 0 }); };

  // ---- 夜明け前の広場 ----
  await d.fade(true, 0.01);
  d.only(['chunkkun', 'mii', 'maru']);
  d.hour(4.7);
  d.place(C, 5, 7, -0.6); cloud();
  d.place('me', 0, 26, P);
  d.cam(14, 6.5, 17, 5, 2.4, 7, true);
  await d.title('第5話', 'もちもち');
  await d.fade(false, 1.4);
  await d.say('narr', '夜明け前のほし広場。\n大きな雲が、ふわふわと ねむっている。');
  d.shot(C, null, { yaw: 1.0, dist: 7, h: 3.2, look: 1.6 });
  await d.say('narr', 'チチチ……。\n鳥が鳴いた。');
  d.set(C, { bob: 0 });
  await d.say(C, '「…はっ！ あ、朝だ！」');
  d.hideBox();
  d.puff(5, 1.6, 7, 16, 2.2); mochi();
  d.shot(C, null, { yaw: 1.0, dist: 3.6, h: 1.4, look: 0.45 });
  await d.wait(0.9);
  await d.say('narr', 'ぎゅっ、と体をちぢめる。\nまんまるの、お餅になった。');
  await d.say(C, '「もちもち。もちもち〜。…よし、お餅だよ〜」');
  await d.say('narr', 'ひとりで、練習中。\nそこへ、足音が近づいてきた。');
  d.hideBox();
  d.shot('me', C, { yaw: 1.2, dist: 5.5, h: 2.2, look: 0.9 });
  await d.walk('me', 3.3, 9.4, 2.4);
  d.face('me', C); d.face(C, 'me');
  await d.say('narr', 'きのう町に来たばかりの、あなただ。\nあいさつ回りの、とちゅうらしい。');
  await d.say('me', '「はじめまして」');
  await d.say(C, '「も、もちもち〜！」');
  await d.say('narr', '見た目は、お餅。\nでも心の中は、大さわぎ。');
  await d.say(C, '(わ、人だ！ 見られてないよね？ はじっこ、まだ雲のままじゃない？)');
  const a = await d.choose('me', 'あなたは、チャンクくんを見て…', ['「お餅みたいだね」', '「ふわふわだね」']);
  if (a === 0) { await d.say(C, '「そ、そう〜？ お餅だよ、ぼく！ もちもち〜！」'); await d.say(C, '(ほっ……)'); }
  else { await d.say(C, '「ふ、ふわふわの お餅なんだよ〜。そういう お餅なの〜」'); await d.say(C, '(あ、あぶなかった……)'); }

  // ---- 昼: カフェ ----
  d.hideBox(); await d.fade(true, 0.8);
  d.hour(13); d.place('me', 22, 60, 0);
  d.place('mii', -3.6, 47.4, P / 2); d.place(C, 2, 41, -0.8);
  d.cam(9, 4, 54, -1.2, 1.0, 45, true);
  d.caption('昼');
  await d.fade(false, 0.8);
  await d.say('narr', '昼。お餅のフリは、けっこうたいへんだ。\n風がふけば、体がふわっと流されそうになる。');
  d.hideBox();
  await d.walk(C, -1.4, 46.6, 1.6);
  d.face(C, 'mii'); d.face('mii', C);
  d.shot(C, 'mii', { dist: 4.2, h: 1.7, look: 0.8, side: -1 });
  await d.say('mii', '「あら、チャンクくん〜。きょうは風が強いですね〜」');
  await d.say('mii', '「カフェで、ゆっくりしていきませんか〜？ 窓ぎわの席、あいてますよ〜」');
  await d.say(C, '「わあい、ありがとう〜。もちもち〜」');
  d.caption('');

  // ---- 昼: ショップ ----
  d.hideBox(); await d.fade(true, 0.6);
  d.hour(15.5); d.place('mii', -30, 70, 0);
  d.place('maru', 3.6, 25.4, -P / 2); d.place(C, -1.5, 31, P);
  d.cam(-6, 4.5, 17, 1.0, 1.0, 28, true);
  await d.fade(false, 0.6);
  await d.say('narr', 'ぽつ、ぽつ。雨のにおいがしてきた。\n雲のからだは、しめると ふくらんでしまう。');
  d.hideBox();
  await d.walk(C, 1.6, 26.2, 2.4);
  d.face(C, 'maru'); d.face('maru', C);
  d.shot(C, 'maru', { dist: 4.2, h: 1.7, look: 0.8, side: -1 });
  await d.say('maru', '「おっと、ひと雨来そうですね！ うちの店の中で、雨やどりしていきなよ！」');
  await d.say(C, '「いいの〜？ ありがとう〜」');
  await d.say(C, '「みんな、しんせつだなあ。……お餅だから、かな〜？」');

  // ---- 真夜中の広場 ----
  d.hideBox(); await d.fade(true, 1.0);
  d.hour(0.6); d.place('maru', 30, 70, 0);
  d.place(C, 5, 7, -0.6); mochi(); d.place('me', 0, 24, P);
  d.cam(13, 5, 15, 5, 1.4, 7, true);
  d.caption('真夜中');
  await d.fade(false, 1.2);
  await d.say('narr', '真夜中。町じゅうが、ねむりについた。');
  await d.say(C, '「……だれも、いないよね〜」');
  d.hideBox();
  d.puff(5, 0.8, 7, 14, 1.6); cloud(false);
  d.shot(C, null, { yaw: 1.0, dist: 8, h: 3.4, look: 1.8 });
  await d.wait(1.6);
  await d.say(C, '「ふわ〜〜。らくだなあ〜」');
  await d.say(C, '「でも、ちょっとだけ さびしいな。\nお餅のほうが、みんなに好かれてる気がするから」');
  await d.say('narr', 'そこへ、足音。\n夜ふかしの あなたが、通りかかった。');
  d.hideBox();
  d.shot('me', C, { yaw: 1.2, dist: 7, h: 2.8, look: 1.2 });
  await d.walk('me', 2.6, 11.6, 2.2);
  d.face('me', C);
  await d.say('me', '「チャンクくん？」');
  d.hideBox();
  d.puff(5, 1.6, 7, 18, 2.2); mochi(); d.face(C, 'me');
  d.shot('me', C, { yaw: 1.2, dist: 4.6, h: 1.6, look: 0.6 });
  await d.wait(0.7);
  await d.say('narr', 'ぽんっ！');
  await d.say(C, '「も、もちもち……！ ぼく、お餅だよ〜！」');
  const b = await d.choose('me', 'あなたは……', ['見なかったことにする', '「おやすみ、お餅さん」と言う']);
  if (b === 0) await d.say(C, '「……？ どうかした〜？」\n(気づいて、ない……よね？)');
  else await d.say(C, '「お、おやすみ〜……もちもち」\n(あ、ありがとう……？)');
  await d.say('narr', 'あなたは、気づいた。\n昼間、みんなが しんせつだった わけに。');

  // ---- 朝 ----
  d.hideBox(); await d.fade(true, 1.0);
  d.hour(8.3); d.place('me', 30, -30, 0);
  d.place(C, -6, 10, 0.9); d.place('mii', 6.5, 9.5, -1.2);
  d.cam(-1, 5, 27, -1, 1.0, 9.5, true);
  d.caption('朝');
  await d.fade(false, 1.0);
  d.hideBox();
  const w = d.walk(C, 3.5, 9, 1.4);
  await d.say(C, '「もちもち〜」');
  await w; d.face(C, 'mii'); d.face('mii', C);
  d.shot('mii', null, { yaw: -0.6, dist: 3.4, h: 1.5, look: 1.0 });
  await d.say('narr', 'だれにも、ばれていない。……つもり。');
  await d.say('narr', 'ミイが、そっと手をふった。');
  d.caption('');
  d.hideBox(); await d.fade(true, 1.0);
  await d.title('第5話「もちもち」', 'おしまい', 2.4);
}
