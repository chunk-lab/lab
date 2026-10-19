/* ChunkStory（読む方のチュートリアル）— 持ち運び用 JS
   中身：① CS_ASSETS（絵の登録）② CS_STORY（台本）③ ChunkStory（仕組み）
   使い方は chunkstory_notes.md を参照。 */
/* ChunkStory 絵の登録。顔は本体の7表情（normal/joy/surprise/sad/panic/think/idea）に変換して読む */
window.CS_ASSETS = {
  config: {
    useImages: true,            // false にすると全部「仮アイコン」
    base: "img/chara/",         // 本体の絵フォルダ。<base><boy|girl>/<表情>.webp を読む
    ext: ".webp",
    storyImages: false,         // true にすると bg/pic も <storyBase><キー>.<storyExt> から読む
    storyBase: "img/story/", storyExt: ".webp",
    debug: false,               // true で仮アイコンにキー名を出す
    /* 台本で使う旧表情名 → 本体の7表情。好きに直してOK */
    faceMap: {
      girl: { normal:"normal", komari:"sad",   odoroki:"surprise", pokan:"think", hirameki:"idea", doya:"joy" },
      boy:  { normal:"normal", ehen:"joy",      egao:"joy",         ijiwaru:"idea" }
    }
  },
  chara: {
    girl: { name: "女の子", color: "#ffc6d9",
      faces: { normal:"通常", komari:"困り", odoroki:"驚き", pokan:"ぽかん", hirameki:"ひらめき", doya:"ドヤ顔" },
      src: {} },
    boy:  { name: "男の子", color: "#c9e4ff",
      faces: { normal:"通常", ehen:"えへん", egao:"笑顔", ijiwaru:"意地悪な笑い" },
      src: {} }
  },
  bg: {
    room: { label: "教室（昼）", color: "linear-gradient(#e8f4ff 0%, #fdf1f6 70%)", src: null }
  },
  pic: {
    scale:  { label: "天秤：左に I・右に happy", src: null },
    arrows: { label: "①矢印が自分に戻る ／ ②矢印が外に伸びる", src: null },
    run:    { label: "走る", src: null }
  }
};

