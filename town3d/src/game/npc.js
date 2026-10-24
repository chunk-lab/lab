// 町の住人。時刻ごとの予定(schedule)に合わせて道すじを歩き、話しかけると会話する
import { makeCharacter, makeChunkkun } from '../world/character.js';
import { PLACES } from '../world/town_data.js';
import { angleLerp } from '../core/core.js';

// 予定は [時, 場所, 'in'(建物の中=見えない)]。台詞は時間帯ごと。menu は会話の選択肢
export const RESIDENTS = [
  {
    id: 'mii', tips: ["「I'll have a coffee, please.」は、カフェで注文するときの定番ですよ〜", "「Could I have…?」は「Can I have…?」より、少していねいなんです", "「Take your time.」は『ゆっくりでいいよ』。わたし、よく言われます", "「Sounds good!」は、軽く『いいね』って返すのにぴったり", "「Cheers!」は乾杯だけじゃなく、『ありがとう』の意味でも使うんですって"], yomi: 'みい', persona: 'ゆったりしたお姉さん。やさしくて少しのんびり。カフェとカードが好きで、考えるのに時間をかける。', name: 'ミイ', role: 'カフェの常連', look: { skin: 0xffe6d6, hair: 0xf3c2a4, style: 'bob', top: 0xfff4e0, bottom: 0xffb3c1, shoes: 0xffffff, acc: 'ribbon', accColor: 0xa8e6cf },
    schedule: [[7, 'plaza'], [10, 'cafe'], [15, 'park'], [18, 'cafe'], [22, 'home', 'in']],
    lines: { morning: ['おはよう。朝の広場って、空気がおいしいよね。'], day: ['カフェでカードしてるの。よかったら一局どう?', 'ゆっくり考えるのが好きなんだ。'], evening: ['夕方の公園、ちょっとさみしくて好き。'], night: ['そろそろ帰らなきゃ。'] },
    menu: [{ label: 'カードで勝負する', app: 'chunkcards', params: { cpu: 'mii' } }],
  },
  {
    id: 'baron', tips: ["ふはは、「Splendid!」は『素晴らしい!』。わが輩の口ぐせである!", "「I'm afraid…」で始めれば、悪い知らせも偉そうに言えるぞ", "「Indeed.」は『まったくだ』。重々しく言うのがコツだ!", "「Well done!」は『よくやった』。わが輩が言うと偉そうに聞こえるな", "「By the way」は『ところで』。話をそらすのはハッタリの基本だ"], yomi: 'はったりだんしゃく', persona: '大げさで自信家。「わが輩」と名乗り、ハッタリが多いが憎めない。ゲームセンターの記録の話が好き。', name: 'ハッタリ男爵', role: 'ゲームセンターの主', look: { skin: 0xf6d2bb, hair: 0xdcdcdc, style: 'short', top: 0xb79cd9, bottom: 0x4f4766, shoes: 0x2e2a3d, acc: 'tophat', accColor: 0x3f3a52 },
    schedule: [[9, 'north'], [11, 'gamecenter'], [16, 'plaza2'], [19, 'gamecenter'], [23, 'home', 'in']],
    lines: { morning: ['ふむ、朝からわが輩に会えるとは運がいい。'], day: ['ゲームセンターの記録、わが輩のものだ。たぶんな。', 'ハッタリも実力のうちである!'], evening: ['夕暮れは勝負の時間だ。'], night: ['夜のネオンは美しい……わが輩の次にな。'] },
    menu: [{ label: 'ぷにチャンクで遊ぶ', app: 'punichunk' }, { label: 'カードで勝負する', app: 'chunkcards', params: { cpu: 'baron' } }],
  },
  {
    id: 'gon', tips: ["「Look what I found!」で『見ろよ、拾ったぞ!』って言えるぜ", "「It's a bit rusty.」は『ちょっとさびてる』。拾い物の説明に使えるな", "「Where did you get that?」で『それ、どこで手に入れた?』", "「Finders keepers!」は『拾った者の勝ち』。子どもがよく言うぜ", "「No worries.」は『気にすんな』。おれの口ぐせだ"], yomi: 'ひろいやごん', persona: '拾い物好きの気さくな兄ちゃん。くだけた口調。落とし物や変な単語を見つけた話をする。', name: 'ひろい屋ゴン', role: '何でも拾う人', look: { skin: 0xeec3a6, hair: 0x6b4a3a, style: 'spiky', top: 0xfdeeb0, bottom: 0x8fcfae, shoes: 0xc9a28c, acc: 'cap', accColor: 0xffc8a2 },
    schedule: [[6, 'park'], [9, 'park2'], [13, 'south'], [17, 'shrine'], [21, 'park']],
    lines: { morning: ['朝いちばんは落とし物が多いんだ。'], day: ['きのう、すごい単語を拾ったよ。', '捨てられた札にも、いい文が眠ってる。'], evening: ['神社の裏、いい物が落ちてるんだよね。'], night: ['夜の公園は静かでいいね。'] },
    menu: [{ label: 'カードで勝負する', app: 'chunkcards', params: { cpu: 'gon' } }],
  },
  {
    id: 'koharu', tips: ["「How are you?」には「I'm good, thanks.」と返すのが自然ですよ", "「I'm sorry?」と語尾を上げると、『もう一度お願いします』の意味になります", "まちがえても大丈夫。「Let's try again.」と言えば、前向きに聞こえます", "「Could you say that again?」も、聞き返しの定番です", "「I see.」は『なるほど』。相づちに便利ですよ"], yomi: 'こはるせんせい', persona: 'ていねいで励まし上手な先生。です・ます調。まちがえても大丈夫と伝える。英語の勉強が好き。', name: 'こはる先生', role: '学校の先生', look: { skin: 0xffe1cf, hair: 0x5a3e36, style: 'long', top: 0x93b5e1, bottom: 0xfff4e0, shoes: 0x8a5a44, acc: 'glasses', accColor: 0xb08b72 },
    schedule: [[7, 'north'], [8, 'school'], [16, 'library'], [19, 'home', 'in']],
    lines: { morning: ['おはようございます。今日もいっしょに練習しましょう。'], day: ['学校では、いちから英語の練習ができますよ。', 'まちがえても大丈夫。それも練習です。'], evening: ['図書館で、明日の準備をしています。'], night: [''] },
    menu: [{ label: '学校で練習する', app: 'school' }],
  },
  {
    id: 'shiori', tips: ["「borrow」は借りる、「lend」は貸す。……ちょっとまぎらわしいですね", "「I'm reading a book.」は『本を読んでいるところ』。進行形です", "「Shh.」は『静かに』。図書館は、世界共通です", "「What's it about?」は『それ、何の話?』。本の話題で使えます", "「page-turner」は、ページをめくる手が止まらない本のことです"], yomi: 'しおりさん', persona: '静かでおだやかな司書。ときどきおちゃめ。本と言葉の話が好き。', name: 'しおりさん', role: '図書館の司書', look: { skin: 0xfce0d0, hair: 0x2e2a3d, style: 'bob', top: 0xc9b8ea, bottom: 0x6f7fa8, shoes: 0xffffff, acc: 'apron', accColor: 0xfff4e0 },
    schedule: [[9, 'library'], [12, 'plaza'], [13, 'library'], [18, 'cafe'], [20, 'home', 'in']],
    lines: { morning: ['開館の準備中です。'], day: ['図書館では、集めた言葉を読み返せますよ。', 'お静かに……なんてね。'], evening: ['今日はケーキの日なんです。'], night: [''] },
    menu: [{ label: '図書館に入る', app: 'library' }],
  },
  {
    id: 'maru', tips: ["「How much is this?」は『これいくら?』。買い物の基本だよ!", "「I'll take it.」は『それにします』。買うと決めたときの一言さ", "「Anything else?」は『ほかには?』。店員がよく言うんだ", "「It's on the house.」は『サービスだよ』ってこと。おまけの話になると、つい出ちゃう", "「Do you have a bigger one?」で『もっと大きいのある?』"], yomi: 'まるさん', persona: '商売上手で気前のいい店長。明るく元気。コインのおまけの話が好き。', name: 'マルさん', role: 'ショップの店長', look: { skin: 0xf2c9ac, hair: 0x8a5a44, style: 'short', top: 0xa8e6cf, bottom: 0x5a4a6b, shoes: 0x8a5a44, acc: 'apron', accColor: 0xffb3c1 },
    schedule: [[8, 'shop'], [12, 'south'], [13, 'shop'], [20, 'plaza'], [22, 'home', 'in']],
    lines: { morning: ['いらっしゃい! 新しい服が入ったよ。'], day: ['家具もそろえてるから見ていって。', 'コインは町のどこでも使えるよ。'], evening: ['夕方は少しおまけしちゃおうかな。'], night: ['今日はもう店じまい。'] },
    menu: [{ label: 'お店を見る', app: 'shop' }],
  },
  {
    id: 'yuzu', adult: false, tips: ["「Make a wish.」は『願いごとをしてね』。おみくじの前の合言葉です", "「Look at the stars.」は『星を見て』。夜の空はきれいです", "「Good luck!」は『がんばって』『幸運を』。おみくじの結果にもぴったりです", "「Good morning.」は朝だけ。昼すぎは「Good afternoon.」になります", "「shooting star」が流れ星のこと。願いごとの相棒ですよ"], yomi: 'ゆず', persona: '神社のみならい。おっとりしていて礼儀正しい。星や朝の空気、おみくじの話が好き。', name: 'ゆず', role: '神社のみならい', look: { skin: 0xffe6d6, hair: 0x3f3a52, style: 'long', top: 0xffffff, bottom: 0xf59a8c, shoes: 0xc9a28c, acc: 'ribbon', accColor: 0xf59a8c },
    schedule: [[6, 'shrine'], [12, 'busstop'], [13, 'shrine'], [20, 'shrine']],
    lines: { morning: ['朝のおまいりは、気持ちがすっきりしますよ。'], day: ['おみくじ、1日1回ひけます。'], evening: ['夕日の鳥居、きれいでしょう。'], night: ['夜の神社は、星がよく見えるんです。'] },
    menu: [{ label: 'おみくじをひく', app: 'omikuji' }],
  },
  {
    id: 'chunkkun', adult: false, tips: ["ふわ…「cloud」は雲。ぼくのことだよ", "ふわふわは「fluffy」。ぼくにぴったり", "「Nice to meet you.」は、はじめましての魔法のことば", "「See you!」は『またね』。短くて言いやすいよ", "「It's raining cats and dogs.」は『どしゃ降り』……ふしぎだね"], yomi: 'ちゃんくくん', persona: 'おもちのようなイモムシ。語尾が「〜だよ」「もちもち」。無邪気で、文ができると体がのびるのが自慢。', name: 'チャンクくん', role: '町のマスコット', mascot: true,
    schedule: [[0, 'plaza'], [11, 'gamecenter'], [14, 'plaza2'], [18, 'plaza']],
    lines: { morning: ['もちもち〜! おはよう!'], day: ['いっしょにチャンクつくろ!', 'ぼく、文ができると、のびるんだ!'], evening: ['ゲーセン行こうよ〜。'], night: ['ねむねむ……でも、まだ遊べるよ。'] },
    menu: [{ label: 'ぷにチャンクで遊ぶ', app: 'punichunk' }],
  },
  {
    // 大喜利チョコ:お題を出して、プレイヤーと答えを出し合う。点数と勝ち負けはチョコが決める(AIキーで遊ぶ)
    id: 'choco', tips: ["「Good one!」は『うまい!』。大喜利で、いい答えが出たときに使うよ", "「You got me!」は『やられた!』。笑わされたときの一言!", "「That's hilarious!」は『めっちゃ笑った』。ほめ言葉の最上級だね", "「Nailed it!」は『ばっちり決まった!』", "「punchline」は話のオチのこと。ここが大事なんだよ〜"], yomi: 'おおぎりちょこ', name: '大喜利チョコ', role: '大喜利の達人',
    persona: 'お笑いと大喜利が好きな女の子。落ち着いた普通のため口で、テンションは上げすぎない。ツッコミは短く、聞かれたことにまっすぐ答える。大喜利の話が出たら「大喜利で勝負する」から遊べると伝える。',
    look: { skin: 0xffe1cf, hair: 0x5b3a2e, style: 'bob', top: 0x9c6a4a, bottom: 0xffd6e0, shoes: 0xffffff, acc: 'ribbon', accColor: 0xffb3c1 },
    schedule: [[7, 'plaza'], [11, 'cafe'], [15, 'gamecenter'], [19, 'plaza2'], [22, 'home', 'in']],
    lines: { morning: ['おはよう。今日のお題を考えてるところ。', '朝は頭がすっきりしてて、いい答えが出やすいんだよね。'], day: ['大喜利、やる? いつでもいいよ。', '答えは短いほうが、意外とおもしろいんだ。'], evening: ['夕方になると、ひねった答えが浮かぶんだよね。', 'そろそろ一本、やっておく?'], night: ['夜は静かだから、考えるのにちょうどいいね。'] },
    menu: [{ label: '大喜利で勝負する', act: 'ogiri' }],
  },
  {
    // 哲学者:人生についていつも考えている。偉人の格言を教えてくれる(英語モードなら英語+訳)
    id: 'tetsu', tips: ["「Food for thought.」は『考えさせられること』。哲学者の口ぐせです", "「Think twice.」は『よく考えて』。急がないほうがいいときの一言", "「deep down」は『心の奥では』。本音を話すときに使います", "「What's the point?」は『何の意味があるの?』。哲学的な問いの入口です", "「the meaning of life」は『人生の意味』。大きな話題ですね"], yomi: 'てつがくしゃ', name: '哲学者', role: '考えごとの人',
    persona: '人生についていつも深く考えている、おだやかな人。ゆっくり、少し詩的に話す。ときどき偉人の言葉(ソクラテス・デカルト・老子・孔子・ニーチェなど)を引いて、そのあと自分の言葉で一言そえる。説教くさくならない。',
    replyRule: '- 日本語で、2文、70文字ほど。絵文字は使わない。',
    extraRules: ['- 偉人の言葉を引くときは、出典が確かなものだけにする。あやふやなときは引用せず、自分の言葉で話す。'],
    maxChars: 100, maxTokens: 220,
    quotes: [
      { en: 'The unexamined life is not worth living.', ja: '吟味されない人生は、生きるに値しない。', who: 'ソクラテス', note: '立ち止まって考える時間も、人生のうちなんだね。' },
      { en: 'I think, therefore I am.', ja: 'われ思う、ゆえにわれあり。', who: 'デカルト', note: '疑っている自分がいる。それだけは、たしかなことなんだ。' },
      { en: 'A journey of a thousand miles begins with a single step.', ja: '千里の道も、一歩から。', who: '老子', note: '大きなことも、足もとの一歩から始まるよ。' },
      { en: 'It does not matter how slowly you go, as long as you do not stop.', ja: 'どんなにゆっくりでもいい。止まらなければ。', who: '孔子(の言葉とされる)', note: '速さより、続けることのほうが力になる。' },
      { en: 'Life can only be understood backwards; but it must be lived forwards.', ja: '人生は後ろ向きにしか理解できない。でも、前に向かって生きるしかない。', who: 'キルケゴール', note: 'わからないまま進んで、あとから意味に気づくんだね。' },
      { en: 'He who has a why to live can bear almost any how.', ja: '生きる理由をもつ人は、ほとんどどんなやり方にも耐えられる。', who: 'ニーチェ', note: '「なぜ」があると、人は強くなれるのかもしれない。' },
      { en: 'Happiness depends upon ourselves.', ja: '幸せは、自分しだい。', who: 'アリストテレス', note: '外ではなく、自分の中に答えがあるって、すてきだよね。' },
      { en: 'Knowing others is wisdom; knowing yourself is enlightenment.', ja: '人を知る者は知恵があり、自分を知る者は明るい。', who: '老子', note: '自分のことが、いちばんむずかしい。' },
      { en: 'Nothing is permanent except change.', ja: '変わらないものは、変わるということだけ。', who: 'ヘラクレイトス(とされる言葉)', note: '今日のつらさも楽しさも、少しずつ形をかえていくよ。' },
      { en: 'The only thing we have to fear is fear itself.', ja: '恐れるべきは、恐れそのものだけだ。', who: 'ルーズベルト', note: '不安は、考えているうちに大きくなるものだからね。' },
    ],
    look: { skin: 0xf6d2bb, hair: 0xe3e0dc, style: 'short', top: 0x8a7bb0, bottom: 0x5a4a6b, shoes: 0x7a6a5a, acc: 'glasses', accColor: 0x8a5a44 },
    schedule: [[6, 'shrine'], [10, 'library'], [15, 'park'], [19, 'busstop'], [22, 'home', 'in']],
    lines: { morning: ['朝の静けさは、考えごとにぴったりなんだ。', 'おはよう。今日は、どんなことを考えようか。'], day: ['ふと思ったんだ。「ふつう」って、だれが決めたんだろうね。', '本を読んでいると、昔の人と話している気分になるよ。'], evening: ['夕ぐれは、一日をふり返るのにいい時間だね。', '空の色が変わるのを見ていると、時間の流れを感じるよ。'], night: ['夜は、考えが深いところまで降りていくんだ。', '星を見ていると、自分の悩みが小さく思えてくるね。'] },
    menu: [{ label: '格言をひとつ聞く', act: 'quote' }],
  },
  {
    // 砂吹さん:さすらいの旅人。池のほとりで釣りをしている。頼むとハーモニカを吹いてくれる
    id: 'suna', tips: ["「Any luck?」は釣りの定番の声かけ。『釣れた?』ってことさ", "「Nothing's biting.」は『ぜんぜん食いつかない』。釣れない日のぼやきだな", "「Take it easy.」は『のんびりいこう』。ぼくの生き方みたいなものさ", "「Go with the flow.」は『流れにまかせて』。川と同じだね", "「catch of the day」は『今日の釣果』。とれたら自慢できる"], yomi: 'すなぶきさん', name: '砂吹さん', role: 'さすらいの旅人',
    persona: '自由なさすらいの旅人。ひょうひょうとしていて、口数は少なめでおだやか。「〜さ」「〜だな」と話す。持ち物はハーモニカと釣り竿だけ。池でアヒルをながめながら釣りをするのが好きで、釣れなくても気にしない。',
    look: { skin: 0xf2c9ac, hair: 0x8a5a44, style: 'short', top: 0x7f9a52, bottom: 0x8a6b4a, shoes: 0x5a4a3a, acc: 'snuf', accColor: 0x7a8f4a },
    angler: { spot: [46, 22.5], face: [46, 18] },
    schedule: [[5, 'pond'], [17, 'park2'], [19, 'plaza2'], [21, 'pond']],
    lines: { morning: ['おはよう。朝の池は、水がきらきらしてるのさ。', 'まだ一匹も釣れてないけど、いい朝だな。'], day: ['釣れなくていいんだ。のんびりしに来てるだけさ。', 'あのアヒル、ぼくのことを見張ってるみたいだな。'], evening: ['夕方は風がやさしいな。そろそろ歩きたくなる。', '今日はどこまで行こうかな。気のむくままさ。'], night: ['夜の池は静かだな。星が水に映ってるのさ。'] },
    menu: [{ label: '釣りをする', app: 'fishing' }, { label: '釣り勝負をいどむ', app: 'fishing', params: { vs: 'easy' } }, { label: '釣りのコツを聞く', app: 'fishing', params: { tab: 'ask' } }, { label: 'ハーモニカをお願いする', act: 'harmonica' }],
  },
];

