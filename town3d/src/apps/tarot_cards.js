// タロット 78枚(大アルカナ22枚+小アルカナ56枚)のデータ
// 1枚 = { id, n:日本語名, en:英語名, num:番号の表示, suit:'major'|'wands'|'cups'|'swords'|'pentacles', g:絵の記号,
//         up:{ kw:[[英,日]×3], m:意味 }, rv:{ kw:[[英,日]×3], m:意味 } }
// 絵の差し替え:id(m00〜m21, w01〜w14, c01〜c14, s01〜s14, p01〜p14)ごとに画像を置けば、そちらを使う(tarot.js の artBase)

export const SUITS = {
  major: { n: '大アルカナ', en: 'Major Arcana', col: ['#3b2470', '#1b1038'], ink: '#ffd76a', el: '', theme: '' },
  wands: { n: 'ワンド', en: 'Wands', col: ['#8a2f1d', '#3d130b'], ink: '#ffb15c', el: '火', theme: '情熱と行動のエネルギーが強い。思い立ったら動くことが、運を呼びこむわ' },
  cups: { n: 'カップ', en: 'Cups', col: ['#1f4f86', '#0d2142'], ink: '#8fd3ff', el: '水', theme: '気持ちや人とのつながりが大きく動いている。心の声に正直にね' },
  swords: { n: 'ソード', en: 'Swords', col: ['#3c4a6b', '#171d2e'], ink: '#dfe7ff', el: '風', theme: '頭を使う場面が多い。考えすぎに気をつけつつ、言葉ははっきりと' },
  pentacles: { n: 'ペンタクル', en: 'Pentacles', col: ['#2f5e35', '#11261a'], ink: '#ffd166', el: '地', theme: 'お金や仕事、暮らしなど、目に見える現実がテーマ。地道な積み重ねが実を結ぶわ' },
};
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const k = s => s.split('/').map(x => x.split(':'));   // "hope:希望/inspiration:ひらめき" → [[en,ja],…]