window.CS_STORY = {
  title: "英語って、どうなってるの？",
  modes: [
    { key:"manual", name:"チャンクを切る（自分で送る）" },
    { key:"auto",   name:"チャンクを切る（自動で流れる）" },
    { key:"free",   name:"フリープレイ" }
  ],
  chapters: [
  { no:1, title:"まずは「主役」を探そう", sub:"プロローグ〜主役", unlock:"manual",
    steps:[
      {fx:"bg", key:"room"},
      {fx:"show", l:"girl:komari", r:"boy:normal"},
      {fx:"wall"},
      {say:"girl", f:"komari", t:"はぁ……英語って本当ニガテ。単語がいっぱい並んでると、どこから読めばいいのか全然分かんなくなっちゃうんだよね…。"},
      {fx:"q", who:"girl"}, {fx:"clear"},
      {say:"boy", f:"ehen", t:"大丈夫！英語ってね、実は『普通ならこの順番で説明していく』っていう決まりがあるんだ。視線の移動ルートが決まってると思えばいいよ。"},
      {say:"girl", f:"pokan", t:"順番？ルートがあるの？"},
      {say:"boy", f:"egao", t:"うん。英文を見たら、最初に探すものは必ずひとつだけ！『この文の主役』だよ。"},
      {fx:"line", id:"a", parts:["Tom","plays","soccer."]},
      {say:"boy", f:"normal", t:"たとえば、この文。この文の主役は誰だと思う？"},
      {ask:"a", i:0, t:"主役だと思うことばをタップしてみよう！", ng:"おしい！『誰が？』って考えてみて。"},
      {say:"girl", f:"hirameki", t:"うーん、Tom かな？"},
      {fx:"hl", id:"a", i:0, c:"glow"}, {fx:"badge", id:"a", i:0, t:"👑 主役"},
      {say:"boy", f:"ehen", t:"大正解！"},
      {say:"boy", f:"normal", t:"『誰が？』『何が？』って考えると見つけやすいよ。文の一番最初に来ることが多いんだ。"},
      {say:"girl", f:"komari", t:"でもさ、もっと長い文だったら分からなくなりそう。"},
      {say:"boy", f:"egao", t:"大丈夫。そこにも英語の面白いルールがある。英語はね、『まず最初に主役をズン！と出してから、あとからその主役について説明していく』っていう言語なんだ。"},
      {fx:"push", id:"a", i:0},
      {say:"boy", f:"egao", t:"じゃあさっそく、ゲームで主役を切り出してみよう！"}
    ],
    stage:{ type:"cut", mode:"manual", title:"主役を切り出そう",
      coach:{ start:"▶を押すと、ことばが1つずつ進むよ。主役が線の左に来たら『区切る』！",
              cut:"切れたね！切ったところをタップすると元に戻せるよ。",
              end:"最後まで進んだら『かんせい』を押してね。" },
      items:[
        { s:"Tom | plays soccer.", ja:"トムはサッカーをする。" },
        { s:"My sister | likes cats.", ja:"わたしの姉はネコが好き。" },
        { s:"The dog | runs fast.", ja:"その犬は速く走る。" }
      ] } },

  { no:2, title:"「＝」のことばと「うごき」のことば", sub:"主役のようすを見つける",
    steps:[
      {fx:"bg", key:"room"},
      {fx:"show", l:"girl:normal", r:"boy:normal"},
      {say:"boy", f:"normal", t:"主役が見つかったら、次はすぐ近くにある『主役のようす』を探してみよう。まずはよく見かける is や am から！"},
      {say:"girl", f:"komari", t:"うわあ、出た……。is とか am とか are って、コロコロ形が変わるから大嫌いなんだよね。結局どういう時に使うの？"},
      {fx:"pic", key:"scale"},
      {say:"boy", f:"ehen", t:"あれはね、『主役がどんな感じ（どんな状態・正体）？』を説明したい時に使うんだよ！シンプルに『＝（イコール）』のマークだと思えばいいんだ。"},
      {fx:"clear"},
      {fx:"line", id:"a", parts:["I","am","happy."]}, {fx:"wait", ms:500},
      {fx:"morph", id:"a", i:1, to:"＝"},
      {say:"girl", f:"odoroki", t:"あ！ほんとだ！『主役』と『その時の状態や正体』を＝（イコール）でペタッとつないでるだけだ！"},
      {say:"boy", f:"egao", t:"そう！形が変わるのは『主役が誰か』で着替えてるだけだから、難しく考えなくて大丈夫。"},
      {fx:"clear"},
      {say:"boy", f:"normal", t:"『どんな感じ（状態）』が分かったら、もうひとつ！今度は動き（動作）を表すやつだよ。『do』って言葉、知ってるよね？"},
      {say:"girl", f:"normal", t:"うん、do（やる・する）なら知ってる！"},
      {say:"boy", f:"ehen", t:"そう！主役のすぐあとに来ることばには、さっきの『＝（状態）』をつくるグループと、この do みたいに『主役がどうする？（動作）』を表すグループの2つがあるんだ。"},
      {fx:"cards", items:[{en:"I am happy.", jp:"＝ 状態（どんな感じ？）"},{en:"Tom runs.", jp:"うごき（どうする？）", pic:"run"}]},
      {say:"girl", f:"hirameki", t:"なるほど！『どんな感じ？』は am/is で、『どうする？』は run/play ってことね！"},
      {say:"boy", f:"egao", t:"完璧！ 主役の次は、このどっちかが絶対に来るんだ。じゃあ、主役のあとでも切ってみよう！"}
    ],
    stage:{ type:"cut", mode:"manual", title:"主役 ＋ ＝/うごき",
      coach:{ start:"主役のあとと、『＝』や『うごき』のことばのあとで切ってみよう！" },
      items:[
        { s:"I | am | happy.", ja:"わたしはうれしい。" },
        { s:"She | is | my friend.", ja:"彼女はわたしの友だち。" },
        { s:"Tom | plays | soccer.", ja:"トムはサッカーをする。" }
      ] } },

  { no:3, title:"「相手」が欲しくなる", sub:"文の土台", unlock:"auto",
    steps:[
      {fx:"bg", key:"room"},
      {fx:"show", l:"girl:normal", r:"boy:normal"},
      {fx:"line", id:"a", parts:["She","smiled."], label:"①"},
      {fx:"line", id:"b", parts:["She","met…"], label:"②"},
      {say:"boy", f:"normal", t:"ここからが面白いところ。この2つの文を見比べてみて。"},
      {say:"girl", f:"normal", t:"えーっと、①は『彼女は微笑んだ』。うん、これで終わりでいいよね。"},
      {fx:"mark", id:"a", t:"〇", c:"ok"},
      {say:"girl", f:"komari", t:"でも②の『彼女は会った…』は……"},
      {fx:"mark", id:"b", t:"？？？", c:"bad"},
      {say:"girl", f:"odoroki", t:"『誰に！？』ってなる！"},
      {say:"boy", f:"ijiwaru", t:"でしょ？（笑） なんかモヤモヤするよね。"},
      {fx:"clear"}, {fx:"pic", key:"arrows"},
      {say:"boy", f:"ehen", t:"そこが超重要なポイント！動作（どうする？）には、『主役ひとりだけで話が終わるもの』と、『主役から外に向かって、相手が必要なもの』の2種類があるんだ。"},
      {fx:"clear"},
      {fx:"line", id:"a", parts:["She","met"]}, {fx:"wait", ms:400},
      {fx:"add", id:"a", parts:["Tom."]},
      {say:"girl", f:"hirameki", t:"あ、スッキリした！『誰に？』の部分に Tom が入った！"},
      {fx:"clear"},
      {fx:"line", id:"a", parts:["Tom","opened…"]},
      {say:"boy", f:"normal", t:"じゃあこれはどう？"},
      {say:"girl", f:"odoroki", t:"『トムは開けた…』……何を！？", big:true},
      {fx:"text", id:"a", i:1, to:"opened"}, {fx:"add", id:"a", parts:["the door."]},
      {say:"boy", f:"egao", t:"だよね！（笑）だから外に向かう動作のときは、自然と『相手』が欲しくなるんだね。"},
      {fx:"clear"}, {fx:"pyramid"},
      {say:"boy", f:"ehen", t:"ここまでを一度整理しよう。英語の文の『一番大事な中心』はこれだけ！どれだけ長い英文でも、まずはこの土台（中心）を見つければ勝ち！"},
      {fx:"pfill", step:3, t:"happy（どんな感じ？）"}, {fx:"wait", ms:500},
      {fx:"pfill", step:3, t:"the door（相手）"},
      {say:"girl", f:"hirameki", t:"あれ？ 覚えること、意外と少ないね！"},
      {say:"boy", f:"egao", t:"ここからは、ゲームと同じ画面で切ってみよう。土台の3つだよ！"}
    ],
    stage:{ type:"cut", mode:"auto", speed:1700, title:"土台で切ろう",
      coach:{ start:"土台の3つ（主役・うごき・相手）で切ってみよう！" },
      items:[
        { s:"She | met | Tom.", ja:"彼女はトムに会った。" },
        { s:"Tom | opened | the door.", ja:"トムはドアを開けた。" },
        { s:"My mother | makes | lunch.", ja:"母は昼ごはんを作る。" }
      ] } },

  { no:4, title:"中心の順番はシャッフル禁止！", sub:"並べる順番で役割が決まる",
    steps:[
      {fx:"bg", key:"room"},
      {fx:"show", l:"girl:normal", r:"boy:normal"},
      {fx:"line", id:"a", parts:["She","likes","music."]},
      {say:"boy", f:"normal", t:"ただし、ひとつだけ絶対守らなきゃいけないルールがある。この『中心の順番』は変えちゃダメなんだ。"},
      {fx:"reorder", id:"a", order:[2,1,0], texts:["she.","likes","Music"]},
      {say:"girl", f:"odoroki", t:"これを例えば…… Music likes she. にしたら？"},
      {fx:"hl", id:"a", i:1, c:"x"},
      {say:"boy", f:"ijiwaru", t:"ダメ！『音楽が彼女を好き』っていう意味不明な文になっちゃう（笑）。英語は並べる順番で役割が決まる言語だから、土台の順番はシャッフル禁止！"},
      {fx:"unhl", id:"a", i:1, c:"x"},
      {fx:"reorder", id:"a", order:[0,1,2], texts:["She","likes","music."]},
      {say:"boy", f:"egao", t:"じゃあ、バラバラになったカードを正しい順番に戻してみよう！"}
    ],
    stage:{ type:"order", title:"順番に並べよう",
      coach:{ start:"カードを、英語の順番になるようにタップしていこう。まちがえたら並べたカードをタップで戻せるよ。" },
      items:[
        { parts:["She","likes","music."], ja:"彼女は音楽が好き。" },
        { parts:["Tom","opened","the door."], ja:"トムはドアを開けた。" },
        { parts:["My dog","is","cute."], ja:"うちの犬はかわいい。" }
      ] } },

  { no:5, title:"おまけの情報は動かせる", sub:"いつ・どこで のタグ",
    steps:[
      {fx:"bg", key:"room"},
      {fx:"show", l:"girl:normal", r:"boy:normal"},
      {fx:"line", id:"a", parts:["She","plays","tennis","at school","after class."]},
      {say:"boy", f:"normal", t:"でも、実際の英語には後ろに色んな言葉がくっついてるよね。でも中心は She plays tennis.（土台）だけ！"},
      {fx:"hl", id:"a", i:[0,1,2], c:"glow"}, {fx:"hl", id:"a", i:[3,4], c:"tag"},
      {say:"boy", f:"ehen", t:"後ろについてる言葉は、全部『おまけの情報（飾り）』！『いつ』『どこで』みたいな飾りは、実は前に持っていったりもできるんだ。"},
      {fx:"reorder", id:"a", order:[4,0,1,2,3], texts:["she","plays","tennis","at school.","After class,"]},
      {say:"girl", f:"hirameki", t:"ほんとだ！土台はガチガチだけど、おまけのタグは前や後ろに動かせるんだ！"},
      {say:"boy", f:"egao", t:"おまけのタグも1つのかたまり。ゲームでもひとまとまりで切ってね！"}
    ],
    stage:{ type:"cut", mode:"auto", speed:1600, title:"おまけタグも切ろう",
      coach:{ start:"土台と、おまけのタグ（いつ・どこで）で切ってみよう。" },
      items:[
        { s:"She | plays | tennis | at school / after class.", ja:"彼女は放課後、学校でテニスをする。" },
        { s:"After lunch, | we | play | soccer | in the park.", ja:"昼ごはんのあと、わたしたちは公園でサッカーをする。" },
        { s:"I | get up | at seven / every day.", ja:"わたしは毎日7時に起きる。" }
      ] } },

  { no:6, title:"途中で人が出てきても騙されるな！", sub:"主役の説明シール",
    steps:[
      {fx:"bg", key:"room"},
      {fx:"show", l:"girl:normal", r:"boy:normal"},
      {fx:"line", id:"a", parts:["The book","I","bought yesterday","is","fun."]},
      {say:"boy", f:"normal", t:"そしてもうひとつ！主役自体にも、後ろから『長い説明シール』をペタッと貼れるんだ。"},
      {say:"girl", f:"komari", t:"……あ！ ちょっと待って！"},
      {fx:"hl", id:"a", i:1, c:"big"},
      {say:"girl", f:"hirameki", t:"The book I bought yesterday is fun. って、途中で I（私）が出てくるじゃん！これ、主役は I に交代したってこと！？"},
      {fx:"hl", id:"a", i:1, c:"x"},
      {say:"boy", f:"ijiwaru", t:"引っかかったね！（笑） そこ、みんなが一番迷う罠なんだ！"},
      {fx:"unhl", id:"a", i:1, c:"big"}, {fx:"unhl", id:"a", i:1, c:"x"},
      {fx:"badge", id:"a", i:0, t:"★主役", c:"gold"},
      {fx:"merge", id:"a", from:1, to:2, c:"sticker"},
      {say:"boy", f:"ehen", t:"主役はあくまで最初に出てきた The book（本）！ I bought yesterday（私が昨日買った）は、主役に貼られた説明シールなんだ。本物の『どうしてる？』は、シールのあとの is だよ！"},
      {fx:"hl", id:"a", i:3, c:"glow"}, {fx:"morph", id:"a", i:3, to:"＝"},
      {say:"girl", f:"hirameki", t:"なるほど……！ シールの中に I が見えても焦っちゃダメなんだね。『本物のどうしてる？は、シールのあと！』って覚えておけばいいんだ！"},
      {say:"boy", f:"egao", t:"シール付きの主役は、まるごと1つのかたまり。ゲームで確かめてみよう！"}
    ],
    stage:{ type:"cut", mode:"auto", speed:1500, title:"シールごと主役",
      coach:{ start:"主役にシールが付いてるよ。本物の『どうしてる？』の前で切ろう！" },
      items:[
        { s:"The book / I bought yesterday | is | fun.", ja:"昨日買った本はおもしろい。" },
        { s:"The girl / with long hair | is | my sister.", ja:"髪の長い女の子はわたしの姉だ。" },
        { s:"The man / I met | lives | in Tokyo.", ja:"わたしが会った男の人は東京に住んでいる。" }
      ] } },

  { no:7, title:"全体のマップ", sub:"エンディング", unlock:"free",
    steps:[
      {fx:"bg", key:"room"},
      {fx:"show", l:"girl:normal", r:"boy:normal"},
      {fx:"amap"},
      {say:"boy", f:"egao", t:"だから、長い英文の正体を解剖すると、全体図はこうなってるんだ！英文を見たら、この4ステップでチェックしていこう！"},
      {say:"girl", f:"doya", t:"どれだけ長い文が出てきても、やってる構造は全部これと同じなんだね！もう単語の並びにビビらないで、中心の土台から探しにいくよ！"},
      {say:"boy", f:"egao", t:"その意気！じゃあ実際に、ゲームのパズルで試してみようか！"},
      {fx:"flash"}
    ],
    stage:{ type:"cut", mode:"auto", speed:1500, title:"総まとめ",
      coach:{ start:"ここまでの全部をつかって切ってみよう！" },
      items:[
        { s:"My brother | is | a good cook.", ja:"兄は料理がじょうずだ。" },
        { s:"After school, | Ken | opened | the box | in his room.", ja:"放課後、ケンは自分の部屋で箱を開けた。" },
        { s:"The cake / my mother made | was | delicious.", ja:"母が作ったケーキはおいしかった。" }
      ] } }
  ]
};

