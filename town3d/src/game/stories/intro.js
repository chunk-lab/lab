// はじめての導入(タイトルの前)。はな・そらが町を紹介 → 操作の練習(main が行う) → こはる先生 → なかよしの説明 → ナレーション。
// 3つの場面に分けてある。場面の間で、main が「実際にやってみる」練習をはさむ(芝居の間は操作できないため)。
const P = Math.PI;
export const INTRO_AT = { me: [7.4, 10.4], hana: [3.8, 7.6], sora: [6.2, 7.6], koharu: [9.5, 4.5] };   // 広場の噴水の南
const two = d => d.shot('hana', 'sora', { yaw: 0, dist: 7.5, h: 1.9, look: 1.25 });   // 目の高さで、2人を正面から
const front = d => { d.face('hana', 0.15); d.face('sora', -0.15); };   // 2人とも、カメラ(画面のこちら側)を向く=目が合う
const kCam = d => d.cam(8.6, 1.5, 8.6, 10.0, 1.35, 4.5);   // こはる先生の顔が見える位置(先生の前・やや左から)
const meBack = d => d.place('me', INTRO_AT.me[0], 12.8, Math.PI), meHome = d => d.place('me', INTRO_AT.me[0], INTRO_AT.me[1], Math.PI);   // 先生を撮る間は、自分をカメラの後ろへ(画面をふさがない)
const kFace = d => d.face('koharu', Math.atan2(8.6 - 9.5, 10.0 - 4.5));   // 自分の肩ごしに2人の顔(自分は右手前にずらして置く)
export async function introStory1(d, ctx = {}) {
  const H = 'hana', S = 'sora', me = (ctx.name && ctx.name()) || 'あなた', A = INTRO_AT;
  await d.fade(true, 0.01);
  d.only([H, S]); d.hour(10); d.wx('sun', 'snap');
  d.place('me', A.me[0], A.me[1], P); d.place(H, A.hana[0], A.hana[1], 0); d.place(S, A.sora[0], A.sora[1], 0);
  front(d);
  two(d);
  await d.fade(false, 1.2);
  await d.say(H, `「あ、来た来た！ はじめまして、${me}！\nわたし、はな！」`);
  await d.say(S, '「ぼくは、そら。\nようこそ、チャンクタウンへ！」');
  d.shot('me', null, { yaw: P, dist: 9, h: 4.5, look: 1.0 });
  await d.say(H, '「ここはね、好きなところを歩きまわりながら、\n英語が学べる町なんだよ」');
  await d.say(S, '「お店も、学校も、図書館も、ぜんぶ入れるんだ。\n行きたいところへ、自由に行っていいんだよ」');
  two(d);
  await d.say(H, '「まずは、歩き方を練習してみよう！」');
}
export async function introStory2(d, ctx = {}) {
  const H = 'hana', S = 'sora', K = 'koharu', me = (ctx.name && ctx.name()) || 'あなた', A = INTRO_AT;
  d.only([H, S, K]); d.hour(10); d.wx('sun', 'snap');
  d.place('me', A.me[0], A.me[1], P); d.place(H, A.hana[0], A.hana[1], 0); d.place(S, A.sora[0], A.sora[1], 0); d.place(K, 30, 30, 0);
  front(d); d.face('me', H);
  two(d);
  await d.say(S, '「うん、上手！ もう、どこへでも行けるね」');
  await d.say(H, '「町には、いろんな人が住んでるんだよ。\n話しかけると、英語を教えてくれたり、\nいっしょに遊んでくれたりするの」');
  await d.say(S, '「AIとつなげば、町の人と\n英語でおしゃべりもできるんだ」');
  d.place(K, A.koharu[0] + 4, A.koharu[1] - 3, 0); d.walk(K, A.koharu[0], A.koharu[1]);
  meBack(d); kCam(d);
  await d.say(K, '「あら、はなさん、そらくん。おはようございます」');
  d.face(H, K); d.face(S, K); d.face(K, H);   // 先生が はなを見る(顔は斜めに見える)
  await d.say(H, `「こはる先生！ この子、${me}。\n今日から、この町に来たんだよ」`);
  d.face(K, 'me'); kFace(d);
  await d.say(K, '「まあ、ようこそ。」');
  meHome(d); front(d);
  two(d);
  await d.say(S, `「${me}、先生に話しかけてみて！」`);
}
export async function introStory3(d, ctx = {}) {
  const H = 'hana', S = 'sora', K = 'koharu', me = (ctx.name && ctx.name()) || 'あなた', A = INTRO_AT;
  d.only([H, S, K]); d.hour(10); d.wx('sun', 'snap');
  d.place('me', A.me[0], A.me[1], P); d.place(H, A.hana[0], A.hana[1], 0); d.place(S, A.sora[0], A.sora[1], 0); d.place(K, A.koharu[0], A.koharu[1], 0);
  meBack(d); kFace(d);
  kCam(d);
  await d.say(K, '「わからないことがあったら、\nいつでも学校にいらっしゃいね」');
  d.walk(K, A.koharu[0] + 8, A.koharu[1] - 6);
  meHome(d); front(d); d.face('me', H);
  two(d);
  await d.say(H, '「ねえ、さっき 先生の名前の横に ♡ が出てたでしょ？\nそれが「なかよし」のしるしなの」');
  await d.say(S, '「毎日話しかけたり、プレゼントをあげたりすると、\nだんだん なかよくなれるんだ」');
  await d.say(H, '「なかよくなると、たのめることや、\nいっしょに遊べることが増えるよ。\nいっしょにお出かけしたり、家に遊びに来てくれたりもするの！」');
  await d.say(H, '「この町には、たくさんのゲームやイベントがあるから、\n好きに遊んでね！」');
  await d.say(S, '「勉強で困ったら、ぼくに話しかけてね」');
  await d.say(H, '「じゃあ、またあとでね！」');
  d.hideBox(); await d.fade(true, 1.4);
  await d.say('narr', `今日から、${me}の英語ライフが始まる……`);
  d.hideBox(); await d.wait(0.6);
}