// [日本語名, 英語名, 記号, 正位置のキーワード, 正位置の意味, 逆位置のキーワード, 逆位置の意味]
const MAJOR = [
  ['愚者', 'The Fool', '🎒', 'new beginnings:新しい始まり/freedom:自由/spontaneity:思いつき', '恐れずに一歩をふみ出す時。計算より、わくわくする気持ちが道を開きます。', 'recklessness:無謀/hesitation:ためらい/carelessness:不注意', '準備不足のまま飛び出しそう。勢いはそのままに、足もとだけは確かめて。'],
  ['魔術師', 'The Magician', '✨', 'skill:技術/willpower:意志の力/creation:創造', '必要な道具は、もうそろっています。思い立ったら、すぐ形にしてみて。', 'trickery:小細工/untapped talent:眠った才能/manipulation:ごまかし', '力の使い方がずれているかも。近道や小細工より、まっすぐな方法を。'],
  ['女教皇', 'The High Priestess', '🌙', 'intuition:直感/wisdom:知恵/secrets:秘密', '答えはすでに、あなたの内側に。静かな時間をとって、心の声を聞いて。', 'confusion:迷い/hidden agendas:隠しごと/surface:表面だけ', '頭で考えすぎて、直感が聞こえにくい時。いったん情報から離れてみて。'],
  ['女帝', 'The Empress', '🌹', 'abundance:豊かさ/nurturing:育むこと/beauty:美しさ', '愛情も実りも、たっぷり。自分を大切に育てることを楽しんで。', 'dependence:依存/smothering:世話のやきすぎ/creative block:停滞', '人の世話ばかりで、自分がからっぽに。まず自分を満たして。'],
  ['皇帝', 'The Emperor', '👑', 'authority:統率/structure:秩序/stability:安定', '計画を立て、責任をもって進めば、確かな成果に。リーダーシップを発揮して。', 'rigidity:頑固/domination:支配/lack of discipline:無計画', '力で押さえつけるか、逆にゆるみすぎ。ルールと柔らかさのバランスを。'],
  ['教皇', 'The Hierophant', '🔑', 'tradition:伝統/guidance:導き/belief:信念', '信頼できる人の教えや、昔からのやり方が助けになります。', 'rebellion:反発/unconventional:型やぶり/dogma:思いこみ', '決まりごとに縛られているかも。自分なりのやり方を探してもいい時。'],
  ['恋人', 'The Lovers', '💞', 'love:愛/harmony:調和/choices:選択', '心が通い合う関係。大切な選択は、本当に大事なものに正直に。', 'imbalance:すれ違い/indecision:迷い/misalignment:価値観のずれ', '気持ちや価値観にずれが。どっちつかずをやめて、向き合って。'],
  ['戦車', 'The Chariot', '🏇', 'determination:決意/victory:勝利/momentum:勢い', '迷わず前へ。強い意志が、ばらばらの力をひとつにまとめて勝利へ。', 'loss of control:暴走/scattered energy:空回り/obstacles:足止め', '気持ちがあちこちに向いて空回り。目標をひとつにしぼって。'],
  ['力', 'Strength', '🦁', 'courage:勇気/patience:忍耐/compassion:思いやり', '強さとは、やさしく包みこむ力。あせらず、根気よく向き合えば道は開けます。', 'self-doubt:自信のなさ/weakness:弱気/impatience:焦り', '自分を信じきれていない時。小さな成功を重ねて、自信をとりもどして。'],
  ['隠者', 'The Hermit', '🏮', 'introspection:内省/solitude:ひとりの時間/inner guidance:内なる導き', 'ひとりで考える時間が、本当に大切なものを照らします。', 'isolation:孤立/loneliness:さびしさ/withdrawal:閉じこもり', '閉じこもりすぎかも。信頼できる人に、少しだけ心を開いて。'],
  ['運命の輪', 'Wheel of Fortune', '🎡', 'change:変化/cycles:めぐり合わせ/luck:幸運', '流れが大きく変わる時。めぐってきたチャンスの波に乗って。', 'bad luck:不運/resistance:抵抗/setbacks:停滞', '流れが一時的に止まっています。めぐりはまた変わるから、今は準備を。'],
  ['正義', 'Justice', '⚖️', 'fairness:公平/truth:真実/balance:バランス', '正直に、公平に。これまでの行いにふさわしい答えが返ってきます。', 'unfairness:不公平/dishonesty:ごまかし/imbalance:かたより', 'どこかに無理やごまかしが。冷静に事実を見直して。'],
  ['吊るされた男', 'The Hanged Man', '🙃', 'pause:休止/letting go:手放す/new perspective:新しい見方', '動けない時こそ、見方を変えるチャンス。いったん手放すと見えてくるものが。', 'stalling:先のばし/stubbornness:意地/indecision:決められない', '意地をはって、むだに耐えていない? 動けない理由を見直して。'],
  ['死神', 'Death', '🦋', 'endings:終わり/transformation:変容/transition:移り変わり', 'ひとつの章が終わり、新しい章が始まる。終わりは、生まれ変わりの合図です。', 'fear of change:変化への恐れ/stagnation:停滞/holding on:執着', '終わらせるべきものに、しがみついているかも。手放す勇気を。'],
  ['節制', 'Temperance', '⚗️', 'balance:調和/moderation:ほどほど/patience:辛抱', 'ちょうどいい加減を見つけて。ちがうものを混ぜ合わせると、うまくいきます。', 'excess:やりすぎ/imbalance:アンバランス/haste:急ぎすぎ', '何かが行き過ぎています。ペースを落として、もとのバランスへ。'],
  ['悪魔', 'The Devil', '⛓️', 'temptation:誘惑/attachment:執着/habits:くせ', 'やめたいのにやめられないものが、あなたを縛っていない? まずは気づくことから。', 'release:解放/breaking free:抜け出す/awareness:気づき', '鎖がゆるみ始めています。悪いくせや関係から抜け出すチャンス。'],
  ['塔', 'The Tower', '⚡', 'sudden change:急な変化/upheaval:激動/revelation:目覚め', '思いがけない出来事が、古い土台をくずします。おどろいても、それは本当の自分を取りもどすため。', 'averting disaster:回避/fear of change:変化への恐れ/delay:先送り', 'くずれる前に気づけるかも。小さな変化を、先に受け入れて。'],
  ['星', 'The Star', '⭐', 'hope:希望/inspiration:ひらめき/renewal:再生', '傷ついたあとに差す、やさしい光。願いは、かなう方へ向かっています。', 'discouragement:落胆/lack of faith:不信/disconnection:見失う', '希望を見失いかけている時。小さな楽しみから、光をとりもどして。'],
  ['月', 'The Moon', '🌕', 'illusion:まぼろし/intuition:直感/uncertainty:不安', 'はっきりしないことが多く、不安になりやすい時。思いこみに注意して、直感は大切に。', 'clarity:晴れる/release of fear:不安が消える/truth revealed:真相', 'もやが晴れてきました。かくれていたことが明らかになります。'],
  ['太陽', 'The Sun', '☀️', 'success:成功/joy:喜び/vitality:元気', 'すべてが明るく照らされる、最高の時。素直に楽しんで。', 'temporary gloom:一時のくもり/overconfidence:過信/delays:遅れ', '少し雲がかかっているだけ。太陽は消えていないわ。'],
  ['審判', 'Judgement', '📯', 'awakening:目覚め/rebirth:復活/calling:呼びかけ', '過去が報われ、再スタートの時。心の呼びかけに応えて。', 'self-doubt:迷い/regret:後悔/ignoring the call:見送り', '過去を悔やんで動けない時。自分をゆるすことから始めて。'],
  ['世界', 'The World', '🌍', 'completion:完成/fulfillment:達成/wholeness:調和', 'ひとつの旅が完成します。達成感を味わい、次の世界へ。', 'incompletion:未完成/shortcuts:近道/delays:先のばし', 'あと一歩のところ。最後の仕上げを、ていねいに。'],
];