/* 説明は、基本1文ずつ表示する（短い文どうしはひとまとめ）。「。！？」で区切り、『』「」（）の中では区切らない */
function splitSay(t){
  const ss = []; let cur = "", d = 0;
  for (const c of t){
    cur += c;
    if ("『「（(".includes(c)) d++; else if ("』」）)".includes(c)) d = Math.max(0, d - 1);
    else if ("。！？!?".includes(c) && !d) { ss.push(cur); cur = ""; }
  }
  if (cur.trim()) ss.push(cur);
  const out = []; let acc = "";
  for (const x of ss){
    if (!acc) acc = x;
    else if (acc.length + x.length <= 24) acc += x;
    else { out.push(acc); acc = x; }
  }
  if (acc) out.push(acc);
  return out;
}
window.CS_STORY.chapters.forEach(ch => {
  const n = []; ch.steps.forEach(st => {
    if (st.say && st.t){ splitSay(st.t).forEach(t => n.push({ ...st, t })); } else n.push(st);
  }); ch.steps = n;
});

(function(){
"use strict";
const A = window.CS_ASSETS, S = window.CS_STORY;
const P = s => String(s||"").split(/\s+/).filter(Boolean).map(t => t.startsWith("cs-") ? t : "cs-" + t).join(" ");
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = P(cls); if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

let root, opts = {}, app;
let STORE_KEY = "chunkStory.v1";

/* ---------- 進みぐあい ---------- */
function load(){ if (opts.load) return opts.load() || {}; try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(e){ return {}; } }
function save(p){ if (opts.save) return opts.save(p); try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch(e){} }
let prog = { cleared:{}, unlocked:{} };

/* ---------- 絵（仮アイコン or 画像） ---------- */
function srcFor(own, key){
  if (own) return own;
  return null;
}
/* キャラ絵：本体の img/chara/<boy|girl>/<7表情>.webp を使う。旧表情名は faceMap で7表情に変換 */
function faceKey(who, face){ const m = (A.config.faceMap && A.config.faceMap[who]) || {}; return m[face] || face; }
function charaSrc(who, face){
  const c = A.chara[who]; if (c.src && c.src[face]) return c.src[face];
  if (!A.config.useImages) return null;
  return A.config.base + who + "/" + faceKey(who, face) + A.config.ext;
}
function storySrc(own, key){
  if (own) return own;
  return A.config.storyImages ? A.config.storyBase + key + A.config.storyExt : null;
}
function withFallback(src, makePh){
  const ph = makePh();
  if (!src) return ph;
  const img = el("img"); img.alt = ""; img.src = src;
  img.onerror = () => img.replaceWith(ph);
  return img;
}
function charaNode(who, face){
  const c = A.chara[who]; const key = who + "_" + face;
  return withFallback(charaSrc(who, face), () => {
    const p = el("div", "ph"); p.style.setProperty("--c", c.color);
    p.innerHTML = `<div class="cs-head">${esc(c.faces[face] || face)}</div><b>${esc(c.name)}</b>${A.config.debug ? `<code>${key}</code>` : ""}`;
    return p;
  });
}
function picNode(k){
  const p = A.pic[k] || { label:k }; const key = "pic_" + k;
  return withFallback(storySrc(p.src, key), () => {
    const d = el("div", "ph"); d.style.setProperty("--c", "#fff7d6");
    d.innerHTML = `<b>絵</b><span style="font-size:12px;line-height:1.5">${esc(p.label)}</span>${A.config.debug ? `<code>${key}</code>` : ""}`;
    return d;
  });
}
function setBg(layer, k){
  const b = A.bg[k] || {}; const key = "bg_" + k; const src = storySrc(b.src, key);
  layer.innerHTML = "";
  layer.style.background = b.color || "var(--bg)";
  if (src){ const im = new Image(); im.onload = () => { layer.style.background = `center/cover url("${src}")`; }; im.src = src; }
  if (A.config.debug) layer.appendChild(el("span", "bgname", esc((b.label || k) + " / " + key)));
}

/* ---------- 画面の切り替え ---------- */
function screen(cls){
  app.innerHTML = "";
  const s = el("section", "cs-screen " + cls);
  app.appendChild(s);
  return s;
}

/* ================= マップ ================= */
function isOpen(no){ return no === 1 || !!prog.cleared[no - 1]; }
function openMap(){
  const s = screen("map");
  s.innerHTML = `<h1>${esc(S.title)}</h1>
    <p class="cs-lead">お話を聞いて、すぐゲームで試す。章をクリアすると、あそべるモードが増えていくよ。</p>`;
  const un = el("div", "unlocks");
  S.modes.forEach(m => un.appendChild(el("span", prog.unlocked[m.key] ? "on" : "", esc((prog.unlocked[m.key] ? "" : "🔒 ") + m.name))));
  s.appendChild(un);
  const list = el("div", "chs");
  S.chapters.forEach(ch => {
    const open = isOpen(ch.no), done = !!prog.cleared[ch.no];
    const row = el("div", "ch" + (done ? " done" : "") + (open ? "" : " lock"));
    const mode = ch.unlock && S.modes.find(m => m.key === ch.unlock);
    row.innerHTML = `<div class="cs-no">${ch.no}</div>
      <div class="cs-tt">${esc(ch.title)}<small>${esc(ch.sub || "")}${done ? " ・ クリア" : ""}</small></div>`;
    const bt = el("div", "bt");
    const b1 = el("button", "pill", done ? "もう一度見る" : "はじめる"); b1.disabled = !open;
    b1.onclick = () => playChapter(ch.no);
    const b2 = el("button", "pill sub", "ゲームだけ"); b2.disabled = !done;
    b2.onclick = () => runStage(ch);
    bt.append(b1, b2);
    if (mode) bt.appendChild(el("span", "tag-unlock", "クリアで「" + esc(mode.name) + "」"));
    row.appendChild(bt);
    list.appendChild(row);
  });
  s.appendChild(list);
  if (opts.showReset || opts.onExit){
    const dev = el("div", "devnote");
    if (opts.showReset){
      const rb = el("button", "pill sub", "進みをリセット");
      rb.onclick = () => {
        if (rb.dataset.sure){ prog = { cleared:{}, unlocked:{} }; save(prog); openMap(); }
        else { rb.dataset.sure = 1; rb.textContent = "本当にリセットする？（もう一度押す）"; }
      };
      dev.appendChild(rb);
    }
    if (opts.onExit){
      const xb = el("button", "pill sub", opts.exitLabel || "もどる"); xb.style.marginLeft = "8px";
      xb.onclick = () => opts.onExit();
      dev.appendChild(xb);
    }
    s.appendChild(dev);
  }
}

/* ================= 会話（ADV） ================= */
let adv = null, curFrame = null;
function playChapter(no){
  const ch = S.chapters.find(c => c.no === no); if (!ch) return;
  const s = screen("adv");
  adv = { ch, lines:{}, skip:false, log:[], resolve:null, chars:{} };
  s.innerHTML = `<div class="cs-bgl"></div>
    <div class="cs-top"><span class="cs-chname">第${ch.no}章 ${esc(ch.title)}</span>
      <button data-a="log">ログ</button><button data-a="skip">スキップ</button></div>
    <div class="cs-board"></div>
    <div class="cs-chars"><div class="cs-chr cs-l cs-hide"></div><div class="cs-chr cs-r cs-hide"></div></div>
    <div class="cs-tbox"><span class="cs-nm"></span><div class="cs-tx"></div><span class="cs-nx" hidden>▼</span></div>`;
  adv.s = s; adv.bgl = s.querySelector(".cs-bgl"); adv.board = s.querySelector(".cs-board");
  adv.tbox = s.querySelector(".cs-tbox"); adv.nm = s.querySelector(".cs-nm"); adv.tx = s.querySelector(".cs-tx"); adv.nx = s.querySelector(".cs-nx");
  adv.slot = { l: s.querySelector(".cs-chr.cs-l"), r: s.querySelector(".cs-chr.cs-r") };
  adv.tbox.onclick = () => adv.resolve && adv.resolve("tap");
  s.querySelector('[data-a="skip"]').onclick = e => { e.stopPropagation(); adv.skip = true; adv.resolve && adv.resolve("skip"); };
  s.querySelector('[data-a="log"]').onclick = e => { e.stopPropagation(); showLog(); };
  run(ch);
}
async function run(ch){
  const me = adv;
  for (const st of ch.steps){
    if (me.skip || adv !== me) break;
    if (st.say) await say(st);
    else if (st.ask != null) await ask(st);
    else if (st.fx && FX[st.fx]) await FX[st.fx](st);
  }
  if (adv !== me) return;
  runStage(ch);
}
function waitTap(){ return new Promise(r => { if (adv.skip) return r("skip"); adv.resolve = v => { adv.resolve = null; r(v); }; }); }

function slotOf(who){ return adv.chars[who]; }
function setFace(who, face){
  const slot = slotOf(who); if (!slot) return;
  if (slot.dataset.face === face) return;
  slot.dataset.face = face;
  const q = slot.querySelector(".cs-q");
  slot.innerHTML = ""; slot.appendChild(charaNode(who, face)); if (q) slot.appendChild(q);
}
async function say(st){
  const c = A.chara[st.say];
  if (st.f) setFace(st.say, st.f);
  Object.entries(adv.chars).forEach(([w, sl]) => sl.classList.toggle("cs-off", w !== st.say));
  const sl = slotOf(st.say); if (sl){ sl.classList.remove("cs-bump"); void sl.offsetWidth; sl.classList.add("cs-bump"); }
  adv.nm.textContent = c ? c.name : ""; adv.nm.style.setProperty("--c", c ? c.color : "var(--lemon)");
  adv.tbox.classList.remove("cs-ask"); adv.tbox.classList.toggle("cs-big", !!st.big);
  adv.log.push({ who: c ? c.name : "", t: st.t });
  await type(st.t);
  adv.nx.hidden = false;
  await waitTap();
  adv.nx.hidden = true; adv.tbox.classList.remove("cs-big");
}
async function type(text){
  adv.tx.textContent = "";
  let done = false, i = 0;
  const p = waitTap().then(() => { done = true; });
  while (!done && i < text.length && !adv.skip){ adv.tx.textContent += text[i++]; await sleep(26); }
  adv.tx.textContent = text;
  if (!done && adv.resolve) { adv.resolve = null; }
}
async function ask(st){
  const line = adv.lines[st.ask]; if (!line) return;
  Object.values(adv.chars).forEach(sl => sl.classList.add("cs-off"));
  adv.nm.textContent = ""; adv.tbox.classList.add("cs-ask"); adv.tx.textContent = st.t;
  const tok = line.tokens[st.i];
  line.tokens.forEach(t => { t.classList.add("cs-tapme"); t.tabIndex = 0; });
  await new Promise(res => {
    line.tokens.forEach((t, k) => {
      t.onclick = e => {
        e.stopPropagation();
        if (t === tok){ res(); return; }
        t.classList.remove("cs-wrong"); void t.offsetWidth; t.classList.add("cs-wrong");
        adv.tx.textContent = st.ng || "もう一回！";
      };
      t.onkeydown = e => { if (e.key === "Enter" || e.key === " ") t.onclick(e); };
    });
    adv.resolve = v => { if (v === "skip") { adv.resolve = null; res(); } };
  });
  line.tokens.forEach(t => { t.classList.remove("cs-tapme"); t.onclick = null; t.onkeydown = null; t.removeAttribute("tabindex"); });
  adv.tbox.classList.remove("cs-ask");
}
function showLog(){
  const o = el("div", "log"); const inn = el("div", "in");
  inn.innerHTML = adv.log.map(l => `<p><b>${esc(l.who)}</b>${esc(l.t)}</p>`).join("") || "<p>まだセリフはありません。</p>";
  o.appendChild(inn); o.onclick = () => o.remove();
  adv.s.appendChild(o); inn.scrollTop = inn.scrollHeight;
}

/* ---------- 演出（FX） ----------
  bg, show, clear, wall, q, line, add, text, hl, unhl, badge, push,
  morph, mark, reorder, merge, pic, cards, pyramid, pfill, amap, flash, wait */
const idx = i => Array.isArray(i) ? i : [i];
function mkTok(text){ const t = el("span", "tok"); t.appendChild(el("span", "t", esc(text))); return t; }
const FX = {
  bg: st => setBg(adv.bgl, st.key),
  show: st => {
    adv.chars = {};
    ["l","r"].forEach(side => {
      const slot = adv.slot[side]; slot.innerHTML = ""; delete slot.dataset.face;
      if (!st[side]) { slot.classList.add("cs-hide"); return; }
      const [who, face] = st[side].split(":");
      adv.chars[who] = slot; slot.classList.remove("cs-hide");
      setFace(who, face || "normal");
    });
  },
  clear: async () => {
    const kids = [...adv.board.children]; kids.forEach(k => k.classList.add("cs-fade"));
    await sleep(kids.length ? 330 : 0); adv.board.innerHTML = ""; adv.lines = {};
  },
  wait: st => sleep(st.ms || 400),
  wall: () => {
    const w = el("div", "wall");
    w.textContent = "When the students who had been waiting outside the library since early in the morning finally heard that the new books they had ordered last month would not arrive until the end of the week, most of them decided to go back to their classrooms, although a few stayed because they wanted to ask the librarian whether the old copies could be borrowed instead while they were waiting for the new ones that everyone had been talking about.";
    adv.board.appendChild(w);
  },
  q: st => { const sl = slotOf(st.who); if (!sl) return; const q = el("span", "q", "？"); sl.appendChild(q); setTimeout(() => q.remove(), 2700); },
  line: st => {
    const ln = el("div", "ln"); if (st.label) ln.appendChild(el("span", "lab", esc(st.label)));
    const tokens = st.parts.map(p => { const t = mkTok(p); ln.appendChild(t); return t; });
    adv.board.appendChild(ln); adv.lines[st.id] = { el: ln, tokens };
  },
  add: st => {
    const L = adv.lines[st.id]; if (!L) return;
    st.parts.forEach(p => { const t = mkTok(p); t.classList.add("cs-new"); L.el.appendChild(t); L.tokens.push(t); });
  },
  text: st => { const t = adv.lines[st.id]?.tokens[st.i]; if (t) t.querySelector(".cs-t").textContent = st.to; },
  hl: st => { const L = adv.lines[st.id]; if (L) idx(st.i).forEach(i => L.tokens[i] && L.tokens[i].classList.add(P(st.c || "cs-glow"))); },
  unhl: st => { const L = adv.lines[st.id]; if (L) idx(st.i).forEach(i => L.tokens[i] && L.tokens[i].classList.remove(P(st.c || "cs-glow"))); },
  badge: st => { const t = adv.lines[st.id]?.tokens[st.i]; if (!t) return; t.querySelector(".cs-bdg")?.remove(); t.appendChild(el("span", "bdg " + (st.c || ""), esc(st.t))); },
  push: async st => {
    const L = adv.lines[st.id]; if (!L) return;
    L.tokens.forEach((t, i) => { if (i !== st.i) t.classList.add("cs-dim"); });
    const t = L.tokens[st.i]; t.classList.add("cs-push");
    await sleep(750); t.classList.remove("cs-push");
    L.tokens.forEach((t2, i) => { if (i !== st.i) setTimeout(() => t2.classList.remove("cs-dim"), 200 * i); });
  },
  morph: async st => {
    const t = adv.lines[st.id]?.tokens[st.i]; if (!t) return;
    t.classList.add("cs-flip"); await sleep(250);
    t.querySelector(".cs-t").textContent = st.to; t.classList.add("cs-eq");
    await sleep(260); t.classList.remove("cs-flip");
  },
  mark: st => { const L = adv.lines[st.id]; if (L) L.el.appendChild(el("span", "mk " + (st.c || ""), esc(st.t))); },
  reorder: async st => {
    const L = adv.lines[st.id]; if (!L) return;
    const first = L.tokens.map(t => t.getBoundingClientRect());
    if (st.texts) L.tokens.forEach((t, i) => { if (st.texts[i] != null) t.querySelector(".cs-t").textContent = st.texts[i]; });
    st.order.forEach(i => L.el.appendChild(L.tokens[i]));
    L.el.querySelectorAll(".cs-mk").forEach(m => L.el.appendChild(m));
    L.tokens.forEach((t, i) => {
      const last = t.getBoundingClientRect();
      t.animate([{ transform:`translate(${first[i].left - last.left}px,${first[i].top - last.top}px)` }, { transform:"none" }],
        { duration: 650, easing: "cubic-bezier(.3,1.35,.5,1)" });
    });
    await sleep(700);
  },
  merge: st => {
    const L = adv.lines[st.id]; if (!L) return;
    const parts = L.tokens.slice(st.from, st.to + 1);
    const t = mkTok(parts.map(p => p.querySelector(".cs-t").textContent).join(" "));
    t.classList.add(P(st.c || "cs-sticker"), "cs-new");
    parts[0].before(t); parts.forEach(p => p.remove());
    for (let i = st.from; i <= st.to; i++) L.tokens[i] = t;
  },
  pic: st => { const d = el("div", "bpic"); d.appendChild(picNode(st.key)); adv.board.appendChild(d); },
  cards: st => {
    const w = el("div", "cards");
    st.items.forEach(c => {
      const d = el("div", "card");
      d.appendChild(el("div", "en", esc(c.en)));
      if (c.pic) d.appendChild(picNode(c.pic));
      d.appendChild(el("div", "jp", esc(c.jp)));
      w.appendChild(d);
    });
    adv.board.appendChild(w);
  },
  pyramid: () => {
    const p = el("div", "pyr");
    p.innerHTML = `<div class="cs-st" data-s="1"><span class="cs-n">1</span><b>誰が？（主役）</b></div><span class="cs-ar">↓</span>
      <div class="cs-st" data-s="2"><span class="cs-n">2</span><b>どうしてる？</b><span style="font-size:12px">どんな感じ？／どうする？</span></div><span class="cs-ar">↓（必要なら）</span>
      <div class="cs-st" data-s="3"><span class="cs-n">3</span><b>相手／どんな感じ？</b></div>`;
    adv.board.appendChild(p);
  },
  pfill: st => { const r = adv.board.querySelector(`.cs-pyr .cs-st[data-s="${st.step}"]`); if (r) r.appendChild(el("span", "chip", esc(st.t))); },
  amap: () => {
    const m = el("div", "amap");
    m.innerHTML = `<div class="cs-row"><div class="cs-core">① 主役</div><div class="cs-opt">＋ どんな主役？</div></div>
      <div class="cs-row"><div class="cs-core">② どうしてる？</div><div class="cs-opt">＋ どんな風に？</div></div>
      <div class="cs-row"><div class="cs-core">③ 相手／どんな感じ？</div><div class="cs-opt">＋ どんな相手？</div></div>
      <hr><div class="cs-opt cs-tail">＋ いつ／どこで／なぜ／どうやって</div>`;
    adv.board.appendChild(m);
  },
  flash: async () => { const f = el("div", "flash"); app.appendChild(f); await sleep(1100); f.remove(); }
};

/* ================= ステージ ================= */
function parseCut(s){
  const words = [], B = new Set(), O = new Set();
  s.split(/\s+/).filter(Boolean).forEach(tk => {
    if (tk === "|") B.add(words.length); else if (tk === "/") O.add(words.length); else words.push(tk);
  });
  return { words, B, O };
}
function judge(p, cuts){
  const n = p.words.length, pts = [0, ...[...cuts].sort((a, b) => a - b), n];
  const ok = new Set([0, n, ...p.B, ...p.O]);
  const chunks = [];
  for (let k = 0; k < pts.length - 1; k++){
    const s = pts[k], e = pts[k + 1];
    let r = "o";
    if (!ok.has(s) || !ok.has(e)) r = "x";
    else if ([...p.B].some(b => b > s && b < e)) r = "t";
    chunks.push({ text: p.words.slice(s, e).join(" "), r });
  }
  return chunks;
}
function answerText(p){
  const out = []; p.words.forEach((w, i) => { if (i && p.B.has(i)) out.push("|"); out.push(w); });
  return out.join(" ");
}

function runStage(ch){
  adv = null;
  const st = ch.stage;
  const finish = result => showResult(ch, result);
  if (opts.onStage){                         // ゲーム本体に任せる
    const handled = opts.onStage(st, ch, finish);
    if (handled !== false) return;
  }
  (st.type === "order" ? orderStage : cutStage)(ch, st, finish);
}

function stageFrame(ch, st){
  const s = screen("stg");
  s.innerHTML = `<div class="cs-top"><span class="cs-t">第${ch.no}章 ${esc(st.title || "")}</span><span class="cs-cnt"></span>
      <button class="cs-pill cs-sub" data-a="map">マップ</button></div>
    <div class="cs-coach"></div><div class="cs-ja"></div><div class="cs-lane"></div><div class="cs-foot"></div>`;
  const coach = s.querySelector(".cs-coach");
  coach.appendChild(withFallback(charaSrc("boy", "egao"), () => {
    const p = el("div", "ph"); p.innerHTML = "<b>男の子</b>"; return p; }));
  const sb = el("div", "sb"); coach.appendChild(sb);
  const f = { s, cnt: s.querySelector(".cs-cnt"), ja: s.querySelector(".cs-ja"), lane: s.querySelector(".cs-lane"), foot: s.querySelector(".cs-foot"),
    say: t => { sb.textContent = ""; void sb.offsetWidth; sb.textContent = t || ""; }, alive: true };
  curFrame = f;
  s.querySelector('[data-a="map"]').onclick = () => { f.alive = false; openMap(); };
  return f;
}

/* 切る場面：チャンクチャンクのチャレンジと同じ見た目・同じ操作（▶で1語ずつ進める → 線のところで「区切る」）。
   点数・コンボ・タイム・声はなし。終わったら、こたえの例といっしょに ◯△× を見せる */
function cutStage(ch, st, finish){
  const f = stageFrame(ch, st); f.s.classList.add("cs-cutscr");
  const coach = st.coach || {}; const said = {};
  const tell = k => { if (coach[k] && !said[k]) { said[k] = 1; f.say(coach[k]); } };
  const all = []; let n = 0;
  tell("start");
  next();

  function next(){
    if (!f.alive) return;
    if (n >= st.items.length) return finish(all);
    const item = st.items[n], p = parseCut(item.s), len = p.words.length;
    f.cnt.textContent = (n + 1) + " / " + st.items.length;
    f.ja.textContent = item.ja || "";
    f.lane.innerHTML = ""; f.lane.classList.remove("cs-col");
    const lw = el("div", "laneW"), strip = el("div", "strip"), line = el("div", "cutline");
    line.dataset.lbl = "ここで区切る";
    lw.append(strip, line, el("div", "fadeL"), el("div", "fadeR")); f.lane.appendChild(lw);
    f.foot.innerHTML = ""; f.foot.style.cssText = "";
    const bar = el("div", "navrow");
    const nav = el("div", "nav");
    const bBack = el("button", "navb", "◀"), bFwd = el("button", "navb", "▶");
    bBack.setAttribute("aria-label", "1語もどる（文の頭まで戻れる）"); bFwd.setAttribute("aria-label", "1語すすむ");
    nav.append(bBack, bFwd);
    const bCut = el("button", "cutBtn"); bCut.innerHTML = "区切る<small>▶で進んで、ここだと思ったら押す</small>";
    bar.append(nav, bCut); f.foot.appendChild(bar);

    let passed = 0, over = false;
    const cuts = new Set();   // 「i番目のことばの前で切る」

    function render(anim){
      strip.innerHTML = "";
      p.words.forEach((w, i) => {
        const cls = i < passed - 2 ? " gone" : i < passed ? " past" : i === passed ? " next" : "";
        strip.appendChild(el("span", "w" + cls, esc(w)));
        if (i + 1 < len && cuts.has(i + 1)){
          const c = el("span", "cutmark", "｜"); c.title = "タップで元に戻す";
          c.onclick = () => { if (over) return; cuts.delete(i + 1); render(); };
          strip.appendChild(c);
        }
      });
      strip.appendChild(el("span", "endmk", "■"));
      const ws = strip.querySelectorAll(".cs-w"), lx = Math.round(lw.clientWidth * 0.34); let gx;
      if (passed <= 0) gx = ws[0].offsetLeft - 4;
      else { const a = ws[Math.min(passed, ws.length) - 1], nx = a.nextElementSibling, r = a.offsetLeft + a.offsetWidth;
        gx = nx ? (nx.classList.contains("cs-cutmark") ? nx.offsetLeft + nx.offsetWidth / 2 : (r + nx.offsetLeft) / 2) : r + 6; }
      strip.classList.toggle("cs-step", !!anim);
      strip.style.transform = "translate(" + (lx - gx) + "px,-50%)";
      line.style.left = lx + "px";
      const fin = passed >= len;
      bBack.disabled = over || passed <= 0;
      bFwd.disabled = fin;
      bCut.classList.toggle("cs-fin", fin);
      bCut.innerHTML = fin ? "かんせい<small>おしまいまで進んだよ</small>" : "区切る<small>▶で進んで、ここだと思ったら押す</small>";
      bCut.disabled = !fin && (over || passed === 0 || cuts.has(passed));
    }
    function done(){
      over = true;
      const res = judge(p, cuts); all.push({ s: p.words.join(" "), chunks: res });
      f.lane.innerHTML = ""; f.lane.classList.add("cs-col");
      const rw = el("div", "res-ws");
      res.forEach(c => { const d = el("span", "rc " + c.r); d.innerHTML = `<span class="cs-m">${{o:"◯",t:"△",x:"×"}[c.r]}</span>${esc(c.text)}`; rw.appendChild(d); });
      f.lane.appendChild(rw);
      if (res.some(c => c.r !== "o")) f.lane.appendChild(el("div", "ans", `こたえの例<br><b>${esc(answerText(p))}</b>`));
      const good = res.every(c => c.r === "o");
      f.say(good ? "ぜんぶ◯！いい切り方！" : "△は大きすぎ、×は切る場所がずれてるよ。");
      f.foot.innerHTML = "";
      const go = el("button", "cutBtn go"); go.textContent = n + 1 < st.items.length ? "つぎの文へ" : "けっかを見る";
      go.onclick = () => { n++; next(); };
      f.foot.appendChild(go);
    }
    bBack.onclick = () => { if (over || bBack.disabled) return; passed--; [...cuts].forEach(i => { if (i > passed) cuts.delete(i); }); render(true); };   // 戻った範囲の区切りは取り消す
    bFwd.onclick = () => { if (over || passed >= len) return; passed++; render(true); if (passed >= len) tell("end"); };
    bCut.onclick = () => {
      if (bCut.disabled || over) return;
      if (passed >= len) return done();
      cuts.add(passed); render(true); tell("cut");
    };
    render(false);
  }
}

function orderStage(ch, st, finish){
  const f = stageFrame(ch, st);
  f.say((st.coach || {}).start || "");
  const all = []; let n = 0;
  next();
  function next(){
    if (!f.alive) return;
    if (n >= st.items.length) return finish(all);
    const item = st.items[n];
    f.cnt.textContent = (n + 1) + " / " + st.items.length;
    f.ja.textContent = item.ja || "";
    f.lane.innerHTML = ""; f.lane.classList.add("cs-col"); f.foot.innerHTML = "";
    const ansRow = el("div", "ord-ans"), pool = el("div", "ord-pool");
    f.lane.append(ansRow, pool);
    let order = item.parts.map((_, i) => i);
    do { order.sort(() => Math.random() - .5); } while (order.every((v, i) => v === i) && order.length > 1);
    const picked = [];
    const draw = () => {
      ansRow.innerHTML = ""; pool.innerHTML = "";
      picked.forEach((pi, k) => { const b = el("button", "oc in", esc(item.parts[pi])); b.onclick = () => { picked.splice(k, 1); draw(); }; ansRow.appendChild(b); });
      order.filter(i => !picked.includes(i)).forEach(pi => { const b = el("button", "oc", esc(item.parts[pi])); b.onclick = () => { picked.push(pi); draw(); if (picked.length === item.parts.length) check(); }; pool.appendChild(b); });
    };
    const check = () => {
      const ok = picked.every((v, i) => v === i);
      all.push({ s: item.parts.join(" "), chunks: [{ text: picked.map(i => item.parts[i]).join(" "), r: ok ? "o" : "x" }] });
      f.lane.innerHTML = ""; f.lane.classList.add("cs-col");
      const rw = el("div", "res-ws"); const d = el("span", "rc " + (ok ? "o" : "x"));
      d.innerHTML = `<span class="cs-m">${ok ? "◯" : "×"}</span>${esc(picked.map(i => item.parts[i]).join(" "))}`;
      rw.appendChild(d); f.lane.appendChild(rw);
      if (!ok) f.lane.appendChild(el("div", "ans", `こたえ<br><b>${esc(item.parts.join(" "))}</b>`));
      f.say(ok ? "その順番！土台バッチリ。" : "主役 → どうしてる？ → 相手 の順だよ。");
      const go = el("button", "bb go", n + 1 < st.items.length ? "つぎへ" : "けっかを見る");
      go.onclick = () => { n++; next(); };
      f.foot.appendChild(go);
    };
    draw();
  }
}

/* ================= 結果 ================= */
function showResult(ch, results){
  let o = 0, t = 0, x = 0;
  (results || []).forEach(r => r.chunks.forEach(c => { if (c.r === "o") o++; else if (c.r === "t") t++; else x++; }));
  const total = o + t + x, pct = total ? Math.round((o * 2 + t) / (total * 2) * 100) : 100;
  const firstClear = !prog.cleared[ch.no];
  prog.cleared[ch.no] = true;
  let unlockedMode = null;
  if (ch.unlock && !prog.unlocked[ch.unlock]){ prog.unlocked[ch.unlock] = true; unlockedMode = S.modes.find(m => m.key === ch.unlock); opts.onUnlock && opts.onUnlock(ch.unlock); }
  save(prog);

  const [gf, bf, line] = pct >= 80 ? ["doya", "egao", "すごい！もうコツをつかんでるね！"]
    : pct >= 50 ? ["hirameki", "ehen", "いい感じ！あと少しで全部◯だよ。"]
    : ["komari", "ehen", "大丈夫、もう一回お話を見てから試してみよう！"];
  const s = screen("rs");
  s.innerHTML = `<h2>第${ch.no}章 クリア！</h2><div class="cs-score">${pct}<small>点</small></div>
    <div class="cs-tally"><span style="color:var(--good)">◯ ${o}</span><span style="color:var(--mid)">△ ${t}</span><span style="color:var(--bad)">× ${x}</span></div>`;
  const duo = el("div", "duo"); const g = el("div"), b = el("div");
  g.appendChild(charaNode("girl", gf)); b.appendChild(charaNode("boy", bf)); duo.append(g, b); s.appendChild(duo);
  s.appendChild(el("div", "say", esc(line)));
  if (unlockedMode) s.appendChild(el("div", "unl", `「${esc(unlockedMode.name)}」があそべるようになった！`));
  const col = el("div", "col");
  const nextCh = S.chapters.find(c => c.no === ch.no + 1);
  if (nextCh){ const bn = el("button", "bb go", "つぎの章へ"); bn.onclick = () => playChapter(nextCh.no); col.appendChild(bn); }
  else if (opts.onFinish){ const bf2 = el("button", "bb go", "ゲームへ"); bf2.onclick = () => opts.onFinish(prog); col.appendChild(bf2); }
  const br = el("button", "bb", "もう一回あそぶ"); br.onclick = () => runStage(ch);
  const bm = el("button", "bb", "マップへ"); bm.onclick = openMap;
  col.append(br, bm); s.appendChild(col);
  opts.onChapterClear && opts.onChapterClear(ch.no, { pct, firstClear });
}

/* ================= 外から呼ぶ入口 ================= */
window.ChunkStory = {
  mount(target, o){
    root = typeof target === "string" ? document.querySelector(target) : target;
    opts = o || {};
    if (opts.storeKey) STORE_KEY = opts.storeKey;
    if (opts.assets) Object.assign(A.config, opts.assets);
    root.classList.add("cs-root");
    prog = Object.assign({ cleared:{}, unlocked:{} }, load());
    root.innerHTML = ""; app = el("div", "cs-app"); root.appendChild(app);
    openMap();
    return this;
  },
  openMap: () => openMap(),
  playChapter: no => playChapter(no),
  progress: () => JSON.parse(JSON.stringify(prog)),
  isUnlocked: key => !!prog.unlocked[key],
  reset(){ prog = { cleared:{}, unlocked:{} }; save(prog); openMap(); },
  unmount(){
    adv = null; if (curFrame) curFrame.alive = false;
    if (root){ root.innerHTML = ""; root.classList.remove("cs-root"); }
    root = app = null;
  }
};
})();
