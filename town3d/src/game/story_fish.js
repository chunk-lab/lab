/* 物語 第2話「魚を入れて、育てる」(潮見さん)。3Dの町の中で、潮見さんの会話として進める。
   釣り堀のアクアリウム(本物の画面)を開いて、えさをあげるところまでやってもらう。
   進み具合は social の「made」印に保存(sf_fish=最初の1匹をもらった / story_fish=おわり)。 */
import { spec, GROW_NEED, FEED_PER_DAY } from './specimen.js';

export function createFishStory({ hud, furn, social, openApp, bus, name = '潮見さん' }) {
  let run = 0;
  const say = (text, label = 'つぎへ') => new Promise(res => hud.dialog({ name, face: 'suna', text, choices: [{ label, fn: () => res(true) }] }));
  const ask = (text, yes, no) => new Promise(res => hud.dialog({ name, face: 'suna', text, choices: [{ label: yes, fn: () => res(true) }, { label: no, fn: () => res(false) }] }));
  const openTank = () => new Promise(res => { const off = bus.on('app:close', () => { off(); res(); }); openApp('fishing', { tab: 'tank', from: 'story' }); });
  const fed = () => spec.tank().some(f => (f.n || 0) > 0 || (f.g || 0) > 0);

  function giveFirstFish() {
    if (spec.tank().length) return;   // もう水槽に魚がいる人は、その子で進める
    const size = 14 + Math.floor(Math.random() * 6);
    const t = spec.tank(); t.push({ uid: 'st' + Date.now().toString(36), id: 'funa', size, g: 0, day: '', n: 0, at: Date.now() }); spec.saveTank(t);
    if (!spec.hasTank()) spec.gotTank();
    if (!furn.owned('tank')) furn.give('tank');
  }

  async function start() {
    const tok = ++run, alive = () => tok === run;
    if (!social.made('sf_fish')) {
      await say('池の魚は、釣って終わりじゃないのさ。');
      if (!alive()) return;
      await say('持って帰って、水槽で育てるんだ。育てるのには、英語を使う。のんびりやってれば、身につくさ。');
      if (!alive()) return;
      giveFirstFish(); social.markMade('sf_fish');
      await say('ほら、最初の1匹だ。フナだな。水槽も、家の持ち物に入れておいたさ。');
      if (!alive()) return;
    }
    await say('さっそく、のぞいてみな。腹が減ってるはずだ。\nえさは、英語の問題に答えるとできるのさ。1問正解で、えさ1つだな。', '水槽を見る');
    while (alive()) {
      await openTank();
      if (!alive()) return;
      if (fed()) break;
      if (!await ask('…まだ、えさをやってないみたいだな。', 'もう一度見る', 'あとで')) return;
    }
    if (!alive()) return;
    await say(`食べたな。育ちきるまで、えさは${GROW_NEED}回。1日${FEED_PER_DAY}回までだから、早くても${Math.ceil(GROW_NEED / FEED_PER_DAY)}日はかかるのさ。`);
    if (!alive()) return;
    await say('育ちきったら、図鑑に載る。毎日ちょっとずつ、のぞいてやんな。\n水槽は、家でも、上のバーの「🐠 アクアリウム」でも見られるさ。');
    if (!alive()) return;
    await say('そうそう、釣り人のあいさつを教えとくよ。「Any luck?」は「釣れた?」さ。\nこれからも、のんびりな。');
    social.markMade('story_fish');
  }
  return { start, done: () => social.made('story_fish') };
}
