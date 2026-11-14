// 汎用の「チャンク分け文データ」。並べ替えゲーム(チャンクボックス)ほか、いろいろなゲームで使い回す。
//   1行=1文。「 | 」でチャンクを区切り、書く順番は「日本語として自然な順」。書き方:役割:日本語=英語
//   役割  F 前提(文頭のひとこと・もし/〜ので)  S 主役(主語)  V どうしてる？(動詞)  I 誰に(間接目的語)
//         O 何を(目的語)  C どんな感じ？(補語)  P どこで(場所)  T いつ(時)
//   英語は、ふつうは「F S V I O C P T」の順。名前や I 以外は小文字ではじめる(文頭で自動的に大文字になる)。
//   T(いつ)は、文のはじめに置いてもよい(その時は「,」が自動でつく)。F の英語には、最後の「,」を自分で書く。
export const ROLES = {
  F: { name: '前提', gram: '文頭の副詞', col: '#c3b1ee' },
  S: { name: '主役', gram: '主語', col: '#ff9fb4' },
  V: { name: 'どうしてる？', gram: '動詞', col: '#ffd36b' },
  I: { name: '誰に', gram: '間接目的語', col: '#9fd7ff' },
  O: { name: '何を', gram: '目的語', col: '#9fe0c0' },
  C: { name: 'どんな感じ？', gram: '補語', col: '#ffb88a' },
  P: { name: 'どこで', gram: '場所の副詞', col: '#c8e6a0' },
  T: { name: 'いつ', gram: '時の副詞', col: '#e8b0e8' },
};
export const ORDER = ['F', 'S', 'V', 'I', 'O', 'C', 'P', 'T'];   // 英語の順番

// 文型の名前(チャンクチャンクの呼び方と、文法用語)
export function typeOf(roles) {
  const has = r => roles.includes(r);
  if (has('I') && has('O')) return { name: 'はいどうぞ！文', sub: '誰かに、何かを渡す', gram: '第4文型 S+V+O+O' };
  if (has('O') && has('C')) return { name: '関係あるよ文', sub: '相手が、どうなる？', gram: '第5文型 S+V+O+C' };
  if (has('O')) return { name: '何するの？文', sub: '〇〇が、何をする？', gram: '第3文型 S+V+O' };
  if (has('C')) return { name: 'だよ！文', sub: '〇〇は〜だよ！', gram: '第2文型 S+V+C' };
  return { name: 'ただする文', sub: '〇〇がする！', gram: '第1文型 S+V' };
}

// 英語の文を作る。bySlot = { 枠の役割: チャンク }。いつ(T)を前提の枠に置いたら「,」をつける
export function buildEn(bySlot) {
  const parts = [];
  for (const r of ORDER) { const c = bySlot[r]; if (!c) continue; parts.push(r === 'F' && c.role === 'T' ? c.en + ',' : c.en); }
  const s = parts.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? '' : '.');
}

export function parseSentence(line, id) {
  const chunks = []; const seen = {};
  for (const u of line.split(' | ')) {
    const m = u.trim().match(/^([A-Z]):(.+?)=(.+)$/); if (!m || !ROLES[m[1]] || seen[m[1]]) return null;
    seen[m[1]] = 1; chunks.push({ role: m[1], ja: m[2].trim(), en: m[3].trim() });
  }
  if (chunks.length < 2 || !seen.S || !seen.V) return null;
  const by = {}; chunks.forEach(c => { by[c.role] = c; });
  const roles = ORDER.filter(r => by[r]);
  return { id, chunks, roles, n: chunks.length, ja: chunks.map(c => c.ja).join('') + '。', en: buildEn(by), type: typeOf(roles) };
}

let LIST = null;
export function chunkSentences() {
  if (LIST) return LIST;
  LIST = []; let i = 0;
  for (const l of LINES.split('\n')) { const t = l.trim(); if (!t || t[0] === '#') continue; const s = parseSentence(t, 'cs' + (++i)); if (s) LIST.push(s); else console.warn('chunk_sentences: bad line', t); }
  return LIST;
}

