/* レッスン（チャンクストーリー）の「切る場面」を、チャンクチャンク本体のチャレンジで遊ぶための対応表。
   キー＝チャンクストーリーの台本の文（s）。値＝チャレンジが読む形（役：英文=日本語 | …）。
   台本に新しい切る文を足したら、ここにも1行足す（無いときは今までの簡易版で遊べる）。 */
export const LESSON = {
  "Tom | plays soccer.": "S:Tom=トムは | V:plays soccer.=サッカーをする",
  "My sister | likes cats.": "S:My sister=わたしの姉は | V:likes cats.=ネコが好き",
  "The dog | runs fast.": "S:The dog=その犬は | V:runs fast.=速く走る",
  "I | am | happy.": "S:I=わたしは | V:am=＝ | C:happy.=うれしい",
  "She | is | my friend.": "S:She=彼女は | V:is=＝ | C:my friend.=わたしの友だち",
  "Tom | plays | soccer.": "S:Tom=トムは | V:plays=する | O:soccer.=サッカーを",
  "She | met | Tom.": "S:She=彼女は | V:met=会った | O:Tom.=トムに",
  "Tom | opened | the door.": "S:Tom=トムは | V:opened=開けた | O:the door.=ドアを",
  "My mother | makes | lunch.": "S:My mother=母は | V:makes=作る | O:lunch.=昼ごはんを",
  "She | plays | tennis | at school / after class.": "S:She=彼女は | V:plays=する | O:tennis=テニスを | P:at school=学校で | T:after class.=放課後",
  "After lunch, | we | play | soccer | in the park.": "T:After lunch,=昼ごはんのあと | S:we=わたしたちは | V:play=する | O:soccer=サッカーを | P:in the park.=公園で",
  "I | get up | at seven / every day.": "S:I=わたしは | V:get up=起きる | T:at seven=7時に | T:every day.=毎日",
  "The book / I bought yesterday | is | fun.": "S:The book / X:I bought yesterday=昨日買った本は{本は/昨日買った} | V:is=＝ | C:fun.=おもしろい",
  "The girl / with long hair | is | my sister.": "S:The girl / X:with long hair=髪の長い女の子は{女の子は/髪の長い} | V:is=＝ | C:my sister.=わたしの姉",
  "The man / I met | lives | in Tokyo.": "S:The man / X:I met=わたしが会った男の人は{男の人は/わたしが会った} | V:lives=住んでいる | P:in Tokyo.=東京に",
  "My brother | is | a good cook.": "S:My brother=兄は | V:is=＝ | C:a good cook.=料理がじょうず",
  "After school, | Ken | opened | the box | in his room.": "T:After school,=放課後 | S:Ken=ケンは | V:opened=開けた | O:the box=箱を | P:in his room.=自分の部屋で",
  "The cake / my mother made | was | delicious.": "S:The cake / X:my mother made=母が作ったケーキは{ケーキは/母が作った} | V:was=＝ | C:delicious.=おいしかった"
};
/* 切る場面の全部の文が対応表にあるときだけ、チャレンジで遊ぶ。チャレンジの結果（◎◯△▽・×）を、章のクリア画面用の ◯△× に直す */
export function lessonList(items) {
  const out = (items || []).map(it => LESSON[it.s] ? [LESSON[it.s], it.ja] : null);
  return out.length && out.every(Boolean) ? out : null;
}
export function lessonResults(results) {
  return (results || []).map(r => ({ chunks: ((r && r.chunks) || []).map(c => ({ r: c.kind === 'excellent' || c.kind === 'great' ? 'o' : c.kind === 'miss' || c.kind === 'forgot' ? 'x' : 't' })) }));
}
