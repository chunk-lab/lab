import { APP } from './play.js';
// ================= 画面の文字（多言語用の表） =================
// 画面に出る説明の文字はここに集める。新しい言語は tables に1つ足すだけ。
// tx('key') → 今の言語の文字（なければ日本語、それもなければ key）。
// 値が関数なら tx(key, vars) で vars を渡して呼ぶ。'{name}' は vars で置きかえる。
// ※ 英語の選択肢（What？ など）は英語のまま。ここは説明の言語だけ。
export let I18N;
export function tx(key, vars){
 const L=I18N.tables[I18N.lang]||{}, J=I18N.tables.ja;
 let s = (key in L)? L[key] : (key in J)? J[key] : key;
 if(typeof s==='function') return s(vars||{});
 if(vars) s=String(s).replace(/\{(\w+)\}/g,(m,k)=> vars[k]!=null? vars[k] : m);
 return s;
}
// data-i18n="key" を持つ要素の文字を入れかえる
export function applyI18n(root){ (root||document).querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.dataset.i18n; const sp=el.querySelector('span'); const t=tx(k); if(sp){ [...el.childNodes].forEach(n=>{ if(n.nodeType===3) n.remove(); }); el.appendChild(document.createTextNode(t)); } else el.textContent=t; }); }

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_i18n(){
I18N = {
 lang:'ja',
 names:{ja:'日本語'},
 tables:{
  ja:{
   // 下のナビ
   'nav.make':'つくる','nav.prac':'れんしゅう','nav.reg':'ことば登録','nav.sets':'セット','nav.settings':'設定',
   // 促す表示
   'prompt.pre':'文の頭に置く？ 役割で選んでね','prompt.freq':'どのくらい？ 動詞のすぐ前に入るよ','prompt.intens':'どれくらい？ 形容詞のすぐ前に入るよ','prompt.cmpw':'だれ・何とくらべる？',
   'prompt.sadjL':'どんな？ 名詞のすぐ前に入るよ','prompt.exadjL':'なんて〜な？（なしでもOK → ✕）','prompt.oadjL':'どんな？ 名詞のすぐ前に入るよ','prompt.relk':'それが？ それを？ つなげて説明',
   'prompt.cmp':'くらべる？ 上に乗るのはだれ？','prompt.mcmp':'くらべる？ だれより？','prompt.scope':'どの中でいちばん？','prompt.mthan':'だれとくらべる？','prompt.iobj':'だれに？（人が先）','prompt.toWhom':'だれに？',
   'prompt.entry':'どこから始めてもOK！','prompt.subj':'だれの話？ 何の話？','prompt.split':'どんな感じ？ 何かにする？','prompt.obj':'何に？ 選んでね',
   'prompt.thing':()=> (typeof APP!=='undefined' && APP.S && APP.S.main.type==='excl')?'なんて〜な、何？ 人・もの':'何がある？ 何がいる？',
   'prompt.than':'誰とくらべる？','prompt.extras':'文になった！ 続ける？ そのまま完成？','prompt.place':'どこ？ 選ぶと背景が変わるよ','prompt.time':'いつ？ 選ぶと空や時間が変わるよ',
   'prompt.manner':'どんなふうに？','prompt.with':'誰といっしょ？','prompt.tense':'いつの話？ 線の上から選んでね','prompt.modal':'どんな気持ち？ 何ができる？','prompt.q':'何を聞く？',
   'prompt.degree':'どのくらい？','prompt.imp':'どう言う？','prompt.cw':'どんな文を続ける？','prompt.conj':'どんな場面とつなぐ？','prompt.rel':'だれ・何を説明する？','prompt.purpose':'なんのために？',
   'prompt.self_be':'どんな感じ？','prompt.self_do':'自分で何してる？','prompt.vc':'〜することを？ ➡ to か 📷 ing',
   // 見出し（左右のタブ）
   'head.be':'どんな感じ？','head.do':'何する？','head.other':'何かにする？','head.say':'言いたい','head.ask':'聞きたい','head.sayOrAsk':'言いたい？ 聞きたい？',
   // ∞ の入口
   'entry.subj':'誰が（ふつうの文）','entry.tp':'いつから・どこで','entry.time':'いつから','entry.place':'どこで','entry.wi':'〜した時に・もし','entry.when':'〜した時に',
   'entry.ifReal':'もし（ありそう）','entry.ifUnreal':'もし（ありえない・想像）','entry.part':'〜しながら','entry.excl':'なんて〜！','entry.imp':'して！・しよう',
   'entry.impDo':'して！','entry.lets':'しよう！','entry.please':'してください','entry.exist':'ある・いる',
   'ask.yn':'はい・いいえ','ask.be':'〜なの？（状態）','ask.do':'〜する？（動作）','ask.have':'〜したことある？','ask.what':'何を・何をする','ask.who':'誰が・誰と','ask.where':'どこ？','ask.when':'いつ？','ask.why':'どうして？','ask.how':'どう？（〜だ・する）',
   // to / ing
   'vc.to':'これから・向かう','vc.ing':'ひとコマ・事実','vc.toLong':'気持ちがそっちへ向かう（まだ先のこと）','vc.ingLong':'その動作を1枚の写真として切り取る',
   // 文ができたときのカード
   'card.done':'✨ 完成したよ！','card.long':'後ろが長くなってきたよ','card.add':'＋ つけたす','card.finish':'これで完成','card.how':'どうつけたす？',
   'card.tooLong':'後ろは2つまでがちょうどいい','card.goodLen':'いい感じの長さ。足すなら1つまで','card.back':'もどる',
   'card.rel':'どんな？','card.relSub':'後ろからくわしく','card.mid':'いつ？どこ？どう？','card.midSub':'場所・時・何のため…','card.conj':'つなぐ','card.conjSub':'when・if・because・and…',
   // 完成画面
   'fin.hint':'✨ 完成したよ！<br>👇 バーをさわって違いを見よう！','fin.bar':'気持ちバー　弱い ← → 強い ｜ できる・すすめ','fin.done':'✨ 完成したよ！',
   'fin.more':'＋ 続けて足す','fin.fix':'✏️ 日本語をなおす','fin.new':'新しくつくる','fin.vcSwap':'⇄ to / ing',
   // ことばを足す（ゲーム中）
   'add.title':'ここに入れることばを足す','add.en':'英語','add.ja':'日本語（意味のイメージ）','add.e':'絵文字','add.save':'足してすぐ使う','add.cancel':'やめる',
   'add.where':'入る場所','add.saved':'「{en}」を足しました','add.needEn':'英語を入れてください','add.needJa':'日本語も入れてください',
   // AI
   'ai.claude':'🤖 Claudeで判定','ai.other':'ChatGPT・Geminiで判定','ai.copied':'質問をコピーしました。ChatGPTやGeminiに貼りつけて、答えをここに貼ってください',
   'ai.paste':'AIの答えをここに貼る','ai.apply':'答えを読みこむ','ai.bad':'答えを読み取れませんでした。JSONの部分だけ貼ってみてください','ai.busy':'判定中…','ai.fail':'判定できませんでした',
   // パック
   'pack.export':'パックとして書き出す','pack.import':'パックを読みこむ','pack.base':'基本パックを書き出す（翻訳用）','pack.imported':'「{name}」を読みこみました（{n}語）','pack.bad':'パックの形がちがいます',
   'pack.copied':'パックをコピーしました','pack.paste':'パック（JSON）をここに貼りつけ',
  }
 }
};
}