const LINES = `
# ---- 3つ(やさしい) ----
S:私は=I | O:猫が=cats | V:好きだ=like
S:彼女は=she | O:テニスを=tennis | V:する=plays
S:犬は=the dog | P:庭で=in the garden | V:走る=runs
S:私たちは=we | T:毎日=every day | V:勉強する=study
S:母は=my mother | O:パンを=bread | V:焼く=bakes
S:彼は=he | C:先生=a teacher | V:だ=is
S:弟は=my brother | C:おなかがすいて=hungry | V:いる=is
S:鳥は=birds | P:空を=in the sky | V:飛ぶ=fly
S:父は=my father | O:新聞を=a newspaper | V:読む=reads
S:私は=I | O:お茶を=tea | V:飲む=drink
S:彼らは=they | P:東京に=in Tokyo | V:住んでいる=live
S:猫は=the cat | P:ソファーの上で=on the sofa | V:眠る=sleeps
S:ケンは=Ken | O:ギターを=the guitar | V:弾く=plays
S:私の姉は=my sister | C:看護師=a nurse | V:だ=is
S:その店は=the shop | T:9時に=at nine | V:開く=opens
S:雨は=the rain | T:夜に=at night | V:やんだ=stopped
S:私たちは=we | O:サッカーを=soccer | V:する=play
S:彼女は=she | P:図書館で=in the library | V:勉強する=studies
S:あなたは=you | C:親切=kind | V:だ=are
S:空は=the sky | C:青く=blue | V:見える=looks
S:私は=I | T:毎朝=every morning | V:走る=run
S:彼は=he | T:昨日=yesterday | V:来た=came
S:子どもたちは=the children | P:公園で=in the park | V:遊ぶ=play
S:姉は=my sister | O:ピアノを=the piano | V:弾く=plays
S:鳥は=a bird | P:木の上で=in the tree | V:歌っている=is singing
S:赤ちゃんは=the baby | P:ベッドで=in the bed | V:眠っている=is sleeping
S:私たちは=we | O:昼ごはんを=lunch | V:食べる=eat
S:彼は=he | O:車を=a car | V:持っている=has
S:生徒たちは=the students | P:教室で=in the classroom | V:待っている=are waiting
S:私は=I | P:学校へ=to school | V:歩いて行く=walk
S:バスは=the bus | T:7時に=at seven | V:来る=comes
S:祖父は=my grandfather | P:田舎に=in the country | V:住んでいる=lives
S:私は=I | C:眠く=sleepy | V:なった=became
S:彼女は=she | C:幸せそうに=happy | V:見える=looks
S:その考えは=the idea | C:よさそうに=good | V:聞こえる=sounds
S:このスープは=this soup | C:おいしい味が=good | V:する=tastes
S:私の母は=my mother | C:医者=a doctor | V:だ=is
S:トムと私は=Tom and I | C:友だち=friends | V:だ=are
S:私たちは=we | T:今日=today | V:休む=rest
S:彼女は=she | O:その歌を=the song | V:知っている=knows
S:妹は=my sister | O:絵を=pictures | V:かく=draws
S:犬は=dogs | O:骨が=bones | V:好きだ=like
S:カメは=turtles | P:水の中で=in the water | V:泳ぐ=swim
S:私たちは=we | P:海で=at the sea | V:泳いだ=swam
S:列車は=the train | T:定刻に=on time | V:着いた=arrived
S:彼は=he | O:朝食を=breakfast | V:作る=makes
S:私は=I | O:窓を=the window | V:開けた=opened
S:彼女は=she | O:ドアを=the door | V:閉めた=closed
S:みんなは=everyone | O:その知らせを=the news | V:聞いた=heard
S:鳥たちは=birds | T:春に=in spring | V:戻ってくる=come back
S:花は=flowers | T:春に=in spring | V:咲く=bloom
S:雪は=snow | T:冬に=in winter | V:降る=falls
S:私は=I | T:夜に=at night | V:勉強する=study
S:この花は=this flower | C:いい香りが=sweet | V:する=smells
S:彼は=he | C:とても疲れて=very tired | V:いる=is
S:私たちは=we | P:ここで=here | V:待つ=wait
S:先生は=the teacher | T:もうすぐ=soon | V:来る=will come
# ---- 4つ(ふつう) ----
T:毎朝=every morning | S:父は=my father | O:コーヒーを=coffee | V:飲む=drinks
T:日曜日に=on Sundays | S:彼女は=she | O:テニスを=tennis | V:する=plays
P:公園で=in the park | S:子どもたちは=the children | T:放課後=after school | V:遊ぶ=play
S:私は=I | P:図書館で=in the library | O:本を=a book | V:読んだ=read
S:母は=my mother | T:毎晩=every evening | O:夕食を=dinner | V:作る=cooks
S:私たちは=we | P:学校へ=to school | T:毎日=every day | V:歩いて行く=walk
S:ケンは=Ken | T:昨日=yesterday | O:新しい自転車を=a new bike | V:買った=bought
S:姉は=my sister | P:駅で=at the station | O:友だちに=her friend | V:会った=met
S:弟は=my brother | T:毎晩=every night | O:宿題を=his homework | V:する=does
S:祖母は=my grandmother | P:庭で=in her garden | O:トマトを=tomatoes | V:育てている=grows
S:私は=I | T:今朝=this morning | O:牛乳を=milk | V:飲んだ=drank
S:私たちは=we | T:去年の夏=last summer | P:ビーチで=on the beach | V:遊んだ=played
S:トムは=Tom | T:昨夜=last night | O:その映画を=the movie | V:見た=watched
S:私の犬は=my dog | T:毎晩=every night | P:ベッドの下で=under the bed | V:眠る=sleeps
S:彼女は=she | T:毎週=every week | O:手紙を=a letter | V:書く=writes
S:私たちは=we | P:家で=at home | O:音楽を=music | V:聞く=listen to
S:兄は=my brother | T:朝=in the morning | P:川の近くで=near the river | V:走る=runs
S:彼は=he | T:毎月=every month | O:お金を=money | V:ためる=saves
S:私は=I | T:誕生日に=on my birthday | O:ケーキを=a cake | V:もらった=got
S:鳥たちは=the birds | T:朝=in the morning | P:木の上で=in the tree | V:歌う=sing
S:彼女は=she | T:今日=today | C:とても疲れて=very tired | V:見える=looks
S:私は=I | T:今=now | C:とても幸せ=very happy | V:だ=am
S:彼は=he | P:日本で=in Japan | C:有名な歌手=a famous singer | V:だ=is
S:私たちは=we | T:来週=next week | O:試験を=a test | V:受ける=have
S:母は=my mother | P:スーパーで=at the supermarket | O:野菜を=vegetables | V:買う=buys
S:私は=I | P:公園で=in the park | O:犬を=a dog | V:見た=saw
S:先生は=the teacher | T:毎日=every day | O:宿題を=homework | V:出す=gives
S:私は=I | T:毎日=every day | O:英語を=English | V:勉強する=study
S:私たちは=we | T:3日間=for three days | P:ホテルに=at a hotel | V:泊まった=stayed
S:その列車は=the train | T:10時に=at ten | P:京都へ=to Kyoto | V:行く=goes
S:ジムは=Jim | T:先週=last week | P:大阪に=to Osaka | V:行った=went
S:彼らは=they | T:今夜=tonight | O:パーティーを=a party | V:開く=have
S:私は=I | T:昨日=yesterday | O:新しい靴を=new shoes | V:買った=bought
S:彼女は=she | P:台所で=in the kitchen | O:クッキーを=cookies | V:焼いている=is baking
S:犬は=the dog | P:庭で=in the garden | O:ボールを=a ball | V:追いかけている=is chasing
S:私たちは=we | T:冬に=in winter | O:スキーを=skiing | V:楽しむ=enjoy
S:兄は=my brother | P:部屋で=in his room | O:ゲームを=a game | V:している=is playing
S:先生は=the teacher | T:今朝=this morning | O:テストを=a test | V:返した=returned
S:私は=I | T:毎晩=every night | O:日記を=a diary | V:書く=write
S:その子は=the girl | P:窓のそばで=by the window | O:本を=a book | V:読んでいる=is reading
S:ボブは=Bob | T:毎日=every day | P:プールで=in the pool | V:泳ぐ=swims
S:彼女は=she | T:毎朝=every morning | O:花に水を=the flowers | V:やる=waters
S:雨が=rain | T:一日中=all day | P:町に=in the town | V:降った=fell
S:サキは=Saki | T:昨日=yesterday | C:病気=sick | V:だった=was
S:その犬は=the dog | T:今日=today | C:元気=happy | V:だ=is
S:私たちは=we | T:先週=last week | O:その山に=the mountain | V:登った=climbed
S:私は=I | P:ここで=here | O:友だちを=my friend | V:待つ=wait for
S:彼は=he | P:駅で=at the station | O:切符を=a ticket | V:買った=bought
S:彼女は=she | P:ステージで=on the stage | O:歌を=a song | V:歌った=sang
S:ネコが=the cat | P:机の上で=on the desk | C:ねむそうに=sleepy | V:見える=looks
T:昨夜=last night | P:山に=on the mountain | S:雪が=snow | V:降った=fell
S:私の父は=my father | T:今=now | P:台所に=in the kitchen | V:いる=is
# ---- 5つ以上(むずかしい) ----
F:もし雨が降ったら=if it rains, | S:私たちは=we | P:家に=at home | V:いる=will stay
F:疲れていたので=because I was tired, | S:私は=I | P:ベッドに=to bed | V:行った=went
F:暑いので=since it is hot, | S:私たちは=we | O:水を=water | V:飲む=drink
F:時間があれば=if I have time, | S:私は=I | O:映画を=a movie | V:見る=will watch
F:ひまなときは=when I am free, | S:私は=I | O:本を=books | V:読む=read
F:家に着いたとき=when I got home, | S:母は=my mother | O:夕食を=dinner | V:作っていた=was cooking
F:晴れたら=if it is sunny, | S:私たちは=we | P:公園へ=to the park | V:行く=will go
S:私は=I | T:昨日=yesterday | I:友だちに=my friend | O:本を=a book | V:貸した=lent
S:母は=my mother | T:毎日=every day | I:私に=me | O:お弁当を=a lunch box | V:作る=makes
S:先生は=the teacher | I:私たちに=us | O:英語を=English | V:教える=teaches
S:祖母は=my grandmother | T:誕生日に=on my birthday | I:私に=me | O:プレゼントを=a present | V:くれた=gave
S:彼は=he | I:彼女に=her | O:花を=flowers | V:送った=sent
S:私は=I | I:弟に=my brother | O:時計を=a watch | V:買った=bought
S:父は=my father | T:クリスマスに=at Christmas | I:私に=me | O:自転車を=a bike | V:買った=bought
S:私は=I | I:彼に=him | O:その写真を=the picture | V:見せた=showed
S:彼女は=she | I:私に=me | O:手紙を=a letter | V:書いた=wrote
S:ケンは=Ken | I:ミキに=Miki | O:ペンを=a pen | V:貸した=lent
S:店員は=the clerk | I:私に=me | O:おつりを=change | V:渡した=gave
S:おじは=my uncle | T:先週=last week | I:私たちに=us | O:おみやげを=a souvenir | V:持ってきた=brought
S:私たちは=we | I:先生に=our teacher | O:花を=flowers | V:あげた=gave
S:その知らせは=the news | O:私を=me | C:うれしく=happy | V:した=made
S:音楽は=music | O:私を=me | C:幸せに=happy | V:する=makes
S:私たちは=we | O:その猫を=the cat | C:ミミと=Mimi | V:呼ぶ=call
S:彼らは=they | O:彼を=him | C:リーダーに=the leader | V:した=made
S:先生は=the teacher | O:私たちを=us | C:静かに=quiet | V:させた=kept
S:雨は=the rain | O:道を=the road | C:すべりやすく=slippery | V:した=made
S:私は=I | O:部屋を=my room | C:きれいに=clean | V:保っている=keep
S:彼は=he | O:ドアを=the door | C:開けたままに=open | V:した=left
S:私は=I | T:昨日=yesterday | P:駅で=at the station | O:友だちに=my friend | V:会った=met
S:父は=my father | T:日曜日に=on Sundays | P:台所で=in the kitchen | O:夕食を=dinner | V:作る=cooks
S:私たちは=we | T:放課後=after school | P:公園で=in the park | O:サッカーを=soccer | V:する=play
S:姉は=my sister | T:毎朝=every morning | P:川のそばで=by the river | V:散歩する=walks
F:明日晴れたら=if it is sunny tomorrow, | S:私たちは=we | P:川のそばで=by the river | O:ピクニックを=a picnic | V:する=will have
F:雨が降っていたので=because it was raining, | S:私たちは=we | P:家で=at home | O:ゲームを=games | V:した=played
F:宿題が終わったら=when I finish my homework, | S:私は=I | T:夜に=at night | O:本を=a book | V:読む=will read
F:誕生日なので=because it was my birthday, | S:母は=my mother | I:私に=me | O:ケーキを=a cake | V:作ってくれた=made
F:クリスマスなので=since it is Christmas, | S:彼は=he | I:家族に=his family | O:プレゼントを=presents | V:買う=buys
S:彼女は=she | T:毎週日曜日=every Sunday | P:教会で=at church | O:ピアノを=the piano | V:弾く=plays
S:私の兄は=my brother | T:去年=last year | P:ロンドンで=in London | O:英語を=English | V:勉強した=studied
S:私たちは=we | T:昨日=yesterday | P:レストランで=at a restaurant | O:ピザを=pizza | V:食べた=ate
S:祖父は=my grandfather | T:毎朝=every morning | P:公園で=in the park | O:新聞を=a newspaper | V:読む=reads
S:メアリーは=Mary | T:先月=last month | I:私に=me | O:手紙を=a letter | V:送った=sent
S:私は=I | T:毎年=every year | I:両親に=my parents | O:カードを=a card | V:書く=write
S:姉は=my sister | T:今朝=this morning | I:弟に=my brother | O:朝食を=breakfast | V:作った=made
S:私たちは=we | T:先週の日曜日=last Sunday | P:海で=at the beach | O:貝を=shells | V:集めた=collected
S:母は=my mother | T:毎朝=every morning | P:台所で=in the kitchen | O:お弁当を=lunch boxes | V:作る=makes
T:昨日=yesterday | P:教室で=in the classroom | S:先生は=the teacher | I:私たちに=us | O:歌を=a song | V:教えた=taught
S:祖母は=my grandmother | T:去年のクリスマスに=last Christmas | I:私に=me | O:セーターを=a sweater | V:編んでくれた=knitted
F:雨がやんだら=when the rain stops, | S:私たちは=we | P:外で=outside | O:サッカーを=soccer | V:する=will play
F:試験が終わったので=since the test is over, | S:私たちは=we | T:今日=today | O:映画を=a movie | V:見る=will watch
F:天気がよかったので=because the weather was nice, | S:私たちは=we | P:公園で=in the park | O:お弁当を=lunch | V:食べた=ate
F:おなかがすいたので=because I was hungry, | S:私は=I | T:昼前に=before lunch | O:パンを=some bread | V:食べた=ate
F:雨なので=since it is rainy, | S:私は=I | T:今日=today | P:家で=at home | V:勉強する=will study
S:ケンは=Ken | T:昨日の夜=last night | P:自分の部屋で=in his room | O:手紙を=a letter | V:書いた=wrote
S:私の両親は=my parents | T:毎年夏=every summer | P:北海道で=in Hokkaido | O:休暇を=their vacation | V:過ごす=spend
S:私は=I | T:昨夜=last night | I:友だちに=my friend | O:メールを=an email | V:送った=sent
S:彼は=he | T:毎年=every year | I:母に=his mother | O:花を=flowers | V:贈る=gives
S:父は=my father | T:先週=last week | I:弟に=my brother | O:新しいかばんを=a new bag | V:買った=bought
S:彼女は=she | T:毎晩=every night | I:子どもに=her child | O:本を=a book | V:読む=reads
S:私は=I | T:昨日=yesterday | I:先生に=my teacher | O:質問を=a question | V:した=asked
F:ひまだったので=because I was free, | S:私は=I | T:昨日=yesterday | O:部屋を=my room | C:きれいに=clean | V:した=kept
S:その歌は=the song | T:昨日=yesterday | O:みんなを=everyone | C:うれしく=happy | V:した=made
S:私の母は=my mother | T:去年=last year | P:ロンドンで=in London | C:先生=a teacher | V:だった=was
S:弟は=my brother | T:昨日=yesterday | P:学校で=at school | C:とても疲れて=very tired | V:いた=was
F:晴れていたので=because it was sunny, | S:私たちは=we | T:昨日=yesterday | P:海で=at the beach | V:泳いだ=swam
S:妹は=my sister | T:今朝=this morning | P:台所で=in the kitchen | I:私に=me | O:お茶を=tea | V:入れてくれた=made
`;