// 小アルカナ:エース〜10、ペイジ・ナイト・クイーン・キング
const RANK = [['エース', 'Ace', 'A'], ['2', 'Two', 'II'], ['3', 'Three', 'III'], ['4', 'Four', 'IV'], ['5', 'Five', 'V'], ['6', 'Six', 'VI'], ['7', 'Seven', 'VII'], ['8', 'Eight', 'VIII'], ['9', 'Nine', 'IX'], ['10', 'Ten', 'X'],
  ['ペイジ', 'Page', 'PAGE'], ['ナイト', 'Knight', 'KNIGHT'], ['クイーン', 'Queen', 'QUEEN'], ['キング', 'King', 'KING']];
const MINOR = {
  wands: [
    ['inspiration:ひらめき/new venture:新しい挑戦/potential:可能性', '情熱の火がともる時。新しい挑戦を始めて。', 'delays:遅れ/lack of motivation:やる気が出ない/hesitation:ためらい', 'やる気の火がつきにくい時。小さな一歩から。'],
    ['planning:計画/future:将来/decision:決断', '世界を見わたして、次の一手を計画する時。', 'fear of the unknown:未知への不安/poor planning:計画不足/playing safe:安全策', '安全な場所から出るのがこわいのかも。視野を少し広げて。'],
    ['expansion:広がり/foresight:先見/progress:前進', 'まいた種が育ち始め、遠くから良い知らせが。', 'obstacles:障害/delays:遅れ/frustration:もどかしさ', '思ったより時間がかかっています。あせらず待って。'],
    ['celebration:お祝い/harmony:なごやかさ/home:居場所', 'うれしい節目。仲間と喜びを分かち合って。', 'instability:不安定/transition:移り変わり/lack of support:支えの不足', '居場所が少しゆらいでいます。身近な人とのつながりを大切に。'],
    ['competition:競争/conflict:衝突/rivalry:張り合い', '意見がぶつかり合う時。健全な競争は、成長のもと。', 'avoiding conflict:衝突を避ける/compromise:歩み寄り/inner conflict:心の葛藤', '争いは落ち着きつつあります。歩み寄りがカギ。'],
    ['victory:勝利/recognition:評価/confidence:自信', '努力が認められ、拍手を浴びる時。', 'self-doubt:自信のなさ/setback:つまずき/egotism:うぬぼれ', '評価が思うように得られない時。人の目より、自分の手ごたえを。'],
    ['perseverance:がんばり/defense:守り/standing firm:ゆずらない', '立場を守る時。信念をもって、ゆずらないで。', 'giving up:あきらめ/overwhelmed:圧倒される/exhaustion:疲れ', 'ひとりで抱えすぎて、つかれていない? 助けを借りても大丈夫。'],
    ['speed:スピード/movement:動き/news:知らせ', '物事が一気に動き出します。知らせはすぐそこ。', 'delays:遅れ/frustration:いらだち/waiting:待機', 'タイミングが少しずれています。あせりは禁物。'],
    ['resilience:ねばり強さ/persistence:粘り/last stretch:最後のひとふんばり', 'ゴールは目の前。傷ついても、あと少しだけ踏んばって。', 'fatigue:疲労/suspicion:疑い/giving up:投げ出す', '警戒しすぎてつかれています。少し肩の力をぬいて。'],
    ['burden:重荷/responsibility:責任/hard work:苦労', '背負いすぎています。本当に大事な荷物だけを。', 'release:荷をおろす/delegation:人に任せる/collapse:抱えきれない', '荷をおろす時。人に任せることも、強さよ。'],
    ['curiosity:好奇心/enthusiasm:熱意/discovery:発見', 'わくわくする知らせや出会い。好奇心のままに動いて。', 'impatience:せっかち/setbacks:つまずき/lack of direction:方向が定まらない', '思いつきが続かない時。ひとつにしぼってみて。'],
    ['adventure:冒険/energy:エネルギー/passion:情熱', '勢いよく飛び出す時。行動力が運を呼びます。', 'haste:急ぎすぎ/impulsiveness:衝動/recklessness:向こう見ず', '勢いだけで突っ走りがち。いったん深呼吸して。'],
    ['confidence:自信/warmth:あたたかさ/determination:意志', '明るく堂々と。あなたの魅力が人を引きつけます。', 'jealousy:嫉妬/insecurity:不安/demanding:気むずかしさ', '人と比べて自信をなくしていない? 自分の良さを思い出して。'],
    ['leadership:統率力/vision:ビジョン/boldness:大胆さ', '大きなビジョンを描き、人を引っぱる時。', 'arrogance:横柄/rash decisions:早まった決断/high expectations:理想が高すぎる', '自分のやり方を押しつけていない? 周りの声にも耳を。'],
  ],
  cups: [
    ['new love:新しい愛/emotion:感情/compassion:思いやり', '心が満ちあふれる始まり。新しい愛や友情の予感。', 'blocked feelings:気持ちのつまり/emptiness:むなしさ/repressed emotions:おさえた感情', '気持ちにふたをしていない? 素直に感じていいのよ。'],
    ['partnership:パートナー/connection:結びつき/attraction:引かれ合う', '心が通じ合う相手との出会いや、きずなが深まる時。', 'breakup:別れ/imbalance:かたより/tension:気まずさ', '気持ちのやりとりが、かみ合っていません。まずは話して。'],
    ['friendship:友情/celebration:お祝い/community:仲間', '仲間と笑い合う時。お祝いごとにも縁が。', 'overindulgence:遊びすぎ/gossip:うわさ話/isolation:仲間はずれ', '楽しさに流されすぎかも。人間関係のうわさには注意して。'],
    ['apathy:無関心/contemplation:もの思い/missed opportunity:見のがし', '今あるものへの不満で、差し出されたものに気づかないかも。', 'awareness:気づき/new motivation:新しいやる気/acceptance:受け入れる', 'ぼんやりした時期が終わり、新しい興味がわいてきます。'],
    ['loss:喪失/regret:後悔/grief:悲しみ', '失ったものに目が向く時。でも、まだ残っているカップもあるの。', 'acceptance:受け入れる/moving on:前へ進む/forgiveness:ゆるし', '悲しみがやわらぎ、前を向けるようになります。'],
    ['nostalgia:なつかしさ/childhood:子どものころ/innocence:無邪気', 'なつかしい人や思い出が、心をあたためてくれます。', 'living in the past:過去にとらわれる/moving forward:先へ進む/maturity:成熟', '昔をなつかしむのは、ほどほどに。今を生きて。'],
    ['choices:選択肢/fantasy:夢想/illusion:まぼろし', '夢がたくさん。でも、どれが本物か見きわめて。', 'clarity:はっきりする/decision:決断/true desire:本当の望み', '迷いが晴れて、本当に望むものが見えてきます。'],
    ['walking away:立ち去る/disillusion:失望/searching:探し求める', '満たされない場所から、静かに旅立つ時。', 'fear of change:変化への恐れ/drifting:さまよい/avoidance:逃避', '離れるべきか迷っています。何を求めているのか、まず確かめて。'],
    ['contentment:満足/wish fulfilled:願いがかなう/satisfaction:充実', '願いがかなう「ウィッシュカード」。素直に喜んで。', 'dissatisfaction:不満/greed:欲ばり/materialism:見かけの豊かさ', '手に入れても満たされない? 本当の幸せの形を見直して。'],
    ['happiness:幸せ/family:家族/harmony:調和', '心からの幸せ、家族や仲間との平和な時。', 'broken relationships:ぎくしゃく/misalignment:すれ違い/disharmony:不和', '身近な人とのすれ違い。理想の形にこだわりすぎないで。'],
    ['creativity:想像力/intuitive message:直感のメッセージ/sensitivity:感受性', 'かわいらしい知らせや、心がときめく出来事。', 'immaturity:気まぐれ/insecurity:自信のなさ/blocked creativity:ひらめき不足', '気分にふりまわされがち。気持ちを言葉にしてみて。'],
    ['romance:ロマンス/charm:魅力/invitation:誘い', 'ロマンチックな誘いや提案がやってきます。', 'moodiness:気分屋/unrealistic:非現実的/jealousy:やきもち', '甘い言葉だけで判断しないで。行動もよく見て。'],
    ['compassion:思いやり/calm:落ちつき/intuition:直感', 'やさしく人の気持ちに寄りそえる時。', 'insecurity:不安定/dependence:依存/emotional overload:感情の波', '人の気持ちを背負いすぎ。自分の心も大切に。'],
    ['emotional balance:心の安定/diplomacy:おだやかな対応/generosity:寛大さ', '感情に流されず、広い心で人を受けとめる時。', 'manipulation:感情で動かす/moodiness:不機嫌/coldness:冷たさ', '気持ちをおさえこみすぎて、冷たく見えているかも。'],
  ],
  swords: [
    ['clarity:明晰さ/breakthrough:突破/truth:真実', '頭がさえて、問題を一刀両断できる時。', 'confusion:混乱/misjudgment:判断ミス/chaos:混沌', '考えがまとまらない時。情報を整理して。'],
    ['indecision:決められない/stalemate:こう着/avoidance:目をそらす', 'どちらも選べずに、目をふさいでいます。目かくしをはずして。', 'information overload:情報過多/release:決断できる/confusion:混乱', '迷いの限界。決めることで、心が軽くなります。'],
    ['heartbreak:失恋/sorrow:悲しみ/painful truth:つらい真実', '心が痛む出来事。悲しみをがまんせず、ちゃんと感じて。', 'recovery:回復/forgiveness:ゆるし/healing:痛みが癒える', '傷は少しずつ癒えていきます。'],
    ['rest:休息/recovery:回復/contemplation:静養', 'しっかり休む時。休むことも前進よ。', 'restlessness:落ち着かない/burnout:燃えつき/stagnation:停滞', '休みが足りないか、休みすぎ。リズムを整えて。'],
    ['conflict:争い/defeat:負け/winning at all costs:勝ちにこだわる', '勝っても何かを失う争い。本当に勝つ価値がある?', 'reconciliation:仲直り/making amends:つぐない/resentment:わだかまり', '争いの後始末の時。仲直りのきっかけを。'],
    ['transition:移行/moving on:先へ進む/calmer waters:静かな場所へ', 'つらい場所を離れ、おだやかな方へ進んでいます。', 'resistance:変化への抵抗/unfinished business:やり残し/baggage:引きずる', '過去の荷物を持ったまま。置いていけるものはない?'],
    ['strategy:作戦/wit:機転/deception:ずるさ', '正面からでなく、頭を使う時。ただし、ずるはほどほどに。', 'confession:打ち明ける/conscience:良心/getting caught:ばれる', 'かくしごとは明るみに出やすい時。正直が一番。'],
    ['restriction:しばられる/self-imposed limits:思いこみの限界/powerlessness:無力感', '動けないと思いこんでいるだけ。縄は意外とゆるいの。', 'freedom:解放/new perspective:新しい見方/self-acceptance:自分を受け入れる', '思いこみから抜け出し、自由になれます。'],
    ['anxiety:不安/worry:心配/nightmares:悪い夢', '心配で眠れない夜。不安は、頭の中で大きくなりがち。', 'hope:希望/reaching out:打ち明ける/recovery:立ち直り', '最悪の時は過ぎました。だれかに話すと、ずっと楽に。'],
    ['endings:終わり/rock bottom:どん底/painful ending:つらい結末', 'これ以上悪くはならない、どん底。夜明けはここから。', 'recovery:回復/regeneration:再生/resisting the end:終わりをこばむ', '最悪を抜けて、ゆっくり回復していきます。'],
    ['curiosity:好奇心/new ideas:新しい考え/vigilance:用心深さ', '情報を集め、よく観察する時。', 'gossip:うわさ/haste:早とちり/all talk:口だけ', '早とちりや、うわさ話に注意。'],
    ['ambition:野心/action:行動/quick thinking:すばやい判断', 'すばやく決断し、まっすぐ切りこむ時。', 'restlessness:せわしなさ/harshness:言いすぎ/burnout:燃えつき', '勢いで人を傷つけていない? 言葉はやわらかく。'],
    ['boundaries:けじめ/independence:自立/honesty:率直さ', '感情より事実を見て、はっきり伝える時。', 'coldness:冷たさ/bitterness:とげとげしさ/harsh judgment:きびしすぎる判断', '正しさが、きつさになっていない? やさしさも少し。'],
    ['authority:権威/logic:論理/truth:真実', '冷静な判断と公平な態度で、信頼を得る時。', 'abuse of power:権力の乱用/manipulation:あやつる/cold logic:冷たい理屈', '理屈で人を追いつめないで。'],
  ],
  pentacles: [
    ['opportunity:チャンス/prosperity:豊かさ/new job:新しい仕事', 'お金や仕事の、確かなチャンスの芽。', 'missed opportunity:チャンスを逃す/poor planning:計画不足/scarcity:不足', 'チャンスを生かしきれていないかも。計画を見直して。'],
    ['balance:やりくり/adaptability:柔軟さ/juggling:両立', 'いくつものことを、楽しくやりくりできる時。', 'overwhelm:手一杯/disorganization:ちらかり/imbalance:釣り合いがくずれる', '手一杯で、どれも中途半端。優先順位を。'],
    ['teamwork:チームワーク/skill:腕前/learning:学び', 'みんなで力を合わせると、良いものができます。', 'lack of teamwork:協力不足/sloppiness:いいかげん/disorganization:ばらばら', 'チームの足並みがそろわない時。役割を確かめて。'],
    ['security:安定/saving:たくわえ/control:管理', 'しっかり守り、たくわえる時。', 'greed:けち/possessiveness:手放せない/insecurity:不安', 'にぎりしめすぎています。少しゆるめると、流れがよくなるの。'],
    ['hardship:苦しさ/money worries:お金の心配/isolation:孤独', '心もお財布も寒い時。助けを求めていいのよ。', 'recovery:回復/help arrives:助けが来る/inner poverty:心の貧しさ', '苦しい時期が終わりかけています。差し出された手をにぎって。'],
    ['generosity:気前のよさ/giving and receiving:与えて受け取る/charity:助け合い', '与え、受け取る、よい循環の時。', 'debt:借り/one-sided giving:一方的/strings attached:見返り', 'どちらかに負担がかたよっています。'],
    ['patience:辛抱/long-term view:長い目/investment:投資', 'すぐに結果は出なくても、育っています。長い目で。', 'impatience:じれったさ/poor results:実りが少ない/wasted effort:むだ骨', '努力の方向がずれていないか、見直して。'],
    ['diligence:勤勉/craftsmanship:職人わざ/practice:練習', 'こつこつ積み重ねる時。練習は裏切らないわ。', 'perfectionism:完ぺき主義/lack of focus:集中できない/shortcuts:手ぬき', '完ぺきを求めすぎか、手を抜きすぎ。'],
    ['independence:自立/luxury:ゆとり/self-reliance:自分の力', '自分の力で手に入れたゆとり。ごほうびを楽しんで。', 'overworking:働きすぎ/financial setback:お金のつまずき/showing off:見えっぱり', 'ゆとりを見せるために、無理をしていない?'],
    ['wealth:富/legacy:受けつぐもの/family:家族', '長く続く豊かさと、家族のきずな。', 'financial failure:失敗/family disputes:家族のもめごと/instability:不安定', 'お金や家のことで、ちょっとしたもめごとが。'],
    ['ambition:向上心/study:勉強/new opportunity:新しいチャンス', '学び始めにぴったり。こつこつ続ければ実になります。', 'procrastination:先のばし/lack of progress:進まない/unrealistic goals:背のび', '計画倒れになりがち。目標を小さく区切って。'],
    ['hard work:努力/routine:決まった手順/reliability:まじめさ', '地道に、まじめに。ゆっくりでも確実に進みます。', 'boredom:たいくつ/stagnation:足ぶみ/laziness:なまけ', '同じことの繰り返しに、あきていない? 小さな変化を。'],
    ['nurturing:世話/practicality:実用的/comfort:くつろぎ', '暮らしを整え、まわりを安心させる力。', 'self-neglect:自分を後回し/imbalance:かたより/smothering:かまいすぎ', '家や人のことばかりで、自分を後回しに。'],
    ['abundance:豊かさ/security:安心/reliability:たよりがい', '経験と実力で、確かな成功をつかむ時。', 'greed:欲深さ/stubbornness:頑固/materialism:お金第一', 'お金や結果だけにこだわっていない?'],
  ],
};
const COURT_G = ['📜', '🐎', '👸', '🤴'];

export const CARDS = [];
MAJOR.forEach((c, i) => CARDS.push({ id: 'm' + String(i).padStart(2, '0'), n: c[0], en: c[1], num: ROMAN[i], suit: 'major', g: c[2], up: { kw: k(c[3]), m: c[4] }, rv: { kw: k(c[5]), m: c[6] } }));
for (const [suit, list] of Object.entries(MINOR)) list.forEach((c, i) => {
  const S = SUITS[suit], R = RANK[i];
  CARDS.push({ id: suit[0] + String(i + 1).padStart(2, '0'), n: `${S.n}の${R[0]}`, en: `${R[1]} of ${S.en}`, num: R[2], suit, rank: i + 1, court: i >= 10 ? COURT_G[i - 10] : '', up: { kw: k(c[0]), m: c[1] }, rv: { kw: k(c[2]), m: c[3] } });
});
export const CARD = Object.fromEntries(CARDS.map(c => [c.id, c]));