function period(h) { return h < 5 ? 'night' : h < 10 ? 'morning' : h < 16.5 ? 'day' : h < 19.5 ? 'evening' : 'night'; }
export { period };

function findPath(graph, from, to) {
  if (from === to) return [to];
  const prev = { [from]: null }, q = [from];
  while (q.length) {
    const c = q.shift();
    if (c === to) break;
    for (const n of graph.nodes[c].links) if (!(n in prev)) { prev[n] = c; q.push(n); }
  }
  if (!(to in prev)) return [to];
  const p = []; for (let c = to; c; c = prev[c]) p.unshift(c);
  return p.slice(1);
}

function nearestNode(graph, x, z) {
  let best = null, bd = 1e9;
  for (const id in graph.nodes) { const n = graph.nodes[id]; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; best = id; } }
  return best;
}

export function createResidents(scene, graph, getHour) {
  const list = RESIDENTS.map((d, i) => {
    const ch = d.mascot ? makeChunkkun() : makeCharacter(d.look);
    const goal = goalOf(d, getHour());
    const start = graph.nodes[PLACES[goal.place]];
    const sa = i * 2.4 + 0.7; ch.root.position.set(start.x + Math.cos(sa) * (1.5 + (i % 3) * 0.8), 0, start.z + Math.sin(sa) * (1.5 + (i % 3) * 0.8));
    scene.add(ch.root);
    if (goal.inside) ch.root.visible = false;   // 家の中にいる予定なら、最初から見えない(以前は、家のそばに立ったまま固まって見えた)
    return { def: d, ch, node: PLACES[goal.place], path: [], goal, wait: Math.random() * 2, talking: false, speed: 0, idle: null, hidden: !!goal.inside };
  });

  function goalOf(d, h) {
    let g = d.schedule[d.schedule.length - 1];
    for (const s of d.schedule) if (h >= s[0]) g = s;
    return { place: g[1], inside: g[2] === 'in' };
  }

  return {
    list,
    update(dt, h, player) {
      const anyTalking = list.some(q => q.talking);
      for (const r of list) {
        const g = goalOf(r.def, h);
        if (g.place !== r.goal.place) {
          r.goal = g;
          r.path = findPath(graph, nearestNode(graph, r.ch.root.position.x, r.ch.root.position.z), PLACES[g.place]);
          if (r.hidden) { r.hidden = false; r.ch.root.visible = true; }
        }
        const p = r.ch.root.position;
        let speed = 0, target = null;
        const near = Math.hypot(player.x - p.x, player.z - p.z);
        r.near = r.near ? near < 4.2 : near < 3.2;   // 近づいたらいったん止まる(離れるまで)
        // 近づかれても、止まったり止まらなかったり気まぐれ。止まっても、1〜10秒で勝手に動き出す。
        // プレイヤーがほかの住人と話しているあいだは、止まらずすぐ動く
        if (!r.near || r.talking) { r.stopT = 0; r.free = false; r.stopWill = undefined; }
        else {
          if (r.stopWill === undefined) { r.stopWill = Math.random() < 0.6; r.stopLimit = 1 + Math.random() * 9; }
          if (!r.free) { r.stopT = (r.stopT || 0) + dt; if (!r.stopWill || anyTalking || r.stopT > r.stopLimit) r.free = true; }
        }
        if (r.talking || r.harpT > 0 || (r.near && !r.hidden && !r.free)) {
          r.ch.root.rotation.y = angleLerp(r.ch.root.rotation.y, Math.atan2(player.x - p.x, player.z - p.z), Math.min(1, dt * 8));
        } else if (r.path.length) {
          const n = graph.nodes[r.path[0]];
          target = [n.x, n.z];
          if (Math.hypot(n.x - p.x, n.z - p.z) < 0.4) { r.node = r.path.shift(); if (!r.path.length) r.wait = 1 + Math.random() * 2; }
        } else if (r.goal.inside) {
          if (!r.hidden) { r.hidden = true; r.ch.root.visible = false; }
        } else if (r.def.angler && r.goal.place === 'pond') {
          // 池のほとりの決まった場所で、釣りをする(うろうろしない)
          const a = r.def.angler;
          if (Math.hypot(a.spot[0] - p.x, a.spot[1] - p.z) > 0.3) target = a.spot;
          else r.ch.root.rotation.y = angleLerp(r.ch.root.rotation.y, Math.atan2(a.face[0] - p.x, a.face[1] - p.z), Math.min(1, dt * 4));
        } else {
          // 目的地のまわりをうろうろ。ときどき、町のほかの場所へ散歩に出る(もどるときは、予定の場所へ)
          r.roamT = (r.roamT ?? 6 + Math.random() * 20) - dt;
          if (r.roamT <= 0 && !r.talking) {
            r.roamT = 15 + Math.random() * 30;
            const cur = nearestNode(graph, p.x, p.z), home = PLACES[r.goal.place], ids = Object.keys(graph.nodes);
            let dest = null;
            if (r.node !== home && Math.random() < 0.5) dest = home;   // 散歩中なら、半分は予定の場所にもどる
            for (let k = 0; k < 12 && !dest; k++) { const id = ids[(Math.random() * ids.length) | 0], n = graph.nodes[id], d = Math.hypot(n.x - p.x, n.z - p.z); if (id !== cur && d > 10 && d < 55) dest = id; }
            if (dest) { r.path = findPath(graph, cur, dest); r.idle = null; }
          }
          r.wait -= dt;
          if (r.wait <= 0) {
            const n = graph.nodes[r.node];
            r.idle = [n.x + (Math.random() * 2 - 1) * 3.5, n.z + (Math.random() * 2 - 1) * 3.5];
            r.wait = 2 + Math.random() * 4;
          }
          if (r.idle) { target = r.idle; if (Math.hypot(r.idle[0] - p.x, r.idle[1] - p.z) < 0.25) r.idle = null; }
        }
        // ---- 動き:行きたい方向(intent)と、よけ・押しのけ(avoid)を、なめらかな速度にまぜて進む ----
        // 以前は「目的地へ進む」と「押し出される」を毎フレーム別々に位置へ足していたので、境目でガクガクしていた。
        // いまは両方を1つの速度にまとめ、よけの強さは距離で少しずつ変える(境目でぱっと切りかわらない)。
        const sp = (r.def.mascot ? 1.6 : 1.9) * (r.path.length > 3 ? 1.3 : 1);
        let ix = 0, iz = 0, ax = 0, az = 0;
        if (target && !r.hidden) {
          const dx = target[0] - p.x, dz = target[1] - p.z, d = Math.hypot(dx, dz);
          if (d > 0.01) { const k = r.path.length ? 1 : Math.min(1, d / 0.8); ix = dx / d * sp * k; iz = dz / d * sp * k; }   // 道の途中は止まらず、うろうろの目的地ではゆっくり着く
        }
        if (!r.hidden) {
          // プレイヤーに近すぎるときは、止まらずに横へよける(立ち止まっているプレイヤーのそばで固まらないように)
          const pd = Math.hypot(player.x - p.x, player.z - p.z);
          if ((ix || iz) && pd < 1.5 && pd > 0.001) { const w = 1 - pd / 1.5; ax += (p.x - player.x) / pd * w * sp * 1.6; az += (p.z - player.z) / pd * w * sp * 1.6; }
          // 住人どうしが重なって団子にならないよう、ゆるく離れる
          if (!r.talking) for (const o of list) {
            if (o === r || o.hidden) continue;
            const ox = p.x - o.ch.root.position.x, oz = p.z - o.ch.root.position.z, od = Math.hypot(ox, oz);
            if (od < 1.2) {
              const w = 1 - od / 1.2;
              if (od > 0.01) { ax += ox / od * w * sp * 1.1; az += oz / od * w * sp * 1.1; }
              else { r.jit ??= Math.random() * 6.283; ax += Math.sin(r.jit) * sp; az += Math.cos(r.jit) * sp; }
            }
          }
        }
        let dvx = ix + ax, dvz = iz + az; const dl = Math.hypot(dvx, dvz), cap = sp * 1.4;
        if (dl > cap) { dvx *= cap / dl; dvz *= cap / dl; }
        const bl = 1 - Math.exp(-dt * 6);
        r.vx = (r.vx || 0) + (dvx - (r.vx || 0)) * bl; r.vz = (r.vz || 0) + (dvz - (r.vz || 0)) * bl;
        if (r.hidden) { r.vx = r.vz = 0; }
        else { p.x += r.vx * dt; p.z += r.vz * dt; }
        speed = Math.hypot(r.vx, r.vz); if (speed < 0.05) speed = 0;
        // 向きは「行きたい方向」を優先(よけられて横にずれても、体は進む方を向いたまま)
        if (!(r.talking || r.harpT > 0 || (r.near && !r.hidden && !r.free))) {
          if (ix || iz) r.ch.root.rotation.y = angleLerp(r.ch.root.rotation.y, Math.atan2(ix, iz), Math.min(1, dt * 6));
          else if (speed > 0.3) r.ch.root.rotation.y = angleLerp(r.ch.root.rotation.y, Math.atan2(r.vx, r.vz), Math.min(1, dt * 4));
        }
        r.speed = speed;
        // ポーズ:ハーモニカを吹いている間 / 池のそばで釣り竿を構えているとき
        if (r.harpT > 0) r.harpT -= dt;
        if (r.def.angler) {
          const a = r.def.angler;
          r.ch.pose = r.harpT > 0 ? 'harp' : (r.goal.place === 'pond' && !r.hidden && Math.hypot(a.spot[0] - p.x, a.spot[1] - p.z) < 0.6 ? 'fish' : null);
        }
        if (r.ch.root.visible) r.ch.update(dt, speed);
      }
    },
    lineFor(r, h) {
      const arr = r.def.lines[period(h)].filter(Boolean);
      const all = arr.length ? arr : r.def.lines.day;
      r.lineIdx = ((r.lineIdx ?? -1) + 1) % all.length;
      return all[r.lineIdx];
    },
  };
}
