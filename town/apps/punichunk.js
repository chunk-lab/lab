/*! ぷにチャンク (PuniChunk) — 英語脳バブルパズル。外部ライブラリなし。 */
(function (global) {
"use strict";
/* ===== FILE: util.js ===== */
/* ===== util.js:乱数・数学・イージング・DOM ===== */
var U = (function () {
  'use strict';
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    var f = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    f.int = function (n) { return Math.floor(f() * n); };
    f.pick = function (arr) { return arr[Math.floor(f() * arr.length)]; };
    f.range = function (a, b) { return a + f() * (b - a); };
    return f;
  }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  var E = {
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inCubic: function (t) { return t * t * t; },
    inOut: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    outBack: function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: function (t) { if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1; }
  };
  function shuffle(a, r) { r = r || Math.random; for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v); else e.setAttribute(k, v);
    }
    (kids || []).forEach(function (c) { if (c == null) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function today(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  return { rng: rng, hash: hash, clamp: clamp, lerp: lerp, E: E, shuffle: shuffle, el: el, today: today, fmt: fmt };
})();

/* ===== FILE: dict_data.js ===== */
// 自動生成:tools/mkdict.js(元データ:eigo_nou の手作り辞書)。手で直さない。
var DICT_DATA={"noun":[{"w":"apple","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"りんご"},{"w":"banana","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"バナナ"},{"w":"bread","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"パン"},{"w":"cake","c":"c","ad":"a","cat":"food","tg":["food","make"],"lv":1,"ja":"ケーキ"},{"w":"rice balls","c":"p","ad":"","cat":"food","tg":["food","make"],"lv":1,"ja":"おにぎり"},{"w":"ramen","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ラーメン"},{"w":"curry","c":"u","ad":"","cat":"food","tg":["food","make"],"lv":2,"ja":"カレー"},{"w":"sandwich","c":"c","ad":"a","cat":"food","tg":["food","make"],"lv":1,"ja":"サンドイッチ"},{"w":"pizza","c":"u","ad":"","cat":"food","tg":["food","make"],"lv":1,"ja":"ピザ"},{"w":"water","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"水"},{"w":"milk","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"牛乳"},{"w":"coffee","c":"u","ad":"","cat":"drink","tg":["drink","make"],"lv":1,"ja":"コーヒー"},{"w":"orange juice","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"オレンジジュース"},{"w":"tea","c":"u","ad":"","cat":"drink","tg":["drink","make"],"lv":1,"ja":"お茶"},{"w":"book","c":"c","ad":"a","cat":"read","tg":["read","thing"],"lv":1,"ja":"本"},{"w":"comic","c":"c","ad":"a","cat":"read","tg":["read","thing"],"lv":2,"ja":"まんが"},{"w":"newspaper","c":"t","ad":"the","cat":"read","tg":["read","thing"],"lv":1,"ja":"新聞"},{"w":"letter","c":"c","ad":"a","cat":"read","tg":["read","write","thing"],"lv":1,"ja":"手紙"},{"w":"email","c":"c","ad":"a","cat":"read","tg":["read","write"],"lv":1,"ja":"メール"},{"w":"story","c":"c","ad":"a","cat":"read","tg":["read","write","tell"],"lv":1,"ja":"お話"},{"w":"lunch","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"ランチ"},{"w":"cold","c":"c","ad":"a","cat":"over","tg":["over"],"lv":1,"ja":"風邪"},{"w":"shock","c":"t","ad":"the","cat":"over","tg":["over"],"lv":2,"ja":"ショック"},{"w":"party","c":"t","ad":"the","cat":"event","tg":["event"],"lv":1,"ja":"パーティー"},{"w":"trip","c":"t","ad":"the","cat":"event","tg":["event"],"lv":1,"ja":"旅行"},{"w":"meeting","c":"t","ad":"the","cat":"event","tg":["event"],"lv":1,"ja":"会議"},{"w":"light","c":"t","ad":"the","cat":"device","tg":["device"],"lv":1,"ja":"電気"},{"w":"offer","c":"t","ad":"the","cat":"offer","tg":["offer"],"lv":2,"ja":"申し出"},{"w":"invitation","c":"t","ad":"the","cat":"offer","tg":["offer","event"],"lv":3,"ja":"招待"},{"w":"word","c":"t","ad":"the","cat":"word","tg":["word"],"lv":1,"ja":"その単語"},{"w":"fire","c":"t","ad":"the","cat":"fire","tg":["fire"],"lv":1,"ja":"火"},{"w":"noise","c":"t","ad":"the","cat":"bear","tg":["bear"],"lv":1,"ja":"騒音"},{"w":"butterfly","c":"c","ad":"a","cat":"change","tg":["change","see"],"lv":1,"ja":"チョウ"},{"w":"frog","c":"c","ad":"a","cat":"change","tg":["change","see"],"lv":1,"ja":"カエル"},{"w":"secret","c":"c","ad":"a","cat":"tell","tg":["tell"],"lv":2,"ja":"ひみつ"},{"w":"joke","c":"c","ad":"a","cat":"tell","tg":["tell"],"lv":2,"ja":"じょうだん"},{"w":"truth","c":"t","ad":"the","cat":"tell","tg":["tell"],"lv":2,"ja":"本当のこと"},{"w":"name","c":"c","ad":"my","cat":"write","tg":["write"],"lv":1,"ja":"名前"},{"w":"TV","c":"t","ad":"the","cat":"watch","tg":["watch","device"],"lv":1,"ja":"テレビ"},{"w":"movie","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":1,"ja":"映画"},{"w":"star","c":"c","ad":"the","cat":"see","tg":["see"],"lv":2,"ja":"星"},{"w":"soccer","c":"u","ad":"","cat":"sport","tg":["sport","watch"],"lv":1,"ja":"サッカー"},{"w":"tennis","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":1,"ja":"テニス"},{"w":"baseball","c":"u","ad":"","cat":"sport","tg":["sport","watch"],"lv":1,"ja":"野球"},{"w":"basketball","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":1,"ja":"バスケ"},{"w":"piano","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":1,"ja":"ピアノ"},{"w":"guitar","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":1,"ja":"ギター"},{"w":"video games","c":"p","ad":"","cat":"game","tg":["game"],"lv":1,"ja":"ゲーム"},{"w":"cards","c":"p","ad":"","cat":"game","tg":["game"],"lv":2,"ja":"トランプ"},{"w":"music","c":"u","ad":"","cat":"music","tg":["music"],"lv":1,"ja":"音楽"},{"w":"song","c":"c","ad":"a","cat":"song","tg":["song","music","write"],"lv":1,"ja":"歌"},{"w":"radio","c":"t","ad":"the","cat":"music","tg":["music","thing","device"],"lv":1,"ja":"ラジオ"},{"w":"English","c":"n","ad":"","cat":"lang","tg":["lang"],"lv":2,"ja":"英語"},{"w":"math","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"数学"},{"w":"homework","c":"u","ad":"","cat":"homework","tg":["homework"],"lv":1,"ja":"宿題"},{"w":"ball","c":"c","ad":"a","cat":"ball","tg":["ball","thing"],"lv":1,"ja":"ボール"},{"w":"bike","c":"c","ad":"a","cat":"ride","tg":["ride","thing"],"lv":1,"ja":"自転車"},{"w":"bag","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"かばん"},{"w":"umbrella","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"かさ"},{"w":"phone","c":"c","ad":"my","cat":"thing","tg":["thing"],"lv":1,"ja":"スマホ"},{"w":"key","c":"t","ad":"the","cat":"thing","tg":["thing"],"lv":1,"ja":"かぎ"},{"w":"camera","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"カメラ"},{"w":"picture","c":"c","ad":"a","cat":"draw","tg":["draw","thing"],"lv":1,"ja":"絵"},{"w":"photo","c":"c","ad":"a","cat":"photo","tg":["photo"],"lv":1,"ja":"写真"},{"w":"door","c":"t","ad":"the","cat":"door","tg":["door"],"lv":1,"ja":"ドア"},{"w":"window","c":"t","ad":"the","cat":"door","tg":["door"],"lv":1,"ja":"窓"},{"w":"box","c":"t","ad":"the","cat":"door","tg":["door","thing"],"lv":1,"ja":"箱"},{"w":"house","c":"t","ad":"the","cat":"thing","tg":["thing","door"],"lv":1,"ja":"家"},{"w":"room","c":"c","ad":"my","cat":"clean","tg":["clean"],"lv":1,"ja":"部屋"},{"w":"dishes","c":"p","ad":"the","cat":"wash","tg":["wash"],"lv":2,"ja":"お皿"},{"w":"car","c":"t","ad":"the","cat":"wash","tg":["wash","thing","car"],"lv":1,"ja":"車"},{"w":"flower","c":"c","ad":"a","cat":"thing","tg":["thing","draw","see","plant"],"lv":2,"ja":"花"},{"w":"present","c":"c","ad":"a","cat":"thing","tg":["thing","present"],"lv":1,"ja":"プレゼント"},{"w":"hat","c":"c","ad":"a","cat":"thing","tg":["thing","wear","whead"],"lv":1,"ja":"ぼうし"},{"w":"cookie","c":"c","ad":"a","cat":"food","tg":["food","make"],"lv":1,"ja":"クッキー"},{"w":"egg","c":"c","ad":"a","cat":"food","tg":["food","cut"],"lv":1,"ja":"たまご"},{"w":"soup","c":"u","ad":"","cat":"food","tg":["food","make"],"lv":1,"ja":"スープ"},{"w":"pen","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ペン"},{"w":"notebook","c":"c","ad":"a","cat":"thing","tg":["thing","write"],"lv":1,"ja":"ノート"},{"w":"computer","c":"t","ad":"the","cat":"thing","tg":["thing","device"],"lv":1,"ja":"パソコン"},{"w":"toy","c":"c","ad":"a","cat":"thing","tg":["thing","game","toy"],"lv":1,"ja":"おもちゃ"},{"w":"map","c":"c","ad":"a","cat":"read","tg":["read","thing","draw"],"lv":1,"ja":"地図"},{"w":"shirt","c":"c","ad":"a","cat":"wear","tg":["wear","thing","wash"],"lv":1,"ja":"シャツ"},{"w":"jacket","c":"c","ad":"a","cat":"wear","tg":["wear","thing"],"lv":1,"ja":"ジャケット"},{"w":"shoe","c":"c","ad":"a","cat":"wear","tg":["wear","wfoot","thing","wash"],"lv":2,"ja":"くつ"},{"w":"tree","c":"c","ad":"a","cat":"climb","tg":["climb","plant","see","draw"],"lv":1,"ja":"木"},{"w":"mountain","c":"t","ad":"the","cat":"climb","tg":["climb","see","draw"],"lv":1,"ja":"山"},{"w":"sandcastle","c":"c","ad":"a","cat":"build","tg":["build","make"],"lv":2,"ja":"砂のお城"},{"w":"snowman","c":"c","ad":"a","cat":"build","tg":["build","make"],"lv":2,"ja":"雪だるま"},{"w":"bus","c":"p","ad":"the","cat":"ride","tg":["ride","car"],"lv":1,"ja":"バス"},{"w":"train","c":"t","ad":"the","cat":"ride","tg":["ride","see"],"lv":1,"ja":"電車"},{"w":"rice","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"ごはん"},{"w":"meat","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"肉"},{"w":"fish","c":"u","ad":"","cat":"food","tg":["food"],"lv":3,"ja":"魚"},{"w":"chicken","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"鶏肉"},{"w":"beef","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"牛肉"},{"w":"pork","c":"u","ad":"","cat":"food","tg":["food"],"lv":3,"ja":"豚肉"},{"w":"salad","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"サラダ"},{"w":"sushi","c":"u","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"すし"},{"w":"noodles","c":"u","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"めん"},{"w":"strawberry","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"いちご"},{"w":"orange","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"オレンジ"},{"w":"lemon","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"レモン"},{"w":"peach","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"もも"},{"w":"grape","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"ぶどう"},{"w":"melon","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"メロン"},{"w":"watermelon","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"すいか"},{"w":"pineapple","c":"c","ad":"a","cat":"food","tg":["food"],"lv":3,"ja":"パイナップル"},{"w":"tomato","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"トマト"},{"w":"potato","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"じゃがいも"},{"w":"carrot","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"にんじん"},{"w":"onion","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"たまねぎ"},{"w":"cabbage","c":"c","ad":"a","cat":"food","tg":["food"],"lv":3,"ja":"キャベツ"},{"w":"mushrooms","c":"p","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"きのこ"},{"w":"corn","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"とうもろこし"},{"w":"cheese","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"チーズ"},{"w":"butter","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"バター"},{"w":"jam","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ジャム"},{"w":"chocolate","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"チョコレート"},{"w":"candy","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"あめ"},{"w":"ice cream","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"アイスクリーム"},{"w":"donut","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"ドーナツ"},{"w":"pie","c":"c","ad":"a","cat":"food","tg":["food"],"lv":3,"ja":"パイ"},{"w":"pasta","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"パスタ"},{"w":"hamburger","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"ハンバーガー"},{"w":"hot dog","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"ホットドッグ"},{"w":"steak","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ステーキ"},{"w":"toast","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"トースト"},{"w":"cereal","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"シリアル"},{"w":"yogurt","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"ヨーグルト"},{"w":"popcorn","c":"u","ad":"","cat":"food","tg":["food"],"lv":3,"ja":"ポップコーン"},{"w":"french fries","c":"p","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"フライドポテト"},{"w":"tofu","c":"u","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"豆腐"},{"w":"natto","c":"u","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"納豆"},{"w":"miso soup","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"みそ汁"},{"w":"udon","c":"u","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"うどん"},{"w":"soba","c":"u","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"そば"},{"w":"tempura","c":"u","ad":"","cat":"food","tg":["food"],"lv":4,"ja":"天ぷら"},{"w":"breakfast","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"朝ごはん"},{"w":"dinner","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"夕ごはん"},{"w":"snack","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"おやつ"},{"w":"dessert","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"デザート"},{"w":"fruit","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"くだもの"},{"w":"vegetables","c":"p","ad":"","cat":"food","tg":["food","plant"],"lv":4,"ja":"野菜"},{"w":"pancake","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"パンケーキ"},{"w":"muffin","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"マフィン"},{"w":"bento","c":"c","ad":"a","cat":"food","tg":["food"],"lv":4,"ja":"お弁当"},{"w":"honey","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"はちみつ"},{"w":"sugar","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"砂糖"},{"w":"salt","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"塩"},{"w":"green tea","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"緑茶"},{"w":"cola","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":2,"ja":"コーラ"},{"w":"soda","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":2,"ja":"ソーダ"},{"w":"hot chocolate","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"ココア"},{"w":"lemonade","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":2,"ja":"レモネード"},{"w":"apple juice","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"りんごジュース"},{"w":"milk tea","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"ミルクティー"},{"w":"smoothie","c":"c","ad":"a","cat":"drink","tg":["drink"],"lv":4,"ja":"スムージー"},{"w":"sports drink","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":1,"ja":"スポーツドリンク"},{"w":"magazine","c":"c","ad":"a","cat":"read","tg":["read"],"lv":1,"ja":"雑誌"},{"w":"dictionary","c":"c","ad":"a","cat":"read","tg":["read"],"lv":1,"ja":"辞書"},{"w":"textbook","c":"c","ad":"a","cat":"read","tg":["read"],"lv":2,"ja":"教科書"},{"w":"novel","c":"c","ad":"a","cat":"read","tg":["read"],"lv":2,"ja":"小説"},{"w":"poem","c":"c","ad":"a","cat":"read","tg":["read"],"lv":1,"ja":"詩"},{"w":"diary","c":"c","ad":"a","cat":"read","tg":["read"],"lv":2,"ja":"日記"},{"w":"menu","c":"c","ad":"a","cat":"read","tg":["read"],"lv":2,"ja":"メニュー"},{"w":"sign","c":"c","ad":"a","cat":"read","tg":["read"],"lv":1,"ja":"看板"},{"w":"message","c":"c","ad":"a","cat":"read","tg":["read"],"lv":1,"ja":"メッセージ"},{"w":"report","c":"c","ad":"a","cat":"read","tg":["read"],"lv":3,"ja":"レポート"},{"w":"instructions","c":"p","ad":"","cat":"read","tg":["read"],"lv":4,"ja":"説明書"},{"w":"recipe","c":"c","ad":"a","cat":"read","tg":["read"],"lv":4,"ja":"レシピ"},{"w":"comics","c":"p","ad":"","cat":"read","tg":["read"],"lv":4,"ja":"まんが"},{"w":"note","c":"c","ad":"a","cat":"write","tg":["write"],"lv":1,"ja":"メモ"},{"w":"essay","c":"c","ad":"a","cat":"write","tg":["write"],"lv":2,"ja":"作文"},{"w":"postcard","c":"c","ad":"a","cat":"write","tg":["write"],"lv":3,"ja":"はがき"},{"w":"card","c":"c","ad":"a","cat":"write","tg":["write"],"lv":1,"ja":"カード"},{"w":"list","c":"c","ad":"a","cat":"write","tg":["write"],"lv":1,"ja":"リスト"},{"w":"answer","c":"c","ad":"a","cat":"write","tg":["write"],"lv":1,"ja":"答え"},{"w":"question","c":"c","ad":"a","cat":"write","tg":["write"],"lv":1,"ja":"質問"},{"w":"pencil","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"えんぴつ"},{"w":"eraser","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"消しゴム"},{"w":"ruler","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"定規"},{"w":"scissors","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"はさみ"},{"w":"glue","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":4,"ja":"のり"},{"w":"desk","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"机"},{"w":"chair","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"いす"},{"w":"table","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"テーブル"},{"w":"bed","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ベッド"},{"w":"sofa","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ソファー"},{"w":"clock","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"時計"},{"w":"watch","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"腕時計"},{"w":"cup","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"カップ"},{"w":"glass","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"コップ"},{"w":"plate","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"皿"},{"w":"bowl","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"おわん"},{"w":"spoon","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"スプーン"},{"w":"fork","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"フォーク"},{"w":"knife","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ナイフ"},{"w":"chopsticks","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":4,"ja":"はし"},{"w":"bottle","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"びん"},{"w":"wallet","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"さいふ"},{"w":"ticket","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"切符"},{"w":"coin","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"コイン"},{"w":"glasses","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":1,"ja":"めがね"},{"w":"ring","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"指輪"},{"w":"necklace","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"ネックレス"},{"w":"towel","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"タオル"},{"w":"soap","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"せっけん"},{"w":"toothbrush","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"歯ブラシ"},{"w":"pillow","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"まくら"},{"w":"blanket","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"毛布"},{"w":"lamp","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ランプ"},{"w":"mirror","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"鏡"},{"w":"basket","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"かご"},{"w":"backpack","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"リュック"},{"w":"suitcase","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"スーツケース"},{"w":"tablet","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"タブレット"},{"w":"laptop","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"ノートパソコン"},{"w":"headphones","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":4,"ja":"ヘッドホン"},{"w":"speaker","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"スピーカー"},{"w":"charger","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"充電器"},{"w":"battery","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"電池"},{"w":"remote","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"リモコン"},{"w":"fan","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"扇風機"},{"w":"heater","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"ヒーター"},{"w":"fridge","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"冷蔵庫"},{"w":"microwave","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"電子レンジ"},{"w":"oven","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"オーブン"},{"w":"rope","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ロープ"},{"w":"bucket","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"バケツ"},{"w":"shovel","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"シャベル"},{"w":"flag","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"旗"},{"w":"balloon","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"風船"},{"w":"candle","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"ろうそく"},{"w":"gift","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"贈り物"},{"w":"doll","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"人形"},{"w":"puzzle","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"パズル"},{"w":"kite","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"たこ"},{"w":"sticker","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"シール"},{"w":"crayons","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":4,"ja":"クレヨン"},{"w":"paintbrush","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"絵筆"},{"w":"paints","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":4,"ja":"絵の具"},{"w":"tent","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"テント"},{"w":"flashlight","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"懐中電灯"},{"w":"sunglasses","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"サングラス"},{"w":"glove","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"手袋"},{"w":"scarf","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"マフラー"},{"w":"sock","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"くつ下"},{"w":"boot","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"ブーツ"},{"w":"skirt","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"スカート"},{"w":"dress","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ドレス"},{"w":"pants","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":1,"ja":"ズボン"},{"w":"jeans","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":1,"ja":"ジーンズ"},{"w":"sweater","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"セーター"},{"w":"coat","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"コート"},{"w":"cap","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"キャップ"},{"w":"uniform","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"制服"},{"w":"pajamas","c":"p","ad":"","cat":"thing","tg":["thing"],"lv":4,"ja":"パジャマ"},{"w":"t-shirt","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"Tシャツ"},{"w":"belt","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ベルト"},{"w":"button","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ボタン"},{"w":"pocket","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ポケット"},{"w":"trash can","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ごみ箱"},{"w":"trash","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":3,"ja":"ごみ"},{"w":"plant","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"植物"},{"w":"flower pot","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":3,"ja":"植木鉢"},{"w":"stone","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"石"},{"w":"stick","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"棒"},{"w":"leaf","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"葉っぱ"},{"w":"leave","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":4,"ja":"落ち葉"},{"w":"shell","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"貝がら"},{"w":"seed","c":"c","ad":"a","cat":"thing","tg":["thing","plant"],"lv":4,"ja":"種"},{"w":"volleyball","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":1,"ja":"バレーボール"},{"w":"table tennis","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":2,"ja":"卓球"},{"w":"badminton","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":2,"ja":"バドミントン"},{"w":"golf","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":2,"ja":"ゴルフ"},{"w":"rugby","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":2,"ja":"ラグビー"},{"w":"judo","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":4,"ja":"柔道"},{"w":"karate","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":4,"ja":"空手"},{"w":"kendo","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":4,"ja":"剣道"},{"w":"swimming","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":1,"ja":"水泳"},{"w":"skiing","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":2,"ja":"スキー"},{"w":"skating","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":2,"ja":"スケート"},{"w":"surfing","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":2,"ja":"サーフィン"},{"w":"dodgeball","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":4,"ja":"ドッジボール"},{"w":"tag","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":4,"ja":"鬼ごっこ"},{"w":"hide-and-seek","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":4,"ja":"かくれんぼ"},{"w":"track and field","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":1,"ja":"陸上"},{"w":"violin","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":2,"ja":"バイオリン"},{"w":"flute","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":3,"ja":"フルート"},{"w":"drum","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":1,"ja":"ドラム"},{"w":"trumpet","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":3,"ja":"トランペット"},{"w":"harmonica","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":4,"ja":"ハーモニカ"},{"w":"recorder","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":4,"ja":"リコーダー"},{"w":"ukulele","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":4,"ja":"ウクレレ"},{"w":"keyboard","c":"t","ad":"the","cat":"instr","tg":["instr"],"lv":3,"ja":"キーボード"},{"w":"board game","c":"c","ad":"a","cat":"game","tg":["game"],"lv":2,"ja":"ボードゲーム"},{"w":"chess","c":"u","ad":"","cat":"game","tg":["game"],"lv":2,"ja":"チェス"},{"w":"shogi","c":"u","ad":"","cat":"game","tg":["game"],"lv":4,"ja":"将棋"},{"w":"card game","c":"c","ad":"a","cat":"game","tg":["game"],"lv":1,"ja":"カードゲーム"},{"w":"video game","c":"c","ad":"a","cat":"game","tg":["game"],"lv":2,"ja":"テレビゲーム"},{"w":"quiz","c":"c","ad":"a","cat":"game","tg":["game"],"lv":2,"ja":"クイズ"},{"w":"riddle","c":"c","ad":"a","cat":"game","tg":["game"],"lv":4,"ja":"なぞなぞ"},{"w":"jazz","c":"u","ad":"","cat":"music","tg":["music"],"lv":3,"ja":"ジャズ"},{"w":"rock","c":"u","ad":"","cat":"music","tg":["music"],"lv":2,"ja":"ロック"},{"w":"pop music","c":"u","ad":"","cat":"music","tg":["music"],"lv":1,"ja":"ポップス"},{"w":"classical music","c":"u","ad":"","cat":"music","tg":["music"],"lv":2,"ja":"クラシック"},{"w":"podcast","c":"c","ad":"a","cat":"music","tg":["music"],"lv":4,"ja":"ポッドキャスト"},{"w":"concert","c":"c","ad":"a","cat":"music","tg":["music"],"lv":1,"ja":"コンサート"},{"w":"science","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"理科"},{"w":"history","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"歴史"},{"w":"Japanese history","c":"n","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"日本史"},{"w":"art","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"美術"},{"w":"social studies","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"社会"},{"w":"Chinese","c":"n","ad":"","cat":"lang","tg":["lang"],"lv":4,"ja":"中国語"},{"w":"Korean","c":"n","ad":"","cat":"lang","tg":["lang"],"lv":4,"ja":"韓国語"},{"w":"French","c":"n","ad":"","cat":"lang","tg":["lang"],"lv":4,"ja":"フランス語"},{"w":"Spanish","c":"n","ad":"","cat":"lang","tg":["lang"],"lv":4,"ja":"スペイン語"},{"w":"programming","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":4,"ja":"プログラミング"},{"w":"geography","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":3,"ja":"地理"},{"w":"anime","c":"u","ad":"","cat":"watch","tg":["watch"],"lv":4,"ja":"アニメ"},{"w":"drama","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":1,"ja":"ドラマ"},{"w":"cartoon","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":1,"ja":"まんが映画"},{"w":"video","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":1,"ja":"動画"},{"w":"show","c":"c","ad":"a","cat":"watch","tg":["watch","event"],"lv":2,"ja":"番組"},{"w":"sunset","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":3,"ja":"夕日"},{"w":"sunrise","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":3,"ja":"日の出"},{"w":"fireworks","c":"u","ad":"","cat":"watch","tg":["watch"],"lv":4,"ja":"花火"},{"w":"parade","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":4,"ja":"パレード"},{"w":"game","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":1,"ja":"試合"},{"w":"play","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":1,"ja":"劇"},{"w":"taxi","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":1,"ja":"タクシー"},{"w":"plane","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":1,"ja":"飛行機"},{"w":"ship","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":1,"ja":"船"},{"w":"boat","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":1,"ja":"ボート"},{"w":"subway","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":1,"ja":"地下鉄"},{"w":"motorcycle","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":3,"ja":"バイク"},{"w":"scooter","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":4,"ja":"スクーター"},{"w":"skateboard","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":4,"ja":"スケボー"},{"w":"unicycle","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":4,"ja":"一輪車"},{"w":"roller coaster","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":4,"ja":"ジェットコースター"},{"w":"elevator","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":2,"ja":"エレベーター"},{"w":"escalator","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":2,"ja":"エスカレーター"},{"w":"test","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"テスト"},{"w":"exam","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"試験"},{"w":"class","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"授業"},{"w":"lesson","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"レッスン"},{"w":"festival","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"お祭り"},{"w":"wedding","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"結婚式"},{"w":"birthday party","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"誕生日会"},{"w":"sports day","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"運動会"},{"w":"school trip","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"修学旅行"},{"w":"vacation","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"休み"},{"w":"picnic","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"ピクニック"},{"w":"camp","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"キャンプ"},{"w":"match","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"試合"},{"w":"contest","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"コンテスト"},{"w":"interview","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"面接"},{"w":"appointment","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"予約"},{"w":"kitchen","c":"c","ad":"a","cat":"clean","tg":["clean"],"lv":1,"ja":"台所"},{"w":"bathroom","c":"c","ad":"a","cat":"clean","tg":["clean"],"lv":1,"ja":"浴室"},{"w":"classroom","c":"c","ad":"a","cat":"clean","tg":["clean"],"lv":1,"ja":"教室"},{"w":"garden","c":"c","ad":"a","cat":"clean","tg":["clean"],"lv":1,"ja":"庭"},{"w":"yard","c":"c","ad":"a","cat":"clean","tg":["clean"],"lv":1,"ja":"庭"},{"w":"floor","c":"c","ad":"a","cat":"clean","tg":["clean"],"lv":1,"ja":"床"},{"w":"face","c":"c","ad":"a","cat":"wash","tg":["wash"],"lv":1,"ja":"顔"},{"w":"hand","c":"c","ad":"a","cat":"wash","tg":["wash"],"lv":4,"ja":"手"},{"w":"hair","c":"u","ad":"","cat":"wash","tg":["wash"],"lv":1,"ja":"髪"},{"w":"clothes","c":"p","ad":"","cat":"wash","tg":["wash"],"lv":1,"ja":"服"},{"w":"light switch","c":"c","ad":"a","cat":"device","tg":["device"],"lv":3,"ja":"スイッチ"},{"w":"air conditioner","c":"c","ad":"a","cat":"device","tg":["device"],"lv":2,"ja":"エアコン"},{"w":"alarm","c":"c","ad":"a","cat":"device","tg":["device"],"lv":2,"ja":"目覚まし"},{"w":"music player","c":"c","ad":"a","cat":"device","tg":["device"],"lv":1,"ja":"音楽プレーヤー"},{"w":"printer","c":"c","ad":"a","cat":"device","tg":["device"],"lv":2,"ja":"プリンター"},{"w":"game console","c":"c","ad":"a","cat":"device","tg":["device"],"lv":4,"ja":"ゲーム機"},{"w":"circle","c":"c","ad":"a","cat":"draw","tg":["draw"],"lv":1,"ja":"円"},{"w":"line","c":"c","ad":"a","cat":"draw","tg":["draw"],"lv":1,"ja":"線"},{"w":"heart","c":"c","ad":"a","cat":"draw","tg":["draw"],"lv":1,"ja":"ハート"},{"w":"kanji","c":"u","ad":"","cat":"word","tg":["word"],"lv":4,"ja":"漢字"},{"w":"phrase","c":"c","ad":"a","cat":"word","tg":["word"],"lv":3,"ja":"フレーズ"},{"w":"idiom","c":"c","ad":"a","cat":"word","tg":["word"],"lv":3,"ja":"熟語"},{"w":"spelling","c":"u","ad":"","cat":"word","tg":["word"],"lv":3,"ja":"つづり"},{"w":"meaning","c":"c","ad":"a","cat":"word","tg":["word"],"lv":2,"ja":"意味"},{"w":"invitation card","c":"c","ad":"a","cat":"offer","tg":["offer"],"lv":1,"ja":"招待状"},{"w":"job offer","c":"c","ad":"a","cat":"offer","tg":["offer"],"lv":2,"ja":"仕事の話"},{"w":"idea","c":"c","ad":"a","cat":"offer","tg":["offer"],"lv":1,"ja":"アイデア"},{"w":"plan","c":"c","ad":"a","cat":"offer","tg":["offer"],"lv":3,"ja":"計画"},{"w":"proposal","c":"c","ad":"a","cat":"offer","tg":["offer"],"lv":3,"ja":"提案"},{"w":"request","c":"c","ad":"a","cat":"offer","tg":["offer"],"lv":2,"ja":"お願い"},{"w":"fear","c":"u","ad":"","cat":"over","tg":["over"],"lv":2,"ja":"恐怖"},{"w":"sadness","c":"u","ad":"","cat":"over","tg":["over"],"lv":3,"ja":"悲しみ"},{"w":"problem","c":"c","ad":"a","cat":"over","tg":["over"],"lv":1,"ja":"問題"},{"w":"jet lag","c":"u","ad":"","cat":"over","tg":["over"],"lv":1,"ja":"時差ぼけ"},{"w":"flu","c":"t","ad":"the","cat":"over","tg":["over"],"lv":3,"ja":"インフルエンザ"},{"w":"breakup","c":"c","ad":"a","cat":"over","tg":["over"],"lv":4,"ja":"失恋"},{"w":"model","c":"c","ad":"a","cat":"build","tg":["build"],"lv":2,"ja":"模型"},{"w":"bridge","c":"c","ad":"a","cat":"build","tg":["build"],"lv":1,"ja":"橋"},{"w":"tower","c":"c","ad":"a","cat":"build","tg":["build"],"lv":1,"ja":"塔"},{"w":"igloo","c":"c","ad":"a","cat":"build","tg":["build"],"lv":4,"ja":"かまくら"},{"w":"birdhouse","c":"c","ad":"a","cat":"build","tg":["build"],"lv":4,"ja":"巣箱"},{"w":"fort","c":"c","ad":"a","cat":"build","tg":["build"],"lv":4,"ja":"秘密基地"},{"w":"sunflower","c":"c","ad":"a","cat":"plant","tg":["plant"],"lv":2,"ja":"ひまわり"},{"w":"tulip","c":"c","ad":"a","cat":"plant","tg":["plant"],"lv":4,"ja":"チューリップ"},{"w":"rose","c":"c","ad":"a","cat":"plant","tg":["plant"],"lv":1,"ja":"バラ"},{"w":"rice plant","c":"c","ad":"a","cat":"plant","tg":["plant"],"lv":2,"ja":"稲"},{"w":"animals","c":"t","ad":"the","cat":"animal","tg":["animal"],"lv":4,"ja":"動物たち"},{"w":"album","c":"c","ad":"a","cat":"thing","tg":["thing","music","thing"],"lv":1,"ja":"アルバム"},{"w":"bell","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ベル"},{"w":"board","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"板"},{"w":"bone","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"骨"},{"w":"brush","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ブラシ"},{"w":"CD","c":"c","ad":"a","cat":"thing","tg":["thing","music","thing"],"lv":1,"ja":"CD"},{"w":"cloth","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"布"},{"w":"credit card","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"クレジットカード"},{"w":"file","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ファイル"},{"w":"money","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":1,"ja":"お金"},{"w":"jewelry","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":1,"ja":"宝石"},{"w":"machine","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"機械"},{"w":"mobile phone","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"携帯電話"},{"w":"paint","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":1,"ja":"ペンキ"},{"w":"paper","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":1,"ja":"紙"},{"w":"poster","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"ポスター"},{"w":"ribbon","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"リボン"},{"w":"seat","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"席"},{"w":"shelf","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"棚"},{"w":"telephone","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"電話"},{"w":"tool","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"道具"},{"w":"vase","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"花びん"},{"w":"wheel","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"車輪"},{"w":"collection","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"コレクション"},{"w":"dollar","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":1,"ja":"1ドル"},{"w":"apron","c":"c","ad":"a","cat":"wear","tg":["wear"],"lv":1,"ja":"エプロン"},{"w":"bat","c":"c","ad":"a","cat":"sport","tg":["sport"],"lv":1,"ja":"バット"},{"w":"sports","c":"u","ad":"","cat":"sport","tg":["sport"],"lv":1,"ja":"スポーツ"},{"w":"bean","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"豆"},{"w":"biscuit","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"ビスケット"},{"w":"cream","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"クリーム"},{"w":"ice","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"氷"},{"w":"meal","c":"c","ad":"a","cat":"food","tg":["food"],"lv":1,"ja":"食事"},{"w":"food","c":"u","ad":"","cat":"food","tg":["food"],"lv":1,"ja":"食べ物"},{"w":"bicycle","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":1,"ja":"自転車"},{"w":"truck","c":"c","ad":"a","cat":"ride","tg":["ride"],"lv":1,"ja":"トラック"},{"w":"DVD","c":"c","ad":"a","cat":"music","tg":["music","music","thing"],"lv":1,"ja":"DVD"},{"w":"program","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":1,"ja":"番組"},{"w":"sky","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":1,"ja":"空"},{"w":"moon","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":1,"ja":"月"},{"w":"sun","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":1,"ja":"太陽"},{"w":"snow","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":1,"ja":"雪"},{"w":"painting","c":"c","ad":"a","cat":"watch","tg":["watch"],"lv":1,"ja":"絵"},{"w":"world","c":"t","ad":"the","cat":"watch","tg":["watch"],"lv":1,"ja":"世界"},{"w":"mail","c":"u","ad":"","cat":"read","tg":["read"],"lv":1,"ja":"郵便物"},{"w":"page","c":"c","ad":"a","cat":"read","tg":["read"],"lv":1,"ja":"ページ"},{"w":"information","c":"u","ad":"","cat":"read","tg":["read"],"lv":1,"ja":"情報"},{"w":"number","c":"c","ad":"a","cat":"write","tg":["write"],"lv":1,"ja":"番号"},{"w":"sentence","c":"c","ad":"a","cat":"write","tg":["write"],"lv":1,"ja":"文"},{"w":"language","c":"c","ad":"a","cat":"lang","tg":["lang"],"lv":1,"ja":"言語"},{"w":"grammar","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"文法"},{"w":"subject","c":"c","ad":"a","cat":"lang","tg":["lang"],"lv":1,"ja":"教科"},{"w":"culture","c":"u","ad":"","cat":"lang","tg":["lang"],"lv":1,"ja":"文化"},{"w":"grass","c":"u","ad":"","cat":"plant","tg":["plant"],"lv":1,"ja":"草"},{"w":"wall","c":"c","ad":"a","cat":"clean","tg":["clean"],"lv":1,"ja":"壁"},{"w":"time","c":"t","ad":"the","cat":"clock","tg":["clock"],"lv":1,"ja":"時刻"},{"w":"birthday","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"誕生日"},{"w":"holiday","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"休日"},{"w":"celebration","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"お祝い"},{"w":"speech","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"スピーチ"},{"w":"practice","c":"u","ad":"","cat":"event","tg":["event"],"lv":1,"ja":"練習"},{"w":"activity","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"活動"},{"w":"club","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"クラブ"},{"w":"conversation","c":"c","ad":"a","cat":"event","tg":["event"],"lv":1,"ja":"会話"},{"w":"hobby","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"趣味"},{"w":"job","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"仕事"},{"w":"dream","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"夢"},{"w":"memory","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"思い出"},{"w":"life","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"人生"},{"w":"luck","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"運"},{"w":"peace","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"平和"},{"w":"way","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"方法"},{"w":"rule","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"ルール"},{"w":"reason","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"理由"},{"w":"result","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"結果"},{"w":"example","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"例"},{"w":"weather","c":"t","ad":"the","cat":"abstract","tg":["abstract"],"lv":1,"ja":"天気"},{"w":"health","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"健康"},{"w":"future","c":"t","ad":"the","cat":"abstract","tg":["abstract"],"lv":1,"ja":"未来"},{"w":"skill","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"技術"},{"w":"habit","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"習慣"},{"w":"feeling","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"気持ち"},{"w":"difference","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":1,"ja":"ちがい"},{"w":"fun","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"楽しいこと"},{"w":"love","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"愛"},{"w":"help","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"助け"},{"w":"advice","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":1,"ja":"アドバイス"},{"w":"arm","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"腕"},{"w":"ear","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"耳"},{"w":"eye","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"目"},{"w":"head","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"頭"},{"w":"leg","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"足"},{"w":"mouth","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"口"},{"w":"neck","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"首"},{"w":"nose","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"鼻"},{"w":"shoulder","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"肩"},{"w":"teeth","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"歯"},{"w":"knee","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"ひざ"},{"w":"body","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":1,"ja":"体"},{"w":"alarm clock","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"目覚まし時計"},{"w":"armchair","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ひじかけいす"},{"w":"bench","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ベンチ"},{"w":"bill","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"請求書"},{"w":"blackboard","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"黒板"},{"w":"bookshelf","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"本棚"},{"w":"light bulb","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"電球"},{"w":"calendar","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"カレンダー"},{"w":"can","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"缶"},{"w":"cash","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"現金"},{"w":"chain","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"くさり"},{"w":"comb","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"くし"},{"w":"container","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"容器"},{"w":"crown","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"王冠"},{"w":"cupboard","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"食器棚"},{"w":"diamond","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ダイヤモンド"},{"w":"digital camera","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"デジカメ"},{"w":"drawer","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"引き出し"},{"w":"earring","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"イヤリング"},{"w":"envelope","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"封筒"},{"w":"feather","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"羽"},{"w":"folder","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"フォルダー"},{"w":"furniture","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"家具"},{"w":"gate","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"門"},{"w":"globe","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"地球儀"},{"w":"guidebook","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ガイドブック"},{"w":"handbag","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ハンドバッグ"},{"w":"handle","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"取っ手"},{"w":"lock","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"錠"},{"w":"medal","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"メダル"},{"w":"mug","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"マグカップ"},{"w":"napkin","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ナプキン"},{"w":"pan","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"フライパン"},{"w":"perfume","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"香水"},{"w":"pill","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"錠剤"},{"w":"racket","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"ラケット"},{"w":"receipt","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"レシート"},{"w":"screen","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"画面"},{"w":"shampoo","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"シャンプー"},{"w":"stamp","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"切手"},{"w":"stove","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"コンロ"},{"w":"tape","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"テープ"},{"w":"treasure","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"宝物"},{"w":"washing machine","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"洗濯機"},{"w":"wheelchair","c":"c","ad":"a","cat":"thing","tg":["thing"],"lv":2,"ja":"車いす"},{"w":"wood","c":"u","ad":"","cat":"thing","tg":["thing"],"lv":2,"ja":"木材"},{"w":"raincoat","c":"c","ad":"a","cat":"wear","tg":["wear"],"lv":2,"ja":"レインコート"},{"w":"shorts","c":"p","ad":"","cat":"wear","tg":["wear"],"lv":2,"ja":"短パン"},{"w":"suit","c":"c","ad":"a","cat":"wear","tg":["wear"],"lv":2,"ja":"スーツ"},{"w":"swimsuit","c":"c","ad":"a","cat":"wear","tg":["wear"],"lv":2,"ja":"水着"},{"w":"tie","c":"c","ad":"a","cat":"wear","tg":["wear"],"lv":2,"ja":"ネクタイ"},{"w":"flour","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"小麦粉"},{"w":"ham","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ハム"},{"w":"jelly","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ゼリー"},{"w":"oil","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"油"},{"w":"pear","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"洋ナシ"},{"w":"pepper","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"コショウ"},{"w":"sauce","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ソース"},{"w":"sausage","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"ソーセージ"},{"w":"spaghetti","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"スパゲッティ"},{"w":"seafood","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"魚介類"},{"w":"garlic","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ニンニク"},{"w":"omelet","c":"c","ad":"a","cat":"food","tg":["food"],"lv":2,"ja":"オムレツ"},{"w":"fast food","c":"u","ad":"","cat":"food","tg":["food"],"lv":2,"ja":"ファストフード"},{"w":"mineral water","c":"u","ad":"","cat":"drink","tg":["drink"],"lv":2,"ja":"ミネラルウォーター"},{"w":"soft drink","c":"c","ad":"a","cat":"drink","tg":["drink"],"lv":2,"ja":"ジュース類"},{"w":"instrument","c":"c","ad":"a","cat":"instr","tg":["instr"],"lv":2,"ja":"楽器"},{"w":"road","c":"t","ad":"the","cat":"road","tg":["road"],"lv":2,"ja":"道"},{"w":"street","c":"t","ad":"the","cat":"road","tg":["road"],"lv":2,"ja":"通り"},{"w":"river","c":"t","ad":"the","cat":"road","tg":["road"],"lv":2,"ja":"川"},{"w":"accident","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"事故"},{"w":"adventure","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"冒険"},{"w":"anniversary","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"記念日"},{"w":"award","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"賞"},{"w":"barbecue","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"バーベキュー"},{"w":"challenge","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"挑戦"},{"w":"competition","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"大会"},{"w":"cruise","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"クルーズ"},{"w":"emergency","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"緊急事態"},{"w":"exhibition","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"展示会"},{"w":"flight","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"フライト"},{"w":"hike","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"ハイキング"},{"w":"journey","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"旅"},{"w":"performance","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"公演"},{"w":"reunion","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"同窓会"},{"w":"schedule","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"予定"},{"w":"tour","c":"c","ad":"a","cat":"event","tg":["event"],"lv":2,"ja":"ツアー"},{"w":"sightseeing","c":"u","ad":"","cat":"event","tg":["event"],"lv":2,"ja":"観光"},{"w":"travel","c":"u","ad":"","cat":"event","tg":["event"],"lv":2,"ja":"旅行"},{"w":"exercise","c":"u","ad":"","cat":"event","tg":["event"],"lv":2,"ja":"運動"},{"w":"chance","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"チャンス"},{"w":"choice","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"選択"},{"w":"diet","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"ダイエット"},{"w":"experience","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"経験"},{"w":"fashion","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"流行"},{"w":"mistake","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"まちがい"},{"w":"mystery","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"なぞ"},{"w":"opinion","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"意見"},{"w":"opportunity","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"機会"},{"w":"promise","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"約束"},{"w":"tradition","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"伝統"},{"w":"trouble","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"トラブル"},{"w":"knowledge","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"知識"},{"w":"talent","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"才能"},{"w":"success","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"成功"},{"w":"happiness","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"幸せ"},{"w":"freedom","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"自由"},{"w":"friendship","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"友情"},{"w":"nature","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"自然"},{"w":"fact","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"事実"},{"w":"solution","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"解決策"},{"w":"weight","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"体重"},{"w":"temperature","c":"t","ad":"the","cat":"abstract","tg":["abstract"],"lv":2,"ja":"気温"},{"w":"view","c":"t","ad":"the","cat":"abstract","tg":["abstract"],"lv":2,"ja":"景色"},{"w":"sunlight","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"日光"},{"w":"storm","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"嵐"},{"w":"earthquake","c":"c","ad":"a","cat":"abstract","tg":["abstract"],"lv":2,"ja":"地震"},{"w":"fog","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"霧"},{"w":"energy","c":"u","ad":"","cat":"abstract","tg":["abstract"],"lv":2,"ja":"エネルギー"},{"w":"ankle","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"足首"},{"w":"cheek","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"ほお"},{"w":"chest","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"胸"},{"w":"chin","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"あご"},{"w":"lip","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"くちびる"},{"w":"stomach","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"おなか"},{"w":"toe","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"つま先"},{"w":"voice","c":"c","ad":"my","cat":"body","tg":["body","wash"],"lv":2,"ja":"声"},{"w":"something","c":"n","ad":"","cat":"person","ind":1,"lv":1,"ja":"何か"},{"w":"everything","c":"n","ad":"","cat":"person","ind":1,"lv":1,"ja":"ぜんぶ"},{"w":"someone","c":"n","ad":"","cat":"person","ind":1,"lv":1,"ja":"だれか"},{"w":"everyone","c":"n","ad":"","cat":"person","ind":1,"lv":1,"ja":"みんな"},{"w":"Ken","c":"n","ad":"","cat":"person","lv":2,"ja":"ケン"},{"w":"Mika","c":"n","ad":"","cat":"person","lv":2,"ja":"ミカ"},{"w":"mom","c":"c","ad":"my","cat":"person","lv":1,"ja":"お母さん"},{"w":"dad","c":"c","ad":"my","cat":"person","lv":1,"ja":"お父さん"},{"w":"grandma","c":"c","ad":"my","cat":"person","lv":1,"ja":"おばあちゃん"},{"w":"teacher","c":"c","ad":"the","cat":"person","lv":1,"ja":"先生"},{"w":"boy","c":"c","ad":"the","cat":"person","lv":1,"ja":"男の子"},{"w":"girl","c":"c","ad":"the","cat":"person","lv":1,"ja":"女の子"},{"w":"baby","c":"c","ad":"the","cat":"person","lv":1,"ja":"赤ちゃん"},{"w":"friend","c":"c","ad":"my","cat":"person","lv":2,"ja":"友だち"},{"w":"student","c":"c","ad":"the","cat":"person","lv":2,"ja":"生徒たち"},{"w":"dog","c":"c","ad":"the","cat":"animal","lv":1,"ja":"犬"},{"w":"cat","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ねこ"},{"w":"bird","c":"c","ad":"the","cat":"animal","lv":1,"ja":"鳥"},{"w":"rabbit","c":"c","ad":"the","cat":"animal","lv":1,"ja":"うさぎ"},{"w":"horse","c":"c","ad":"the","cat":"animal","lv":1,"ja":"馬"},{"w":"robot","c":"c","ad":"the","cat":"person","lv":3,"ja":"ロボット"},{"w":"lion","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ライオン"},{"w":"tiger","c":"c","ad":"the","cat":"animal","lv":1,"ja":"トラ"},{"w":"elephant","c":"c","ad":"the","cat":"animal","lv":2,"ja":"ゾウ"},{"w":"giraffe","c":"c","ad":"the","cat":"animal","lv":3,"ja":"キリン"},{"w":"monkey","c":"c","ad":"the","cat":"animal","lv":1,"ja":"サル"},{"w":"panda","c":"c","ad":"the","cat":"animal","lv":4,"ja":"パンダ"},{"w":"bear","c":"c","ad":"the","cat":"animal","lv":1,"ja":"クマ"},{"w":"penguin","c":"c","ad":"the","cat":"animal","lv":4,"ja":"ペンギン"},{"w":"koala","c":"c","ad":"the","cat":"animal","lv":4,"ja":"コアラ"},{"w":"kangaroo","c":"c","ad":"the","cat":"animal","lv":4,"ja":"カンガルー"},{"w":"zebra","c":"c","ad":"the","cat":"animal","lv":4,"ja":"シマウマ"},{"w":"cow","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ウシ"},{"w":"pig","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ブタ"},{"w":"sheep","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ヒツジ"},{"w":"goat","c":"c","ad":"the","cat":"animal","lv":4,"ja":"ヤギ"},{"w":"duck","c":"c","ad":"the","cat":"animal","lv":2,"ja":"アヒル"},{"w":"mouse","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ネズミ"},{"w":"hamster","c":"c","ad":"the","cat":"animal","lv":4,"ja":"ハムスター"},{"w":"turtle","c":"c","ad":"the","cat":"animal","lv":3,"ja":"カメ"},{"w":"snake","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ヘビ"},{"w":"owl","c":"c","ad":"the","cat":"animal","lv":4,"ja":"フクロウ"},{"w":"crow","c":"c","ad":"the","cat":"animal","lv":3,"ja":"カラス"},{"w":"dolphin","c":"c","ad":"the","cat":"animal","lv":3,"ja":"イルカ"},{"w":"whale","c":"c","ad":"the","cat":"animal","lv":3,"ja":"クジラ"},{"w":"shark","c":"c","ad":"the","cat":"animal","lv":4,"ja":"サメ"},{"w":"octopus","c":"c","ad":"the","cat":"animal","lv":4,"ja":"タコ"},{"w":"crab","c":"c","ad":"the","cat":"animal","lv":4,"ja":"カニ"},{"w":"bee","c":"c","ad":"the","cat":"animal","lv":1,"ja":"ハチ"},{"w":"ant","c":"c","ad":"the","cat":"animal","lv":3,"ja":"アリ"},{"w":"dragon","c":"c","ad":"the","cat":"animal","lv":4,"ja":"ドラゴン"},{"w":"dinosaur","c":"c","ad":"the","cat":"animal","lv":2,"ja":"恐竜"},{"w":"ghost","c":"c","ad":"the","cat":"animal","lv":1,"ja":"おばけ"},{"w":"alien","c":"c","ad":"the","cat":"animal","lv":4,"ja":"宇宙人"},{"w":"monster","c":"c","ad":"the","cat":"animal","lv":3,"ja":"怪物"},{"w":"puppy","c":"c","ad":"the","cat":"animal","lv":3,"ja":"子犬"},{"w":"kitten","c":"c","ad":"the","cat":"animal","lv":3,"ja":"子ねこ"},{"w":"parrot","c":"c","ad":"the","cat":"animal","lv":3,"ja":"オウム"},{"w":"squirrel","c":"c","ad":"the","cat":"animal","lv":4,"ja":"リス"},{"w":"mother","c":"c","ad":"the","cat":"person","lv":1,"ja":"母"},{"w":"father","c":"c","ad":"the","cat":"person","lv":1,"ja":"父"},{"w":"brother","c":"c","ad":"the","cat":"person","lv":1,"ja":"兄弟"},{"w":"sister","c":"c","ad":"the","cat":"person","lv":1,"ja":"姉妹"},{"w":"grandpa","c":"c","ad":"the","cat":"person","lv":1,"ja":"おじいちゃん"},{"w":"uncle","c":"c","ad":"the","cat":"person","lv":1,"ja":"おじ"},{"w":"aunt","c":"c","ad":"the","cat":"person","lv":1,"ja":"おば"},{"w":"cousin","c":"c","ad":"the","cat":"person","lv":1,"ja":"いとこ"},{"w":"doctor","c":"c","ad":"the","cat":"person","lv":1,"ja":"医者"},{"w":"nurse","c":"c","ad":"the","cat":"person","lv":1,"ja":"看護師"},{"w":"cook","c":"c","ad":"the","cat":"person","lv":1,"ja":"料理人"},{"w":"driver","c":"c","ad":"the","cat":"person","lv":1,"ja":"運転手"},{"w":"firefighter","c":"c","ad":"the","cat":"person","lv":3,"ja":"消防士"},{"w":"farmer","c":"c","ad":"the","cat":"person","lv":1,"ja":"農家の人"},{"w":"shopkeeper","c":"c","ad":"the","cat":"person","lv":4,"ja":"店員"},{"w":"clerk","c":"c","ad":"the","cat":"person","lv":2,"ja":"店員"},{"w":"waiter","c":"c","ad":"the","cat":"person","lv":1,"ja":"ウェイター"},{"w":"king","c":"c","ad":"the","cat":"person","lv":1,"ja":"王様"},{"w":"queen","c":"c","ad":"the","cat":"person","lv":2,"ja":"女王"},{"w":"prince","c":"c","ad":"the","cat":"person","lv":1,"ja":"王子"},{"w":"princess","c":"c","ad":"the","cat":"person","lv":1,"ja":"王女"},{"w":"neighbor","c":"c","ad":"the","cat":"person","lv":1,"ja":"近所の人"},{"w":"guest","c":"c","ad":"the","cat":"person","lv":1,"ja":"お客さん"},{"w":"captain","c":"c","ad":"the","cat":"person","lv":2,"ja":"キャプテン"},{"w":"coach","c":"c","ad":"the","cat":"person","lv":1,"ja":"コーチ"},{"w":"classmate","c":"c","ad":"the","cat":"person","lv":1,"ja":"クラスメート"},{"w":"team","c":"c","ad":"the","cat":"person","lv":1,"ja":"チーム"},{"w":"family","c":"c","ad":"the","cat":"person","lv":1,"ja":"家族"},{"w":"man","c":"c","ad":"the","cat":"person","lv":1,"ja":"男の人"},{"w":"woman","c":"c","ad":"the","cat":"person","lv":1,"ja":"女の人"},{"w":"child","c":"c","ad":"the","cat":"person","lv":1,"ja":"子ども"},{"w":"children","c":"p","ad":"the","cat":"person","lv":4,"ja":"子どもたち"},{"w":"kid","c":"c","ad":"the","cat":"person","lv":1,"ja":"子"},{"w":"old man","c":"c","ad":"the","cat":"person","lv":1,"ja":"おじいさん"},{"w":"old woman","c":"c","ad":"the","cat":"person","lv":1,"ja":"おばあさん"},{"w":"singer","c":"c","ad":"the","cat":"person","lv":1,"ja":"歌手"},{"w":"artist","c":"c","ad":"the","cat":"person","lv":3,"ja":"画家"},{"w":"scientist","c":"c","ad":"the","cat":"person","lv":1,"ja":"科学者"},{"w":"astronaut","c":"c","ad":"the","cat":"person","lv":2,"ja":"宇宙飛行士"},{"w":"daughter","c":"c","ad":"my","cat":"person","lv":1,"ja":"娘"},{"w":"son","c":"c","ad":"my","cat":"person","lv":1,"ja":"息子"},{"w":"husband","c":"c","ad":"my","cat":"person","lv":1,"ja":"夫"},{"w":"wife","c":"c","ad":"my","cat":"person","lv":1,"ja":"妻"},{"w":"grandfather","c":"c","ad":"my","cat":"person","lv":1,"ja":"祖父"},{"w":"grandmother","c":"c","ad":"my","cat":"person","lv":1,"ja":"祖母"},{"w":"parent","c":"c","ad":"my","cat":"person","lv":1,"ja":"両親"},{"w":"boyfriend","c":"c","ad":"my","cat":"person","lv":1,"ja":"彼氏"},{"w":"girlfriend","c":"c","ad":"my","cat":"person","lv":1,"ja":"彼女"},{"w":"actor","c":"c","ad":"the","cat":"person","lv":1,"ja":"俳優"},{"w":"engineer","c":"c","ad":"the","cat":"person","lv":1,"ja":"エンジニア"},{"w":"leader","c":"c","ad":"the","cat":"person","lv":1,"ja":"リーダー"},{"w":"musician","c":"c","ad":"the","cat":"person","lv":1,"ja":"音楽家"},{"w":"player","c":"c","ad":"the","cat":"person","lv":1,"ja":"選手"},{"w":"reporter","c":"c","ad":"the","cat":"person","lv":1,"ja":"記者"},{"w":"sailor","c":"c","ad":"the","cat":"person","lv":1,"ja":"船乗り"},{"w":"waitress","c":"c","ad":"the","cat":"person","lv":1,"ja":"ウェイトレス"},{"w":"worker","c":"c","ad":"the","cat":"person","lv":1,"ja":"働く人"},{"w":"writer","c":"c","ad":"the","cat":"person","lv":1,"ja":"作家"},{"w":"owner","c":"c","ad":"the","cat":"person","lv":1,"ja":"持ち主"},{"w":"partner","c":"c","ad":"my","cat":"person","lv":1,"ja":"パートナー"},{"w":"person","c":"c","ad":"the","cat":"person","lv":1,"ja":"その人"},{"w":"lady","c":"c","ad":"the","cat":"person","lv":1,"ja":"女性"},{"w":"guy","c":"c","ad":"the","cat":"person","lv":1,"ja":"男の人"},{"w":"people","c":"p","ad":"","cat":"person","lv":1,"ja":"人々"},{"w":"pet","c":"c","ad":"my","cat":"animal","lv":1,"ja":"ペット"},{"w":"spy","c":"c","ad":"the","cat":"person","lv":1,"ja":"スパイ"},{"w":"adult","c":"c","ad":"the","cat":"person","lv":2,"ja":"大人"},{"w":"athlete","c":"c","ad":"the","cat":"person","lv":2,"ja":"運動選手"},{"w":"barber","c":"c","ad":"the","cat":"person","lv":2,"ja":"床屋さん"},{"w":"beginner","c":"c","ad":"the","cat":"person","lv":2,"ja":"初心者"},{"w":"boss","c":"c","ad":"my","cat":"person","lv":2,"ja":"上司"},{"w":"bride","c":"c","ad":"the","cat":"person","lv":2,"ja":"花嫁"},{"w":"chef","c":"c","ad":"the","cat":"person","lv":2,"ja":"シェフ"},{"w":"clown","c":"c","ad":"the","cat":"person","lv":2,"ja":"ピエロ"},{"w":"customer","c":"c","ad":"the","cat":"person","lv":2,"ja":"お客さん"},{"w":"dentist","c":"c","ad":"the","cat":"person","lv":2,"ja":"歯医者さん"},{"w":"director","c":"c","ad":"the","cat":"person","lv":2,"ja":"監督"},{"w":"expert","c":"c","ad":"the","cat":"person","lv":2,"ja":"専門家"},{"w":"fisherman","c":"c","ad":"the","cat":"person","lv":2,"ja":"漁師"},{"w":"guard","c":"c","ad":"the","cat":"person","lv":2,"ja":"警備員"},{"w":"host","c":"c","ad":"the","cat":"person","lv":2,"ja":"司会者"},{"w":"hunter","c":"c","ad":"the","cat":"person","lv":2,"ja":"狩人"},{"w":"lawyer","c":"c","ad":"the","cat":"person","lv":2,"ja":"弁護士"},{"w":"manager","c":"c","ad":"the","cat":"person","lv":2,"ja":"店長"},{"w":"member","c":"c","ad":"the","cat":"person","lv":2,"ja":"メンバー"},{"w":"painter","c":"c","ad":"the","cat":"person","lv":2,"ja":"画家"},{"w":"passenger","c":"c","ad":"the","cat":"person","lv":2,"ja":"乗客"},{"w":"patient","c":"c","ad":"the","cat":"person","lv":2,"ja":"患者"},{"w":"photographer","c":"c","ad":"the","cat":"person","lv":2,"ja":"写真家"},{"w":"receptionist","c":"c","ad":"the","cat":"person","lv":2,"ja":"受付の人"},{"w":"runner","c":"c","ad":"the","cat":"person","lv":2,"ja":"ランナー"},{"w":"soldier","c":"c","ad":"the","cat":"person","lv":2,"ja":"兵士"},{"w":"stranger","c":"c","ad":"the","cat":"person","lv":2,"ja":"知らない人"},{"w":"teenager","c":"c","ad":"the","cat":"person","lv":2,"ja":"10代の子"},{"w":"thief","c":"c","ad":"the","cat":"person","lv":2,"ja":"どろぼう"},{"w":"tourist","c":"c","ad":"the","cat":"person","lv":2,"ja":"観光客"},{"w":"traveler","c":"c","ad":"the","cat":"person","lv":2,"ja":"旅行者"},{"w":"visitor","c":"c","ad":"the","cat":"person","lv":2,"ja":"訪問者"},{"w":"winner","c":"c","ad":"the","cat":"person","lv":2,"ja":"勝者"},{"w":"grandchild","c":"c","ad":"my","cat":"person","lv":2,"ja":"孫"},{"w":"couple","c":"p","ad":"the","cat":"person","lv":2,"ja":"カップル"},{"w":"crowd","c":"c","ad":"the","cat":"person","lv":2,"ja":"人ごみ"},{"w":"insect","c":"c","ad":"the","cat":"animal","lv":2,"ja":"虫"},{"w":"chimpanzee","c":"c","ad":"the","cat":"animal","lv":2,"ja":"チンパンジー"},{"w":"park","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"公園"},{"w":"station","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"駅"},{"w":"library","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"図書館"},{"w":"beach","c":"c","ad":"the","cat":"place","prep":"on","lv":1,"ja":"海辺"},{"w":"forest","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"森"},{"w":"zoo","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"動物園"},{"w":"cafe","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"カフェ"},{"w":"Tokyo","c":"n","ad":"","cat":"place","prep":"in","lv":2,"ja":"東京"},{"w":"store","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"店"},{"w":"supermarket","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"スーパー"},{"w":"hospital","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"病院"},{"w":"airport","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"空港"},{"w":"restaurant","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"レストラン"},{"w":"office","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"会社"},{"w":"gym","c":"c","ad":"the","cat":"place","prep":"in","lv":3,"ja":"体育館"},{"w":"bus stop","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"バス停"},{"w":"museum","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"博物館"},{"w":"aquarium","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"水族館"},{"w":"post office","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"郵便局"},{"w":"bank","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"銀行"},{"w":"hotel","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"ホテル"},{"w":"mall","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"ショッピングモール"},{"w":"pool","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"プール"},{"w":"sea","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"海"},{"w":"mountains","c":"p","ad":"the","cat":"place","prep":"in","lv":1,"ja":"山"},{"w":"city","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"街"},{"w":"country","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"いなか"},{"w":"Japan","c":"n","ad":"","cat":"place","prep":"in","lv":4,"ja":"日本"},{"w":"America","c":"n","ad":"","cat":"place","prep":"in","lv":4,"ja":"アメリカ"},{"w":"living room","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"リビング"},{"w":"roof","c":"c","ad":"the","cat":"place","prep":"on","lv":2,"ja":"屋根の上"},{"w":"stadium","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"競技場"},{"w":"temple","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"お寺"},{"w":"shrine","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"神社"},{"w":"cinema","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"映画館"},{"w":"farm","c":"c","ad":"the","cat":"place","prep":"on","lv":1,"ja":"農場"},{"w":"field","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"野原"},{"w":"hill","c":"c","ad":"the","cat":"place","prep":"on","lv":1,"ja":"丘の上"},{"w":"island","c":"c","ad":"the","cat":"place","prep":"on","lv":1,"ja":"島"},{"w":"shop","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"店"},{"w":"theater","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"劇場"},{"w":"bedroom","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"寝室"},{"w":"dining room","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"食堂"},{"w":"bookstore","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"本屋"},{"w":"factory","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"工場"},{"w":"hall","c":"c","ad":"the","cat":"place","prep":"in","lv":1,"ja":"ホール"},{"w":"palace","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"宮殿"},{"w":"hometown","c":"c","ad":"my","cat":"place","prep":"in","lv":1,"ja":"地元"},{"w":"swimming pool","c":"c","ad":"the","cat":"place","prep":"at","lv":1,"ja":"プール"},{"w":"apartment","c":"c","ad":"my","cat":"place","prep":"in","lv":2,"ja":"アパート"},{"w":"balcony","c":"c","ad":"the","cat":"place","prep":"on","lv":2,"ja":"ベランダ"},{"w":"cafeteria","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"食堂"},{"w":"castle","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"城"},{"w":"coast","c":"c","ad":"the","cat":"place","prep":"on","lv":2,"ja":"海岸"},{"w":"countryside","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"いなか"},{"w":"desert","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"砂漠"},{"w":"drugstore","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"ドラッグストア"},{"w":"gallery","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"美術館"},{"w":"garage","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"ガレージ"},{"w":"lake","c":"c","ad":"the","cat":"place","prep":"by","lv":2,"ja":"湖のそば"},{"w":"market","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"市場"},{"w":"playground","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"遊び場"},{"w":"university","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"大学"},{"w":"valley","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"谷"},{"w":"village","c":"c","ad":"the","cat":"place","prep":"in","lv":2,"ja":"村"},{"w":"department store","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"デパート"},{"w":"grocery store","c":"c","ad":"the","cat":"place","prep":"at","lv":2,"ja":"食料品店"},{"w":"morning","c":"t","ad":"the","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"朝"},{"w":"night","c":"n","ad":"","cat":"time","prep":"at","ts":["pres","past","fut"],"lv":1,"ja":"夜"},{"w":"afternoon","c":"t","ad":"the","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"午後"},{"w":"evening","c":"t","ad":"the","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"夕方"},{"w":"noon","c":"n","ad":"","cat":"time","prep":"at","ts":["pres","past","fut"],"lv":2,"ja":"正午"},{"w":"midnight","c":"n","ad":"","cat":"time","prep":"at","ts":["pres","past","fut"],"lv":2,"ja":"真夜中"},{"w":"Monday","c":"n","ad":"","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"月曜日"},{"w":"Tuesday","c":"n","ad":"","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"火曜日"},{"w":"Wednesday","c":"n","ad":"","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"水曜日"},{"w":"Thursday","c":"n","ad":"","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"木曜日"},{"w":"Friday","c":"n","ad":"","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"金曜日"},{"w":"Saturday","c":"n","ad":"","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"土曜日"},{"w":"Sunday","c":"n","ad":"","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"日曜日"},{"w":"January","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"1月"},{"w":"February","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"2月"},{"w":"March","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"3月"},{"w":"April","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"4月"},{"w":"May","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"5月"},{"w":"June","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"6月"},{"w":"July","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"7月"},{"w":"August","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"8月"},{"w":"September","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"9月"},{"w":"October","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"10月"},{"w":"November","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"11月"},{"w":"December","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"12月"},{"w":"spring","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"春"},{"w":"summer","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"夏"},{"w":"autumn","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"秋"},{"w":"winter","c":"n","ad":"","cat":"time","prep":"in","ts":["pres","past","fut"],"lv":1,"ja":"冬"},{"w":"weekend","c":"t","ad":"the","cat":"time","prep":"on","ts":["pres","past","fut","prog"],"lv":1,"ja":"週末"},{"w":"lunchtime","c":"n","ad":"","cat":"time","prep":"at","ts":["pres","past","fut"],"lv":2,"ja":"昼休み"}],"verb":[{"w":"run","b":"run","past":"ran","pp":"run","s3":"","dbl":1,"fr":"intr","lv":1,"ja":"走る"},{"w":"walk","b":"walk","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"歩く"},{"w":"sleep","b":"sleep","past":"slept","pp":"slept","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"寝る"},{"w":"swim","b":"swim","past":"swam","pp":"swum","s3":"","dbl":1,"fr":"intr","lv":1,"ja":"泳ぐ"},{"w":"dance","b":"dance","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"踊る"},{"w":"laugh","b":"laugh","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"笑う"},{"w":"cry","b":"cry","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"泣く"},{"w":"jump","b":"jump","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"ジャンプする"},{"w":"sit down","b":"sit","past":"sat","pp":"sat","s3":"","dbl":1,"fr":"intr","lv":1,"ja":"座る","tail":"down"},{"w":"stand up","b":"stand","past":"stood","pp":"stood","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"立つ","tail":"up"},{"w":"wake up","b":"wake","past":"woke","pp":"woken","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"起きる","tail":"up"},{"w":"smile","b":"smile","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ほほえむ"},{"w":"rest","b":"rest","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"休む"},{"w":"work","b":"work","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"働く"},{"w":"fly","b":"fly","past":"flew","pp":"flown","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"飛ぶ"},{"w":"go","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":1,"ja":"行く"},{"w":"come","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"来る"},{"w":"talk","b":"talk","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"話す"},{"w":"shout","b":"shout","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"叫ぶ"},{"w":"fall down","b":"fall","past":"fell","pp":"fallen","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"転ぶ","tail":"down"},{"w":"hide","b":"hide","past":"hid","pp":"hidden","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"隠れる"},{"w":"arrive","b":"arrive","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"着く"},{"w":"grow up","b":"grow","past":"grew","pp":"grown","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"大きくなる","tail":"up"},{"w":"win","b":"win","past":"won","pp":"won","s3":"","dbl":1,"fr":"intr","lv":1,"ja":"勝つ"},{"w":"relax","b":"relax","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"のんびりする"},{"w":"hurry","b":"hurry","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"急ぐ"},{"w":"travel","b":"travel","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"旅行する"},{"w":"shop","b":"shop","past":"","pp":"","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"買い物する"},{"w":"climb","b":"climb","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"登る","ot":["climb"]},{"w":"practice","b":"practice","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"練習する","ot":["sport","instr"],"cv":"ing"},{"w":"hang out","b":"hang","past":"hung","pp":"hung","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"つるむ","tail":"out"},{"w":"chill","b":"chill","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"まったりする"},{"w":"eat","b":"eat","past":"ate","pp":"eaten","s3":"","dbl":0,"fr":"both","lv":1,"ja":"食べる","ot":["food"]},{"w":"drink","b":"drink","past":"drank","pp":"drunk","s3":"","dbl":0,"fr":"both","lv":1,"ja":"飲む","ot":["drink"]},{"w":"read","b":"read","past":"read","pp":"read","s3":"","dbl":0,"fr":"both","lv":1,"ja":"読む","ot":["read"]},{"w":"write","b":"write","past":"wrote","pp":"written","s3":"","dbl":0,"fr":"both","lv":1,"ja":"書く","ot":["write"],"dt":1},{"w":"sing","b":"sing","past":"sang","pp":"sung","s3":"","dbl":0,"fr":"both","lv":1,"ja":"歌う","ot":["song"],"dt":1},{"w":"draw","b":"draw","past":"drew","pp":"drawn","s3":"","dbl":0,"fr":"both","lv":1,"ja":"描く","ot":["draw"]},{"w":"cook","b":"cook","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"料理する","ot":["food"],"dt":1},{"w":"study","b":"study","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"勉強する","ot":["lang"]},{"w":"play","b":"play","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"遊ぶ","ot":["sport","instr","game"]},{"w":"clean","b":"clean","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"そうじする","ot":["clean"]},{"w":"listen to","b":"listen","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"聞く","tail":"to","ot":["music","person","animal"]},{"w":"look at","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"見る","tail":"at","ot":["any"]},{"w":"wait for","b":"wait","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"待つ","tail":"for","ot":["person"]},{"w":"like","b":"like","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"好き","ot":["any"],"cv":"both"},{"w":"love","b":"love","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"大好き","ot":["any"],"cv":"both"},{"w":"have","b":"have","past":"had","pp":"had","s3":"has","dbl":0,"fr":"tr","lv":1,"ja":"持つ","ot":["thing","food"]},{"w":"need","b":"need","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"必要","ot":["thing","food","drink","person"],"cv":"to"},{"w":"buy","b":"buy","past":"bought","pp":"bought","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"買う","ot":["food","drink","thing","read"],"dt":1},{"w":"make","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"作る","ot":["make"],"dt":1},{"w":"watch","b":"watch","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"見る","ot":["watch","person","animal"]},{"w":"see","b":"see","past":"saw","pp":"seen","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"見る","ot":["any"]},{"w":"open","b":"open","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"開ける","ot":["door"]},{"w":"close","b":"close","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"閉める","ot":["door"]},{"w":"wash","b":"wash","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"洗う","ot":["wash"]},{"w":"use","b":"use","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"使う","ot":["thing"]},{"w":"find","b":"find","past":"found","pp":"found","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"見つける","ot":["thing","person"]},{"w":"lose","b":"lose","past":"lost","pp":"lost","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"なくす","ot":["thing"]},{"w":"carry","b":"carry","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"運ぶ","ot":["thing"]},{"w":"take","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"撮る","ot":["photo"]},{"w":"throw","b":"throw","past":"threw","pp":"thrown","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"投げる","ot":["ball"]},{"w":"catch","b":"catch","past":"caught","pp":"caught","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"つかまえる","ot":["ball","animal"]},{"w":"ride","b":"ride","past":"rode","pp":"ridden","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"乗る","ot":["ride"]},{"w":"help","b":"help","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"手伝う","ot":["person"]},{"w":"call","b":"call","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"電話する","ot":["person"]},{"w":"meet","b":"meet","past":"met","pp":"met","s3":"","dbl":0,"fr":"both","lv":1,"ja":"会う","ot":["person"]},{"w":"hug","b":"hug","past":"","pp":"","s3":"","dbl":1,"fr":"tr","lv":2,"ja":"だきしめる","ot":["person","animal"]},{"w":"chase","b":"chase","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"追いかける","ot":["person","animal","ball"]},{"w":"teach","b":"teach","past":"taught","pp":"taught","s3":"","dbl":0,"fr":"both","lv":1,"ja":"教える","ot":["lang","sport"],"dt":1},{"w":"visit","b":"visit","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"たずねる","ot":["person"]},{"w":"do","b":"do","past":"did","pp":"done","s3":"does","dbl":0,"fr":"tr","lv":1,"ja":"やる","ot":["homework"]},{"w":"bring","b":"bring","past":"brought","pp":"brought","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"持ってくる","ot":["thing","food","drink"],"dt":1},{"w":"send","b":"send","past":"sent","pp":"sent","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"送る","ot":["write","photo"],"dt":1},{"w":"fix","b":"fix","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"直す","ot":["ride","thing","car"]},{"w":"drive","b":"drive","past":"drove","pp":"driven","s3":"","dbl":0,"fr":"both","lv":2,"ja":"運転する","ot":["car"]},{"w":"forget","b":"forget","past":"forgot","pp":"forgotten","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"忘れる","ot":["thing","homework"],"cv":"to"},{"w":"remember","b":"remember","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"覚えている","ot":["any"],"cv":"ing"},{"w":"enjoy","b":"enjoy","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"楽しむ","ot":["sport","game","music","watch","food"],"cv":"ing"},{"w":"answer","b":"answer","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"答える","ot":["person"]},{"w":"ask","b":"ask","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"たずねる","ot":["person"]},{"w":"invite","b":"invite","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"招待する","ot":["person"]},{"w":"cut","b":"cut","past":"cut","pp":"cut","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"切る","ot":["food","cut"]},{"w":"feed","b":"feed","past":"fed","pp":"fed","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"えさをあげる","ot":["animal"]},{"w":"wear","b":"wear","past":"wore","pp":"worn","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"着る","ot":["wear"]},{"w":"plant","b":"plant","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"植える","ot":["plant"]},{"w":"paint","b":"paint","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"ぬる","ot":["draw","door","car"]},{"w":"build","b":"build","past":"built","pp":"built","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"作る","ot":["build"]},{"w":"sell","b":"sell","past":"sold","pp":"sold","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"売る","ot":["thing","food"]},{"w":"borrow","b":"borrow","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"借りる","ot":["thing","read"]},{"w":"push","b":"push","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"押す","ot":["door","thing","person"]},{"w":"pull","b":"pull","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"引く","ot":["door","thing"]},{"w":"protect","b":"protect","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"守る","ot":["person","animal"]},{"w":"follow","b":"follow","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"ついていく","ot":["person","animal"]},{"w":"check","b":"check","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"確認する","ot":["thing","homework","write"]},{"w":"give","b":"give","past":"gave","pp":"given","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"あげる","ot":["thing","food","drink","read","present"],"dt":1},{"w":"show","b":"show","past":"showed","pp":"shown","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"見せる","ot":["thing","read","photo","draw"],"dt":1},{"w":"tell","b":"tell","past":"told","pp":"told","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"話す","ot":["tell"],"dt":1},{"w":"lend","b":"lend","past":"lent","pp":"lent","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"貸す","ot":["thing","read","ride"],"dt":1},{"w":"pass","b":"pass","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"渡す","ot":["thing","food","drink","read"],"dt":1},{"w":"grab","b":"grab","past":"","pp":"","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"さっと食べる","ot":["food","drink"]},{"w":"text","b":"text","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"メッセージを送る","ot":["person"]},{"w":"want","b":"want","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"ほしい","ot":["any"],"cv":"to"},{"w":"get","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"手に入れる","ot":["thing","food","drink","present"],"link":1},{"w":"put","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"置く","ot":["thing"]},{"w":"turn","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"曲がる","link":1},{"w":"pick","b":"pick","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"摘む","ot":["plant"]},{"w":"break","b":"break","past":"broke","pp":"broken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"こわす","ot":["thing","toy","device"]},{"w":"hang","b":"hang","past":"hung","pp":"hung","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"掛ける","ot":["wear","draw"]},{"w":"return","b":"return","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"戻る","ot":["thing","read"]},{"w":"continue","b":"continue","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"続ける","ot":["sport","instr","lang","homework"],"cv":"both"},{"w":"discover","b":"discover","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"発見する","ot":["thing","tell"]},{"w":"quit","b":"quit","past":"quit","pp":"quit","s3":"","dbl":1,"fr":"both","lv":2,"ja":"やめる","ot":["sport","instr","game","lang"],"cv":"ing"},{"w":"postpone","b":"postpone","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"延期する","ot":["event"]},{"w":"recover","b":"recover","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"回復する"},{"w":"leave","b":"leave","past":"left","pp":"left","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"出発する"},{"w":"enter","b":"enter","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"入る"},{"w":"escape","b":"escape","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"逃げる"},{"w":"choose","b":"choose","past":"chose","pp":"chosen","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"選ぶ","ot":["thing","wear","read"]},{"w":"start","b":"start","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"始める","ot":["sport","instr","lang","homework"],"cv":"both"},{"w":"refuse","b":"refuse","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"断る","ot":["offer"],"cv":"to"},{"w":"appear","b":"appear","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"現れる"},{"w":"exercise","b":"exercise","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"運動する"},{"w":"get off","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"降りる","tail":"off","ot":["ride"]},{"w":"get over","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"乗りこえる","tail":"over","ot":["over"]},{"w":"get along with","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"仲良くする","tail":"along with","ot":["person"]},{"w":"get back","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":1,"ja":"戻る","tail":"back"},{"w":"get out","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":1,"ja":"出る","tail":"out"},{"w":"go on","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":1,"ja":"続く","tail":"on"},{"w":"go out","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":1,"ja":"出かける","tail":"out"},{"w":"go back","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":1,"ja":"戻る","tail":"back"},{"w":"go away","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":1,"ja":"立ち去る","tail":"away"},{"w":"go through","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"tr","lv":1,"ja":"経験する","tail":"through","ot":["over"]},{"w":"come back","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"戻ってくる","tail":"back"},{"w":"come in","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"入ってくる","tail":"in"},{"w":"come out","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"出てくる","tail":"out"},{"w":"come over","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"遊びに来る","tail":"over"},{"w":"come across","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"偶然見つける","tail":"across","ot":["thing","read","person"]},{"w":"come along","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"ついてくる","tail":"along"},{"w":"take out","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"取り出す","tail":"out","ot":["thing","food"]},{"w":"take away","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"持ち去る","tail":"away","ot":["thing","toy"]},{"w":"take back","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"返品する","tail":"back","ot":["thing","wear"]},{"w":"take up","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"始める","tail":"up","ot":["sport","instr","lang"]},{"w":"take care of","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"世話をする","tail":"care of","ot":["person","animal"]},{"w":"take a break","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"休憩する","tail":"a break"},{"w":"take a walk","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"散歩する","tail":"a walk"},{"w":"take a shower","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"シャワーを浴びる","tail":"a shower"},{"w":"put on","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"着る","tail":"on","ot":["wear"]},{"w":"put off","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"延期する","tail":"off","ot":["event"]},{"w":"put away","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"片付ける","tail":"away","ot":["thing","toy"]},{"w":"put down","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"下に置く","tail":"down","ot":["thing"]},{"w":"put out","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"消す","tail":"out","ot":["fire"]},{"w":"put up with","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"がまんする","tail":"up with","ot":["bear","person"]},{"w":"look up","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"調べる","tail":"up","ot":["word"]},{"w":"look after","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"世話をする","tail":"after","ot":["person","animal"]},{"w":"look out","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"気をつける","tail":"out"},{"w":"lie down","b":"lie","past":"lay","pp":"lain","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"横になる","tail":"down"},{"w":"hurry up","b":"hurry","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"急ぐ","tail":"up"},{"w":"slow down","b":"slow","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"ペースを落とす","tail":"down"},{"w":"calm down","b":"calm","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"落ち着く","tail":"down"},{"w":"cheer up","b":"cheer","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"元気を出す","tail":"up"},{"w":"speak up","b":"speak","past":"spoke","pp":"spoken","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"大きな声で話す","tail":"up"},{"w":"hold on","b":"hold","past":"held","pp":"held","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"ちょっと待つ","tail":"on"},{"w":"watch out","b":"watch","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"気をつける","tail":"out"},{"w":"walk in","b":"walk","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"歩いて入る","tail":"in"},{"w":"walk out","b":"walk","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"歩いて出る","tail":"out"},{"w":"walk away","b":"walk","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"立ち去る","tail":"away"},{"w":"walk around","b":"walk","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"歩き回る","tail":"around"},{"w":"sign up","b":"sign","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"申し込む","tail":"up"},{"w":"clean up","b":"clean","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"片づける","tail":"up"},{"w":"write down","b":"write","past":"wrote","pp":"written","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"書き留める","tail":"down"},{"w":"throw away","b":"throw","past":"threw","pp":"thrown","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"捨てる","tail":"away"},{"w":"fill out","b":"fill","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"記入する","tail":"out"},{"w":"check out","b":"check","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"チェックする","tail":"out"},{"w":"call back","b":"call","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"折り返し電話する","tail":"back"},{"w":"look around","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"見回す","tail":"around"},{"w":"look into","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"調べる","tail":"into","ot":["event","thing"]},{"w":"look forward to","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"楽しみにする","tail":"forward to","ot":["event","thing","person"]},{"w":"turn on","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"つける","tail":"on","ot":["device"]},{"w":"turn off","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"消す","tail":"off","ot":["device"]},{"w":"turn up","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"大きくする","tail":"up","ot":["device"]},{"w":"turn down","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"断る","tail":"down","ot":["offer","device"]},{"w":"turn around","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"振り向く","tail":"around"},{"w":"turn into","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"変わる","tail":"into","ot":["change"]},{"w":"give up","b":"give","past":"gave","pp":"given","s3":"","dbl":0,"fr":"both","lv":1,"ja":"あきらめる","tail":"up","ot":["sport","instr","game","lang"]},{"w":"give back","b":"give","past":"gave","pp":"given","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"返す","tail":"back","ot":["thing","read"]},{"w":"give away","b":"give","past":"gave","pp":"given","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"あげてしまう","tail":"away","ot":["thing","toy"]},{"w":"give in","b":"give","past":"gave","pp":"given","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"降参する","tail":"in"},{"w":"run away","b":"run","past":"ran","pp":"run","s3":"","dbl":1,"fr":"intr","lv":1,"ja":"逃げる","tail":"away"},{"w":"run out of","b":"run","past":"ran","pp":"run","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"切らす","tail":"out of","ot":["food","drink","thing"]},{"w":"run into","b":"run","past":"ran","pp":"run","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"ばったり会う","tail":"into","ot":["person"]},{"w":"run after","b":"run","past":"ran","pp":"run","s3":"","dbl":1,"fr":"tr","lv":1,"ja":"追いかける","tail":"after","ot":["person","animal","ball"]},{"w":"pick up","b":"pick","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"拾う","tail":"up","ot":["thing","person","toy"]},{"w":"pick out","b":"pick","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"選ぶ","tail":"out","ot":["thing","wear","read"]},{"w":"bring back","b":"bring","past":"brought","pp":"brought","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"持って帰る","tail":"back","ot":["thing","food"]},{"w":"break down","b":"break","past":"broke","pp":"broken","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"故障する","tail":"down"},{"w":"break up","b":"break","past":"broke","pp":"broken","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"別れる","tail":"up"},{"w":"find out","b":"find","past":"found","pp":"found","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"つきとめる","tail":"out","ot":["tell","thing"]},{"w":"work out","b":"work","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"運動する","tail":"out"},{"w":"hang on","b":"hang","past":"hung","pp":"hung","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ちょっと待つ","tail":"on"},{"w":"hang up","b":"hang","past":"hung","pp":"hung","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"電話を切る","tail":"up"},{"w":"show up","b":"show","past":"showed","pp":"shown","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"現れる","tail":"up"},{"w":"have fun","b":"have","past":"had","pp":"had","s3":"has","dbl":0,"fr":"intr","lv":1,"ja":"楽しむ","tail":"fun"},{"w":"have lunch","b":"have","past":"had","pp":"had","s3":"has","dbl":0,"fr":"intr","lv":1,"ja":"昼ごはんを食べる","tail":"lunch"},{"w":"make a mistake","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"まちがえる","tail":"a mistake"},{"w":"make friends","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"友だちになる","tail":"friends"},{"w":"catch a cold","b":"catch","past":"caught","pp":"caught","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"風邪をひく","tail":"a cold"},{"w":"back up","b":"back","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"バックアップする","tail":"up","ot":["thing","device"]},{"w":"bring up","b":"bring","past":"brought","pp":"brought","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"話題に出す","tail":"up","ot":["abstract","event"]},{"w":"call off","b":"call","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"中止する","tail":"off","ot":["event"]},{"w":"catch up","b":"catch","past":"caught","pp":"caught","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"追いつく","tail":"up"},{"w":"catch up with","b":"catch","past":"caught","pp":"caught","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"追いつく","tail":"up with","ot":["person"]},{"w":"come on","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"急ぐ","tail":"on"},{"w":"come up with","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"思いつく","tail":"up with","ot":["abstract","offer"]},{"w":"deal with","b":"deal","past":"dealt","pp":"dealt","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"対処する","tail":"with","ot":["abstract","person","event"]},{"w":"drop off","b":"drop","past":"","pp":"","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"送り届ける","tail":"off","ot":["person","thing"]},{"w":"eat out","b":"eat","past":"ate","pp":"eaten","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"外食する","tail":"out"},{"w":"end up","b":"end","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"結局そうなる","tail":"up"},{"w":"feel like","b":"feel","past":"felt","pp":"felt","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"気分","tail":"like","ot":["food","drink","abstract"]},{"w":"figure out","b":"figure","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"理解する","tail":"out","ot":["abstract","word"]},{"w":"fill in","b":"fill","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"書きこむ","tail":"in","ot":["write"]},{"w":"follow up","b":"follow","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"フォローする","tail":"up"},{"w":"get away","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"逃げる","tail":"away"},{"w":"get away with","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"まんまと逃れる","tail":"away with","ot":["abstract"]},{"w":"get back to","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"あとで連絡する","tail":"back to","ot":["person"]},{"w":"get in","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"入る","tail":"in"},{"w":"get into","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"夢中になる","tail":"into","ot":["sport","game","music","lang","abstract"]},{"w":"get out of","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"出る","tail":"out of","ot":["ride","thing"]},{"w":"get together","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"集まる","tail":"together"},{"w":"go ahead","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":3,"ja":"どうぞ進める","tail":"ahead"},{"w":"go for","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"tr","lv":3,"ja":"〜をしに行く","tail":"for","ot":["food","drink","sport","event"]},{"w":"go into","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"tr","lv":3,"ja":"入る","tail":"into","ot":["thing","event"]},{"w":"head out","b":"head","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"出かける","tail":"out"},{"w":"head to","b":"head","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"向かう","tail":"to","ot":["event"]},{"w":"keep on","b":"keep","past":"kept","pp":"kept","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"続ける","tail":"on"},{"w":"keep up","b":"keep","past":"kept","pp":"kept","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ついていく","tail":"up"},{"w":"keep up with","b":"keep","past":"kept","pp":"kept","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"ついていく","tail":"up with","ot":["person","abstract"]},{"w":"look out for","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"気をつける","tail":"out for","ot":["person","animal","thing"]},{"w":"make out","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"聞き取る","tail":"out","ot":["word","abstract"]},{"w":"make up","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"作り上げる","tail":"up","ot":["write","abstract"]},{"w":"move on","b":"move","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"次へ進む","tail":"on"},{"w":"open up","b":"open","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"打ち明ける","tail":"up"},{"w":"put back","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"元に戻す","tail":"back","ot":["thing"]},{"w":"reach out","b":"reach","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"連絡する","tail":"out"},{"w":"run out","b":"run","past":"ran","pp":"run","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"なくなる","tail":"out"},{"w":"set up","b":"set","past":"set","pp":"set","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"準備する","tail":"up","ot":["thing","event","device"]},{"w":"turn out","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"結局〜とわかる","tail":"out"},{"w":"work on","b":"work","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"取り組む","tail":"on","ot":["homework","write","thing","abstract"]},{"w":"act on","b":"act","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"〜にもとづいて行動する","tail":"on","ot":["offer","abstract"]},{"w":"back out","b":"back","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"手を引く","tail":"out"},{"w":"call for","b":"call","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"必要とする","tail":"for","ot":["abstract","help"]},{"w":"care for","b":"care","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"世話をする","tail":"for","ot":["person","animal","plant"]},{"w":"carry on","b":"carry","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"続ける","tail":"on"},{"w":"carry out","b":"carry","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"実行する","tail":"out","ot":["event","abstract"]},{"w":"check in","b":"check","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"チェックインする","tail":"in"},{"w":"come around","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"考えを変える","tail":"around"},{"w":"come down with","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"かかる","tail":"down with","ot":["over"]},{"w":"cut off","b":"cut","past":"cut","pp":"cut","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"切りはなす","tail":"off","ot":["thing","device"]},{"w":"drop by","b":"drop","past":"","pp":"","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"立ち寄る","tail":"by"},{"w":"fall apart","b":"fall","past":"fell","pp":"fallen","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ばらばらになる","tail":"apart"},{"w":"freak out","b":"freak","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"パニックになる","tail":"out"},{"w":"get through","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"乗り切る","tail":"through","ot":["over","event"]},{"w":"go off","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":3,"ja":"鳴り出す","tail":"off"},{"w":"hand over","b":"hand","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"引き渡す","tail":"over","ot":["thing","read"]},{"w":"hold back","b":"hold","past":"held","pp":"held","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ためらう","tail":"back"},{"w":"lay out","b":"lay","past":"laid","pp":"laid","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"広げて並べる","tail":"out","ot":["thing","write"]},{"w":"mess up","b":"mess","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"台無しにする","tail":"up","ot":["thing","event","abstract"]},{"w":"move in","b":"move","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"引っ越してくる","tail":"in"},{"w":"move out","b":"move","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"引っ越して出る","tail":"out"},{"w":"pass out","b":"pass","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"気を失う","tail":"out"},{"w":"pay back","b":"pay","past":"paid","pp":"paid","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"お金を返す","tail":"back","ot":["person","thing"]},{"w":"point out","b":"point","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"指摘する","tail":"out","ot":["abstract","word"]},{"w":"pull over","b":"pull","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"車を止める","tail":"over"},{"w":"put together","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"組み立てる","tail":"together","ot":["thing","build"]},{"w":"put up","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"はり出す","tail":"up","ot":["read","thing"]},{"w":"set off","b":"set","past":"set","pp":"set","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"出発する","tail":"off"},{"w":"shut down","b":"shut","past":"shut","pp":"shut","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"電源を切る","tail":"down","ot":["device","thing"]},{"w":"sit back","b":"sit","past":"sat","pp":"sat","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"くつろぐ","tail":"back"},{"w":"sort out","b":"sort","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"整理する","tail":"out","ot":["thing","abstract"]},{"w":"stand out","b":"stand","past":"stood","pp":"stood","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"目立つ","tail":"out"},{"w":"start out","b":"start","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"始める","tail":"out"},{"w":"step back","b":"step","past":"","pp":"","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"一歩下がる","tail":"back"},{"w":"take on","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"引き受ける","tail":"on","ot":["event","abstract"]},{"w":"take over","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"引き継ぐ","tail":"over","ot":["event","thing","abstract"]},{"w":"throw out","b":"throw","past":"threw","pp":"thrown","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"捨てる","tail":"out","ot":["thing","food"]},{"w":"turn in","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"提出する","tail":"in","ot":["homework","write","read"]},{"w":"switch on","b":"switch","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"スイッチを入れる","tail":"on","ot":["device"]},{"w":"get by","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"なんとかやっていく","tail":"by"},{"w":"get along","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"仲よくする","tail":"along"},{"w":"get lost","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"道に迷う","tail":"lost"},{"w":"get ready","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"準備する","tail":"ready"},{"w":"get married","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"結婚する","tail":"married"},{"w":"get better","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"よくなる","tail":"better"},{"w":"get rid of","b":"get","past":"got","pp":"gotten","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"処分する","tail":"rid of","ot":["thing"]},{"w":"go up","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":3,"ja":"上がる","tail":"up"},{"w":"go down","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":3,"ja":"下がる","tail":"down"},{"w":"go by","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":3,"ja":"過ぎる","tail":"by"},{"w":"go shopping","b":"go","past":"went","pp":"gone","s3":"goes","dbl":0,"fr":"intr","lv":3,"ja":"買い物に行く","tail":"shopping"},{"w":"come up","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"話に出てくる","tail":"up"},{"w":"come true","b":"come","past":"came","pp":"come","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"実現する","tail":"true"},{"w":"take in","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"取り入れる","tail":"in","ot":["thing","abstract"]},{"w":"take apart","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"分解する","tail":"apart","ot":["thing","device"]},{"w":"take turns","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"交代でする","tail":"turns"},{"w":"put in","b":"put","past":"put","pp":"put","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"入れる","tail":"in","ot":["thing"]},{"w":"turn over","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"ひっくり返す","tail":"over","ot":["thing"]},{"w":"look back","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"振り返る","tail":"back"},{"w":"look through","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"目を通す","tail":"through","ot":["read","write"]},{"w":"look over","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"ざっと見直す","tail":"over","ot":["read","write","homework"]},{"w":"look up to","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"尊敬する","tail":"up to","ot":["person"]},{"w":"look down on","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"見下す","tail":"down on","ot":["person"]},{"w":"give out","b":"give","past":"gave","pp":"given","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"配る","tail":"out","ot":["thing","food","read"]},{"w":"run around","b":"run","past":"ran","pp":"run","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"走り回る","tail":"around"},{"w":"bring in","b":"bring","past":"brought","pp":"brought","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"持ちこむ","tail":"in","ot":["thing","food"]},{"w":"bring out","b":"bring","past":"brought","pp":"brought","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"引き出す","tail":"out","ot":["thing","abstract"]},{"w":"break in","b":"break","past":"broke","pp":"broken","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"押し入る","tail":"in"},{"w":"break out","b":"break","past":"broke","pp":"broken","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"起こる","tail":"out"},{"w":"hang around","b":"hang","past":"hung","pp":"hung","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ぶらぶらする","tail":"around"},{"w":"show off","b":"show","past":"showed","pp":"shown","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"見せびらかす","tail":"off","ot":["thing"]},{"w":"show around","b":"show","past":"showed","pp":"shown","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"案内する","tail":"around","ot":["person"]},{"w":"make it","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"間に合う","tail":"it"},{"w":"make fun of","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"からかう","tail":"fun of","ot":["person"]},{"w":"catch on","b":"catch","past":"caught","pp":"caught","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"わかってくる","tail":"on"},{"w":"clean out","b":"clean","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"中を片づける","tail":"out","ot":["clean"]},{"w":"dress up","b":"dress","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"おしゃれする","tail":"up"},{"w":"fill up","b":"fill","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"いっぱいにする","tail":"up","ot":["thing","drink"]},{"w":"blow up","b":"blow","past":"blew","pp":"blown","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"ふくらませる","tail":"up","ot":["thing"]},{"w":"blow out","b":"blow","past":"blew","pp":"blown","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"吹き消す","tail":"out","ot":["thing"]},{"w":"count on","b":"count","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"頼りにする","tail":"on","ot":["person"]},{"w":"hand in","b":"hand","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"提出する","tail":"in","ot":["homework","write","read"]},{"w":"hand out","b":"hand","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"配る","tail":"out","ot":["thing","read","food"]},{"w":"hear from","b":"hear","past":"heard","pp":"heard","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"連絡をもらう","tail":"from","ot":["person"]},{"w":"line up","b":"line","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"列に並ぶ","tail":"up"},{"w":"log in","b":"log","past":"","pp":"","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"ログインする","tail":"in"},{"w":"log out","b":"log","past":"","pp":"","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"ログアウトする","tail":"out"},{"w":"mix up","b":"mix","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"ごちゃまぜにする","tail":"up","ot":["thing"]},{"w":"pack up","b":"pack","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"荷づくりする","tail":"up"},{"w":"pick on","b":"pick","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"いじめる","tail":"on","ot":["person"]},{"w":"plug in","b":"plug","past":"","pp":"","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"コンセントにさす","tail":"in","ot":["device","thing"]},{"w":"pop up","b":"pop","past":"","pp":"","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"ひょっこり出てくる","tail":"up"},{"w":"sell out","b":"sell","past":"sold","pp":"sold","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"売り切れる","tail":"out"},{"w":"settle down","b":"settle","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"落ち着く","tail":"down"},{"w":"sleep in","b":"sleep","past":"slept","pp":"slept","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"朝寝坊する","tail":"in"},{"w":"sleep over","b":"sleep","past":"slept","pp":"slept","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"泊まる","tail":"over"},{"w":"stay up","b":"stay","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"夜ふかしする","tail":"up"},{"w":"stay in","b":"stay","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"家にいる","tail":"in"},{"w":"stay out","b":"stay","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"外に出たままでいる","tail":"out"},{"w":"stick to","b":"stick","past":"stuck","pp":"stuck","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"守る","tail":"to","ot":["abstract","event"]},{"w":"stick around","b":"stick","past":"stuck","pp":"stuck","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"そのへんにいる","tail":"around"},{"w":"think over","b":"think","past":"thought","pp":"thought","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"よく考える","tail":"over","ot":["abstract","event"]},{"w":"try on","b":"try","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"試着する","tail":"on","ot":["wear","thing"]},{"w":"try out","b":"try","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"試してみる","tail":"out","ot":["thing","food","game","device"]},{"w":"tidy up","b":"tidy","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"片づける","tail":"up"},{"w":"warm up","b":"warm","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"準備運動をする","tail":"up"},{"w":"cool down","b":"cool","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"冷める","tail":"down"},{"w":"fit in","b":"fit","past":"fit","pp":"fit","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"なじむ","tail":"in"},{"w":"fall asleep","b":"fall","past":"fell","pp":"fallen","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"眠りこむ","tail":"asleep"},{"w":"fall behind","b":"fall","past":"fell","pp":"fallen","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"遅れる","tail":"behind"},{"w":"fall for","b":"fall","past":"fell","pp":"fallen","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"好きになる","tail":"for","ot":["person"]},{"w":"keep going","b":"keep","past":"kept","pp":"kept","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"がんばり続ける","tail":"going"},{"w":"let down","b":"let","past":"let","pp":"let","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"がっかりさせる","tail":"down","ot":["person"]},{"w":"let in","b":"let","past":"let","pp":"let","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"中に入れる","tail":"in","ot":["person","animal"]},{"w":"pass away","b":"pass","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"亡くなる","tail":"away"},{"w":"pay for","b":"pay","past":"paid","pp":"paid","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"払う","tail":"for","ot":["food","drink","thing"]},{"w":"sit up","b":"sit","past":"sat","pp":"sat","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"起き上がる","tail":"up"},{"w":"stand by","b":"stand","past":"stood","pp":"stood","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"待機する","tail":"by"},{"w":"stand for","b":"stand","past":"stood","pp":"stood","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"表す","tail":"for","ot":["abstract"]},{"w":"take after","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"似ている","tail":"after","ot":["person"]},{"w":"talk over","b":"talk","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"話し合う","tail":"over","ot":["abstract","event"]},{"w":"wash up","b":"wash","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"手を洗う","tail":"up"},{"w":"write back","b":"write","past":"wrote","pp":"written","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"返事を書く","tail":"back"},{"w":"drop out","b":"drop","past":"","pp":"","s3":"","dbl":1,"fr":"intr","lv":3,"ja":"途中でやめる","tail":"out"},{"w":"eat up","b":"eat","past":"ate","pp":"eaten","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"たいらげる","tail":"up","ot":["food"]},{"w":"sign in","b":"sign","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"サインインする","tail":"in"},{"w":"call up","b":"call","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"電話する","tail":"up","ot":["person"]},{"w":"jump in","b":"jump","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"話に割りこむ","tail":"in"},{"w":"save up","b":"save","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"貯金する","tail":"up"},{"w":"switch off","b":"switch","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"スイッチを切る","tail":"off","ot":["device"]},{"w":"wrap up","b":"wrap","past":"","pp":"","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"まとめる","tail":"up","ot":["event","abstract"]},{"w":"brush up on","b":"brush","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"磨き直す","tail":"up on","ot":["lang","sport","instr"]},{"w":"knock down","b":"knock","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"たおす","tail":"down","ot":["thing"]},{"w":"wear out","b":"wear","past":"wore","pp":"worn","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"すり切れる","tail":"out"},{"w":"make sure","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"確かめる","tail":"sure"},{"w":"make sense","b":"make","past":"made","pp":"made","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"意味が通じる","tail":"sense"},{"w":"believe in","b":"believe","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"信じる","tail":"in","ot":["person","abstract"]},{"w":"think of","b":"think","past":"thought","pp":"thought","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"思いつく","tail":"of","ot":["any"]},{"w":"dream of","b":"dream","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"夢見る","tail":"of","ot":["any"]},{"w":"dream about","b":"dream","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"夢を見る","tail":"about","ot":["any"]},{"w":"ask for","b":"ask","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"たのむ","tail":"for","ot":["any"]},{"w":"hope for","b":"hope","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"願う","tail":"for","ot":["any"]},{"w":"wish for","b":"wish","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"願う","tail":"for","ot":["any"]},{"w":"pray for","b":"pray","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"祈る","tail":"for","ot":["any"]},{"w":"long for","b":"long","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"あこがれる","tail":"for","ot":["any"]},{"w":"learn about","b":"learn","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"学ぶ","tail":"about","ot":["any"]},{"w":"hear of","b":"hear","past":"heard","pp":"heard","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"聞く","tail":"of","ot":["any"]},{"w":"hear about","b":"hear","past":"heard","pp":"heard","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"聞く","tail":"about","ot":["any"]},{"w":"think about","b":"think","past":"thought","pp":"thought","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"考える","tail":"about","ot":["any"]},{"w":"take advantage of","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"利用する","tail":"advantage of","ot":["offer","abstract","event"]},{"w":"keep in touch","b":"keep","past":"kept","pp":"kept","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"連絡を取り合う","tail":"in touch"},{"w":"have a good time","b":"have","past":"had","pp":"had","s3":"has","dbl":0,"fr":"intr","lv":1,"ja":"楽しく過ごす","tail":"a good time"},{"w":"take part in","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"参加する","tail":"part in","ot":["event","sport"]},{"w":"pay attention to","b":"pay","past":"paid","pp":"paid","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"注意を払う","tail":"attention to","ot":["any"]},{"w":"take place","b":"take","past":"took","pp":"taken","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"行われる","tail":"place"},{"w":"focus on","b":"focus","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"集中する","tail":"on","ot":["homework","abstract","sport","lang"]},{"w":"rely on","b":"rely","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"頼る","tail":"on","ot":["person","thing"]},{"w":"lead to","b":"lead","past":"led","pp":"led","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"つながる","tail":"to","ot":["abstract","event"]},{"w":"look like","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"似ている","tail":"like","ot":["person","animal","thing"]},{"w":"try","b":"try","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"やってみる","ot":["food","sport","game","thing"],"cv":"both"},{"w":"stay","b":"stay","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"とどまる","link":1},{"w":"live","b":"live","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"住む"},{"w":"move","b":"move","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"動く"},{"w":"stop","b":"stop","past":"stopped","pp":"stopped","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"止まる","cv":"ing"},{"w":"change","b":"change","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"変わる"},{"w":"begin","b":"begin","past":"began","pp":"begun","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"始まる","cv":"both"},{"w":"finish","b":"finish","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"終える","ot":["homework","food","read","write","event"],"cv":"ing"},{"w":"keep","b":"keep","past":"kept","pp":"kept","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"とっておく","ot":["thing","food"],"cv":"ing"},{"w":"let go","b":"let","past":"let","pp":"let","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"手放す","tail":"go"},{"w":"spend","b":"spend","past":"spent","pp":"spent","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"過ごす","ot":["event"]},{"w":"save","b":"save","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"とっておく","ot":["thing","food"]},{"w":"miss","b":"miss","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"恋しく思う","ot":["person","animal","event"],"cv":"ing"},{"w":"understand","b":"understand","past":"understood","pp":"understood","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"わかる","ot":["word","lang","tell"]},{"w":"explain","b":"explain","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"説明する","ot":["word","tell","event"]},{"w":"plan","b":"plan","past":"planned","pp":"planned","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"計画する","ot":["event"],"cv":"to"},{"w":"prepare","b":"prepare","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"準備する","ot":["food","event"]},{"w":"decide","b":"decide","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"決める","cv":"to"},{"w":"worry","b":"worry","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"心配する"},{"w":"agree","b":"agree","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"賛成する","cv":"to"},{"w":"smell","b":"smell","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"においをかぐ","ot":["food","drink","plant"]},{"w":"taste","b":"taste","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"味見する","ot":["food","drink"]},{"w":"touch","b":"touch","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"さわる","ot":["thing","animal","any"]},{"w":"hold","b":"hold","past":"held","pp":"held","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"持つ","ot":["thing","animal","person"]},{"w":"drop","b":"drop","past":"dropped","pp":"dropped","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"落とす","ot":["thing","food"]},{"w":"fill","b":"fill","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"満たす","ot":["thing"]},{"w":"wrap","b":"wrap","past":"wrapped","pp":"wrapped","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"包む","ot":["thing","present"]},{"w":"collect","b":"collect","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"集める","ot":["thing","toy"]},{"w":"share","b":"share","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"分け合う","ot":["food","thing"]},{"w":"order","b":"order","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"注文する","ot":["food","drink"]},{"w":"rent","b":"rent","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"借りる","ot":["ride","thing"]},{"w":"pack","b":"pack","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"荷造りする","ot":["thing"]},{"w":"mix","b":"mix","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"混ぜる","ot":["food","drink"]},{"w":"bake","b":"bake","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"焼く","ot":["food"]},{"w":"boil","b":"boil","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"ゆでる","ot":["food"]},{"w":"fry","b":"fry","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"いためる","ot":["food"]},{"w":"pour","b":"pour","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"注ぐ","ot":["drink"]},{"w":"serve","b":"serve","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"出す","ot":["food","drink"]},{"w":"type","b":"type","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"入力する","ot":["write","word"]},{"w":"print","b":"print","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"印刷する","ot":["read","write"]},{"w":"record","b":"record","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"録音する","ot":["music"]},{"w":"download","b":"download","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"ダウンロードする","ot":["thing","music"]},{"w":"search","b":"search","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"検索する"},{"w":"post","b":"post","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"投稿する","ot":["write"]},{"w":"greet","b":"greet","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"あいさつする","ot":["person"]},{"w":"thank","b":"thank","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"感謝する","ot":["person"]},{"w":"marry","b":"marry","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"結婚する","ot":["person"]},{"w":"wave","b":"wave","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"手をふる"},{"w":"nod","b":"nod","past":"nodded","pp":"nodded","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"うなずく"},{"w":"yell","b":"yell","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"大声を出す"},{"w":"whisper","b":"whisper","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"ささやく"},{"w":"sneeze","b":"sneeze","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"くしゃみをする"},{"w":"cough","b":"cough","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"せきをする"},{"w":"yawn","b":"yawn","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"あくびをする"},{"w":"breathe","b":"breathe","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"息をする"},{"w":"blink","b":"blink","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"まばたきする"},{"w":"shake","b":"shake","past":"shook","pp":"shaken","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"ふる","ot":["thing"]},{"w":"bite","b":"bite","past":"bit","pp":"bitten","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"かむ","ot":["food","thing"]},{"w":"lick","b":"lick","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"なめる","ot":["food"]},{"w":"chew","b":"chew","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"かむ","ot":["food"]},{"w":"swallow","b":"swallow","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"飲みこむ","ot":["food"]},{"w":"stretch","b":"stretch","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"のびをする"},{"w":"bow","b":"bow","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"おじぎする"},{"w":"kneel","b":"kneel","past":"knelt","pp":"knelt","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"ひざまずく"},{"w":"crawl","b":"crawl","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"はう"},{"w":"roll","b":"roll","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"転がる"},{"w":"slide","b":"slide","past":"slid","pp":"slid","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"すべる"},{"w":"float","b":"float","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"浮かぶ"},{"w":"sink","b":"sink","past":"sank","pp":"sunk","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"沈む"},{"w":"shine","b":"shine","past":"shone","pp":"shone","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"かがやく"},{"w":"melt","b":"melt","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"とける"},{"w":"burn","b":"burn","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"燃える"},{"w":"freeze","b":"freeze","past":"froze","pp":"frozen","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"こおる"},{"w":"ring","b":"ring","past":"rang","pp":"rung","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"鳴る"},{"w":"knock","b":"knock","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ノックする"},{"w":"skip","b":"skip","past":"skipped","pp":"skipped","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"スキップする"},{"w":"hop","b":"hop","past":"hopped","pp":"hopped","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ぴょんと跳ぶ"},{"w":"march","b":"march","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"行進する"},{"w":"race","b":"race","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"競走する"},{"w":"score","b":"score","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"得点する"},{"w":"cheer","b":"cheer","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"応援する"},{"w":"clap","b":"clap","past":"clapped","pp":"clapped","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"手をたたく"},{"w":"celebrate","b":"celebrate","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":1,"ja":"お祝いする","ot":["event"]},{"w":"hug each other","b":"hug","past":"hugged","pp":"hugged","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"抱き合う","tail":"each other"},{"w":"sail","b":"sail","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"航海する"},{"w":"camp","b":"camp","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"キャンプする"},{"w":"fish","b":"fish","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"つりをする"},{"w":"hike","b":"hike","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"ハイキングする"},{"w":"ski","b":"ski","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"スキーをする"},{"w":"skate","b":"skate","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"スケートをする"},{"w":"surf","b":"surf","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"サーフィンをする"},{"w":"jog","b":"jog","past":"jogged","pp":"jogged","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ジョギングする"},{"w":"paint pictures","b":"paint","past":"painted","pp":"painted","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"絵を描く","tail":"pictures"},{"w":"argue","b":"argue","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"言い争う"},{"w":"complain","b":"complain","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"文句を言う"},{"w":"lie","b":"lie","past":"lied","pp":"lied","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"うそをつく"},{"w":"promise","b":"promise","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"約束する","cv":"to"},{"w":"imagine","b":"imagine","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"想像する","cv":"ing"},{"w":"forgive","b":"forgive","past":"forgave","pp":"forgiven","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"許す","ot":["person"]},{"w":"trust","b":"trust","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"信頼する","ot":["person"]},{"w":"respect","b":"respect","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"尊敬する","ot":["person"]},{"w":"prefer","b":"prefer","past":"preferred","pp":"preferred","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"〜のほうが好きだ","ot":["food","drink","any"],"cv":"both"},{"w":"pass by","b":"pass","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"通りすぎる","tail":"by"},{"w":"attack","b":"attack","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"攻撃する","ot":["person","animal"]},{"w":"beat","b":"beat","past":"beat","pp":"beaten","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"負かす","ot":["person"]},{"w":"defeat","b":"defeat","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"打ち負かす","ot":["person"]},{"w":"rescue","b":"rescue","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"救う","ot":["person","animal"]},{"w":"save money","b":"save","past":"saved","pp":"saved","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"お金をためる","tail":"money"},{"w":"earn","b":"earn","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"かせぐ"},{"w":"borrow money","b":"borrow","past":"borrowed","pp":"borrowed","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"お金を借りる","tail":"money"},{"w":"introduce","b":"introduce","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"紹介する","ot":["person"]},{"w":"recommend","b":"recommend","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"すすめる","ot":["food","read","watch","thing"]},{"w":"compare","b":"compare","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"比べる","ot":["thing","food"]},{"w":"measure","b":"measure","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"はかる","ot":["thing"]},{"w":"weigh","b":"weigh","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"重さをはかる","ot":["thing","food"]},{"w":"repair","b":"repair","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"修理する","ot":["thing","ride","device"]},{"w":"design","b":"design","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"デザインする","ot":["thing","build"]},{"w":"create","b":"create","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"作り出す","ot":["thing","build","write"]},{"w":"invent","b":"invent","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"発明する","ot":["thing"]},{"w":"solve","b":"solve","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"解く","ot":["word","over"]},{"w":"memorize","b":"memorize","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"暗記する","ot":["word","lang"]},{"w":"review","b":"review","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"復習する","ot":["lang","homework"]},{"w":"translate","b":"translate","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"翻訳する","ot":["write","word","read"]},{"w":"spell","b":"spell","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"つづる","ot":["word"]},{"w":"pronounce","b":"pronounce","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"発音する","ot":["word"]},{"w":"describe","b":"describe","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"説明する","ot":["thing","person","event"]},{"w":"report","b":"report","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"報告する","ot":["event"]},{"w":"announce","b":"announce","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"発表する","ot":["event"]},{"w":"vote","b":"vote","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"投票する"},{"w":"join","b":"join","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"参加する","ot":["event","sport"]},{"w":"leave the room","b":"leave","past":"left","pp":"left","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"部屋を出る","tail":"the room"},{"w":"book","b":"book","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"予約する","ot":["event","ride"]},{"w":"cancel","b":"cancel","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"キャンセルする","ot":["event"]},{"w":"miss the bus","b":"miss","past":"missed","pp":"missed","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"バスに乗りおくれる","tail":"the bus"},{"w":"raise","b":"raise","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"あげる","ot":["thing"]},{"w":"lower","b":"lower","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"下げる","ot":["thing"]},{"w":"lift","b":"lift","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"持ち上げる","ot":["thing"]},{"w":"drag","b":"drag","past":"dragged","pp":"dragged","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"引きずる","ot":["thing"]},{"w":"tie","b":"tie","past":"tied","pp":"tied","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"結ぶ","ot":["thing"]},{"w":"fold","b":"fold","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"折りたたむ","ot":["thing","write"]},{"w":"tear","b":"tear","past":"tore","pp":"torn","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"破る","ot":["write","read"]},{"w":"turn back","b":"turn","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"引き返す","tail":"back"},{"w":"knit","b":"knit","past":"knitted","pp":"knitted","s3":"","dbl":0,"fr":"tr","lv":3,"ja":"編む","ot":["thing"]},{"w":"sew","b":"sew","past":"sewed","pp":"sewn","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"ぬう","ot":["thing"]},{"w":"iron","b":"iron","past":"","pp":"","s3":"","dbl":1,"fr":"tr","lv":3,"ja":"アイロンをかける","ot":["thing"]},{"w":"sweep","b":"sweep","past":"swept","pp":"swept","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"はく","ot":["clean"]},{"w":"vacuum","b":"vacuum","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"掃除機をかける","ot":["clean"]},{"w":"water","b":"water","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"水をやる","ot":["plant"]},{"w":"grow plants","b":"grow","past":"grew","pp":"grown","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"植物を育てる","tail":"plants"},{"w":"pick flowers","b":"pick","past":"picked","pp":"picked","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"花をつむ","tail":"flowers"},{"w":"feed the cat","b":"feed","past":"fed","pp":"fed","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ねこにえさをやる","tail":"the cat"},{"w":"walk the dog","b":"walk","past":"walked","pp":"walked","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"犬の散歩をする","tail":"the dog"},{"w":"whistle","b":"whistle","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"口笛をふく"},{"w":"tiptoe","b":"tiptoe","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"つま先で歩く"},{"w":"giggle","b":"giggle","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"くすくす笑う"},{"w":"sigh","b":"sigh","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"ため息をつく"},{"w":"shiver","b":"shiver","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":3,"ja":"ふるえる"},{"w":"frown","b":"frown","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"顔をしかめる"},{"w":"gossip","b":"gossip","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":4,"ja":"うわさ話をする"},{"w":"wander","b":"wander","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"ぶらぶら歩く"},{"w":"explore","b":"explore","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"探検する","ot":["place"]},{"w":"investigate","b":"investigate","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":4,"ja":"調べる","ot":["event","thing"]},{"w":"add","b":"add","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"加える","ot":["food","thing","word"]},{"w":"blow","b":"blow","past":"blew","pp":"blown","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"吹く"},{"w":"brush","b":"brush","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"みがく","ot":["brush"]},{"w":"color","b":"color","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"色をぬる","ot":["draw"]},{"w":"discuss","b":"discuss","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"話し合う","ot":["event","abstract","word"]},{"w":"grow","b":"grow","past":"grew","pp":"grown","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"育てる","ot":["plant"]},{"w":"happen","b":"happen","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"起こる"},{"w":"hurt","b":"hurt","past":"hurt","pp":"hurt","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"けがする","ot":["body"]},{"w":"mean","b":"mean","past":"meant","pp":"meant","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"意味する","ot":["word"]},{"w":"phone","b":"phone","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"電話する","ot":["person"]},{"w":"repeat","b":"repeat","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"くり返す","ot":["word","thing"]},{"w":"speak","b":"speak","past":"spoke","pp":"spoken","s3":"","dbl":0,"fr":"both","lv":1,"ja":"話す","ot":["lang"]},{"w":"welcome","b":"welcome","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":1,"ja":"歓迎する","ot":["person"]},{"w":"sit","b":"sit","past":"sat","pp":"sat","s3":"","dbl":0,"fr":"intr","lv":1,"ja":"座る"},{"w":"accept","b":"accept","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"受け入れる","ot":["offer","abstract"]},{"w":"achieve","b":"achieve","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"達成する","ot":["abstract"]},{"w":"admire","b":"admire","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"尊敬する","ot":["person"]},{"w":"advise","b":"advise","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"助言する","ot":["person"]},{"w":"annoy","b":"annoy","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"いらいらさせる","ot":["person"]},{"w":"apologize","b":"apologize","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"あやまる"},{"w":"apply","b":"apply","past":"applied","pp":"applied","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"申し込む"},{"w":"appreciate","b":"appreciate","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"感謝する","ot":["abstract","help"]},{"w":"avoid","b":"avoid","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"さける","ot":["thing","person","food","abstract"],"cv":"ing"},{"w":"bend","b":"bend","past":"bent","pp":"bent","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"曲げる","ot":["body","thing"]},{"w":"blame","b":"blame","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"責める","ot":["person"]},{"w":"bother","b":"bother","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"じゃまする","ot":["person"]},{"w":"bury","b":"bury","past":"buried","pp":"buried","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"うめる","ot":["thing"]},{"w":"chat","b":"chat","past":"chatted","pp":"chatted","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"おしゃべりする"},{"w":"communicate","b":"communicate","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"意思を伝え合う"},{"w":"concentrate","b":"concentrate","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"集中する"},{"w":"confuse","b":"confuse","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"混乱させる","ot":["person"]},{"w":"consider","b":"consider","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"よく考える","ot":["abstract","event","offer"]},{"w":"contact","b":"contact","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"連絡する","ot":["person"]},{"w":"copy","b":"copy","past":"copied","pp":"copied","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"写す","ot":["write","read"]},{"w":"cover","b":"cover","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"おおう","ot":["thing","food","body"]},{"w":"cross","b":"cross","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"わたる","ot":["road"]},{"w":"destroy","b":"destroy","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"こわす","ot":["thing","build"]},{"w":"develop","b":"develop","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"開発する","ot":["thing","abstract"]},{"w":"disagree","b":"disagree","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"反対する"},{"w":"disappear","b":"disappear","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"消える"},{"w":"disturb","b":"disturb","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"じゃまする","ot":["person"]},{"w":"divide","b":"divide","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"分ける","ot":["food","thing"]},{"w":"dress","b":"dress","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"服を着る"},{"w":"dry","b":"dry","past":"dried","pp":"dried","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"乾かす","ot":["body","wash","thing"]},{"w":"email","b":"email","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"メールを送る","ot":["person"]},{"w":"encourage","b":"encourage","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"はげます","ot":["person"]},{"w":"end","b":"end","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"終わる"},{"w":"exist","b":"exist","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"存在する"},{"w":"expect","b":"expect","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"期待する","ot":["abstract","event","present"],"cv":"to"},{"w":"fail","b":"fail","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"落ちる","ot":["event"]},{"w":"frighten","b":"frighten","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"こわがらせる","ot":["person","animal"]},{"w":"gather","b":"gather","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"集まる"},{"w":"graduate","b":"graduate","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"卒業する"},{"w":"hand","b":"hand","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"手わたす","ot":["thing","read","food"],"dt":1},{"w":"impress","b":"impress","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"感動させる","ot":["person"]},{"w":"improve","b":"improve","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"上達させる","ot":["skill","lang","abstract"]},{"w":"increase","b":"increase","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"増える"},{"w":"injure","b":"injure","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"けがする","ot":["body"]},{"w":"land","b":"land","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"着陸する"},{"w":"offer","b":"offer","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"申し出る","ot":["thing","food","drink","help"],"dt":1},{"w":"park","b":"park","past":"","pp":"","s3":"","dbl":0,"fr":"both","lv":2,"ja":"駐車する","ot":["car"]},{"w":"perform","b":"perform","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"演じる"},{"w":"predict","b":"predict","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"予想する","ot":["event","abstract"]},{"w":"produce","b":"produce","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"生産する","ot":["thing","food"]},{"w":"publish","b":"publish","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"出版する","ot":["read"]},{"w":"receive","b":"receive","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"受け取る","ot":["thing","present","read","offer"]},{"w":"recycle","b":"recycle","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"リサイクルする","ot":["thing"]},{"w":"regret","b":"regret","past":"regretted","pp":"regretted","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"後悔する","ot":["abstract"]},{"w":"replace","b":"replace","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"取り替える","ot":["thing","device"]},{"w":"retire","b":"retire","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"引退する"},{"w":"roast","b":"roast","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"焼く","ot":["food"]},{"w":"ruin","b":"ruin","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"だめにする","ot":["thing","event"]},{"w":"shut","b":"shut","past":"shut","pp":"shut","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"閉める","ot":["door"]},{"w":"spill","b":"spill","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"こぼす","ot":["drink"]},{"w":"succeed","b":"succeed","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"成功する"},{"w":"suggest","b":"suggest","past":"","pp":"","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"提案する","ot":["abstract","offer","event"]},{"w":"survive","b":"survive","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"生き残る"},{"w":"sweat","b":"sweat","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"汗をかく"},{"w":"tidy","b":"tidy","past":"tidied","pp":"tidied","s3":"","dbl":0,"fr":"tr","lv":2,"ja":"片付ける","ot":["clean"]},{"w":"train","b":"train","past":"","pp":"","s3":"","dbl":0,"fr":"intr","lv":2,"ja":"トレーニングする"},{"w":"become","b":"become","past":"became","pp":"become","s3":"","dbl":0,"fr":"intr","link":1,"lv":2,"ja":"なる"},{"w":"look","b":"look","past":"","pp":"","s3":"","dbl":0,"fr":"intr","link":1,"lv":2,"ja":"見える"},{"w":"feel","b":"feel","past":"felt","pp":"felt","s3":"","dbl":0,"fr":"intr","link":1,"lv":2,"ja":"感じる"},{"w":"seem","b":"seem","past":"","pp":"","s3":"","dbl":0,"fr":"intr","link":1,"lv":2,"ja":"思える"},{"w":"sound","b":"sound","past":"","pp":"","s3":"","dbl":0,"fr":"intr","link":1,"lv":2,"ja":"聞こえる"}],"adj":[{"w":"happy","lv":1,"ja":"うれしい","jt":"i","cmp":"happier","sup":"happiest"},{"w":"sad","lv":1,"ja":"かなしい","jt":"i","cmp":"sadder","sup":"saddest"},{"w":"sleepy","lv":2,"ja":"ねむい","jt":"i","cmp":"sleepier","sup":"sleepiest"},{"w":"hungry","lv":1,"ja":"はらぺこ","jt":"na","cmp":"hungrier","sup":"hungriest"},{"w":"tired","lv":1,"ja":"つかれる","jt":"v","more":1},{"w":"angry","lv":1,"ja":"怒る","jt":"v","cmp":"angrier","sup":"angriest"},{"w":"excited","lv":1,"ja":"わくわくする","jt":"v","more":1},{"w":"busy","lv":1,"ja":"いそがしい","jt":"i","cmp":"busier","sup":"busiest"},{"w":"fine","lv":1,"ja":"元気","jt":"na","cmp":"better","sup":"best"},{"w":"okay","lv":1,"ja":"大丈夫","jt":"na","more":1},{"w":"alright","lv":1,"ja":"大丈夫","jt":"na","more":1},{"w":"sick","lv":1,"ja":"具合が悪い","jt":"i","more":1},{"w":"cold","lv":1,"ja":"寒い","jt":"i","more":1},{"w":"hot","lv":1,"ja":"暑い","jt":"i","cmp":"hotter","sup":"hottest"},{"w":"quiet","lv":1,"ja":"静か","jt":"na","more":1},{"w":"kind","lv":2,"ja":"やさしい","jt":"i","more":1},{"w":"strong","lv":1,"ja":"強い","jt":"i","more":1},{"w":"tall","lv":1,"ja":"背が高い","jt":"i","more":1},{"w":"cute","lv":1,"ja":"かわいい","jt":"i","cmp":"cuter","sup":"cutest"},{"w":"cool","lv":1,"ja":"かっこいい","jt":"i","more":1},{"w":"late","lv":1,"ja":"遅刻","jt":"na","cmp":"later","sup":"latest"},{"w":"shy","lv":1,"ja":"はずかしい","jt":"i","cmp":"shyer","sup":"shyest"},{"w":"brave","lv":2,"ja":"勇敢","jt":"na","cmp":"braver","sup":"bravest"},{"w":"lonely","lv":1,"ja":"さびしい","jt":"i","cmp":"lonelier","sup":"loneliest"},{"w":"proud","lv":3,"ja":"誇らしい","jt":"i","cmp":"prouder","sup":"proudest"},{"w":"surprised","lv":2,"ja":"びっくりする","jt":"v","more":1},{"w":"scared","lv":3,"ja":"こわがる","jt":"v","more":1},{"w":"bored","lv":2,"ja":"たいくつ","jt":"na","more":1},{"w":"full","lv":1,"ja":"おなかいっぱい","jt":"na","cmp":"fuller","sup":"fullest"},{"w":"thirsty","lv":2,"ja":"のどがかわく","jt":"v","cmp":"thirstier","sup":"thirstiest"},{"w":"free","lv":1,"ja":"ひま","jt":"na","cmp":"freer","sup":"freest"},{"w":"smart","lv":1,"ja":"かしこい","jt":"i","cmp":"smarter","sup":"smartest"},{"w":"funny","lv":1,"ja":"おもしろい","jt":"i","cmp":"funnier","sup":"funniest"},{"w":"rich","lv":1,"ja":"お金持ち","jt":"na","cmp":"richer","sup":"richest"},{"w":"famous","lv":1,"ja":"有名","jt":"na","more":1},{"w":"beautiful","lv":1,"ja":"きれい","jt":"na","more":1},{"w":"young","lv":1,"ja":"若い","jt":"i","cmp":"younger","sup":"youngest"},{"w":"popular","lv":2,"ja":"人気","jt":"na","more":1},{"w":"healthy","lv":1,"ja":"健康","jt":"na","cmp":"healthier","sup":"healthiest"},{"w":"awesome","lv":3,"ja":"最高","jt":"na","more":1},{"w":"chill","lv":2,"ja":"落ち着いている","jt":"raw","cmp":"chiller","sup":"chillest"},{"w":"ready","lv":1,"ja":"準備ができている","jt":"raw","cmp":"readier","sup":"readiest"},{"w":"big","lv":1,"ja":"大きい","jt":"i","cmp":"bigger","sup":"biggest"},{"w":"small","lv":1,"ja":"小さい","jt":"i","cmp":"smaller","sup":"smallest"},{"w":"long","lv":1,"ja":"長い","jt":"i","cmp":"longer","sup":"longest"},{"w":"short","lv":1,"ja":"短い","jt":"i","cmp":"shorter","sup":"shortest"},{"w":"new","lv":1,"ja":"新しい","jt":"i","cmp":"newer","sup":"newest"},{"w":"old","lv":1,"ja":"古い","jt":"i","cmp":"older","sup":"oldest"},{"w":"good","lv":1,"ja":"いい","jt":"i","cmp":"better","sup":"best"},{"w":"bad","lv":1,"ja":"悪い","jt":"i","cmp":"worse","sup":"worst"},{"w":"easy","lv":1,"ja":"かんたん","jt":"na","cmp":"easier","sup":"easiest"},{"w":"difficult","lv":1,"ja":"むずかしい","jt":"i","more":1},{"w":"interesting","lv":1,"ja":"おもしろい","jt":"i","more":1},{"w":"boring","lv":1,"ja":"たいくつ","jt":"na","more":1},{"w":"important","lv":1,"ja":"大切","jt":"na","more":1},{"w":"expensive","lv":1,"ja":"高い","jt":"i","more":1},{"w":"cheap","lv":2,"ja":"安い","jt":"i","cmp":"cheaper","sup":"cheapest"},{"w":"clean","lv":1,"ja":"きれい","jt":"na","cmp":"cleaner","sup":"cleanest"},{"w":"dirty","lv":1,"ja":"きたない","jt":"i","cmp":"dirtier","sup":"dirtiest"},{"w":"warm","lv":1,"ja":"あたたかい","jt":"i","cmp":"warmer","sup":"warmest"},{"w":"fast","lv":1,"ja":"速い","jt":"i","cmp":"faster","sup":"fastest"},{"w":"slow","lv":1,"ja":"おそい","jt":"i","cmp":"slower","sup":"slowest"},{"w":"heavy","lv":1,"ja":"重い","jt":"i","cmp":"heavier","sup":"heaviest"},{"w":"light","lv":1,"ja":"軽い","jt":"i","cmp":"lighter","sup":"lightest"},{"w":"dark","lv":1,"ja":"暗い","jt":"i","cmp":"darker","sup":"darkest"},{"w":"bright","lv":1,"ja":"明るい","jt":"i","cmp":"brighter","sup":"brightest"},{"w":"loud","lv":3,"ja":"うるさい","jt":"i","cmp":"louder","sup":"loudest"},{"w":"sweet","lv":1,"ja":"あまい","jt":"i","cmp":"sweeter","sup":"sweetest"},{"w":"spicy","lv":3,"ja":"からい","jt":"i","cmp":"spicier","sup":"spiciest"},{"w":"delicious","lv":1,"ja":"おいしい","jt":"i","more":1},{"w":"wonderful","lv":1,"ja":"すばらしい","jt":"i","more":1},{"w":"great","lv":1,"ja":"すごい","jt":"i","cmp":"greater","sup":"greatest"},{"w":"nice","lv":1,"ja":"すてき","jt":"na","cmp":"nicer","sup":"nicest"},{"w":"pretty","lv":1,"ja":"かわいい","jt":"i","cmp":"prettier","sup":"prettiest"},{"w":"careful","lv":1,"ja":"注意深い","jt":"i","more":1},{"w":"safe","lv":2,"ja":"安全","jt":"na","cmp":"safer","sup":"safest"},{"w":"dangerous","lv":2,"ja":"危険","jt":"na","more":1},{"w":"sure","lv":1,"ja":"確か","jt":"na","cmp":"surer","sup":"surest"},{"w":"wrong","lv":1,"ja":"まちがい","jt":"na","cmp":"wronger","sup":"wrongest"},{"w":"right","lv":1,"ja":"正しい","jt":"i","cmp":"righter","sup":"rightest"},{"w":"different","lv":1,"ja":"ちがう","jt":"na","more":1},{"w":"same","lv":1,"ja":"同じ","jt":"na","cmp":"samer","sup":"samest"},{"w":"special","lv":1,"ja":"特別","jt":"na","more":1},{"w":"perfect","lv":2,"ja":"完ぺき","jt":"na","more":1},{"w":"lucky","lv":1,"ja":"運がいい","jt":"i","cmp":"luckier","sup":"luckiest"},{"w":"unlucky","lv":3,"ja":"運が悪い","jt":"i","cmp":"unluckier","sup":"unluckiest"},{"w":"glad","lv":1,"ja":"うれしい","jt":"i","cmp":"gladder","sup":"gladdest"},{"w":"sorry","lv":1,"ja":"申し訳ない","jt":"i","cmp":"sorrier","sup":"sorriest"},{"w":"nervous","lv":2,"ja":"緊張している","jt":"raw","more":1},{"w":"worried","lv":2,"ja":"心配している","jt":"raw","more":1},{"w":"relaxed","lv":2,"ja":"リラックスしている","jt":"raw","more":1},{"w":"confident","lv":2,"ja":"自信たっぷり","jt":"na","more":1},{"w":"calm","lv":3,"ja":"落ち着いている","jt":"raw","cmp":"calmer","sup":"calmest"},{"w":"serious","lv":3,"ja":"まじめ","jt":"na","more":1},{"w":"honest","lv":3,"ja":"正直","jt":"na","more":1},{"w":"friendly","lv":4,"ja":"親しみやすい","jt":"i","cmp":"friendlier","sup":"friendliest"},{"w":"polite","lv":2,"ja":"礼儀正しい","jt":"i","more":1},{"w":"rude","lv":1,"ja":"失礼","jt":"na","cmp":"ruder","sup":"rudest"},{"w":"lazy","lv":1,"ja":"なまけもの","jt":"na","cmp":"lazier","sup":"laziest"},{"w":"active","lv":3,"ja":"活発","jt":"na","more":1},{"w":"gentle","lv":2,"ja":"おだやか","jt":"na","cmp":"gentler","sup":"gentlest"},{"w":"wise","lv":2,"ja":"かしこい","jt":"i","cmp":"wiser","sup":"wisest"},{"w":"clever","lv":1,"ja":"りこう","jt":"na","cmp":"cleverer","sup":"cleverest"},{"w":"silly","lv":2,"ja":"ばか","jt":"na","cmp":"sillier","sup":"silliest"},{"w":"crazy","lv":2,"ja":"むちゃくちゃ","jt":"na","cmp":"crazier","sup":"craziest"},{"w":"weak","lv":2,"ja":"弱い","jt":"i","cmp":"weaker","sup":"weakest"},{"w":"thin","lv":1,"ja":"細い","jt":"i","cmp":"thinner","sup":"thinnest"},{"w":"wet","lv":2,"ja":"ぬれている","jt":"raw","cmp":"wetter","sup":"wettest"},{"w":"dry","lv":1,"ja":"かわいている","jt":"raw","cmp":"drier","sup":"driest"},{"w":"empty","lv":2,"ja":"からっぽ","jt":"na","cmp":"emptier","sup":"emptiest"},{"w":"open","lv":1,"ja":"開いている","jt":"raw","cmp":"openner","sup":"opennest"},{"w":"closed","lv":1,"ja":"閉まっている","jt":"raw","cmp":"closeder","sup":"closedest"},{"w":"alone","lv":2,"ja":"ひとり","jt":"na","cmp":"aloner","sup":"alonest"},{"w":"amazing","lv":3,"ja":"すばらしい","jt":"i","more":1},{"w":"terrible","lv":1,"ja":"ひどい","jt":"i","more":1},{"w":"excellent","lv":1,"ja":"優秀","jt":"na","more":1},{"w":"curious","lv":3,"ja":"好奇心いっぱい","jt":"na","more":1},{"w":"jealous","lv":3,"ja":"うらやましい","jt":"i","more":1},{"w":"embarrassed","lv":3,"ja":"はずかしい","jt":"i","more":1},{"w":"grateful","lv":2,"ja":"感謝している","jt":"raw","more":1},{"w":"shocked","lv":3,"ja":"ショックを受けている","jt":"raw","more":1},{"w":"satisfied","lv":3,"ja":"満足している","jt":"raw","more":1},{"w":"disappointed","lv":2,"ja":"がっかりしている","jt":"raw","more":1},{"w":"cheerful","lv":3,"ja":"明るい","jt":"i","more":1},{"w":"patient","lv":3,"ja":"がまん強い","jt":"i","more":1},{"w":"generous","lv":3,"ja":"気前がいい","jt":"i","more":1},{"w":"creative","lv":2,"ja":"創造的","jt":"na","more":1},{"w":"talented","lv":3,"ja":"才能豊か","jt":"na","more":1},{"w":"modern","lv":2,"ja":"現代的","jt":"na","more":1},{"w":"traditional","lv":2,"ja":"伝統的","jt":"na","more":1},{"w":"black","lv":1,"ja":"黒い","jt":"i","cmp":"blacker","sup":"blackest"},{"w":"blue","lv":1,"ja":"青い","jt":"i","cmp":"bluer","sup":"bluest"},{"w":"brown","lv":1,"ja":"茶色い","jt":"i","cmp":"browner","sup":"brownest"},{"w":"gray","lv":1,"ja":"灰色","jt":"na","cmp":"grayer","sup":"grayest"},{"w":"green","lv":1,"ja":"緑","jt":"na","cmp":"greener","sup":"greenest"},{"w":"orange","lv":1,"ja":"オレンジ色","jt":"na","cmp":"oranger","sup":"orangest"},{"w":"pink","lv":1,"ja":"ピンク","jt":"na","cmp":"pinker","sup":"pinkest"},{"w":"red","lv":1,"ja":"赤い","jt":"i","cmp":"redder","sup":"reddest"},{"w":"white","lv":1,"ja":"白い","jt":"i","cmp":"whiter","sup":"whitest"},{"w":"yellow","lv":1,"ja":"黄色い","jt":"i","cmp":"yellower","sup":"yellowest"},{"w":"purple","lv":1,"ja":"むらさき","jt":"na","cmp":"purpler","sup":"purplest"},{"w":"afraid","lv":1,"ja":"こわがっている","jt":"raw","no":1},{"w":"awake","lv":1,"ja":"起きている","jt":"raw","no":1},{"w":"broken","lv":1,"ja":"こわれている","jt":"raw","no":1},{"w":"cloudy","lv":1,"ja":"くもり","jt":"na","cmp":"cloudier","sup":"cloudiest"},{"w":"correct","lv":1,"ja":"正しい","jt":"i","no":1},{"w":"exciting","lv":1,"ja":"わくわくする","jt":"v","more":1},{"w":"fair","lv":1,"ja":"公平","jt":"na","no":1},{"w":"false","lv":1,"ja":"まちがい","jt":"na","no":1},{"w":"foggy","lv":1,"ja":"霧が深い","jt":"i","cmp":"foggier","sup":"foggiest"},{"w":"fun","lv":1,"ja":"楽しい","jt":"i","more":1},{"w":"handsome","lv":1,"ja":"かっこいい","jt":"i","cmp":"handsomer","sup":"handsomest"},{"w":"hard","lv":1,"ja":"大変","jt":"na","cmp":"harder","sup":"hardest"},{"w":"high","lv":1,"ja":"高い","jt":"i","cmp":"higher","sup":"highest"},{"w":"interested","lv":1,"ja":"興味がある","jt":"raw","more":1},{"w":"large","lv":1,"ja":"大きい","jt":"i","cmp":"larger","sup":"largest"},{"w":"little","lv":1,"ja":"小さい","jt":"i","cmp":"littler","sup":"littlest"},{"w":"lovely","lv":1,"ja":"すてき","jt":"na","more":1},{"w":"poor","lv":1,"ja":"貧しい","jt":"i","cmp":"poorer","sup":"poorest"},{"w":"rainy","lv":1,"ja":"雨","jt":"na","cmp":"rainier","sup":"rainiest"},{"w":"real","lv":1,"ja":"本物","jt":"na","no":1},{"w":"snowy","lv":1,"ja":"雪","jt":"na","cmp":"snowier","sup":"snowiest"},{"w":"strange","lv":1,"ja":"変","jt":"na","cmp":"stranger","sup":"strangest"},{"w":"strict","lv":1,"ja":"きびしい","jt":"i","cmp":"stricter","sup":"strictest"},{"w":"successful","lv":1,"ja":"成功している","jt":"raw","more":1},{"w":"sunny","lv":1,"ja":"晴れ","jt":"na","cmp":"sunnier","sup":"sunniest"},{"w":"super","lv":1,"ja":"最高","jt":"na","cmp":"superer","sup":"superest"},{"w":"thick","lv":1,"ja":"厚い","jt":"i","cmp":"thicker","sup":"thickest"},{"w":"tight","lv":1,"ja":"きつい","jt":"i","cmp":"tighter","sup":"tightest"},{"w":"true","lv":1,"ja":"本当","jt":"na","no":1},{"w":"ideal","lv":1,"ja":"理想的","jt":"na","no":1},{"w":"windy","lv":1,"ja":"風が強い","jt":"i","cmp":"windier","sup":"windiest"},{"w":"alive","lv":2,"ja":"生きている","jt":"raw","no":1},{"w":"ancient","lv":2,"ja":"古代の","jt":"na","no":1},{"w":"annoying","lv":2,"ja":"うっとうしい","jt":"i","more":1},{"w":"anxious","lv":2,"ja":"不安","jt":"na","more":1},{"w":"asleep","lv":2,"ja":"眠っている","jt":"raw","no":1},{"w":"attractive","lv":2,"ja":"魅力的","jt":"na","more":1},{"w":"awful","lv":2,"ja":"ひどい","jt":"i","more":1},{"w":"brilliant","lv":2,"ja":"すばらしい","jt":"i","more":1},{"w":"certain","lv":2,"ja":"確か","jt":"na","more":1},{"w":"clear","lv":2,"ja":"はっきりしている","jt":"raw","cmp":"clearer","sup":"clearest"},{"w":"colorful","lv":2,"ja":"色とりどり","jt":"na","more":1},{"w":"comfortable","lv":2,"ja":"心地よい","jt":"i","more":1},{"w":"common","lv":2,"ja":"よくある","jt":"raw","more":1},{"w":"confused","lv":2,"ja":"混乱している","jt":"raw","more":1},{"w":"convenient","lv":2,"ja":"便利","jt":"na","more":1},{"w":"crowded","lv":2,"ja":"混んでいる","jt":"raw","more":1},{"w":"dizzy","lv":2,"ja":"めまいがする","jt":"v","cmp":"dizzier","sup":"dizziest"},{"w":"early","lv":2,"ja":"早い","jt":"i","cmp":"earlier","sup":"earliest"},{"w":"embarrassing","lv":2,"ja":"はずかしい","jt":"i","more":1},{"w":"energetic","lv":2,"ja":"元気いっぱい","jt":"na","more":1},{"w":"enormous","lv":2,"ja":"巨大","jt":"na","more":1},{"w":"familiar","lv":2,"ja":"よく知っている","jt":"raw","more":1},{"w":"fancy","lv":2,"ja":"おしゃれ","jt":"na","cmp":"fancier","sup":"fanciest"},{"w":"fantastic","lv":2,"ja":"すばらしい","jt":"i","more":1},{"w":"fascinating","lv":2,"ja":"とても興味深い","jt":"i","more":1},{"w":"fit","lv":2,"ja":"元気","jt":"na","cmp":"fitter","sup":"fittest"},{"w":"fresh","lv":2,"ja":"新鮮","jt":"na","cmp":"fresher","sup":"freshest"},{"w":"frightened","lv":2,"ja":"おびえている","jt":"raw","more":1},{"w":"frightening","lv":2,"ja":"おそろしい","jt":"i","more":1},{"w":"golden","lv":2,"ja":"金色","jt":"na","no":1},{"w":"good-looking","lv":2,"ja":"かっこいい","jt":"i","more":1},{"w":"greedy","lv":2,"ja":"欲ばり","jt":"na","cmp":"greedier","sup":"greediest"},{"w":"helpful","lv":2,"ja":"役に立つ","jt":"v","more":1},{"w":"ill","lv":2,"ja":"病気","jt":"na","cmp":"iller","sup":"illest"},{"w":"illegal","lv":2,"ja":"違法","jt":"na","no":1},{"w":"impatient","lv":2,"ja":"せっかち","jt":"na","more":1},{"w":"impossible","lv":2,"ja":"不可能","jt":"na","no":1},{"w":"intelligent","lv":2,"ja":"頭がいい","jt":"i","more":1},{"w":"international","lv":2,"ja":"国際的","jt":"na","more":1},{"w":"lively","lv":2,"ja":"にぎやか","jt":"na","cmp":"livelier","sup":"liveliest"},{"w":"local","lv":2,"ja":"地元の","jt":"na","more":1},{"w":"lost","lv":2,"ja":"迷子","jt":"na","no":1},{"w":"low","lv":2,"ja":"低い","jt":"i","cmp":"lower","sup":"lowest"},{"w":"mad","lv":2,"ja":"怒っている","jt":"raw","cmp":"madder","sup":"maddest"},{"w":"married","lv":2,"ja":"結婚している","jt":"raw","no":1},{"w":"marvelous","lv":2,"ja":"すばらしい","jt":"i","more":1},{"w":"mean","lv":2,"ja":"意地悪","jt":"na","cmp":"meaner","sup":"meanest"},{"w":"missing","lv":2,"ja":"行方不明","jt":"na","no":1},{"w":"mysterious","lv":2,"ja":"なぞめいている","jt":"raw","more":1},{"w":"natural","lv":2,"ja":"自然","jt":"na","more":1},{"w":"necessary","lv":2,"ja":"必要","jt":"na","no":1},{"w":"noisy","lv":2,"ja":"うるさい","jt":"i","cmp":"noisier","sup":"noisiest"},{"w":"normal","lv":2,"ja":"ふつう","jt":"na","more":1},{"w":"organized","lv":2,"ja":"整理されている","jt":"raw","more":1},{"w":"original","lv":2,"ja":"独創的","jt":"na","more":1},{"w":"peaceful","lv":2,"ja":"平和","jt":"na","more":1},{"w":"pleasant","lv":2,"ja":"気持ちいい","jt":"i","more":1},{"w":"pleased","lv":2,"ja":"喜んでいる","jt":"raw","more":1},{"w":"possible","lv":2,"ja":"可能","jt":"na","no":1},{"w":"powerful","lv":2,"ja":"強力","jt":"na","more":1},{"w":"private","lv":2,"ja":"個人的","jt":"na","more":1},{"w":"professional","lv":2,"ja":"プロ","jt":"na","more":1},{"w":"quick","lv":2,"ja":"速い","jt":"i","cmp":"quicker","sup":"quickest"},{"w":"raw","lv":2,"ja":"生","jt":"na","no":1},{"w":"regular","lv":2,"ja":"いつもの","jt":"na","more":1},{"w":"romantic","lv":2,"ja":"ロマンチック","jt":"na","more":1},{"w":"similar","lv":2,"ja":"似ている","jt":"raw","more":1},{"w":"simple","lv":2,"ja":"かんたん","jt":"na","cmp":"simpler","sup":"simplest"},{"w":"single","lv":2,"ja":"独身","jt":"na","no":1},{"w":"slim","lv":2,"ja":"ほっそりしている","jt":"raw","cmp":"slimmer","sup":"slimmest"},{"w":"smooth","lv":2,"ja":"なめらか","jt":"na","cmp":"smoother","sup":"smoothest"},{"w":"soft","lv":2,"ja":"やわらかい","jt":"i","cmp":"softer","sup":"softest"},{"w":"straight","lv":2,"ja":"まっすぐ","jt":"na","cmp":"straighter","sup":"straightest"},{"w":"suitable","lv":2,"ja":"ぴったり","jt":"na","more":1},{"w":"surprising","lv":2,"ja":"おどろくべき","jt":"na","more":1},{"w":"tidy","lv":2,"ja":"きちんとしている","jt":"raw","cmp":"tidier","sup":"tidiest"},{"w":"uncomfortable","lv":2,"ja":"居心地が悪い","jt":"i","more":1},{"w":"unfair","lv":2,"ja":"不公平","jt":"na","more":1},{"w":"unforgettable","lv":2,"ja":"忘れられない","jt":"i","more":1},{"w":"unhappy","lv":2,"ja":"不幸せ","jt":"na","cmp":"unhappier","sup":"unhappiest"},{"w":"unhealthy","lv":2,"ja":"不健康","jt":"na","cmp":"unhealthier","sup":"unhealthiest"},{"w":"unknown","lv":2,"ja":"知られていない","jt":"i","no":1},{"w":"unnecessary","lv":2,"ja":"不必要","jt":"na","more":1},{"w":"unpleasant","lv":2,"ja":"いやな","jt":"na","more":1},{"w":"unusual","lv":2,"ja":"めずらしい","jt":"i","more":1},{"w":"upset","lv":2,"ja":"動揺している","jt":"raw","cmp":"upseter","sup":"upsetest"},{"w":"useful","lv":2,"ja":"役に立つ","jt":"v","more":1},{"w":"usual","lv":2,"ja":"いつもどおり","jt":"na","more":1},{"w":"well-known","lv":2,"ja":"よく知られている","jt":"raw","more":1},{"w":"wide","lv":2,"ja":"広い","jt":"i","cmp":"wider","sup":"widest"},{"w":"wild","lv":2,"ja":"野生","jt":"na","cmp":"wilder","sup":"wildest"},{"w":"wooden","lv":2,"ja":"木でできている","jt":"raw","no":1},{"w":"human","lv":2,"ja":"人間らしい","jt":"i","cmp":"humaner","sup":"humanest"},{"w":"electric","lv":2,"ja":"電気の","jt":"na","no":1},{"w":"magic","lv":2,"ja":"魔法の","jt":"na","no":1},{"w":"silver","lv":2,"ja":"銀色","jt":"na","no":1},{"w":"whole","lv":2,"ja":"まるごと","jt":"na","no":1}],"adv":[{"w":"here","k":"place","lv":1,"ja":"ここで"},{"w":"there","k":"place","lv":1,"ja":"あそこで"},{"w":"outside","k":"place","lv":4,"ja":"外で"},{"w":"inside","k":"place","lv":4,"ja":"中で"},{"w":"upstairs","k":"place","lv":3,"ja":"二階で"},{"w":"downstairs","k":"place","lv":2,"ja":"一階で"},{"w":"everywhere","k":"place","lv":1,"ja":"どこでも"},{"w":"abroad","k":"place","lv":2,"ja":"海外で"},{"w":"downtown","k":"place","lv":2,"ja":"街の中心で"},{"w":"somewhere","k":"place","lv":2,"ja":"どこかで"},{"w":"now","k":"time","ts":["prog","pres"],"lv":1,"ja":"今"},{"w":"today","k":"time","ts":["pres","prog","past","fut"],"lv":1,"ja":"今日"},{"w":"yesterday","k":"time","ts":["past"],"lv":1,"ja":"昨日"},{"w":"tonight","k":"time","ts":["fut","prog"],"lv":2,"ja":"今夜"},{"w":"tomorrow","k":"time","ts":["fut","prog"],"lv":1,"ja":"明日"},{"w":"soon","k":"time","ts":["fut","pres"],"lv":1,"ja":"もうすぐ"},{"w":"someday","k":"time","ts":["fut"],"lv":2,"ja":"いつか"},{"w":"later","k":"time","ts":["pres","past","fut"],"lv":1,"ja":"あとで"},{"w":"nowadays","k":"time","ts":["pres","prog"],"lv":2,"ja":"最近は"},{"w":"recently","k":"time","ts":["past"],"lv":2,"ja":"最近"},{"w":"fast","k":"manner","lv":1,"ja":"速く"},{"w":"slowly","k":"manner","lv":2,"ja":"ゆっくり"},{"w":"quietly","k":"manner","lv":2,"ja":"静かに"},{"w":"loudly","k":"manner","lv":2,"ja":"大きな声で"},{"w":"happily","k":"manner","lv":2,"ja":"楽しそうに"},{"w":"carefully","k":"manner","lv":1,"ja":"ていねいに"},{"w":"well","k":"manner","lv":1,"ja":"じょうずに"},{"w":"hard","k":"manner","lv":1,"ja":"いっしょうけんめい"},{"w":"again","k":"manner","lv":1,"ja":"もう一度"},{"w":"late","k":"manner","lv":1,"ja":"おそく"},{"w":"early","k":"manner","lv":1,"ja":"早く"},{"w":"nearby","k":"manner","lv":1,"ja":"近くで"},{"w":"together","k":"manner","lv":1,"ja":"いっしょに"},{"w":"quickly","k":"manner","lv":1,"ja":"すばやく"},{"w":"easily","k":"manner","lv":2,"ja":"かんたんに"},{"w":"softly","k":"manner","lv":2,"ja":"やさしく"},{"w":"politely","k":"manner","lv":3,"ja":"ていねいに"},{"w":"kindly","k":"manner","lv":3,"ja":"親切に"},{"w":"badly","k":"manner","lv":2,"ja":"下手に"},{"w":"perfectly","k":"manner","lv":2,"ja":"完ぺきに"},{"w":"safely","k":"manner","lv":3,"ja":"安全に"},{"w":"suddenly","k":"manner","lv":3,"ja":"突然"},{"w":"finally","k":"manner","lv":2,"ja":"ついに"},{"w":"alone","k":"manner","lv":1,"ja":"ひとりで"},{"w":"secretly","k":"manner","lv":3,"ja":"ひそかに"},{"w":"proudly","k":"manner","lv":4,"ja":"得意げに"},{"w":"angrily","k":"manner","lv":2,"ja":"怒って"},{"w":"sadly","k":"manner","lv":2,"ja":"悲しそうに"},{"w":"silently","k":"manner","lv":2,"ja":"だまって"},{"w":"patiently","k":"manner","lv":4,"ja":"がまん強く"},{"w":"bravely","k":"manner","lv":3,"ja":"勇敢に"},{"w":"gently","k":"manner","lv":4,"ja":"そっと"},{"w":"clearly","k":"manner","lv":2,"ja":"はっきりと"},{"w":"correctly","k":"manner","lv":2,"ja":"正しく"},{"w":"deeply","k":"manner","lv":2,"ja":"深く"},{"w":"differently","k":"manner","lv":2,"ja":"ちがうふうに"},{"w":"gradually","k":"manner","lv":2,"ja":"だんだん"},{"w":"seriously","k":"manner","lv":2,"ja":"真剣に"},{"w":"strongly","k":"manner","lv":2,"ja":"強く"},{"w":"successfully","k":"manner","lv":2,"ja":"うまく"},{"w":"fully","k":"manner","lv":2,"ja":"十分に"},{"w":"exactly","k":"manner","lv":2,"ja":"正確に"},{"w":"heavily","k":"manner","lv":2,"ja":"激しく"},{"w":"simply","k":"manner","lv":2,"ja":"かんたんに"},{"w":"widely","k":"manner","lv":2,"ja":"広く"},{"w":"far","k":"manner","lv":2,"ja":"遠くまで"},{"w":"online","k":"manner","lv":2,"ja":"オンラインで"},{"w":"home","k":"place","lv":1,"ja":"家へ"},{"w":"always","k":"freq","lv":1,"ja":"いつも"},{"w":"usually","k":"freq","lv":1,"ja":"ふだん"},{"w":"often","k":"freq","lv":1,"ja":"よく"},{"w":"sometimes","k":"freq","lv":1,"ja":"ときどき"},{"w":"never","k":"freq","lv":1,"ja":"一度も"}],"idiom":[{"w":"at home","k":"place","lv":2,"ja":"家で"},{"w":"at school","k":"place","lv":2,"ja":"学校で"},{"w":"in bed","k":"place","lv":2,"ja":"ベッドで"},{"w":"at my grandma's house","k":"place","lv":2,"ja":"おばあちゃんの家で"},{"w":"at a friend's house","k":"place","lv":2,"ja":"友だちの家で"},{"w":"in space","k":"place","lv":2,"ja":"宇宙で"},{"w":"at church","k":"place","lv":2,"ja":"教会で"},{"w":"in town","k":"place","lv":2,"ja":"町で"},{"w":"at college","k":"place","lv":2,"ja":"大学で"},{"w":"on campus","k":"place","lv":2,"ja":"キャンパスで"},{"w":"over there","k":"place","lv":2,"ja":"向こうで"},{"w":"next door","k":"place","lv":2,"ja":"となりで"},{"w":"all over the world","k":"place","lv":2,"ja":"世界じゅうで"},{"w":"out there","k":"place","lv":2,"ja":"世の中で"},{"w":"this morning","k":"time","ts":["past"],"lv":1,"ja":"今朝"},{"w":"next time","k":"time","ts":["fut","pres","prog"],"lv":1,"ja":"次は"},{"w":"last time","k":"time","ts":["past"],"lv":1,"ja":"前回は"},{"w":"last night","k":"time","ts":["past"],"lv":1,"ja":"昨夜"},{"w":"last week","k":"time","ts":["past"],"lv":1,"ja":"先週"},{"w":"two days ago","k":"time","ts":["past"],"lv":1,"ja":"2日前"},{"w":"just now","k":"time","ts":["past"],"lv":1,"ja":"さっき"},{"w":"next week","k":"time","ts":["fut","prog"],"lv":1,"ja":"来週"},{"w":"every day","k":"time","ts":["pres","past"],"lv":1,"ja":"毎日"},{"w":"every morning","k":"time","ts":["pres","past"],"lv":1,"ja":"毎朝"},{"w":"at seven","k":"time","ts":["pres","past","fut"],"lv":1,"ja":"7時に"},{"w":"for two hours","k":"time","ts":["past","fut"],"lv":1,"ja":"2時間"},{"w":"all day","k":"time","ts":["past","fut"],"lv":1,"ja":"一日じゅう"},{"w":"this afternoon","k":"time","ts":["past","pres","fut","prog"],"lv":1,"ja":"今日の午後"},{"w":"this evening","k":"time","ts":["past","fut","prog"],"lv":1,"ja":"今晩"},{"w":"this weekend","k":"time","ts":["past","fut","prog"],"lv":1,"ja":"今週末"},{"w":"next month","k":"time","ts":["fut","prog"],"lv":1,"ja":"来月"},{"w":"next year","k":"time","ts":["fut","prog"],"lv":1,"ja":"来年"},{"w":"last month","k":"time","ts":["past"],"lv":1,"ja":"先月"},{"w":"last year","k":"time","ts":["past"],"lv":1,"ja":"去年"},{"w":"three days ago","k":"time","ts":["past"],"lv":1,"ja":"3日前"},{"w":"a long time ago","k":"time","ts":["past"],"lv":1,"ja":"ずっと前"},{"w":"after lunch","k":"time","ts":["pres","past","fut"],"lv":1,"ja":"昼ごはんのあと"},{"w":"before dinner","k":"time","ts":["pres","past","fut"],"lv":1,"ja":"夕ごはんの前"},{"w":"every week","k":"time","ts":["pres","past"],"lv":1,"ja":"毎週"},{"w":"every night","k":"time","ts":["pres","past"],"lv":1,"ja":"毎晩"},{"w":"every Sunday","k":"time","ts":["pres","past"],"lv":1,"ja":"毎週日曜日"},{"w":"on weekends","k":"time","ts":["pres","past","fut"],"lv":4,"ja":"週末に"},{"w":"right away","k":"time","ts":["fut","past"],"lv":1,"ja":"すぐに"},{"w":"for a long time","k":"time","ts":["past"],"lv":1,"ja":"長い間"},{"w":"for a week","k":"time","ts":["past","fut"],"lv":1,"ja":"1週間"},{"w":"at midday","k":"time","ts":["pres","past","fut"],"lv":2,"ja":"正午に"},{"w":"on weekdays","k":"time","ts":["pres","past"],"lv":2,"ja":"平日に"},{"w":"right now","k":"time","ts":["prog","fut","pres"],"lv":1,"ja":"今すぐ"},{"w":"at the moment","k":"time","ts":["prog","pres"],"lv":1,"ja":"今のところ"},{"w":"all the time","k":"time","ts":["pres","past","prog"],"lv":1,"ja":"いつも"},{"w":"the other day","k":"time","ts":["past"],"lv":1,"ja":"先日"},{"w":"long ago","k":"time","ts":["past"],"lv":1,"ja":"ずっと昔"},{"w":"by now","k":"time","ts":["pres"],"lv":1,"ja":"今ごろは"},{"w":"at the time","k":"time","ts":["past"],"lv":1,"ja":"その時"},{"w":"at the same time","k":"time","ts":["pres","past","fut","prog"],"lv":1,"ja":"同時に"},{"w":"these days","k":"time","ts":["pres","prog"],"lv":1,"ja":"最近"},{"w":"in the meantime","k":"time","ts":["pres","past","fut"],"lv":1,"ja":"そのあいだに"},{"w":"in time","k":"other","lv":2,"ja":"間に合うように"},{"w":"on time","k":"other","lv":2,"ja":"時間どおりに"},{"w":"a lot","k":"other","lv":2,"ja":"たくさん"},{"w":"close by","k":"other","lv":2,"ja":"近くで"},{"w":"in the dark","k":"other","lv":2,"ja":"くらやみで"},{"w":"as usual","k":"other","lv":2,"ja":"いつものように"},{"w":"at once","k":"other","lv":2,"ja":"すぐに"},{"w":"Well","k":"front","lv":1,"ja":"ええと"},{"w":"Oh","k":"front","lv":1,"ja":"あっ"},{"w":"Okay","k":"front","lv":1,"ja":"オーケー"},{"w":"So","k":"front","lv":1,"ja":"それで"},{"w":"Anyway","k":"front","lv":1,"ja":"とにかく"},{"w":"Honestly","k":"front","lv":1,"ja":"正直"},{"w":"Basically","k":"front","lv":1,"ja":"要するに"},{"w":"Whoa","k":"front","lv":1,"ja":"おおっ"},{"w":"Wow","k":"front","lv":1,"ja":"わあ"},{"w":"Really","k":"front","lv":1,"ja":"本当に"},{"w":"Sure","k":"front","lv":1,"ja":"もちろん"},{"w":"Hmm","k":"front","lv":1,"ja":"うーん"},{"w":"Of course","k":"front","lv":1,"ja":"もちろん"},{"w":"By the way","k":"front","lv":1,"ja":"ところで"},{"w":"You know","k":"front","lv":1,"ja":"ほら"},{"w":"I mean","k":"front","lv":1,"ja":"つまり"},{"w":"Actually","k":"front","lv":1,"ja":"実は"},{"w":"In my opinion","k":"front","lv":1,"ja":"わたしの考えでは"},{"w":"To tell the truth","k":"front","lv":1,"ja":"実を言うと"},{"w":"Luckily","k":"front","lv":1,"ja":"運よく"},{"w":"Sadly","k":"front","lv":1,"ja":"残念ながら"},{"w":"Maybe","k":"front","lv":1,"ja":"たぶん"},{"w":"Surprisingly","k":"front","lv":1,"ja":"おどろいたことに"},{"w":"Hopefully","k":"front","lv":1,"ja":"うまくいけば"},{"w":"Seriously","k":"front","lv":2,"ja":"マジで"},{"w":"Guess what?","k":"front","lv":2,"ja":"ねえ聞いて"},{"w":"Believe it or not","k":"front","lv":2,"ja":"信じられないかもだけど"},{"w":"To be honest","k":"front","lv":2,"ja":"正直に言うと"},{"w":"However","k":"front","lv":1,"ja":"しかし"},{"w":"First of all","k":"front","lv":3,"ja":"まず第一に"},{"w":"In fact","k":"front","lv":3,"ja":"実際"},{"w":"In other words","k":"front","lv":3,"ja":"言いかえると"},{"w":"As usual","k":"front","lv":3,"ja":"いつものように"},{"w":"As far as I know","k":"front","lv":3,"ja":"わたしの知るかぎりでは"},{"w":"As far as I can tell","k":"front","lv":3,"ja":"わたしの見るかぎりでは"},{"w":"As far as I can see","k":"front","lv":3,"ja":"わたしの見るかぎりでは"},{"w":"To the best of my knowledge","k":"front","lv":3,"ja":"わたしの知るかぎりでは"},{"w":"At least","k":"front","lv":3,"ja":"少なくとも"},{"w":"No wonder","k":"front","lv":3,"ja":"どうりで"},{"w":"But then again","k":"front","lv":3,"ja":"でもまた一方で"},{"w":"You see","k":"front","lv":3,"ja":"ほらね"},{"w":"Oh well","k":"front","lv":3,"ja":"まあいいか"},{"w":"Most likely","k":"front","lv":3,"ja":"たぶん"},{"w":"After all","k":"front","lv":3,"ja":"結局のところ"},{"w":"As a result","k":"front","lv":3,"ja":"その結果"},{"w":"For instance","k":"front","lv":3,"ja":"たとえば"},{"w":"On the other hand","k":"front","lv":3,"ja":"一方で"},{"w":"No doubt","k":"front","lv":3,"ja":"まちがいなく"},{"w":"a lot of","k":"quant","lv":1,"ja":"たくさんの","q":"p"},{"w":"lots of","k":"quant","lv":2,"ja":"たくさんの","q":"p"},{"w":"a few","k":"quant","lv":2,"ja":"いくつかの","q":"p"},{"w":"a cup of","k":"quant","lv":2,"ja":"1杯の","q":"u"},{"w":"a glass of","k":"quant","lv":2,"ja":"グラス1杯の","q":"u"},{"w":"a piece of","k":"quant","lv":3,"ja":"1切れの","q":"u"},{"w":"a bottle of","k":"quant","lv":3,"ja":"1本の","q":"u"}]};

/* ===== FILE: dict.js ===== */
/* ===== dict.js:辞書アダプタと語形変化 =====
 辞書アダプタの約束(差し替え用):
   getWords({pos, tag, maxLevel, count, rnd, exclude}) → 辞書エントリの配列
   all(pos) → その品詞の全エントリ
 pos: 'noun' | 'verb' | 'adj' | 'adv' | 'idiom'。エントリの形は README の「辞書スキーマ」を参照。 */
var Dict = (function () {
  'use strict';
  function makeDefault(data) {
    data = data || DICT_DATA;
    var idx = {};
    Object.keys(data).forEach(function (pos) { idx[pos] = data[pos].filter(function (e) { return e && e.w; }); });
    function match(e, o) {
      if (o.maxLevel && (e.lv || 1) > o.maxLevel) return false;
      if (o.minLevel && (e.lv || 1) < o.minLevel) return false;
      if (o.tag) {
        var t = o.tag;
        if (t.cat && e.cat !== t.cat) return false;
        if (t.notCat && t.notCat.indexOf(e.cat) >= 0) return false;
        if (t.k && (Array.isArray(t.k) ? t.k.indexOf(e.k) < 0 : e.k !== t.k)) return false;
        if (t.c && t.c.indexOf(e.c) < 0) return false;
        if (t.fr && t.fr.indexOf(e.fr) < 0) return false;
        if (t.simple && (e.tail)) return false;
        if (t.cv && !e.cv) return false;
        if (t.link && !e.link) return false;
      }
      if (o.exclude && o.exclude.has(e.w)) return false;
      return true;
    }
    return {
      getWords: function (o) {
        o = o || {};
        var list = (idx[o.pos] || []).filter(function (e) { return match(e, o); });
        var r = o.rnd || Math.random, n = o.count || 1, out = [];
        if (!list.length) return out;
        // 低いレベルほど少し出やすくする
        for (var tries = 0; out.length < n && tries < n * 30; tries++) {
          var a = list[Math.floor(r() * list.length)], b = list[Math.floor(r() * list.length)];
          var e = (a.lv || 1) <= (b.lv || 1) ? a : b;
          if (out.indexOf(e) < 0) out.push(e);
        }
        return out;
      },
      all: function (pos) { return (idx[pos] || []).slice(); }
    };
  }
  function validate(ad) {
    if (!ad || typeof ad.getWords !== 'function' || typeof ad.all !== 'function') throw new Error('PuniChunk: 辞書アダプタには getWords と all が必要です');
    return ad;
  }

  // ---------- 語形変化 ----------
  var IRR_PL = { child: 'children', man: 'men', woman: 'women', mouse: 'mice', sheep: 'sheep', fish: 'fish', person: 'people', foot: 'feet', tooth: 'teeth', goose: 'geese', knife: 'knives', leaf: 'leaves', wife: 'wives', life: 'lives', half: 'halves', wolf: 'wolves', shelf: 'shelves', potato: 'potatoes', tomato: 'tomatoes', hero: 'heroes', deer: 'deer', ox: 'oxen', policeman: 'policemen', fireman: 'firemen', salmon: 'salmon', piano: 'pianos', photo: 'photos', radio: 'radios', zoo: 'zoos', kangaroo: 'kangaroos', video: 'videos' };
  function plural(w) {
    var sp = w.lastIndexOf(' ');
    if (sp > 0) return w.slice(0, sp + 1) + plural(w.slice(sp + 1));
    var lw = w.toLowerCase();
    if (IRR_PL[lw]) return IRR_PL[lw];
    var m = /(child|man|woman|mouse|foot|tooth|person)$/.exec(lw); if (m && lw !== m[1]) return w.slice(0, -m[1].length) + IRR_PL[m[1]];
    if (/(s|x|z|ch|sh)$/.test(lw)) return w + 'es';
    if (/[^aeiou]y$/.test(lw)) return w.slice(0, -1) + 'ies';
    if (/[^aeiou]o$/.test(lw)) return w + 'es';
    return w + 's';
  }
  function head(v) { return v.b || v.w.split(' ')[0]; }
  function tailOf(v) { var t = v.tail || (v.w.indexOf(' ') > 0 && v.w.split(' ').slice(1).join(' ')) || ''; return t ? ' ' + t : ''; }
  function s3(v) {
    var b = head(v); if (v.s3) return v.s3 + tailOf(v);
    var x;
    if (b === 'have') x = 'has'; else if (b === 'be') x = 'is';
    else if (/(s|x|z|ch|sh|o)$/.test(b)) x = b + 'es';
    else if (/[^aeiou]y$/.test(b)) x = b.slice(0, -1) + 'ies';
    else x = b + 's';
    return x + tailOf(v);
  }
  function regEd(b, dbl) {
    if (/e$/.test(b)) return b + 'd';
    if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ied';
    if (dbl && /[^aeiou][aeiou][bdgklmnprtv]$/.test(b)) return b + b.slice(-1) + 'ed';
    return b + 'ed';
  }
  function past(v) { return (v.past || regEd(head(v), v.dbl)) + tailOf(v); }
  function pp(v) { return (v.pp || v.past || regEd(head(v), v.dbl)) + tailOf(v); }
  function ingOf(b, dbl) {
    if (b === 'be') return 'being'; if (b === 'see') return 'seeing';
    if (/ie$/.test(b)) return b.slice(0, -2) + 'ying';
    if (/[^aeiouy]e$/.test(b) && !/(ee|ye|oe)$/.test(b)) return b.slice(0, -1) + 'ing';
    if (dbl && /[^aeiou][aeiou][bdgklmnprtv]$/.test(b)) return b + b.slice(-1) + 'ing';
    return b + 'ing';
  }
  function ing(v) { return ingOf(head(v), v.dbl) + tailOf(v); }
  function base(v) { return head(v) + tailOf(v); }
  function comp(a) { return a.cmp || 'more ' + a.w; }
  function sup(a) { return a.sup || 'most ' + a.w; }
  function an(next) {
    var w = String(next || '').toLowerCase();
    if (/^(hour|honest|honor|heir)/.test(w)) return 'an';
    if (/^(uni|use|usu|uti|euro|one|once|u[^aeiou][aeiou])/.test(w)) return 'a';
    return /^[aeiou]/.test(w) ? 'an' : 'a';
  }
  return { makeDefault: makeDefault, validate: validate, plural: plural, s3: s3, past: past, pp: pp, ing: ing, base: base, comp: comp, sup: sup, an: an, head: head };
})();

/* ===== FILE: grammar.js ===== */
/* ===== grammar.js:判定エンジン(DOMに依存しない純粋関数) =====
 単語トークン: {k, e?, v?, f?, pl?}
   k: n 名詞 / pr 顔(代名詞) / det 冠詞 / q 数量 / adj / deg 程度 / er -er,-est / prep / modal / not / be / v 動詞 / adv / ti to,ing / idm 慣用句 / conj
 チャンク: {t:'NP'|'VP'|'AP'|'PP'|'NF'|'ADV'|'ID'|'CONJ'|'CL', words:[...], ...}
 cfg.auto: {art, prep, verb, ti, er} … true=自動(間違いを自動で直す)/false=手動(判定する) */
var G = (function () {
  'use strict';
  var PRON = {
    i: { sub: 'I', obj: 'me', pos: 'my', p: 1, pl: 0, ja: 'わたし' }, you: { sub: 'you', obj: 'you', pos: 'your', p: 2, pl: 0, ja: 'あなた' },
    he: { sub: 'he', obj: 'him', pos: 'his', p: 3, pl: 0, ja: 'かれ' }, she: { sub: 'she', obj: 'her', pos: 'her', p: 3, pl: 0, ja: 'かのじょ' },
    it: { sub: 'it', obj: 'it', pos: 'its', p: 3, pl: 0, ja: 'それ' }, we: { sub: 'we', obj: 'us', pos: 'our', p: 1, pl: 1, ja: 'わたしたち' },
    they: { sub: 'they', obj: 'them', pos: 'their', p: 3, pl: 1, ja: 'かれら' }, youpl: { sub: 'you', obj: 'you', pos: 'your', p: 2, pl: 1, ja: 'あなたたち' }
  };
  var PRON_C1 = ['i', 'you', 'he', 'she', 'it'], PRON_C2 = ['we', 'they', 'youpl'];
  var PREP_G = [['at', 'on', 'in'], ['to', 'from', 'into'], ['with', 'for', 'about', 'by'], ['under', 'near', 'behind']];
  var PREP_GROUP = {}; PREP_G.forEach(function (g, i) { g.forEach(function (p) { PREP_GROUP[p] = i; }); });
  var MODAL_CYCLE = { can: 'could', could: 'can', will: 'would', would: 'will', may: 'might', might: 'may', must: 'must', should: 'should' };
  var MODAL_PAST = { could: 1, would: 1, might: 1 };
  var MODAL_TO_PAST = { can: 'could', will: 'would', may: 'might' };
  var MODALS = ['can', 'will', 'may', 'must', 'should'];
  // 助動詞の仲間(1つのバブル)。主語・時制で形が変わる
  var SEMI = { 'want to': { b: 'want', past: 'wanted', ja: '〜したい' }, 'have to': { b: 'have', past: 'had', s3: 'has', ja: '〜しなければ' }, 'need to': { b: 'need', past: 'needed', ja: '〜する必要がある' }, 'be going to': { be: 1, ja: '〜するつもり' }, 'used to': { only: 'past', ja: 'よく〜した' }, 'would like to': { fixed: 1, ja: '〜したい' } };
  var SEMIS = Object.keys(SEMI);
  var NEG = { can: "can't", could: "couldn't", will: "won't", would: "wouldn't", should: "shouldn't", must: "mustn't", may: 'may not', might: 'might not', do: "don't", does: "doesn't", did: "didn't", is: "isn't", are: "aren't", was: "wasn't", were: "weren't", am: 'am not', have: "haven't", has: "hasn't", had: "hadn't" };
  function negOf(x) { return NEG[x] || x + ' not'; }
  var TP_LABEL = { past: '過去', fut: '未来', prog: '進行' }, TP_CYCLE = ['past', 'fut', 'prog'];
  var DEGS = ['very', 'really', 'so', 'too'];
  var CONJ_SUB = ['when', 'if', 'because', 'before', 'after', 'while'], CONJ_CO = ['and', 'but', 'so'];
  var QUANTS = ['some', 'many', 'two', 'three', 'every'];
  var QINFO = { some: { pl: 1, u: 1 }, many: { pl: 1 }, two: { pl: 1 }, three: { pl: 1 }, every: { sg: 1 }, 'a few': { pl: 1 }, 'a lot of': { pl: 1, u: 1 }, 'lots of': { pl: 1, u: 1 } };
  var JA_P = { at: 'で', in: 'で', on: 'の上で', to: 'へ', from: 'から', into: 'の中へ', with: 'と', for: 'のために', about: 'について', by: 'のそばで', under: 'の下で', near: 'の近くで', behind: 'の後ろで' };

  function qinfo(w) { if (w.k !== 'q') return null; if (QINFO[w.v]) return QINFO[w.v]; if (w.e && w.e.q === 'u') return { u: 1, uonly: 1 }; return { pl: 1, u: 1 }; }
  function codeOf(w) {
    switch (w.k) {
      case 'det': return 'D'; case 'q': return 'Q'; case 'pr': return 'P'; case 'adj': return 'A'; case 'deg': return 'G'; case 'er': return 'E';
      case 'n': return 'N'; case 'prep': return 'R'; case 'modal': case 'sm': return 'M'; case 'tp': return 'K'; case 'not': return 'T'; case 'be': return 'B'; case 'hv': return 'H'; case 'v': return 'V';
      case 'ti': return 'I'; case 'adv': return w.e.k === 'freq' ? 'F' : w.e.k === 'manner' ? 'Y' : 'S';
      case 'idm': return 'O'; case 'conj': return 'C';
    }
    return '?';
  }

  // ---------- 連鎖のパターン ----------
  function modsCheck(c) { // G/A/E の並び:{ok:途中としてOK, full:完結}
    var i = 0, n = c.length;
    while (i < n) {
      var g = 0; while (i < n && c[i] === 'G') { g++; i++; }
      if (i === n) return { ok: true, full: g === 0 };
      if (c[i] === 'E') { i++; if (i === n) return { ok: true, full: false }; if (c[i] !== 'A') return { ok: false }; i++; continue; }
      if (c[i] === 'A') { i++; if (i < n && c[i] === 'E') i++; continue; }
      return { ok: false };
    }
    return { ok: true, full: true };
  }
  function only(c, set) { for (var i = 0; i < c.length; i++) if (set.indexOf(c[i]) < 0) return false; return true; }
  function mNP(c) {
    var lead = c.length && 'DQP'.indexOf(c[0]) >= 0 ? 1 : 0, r = c.slice(lead);
    var ni = r.indexOf('N');
    if (ni < 0) { if (!only(r, 'GAE')) return { full: false, pre: false }; var m = modsCheck(r); return { full: false, pre: m.ok }; }
    if (ni !== r.length - 1) return { full: false, pre: false };
    var mods = r.slice(0, -1); if (!only(mods, 'GAE')) return { full: false, pre: false };
    var mm = modsCheck(mods); return { full: mm.full, pre: mm.full };
  }
  function mNPP(c) { if (!c.length || c.length > 2 || !only(c, 'P')) return { full: false, pre: false }; return { full: true, pre: c.length === 1 }; }
  function mPP(c) {
    if (c[0] !== 'R') return { full: false, pre: false }; if (c.length === 1) return { full: false, pre: true };
    var r = c.slice(1), a = mNP(r), b = r.length === 1 && r[0] === 'P' ? { full: true, pre: false } : { full: false, pre: false };
    return { full: a.full || b.full, pre: a.pre || b.pre };
  }
  function advRun(c) { // (G* Y)* のチェック
    var i = 0; while (i < c.length) { while (i < c.length && c[i] === 'G') i++; if (i === c.length) return { ok: true, full: false }; if (c[i] !== 'Y') return { ok: false }; i++; }
    return { ok: true, full: true };
  }
  var VP_ST = 'TMTHTBTFV'; // not は助動詞の前でも後でもよい(表示は自動で並べ直す)
  function mVP(c) { // 時制パーツ K は動詞の直前か直後に1つだけ。助動詞・be とは一緒に使えない
    var ki = c.indexOf('K');
    if (ki < 0) return mVPcore(c);
    if (c.lastIndexOf('K') !== ki) return { full: false, pre: false };
    var rest = c.slice(0, ki).concat(c.slice(ki + 1));
    if (rest.indexOf('M') >= 0 || rest.indexOf('B') >= 0) return { full: false, pre: false };
    var vi = c.indexOf('V'), r = mVPcore(rest);
    if (vi < 0) return { full: false, pre: r.pre && ki === c.length - 1 };
    if (Math.abs(vi - ki) !== 1) return { full: false, pre: false };
    return r;
  }
  function mVPcore(c) {
    var st = 0, hasT = 0, h = {}, i;
    for (i = 0; i < c.length; i++) {
      var x = c[i];
      if (x === 'Y' || x === 'G') break;
      var s = -1; for (var k = st; k < VP_ST.length; k++) if (VP_ST[k] === x) { s = k; break; }
      if (s < 0) return { full: false, pre: false };
      if (x === 'T') { if (hasT) return { full: false, pre: false }; hasT = 1; }
      h[x] = 1; st = s + 1;
    }
    var tail = c.slice(i), adv = tail.length ? advRun(tail) : { ok: true, full: true };
    if (!adv.ok) return { full: false, pre: false };
    if (tail.length && !h.V) return { full: false, pre: false };
    var core = h.V || h.B;
    return { full: !!core && adv.full, pre: true };
  }
  function mNF(c) {
    if (c[0] === 'I') {
      if (c.length === 1) return { full: false, pre: true }; if (c[1] !== 'V') return { full: false, pre: false };
      var t = c.slice(2); if (!t.length) return { full: true, pre: true }; var a = advRun(t); return { full: a.ok && a.full, pre: a.ok };
    }
    if (c[0] === 'V') { if (c.length === 1) return { full: false, pre: true }; if (c.length === 2 && c[1] === 'I') return { full: true, pre: false }; }
    return { full: false, pre: false };
  }
  function mAP(c) {
    if (!c.length || !only(c, 'GAE')) return { full: false, pre: false };
    var na = c.filter(function (x) { return x === 'A'; }).length, ne = c.filter(function (x) { return x === 'E'; }).length;
    if (na > 1 || ne > 1) return { full: false, pre: false };
    var m = modsCheck(c); return { full: m.full && na === 1, pre: m.ok };
  }
  function mADV(c) { if (c.length === 1 && c[0] === 'S') return { full: true, pre: false }; if (!only(c, 'GY')) return { full: false, pre: false }; var y = c.indexOf('Y'); if (y >= 0 && y !== c.length - 1) return { full: false, pre: false }; return { full: y === c.length - 1 && c.length > 0, pre: true }; }
  function mOne(code) { return function (c) { return { full: c.length === 1 && c[0] === code, pre: false }; }; }
  var TYPES = [['PP', mPP], ['NP', mNP], ['NPP', mNPP], ['NF', mNF], ['VP', mVP], ['AP', mAP], ['ADV', mADV], ['ID', mOne('O')], ['CONJ', mOne('C')]];
  var ALLCODES = 'DQPAGENRMTBFVYISOCKH';
  function scan(codes) { var full = null, pre = false; for (var i = 0; i < TYPES.length; i++) { var r = TYPES[i][1](codes); if (r.full && !full) full = TYPES[i][0]; if (r.pre) pre = true; } return { full: full, pre: pre }; }

  // ---------- 連鎖の状態 ----------
  function chainState(words, cfg) {
    var codes = words.map(codeOf), s = scan(codes);
    var res = { complete: !!s.full, prefix: s.pre || !!s.full, closed: false, type: s.full, chunk: null, err: null };
    if (s.full) {
      var closed = true;
      for (var i = 0; i < ALLCODES.length && closed; i++) { var x = scan(codes.concat([ALLCODES[i]])); if (x.pre || x.full) closed = false; }
      res.closed = closed;
      var b = build(s.full, words, cfg); res.chunk = b.chunk; res.err = b.err;
    }
    return res;
  }
  function canAppend(words, w) { var s = scan(words.concat([w]).map(codeOf)); return s.pre || !!s.full; }

  // ---------- チャンクの組み立て(自動補正と手動判定) ----------
  function E_(code, a) { return { code: code, msg: MSG[code](a || {}) }; }
  var MSG = {
    needDet: function (a) { return '「' + a.n + '」の前に a か the を付けよう'; },
    aBad: function (a) { return '「' + a.n + '」に a は付かない(数えない名詞・複数形)'; },
    properDet: function (a) { return '「' + a.n + '」には冠詞が付かない'; },
    needThe: function (a) { return '「' + a.n + '」には the を付けよう'; },
    qBad: function (a) { return '「' + a.q + '」と「' + a.n + '」は合わない'; },
    supThe: function () { return '最上級(-est)には the を付けよう'; },
    noCmp: function (a) { return '「' + a.a + '」は -er / -est にできない'; },
    prepTime: function (a) { return '「' + a.n + '」には ' + a.p + ' を使おう'; },
    prepPlace: function (a) { return '「' + a.n + '」には ' + a.p + ' が自然'; },
    modalBase: function (a) { return a.m + ' の後ろは動詞の原形'; },
    havePP: function () { return 'have の後ろは過去分詞(eaten など)'; },
    beForm: function () { return 'be の後ろは -ing か過去分詞'; },
    needBe: function () { return '-ing や過去分詞だけでは動詞にならない(be が必要)'; },
    passiveIntr: function (a) { return '「' + a.v + '」は受け身(be+過去分詞)にできない'; },
    tense: function (a) { return '「' + a.t + '」は' + a.w + 'のこと。時制を合わせよう'; },
    cv: function (a) { return '「' + a.v + '」の後ろは ' + a.f + ' の形'; },
    purposeTo: function () { return '「〜するために」は to + 動詞'; },
    intrObj: function (a) { return '「' + a.v + '」は目的語(何を)をとらない'; },
    needObj: function (a) { return '「' + a.v + '」の後ろに「何を」が足りない'; },
    needSubj: function () { return '主語(だれが・何が)が足りない'; },
    needVerb: function () { return '動詞(する)が足りない'; },
    needComp: function () { return 'be の後ろに「どんな・何」が足りない'; },
    dupTime: function () { return '時を表す言葉が2つある'; },
    dupPlace: function () { return '場所を表す言葉が2つある'; },
    order: function () { return '語順か役割がちがう'; },
    chain: function (a) { return '「' + a.t + '」だけではチャンクにならない'; }
  };
  function nounOf(w) { return w.e; }
  function isCount(e) { return e.c === 'c' || e.c === 't'; }
  function buildMods(ws, cfg, errs) {
    var mods = [], degs = [], pendingE = null, last = null;
    ws.forEach(function (w) {
      if (w.k === 'deg') { degs.push(w.v); last = null; }
      else if (w.k === 'er') { if (last && !last.er) last.er = w.v || 'er'; else pendingE = w.v || 'er'; last = null; }
      else if (w.k === 'adj') { last = { deg: degs, adj: w.e, er: pendingE }; mods.push(last); degs = []; pendingE = null; }
    });
    mods.forEach(function (m) { if (m.er && m.adj.no) errs.push(E_('noCmp', { a: m.adj.w })); });
    return mods;
  }
  function buildNP(ws, cfg, errs, inPP) {
    if (ws.every(function (w) { return w.k === 'pr'; })) {
      var pr = ws[0].v; if (ws.length === 2) pr = mergePron(ws[0].v, ws[1].v);
      return { t: 'NP', pron: pr, merged: ws.length === 2, words: ws };
    }
    var lead = 'DQP'.indexOf(codeOf(ws[0])) >= 0 ? ws[0] : null, nw = ws[ws.length - 1], e = nounOf(nw);
    var mods = buildMods(ws.slice(lead ? 1 : 0, -1), cfg, errs);
    var np = { t: 'NP', words: ws, noun: e, mods: mods, det: null, quant: null, poss: null, num: 'sg' };
    if (e.c === 'p') np.num = 'pl'; else if (isCount(e) && !e.ind && nw.pl) np.num = 'pl';
    var auto = cfg.auto.art, nm = e.w;
    if (lead && lead.k === 'q') {
      var qi = qinfo(lead); np.quant = lead.v;
      if (isCount(e)) { if (qi.uonly) errs.push(E_('qBad', { q: lead.v, n: nm })); else np.num = qi.sg ? 'sg' : 'pl'; }
      else if (e.c === 'u') { if (!qi.u) errs.push(E_('qBad', { q: lead.v, n: nm })); }
      else if (e.c === 'p') { if (!qi.pl) errs.push(E_('qBad', { q: lead.v, n: nm })); }
      else errs.push(E_('qBad', { q: lead.v, n: nm }));
    } else if (lead && lead.k === 'pr') np.poss = lead.v;
    else if (lead && lead.k === 'det') np.det = lead.v;
    var hasSup = mods.some(function (m) { return m.er === 'est'; });
    // 冠詞
    if (np.det === 'a' && (np.num === 'pl' || e.c === 'u' || e.c === 'p')) { if (auto) np.det = 'the'; else errs.push(E_('aBad', { n: nm })); }
    if (np.det && (e.c === 'n')) { if (auto) np.det = null; else errs.push(E_('properDet', { n: nm })); }
    if (!np.det && !np.quant && !np.poss && isCount(e) && np.num === 'sg' && !e.ind) {
      if (auto) { if (e.ad === 'my') np.poss = 'i'; else np.det = (e.ad === 'the' || e.c === 't' || hasSup) ? 'the' : 'a'; np.autoDet = 1; }
      else errs.push(E_(e.c === 't' ? 'needThe' : 'needDet', { n: nm }));
    }
    if (hasSup && np.det !== 'the' && !np.poss) { if (auto) { if (!np.quant) np.det = 'the'; } else errs.push(E_('supThe')); }
    return np;
  }
  function mergePron(a, b) { if (a === 'i' || b === 'i' || a === 'we' || b === 'we') return 'we'; if ((a === 'you' || a === 'youpl') && (b === 'you' || b === 'youpl')) return 'youpl'; return 'they'; }
  function buildPP(ws, cfg, errs) {
    var pw = ws[0], np = buildNP(ws.slice(1), cfg, errs, true), prep = pw.v, g = PREP_GROUP[prep], cat = 'other';
    var e = np.noun;
    if (e && e.cat === 'time') {
      if (g === 0) {
        cat = 'time';
        if (e.prep && prep !== e.prep) { if (cfg.auto.prep) prep = e.prep; else errs.push(E_('prepTime', { n: e.w, p: e.prep })); }
        if (e.c === 't' && np.det !== 'the') { if (cfg.auto.art) { np.det = 'the'; np.poss = null; } else if (!errs.some(function (x) { return x.code === 'needThe'; })) errs.push(E_('needThe', { n: e.w })); }
      }
    } else if (e && e.cat === 'place') {
      cat = g === 1 ? 'dir' : g === 2 ? 'other' : 'place';
      if (g === 0 && e.prep) {
        var ok = e.prep === 'at' || e.prep === 'in' ? ['at', 'in'] : [e.prep];
        if (ok.indexOf(prep) < 0) { if (cfg.auto.prep) prep = e.prep; else errs.push(E_('prepPlace', { n: e.w, p: e.prep })); }
      }
    } else cat = g === 1 ? 'dir' : g === 2 ? 'other' : (np.pron ? 'other' : 'place');
    return { t: 'PP', words: ws, prep: prep, np: np, cat: cat };
  }
  function buildVP(ws, cfg, errs) {
    var vp = { t: 'VP', words: ws, modal: null, neg: false, be: null, freq: null, verb: null, vf: 'base', advs: [], beW: null };
    var degs = [];
    ws.forEach(function (w) {
      switch (w.k) {
        case 'modal': vp.modal = w.v; break; case 'sm': vp.semi = w.v; vp.semiW = w; break; case 'tp': vp.tp = w.v || 'past'; break; case 'not': vp.neg = true; break;
        case 'be': vp.be = w.v || 'pres'; vp.beW = w; break; case 'hv': vp.have = w.v || 'pres'; vp.hvW = w; break; case 'v': vp.verb = w.e; vp.vf = w.f || 'base'; vp.vw = w; break;
        case 'deg': degs.push(w.v); break;
        case 'adv': if (w.e.k === 'freq') vp.freq = w.e; else { vp.advs.push({ deg: degs, e: w.e }); degs = []; } break;
      }
    });
    if (vp.tp) { vp.vf = vp.be && vp.verb ? 'ing' : 'base'; }
    else if (cfg.auto.verb) { // 自動:選んだ形を尊重し、合わない形だけ直す
      if (vp.verb) {
        if (vp.have && !vp.be) vp.vf = 'pp'; // 完了形:have + 過去分詞
        else if (vp.be) { if (vp.vf !== 'ing' && vp.vf !== 'pp') vp.vf = 'ing'; if (vp.vf === 'pp' && vp.verb.fr === 'intr') vp.vf = 'ing'; }
        else if (vp.modal || vp.semi) vp.vf = 'base';
        else if (vp.vf !== 'base' && vp.vf !== 'past') vp.vf = vp.vf === 'pp' ? 'past' : 'base';
      }
    }
    else if (vp.verb) {
      if (vp.have && !vp.be) { if (vp.vf !== 'pp') errs.push(E_('havePP')); }
      else if (vp.be) { if (vp.vf !== 'ing' && vp.vf !== 'pp') errs.push(E_('beForm')); else if (vp.vf === 'pp' && vp.verb.fr === 'intr') errs.push(E_('passiveIntr', { v: vp.verb.w })); }
      else if (vp.modal || vp.semi) { if (vp.vf !== 'base') errs.push(E_('modalBase', { m: vp.modal || vp.semi })); }
      else if (vp.vf !== 'base' && vp.vf !== 'past') errs.push(E_('needBe'));
    }
    return vp;
  }
  function buildNF(ws) {
    var iw = ws.filter(function (w) { return w.k === 'ti'; })[0], vw = ws.filter(function (w) { return w.k === 'v'; })[0];
    var advs = [], degs = [];
    ws.forEach(function (w) { if (w.k === 'deg') degs.push(w.v); if (w.k === 'adv') { advs.push({ deg: degs, e: w.e }); degs = []; } });
    var ti = iw.v || (ws.indexOf(iw) < ws.indexOf(vw) ? 'to' : 'ing');
    return { t: 'NF', words: ws, ti: ti, verb: vw.e, advs: advs };
  }
  function build(type, ws, cfg) {
    var errs = [], c;
    switch (type) {
      case 'NP': case 'NPP': c = buildNP(ws, cfg, errs); break;
      case 'PP': c = buildPP(ws, cfg, errs); break;
      case 'VP': c = buildVP(ws, cfg, errs); break;
      case 'NF': c = buildNF(ws); break;
      case 'AP': c = { t: 'AP', words: ws, mods: buildMods(ws, cfg, errs) }; break;
      case 'ADV': var a = ws[ws.length - 1]; c = { t: 'ADV', words: ws, e: a.e, ak: a.e.k, deg: ws.slice(0, -1).map(function (w) { return w.v; }) }; break;
      case 'ID': c = { t: 'ID', words: ws, e: ws[0].e, ik: ws[0].e.k }; break;
      case 'CONJ': c = { t: 'CONJ', words: ws, v: ws[0].v, sub: CONJ_SUB.indexOf(ws[0].v) >= 0 }; break;
    }
    return { chunk: c, err: errs[0] || null };
  }
  function rebuild(ch, cfg) { if (ch.t === 'CL') return { chunk: ch, err: null }; var s = chainState(ch.words, cfg); return { chunk: s.complete ? s.chunk : null, err: s.err }; }

  // 完成済みチャンクへの差し込み:入れられる位置を後ろから探す
  function tryInsert(ch, w, cfg) {
    if (!ch || ch.t === 'CL' || ch.t === 'ID' || ch.t === 'CONJ') return null;
    for (var pos = ch.words.length; pos >= 0; pos--) {
      var nw = ch.words.slice(0, pos).concat([w], ch.words.slice(pos));
      var s = chainState(nw, cfg);
      if (s.complete && sameKind(s.type, ch.t) && !s.err) return s.chunk;
    }
    // 種類が変わってもよい(the airport + at → at the airport、big + dog → big dog など)。前か後ろに付けるときだけ
    var ends = [0, ch.words.length];
    for (var e = 0; e < ends.length; e++) {
      var nw2 = ch.words.slice(0, ends[e]).concat([w], ch.words.slice(ends[e]));
      var s2 = chainState(nw2, cfg);
      if (s2.complete && !s2.err && s2.type !== 'CONJ' && s2.type !== 'ID') return s2.chunk;
    }
    return null;
  }
  function sameKind(type, t) { return type === t || (type === 'NPP' && t === 'NP'); }

  // ---------- 形の切替 ----------
  function cycleWord(w, cfg) {
    var i;
    switch (w.k) {
      case 'det': w.v = w.v === 'a' ? 'the' : 'a'; return true;
      case 'pr': var cyc = PRON_C1.indexOf(w.v) >= 0 ? PRON_C1 : PRON_C2; i = cyc.indexOf(w.v); w.v = cyc[(i + 1) % cyc.length]; return true;
      case 'prep': var g = PREP_G[PREP_GROUP[w.v]]; i = g.indexOf(w.v); w.v = g[(i + 1) % g.length]; return true;
      case 'modal': if (MODAL_CYCLE[w.v] === w.v) return false; w.v = MODAL_CYCLE[w.v]; return true;
      case 'sm': if (cfg.auto.verb || SEMI[w.v].only || SEMI[w.v].fixed) return false; w.t = w.t === 'past' ? 'pres' : 'past'; return true;
      case 'tp': i = TP_CYCLE.indexOf(w.v || 'past'); w.v = TP_CYCLE[(i + 1) % 3]; return true;
      case 'be': case 'hv': w.v = w.v === 'past' ? 'pres' : 'past'; return true;
      case 'v': var F = ['base', 'past', 'pp', 'ing']; i = F.indexOf(w.f || 'base'); w.f = F[(i + 1) % 4]; return true;
      case 'n': if (!isCount(w.e) || w.e.ind) return false; w.pl = !w.pl; return true;
      case 'ti': w.v = (w.v || 'to') === 'to' ? 'ing' : 'to'; return true;
      case 'er': w.v = (w.v || 'er') === 'er' ? 'est' : 'er'; return true;
      case 'conj': var cg = CONJ_SUB.indexOf(w.v) >= 0 ? CONJ_SUB : CONJ_CO; i = cg.indexOf(w.v); w.v = cg[(i + 1) % cg.length]; return true;
    }
    return false;
  }
  function cyclable(w, cfg) { var c = JSON.parse(JSON.stringify({ k: w.k, v: w.v, f: w.f, pl: w.pl })); c.e = w.e; return cycleWord(c, cfg); }

  // ---------- 文字列化 ----------
  function adjText(m) { var a = m.adj, s = m.er === 'er' ? Dict.comp(a) : m.er === 'est' ? Dict.sup(a) : a.w; return (m.deg.length ? m.deg.join(' ') + ' ' : '') + s; }
  function nounText(np) { return np.num === 'pl' && isCount(np.noun) ? Dict.plural(np.noun.w) : np.noun.w; }
  function npText(np, cas) {
    if (np.pron) return cas === 'obj' ? PRON[np.pron].obj : PRON[np.pron].sub;
    var rest = np.mods.map(adjText).concat([nounText(np)]).join(' '), lead = '';
    if (np.quant) lead = np.quant; else if (np.poss) lead = PRON[np.poss].pos; else if (np.det === 'a') lead = Dict.an(rest); else if (np.det) lead = np.num === 'pl' && np.det === 'this' ? 'these' : np.num === 'pl' && np.det === 'that' ? 'those' : np.det;
    return (lead ? lead + ' ' : '') + rest + (np.postText ? ' ' + np.postText : ''); // 後置修飾(reading the book / on the desk / who plays tennis)
  }
  function advText(a) { return (a.deg && a.deg.length ? a.deg.join(' ') + ' ' : '') + a.e.w; }
  function verbForm(v, f) { return f === 'past' ? Dict.past(v) : f === 'pp' ? Dict.pp(v) : f === 'ing' ? Dict.ing(v) : f === 's3' ? Dict.s3(v) : Dict.base(v); }
  function nfText(nf, ti) { ti = ti || nf.ti; var s = ti === 'to' ? 'to ' + Dict.base(nf.verb) : Dict.ing(nf.verb); return s + nf.advs.map(function (a) { return ' ' + advText(a); }).join(''); }
  function apText(ap, comp) { var m = ap.mods[0]; return (comp && m.er === 'est' ? 'the ' : '') + adjText(m); }
  function ppText(pp) { return pp.prep + ' ' + npText(pp.np, 'obj'); }
  function vpDisplay(vp, cfg) { // 文になる前の見た目
    var p = [];
    if (vp.modal) p.push(vp.neg ? negOf(vp.modal) : vp.modal);
    if (vp.semi) p.push(semiShow(vp.semiW, cfg));
    if (vp.have) p.push(vp.modal || vp.semi ? 'have' : (vp.have === 'past' ? 'had' : 'have'));
    if (vp.be) p.push(vp.have ? 'been' : vp.modal || vp.semi ? 'be' : (vp.be === 'past' ? 'was' : 'be'));
    if (!vp.modal && vp.neg) p.push('not');
    if (vp.freq) p.push(vp.freq.w);
    if (vp.verb && vp.tp) p.push(vp.tp === 'past' ? Dict.past(vp.verb) : vp.tp === 'fut' ? 'will ' + Dict.base(vp.verb) : 'be ' + Dict.ing(vp.verb));
    else if (vp.verb) p.push(verbForm(vp.verb, vp.vf));
    vp.advs.forEach(function (a) { p.push(advText(a)); });
    return p.join(' ');
  }
  function semiShow(w, cfg) { var sm = SEMI[w.v]; return w.t === 'past' && !cfg.auto.verb && sm.past ? sm.past + ' to' : w.t === 'past' && sm.be && !cfg.auto.verb ? 'was going to' : w.v; }
  function chunkText(c, cfg) {
    switch (c.t) {
      case 'NP': return npText(c, 'sub'); case 'PP': return ppText(c); case 'VP': return vpDisplay(c, cfg); case 'NF': return nfText(c);
      case 'AP': return apText(c); case 'ADV': return advText(c); case 'ID': return c.e.w; case 'CONJ': return c.v; case 'CL': return c.text;
      case 'FR': return c.parts.map(function (p) { return chunkText(p, cfg); }).join(' ');
    }
    return '';
  }
  function label(c, cfg) { var ws = chunkText(c, cfg).split(' '); return ws.length > 2 ? ws[0] + ' … ' + ws[ws.length - 1] : ws.join(' '); }
  function wordText(w, cfg) {
    switch (w.k) {
      case 'n': return w.pl && isCount(w.e) ? Dict.plural(w.e.w) : w.e.w;
      case 'pr': return PRON[w.v].sub; case 'det': case 'q': case 'deg': case 'prep': case 'modal': case 'conj': return w.v;
      case 'sm': return semiShow(w, cfg); case 'tp': return TP_LABEL[w.v || 'past'];
      case 'not': return 'not'; case 'be': return w.v === 'past' ? 'was' : 'be'; case 'hv': return w.v === 'past' ? 'had' : 'have';
      case 'v': return verbForm(w.e, w.f || 'base');
      case 'ti': return w.v ? (w.v === 'to' ? 'to' : '-ing') : 'to/ing'; case 'er': return w.v === 'est' ? '-est' : '-er';
      case 'adj': case 'adv': case 'idm': return w.e.w; case 'magic': return '?';
    }
    return '';
  }
  function jaAdj(a) { var j = a.ja || a.w; return a.jt === 'na' ? j + 'な' : j; }
  function gloss(c) {
    try {
      switch (c.t) {
        case 'NP': if (c.pron) return PRON[c.pron].ja; return (c.poss ? PRON[c.poss].ja + 'の' : '') + c.mods.map(function (m) { return jaAdj(m.adj); }).join('') + (c.noun.ja || '');
        case 'PP': var n = gloss(c.np); return n + (c.cat === 'time' ? 'に' : (JA_P[c.prep] || ''));
        case 'VP': return (c.freq && c.freq.ja ? c.freq.ja + ' ' : '') + (c.verb ? c.verb.ja : (c.be ? '〜である' : '')) + (c.semi ? '(' + SEMI[c.semi].ja + ')' : '') + (c.tp ? '(' + TP_LABEL[c.tp] + ')' : '') + (c.neg ? '(〜ない)' : '');
        case 'NF': return c.verb.ja + (c.ti === 'to' ? '(こと・ために)' : '(こと)');
        case 'AP': return c.mods[0].adj.ja; case 'ADV': case 'ID': return c.e.ja || '';
      }
    } catch (e) { }
    return '';
  }

  // ---------- 文の解析 ----------
  function isTP(t) { return (t.t === 'ADV' && (t.ak === 'time' || t.ak === 'place')) || (t.t === 'PP' && (t.cat === 'time' || t.cat === 'place')) || (t.t === 'ID' && (t.ik === 'time' || t.ik === 'place')); }
  function isPost(t) { return isTP(t) || t.t === 'PP' || t.t === 'ADV' || (t.t === 'ID' && t.ik === 'other') || t.t === 'NF'; }
  function compOptions(vp) {
    var o = [], v = vp.verb;
    if (!v || (vp.be && vp.vf === 'pp' && v)) {
      if (!v) { o.push({ p: ['AP'] }, { p: ['NP'] }, { p: ['PPplace'] }, { p: [], f: 'needComp' }); return o; }
      o.push({ p: [] }); return o;
    }
    if (v.link && !vp.be) { o.push({ p: ['AP'] }, { p: ['NP'] }); if (v.fr !== 'tr') o.push({ p: [] }); else o.push({ p: [], f: 'needObj' }); }
    else if (v.fr === 'tr') { o.push({ p: ['NP'] }); if (v.dt) o.push({ p: ['NP', 'NP'] }); o.push({ p: [], f: 'needObj' }); }
    else if (v.fr === 'both') { o.push({ p: [] }, { p: ['NP'] }); if (v.dt) o.push({ p: ['NP', 'NP'] }); }
    else { o.push({ p: [] }, { p: ['NP'], f: 'intrObj' }); }
    if (v.cv) { o.push({ p: ['NF'] }, { p: ['NF', 'NPobj'] }); }
    return o;
  }
  function fits(tok, pat, prev) {
    if (!tok) return false;
    if (pat === 'NP') return tok.t === 'NP';
    if (pat === 'NPobj') return tok.t === 'NP' && prev && prev.verb && prev.verb.fr !== 'intr';
    if (pat === 'AP') return tok.t === 'AP';
    if (pat === 'NF') return tok.t === 'NF';
    if (pat === 'PPplace') return tok.t === 'PP' && (tok.cat === 'place' || tok.cat === 'dir') || (tok.t === 'ADV' && tok.ak === 'place') || (tok.t === 'ID' && tok.ik === 'place');
    return false;
  }
  function pClause(T, i, allowPre, prefix, out) {
    var n = T.length;
    for (var k = 0; k <= 2; k++) {
      if (k > 0 && !(i + k - 1 < n && allowPre && isTP(T[i + k - 1]))) break;
      var j = i + k, pre = T.slice(i, j);
      if (prefix && j === n) { out.push({ i: n, partial: true }); continue; }
      var subj = null, flags = [];
      if (T[j] && T[j].t === 'NP') { subj = T[j]; j++; } else if (T[j] && T[j].t === 'VP') flags.push('needSubj'); else continue;
      if (prefix && j === n) { out.push({ i: n, partial: true }); continue; }
      var vp = T[j]; if (!vp || vp.t !== 'VP') continue; j++;
      compOptions(vp).forEach(function (op) {
        var jj = j, ok = true;
        for (var q = 0; q < op.p.length; q++) {
          if (prefix && jj === n) { out.push({ i: n, partial: true }); ok = false; break; }
          if (!fits(T[jj], op.p[q], T[jj - 1])) { ok = false; break; } jj++;
        }
        if (!ok) return;
        if (vp.verb && vp.verb.cv && op.p.indexOf('NF') < 0 && T[jj] && T[jj].t === 'NF') return;
        var fl = flags.slice(); if (op.f) fl.push(op.f);
        for (var m = 0; m <= 3; m++) {
          if (m > 0 && !(jj + m - 1 < n && isPost(T[jj + m - 1]))) break;
          out.push({ i: jj + m, cl: { pre: pre, subj: subj, vp: vp, comps: T.slice(j, jj), compPat: op.p, posts: T.slice(jj, jj + m), flags: fl } });
        }
        if (prefix && jj + 3 < n) { /* 後置は最大3 */ }
      });
    }
    return out;
  }
  function parseAll(T, prefix) {
    var n = T.length, res = [], fronts = [{ i: 0, front: null }];
    if (T[0] && (T[0].t === 'CL' || (T[0].t === 'ID' && T[0].ik === 'front'))) fronts.push({ i: 1, front: { tok: T[0] } });
    if (T[0] && T[0].t === 'CONJ' && T[0].sub) {
      if (prefix && n === 1) res.push({ partial: true });
      pClause(T, 1, true, prefix, []).forEach(function (c) {
        if (c.partial) { res.push({ partial: true }); return; }
        if (c.i === n) res.push({ kind: 'CL', conj: T[0], cl: c.cl });
        fronts.push({ i: c.i, front: { conj: T[0], cl: c.cl } });
      });
    }
    fronts.forEach(function (f) {
      if (prefix && f.i === n && f.front) { res.push({ partial: true }); return; }
      pClause(T, f.i, true, prefix, []).forEach(function (c1) {
        if (c1.partial) { res.push({ partial: true }); return; }
        if (c1.i === n) { res.push({ kind: 'S', front: f.front, cls: [c1.cl] }); return; }
        var co = T[c1.i];
        if (co && co.t === 'CONJ') {
          if (prefix && c1.i + 1 === n) { res.push({ partial: true }); return; }
          pClause(T, c1.i + 1, true, prefix, []).forEach(function (c2) {
            if (c2.partial) { res.push({ partial: true }); return; }
            if (c2.i === n) res.push({ kind: 'S', front: f.front, cls: [c1.cl, c2.cl], co: co });
          });
        }
      });
    });
    return res;
  }

  // ---------- 時制 ----------
  function timeTokens(cl) {
    var out = [];
    cl.pre.concat(cl.posts).forEach(function (t) {
      if (t.t === 'ADV' && t.ak === 'time') out.push({ ts: t.e.ts, w: t.e.w });
      else if (t.t === 'ID' && t.ik === 'time') out.push({ ts: t.e.ts, w: t.e.w });
      else if (t.t === 'PP' && t.cat === 'time') out.push({ ts: t.np.noun && t.np.noun.ts, w: ppText(t) });
    });
    return out;
  }
  function allowedOf(times) {
    var a = null;
    times.forEach(function (t) { var s = {}; (t.ts || ['pres', 'past', 'fut', 'prog']).forEach(function (k) { s[k] = 1; }); if (!a) a = s; else { var b = {}; for (var k in a) if (s[k]) b[k] = 1; a = b; } });
    return a;
  }
  function decideTense(vp, allowed, cfg) {
    var asp = vp.verb ? (vp.be ? (vp.vf === 'pp' ? 'pass' : 'prog') : 'simple') : 'cop';
    var r = { asp: asp, tense: 'pres', modal: vp.modal, ok: true, perf: !!vp.have };
    if (vp.have && !vp.semi) { // 完了形:現在完了は「今」とつながる語だけ、過去完了は過去の語と
      r.tense = cfg.auto.verb ? (allowed && !allowed.pres && !allowed.prog && allowed.past ? 'past' : 'pres') : (vp.have === 'past' ? 'past' : 'pres');
      if (vp.modal) r.tense = 'pres';
      if (allowed) r.ok = !!(r.tense === 'past' ? allowed.past : (allowed.pres || allowed.prog || (vp.modal && allowed.fut)));
      return r;
    }
    if (vp.tp) {
      r.modal = null;
      if (vp.tp === 'past') r.tense = 'past'; else if (vp.tp === 'fut') r.modal = 'will'; else { r.asp = 'prog'; r.progBe = true; }
      if (allowed) r.ok = !!(vp.tp === 'past' ? allowed.past : vp.tp === 'fut' ? (allowed.fut || allowed.pres || allowed.prog) : (allowed.prog || allowed.pres || allowed.fut));
      return r;
    }
    if (vp.semi) {
      var sm = SEMI[vp.semi]; r.semi = vp.semi;
      if (sm.only) r.tense = 'past';
      else if (sm.fixed) r.tense = 'pres';
      else if (cfg.auto.verb) { if (allowed && !allowed.pres && !allowed.prog && !allowed.fut && allowed.past) r.tense = 'past'; }
      else r.tense = vp.semiW && vp.semiW.t === 'past' ? 'past' : 'pres';
      if (allowed && !sm.fixed) r.ok = !!(r.tense === 'past' ? allowed.past : (allowed.pres || allowed.fut || allowed.prog));
      return r;
    }
    if (cfg.auto.verb) {
      var wantPast = vp.be ? vp.be === 'past' : vp.vf === 'past';
      if (vp.modal) { if (allowed && !allowed.pres && !allowed.prog && !allowed.fut && allowed.past) r.modal = MODAL_TO_PAST[vp.modal] || vp.modal; }
      else if (wantPast && (!allowed || allowed.past)) r.tense = 'past';
      else if (allowed) {
        if (allowed.pres || (allowed.prog && asp === 'prog')) r.tense = 'pres';
        else if (allowed.past) r.tense = 'past';
        else if (allowed.fut) r.modal = 'will';
        else if (allowed.prog) r.tense = 'pres';
      }
      return r;
    }
    r.tense = vp.be ? vp.be : (vp.vf === 'past' ? 'past' : 'pres');
    if (!allowed) return r;
    var key = r.modal ? (MODAL_PAST[r.modal] ? 'mpast' : 'mpres') : r.tense + (asp === 'prog' ? 'prog' : '');
    var ok = key === 'pres' ? (allowed.pres || (asp !== 'simple' && allowed.prog)) : key === 'presprog' ? (allowed.prog || allowed.pres || allowed.fut) : (key === 'past' || key === 'pastprog') ? allowed.past : key === 'mpres' ? (allowed.fut || allowed.pres || allowed.prog) : true;
    r.ok = !!ok; return r;
  }
  function beForm(tense, s) { var sg3 = !s.pl && (s.p === 3 || s.p === 1); if (tense === 'past') return sg3 ? 'was' : 'were'; if (!s.pl && s.p === 1) return 'am'; return !s.pl && s.p === 3 ? 'is' : 'are'; }
  function subjInfo(np) { if (!np) return { p: 2, pl: 0 }; if (np.pron) return { p: PRON[np.pron].p, pl: PRON[np.pron].pl }; return { p: 3, pl: np.num === 'pl' ? 1 : 0 }; }
  function vpRealize(vp, s, td, marks) {
    var p = [], v = vp.verb, modal = td.modal, sg3 = s.p === 3 && !s.pl;
    var freq = vp.freq ? vp.freq.w : null;
    var rest = function () { if (td.asp === 'cop') p.push('be'); else if (td.asp === 'prog') p.push('be', Dict.ing(v)); else if (td.asp === 'pass') p.push('be', Dict.pp(v)); else p.push(Dict.base(v)); };
    var perfTail = function () { if (vp.be || td.asp === 'prog' || td.asp === 'pass') { p.push('been', td.asp === 'pass' ? Dict.pp(v) : Dict.ing(v)); } else p.push(Dict.pp(v)); };
    if (td.perf && !td.semi) {
      if (modal) { p.push(vp.neg ? negOf(modal) : modal); if (freq) p.push(freq); p.push('have'); }
      else { var hf0 = td.tense === 'past' ? 'had' : sg3 ? 'has' : 'have'; p.push(vp.neg ? negOf(hf0) : hf0); if (marks && hf0 === 'has' && !vp.neg) marks.push('has'); if (freq) p.push(freq); }
      perfTail();
    } else if (modal) {
      p.push(vp.neg ? negOf(modal) : modal); if (freq) p.push(freq); rest();
    } else if (td.semi) {
      var sm = SEMI[td.semi];
      if (sm.be) { var bf0 = beForm(td.tense, s); p.push(vp.neg ? negOf(bf0) : bf0); if (marks && bf0 === 'is' && !vp.neg) marks.push('is'); if (freq) p.push(freq); p.push('going to'); }
      else if (sm.only) { if (freq) p.push(freq); p.push(vp.neg ? "didn't use to" : 'used to'); }
      else if (sm.fixed) { p.push(vp.neg ? "wouldn't like to" : 'would like to'); }
      else if (vp.neg) { p.push(negOf(td.tense === 'past' ? 'did' : sg3 ? 'does' : 'do')); if (freq) p.push(freq); p.push(sm.b + ' to'); }
      else { if (freq) p.push(freq); var hf = td.tense === 'past' ? sm.past : sg3 ? (sm.s3 || sm.b + 's') : sm.b; if (sg3 && td.tense !== 'past' && marks) marks.push(hf); p.push(hf + ' to'); }
      rest();
    } else if (vp.be || td.progBe) {
      var bf = beForm(td.tense, s); p.push(vp.neg ? negOf(bf) : bf); if (marks && bf === 'is' && !vp.neg) marks.push('is'); if (freq) p.push(freq);
      if (td.asp === 'prog') p.push(Dict.ing(v)); else if (td.asp === 'pass') p.push(Dict.pp(v));
    } else {
      if (vp.neg) { p.push(negOf(td.tense === 'past' ? 'did' : sg3 ? 'does' : 'do')); if (freq) p.push(freq); p.push(Dict.base(v)); }
      else { if (freq) p.push(freq); var vf = td.tense === 'past' ? Dict.past(v) : sg3 ? Dict.s3(v) : Dict.base(v); if (sg3 && td.tense !== 'past' && marks) marks.push(vf.split(' ')[0]); p.push(vf); }
    }
    vp.advs.forEach(function (a) { p.push(advText(a)); });
    return p.join(' ');
  }
  function tokText(t, role) {
    switch (t.t) { case 'NP': return npText(t, role === 'obj' ? 'obj' : 'sub'); case 'AP': return apText(t, true); default: return chunkText(t); }
  }
  // 1つの節を評価・文字列化
  function evalClause(cl, cfg, sv) {
    var errs = [], s = subjInfo(cl.subj), vp = cl.vp;
    cl.flags.forEach(function (f) { errs.push(E_(f, { v: vp.verb ? vp.verb.w : 'be' })); });
    var times = timeTokens(cl), places = cl.pre.concat(cl.posts, cl.comps).filter(function (t) { return (t.t === 'ADV' && t.ak === 'place') || (t.t === 'PP' && t.cat === 'place') || (t.t === 'ID' && t.ik === 'place'); });
    // 時の語は、時制がかみ合えば2つまでOK(yesterday + in the morning)。矛盾する組み合わせ(yesterday + tomorrow)はダメ
    // 「日」+「時刻・時間帯」の組み合わせ(yesterday + in the morning)だけは2つでもOK
    var TOD = function (t) { var x = String(t.w || ""); return /\b(morning|afternoon|evening|noon|midnight|o'clock|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/.test(x) && !/\b(every|last|next|this|tomorrow|yesterday)\b/.test(x); };
    var ao = times.length === 2 && allowedOf(times), okPair = ao && Object.keys(ao).length && (TOD(times[0]) !== TOD(times[1]));
    if ((times.length > 1 && !okPair) || (sv && sv.frontTime && times.length)) errs.push(E_('dupTime'));
    if (places.length > 1) errs.push(E_('dupPlace'));
    var allowed = allowedOf(times), td = decideTense(vp, allowed, cfg);
    if (!td.ok) { var t0 = times[0], a = allowed || {}; errs.push(E_('tense', { t: t0.w, w: a.past && !a.pres && !a.fut ? '過去' : a.fut && !a.pres && !a.past ? '未来' : a.pres && !a.past ? 'いま・ふだん' : 'その時' })); }
    var nfTi = {};
    cl.comps.forEach(function (c, ci) {
      if (c.t === 'NF' && vp.verb && vp.verb.cv) {
        var need = vp.verb.cv; if (need !== 'both' && c.ti !== need) { if (cfg.auto.ti) nfTi[ci] = need; else errs.push(E_('cv', { v: vp.verb.w, f: need === 'to' ? 'to + 動詞' : '動詞の -ing' })); }
      }
    });
    var postTi = {};
    cl.posts.forEach(function (c, ci) { if (c.t === 'NF' && c.ti !== 'to') { if (cfg.auto.ti) postTi[ci] = 'to'; else errs.push(E_('purposeTo')); } });
    var parts = [], marks = [];
    var preTxt = cl.pre.map(function (t) { return tokText(t); }).join(' ');
    if (preTxt) parts.push(preTxt + ',');
    if (cl.subj) parts.push(tokText(cl.subj, 'sub'));
    parts.push(vpRealize(vp, s, td, marks));
    cl.comps.forEach(function (c, ci) { parts.push(c.t === 'NF' ? nfText(c, nfTi[ci]) : tokText(c, 'obj')); });
    cl.posts.forEach(function (c, ci) { parts.push(c.t === 'NF' ? nfText(c, postTi[ci] || c.ti) : tokText(c, 'obj')); });
    return { errs: errs, text: parts.join(' '), times: times.length, past: td.tense === 'past' || MODAL_PAST[td.modal], marks: marks };
  }
  var SEV = { needSubj: 1, needObj: 1, needComp: 1, needVerb: 1 };
  function sevOf(errs) { var s = 0; errs.forEach(function (e) { s = Math.max(s, SEV[e.code] ? 1 : 2); }); return s; }
  function capFirst(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function finishText(s) { s = s.replace(/\s+/g, ' ').replace(/ ,/g, ',').trim(); s = capFirst(s); s = s.replace(/([?!]) ([a-z])/g, function (m, a, b) { return a + ' ' + b.toUpperCase(); }); return s.replace(/\bi\b/g, 'I'); }

  function parse(T, cfg) {
    if (!T.length) return { ok: false, sev: 2, err: E_('order') };
    var alts = parseAll(T, false), best = null;
    alts.forEach(function (a) {
      if (a.partial) return;
      var errs = [], texts = [], frontText = '', frontTime = 0, past = false, marks = [];
      if (a.kind === 'CL') {
        var r0 = evalClause(a.cl, cfg); errs = r0.errs;
        var cand = { ok: false, kind: 'CL', errs: errs, text: a.conj.v + ' ' + r0.text, times: r0.times, alt: a };
        cand.sev = sevOf(errs); cand.rank = cand.sev * 100 + 50; if (!best || cand.rank < best.rank) best = cand; return;
      }
      if (a.front) {
        if (a.front.tok) { var ft = a.front.tok; frontText = ft.t === 'CL' ? ft.text + ',' : (/[?!]$/.test(ft.e.w) ? ft.e.w : ft.e.w + ','); frontTime = ft.t === 'CL' ? ft.times : 0; }
        else { var rf = evalClause(a.front.cl, cfg); errs = errs.concat(rf.errs); marks = marks.concat(rf.marks); frontText = a.front.conj.v + ' ' + rf.text + ','; frontTime = rf.times; }
      }
      a.cls.forEach(function (cl, ci) { var r = evalClause(cl, cfg, { frontTime: ci === 0 ? frontTime : 0 }); errs = errs.concat(r.errs); texts.push(r.text); past = past || r.past; marks = marks.concat(r.marks); });
      var body = texts[0] + (a.co ? (a.co.v === 'and' || a.co.sub ? ' ' + a.co.v + ' ' : ', ' + a.co.v + ' ') + texts[1] : '');
      var cand2 = { kind: 'S', errs: errs, text: finishText((frontText ? frontText + ' ' : '') + body + '.'), alt: a, past: past, marks: marks };
      cand2.sev = sevOf(errs); cand2.rank = cand2.sev * 100 + a.cls[0].pre.length + (a.front && a.front.cl ? -a.front.cl.posts.length * 0.1 : 0);
      if (!best || cand2.rank < best.rank || (cand2.sev === best.sev && best.kind === 'CL')) best = cand2;
    });
    if (!best) {
      if (!T.some(function (t) { return t.t === 'VP'; })) return { ok: false, sev: 1, err: E_('needVerb') };
      return { ok: false, sev: 2, err: E_('order') };
    }
    if (best.sev === 0) {
      var a = best.alt, info = { front: !!(a.front), clause: !!(a.front && (a.front.cl || (a.front.tok && a.front.tok.t === 'CL'))) || best.kind === 'CL' || !!(a.co && a.co.sub), coord: !!(a.co && !a.co.sub), past: !!best.past };
      if (best.kind === 'CL') return { ok: true, kind: 'CL', text: best.text, times: best.times, info: info };
      return { ok: true, kind: 'S', text: best.text, info: info, marks: best.marks || [], alt: a };
    }
    return { ok: false, sev: best.sev, err: best.errs.filter(function (e) { return (SEV[e.code] ? 1 : 2) === best.sev; })[0] || best.errs[0], text: best.text };
  }
  // 単語の集まりが1つのチャンクになるか(並び順が違っていても、正しい順に並べ直せればOK)
  function perms(a) { if (a.length <= 1) return [a]; var out = []; a.forEach(function (x, i) { perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(function (p) { out.push([x].concat(p)); }); }); return out; }
  function asChunk(words, cfg) {
    // 形の誤り(be + arrive など)だけなら、動詞の形を合わせて通す
    function fit(ws) {
      var q = chainState(ws, cfg); if (q.complete && !q.err) return { q: q, ws: ws };
      if (q.complete) for (var i = 0; i < ws.length; i++) if (ws[i].k === 'v') {
        var F = ['base', 'past', 'pp', 'ing'];
        for (var j = 0; j < 4; j++) { if (F[j] === (ws[i].f || 'base')) continue; var c = {}; for (var key in ws[i]) c[key] = ws[i][key]; c.f = F[j]; var w2 = ws.slice(); w2[i] = c; var q2 = chainState(w2, cfg); if (q2.complete && !q2.err) return { q: q2, ws: w2 }; }
      }
      return { q: q, ws: null };
    }
    var f0 = fit(words), s = f0.q;
    if (f0.ws) return { chunk: s.chunk, prefix: true, words: f0.ws };
    var pre = s.prefix, best = null;
    if (words.length <= 5) perms(words).forEach(function (p) { if (best) return; var fq = fit(p), q = fq.q; if (fq.ws) best = { chunk: q.chunk, prefix: true, words: fq.ws }; else if (q.prefix) pre = true; });
    return best || { chunk: null, prefix: pre };
  }
  // 一筆書きで拾った並びをチャンクにまとめる。1語ではチャンクにならない語(at・the など)は、次のバブルとくっつける
  function strokeTokens(units, cfg, partial) {
    var out = [], pend = [];
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (pend.length) {
        var s = chainState(pend.concat(u.words), cfg);
        if (s.complete && !s.err) { out.push(s.chunk); pend = []; continue; }
        if (s.prefix) { pend = pend.concat(u.words); continue; }
        return null;
      }
      if (u.chunk) { if (u.chunk.t === 'FR') out = out.concat(u.chunk.parts); else out.push(u.chunk); continue; }
      var s1 = chainState(u.words, cfg);
      if (s1.complete && !s1.err) out.push(s1.chunk); else if (s1.prefix) pend = u.words.slice(); else return null;
    }
    if (pend.length && partial) { out.pend = pend; return out; }
    return pend.length ? null : out;
  }
  // 途中の語(the / at / can など)が、ふつうに続けたら何のチャンクになるかを仮に作る(候補の判定用)
  function completePend(pend, cfg, samples) {
    for (var i = 0; i < samples.length; i++) {
      var ws = pend.concat(samples[i]);
      for (var k = 1; k <= samples[i].length; k++) { var st = chainState(pend.concat(samples[i].slice(0, k)), cfg); if (st.complete && !st.err) return st.chunk; }
    }
    return null;
  }
  function viable(T, strict) { // strict:確実に×になる並び(自動詞+目的語など)は「続けられない」とみなす
    if (!T.length) return true; var alts = parseAll(T, true);
    if (!strict) return alts.length > 0;
    return alts.some(function (a) {
      if (a.partial) return true;
      var cls = (a.cls || (a.cl ? [a.cl] : [])).concat(a.front && a.front.cl ? [a.front.cl] : []);
      return !cls.some(function (c) { return c.flags.some(function (f) { return !SEV[f]; }); });
    });
  }
  // 節チャンク(When I ran など)を作る
  // 文のかけら(S V など、まだ文になっていない並び)。あとで他とつなげられる
  function makeFrag(T) { var words = []; T.forEach(function (t) { words = words.concat(t.words || []); }); return { t: 'FR', words: words, parts: T.slice() }; }
  function makeClause(T, res) { var words = []; T.forEach(function (t) { words = words.concat(t.words || []); }); return { t: 'CL', words: words, parts: T.slice(), text: res.text, times: res.times || 0 }; }
  function wordCount(T) { var n = 0; T.forEach(function (t) { if (t.t === 'CL') n += wordCount(t.parts); else (t.words || []).forEach(function (w) { n += w.k === 'idm' ? w.e.w.split(' ').length : 1; }); }); return n; }

  return {
    PRON: PRON, PREP_G: PREP_G, MODALS: MODALS, SEMIS: SEMIS, SEMI: SEMI, TP_CYCLE: TP_CYCLE, DEGS: DEGS, CONJ_SUB: CONJ_SUB, CONJ_CO: CONJ_CO, QUANTS: QUANTS, MSG: MSG,
    codeOf: codeOf, chainState: chainState, strokeTokens: strokeTokens, asChunk: asChunk, canAppend: canAppend, tryInsert: tryInsert, rebuild: rebuild, cycleWord: cycleWord, cyclable: cyclable,
    chunkText: chunkText, label: label, wordText: wordText, gloss: gloss, parse: parse, viable: viable, makeClause: makeClause, makeFrag: makeFrag, completePend: completePend, wordCount: wordCount,
    err: E_, mergePron: mergePron, isCount: isCount
  };
})();

/* ===== FILE: seed_data.js ===== */
// 自動生成:tools/mkseeds_en.js(英語脳の文生成エンジンで作った文)。手で直さない。
var SEED_DATA=["2^わたしは教室に着いた。^pr:i/v:arrive|past/prep:in det:the n:classroom",
"2^お母さんはスーパーで話すだろう。^pr:i n:mom/modal:will v:talk|base/prep:at det:the n:supermarket",
"2^わたしはスーパーで走るつもりだ。^pr:i/modal:will v:run|base/prep:at det:the n:supermarket",
"1^かれは毎朝ジャンプする。^pr:he/v:jump|base/idm:every_morning",
"3^かのじょは体育館でくだものを安全に買っている。^pr:she/be:pres v:buy|ing/n:fruit/adv:safely/prep:in det:the n:gym",
"2^ケンは今夜旅行する予定だ。^n:Ken/be:pres v:travel|ing/adv:tonight",
"3^男の子は駅で活動をやるだろう。^det:the n:boy/modal:will v:do|base/det:a n:activity/prep:at det:the n:station",
"3^ミカは空港で植物をかんたんに守る。^n:Mika/v:protect|base/det:a n:plant/adv:easily/prep:at det:the n:airport",
"2^かれらは今病院で靴をはく。^pr:they/v:wear|base/n:shoe|pl/prep:at det:the n:hospital/adv:now",
"2^先生は朝にここでジャンプした。^det:the n:teacher/v:jump|past/adv:here/prep:in det:the n:morning",
"3^ねこは今日の午後教室で泣くだろう。^det:the n:cat/modal:will v:cry|base/prep:in det:the n:classroom/idm:this_afternoon",
"2^ねこは東京で走っている。^det:the n:cat/be:pres v:run|ing/prep:in n:Tokyo",
"2^女の子は引き出しを閉めるだろう。^det:the n:girl/modal:will v:close|base/det:a n:drawer",
"2^ケンは毎日会社で歩く。^n:Ken/v:walk|base/prep:at det:the n:office/idm:every_day",
"2^男の子はわたしのスマホをくらやみで直す。^det:the n:boy/v:fix|base/pr:i n:phone/idm:in_the_dark",
"3^友だちは明日空港でパジャマを着るだろう。^pr:i n:friend|pl/modal:will v:wear|base/n:pajamas/prep:at det:the n:airport/adv:tomorrow",
"2^先生は7時に会社で勝った。^det:the n:teacher/v:win|past/prep:at det:the n:office/idm:at_seven",
"3^友だちは次は海辺でメールを確認する。^pr:i n:friend|pl/v:check|base/det:a n:email/prep:on det:the n:beach/idm:next_time",
"2^あなたはていねいに働いている。^pr:you/be:pres v:work|ing/adv:politely",
"2^友だちは行くだろう。^pr:i n:friend|pl/modal:will v:go|base",
"1^ミカは昨日寝た。^n:Mika/v:sleep|past/adv:yesterday",
"2^女の子は体育館で働く。^det:the n:girl/v:work|base/prep:in det:the n:gym",
"2^先生は庭でまったりする。^det:the n:teacher/v:chill|base/prep:in det:the n:garden",
"2^犬はスーパーで泣く。^det:the n:dog/v:cry|base/prep:at det:the n:supermarket",
"3^友だちは朝にコーヒーを買うだろう。^pr:i n:friend|pl/modal:will v:buy|base/n:coffee/prep:in det:the n:morning",
"2^先生は毎朝箱を運ぶ。^det:the n:teacher/v:carry|base/det:the n:box/idm:every_morning",
"3^かのじょは明日公園で箱を開ける予定だ。^pr:she/be:pres v:open|ing/det:the n:box/prep:in det:the n:park/adv:tomorrow",
"3^わたしたちは昨日海辺で手助けをいっしょにした。^pr:we/v:give|past/n:help/adv:together/prep:on det:the n:beach/adv:yesterday",
"2^ケンは公園でのんびりする。^n:Ken/v:relax|base/prep:in det:the n:park",
"1^かのじょは一日じゅう叫んだ。^pr:she/v:shout|past/idm:all_day",
"2^友だちは来週時間どおりに泳ぐ予定だ。^pr:i n:friend|pl/be:pres v:swim|ing/idm:on_time/idm:next_week",
"3^ねこはレストランで靴を怒ってなくすだろう。^det:the n:cat/modal:will v:lose|base/n:shoe|pl/adv:angrily/prep:at det:the n:restaurant",
"2^かれらは川のそばで招待状を送った。^pr:they/v:send|past/det:the n:invitation/prep:by det:the n:river",
"2^わたしは駅でリュックを運んだ。^pr:i/v:carry|past/det:a n:backpack/prep:at det:the n:station",
"1^お父さんは近くでジャンプする。^pr:i n:dad/v:jump|base/idm:close_by",
"2^お父さんは夜にあそこでほほえんだ。^pr:i n:dad/v:smile|past/adv:there/prep:at n:night",
"1^先生は2時間叫んだ。^det:the n:teacher/v:shout|past/idm:for_two_hours",
"3^友だちは庭で森林を守った。^pr:i n:friend|pl/v:protect|past/det:a n:forest/prep:in det:the n:garden",
"3^ケンは朝にあそこでスカートをはける。^n:Ken/modal:can v:wear|base/det:a n:skirt/adv:there/prep:in det:the n:morning",
"1^ケンは楽しそうにほほえむ。^n:Ken/v:smile|base/adv:happily",
"2^わたしは2時間川のそばで楽しそうに踊った。^pr:i/v:dance|past/adv:happily/prep:by det:the n:river/idm:for_two_hours",
"2^犬は来週走る予定だ。^det:the n:dog/be:pres v:run|ing/idm:next_week",
"1^ミカはもうすぐ話す。^n:Mika/v:talk|base/adv:soon",
"3^ケンは先週病院でペンを借りた。^n:Ken/v:borrow|past/det:a n:pen/prep:at det:the n:hospital/idm:last_week",
"3^あなたは公園でスクーターにすばやく乗った。^pr:you/v:ride|past/det:a n:scooter/adv:quickly/prep:in det:the n:park",
"2^お父さんは東京で踊っている。^pr:i n:dad/be:pres v:dance|ing/prep:in n:Tokyo",
"1^ミカは近くで隠れた。^n:Mika/v:hide|past/adv:nearby",
"2^友だちは川のそばで寝ている。^pr:i n:friend|pl/be:pres v:sleep|ing/prep:by det:the n:river",
"3^お母さんは体育館でバイクに乗る。^pr:i n:mom/v:ride|base/det:a n:motorcycle/prep:in det:the n:gym",
"3^かれらは今夜学校で秘密基地を間に合うように作る予定だ。^pr:they/be:pres v:build|ing/det:a n:fort/idm:in_time/idm:at_school/adv:tonight",
"3^ねこは2時間病院でもう一度泣いた。^det:the n:cat/v:cry|past/adv:again/prep:at det:the n:hospital/idm:for_two_hours",
"2^わたしたちは毎朝ペンをあげられた。^pr:we/modal:could v:give|base/det:a n:pen/idm:every_morning",
"2^かれらは今夜急ぐだろう。^pr:they/modal:will v:hurry|base/adv:tonight",
"2^ケンは今朝海辺でかんたんに寝た。^n:Ken/v:sleep|past/adv:easily/prep:on det:the n:beach/idm:this_morning",
"2^男の子は前回は屋根を間に合うように直した。^det:the n:boy/v:fix|past/det:a n:roof/idm:in_time/idm:last_time",
"2^お母さんは家で寝ている。^pr:i n:mom/be:pres v:sleep|ing/idm:at_home",
"2^ミカは海へ旅行する。^n:Mika/v:travel|base/prep:to det:the n:beach",
"2^わたしはここでかさを持って来た。^pr:i/v:bring|past/det:a n:umbrella/adv:here",
"2^ねこは庭で休んだ。^det:the n:cat/v:rest|past/prep:in det:the n:garden",
"2^かのじょは川へ旅行した。^pr:she/v:travel|past/prep:to det:the n:river",
"1^かれは7時に着く。^pr:he/v:arrive|base/idm:at_seven",
"2^わたしたちは毎日会社へ旅行する。^pr:we/v:travel|base/prep:to det:the n:office/idm:every_day",
"2^わたしたちは贈り物を親切に持ってくるつもりだ。^pr:we/modal:will v:bring|base/det:a n:gift/adv:kindly",
"1^かのじょは今まったりする。^pr:she/v:chill|base/adv:now",
"1^ねこは今急ぐ。^det:the n:cat/v:hurry|base/adv:now",
"3^犬は今日の午後駅で健康を守っている。^det:the n:dog/be:pres v:protect|ing/n:health/prep:at det:the n:station/idm:this_afternoon",
"3^ねこは来週カフェで走るだろう。^det:the n:cat/modal:will v:run|base/prep:at det:the n:cafe/idm:next_week",
"2^かれは踊っている。^pr:he/be:pres v:dance|ing",
"1^ケンはお茶をひそかに作った。^n:Ken/v:make|past/n:tea/adv:secretly",
"2^犬はスーパーで歩く。^det:the n:dog/v:walk|base/prep:at det:the n:supermarket",
"3^友だちはわたしの部屋でサンドイッチを作っている。^pr:i n:friend|pl/be:pres v:make|ing/det:a n:sandwich/prep:in pr:i n:room",
"2^あなたはスーパーでまったりする。^pr:you/v:chill|base/prep:at det:the n:supermarket",
"2^わたしは会社でもう一度まったりした。^pr:i/v:chill|past/adv:again/prep:at det:the n:office",
"3^先生は庭で贈り物をあげる。^det:the n:teacher/v:give|base/det:a n:gift/prep:in det:the n:garden",
"1^かのじょは完ぺきに休んだ。^pr:she/v:rest|past/adv:perfectly",
"1^先生は学校で隠れた。^det:the n:teacher/v:hide|past/idm:at_school",
"3^男の子は台所でかばんを持って来た。^det:the n:boy/v:bring|past/det:a n:bag/prep:in det:the n:kitchen",
"2^あなたは7時にスーパーでランチを持ってくる。^pr:you/v:bring|base/n:lunch/prep:at det:the n:supermarket/idm:at_seven",
"2^お母さんは台所でいつも叫ぶ。^pr:i n:mom/adv:always v:shout|base/prep:in det:the n:kitchen",
"1^ねこは7時に踊った。^det:the n:cat/v:dance|past/idm:at_seven",
"3^お母さんは明日会社へたくさん旅行する予定だ。^pr:i n:mom/be:pres v:travel|ing/idm:a_lot/prep:to det:the n:office/adv:tomorrow",
"2^先生は今夜まちがいを見つけるだろう。^det:the n:teacher/be:pres v:find|ing/det:a n:mistake/adv:tonight",
"3^犬は今体育館でバスについていく。^det:the n:dog/v:follow|base/det:the n:bus/prep:in det:the n:gym/adv:now",
"2^先生はわたしの部屋で叫ぶ。^det:the n:teacher/v:shout|base/prep:in pr:i n:room",
"3^お父さんは川のそばで顔を見た。^pr:i n:dad/v:see|past/det:a n:face/prep:by det:the n:river",
"1^友だちはやさしく笑った。^pr:i n:friend|pl/v:laugh|past/adv:softly",
"3^お父さんは教室でスクーターに乗っている。^pr:i n:dad/be:pres v:ride|ing/det:a n:scooter/prep:in det:the n:classroom",
"3^ケンはもうすぐ川のそばで顔を見る。^n:Ken/v:see|base/det:a n:face/prep:by det:the n:river/adv:soon",
"2^ミカはテーブルを間に合うように作る。^n:Mika/v:make|base/det:a n:table/idm:in_time",
"3^お父さんは空港でゆっくり走っている。^pr:i n:dad/be:pres v:run|ing/adv:slowly/prep:at det:the n:airport",
"3^男の子は前回はわたしの部屋で牛乳を買った。^det:the n:boy/v:buy|past/n:milk/prep:in pr:i n:room/idm:last_time",
"3^友だちは明日会社で車を使うだろう。^pr:i n:friend|pl/modal:will v:use|base/det:the n:car/prep:at det:the n:office/adv:tomorrow",
"2^ケンは2時間教室でのんびりした。^n:Ken/v:relax|past/prep:in det:the n:classroom/idm:for_two_hours",
"2^かのじょは昨夜取っ手をいっしょに引いた。^pr:she/v:pull|past/det:a n:handle/adv:together/idm:last_night",
"1^お母さんは2時間泣いた。^pr:i n:mom/v:cry|past/idm:for_two_hours",
"1^お母さんは今日の午後着く。^pr:i n:mom/v:arrive|base/idm:this_afternoon",
"2^犬は動物園で近くで踊る。^det:the n:dog/v:dance|base/adv:nearby/prep:at det:the n:zoo",
"2^犬は7時にまんが映画を見る。^det:the n:dog/v:watch|base/det:a n:cartoon/idm:at_seven",
"1^かのじょは食べ物を運んだ。^pr:she/v:carry|past/n:food",
"2^わたしたちは家でまったりするつもりだ。^pr:we/modal:will v:chill|base/idm:at_home",
"2^お父さんは次は箱を閉める。^pr:i n:dad/v:close|base/det:the n:box/idm:next_time",
"3^お父さんは夜に会社でナイフを使う。^pr:i n:dad/v:use|base/det:a n:knife/prep:at det:the n:office/prep:at n:night",
"3^お母さんは店でリストをもう一度確認している。^pr:i n:mom/be:pres v:check|ing/det:a n:list/adv:again/prep:at det:the n:store",
"2^お母さんは庭で叫んでいる。^pr:i n:mom/be:pres v:shout|ing/prep:in det:the n:garden",
"3^友だちは先週図書館で写真を撮った。^pr:i n:friend|pl/v:take|past/det:a n:photo/prep:in det:the n:library/idm:last_week",
"2^あなたはもうすぐ質問をする。^pr:you/v:ask|base/det:a n:question/adv:soon",
"2^あなたはお茶を作っている。^pr:you/be:pres v:make|ing/n:tea",
"2^犬は一日じゅう体育館で泣いた。^det:the n:dog/v:cry|past/prep:in det:the n:gym/idm:all_day",
"2^お母さんはバスに乗った。^pr:i n:mom/v:ride|past/det:the n:bus",
"2^かれらは質問をするだろう。^pr:they/modal:will v:ask|base/det:a n:question",
"3^お父さんは駅で自然を守るだろう。^pr:i n:dad/modal:will v:protect|base/n:nature/prep:at det:the n:station",
"2^友だちは会社でのんびりするだろう。^pr:i n:friend|pl/modal:will v:relax|base/prep:at det:the n:office",
"3^先生は先週会社で制服を着た。^det:the n:teacher/v:wear|past/det:a n:uniform/prep:at det:the n:office/idm:last_week",
"3^かのじょは2時間台所でパレードを見た。^pr:she/v:watch|past/det:a n:parade/prep:in det:the n:kitchen/idm:for_two_hours",
"2^ケンは毎日花を持って来た。^n:Ken/v:bring|past/det:a n:flower/idm:every_day",
"2^かれらは時間どおりにのんびりしている。^pr:they/be:pres v:relax|ing/idm:on_time",
"2^かれは病院で道具を運んだ。^pr:he/v:carry|past/det:a n:tool/prep:at det:the n:hospital",
"2^友だちは野菜を時間どおりに売るだろう。^pr:i n:friend|pl/modal:will v:sell|base/n:vegetables/idm:on_time",
"2^あなたは会社で隠れる。^pr:you/v:hide|base/prep:at det:the n:office",
"2^友だちは地下鉄に乗る。^pr:i n:friend|pl/v:ride|base/det:a n:subway",
"3^ねこは今夜わたしの部屋でのんびりする予定だ。^det:the n:cat/be:pres v:relax|ing/prep:in pr:i n:room/adv:tonight",
"2^わたしは駅で踊るつもりだ。^pr:i/modal:will v:dance|base/prep:at det:the n:station",
"2^わたしたちは森で隠れる。^pr:we/v:hide|base/prep:in det:the n:forest",
"2^男の子は質問を突然した。^det:the n:boy/v:ask|past/det:a n:question/adv:suddenly",
"2^ねこは以前は踊っていた。^det:the n:cat/sm:used_to v:dance|base",
"3^お父さんは昨日カフェでスクーターに乗った。^pr:i n:dad/v:ride|past/det:a n:scooter/prep:at det:the n:cafe/adv:yesterday",
"2^わたしたちは今夜泣く予定だ。^pr:we/be:pres v:cry|ing/adv:tonight",
"1^男の子は下手に寝た。^det:the n:boy/v:sleep|past/adv:badly",
"2^ミカは7時に川のそばで踊るだろう。^n:Mika/modal:will v:dance|base/prep:by det:the n:river/idm:at_seven",
"2^ケンは今日動物園で踊った。^n:Ken/v:dance|past/prep:at det:the n:zoo/adv:today",
"1^かれらは毎朝突然踊る。^pr:they/v:dance|base/adv:suddenly/idm:every_morning",
"2^犬は家で車についていっている。^det:the n:dog/be:pres v:follow|ing/det:the n:car/idm:at_home",
"2^女の子は近くで寝ている。^det:the n:girl/be:pres v:sleep|ing/idm:close_by",
"1^ケンは今朝隠れた。^n:Ken/v:hide|past/idm:this_morning",
"2^お母さんは海辺で休むだろう。^pr:i n:mom/modal:will v:rest|base/prep:on det:the n:beach",
"2^あなたは庭でえんぴつを借りる。^pr:you/v:borrow|base/det:a n:pencil/prep:in det:the n:garden",
"2^わたしたちはいすをもう一度直した。^pr:we/v:fix|past/det:a n:chair/adv:again",
"2^ケンはくらやみで歩くだろう。^n:Ken/modal:will v:walk|base/idm:in_the_dark",
"3^わたしたちは今日図書館で質問をすばやくする。^pr:we/v:ask|base/det:a n:question/adv:quickly/prep:in det:the n:library/adv:today",
"2^ミカは7時に教室で怒ってまったりする。^n:Mika/v:chill|base/adv:angrily/prep:in det:the n:classroom/idm:at_seven",
"3^わたしは毎週東京でドレスをついに以前は作っていた。^pr:i/sm:used_to v:make|base/det:a n:dress/adv:finally/prep:in n:Tokyo/idm:every_week",
"2^犬は動物園へ来るだろう。^det:the n:dog/modal:will v:come|base/prep:to det:the n:zoo",
"1^男の子は今行く。^det:the n:boy/v:go|base/adv:now",
"2^友だちは今夜隠れる予定だ。^pr:i n:friend|pl/be:pres v:hide|ing/adv:tonight",
"2^ねこはさっき東京で勝った。^det:the n:cat/v:win|past/prep:in n:Tokyo/idm:just_now",
"1^お父さんは時間どおりに勝つ。^pr:i n:dad/v:win|base/idm:on_time",
"3^男の子は東京でノートを借りている。^det:the n:boy/be:pres v:borrow|ing/det:a n:notebook/prep:in n:Tokyo",
"2^わたしは川のそばで働いた。^pr:i/v:work|past/prep:by det:the n:river",
"1^わたしは突然着く。^pr:i/v:arrive|base/adv:suddenly",
"3^わたしは真夜中に公園でお金を以前は見つけていた。^pr:i/sm:used_to v:find|base/n:money/prep:in det:the n:park/prep:at n:midnight",
"2^わたしは病院で笑った。^pr:i/v:laugh|past/prep:at det:the n:hospital",
"2^ケンは東京で魚にえさをあげている。^n:Ken/be:pres v:feed|ing/n:fish/prep:in n:Tokyo",
"2^先生はバス停で踊る。^det:the n:teacher/v:dance|base/prep:at det:the n:bus_stop",
"2^男の子は夜に写真を撮る。^det:the n:boy/v:take|base/det:a n:photo/prep:at n:night",
"1^お母さんは2日前話した。^pr:i n:mom/v:talk|past/idm:two_days_ago",
"2^わたしたちは今わたしの部屋で休む。^pr:we/v:rest|base/prep:in pr:i n:room/adv:now",
"3^かれは昨夜カフェで水をいっしょに運んだ。^pr:he/v:carry|past/n:water/adv:together/prep:at det:the n:cafe/idm:last_night",
"2^ミカは毎日メールに返信する。^n:Mika/v:answer|base/det:a n:email/idm:every_day",
"2^友だちは一日じゅう親切に勝った。^pr:i n:friend|pl/v:win|past/adv:kindly/idm:all_day",
"1^あなたは2日前食べ物を持って来た。^pr:you/v:bring|past/n:food/idm:two_days_ago",
"2^ねこは昨夜試合を見た。^det:the n:cat/v:watch|past/det:a n:match/idm:last_night",
"2^友だちはレストランで歩いた。^pr:i n:friend|pl/v:walk|past/prep:at det:the n:restaurant",
"1^わたしたちは今来る。^pr:we/v:come|base/adv:now",
"1^お父さんはよく走る。^pr:i n:dad/adv:often v:run|base",
"3^友だちは明日スーパーで勝つだろう。^pr:i n:friend|pl/modal:will v:win|base/prep:at det:the n:supermarket/adv:tomorrow",
"3^女の子は来週ここで講演者を得意げに招待する予定だ。^det:the n:girl/be:pres v:invite|ing/det:a n:speaker/adv:proudly/adv:here/idm:next_week",
"3^お父さんは毎日川のそばで間に合うように走った。^pr:i n:dad/v:run|past/idm:in_time/prep:by det:the n:river/idm:every_day",
"2^先生は前回はカフェで踊った。^det:the n:teacher/v:dance|past/prep:at det:the n:cafe/idm:last_time",
"1^かのじょは先週急いだ。^pr:she/v:hurry|past/idm:last_week",
"2^男の子は先週会社で話した。^det:the n:boy/v:talk|past/prep:at det:the n:office/idm:last_week",
"1^お父さんはまったりした。^pr:i n:dad/v:chill|past",
"3^犬はさっき店で試合を見た。^det:the n:dog/v:watch|past/det:a n:match/prep:at det:the n:store/idm:just_now",
"1^わたしたちは昨日近くで勝った。^pr:we/v:win|past/idm:close_by/adv:yesterday",
"2^お母さんは駅でのんびりした。^pr:i n:mom/v:relax|past/prep:at det:the n:station",
"2^お母さんは前回は会社で笑った。^pr:i n:mom/v:laugh|past/prep:at det:the n:office/idm:last_time",
"2^お父さんは今あそこでパソコンを売る。^pr:i n:dad/v:sell|base/det:the n:computer/adv:there/adv:now",
"2^先生は道を作っている。^det:the n:teacher/be:pres v:build|ing/det:the n:road",
"2^友だちは冷蔵庫を静かに開けた。^pr:i n:friend|pl/v:open|past/det:a n:fridge/adv:quietly",
"2^男の子はさっき食べ物を運んだ。^det:the n:boy/v:carry|past/n:food/idm:just_now",
"2^かれは毎日自転車を下手に直した。^pr:he/v:fix|past/det:a n:bicycle/adv:badly/idm:every_day",
"2^お父さんは2日前ノートパソコンを借りた。^pr:i n:dad/v:borrow|past/det:a n:laptop/idm:two_days_ago",
"2^お母さんは家で下手にほほえんでいる。^pr:i n:mom/be:pres v:smile|ing/adv:badly/idm:at_home",
"2^ケンは前回は東京で野菜を買った。^n:Ken/v:buy|past/n:vegetables/prep:in n:Tokyo/idm:last_time",
"2^あなたは駅で隠れている。^pr:you/be:pres v:hide|ing/prep:at det:the n:station",
"3^ねこは川のそばで本を見つけた。^det:the n:cat/v:find|past/det:a n:book/prep:by det:the n:river",
"3^わたしたちは今朝庭でメッセージに下手に返信した。^pr:we/v:answer|past/det:a n:message/adv:badly/prep:in det:the n:garden/idm:this_morning",
"2^かれは毎日あそこでクレジットカードを使う。^pr:he/v:use|base/det:a n:credit_card/adv:there/idm:every_day",
"2^かれは駅でかばんを持っていた。^pr:he/v:have|past/det:a n:bag/prep:at det:the n:station",
"3^先生は川のそばでスクーターにくらやみで乗る。^det:the n:teacher/v:ride|base/det:a n:scooter/idm:in_the_dark/prep:by det:the n:river",
"2^あなたは今夜カフェで寝るだろう。^pr:you/modal:will v:sleep|base/prep:at det:the n:cafe/adv:tonight",
"1^かのじょは毎日泳ぐ。^pr:she/v:swim|base/idm:every_day",
"2^友だちはわたしの部屋で急げた。^pr:i n:friend|pl/modal:could v:hurry|base/prep:in pr:i n:room",
"1^わたしは次はここでジャンプする。^pr:i/v:jump|base/adv:here/idm:next_time",
"2^お母さんは庭で走るだろう。^pr:i n:mom/modal:will v:run|base/prep:in det:the n:garden",
"2^お父さんは封筒を安全に以前は閉じていた。^pr:i n:dad/sm:used_to v:close|base/det:a n:envelope/adv:safely",
"1^お母さんはすばやく旅行した。^pr:i n:mom/v:travel|past/adv:quickly",
"2^犬は東京で以前は泣いていた。^det:the n:dog/sm:used_to v:cry|base/prep:in n:Tokyo",
"2^先生は図書館ですばやく走った。^det:the n:teacher/v:run|past/adv:quickly/prep:in det:the n:library",
"1^ケンは昨日寝た。^n:Ken/v:sleep|past/adv:yesterday",
"2^犬は台所へ行くだろう。^det:the n:dog/modal:will v:go|base/prep:to det:the n:kitchen",
"3^ケンは今日カフェでわたしのスマホを使うだろう。^n:Ken/modal:will v:use|base/pr:i n:phone/prep:at det:the n:cafe/adv:today",
"3^わたしは自分の部屋でいつも映画を見る。^pr:i/adv:always v:see|base/det:a n:movie/prep:in pr:i n:room",
"2^ケンは図書館でびんを閉める。^n:Ken/v:close|base/det:a n:bottle/prep:in det:the n:library",
"3^ねこはカフェで方法を見つける。^det:the n:cat/v:find|base/det:a n:way/prep:at det:the n:cafe",
"3^ねこは今日会社で勝つだろう。^det:the n:cat/modal:will v:win|base/prep:at det:the n:office/adv:today",
"2^かれらは来週家でパソコンを持っているだろう。^pr:they/modal:will v:have|base/det:the n:computer/idm:at_home/idm:next_week",
"3^ケンは来週空港でていねいに笑う予定だ。^n:Ken/be:pres v:laugh|ing/adv:politely/prep:at det:the n:airport/idm:next_week",
"1^お母さんは2日前休んだ。^pr:i n:mom/v:rest|past/idm:two_days_ago",
"2^あなたは海辺で休む。^pr:you/v:rest|base/prep:on det:the n:beach",
"2^ねこは下手に泣いている。^det:the n:cat/be:pres v:cry|ing/adv:badly",
"3^わたしは毎日店で答えを見つけた。^pr:i/v:find|past/det:a n:answer/prep:at det:the n:store/idm:every_day",
"2^ねこは教室で急いでいる。^det:the n:cat/be:pres v:hurry|ing/prep:in det:the n:classroom",
"2^お父さんは質問をやさしくしている。^pr:i n:dad/be:pres v:ask|ing/det:a n:question/adv:softly",
"3^わたしは今公園でシャツを着る。^pr:i/v:wear|base/det:a n:shirt/prep:in det:the n:park/adv:now",
"2^あなたは動物園で地図を使う。^pr:you/v:use|base/det:a n:map/prep:at det:the n:zoo",
"2^先生は今朝おもちゃを得意げにあげた。^det:the n:teacher/v:give|past/det:a n:toy/adv:proudly/idm:this_morning",
"3^わたしたちは夜にバス停で自転車に乗るつもりだ。^pr:we/modal:will v:ride|base/det:a n:bike/prep:at det:the n:bus_stop/prep:at n:night",
"2^かのじょは2日前店で買い物した。^pr:she/v:shop|past/prep:at det:the n:store/idm:two_days_ago",
"2^犬は会社でのんびりする。^det:the n:dog/v:relax|base/prep:at det:the n:office",
"2^わたしは家で話している。^pr:i/be:pres v:talk|ing/idm:at_home",
"2^かれらは来週森で急ぐ予定だ。^pr:they/be:pres v:hurry|ing/prep:in det:the n:forest/idm:next_week",
"1^わたしはコンサートを見た。^pr:i/v:watch|past/det:a n:concert",
"2^かのじょはわたしの部屋で叫ぶ。^pr:she/v:shout|base/prep:in pr:i n:room",
"2^わたしは台所でせっけんを使うつもりだ。^pr:i/modal:will v:use|base/n:soap/prep:in det:the n:kitchen",
"2^わたしはカフェで食べ物を運ぶ。^pr:i/v:carry|base/n:food/prep:at det:the n:cafe",
"2^先生は森で以前は笑っていた。^det:the n:teacher/sm:used_to v:laugh|base/prep:in det:the n:forest",
"3^犬は昨日わたしの部屋でカメラを持っていた。^det:the n:dog/v:have|past/det:a n:camera/prep:in pr:i n:room/adv:yesterday",
"2^かのじょは2時間わたしの部屋で宿題をやった。^pr:she/v:do|past/n:homework/prep:in pr:i n:room/idm:for_two_hours",
"2^わたしたちは東京でカメラを借りる。^pr:we/v:borrow|base/det:a n:camera/prep:in n:Tokyo",
"2^わたしは今日病院でほほえんだ。^pr:i/v:smile|past/prep:at det:the n:hospital/adv:today",
"3^友だちはさっき台所で絵を売った。^pr:i n:friend|pl/v:sell|past/det:a n:painting/prep:in det:the n:kitchen/idm:just_now",
"2^先生は駅で寝た。^det:the n:teacher/v:sleep|past/prep:at det:the n:station",
"2^犬は2時間あそこで隠れた。^det:the n:dog/v:hide|past/adv:there/idm:for_two_hours",
"2^わたしたちはここでわたしのスマホを使った。^pr:we/v:use|past/pr:i n:phone/adv:here",
"1^わたしは前回はジャンプした。^pr:i/v:jump|past/idm:last_time",
"1^先生は家で笑った。^det:the n:teacher/v:laugh|past/idm:at_home",
"3^先生は月曜日にドアを以前は閉めていた。^det:the n:teacher/sm:used_to v:close|base/det:the n:door/prep:on n:Monday",
"3^犬は駅でペンをなくすところだ。^det:the n:dog/be:pres v:lose|ing/det:a n:pen/prep:at det:the n:station",
"2^かれは毎朝依頼に応じた。^pr:he/v:answer|past/det:a n:request/idm:every_morning",
"1^先生はもうすぐ買い物する。^det:the n:teacher/v:shop|base/adv:soon",
"3^犬は夜にわたしの部屋で仕事を見つけた。^det:the n:dog/v:find|past/det:a n:job/prep:in pr:i n:room/prep:at n:night",
"2^お母さんは7時に空港でまったりした。^pr:i n:mom/v:chill|past/prep:at det:the n:airport/idm:at_seven",
"2^わたしは今台所でつづりを確認する。^pr:i/v:check|base/n:spelling/prep:in det:the n:kitchen/adv:now",
"2^かのじょはバス停で歩いた。^pr:she/v:walk|past/prep:at det:the n:bus_stop",
"2^わたしたちは今日東京で笑った。^pr:we/v:laugh|past/prep:in n:Tokyo/adv:today",
"3^わたしたちは毎日図書館で植物を守る。^pr:we/v:protect|base/det:a n:plant/prep:in det:the n:library/idm:every_day",
"3^女の子は川のそばで答えを安全に見つけた。^det:the n:girl/v:find|past/det:a n:answer/adv:safely/prep:by det:the n:river",
"2^友だちは教室で踊った。^pr:i n:friend|pl/v:dance|past/prep:in det:the n:classroom",
"2^わたしたちは朝に活動をやった。^pr:we/v:do|past/det:a n:activity/prep:in det:the n:morning",
"2^女の子は台所で笑っている。^det:the n:girl/be:pres v:laugh|ing/prep:in det:the n:kitchen",
"2^犬は東京で勝った。^det:the n:dog/v:win|past/prep:in n:Tokyo",
"2^ケンはさっき川のそばで話した。^n:Ken/v:talk|past/prep:by det:the n:river/idm:just_now",
"2^ケンはレストランで歩いている。^n:Ken/be:pres v:walk|ing/prep:at det:the n:restaurant",
"2^ミカは7時に宝飾品を売るだろう。^n:Mika/modal:will v:sell|base/n:jewelry/idm:at_seven",
"2^お父さんは一日じゅう電車に乗るだろう。^pr:i n:dad/modal:will v:ride|base/det:the n:train/idm:all_day",
"1^ケンは2日前ランチを作った。^n:Ken/v:make|past/n:lunch/idm:two_days_ago",
"2^かのじょは駅でわたしのスマホを直した。^pr:she/v:fix|past/pr:i n:phone/prep:at det:the n:station",
"2^男の子は安全に寝るだろう。^det:the n:boy/modal:will v:sleep|base/adv:safely",
"2^かれらは東京で車を売る。^pr:they/v:sell|base/det:the n:car/prep:in n:Tokyo",
"2^お母さんは2時間魚にえさをあげた。^pr:i n:mom/v:feed|past/n:fish/idm:for_two_hours",
"3^お父さんは今日の午後レストランでドアを開けられた。^pr:i n:dad/modal:could v:open|base/det:the n:door/prep:at det:the n:restaurant/idm:this_afternoon",
"2^ミカは次は森で急ぐ。^n:Mika/v:hurry|base/prep:in det:the n:forest/idm:next_time",
"1^ねこは毎日寝る。^det:the n:cat/v:sleep|base/idm:every_day",
"3^お父さんは前回は会社でお金を見つけた。^pr:i n:dad/v:find|past/n:money/prep:at det:the n:office/idm:last_time",
"3^ケンは昨日台所で答えを見つけた。^n:Ken/v:find|past/det:a n:answer/prep:in det:the n:kitchen/adv:yesterday",
"2^お父さんは今朝学校で花を買った。^pr:i n:dad/v:buy|past/det:a n:flower/idm:at_school/idm:this_morning",
"1^お母さんは学校で働いた。^pr:i n:mom/v:work|past/idm:at_school",
"3^わたしたちは朝に教室でのんびりする。^pr:we/v:relax|base/prep:in det:the n:classroom/prep:in det:the n:morning",
"2^あなたは7時に稲を間に合うように植える。^pr:you/v:plant|base/det:a n:rice_plant/idm:in_time/idm:at_seven",
"3^男の子は昨日台所で間に合うように働いた。^det:the n:boy/v:work|past/idm:in_time/prep:in det:the n:kitchen/adv:yesterday",
"3^お母さんは次は店でリストを確認する。^pr:i n:mom/v:check|base/det:a n:list/prep:at det:the n:store/idm:next_time",
"2^ケンは会社で休む。^n:Ken/v:rest|base/prep:at det:the n:office",
"3^わたしたちは夕方に動物園で以前は泣いていた。^pr:we/sm:used_to v:cry|base/prep:at det:the n:zoo/prep:in det:the n:evening",
"1^先生はかんたんに勝った。^det:the n:teacher/v:win|past/adv:easily",
"1^ミカは講演者を招待した。^n:Mika/v:invite|past/det:a n:speaker",
"2^男の子は先週公園で寝た。^det:the n:boy/v:sleep|past/prep:in det:the n:park/idm:last_week",
"2^かのじょは毎日台所で泳ぐ。^pr:she/v:swim|base/prep:in det:the n:kitchen/idm:every_day",
"1^お母さんはもうすぐ歩く。^pr:i n:mom/v:walk|base/adv:soon",
"3^ねこは教室でカメラを運んだ。^det:the n:cat/v:carry|past/det:a n:camera/prep:in det:the n:classroom",
"2^わたしはさっき家で買い物できた。^pr:i/modal:could v:shop|base/idm:at_home/idm:just_now",
"3^女の子は教室でテーブルを作った。^det:the n:girl/v:make|past/det:a n:table/prep:in det:the n:classroom",
"2^ねこは公園で得意げにジャンプした。^det:the n:cat/v:jump|past/adv:proudly/prep:in det:the n:park",
"2^ケンは前回は体育館で踊った。^n:Ken/v:dance|past/prep:in det:the n:gym/idm:last_time",
"2^友だちは7時に教室で勝つ。^pr:i n:friend|pl/v:win|base/prep:in det:the n:classroom/idm:at_seven",
"2^ミカは講演者を近くで招待するだろう。^n:Mika/modal:will v:invite|base/det:a n:speaker/idm:close_by",
"3^お父さんはバス停で電車に乗る。^pr:i n:dad/v:ride|base/det:the n:train/prep:at det:the n:bus_stop",
"1^ケンは2時間急いだ。^n:Ken/v:hurry|past/idm:for_two_hours",
"3^男の子は台所でふだん短パンをはく。^det:the n:boy/adv:usually v:wear|base/n:shorts/prep:in det:the n:kitchen",
"2^女の子は7時にカフェで踊る。^det:the n:girl/v:dance|base/prep:at det:the n:cafe/idm:at_seven",
"2^ケンは一日じゅう庭で急ぐだろう。^n:Ken/modal:will v:hurry|base/prep:in det:the n:garden/idm:all_day",
"1^先生はもうすぐ笑う。^det:the n:teacher/v:laugh|base/adv:soon",
"2^わたしは自分の部屋で泳ぐ。^pr:i/v:swim|base/prep:in pr:i n:room",
"2^お父さんは夜に家で休むだろう。^pr:i n:dad/modal:will v:rest|base/idm:at_home/prep:at n:night",
"1^先生はまったりした。^det:the n:teacher/v:chill|past",
"2^友だちは夜にくだものを売る。^pr:i n:friend|pl/v:sell|base/n:fruit/prep:at n:night",
"2^かれらはレストランで叫ぶだろう。^pr:they/modal:will v:shout|base/prep:at det:the n:restaurant",
"2^男の子は図書館で歩く。^det:the n:boy/v:walk|base/prep:in det:the n:library",
"2^ケンはわたしの部屋で皿を洗う。^n:Ken/v:do|base/det:the n:dishes/prep:in pr:i n:room",
"1^かれはもうすぐ歩く。^pr:he/v:walk|base/adv:soon",
"2^あなたは教室でのんびりした。^pr:you/v:relax|past/prep:in det:the n:classroom",
"2^お父さんは夜に来る。^pr:i n:dad/v:come|base/prep:at n:night",
"2^犬は昨日目を守った。^det:the n:dog/v:protect|past/det:a n:eye/adv:yesterday",
"3^かれは朝に海辺でまったりする。^pr:he/v:chill|base/prep:on det:the n:beach/prep:in det:the n:morning",
"2^男の子は腕時計をもう一度直すだろう。^det:the n:boy/modal:will v:fix|base/det:a n:watch/adv:again",
"2^お父さんは海辺でジャンプした。^pr:i n:dad/v:jump|past/prep:on det:the n:beach",
"2^ケンはもうすぐ森で食べ物を運ぶ。^n:Ken/v:carry|base/n:food/prep:in det:the n:forest/adv:soon",
"2^ケンはさっき教室で働いた。^n:Ken/v:work|past/prep:in det:the n:classroom/idm:just_now",
"2^わたしは家でカードを作る。^pr:i/v:make|base/det:a n:card/idm:at_home",
"1^犬は今朝歩いた。^det:the n:dog/v:walk|past/idm:this_morning",
"2^わたしは毎朝自転車を近くで直す。^pr:i/v:fix|base/det:a n:bike/idm:close_by/idm:every_morning",
"3^先生は病院で屋根を直す。^det:the n:teacher/v:fix|base/det:a n:roof/prep:at det:the n:hospital",
"2^かれは2日前スーパーでジャンプした。^pr:he/v:jump|past/prep:at det:the n:supermarket/idm:two_days_ago",
"3^女の子は2時間体育館でノートパソコンをもう一度使えた。^det:the n:girl/modal:could v:use|base/det:a n:laptop/adv:again/prep:in det:the n:gym/idm:for_two_hours",
"1^お母さんはまったりした。^pr:i n:mom/v:chill|past",
"3^ミカはもうすぐ図書館でかばんをなくす。^n:Mika/v:lose|base/det:a n:bag/prep:in det:the n:library/adv:soon",
"2^お母さんは毎朝得意げに着く。^pr:i n:mom/v:arrive|base/adv:proudly/idm:every_morning",
"3^かれらは朝にバス停へ行く。^pr:they/v:go|base/prep:to det:the n:bus_stop/prep:in det:the n:morning",
"2^ケンはレストランで寝ている。^n:Ken/be:pres v:sleep|ing/prep:at det:the n:restaurant",
"1^お母さんは今日ほほえんだ。^pr:i n:mom/v:smile|past/adv:today",
"2^あなたは来週魚にえさをあげるだろう。^pr:you/modal:will v:feed|base/n:fish/idm:next_week",
"2^ケンは図書館で玄関の呼び出しに応じた。^n:Ken/v:answer|past/det:the n:door/prep:in det:the n:library",
"2^女の子はあそこで家を見た。^det:the n:girl/v:see|past/det:a n:house/adv:there",
"2^お父さんは次はスクーターに乗る。^pr:i n:dad/v:ride|base/det:a n:scooter/idm:next_time",
"1^ミカは毎朝行く。^n:Mika/v:go|base/idm:every_morning",
"2^わたしはふだんプレゼントをあげる。^pr:i/adv:usually v:give|base/det:a n:present",
"2^かれらは動物園でほほえむ。^pr:they/v:smile|base/prep:at det:the n:zoo",
"3^お父さんはもうすぐ店でカードをあげる。^pr:i n:dad/v:give|base/det:a n:card/prep:at det:the n:store/adv:soon",
"2^あなたは7時に依頼に応じる。^pr:you/v:answer|base/det:a n:request/idm:at_seven",
"1^ミカはやさしく寝る。^n:Mika/v:sleep|base/adv:softly",
"3^友だちは毎日森で野菜を売る。^pr:i n:friend|pl/v:sell|base/n:vegetables/prep:in det:the n:forest/idm:every_day",
"2^あなたは森で泣く。^pr:you/v:cry|base/prep:in det:the n:forest",
"3^かのじょは今夜森でケーキを持ってくるだろう。^pr:she/modal:will v:bring|base/det:a n:cake/prep:in det:the n:forest/adv:tonight",
"1^わたしはいつもたくさん笑う。^pr:i/adv:always v:laugh|base/idm:a_lot",
"3^男の子は朝に学校で写真を以前は送っていた。^det:the n:boy/sm:used_to v:send|base/det:a n:photo/idm:at_school/prep:in det:the n:morning",
"3^友だちは7時にわたしの部屋で地図をすばやく使うだろう。^pr:i n:friend|pl/modal:will v:use|base/det:a n:map/adv:quickly/prep:in pr:i n:room/idm:at_seven",
"1^ミカは一日じゅう近くで話した。^n:Mika/v:talk|past/adv:nearby/idm:all_day",
"2^お母さんは先週学校でほほえんだ。^pr:i n:mom/v:smile|past/idm:at_school/idm:last_week",
"1^友だちは次はのんびりする。^pr:i n:friend|pl/v:relax|base/idm:next_time",
"2^わたしは毎日バス停でまったりする。^pr:i/v:chill|base/prep:at det:the n:bus_stop/idm:every_day",
"1^男の子は先週働いた。^det:the n:boy/v:work|past/idm:last_week",
"2^犬は教室で踊る。^det:the n:dog/v:dance|base/prep:in det:the n:classroom",
"2^かれは次は駅でパジャマを着る。^pr:he/v:wear|base/n:pajamas/prep:at det:the n:station/idm:next_time",
"2^ミカは図書館で道具を運ぶ。^n:Mika/v:carry|base/det:a n:tool/prep:in det:the n:library",
"3^友だちは今バス停で叫んでいる。^pr:i n:friend|pl/be:pres v:shout|ing/prep:at det:the n:bus_stop/adv:now",
"2^あなたはスーパーで以前は急いでいた。^pr:you/sm:used_to v:hurry|base/prep:at det:the n:supermarket",
"2^女の子はもうすぐ贈り物をあげる。^det:the n:girl/v:give|base/det:a n:gift/adv:soon",
"2^あなたは動物園で豆を植えた。^pr:you/v:plant|past/det:a n:bean/prep:at det:the n:zoo",
"2^犬は今日の午後絵を見た。^det:the n:dog/v:see|past/det:a n:picture/idm:this_afternoon",
"2^わたしたちは今旅行している。^pr:we/be:pres v:travel|ing/adv:now",
"3^先生は明日体育館へ来るだろう。^det:the n:teacher/modal:will v:come|base/prep:to det:the n:gym/adv:tomorrow",
"3^わたしたちは毎朝教室で質問にもう一度答える。^pr:we/v:answer|base/det:a n:question/adv:again/prep:in det:the n:classroom/idm:every_morning",
"2^ミカは東京で車を使うだろう。^n:Mika/modal:will v:use|base/det:the n:car/prep:in n:Tokyo",
"2^わたしは今日動物園で走った。^pr:i/v:run|past/prep:at det:the n:zoo/adv:today",
"2^わたしは図書館で隠れるつもりだ。^pr:i/modal:will v:hide|base/prep:in det:the n:library",
"2^あなたは先週かさを開いた。^pr:you/v:open|past/det:a n:umbrella/idm:last_week",
"2^犬はスーパーで隠れる。^det:the n:dog/v:hide|base/prep:at det:the n:supermarket",
"1^かれは2日前泣いた。^pr:he/v:cry|past/idm:two_days_ago",
"2^先生はもうすぐシャンプーをくらやみで使う。^det:the n:teacher/v:use|base/n:shampoo/idm:in_the_dark/adv:soon",
"2^かのじょは東京で食べ物をゆっくり運んだ。^pr:she/v:carry|past/n:food/adv:slowly/prep:in n:Tokyo",
"1^かれらはここで働く。^pr:they/v:work|base/adv:here",
"2^男の子は朝に来る。^det:the n:boy/v:come|base/prep:in det:the n:morning",
"2^ねこは今日安全に寝た。^det:the n:cat/v:sleep|past/adv:safely/adv:today",
"1^女の子は一日じゅう話した。^det:the n:girl/v:talk|past/idm:all_day",
"2^かれは昨日いすを作った。^pr:he/v:make|past/det:a n:chair/adv:yesterday",
"2^男の子は動物園で泳ぐ。^det:the n:boy/v:swim|base/prep:at det:the n:zoo",
"2^あなたは東京で休んでいる。^pr:you/be:pres v:rest|ing/prep:in n:Tokyo",
"3^女の子は今日体育館で腕時計をなくすところだ。^det:the n:girl/be:pres v:lose|ing/det:a n:watch/prep:in det:the n:gym/adv:today",
"2^あなたは川のそばでくだものを買うだろう。^pr:you/modal:will v:buy|base/n:fruit/prep:by det:the n:river",
"3^犬は店で近くで踊れる。^det:the n:dog/modal:can v:dance|base/idm:close_by/prep:at det:the n:store",
"2^ミカは毎日玄関の呼び出しに応じる。^n:Mika/v:answer|base/det:the n:door/idm:every_day",
"2^犬は夜に劇を見た。^det:the n:dog/v:watch|past/det:a n:play/prep:at n:night",
"3^かれはスーパーで講演者を招待している。^pr:he/be:pres v:invite|ing/det:a n:speaker/prep:at det:the n:supermarket",
"3^わたしは次は海辺でプリンターを使う予定だ。^pr:i/be:pres v:use|ing/det:a n:printer/prep:on det:the n:beach/idm:next_time",
"2^わたしは2日前スーパーにやさしく着いた。^pr:i/v:arrive|past/adv:softly/prep:at det:the n:supermarket/idm:two_days_ago",
"2^犬は病院で寝る。^det:the n:dog/v:sleep|base/prep:at det:the n:hospital",
"2^わたしはさっき駅で勝った。^pr:i/v:win|past/prep:at det:the n:station/idm:just_now",
"3^お父さんは7時にカフェで以前は笑っていた。^pr:i n:dad/sm:used_to v:laugh|base/prep:at det:the n:cafe/idm:at_seven",
"2^あなたは昨夜車についていった。^pr:you/v:follow|past/det:the n:car/idm:last_night",
"3^お母さんは7時に駅でメッセージに返信する。^pr:i n:mom/v:answer|base/det:a n:message/prep:at det:the n:station/idm:at_seven",
"3^先生は体育館でジェットコースターにかんたんに乗っている。^det:the n:teacher/be:pres v:ride|ing/det:a n:roller_coaster/adv:easily/prep:in det:the n:gym",
"3^友だちは毎日スーパーで近くでジャンプする。^pr:i n:friend|pl/v:jump|base/adv:nearby/prep:at det:the n:supermarket/idm:every_day",
"1^ケンはもうすぐ走る。^n:Ken/v:run|base/adv:soon",
"1^かれは夜に隠れた。^pr:he/v:hide|past/prep:at n:night",
"1^犬は今歩く。^det:the n:dog/v:walk|base/adv:now",
"3^友だちは教室で封筒を開けるだろう。^pr:i n:friend|pl/modal:will v:open|base/det:a n:envelope/prep:in det:the n:classroom",
"2^かれは朝に自転車に乗った。^pr:he/v:ride|past/det:a n:bike/prep:in det:the n:morning",
"2^ねこは毎朝図書館で勝つ。^det:the n:cat/v:win|base/prep:in det:the n:library/idm:every_morning",
"3^ケンは図書館でお金をいっしょにあげている。^n:Ken/be:pres v:give|ing/n:money/adv:together/prep:in det:the n:library",
"2^ミカはスーパーでのんびりするだろう。^n:Mika/modal:will v:relax|base/prep:at det:the n:supermarket",
"2^かれらはカフェに着くだろう。^pr:they/modal:will v:arrive|base/prep:at det:the n:cafe",
"2^友だちは2日前図書館で急いだ。^pr:i n:friend|pl/v:hurry|past/prep:in det:the n:library/idm:two_days_ago",
"2^ケンは来週バスに得意げについていく予定だ。^n:Ken/be:pres v:follow|ing/det:the n:bus/adv:proudly/idm:next_week",
"2^かれはもうすぐドアを引く。^pr:he/v:pull|base/det:the n:door/adv:soon",
"2^女の子は朝に走る。^det:the n:girl/v:run|base/prep:in det:the n:morning",
"1^かれは東京で休む。^pr:he/v:rest|base/prep:in n:Tokyo",
"2^かれはあそこでおもちゃを作った。^pr:he/v:make|past/det:a n:toy/adv:there",
"1^先生は2日前寝た。^det:the n:teacher/v:sleep|past/idm:two_days_ago",
"2^わたしたちはレストランで食べ物を作っている。^pr:we/be:pres v:make|ing/n:food/prep:at det:the n:restaurant",
"2^先生は毎日図書館でジャンプする。^det:the n:teacher/v:jump|base/prep:in det:the n:library/idm:every_day",
"2^ミカは海辺でいすを持ってくる。^n:Mika/v:bring|base/det:a n:chair/prep:on det:the n:beach",
"2^かれらは今夜休む予定だ。^pr:they/be:pres v:rest|ing/adv:tonight",
"3^お母さんは今スーパーで走っている。^pr:i n:mom/be:pres v:run|ing/prep:at det:the n:supermarket/adv:now",
"3^ミカは朝に庭で練習をする。^n:Mika/v:do|base/n:practice/prep:in det:the n:garden/prep:in det:the n:morning",
"2^女の子はさっき駅に着いた。^det:the n:girl/v:arrive|past/prep:at det:the n:station/idm:just_now",
"2^犬は2日前台所へ来た。^det:the n:dog/v:come|past/prep:to det:the n:kitchen/idm:two_days_ago",
"3^あなたは図書館で顔を見るだろう。^pr:you/modal:will v:see|base/det:a n:face/prep:in det:the n:library",
"3^犬は朝にわたしの部屋で歩く。^det:the n:dog/v:walk|base/prep:in pr:i n:room/prep:in det:the n:morning",
"2^男の子は食べ物をあげるだろう。^det:the n:boy/modal:will v:give|base/n:food",
"1^わたしは今朝服を買った。^pr:i/v:buy|past/n:clothes/idm:this_morning",
"2^かのじょは会社で朝ごはんを作っている。^pr:she/be:pres v:make|ing/n:breakfast/prep:at det:the n:office",
"2^男の子はさっきスーツケースを開けた。^det:the n:boy/v:open|past/det:a n:suitcase/idm:just_now",
"1^ケンは昨夜ジャンプした。^n:Ken/v:jump|past/idm:last_night",
"1^犬は家で踊る。^det:the n:dog/v:dance|base/idm:at_home",
"2^かれらは家でテレビを見る。^pr:they/v:watch|base/det:the n:TV/idm:at_home",
"1^わたしは昨夜学校で泳いだ。^pr:i/v:swim|past/idm:at_school/idm:last_night",
"2^お父さんはレストランで買い物した。^pr:i n:dad/v:shop|past/prep:at det:the n:restaurant",
"1^わたしは今日の午後休んだ。^pr:i/v:rest|past/idm:this_afternoon",
"3^友だちは今日店でいすを近くで引いた。^pr:i n:friend|pl/v:pull|past/det:a n:chair/adv:nearby/prep:at det:the n:store/adv:today",
"2^わたしたちは川のそばでコンサートを見た。^pr:we/v:watch|past/det:a n:concert/prep:by det:the n:river",
"1^かれは昨夜ほほえんだ。^pr:he/v:smile|past/idm:last_night",
"3^犬はバス停で家を見つけた。^det:the n:dog/v:find|past/det:a n:house/prep:at det:the n:bus_stop",
"2^ケンはテストを怒ってやっている。^n:Ken/be:pres v:do|ing/det:a n:test/adv:angrily",
"2^友だちは店へ旅行した。^pr:i n:friend|pl/v:travel|past/prep:to det:the n:store",
"3^先生は一日じゅう台所で水を持って来た。^det:the n:teacher/v:bring|past/n:water/prep:in det:the n:kitchen/idm:all_day",
"3^ミカは今朝台所でチューリップを植えた。^n:Mika/v:plant|past/det:a n:tulip/prep:in det:the n:kitchen/idm:this_morning",
"2^お父さんは2時間エレベーターに乗った。^pr:i n:dad/v:ride|past/det:a n:elevator/idm:for_two_hours",
"1^ねこは毎朝急ぐ。^det:the n:cat/v:hurry|base/idm:every_morning",
"2^かれらは空港でほほえんだ。^pr:they/v:smile|past/prep:at det:the n:airport",
"1^ねこは近くでのんびりした。^det:the n:cat/v:relax|past/idm:close_by",
"2^わたしたちは森で買い物する。^pr:we/v:shop|base/prep:in det:the n:forest",
"1^わたしは毎朝ここへ来る。^pr:i/v:come|base/adv:here/idm:every_morning",
"2^わたしたちは朝にタオルを持って来た。^pr:we/v:bring|past/det:a n:towel/prep:in det:the n:morning",
"2^わたしは次は叫ぶつもりだ。^pr:i/modal:will v:shout|base/idm:next_time",
"1^ミカはノートをなくした。^n:Mika/v:lose|past/det:a n:notebook",
"2^犬は図書館で泣いた。^det:the n:dog/v:cry|past/prep:in det:the n:library",
"2^お母さんは今さいふをなくす。^pr:i n:mom/v:lose|base/det:a n:wallet/adv:now",
"3^お父さんはスーパーで花を植えるだろう。^pr:i n:dad/modal:will v:plant|base/det:a n:flower/prep:at det:the n:supermarket",
"2^男の子は今情報を近くで見つける。^det:the n:boy/v:find|base/n:information/idm:close_by/adv:now",
"1^あなたは2日前話した。^pr:you/v:talk|past/idm:two_days_ago",
"2^ねこは病院で踊った。^det:the n:cat/v:dance|past/prep:at det:the n:hospital",
"2^わたしは今朝学校でかばんを持って来た。^pr:i/v:bring|past/det:a n:bag/idm:at_school/idm:this_morning",
"2^かれは今日の午後ジャンプしている。^pr:he/be:pres v:jump|ing/idm:this_afternoon",
"2^先生は前回は質問があった。^det:the n:teacher/v:have|past/det:a n:question/idm:last_time",
"2^男の子は2日前わたしの電話に出た。^det:the n:boy/v:answer|past/pr:i n:phone/idm:two_days_ago",
"2^男の子は森でまったりしている。^det:the n:boy/be:pres v:chill|ing/prep:in det:the n:forest",
"3^かのじょは昨夜駅で取っ手をすばやく引いた。^pr:she/v:pull|past/det:a n:handle/adv:quickly/prep:at det:the n:station/idm:last_night",
"2^かれは夜に食べ物を間に合うようにあげた。^pr:he/v:give|past/n:food/idm:in_time/prep:at n:night",
"2^かれはカフェで間に合うようにジャンプした。^pr:he/v:jump|past/idm:in_time/prep:at det:the n:cafe",
"2^わたしは庭に怒って着くところだ。^pr:i/be:pres v:arrive|ing/adv:angrily/prep:in det:the n:garden",
"3^男の子は次はカフェで突然泣く。^det:the n:boy/v:cry|base/adv:suddenly/prep:at det:the n:cafe/idm:next_time",
"2^先生は今夜カードを作る予定だ。^det:the n:teacher/be:pres v:make|ing/det:a n:card/adv:tonight",
"1^かれはのんびりした。^pr:he/v:relax|past",
"2^あなたはペンをていねいに借りた。^pr:you/v:borrow|past/det:a n:pen/adv:politely",
"3^ケンは動物園で手紙を送るだろう。^n:Ken/modal:will v:send|base/det:a n:letter/prep:at det:the n:zoo",
"2^お母さんは次はくらやみで泳ぐ予定だ。^pr:i n:mom/be:pres v:swim|ing/idm:in_the_dark/idm:next_time",
"1^かのじょは今日ジャンプする。^pr:she/v:jump|base/adv:today",
"2^女の子は公園で寝た。^det:the n:girl/v:sleep|past/prep:in det:the n:park",
"2^ねこは朝に来る。^det:the n:cat/v:come|base/prep:in det:the n:morning",
"2^犬はわたしの部屋でジャンプする。^det:the n:dog/v:jump|base/prep:in pr:i n:room",
"2^ねこはさっきびんを運んだ。^det:the n:cat/v:carry|past/det:a n:bottle/idm:just_now",
"3^女の子は図書館で皿を洗っている。^det:the n:girl/be:pres v:do|ing/det:the n:dishes/prep:in det:the n:library",
"2^お母さんは毎日家で踊る。^pr:i n:mom/v:dance|base/idm:at_home/idm:every_day",
"2^女の子は図書館に着いた。^det:the n:girl/v:arrive|past/prep:in det:the n:library",
"2^先生はかさを親切に開く。^det:the n:teacher/v:open|base/det:a n:umbrella/adv:kindly",
"2^女の子は台所へ旅行した。^det:the n:girl/v:travel|past/prep:to det:the n:kitchen",
"3^お父さんはカフェでケーキを持って来た。^pr:i n:dad/v:bring|past/det:a n:cake/prep:at det:the n:cafe",
"2^お母さんは東京へ行くだろう。^pr:i n:mom/modal:will v:go|base/prep:to n:Tokyo",
"2^女の子はもうすぐ来るだろう。^det:the n:girl/modal:will v:come|base/adv:soon",
"3^お母さんは今夜川のそばで隠れる予定だ。^pr:i n:mom/be:pres v:hide|ing/prep:by det:the n:river/adv:tonight",
"2^かのじょは店で間に合うように勝つ。^pr:she/v:win|base/idm:in_time/prep:at det:the n:store",
"2^あなたは空港で間に合うように勝つ。^pr:you/v:win|base/idm:in_time/prep:at det:the n:airport",
"2^ねこはまちがいをいっしょに見つけた。^det:the n:cat/v:find|past/det:a n:mistake/adv:together",
"2^かのじょは来週図書館へ旅行する予定だ。^pr:she/be:pres v:travel|ing/prep:to det:the n:library/idm:next_week",
"2^ミカは体育館で急いだ。^n:Mika/v:hurry|past/prep:in det:the n:gym",
"2^ミカはさっき家を見つけた。^n:Mika/v:find|past/det:a n:house/idm:just_now",
"2^ケンは店でのんびりした。^n:Ken/v:relax|past/prep:at det:the n:store",
"2^お母さんはさっき教室に着いた。^pr:i n:mom/v:arrive|past/prep:in det:the n:classroom/idm:just_now",
"2^お父さんは森へ突然行く。^pr:i n:dad/v:go|base/adv:suddenly/prep:to det:the n:forest",
"2^かれらはここでかさを開くだろう。^pr:they/modal:will v:open|base/det:a n:umbrella/adv:here",
"3^ミカは公園でチューリップを植えるだろう。^n:Mika/modal:will v:plant|base/det:a n:tulip/prep:in det:the n:park",
"2^ミカはさっきいすを持って来た。^n:Mika/v:bring|past/det:a n:chair/idm:just_now",
"2^お母さんは朝に家に着く。^pr:i n:mom/v:arrive|base/idm:at_home/prep:in det:the n:morning",
"2^友だちはついに着くだろう。^pr:i n:friend|pl/modal:will v:arrive|base/adv:finally",
"2^かのじょは次はバス停で働く。^pr:she/v:work|base/prep:at det:the n:bus_stop/idm:next_time",
"3^かれは来週台所で口を開く予定だ。^pr:he/be:pres v:open|ing/pr:he n:mouth/prep:in det:the n:kitchen/idm:next_week",
"2^友だちは2時間川のそばで叫んだ。^pr:i n:friend|pl/v:shout|past/prep:by det:the n:river/idm:for_two_hours",
"2^かれは前回はあそこで指輪をなくした。^pr:he/v:lose|past/det:a n:ring/adv:there/idm:last_time",
"2^ねこは夜に走る。^det:the n:cat/v:run|base/prep:at n:night",
"2^お父さんは庭で勝てる。^pr:i n:dad/modal:can v:win|base/prep:in det:the n:garden",
"3^女の子は2日前家で手紙を送れた。^det:the n:girl/modal:could v:send|base/det:a n:letter/idm:at_home/idm:two_days_ago",
"2^お母さんはメールを時間どおりに送った。^pr:i n:mom/v:send|past/det:a n:email/idm:on_time",
"2^わたしたちは今日の午後川のそばで休む。^pr:we/v:rest|base/prep:by det:the n:river/idm:this_afternoon",
"3^ねこは庭でバスについていく。^det:the n:cat/v:follow|base/det:the n:bus/prep:in det:the n:garden",
"1^お父さんはもうすぐジャンプする。^pr:i n:dad/v:jump|base/adv:soon",
"2^ケンは今夜写真を撮るだろう。^n:Ken/modal:will v:take|base/det:a n:photo/adv:tonight",
"2^かのじょは2日前公園へ旅行した。^pr:she/v:travel|past/prep:to det:the n:park/idm:two_days_ago",
"2^あなたはさっきプリンターを直した。^pr:you/v:fix|past/det:a n:printer/idm:just_now",
"3^お母さんは来週川のそばで泣く予定だ。^pr:i n:mom/be:pres v:cry|ing/prep:by det:the n:river/idm:next_week",
"1^ミカは一日じゅうもう一度叫んだ。^n:Mika/v:shout|past/adv:again/idm:all_day",
"2^かのじょは先週動物園で寝た。^pr:she/v:sleep|past/prep:at det:the n:zoo/idm:last_week",
"2^ケンは今日車を借りる。^n:Ken/v:borrow|base/det:the n:car/adv:today",
"3^友だちは川のそばで本をなくした。^pr:i n:friend|pl/v:lose|past/det:a n:book/prep:by det:the n:river",
"2^ケンは明日駅で勝つだろう。^n:Ken/be:pres v:win|ing/prep:at det:the n:station/adv:tomorrow",
"3^お父さんは公園で贈り物を持って来た。^pr:i n:dad/v:bring|past/det:a n:gift/prep:in det:the n:park",
"2^先生はジャケットをいっしょに借りた。^det:the n:teacher/v:borrow|past/det:a n:jacket/adv:together",
"3^あなたはカフェでかさを開いている。^pr:you/be:pres v:open|ing/det:a n:umbrella/prep:at det:the n:cafe",
"2^男の子は切符をなくすところだ。^det:the n:boy/be:pres v:lose|ing/det:a n:ticket",
"2^先生は毎朝ペンを使えた。^det:the n:teacher/modal:could v:use|base/det:a n:pen/idm:every_morning",
"1^あなたはサンドイッチを作る。^pr:you/v:make|base/det:a n:sandwich",
"2^かれらはバス停で完ぺきにほほえむ。^pr:they/v:smile|base/adv:perfectly/prep:at det:the n:bus_stop",
"1^かれは今朝来た。^pr:he/v:come|past/idm:this_morning",
"2^わたしたちはくらやみで来るところだ。^pr:we/be:pres v:come|ing/idm:in_the_dark",
"1^女の子は先週まったりした。^det:the n:girl/v:chill|past/idm:last_week",
"1^友だちは勝つ。^pr:i n:friend|pl/v:win|base",
"2^あなたは毎日絵を送った。^pr:you/v:send|past/det:a n:picture/idm:every_day",
"3^犬はバス停でカメラを運んでいる。^det:the n:dog/be:pres v:carry|ing/det:a n:camera/prep:at det:the n:bus_stop",
"2^ケンはあそこでドレスを作る。^n:Ken/v:make|base/det:a n:dress/adv:there",
"2^犬は会社で歩いた。^det:the n:dog/v:walk|past/prep:at det:the n:office",
"2^かれらは空港で泳ぐ。^pr:they/v:swim|base/prep:at det:the n:airport",
"3^先生は毎日会社で怒って勝つ。^det:the n:teacher/v:win|base/adv:angrily/prep:at det:the n:office/idm:every_day",
"3^先生は朝にカフェでほほえんだ。^det:the n:teacher/v:smile|past/prep:at det:the n:cafe/prep:in det:the n:morning",
"2^わたしたちは一日じゅう庭で泣いた。^pr:we/v:cry|past/prep:in det:the n:garden/idm:all_day",
"2^わたしたちは海辺に着いた。^pr:we/v:arrive|past/prep:on det:the n:beach",
"2^わたしたちは夜にここで勝つだろう。^pr:we/modal:will v:win|base/adv:here/prep:at n:night",
"2^ミカは来週歩く予定だ。^n:Mika/be:pres v:walk|ing/idm:next_week",
"2^女の子は会社で話す。^det:the n:girl/v:talk|base/prep:at det:the n:office",
"2^かれはここで隠れている。^pr:he/be:pres v:hide|ing/adv:here",
"2^わたしたちは庭で勝つだろう。^pr:we/modal:will v:win|base/prep:in det:the n:garden",
"2^ねこは明日よく自然を守る予定だ。^det:the n:cat/be:pres adv:often v:protect|ing/n:nature/adv:tomorrow",
"2^あなたは夜に手紙に返信した。^pr:you/v:answer|past/det:a n:letter/prep:at n:night",
"2^ミカは今わたしの部屋で買い物する。^n:Mika/v:shop|base/prep:in pr:i n:room/adv:now",
"2^ミカは店でほほえんでいる。^n:Mika/be:pres v:smile|ing/prep:at det:the n:store",
"1^犬は寝た。^det:the n:dog/v:sleep|past",
"3^わたしたちはバス停でメッセージに返信するつもりだ。^pr:we/modal:will v:answer|base/det:a n:message/prep:at det:the n:bus_stop",
"2^犬はすばやく走っている。^det:the n:dog/be:pres v:run|ing/adv:quickly",
"3^わたしたちは今日庭でおもちゃを直すつもりだ。^pr:we/modal:will v:fix|base/det:a n:toy/prep:in det:the n:garden/adv:today",
"1^あなたは昨夜話した。^pr:you/v:talk|past/idm:last_night",
"2^わたしは7時に着くつもりだ。^pr:i/modal:will v:arrive|base/idm:at_seven",
"3^お母さんは昨日東京でレポートを送った。^pr:i n:mom/v:send|past/det:a n:report/prep:in n:Tokyo/adv:yesterday",
"2^わたしたちは一日じゅう海辺で勝った。^pr:we/v:win|past/prep:on det:the n:beach/idm:all_day",
"3^ケンは来週店で車を売る予定だ。^n:Ken/be:pres v:sell|ing/det:the n:car/prep:at det:the n:store/idm:next_week",
"2^ねこは病院で泣いている。^det:the n:cat/be:pres v:cry|ing/prep:at det:the n:hospital",
"2^ミカは夜に病院で踊った。^n:Mika/v:dance|past/prep:at det:the n:hospital/prep:at n:night",
"2^友だちはあそこで切符を持っていた。^pr:i n:friend|pl/v:have|past/det:a n:ticket/adv:there",
"2^ミカは会社で以前はまったりしていた。^n:Mika/sm:used_to v:chill|base/prep:at det:the n:office",
"1^あなたは地図を確認した。^pr:you/v:check|past/det:a n:map",
"2^かれは2日前さいふをなくした。^pr:he/v:lose|past/det:a n:wallet/idm:two_days_ago",
"1^先生は家でまったりした。^det:the n:teacher/v:chill|past/idm:at_home",
"2^かれはもうすぐ劇を見る。^pr:he/v:watch|base/det:a n:play/adv:soon",
"3^友だちは来週川のそばで玄関の呼び出しに応じる予定だ。^pr:i n:friend|pl/be:pres v:answer|ing/det:the n:door/prep:by det:the n:river/idm:next_week",
"2^かのじょは毎朝庭を持っていた。^pr:she/v:have|past/det:a n:garden/idm:every_morning",
"2^ねこはバス停へ行くだろう。^det:the n:cat/modal:will v:go|base/prep:to det:the n:bus_stop",
"2^あなたは今日の午後動物園で寝ている。^pr:you/be:pres v:sleep|ing/prep:at det:the n:zoo/idm:this_afternoon",
"2^かれらは前回はペンをなくした。^pr:they/v:lose|past/det:a n:pen/idm:last_time",
"3^女の子は毎朝わたしの部屋で箱を閉めた。^det:the n:girl/v:close|past/det:the n:box/prep:in pr:i n:room/idm:every_morning",
"2^かのじょは昨日電車に乗った。^pr:she/v:ride|past/det:the n:train/adv:yesterday",
"2^女の子は講演者を招待する。^det:the n:girl/v:invite|base/det:a n:speaker",
"2^かれは今日レストランで泣いている。^pr:he/be:pres v:cry|ing/prep:at det:the n:restaurant/adv:today",
"2^お父さんは海辺で泣いた。^pr:i n:dad/v:cry|past/prep:on det:the n:beach",
"2^お母さんはジャケットを時間どおりに借りる。^pr:i n:mom/v:borrow|base/det:a n:jacket/idm:on_time",
"3^犬は会社で靴をなくすだろう。^det:the n:dog/modal:will v:lose|base/n:shoe|pl/prep:at det:the n:office",
"2^ねこは今朝ここで寝た。^det:the n:cat/v:sleep|past/adv:here/idm:this_morning",
"1^わたしたちは昨日宿題をやった。^pr:we/v:do|past/n:homework/adv:yesterday",
"3^ケンは毎朝病院で車に以前はついていっていた。^n:Ken/sm:used_to v:follow|base/det:the n:car/prep:at det:the n:hospital/idm:every_morning",
"2^ミカは突然ほほえんでいる。^n:Mika/be:pres v:smile|ing/adv:suddenly",
"2^わたしは明日泣く予定だ。^pr:i/be:pres v:cry|ing/adv:tomorrow",
"1^男の子は急ぐ。^det:the n:boy/v:hurry|base",
"2^ケンは動物園で手助けをする。^n:Ken/v:give|base/n:help/prep:at det:the n:zoo",
"3^男の子は公園でたまねぎを植えている。^det:the n:boy/be:pres v:plant|ing/det:a n:onion/prep:in det:the n:park",
"3^お父さんは今夜駅へ行く予定だ。^pr:i n:dad/be:pres v:go|ing/prep:to det:the n:station/adv:tonight",
"1^ねこは2日前急いだ。^det:the n:cat/v:hurry|past/idm:two_days_ago",
"2^先生は家で指輪をなくすこともあった。^det:the n:teacher/modal:could v:lose|base/det:a n:ring/idm:at_home",
"1^犬は昨夜隠れた。^det:the n:dog/v:hide|past/idm:last_night",
"2^わたしたちは教室でもう一度泳ぐつもりだ。^pr:we/modal:will v:swim|base/adv:again/prep:in det:the n:classroom",
"2^かのじょは前回はわたしの部屋で泣いた。^pr:she/v:cry|past/prep:in pr:i n:room/idm:last_time",
"2^友だちは解決策を完ぺきに見つけるだろう。^pr:i n:friend|pl/modal:will v:find|base/det:a n:solution/adv:perfectly",
"1^あなたは東京でまったりした。^pr:you/v:chill|past/prep:in n:Tokyo",
"2^かのじょは次は着く予定だ。^pr:she/be:pres v:arrive|ing/idm:next_time",
"1^かれは2時間ていねいに隠れた。^pr:he/v:hide|past/adv:politely/idm:for_two_hours",
"2^あなたは庭で植物を守った。^pr:you/v:protect|past/det:a n:plant/prep:in det:the n:garden",
"1^わたしは東京でほほえんだ。^pr:i/v:smile|past/prep:in n:Tokyo",
"2^お父さんはあそこで電車に乗るだろう。^pr:i n:dad/modal:will v:ride|base/det:the n:train/adv:there",
"2^かれらはさっき一度も試合を見なかった。^pr:they/adv:never v:watch|past/det:the n:game/idm:just_now",
"2^かれは毎朝公園で泳いだ。^pr:he/v:swim|past/prep:in det:the n:park/idm:every_morning",
"2^お母さんは会社で買い物している。^pr:i n:mom/be:pres v:shop|ing/prep:at det:the n:office",
"2^ねこは朝に行った。^det:the n:cat/v:go|past/prep:in det:the n:morning",
"1^かのじょは一日じゅう完ぺきに急いだ。^pr:she/v:hurry|past/adv:perfectly/idm:all_day",
"2^かれらは歩いている。^pr:they/be:pres v:walk|ing",
"1^わたしたちは下手に笑った。^pr:we/v:laugh|past/adv:badly",
"1^かれは2日前お金を見つけた。^pr:he/v:find|past/n:money/idm:two_days_ago",
"3^犬は海辺でテレビを見ている。^det:the n:dog/be:pres v:watch|ing/det:the n:TV/prep:on det:the n:beach",
"2^ケンは朝にかばんを借りた。^n:Ken/v:borrow|past/det:a n:bag/prep:in det:the n:morning",
"2^あなたは店でノートを借りる。^pr:you/v:borrow|base/det:a n:notebook/prep:at det:the n:store",
"3^女の子はカフェで劇を見た。^det:the n:girl/v:watch|past/det:a n:play/prep:at det:the n:cafe",
"2^わたしは前回はテレビを見た。^pr:i/v:watch|past/det:the n:TV/idm:last_time",
"1^わたしは夜に休む。^pr:i/v:rest|base/prep:at n:night",
"2^お母さんはカフェでパンを作る。^pr:i n:mom/v:make|base/n:bread/prep:at det:the n:cafe",
"2^かれらは台所で招待状を送った。^pr:they/v:send|past/det:the n:invitation/prep:in det:the n:kitchen",
"1^ミカは毎日のんびりした。^n:Mika/v:relax|past/idm:every_day",
"3^かのじょは毎朝森で自転車に乗る。^pr:she/v:ride|base/det:a n:bicycle/prep:in det:the n:forest/idm:every_morning",
"3^かのじょはカフェでかばんを借りている。^pr:she/be:pres v:borrow|ing/det:a n:bag/prep:at det:the n:cafe",
"3^かれらは今朝教室で稲を植えた。^pr:they/v:plant|past/det:a n:rice_plant/prep:in det:the n:classroom/idm:this_morning",
"2^犬は図書館で走っている。^det:the n:dog/be:pres v:run|ing/prep:in det:the n:library",
"2^男の子はさっき歩けた。^det:the n:boy/modal:could v:walk|base/idm:just_now",
"2^ねこは森で急いでいる。^det:the n:cat/be:pres v:hurry|ing/prep:in det:the n:forest",
"1^ミカは先週着いた。^n:Mika/v:arrive|past/idm:last_week",
"1^男の子は学校で働いた。^det:the n:boy/v:work|past/idm:at_school",
"2^わたしは昨夜会社で静かに泣いた。^pr:i/v:cry|past/adv:quietly/prep:at det:the n:office/idm:last_night",
"1^先生は家で買い物する。^det:the n:teacher/v:shop|base/idm:at_home",
"2^ケンは2時間庭でまったりした。^n:Ken/v:chill|past/prep:in det:the n:garden/idm:for_two_hours",
"2^わたしは一日じゅう店で休むつもりだ。^pr:i/modal:will v:rest|base/prep:at det:the n:store/idm:all_day",
"1^お父さんは近くで着いた。^pr:i n:dad/v:arrive|past/adv:nearby",
"3^犬は図書館で本を運ぶ。^det:the n:dog/v:carry|base/det:a n:book/prep:in det:the n:library",
"2^かれは来週働く予定だ。^pr:he/be:pres v:work|ing/idm:next_week",
"2^友だちは店で話した。^pr:i n:friend|pl/v:talk|past/prep:at det:the n:store",
"2^犬は体育館で泣いた。^det:the n:dog/v:cry|past/prep:in det:the n:gym",
"1^あなたはさっき行った。^pr:you/v:go|past/idm:just_now",
"1^かれらは今日の午後寝た。^pr:they/v:sleep|past/idm:this_afternoon",
"3^女の子は空港で講演者を招待する。^det:the n:girl/v:invite|base/det:a n:speaker/prep:at det:the n:airport",
"1^かれらは毎日行く。^pr:they/v:go|base/idm:every_day",
"2^ミカは森で魚にえさをあげた。^n:Mika/v:feed|past/n:fish/prep:in det:the n:forest",
"1^わたしは今朝ときどき叫んだ。^pr:i/adv:sometimes v:shout|past/idm:this_morning",
"3^女の子はさっき動物園で引き出しを引いた。^det:the n:girl/v:pull|past/det:a n:drawer/prep:at det:the n:zoo/idm:just_now",
"2^わたしは朝にびんを閉めた。^pr:i/v:close|past/det:a n:bottle/prep:in det:the n:morning",
"2^かのじょはスーパーで寝た。^pr:she/v:sleep|past/prep:at det:the n:supermarket",
"1^かれは次は来る。^pr:he/v:come|base/idm:next_time",
"2^かれらは海辺でまったりする。^pr:they/v:chill|base/prep:on det:the n:beach",
"3^かのじょはさっき川のそばで自転車に乗った。^pr:she/v:ride|past/det:a n:bicycle/prep:by det:the n:river/idm:just_now",
"2^男の子は一日じゅう水をあげた。^det:the n:boy/v:give|past/n:water/idm:all_day",
"2^先生は道を近くで作った。^det:the n:teacher/v:build|past/det:the n:road/adv:nearby",
"2^かれは動物園で魚にえさをあげるだろう。^pr:he/modal:will v:feed|base/n:fish/prep:at det:the n:zoo",
"3^友だちはカフェですばやく急いでいる。^pr:i n:friend|pl/be:pres v:hurry|ing/adv:quickly/prep:at det:the n:cafe",
"3^かのじょは2日前店で取っ手を引いた。^pr:she/v:pull|past/det:a n:handle/prep:at det:the n:store/idm:two_days_ago",
"2^男の子は今朝コートを着た。^det:the n:boy/v:wear|past/det:a n:coat/idm:this_morning",
"2^お母さんは前回は情報を提供した。^pr:i n:mom/v:give|past/n:information/idm:last_time",
"2^女の子はついに来るだろう。^det:the n:girl/modal:will v:come|base/adv:finally",
"2^かのじょは夜に切符を見つける。^pr:she/v:find|base/det:a n:ticket/prep:at n:night",
"2^ねこは先週学校で近くで踊った。^det:the n:cat/v:dance|past/adv:nearby/idm:at_school/idm:last_week",
"1^先生はのんびりした。^det:the n:teacher/v:relax|past",
"3^わたしは海辺で写真をていねいに撮るつもりだ。^pr:i/modal:will v:take|base/det:a n:photo/adv:politely/prep:on det:the n:beach",
"1^お母さんは前回は旅行した。^pr:i n:mom/v:travel|past/idm:last_time",
"3^男の子は今朝カフェで車を持っていた。^det:the n:boy/v:have|past/det:the n:car/prep:at det:the n:cafe/idm:this_morning",
"3^友だちは川のそばでカードをあげた。^pr:i n:friend|pl/v:give|past/det:a n:card/prep:by det:the n:river",
"2^お父さんは質問を間に合うようにする。^pr:i n:dad/v:ask|base/det:a n:question/idm:in_time",
"2^ミカは今日走っている。^n:Mika/be:pres v:run|ing/adv:today",
"1^お父さんは昨夜来た。^pr:i n:dad/v:come|past/idm:last_night",
"3^友だちは昨夜図書館でペンをあげた。^pr:i n:friend|pl/v:give|past/det:a n:pen/prep:in det:the n:library/idm:last_night",
"3^お父さんは庭で本を見つけた。^pr:i n:dad/v:find|past/det:a n:book/prep:in det:the n:garden",
"3^あなたは朝に台所で笑った。^pr:you/v:laugh|past/prep:in det:the n:kitchen/prep:in det:the n:morning",
"2^かれはノートパソコンを怒って借りた。^pr:he/v:borrow|past/det:a n:laptop/adv:angrily",
"2^あなたはいっしょに休んでいる。^pr:you/be:pres v:rest|ing/adv:together",
"2^ねこは教室へ行く。^det:the n:cat/v:go|base/prep:to det:the n:classroom",
"3^お母さんは夜にドレスを着られた。^pr:i n:mom/modal:could v:wear|base/det:a n:dress/prep:at n:night",
"2^先生は一日じゅう学校で泣けた。^det:the n:teacher/modal:could v:cry|base/idm:at_school/idm:all_day",
"2^お父さんは先週道具を運んだ。^pr:i n:dad/v:carry|past/det:a n:tool/idm:last_week",
"1^ねこはさっき隠れた。^det:the n:cat/v:hide|past/idm:just_now",
"2^わたしは手紙を下手に送るつもりだ。^pr:i/modal:will v:send|base/det:a n:letter/adv:badly",
"1^ミカは東京でジャンプした。^n:Mika/v:jump|past/prep:in n:Tokyo",
"2^あなたは夜に講演者を招待する。^pr:you/v:invite|base/det:a n:speaker/prep:at n:night",
"2^ミカはコンサートを間に合うように見た。^n:Mika/v:watch|past/det:a n:concert/idm:in_time",
"2^ケンは体育館で走っている。^n:Ken/be:pres v:run|ing/prep:in det:the n:gym",
"1^ねこは昨日来た。^det:the n:cat/v:come|past/adv:yesterday",
"2^かれは台所で叫ぶ。^pr:he/v:shout|base/prep:in det:the n:kitchen",
"3^男の子は図書館で門を開けるだろう。^det:the n:boy/modal:will v:open|base/det:a n:gate/prep:in det:the n:library",
"2^かれらは2時間バス停へ行った。^pr:they/v:go|past/prep:to det:the n:bus_stop/idm:for_two_hours",
"2^ねこは海辺で走る。^det:the n:cat/v:run|base/prep:on det:the n:beach",
"2^あなたは森へ完ぺきに行く。^pr:you/v:go|base/adv:perfectly/prep:to det:the n:forest",
"3^ケンは夜に店で間に合うように笑った。^n:Ken/v:laugh|past/idm:in_time/prep:at det:the n:store/prep:at n:night",
"2^わたしたちは体育館で講演者を招待する。^pr:we/v:invite|base/det:a n:speaker/prep:in det:the n:gym",
"3^先生は店で道具を使う。^det:the n:teacher/v:use|base/det:a n:tool/prep:at det:the n:store",
"3^犬は体育館で家を見た。^det:the n:dog/v:see|past/det:a n:house/prep:in det:the n:gym",
"2^かのじょは公園でまったりした。^pr:she/v:chill|past/prep:in det:the n:park",
"2^ミカは2日前体育館に下手に着いた。^n:Mika/v:arrive|past/adv:badly/prep:in det:the n:gym/idm:two_days_ago",
"2^犬は今日リュックを運んでいる。^det:the n:dog/be:pres v:carry|ing/det:a n:backpack/adv:today",
"2^ミカは来週レストランでジャンプするだろう。^n:Mika/modal:will v:jump|base/prep:at det:the n:restaurant/idm:next_week",
"1^かのじょは話した。^pr:she/v:talk|past",
"2^女の子は今朝質問をした。^det:the n:girl/v:ask|past/det:a n:question/idm:this_morning",
"2^かれらは今夜森で泣く予定だ。^pr:they/be:pres v:cry|ing/prep:in det:the n:forest/adv:tonight",
"2^ねこは隠れるだろう。^det:the n:cat/modal:will v:hide|base",
"2^お父さんは駅で叫んだ。^pr:i n:dad/v:shout|past/prep:at det:the n:station",
"2^お母さんはバス停でまったりする。^pr:i n:mom/v:chill|base/prep:at det:the n:bus_stop",
"2^ねこは昨日教室で走った。^det:the n:cat/v:run|past/prep:in det:the n:classroom/adv:yesterday",
"3^かれは明日会社でペンを使う予定だ。^pr:he/be:pres v:use|ing/det:a n:pen/prep:at det:the n:office/adv:tomorrow",
"2^男の子は明日写真を送る予定だ。^det:the n:boy/be:pres v:send|ing/det:a n:photo/adv:tomorrow",
"2^かのじょは毎朝容器を開けた。^pr:she/v:open|past/det:a n:container/idm:every_morning",
"2^かれらはあそこでチューリップを植える。^pr:they/v:plant|base/det:a n:tulip/adv:there",
"2^先生は今日の午後タオルを持ってくる。^det:the n:teacher/v:bring|base/det:a n:towel/idm:this_afternoon",
"2^男の子は7時に病院に着く。^det:the n:boy/v:arrive|base/prep:at det:the n:hospital/idm:at_seven",
"2^かのじょは一日じゅうほほえめた。^pr:she/modal:could v:smile|base/idm:all_day",
"2^かれは会社へ行ける。^pr:he/modal:can v:go|base/prep:to det:the n:office",
"3^かれらは今夜台所で花を売る予定だ。^pr:they/be:pres v:sell|ing/det:a n:flower/prep:in det:the n:kitchen/adv:tonight",
"2^ねこは昨夜バス停で歩いた。^det:the n:cat/v:walk|past/prep:at det:the n:bus_stop/idm:last_night",
"2^かれらはもうすぐ川のそばで働く。^pr:they/v:work|base/prep:by det:the n:river/adv:soon",
"2^かのじょは前回はかばんをなくした。^pr:she/v:lose|past/det:a n:bag/idm:last_time",
"3^友だちは動物園でわたしのスマホを買うだろう。^pr:i n:friend|pl/modal:will v:buy|base/pr:i n:phone/prep:at det:the n:zoo",
"2^ミカは今朝屋根を直した。^n:Mika/v:fix|past/det:a n:roof/idm:this_morning",
"2^わたしたちは明日教室で踊る予定だ。^pr:we/be:pres v:dance|ing/prep:in det:the n:classroom/adv:tomorrow",
"2^あなたは先週わたしの部屋で笑った。^pr:you/v:laugh|past/prep:in pr:i n:room/idm:last_week",
"2^お母さんは今夜講演者を招待する予定だ。^pr:i n:mom/be:pres v:invite|ing/det:a n:speaker/adv:tonight",
"3^ミカは昨夜森でリュックを運んだ。^n:Mika/v:carry|past/det:a n:backpack/prep:in det:the n:forest/idm:last_night",
"1^あなたはさっき隠れた。^pr:you/v:hide|past/idm:just_now",
"2^男の子はていねいに歩いている。^det:the n:boy/be:pres v:walk|ing/adv:carefully",
"3^先生は朝にジーンズをはくだろう。^det:the n:teacher/modal:will v:wear|base/n:jeans/prep:in det:the n:morning",
"1^わたしたちは2日前やさしく叫んだ。^pr:we/v:shout|past/adv:softly/idm:two_days_ago",
"1^先生は一日じゅう話した。^det:the n:teacher/v:talk|past/idm:all_day",
"2^ケンはわたしの部屋でほほえむだろう。^n:Ken/modal:will v:smile|base/prep:in pr:i n:room",
"3^わたしは夜に体育館で踊るつもりだ。^pr:i/modal:will v:dance|base/prep:in det:the n:gym/prep:at n:night",
"2^お父さんは公園で笑う。^pr:i n:dad/v:laugh|base/prep:in det:the n:park",
"3^お父さんは2日前店でコーヒーを買った。^pr:i n:dad/v:buy|past/n:coffee/prep:at det:the n:store/idm:two_days_ago",
"3^男の子は次は空港で踊るだろう。^det:the n:boy/modal:will v:dance|base/prep:at det:the n:airport/idm:next_time",
"2^お母さんは空港で泳ぐだろう。^pr:i n:mom/modal:will v:swim|base/prep:at det:the n:airport",
"3^男の子は体育館でドレスを着る。^det:the n:boy/v:wear|base/det:a n:dress/prep:in det:the n:gym",
"2^わたしたちは7時に学校で踊れる。^pr:we/modal:can v:dance|base/idm:at_school/idm:at_seven",
"2^かのじょはスーパーでかばんを開ける。^pr:she/v:open|base/det:a n:bag/prep:at det:the n:supermarket",
"3^犬は空港でおもちゃをなくした。^det:the n:dog/v:lose|past/det:a n:toy/prep:at det:the n:airport",
"1^女の子は学校で叫んだ。^det:the n:girl/v:shout|past/idm:at_school",
"3^女の子は動物園でびんを閉めるだろう。^det:the n:girl/modal:will v:close|base/det:a n:bottle/prep:at det:the n:zoo",
"2^犬は来週ていねいにジャンプする予定だ。^det:the n:dog/be:pres v:jump|ing/adv:politely/idm:next_week",
"2^友だちは2時間教室で休んだ。^pr:i n:friend|pl/v:rest|past/prep:in det:the n:classroom/idm:for_two_hours",
"3^かれはさっき公園でおもちゃをもう一度買った。^pr:he/v:buy|past/det:a n:toy/adv:again/prep:in det:the n:park/idm:just_now",
"3^男の子はわたしの部屋で稲を植えた。^det:the n:boy/v:plant|past/det:a n:rice_plant/prep:in pr:i n:room",
"3^女の子は来週海辺で家を売る予定だ。^det:the n:girl/be:pres v:sell|ing/det:a n:house/prep:on det:the n:beach/idm:next_week",
"2^友だちは先週教室へ来た。^pr:i n:friend|pl/v:come|past/prep:to det:the n:classroom/idm:last_week",
"2^犬はすばやく急いでいる。^det:the n:dog/be:pres v:hurry|ing/adv:quickly",
"3^男の子は図書館で方法を見つけるだろう。^det:the n:boy/modal:will v:find|base/det:a n:way/prep:in det:the n:library",
"2^ケンは質問をくらやみでした。^n:Ken/v:ask|past/det:a n:question/idm:in_the_dark",
"1^かのじょはここで働いた。^pr:she/v:work|past/adv:here",
"2^ケンはさっきバスに乗った。^n:Ken/v:ride|past/det:the n:bus/idm:just_now",
"2^ケンは車をついに以前は買っていた。^n:Ken/sm:used_to v:buy|base/det:the n:car/adv:finally",
"2^わたしは川のそばに怒って着いた。^pr:i/v:arrive|past/adv:angrily/prep:by det:the n:river",
"2^犬は図書館で隠れるだろう。^det:the n:dog/modal:will v:hide|base/prep:in det:the n:library",
"2^お父さんはあそこでていねいにほほえむ。^pr:i n:dad/v:smile|base/adv:politely/adv:there",
"3^友だちは前回は川のそばで木を見た。^pr:i n:friend|pl/v:see|past/det:a n:tree/prep:by det:the n:river/idm:last_time",
"2^女の子は今朝家でプリンターを使った。^det:the n:girl/v:use|past/det:a n:printer/idm:at_home/idm:this_morning",
"1^お母さんは次は働く。^pr:i n:mom/v:work|base/idm:next_time",
"2^ねこは先週台所で走った。^det:the n:cat/v:run|past/prep:in det:the n:kitchen/idm:last_week",
"2^お父さんは森で間に合うように勝った。^pr:i n:dad/v:win|past/idm:in_time/prep:in det:the n:forest",
"3^女の子は教室で目を近くで守っている。^det:the n:girl/be:pres v:protect|ing/det:a n:eye/idm:close_by/prep:in det:the n:classroom",
"3^先生は空港で招待状を送った。^det:the n:teacher/v:send|past/det:the n:invitation/prep:at det:the n:airport",
"2^先生は今駅で勝つ。^det:the n:teacher/v:win|base/prep:at det:the n:station/adv:now",
"2^男の子はスーツケースをゆっくり運んでいる。^det:the n:boy/be:pres v:carry|ing/det:a n:suitcase/adv:slowly",
"1^あなたは今朝隠れた。^pr:you/v:hide|past/idm:this_morning",
"2^かれらは今夜エレベーターに乗る予定だ。^pr:they/be:pres v:ride|ing/det:a n:elevator/adv:tonight",
"2^ねこはさっきカフェで寝た。^det:the n:cat/v:sleep|past/prep:at det:the n:cafe/idm:just_now",
"2^お母さんは毎朝ここで下手に隠れた。^pr:i n:mom/v:hide|past/adv:badly/adv:here/idm:every_morning",
"2^ケンは空港で絵を見る。^n:Ken/v:see|base/det:a n:picture/prep:at det:the n:airport",
"2^ケンは7時にわたしの部屋でジャンプした。^n:Ken/v:jump|past/prep:in pr:i n:room/idm:at_seven",
"2^ミカはさっきここでノートパソコンをかんたんに閉じた。^n:Mika/v:close|past/det:a n:laptop/adv:easily/adv:here/idm:just_now",
"1^ねこは勝った。^det:the n:cat/v:win|past",
"1^あなたは旅行した。^pr:you/v:travel|past",
"2^犬は病院で急ぐ。^det:the n:dog/v:hurry|base/prep:at det:the n:hospital",
"3^友だちは毎日店で豆を植える。^pr:i n:friend|pl/v:plant|base/det:a n:bean/prep:at det:the n:store/idm:every_day",
"2^わたしたちはここで隠れるつもりだ。^pr:we/modal:will v:hide|base/adv:here",
"2^かのじょは来週講演者を招待するだろう。^pr:she/modal:will v:invite|base/det:a n:speaker/idm:next_week",
"2^ミカはバス停で看板を見た。^n:Mika/v:see|past/det:a n:sign/prep:at det:the n:bus_stop",
"2^先生は森で隠れるだろう。^det:the n:teacher/modal:will v:hide|base/prep:in det:the n:forest",
"2^お父さんは昨夜店に着いた。^pr:i n:dad/v:arrive|past/prep:at det:the n:store/idm:last_night",
"3^ケンは夜に公園に親切に着くだろう。^n:Ken/modal:will v:arrive|base/adv:kindly/prep:in det:the n:park/prep:at n:night",
"3^かれらは図書館で秘密基地を作っている。^pr:they/be:pres v:build|ing/det:a n:fort/prep:in det:the n:library",
"3^男の子は会社で食事を作った。^det:the n:boy/v:make|past/det:a n:meal/prep:at det:the n:office",
"2^男の子は教室でのんびりしている。^det:the n:boy/be:pres v:relax|ing/prep:in det:the n:classroom",
"2^かれはバス停で泣く。^pr:he/v:cry|base/prep:at det:the n:bus_stop",
"2^お父さんはすばやく働いている。^pr:i n:dad/be:pres v:work|ing/adv:quickly",
"2^ミカは駅で寝た。^n:Mika/v:sleep|past/prep:at det:the n:station",
"2^わたしたちは川のそばで魚にえさをあげている。^pr:we/be:pres v:feed|ing/n:fish/prep:by det:the n:river",
"2^かれらは夜にたまねぎを突然植えた。^pr:they/v:plant|past/det:a n:onion/adv:suddenly/prep:at n:night",
"2^あなたは天気を親切に確認する。^pr:you/v:check|base/det:the n:weather/adv:kindly",
"3^ケンは2時間スーパーで本を持っていた。^n:Ken/v:have|past/det:a n:book/prep:at det:the n:supermarket/idm:for_two_hours",
"2^かのじょは昨夜駅で笑った。^pr:she/v:laugh|past/prep:at det:the n:station/idm:last_night",
"2^かれらは台所でかばんを運んだ。^pr:they/v:carry|past/det:a n:bag/prep:in det:the n:kitchen",
"2^かのじょは体育館で食べ物を持って来た。^pr:she/v:bring|past/n:food/prep:in det:the n:gym",
"2^わたしはここで泳ぐつもりだ。^pr:i/modal:will v:swim|base/adv:here",
"3^ねこは今夜森へ行く予定だ。^det:the n:cat/be:pres v:go|ing/prep:to det:the n:forest/adv:tonight",
"2^かのじょは昨日あそこで食べ物を買った。^pr:she/v:buy|past/n:food/adv:there/adv:yesterday",
"2^友だちは店で買い物している。^pr:i n:friend|pl/be:pres v:shop|ing/prep:at det:the n:store",
"3^女の子は教室で写真を撮るだろう。^det:the n:girl/modal:will v:take|base/det:a n:photo/prep:in det:the n:classroom",
"3^お母さんは教室でわたしのスマホを買った。^pr:i n:mom/v:buy|past/pr:i n:phone/prep:in det:the n:classroom",
"2^かれは台所で買い物する。^pr:he/v:shop|base/prep:in det:the n:kitchen",
"3^友だちは昨日駅で目を守った。^pr:i n:friend|pl/v:protect|past/det:a n:eye/prep:at det:the n:station/adv:yesterday",
"2^ケンはレストランでスープを作った。^n:Ken/v:make|past/n:soup/prep:at det:the n:restaurant",
"3^友だちは2日前体育館で講演者を時間どおりに招待した。^pr:i n:friend|pl/v:invite|past/det:a n:speaker/idm:on_time/prep:in det:the n:gym/idm:two_days_ago",
"1^かれらは贈り物をあげた。^pr:they/v:give|past/det:a n:gift",
"2^あなたは会社で叫んでいる。^pr:you/be:pres v:shout|ing/prep:at det:the n:office",
"2^お母さんは毎朝得意げにジャンプする。^pr:i n:mom/v:jump|base/adv:proudly/idm:every_morning",
"2^わたしはあそこで質問をするつもりだ。^pr:i/modal:will v:ask|base/det:a n:question/adv:there",
"2^かれらは一日じゅう川のそばでまったりした。^pr:they/v:chill|past/prep:by det:the n:river/idm:all_day",
"1^犬はジャンプする。^det:the n:dog/v:jump|base",
"3^わたしは川のそばで講演者を下手に招待した。^pr:i/v:invite|past/det:a n:speaker/adv:badly/prep:by det:the n:river",
"1^犬は間に合うように寝る。^det:the n:dog/v:sleep|base/idm:in_time",
"2^ケンは今夜じゃがいもを植えるだろう。^n:Ken/modal:will v:plant|base/det:a n:potato/adv:tonight",
"2^お父さんはかさを持って来ている。^pr:i n:dad/be:pres v:bring|ing/det:a n:umbrella",
"3^ミカは朝に海辺で笑う。^n:Mika/v:laugh|base/prep:on det:the n:beach/prep:in det:the n:morning",
"2^男の子は2時間台所で歩いた。^det:the n:boy/v:walk|past/prep:in det:the n:kitchen/idm:for_two_hours",
"2^女の子は安全に行くだろう。^det:the n:girl/modal:will v:go|base/adv:safely",
"1^ミカは先週のんびりした。^n:Mika/v:relax|past/idm:last_week",
"2^ねこは会社で楽しそうに泳いだ。^det:the n:cat/v:swim|past/adv:happily/prep:at det:the n:office",
"2^ミカはかさを時間どおりに借りた。^n:Mika/v:borrow|past/det:a n:umbrella/idm:on_time",
"2^かれらはもうすぐ会社で魚にえさをあげる。^pr:they/v:feed|base/n:fish/prep:at det:the n:office/adv:soon",
"3^お父さんは7時に動物園でわたしのスマホをなくすだろう。^pr:i n:dad/modal:will v:lose|base/pr:i n:phone/prep:at det:the n:zoo/idm:at_seven",
"2^ミカは教室で叫ぶだろう。^n:Mika/modal:will v:shout|base/prep:in det:the n:classroom",
"2^先生は店でジャンプする。^det:the n:teacher/v:jump|base/prep:at det:the n:store",
"3^かれらは夜に空港ですばやく話す。^pr:they/v:talk|base/adv:quickly/prep:at det:the n:airport/prep:at n:night",
"2^先生は7時に歩くだろう。^det:the n:teacher/modal:will v:walk|base/idm:at_seven",
"2^先生は夜に買い物した。^det:the n:teacher/v:shop|past/prep:at n:night",
"3^お母さんは次はスーパーで手紙をあげる。^pr:i n:mom/v:give|base/det:a n:letter/prep:at det:the n:supermarket/idm:next_time",
"2^かれはもうすぐ台所へ行く。^pr:he/v:go|base/prep:to det:the n:kitchen/adv:soon",
"2^男の子はリュックを完ぺきに運んだ。^det:the n:boy/v:carry|past/det:a n:backpack/adv:perfectly",
"1^あなたはわたしのスマホを見つけた。^pr:you/v:find|past/pr:i n:phone",
"2^女の子は今朝スーツケースを近くで引いた。^det:the n:girl/v:pull|past/det:a n:suitcase/idm:close_by/idm:this_morning",
"2^友だちはバス停でかんたんに勝つ。^pr:i n:friend|pl/v:win|base/adv:easily/prep:at det:the n:bus_stop",
"3^お母さんは今日スーパーで静かに休む。^pr:i n:mom/v:rest|base/adv:quietly/prep:at det:the n:supermarket/adv:today",
"2^わたしは台所でパソコンを使った。^pr:i/v:use|past/det:the n:computer/prep:in det:the n:kitchen",
"2^ミカは今日の午後庭で隠れる。^n:Mika/v:hide|base/prep:in det:the n:garden/idm:this_afternoon",
"2^かれは来週走るだろう。^pr:he/modal:will v:run|base/idm:next_week",
"2^わたしたちは昨日カフェで歩いた。^pr:we/v:walk|past/prep:at det:the n:cafe/adv:yesterday",
"3^わたしたちは7時に公園で箱を開ける。^pr:we/v:open|base/det:the n:box/prep:in det:the n:park/idm:at_seven",
"1^かれは7時に着いた。^pr:he/v:arrive|past/idm:at_seven",
"2^あなたは2時間質問をした。^pr:you/v:ask|past/det:a n:question/idm:for_two_hours",
"2^先生は毎日ジェットコースターに乗れる。^det:the n:teacher/modal:can v:ride|base/det:a n:roller_coaster/idm:every_day",
"2^先生は先週オーブンをかんたんに使った。^det:the n:teacher/v:use|past/det:a n:oven/adv:easily/idm:last_week",
"2^あなたは駅でかんたんに話した。^pr:you/v:talk|past/adv:easily/prep:at det:the n:station",
"2^ミカは間に合うように勝っている。^n:Mika/be:pres v:win|ing/idm:in_time",
"3^お父さんは今わたしの部屋でTシャツを着る。^pr:i n:dad/v:wear|base/det:a n:t-shirt/prep:in pr:i n:room/adv:now",
"2^かれらは夜に東京で踊った。^pr:they/v:dance|past/prep:in n:Tokyo/prep:at n:night",
"2^犬はペンをいっしょになくすところだ。^det:the n:dog/be:pres v:lose|ing/det:a n:pen/adv:together",
"2^わたしたちはバス停で歩いている。^pr:we/be:pres v:walk|ing/prep:at det:the n:bus_stop",
"2^犬は今日の午後休んでいる。^det:the n:dog/be:pres v:rest|ing/idm:this_afternoon",
"1^わたしは学校で笑う。^pr:i/v:laugh|base/idm:at_school",
"1^ねこは突然隠れる。^det:the n:cat/v:hide|base/adv:suddenly",
"3^女の子は教室でバスに完ぺきに乗る。^det:the n:girl/v:ride|base/det:the n:bus/adv:perfectly/prep:in det:the n:classroom",
"2^ケンは駅で泳ぐだろう。^n:Ken/modal:will v:swim|base/prep:at det:the n:station",
"1^かれらは毎朝話した。^pr:they/v:talk|past/idm:every_morning",
"1^お母さんは休んだ。^pr:i n:mom/v:rest|past",
"2^かれは昨日教室でほほえんだ。^pr:he/v:smile|past/prep:in det:the n:classroom/adv:yesterday",
"2^お父さんは毎朝稲を植える。^pr:i n:dad/v:plant|base/det:a n:rice_plant/idm:every_morning",
"1^かのじょは走る。^pr:she/v:run|base",
"2^男の子は一日じゅうプリンターを直せた。^det:the n:boy/modal:could v:fix|base/det:a n:printer/idm:all_day",
"2^ねこは海へ行く。^det:the n:cat/v:go|base/prep:to det:the n:beach",
"3^お父さんは今朝公園で取っ手を引けた。^pr:i n:dad/modal:could v:pull|base/det:a n:handle/prep:in det:the n:park/idm:this_morning",
"1^女の子はたくさん笑う。^det:the n:girl/v:laugh|base/idm:a_lot",
"2^かれは今日の午後動物園についに着く。^pr:he/v:arrive|base/adv:finally/prep:at det:the n:zoo/idm:this_afternoon",
"2^ねこは来週のんびりするだろう。^det:the n:cat/modal:will v:relax|base/idm:next_week",
"2^ケンは明日講演者を招待する予定だ。^n:Ken/be:pres v:invite|ing/det:a n:speaker/adv:tomorrow",
"2^友だちは来週もう一度寝るだろう。^pr:i n:friend|pl/modal:will v:sleep|base/adv:again/idm:next_week",
"3^犬は今夜体育館でいすを運ぶだろう。^det:the n:dog/modal:will v:carry|base/det:a n:chair/prep:in det:the n:gym/adv:tonight",
"3^かれは一日じゅう海辺で秘密基地を作るだろう。^pr:he/modal:will v:build|base/det:a n:fort/prep:on det:the n:beach/idm:all_day",
"1^かのじょは前回は寝た。^pr:she/v:sleep|past/idm:last_time",
"2^男の子は今日いすを作る。^det:the n:boy/v:make|base/det:a n:chair/adv:today",
"3^男の子は前回は駅でかばんを買った。^det:the n:boy/v:buy|past/det:a n:bag/prep:at det:the n:station/idm:last_time",
"2^ねこはスーパーへ行くところだ。^det:the n:cat/be:pres v:go|ing/prep:to det:the n:supermarket",
"2^先生は2時間家でのんびりした。^det:the n:teacher/v:relax|past/idm:at_home/idm:for_two_hours",
"2^女の子は空港で泳いだ。^det:the n:girl/v:swim|past/prep:at det:the n:airport",
"1^ケンは2日前靴を買った。^n:Ken/v:buy|past/n:shoe|pl/idm:two_days_ago",
"2^犬は今日の午後台所でのんびりする。^det:the n:dog/v:relax|base/prep:in det:the n:kitchen/idm:this_afternoon",
"2^かれらは動物園へ来る。^pr:they/v:come|base/prep:to det:the n:zoo",
"2^ねこは来週歩く予定だ。^det:the n:cat/be:pres v:walk|ing/idm:next_week",
"3^お母さんはカフェでエスカレーターに乗った。^pr:i n:mom/v:ride|past/det:a n:escalator/prep:at det:the n:cafe",
"3^男の子はわたしの部屋でびんを運ぶ。^det:the n:boy/v:carry|base/det:a n:bottle/prep:in pr:i n:room",
"3^友だちは次は東京で依頼に応じる。^pr:i n:friend|pl/v:answer|base/det:a n:request/prep:in n:Tokyo/idm:next_time",
"3^お母さんは明日庭で写真を撮る予定だ。^pr:i n:mom/be:pres v:take|ing/det:a n:photo/prep:in det:the n:garden/adv:tomorrow",
"3^あなたは来週カフェで自転車を借りる予定だ。^pr:you/be:pres v:borrow|ing/det:a n:bicycle/prep:at det:the n:cafe/idm:next_week",
"1^犬は歩いた。^det:the n:dog/v:walk|past",
"3^あなたは朝に病院で講演者を招待した。^pr:you/v:invite|past/det:a n:speaker/prep:at det:the n:hospital/prep:in det:the n:morning",
"2^ねこは動物園でくらやみで泳いだ。^det:the n:cat/v:swim|past/idm:in_the_dark/prep:at det:the n:zoo",
"2^ミカは毎日台所で完ぺきに隠れる。^n:Mika/v:hide|base/adv:perfectly/prep:in det:the n:kitchen/idm:every_day",
"1^わたしたちはここでまったりした。^pr:we/v:chill|past/adv:here",
"2^男の子は毎日体育館に着いた。^det:the n:boy/v:arrive|past/prep:in det:the n:gym/idm:every_day",
"3^かのじょは前回は店でわたしのスマホを借りた。^pr:she/v:borrow|past/pr:i n:phone/prep:at det:the n:store/idm:last_time",
"2^かのじょはカフェでお金を見つけるだろう。^pr:she/modal:will v:find|base/n:money/prep:at det:the n:cafe",
"2^あなたは駅で引き出しを引いた。^pr:you/v:pull|past/det:a n:drawer/prep:at det:the n:station",
"3^男の子は体育館で講演者を招待した。^det:the n:boy/v:invite|past/det:a n:speaker/prep:in det:the n:gym",
"3^先生は空港でクレジットカードを使う。^det:the n:teacher/v:use|base/det:a n:credit_card/prep:at det:the n:airport",
"2^ねこは庭で勝てた。^det:the n:cat/modal:could v:win|base/prep:in det:the n:garden",
"3^わたしはスーパーで切符を得意げに確認している。^pr:i/be:pres v:check|ing/det:a n:ticket/adv:proudly/prep:at det:the n:supermarket",
"2^ねこは次はわたしの部屋で泣く。^det:the n:cat/v:cry|base/prep:in pr:i n:room/idm:next_time",
"2^お父さんは前回は花を買った。^pr:i n:dad/v:buy|past/det:a n:flower/idm:last_time",
"1^わたしは魚にえさをあげた。^pr:i/v:feed|past/n:fish",
"3^女の子は明日店でくらやみでほほえむ予定だ。^det:the n:girl/be:pres v:smile|ing/idm:in_the_dark/prep:at det:the n:store/adv:tomorrow",
"3^お父さんはバス停でバスについていった。^pr:i n:dad/v:follow|past/det:the n:bus/prep:at det:the n:bus_stop",
"3^先生はバス停でバスについていくだろう。^det:the n:teacher/modal:will v:follow|base/det:the n:bus/prep:at det:the n:bus_stop",
"2^犬はもう一度来るところだ。^det:the n:dog/be:pres v:come|ing/adv:again",
"3^あなたは2日前スーパーで電車に乗った。^pr:you/v:ride|past/det:the n:train/prep:at det:the n:supermarket/idm:two_days_ago",
"3^わたしは今日スーパーで質問を得意げに以前はしていた。^pr:i/sm:used_to v:ask|base/det:a n:question/adv:proudly/prep:at det:the n:supermarket/adv:today",
"2^お父さんはボートについに乗った。^pr:i n:dad/v:ride|past/det:a n:boat/adv:finally",
"2^女の子はあそこへ静かに行った。^det:the n:girl/v:go|past/adv:quietly/adv:there",
"3^かれはさっきレストランでかばんを持って来た。^pr:he/v:bring|past/det:a n:bag/prep:at det:the n:restaurant/idm:just_now",
"2^お父さんは教室で急ぐだろう。^pr:i n:dad/modal:will v:hurry|base/prep:in det:the n:classroom",
"2^先生は結果を時間どおりに確認する。^det:the n:teacher/v:check|base/det:a n:result/idm:on_time",
"1^かれらは寝た。^pr:they/v:sleep|past",
"3^先生は夕方に質問を以前はしていた。^det:the n:teacher/sm:used_to v:ask|base/det:a n:question/prep:in det:the n:evening",
"2^あなたは公園で安全に笑うだろう。^pr:you/modal:will v:laugh|base/adv:safely/prep:in det:the n:park",
"2^女の子はあそこで野菜を買っている。^det:the n:girl/be:pres v:buy|ing/n:vegetables/adv:there",
"2^ミカは2時間まったりするだろう。^n:Mika/modal:will v:chill|base/idm:for_two_hours",
"2^かのじょは台所で機械を作る。^pr:she/v:build|base/det:a n:machine/prep:in det:the n:kitchen",
"2^女の子は店で休む。^det:the n:girl/v:rest|base/prep:at det:the n:store",
"3^お父さんはカフェで質問をした。^pr:i n:dad/v:ask|past/det:a n:question/prep:at det:the n:cafe",
"1^わたしたちは一日じゅう学校で寝た。^pr:we/v:sleep|past/idm:at_school/idm:all_day",
"1^わたしたちは2時間買い物した。^pr:we/v:shop|past/idm:for_two_hours",
"2^かれは庭で木を見た。^pr:he/v:see|past/det:a n:tree/prep:in det:the n:garden",
"3^先生は教室で手助けをしている。^det:the n:teacher/be:pres v:give|ing/n:help/prep:in det:the n:classroom",
"1^かれらは一日じゅう家で泳いだ。^pr:they/v:swim|past/idm:at_home/idm:all_day",
"2^男の子は今夜塔を作る予定だ。^det:the n:boy/be:pres v:build|ing/det:a n:tower/adv:tonight",
"2^お母さんは庭でジャンプする。^pr:i n:mom/v:jump|base/prep:in det:the n:garden",
"3^お父さんは教室で取っ手を引くだろう。^pr:i n:dad/modal:will v:pull|base/det:a n:handle/prep:in det:the n:classroom",
"2^ミカは朝にケーキを持って来た。^n:Mika/v:bring|past/det:a n:cake/prep:in det:the n:morning",
"2^友だちはさっきノートを借りた。^pr:i n:friend|pl/v:borrow|past/det:a n:notebook/idm:just_now",
"2^かれらは川のそばでえんぴつを借りた。^pr:they/v:borrow|past/det:a n:pencil/prep:by det:the n:river",
"2^かれは毎朝森でお金を持っている。^pr:he/v:have|base/n:money/prep:in det:the n:forest/idm:every_morning",
"2^犬は下手にジャンプしている。^det:the n:dog/be:pres v:jump|ing/adv:badly",
"2^先生はさっきあそこでドレスを作った。^det:the n:teacher/v:make|past/det:a n:dress/adv:there/idm:just_now",
"2^わたしたちはここでパソコンを持っていた。^pr:we/v:have|past/det:the n:computer/adv:here",
"1^女の子は一日じゅう泣いた。^det:the n:girl/v:cry|past/idm:all_day",
"2^かれらは毎日ぼうしをなくす。^pr:they/v:lose|base/det:a n:hat/idm:every_day",
"3^友だちは昨日レストランで目を守った。^pr:i n:friend|pl/v:protect|past/det:a n:eye/prep:at det:the n:restaurant/adv:yesterday",
"2^かれらは昨夜森で家具を買った。^pr:they/v:buy|past/n:furniture/prep:in det:the n:forest/idm:last_night",
"1^かれらはさっきブーツをはいた。^pr:they/v:wear|past/n:boot|pl/idm:just_now",
"2^かれらは2日前店で買い物した。^pr:they/v:shop|past/prep:at det:the n:store/idm:two_days_ago",
"3^かれらは今日教室でお金を間に合うようになくす。^pr:they/v:lose|base/n:money/idm:in_time/prep:in det:the n:classroom/adv:today",
"1^女の子はここで休んだ。^det:the n:girl/v:rest|past/adv:here",
"3^女の子は明日森でテーブルを作る予定だ。^det:the n:girl/be:pres v:make|ing/det:a n:table/prep:in det:the n:forest/adv:tomorrow",
"2^わたしは口を近くで開いた。^pr:i/v:open|past/pr:i n:mouth/adv:nearby",
"2^ミカは一日じゅう森でお金をあげた。^n:Mika/v:give|past/n:money/prep:in det:the n:forest/idm:all_day",
"2^あなたはすばやくほほえんでいる。^pr:you/be:pres v:smile|ing/adv:quickly",
"1^わたしたちは今ランチを持ってくる。^pr:we/v:bring|base/n:lunch/adv:now",
"3^わたしは明日動物園でかばんを借りる予定だ。^pr:i/be:pres v:borrow|ing/det:a n:bag/prep:at det:the n:zoo/adv:tomorrow",
"2^わたしは昨夜かさを下手に運んだ。^pr:i/v:carry|past/det:a n:umbrella/adv:badly/idm:last_night",
"2^ねこは教室へ行った。^det:the n:cat/v:go|past/prep:to det:the n:classroom",
"2^ミカは今夜ついに隠れるだろう。^n:Mika/modal:will v:hide|base/adv:finally/adv:tonight",
"1^犬はあそこで隠れた。^det:the n:dog/v:hide|past/adv:there",
"1^かのじょは今叫ぶ。^pr:she/v:shout|base/adv:now",
"2^あなたはスーツを着るだろう。^pr:you/modal:will v:wear|base/det:a n:suit",
"2^友だちは教室で歩く。^pr:i n:friend|pl/v:walk|base/prep:in det:the n:classroom",
"2^先生は昨日海辺で踊った。^det:the n:teacher/v:dance|past/prep:on det:the n:beach/adv:yesterday",
"2^かれらは空港でエスカレーターに乗る。^pr:they/v:ride|base/det:a n:escalator/prep:at det:the n:airport",
"1^犬はあそこへ来た。^det:the n:dog/v:come|past/adv:there",
"2^ケンはもうすぐ駅で楽しそうに泳ぐ。^n:Ken/v:swim|base/adv:happily/prep:at det:the n:station/adv:soon",
"2^お父さんは庭で叫ぶだろう。^pr:i n:dad/modal:will v:shout|base/prep:in det:the n:garden",
"2^あなたは一日じゅうあそこで動画を見た。^pr:you/v:watch|past/det:a n:video/adv:there/idm:all_day",
"1^わたしたちは今日の午後学校で泣いた。^pr:we/v:cry|past/idm:at_school/idm:this_afternoon",
"2^かのじょは質問をやさしくした。^pr:she/v:ask|past/det:a n:question/adv:softly",
"2^かれらは今アイデアがある。^pr:they/v:have|base/det:a n:idea/adv:now",
"3^かれらは会社で食器棚を閉めるだろう。^pr:they/modal:will v:close|base/det:a n:cupboard/prep:at det:the n:office",
"2^女の子は玄関のかんたんに呼び出しに応じるだろう。^det:the n:girl/modal:will v:answer|base/det:the n:door/adv:easily",
"2^友だちは7時に川のそばでのんびりする。^pr:i n:friend|pl/v:relax|base/prep:by det:the n:river/idm:at_seven",
"2^あなたは教室で踊っている。^pr:you/be:pres v:dance|ing/prep:in det:the n:classroom",
"2^お父さんは今朝学校で辞書を使った。^pr:i n:dad/v:use|past/det:a n:dictionary/idm:at_school/idm:this_morning",
"2^男の子は今動物園で叫ぶ。^det:the n:boy/v:shout|base/prep:at det:the n:zoo/adv:now",
"3^友だちはわたしの部屋でコーヒーを作るだろう。^pr:i n:friend|pl/modal:will v:make|base/n:coffee/prep:in pr:i n:room",
"2^女の子は7時にせっけんを使うだろう。^det:the n:girl/modal:will v:use|base/n:soap/idm:at_seven",
"3^先生はレストランでメッセージを送った。^det:the n:teacher/v:send|past/det:a n:message/prep:at det:the n:restaurant",
"3^ケンは次は空港で魚にかんたんにえさをあげる。^n:Ken/v:feed|base/n:fish/adv:easily/prep:at det:the n:airport/idm:next_time",
"2^わたしは今日教室でほほえむ。^pr:i/v:smile|base/prep:in det:the n:classroom/adv:today",
"2^わたしたちはスーパーで切符を買う。^pr:we/v:buy|base/det:a n:ticket/prep:at det:the n:supermarket",
"1^ケンはサンドイッチを作った。^n:Ken/v:make|past/det:a n:sandwich",
"2^お父さんは毎日スーパーで踊った。^pr:i n:dad/v:dance|past/prep:at det:the n:supermarket/idm:every_day",
"2^わたしは秘密基地を下手に作る。^pr:i/v:build|base/det:a n:fort/adv:badly",
"2^先生は学校で雪だるまを作る。^det:the n:teacher/v:build|base/det:a n:snowman/idm:at_school",
"2^ミカは講演者を近くで招待した。^n:Mika/v:invite|past/det:a n:speaker/idm:close_by",
"3^お母さんは今夜かさを得意げに借りる予定だ。^pr:i n:mom/be:pres v:borrow|ing/det:a n:umbrella/adv:proudly/adv:tonight",
"1^先生は次はまったりする。^det:the n:teacher/v:chill|base/idm:next_time",
"2^わたしは今夜着く予定だ。^pr:i/be:pres v:arrive|ing/adv:tonight",
"1^わたしたちは間に合うようにほほえんだ。^pr:we/v:smile|past/idm:in_time",
"1^ケンはたくさん泣く。^n:Ken/v:cry|base/idm:a_lot",
"2^女の子はあそこで泳いでいる。^det:the n:girl/be:pres v:swim|ing/adv:there",
"2^女の子はわたしの部屋へ行った。^det:the n:girl/v:go|past/prep:to pr:i n:room",
"2^わたしたちはカフェでかんたんに泳いだ。^pr:we/v:swim|past/adv:easily/prep:at det:the n:cafe",
"3^男の子は次は会社で本をあげるだろう。^det:the n:boy/modal:will v:give|base/det:a n:book/prep:at det:the n:office/idm:next_time",
"2^かのじょはさっき体育館で歩いた。^pr:she/v:walk|past/prep:in det:the n:gym/idm:just_now",
"2^男の子は2時間ここで走るだろう。^det:the n:boy/modal:will v:run|base/adv:here/idm:for_two_hours",
"2^女の子は今日完ぺきに急ぐだろう。^det:the n:girl/modal:will v:hurry|base/adv:perfectly/adv:today",
"2^ケンはさっき会社へ旅行した。^n:Ken/v:travel|past/prep:to det:the n:office/idm:just_now",
"2^ねこはレストランで踊る。^det:the n:cat/v:dance|base/prep:at det:the n:restaurant",
"2^ねこはここで公演を以前は見ていた。^det:the n:cat/sm:used_to v:watch|base/det:a n:performance/adv:here",
"1^わたしは今日の午後隠れる。^pr:i/v:hide|base/idm:this_afternoon",
"1^ミカは先週来た。^n:Mika/v:come|past/idm:last_week",
"3^ケンはもうすぐ森でリストを確認するだろう。^n:Ken/modal:will v:check|base/det:a n:list/prep:in det:the n:forest/adv:soon",
"3^先生は空港でわたしのスマホを突然なくした。^det:the n:teacher/v:lose|past/pr:i n:phone/adv:suddenly/prep:at det:the n:airport",
"2^わたしたちは今あそこで牛乳を買っている。^pr:we/be:pres v:buy|ing/n:milk/adv:there/adv:now",
"2^わたしたちはバス停でノートパソコンを使う。^pr:we/v:use|base/det:a n:laptop/prep:at det:the n:bus_stop",
"2^ケンは今日の午後以前は歩いていた。^n:Ken/sm:used_to v:walk|base/idm:this_afternoon",
"1^かのじょは先週シャンプーを使った。^pr:she/v:use|past/n:shampoo/idm:last_week",
"2^かれは今体育館で歩く。^pr:he/v:walk|base/prep:in det:the n:gym/adv:now",
"2^ねこは東京で寝ている。^det:the n:cat/be:pres v:sleep|ing/prep:in n:Tokyo",
"2^ミカは怒ってまったりするだろう。^n:Mika/modal:will v:chill|base/adv:angrily",
"2^かれらは次は店で寝る。^pr:they/v:sleep|base/prep:at det:the n:store/idm:next_time",
"2^ミカはわたしの部屋で休んだ。^n:Mika/v:rest|past/prep:in pr:i n:room",
"2^犬は先週切符を持っていた。^det:the n:dog/v:have|past/det:a n:ticket/idm:last_week",
"2^わたしはパソコンを安全に直す。^pr:i/v:fix|base/det:the n:computer/adv:safely",
"2^わたしたちはほほえむつもりだ。^pr:we/modal:will v:smile|base",
"3^男の子は夜に質問をするだろう。^det:the n:boy/modal:will v:ask|base/det:a n:question/prep:at n:night",
"3^ミカは朝に体育館でていねいにジャンプするだろう。^n:Mika/modal:will v:jump|base/adv:politely/prep:in det:the n:gym/prep:in det:the n:morning",
"1^女の子は昨日着いた。^det:the n:girl/v:arrive|past/adv:yesterday",
"1^かのじょは7時に旅行した。^pr:she/v:travel|past/idm:at_seven",
"2^ミカは空港で泣いた。^n:Mika/v:cry|past/prep:at det:the n:airport",
"2^ミカは夜にあそこで働く。^n:Mika/v:work|base/adv:there/prep:at n:night",
"2^ミカは動物園で突然ほほえむ。^n:Mika/v:smile|base/adv:suddenly/prep:at det:the n:zoo",
"3^かれらは前回は教室で結果を確認した。^pr:they/v:check|past/det:a n:result/prep:in det:the n:classroom/idm:last_time",
"2^男の子は昨日本を売った。^det:the n:boy/v:sell|past/det:a n:book/adv:yesterday",
"2^かれらは明日情報を親切に送る予定だ。^pr:they/be:pres v:send|ing/n:information/adv:kindly/adv:tomorrow",
"2^友だちはさっきここで食べ物を運んだ。^pr:i n:friend|pl/v:carry|past/n:food/adv:here/idm:just_now",
"2^かれらは食べ物を運ぶだろう。^pr:they/modal:will v:carry|base/n:food",
"2^かのじょは川のそばで健康を守るだろう。^pr:she/modal:will v:protect|base/n:health/prep:by det:the n:river",
"2^かれはここで庭を持っている。^pr:he/v:have|base/det:a n:garden/adv:here",
"3^お母さんは病院でぼうしをなくす。^pr:i n:mom/v:lose|base/det:a n:hat/prep:at det:the n:hospital",
"2^かれらはさっきレストランで踊った。^pr:they/v:dance|past/prep:at det:the n:restaurant/idm:just_now",
"2^かのじょはもうすぐ公演を見る。^pr:she/v:watch|base/det:a n:performance/adv:soon",
"2^ねこは水を間に合うように持ってくる。^det:the n:cat/v:bring|base/n:water/idm:in_time",
"3^お母さんは明日台所でいっしょに踊るだろう。^pr:i n:mom/modal:will v:dance|base/adv:together/prep:in det:the n:kitchen/adv:tomorrow",
"1^ねこは今朝踊った。^det:the n:cat/v:dance|past/idm:this_morning",
"2^わたしは来週講演者を招待する予定だ。^pr:i/be:pres v:invite|ing/det:a n:speaker/idm:next_week",
"2^かれは今朝試合を見た。^pr:he/v:watch|past/det:the n:game/idm:this_morning",
"2^わたしたちは7時に写真を撮る。^pr:we/v:take|base/det:a n:photo/idm:at_seven",
"3^ケンは明日森で車についていく予定だ。^n:Ken/be:pres v:follow|ing/det:the n:car/prep:in det:the n:forest/adv:tomorrow",
"1^男の子は2時間泣いた。^det:the n:boy/v:cry|past/idm:for_two_hours",
"2^男の子はバス停で勝つ。^det:the n:boy/v:win|base/prep:at det:the n:bus_stop",
"3^お父さんは体育館で水を時間どおりにあげる。^pr:i n:dad/v:give|base/n:water/idm:on_time/prep:in det:the n:gym",
"2^あなたは海辺で隠れている。^pr:you/be:pres v:hide|ing/prep:on det:the n:beach",
"3^あなたはわたしの部屋で皿を洗うだろう。^pr:you/modal:will v:do|base/det:the n:dishes/prep:in pr:i n:room",
"3^友だちは今朝会社で下手に踊った。^pr:i n:friend|pl/v:dance|past/adv:badly/prep:at det:the n:office/idm:this_morning",
"2^わたしたちは昨夜図書館で近くでのんびりした。^pr:we/v:relax|past/adv:nearby/prep:in det:the n:library/idm:last_night",
"3^ケンは毎日海辺でレポートを確認した。^n:Ken/v:check|past/det:a n:report/prep:on det:the n:beach/idm:every_day",
"2^ミカは図書館で食器棚を開けた。^n:Mika/v:open|past/det:a n:cupboard/prep:in det:the n:library",
"2^男の子は今日くだものを買っている。^det:the n:boy/be:pres v:buy|ing/n:fruit/adv:today",
"2^わたしは会社で野菜を植える。^pr:i/v:plant|base/n:vegetables/prep:at det:the n:office",
"2^お母さんはわたしの部屋で隠れる。^pr:i n:mom/v:hide|base/prep:in pr:i n:room",
"2^お母さんはさっきここで結果を確認した。^pr:i n:mom/v:check|past/det:a n:result/adv:here/idm:just_now",
"2^友だちは夜に泳ぐ。^pr:i n:friend|pl/v:swim|base/prep:at n:night",
"2^かれらは海辺で目を閉じる。^pr:they/v:close|base/det:a n:eye/prep:on det:the n:beach",
"2^男の子はカフェで服を売った。^det:the n:boy/v:sell|past/n:clothes/prep:at det:the n:cafe",
"3^あなたは2日前公園で靴をすばやく買った。^pr:you/v:buy|past/n:shoe|pl/adv:quickly/prep:in det:the n:park/idm:two_days_ago",
"1^わたしたちは毎朝寝る。^pr:we/v:sleep|base/idm:every_morning",
"2^わたしたちは海辺でペンをなくした。^pr:we/v:lose|past/det:a n:pen/prep:on det:the n:beach",
"3^わたしたちは2時間スーパーでかさを借りた。^pr:we/v:borrow|past/det:a n:umbrella/prep:at det:the n:supermarket/idm:for_two_hours",
"3^ねこは図書館で本を持ってくる。^det:the n:cat/v:bring|base/det:a n:book/prep:in det:the n:library",
"2^ミカは一日じゅう運動を得意げにした。^n:Mika/v:do|past/n:exercise/adv:proudly/idm:all_day",
"2^ねこは昨夜家でいっしょに泣いた。^det:the n:cat/v:cry|past/adv:together/idm:at_home/idm:last_night",
"2^かのじょは店でまったりするだろう。^pr:she/modal:will v:chill|base/prep:at det:the n:store",
"2^犬は明日近くで歩くだろう。^det:the n:dog/modal:will v:walk|base/adv:nearby/adv:tomorrow",
"2^女の子は毎朝勝てる。^det:the n:girl/modal:can v:win|base/idm:every_morning",
"3^わたしたちは図書館で写真を撮るつもりだ。^pr:we/modal:will v:take|base/det:a n:photo/prep:in det:the n:library",
"2^わたしたちは毎日レストランで話す。^pr:we/v:talk|base/prep:at det:the n:restaurant/idm:every_day",
"1^男の子は2時間勝った。^det:the n:boy/v:win|past/idm:for_two_hours",
"2^先生は前回はおもちゃを作った。^det:the n:teacher/v:make|past/det:a n:toy/idm:last_time",
"2^かのじょは体育館で買い物した。^pr:she/v:shop|past/prep:in det:the n:gym",
"2^わたしは駅で急いだ。^pr:i/v:hurry|past/prep:at det:the n:station",
"3^お母さんは夜にバス停で看板を見るだろう。^pr:i n:mom/modal:will v:see|base/det:a n:sign/prep:at det:the n:bus_stop/prep:at n:night",
"2^女の子はわたしの電話に出た。^det:the n:girl/v:answer|past/pr:i n:phone",
"1^ねこはくらやみで隠れた。^det:the n:cat/v:hide|past/idm:in_the_dark",
"2^友だちは一日じゅう店に着いた。^pr:i n:friend|pl/v:arrive|past/prep:at det:the n:store/idm:all_day",
"2^あなたはわたしの部屋へ行ける。^pr:you/modal:can v:go|base/prep:to pr:i n:room",
"2^ケンは海辺で泣く。^n:Ken/v:cry|base/prep:on det:the n:beach",
"2^かれは海辺で肉を買う。^pr:he/v:buy|base/n:meat/prep:on det:the n:beach",
"3^友だちはさっき台所でリュックを運んだ。^pr:i n:friend|pl/v:carry|past/det:a n:backpack/prep:in det:the n:kitchen/idm:just_now",
"2^ミカは朝に泣いた。^n:Mika/v:cry|past/prep:in det:the n:morning",
"1^先生は時間どおりに隠れた。^det:the n:teacher/v:hide|past/idm:on_time",
"2^わたしは店で草を植えた。^pr:i/v:plant|past/n:grass/prep:at det:the n:store",
"3^友だちは今日の午後質問に近くで答えている。^pr:i n:friend|pl/be:pres v:answer|ing/det:a n:question/adv:nearby/idm:this_afternoon",
"2^友だちは練習を親切にしている。^pr:i n:friend|pl/be:pres v:do|ing/n:practice/adv:kindly",
"3^わたしたちは東京でタオルをついに持ってくるつもりだ。^pr:we/modal:will v:bring|base/det:a n:towel/adv:finally/prep:in n:Tokyo",
"3^ねこは朝に家で答えを見つけた。^det:the n:cat/v:find|past/det:a n:answer/idm:at_home/prep:in det:the n:morning",
"1^あなたはさっき急いだ。^pr:you/v:hurry|past/idm:just_now",
"1^女の子は昨夜来た。^det:the n:girl/v:come|past/idm:last_night",
"2^かれらは学校で庭を持っているだろう。^pr:they/modal:will v:have|base/det:a n:garden/idm:at_school",
"2^かれは毎週日曜日会社に以前は着いていた。^pr:he/sm:used_to v:arrive|base/prep:at det:the n:office/idm:every_Sunday",
"1^かれはあそこで歩いた。^pr:he/v:walk|past/adv:there",
"2^ミカは森で急いだ。^n:Mika/v:hurry|past/prep:in det:the n:forest",
"3^お父さんは今日の午後台所で花をあげた。^pr:i n:dad/v:give|past/det:a n:flower/prep:in det:the n:kitchen/idm:this_afternoon",
"3^友だちは明日海辺で走るだろう。^pr:i n:friend|pl/modal:will v:run|base/prep:on det:the n:beach/adv:tomorrow",
"2^かのじょは今日の午後自転車を直すだろう。^pr:she/modal:will v:fix|base/det:a n:bicycle/idm:this_afternoon",
"2^女の子はシャツを着る。^det:the n:girl/v:wear|base/det:a n:shirt",
"2^わたしたちはカフェで叫ぶ。^pr:we/v:shout|base/prep:at det:the n:cafe",
"2^かのじょはバス停で走る。^pr:she/v:run|base/prep:at det:the n:bus_stop",
"2^女の子は東京で星を見る。^det:the n:girl/v:see|base/det:a n:star/prep:in n:Tokyo",
"2^わたしたちは教室で近くで買い物した。^pr:we/v:shop|past/adv:nearby/prep:in det:the n:classroom",
"2^ねこは海へ来るだろう。^det:the n:cat/modal:will v:come|base/prep:to det:the n:beach",
"1^かれらは水を運んだ。^pr:they/v:carry|past/n:water",
"3^ミカは一日じゅう海辺でさいふを親切に見つけた。^n:Mika/v:find|past/det:a n:wallet/adv:kindly/prep:on det:the n:beach/idm:all_day",
"2^先生は今夜車についていくだろう。^det:the n:teacher/modal:will v:follow|base/det:the n:car/adv:tonight",
"1^わたしたちは次は笑う。^pr:we/v:laugh|base/idm:next_time",
"3^友だちはバス停で家を持っていた。^pr:i n:friend|pl/v:have|past/det:a n:house/prep:at det:the n:bus_stop",
"3^ねこは夜に海辺で踊るだろう。^det:the n:cat/modal:will v:dance|base/prep:on det:the n:beach/prep:at n:night",
"2^友だちは今日あそこで笑った。^pr:i n:friend|pl/v:laugh|past/adv:there/adv:today",
"3^男の子は来週ここで取っ手を引く予定だ。^det:the n:boy/be:pres v:pull|ing/det:a n:handle/adv:here/idm:next_week",
"2^ミカは先週テレビを見た。^n:Mika/v:watch|past/det:the n:TV/idm:last_week",
"3^女の子はもうすぐスーパーで叫ぶだろう。^det:the n:girl/modal:will v:shout|base/prep:at det:the n:supermarket/adv:soon",
"1^お父さんはもう一度買い物する。^pr:i n:dad/v:shop|base/adv:again",
"3^先生は空港で食べ物を以前は買っていた。^det:the n:teacher/sm:used_to v:buy|base/n:food/prep:at det:the n:airport",
"1^友だちは7時に叫ぶ。^pr:i n:friend|pl/v:shout|base/idm:at_seven",
"1^あなたはくらやみで叫んだ。^pr:you/v:shout|past/idm:in_the_dark",
"3^お父さんは公園でパソコンを持っているだろう。^pr:i n:dad/modal:will v:have|base/det:the n:computer/prep:in det:the n:park",
"2^ミカは空港へ旅行するだろう。^n:Mika/modal:will v:travel|base/prep:to det:the n:airport",
"2^女の子は雪だるまをていねいに作っている。^det:the n:girl/be:pres v:build|ing/det:a n:snowman/adv:carefully",
"2^ミカはさっき庭へたくさん旅行した。^n:Mika/v:travel|past/idm:a_lot/prep:to det:the n:garden/idm:just_now",
"2^わたしたちは動物園で隠れた。^pr:we/v:hide|past/prep:at det:the n:zoo",
"2^男の子は7時に寝るだろう。^det:the n:boy/modal:will v:sleep|base/idm:at_seven",
"2^ミカは昨夜家を持っていた。^n:Mika/v:have|past/det:a n:house/idm:last_night",
"3^友だちは7時にあそこでわたしのスマホを見つけられた。^pr:i n:friend|pl/modal:could v:find|base/pr:i n:phone/adv:there/idm:at_seven",
"1^先生は今休む。^det:the n:teacher/v:rest|base/adv:now",
"1^わたしたちは今朝走った。^pr:we/v:run|past/idm:this_morning",
"2^友だちは駅で話している。^pr:i n:friend|pl/be:pres v:talk|ing/prep:at det:the n:station",
"2^ねこはめがねをいっしょになくした。^det:the n:cat/v:lose|past/n:glass|pl/adv:together",
"2^かれらは来週近くで寝る予定だ。^pr:they/be:pres v:sleep|ing/idm:close_by/idm:next_week",
"1^友だちはやさしくほほえむ。^pr:i n:friend|pl/v:smile|base/adv:softly",
"2^友だちは一日じゅう講演者を招待した。^pr:i n:friend|pl/v:invite|past/det:a n:speaker/idm:all_day",
"3^先生は今わたしの部屋で本をあげる。^det:the n:teacher/v:give|base/det:a n:book/prep:in pr:i n:room/adv:now",
"1^わたしたちは突然泳ぐ。^pr:we/v:swim|base/adv:suddenly",
"2^お母さんは学校で冷蔵庫を以前は開けていた。^pr:i n:mom/sm:used_to v:open|base/det:a n:fridge/idm:at_school",
"3^ねこは今夜川のそばで休む予定だ。^det:the n:cat/be:pres v:rest|ing/prep:by det:the n:river/adv:tonight",
"1^あなたはあそこへ来る。^pr:you/v:come|base/adv:there",
"2^わたしは東京で仕事を見つけた。^pr:i/v:find|past/det:a n:job/prep:in n:Tokyo",
"1^わたしはここへ行く。^pr:i/v:go|base/adv:here",
"2^かれらは先週ペンをあげた。^pr:they/v:give|past/det:a n:pen/idm:last_week",
"3^お父さんは毎日わたしの部屋で以前は話していた。^pr:i n:dad/sm:used_to v:talk|base/prep:in pr:i n:room/idm:every_day",
"2^犬は夜に寝る。^det:the n:dog/v:sleep|base/prep:at n:night",
"1^友だちは近くで踊った。^pr:i n:friend|pl/v:dance|past/adv:nearby",
"2^犬はさっき家で休んだ。^det:the n:dog/v:rest|past/idm:at_home/idm:just_now",
"2^わたしは庭で本を売った。^pr:i/v:sell|past/det:a n:book/prep:in det:the n:garden",
"1^ケンはやさしく笑った。^n:Ken/v:laugh|past/adv:softly",
"2^ケンは今朝バス停でのんびりした。^n:Ken/v:relax|past/prep:at det:the n:bus_stop/idm:this_morning",
"2^友だちはさっきバス停で叫んだ。^pr:i n:friend|pl/v:shout|past/prep:at det:the n:bus_stop/idm:just_now",
"2^先生は昨日台所でほほえんだ。^det:the n:teacher/v:smile|past/prep:in det:the n:kitchen/adv:yesterday",
"3^友だちは朝に病院でプリンターを直した。^pr:i n:friend|pl/v:fix|past/det:a n:printer/prep:at det:the n:hospital/prep:in det:the n:morning",
"2^男の子は2時間贈り物を買った。^det:the n:boy/v:buy|past/det:a n:gift/idm:for_two_hours",
"2^女の子はバス停で走る。^det:the n:girl/v:run|base/prep:at det:the n:bus_stop",
"2^友だちは今日学校でていねいに話す。^pr:i n:friend|pl/v:talk|base/adv:politely/idm:at_school/adv:today",
"2^お母さんは明日顔を見るだろう。^pr:i n:mom/modal:will v:see|base/det:a n:face/adv:tomorrow",
"2^先生は会社へ旅行している。^det:the n:teacher/be:pres v:travel|ing/prep:to det:the n:office",
"1^わたしは旅行した。^pr:i/v:travel|past",
"3^かれらは森で引き出しを閉めるだろう。^pr:they/modal:will v:close|base/det:a n:drawer/prep:in det:the n:forest",
"2^ねこは川のそばで勝った。^det:the n:cat/v:win|past/prep:by det:the n:river",
"2^かれらは2時間レストランでほほえんだ。^pr:they/v:smile|past/prep:at det:the n:restaurant/idm:for_two_hours",
"2^わたしは川へ行った。^pr:i/v:go|past/prep:to det:the n:river",
"2^わたしたちは次は宿題を確認するつもりだ。^pr:we/modal:will v:check|base/n:homework/idm:next_time",
"3^友だちは今日わたしの部屋で指輪をすばやくなくす。^pr:i n:friend|pl/v:lose|base/det:a n:ring/adv:quickly/prep:in pr:i n:room/adv:today",
"3^ケンは2日前海辺で機械を近くで直した。^n:Ken/v:fix|past/det:a n:machine/idm:close_by/prep:on det:the n:beach/idm:two_days_ago",
"2^あなたは2時間レストランに着いた。^pr:you/v:arrive|past/prep:at det:the n:restaurant/idm:for_two_hours",
"3^お母さんは明日図書館で完ぺきにほほえむ予定だ。^pr:i n:mom/be:pres v:smile|ing/adv:perfectly/prep:in det:the n:library/adv:tomorrow",
"2^かれらはもうすぐ店で時間どおりにほほえむ。^pr:they/v:smile|base/idm:on_time/prep:at det:the n:store/adv:soon",
"3^友だちは今夜道をていねいに作る予定だ。^pr:i n:friend|pl/be:pres v:build|ing/det:the n:road/adv:carefully/adv:tonight",
"2^ミカは動物園でタブレットを使う。^n:Mika/v:use|base/det:a n:tablet/prep:at det:the n:zoo",
"2^ねこは走るだろう。^det:the n:cat/modal:will v:run|base",
"3^女の子は昨夜東京で問題があった。^det:the n:girl/v:have|past/det:a n:problem/prep:in n:Tokyo/idm:last_night",
"3^お父さんは明日庭で休むだろう。^pr:i n:dad/modal:will v:rest|base/prep:in det:the n:garden/adv:tomorrow",
"2^女の子は駅で草を植える。^det:the n:girl/v:plant|base/n:grass/prep:at det:the n:station",
"2^かのじょは学校で写真を怒って撮るだろう。^pr:she/modal:will v:take|base/det:a n:photo/adv:angrily/idm:at_school",
"1^ケンは2日前買い物した。^n:Ken/v:shop|past/idm:two_days_ago",
"2^男の子は2時間靴をはくだろう。^det:the n:boy/modal:will v:wear|base/n:shoe|pl/idm:for_two_hours",
"1^ケンは前回はここでのんびりした。^n:Ken/v:relax|past/adv:here/idm:last_time",
"2^わたしたちは空港で泳いでいる。^pr:we/be:pres v:swim|ing/prep:at det:the n:airport",
"3^ミカはもうすぐ駅でたくさん泳ぐだろう。^n:Mika/modal:will v:swim|base/idm:a_lot/prep:at det:the n:station/adv:soon",
"2^ミカは毎朝ここで質問を以前はしていた。^n:Mika/sm:used_to v:ask|base/det:a n:question/adv:here/idm:every_morning",
"2^ケンは会社で買い物する。^n:Ken/v:shop|base/prep:at det:the n:office",
"2^わたしたちは庭でピザを作る。^pr:we/v:make|base/n:pizza/prep:in det:the n:garden",
"2^ねこは来週パレードを見る予定だ。^det:the n:cat/be:pres v:watch|ing/det:a n:parade/idm:next_week",
"2^先生は今日の午後スーパーで笑う。^det:the n:teacher/v:laugh|base/prep:at det:the n:supermarket/idm:this_afternoon",
"2^ミカはかばんをついに運ぶだろう。^n:Mika/modal:will v:carry|base/det:a n:bag/adv:finally",
"3^先生は今朝駅でノートを近くでなくした。^det:the n:teacher/v:lose|past/det:a n:notebook/adv:nearby/prep:at det:the n:station/idm:this_morning",
"2^かのじょは空港で話した。^pr:she/v:talk|past/prep:at det:the n:airport",
"1^お母さんはここで走った。^pr:i n:mom/v:run|past/adv:here",
"2^先生はさっき家で植物を守った。^det:the n:teacher/v:protect|past/det:a n:plant/idm:at_home/idm:just_now",
"3^男の子は来週森で下手に勝つだろう。^det:the n:boy/modal:will v:win|base/adv:badly/prep:in det:the n:forest/idm:next_week",
"1^お母さんは毎日急いだ。^pr:i n:mom/v:hurry|past/idm:every_day",
"3^犬は今日の午後庭で泣いている。^det:the n:dog/be:pres v:cry|ing/prep:in det:the n:garden/idm:this_afternoon",
"2^ミカは自転車を時間どおりに売る。^n:Mika/v:sell|base/det:a n:bike/idm:on_time",
"1^かれらは7時に話した。^pr:they/v:talk|past/idm:at_seven",
"3^女の子はレストランで結果を確認している。^det:the n:girl/be:pres v:check|ing/det:a n:result/prep:at det:the n:restaurant",
"2^女の子は今日パンをていねいに作る。^det:the n:girl/v:make|base/n:bread/adv:politely/adv:today",
"2^ミカは今自転車を直す。^n:Mika/v:fix|base/det:a n:bicycle/adv:now",
"1^あなたは昨日得意げにのんびりした。^pr:you/v:relax|past/adv:proudly/adv:yesterday",
"2^あなたは宿題を確認するだろう。^pr:you/modal:will v:check|base/n:homework",
"2^男の子は7時にいすを借りた。^det:the n:boy/v:borrow|past/det:a n:chair/idm:at_seven",
"2^ねこはもうすぐわたしの部屋で泣く。^det:the n:cat/v:cry|base/prep:in pr:i n:room/adv:soon",
"3^かれらは毎晩病院で自転車を以前は直していた。^pr:they/sm:used_to v:fix|base/det:a n:bicycle/prep:at det:the n:hospital/idm:every_night",
"3^あなたは店でペンを安全に使う。^pr:you/v:use|base/det:a n:pen/adv:safely/prep:at det:the n:store",
"3^かれらは病院でびんを以前は持って来ていた。^pr:they/sm:used_to v:bring|base/det:a n:bottle/prep:at det:the n:hospital",
"2^かれは昨日わたしの電話に出た。^pr:he/v:answer|past/pr:i n:phone/adv:yesterday",
"3^お父さんは動物園でかぎをなくすところだ。^pr:i n:dad/be:pres v:lose|ing/det:the n:key/prep:at det:the n:zoo",
"2^あなたはスーパーで買い物する。^pr:you/v:shop|base/prep:at det:the n:supermarket",
"2^かれはスーパーで隠れた。^pr:he/v:hide|past/prep:at det:the n:supermarket",
"2^先生は今朝かばんを間に合うように閉じた。^det:the n:teacher/v:close|past/det:a n:bag/idm:in_time/idm:this_morning",
"3^わたしたちは朝に教室でバスについていく。^pr:we/v:follow|base/det:the n:bus/prep:in det:the n:classroom/prep:in det:the n:morning",
"2^わたしたちは病院で勝つだろう。^pr:we/modal:will v:win|base/prep:at det:the n:hospital",
"2^ねこは川のそばで以前は隠れていた。^det:the n:cat/sm:used_to v:hide|base/prep:by det:the n:river",
"2^お父さんは次は笑うだろう。^pr:i n:dad/modal:will v:laugh|base/idm:next_time",
"2^かれらは駅で寝る。^pr:they/v:sleep|base/prep:at det:the n:station",
"2^かれらは公園で急ぐだろう。^pr:they/modal:will v:hurry|base/prep:in det:the n:park",
"2^わたしはバス停で買い物する。^pr:i/v:shop|base/prep:at det:the n:bus_stop",
"1^かのじょは7時に買い物する。^pr:she/v:shop|base/idm:at_seven",
"1^ミカは魚にえさをあげる。^n:Mika/v:feed|base/n:fish",
"3^ミカは朝に教室ではがきを送るだろう。^n:Mika/modal:will v:send|base/det:a n:postcard/prep:in det:the n:classroom/prep:in det:the n:morning",
"1^わたしは夜に叫ぶ。^pr:i/v:shout|base/prep:at n:night",
"2^男の子はスーパーで急いだ。^det:the n:boy/v:hurry|past/prep:at det:the n:supermarket",
"2^わたしたちはレストランで時計を直した。^pr:we/v:fix|past/det:a n:clock/prep:at det:the n:restaurant",
"2^犬は台所で休んでいる。^det:the n:dog/be:pres v:rest|ing/prep:in det:the n:kitchen",
"3^わたしたちは朝に森でおもちゃをなくした。^pr:we/v:lose|past/det:a n:toy/prep:in det:the n:forest/prep:in det:the n:morning",
"1^わたしたちはくらやみで寝た。^pr:we/v:sleep|past/idm:in_the_dark",
"3^かれらは今朝教室でスーツケースを引いた。^pr:they/v:pull|past/det:a n:suitcase/prep:in det:the n:classroom/idm:this_morning",
"2^ミカは庭でジャンプする。^n:Mika/v:jump|base/prep:in det:the n:garden",
"2^女の子はさっきおもちゃをなくした。^det:the n:girl/v:lose|past/det:a n:toy/idm:just_now",
"2^男の子は台所でほほえんでいる。^det:the n:boy/be:pres v:smile|ing/prep:in det:the n:kitchen",
"2^男の子は図書館で走る。^det:the n:boy/v:run|base/prep:in det:the n:library",
"2^男の子は毎日自然を守る。^det:the n:boy/v:protect|base/n:nature/idm:every_day",
"3^ミカは図書館でびんを以前は運んでいた。^n:Mika/sm:used_to v:carry|base/det:a n:bottle/prep:in det:the n:library",
"2^先生は教室で泣く。^det:the n:teacher/v:cry|base/prep:in det:the n:classroom",
"1^ねこは7時に勝つ。^det:the n:cat/v:win|base/idm:at_seven",
"2^男の子はスーパーでまったりしている。^det:the n:boy/be:pres v:chill|ing/prep:at det:the n:supermarket",
"2^ねこは会社で以前は歩いていた。^det:the n:cat/sm:used_to v:walk|base/prep:at det:the n:office",
"1^わたしたちは前回は近くで勝った。^pr:we/v:win|past/idm:close_by/idm:last_time",
"2^ミカは今朝店へ旅行した。^n:Mika/v:travel|past/prep:to det:the n:store/idm:this_morning",
"2^ミカは東京でメッセージを送る。^n:Mika/v:send|base/det:a n:message/prep:in n:Tokyo",
"3^ケンは今朝駅で絵を送った。^n:Ken/v:send|past/det:a n:picture/prep:at det:the n:station/idm:this_morning",
"2^わたしは先週かばんを借りた。^pr:i/v:borrow|past/det:a n:bag/idm:last_week",
"2^犬はレストランで急いだ。^det:the n:dog/v:hurry|past/prep:at det:the n:restaurant",
"2^お父さんはスーパーでいつも泳ぐ。^pr:i n:dad/adv:always v:swim|base/prep:at det:the n:supermarket",
"2^かれらは朝に車についていく。^pr:they/v:follow|base/det:the n:car/prep:in det:the n:morning",
"2^ケンは前回はあそこで食べ物を売った。^n:Ken/v:sell|past/n:food/adv:there/idm:last_time",
"2^ケンは先週質問をした。^n:Ken/v:ask|past/det:a n:question/idm:last_week",
"3^かれらは病院でおもちゃを直している。^pr:they/be:pres v:fix|ing/det:a n:toy/prep:at det:the n:hospital",
"2^かれは朝にもう一度着く。^pr:he/v:arrive|base/adv:again/prep:in det:the n:morning",
"1^わたしは踊った。^pr:i/v:dance|past",
"2^男の子は教室で静かに笑った。^det:the n:boy/v:laugh|past/adv:quietly/prep:in det:the n:classroom",
"2^かれらは毎日病院へ来る。^pr:they/v:come|base/prep:to det:the n:hospital/idm:every_day",
"1^かれらは今あそこでほほえむ。^pr:they/v:smile|base/adv:there/adv:now",
"3^お父さんは会社で食べ物を持って来ている。^pr:i n:dad/be:pres v:bring|ing/n:food/prep:at det:the n:office",
"2^男の子はここで食器棚を閉める。^det:the n:boy/v:close|base/det:a n:cupboard/adv:here",
"1^かれは毎日かんたんに急ぐ。^pr:he/v:hurry|base/adv:easily/idm:every_day",
"3^犬はスーパーでわたしのスマホをなくす。^det:the n:dog/v:lose|base/pr:i n:phone/prep:at det:the n:supermarket",
"3^女の子はもうすぐ公園で容器をくらやみで開ける。^det:the n:girl/v:open|base/det:a n:container/idm:in_the_dark/prep:in det:the n:park/adv:soon",
"2^お母さんはさっき質問を得意げにした。^pr:i n:mom/v:ask|past/det:a n:question/adv:proudly/idm:just_now",
"2^ケンは今朝家を怒って売った。^n:Ken/v:sell|past/det:a n:house/adv:angrily/idm:this_morning",
"2^あなたは動物園で歩くだろう。^pr:you/modal:will v:walk|base/prep:at det:the n:zoo",
"3^男の子は体育館で質問に答えた。^det:the n:boy/v:answer|past/det:a n:question/prep:in det:the n:gym",
"2^かのじょは家でお金をなくすところだ。^pr:she/be:pres v:lose|ing/n:money/idm:at_home",
"1^女の子は毎朝笑う。^det:the n:girl/v:laugh|base/idm:every_morning",
"2^ミカは森でわたしのスマホを持っていた。^n:Mika/v:have|past/pr:i n:phone/prep:in det:the n:forest",
"2^かれらは駅で泳いでいる。^pr:they/be:pres v:swim|ing/prep:at det:the n:station",
"2^あなたは明日ドアを開ける予定だ。^pr:you/be:pres v:open|ing/det:the n:door/adv:tomorrow",
"2^ねこは食べ物を突然運んだ。^det:the n:cat/v:carry|past/n:food/adv:suddenly",
"2^ミカは会社で家具を買っている。^n:Mika/be:pres v:buy|ing/n:furniture/prep:at det:the n:office",
"2^ミカは昨夜家でぼうしをかぶった。^n:Mika/v:wear|past/det:a n:hat/idm:at_home/idm:last_night",
"2^犬は一日じゅう踊るだろう。^det:the n:dog/modal:will v:dance|base/idm:all_day",
"2^犬は一日じゅう図書館でジャンプした。^det:the n:dog/v:jump|past/prep:in det:the n:library/idm:all_day",
"2^お母さんは学校でテレビを見た。^pr:i n:mom/v:watch|past/det:the n:TV/idm:at_school",
"3^友だちはスーパーで花を買うだろう。^pr:i n:friend|pl/modal:will v:buy|base/det:a n:flower/prep:at det:the n:supermarket",
"2^お母さんは毎日駅で笑う。^pr:i n:mom/v:laugh|base/prep:at det:the n:station/idm:every_day",
"1^わたしたちは毎日泳ぐ。^pr:we/v:swim|base/idm:every_day",
"2^かのじょはわたしの部屋で働いた。^pr:she/v:work|past/prep:in pr:i n:room",
"2^かれらはここで電池を確認できる。^pr:they/modal:can v:check|base/det:a n:battery/adv:here",
"2^お父さんは夜にさいふをなくした。^pr:i n:dad/v:lose|past/det:a n:wallet/prep:at n:night",
"1^先生は2時間急いだ。^det:the n:teacher/v:hurry|past/idm:for_two_hours",
"3^お父さんは午後に病院で講演者を以前は招待していた。^pr:i n:dad/sm:used_to v:invite|base/det:a n:speaker/prep:at det:the n:hospital/prep:in det:the n:afternoon",
"2^ミカは今朝魚に親切にえさをあげた。^n:Mika/v:feed|past/n:fish/adv:kindly/idm:this_morning",
"2^友だちは東京で働いた。^pr:i n:friend|pl/v:work|past/prep:in n:Tokyo",
"2^かれは教室で働いている。^pr:he/be:pres v:work|ing/prep:in det:the n:classroom",
"2^お母さんは切符をひそかに買うだろう。^pr:i n:mom/modal:will v:buy|base/det:a n:ticket/adv:secretly",
"1^わたしはメッセージに返信する。^pr:i/v:answer|base/det:a n:message",
"3^かれはレストランで公演を見るだろう。^pr:he/modal:will v:watch|base/det:a n:performance/prep:at det:the n:restaurant",
"1^わたしは7時に歩く。^pr:i/v:walk|base/idm:at_seven",
"3^お母さんは会社で木を見た。^pr:i n:mom/v:see|past/det:a n:tree/prep:at det:the n:office",
"2^かれは図書館で動画を見た。^pr:he/v:watch|past/det:a n:video/prep:in det:the n:library",
"2^かれは教室でまったりした。^pr:he/v:chill|past/prep:in det:the n:classroom",
"2^ねこは今朝カメラを持っていた。^det:the n:cat/v:have|past/det:a n:camera/idm:this_morning",
"3^お母さんは今夜エレベーターにやさしく乗るだろう。^pr:i n:mom/modal:will v:ride|base/det:a n:elevator/adv:softly/adv:tonight",
"2^かのじょはわたしの部屋で家を買った。^pr:she/v:buy|past/det:a n:house/prep:in pr:i n:room",
"2^お父さんは教室で歩く。^pr:i n:dad/v:walk|base/prep:in det:the n:classroom",
"1^かれは昨日ほほえんだ。^pr:he/v:smile|past/adv:yesterday",
"2^犬はさっき学校で寝た。^det:the n:dog/v:sleep|past/idm:at_school/idm:just_now",
"2^かれらは今日の午後おもちゃをやさしく買った。^pr:they/v:buy|past/det:a n:toy/adv:softly/idm:this_afternoon",
"2^友だちは駅で買い物するだろう。^pr:i n:friend|pl/modal:will v:shop|base/prep:at det:the n:station",
"2^女の子は叫ぶだろう。^det:the n:girl/modal:will v:shout|base",
"2^お母さんは今日の午後話すだろう。^pr:i n:mom/modal:will v:talk|base/idm:this_afternoon",
"2^犬は一日じゅう会社へ行った。^det:the n:dog/v:go|past/prep:to det:the n:office/idm:all_day",
"2^ねこは森へ来るところだ。^det:the n:cat/be:pres v:come|ing/prep:to det:the n:forest",
"1^わたしはさっき踊った。^pr:i/v:dance|past/idm:just_now",
"2^ミカは今日カフェで叫ぶ。^n:Mika/v:shout|base/prep:at det:the n:cafe/adv:today",
"2^男の子は今日車を直した。^det:the n:boy/v:fix|past/det:the n:car/adv:today",
"2^女の子は2時間ときどきDVDを借りた。^det:the n:girl/adv:sometimes v:borrow|past/det:a n:DVD/idm:for_two_hours",
"2^わたしたちは次はじゃがいもを植える。^pr:we/v:plant|base/det:a n:potato/idm:next_time",
"1^わたしたちは昨夜近くで来た。^pr:we/v:come|past/adv:nearby/idm:last_night",
"2^かれらは学校でさいふをなくす。^pr:they/v:lose|base/det:a n:wallet/idm:at_school",
"2^女の子は庭で歩くだろう。^det:the n:girl/modal:will v:walk|base/prep:in det:the n:garden",
"2^男の子は家で叫ぶだろう。^det:the n:boy/modal:will v:shout|base/idm:at_home",
"1^あなたは毎朝靴下をはいた。^pr:you/v:wear|past/n:sock|pl/idm:every_morning",
"2^かれらは台所で勝っている。^pr:they/be:pres v:win|ing/prep:in det:the n:kitchen",
"3^わたしたちは今庭で講演者を招待する。^pr:we/v:invite|base/det:a n:speaker/prep:in det:the n:garden/adv:now",
"2^先生は図書館で歩いた。^det:the n:teacher/v:walk|past/prep:in det:the n:library",
"2^男の子は毎朝家で写真を撮る。^det:the n:boy/v:take|base/det:a n:photo/idm:at_home/idm:every_morning",
"2^かれは来週パソコンを使う予定だ。^pr:he/be:pres v:use|ing/det:the n:computer/idm:next_week",
"2^かのじょはバス停で踊る。^pr:she/v:dance|base/prep:at det:the n:bus_stop",
"1^女の子は勝つ。^det:the n:girl/v:win|base",
"2^かのじょは昨日海へ来た。^pr:she/v:come|past/prep:to det:the n:beach/adv:yesterday",
"2^犬はスーパーで隠れるだろう。^det:the n:dog/modal:will v:hide|base/prep:at det:the n:supermarket",
"2^お母さんは今夜コンサートを見るだろう。^pr:i n:mom/modal:will v:watch|base/det:a n:concert/adv:tonight",
"2^わたしは今日の午後走るつもりだ。^pr:i/modal:will v:run|base/idm:this_afternoon",
"1^わたしたちは2時間笑った。^pr:we/v:laugh|past/idm:for_two_hours",
"2^女の子は今日の午後突然寝るだろう。^det:the n:girl/modal:will v:sleep|base/adv:suddenly/idm:this_afternoon",
"2^ケンはもうすぐ車についていく。^n:Ken/v:follow|base/det:the n:car/adv:soon",
"2^かれは森で自然を守るだろう。^pr:he/modal:will v:protect|base/n:nature/prep:in det:the n:forest",
"3^ミカは今病院でかばんを買う。^n:Mika/v:buy|base/det:a n:bag/prep:at det:the n:hospital/adv:now",
"3^ねこは来週プレゼントをくらやみで持ってくるだろう。^det:the n:cat/modal:will v:bring|base/det:a n:present/idm:in_the_dark/idm:next_week",
"2^ミカはわたしの部屋で歩く。^n:Mika/v:walk|base/prep:in pr:i n:room",
"2^わたしは毎日店で寝る。^pr:i/v:sleep|base/prep:at det:the n:store/idm:every_day",
"1^わたしたちは安全に笑った。^pr:we/v:laugh|past/adv:safely",
"1^ねこは昨夜走った。^det:the n:cat/v:run|past/idm:last_night",
"2^女の子は前回は手紙をあげた。^det:the n:girl/v:give|past/det:a n:letter/idm:last_time",
"2^お父さんは学校で宿題をやった。^pr:i n:dad/v:do|past/n:homework/idm:at_school",
"2^かのじょは森で寝る。^pr:she/v:sleep|base/prep:in det:the n:forest",
"2^お母さんは今夜泣く予定だ。^pr:i n:mom/be:pres v:cry|ing/adv:tonight",
"1^ケンは今日ほほえんだ。^n:Ken/v:smile|past/adv:today",
"2^男の子は家で家具を買った。^det:the n:boy/v:buy|past/n:furniture/idm:at_home",
"2^先生は学校で門を閉められる。^det:the n:teacher/modal:can v:close|base/det:a n:gate/idm:at_school",
"2^犬は夜に学校でジャンプした。^det:the n:dog/v:jump|past/idm:at_school/prep:at n:night",
"2^犬は川のそばで勝っている。^det:the n:dog/be:pres v:win|ing/prep:by det:the n:river",
"2^かれは東京でカメラを借りた。^pr:he/v:borrow|past/det:a n:camera/prep:in n:Tokyo",
"2^ミカは今夜のんびりするだろう。^n:Mika/modal:will v:relax|base/adv:tonight",
"3^ケンは今庭で講演者を招待する。^n:Ken/v:invite|base/det:a n:speaker/prep:in det:the n:garden/adv:now",
"3^お父さんは来週あそこで花を間に合うように持ってくるだろう。^pr:i n:dad/modal:will v:bring|base/det:a n:flower/idm:in_time/adv:there/idm:next_week",
"2^ケンは台所へ行くところだ。^n:Ken/be:pres v:go|ing/prep:to det:the n:kitchen",
"2^ねこは突然休むだろう。^det:the n:cat/modal:will v:rest|base/adv:suddenly",
"3^男の子は空港で豆を植えた。^det:the n:boy/v:plant|past/det:a n:bean/prep:at det:the n:airport",
"3^ケンは朝に会社で走った。^n:Ken/v:run|past/prep:at det:the n:office/prep:in det:the n:morning",
"2^女の子は昨夜贈り物をかんたんに買った。^det:the n:girl/v:buy|past/det:a n:gift/adv:easily/idm:last_night",
"2^かのじょは動物園でメールを送る。^pr:she/v:send|base/det:a n:email/prep:at det:the n:zoo",
"3^かれは森でわたしのスマホを確認するだろう。^pr:he/modal:will v:check|base/pr:i n:phone/prep:in det:the n:forest",
"1^わたしたちは夜に叫ぶ。^pr:we/v:shout|base/prep:at n:night",
"1^わたしはもう一度のんびりした。^pr:i/v:relax|past/adv:again",
"2^かれは教室でわたしの電話に出た。^pr:he/v:answer|past/pr:i n:phone/prep:in det:the n:classroom",
"2^お母さんは今日模型を作るだろう。^pr:i n:mom/modal:will v:make|base/det:a n:model/adv:today",
"3^先生は駅でかばんを持っているだろう。^det:the n:teacher/modal:will v:have|base/det:a n:bag/prep:at det:the n:station",
"1^男の子はまったりした。^det:the n:boy/v:chill|past",
"2^お父さんは叫ぶだろう。^pr:i n:dad/modal:will v:shout|base",
"3^お母さんは昨日公園で質問をした。^pr:i n:mom/v:ask|past/det:a n:question/prep:in det:the n:park/adv:yesterday",
"2^お父さんは駅でていねいに働いた。^pr:i n:dad/v:work|past/adv:politely/prep:at det:the n:station",
"1^かれはここでジャンプした。^pr:he/v:jump|past/adv:here",
"2^あなたは店に着く。^pr:you/v:arrive|base/prep:at det:the n:store",
"3^ねこは朝にわたしの部屋で歩く。^det:the n:cat/v:walk|base/prep:in pr:i n:room/prep:in det:the n:morning",
"1^かれらは走る。^pr:they/v:run|base",
"3^先生は動物園で指輪をなくすだろう。^det:the n:teacher/modal:will v:lose|base/det:a n:ring/prep:at det:the n:zoo",
"2^女の子は毎朝稲を植えた。^det:the n:girl/v:plant|past/det:a n:rice_plant/idm:every_morning",
"2^犬は今日カメラを持っているだろう。^det:the n:dog/modal:will v:have|base/det:a n:camera/adv:today",
"1^ケンはもうすぐ野菜を買う。^n:Ken/v:buy|base/n:vegetables/adv:soon",
"2^ミカは動物園でケーキを作る。^n:Mika/v:make|base/det:a n:cake/prep:at det:the n:zoo",
"2^先生は動物園で野菜を売った。^det:the n:teacher/v:sell|past/n:vegetables/prep:at det:the n:zoo",
"1^ねこは2日前寝た。^det:the n:cat/v:sleep|past/idm:two_days_ago",
"2^ミカは歩くだろう。^n:Mika/modal:will v:walk|base",
"3^先生は教室で問題があった。^det:the n:teacher/v:have|past/det:a n:problem/prep:in det:the n:classroom",
"2^ねこはスーパーで勝った。^det:the n:cat/v:win|past/prep:at det:the n:supermarket",
"1^わたしは親切に休んだ。^pr:i/v:rest|past/adv:kindly",
"2^ミカは空港でコーヒーを作った。^n:Mika/v:make|past/n:coffee/prep:at det:the n:airport",
"3^男の子はレストランで切符を持っているだろう。^det:the n:boy/modal:will v:have|base/det:a n:ticket/prep:at det:the n:restaurant",
"2^ケンはレストランでおもちゃを売った。^n:Ken/v:sell|past/det:a n:toy/prep:at det:the n:restaurant",
"2^女の子は庭でほほえむだろう。^det:the n:girl/modal:will v:smile|base/prep:in det:the n:garden",
"2^友だちは今日の午後地下鉄に乗る。^pr:i n:friend|pl/v:ride|base/det:a n:subway/idm:this_afternoon",
"1^わたしは靴を買った。^pr:i/v:buy|past/n:shoe|pl",
"3^男の子は2日前駅でじゃがいもをいっしょに植えた。^det:the n:boy/v:plant|past/det:a n:potato/adv:together/prep:at det:the n:station/idm:two_days_ago",
"2^女の子は一日じゅう駅で踊った。^det:the n:girl/v:dance|past/prep:at det:the n:station/idm:all_day",
"3^男の子はカフェで時計を直すだろう。^det:the n:boy/modal:will v:fix|base/det:a n:clock/prep:at det:the n:cafe",
"3^ミカは今夜森で依頼に応じるだろう。^n:Mika/modal:will v:answer|base/det:a n:request/prep:in det:the n:forest/adv:tonight",
"1^わたしはお金を持っている。^pr:i/v:have|base/n:money",
"2^女の子は夕日を見られる。^det:the n:girl/modal:can v:watch|base/det:the n:sunset",
"2^かれらは教室でドアを直した。^pr:they/v:fix|past/det:the n:door/prep:in det:the n:classroom",
"2^あなたはもうすぐ着くだろう。^pr:you/modal:will v:arrive|base/adv:soon",
"2^お母さんは水をやさしく運ぶ。^pr:i n:mom/v:carry|base/n:water/adv:softly",
"2^女の子はさっきカメラを使った。^det:the n:girl/v:use|past/det:a n:camera/idm:just_now",
"3^あなたは今ここで質問をいっしょにしている。^pr:you/be:pres v:ask|ing/det:a n:question/adv:together/adv:here/adv:now",
"3^あなたはレストランで質問を下手にしている。^pr:you/be:pres v:ask|ing/det:a n:question/adv:badly/prep:at det:the n:restaurant",
"2^友だちはもうすぐ野菜を植える。^pr:i n:friend|pl/v:plant|base/n:vegetables/adv:soon",
"3^女の子は森でペンを借りる。^det:the n:girl/v:borrow|base/det:a n:pen/prep:in det:the n:forest",
"3^男の子はレストランで腕時計をなくした。^det:the n:boy/v:lose|past/det:a n:watch/prep:at det:the n:restaurant",
"1^かれらは2日前急いだ。^pr:they/v:hurry|past/idm:two_days_ago",
"3^わたしたちは夜にバス停で贈り物を親切に持ってくるつもりだ。^pr:we/modal:will v:bring|base/det:a n:gift/adv:kindly/prep:at det:the n:bus_stop/prep:at n:night",
"3^わたしは昨夜動物園でにんじんをついに植えた。^pr:i/v:plant|past/det:a n:carrot/adv:finally/prep:at det:the n:zoo/idm:last_night",
"2^先生は教室で踊っている。^det:the n:teacher/be:pres v:dance|ing/prep:in det:the n:classroom",
"2^あなたは今東京へ旅行する。^pr:you/v:travel|base/prep:to n:Tokyo/adv:now",
"2^かれらは毎朝海辺でお金をなくした。^pr:they/v:lose|past/n:money/prep:on det:the n:beach/idm:every_morning",
"1^ねこは毎朝勝つ。^det:the n:cat/v:win|base/idm:every_morning",
"2^ミカは今夜動物園で働く予定だ。^n:Mika/be:pres v:work|ing/prep:at det:the n:zoo/adv:tonight",
"2^お父さんは今夜チューリップを植えるだろう。^pr:i n:dad/modal:will v:plant|base/det:a n:tulip/adv:tonight",
"3^男の子は店でテーブルを作る。^det:the n:boy/v:make|base/det:a n:table/prep:at det:the n:store",
"2^女の子はもうすぐ質問をするだろう。^det:the n:girl/modal:will v:ask|base/det:a n:question/adv:soon",
"1^友だちは食べ物を持ってくる。^pr:i n:friend|pl/v:bring|base/n:food",
"3^犬は今朝台所で突然休んだ。^det:the n:dog/v:rest|past/adv:suddenly/prep:in det:the n:kitchen/idm:this_morning",
"2^女の子はびんをくらやみで持ってくるだろう。^det:the n:girl/modal:will v:bring|base/det:a n:bottle/idm:in_the_dark",
"3^女の子は朝にここで靴をなくした。^det:the n:girl/v:lose|past/n:shoe|pl/adv:here/prep:in det:the n:morning",
"1^かれらは今朝叫んだ。^pr:they/v:shout|past/idm:this_morning",
"3^友だちは明日図書館に着く予定だ。^pr:i n:friend|pl/be:pres v:arrive|ing/prep:in det:the n:library/adv:tomorrow",
"2^ミカはあそこで窓を安全に開けた。^n:Mika/v:open|past/det:the n:window/adv:safely/adv:there",
"2^ねこは2時間絵を見た。^det:the n:cat/v:see|past/det:a n:picture/idm:for_two_hours",
"2^わたしたちは昨夜講演者を招待した。^pr:we/v:invite|past/det:a n:speaker/idm:last_night",
"1^かれらは来た。^pr:they/v:come|past",
"2^かのじょは今朝山を見た。^pr:she/v:see|past/det:the n:mountain/idm:this_morning",
"3^友だちは今空港でペンをなくすところだ。^pr:i n:friend|pl/be:pres v:lose|ing/det:a n:pen/prep:at det:the n:airport/adv:now",
"1^わたしたちは昨日笑った。^pr:we/v:laugh|past/adv:yesterday",
"2^先生は2日前贈り物を買った。^det:the n:teacher/v:buy|past/det:a n:gift/idm:two_days_ago",
"2^先生は車を親切に使った。^det:the n:teacher/v:use|past/det:the n:car/adv:kindly",
"2^かれは毎朝方法を見つける。^pr:he/v:find|base/det:a n:way/idm:every_morning",
"1^かれらは魚にすばやくえさをあげた。^pr:they/v:feed|past/n:fish/adv:quickly",
"2^犬は会社で急ぐ。^det:the n:dog/v:hurry|base/prep:at det:the n:office",
"2^かれらは家で車を使っている。^pr:they/be:pres v:use|ing/det:the n:car/idm:at_home",
"2^ねこは森で走った。^det:the n:cat/v:run|past/prep:in det:the n:forest",
"3^あなたは来週川のそばでかばんを怒って持ってくる予定だ。^pr:you/be:pres v:bring|ing/det:a n:bag/adv:angrily/prep:by det:the n:river/idm:next_week",
"2^かのじょは今すばやく休んでいる。^pr:she/be:pres v:rest|ing/adv:quickly/adv:now",
"2^お父さんは今日パンを売っている。^pr:i n:dad/be:pres v:sell|ing/n:bread/adv:today",
"2^かれらは前回は駅に着いた。^pr:they/v:arrive|past/prep:at det:the n:station/idm:last_time",
"2^かれは毎朝教室で泣く。^pr:he/v:cry|base/prep:in det:the n:classroom/idm:every_morning",
"2^ケンは次は話すだろう。^n:Ken/modal:will v:talk|base/idm:next_time",
"3^先生は川のそばでパレードを見るだろう。^det:the n:teacher/modal:will v:watch|base/det:a n:parade/prep:by det:the n:river",
"2^女の子は昨日時間どおりに話した。^det:the n:girl/v:talk|past/idm:on_time/adv:yesterday",
"2^わたしは月曜日にぼうしを以前はかぶっていた。^pr:i/sm:used_to v:wear|base/det:a n:hat/prep:on n:Monday",
"2^かのじょは公園に怒って着く。^pr:she/v:arrive|base/adv:angrily/prep:in det:the n:park",
"3^男の子はわたしの部屋で講演者を招待するだろう。^det:the n:boy/modal:will v:invite|base/det:a n:speaker/prep:in pr:i n:room",
"1^わたしは7時に休む。^pr:i/v:rest|base/idm:at_seven",
"1^かれは突然旅行する。^pr:he/v:travel|base/adv:suddenly",
"2^先生は川のそばでスープを作った。^det:the n:teacher/v:make|past/n:soup/prep:by det:the n:river",
"2^お母さんはカフェでほほえむ。^pr:i n:mom/v:smile|base/prep:at det:the n:cafe",
"2^わたしは庭で踊った。^pr:i/v:dance|past/prep:in det:the n:garden",
"2^ミカはまちがいを安全に見つける。^n:Mika/v:find|base/det:a n:mistake/adv:safely",
"2^わたしはここでかばんをていねいに買った。^pr:i/v:buy|past/det:a n:bag/adv:politely/adv:here",
"2^女の子は今日ときどき結果を確認する。^det:the n:girl/adv:sometimes v:check|base/det:a n:result/adv:today",
"2^わたしたちは海辺でロープを引く。^pr:we/v:pull|base/det:a n:rope/prep:on det:the n:beach",
"3^友だちは海辺で動画を作るだろう。^pr:i n:friend|pl/modal:will v:make|base/det:a n:video/prep:on det:the n:beach",
"1^先生は突然笑った。^det:the n:teacher/v:laugh|past/adv:suddenly",
"2^あなたは今朝メッセージを確認した。^pr:you/v:check|past/det:a n:message/idm:this_morning",
"2^男の子は海辺で叫ぶ。^det:the n:boy/v:shout|base/prep:on det:the n:beach",
"2^わたしたちは海辺で泣いた。^pr:we/v:cry|past/prep:on det:the n:beach",
"2^かれは朝に模型を作った。^pr:he/v:make|past/det:a n:model/prep:in det:the n:morning",
"3^かのじょは先週バス停でノートパソコンを借りた。^pr:she/v:borrow|past/det:a n:laptop/prep:at det:the n:bus_stop/idm:last_week",
"2^男の子は7時に学校で笑う。^det:the n:boy/v:laugh|base/idm:at_school/idm:at_seven",
"1^ねこは今日の午後急ぐ。^det:the n:cat/v:hurry|base/idm:this_afternoon",
"1^ねこはここへ行った。^det:the n:cat/v:go|past/adv:here",
"2^お父さんは質問をやさしくするだろう。^pr:i n:dad/modal:will v:ask|base/det:a n:question/adv:softly",
"2^あなたは働いている。^pr:you/be:pres v:work|ing",
"3^犬は来週森で動画を見る予定だ。^det:the n:dog/be:pres v:watch|ing/det:a n:video/prep:in det:the n:forest/idm:next_week",
"3^わたしたちは来週カフェで巣箱をくらやみで作るつもりだ。^pr:we/modal:will v:build|base/det:a n:birdhouse/idm:in_the_dark/prep:at det:the n:cafe/idm:next_week",
"1^先生は昨夜買い物した。^det:the n:teacher/v:shop|past/idm:last_night",
"2^わたしは今夜川のそばで急ぐ予定だ。^pr:i/be:pres v:hurry|ing/prep:by det:the n:river/adv:tonight",
"3^友だちは庭でDVDを借りるだろう。^pr:i n:friend|pl/modal:will v:borrow|base/det:a n:DVD/prep:in det:the n:garden",
"3^先生は動物園で方法を近くで見つける。^det:the n:teacher/v:find|base/det:a n:way/idm:close_by/prep:at det:the n:zoo",
"2^わたしたちは明日家で箱を閉める予定だ。^pr:we/be:pres v:close|ing/det:the n:box/idm:at_home/adv:tomorrow",
"1^友だちは7時に寝る。^pr:i n:friend|pl/v:sleep|base/idm:at_seven",
"2^わたしたちは教室で踊るつもりだ。^pr:we/modal:will v:dance|base/prep:in det:the n:classroom",
"3^ねこは今朝カフェで庭を持っていた。^det:the n:cat/v:have|past/det:a n:garden/prep:at det:the n:cafe/idm:this_morning",
"2^お母さんはかんたんに叫んでいる。^pr:i n:mom/be:pres v:shout|ing/adv:easily",
"2^ねこは突然休んでいる。^det:the n:cat/be:pres v:rest|ing/adv:suddenly",
"2^わたしたちはくらやみで休んでいる。^pr:we/be:pres v:rest|ing/idm:in_the_dark",
"2^友だちは毎日学校で情報を送った。^pr:i n:friend|pl/v:send|past/n:information/idm:at_school/idm:every_day",
"3^女の子はスーパーでパズルをやった。^det:the n:girl/v:do|past/det:a n:puzzle/prep:at det:the n:supermarket",
"2^女の子は体育館でお茶を作った。^det:the n:girl/v:make|past/n:tea/prep:in det:the n:gym",
"3^男の子はもうすぐ庭でテーブルを直す。^det:the n:boy/v:fix|base/det:a n:table/prep:in det:the n:garden/adv:soon",
"2^お父さんは答えを確認する。^pr:i n:dad/v:check|base/det:a n:answer",
"2^ねこは海辺で完ぺきに踊る。^det:the n:cat/v:dance|base/adv:perfectly/prep:on det:the n:beach",
"1^友だちは完ぺきに話す。^pr:i n:friend|pl/v:talk|base/adv:perfectly",
"2^先生は次はわたしのスマホを借りる。^det:the n:teacher/v:borrow|base/pr:i n:phone/idm:next_time",
"2^かれは7時に病院へ行った。^pr:he/v:go|past/prep:to det:the n:hospital/idm:at_seven",
"2^ミカは動物園でひまわりを植えた。^n:Mika/v:plant|past/det:a n:sunflower/prep:at det:the n:zoo",
"1^あなたは昨夜行った。^pr:you/v:go|past/idm:last_night",
"2^わたしたちは昨夜図書館で時間どおりに走った。^pr:we/v:run|past/idm:on_time/prep:in det:the n:library/idm:last_night",
"1^かのじょは今魚にえさをあげる。^pr:she/v:feed|base/n:fish/adv:now",
"3^かれらは毎朝図書館でメールをもう一度送った。^pr:they/v:send|past/det:a n:email/adv:again/prep:in det:the n:library/idm:every_morning",
"2^ケンは前回はかばんを開けた。^n:Ken/v:open|past/det:a n:bag/idm:last_time",
"3^先生は来週カフェで親切に泣く予定だ。^det:the n:teacher/be:pres v:cry|ing/adv:kindly/prep:at det:the n:cafe/idm:next_week",
"2^お父さんは今日情報を以前は提供していた。^pr:i n:dad/sm:used_to v:give|base/n:information/adv:today",
"1^あなたは親切にジャンプした。^pr:you/v:jump|past/adv:kindly",
"2^女の子はカフェでコーヒーを作った。^det:the n:girl/v:make|past/n:coffee/prep:at det:the n:cafe",
"3^あなたはもうすぐ店で絵を見るだろう。^pr:you/modal:will v:see|base/det:a n:picture/prep:at det:the n:store/adv:soon",
"2^ミカはもうすぐ公園で働く。^n:Mika/v:work|base/prep:in det:the n:park/adv:soon",
"2^かれらはもうすぐパンを売るだろう。^pr:they/modal:will v:sell|base/n:bread/adv:soon",
"3^男の子はここでドアを近くで引いている。^det:the n:boy/be:pres v:pull|ing/det:the n:door/adv:nearby/adv:here",
"2^お父さんはここで以前は買い物していた。^pr:i n:dad/sm:used_to v:shop|base/adv:here",
"1^ケンはさっき買い物した。^n:Ken/v:shop|past/idm:just_now",
"2^先生は先週店に着いた。^det:the n:teacher/v:arrive|past/prep:at det:the n:store/idm:last_week",
"1^ケンは一日じゅうジャンプした。^n:Ken/v:jump|past/idm:all_day",
"2^あなたは夕方に以前は寝ていた。^pr:you/sm:used_to v:sleep|base/prep:in det:the n:evening",
"2^わたしたちは夜にスーツケースを引いた。^pr:we/v:pull|past/det:a n:suitcase/prep:at n:night",
"2^犬はあそこで休める。^det:the n:dog/modal:can v:rest|base/adv:there",
"2^ねこは今完ぺきに走る。^det:the n:cat/v:run|base/adv:perfectly/adv:now",
"2^わたしたちは2時間番組を見た。^pr:we/v:watch|past/det:a n:show/idm:for_two_hours",
"2^友だちは前回はびんを持って来た。^pr:i n:friend|pl/v:bring|past/det:a n:bottle/idm:last_time",
"2^ねこは夜に走った。^det:the n:cat/v:run|past/prep:at n:night",
"1^ミカは今日親切に歩いた。^n:Mika/v:walk|past/adv:kindly/adv:today",
"2^ミカは明日のんびりする予定だ。^n:Mika/be:pres v:relax|ing/adv:tomorrow",
"2^先生は昨夜口を閉じた。^det:the n:teacher/v:close|past/pr:they n:mouth/idm:last_night",
"2^ねこはやさしく来るところだ。^det:the n:cat/be:pres v:come|ing/adv:softly",
"3^かれらは夜にバス停で隠れるだろう。^pr:they/modal:will v:hide|base/prep:at det:the n:bus_stop/prep:at n:night",
"1^先生は次は買い物する。^det:the n:teacher/v:shop|base/idm:next_time",
"3^男の子は昨夜森でもう一度泳いだ。^det:the n:boy/v:swim|past/adv:again/prep:in det:the n:forest/idm:last_night",
"2^ケンはわたしの部屋で服を売った。^n:Ken/v:sell|past/n:clothes/prep:in pr:i n:room",
"2^先生は動物園でひそかに叫ぶ。^det:the n:teacher/v:shout|base/adv:secretly/prep:at det:the n:zoo",
"2^ねこはバス停で泣いた。^det:the n:cat/v:cry|past/prep:at det:the n:bus_stop",
"3^犬は2時間病院でバスについていった。^det:the n:dog/v:follow|past/det:the n:bus/prep:at det:the n:hospital/idm:for_two_hours",
"3^あなたは店で自転車を持っているだろう。^pr:you/modal:will v:have|base/det:a n:bicycle/prep:at det:the n:store",
"3^ケンは病院でわたしの電話に突然出た。^n:Ken/v:answer|past/pr:i n:phone/adv:suddenly/prep:at det:the n:hospital",
"2^犬はバス停へ来る。^det:the n:dog/v:come|base/prep:to det:the n:bus_stop",
"2^男の子は庭でジャンプするだろう。^det:the n:boy/modal:will v:jump|base/prep:in det:the n:garden",
"2^お母さんは病院でほほえんだ。^pr:i n:mom/v:smile|past/prep:at det:the n:hospital",
"2^ミカは一日じゅうメッセージに返信するだろう。^n:Mika/modal:will v:answer|base/det:a n:message/idm:all_day",
"2^ケンは駅で走った。^n:Ken/v:run|past/prep:at det:the n:station",
"2^先生はコートを着るだろう。^det:the n:teacher/modal:will v:wear|base/det:a n:coat",
"3^お母さんは明日森でパソコンを使う予定だ。^pr:i n:mom/be:pres v:use|ing/det:the n:computer/prep:in det:the n:forest/adv:tomorrow",
"2^ねこは夜にここへ来る。^det:the n:cat/v:come|base/adv:here/prep:at n:night",
"2^先生は東京で買い物している。^det:the n:teacher/be:pres v:shop|ing/prep:in n:Tokyo",
"1^かのじょは毎朝手助けをする。^pr:she/v:give|base/n:help/idm:every_morning",
"2^あなたは川のそばで勝つ。^pr:you/v:win|base/prep:by det:the n:river",
"1^ねこは次は寝る。^det:the n:cat/v:sleep|base/idm:next_time",
"1^かのじょはもうすぐ走る。^pr:she/v:run|base/adv:soon",
"2^ケンは体育館で講演者を招待した。^n:Ken/v:invite|past/det:a n:speaker/prep:in det:the n:gym",
"1^わたしたちは7時に働く。^pr:we/v:work|base/idm:at_seven",
"2^男の子は毎日川のそばで話す。^det:the n:boy/v:talk|base/prep:by det:the n:river/idm:every_day",
"2^お母さんは服を完ぺきに売るだろう。^pr:i n:mom/modal:will v:sell|base/n:clothes/adv:perfectly",
"2^ケンは先週公園へ旅行した。^n:Ken/v:travel|past/prep:to det:the n:park/idm:last_week",
"2^かれらは学校で水を以前は持って来ていた。^pr:they/sm:used_to v:bring|base/n:water/idm:at_school",
"1^あなたは家でシャンプーを使う。^pr:you/v:use|base/n:shampoo/idm:at_home",
"1^先生はあそこで寝た。^det:the n:teacher/v:sleep|past/adv:there",
"3^先生は今日森で時刻を得意げに確認した。^det:the n:teacher/v:check|past/det:the n:time/adv:proudly/prep:in det:the n:forest/adv:today",
"2^ミカは公園で塔を作る。^n:Mika/v:build|base/det:a n:tower/prep:in det:the n:park",
"3^わたしたちは図書館で質問をやさしくしている。^pr:we/be:pres v:ask|ing/det:a n:question/adv:softly/prep:in det:the n:library",
"2^わたしは森で急ぐ。^pr:i/v:hurry|base/prep:in det:the n:forest",
"3^かれらは今朝店でカメラを運んだ。^pr:they/v:carry|past/det:a n:camera/prep:at det:the n:store/idm:this_morning",
"2^かのじょは東京で自転車に乗るだろう。^pr:she/modal:will v:ride|base/det:a n:bike/prep:in n:Tokyo",
"2^わたしたちは病院で泣く。^pr:we/v:cry|base/prep:at det:the n:hospital",
"3^お父さんはバス停で引き出しをもう一度引くだろう。^pr:i n:dad/modal:will v:pull|base/det:a n:drawer/adv:again/prep:at det:the n:bus_stop",
"3^先生は空港で花をあげる。^det:the n:teacher/v:give|base/det:a n:flower/prep:at det:the n:airport",
"1^ケンは踊った。^n:Ken/v:dance|past",
"2^お母さんは夜にほほえむ。^pr:i n:mom/v:smile|base/prep:at n:night",
"2^わたしは動物園で泣く。^pr:i/v:cry|base/prep:at det:the n:zoo",
"3^女の子は7時にバス停でカメラを借りられた。^det:the n:girl/modal:could v:borrow|base/det:a n:camera/prep:at det:the n:bus_stop/idm:at_seven",
"2^先生は体育館で近くで急いだ。^det:the n:teacher/v:hurry|past/adv:nearby/prep:in det:the n:gym",
"1^かのじょは7時にやさしく寝る。^pr:she/v:sleep|base/adv:softly/idm:at_seven",
"2^友だちは今夜歩く予定だ。^pr:i n:friend|pl/be:pres v:walk|ing/adv:tonight",
"3^お父さんは会社へふだんすばやく行く。^pr:i n:dad/adv:usually v:go|base/adv:quickly/prep:to det:the n:office",
"2^お母さんは一日じゅう模型を作った。^pr:i n:mom/v:build|past/det:a n:model/idm:all_day",
"3^わたしは明日自分の部屋でかさを開く予定だ。^pr:i/be:pres v:open|ing/det:a n:umbrella/prep:in pr:i n:room/adv:tomorrow",
"3^犬は来週あそこで家を持っているだろう。^det:the n:dog/modal:will v:have|base/det:a n:house/adv:there/idm:next_week",
"2^男の子は水を怒って持ってくる。^det:the n:boy/v:bring|base/n:water/adv:angrily",
"2^あなたは朝に手紙に返信した。^pr:you/v:answer|past/det:a n:letter/prep:in det:the n:morning",
"2^かれらは今夜歩く予定だ。^pr:they/be:pres v:walk|ing/adv:tonight",
"2^お母さんは庭で休んだ。^pr:i n:mom/v:rest|past/prep:in det:the n:garden",
"1^わたしは7時に学校で買い物した。^pr:i/v:shop|past/idm:at_school/idm:at_seven",
"2^ケンは次は魚についにえさをあげる。^n:Ken/v:feed|base/n:fish/adv:finally/idm:next_time",
"3^ミカは朝に教室で模型を作る。^n:Mika/v:build|base/det:a n:model/prep:in det:the n:classroom/prep:in det:the n:morning",
"2^犬はていねいに泣くだろう。^det:the n:dog/modal:will v:cry|base/adv:politely",
"2^男の子は前回は得意げに休んだ。^det:the n:boy/v:rest|past/adv:proudly/idm:last_time",
"2^お父さんはわたしの部屋で笑った。^pr:i n:dad/v:laugh|past/prep:in pr:i n:room",
"2^お父さんは森で働いた。^pr:i n:dad/v:work|past/prep:in det:the n:forest",
"2^お父さんは今スーパーで走る。^pr:i n:dad/v:run|base/prep:at det:the n:supermarket/adv:now",
"3^かれは前回はバス停で稲を植えた。^pr:he/v:plant|past/det:a n:rice_plant/prep:at det:the n:bus_stop/idm:last_time",
"2^わたしは家で地下鉄に乗った。^pr:i/v:ride|past/det:a n:subway/idm:at_home",
"2^わたしたちはいすをかんたんに引く。^pr:we/v:pull|base/det:a n:chair/adv:easily",
"2^友だちは一日じゅうあそこへ来た。^pr:i n:friend|pl/v:come|past/adv:there/idm:all_day",
"2^友だちはもうすぐレストランで笑う。^pr:i n:friend|pl/v:laugh|base/prep:at det:the n:restaurant/adv:soon",
"2^男の子はもうすぐ映画を見る。^det:the n:boy/v:watch|base/det:a n:movie/adv:soon",
"2^犬はいっしょに走っている。^det:the n:dog/be:pres v:run|ing/adv:together",
"2^ミカは店で家を買う。^n:Mika/v:buy|base/det:a n:house/prep:at det:the n:store",
"2^友だちは毎朝質問をする。^pr:i n:friend|pl/v:ask|base/det:a n:question/idm:every_morning",
"2^友だちは今日の午後完ぺきに急いでいる。^pr:i n:friend|pl/be:pres v:hurry|ing/adv:perfectly/idm:this_afternoon",
"1^お母さんは今日休んだ。^pr:i n:mom/v:rest|past/adv:today",
"3^わたしは今日駅でクレジットカードを使うつもりだ。^pr:i/modal:will v:use|base/det:a n:credit_card/prep:at det:the n:station/adv:today",
"2^先生は一日じゅう情報を見つけた。^det:the n:teacher/v:find|past/n:information/idm:all_day",
"2^ねこは今日バスについていった。^det:the n:cat/v:follow|past/det:the n:bus/adv:today",
"3^わたしはさっき海辺で映画を見た。^pr:i/v:watch|past/det:a n:movie/prep:on det:the n:beach/idm:just_now",
"3^ねこは駅でケーキを安全に持ってくる。^det:the n:cat/v:bring|base/det:a n:cake/adv:safely/prep:at det:the n:station",
"2^あなたは昨夜台所でジャンプした。^pr:you/v:jump|past/prep:in det:the n:kitchen/idm:last_night",
"1^かれは次は泳ぐ。^pr:he/v:swim|base/idm:next_time",
"2^かれは今東京でひまわりを植える。^pr:he/v:plant|base/det:a n:sunflower/prep:in n:Tokyo/adv:now",
"2^わたしは手紙をていねいに開封した。^pr:i/v:open|past/det:a n:letter/adv:politely",
"2^あなたは手紙を開封するだろう。^pr:you/modal:will v:open|base/det:a n:letter",
"2^あなたは空港で隠れている。^pr:you/be:pres v:hide|ing/prep:at det:the n:airport",
"2^かれらはスーパーで試合を見る。^pr:they/v:watch|base/det:the n:game/prep:at det:the n:supermarket",
"2^男の子は先週空港で走った。^det:the n:boy/v:run|past/prep:at det:the n:airport/idm:last_week",
"1^わたしは毎日笑う。^pr:i/v:laugh|base/idm:every_day",
"2^ミカは今日の午後東京で泣くだろう。^n:Mika/modal:will v:cry|base/prep:in n:Tokyo/idm:this_afternoon",
"2^わたしは公園で休んだ。^pr:i/v:rest|past/prep:in det:the n:park",
"3^ミカはさっき体育館でプリンターを直した。^n:Mika/v:fix|past/det:a n:printer/prep:in det:the n:gym/idm:just_now",
"1^ミカは2日前もう一度走った。^n:Mika/v:run|past/adv:again/idm:two_days_ago",
"2^わたしたちはさっきわたしのスマホを持っていた。^pr:we/v:have|past/pr:i n:phone/idm:just_now",
"1^かれらは近くで来る。^pr:they/v:come|base/adv:nearby",
"3^お父さんは今日店で踊るだろう。^pr:i n:dad/modal:will v:dance|base/prep:at det:the n:store/adv:today",
"2^かのじょはプリンターを安全に使うだろう。^pr:she/modal:will v:use|base/det:a n:printer/adv:safely",
"3^女の子は前回は体育館へよく旅行した。^det:the n:girl/adv:often v:travel|past/prep:to det:the n:gym/idm:last_time",
"2^男の子は庭へ旅行している。^det:the n:boy/be:pres v:travel|ing/prep:to det:the n:garden",
"1^わたしはさっき行った。^pr:i/v:go|past/idm:just_now",
"3^お母さんは今夜空港で買い物する予定だ。^pr:i n:mom/be:pres v:shop|ing/prep:at det:the n:airport/adv:tonight",
"3^犬は今日スーパーへ行くだろう。^det:the n:dog/modal:will v:go|base/prep:to det:the n:supermarket/adv:today",
"2^お母さんは公園でジャンプした。^pr:i n:mom/v:jump|past/prep:in det:the n:park",
"2^わたしたちは7時に病院で踊った。^pr:we/v:dance|past/prep:at det:the n:hospital/idm:at_seven",
"2^ケンはレストランで講演者を招待する。^n:Ken/v:invite|base/det:a n:speaker/prep:at det:the n:restaurant",
"2^犬は川へ来る。^det:the n:dog/v:come|base/prep:to det:the n:river",
"3^お父さんは来週川のそばで講演者を招待する予定だ。^pr:i n:dad/be:pres v:invite|ing/det:a n:speaker/prep:by det:the n:river/idm:next_week",
"2^女の子は先週体育館で叫んだ。^det:the n:girl/v:shout|past/prep:in det:the n:gym/idm:last_week",
"2^あなたはわたしの部屋で休んだ。^pr:you/v:rest|past/prep:in pr:i n:room",
"3^お母さんは今朝バス停で贈り物をすばやく送った。^pr:i n:mom/v:send|past/det:a n:gift/adv:quickly/prep:at det:the n:bus_stop/idm:this_morning",
"1^かれらは毎朝叫んだ。^pr:they/v:shout|past/idm:every_morning",
"3^男の子は今朝空港で講演者を招待した。^det:the n:boy/v:invite|past/det:a n:speaker/prep:at det:the n:airport/idm:this_morning",
"1^ケンは毎朝歩く。^n:Ken/v:walk|base/idm:every_morning",
"3^お父さんは公園で質問をした。^pr:i n:dad/v:ask|past/det:a n:question/prep:in det:the n:park",
"2^ねこはスーパーへ行く。^det:the n:cat/v:go|base/prep:to det:the n:supermarket",
"1^ミカは今日急いだ。^n:Mika/v:hurry|past/adv:today",
"3^かれらは台所で花を植えている。^pr:they/be:pres v:plant|ing/det:a n:flower/prep:in det:the n:kitchen",
"2^女の子は次は庭で隠れる。^det:the n:girl/v:hide|base/prep:in det:the n:garden/idm:next_time",
"2^犬は親切に以前は寝ていた。^det:the n:dog/sm:used_to v:sleep|base/adv:kindly",
"2^わたしは窓をひそかに閉める。^pr:i/v:close|base/det:the n:window/adv:secretly",
"3^先生は7時に動物園で本を開いた。^det:the n:teacher/v:open|past/det:a n:book/prep:at det:the n:zoo/idm:at_seven",
"1^かれはノートを借りる。^pr:he/v:borrow|base/det:a n:notebook",
"2^男の子はたくさん笑うだろう。^det:the n:boy/modal:will v:laugh|base/idm:a_lot",
"2^ケンは夜にわたしのスマホを持って来た。^n:Ken/v:bring|past/pr:i n:phone/prep:at n:night",
"3^友だちは毎日カフェで機械を作った。^pr:i n:friend|pl/v:build|past/det:a n:machine/prep:at det:the n:cafe/idm:every_day",
"3^お父さんは来週動物園でいすを借りる予定だ。^pr:i n:dad/be:pres v:borrow|ing/det:a n:chair/prep:at det:the n:zoo/idm:next_week",
"2^お父さんは明日笑う予定だ。^pr:i n:dad/be:pres v:laugh|ing/adv:tomorrow",
"1^ケンは今日来る。^n:Ken/v:come|base/adv:today",
"2^犬は突然勝つだろう。^det:the n:dog/modal:will v:win|base/adv:suddenly",
"3^お父さんはわたしの部屋で本をていねいに運んでいる。^pr:i n:dad/be:pres v:carry|ing/det:a n:book/adv:politely/prep:in pr:i n:room",
"2^先生は海辺でジャンプした。^det:the n:teacher/v:jump|past/prep:on det:the n:beach",
"1^わたしは突然泳いだ。^pr:i/v:swim|past/adv:suddenly",
"2^かれは明日時間どおりに行く予定だ。^pr:he/be:pres v:go|ing/idm:on_time/adv:tomorrow",
"1^わたしは隠れる。^pr:i/v:hide|base",
"3^お母さんは教室でカードをなくすところだ。^pr:i n:mom/be:pres v:lose|ing/det:a n:card/prep:in det:the n:classroom",
"2^あなたは図書館で健康を守っている。^pr:you/be:pres v:protect|ing/n:health/prep:in det:the n:library",
"2^あなたは次は駅へ旅行する。^pr:you/v:travel|base/prep:to det:the n:station/idm:next_time",
"2^犬は今親切に急ぐ。^det:the n:dog/v:hurry|base/adv:kindly/adv:now",
"2^お父さんは昨日学校で買い物した。^pr:i n:dad/v:shop|past/idm:at_school/adv:yesterday",
"3^お母さんは朝に図書館で買い物する。^pr:i n:mom/v:shop|base/prep:in det:the n:library/prep:in det:the n:morning",
"1^かれらは先週ジャンプした。^pr:they/v:jump|past/idm:last_week",
"2^かのじょは海辺で歩く。^pr:she/v:walk|base/prep:on det:the n:beach",
"2^男の子は店でほほえむ。^det:the n:boy/v:smile|base/prep:at det:the n:store",
"2^わたしたちは2日前会社で働いた。^pr:we/v:work|past/prep:at det:the n:office/idm:two_days_ago",
"3^友だちはわたしの部屋で野菜を買っている。^pr:i n:friend|pl/be:pres v:buy|ing/n:vegetables/prep:in pr:i n:room",
"2^犬は植物をもう一度守るだろう。^det:the n:dog/modal:will v:protect|base/det:a n:plant/adv:again",
"2^かのじょは今日の午後本をなくすところだ。^pr:she/be:pres v:lose|ing/det:a n:book/idm:this_afternoon",
"2^ミカは動物園で買い物した。^n:Mika/v:shop|past/prep:at det:the n:zoo",
"2^あなたは来週働く予定だ。^pr:you/be:pres v:work|ing/idm:next_week",
"2^わたしは川のそばで夕日を見た。^pr:i/v:watch|past/det:the n:sunset/prep:by det:the n:river",
"3^わたしたちは真夜中に台所で以前はほほえんでいた。^pr:we/sm:used_to v:smile|base/prep:in det:the n:kitchen/prep:at n:midnight",
"3^女の子は朝にわたしの部屋でかばんを借りた。^det:the n:girl/v:borrow|past/det:a n:bag/prep:in pr:i n:room/prep:in det:the n:morning",
"2^友だちはカフェで踊る。^pr:i n:friend|pl/v:dance|base/prep:at det:the n:cafe",
"2^ねこは休むだろう。^det:the n:cat/modal:will v:rest|base",
"3^かれは今日病院でわたしのスマホを見つける。^pr:he/v:find|base/pr:i n:phone/prep:at det:the n:hospital/adv:today",
"2^かれは東京で話せる。^pr:he/modal:can v:talk|base/prep:in n:Tokyo",
"3^かれは今日海辺でドアを親切に開けた。^pr:he/v:open|past/det:the n:door/adv:kindly/prep:on det:the n:beach/adv:today",
"2^女の子は2日前豆を植えた。^det:the n:girl/v:plant|past/det:a n:bean/idm:two_days_ago",
"2^女の子は空港で休んでいる。^det:the n:girl/be:pres v:rest|ing/prep:at det:the n:airport",
"3^先生はもうすぐ店でやさしく泣く。^det:the n:teacher/v:cry|base/adv:softly/prep:at det:the n:store/adv:soon",
"2^先生は今質問をする。^det:the n:teacher/v:ask|base/det:a n:question/adv:now",
"2^ねこは駅で以前は泣いていた。^det:the n:cat/sm:used_to v:cry|base/prep:at det:the n:station",
"2^わたしたちは東京で自転車を直す。^pr:we/v:fix|base/det:a n:bicycle/prep:in n:Tokyo",
"2^犬はわたしの部屋で踊った。^det:the n:dog/v:dance|past/prep:in pr:i n:room",
"2^犬は来週歩く予定だ。^det:the n:dog/be:pres v:walk|ing/idm:next_week",
"3^わたしたちは病院で番組を見ている。^pr:we/be:pres v:watch|ing/det:a n:show/prep:at det:the n:hospital",
"2^わたしたちは先週バラを植えた。^pr:we/v:plant|past/det:a n:rose/idm:last_week",
"3^かれらは2日前体育館で写真を撮った。^pr:they/v:take|past/det:a n:photo/prep:in det:the n:gym/idm:two_days_ago",
"1^先生はていねいに着く。^det:the n:teacher/v:arrive|base/adv:politely",
"2^先生はカフェでまったりした。^det:the n:teacher/v:chill|past/prep:at det:the n:cafe",
"3^かれはレストランでコンサートを見ている。^pr:he/be:pres v:watch|ing/det:a n:concert/prep:at det:the n:restaurant",
"3^ねこは先週図書館で植物を守った。^det:the n:cat/v:protect|past/det:a n:plant/prep:in det:the n:library/idm:last_week",
"3^わたしたちは夜に公園で質問をした。^pr:we/v:ask|past/det:a n:question/prep:in det:the n:park/prep:at n:night",
"3^お母さんは空港で自転車に乗った。^pr:i n:mom/v:ride|past/det:a n:bike/prep:at det:the n:airport",
"2^あなたは図書館で踊る。^pr:you/v:dance|base/prep:in det:the n:library",
"3^お母さんは夜に空港で牛乳を買う。^pr:i n:mom/v:buy|base/n:milk/prep:at det:the n:airport/prep:at n:night",
"2^友だちはあそこでノートパソコンを近くで使った。^pr:i n:friend|pl/v:use|past/det:a n:laptop/adv:nearby/adv:there",
"1^かのじょは昨夜ていねいに勝った。^pr:she/v:win|past/adv:politely/idm:last_night",
"3^友だちは今川のそばでかさをなくす。^pr:i n:friend|pl/v:lose|base/det:a n:umbrella/prep:by det:the n:river/adv:now",
"2^先生はもう一度隠れている。^det:the n:teacher/be:pres v:hide|ing/adv:again",
"2^かれらは毎日エスカレーターに乗る。^pr:they/v:ride|base/det:a n:escalator/idm:every_day",
"2^犬は今夜間に合うように勝つだろう。^det:the n:dog/be:pres v:win|ing/idm:in_time/adv:tonight",
"1^お母さんは毎日ジャンプする。^pr:i n:mom/v:jump|base/idm:every_day",
"2^わたしはもうすぐ庭で急ぐ。^pr:i/v:hurry|base/prep:in det:the n:garden/adv:soon",
"3^女の子は2日前庭で朝ごはんを作った。^det:the n:girl/v:make|past/n:breakfast/prep:in det:the n:garden/idm:two_days_ago",
"3^お父さんは公園でいっしょに叫んでいる。^pr:i n:dad/be:pres v:shout|ing/adv:together/prep:in det:the n:park",
"3^先生は今日の午後学校で動画を作るだろう。^det:the n:teacher/modal:will v:make|base/det:a n:video/idm:at_school/idm:this_afternoon",
"2^お母さんは映画をくらやみで見る。^pr:i n:mom/v:watch|base/det:a n:movie/idm:in_the_dark",
"2^かれは来週レストランへ行く予定だ。^pr:he/be:pres v:go|ing/prep:to det:the n:restaurant/idm:next_week",
"2^友だちは2日前靴をなくした。^pr:i n:friend|pl/v:lose|past/n:shoe|pl/idm:two_days_ago",
"2^わたしたちは公園で下手に勝っている。^pr:we/be:pres v:win|ing/adv:badly/prep:in det:the n:park",
"2^わたしたちは体育館で健康を守る。^pr:we/v:protect|base/n:health/prep:in det:the n:gym",
"3^友だちは次はスーパーでお金を借りる。^pr:i n:friend|pl/v:borrow|base/n:money/prep:at det:the n:supermarket/idm:next_time",
"2^お母さんは海辺でめがねをなくした。^pr:i n:mom/v:lose|past/n:glass|pl/prep:on det:the n:beach",
"1^犬は前回は走った。^det:the n:dog/v:run|past/idm:last_time",
"3^お父さんは今日川のそばで泣いている。^pr:i n:dad/be:pres v:cry|ing/prep:by det:the n:river/adv:today",
"1^お父さんはかんたんに働いた。^pr:i n:dad/v:work|past/adv:easily",
"2^友だちは体育館で勝った。^pr:i n:friend|pl/v:win|past/prep:in det:the n:gym",
"1^お母さんは今朝旅行した。^pr:i n:mom/v:travel|past/idm:this_morning",
"1^わたしたちは今日の午後来る。^pr:we/v:come|base/idm:this_afternoon",
"2^かれらは体育館でコーヒーを買う。^pr:they/v:buy|base/n:coffee/prep:in det:the n:gym",
"2^あなたはカフェでバスについていく。^pr:you/v:follow|base/det:the n:bus/prep:at det:the n:cafe",
"1^ミカは安全に歩く。^n:Mika/v:walk|base/adv:safely",
"2^先生は機械を直している。^det:the n:teacher/be:pres v:fix|ing/det:a n:machine",
"2^ケンは充電器をいっしょに借りる。^n:Ken/v:borrow|base/det:a n:charger/adv:together",
"1^かれらは道具を使う。^pr:they/v:use|base/det:a n:tool",
"2^女の子は方法をついに見つける。^det:the n:girl/v:find|base/det:a n:way/adv:finally",
"3^お父さんは公園で家を見た。^pr:i n:dad/v:see|past/det:a n:house/prep:in det:the n:park",
"2^あなたは空港で急ぐ。^pr:you/v:hurry|base/prep:at det:the n:airport",
"2^ケンは教室へ来た。^n:Ken/v:come|past/prep:to det:the n:classroom",
"1^あなたは今朝お金をあげた。^pr:you/v:give|past/n:money/idm:this_morning",
"2^男の子はわたしの部屋で歩く。^det:the n:boy/v:walk|base/prep:in pr:i n:room",
"3^お父さんはスーパーでリストを確認する。^pr:i n:dad/v:check|base/det:a n:list/prep:at det:the n:supermarket",
"2^女の子は一日じゅうボートを作った。^det:the n:girl/v:build|past/det:a n:boat/idm:all_day",
"1^ミカはよく着く。^n:Mika/adv:often v:arrive|base",
"1^友だちは一日じゅう叫んだ。^pr:i n:friend|pl/v:shout|past/idm:all_day",
"1^ケンは毎朝働く。^n:Ken/v:work|base/idm:every_morning",
"2^かのじょは川のそばで箱を閉めた。^pr:she/v:close|past/det:the n:box/prep:by det:the n:river",
"3^友だちは病院で花を売った。^pr:i n:friend|pl/v:sell|past/det:a n:flower/prep:at det:the n:hospital",
"2^男の子は森へ来るだろう。^det:the n:boy/modal:will v:come|base/prep:to det:the n:forest",
"2^女の子は2日前ここで活動をやった。^det:the n:girl/v:do|past/det:a n:activity/adv:here/idm:two_days_ago",
"3^先生はもうすぐ川のそばで講演者を招待する。^det:the n:teacher/v:invite|base/det:a n:speaker/prep:by det:the n:river/adv:soon",
"3^先生は毎朝図書館で服を売った。^det:the n:teacher/v:sell|past/n:clothes/prep:in det:the n:library/idm:every_morning",
"2^お父さんはもうすぐかんたんに歩くだろう。^pr:i n:dad/modal:will v:walk|base/adv:easily/adv:soon",
"2^かれらは前回は学校でかさを持って来た。^pr:they/v:bring|past/det:a n:umbrella/idm:at_school/idm:last_time",
"3^犬はバス停でわたしのスマホを持っている。^det:the n:dog/v:have|base/pr:i n:phone/prep:at det:the n:bus_stop",
"2^先生はスーパーで泣く。^det:the n:teacher/v:cry|base/prep:at det:the n:supermarket",
"2^先生は昨日川のそばでまったりした。^det:the n:teacher/v:chill|past/prep:by det:the n:river/adv:yesterday",
"3^女の子は会社で口を静かに閉じるだろう。^det:the n:girl/modal:will v:close|base/pr:she n:mouth/adv:quietly/prep:at det:the n:office",
"2^あなたはさっきトマトを植えた。^pr:you/v:plant|past/det:a n:tomato/idm:just_now",
"2^かのじょはレストランで走った。^pr:she/v:run|past/prep:at det:the n:restaurant",
"2^かのじょは次は学校で自転車を持っている。^pr:she/v:have|base/det:a n:bicycle/idm:at_school/idm:next_time",
"2^お父さんはていねいに働いている。^pr:i n:dad/be:pres v:work|ing/adv:politely",
"2^かれらは笑っている。^pr:they/be:pres v:laugh|ing",
"2^お母さんはレストランに着くだろう。^pr:i n:mom/modal:will v:arrive|base/prep:at det:the n:restaurant",
"2^お父さんは昨夜自転車に間に合うように乗った。^pr:i n:dad/v:ride|past/det:a n:bike/idm:in_time/idm:last_night",
"1^ケンは下手に働く。^n:Ken/v:work|base/adv:badly",
"2^ケンは電池を以前は確認していた。^n:Ken/sm:used_to v:check|base/det:a n:battery",
"2^女の子は川のそばで踊った。^det:the n:girl/v:dance|past/prep:by det:the n:river",
"3^お母さんは明日動物園でまったりする予定だ。^pr:i n:mom/be:pres v:chill|ing/prep:at det:the n:zoo/adv:tomorrow",
"2^友だちは一日じゅう空港でジャンプした。^pr:i n:friend|pl/v:jump|past/prep:at det:the n:airport/idm:all_day",
"2^お母さんは車を持っている。^pr:i n:mom/v:have|base/det:the n:car",
"2^あなたは朝に講演者を招待する。^pr:you/v:invite|base/det:a n:speaker/prep:in det:the n:morning",
"2^ミカは川のそばでまったりした。^n:Mika/v:chill|past/prep:by det:the n:river",
"3^ねこはバス停で庭を持っている。^det:the n:cat/v:have|base/det:a n:garden/prep:at det:the n:bus_stop",
"2^ねこは庭で隠れた。^det:the n:cat/v:hide|past/prep:in det:the n:garden",
"2^犬は会社へ行くところだ。^det:the n:dog/be:pres v:go|ing/prep:to det:the n:office",
"2^かれらはもうすぐ学校で車を売る。^pr:they/v:sell|base/det:the n:car/idm:at_school/adv:soon",
"3^女の子は台所で道具をかんたんに運んだ。^det:the n:girl/v:carry|past/det:a n:tool/adv:easily/prep:in det:the n:kitchen",
"2^ケンは朝に着くだろう。^n:Ken/modal:will v:arrive|base/prep:in det:the n:morning",
"2^わたしは次はチューリップを植える。^pr:i/v:plant|base/det:a n:tulip/idm:next_time",
"2^かれは来週来るだろう。^pr:he/modal:will v:come|base/idm:next_week",
"2^友だちは週末に以前は叫んでいた。^pr:i n:friend|pl/sm:used_to v:shout|base/idm:on_weekends",
"1^お母さんは2時間走った。^pr:i n:mom/v:run|past/idm:for_two_hours",
"2^犬は今日公園で走る。^det:the n:dog/v:run|base/prep:in det:the n:park/adv:today",
"2^わたしは自分の部屋で話した。^pr:i/v:talk|past/prep:in pr:i n:room",
"3^ケンは来週東京で講演者を得意げに招待する予定だ。^n:Ken/be:pres v:invite|ing/det:a n:speaker/adv:proudly/prep:in n:Tokyo/idm:next_week",
"3^先生は病院で贈り物を持って来た。^det:the n:teacher/v:bring|past/det:a n:gift/prep:at det:the n:hospital",
"2^犬は先週庭へ来た。^det:the n:dog/v:come|past/prep:to det:the n:garden/idm:last_week",
"2^友だちは今草を植える。^pr:i n:friend|pl/v:plant|base/n:grass/adv:now",
"3^ケンは図書館でノートパソコンをすばやく直すだろう。^n:Ken/modal:will v:fix|base/det:a n:laptop/adv:quickly/prep:in det:the n:library",
"2^かれらは駅にいっしょに着く。^pr:they/v:arrive|base/adv:together/prep:at det:the n:station",
"3^ねこは川のそばで質問があった。^det:the n:cat/v:have|past/det:a n:question/prep:by det:the n:river",
"2^ケンは海辺でのんびりする。^n:Ken/v:relax|base/prep:on det:the n:beach",
"2^かれらは来週間に合うようにほほえむ予定だ。^pr:they/be:pres v:smile|ing/idm:in_time/idm:next_week",
"2^かのじょは先週教室でジャンプした。^pr:she/v:jump|past/prep:in det:the n:classroom/idm:last_week",
"1^かれはもうすぐ泳ぐ。^pr:he/v:swim|base/adv:soon",
"2^ケンは明日まったりする予定だ。^n:Ken/be:pres v:chill|ing/adv:tomorrow",
"2^ケンは空港へ旅行する。^n:Ken/v:travel|base/prep:to det:the n:airport",
"1^わたしたちは完ぺきに歩いた。^pr:we/v:walk|past/adv:perfectly",
"3^男の子は2時間海辺で講演者を招待した。^det:the n:boy/v:invite|past/det:a n:speaker/prep:on det:the n:beach/idm:for_two_hours",
"1^かれらは次は旅行する。^pr:they/v:travel|base/idm:next_time",
"3^あなたはわたしの部屋で講演者を招待するだろう。^pr:you/modal:will v:invite|base/det:a n:speaker/prep:in pr:i n:room",
"2^ケンは2日前東京で急いだ。^n:Ken/v:hurry|past/prep:in n:Tokyo/idm:two_days_ago",
"3^わたしはスーパーで家を売るつもりだ。^pr:i/modal:will v:sell|base/det:a n:house/prep:at det:the n:supermarket",
"2^ミカは川のそばでカードをあげる。^n:Mika/v:give|base/det:a n:card/prep:by det:the n:river",
"3^友だちは明日レストランで講演者を招待する予定だ。^pr:i n:friend|pl/be:pres v:invite|ing/det:a n:speaker/prep:at det:the n:restaurant/adv:tomorrow",
"2^友だちは昨日食べ物を作った。^pr:i n:friend|pl/v:make|past/n:food/adv:yesterday",
"2^ミカは庭で泣くだろう。^n:Mika/modal:will v:cry|base/prep:in det:the n:garden",
"1^わたしたちは毎日話す。^pr:we/v:talk|base/idm:every_day",
"3^女の子はスーパーでバスについていった。^det:the n:girl/v:follow|past/det:the n:bus/prep:at det:the n:supermarket",
"2^ねこはここで家を持っている。^det:the n:cat/v:have|base/det:a n:house/adv:here",
"1^先生は今日の午後ジャンプした。^det:the n:teacher/v:jump|past/idm:this_afternoon",
"2^ねこは一日じゅうときどきコンサートを見た。^det:the n:cat/adv:sometimes v:watch|past/det:a n:concert/idm:all_day",
"1^わたしたちは食べ物を運ぶ。^pr:we/v:carry|base/n:food",
"2^犬は7時に目を守る。^det:the n:dog/v:protect|base/det:a n:eye/idm:at_seven",
"3^先生は夜に会社で手ぶくろをはめた。^det:the n:teacher/v:wear|past/det:a n:glove/prep:at det:the n:office/prep:at n:night",
"2^わたしは今日台所で寝た。^pr:i/v:sleep|past/prep:in det:the n:kitchen/adv:today",
"1^男の子は毎日寝る。^det:the n:boy/v:sleep|base/idm:every_day",
"2^わたしたちは学校でカードをなくした。^pr:we/v:lose|past/det:a n:card/idm:at_school",
"2^犬は病院で踊る。^det:the n:dog/v:dance|base/prep:at det:the n:hospital",
"2^かれらは家でケーキを作るだろう。^pr:they/modal:will v:make|base/det:a n:cake/idm:at_home",
"1^かのじょは2時間やさしく歩いた。^pr:she/v:walk|past/adv:softly/idm:for_two_hours",
"3^お父さんはカフェでくだものを下手に買っている。^pr:i n:dad/be:pres v:buy|ing/n:fruit/adv:badly/prep:at det:the n:cafe",
"2^ケンはわたしの部屋で踊るだろう。^n:Ken/modal:will v:dance|base/prep:in pr:i n:room",
"2^先生は今夜スクーターに乗るだろう。^det:the n:teacher/modal:will v:ride|base/det:a n:scooter/adv:tonight",
"2^女の子は食べ物を突然買う。^det:the n:girl/v:buy|base/n:food/adv:suddenly",
"3^かれはもうすぐ動物園でボートにいっしょに乗る。^pr:he/v:ride|base/det:a n:boat/adv:together/prep:at det:the n:zoo/adv:soon",
"2^犬は川のそばで泳ぐ。^det:the n:dog/v:swim|base/prep:by det:the n:river",
"1^かのじょは毎日来る。^pr:she/v:come|base/idm:every_day",
"2^男の子は駅で笑った。^det:the n:boy/v:laugh|past/prep:at det:the n:station",
"3^女の子は夜に庭でのんびりする。^det:the n:girl/v:relax|base/prep:in det:the n:garden/prep:at n:night",
"3^友だちは朝に川へ突然来る。^pr:i n:friend|pl/v:come|base/adv:suddenly/prep:to det:the n:river/prep:in det:the n:morning",
"2^女の子は2日前家を見つけた。^det:the n:girl/v:find|past/det:a n:house/idm:two_days_ago",
"2^わたしたちはカフェで魚にえさをあげている。^pr:we/be:pres v:feed|ing/n:fish/prep:at det:the n:cafe",
"2^お母さんは一日じゅう図書館で隠れた。^pr:i n:mom/v:hide|past/prep:in det:the n:library/idm:all_day",
"2^先生は今夜泳ぐ予定だ。^det:the n:teacher/be:pres v:swim|ing/adv:tonight",
"2^かのじょは空港で本を持っている。^pr:she/v:have|base/det:a n:book/prep:at det:the n:airport",
"1^犬はかんたんに休んだ。^det:the n:dog/v:rest|past/adv:easily",
"3^お母さんは夜に体育館で買い物した。^pr:i n:mom/v:shop|past/prep:in det:the n:gym/prep:at n:night",
"2^わたしはあそこでゆっくり踊っている。^pr:i/be:pres v:dance|ing/adv:slowly/adv:there",
"2^かれは昨夜映画を見た。^pr:he/v:see|past/det:a n:movie/idm:last_night",
"2^ケンは空港で質問をした。^n:Ken/v:ask|past/det:a n:question/prep:at det:the n:airport",
"2^お父さんはバス停で急ぐだろう。^pr:i n:dad/modal:will v:hurry|base/prep:at det:the n:bus_stop",
"2^ミカは教室で働いた。^n:Mika/v:work|past/prep:in det:the n:classroom",
"2^わたしは病院で歩くつもりだ。^pr:i/modal:will v:walk|base/prep:at det:the n:hospital",
"3^お父さんは空港で車に以前はついていっていた。^pr:i n:dad/sm:used_to v:follow|base/det:the n:car/prep:at det:the n:airport",
"3^友だちは今夜公園で歩くだろう。^pr:i n:friend|pl/modal:will v:walk|base/prep:in det:the n:park/adv:tonight",
"1^お父さんは時間どおりに叫ぶ。^pr:i n:dad/v:shout|base/idm:on_time",
"1^ねこはあそこで泳ぐ。^det:the n:cat/v:swim|base/adv:there",
"2^ケンは食器棚をすばやく閉める。^n:Ken/v:close|base/det:a n:cupboard/adv:quickly",
"3^ケンは来週バス停でノートパソコンを直すだろう。^n:Ken/modal:will v:fix|base/det:a n:laptop/prep:at det:the n:bus_stop/idm:next_week",
"2^男の子はかさをやさしくなくした。^det:the n:boy/v:lose|past/det:a n:umbrella/adv:softly",
"2^女の子はバス停で靴下をはいた。^det:the n:girl/v:wear|past/n:sock|pl/prep:at det:the n:bus_stop",
"2^かれは川のそばで働く。^pr:he/v:work|base/prep:by det:the n:river",
"2^わたしたちは病院で急ぐ。^pr:we/v:hurry|base/prep:at det:the n:hospital",
"2^先生は昨日写真を送った。^det:the n:teacher/v:send|past/det:a n:photo/adv:yesterday",
"3^先生は庭で塔をやさしく作っている。^det:the n:teacher/be:pres v:build|ing/det:a n:tower/adv:softly/prep:in det:the n:garden",
"2^あなたは毎朝教室で近くで隠れる。^pr:you/v:hide|base/adv:nearby/prep:in det:the n:classroom/idm:every_morning",
"2^わたしは次はペンをあげる。^pr:i/v:give|base/det:a n:pen/idm:next_time",
"2^お父さんは毎日お金を得意げに送った。^pr:i n:dad/v:send|past/n:money/adv:proudly/idm:every_day",
"3^かれらは7時に動物園で車を直す。^pr:they/v:fix|base/det:the n:car/prep:at det:the n:zoo/idm:at_seven",
"2^ミカはカフェで泳ぐ。^n:Mika/v:swim|base/prep:at det:the n:cafe",
"2^お父さんはメールをひそかに確認する。^pr:i n:dad/v:check|base/det:a n:email/adv:secretly",
"2^わたしたちはカフェで仕事をやる。^pr:we/v:do|base/det:a n:job/prep:at det:the n:cafe",
"2^友だちは昨夜依頼に応じた。^pr:i n:friend|pl/v:answer|past/det:a n:request/idm:last_night",
"2^友だちは空港で走った。^pr:i n:friend|pl/v:run|past/prep:at det:the n:airport",
"2^男の子は昨日自転車を借りた。^det:the n:boy/v:borrow|past/det:a n:bicycle/adv:yesterday",
"2^お父さんは今朝会社でほほえんだ。^pr:i n:dad/v:smile|past/prep:at det:the n:office/idm:this_morning",
"2^お父さんは図書館で休んだ。^pr:i n:dad/v:rest|past/prep:in det:the n:library",
"1^ケンはここで朝ごはんを作る。^n:Ken/v:make|base/n:breakfast/adv:here",
"1^ケンはすばやく踊った。^n:Ken/v:dance|past/adv:quickly",
"1^犬はもうすぐ休む。^det:the n:dog/v:rest|base/adv:soon",
"2^わたしたちはここで質問をするつもりだ。^pr:we/modal:will v:ask|base/det:a n:question/adv:here",
"2^お母さんはカードをなくすだろう。^pr:i n:mom/modal:will v:lose|base/det:a n:card",
"2^お母さんは昨日エレベーターに乗れた。^pr:i n:mom/modal:could v:ride|base/det:a n:elevator/adv:yesterday",
"1^ケンは隠れる。^n:Ken/v:hide|base",
"1^ケンはくらやみで歩く。^n:Ken/v:walk|base/idm:in_the_dark",
"1^わたしたちはかんたんに旅行する。^pr:we/v:travel|base/adv:easily",
"3^ケンはもうすぐ公園でプリンターを直すだろう。^n:Ken/modal:will v:fix|base/det:a n:printer/prep:in det:the n:park/adv:soon",
"2^かれは体育館でのんびりした。^pr:he/v:relax|past/prep:in det:the n:gym",
"1^わたしは今働く。^pr:i/v:work|base/adv:now",
"3^かれらは毎日病院で講演者を招待した。^pr:they/v:invite|past/det:a n:speaker/prep:at det:the n:hospital/idm:every_day",
"2^お母さんはあそこで近くで走った。^pr:i n:mom/v:run|past/adv:nearby/adv:there",
"2^お父さんは会社で急ぐ。^pr:i n:dad/v:hurry|base/prep:at det:the n:office",
"2^かれらは図書館で家具を売る。^pr:they/v:sell|base/n:furniture/prep:in det:the n:library",
"2^かれは今夜質問に答える予定だ。^pr:he/be:pres v:answer|ing/det:a n:question/adv:tonight",
"2^かれらは今朝病院で叫んだ。^pr:they/v:shout|past/prep:at det:the n:hospital/idm:this_morning",
"2^お父さんは毎朝家でメッセージを送る。^pr:i n:dad/v:send|base/det:a n:message/idm:at_home/idm:every_morning",
"3^わたしは朝に空港へついに来た。^pr:i/v:come|past/adv:finally/prep:to det:the n:airport/prep:in det:the n:morning",
"2^犬は次は泳ぐ予定だ。^det:the n:dog/be:pres v:swim|ing/idm:next_time",
"3^お父さんは教室で答えを確認する。^pr:i n:dad/v:check|base/det:a n:answer/prep:in det:the n:classroom",
"3^犬はもうすぐバス停で試合を下手に見る。^det:the n:dog/v:watch|base/det:a n:match/adv:badly/prep:at det:the n:bus_stop/adv:soon",
"2^かのじょは空港でジャンプする。^pr:she/v:jump|base/prep:at det:the n:airport",
"3^かれらは次は図書館で箱をていねいに閉める予定だ。^pr:they/be:pres v:close|ing/det:the n:box/adv:carefully/prep:in det:the n:library/idm:next_time",
"3^あなたは空港で花を買っている。^pr:you/be:pres v:buy|ing/det:a n:flower/prep:at det:the n:airport",
"2^わたしは今夜教室で笑うつもりだ。^pr:i/modal:will v:laugh|base/prep:in det:the n:classroom/adv:tonight",
"2^お母さんは明日方法を見つけるだろう。^pr:i n:mom/be:pres v:find|ing/det:a n:way/adv:tomorrow",
"3^あなたは駅で講演者を近くで招待している。^pr:you/be:pres v:invite|ing/det:a n:speaker/adv:nearby/prep:at det:the n:station",
"2^男の子はバス停で休む。^det:the n:boy/v:rest|base/prep:at det:the n:bus_stop",
"2^女の子は夜にメールに返信する。^det:the n:girl/v:answer|base/det:a n:email/prep:at n:night",
"3^友だちは駅でボートに乗っている。^pr:i n:friend|pl/be:pres v:ride|ing/det:a n:boat/prep:at det:the n:station",
"3^あなたは病院で番組をくらやみで見ている。^pr:you/be:pres v:watch|ing/det:a n:show/idm:in_the_dark/prep:at det:the n:hospital",
"2^かれらは今レストランへ来る。^pr:they/v:come|base/prep:to det:the n:restaurant/adv:now",
"3^男の子は次は空港へ来るだろう。^det:the n:boy/modal:will v:come|base/prep:to det:the n:airport/idm:next_time",
"2^ミカは今夜レストランで叫ぶ予定だ。^n:Mika/be:pres v:shout|ing/prep:at det:the n:restaurant/adv:tonight",
"1^お母さんは昨夜ジャンプした。^pr:i n:mom/v:jump|past/idm:last_night",
"2^かのじょは毎日かごを運ぶ。^pr:she/v:carry|base/det:a n:basket/idm:every_day",
"3^あなたは今日駅で電池を完ぺきに確認する。^pr:you/v:check|base/det:a n:battery/adv:perfectly/prep:at det:the n:station/adv:today",
"2^あなたはバス停で勝てた。^pr:you/modal:could v:win|base/prep:at det:the n:bus_stop",
"3^犬は明日学校で箱を運ぶ予定だ。^det:the n:dog/be:pres v:carry|ing/det:the n:box/idm:at_school/adv:tomorrow",
"2^わたしは今夜教室で踊る予定だ。^pr:i/be:pres v:dance|ing/prep:in det:the n:classroom/adv:tonight",
"3^女の子は昨夜台所でお金を送った。^det:the n:girl/v:send|past/n:money/prep:in det:the n:kitchen/idm:last_night",
"1^お母さんは7時に踊る。^pr:i n:mom/v:dance|base/idm:at_seven",
"3^わたしは7時にバス停でメッセージに返信する。^pr:i/v:answer|base/det:a n:message/prep:at det:the n:bus_stop/idm:at_seven",
"1^友だちは着いた。^pr:i n:friend|pl/v:arrive|past",
"2^犬は今日の午後泳いでいる。^det:the n:dog/be:pres v:swim|ing/idm:this_afternoon",
"2^あなたは今夜行く予定だ。^pr:you/be:pres v:go|ing/adv:tonight",
"3^ケンは夜にカフェで靴をはく。^n:Ken/v:wear|base/n:shoe|pl/prep:at det:the n:cafe/prep:at n:night",
"3^かのじょは動物園で稲を植えるだろう。^pr:she/modal:will v:plant|base/det:a n:rice_plant/prep:at det:the n:zoo",
"2^かれは教室でわたしのスマホを見つける。^pr:he/v:find|base/pr:i n:phone/prep:in det:the n:classroom",
"1^わたしたちは毎朝泣く。^pr:we/v:cry|base/idm:every_morning",
"1^かのじょは学校で歩く。^pr:she/v:walk|base/idm:at_school",
"1^女の子は7時に寝る。^det:the n:girl/v:sleep|base/idm:at_seven",
"1^かれは前回はもう一度旅行した。^pr:he/v:travel|past/adv:again/idm:last_time",
"1^かのじょは突然急ぐ。^pr:she/v:hurry|base/adv:suddenly",
"2^犬は森で歩いた。^det:the n:dog/v:walk|past/prep:in det:the n:forest",
"2^お父さんは今公園へ行く。^pr:i n:dad/v:go|base/prep:to det:the n:park/adv:now",
"1^友だちは一日じゅう泳いだ。^pr:i n:friend|pl/v:swim|past/idm:all_day",
"2^女の子は体育館でふだんのんびりする。^det:the n:girl/adv:usually v:relax|base/prep:in det:the n:gym",
"3^かれらはスーパーで車に以前はついていっていた。^pr:they/sm:used_to v:follow|base/det:the n:car/prep:at det:the n:supermarket",
"2^かのじょは明日講演者を招待する予定だ。^pr:she/be:pres v:invite|ing/det:a n:speaker/adv:tomorrow",
"3^あなたはカフェで魚にひそかにえさをあげるだろう。^pr:you/modal:will v:feed|base/n:fish/adv:secretly/prep:at det:the n:cafe",
"3^かのじょは前回は駅で車を持っていた。^pr:she/v:have|past/det:the n:car/prep:at det:the n:station/idm:last_time",
"2^ミカは図書館に着くところだ。^n:Mika/be:pres v:arrive|ing/prep:in det:the n:library",
"2^かれは今夜台所へ来る予定だ。^pr:he/be:pres v:come|ing/prep:to det:the n:kitchen/adv:tonight",
"1^先生は毎日隠れる。^det:the n:teacher/v:hide|base/idm:every_day",
"2^ケンはさっきメールを確認した。^n:Ken/v:check|past/det:a n:email/idm:just_now",
"2^かのじょは森に着く。^pr:she/v:arrive|base/prep:in det:the n:forest",
"1^わたしたちはノートパソコンを閉じた。^pr:we/v:close|past/det:a n:laptop",
"2^ケンは朝にここでまったりする。^n:Ken/v:chill|base/adv:here/prep:in det:the n:morning",
"3^ねこは会社でコンサートを見るだろう。^det:the n:cat/modal:will v:watch|base/det:a n:concert/prep:at det:the n:office",
"2^あなたは公園で近くで歩くだろう。^pr:you/modal:will v:walk|base/idm:close_by/prep:in det:the n:park",
"2^かれは動物園で急ぐ。^pr:he/v:hurry|base/prep:at det:the n:zoo",
"2^ねこは番組を近くで見る。^det:the n:cat/v:watch|base/det:a n:show/idm:close_by",
"1^犬は昨日ジャンプした。^det:the n:dog/v:jump|past/adv:yesterday",
"2^あなたは今わたしの部屋で寝る。^pr:you/v:sleep|base/prep:in pr:i n:room/adv:now",
"2^ねこは会社でジャンプしている。^det:the n:cat/be:pres v:jump|ing/prep:at det:the n:office",
"2^わたしたちは台所で水をやさしく持ってくる。^pr:we/v:bring|base/n:water/adv:softly/prep:in det:the n:kitchen",
"2^わたしたちは来週休む予定だ。^pr:we/be:pres v:rest|ing/idm:next_week",
"3^男の子は7時に体育館で手ぶくろをはめた。^det:the n:boy/v:wear|past/det:a n:glove/prep:in det:the n:gym/idm:at_seven",
"2^ねこは教室で急ぐ。^det:the n:cat/v:hurry|base/prep:in det:the n:classroom",
"2^かれらは空港でジャンプする。^pr:they/v:jump|base/prep:at det:the n:airport",
"2^ミカは川のそばでかばんを買った。^n:Mika/v:buy|past/det:a n:bag/prep:by det:the n:river",
"2^お父さんは明日かごを運ぶだろう。^pr:i n:dad/modal:will v:carry|base/det:a n:basket/adv:tomorrow",
"3^男の子は明日公園で勝つだろう。^det:the n:boy/be:pres v:win|ing/prep:in det:the n:park/adv:tomorrow",
"2^友だちは毎朝東京で急ぐ。^pr:i n:friend|pl/v:hurry|base/prep:in n:Tokyo/idm:every_morning",
"2^ミカはレストランで贈り物を送る。^n:Mika/v:send|base/det:a n:gift/prep:at det:the n:restaurant",
"3^ねこは空港で森林を守るだろう。^det:the n:cat/modal:will v:protect|base/det:a n:forest/prep:at det:the n:airport",
"2^かのじょは前回はびんを安全に持って来た。^pr:she/v:bring|past/det:a n:bottle/adv:safely/idm:last_time",
"2^ねこは泳ぐだろう。^det:the n:cat/modal:will v:swim|base",
"2^ミカは昨日動物園でまったりした。^n:Mika/v:chill|past/prep:at det:the n:zoo/adv:yesterday",
"2^ねこはスーパーで隠れる。^det:the n:cat/v:hide|base/prep:at det:the n:supermarket",
"1^お父さんは今歩く。^pr:i n:dad/v:walk|base/adv:now",
"3^かれは今朝図書館で質問をした。^pr:he/v:ask|past/det:a n:question/prep:in det:the n:library/idm:this_morning",
"2^お父さんはレストランでもう一度ほほえんだ。^pr:i n:dad/v:smile|past/adv:again/prep:at det:the n:restaurant",
"2^男の子は会社へ行く。^det:the n:boy/v:go|base/prep:to det:the n:office",
"2^男の子はさっき体育館で休んだ。^det:the n:boy/v:rest|past/prep:in det:the n:gym/idm:just_now",
"3^わたしは今日の午後教室でタオルを持って来ている。^pr:i/be:pres v:bring|ing/det:a n:towel/prep:in det:the n:classroom/idm:this_afternoon",
"2^わたしは草をていねいに植えている。^pr:i/be:pres v:plant|ing/n:grass/adv:politely",
"2^お母さんはせっけんを使うだろう。^pr:i n:mom/modal:will v:use|base/n:soap",
"3^かれは毎朝公園で贈り物をあげる。^pr:he/v:give|base/det:a n:gift/prep:in det:the n:park/idm:every_morning",
"2^かのじょは学校で森林を守る。^pr:she/v:protect|base/det:a n:forest/idm:at_school",
"2^かれらは来週旅行する予定だ。^pr:they/be:pres v:travel|ing/idm:next_week",
"2^ケンはスーパーで買い物する。^n:Ken/v:shop|base/prep:at det:the n:supermarket",
"2^わたしは川のそばで急ぐ。^pr:i/v:hurry|base/prep:by det:the n:river",
"2^先生はここで安全に笑うだろう。^det:the n:teacher/modal:will v:laugh|base/adv:safely/adv:here",
"3^かれらはもうすぐ体育館でおもちゃをなくす。^pr:they/v:lose|base/det:a n:toy/prep:in det:the n:gym/adv:soon",
"1^かのじょは家で勝った。^pr:she/v:win|past/idm:at_home",
"2^かれらはバス停で質問をする。^pr:they/v:ask|base/det:a n:question/prep:at det:the n:bus_stop",
"1^わたしたちは2時間旅行した。^pr:we/v:travel|past/idm:for_two_hours",
"2^あなたは今朝図書館で笑った。^pr:you/v:laugh|past/prep:in det:the n:library/idm:this_morning",
"1^ミカは靴をはいた。^n:Mika/v:wear|past/n:shoe|pl",
"2^ミカは今庭でくらやみで歩く。^n:Mika/v:walk|base/idm:in_the_dark/prep:in det:the n:garden/adv:now",
"2^かれらは毎朝パレードを見る。^pr:they/v:watch|base/det:a n:parade/idm:every_morning",
"2^ねこは森で泣いている。^det:the n:cat/be:pres v:cry|ing/prep:in det:the n:forest",
"3^わたしたちはもうすぐ病院で家具を間に合うように売る。^pr:we/v:sell|base/n:furniture/idm:in_time/prep:at det:the n:hospital/adv:soon",
"1^あなたは2日前ほほえんだ。^pr:you/v:smile|past/idm:two_days_ago",
"3^女の子は会社で質問をする。^det:the n:girl/v:ask|base/det:a n:question/prep:at det:the n:office",
"2^男の子は宿題を近くで確認した。^det:the n:boy/v:check|past/n:homework/adv:nearby",
"3^男の子は2時間体育館でジャケットを借りた。^det:the n:boy/v:borrow|past/det:a n:jacket/prep:in det:the n:gym/idm:for_two_hours",
"1^ケンは昨日まったりした。^n:Ken/v:chill|past/adv:yesterday",
"2^犬は7時にまちがいをかんたんに見つけた。^det:the n:dog/v:find|past/det:a n:mistake/adv:easily/idm:at_seven",
"3^女の子は台所でペンをなくした。^det:the n:girl/v:lose|past/det:a n:pen/prep:in det:the n:kitchen",
"2^友だちは7時にまったりするだろう。^pr:i n:friend|pl/modal:will v:chill|base/idm:at_seven",
"2^男の子は次は朝ごはんを作るだろう。^det:the n:boy/modal:will v:make|base/n:breakfast/idm:next_time",
"3^わたしは自分の部屋でおもちゃをかんたんに買う。^pr:i/v:buy|base/det:a n:toy/adv:easily/prep:in pr:i n:room",
"2^お父さんは昨夜家具を買った。^pr:i n:dad/v:buy|past/n:furniture/idm:last_night",
"2^お母さんは図書館へ旅行する。^pr:i n:mom/v:travel|base/prep:to det:the n:library",
"3^犬は教室でわたしのスマホを見つける。^det:the n:dog/v:find|base/pr:i n:phone/prep:in det:the n:classroom",
"2^女の子はメモをくらやみで送るだろう。^det:the n:girl/modal:will v:send|base/det:a n:note/idm:in_the_dark",
"1^友だちはもうすぐほほえむ。^pr:i n:friend|pl/v:smile|base/adv:soon",
"2^お母さんは道をやさしく作るだろう。^pr:i n:mom/modal:will v:build|base/det:the n:road/adv:softly",
"2^お母さんは東京で走っている。^pr:i n:mom/be:pres v:run|ing/prep:in n:Tokyo",
"2^男の子は昨日いつも道を作った。^det:the n:boy/adv:always v:build|past/det:the n:road/adv:yesterday",
"2^ミカは図書館で突然笑う。^n:Mika/v:laugh|base/adv:suddenly/prep:in det:the n:library",
"2^わたしたちはもうすぐ質問をする。^pr:we/v:ask|base/det:a n:question/adv:soon",
"2^わたしは毎日会社へ行った。^pr:i/v:go|past/prep:to det:the n:office/idm:every_day",
"1^ミカはコーヒーをすばやく買った。^n:Mika/v:buy|past/n:coffee/adv:quickly",
"2^お父さんはメッセージに近くで返信する。^pr:i n:dad/v:answer|base/det:a n:message/idm:close_by",
"2^ケンは台所でひそかにジャンプするだろう。^n:Ken/modal:will v:jump|base/adv:secretly/prep:in det:the n:kitchen",
"2^あなたは明日旅行する予定だ。^pr:you/be:pres v:travel|ing/adv:tomorrow",
"1^先生は走る。^det:the n:teacher/v:run|base",
"3^犬は今夜学校で切符を間に合うようになくすだろう。^det:the n:dog/be:pres v:lose|ing/det:a n:ticket/idm:in_time/idm:at_school/adv:tonight",
"2^先生は教室でのんびりするだろう。^det:the n:teacher/modal:will v:relax|base/prep:in det:the n:classroom",
"1^犬はゆっくり泳ぐ。^det:the n:dog/v:swim|base/adv:slowly",
"3^お父さんは教室で車を使った。^pr:i n:dad/v:use|past/det:the n:car/prep:in det:the n:classroom",
"1^わたしたちは先週働いた。^pr:we/v:work|past/idm:last_week",
"2^お父さんは公演をひそかに見る。^pr:i n:dad/v:watch|base/det:a n:performance/adv:secretly",
"2^女の子は次は木を植える。^det:the n:girl/v:plant|base/det:a n:tree/idm:next_time",
"2^わたしは昨日台所で泳いだ。^pr:i/v:swim|past/prep:in det:the n:kitchen/adv:yesterday",
"2^かれは昨夜空港で勝った。^pr:he/v:win|past/prep:at det:the n:airport/idm:last_night",
"3^お父さんは毎日駅で質問をする。^pr:i n:dad/v:ask|base/det:a n:question/prep:at det:the n:station/idm:every_day",
"2^お母さんは今日バスについていった。^pr:i n:mom/v:follow|past/det:the n:bus/adv:today",
"2^友だちは病院で家具を売る。^pr:i n:friend|pl/v:sell|base/n:furniture/prep:at det:the n:hospital",
"3^先生は7時に動物園でふだん質問を近くでする。^det:the n:teacher/adv:usually v:ask|base/det:a n:question/idm:close_by/prep:at det:the n:zoo/idm:at_seven",
"2^先生は毎朝東京で踊る。^det:the n:teacher/v:dance|base/prep:in n:Tokyo/idm:every_morning",
"2^ケンは前回は家でかばんをていねいに運んだ。^n:Ken/v:carry|past/det:a n:bag/adv:carefully/idm:at_home/idm:last_time",
"3^男の子は明日会社で歩く予定だ。^det:the n:boy/be:pres v:walk|ing/prep:at det:the n:office/adv:tomorrow",
"3^ねこは海辺でかんたんに泣くだろう。^det:the n:cat/modal:will v:cry|base/adv:easily/prep:on det:the n:beach",
"2^お母さんは2時間あそこでコンサートを見た。^pr:i n:mom/v:watch|past/det:a n:concert/adv:there/idm:for_two_hours",
"2^お母さんは学校でのんびりしている。^pr:i n:mom/be:pres v:relax|ing/idm:at_school",
"2^わたしたちは庭で買い物するつもりだ。^pr:we/modal:will v:shop|base/prep:in det:the n:garden",
"2^かれらは花をついに買う。^pr:they/v:buy|base/det:a n:flower/adv:finally",
"1^お父さんは7時に寝る。^pr:i n:dad/v:sleep|base/idm:at_seven",
"3^かのじょは動物園で自転車を持っているだろう。^pr:she/modal:will v:have|base/det:a n:bicycle/prep:at det:the n:zoo",
"2^かのじょは毎朝道具を運んだ。^pr:she/v:carry|past/det:a n:tool/idm:every_morning",
"2^お母さんは2日前買い物できた。^pr:i n:mom/modal:could v:shop|base/idm:two_days_ago",
"2^あなたは体育館で勝った。^pr:you/v:win|past/prep:in det:the n:gym",
"2^女の子は公園で走った。^det:the n:girl/v:run|past/prep:in det:the n:park",
"2^ねこは体育館でのんびりするだろう。^det:the n:cat/modal:will v:relax|base/prep:in det:the n:gym",
"1^わたしたちは泣く。^pr:we/v:cry|base",
"2^わたしは森でバスについていった。^pr:i/v:follow|past/det:the n:bus/prep:in det:the n:forest",
"2^かのじょは2時間絵を見た。^pr:she/v:see|past/det:a n:picture/idm:for_two_hours",
"3^かれらは朝に天気を親切に確認するだろう。^pr:they/modal:will v:check|base/det:the n:weather/adv:kindly/prep:in det:the n:morning",
"2^わたしたちは明日ジャンプするつもりだ。^pr:we/modal:will v:jump|base/adv:tomorrow",
"2^友だちは先週情報を得意げに提供した。^pr:i n:friend|pl/v:give|past/n:information/adv:proudly/idm:last_week",
"2^男の子は海辺で泣いた。^det:the n:boy/v:cry|past/prep:on det:the n:beach",
"3^ねこは教室でかばんを運ぶ。^det:the n:cat/v:carry|base/det:a n:bag/prep:in det:the n:classroom"];

/* ===== FILE: seeds.js ===== */
/* ===== seeds.js:タネ文(内部で想定する理想の文)を作り、単語に分解する =====
 盤面の6〜7割はタネ文の部品から出す。プレイヤーには見せない。判定は「型」だけなので、タネ文どおりでなくても通る。
 タネ文どおりに完成させると PERFECT! */
var Seeds = (function () {
  'use strict';
  function create(dict, o) {
    var rnd = o.rnd || Math.random, cfg = o.cfg, lv = o.level || 0, maxLv = o.maxLevel || 2;
    var pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
    var idx = {}; ['noun', 'verb', 'adj', 'adv', 'idiom'].forEach(function (p) { idx[p] = {}; dict.all(p).forEach(function (e) { idx[p][e.w] = e; }); });
    var nouns = dict.all('noun').filter(function (e) { return (e.lv || 1) <= maxLv; });
    var verbs = dict.all('verb').filter(function (e) { return (e.lv || 1) <= maxLv && !e.tail && e.fr !== 'cl'; });
    var adjs = dict.all('adj').filter(function (e) { return (e.lv || 1) <= maxLv; });
    var advs = dict.all('adv'), idioms = dict.all('idiom');
    function resolve(sp) {
      var k = sp.split(':')[0], rest = sp.slice(sp.indexOf(':') + 1), parts = rest.split('|'), w = parts[0], x = parts[1];
      switch (k) {
        case 'n': return idx.noun[w] && { k: 'n', e: idx.noun[w], pl: x === 'pl' };
        case 'v': return idx.verb[w] && { k: 'v', e: idx.verb[w], f: x || 'base' };
        case 'adj': return idx.adj[w] && { k: 'adj', e: idx.adj[w] };
        case 'adv': return idx.adv[w] && { k: 'adv', e: idx.adv[w] };
        case 'idm': return idx.idiom[w] && { k: 'idm', e: idx.idiom[w] };
        case 'q': return { k: 'q', v: w, e: idx.idiom[w] };
        case 'sm': return { k: 'sm', v: w, t: x || 'pres' };
        case 'be': return { k: 'be', v: w };
        case 'not': return { k: 'not' };
        default: return { k: k, v: w };
      }
    }
    // ---------- 部品 ----------
    var M = !cfg.auto.art;
    function npFor(e, role) {
      var ws = [], c = e.c;
      if (lv >= 1 && rnd() < .3 && (c === 'c' || c === 'u' || c === 'p')) { var a = pick(adjs); if (a) ws.push({ k: 'adj', e: a }); }
      var pl = false;
      if ((c === 'c') && rnd() < .2 && role !== 'subj1') { pl = true; }
      var lead = null;
      if (c === 'c' || c === 't') {
        if (pl) lead = rnd() < .5 ? { k: 'q', v: pick(['two', 'three', 'many', 'some']) } : (M ? { k: 'det', v: 'the' } : null);
        else if (e.ad === 'my') lead = { k: 'pr', v: pick(['i', 'you', 'he', 'she', 'we']) };
        else if (M || rnd() < .3) lead = { k: 'det', v: e.ad === 'the' || c === 't' ? 'the' : rnd() < .5 ? 'a' : 'the' };
      } else if (c === 'u' && rnd() < .25) {
        var q = (e.tg || []).indexOf('drink') >= 0 ? pick(['a cup of', 'a glass of']) : 'a lot of'; lead = { k: 'q', v: q, e: idx.idiom[q] };
      } else if (c === 'p' && M && rnd() < .5) lead = { k: 'det', v: 'the' };
      var n = { k: 'n', e: e, pl: pl };
      return (lead ? [lead] : []).concat(ws, [n]);
    }
    function subject() {
      if (rnd() < .42) return [{ k: 'pr', v: pick(['i', 'you', 'he', 'she', 'we', 'they', 'he', 'she']) }];
      var e = pick(nouns.filter(function (n) { return n.cat === 'person' || n.cat === 'animal'; })); return npFor(e, 'subj');
    }
    function objectFor(v) {
      if (rnd() < .15) return [{ k: 'pr', v: pick(['i', 'you', 'he', 'she', 'it', 'they']) }];
      var ot = (v.ot || []).filter(function (t) { return t !== 'any'; }), cand = [];
      if (ot.length) cand = nouns.filter(function (n) { return ot.indexOf(n.cat) >= 0 || (n.tg || []).some(function (t) { return ot.indexOf(t) >= 0; }); });
      if (!cand.length) cand = nouns.filter(function (n) { return n.cat !== 'time' && n.cat !== 'place'; });
      return npFor(pick(cand), 'obj');
    }
    function tsKey(tense) { return tense === 'fut' ? 'fut' : tense === 'past' ? 'past' : 'pres'; }
    function timeFor(tense) {
      var key = tsKey(tense), r = rnd();
      var ok = function (e) { return (e.ts || []).indexOf(key) >= 0; };
      if (r < .45) { var a = advs.filter(function (e) { return e.k === 'time' && ok(e); }); if (a.length) return [[{ k: 'adv', e: pick(a) }]]; }
      if (r < .75) { var i = idioms.filter(function (e) { return e.k === 'time' && ok(e) && (e.lv || 1) <= Math.max(2, maxLv); }); if (i.length) return [[{ k: 'idm', e: pick(i) }]]; }
      var tn = nouns.filter(function (e) { return e.cat === 'time' && ok(e) && e.prep; });
      if (!tn.length) return null;
      var n = pick(tn), ws = [{ k: 'prep', v: n.prep }]; if (n.c === 't') ws.push({ k: 'det', v: 'the' }); ws.push({ k: 'n', e: n });
      return [ws];
    }
    function placeFor() {
      var r = rnd();
      if (r < .2) { var a = advs.filter(function (e) { return e.k === 'place'; }); return [[{ k: 'adv', e: pick(a) }]]; }
      if (r < .32) { var i = idioms.filter(function (e) { return e.k === 'place'; }); if (i.length) return [[{ k: 'idm', e: pick(i) }]]; }
      var n = pick(nouns.filter(function (e) { return e.cat === 'place' && e.prep; })), ws = [{ k: 'prep', v: n.prep }];
      if (n.c === 'c' || n.c === 't' || (n.c === 'p' && n.ad === 'the')) ws.push(n.ad === 'my' ? { k: 'pr', v: pick(['i', 'he', 'she']) } : { k: 'det', v: 'the' });
      ws.push({ k: 'n', e: n }); return [ws];
    }
    // 動詞句。tense: 'pres' | 'past' | 'fut'。timeWord があれば時制はその語に任せる
    function verbPhrase(v, tense, hasTime) {
      var ws = [], r = rnd(), tp = null;
      if (r < (lv ? .14 : .1)) ws.push({ k: 'modal', v: tense === 'past' ? pick(['could', 'would']) : tense === 'fut' ? 'will' : pick(['can', 'must', 'should', 'may']) });
      else if (r < (lv ? .34 : .26)) {
        var sm = tense === 'past' ? pick(['want to', 'have to', 'used to', 'need to']) : tense === 'fut' ? 'be going to' : pick(['want to', 'have to', 'need to', 'would like to']);
        ws.push({ k: 'sm', v: sm, t: tense === 'past' && sm !== 'used to' ? 'past' : 'pres' });
      } else if (lv >= 1 && !hasTime && tense !== 'pres' && rnd() < .7) tp = tense === 'past' ? 'past' : 'fut';
      else if (lv >= 1 && tense === 'pres' && rnd() < .12) tp = 'prog';
      if (lv >= 1 && rnd() < .1) ws.splice(ws.length ? 1 : 0, 0, { k: 'not' });
      if (lv >= 1 && !ws.some(function (w) { return w.k === 'not'; }) && tense === 'pres' && !tp && rnd() < .12) ws.push({ k: 'adv', e: idx.adv[pick(['always', 'usually', 'often', 'sometimes'])] });
      var f = 'base';
      if (!cfg.auto.verb && !tp && !ws.some(function (w) { return w.k === 'modal' || w.k === 'sm'; })) f = tense === 'past' ? 'past' : 'base';
      ws.push({ k: 'v', e: v, f: f });
      if (tp) ws.push({ k: 'tp', v: tp });
      if (lv >= 1 && rnd() < .15) { var m = advs.filter(function (e) { return e.k === 'manner'; }); ws.push({ k: 'adv', e: pick(m) }); }
      return ws;
    }
    function clause(tense, opt) {
      opt = opt || {};
      var chunks = [subject()], v = pick(opt.intr ? verbs.filter(function (x) { return x.fr !== 'tr'; }) : verbs);
      var time = null; if ((tense !== 'pres' && rnd() < .55) || rnd() < .25) time = timeFor(tense);
      chunks.push(verbPhrase(v, tense, !!time));
      if (v.link && rnd() < .7) chunks.push([{ k: 'adj', e: pick(adjs) }]);
      else if (v.cv && rnd() < .55) {
        var v2 = pick(verbs.filter(function (x) { return !x.cv && !x.link; }));
        chunks.push(v.cv === 'ing' ? [{ k: 'v', e: v2 }, { k: 'ti', v: 'ing' }] : [{ k: 'ti', v: 'to' }, { k: 'v', e: v2 }]);
        if (v2.fr === 'tr') chunks.push(objectFor(v2));
      } else if (v.fr === 'tr' || (v.fr === 'both' && rnd() < .55)) {
        chunks.push(objectFor(v));
        if (v.dt && lv >= 3 && rnd() < .3) chunks.splice(chunks.length - 1, 0, [{ k: 'pr', v: pick(['i', 'you', 'him', 'her'].map(function (p) { return p === 'him' ? 'he' : p === 'her' ? 'she' : p; })) }]);
      }
      if (!opt.short && rnd() < (lv ? .5 : .35)) chunks = chunks.concat(placeFor());
      if (time) { if (lv >= 2 && rnd() < .2) chunks = time.concat(chunks); else chunks = chunks.concat(time); }
      return chunks;
    }
    function template() {
      var r = rnd(), tense = lv === 0 ? (r < .65 ? 'pres' : 'past') : (r < .5 ? 'pres' : r < .82 ? 'past' : 'fut');
      var chunks = [];
      if (lv >= 2 && rnd() < .22) {
        var f = idioms.filter(function (e) { return e.k === 'front' && (e.lv || 1) <= maxLv; }); if (f.length) chunks.push([{ k: 'idm', e: pick(f) }]);
      } else if (lv >= 2 && rnd() < .15) {
        chunks.push([{ k: 'conj', v: pick(['when', 'if', 'because', 'before', 'after']) }]); chunks = chunks.concat(clause(tense === 'fut' ? 'pres' : tense, { short: 1, intr: 1 }));
      }
      chunks = chunks.concat(clause(tense));
      if (lv >= 2 && rnd() < .1 && !chunks.some(function (c) { return c[0].k === 'conj'; })) { chunks.push([{ k: 'conj', v: pick(['and', 'but', 'so']) }]); chunks = chunks.concat(clause(tense, { short: 1, intr: 1 })); }
      return chunks;
    }
    // 英語脳の文生成エンジンで作った文(tools/mkseeds_en.js)。「レベル^日本語^単位/単位」
    var DATA = null;
    function data() {
      if (DATA) return DATA;
      DATA = (typeof SEED_DATA === 'undefined' ? [] : SEED_DATA).map(function (s) { var a = s.split('^'); return { lv: +a[0], ja: a[1], c: a[2].split('/').map(function (u) { return u.split(' ').map(function (w) { return w.replace(/_/g, ' '); }); }) }; })
        .filter(function (x) { return x.lv <= lv + 1; });
      return DATA;
    }
    var lastJa = '';
    function fromData() {
      var D = data(); if (!D.length) return null;
      var s = pick(D); lastJa = s.ja;
      var ch = s.c.map(function (c) { return c.map(resolve); });
      return ch.some(function (c) { return c.some(function (w) { return !w; }); }) ? null : ch;
    }
    function validate(chunks) {
      var T = [];
      for (var i = 0; i < chunks.length; i++) { var st = G.chainState(chunks[i], cfg); if (!st.complete || st.err) return null; T.push(st.chunk); }
      var r = G.parse(T, cfg); return r.ok && r.kind === 'S' ? r.text : null;
    }
    function next() {
      for (var t = 0; t < 40; t++) {
        lastJa = '';
        var ch = fromData(); ch = ch || (data().length ? null : template()); if (!ch) continue;
        var text = validate(ch);
        if (text && text.split(' ').length <= 12) return { chunks: ch, text: text, ja: lastJa, words: [].concat.apply([], ch) };
      }
      return null;
    }
    return { next: next, resolve: resolve };
  }
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  return { create: create, norm: norm };
})();

/* ===== FILE: supply.js ===== */
/* ===== supply.js:単語の供給と、文が作れるかの探索 ===== */
var Supply = (function () {
  'use strict';
  // 盤面24個あたりの目標数(仕様書 9章)。設定で差し替え可能。
  var RATIO = { noun: 5, verb: 3, adj: 3, adv: 2, det: 3, prep: 3, pron: 1, aux: 1, conj: 1, part: 2 };
  var MIN = { det: 2, prep: 2 };
  function catOf(w) {
    switch (w.k) {
      case 'n': return 'noun'; case 'v': return 'verb'; case 'adj': return 'adj'; case 'adv': return 'adv';
      case 'det': case 'q': return 'det'; case 'prep': return 'prep'; case 'pr': return 'pron';
      case 'be': case 'modal': case 'not': case 'sm': return 'aux'; case 'conj': return 'conj'; case 'ti': case 'er': case 'tp': return 'part';
      case 'deg': return 'adv'; case 'idm': return 'idiom';
    }
    return 'other';
  }
  function create(dict, o) {
    o = o || {};
    var rnd = o.rnd || Math.random, ratio = o.ratio || RATIO, maxLv = o.maxLevel || 2;
    function onBoard(items) { var s = new Set(); items.forEach(function (it) { (it.words || [it.word]).forEach(function (w) { if (w && w.e) s.add(w.e.w); }); }); return s; }
    function pickWord(cat, items) {
      var ex = onBoard(items), r = rnd(), e;
      var get = function (pos, tag, lvl) { return dict.getWords({ pos: pos, tag: tag, maxLevel: lvl || maxLv, count: 1, rnd: rnd, exclude: ex })[0]; };
      switch (cat) {
        case 'noun':
          if (r < .22) e = get('noun', { cat: 'place' }); else if (r < .32) e = get('noun', { cat: 'time' }); else if (r < .55) e = get('noun', { cat: 'person' }) || get('noun', { cat: 'animal' });
          e = e || get('noun', { notCat: ['time', 'place'] }); return e && { k: 'n', e: e };
        case 'verb':
          if (r < .18 && maxLv >= 2) e = get('verb', { cv: 1, simple: 1 }); else if (r < .3 && maxLv >= 2) e = get('verb'); else if (r < .38) e = get('verb', { link: 1 });
          e = e || get('verb', { simple: 1 }); return e && { k: 'v', e: e };
        case 'adj': e = get('adj'); return e && { k: 'adj', e: e };
        case 'adv':
          if (r < .12) return { k: 'deg', v: pick(G.DEGS) };
          e = r < .5 ? get('adv', { k: 'manner' }) : r < .72 ? get('adv', { k: 'time' }) : r < .86 ? get('adv', { k: 'place' }) : get('adv', { k: 'freq' }, 4);
          e = e || get('adv'); return e && { k: 'adv', e: e };
        case 'det':
          if (r < .7) return { k: 'det', v: rnd() < .5 ? 'a' : 'the' };
          if (r < .85) return { k: 'q', v: pick(G.QUANTS) };
          e = get('idiom', { k: 'quant' }, 4); return e ? { k: 'q', v: e.w, e: e } : { k: 'det', v: 'the' };
        case 'prep': var g = r < .5 ? 0 : r < .7 ? 1 : r < .9 ? 2 : 3; return { k: 'prep', v: pick(G.PREP_G[g]) };
        case 'pron': return { k: 'pr', v: pick(['i', 'you', 'he', 'she', 'he', 'she', 'it']) };
        case 'aux': return r < .3 ? { k: 'be', v: 'pres' } : r < .6 ? { k: 'modal', v: pick(G.MODALS) } : r < .88 ? { k: 'sm', v: pick(G.SEMIS), t: 'pres' } : { k: 'not' };
        case 'conj': return r < .65 ? { k: 'conj', v: pick(G.CONJ_SUB) } : { k: 'conj', v: pick(G.CONJ_CO) };
        case 'part': return r < .42 ? { k: 'ti', v: null } : r < .75 || !(o.level >= 1) ? { k: 'er', v: 'er' } : { k: 'tp', v: pick(G.TP_CYCLE) };
        case 'idiom':
          var ik = o.seeds ? 'front' : r < .35 ? 'front' : r < .65 ? 'time' : r < .8 ? 'place' : r < .9 ? 'other' : 'quant';
          e = get('idiom', { k: ik }, Math.max(maxLv, 2));
          if (!e) return null; return ik === 'quant' ? { k: 'q', v: e.w, e: e, star: 1 } : { k: 'idm', e: e, star: 1 };
      }
      return null;
    }
    function pick(a) { return a[Math.floor(rnd() * a.length)]; }
    function counts(items) {
      var c = {}; for (var k in ratio) c[k] = 0;
      items.forEach(function (it) {
        if (it.word) { var k2 = catOf(it.word); if (c[k2] != null) c[k2]++; }
        else if (it.chunk) { var t = it.chunk.t; if (t === 'NP') c.noun += .8; else if (t === 'VP') c.verb += .8; else if (t === 'PP') c.prep += .5; else if (t === 'AP') c.adj += .6; }
      });
      return c;
    }
    function chooseCat(items, target) {
      var c = counts(items), scale = target / 24, loose = items.filter(function (i) { return i.word; }).length;
      if (loose >= 10) for (var m in MIN) if (c[m] < MIN[m]) return m;
      var tot = 0, ws = [];
      for (var k in ratio) { var d = ratio[k] * scale - c[k]; var w = Math.pow(Math.max(.12, d + .7), 2); ws.push([k, w]); tot += w; }
      var r = rnd() * tot; for (var i = 0; i < ws.length; i++) { r -= ws[i][1]; if (r <= 0) return ws[i][0]; }
      return 'noun';
    }
    // 文の骨組み(主語・目的語になれるもの2つ・動詞1つ)があるか。冠詞が手動なら、冠詞の数も数える
    var manualArt = o.cfg && o.cfg.auto && !o.cfg.auto.art;
    // ---------- 品詞の最低数と上限 ----------
    var KIND_OF = { n: 'noun', pr: 'pron', v: 'verb', modal: 'aux', sm: 'aux', be: 'be', not: 'not', det: 'det', q: 'det', prep: 'prep', adj: 'adj', adv: 'adv', deg: 'adv', ti: 'ti', er: 'part', tp: 'part', conj: 'conj', idm: 'idiom' };
    var MINS = { noun: 4, verb: 3, aux: 2, be: 1, det: 2, prep: 2, adj: 2, adv: 1, ti: 1, part: 1, pron: 1, conj: 1, not: (o.level >= 1 ? 1 : 0) };
    var CAPS = { det: 4, prep: 3, pron: 3, idiom: 2, conj: 2, not: 1, be: 2, aux: 3 };
    function kindCounts(items) {
      var c = {};
      items.forEach(function (it) { (it.word ? [it.word] : (it.chunk && it.chunk.words) || []).forEach(function (w) { var k = KIND_OF[w.k]; if (k) c[k] = (c[k] || 0) + 1; }); if (it.chunk && it.chunk.t === 'ID') c.idiom = (c.idiom || 0) + 1; });
      return c;
    }
    function deficit(items, target) {
      var c = kindCounts(items), sc = Math.max(.6, target / 22), best = null, bd = 0;
      for (var k in MINS) { var d = Math.round(MINS[k] * sc) - (c[k] || 0); if (d > bd) { bd = d; best = k; } }
      return best;
    }
    function overCap(items, w) { var k = w && KIND_OF[w.k]; if (!k || !CAPS[k]) return false; return (kindCounts(items)[k] || 0) >= CAPS[k]; }
    function pickKind(k, items) {
      switch (k) {
        case 'aux': return rnd() < .5 ? { k: 'modal', v: pick(G.MODALS) } : { k: 'sm', v: pick(G.SEMIS), t: 'pres' };
        case 'be': return { k: 'be', v: 'pres' };
        case 'not': return { k: 'not' };
        case 'ti': return { k: 'ti', v: null };
        case 'part': return o.level >= 1 && rnd() < .5 ? { k: 'tp', v: pick(G.TP_CYCLE) } : { k: 'er', v: 'er' };
        case 'conj': return { k: 'conj', v: rnd() < .6 ? pick(G.CONJ_SUB) : pick(G.CONJ_CO) };
        case 'pron': return { k: 'pr', v: pick(['i', 'you', 'he', 'she', 'we', 'they']) };
        case 'det': return { k: 'det', v: rnd() < .5 ? 'a' : 'the' };
        case 'prep': return { k: 'prep', v: pick(G.PREP_G[rnd() < .6 ? 0 : rnd() < .5 ? 1 : 2]) };
        case 'noun': return pickWord('noun', items);
        case 'verb': return pickWord('verb', items);
        case 'adj': return pickWord('adj', items);
        case 'adv': return pickWord('adv', items);
      }
      return null;
    }
    // タネ文の部品の待ち行列(2〜3本ぶんを混ぜる)
    var queue = [], recent = [], sidN = 0;
    function fillQueue() {
      var sd = o.seeds.next(); if (!sd) return;
      var sid = ++sidN, wi = 0;
      recent.push({ text: sd.text, n: Seeds.norm(sd.text), sid: sid, units: sd.chunks.map(function (c) { return c.map(function () { return wi++; }); }) }); if (recent.length > 8) recent.shift();
      // 1本ぶんの部品をまとめて出す(順番だけ混ぜる)。他のタネ文とは混ぜない
      var ws = sd.words.map(function (w, k) { var c = JSON.parse(JSON.stringify({ k: w.k, v: w.v, f: w.f, pl: w.pl, t: w.t })); c.e = w.e; c.sid = sid; c.si = k; if (w.k === 'idm' || (w.k === 'q' && w.e)) c.star = 1; return c; });
      for (var i = ws.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = ws[i]; ws[i] = ws[j]; ws[j] = t; }
      queue = queue.concat(ws);
    }
    // 盤面に部品が(ほぼ)そろっているタネ文の数
    function liveSeeds(items) {
      var have = {};
      items.forEach(function (it) { (it.word ? [it.word] : (it.chunk && it.chunk.words) || []).forEach(function (w) { if (w && w.sid) have[w.sid] = (have[w.sid] || 0) + 1; }); });
      var n = 0; recent.forEach(function (r) { var tot = r.units.reduce(function (a, u) { return a + u.length; }, 0); if ((have[r.sid] || 0) >= tot * .75) n++; });
      return n;
    }
    function feasible(items) {
      var np = 0, vp = 0, cnt = 0, dets = 0;
      items.forEach(function (it) {
        var w = it.word, t = it.chunk && it.chunk.t;
        if (t === 'NP' || (w && w.k === 'pr')) np++;
        else if (w && w.k === 'n') { if (manualArt && (w.e.c === 'c' || w.e.c === 't') && !w.e.ind) cnt++; else np++; }
        if (w && (w.k === 'det' || w.k === 'q')) dets++;
        if (t === 'VP' || (w && (w.k === 'v' || w.k === 'be'))) vp++;
      });
      np += Math.min(cnt, dets);
      return { np: np, vp: vp, cnt: cnt, dets: dets, ok: np >= 2 && vp >= 1 };
    }
    // 詰みを解く1語
    function rescue(items) {
      var f = feasible(items);
      if (f.vp < 1) return dict.getWords({ pos: 'verb', tag: { fr: ['intr', 'both'], simple: 1 }, maxLevel: maxLv, count: 1, rnd: rnd })[0] ? { k: 'v', e: dict.getWords({ pos: 'verb', tag: { fr: ['intr', 'both'], simple: 1 }, maxLevel: maxLv, count: 1, rnd: rnd })[0] } : pickWord('verb', items);
      if (manualArt && f.cnt > f.dets) return rnd() < .6 ? { k: 'det', v: 'the' } : { k: 'pr', v: pick(['he', 'she', 'i', 'you']) };
      if (f.np < 2) return { k: 'pr', v: pick(['he', 'she', 'i', 'you', 'it']) };
      var e = dict.getWords({ pos: 'verb', tag: { fr: ['intr', 'both'], simple: 1 }, maxLevel: maxLv, count: 1, rnd: rnd })[0];
      return rnd() < .5 || !e ? { k: 'pr', v: pick(['he', 'she', 'i', 'you', 'it']) } : { k: 'v', e: e };
    }
    return {
      next: function (items, target, idiomRate) {
        var f = feasible(items);
        if (!f.ok) return rescue(items);
        // 最低数(盤面22個あたり)。足りない品詞を優先して出す
        // タネ文:盤面に組める文が常に2本以上あるように、1本ずつ丸ごと出す
        if (o.seeds) {
          if (!queue.length && liveSeeds(items) < 2) fillQueue();
          if (queue.length) return queue.shift();
          idiomRate = idiomRate == null ? .03 : idiomRate * .5;
        }
        var need = deficit(items, target || 22);
        if (need && rnd() < .8) { var nw = pickKind(need, items); if (nw) return nw; }
        if (rnd() < (idiomRate == null ? .06 : idiomRate)) { var idm = pickWord('idiom', items); if (idm) return idm; }
        for (var t = 0; t < 6; t++) { var w = pickWord(chooseCat(items, target || 22), items); if (w && !overCap(items, w)) return w; }
        return pickWord('noun', items);
      },
      pickWord: pickWord, feasible: feasible, counts: counts, rescue: rescue,
      // タネ文と同じ文か(PERFECT!)。当たったタネ文は一覧から外す
      matchSeed: function (text) { var n = Seeds.norm(text); for (var i = 0; i < recent.length; i++) if (recent[i].n === n) { recent.splice(i, 1); return true; } return false; },
      recentSeeds: function () { return recent.map(function (r) { return r.text; }); },
      seedInfo: function () { return recent.slice(); }
    };
  }

  // ---------- 探索:盤面から作れる文を1つ探す(ヒント・オート・詰みチェック用) ----------
  function candidates(items, cfg) {
    var out = [], words = [];
    items.forEach(function (it) {
      if (it.chunk) out.push({ c: it.chunk, src: [it] });
      else if (it.word) {
        words.push(it); var s = G.chainState([it.word], cfg);
        if (s.complete && !s.err) out.push({ c: s.chunk, src: [it] });
        else if (it.word.k === 'v' && !cfg.auto.verb) { // 形はタップで変えられるので、原形・過去形でも試す
          ['base', 'past'].forEach(function (f) { var w2 = { k: 'v', e: it.word.e, f: f }, s2 = G.chainState([w2], cfg); if (s2.complete && !s2.err) out.push({ c: s2.chunk, src: [it] }); });
        }
      }
    });
    var dets = words.filter(function (i) { return /^(det|q|pr)$/.test(i.word.k); }), nouns = words.filter(function (i) { return i.word.k === 'n'; });
    var preps = words.filter(function (i) { return i.word.k === 'prep'; }), aux = words.filter(function (i) { return i.word.k === 'modal' || i.word.k === 'be'; });
    var verbs = words.filter(function (i) { return i.word.k === 'v'; });
    function tryChain(list) { var s = G.chainState(list.map(function (i) { return i.word; }), cfg); if (s.complete && !s.err) out.push({ c: s.chunk, src: list }); }
    nouns.forEach(function (n) { dets.slice(0, 4).forEach(function (d) { tryChain([d, n]); }); preps.slice(0, 3).forEach(function (p) { tryChain([p, n]); dets.slice(0, 2).forEach(function (d) { tryChain([p, d, n]); }); }); });
    verbs.forEach(function (v) { aux.slice(0, 2).forEach(function (a) { tryChain([a, v]); }); });
    return out;
  }
  function solve(items, cfg, limit) {
    var cand = candidates(items, cfg), NP = [], VP = [], POST = [], COMP = [];
    cand.forEach(function (x) { var t = x.c.t; if (t === 'NP') { NP.push(x); COMP.push(x); } else if (t === 'VP') VP.push(x); else if (t === 'AP' || t === 'NF') COMP.push(x); if (t === 'PP' || t === 'ADV' || (t === 'ID' && x.c.ik !== 'front')) POST.push(x); });
    var tries = 0, best = null; limit = limit || 4000;
    function disjoint(arr) { var s = new Set(); for (var i = 0; i < arr.length; i++) for (var j = 0; j < arr[i].src.length; j++) { if (s.has(arr[i].src[j])) return false; s.add(arr[i].src[j]); } return true; }
    function test(arr) { tries++; if (!disjoint(arr)) return false; var r = G.parse(arr.map(function (x) { return x.c; }), cfg); if (r.ok && r.kind === 'S') { if (!best || arr.length > best.parts.length) best = { parts: arr, text: r.text }; return true; } return false; }
    for (var a = 0; a < NP.length && tries < limit; a++) for (var b = 0; b < VP.length && tries < limit; b++) {
      test([NP[a], VP[b]]);
      for (var c = 0; c < COMP.length && tries < limit; c++) { if (test([NP[a], VP[b], COMP[c]])) for (var d = 0; d < POST.length && tries < limit; d++) test([NP[a], VP[b], COMP[c], POST[d]]); }
      for (var e = 0; e < POST.length && tries < limit; e++) test([NP[a], VP[b], POST[e]]);
      if (best && best.parts.length >= 4) return best;
    }
    return best;
  }
  return { create: create, RATIO: RATIO, catOf: catOf, solve: solve, candidates: candidates };
})();

/* ===== FILE: art.js ===== */
/* ===== art.js:絵(バブルのスプライト・チャンクくん・街並み・アイコン) ===== */
var Art = (function () {
  'use strict';
  var FONT_EN = '"Arial Rounded MT Bold","Avenir Next Rounded","Nunito","Varela Round","Hiragino Maru Gothic ProN","Rounded Mplus 1c",system-ui,-apple-system,"Segoe UI",sans-serif';
  var FONT_JA = '"Hiragino Maru Gothic ProN","BIZ UDPGothic","Rounded Mplus 1c","Kosugi Maru","Yu Gothic UI",Meiryo,system-ui,sans-serif';
  // 品詞色(5色まで)
  var COL = {
    noun: [92, 168, 240], verb: [242, 120, 128], aux: [255, 156, 64], mod: [96, 200, 140], prep: [244, 190, 72], link: [168, 136, 234], plain: [214, 206, 228], magic: [255, 160, 210]
  };
  function colorKeyOfWord(w) {
    switch (w.k) {
      case 'n': case 'pr': case 'det': case 'q': return 'noun';
      case 'v': case 'ti': return 'verb';
      case 'be': case 'hv': case 'modal': case 'not': case 'sm': case 'tp': return 'aux';
      case 'adj': case 'adv': case 'deg': case 'er': return 'mod';
      case 'prep': return 'prep'; case 'conj': case 'idm': return 'link'; case 'magic': return 'magic';
    }
    return 'plain';
  }
  function colorKeyOfChunk(c) {
    switch (c.t) {
      case 'NP': return 'noun'; case 'VP': case 'NF': return 'verb'; case 'PP': return 'prep'; case 'AP': case 'ADV': return 'mod';
      case 'CL': case 'CONJ': case 'FR': return 'link'; case 'ID': return c.ik === 'front' ? 'link' : c.ik === 'other' ? 'mod' : 'prep';
    }
    return 'plain';
  }
  function shapeOfChunk(c) { switch (c.t) { case 'NP': return 'round'; case 'VP': return 'egg'; case 'CL': case 'CONJ': case 'FR': return 'cloud'; case 'ID': return c.ik === 'front' ? 'cloud' : 'drop'; default: return 'drop'; } }
  function rgb(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a == null ? 1 : a) + ')'; }
  function mix(c, d, t) { return [Math.round(c[0] + (d[0] - c[0]) * t), Math.round(c[1] + (d[1] - c[1]) * t), Math.round(c[2] + (d[2] - c[2]) * t)]; }
  var WHITE = [255, 255, 255], INK = [58, 44, 74];

  var measureCtx = null;
  function measure(text, size, weight) {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = (weight || 800) + ' ' + size + 'px ' + FONT_EN;
    return measureCtx.measureText(text).width;
  }
  // 形のパス(中心0,0・半径r)
  function shapePath(ctx, shape, r) {
    ctx.beginPath();
    if (shape === 'egg') { ctx.ellipse(0, 0, r * 1.08, r * .9, 0, 0, Math.PI * 2); }
    else if (shape === 'drop') {
      ctx.moveTo(0, -r * 1.05);
      ctx.bezierCurveTo(r * .55, -r * .7, r * 1.02, -r * .15, r * .98, r * .25);
      ctx.bezierCurveTo(r * .92, r * .78, r * .45, r * 1.0, 0, r * 1.0);
      ctx.bezierCurveTo(-r * .45, r * 1.0, -r * .92, r * .78, -r * .98, r * .25);
      ctx.bezierCurveTo(-r * 1.02, -r * .15, -r * .55, -r * .7, 0, -r * 1.05);
    } else if (shape === 'cloud') {
      var b = [[-.55, .12, .5], [-.18, -.28, .58], [.3, -.22, .55], [.6, .14, .46], [.05, .32, .6], [-.4, .38, .4]];
      b.forEach(function (q) { ctx.moveTo(q[0] * r + q[2] * r, q[1] * r); ctx.arc(q[0] * r, q[1] * r, q[2] * r, 0, Math.PI * 2); });
    } else ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
  var cache = new Map();
  // バブルのスプライト。o: {text, col, r, kind:'word'|'chunk'|'slot', shape, star, blobs:[col...], dpr, small, cyc}
  function sprite(o) {
    var key = [o.text, o.col, o.r, o.kind, o.shape, o.star ? 1 : 0, (o.blobs || []).join('/'), o.dpr, o.fs || 0, o.face || '', o.cyc ? 1 : 0].join('|');
    var s = cache.get(key); if (s) return s;
    if (cache.size > 600) cache.clear();
    var r = o.r, pad = Math.ceil(r * .35 + 6), size = Math.ceil((r * 1.15 + pad) * 2), dpr = o.dpr || 1;
    var cv = document.createElement('canvas'); cv.width = Math.ceil(size * dpr); cv.height = Math.ceil(size * dpr);
    var c = cv.getContext('2d'); c.scale(dpr, dpr); c.translate(size / 2, size / 2);
    var base = COL[o.col] || COL.plain, shape = o.shape || 'round';
    // 影
    c.save(); c.shadowColor = 'rgba(70,40,110,.24)'; c.shadowBlur = Math.max(3, r * .28); c.shadowOffsetY = r * .14; shapePath(c, shape, r); c.fillStyle = rgb(mix(base, WHITE, .5)); c.fill(); c.restore();
    // 本体
    shapePath(c, shape, r);
    var g = c.createRadialGradient(-r * .3, -r * .38, r * .1, 0, 0, r * 1.15);
    if (o.kind === 'word') { g.addColorStop(0, rgb(mix(base, WHITE, .86))); g.addColorStop(.62, rgb(mix(base, WHITE, .5))); g.addColorStop(1, rgb(mix(base, WHITE, .12))); }
    else { g.addColorStop(0, rgb(mix(base, WHITE, .9))); g.addColorStop(.55, rgb(mix(base, WHITE, .62))); g.addColorStop(1, rgb(mix(base, [150, 150, 225], .45))); }
    c.fillStyle = g; c.fill();
    if (o.kind !== 'word') {
      c.save(); shapePath(c, shape, r); c.clip();
      (o.blobs || []).forEach(function (bk, i) {
        var bc = COL[bk] || base, a = (i * 2.4) + .7, rr = r * (.55 + (i % 2) * .15), bx = Math.cos(a) * r * .42, by = Math.sin(a) * r * .38 + r * .1;
        var bg = c.createRadialGradient(bx, by, 0, bx, by, rr); bg.addColorStop(0, rgb(bc, .42)); bg.addColorStop(1, rgb(bc, 0)); c.fillStyle = bg; c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
      });
      var ig = c.createLinearGradient(0, r * .2, 0, r * 1.1); ig.addColorStop(0, 'rgba(120,110,210,0)'); ig.addColorStop(1, 'rgba(120,110,210,.28)'); c.fillStyle = ig; c.fillRect(-r * 2, -r * 2, r * 4, r * 4);
      c.restore();
    }
    // ふち
    shapePath(c, shape, r); c.lineWidth = o.kind === 'word' ? 1.4 : 2.2; c.strokeStyle = rgb(mix(base, INK, .35), o.kind === 'word' ? .45 : .6); c.stroke();
    // ハイライト
    c.save(); c.beginPath(); c.ellipse(-r * .34, -r * .5, r * .34, r * .17, -.5, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
    c.beginPath(); c.arc(-r * .62, -r * .2, r * .07, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.7)'; c.fill();
    c.beginPath(); c.ellipse(r * .42, r * .5, r * .16, r * .07, -.6, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); c.restore();
    // 顔(代名詞)
    if (o.face) drawFace(c, o.face, r);
    // 文字
    var fs = o.kind === 'slot' ? (o.fs || 12) : (o.fs || 15), tw;
    c.font = '800 ' + fs + 'px ' + FONT_EN;
    var maxW = r * (o.shape === 'cloud' ? 1.7 : 1.68);
    while ((tw = c.measureText(o.text).width) > maxW && fs > 9) { fs -= .5; c.font = '800 ' + fs + 'px ' + FONT_EN; }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    var ty = o.face ? r * .42 : 1;
    c.lineWidth = 3.2; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineJoin = 'round'; c.strokeText(o.text, 0, ty);
    c.fillStyle = rgb(mix(base, INK, .82)); c.fillText(o.text, 0, ty);
    if (o.cyc) { c.beginPath(); c.arc(r * .62, -r * .62, r * .16 + 1, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill(); c.strokeStyle = rgb(mix(base, INK, .5), .7); c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.arc(r * .62, -r * .62, r * .08 + .5, -.3, 4.4); c.stroke(); }
    if (o.star) drawStar(c, r * .62, -r * .78, r * .26 + 2, '#ffcf4a', '#b7841b');
    s = { cv: cv, size: size };
    cache.set(key, s); return s;
  }
  function drawStar(c, x, y, R, fill, line) {
    c.save(); c.translate(x, y); c.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * .48 : R; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 1.5; c.strokeStyle = line; c.stroke(); c.restore();
  }
  // 代名詞の顔(小さな丸い顔。単数=1つ、複数=2つ)
  function drawFace(c, face, r) {
    var faces = face === 'pl' ? [-r * .28, r * .28] : [0], fr = face === 'pl' ? r * .3 : r * .38;
    faces.forEach(function (fx, i) {
      var fy = -r * .2;
      c.beginPath(); c.arc(fx, fy, fr, 0, Math.PI * 2); c.fillStyle = i ? '#ffe2c9' : '#ffeedd'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#7a5545'; c.stroke();
      c.fillStyle = '#3b2a2a'; c.beginPath(); c.ellipse(fx - fr * .33, fy - fr * .05, fr * .1, fr * .15, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(fx + fr * .33, fy - fr * .05, fr * .1, fr * .15, 0, 0, 7); c.fill();
      c.beginPath(); c.arc(fx, fy + fr * .18, fr * .25, .15, Math.PI - .15); c.lineWidth = 1.4; c.strokeStyle = '#a0484f'; c.stroke();
      c.fillStyle = 'rgba(255,140,150,.5)'; c.beginPath(); c.ellipse(fx - fr * .55, fy + fr * .2, fr * .16, fr * .1, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(fx + fr * .55, fy + fr * .2, fr * .16, fr * .1, 0, 0, 7); c.fill();
    });
  }

  // ---------- チャンクくん ----------
  var CK = { line: '#5a3a2e', top: '#fffaf3', bot: '#d7dbf6', leg: '#4b2f27', cheek: 'rgba(255,135,140,.55)', mouth: '#7a2a2e', tongue: '#ff8f97' };
  // o: {segs:体節の数(頭を除く), expr, t, blink, scale, wave, walk}
  function chunkKun(ctx, x, y, o) {
    var s = o.scale || 1, R = 34 * s, t = o.t || 0, n = Math.max(1, o.segs || 2), maxLen = o.maxLen || 9999;
    var segs = [], px = 0, pr = R;
    for (var i = 1; i <= n; i++) { var r = R * Math.max(.5, .86 * Math.pow(.93, i - 1)); px += (pr + r) * .62; segs.push({ x: px, r: r }); pr = r; }
    if (px + pr > maxLen && n > 1) { var k = (maxLen - pr) / px; segs.forEach(function (q) { q.x *= k; }); }
    ctx.save(); ctx.translate(x, y);
    var bob = Math.sin(t * 3) * 1.5 * s;
    // 影
    ctx.fillStyle = 'rgba(60,40,90,.15)'; ctx.beginPath(); ctx.ellipse((segs[segs.length - 1].x) / 2, R * .95, (segs[segs.length - 1].x) / 2 + R * 1.1, R * .16, 0, 0, 7); ctx.fill();
    // しっぽ
    var last = segs[segs.length - 1];
    blob(ctx, last.x + last.r * .95, Math.sin(t * 4 - n * .6) * 1.5 + bob * .5, last.r * .32, last.r * .3, s);
    for (var j = segs.length - 1; j >= 0; j--) {
      var q = segs[j], wy = Math.sin(t * 4 - (j + 1) * .6) * 1.6 * s + bob * .6;
      legs(ctx, q.x, wy + q.r * .82, q.r, t, j + 1, s, o.walk);
      blob(ctx, q.x, wy, q.r * 1.06, q.r * .92, s);
    }
    // 頭
    legs(ctx, 0, bob + R * .8, R * 1.1, t, 0, s, o.walk);
    var wave = o.wave ? Math.sin(t * 9) * .5 : Math.sin(t * 2) * .12;
    ctx.save(); ctx.translate(-R * 1.08, bob - R * .05); ctx.rotate(-.6 + wave); ctx.beginPath(); ctx.ellipse(0, -R * .2, R * .17, R * .26, 0, 0, 7); ctx.fillStyle = CK.leg; ctx.fill(); ctx.restore();
    blob(ctx, 0, bob, R * 1.18, R * .98, s);
    face(ctx, -R * .1, bob, R, o.expr || 'normal', o.blink, t);
    ctx.restore();
    return { head: { x: x, y: y + bob, r: R }, tail: x + last.x + last.r };
  }
  function blob(ctx, x, y, rx, ry, s) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7);
    var g = ctx.createLinearGradient(0, y - ry, 0, y + ry); g.addColorStop(0, CK.top); g.addColorStop(.55, '#fbf6f4'); g.addColorStop(1, CK.bot);
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.6 * s; ctx.strokeStyle = CK.line; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - rx * .35, y - ry * .5, rx * .28, ry * .14, -.3, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
  }
  function legs(ctx, x, y, r, t, i, s, walk) {
    ctx.fillStyle = CK.leg;
    var ph = walk ? Math.sin(t * 10 + i * 1.7) * 2.2 * s : 0;
    ctx.beginPath(); ctx.ellipse(x - r * .45, y + ph, r * .17, r * .13, 0, 0, 7); ctx.fill();
    if (i === 0) { ctx.beginPath(); ctx.ellipse(x + r * .35, y - ph, r * .17, r * .13, 0, 0, 7); ctx.fill(); }
  }
  function face(ctx, fx, fy, R, ex, blinkK, t) {
    var ey = fy - R * .08, dx = R * .3, k = blinkK == null ? 1 : blinkK;
    ctx.lineCap = 'round';
    // ほっぺ
    ctx.fillStyle = CK.cheek; ctx.beginPath(); ctx.ellipse(fx - R * .58, fy + R * .2, R * .17, R * .11, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(fx + R * .58, fy + R * .2, R * .17, R * .11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b1b1b'; ctx.strokeStyle = '#2b1b1b'; ctx.lineWidth = R * .07;
    var eye = function (x, look) {
      if (ex === 'joy') { ctx.beginPath(); ctx.arc(x, ey + R * .04, R * .1, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); return; }
      if (ex === 'panic') { ctx.beginPath(); ctx.moveTo(x - R * .08, ey - R * .08); ctx.lineTo(x + R * .06, ey); ctx.lineTo(x - R * .08, ey + R * .08); ctx.stroke(); return; }
      var h = (ex === 'surprise' ? R * .13 : R * .12) * k, w = ex === 'surprise' ? R * .1 : R * .075;
      ctx.beginPath(); ctx.ellipse(x + (look || 0), ey, w, Math.max(1, h), 0, 0, 7); ctx.fill();
      if (k > .5) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + (look || 0) - w * .3, ey - h * .4, R * .03, 0, 7); ctx.fill(); ctx.fillStyle = '#2b1b1b'; }
      if (ex === 'sad') { ctx.beginPath(); ctx.moveTo(x - R * .1, ey - R * .2 + (x < fx ? R * .04 : 0)); ctx.lineTo(x + R * .1, ey - R * .2 + (x < fx ? 0 : R * .04)); ctx.lineWidth = R * .045; ctx.stroke(); ctx.lineWidth = R * .07; }
    };
    var look = ex === 'think' ? R * .05 : ex === 'idea' ? 0 : 0;
    if (ex === 'panic') { eye(fx - dx); ctx.save(); ctx.translate(2 * (fx + dx), 0); ctx.scale(-1, 1); eye(fx + dx); ctx.restore(); }
    else { eye(fx - dx, look); eye(fx + dx, look); }
    // 口
    var my = fy + R * .2;
    if (ex === 'surprise') { ctx.beginPath(); ctx.ellipse(fx, my + R * .04, R * .08, R * .11, 0, 0, 7); ctx.fillStyle = CK.mouth; ctx.fill(); }
    else if (ex === 'sad') { ctx.beginPath(); ctx.arc(fx, my + R * .14, R * .1, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = R * .05; ctx.strokeStyle = CK.mouth; ctx.stroke(); }
    else if (ex === 'think') { ctx.beginPath(); ctx.moveTo(fx - R * .07, my + R * .05); ctx.lineTo(fx + R * .08, my + R * .03); ctx.lineWidth = R * .05; ctx.strokeStyle = CK.mouth; ctx.stroke(); }
    else if (ex === 'panic') { ctx.beginPath(); ctx.moveTo(fx - R * .12, my + R * .06); for (var i = 1; i <= 4; i++) ctx.lineTo(fx - R * .12 + i * R * .06, my + R * .06 + (i % 2 ? -R * .04 : 0)); ctx.lineWidth = R * .045; ctx.strokeStyle = CK.mouth; ctx.stroke(); }
    else {
      var big = ex === 'joy' || ex === 'idea' ? 1.25 : 1;
      ctx.beginPath(); ctx.moveTo(fx - R * .13 * big, my); ctx.quadraticCurveTo(fx, my + R * .34 * big, fx + R * .13 * big, my); ctx.closePath(); ctx.fillStyle = CK.mouth; ctx.fill();
      ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(fx, my + R * .2 * big, R * .1 * big, R * .08, 0, 0, 7); ctx.fillStyle = CK.tongue; ctx.fill(); ctx.restore();
    }
    if (ex === 'panic') { ctx.fillStyle = '#7cc6ff'; ctx.beginPath(); ctx.moveTo(fx + R * .95, fy - R * .5); ctx.quadraticCurveTo(fx + R * 1.08, fy - R * .25, fx + R * .95, fy - R * .2); ctx.quadraticCurveTo(fx + R * .82, fy - R * .25, fx + R * .95, fy - R * .5); ctx.fill(); }
    if (ex === 'idea') { drawStar(ctx, fx + R * .7, fy - R * 1.15 + Math.sin(t * 6) * 2, R * .2, '#ffd447', '#c99a1d'); }
    if (ex === 'think') { ctx.fillStyle = '#6b5a7a'; for (var d = 0; d < 3; d++) { ctx.beginPath(); ctx.arc(fx + R * (.55 + d * .2), fy - R * 1.1, R * (.04 + d * .015), 0, 7); ctx.fill(); } }
  }

  // ---------- 街並みの背景 ----------
  var SKY = [ // [上, 下] 朝・昼・夕・夜
    [[255, 214, 196], [255, 241, 222]], [[150, 205, 250], [226, 242, 255]], [[255, 150, 140], [255, 214, 160]], [[44, 52, 110], [118, 96, 168]]
  ];
  function skyAt(p) { // p:0朝 → 1夜
    var stops = [0, .35, .72, 1], i = 0; while (i < 2 && p > stops[i + 1]) i++;
    var t = U.clamp((p - stops[i]) / (stops[i + 1] - stops[i]), 0, 1);
    return [mix(SKY[i][0], SKY[i + 1][0], t), mix(SKY[i][1], SKY[i + 1][1], t)];
  }
  function City(seed) {
    var r = U.rng(seed || 7), far = [], near = [], clouds = [], stars = [];
    var pal = [[244, 200, 214], [204, 214, 246], [214, 236, 222], [252, 226, 190], [222, 206, 244], [190, 222, 240]];
    var x = -20; while (x < 1400) { var w = 34 + r() * 50; far.push({ x: x, w: w, h: .2 + r() * .26, c: pal[r.int(pal.length)], top: r.int(4) }); x += w + 2 + r() * 8; }
    x = -30; while (x < 1400) { var w2 = 40 + r() * 56; near.push({ x: x, w: w2, h: .1 + r() * .22, c: pal[r.int(pal.length)], top: r.int(5), seed: r.int(1e6) }); x += w2 + 6 + r() * 16; }
    for (var i = 0; i < 5; i++) clouds.push({ x: r() * 1, y: .06 + r() * .3, s: .6 + r() * .8, v: .004 + r() * .006 });
    for (i = 0; i < 70; i++) stars.push({ x: r(), y: r() * .55, s: .6 + r() * 1.2, ph: r() * 6 });
    var buf = null, bufKey = '';
    function render(w, h, p, lit, dpr) {
      var key = [w, h, Math.round(p * 60), Math.round(lit * 30), dpr].join('|');
      if (buf && key === bufKey) return buf;
      bufKey = key; buf = buf || document.createElement('canvas'); buf.width = Math.ceil(w * dpr); buf.height = Math.ceil(h * dpr);
      var c = buf.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      var sk = skyAt(p), g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgb(sk[0])); g.addColorStop(1, rgb(sk[1])); c.fillStyle = g; c.fillRect(0, 0, w, h);
      // 太陽/月
      var sunY = h * (.18 + p * .5), night = U.clamp((p - .72) / .28, 0, 1);
      c.fillStyle = night > .5 ? 'rgba(255,250,220,.95)' : 'rgba(255,248,220,.9)';
      c.beginPath(); c.arc(w * .78, night > .5 ? h * .14 : sunY, night > .5 ? 18 : 30, 0, 7); c.fill();
      if (night > .5) { c.fillStyle = rgb(sk[0]); c.beginPath(); c.arc(w * .78 + 8, h * .14 - 5, 16, 0, 7); c.fill(); }
      var gy = h * .98, dark = night * .55 + U.clamp((p - .5) / .3, 0, 1) * .15;
      var drawB = function (list, scale, alpha, win) {
        list.forEach(function (b) {
          if (b.x > w + 40) return;
          var bh = b.h * h * scale, by = gy - bh, col = mix(mix(b.c, sk[1], .15), [40, 36, 80], dark);
          c.fillStyle = rgb(col, alpha);
          c.beginPath();
          if (b.top === 1) { c.moveTo(b.x, by); c.lineTo(b.x + b.w / 2, by - b.w * .35); c.lineTo(b.x + b.w, by); }
          else if (b.top === 2) { c.moveTo(b.x, by); c.arc(b.x + b.w / 2, by, b.w / 2, Math.PI, 0); }
          else { var rr = Math.min(10, b.w * .2); c.moveTo(b.x, by + rr); c.quadraticCurveTo(b.x, by, b.x + rr, by); c.lineTo(b.x + b.w - rr, by); c.quadraticCurveTo(b.x + b.w, by, b.x + b.w, by + rr); }
          c.lineTo(b.x + b.w, gy); c.lineTo(b.x, gy); c.closePath(); c.fill();
          if (win) {
            var wr = U.rng(b.seed);
            for (var yy = by + 10; yy < gy - 12; yy += 15) for (var xx = b.x + 8; xx < b.x + b.w - 10; xx += 13) {
              var on = wr() < lit; c.fillStyle = on ? 'rgba(255,214,110,' + (.55 + night * .45) + ')' : 'rgba(255,255,255,' + (.35 - night * .25) + ')';
              c.beginPath(); c.roundRect ? c.roundRect(xx, yy, 7, 9, 2) : c.rect(xx, yy, 7, 9); c.fill();
            }
          }
        });
      };
      drawB(far, 1, .55, false);
      drawB(near, 1, .9, true);
      var hg = c.createLinearGradient(0, gy - 6, 0, h); hg.addColorStop(0, rgb(mix([150, 214, 160], [40, 40, 80], dark))); hg.addColorStop(1, rgb(mix([120, 190, 140], [30, 30, 70], dark)));
      c.fillStyle = hg; c.fillRect(0, gy - 2, w, h - gy + 2);
      return buf;
    }
    return {
      draw: function (ctx, w, h, p, lit, t, dpr) {
        ctx.drawImage(render(w, h, p, lit, dpr), 0, 0, w, h);
        var night = U.clamp((p - .7) / .3, 0, 1);
        if (night > 0) { stars.forEach(function (s) { ctx.fillStyle = 'rgba(255,255,240,' + (night * (.5 + .5 * Math.sin(t * 2 + s.ph))) + ')'; ctx.fillRect(s.x * w, s.y * h, s.s, s.s); }); }
        clouds.forEach(function (cl) {
          var cx = ((cl.x + t * cl.v) % 1.3 - .15) * w, cy = cl.y * h, s = cl.s * 26;
          ctx.fillStyle = 'rgba(255,255,255,' + (.75 - night * .45) + ')';
          ctx.beginPath(); ctx.arc(cx, cy, s, 0, 7); ctx.arc(cx + s * 1.1, cy - s * .35, s * 1.15, 0, 7); ctx.arc(cx + s * 2.2, cy, s * .9, 0, 7); ctx.ellipse(cx + s * 1.1, cy + s * .25, s * 1.9, s * .6, 0, 0, 7); ctx.fill();
        });
      }
    };
  }
  // ---------- DOM用アイコン(SVG) ----------
  var I = function (p, vb) { return '<svg viewBox="' + (vb || '0 0 24 24') + '" aria-hidden="true">' + p + '</svg>'; };
  var ICON = {
    pause: I('<rect x="6" y="5" width="4.2" height="14" rx="1.6"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.6"/>'),
    play: I('<path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5z"/>'),
    speaker: I('<path d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    gear: I('<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8.4 4.6-.1-2.2 2-1.6-2-3.5-2.4.9-1.9-1.1L15.6 3h-4l-.4 2.6-1.9 1.1-2.4-.9-2 3.5 2 1.6v2.2l-2 1.6 2 3.5 2.4-.9 1.9 1.1.4 2.6h4l.4-2.6 1.9-1.1 2.4.9 2-3.5z" fill-rule="evenodd"/>'),
    trophy: I('<path d="M7 3h10v3h3a3 3 0 0 1-3.6 4.2A5 5 0 0 1 13 13.9V17h3v3H8v-3h3v-3.1a5 5 0 0 1-3.4-3.7A3 3 0 0 1 4 6h3zm0 5H6a1 1 0 0 0 1 1zm10 0v1a1 1 0 0 0 1-1z"/>'),
    back: I('<path d="M14.5 5 7.5 12l7 7" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    home: I('<path d="M3.5 11 12 4l8.5 7v8.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>'),
    retry: I('<path d="M5 12a7 7 0 1 0 2.1-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M4 3.5v5h5z"/>'),
    shop: I('<path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3zM8.5 8V7a3.5 3.5 0 0 1 7 0v1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'),
    info: I('<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="10.8" y="10.5" width="2.4" height="7" rx="1.2"/><circle cx="12" cy="7.3" r="1.5"/>'),
    hint: I('<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6V17h6v-1.1c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5zM9.5 19h5v1.2a1.8 1.8 0 0 1-1.8 1.8h-1.4a1.8 1.8 0 0 1-1.8-1.8z"/>'),
    magic: I('<path d="m14.5 3 1.2 3.3L19 7.5l-3.3 1.2-1.2 3.3-1.2-3.3L10 7.5l3.3-1.2zM6.5 11l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9zm7.8 5.2.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
    auto: I('<circle cx="7.5" cy="12" r="4.2"/><circle cx="16.5" cy="12" r="4.2" opacity=".55"/><path d="M10.5 12h3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'),
    lock: I('<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4"/>'),
    check: I('<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
    close: I('<path d="m6.5 6.5 11 11m0-11-11 11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>'),
    star: I('<path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/>')
  };
  return { FONT_EN: FONT_EN, FONT_JA: FONT_JA, COL: COL, rgb: rgb, mix: mix, colorKeyOfWord: colorKeyOfWord, colorKeyOfChunk: colorKeyOfChunk, shapeOfChunk: shapeOfChunk, sprite: sprite, measure: measure, chunkKun: chunkKun, City: City, skyAt: skyAt, ICON: ICON, drawStar: drawStar, shapePath: shapePath, clearCache: function () { cache.clear(); } };
})();

/* ===== FILE: audio.js ===== */
/* ===== audio.js:効果音・BGM(すべて Web Audio で生成)と読み上げ ===== */
var Snd = (function () {
  'use strict';
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function create(opts) {
    var A = { ctx: null, vol: { bgm: .55, sfx: .8 }, on: { bgm: true, sfx: true, voice: true }, rate: 1, track: null, intensity: 0, dead: false };
    var master, comp, sfxBus, bgmBus, noiseBuf, timer = null, seq = null, voices = [], voice = null;
    function ensure() {
      if (A.ctx || A.dead) return A.ctx;
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try { A.ctx = new AC(); } catch (e) { return null; }
      var c = A.ctx;
      master = c.createGain(); master.gain.value = .9;
      comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .2;
      master.connect(comp); comp.connect(c.destination);
      sfxBus = c.createGain(); bgmBus = c.createGain(); sfxBus.connect(master); bgmBus.connect(master); applyVol();
      noiseBuf = c.createBuffer(1, c.sampleRate * .5, c.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return c;
    }
    function applyVol() { if (!A.ctx) return; var t = A.ctx.currentTime; sfxBus.gain.setTargetAtTime(A.on.sfx ? A.vol.sfx : 0, t, .02); bgmBus.gain.setTargetAtTime(A.on.bgm ? A.vol.bgm * .5 : 0, t, .05); }
    // ---- 音の部品 ----
    function tone(o) {
      var c = A.ctx; if (!c) return; var t = (o.t || c.currentTime), dur = o.d || .2;
      var osc = c.createOscillator(), g = c.createGain(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
      if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.glide || dur));
      if (o.det) osc.detune.value = o.det;
      var v = o.v == null ? .3 : o.v, a = o.a || .005;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      var node = g;
      if (o.lp) { var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || .7; g.connect(f); node = f; }
      osc.connect(g); node.connect(o.bus || sfxBus); osc.start(t); osc.stop(t + dur + .05);
    }
    function noise(o) {
      var c = A.ctx; if (!c) return; var t = o.t || c.currentTime, dur = o.d || .1;
      var s = c.createBufferSource(); s.buffer = noiseBuf; var f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.value = o.f || 2000; f.Q.value = o.q || 1;
      var g = c.createGain(); g.gain.setValueAtTime(o.v || .2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(o.bus || sfxBus); s.start(t, Math.random() * .3); s.stop(t + dur + .02);
    }
    function pop(t, f, v) { tone({ t: t, f: f || 900, f2: (f || 900) * .35, d: .09, glide: .07, v: v || .25, type: 'sine' }); noise({ t: t, f: 3000, q: 2, d: .03, v: (v || .25) * .4 }); }
    function bell(t, m, v, d) { tone({ t: t, f: mtof(m), d: d || .5, v: v || .14, type: 'sine' }); tone({ t: t, f: mtof(m + 12), d: (d || .5) * .6, v: (v || .14) * .35, type: 'sine' }); tone({ t: t, f: mtof(m) * 2.76, d: .12, v: (v || .14) * .2, type: 'sine' }); }
    var SFX = {
      tap: function (p) { var c = A.ctx, t = c.currentTime, m = 72 + PENTA[Math.min(PENTA.length - 1, p || 0)]; pop(t, mtof(m) * 1.6, .16); bell(t + .005, m, .13, .3); },
      cycle: function () { var t = A.ctx.currentTime; tone({ t: t, f: 1300, f2: 1800, d: .06, v: .12, type: 'square', lp: 3000 }); tone({ t: t + .05, f: 1700, d: .06, v: .1, type: 'triangle' }); },
      link: function (p) { var t = A.ctx.currentTime, m = 67 + PENTA[Math.min(PENTA.length - 1, p || 0)]; bell(t, m, .16, .45); pop(t, 600, .12); },
      chunk: function (p) { var t = A.ctx.currentTime, m = 72 + PENTA[Math.min(8, (p || 2) + 2)]; pop(t, 520, .3); tone({ t: t, f: 180, f2: 90, d: .18, v: .2, type: 'sine' }); bell(t + .06, m, .16, .5); bell(t + .14, m + 7, .13, .6); },
      sentence: function (p) { var t = A.ctx.currentTime, base = 72, ch = [0, 4, 7, 12, 16, 19, 24]; for (var i = 0; i < Math.min(7, 3 + (p || 2)); i++) { bell(t + i * .07, base + ch[i], .15, .8); tone({ t: t + i * .07, f: mtof(base + ch[i] - 12), d: .25, v: .07, type: 'triangle' }); } noise({ t: t + .35, f: 8000, q: .5, d: .5, v: .08, ft: 'highpass' }); tone({ t: t, f: 110, f2: 55, d: .4, v: .25, type: 'sine' }); },
      reject: function () { var t = A.ctx.currentTime; tone({ t: t, f: 240, f2: 150, d: .14, v: .22, type: 'triangle' }); },
      fail: function () { var t = A.ctx.currentTime; tone({ t: t, f: 440, f2: 330, d: .2, v: .16, type: 'triangle' }); tone({ t: t + .18, f: 330, f2: 220, d: .3, v: .16, type: 'triangle' }); },
      tri: function () { var t = A.ctx.currentTime; tone({ t: t, f: 520, d: .14, v: .14, type: 'triangle' }); tone({ t: t + .12, f: 440, d: .22, v: .14, type: 'triangle' }); },
      scatter: function () { var t = A.ctx.currentTime; for (var i = 0; i < 4; i++) pop(t + i * .045, 500 + Math.random() * 700, .1); },
      select: function () { var t = A.ctx.currentTime; tone({ t: t, f: 880, f2: 1320, d: .1, v: .12, type: 'sine' }); },
      slot: function () { var t = A.ctx.currentTime; tone({ t: t, f: 200, f2: 120, d: .12, v: .28, type: 'sine' }); noise({ t: t, f: 1500, q: 1, d: .04, v: .12 }); },
      ready: function () { var t = A.ctx.currentTime;[0, 4, 7, 12].forEach(function (s, i) { bell(t + i * .05, 79 + s, .08, .35); }); },
      tick: function () { var t = A.ctx.currentTime; tone({ t: t, f: 1500, d: .04, v: .12, type: 'square', lp: 2500 }); },
      extend: function () { var t = A.ctx.currentTime;[0, 7, 12].forEach(function (s, i) { tone({ t: t + i * .04, f: mtof(84 + s), d: .2, v: .06, type: 'sine' }); }); },
      combo: function (p) { var t = A.ctx.currentTime, m = 79 + Math.min(12, p || 0); bell(t, m, .12, .4); bell(t + .06, m + 5, .1, .4); },
      insert: function () { var t = A.ctx.currentTime; tone({ t: t, f: 300, f2: 700, d: .12, v: .2, type: 'sine' }); pop(t + .08, 1100, .14); },
      button: function () { var t = A.ctx.currentTime; tone({ t: t, f: 660, f2: 990, d: .07, v: .14, type: 'sine' }); },
      count: function (p) { var t = A.ctx.currentTime; tone({ t: t, f: p ? 784 : 1175, d: p ? .18 : .5, v: .2, type: 'triangle' }); },
      end: function () { var t = A.ctx.currentTime;[84, 79, 76, 72].forEach(function (m, i) { bell(t + i * .12, m, .14, .6); }); },
      best: function () { var t = A.ctx.currentTime;[72, 76, 79, 84, 79, 84, 88].forEach(function (m, i) { bell(t + i * .1, m, .15, .7); tone({ t: t + i * .1, f: mtof(m - 24), d: .2, v: .08, type: 'triangle' }); }); },
      pop: function () { pop(A.ctx.currentTime, 700 + Math.random() * 500, .18); },
      warn: function () { var t = A.ctx.currentTime; tone({ t: t, f: 330, d: .12, v: .15, type: 'square', lp: 1200 }); }
    };
    // ---- BGM(手続き生成のシーケンサ) ----
    var PROG = { // 4小節の和音(ルートのMIDI)と3和音
      play: [[48, [0, 4, 7]], [43, [0, 4, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]]],
      title: [[41, [0, 4, 7, 11]], [43, [0, 4, 7]], [40, [0, 3, 7]], [45, [0, 3, 7]]],
      result: [[48, [0, 4, 7, 11]], [41, [0, 4, 7, 11]], [43, [0, 4, 7]], [48, [0, 4, 7]]]
    };
    var MEL = { // 16分×16 を4小節。数字=和音ルート+半音、null=休み
      play: [[12, null, 16, null, 19, null, 16, 14, 12, null, null, 9, 12, null, null, null], [11, null, 14, null, 19, null, 14, 12, 11, null, 7, null, 11, null, null, null], [12, null, 15, null, 19, 17, 15, null, 12, null, 15, null, 19, null, null, null], [12, null, 16, 19, 21, null, 19, 16, 19, null, 16, null, 14, null, 12, null]],
      title: [[16, null, null, null, 19, null, 21, null, 19, null, null, null, 16, null, null, null], [14, null, null, null, 19, null, 16, null, 14, null, null, null, null, null, null, null], [15, null, null, null, 19, null, 22, null, 19, null, 15, null, null, null, null, null], [12, null, null, null, 16, null, 19, null, 21, null, null, null, 19, null, null, null]],
      result: [[19, null, 16, null, 12, null, 16, null, 19, null, 24, null, null, null, null, null], [16, null, 14, null, 12, null, 9, null, 12, null, null, null, null, null, null, null], [14, null, 16, null, 19, null, 14, null, 11, null, null, null, null, null, null, null], [12, null, 16, null, 19, null, 24, null, null, null, null, null, null, null, null, null]]
    };
    var BPM = { play: 120, title: 92, result: 88 };
    function music(name) {
      if (A.track === name) return; A.track = name; stopSeq();
      if (!name || !ensure()) return;
      seq = { name: name, step: 0, next: A.ctx.currentTime + .08 };
      timer = setInterval(schedule, 25);
    }
    function stopSeq() { if (timer) clearInterval(timer); timer = null; seq = null; }
    function schedule() {
      if (!seq || !A.ctx || A.ctx.state !== 'running') return;
      var c = A.ctx, spb = 60 / BPM[seq.name] / 4;
      while (seq.next < c.currentTime + .14) { playStep(seq.name, seq.step, seq.next, spb); seq.step = (seq.step + 1) % 64; seq.next += spb; }
    }
    function playStep(name, step, t, spb) {
      var bar = Math.floor(step / 16), s = step % 16, ch = PROG[name][bar], root = ch[0], I = name === 'play' ? A.intensity : .3, B = bgmBus;
      if (name === 'play') {
        if (s % 4 === 0) tone({ t: t, f: mtof(root - 12), d: spb * 3, v: .34, type: 'triangle', bus: B, lp: 600 });
        if (s % 4 === 2) tone({ t: t, f: mtof(root), d: spb * 1.4, v: .16, type: 'triangle', bus: B, lp: 900 });
        if (s % 8 === 4 || s % 8 === 7 && I > .5) ch[1].forEach(function (iv) { tone({ t: t, f: mtof(root + 12 + iv), d: spb * 1.8, v: .045, type: 'square', bus: B, lp: 1800, det: 4 }); });
        if (s % 4 === 0) { tone({ t: t, f: 150, f2: 45, d: .22, glide: .12, v: .5, type: 'sine', bus: B }); }
        if (s % 8 === 4) noise({ t: t, f: 1800, q: .7, d: .12, v: .16, bus: B });
        if (s % 2 === 1 || I > .6) noise({ t: t, f: 9000, q: .5, d: .035, v: .05 + I * .04, ft: 'highpass', bus: B });
        if (I > .3 && s % 2 === 0) { var ar = ch[1][(s / 2) % ch[1].length]; tone({ t: t, f: mtof(root + 24 + ar), d: spb * 1.2, v: .035 + I * .03, type: 'sine', bus: B }); }
      } else {
        if (s === 0) ch[1].forEach(function (iv) { tone({ t: t, f: mtof(root + 12 + iv), d: spb * 15, a: .3, v: .05, type: 'triangle', bus: B, lp: 1400 }); });
        if (s % 8 === 0) tone({ t: t, f: mtof(root - 12), d: spb * 7, v: .22, type: 'sine', bus: B });
        if (s % 4 === 2) { var ar2 = ch[1][(s / 4 | 0) % ch[1].length]; tone({ t: t, f: mtof(root + 24 + ar2), d: spb * 3, v: .04, type: 'sine', bus: B }); }
      }
      var m = MEL[name][bar][s]; if (m != null) { var mm = root + 12 + m + (name === 'play' ? 0 : 12); tone({ t: t, f: mtof(mm), d: spb * (name === 'play' ? 2.2 : 3.5), v: name === 'play' ? .085 : .07, type: name === 'play' ? 'square' : 'triangle', bus: B, lp: name === 'play' ? 2600 : 3000 }); tone({ t: t, f: mtof(mm + 12), d: spb * 1.5, v: .025, type: 'sine', bus: B }); }
    }
    // ---- 読み上げ ----
    var ttsOK = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function pickVoice() {
      if (!ttsOK) return; voices = speechSynthesis.getVoices() || [];
      var en = voices.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
      var pref = [/Samantha/i, /Google US English/i, /Aria/i, /Jenny/i, /Ava/i, /Allison/i, /Zira/i, /en-US/i];
      voice = null;
      for (var i = 0; i < pref.length && !voice; i++) voice = en.filter(function (v) { return pref[i].test(v.name) || pref[i].test(v.lang); })[0] || null;
      voice = voice || en[0] || null;
    }
    if (ttsOK) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { } }
    function speak(text, o) {
      if (!ttsOK || !A.on.voice || A.dead || !text) return false;
      try {
        if (!voice) pickVoice();
        if (speechSynthesis.paused) speechSynthesis.resume(); // Chrome は長く使わないと一時停止のまま固まることがある
        if ((!o || !o.queue) && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; if (voice) u.voice = voice; u.rate = (o && o.rate) || A.rate; u.pitch = 1.05; u.volume = 1;
        speechSynthesis.speak(u); return true;
      } catch (e) { return false; }
    }
    // iPhone などは、最初の読み上げを「タップの中」で呼ばないと、以後の読み上げが全部無音になる。最初のタップで無音の読み上げをして解錠する
    var ttsPrimed = false;
    A.unlock = function () {
      var c = ensure(); if (c && c.state === 'suspended') c.resume();
      if (!ttsOK) return; if (!voice) pickVoice();
      if (!ttsPrimed) { ttsPrimed = true; try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'en-US'; speechSynthesis.speak(u); } catch (e) { } }
      else if (speechSynthesis.paused) { try { speechSynthesis.resume(); } catch (e) { } }
    };
    A.sfx = function (name, p) { if (!A.on.sfx || !ensure() || A.ctx.state !== 'running') return; try { SFX[name] && SFX[name](p); } catch (e) { } };
    A.music = music;
    A.setIntensity = function (x) { A.intensity = U.clamp(x, 0, 1); };
    A.set = function (o) { if (o.vol) Object.assign(A.vol, o.vol); if (o.on) Object.assign(A.on, o.on); if (o.rate) A.rate = o.rate; applyVol(); if (!A.on.voice && ttsOK) speechSynthesis.cancel(); };
    A.speak = speak; A.ttsAvailable = function () { return ttsOK && (!!voice || !voices.length); };
    A.suspend = function () { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend(); if (ttsOK) speechSynthesis.cancel(); };
    A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); };
    A.destroy = function () { A.dead = true; stopSeq(); if (ttsOK) { try { speechSynthesis.cancel(); speechSynthesis.removeEventListener('voiceschanged', pickVoice); } catch (e) { } } if (A.ctx) { try { A.ctx.close(); } catch (e) { } } A.ctx = null; };
    if (opts) A.set(opts);
    return A;
  }
  return { create: create };
})();

/* ===== FILE: game.js ===== */
/* ===== game.js:1回のプレイ(盤面・物理・入力・スロット・得点・モード) ===== */
var Game = (function () {
  'use strict';
  var ROLE = [
    { k: 'front', ja: '前置き' }, { k: 'S', ja: 'だれが' }, { k: 'V', ja: 'する' }, { k: 'O', ja: 'なにを' }, { k: 'P', ja: 'どこ・いつ' }, { k: 'P', ja: 'どこ・いつ' }
  ];
  var MODE = {
    ta: { time: 60, max: 90, target: 22 }, daily: { time: 75, max: 99, target: 22 }, free: { time: 0, target: 22 },
    over: { time: 0, target: 18, cap: 34 }, tutorial: { time: 0, target: 0 }, shot: { time: 0, target: 0 }
  };
  // 調整値(tests/balance.sim.js でシミュレーションして決めた値。README「バランス調整」参照)
  var TUNE = { chunkTime: .5, chunkBonus3: .5, sentMin: 1, sentMax: 8, slotMul: 1.3, comboAt: 5, comboTime: 1, failX: 2, failTri: 1, chunkErr: 1, comboWin: 6, multStep: .05, multCap: 30, overStart: 2.6, overStep: .035, overMin: .55, overTime: 240, decayStart: 50, decayEnd: 150, decayMin: .15 };
  function decay(t) { return t <= TUNE.decayStart ? 1 : Math.max(TUNE.decayMin, 1 - (1 - TUNE.decayMin) * (t - TUNE.decayStart) / (TUNE.decayEnd - TUNE.decayStart)); }
  function sentExt(words, viaSlot, combo, playT) { return (U.clamp(words - 1, TUNE.sentMin, TUNE.sentMax) * (typeof viaSlot === 'number' ? viaSlot : viaSlot ? TUNE.slotMul : 1) + (combo >= TUNE.comboAt ? TUNE.comboTime : 0)) * decay(playT); }
  // スロットで割るときの倍率(埋めた枠の数で決まる。貯めるほど得)
  var SLOT_MULT = [1, 1, 1, 1.3, 1.6, 2, 2.5];
  function slotMult(n) { return SLOT_MULT[Math.min(6, n)] || 1; }
  function overInterval(sent, t) { return Math.max(TUNE.overMin, TUNE.overStart - TUNE.overStep * sent - t / TUNE.overTime); }
  function accepts(role, c) {
    if (!c) return false;
    switch (role) {
      case 'front': return c.t === 'CL' || (c.t === 'ID' && c.ik === 'front');
      case 'S': return c.t === 'NP';
      case 'V': return c.t === 'VP';
      case 'O': return c.t === 'NP' || c.t === 'AP' || c.t === 'NF' || c.t === 'PP' || (c.t === 'ADV' && c.ak === 'place') || (c.t === 'ID' && c.ik === 'place');
      case 'P': return c.t === 'PP' || c.t === 'ADV' || c.t === 'NF' || (c.t === 'ID' && c.ik !== 'front');
      case 'free': return true;
    }
    return false;
  }

  function create(app, opt) {
    var M = MODE[opt.mode] || MODE.ta, cfg = { auto: opt.auto }, S = app.settings;
    var rnd = opt.seed ? U.rng(opt.seed) : Math.random;
    var seeds = opt.mode === 'tutorial' ? null : Seeds.create(app.dict, { rnd: rnd, cfg: { auto: opt.auto }, level: opt.level || 0, maxLevel: opt.maxLevel || 2 });
    var supply = Supply.create(app.dict, { rnd: rnd, maxLevel: opt.maxLevel || 2, cfg: { auto: opt.auto }, seeds: seeds, level: opt.level || 0 });
    var g = {
      mode: opt.mode, level: opt.level, items: [], slots: [], chain: null, sel: null, drag: null, fx: [], ghosts: [], marks: [],
      score: 0, combo: 0, comboT: 0, best: 0, t: 0, time: M.time, timeMax: M.max || 0, state: 'countdown', countT: 3.2,
      spawnQ: 0, spawnT: 0, overT: TUNE.overStart, overInt: TUNE.overStart, playT: 0, failStreak: 0, segs: 0, idleT: 0, expr: 'normal', exprT: 0, blinkT: 2,
      stats: { perfect: 0, eaten: 0, shock: 0, sentences: 0, chunks: 0, words: 0, longest: '', longestN: 0, maxCombo: 0, list: [], fails: 0, past: 0, front: 0, coord: 0, clause: 0, slotS: 0 },
      hintPath: null, hintPathT: 0, hunger: 3, cand: null, guide: null, listeners: {}, noInput: false, lastTick: 99, readyT: 0, ready: null, id: 1, L: null
    };
    var free = opt.freeSlot, SHOT = opt.mode === 'shot';
    ROLE.forEach(function (r) { g.slots.push({ role: r.k, ja: r.ja, item: null }); });
    if (free && !SHOT) g.slots.push({ role: 'free', ja: 'あき', item: null });
    function on(name, fn) { (g.listeners[name] = g.listeners[name] || []).push(fn); }
    function emit(name, d) { (g.listeners[name] || []).forEach(function (f) { f(d); }); app.emit(name, d); }
    g.on = on;
    var colorMode = SHOT ? 'pos' : (opt.colorMode || 'pos'), dpr = app.dpr; // ボブルは品詞の色が狙いの手がかりなので、どのレベルでも色を出す

    // ---------- レイアウト ----------
    g.layout = function () {
      var st = app.stage, W = st.w, H = st.h, top = st.top, bot = st.bottom;
      var hud = top + 58, prev = 30, barH = 70, laneH = SHOT ? 132 : 50;
      var bar = { x: 6, y: H - bot - barH - 6, w: W - 12, h: barH };
      var lane = { x: 0, y: bar.y - laneH, w: W, h: laneH };
      var field = { x: 6, y: hud + prev + 8, w: W - 12, h: lane.y - (hud + prev + 8) };
      var n = g.slots.length, gap = 5, sw = (bar.w - 12 - gap * (n - 1)) / n, sh = barH - 16;
      g.slots.forEach(function (s, i) { s.rect = { x: bar.x + 6 + i * (sw + gap), y: bar.y + 8, w: sw, h: sh }; });
      g.L = { W: W, H: H, field: field, lane: lane, bar: bar, hudY: top, prevY: hud };
      var area = field.w * field.h, k = U.clamp(Math.sqrt(area / (378 * 560)), .8, 1.06);
      if (Math.abs(k - (g.k || 1)) > .01) { g.k = k; g.items.forEach(sizeItem); }
      g.target = M.target ? Math.round(M.target * U.clamp(area / (378 * 560), .78, 1.05)) : 0;
      g.items.forEach(function (it) { keepIn(it); });
      g.slots.forEach(function (s) { if (s.item) placeInSlot(s.item, s, true); });
    };

    // ---------- アイテム ----------
    function wordCol(w) { return colorMode === 'pos' ? Art.colorKeyOfWord(w) : 'plain'; }
    function chunkCol(c) { return colorMode === 'none' ? 'plain' : Art.colorKeyOfChunk(c); }
    function blobsOf(c) { if (colorMode !== 'pos') return []; var s = []; (c.words || []).forEach(function (w) { var k = Art.colorKeyOfWord(w); if (s.indexOf(k) < 0) s.push(k); }); return s.slice(0, 3); }
    function sizeItem(it) {
      if (it.kind === 'word') {
        it.text = G.wordText(it.word, cfg);
        var face = it.word.k === 'pr';
        var k = g.k || 1; it.fs = Math.round(15 * Math.max(.9, k) * 2) / 2;
        it.r = (face ? 30 : U.clamp(Art.measure(it.text, it.fs) / 2 + 13, 23, 46)) * k;
        it.face = face ? (G.PRON[it.word.v].pl ? 'pl' : 'one') : '';
      } else {
        it.text = G.label(it.chunk, cfg); it.full = G.chunkText(it.chunk, cfg);
        var k2 = g.k || 1; it.fs = Math.round(15 * Math.max(.9, k2) * 2) / 2;
        it.r = U.clamp(Art.measure(it.text, it.fs) / 2 + 17, 31, 56) * k2;
      }
      it.spr = null;
    }
    function spriteOf(it, slotR) {
      if (slotR) {
        return Art.sprite({ text: it.text, col: it.kind === 'word' ? wordCol(it.word) : chunkCol(it.chunk), r: slotR, kind: 'slot', shape: it.kind === 'chunk' ? Art.shapeOfChunk(it.chunk) : 'round', star: it.star, blobs: it.kind === 'chunk' ? blobsOf(it.chunk) : [], dpr: dpr, fs: 12 });
      }
      if (it.spr) return it.spr;
      var o = it.kind === 'word'
        ? { text: it.text, col: wordCol(it.word), r: Math.round(it.r), kind: 'word', shape: 'round', star: it.star, dpr: dpr, face: it.face, cyc: G.cyclable(it.word, cfg) && it.word.k !== 'n', fs: it.fs }
        : { text: it.text, col: chunkCol(it.chunk), r: Math.round(it.r), kind: 'chunk', shape: Art.shapeOfChunk(it.chunk), star: it.star, blobs: blobsOf(it.chunk), dpr: dpr, fs: it.fs };
      it.spr = Art.sprite(o); return it.spr;
    }
    function newItem(kind, payload, x, y) {
      var it = { id: g.id++, kind: kind, x: x, y: y, vx: 0, vy: 0, sc: 0, scT: 0, sq: 0, sqv: 0, ph: Math.random() * 6, born: g.t, state: 'spawn', slot: null };
      if (kind === 'word') { it.word = payload; it.star = !!payload.star; } else { it.chunk = payload; it.star = payload.t === 'ID' || (payload.words || []).some(function (w) { return w.star; }); }
      sizeItem(it); return it;
    }
    function addItem(it) { g.items.push(it); return it; }
    function removeItem(it) { var i = g.items.indexOf(it); if (i >= 0) g.items.splice(i, 1); if (it.slot) { it.slot.item = null; it.slot = null; } }
    function keepIn(it) {
      var f = g.L.field, r = Math.min(it.r, f.w / 2 - 2, f.h / 2 - 2);
      var e = it.shot ? .9 : .5, hit = false; // ショット中は壁で跳ね返る
      if (it.x < f.x + r) { it.x = f.x + r; it.vx = Math.abs(it.vx) * e; hit = true; } if (it.x > f.x + f.w - r) { it.x = f.x + f.w - r; it.vx = -Math.abs(it.vx) * e; hit = true; }
      if (it.y < f.y + r) { it.y = f.y + r; it.vy = Math.abs(it.vy) * e; hit = true; } if (it.y > f.y + f.h - r && it.state !== 'spawn') { it.y = f.y + f.h - r; it.vy = -Math.abs(it.vy) * e; hit = true; }
      if (hit && it.shot) { squash(it, 5); if (g.t - (it.shot.wallT || 0) > .08) { it.shot.wallT = g.t; app.audio.sfx('tap', 2); } }
    }
    function spawnWord(spec, x, y, instant) {
      var f = g.L.field;
      var it = spec.chunk ? newItem('chunk', spec.chunk, 0, 0) : newItem('word', spec, 0, 0);
      it.x = x != null ? x : f.x + it.r + Math.random() * (f.w - it.r * 2);
      it.y = y != null ? y : f.y + f.h + it.r * .6;
      it.vy = y != null ? 0 : -(160 + Math.random() * 80); it.vx = (Math.random() - .5) * 40;
      it.ty = f.y + it.r + Math.random() * Math.max(10, f.h * .78 - it.r);
      if (instant) { it.sc = 1; it.state = 'idle'; } else { it.state = 'spawn'; it.scT = 0; }
      return addItem(it);
    }
    g.spawnWord = spawnWord;
    function specFromSupply() {
      var s = supply.next(fieldAndSlotItems(), M.target || 22, opt.mode === 'tutorial' ? 0 : .07);
      if (!s) return null;
      // 手動のとき、タネ文の語は原形で出す(形はプレイヤーが選ぶ)
      if (s.k === 'v') s.f = 'base'; if (s.k === 'sm') s.t = 'pres'; if (s.k === 'be') s.v = 'pres';
      if (s.k === 'idm') { var st = G.chainState([s], cfg); if (st.complete && st.chunk) { st.chunk.words[0].star = 1; return { chunk: st.chunk }; } }
      return s;
    }
    function fieldAndSlotItems() { return g.items.filter(function (i) { return i.state !== 'pop'; }).concat(g.slots.filter(function (s) { return s.item; }).map(function (s) { return s.item; })); }
    function liveCount() { return g.items.filter(function (i) { return i.state !== 'pop' && i.state !== 'merge'; }).length; }

    // ---------- 物理 ----------
    function physics(dt) {
      var its = g.items, f = g.L.field, hits = [];
      for (var i = 0; i < its.length; i++) {
        var a = its[i]; if (a.state === 'pop' || a.state === 'merge' || a.slot) continue;
        if (a.lift) continue;
        var still = a.inChain || a === (g.sel && g.sel.item) || (g.drag && a.state !== 'spawn');
        if (a.state === 'spawn') { a.scT += dt; a.sc = U.E.outBack(U.clamp(a.scT / .35, 0, 1)); if (a.y > (a.ty || 0)) a.vy -= 520 * dt; else a.vy *= .8; if (a.y > f.y + f.h + a.r) a.y = f.y + f.h + a.r; if ((a.scT > .35 && a.y <= (a.ty || f.y + f.h - a.r) + 4) || a.scT > 2.2) { a.state = 'idle'; keepIn(a); } }
        if (SHOT && aim && aim.it === a) { a.vx = a.vy = 0; continue; } // ねらっている間は止める
        if (a.shot) { // 動いているバブル(ビリヤードのように転がる)
          a.vx *= Math.pow(.983, dt * 60); a.vy *= Math.pow(.983, dt * 60); a.x += a.vx * dt; a.y += a.vy * dt;
          if (Math.hypot(a.vx, a.vy) < 55 || g.t - a.shot.t > 5) shotEnd(a);
          continue;
        }
        if (!still) { var dk = g.calm ? .12 : 1; a.vx += (Math.sin(g.t * .7 + a.ph) * 9 + (Math.random() - .5) * 18) * dt * dk; a.vy += (Math.cos(g.t * .6 + a.ph * 1.3) * 9 + (Math.random() - .5) * 18) * dt * dk; }
        var damp = still ? (g.drag ? .7 : .82) : a.state === 'spawn' ? .985 : .965; a.vx *= Math.pow(damp, dt * 60); a.vy *= Math.pow(damp, dt * 60);
        var sp = Math.hypot(a.vx, a.vy), mx = a.state === 'spawn' ? 400 : 60; if (sp > mx) { a.vx *= mx / sp; a.vy *= mx / sp; }
        a.x += a.vx * dt; a.y += a.vy * dt;
      }
      for (i = 0; i < its.length; i++) {
        var p = its[i]; if (p.state === 'pop' || p.state === 'merge' || p.slot || p.lift) continue;
        for (var j = i + 1; j < its.length; j++) {
          var q = its[j]; if (q.state === 'pop' || q.state === 'merge' || q.slot || q.lift) continue;
          var dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || .01, min = (p.r + q.r) * (p.sc * .5 + .5) * .96 + 3;
          var far = (p.r + q.r) * 1.9;
          if (d < far && !g.drag) { var fk = (1 - d / far) * 70 * dt, fx = dx / d * fk, fy = dy / d * fk; if (!p.inChain) { p.vx -= fx; p.vy -= fy; } if (!q.inChain) { q.vx += fx; q.vy += fy; } }
          if (d < min && SHOT && (p.shot || q.shot)) {
            var sh = p.shot && (!q.shot || p.shot.main) ? p : q, ot = sh === p ? q : p;
            if (sh.shot.main && !sh.shot.tried[ot.id]) { sh.shot.tried[ot.id] = 1; hits.push([sh, ot]); }
            var nx0 = dx / d, ny0 = dy / d;
            if (sh.shot.pierce && sh.shot.main) { // 貫通:止まらずに通り抜け、相手は横へはじく
              var sgn = sh === p ? 1 : -1; if (shotMerge(sh, ot)) { var o1 = (min - d) / 2; p.x -= nx0 * o1; p.y -= ny0 * o1; q.x += nx0 * o1; q.y += ny0 * o1; continue; } var px = -sh.vy, py = sh.vx, pl = Math.hypot(px, py) || 1, side = ((ot.x - sh.x) * px + (ot.y - sh.y) * py) > 0 ? 1 : -1;
              ot.vx += px / pl * side * 35; ot.vy += py / pl * side * 35; var o2 = (min - d) / 2; ot.x += (ot === q ? 1 : -1) * nx0 * o2 * 2; ot.y += (ot === q ? 1 : -1) * ny0 * o2 * 2; continue;
            }
            // 弾性衝突(重さは半径の2乗)。止まっていた相手も勢いよく転がり出す
            var mp = p.r * p.r, mq = q.r * q.r, rv = (q.vx - p.vx) * nx0 + (q.vy - p.vy) * ny0;
            if (rv < 0) { var jj = -(1 + .95) * rv / (1 / mp + 1 / mq); p.vx -= jj / mp * nx0; p.vy -= jj / mp * ny0; q.vx += jj / mq * nx0; q.vy += jj / mq * ny0; knock(ot, sh.shot); squash(ot, 6); if (Math.abs(rv) > 300) app.audio.sfx('tap', 1); }
            var o0 = (min - d) / 2; p.x -= nx0 * o0; p.y -= ny0 * o0; q.x += nx0 * o0; q.y += ny0 * o0;
            continue;
          }
          if (d < min) {
            var o = (min - d) / 2, nx = dx / d, ny = dy / d, pw = p.inChain ? .15 : 1, qw = q.inChain ? .15 : 1, s = pw + qw;
            p.x -= nx * o * pw * 2 / s; p.y -= ny * o * pw * 2 / s; q.x += nx * o * qw * 2 / s; q.y += ny * o * qw * 2 / s;
            p.vx -= nx * 12 * pw; p.vy -= ny * 12 * pw; q.vx += nx * 12 * qw; q.vy += ny * 12 * qw;
          }
        }
        keepIn(p);
      }
      its.forEach(function (it) { var k = 180, d = 12; it.sqv += (-k * it.sq - d * it.sqv) * dt; it.sq += it.sqv * dt; });
      hits.forEach(function (h) { if (h[0].shot && g.items.indexOf(h[0]) >= 0 && g.items.indexOf(h[1]) >= 0 && h[1].state !== 'pop' && h[1].state !== 'merge') shotHit(h[0], h[1]); });
    }
    function squash(it, v) { it.sqv += v || 6; }

    // ---------- 連鎖(単語 → チャンク) ----------
    function chainWords() { return g.chain ? g.chain.items.map(function (i) { return i.word; }) : []; }
    function updateChainState() { if (!g.chain) return; g.chain.st = G.chainState(chainWords(), cfg); g.chain.last = g.t; refreshCand(); previewChain(); }
    function previewChain() {
      if (!g.chain) return;
      var st = g.chain.st, txt = st.complete && st.chunk ? G.chunkText(st.chunk, cfg) : g.chain.items.map(function (i) { return i.text; }).join(' ');
      app.ui.preview(txt, st.complete ? (st.err ? 'bad' : 'ok') : 'wait', st.err ? st.err.msg : '');
    }
    function startChain(it) { g.chain = { items: [it], last: g.t, t0: g.t }; it.inChain = true; squash(it, 8); app.audio.sfx('tap', 0); updateChainState(); emit('chainStart', { item: it }); }
    // つないだ結果が形の誤りだけなら、動詞の形を合うものに自動で回す(be + arrive → be arriving)。あとからタップで変えられる
    function fitForms(items) {
      var ws = items.map(function (i) { return i.word; }), st = G.chainState(ws, cfg);
      if (!st.err) return st;
      for (var k = 0; k < items.length; k++) {
        var w = ws[k]; if (w.k !== 'v') continue;
        var f0 = w.f;
        for (var c = 0; c < 3; c++) { G.cycleWord(w, cfg); var s2 = G.chainState(ws, cfg); if (!s2.err && (s2.complete || s2.prefix)) { sizeItem(items[k]); items.formFixed = true; return s2; } }
        w.f = f0;
      }
      return st;
    }
    function addToChain(it) { g.chain.items.push(it); it.inChain = true; fitForms(g.chain.items); if (g.chain.items.formFixed) { g.chain.fixed = true; g.chain.items.formFixed = false; } squash(it, 8); app.audio.sfx('tap', g.chain.items.length - 1); updateChainState(); emit('chainAdd', { item: it }); }
    function clearChain() { if (!g.chain) return; g.chain.items.forEach(function (i) { i.inChain = false; }); g.chain = null; refreshCand(); app.ui.preview('', ''); }
    function scatterChain(msg) {
      var its = g.chain.items, st = g.chain.st;
      its.forEach(function (i) { i.vx += (Math.random() - .5) * 160; i.vy += (Math.random() - .5) * 160; squash(i, -6); });
      var text = its.map(function (i) { return i.text; }).join(' ');
      var m = msg || (st && st.err ? st.err.msg : G.MSG.chain({ t: text }));
      var c = centroid(its); toast(m, st && st.err ? 'x' : 'tri', c.x, c.y);
      app.audio.sfx('scatter'); clearChain(); breakCombo(); setExpr('sad', 1);
      if (st && st.err && !msg) { g.stats.fails++; emit('fail', { kind: 'chunk', code: st.err.code }); }
    }
    function confirmChain() {
      var ch = g.chain; if (!ch) return null;
      if (ch.items.length < 2) { var only = ch.items[0]; clearChain(); return only || null; } // 1語だけではチャンクにしない
      var st = ch.st; if (!st.complete) { scatterChain(); return null; }
      if (st.err) { scatterChain(); return null; }
      var its = ch.items, c = centroid(its), chunk = st.chunk;
      if (chunk.t === 'NP' && chunk.merged) {
        var mw = { k: 'pr', v: chunk.pron }; chunk = G.chainState([mw], cfg).chunk;
      }
      clearChain();
      // 1語の慣用句・接続詞などはチャンク化しても見た目が同じなので、そのまま確定
      its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
      var ni = newItem('chunk', chunk, c.x, c.y); ni.state = 'grow'; ni.scT = -.12; addItem(ni);
      var n = its.length;
      g.chunksSince++; g.segs = Math.min(10, g.segs + 1);
      g.stats.chunks++;
      var fixed = ch.fixed;
      if (fixed) triMark('△ 正しい順番:' + G.chunkText(chunk, cfg), c.x, c.y - ni.r); else addCombo(1);
      var pts = Math.round(10 * Math.max(1, n) * mult() * (fixed ? .5 : 1)); addScore(pts, c.x, c.y - ni.r);
      if (M.time) addTime((TUNE.chunkTime + (n >= 3 ? TUNE.chunkBonus3 : 0)) * decay(g.playT));
      app.audio.sfx('chunk', n); if (n > 1 || chunk.t === 'VP' || chunk.t === 'NP') speak(ni.full);
      burst(c.x, c.y, Art.COL[chunkCol(chunk)], 10 + n * 3);
      if (S.gloss) { var gl = G.gloss(chunk); if (gl) g.marks.push({ item: ni, text: gl, t: 0, d: 1.8 }); }
      setExpr('joy', .7);
      emit('chunk', { item: ni, chunk: chunk, n: n }); g.lastMade = { item: ni, t: g.t };
      refill(); return ni;
    }
    function centroid(its) { var x = 0, y = 0; its.forEach(function (i) { x += i.x; y += i.y; }); return { x: x / its.length, y: y / its.length }; }

    // ---------- 選択・差し込み ----------
    function select(it) {
      if (g.sel && g.sel.item === it) {
        // もう一度タップ:切り替えられる部品を回す
        if (cycleChunk(it)) { g.sel.t = g.t; return; }
      }
      g.sel = { item: it, t: g.t }; squash(it, 5); app.audio.sfx('select');
      speak(it.full || it.text); showTip(it); refreshCand(); emit('select', { item: it });
      app.ui.preview(it.full || it.text, 'sel');
    }
    function deselect() { if (!g.sel) return; g.sel = null; app.ui.tip(null); refreshCand(); app.ui.preview('', ''); }
    function cycleChunk(it) {
      var c = it.chunk; if (!c || c.t === 'CL') return false;
      var order = ['ti', 'be', 'v', 'modal', 'prep', 'det', 'pr', 'n', 'er', 'conj'];
      for (var o = 0; o < order.length; o++) {
        var ws = c.words.filter(function (w) { return w.k === order[o]; });
        for (var k = 0; k < ws.length; k++) {
          var w = ws[k], save = JSON.stringify({ v: w.v, f: w.f, pl: w.pl });
          for (var tries = 0; tries < 6; tries++) {
            if (!G.cycleWord(w, cfg)) break;
            var r = G.rebuild(c, cfg);
            if (r.chunk && !r.err) { it.chunk = r.chunk; sizeItem(it); squash(it, 7); app.audio.sfx('cycle'); speak(it.full); showTip(it); return true; }
          }
          var sv = JSON.parse(save); w.v = sv.v; w.f = sv.f; w.pl = sv.pl;
        }
      }
      return false;
    }
    function showTip(it) { var gl = it.chunk ? G.gloss(it.chunk) : ''; app.ui.tip(it.full || it.text, S.gloss ? gl : '', it.x, it.y - it.r - 6); }
    function tryInsertInto(target, wi) {
      var nc = G.tryInsert(target.chunk, wi.word, cfg); if (!nc) return false;
      ghostTo(wi, target.x, target.y); removeItem(wi);
      target.chunk = nc; sizeItem(target); squash(target, 10);
      if (target.slot) { if (accepts(target.slot.role, nc)) placeInSlot(target, target.slot, true); else { var sl = target.slot; sl.item = null; target.slot = null; target.state = 'idle'; target.x = sl.rect.x + sl.rect.w / 2; target.y = g.L.field.y + g.L.field.h - 40; addItem(target); keepIn(target); slotsChanged(); } }
      app.audio.sfx('insert'); speak(target.full); burst(target.x, target.y, Art.COL[chunkCol(nc)], 8);
      addCombo(1); addScore(Math.round(8 * mult()), target.x, target.y - target.r);
      g.sel.t = g.t; showTip(target); emit('insert', { item: target }); refill(); return true;
    }

    // ---------- 一筆書き・ドラッグ ----------
    function tokenOf(it) {
      if (it.chunk) return it.chunk;
      var st = G.chainState([it.word], cfg); return st.complete && !st.err ? st.chunk : null;
    }
    function unitOf(it) { return it.chunk ? { chunk: it.chunk, words: it.chunk.words || [] } : { words: [it.word] }; }
    function strokeTokens() { return G.strokeTokens(g.drag.items.map(unitOf), cfg) || []; }
    function strokeOK() { return !!G.strokeTokens(g.drag.items.map(unitOf), cfg); }
    // なぞりの並びとしてつながる見込みがあるか(1語ではチャンクにならない can / want to / the なども含めて判定)
    var PEND_SAMPLES = null;
    function pendSamples() {
      if (PEND_SAMPLES) return PEND_SAMPLES;
      var n = app.dict.all('noun').filter(function (e) { return e.c === 'c' && !e.ind && e.cat !== 'time' && e.cat !== 'place'; })[0], v = app.dict.all('verb').filter(function (e) { return e.fr === 'both'; })[0];
      PEND_SAMPLES = [[{ k: 'n', e: n }], [{ k: 'det', v: 'the' }, { k: 'n', e: n }], [{ k: 'v', e: v, f: 'base' }]];
      return PEND_SAMPLES;
    }
    function okSeq(seq) {
      var T2 = G.strokeTokens(seq.map(unitOf), cfg, true), allW = [].concat.apply([], seq.map(function (i) { return unitOf(i).words; }));
      if (allW.length <= 6 && G.asChunk(allW, cfg).prefix && seq.length === 1) return true;
      if (!T2) return allW.length <= 6 && !!G.asChunk(allW, cfg).prefix;
      if (T2.pend) { var pc = G.completePend(T2.pend, cfg, pendSamples()); if (!pc) return false; T2 = T2.slice(); T2.push(pc); }
      // 副詞句などのあとに主語なしで動詞が来る並び(yesterday + run)は候補にしない
      var iv = -1, inp = -1; T2.forEach(function (t, k) { if (iv < 0 && t.t === 'VP') iv = k; if (inp < 0 && (t.t === 'NP' || t.t === 'CL')) inp = k; });
      if (iv > 0 && (inp < 0 || inp > iv)) return false;
      return G.viable(T2, true) || (allW.length <= 6 && !!G.asChunk(allW, cfg).chunk);
    }
    function strokeAdd(it) {
      var d = g.drag;
      if (d.items.indexOf(it) >= 0) {
        // 1つ前のバブルの上で0.3秒とどまったら、最後の1つを取り消す(通り過ぎただけでは取り消さない)
        if (d.items.length >= 2 && d.items[d.items.length - 2] === it) { if (d.backIt !== it) { d.backIt = it; d.backT = g.t; } else if (g.t - d.backT > .3) { d.items.pop(); d.backIt = null; app.audio.sfx('cycle'); strokePreview(); refreshCand(); } }
        return;
      }
      d.backIt = null;
      if (!tokenOf(it) && it.kind === 'word' && !G.chainState([it.word], cfg).prefix) { if (!it.noFlash || g.t - it.noFlash > .6) { it.noFlash = g.t; squash(it, -4); } return; }
      if (guideBlocks(it)) return;
      // 文として成り立たなくなるバブルは拾わない(赤く揺れるだけ)
      if (!okSeq(d.items.concat([it]))) {
        // 通りがかりに拾った直前のバブルが邪魔なら、それを外して今のバブルを拾う(指の行き先を優先)
        if (d.items.length >= 2 && okSeq(d.items.slice(0, -1).concat([it]))) { var dropped = d.items.pop(); squash(dropped, -3); d.items.push(it); squash(it, 8); app.audio.sfx('link', d.items.length - 1); strokePreview(); refreshCand(); return; }
        if (!it.badT || g.t - it.badT > .6) { it.badT = g.t; squash(it, -5); app.audio.sfx('reject'); } return; }
      if (d.items.length === 1 && d.lifted) { unlift(d.lifted); d.lifted = null; }
      d.items.push(it); squash(it, 8); app.audio.sfx('link', d.items.length - 1); strokePreview(); refreshCand();
    }
    function strokePreview() {
      var T = G.strokeTokens(g.drag.items.map(unitOf), cfg);
      var ac0 = g.drag.items.length > 1 ? G.asChunk([].concat.apply([], g.drag.items.map(function (i) { return unitOf(i).words; })), cfg) : null;
      if (!T || (ac0 && ac0.chunk && !(T && G.parse(T, cfg).ok))) { g.drag.ok = !!(ac0 && ac0.chunk); g.drag.viable = true; app.ui.preview(ac0 && ac0.chunk ? G.chunkText(ac0.chunk, cfg) : g.drag.items.map(function (i) { return i.text; }).join(' '), ac0 && ac0.chunk ? 'ok' : 'wait', ac0 && ac0.chunk ? 'はなすとチャンクになる' : ''); return; }
      var r = G.parse(T, cfg), v = G.viable(T);
      g.drag.ok = r.ok; g.drag.viable = v;
      app.ui.preview(r.ok ? r.text : T.map(function (t) { return G.chunkText(t, cfg); }).join(' '), r.ok ? 'ok' : v ? 'wait' : 'bad', '');
    }
    function lift(it) { it.lift = true; it.liftFrom = { x: it.x, y: it.y, slot: it.slot }; squash(it, 6); }
    function unlift(it) { it.lift = false; if (it.liftFrom && it.liftFrom.slot) placeInSlot(it, it.liftFrom.slot, true); else if (it.liftFrom) { it.x = it.liftFrom.x; it.y = it.liftFrom.y; } it.liftFrom = null; }
    function endDrag(x, y) {
      var d = g.drag; g.drag = null; refreshCand();
      if (!d) return;
      if (d.carry && d.items[0]) { var ci = d.items[0]; d.items.slice(1).forEach(function (i) { if (i.lift) unlift(i); }); if (inKun(x, y)) { eat(ci); return; } ci.lift = false; dropToSlot(ci, slotAt(x, y), d); return; }
      if (d.items.length >= 2) { unliftAll(d); evalStroke(d.items, x, y, inBar(x, y)); return; }
      var it = d.items[0]; if (!it) return;
      var si = slotAt(x, y);
      if (si != null || inBar(x, y)) { if (it.lift) it.lift = false; dropToSlot(it, si, d); return; }
      if (it.lift) {
        it.lift = false;
        if (it.slot) { var s = it.slot; s.item = null; it.slot = null; it.state = 'idle'; app.audio.sfx('slot'); slotsChanged(); }
        it.x = x; it.y = y; it.vx = it.vy = 0; keepIn(it); squash(it, 6);
        if (g.items.indexOf(it) < 0) addItem(it);
      }
      app.ui.preview('', '');
    }
    function unliftAll(d) { d.items.forEach(function (i) { if (i.lift) unlift(i); }); if (d.lifted && d.lifted.lift) unlift(d.lifted); }
    function evalStroke(its, x, y, toBar) {
      var T = G.strokeTokens(its.map(unitOf), cfg), r0 = T && G.parse(T, cfg); g.debug.lastStroke = its.map(function (i) { return i.text; }).join(' + ');
      if (!(r0 && r0.ok)) {
        // なぞった語がまとめて1つのチャンクになるなら、チャンクにする(順番が違っても並べ直す)
        var allW = [].concat.apply([], its.map(function (i) { return unitOf(i).words; })), ac = allW.length <= 6 ? G.asChunk(allW, cfg) : null;
        if (ac && ac.chunk) { makeChunkFrom(its, ac.chunk, x, y, ac.words !== allW); return; }
        if (T && G.viable(T, true)) { makeFrag(its, T, x, y, toBar); return; }
      }
      // うまくいかないときは、はじめと終わりを残して途中で拾ったものを外してみる
      if (!(r0 && r0.ok) && its.length >= 3 && !its.retry) {
        var mid = its.length - 2, bestS = null;
        for (var m = (1 << mid) - 2; m >= 0 && !bestS; m--) {
          var sub = [its[0]]; for (var b = 0; b < mid; b++) if (m & (1 << b)) sub.push(its[b + 1]); sub.push(its[its.length - 1]);
          var Ts = G.strokeTokens(sub.map(unitOf), cfg), rs = Ts && G.parse(Ts, cfg), aw = [].concat.apply([], sub.map(function (i) { return unitOf(i).words; }));
          if ((rs && rs.ok) || (aw.length <= 6 && G.asChunk(aw, cfg).chunk)) bestS = sub;
        }
        if (bestS) { bestS.retry = true; evalStroke(bestS, x, y, toBar); return; }
      }
      if (!T) { failMark({ sev: 2, err: G.err('chain', { t: its.map(function (i) { return i.text; }).join(' ') }) }, x, y); return; }
      var r = r0; g.debug.lastT = T.map(function (t) { return t.t + ':' + G.chunkText(t, cfg); }).join(' | ');
      // 下のバーで離したら、完成した文でもスロットに入れる(貯めて「わる!」)
      if (toBar && T.length >= 2) { makeFrag(its, T, x, y, true); return; }
      if (r.ok && r.kind === 'S') { sentence(its, T, r, false); return; }
      if (r.ok && r.kind === 'CL') {
        var fi = its.filter(function (i) { return !i.slot; }), c = fi.length ? centroid(fi) : { x: U.clamp(x, g.L.field.x + 40, g.L.field.x + g.L.field.w - 40), y: g.L.field.y + g.L.field.h - 60 };
        its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
        var ni = addItem(newItem('chunk', G.makeClause(T, r), c.x, c.y)); ni.state = 'grow'; ni.scT = -.1;
        app.audio.sfx('chunk', 4); speak(r.text); addCombo(2); addScore(Math.round(40 * mult()), c.x, c.y - 30); burst(c.x, c.y, Art.COL.link, 18);
        setExpr('idea', 1); emit('clause', { item: ni }); refill(); slotsChanged(); app.ui.preview('', ''); return;
      }
      failMark(r, x, y);
    }
    // まだ文になっていない並びは「文のかけら」として残す。あとで他のチャンクやスロットとつなげられる
    function makeFrag(its, T, x, y, toBar) {
      var fi = its.filter(function (i) { return !i.slot; }), c = fi.length ? centroid(fi) : { x: U.clamp(x, g.L.field.x + 40, g.L.field.x + g.L.field.w - 40), y: g.L.field.y + g.L.field.h - 60 };
      its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
      var ni = addItem(newItem('chunk', G.makeFrag(T), c.x, c.y)); ni.state = 'grow'; ni.scT = -.1;
      app.audio.sfx('chunk', 3); speak(ni.full); if (!toBar) toast('文のかけら。つづきをつなげよう', 'info', c.x, c.y - 40);
      emit('frag', { item: ni }); refill(); slotsChanged(); app.ui.preview('', '');
      if (toBar) dropToSlot(ni, null, {});
    }
    // かけら・複数のチャンクをスロットに分けて入れる(S V → だれが・する)
    function spreadToSlots(it) {
      var parts = it.chunk.parts, x = it.x, y = it.y, from = it.slot; removeItem(it); if (it.lift) it.lift = false;
      var placed = 0, left = [];
      parts.forEach(function (p) {
        var t = freeSlotFor(p);
        var ci = newItem('chunk', p, x, y); ci.sc = 1; ci.state = 'idle';
        if (t) { placeInSlot(ci, t); placed++; } else left.push(ci);
      });
      left.forEach(function (ci, k) { ci.x = U.clamp(x + k * 30, g.L.field.x + 40, g.L.field.x + g.L.field.w - 40); ci.y = g.L.field.y + g.L.field.h - 50; addItem(ci); keepIn(ci); });
      if (left.length) toast('入らない部分は上にもどした', 'tri', x, y - 30);
      emit('slot', { item: it, role: 'spread' }); slotsChanged(); app.ui.preview('', ''); refill();
    }
    function triMark(text, x, y) { toast(text, 'tri', x, y); app.audio.sfx('tri'); g.fx.push({ type: 'mark', x: x, y: y, tri: true, t: 0, d: .9 }); setExpr('think', 1); }
    function makeChunkFrom(its, chunk, x, y, fixed) {
      var fi = its.filter(function (i) { return !i.slot; }), c = fi.length ? centroid(fi) : { x: x, y: y }, n = chunk.words.length;
      its.forEach(function (i) { ghostTo(i, c.x, c.y); removeItem(i); });
      var ni = newItem('chunk', chunk, c.x, c.y); ni.state = 'grow'; ni.scT = -.12; addItem(ni);
      g.chunksSince++; g.segs = Math.min(10, g.segs + 1); g.stats.chunks++;
      if (fixed) triMark('△ 正しい順番:' + G.chunkText(chunk, cfg), c.x, c.y - ni.r); else addCombo(1);
      addScore(Math.round(10 * n * mult() * (fixed ? .5 : 1)), c.x, c.y - ni.r); if (M.time) addTime((TUNE.chunkTime + (n >= 3 ? TUNE.chunkBonus3 : 0)) * decay(g.playT));
      app.audio.sfx('chunk', n); speak(ni.full); burst(c.x, c.y, Art.COL[chunkCol(chunk)], 10 + n * 3);
      if (S.gloss) { var gl = G.gloss(chunk); if (gl) g.marks.push({ item: ni, text: gl, t: 0, d: 1.8 }); }
      setExpr('joy', .7); emit('chunk', { item: ni, chunk: chunk, n: n }); refill(); slotsChanged(); app.ui.preview('', '');
    }
    function failMark(r, x, y) {
      var tri = r.sev === 1;
      toast(r.err.msg, tri ? 'tri' : 'x', x, y); app.audio.sfx(tri ? 'tri' : 'fail');
      if (!tri) penalty(TUNE.failX); breakCombo(); setExpr(tri ? 'think' : 'sad', 1.2); g.stats.fails++; g.failStreak++;
      g.fx.push({ type: 'mark', x: x, y: y, tri: tri, t: 0, d: .9 });
      emit('fail', { kind: 'sentence', code: r.err.code }); app.ui.preview('', '');
    }

    // ---------- スロット ----------
    function slotAt(x, y) { for (var i = 0; i < g.slots.length; i++) { var r = g.slots[i].rect; if (x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 10 && y <= r.y + r.h + 8) return i; } return null; }
    function kunPos() { var lane = g.L.lane; return { x: 46, y: lane.y + lane.h * .55 }; }
    function inKun(x, y) { var k = kunPos(); return Math.hypot(x - k.x, y - k.y) < 46; }
    function eat(it) {
      if (g.hunger <= 0) { bounceBack(it, 'おなかいっぱい…文を作ると、また食べられる'); setExpr('sad', .8); return; }
      g.hunger--; var k = kunPos(), fromSlot = !!it.slot;
      ghostTo(it, k.x - 10, k.y); removeItem(it); it.lift = false;
      app.audio.sfx('insert'); setTimeout(function () { if (!g.dead) app.audio.sfx('pop'); }, 160);
      setExpr('joy', .9); g.stats.eaten++; g.fx.push({ type: 'txt', x: k.x + 30, y: k.y - 34, text: 'もぐもぐ', t: 0, d: .9, ja: 1 });
      emit('eat', { item: it }); if (fromSlot) slotsChanged(); refill(); app.ui.preview('', '');
    }
    function inBar(x, y) { var b = g.L.bar; return x >= b.x && x <= b.x + b.w && y >= b.y - 6 && y <= b.y + b.h + 20; }
    function placeInSlot(it, s, quiet) {
      it.slot = s; s.item = it; it.state = 'slot'; it.lift = false;
      it.x = s.rect.x + s.rect.w / 2; it.y = s.rect.y + s.rect.h / 2; it.vx = it.vy = 0;
      var i = g.items.indexOf(it); if (i >= 0) g.items.splice(i, 1);
      if (!quiet) { squash(it, 8); app.audio.sfx('slot'); }
    }
    function dropToSlot(it, si, d) {
      var tok = tokenOf(it), from = it.liftFrom && it.liftFrom.slot;
      if (!tok) { bounceBack(it, 'このままではスロットに入らない'); return; }
      if (tok.t === 'FR') { spreadToSlots(it); return; }
      var target = si != null ? g.slots[si] : null;
      if (guideBlocks(it, target)) { bounceBack(it); return; }
      if (!target || !accepts(target.role, tok)) target = freeSlotFor(tok) || (target && accepts(target.role, tok) ? target : null);
      if (!target) { bounceBack(it, '入れられるスロットがない'); return; }
      // 単語は1語チャンクにして入れる
      if (it.kind === 'word') { var ci = newItem('chunk', tok, it.x, it.y); ci.sc = 1; ci.state = 'idle'; removeItem(it); it = ci; }
      if (target.item && target.item !== it) { var old = target.item; old.slot = null; target.item = null; if (from && accepts(from.role, tokenOf(old))) placeInSlot(old, from, true); else { old.state = 'idle'; old.x = target.rect.x + target.rect.w / 2; old.y = g.L.field.y + g.L.field.h - 30; addItem(old); keepIn(old); } }
      if (it.slot && it.slot !== target) { it.slot.item = null; it.slot = null; }
      placeInSlot(it, target); it.liftFrom = null;
      emit('slot', { item: it, role: target.role }); slotsChanged(); app.ui.preview('', '');
      refill();
    }
    // 空いているスロットを、チャンクの種類に合う順に選ぶ(前置詞句はまず「どこで・いつ」、名詞はまず「だれが」)
    function freeSlotFor(tok) {
      var pref = tok.t === 'NP' ? ['S', 'O', 'free'] : tok.t === 'VP' ? ['V', 'free'] : (tok.t === 'PP' || tok.t === 'ADV' || tok.t === 'ID') ? ['front', 'P', 'O', 'free'] : tok.t === 'CL' ? ['front', 'free'] : ['O', 'P', 'free'];
      for (var k = 0; k < pref.length; k++) { var sl = g.slots.filter(function (s) { return !s.item && s.role === pref[k] && accepts(s.role, tok); })[0]; if (sl) return sl; }
      return g.slots.filter(function (s) { return !s.item && accepts(s.role, tok); })[0] || null;
    }
    function bounceBack(it, msg) { if (it.lift) unlift(it); if (it.slot) placeInSlot(it, it.slot, true); squash(it, -8); app.audio.sfx('reject'); if (msg) toast(msg, 'tri', it.x, it.y - 30); }
    function slotTokens() { return g.slots.filter(function (s) { return s.role !== 'free' && s.item; }).map(function (s) { return s.item; }); }
    function slotsChanged() {
      var sItem = g.slots[1].item, vItem = g.slots[2].item; g.ready = null;
      if (!sItem || !vItem) { g.slotErr = null; return; }
      var its = slotTokens(), T = its.map(tokenOf), r = G.parse(T, cfg);
      if (r.ok && r.kind === 'S') { var sm0 = slotMult(its.length); g.ready = { its: its, T: T, r: r, t: g.t, mult: sm0 }; g.slotErr = null; app.audio.sfx('ready'); app.ui.preview(r.text, 'ok', '「わる!」で決定 ×' + sm0.toFixed(1) + '(貯めるほどアップ)'); }
      else { g.slotErr = r.err; app.ui.preview(T.map(function (t) { return G.chunkText(t, cfg); }).join(' '), 'bad', r.err ? r.err.msg : ''); }
    }
    function confirmSlots() { var rd = g.ready; if (!rd) return; g.ready = null; sentence(rd.its, rd.T, rd.r, rd.mult); }

    // ---------- 文の完成 ----------
    function sentence(its, T, r, viaSlot) {
      var words = G.wordCount(T), n = T.length;
      its.forEach(function (it, i) { it.state = 'pop'; it.popT = -i * .07; it.inChain = false; it.lift = false; if (it.slot) { var s = it.slot; s.item = null; it.slot = null; it.fromSlot = true; g.items.push(it); } else if (g.items.indexOf(it) < 0) g.items.push(it); });
      if (g.sel && its.indexOf(g.sel.item) >= 0) deselect();
      var base = 20 * words + 35 * (n - 1) + (r.info.front ? 80 : 0) + (r.info.clause ? 150 : 0) + (r.info.coord ? 150 : 0) + its.filter(function (i) { return i.star; }).length * 40;
      var sm = typeof viaSlot === 'number' ? viaSlot : 1, perfect = supply.matchSeed(r.text);
      if (perfect) { base = base * 1.5 + 200; g.stats.perfect++; }
      addCombo(2);
      var pts = Math.round(base * mult() * sm); var fi = its.filter(function (i) { return !i.fromSlot; }), c = fi.length ? centroid(fi) : { x: g.L.W / 2, y: g.L.bar.y - 60 }; addScore(pts, c.x, c.y - 20, true);
      g.hunger = Math.min(3, g.hunger + 1);
      var shock = aftershock(its, c, words, sm);
      if (M.time) addTime(sentExt(words, typeof viaSlot === 'number' ? 1 + (sm - 1) * .5 : viaSlot, g.combo, g.playT));
      g.stats.sentences++; g.stats.words += words; if (words > g.stats.longestN) { g.stats.longestN = words; g.stats.longest = r.text; }
      if (r.info.past) g.stats.past++; if (r.info.front) g.stats.front++; if (r.info.coord) g.stats.coord++; if (r.info.clause) g.stats.clause++; if (viaSlot) g.stats.slotS++;
      g.stats.list.push({ text: r.text, words: words, pts: pts });
      app.audio.sfx('sentence', Math.min(4, n)); if (perfect) setTimeout(function () { if (!g.dead) app.audio.sfx('best'); }, 350); speak(r.text, true);
      app.ui.banner(r.text, r.marks, pts, { slot: sm > 1 ? sm : 0, perfect: perfect, shock: shock });
      if (perfect) g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + g.L.field.h * .3, text: 'PERFECT!', t: 0, d: 1.6, big: 2 });
      setExpr('joy', 1.8, true);
      popSegs(); g.failStreak = 0;
      if (opt.mode === 'over') g.overSent = (g.overSent || 0) + 1;
      emit('sentence', { text: r.text, words: words, points: pts, slot: sm > 1 ? sm : !!viaSlot, info: r.info, perfect: perfect, shock: shock });
      app.ui.preview('', ''); slotsChanged(); refill();
      app.audio.setIntensity(.35 + Math.min(.65, g.combo / 20));
    }
    // 余波:はじけた近くの「余り物の機能語」も割れる。長い文・大きな倍率ほど広い
    var FUNC = /^(det|q|prep|er|ti|conj|modal|not|deg|tp|sm)$/;
    function aftershock(its, c, words, sm) {
      var R = Math.min(280, (90 + 18 * words) * (sm > 1 ? 1 + (sm - 1) * .4 : 1)), n = 0;
      g.items.forEach(function (it) {
        if (its.indexOf(it) >= 0 || it.state !== 'idle' || it.inChain || it.kind !== 'word' || !FUNC.test(it.word.k) || (g.sel && g.sel.item === it)) return;
        var d = Math.hypot(it.x - c.x, it.y - c.y); if (d > R) return;
        it.state = 'pop'; it.popT = -(.18 + d / 700); n++;
      });
      g.fx.push({ type: 'ring', x: c.x, y: c.y, t: 0, d: .6, col: Art.COL.prep, big: R });
      if (n) { var p = Math.round(8 * n * mult()); addScore(p); g.stats.shock += n; g.fx.push({ type: 'txt', x: c.x, y: c.y + 30, text: '余波 ×' + n, t: 0, d: 1.2 }); }
      return n;
    }
    function popSegs() { var lane = g.L.lane; for (var i = 0; i < g.segs; i++) burst(70 + i * 22, lane.y + lane.h / 2, Art.COL.plain, 5); g.segs = 0; g.chunksSince = 0; }

    // ---------- 得点・時間・コンボ ----------
    function mult() { var m = 1 + Math.min(g.combo, TUNE.multCap) * TUNE.multStep; if (S.hint === 'always') m = Math.min(m, 1.8); return m; }
    function addCombo(n) { g.combo += n; g.comboT = TUNE.comboWin; g.stats.maxCombo = Math.max(g.stats.maxCombo, g.combo); if (g.combo >= 5 && g.combo % 5 < n) { app.audio.sfx('combo', Math.floor(g.combo / 5)); g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + 40, text: g.combo + ' COMBO!', t: 0, d: 1.1, big: 1 }); } }
    function breakCombo() { if (g.combo >= 5) app.audio.sfx('warn'); g.combo = 0; g.comboT = 0; app.audio.setIntensity(.25); }
    function addScore(p, x, y, big) { g.score += p; if (x != null) g.fx.push({ type: 'txt', x: x, y: y, text: '+' + p, t: 0, d: big ? 1.3 : .9, big: big ? 1 : 0 }); }
    function addTime(s) { if (!M.time) return; var before = g.time; g.time = Math.min(M.max, g.time + s); if (g.time - before > .4) { g.fx.push({ type: 'time', text: '+' + (g.time - before).toFixed(1) + '秒', t: 0, d: 1 }); app.audio.sfx('extend'); } }
    function penalty(s) { if (!M.time) return; g.time = Math.max(0, g.time - s); g.fx.push({ type: 'time', text: '−' + s + '秒', t: 0, d: 1, bad: 1 }); }

    // ---------- 演出 ----------
    function burst(x, y, col, n) {
      var light = S.lite || app.reduced; n = light ? Math.ceil(n / 3) : n;
      for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 180; g.fx.push({ type: Math.random() < .3 ? 'star' : 'dot', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: 0, d: .5 + Math.random() * .5, col: col, s: 2 + Math.random() * 4 }); }
      g.fx.push({ type: 'ring', x: x, y: y, t: 0, d: .45, col: col });
    }
    function ghostTo(it, x, y) { g.ghosts.push({ spr: spriteOf(it), x0: it.x, y0: it.y, x1: x, y1: y, t: 0, d: .2 }); }
    function toast(msg, kind, x, y) { app.ui.toast(msg, kind); }
    function setExpr(e, d, wave) { g.expr = e; g.exprT = d; g.wave = wave ? d : 0; }
    function speak(text, full) { if (S.voice) app.audio.speak(text); }

    // ---------- ヒント(候補の強調) ----------
    function refreshCand() {
      g.cand = null;
      var mode = S.hint; if (mode === 'none') return;
      if (mode === 'press' && !g.pressHint && !g.drag) return;
      var set = new Set(), all = fieldAndSlotItems();
      if (g.chain) { var cw = chainWords(); all.forEach(function (i) { if (i.kind === 'word' && !i.inChain && G.canAppend(cw, i.word)) set.add(i); }); g.chain.items.forEach(function (i) { set.add(i); }); }
      else if (g.drag && g.drag.items.length) { all.forEach(function (i) { if (g.drag.items.indexOf(i) >= 0 || i.lift) { set.add(i); return; } if (okSeq(g.drag.items.concat([i]))) set.add(i); }); }
      else if (g.pressHint) { var it = g.pressHint; set.add(it); all.forEach(function (i) { if (i === it) return; if (it.kind === 'word' && i.kind === 'word' && G.canAppend([it.word], i.word)) set.add(i); else if (it.chunk && i.kind === 'word' && G.tryInsert(it.chunk, i.word, cfg)) set.add(i); else if (okSeq([it, i])) set.add(i); }); }
      else if (g.sel) { var sc = g.sel.item; set.add(sc); all.forEach(function (i) { if (i.kind === 'word' && G.tryInsert(sc.chunk, i.word, cfg)) set.add(i); }); }
      else return;
      g.cand = set;
    }

    // ---------- 入力 ----------
    var press = null;
    function hitItem(x, y, slack) {
      for (var i = g.items.length - 1; i >= 0; i--) { var it = g.items[i]; if (it.state === 'pop' || it.state === 'merge' || it.lift) continue; if (Math.hypot(it.x - x, it.y - y) <= it.r * (it.sc || 1) + (slack || 4)) return it; }
      var si = slotAt(x, y); if (si != null && g.slots[si].item) return g.slots[si].item;
      return null;
    }
    function hitStroke(x, y) { // 一筆書き中は中心付近を通ったときだけ拾う(端をかすっても拾わない)
      var best = null, bd = 1e9;
      fieldAndSlotItems().forEach(function (it) { if (it.lift || it.state === 'pop' || it.state === 'merge' || it.state === 'spawn') return; var d = Math.hypot(it.x - x, it.y - y), lim = it.slot ? Math.min(it.slot.rect.w, it.slot.rect.h) * .45 : Math.max(16, it.r * .58); if (d < lim && d < bd) { bd = d; best = it; } });
      return best;
    }
    function guideBlocks(it, slot) { return g.guide && g.guide.allow && !g.guide.allow(it, slot); }
    g.down = function (x, y) {
      if (g.state !== 'play' || g.noInput) return;
      g.idleT = 0;
      var it = g.ready && g.pill && x >= g.pill.x && x <= g.pill.x + g.pill.w && y >= g.pill.y && y <= g.pill.y + g.pill.h ? null : hitItem(x, y, 6);
      press = { x: x, y: y, t: g.t, it: it, moved: false, long: false, bar: inBar(x, y) && !it };
      if (it) press.longTimer = 0;
    };
    g.move = function (x, y) {
      if (!press) return;
      var nowMs = performance.now(); (press.s = press.s || []).push({ x: x, y: y, t: nowMs }); if (press.s.length > 10) press.s.shift();
      var dist = Math.hypot(x - press.x, y - press.y);
      if (!press.moved && dist > 10) {
        press.moved = true;
        if (press.bar && g.ready && y < press.y - 20) { confirmSlots(); press = null; return; }
        if (press.it && !guideBlocks(press.it, 'drag')) {
          var it = press.it;
          if (g.chain) { if (g.chain.items.indexOf(it) >= 0) { var nc = confirmChain(); it = nc; } else if (g.chain.st.complete && !g.chain.st.err) confirmChain(); else clearChain(); }
          deselect();
          if (it) { g.drag = { items: [it], pts: [{ x: x, y: y }], lifted: it }; lift(it); app.audio.sfx('select'); strokePreview(); refreshCand(); emit('dragStart', { item: it }); }
        }
      }
      if (g.drag) {
        g.drag.pts.push({ x: x, y: y }); if (g.drag.pts.length > 60) g.drag.pts.shift();
        var d = g.drag, si2 = slotAt(x, y), first = d.items[0];
        // スロットの帯の上では「運ぶ」(途中で拾ったバブルは外す)
        d.toKun = inKun(x, y);
        var carry = d.items.length === 1 && (inBar(x, y) || d.toKun) && !(si2 != null && g.slots[si2].item && d.items.indexOf(g.slots[si2].item) > 0) && !(first && first.slot && si2 != null && g.slots[si2] === first.slot && d.items.length > 1);
        if (carry !== !!d.carry) {
          d.carry = carry;
          if (carry) { if (!first.lift) lift(first); d.lifted = first; }
          else if (d.items.length >= 2 && first.lift) { unlift(first); d.lifted = null; }
          refreshCand(); if (carry) app.ui.preview(first.full || first.text, 'sel', d.toKun ? 'チャンクくんが食べる(のこり' + g.hunger + ')' : 'スロットへ運ぶ'); else strokePreview();
        }
        if (d.lifted && (d.items.length === 1 || d.carry)) { var l = d.lifted; l.x = x; l.y = y - 6; }
        if (!d.carry) {
          // 速く通り過ぎたバブルは拾わない。減速するか、0.07秒とどまったら拾う
          var h = hitStroke(x, y);
          if (h && h !== d.lifted && d.items.indexOf(h) < 0) { if (d.hov !== h) { d.hov = h; d.hovT = nowMs; } if (speedOf(press.s) < .35 || nowMs - d.hovT > 110) { strokeAdd(h); d.hov = null; } }
          else if (h && h !== d.lifted) strokeAdd(h);
          else if (!h) { d.backIt = null; d.hov = null; }
        }
      }
    };
    function speedOf(sm) { if (!sm || sm.length < 2) return 0; var a = sm[Math.max(0, sm.length - 4)], b = sm[sm.length - 1], dt = Math.max(1, b.t - a.t); return Math.hypot(b.x - a.x, b.y - a.y) / dt; }
    function flickOf(p) { // 下(または上)へのフリック
      var sm = p.s; if (!sm || sm.length < 2) return 0;
      var b = sm[sm.length - 1], a = sm[0]; for (var i = sm.length - 1; i >= 0; i--) { if (b.t - sm[i].t > 90) break; a = sm[i]; }
      var dt = Math.max(1, b.t - a.t), vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt, dy = b.y - p.y;
      if (Math.abs(vy) < .5 || Math.abs(vx) > Math.abs(vy) * .8 || Math.abs(dy) < 40 || b.t - sm[0].t > 500) return 0;
      return vy > 0 ? 1 : -1;
    }
    g.up = function (x, y) {
      var p = press; press = null;
      if (p && g.drag && g.state === 'play') {
        var lastS = p.s && p.s[p.s.length - 1], fl = g.drag.items.length === 1 && lastS && performance.now() - lastS.t < 70 ? flickOf(p) : 0, d0 = g.drag, f0 = d0.items[0];
        if (fl && f0 && !inKun(x, y) && !inBar(x, y)) {
          unliftAll(d0); g.drag = null; refreshCand();
          if (fl > 0 && !f0.slot) { dropToSlot(f0, null, {}); emit('flick', { item: f0 }); return; }
          if (fl < 0 && f0.slot) { var sl0 = f0.slot; sl0.item = null; f0.slot = null; f0.state = 'idle'; f0.x = sl0.rect.x + sl0.rect.w / 2; f0.y = g.L.field.y + g.L.field.h - 50; f0.vy = -260; addItem(f0); keepIn(f0); app.audio.sfx('slot'); slotsChanged(); return; }
        }
        if (g.drag && g.drag.hov) { var hh = hitStroke(x, y); if (hh === g.drag.hov) strokeAdd(hh); }
      } g.pressHint = null; if (S.hint === 'press') refreshCand();
      if (!p || g.state !== 'play') { if (g.drag) endDrag(x, y); return; }
      if (g.drag) { endDrag(x, y); return; }
      if (p.long) { app.ui.tip(null); return; }
      tap(p.it, x, y, p.bar);
    };
    g.cancel = function () { press = null; if (g.drag) { unliftAll(g.drag); g.drag = null; } };
    function longPress(it) {
      press.long = true; showTip(it); speak(it.full || it.text);
      if (S.hint === 'press' && !(g.guide && g.guide.noHint)) { g.pressHint = it; g.combo = Math.floor(g.combo * .7); refreshCand(); setExpr('idea', .8); }
    }
    function tap(it, x, y, onBar) {
      if (g.ready && g.pill && x >= g.pill.x && x <= g.pill.x + g.pill.w && y >= g.pill.y && y <= g.pill.y + g.pill.h) { if (!guideBlocks(null, 'confirm')) confirmSlots(); return; }
      if (onBar && g.ready && !it) { if (!guideBlocks(null, 'confirm')) confirmSlots(); return; }
      var si = slotAt(x, y);
      if (!it && si != null && g.sel && !g.slots[si].item) { var sel = g.sel.item; if (!guideBlocks(sel, g.slots[si])) { deselect(); dropToSlot(sel, si, {}); } return; }
      if (!it) { if (g.chain) { if (g.chain.items.length < 2) clearChain(); else if (g.chain.st.complete && !g.chain.st.err) confirmChain(); else { clearChain(); app.audio.sfx('scatter'); } } deselect(); return; }
      if (guideBlocks(it)) { squash(it, -4); return; }
      if (it.kind === 'word') {
        if (it.word.k === 'magic') resolveMagic(it);
        if (g.chain && it.inChain) {
          if (G.cycleWord(it.word, cfg)) { sizeItem(it); squash(it, 9); app.audio.sfx('cycle'); speak(it.text); updateChainState(); emit('cycle', { item: it }); }
          else { squash(it, -5); app.audio.sfx('reject'); }
          return;
        }
        if (g.chain) {
          if (G.canAppend(chainWords(), it.word)) { addToChain(it); return; }
          // 順番の外れた語も、連鎖の中に入れられる位置があれば差し込む(the dog に big → the big dog)
          var cw0 = chainWords();
          for (var pos0 = cw0.length - 1; pos0 >= 0; pos0--) {
            var its0 = g.chain.items.slice(0, pos0).concat([it], g.chain.items.slice(pos0)), fs0 = its0.map(function (i) { return i.word.f; });
            var st0 = fitForms(its0);
            if (!(st0.prefix && (!st0.complete || !st0.err || !g.chain.st.complete)) && !(st0.complete && (!st0.err || g.chain.st.err))) { its0.forEach(function (i, q) { if (i.word.k === 'v' && i.word.f !== fs0[q]) { i.word.f = fs0[q]; sizeItem(i); } }); continue; }
            { g.chain.items.splice(pos0, 0, it); it.inChain = true; g.chain.fixed = true; squash(it, 8); app.audio.sfx('insert'); updateChainState(); emit('chainAdd', { item: it }); return; }
          }
          if (g.chain.items.length < 2 || (g.chain.st.complete && !g.chain.st.err)) { confirmChain(); startChain(it); return; }
          squash(it, -9); it.vx += (Math.random() - .5) * 120; app.audio.sfx('reject'); g.chain.last = g.t; return;
        }
        if (g.sel && g.sel.item.chunk) { if (tryInsertInto(g.sel.item, it)) return; deselect(); }
        // 直前に確定したチャンク(3秒以内)につながるなら足す(can swim → quickly)
        if (g.lastMade && /^(adv|er)$/.test(it.word.k) && g.t - g.lastMade.t < 3 && g.items.indexOf(g.lastMade.item) >= 0 && G.tryInsert(g.lastMade.item.chunk, it.word, cfg)) { g.sel = { item: g.lastMade.item, t: g.t }; if (tryInsertInto(g.lastMade.item, it)) { g.lastMade.t = g.t; deselect(); return; } deselect(); }
        startChain(it); return;
      }
      // チャンク:途中の連鎖(at など)とつながるなら取り込む
      if (g.chain && !g.chain.st.complete || (g.chain && g.chain.st.err)) {
        var cw1 = chainWords().concat(it.chunk.words || []), st1 = it.chunk.t !== 'CL' && G.chainState(cw1, cfg);
        if (st1 && (st1.prefix || st1.complete)) { absorb(it); return; }
      }
      if (g.chain) { if (g.chain.st.complete && !g.chain.st.err) confirmChain(); else clearChain(); }
      select(it);
    }
    function absorb(ch) { // チャンクを単語に戻して連鎖の後ろにつなぐ
      var ws = ch.chunk.words.slice(), x = ch.x, y = ch.y; removeItem(ch);
      ws.forEach(function (w, k) { var wi = newItem('word', w, x + (k - (ws.length - 1) / 2) * 14, y); wi.sc = 1; wi.state = 'idle'; addItem(wi); g.chain.items.push(wi); wi.inChain = true; });
      app.audio.sfx('insert'); updateChainState(); emit('chainAdd', { item: ch });
    }
    function resolveMagic(it) {
      var cw = chainWords(), kinds = cw.length ? ['n', 'adj', 'v', 'adv', 'det', 'prep'] : ['n'], pick = null;
      U.shuffle(kinds);
      for (var i = 0; i < kinds.length && !pick; i++) {
        var k = kinds[i], cand = k === 'det' ? { k: 'det', v: 'the' } : k === 'prep' ? { k: 'prep', v: 'in' } : null;
        if (!cand) { var pos = { n: 'noun', adj: 'adj', v: 'verb', adv: 'adv' }[k], e = app.dict.getWords({ pos: pos, maxLevel: opt.maxLevel || 2, count: 1, tag: k === 'v' ? { simple: 1 } : k === 'adv' ? { k: 'manner' } : null })[0]; if (e) cand = { k: k, e: e }; }
        if (cand && (!cw.length || G.canAppend(cw, cand))) pick = cand;
      }
      pick = pick || { k: 'n', e: app.dict.getWords({ pos: 'noun', maxLevel: 2, count: 1 })[0] };
      it.word = pick; sizeItem(it); burst(it.x, it.y, Art.COL.magic, 12); app.audio.sfx('extend');
    }

    // ---------- アイテム ----------
    g.useItem = function (name) {
      if (g.state !== 'play') return false;
      if (name === 'hint') {
        var sol = Supply.solve(fieldAndSlotItems(), cfg, 5000);
        if (!sol) { toast('いまは文が見つからない…もう少し待ってみよう', 'info'); return false; }
        g.hintPath = sol.parts.map(function (p) { return p.src; }); g.hintPathT = 7; setExpr('idea', 1.5); app.audio.sfx('ready'); return true;
      }
      if (name === 'magic') { var m = spawnWord({ k: 'magic' }); m.star = true; app.audio.sfx('extend'); return true; }
      if (name === 'auto') {
        if (g.chain) clearChain();
        var cands = Supply.candidates(g.items.filter(function (i) { return i.state === 'idle'; }), cfg).filter(function (c) { return c.src.length >= 2 && c.src.every(function (i) { return i.kind === 'word'; }); });
        if (!cands.length) { toast('くっつけられる単語がない…', 'info'); return false; }
        cands.sort(function (a, b) { return b.src.length - a.src.length; });
        var pick = cands[0].src; g.chain = { items: [], last: g.t, t0: g.t };
        pick.forEach(function (i) { g.chain.items.push(i); i.inChain = true; });
        updateChainState(); app.audio.sfx('extend'); confirmChain(); return true;
      }
      return false;
    };

    // ---------- 補充 ----------
    function pickOldWord() { // 骨組みが作れないとき、古い機能語を1つ入れ替える
      var c = g.items.filter(function (i) { return i.kind === 'word' && i.state === 'idle' && !i.inChain && /^(det|q|prep|er|ti|conj|modal|not|deg)$/.test(i.word.k); });
      c = c.filter(function (i) { return !i.word.sid; }); // タネ文の部品は消さない
      c.sort(function (a, b) { return a.born - b.born; }); return c[0] || null;
    }
    function refill() {
      if (opt.mode === 'over' || opt.mode === 'tutorial' || !M.target) return;
      // ショット:弾く弾(単語)が常に10個前後あるように。チャンクが増えすぎたら止める
      var need = (g.target || M.target) - liveCount() - g.spawnQ; if (need > 0) g.spawnQ += need;
    }
    g.refill = refill;

    // ---------- 更新 ----------
    g.update = function (dt) {
      if (g.state === 'paused') return;
      g.t += dt;
      if (g.state === 'countdown') {
        var before = Math.ceil(g.countT); g.countT -= dt; var now = Math.ceil(g.countT);
        if (now !== before && now >= 0) { app.ui.count(now > 0 ? String(now) : 'スタート!'); app.audio.sfx('count', now); }
        if (g.countT <= 0) { g.state = 'play'; app.audio.music('play'); app.audio.setIntensity(.25); emit('start', { mode: g.mode }); }
      }
      // 出現
      if (SHOT) { g.spawnQ = 0; if (g.state === 'play' || g.state === 'countdown') bUpdate(dt); } else if (g.spawnQ > 0) { g.spawnT -= dt; if (g.spawnT <= 0) { var sp = specFromSupply(); if (sp) spawnWord(sp); g.spawnQ--; g.spawnT = g.state === 'countdown' ? .06 : .14; } }
      if (!SHOT) physics(dt);
      if (g.state === 'play') playUpdate(dt);
      if (g.drag && g.drag.hov && press && press.s) { var lp = press.s[press.s.length - 1]; if (performance.now() - g.drag.hovT > 110 && hitStroke(lp.x, lp.y) === g.drag.hov) { strokeAdd(g.drag.hov); if (g.drag) g.drag.hov = null; } }
      // 長押し
      if (press && !press.moved && !press.long && press.it && g.t - press.t > .45) longPress(press.it);
      // アニメ
      g.items.forEach(function (it) {
        if (it.state === 'grow') { it.scT += dt; it.sc = U.E.outBack(U.clamp(it.scT / .3, 0, 1)); if (it.scT >= .3) it.state = 'idle'; }
        if (it.state === 'pop') { it.popT += dt; if (it.popT >= 0 && !it.popped) { it.popped = true; burst(it.x, it.y, Art.COL[it.kind === 'chunk' ? chunkCol(it.chunk) : wordCol(it.word)], 14); app.audio.sfx('pop'); } }
      });
      for (var i = g.items.length - 1; i >= 0; i--) if (g.items[i].state === 'pop' && g.items[i].popT > .05) g.items.splice(i, 1);
      g.ghosts = g.ghosts.filter(function (gh) { gh.t += dt; return gh.t < gh.d; });
      g.fx = g.fx.filter(function (p) { p.t += dt; if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= .98; } return p.t < p.d; });
      g.marks = g.marks.filter(function (m) { m.t += dt; return m.t < m.d && g.items.indexOf(m.item) >= 0; });
      if (g.exprT > 0) { g.exprT -= dt; if (g.exprT <= 0) g.expr = 'normal'; }
      if (g.wave > 0) g.wave -= dt;
      g.blinkT -= dt; if (g.blinkT < -.12) g.blinkT = 2 + Math.random() * 3;
      if (g.hintPathT > 0) { g.hintPathT -= dt; if (g.hintPathT <= 0) g.hintPath = null; }
      hud();
    };
    function playUpdate(dt) {
      g.idleT += dt; g.playT += dt;
      // 連鎖のタイマー(2秒ルール)
      if (g.chain && !g.drag) {
        var el = g.t - g.chain.last, st = g.chain.st;
        // 1語だけなら次の操作まで待つ。2語以上つながったら確定(これ以上伸ばせないなら早めに)
        if (st.complete && !st.err && g.chain.items.length >= 2 && el > (st.closed ? .6 : 1)) confirmChain();
      }
      if (g.sel && g.t - g.sel.t > 2.5 && !press) deselect();
      if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) breakCombo(); }
      if (M.time) {
        g.time -= dt;
        var sec = Math.ceil(g.time); if (sec <= 10 && sec !== g.lastTick && sec > 0) { g.lastTick = sec; app.audio.sfx('tick'); }
        if (g.time <= 10 && g.exprT <= 0) g.expr = 'panic';
        if (g.time <= 0) { g.time = 0; finish('おしまい!'); return; }
      }
      if (opt.mode === 'over') {
        g.overT -= dt * (g.failStreak >= 2 ? 1.6 : 1);
        g.overInt = overInterval(g.overSent || 0, g.playT); if (g.overT <= 0) { g.overT = g.overInt; g.spawnQ++; }
        if (!supply.feasible(fieldAndSlotItems()).ok && g.spawnQ < 1) g.spawnQ++;
        var cnt = liveCount(); if (cnt > M.cap) { finish('あふれた!'); return; }
      }
      if (g.idleT > 6 && g.exprT <= 0 && g.expr === 'normal') { setExpr('think', 1.5); }
      // 安全策:1秒ごとに数と「文の骨組み」を点検
      g.checkT = (g.checkT || 0) - dt;
      if (g.checkT <= 0) {
        g.checkT = 1; g.solveT = (g.solveT || 0) + 1;
        if (opt.mode !== 'tutorial' && !SHOT) {
          if (opt.mode !== 'over') refill();
          // 2秒ごとに探索し、文が1つも作れなければ詰みを解く1語を入れる(盤面がいっぱいなら古い機能語と入れ替え)
          if (g.solveT >= 2 && !g.chain && !g.drag && g.spawnQ < 1) {
            g.solveT = 0; var its = fieldAndSlotItems();
            if (!Supply.solve(its, cfg, 1500)) { var sp = supply.rescue(its); if (sp) { if (opt.mode !== 'over' && liveCount() >= (g.target || M.target)) { var old = pickOldWord(); if (old) { old.state = 'pop'; old.popT = 0; } } spawnWord(sp); g.rescued = (g.rescued || 0) + 1; } }
          }
        }
      }
    }
    function finish(text) {
      if (g.state === 'over') return; g.state = 'over'; g.cancel(); clearChain(); deselect();
      app.audio.sfx('end'); app.audio.music(null); setExpr(g.stats.sentences ? 'joy' : 'sad', 9);
      app.ui.count(text, true); emit('end', { mode: g.mode, score: g.score, stats: g.stats });
      setTimeout(function () { if (!g.dead) app.onGameEnd(g); }, 1500);
    }
    g.finish = finish;
    g.pause = function () { if (g.state === 'play' || g.state === 'countdown') { g.prevState = g.state; g.state = 'paused'; g.cancel(); } };
    g.resume = function () { if (g.state === 'paused') g.state = g.prevState || 'play'; };
    g.destroy = function () { g.dead = true; app.ui.tip(null); app.ui.preview('', ''); };

    function hud() {
      var fill = opt.mode === 'over' ? liveCount() / M.cap : null;
      app.ui.hud({ score: g.score, combo: g.combo, comboT: g.comboT / TUNE.comboWin, mult: mult(), time: M.time ? g.time : null, timeMax: M.max, fill: fill, warn: (M.time && g.time <= 10) || (fill != null && fill > .85) });
    }

    // ---------- 描画 ----------
    g.draw = function (ctx) {
      var L = g.L, t = g.t;
      drawLane(ctx, L.lane, t);
      drawBar(ctx, L.bar, t);
      var dimSet = g.cand;
      // 連鎖の線
      if (g.chain && g.chain.items.length > 1) {
        ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 10; ctx.shadowColor = 'rgba(120,80,200,.5)'; ctx.shadowBlur = 10;
        ctx.beginPath(); g.chain.items.forEach(function (i, k) { k ? ctx.lineTo(i.x, i.y) : ctx.moveTo(i.x, i.y); }); ctx.stroke(); ctx.restore();
      }
      // 一筆書きの線
      if (g.drag && !g.drag.carry && (g.drag.items.length > 1 || !g.drag.lifted)) {
        ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
        var col = g.drag.ok ? 'rgba(255,200,60,.95)' : g.drag.viable === false ? 'rgba(160,150,180,.8)' : 'rgba(255,255,255,.95)';
        ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.shadowColor = g.drag.ok ? 'rgba(255,170,0,.8)' : 'rgba(100,80,180,.4)'; ctx.shadowBlur = 14;
        ctx.beginPath(); g.drag.items.forEach(function (i, k) { k ? ctx.lineTo(i.x, i.y) : ctx.moveTo(i.x, i.y); });
        var lp = g.drag.pts[g.drag.pts.length - 1]; if (lp) ctx.lineTo(lp.x, lp.y); ctx.stroke(); ctx.restore();
      }
      // アイテム(浮いているもの → 選択中・連鎖中を上に)
      var order = g.items.slice().sort(function (a, b) { return (a.inChain || a.lift ? 1 : 0) - (b.inChain || b.lift ? 1 : 0); });
      order.forEach(function (it) {
        if (it.state === 'pop' && it.popT >= 0) return;
        var a = dimSet && !dimSet.has(it) ? .28 : 1;
        drawItem(ctx, it, a, t);
        if (it.badT && g.t - it.badT < .4) ring(ctx, it.x, it.y, it.r + 4, '#ef4d63');
      });
      // スロットの中身
      g.slots.forEach(function (s) { if (s.item && !s.item.lift) drawSlotItem(ctx, s, t, dimSet); });
      // 持ち上げ中
      if (g.drag && g.drag.lifted && g.drag.lifted.lift) drawItem(ctx, g.drag.lifted, .92, t, 1.12);
      // 連鎖の番号とタイマー
      if (g.chain) {
        var st = g.chain.st, el = g.t - g.chain.last, lim = st.complete && !st.err && g.chain.items.length >= 2 ? (st.closed ? .6 : 1) : 0, k = lim ? U.clamp(1 - el / lim, 0, 1) : 1;
        g.chain.items.forEach(function (i, n) { badge(ctx, i.x - i.r * .7, i.y - i.r * .7, String(n + 1)); });
        var last = g.chain.items[g.chain.items.length - 1];
        ctx.save(); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = st.complete ? (st.err ? '#ff6b7a' : '#3cc98a') : '#f5a524';
        ctx.beginPath(); ctx.arc(last.x, last.y, last.r + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); ctx.restore();
      }
      if (g.sel) { var si = g.sel.item; ring(ctx, si.x, si.y, si.r + 6 + Math.sin(t * 8) * 1.5, '#7b5cff'); }
      if (g.hintPath) g.hintPath.forEach(function (src, n) { src.forEach(function (i) { ring(ctx, i.x, i.y, i.r + 8 + Math.sin(t * 6) * 2, '#ffb800'); }); var a = src[0]; badge(ctx, a.x + a.r * .6, a.y - a.r * .8, String(n + 1), '#ffb800'); });
      g.ghosts.forEach(function (gh) { var k = U.E.inCubic(gh.t / gh.d), x = U.lerp(gh.x0, gh.x1, k), y = U.lerp(gh.y0, gh.y1, k), s = 1 - k * .7; ctx.globalAlpha = 1 - k * .5; ctx.drawImage(gh.spr.cv, x - gh.spr.size * s / 2, y - gh.spr.size * s / 2, gh.spr.size * s, gh.spr.size * s); ctx.globalAlpha = 1; });
      g.marks.forEach(function (m) { var it = m.item, a = Math.min(1, m.t * 5, (m.d - m.t) * 3); pill(ctx, it.x, it.y + it.r + 12, m.text, a); });
      if (SHOT) drawBob(ctx, t);
      drawFx(ctx);
      if (g.guide && g.guide.draw) g.guide.draw(ctx, t);
    };
    function drawItem(ctx, it, alpha, t, extra) {
      var sp = spriteOf(it), w = Math.sin(t * 2.2 + it.ph) * .03, s = (it.sc || 0) * (extra || 1) * (it.inChain ? 1.06 : 1);
      if (s <= .01) return;
      var sx = s * (1 + w + it.sq * .06), sy = s * (1 - w - it.sq * .05);
      ctx.save(); ctx.globalAlpha = alpha; ctx.translate(it.x, it.y);
      if (it.inChain) { ctx.beginPath(); ctx.arc(0, 0, it.r + 4, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); }
      ctx.scale(sx, sy); ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore();
      if (it.word && it.word.k === 'magic') { ctx.save(); ctx.globalAlpha = .6 + .4 * Math.sin(t * 5); ring(ctx, it.x, it.y, it.r + 3, 'hsl(' + (t * 120 % 360) + ',90%,65%)'); ctx.restore(); }
    }
    function drawSlotItem(ctx, s, t, dimSet) {
      var it = s.item, r = Math.min(s.rect.w, s.rect.h) / 2 - 2, sp = spriteOf(it, r), k = 1 + it.sq * .05;
      ctx.save(); ctx.globalAlpha = dimSet && !dimSet.has(it) ? .35 : 1; ctx.translate(s.rect.x + s.rect.w / 2, s.rect.y + s.rect.h / 2); ctx.scale(k * s.rect.w / (r * 2.25), k * s.rect.w / (r * 2.25));
      ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore();
      if (g.sel && g.sel.item === it) ring(ctx, it.x, it.y, r + 4, '#7b5cff');
    }
    function drawLane(ctx, lane, t) {
      if (SHOT) return;
      ctx.save();
      var y = lane.y + lane.h * .55, segs = SHOT ? 1 : 1 + g.segs, maxLen = lane.w - 140;
      var hov = g.drag && g.drag.toKun;
      Art.chunkKun(ctx, 46, y, { segs: segs, expr: hov ? (g.hunger ? 'surprise' : 'sad') : g.expr, t: t, blink: g.blinkT < 0 ? .1 : 1, scale: .6, wave: g.wave > 0, walk: g.chain || g.drag, maxLen: maxLen });
      for (var i = 0; i < 3; i++) { var cx = 22 + i * 15, cy = lane.y + 2, on = i < g.hunger; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fillStyle = on ? '#f2b468' : 'rgba(255,255,255,.6)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = on ? '#9c5a1e' : 'rgba(150,120,180,.6)'; ctx.stroke(); if (on) { ctx.fillStyle = '#6b3a12'; ctx.fillRect(cx - 2.5, cy - 2, 1.6, 1.6); ctx.fillRect(cx + 1, cy + .5, 1.6, 1.6); } }
      if (hov) { var k0 = kunPos(); ctx.beginPath(); ctx.arc(k0.x, k0.y, 44 + Math.sin(t * 8) * 2, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = g.hunger ? 'rgba(255,170,60,.9)' : 'rgba(239,77,99,.8)'; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore();
    }
    function drawBar(ctx, b, t) {
      ctx.save();
      roundRect(ctx, b.x, b.y, b.w, b.h, 18); ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.fill();
      ctx.lineWidth = g.ready ? 3 : 1.5; ctx.strokeStyle = g.ready ? 'hsl(' + (140 + Math.sin(t * 6) * 20) + ',70%,50%)' : 'rgba(140,120,190,.35)'; ctx.stroke();
      g.slots.forEach(function (s, i) {
        var r = s.rect; roundRect(ctx, r.x, r.y, r.w, r.h, 12);
        var acc = g.drag && (g.drag.items.length === 1 || g.drag.carry) && tokenOf(g.drag.items[0]) && accepts(s.role, tokenOf(g.drag.items[0]));
        ctx.fillStyle = acc ? 'rgba(255,236,170,.9)' : s.role === 'free' ? 'rgba(235,230,250,.8)' : 'rgba(238,234,248,.95)'; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = acc ? '#f3b630' : 'rgba(150,130,200,.3)'; ctx.stroke();
        if (!s.item) { ctx.fillStyle = 'rgba(110,95,150,.75)'; ctx.font = '700 ' + (r.w < 52 ? 9.5 : 10.5) + 'px ' + Art.FONT_JA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.ja, r.x + r.w / 2, r.y + r.h / 2); }
      });
      g.pill = null;
      if (g.ready) {
        var lab = 'わる! ×' + g.ready.mult.toFixed(1), pw = 118, ph = 34, px = b.x + b.w / 2 - pw / 2, py = b.y - ph + 6, sc = 1 + Math.sin(t * 7) * .04;
        g.pill = { x: px - 6, y: py - 6, w: pw + 12, h: ph + 12 };
        ctx.save(); ctx.translate(px + pw / 2, py + ph / 2); ctx.scale(sc, sc);
        roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 17); var gr = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2); gr.addColorStop(0, '#ff9cc2'); gr.addColorStop(1, '#ff5f95'); ctx.fillStyle = gr; ctx.shadowColor = 'rgba(255,80,140,.6)'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.font = '900 16px ' + Art.FONT_JA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, 1); ctx.restore();
      }
      if (g.slotErr && g.slots[1].item && g.slots[2].item) { ctx.fillStyle = '#e8566a'; ctx.font = '800 11px ' + Art.FONT_JA; ctx.textAlign = 'right'; ctx.fillText(g.slotErr.code === 'needObj' || g.slotErr.code === 'needComp' ? '△' : '×', b.x + b.w - 8, b.y + 10); }
      ctx.restore();
    }
    function drawFx(ctx) {
      g.fx.forEach(function (p) {
        var k = p.t / p.d;
        if (p.type === 'dot') { ctx.globalAlpha = 1 - k; ctx.fillStyle = Art.rgb(p.col || Art.COL.plain); ctx.beginPath(); ctx.arc(p.x, p.y, p.s * (1 - k * .5), 0, 7); ctx.fill(); }
        else if (p.type === 'star') { ctx.globalAlpha = 1 - k; Art.drawStar(ctx, p.x, p.y, p.s * 1.6, '#fff4b0', Art.rgb(p.col || Art.COL.prep)); }
        else if (p.type === 'ring') { ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = Art.rgb(p.col || Art.COL.plain); ctx.lineWidth = (p.big ? 6 : 4) * (1 - k) + 1; ctx.beginPath(); ctx.arc(p.x, p.y, 10 + k * (p.big || 50), 0, 7); ctx.stroke(); }
        else if (p.type === 'txt') { ctx.globalAlpha = Math.min(1, (1 - k) * 2); var fs = p.big === 2 ? 40 + U.E.outBack(Math.min(1, k * 5)) * 6 : p.big ? 26 : 15; ctx.font = '900 ' + fs + 'px ' + (p.ja ? Art.FONT_JA : Art.FONT_EN); ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(80,40,120,.85)'; ctx.lineJoin = 'round'; var yy = p.y - k * 40; ctx.strokeText(p.text, p.x, yy); ctx.fillStyle = p.big ? '#ffd23f' : '#fff'; ctx.fillText(p.text, p.x, yy); }
        else if (p.type === 'mark') { ctx.globalAlpha = Math.min(1, (1 - k) * 2.5); var s = 26 + U.E.outBack(Math.min(1, k * 4)) * 8; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = p.tri ? '#f5a524' : '#ef4d63'; ctx.beginPath(); if (p.tri) { ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s, p.y + s * .7); ctx.lineTo(p.x - s, p.y + s * .7); ctx.closePath(); } else { ctx.moveTo(p.x - s * .7, p.y - s * .7); ctx.lineTo(p.x + s * .7, p.y + s * .7); ctx.moveTo(p.x + s * .7, p.y - s * .7); ctx.lineTo(p.x - s * .7, p.y + s * .7); } ctx.stroke(); }
        else if (p.type === 'time') { ctx.globalAlpha = 1 - k; ctx.font = '900 16px ' + Art.FONT_JA; ctx.textAlign = 'right'; ctx.fillStyle = p.bad ? '#ef4d63' : '#20a86b'; ctx.fillText(p.text, g.L.W - 14, g.L.hudY + 70 + k * 16); }
        ctx.globalAlpha = 1;
      });
    }
    function ring(ctx, x, y, r, col) { ctx.save(); ctx.lineWidth = 3.5; ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore(); }
    function badge(ctx, x, y, s, col) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = col || '#6c4bd6'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '900 11px ' + Art.FONT_EN; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y + .5); ctx.restore(); }
    function pill(ctx, x, y, text, a) { ctx.save(); ctx.globalAlpha = a; ctx.font = '700 12px ' + Art.FONT_JA; var w = ctx.measureText(text).width + 16; roundRect(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fillStyle = 'rgba(70,50,110,.82)'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + .5); ctx.restore(); }
    function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    // ---------- 開始 ----------
    // ================= ボブル(パズルボブル型) =================
    // 上の盤面:名詞・動詞・形容詞・副詞だけ。下から撃つのは「つなぎの玉」(冠詞・前置詞・代名詞・助動詞系・be・have)。
    // 玉は当てた相手に合わせて自動で形が変わり、となりの形容詞・副詞も巻き込んで、正しい順のチャンクになる。
    // チャンクは下の役割スロットへ(ぶら下がっていた分は落ちてボーナス)。スロットで文がそろえば「わる!」で押し返す。
    function shotMerge() { return null; } function knock() { } function shotEnd(a) { a.shot = null; } function shotHit() { }
    var B = { cells: {}, par: 0, R: 24, D: 48, RH: 42, top: 0, queue: [], proj: null, aimP: null, shots: 0, falls: [], inv: { pierce: 1, warp: 1, bomb: 1 }, arm: null, nextRow: 20 };
    g.bob = B;
    var LV = opt.level || 0, MAXL = opt.maxLevel || 2;
    function bGeo() { var f = g.L.field; B.D = f.w / 8; B.R = B.D / 2; B.RH = B.D * .87; B.top = f.y + 2; }
    function bCols(r) { return (r + B.par) % 2 ? 7 : 8; }
    function bPos(r, c) { var f = g.L.field; return { x: f.x + B.R + c * B.D + ((r + B.par) % 2 ? B.R : 0), y: B.top + B.R + r * B.RH }; }
    function bKey(r, c) { return r * 16 + c; }
    function bGet(r, c) { return B.cells[bKey(r, c)] || null; }
    function bNb(r, c) {
      var sh = (r + B.par) % 2, out = [[r, c - 1], [r, c + 1]], d = sh ? [0, 1] : [-1, 0];
      [r - 1, r + 1].forEach(function (rr) { d.forEach(function (dc) { out.push([rr, c + dc]); }); });
      return out.filter(function (p) { return p[0] >= 0 && p[1] >= 0 && p[1] < bCols(p[0]); });
    }
    function bNbItems(it) { return bNb(it.gr.r, it.gr.c).map(function (p) { return bGet(p[0], p[1]); }).filter(Boolean); }
    function bFit(it) { if (it.label) it.text = it.label; it.r = B.R - 1; it.fs = Math.min(it.fs, 12); var w = Art.measure(it.text, it.fs), lim = B.D - 7; if (w > lim) it.fs = Math.max(7, it.fs * lim / w); it.face = ''; it.spr = null; }
    function bPlace(it, r, c) { var p = bPos(r, c); it.vx = it.vy = 0; it.gr = { r: r, c: c }; it.state = 'idle'; it.sc = 1; B.cells[bKey(r, c)] = it; if (g.items.indexOf(it) < 0) { it.x = p.x; it.y = p.y; g.items.push(it); } bFit(it); }
    function bRemove(it) { if (it.gr) { delete B.cells[bKey(it.gr.r, it.gr.c)]; it.gr = null; } }
    function bAll() { var o = []; for (var k in B.cells) o.push(B.cells[k]); return o; }
    function bRows() { return Math.max(6, Math.floor((bDanger() - B.top - B.D) / B.RH) + 1); }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    // ---- 盤面の単語(名詞・動詞・形容詞・副詞) ----
    var POOL = null;
    function pool() {
      if (POOL) return POOL; var D = app.dict, lvOk = function (e) { return (e.lv || 1) <= MAXL; };
      POOL = {
        n: D.all('noun').filter(function (e) { return lvOk(e) && (e.cat !== 'time' || e.prep); }),
        v: D.all('verb').filter(function (e) { return lvOk(e) && !e.tail && e.fr !== 'cl' && !e.cv && !e.link; }),
        adj: D.all('adj').filter(lvOk),
        adv: D.all('adv').filter(function (e) { return e.k === 'manner'; })
      };
      return POOL;
    }
    // 盤面の品詞はかたよらないように、足りない品詞から出す(名詞4:動詞2.5:形容詞2:副詞1.5)
    function bContent() {
      var P = pool(), cnt = { n: 0, v: 0, adj: 0, adv: 0 }, tot = 0, TG = { n: .4, v: .25, adj: .2, adv: .15 };
      bAll().concat(B.newbies || []).forEach(function (it) { if (it.word && cnt[it.word.k] != null) { cnt[it.word.k]++; tot++; } });
      var ks = ['n', 'v', 'adj', 'adv'], w = ks.map(function (k) { return Math.max(.15, TG[k] * (tot + 4) - cnt[k]); }), sum = w.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * sum, kk = 'n';
      for (var i = 0; i < ks.length; i++) { x -= w[i]; if (x <= 0) { kk = ks[i]; break; } }
      var r = kk === 'n' ? 0 : kk === 'v' ? .5 : kk === 'adj' ? .8 : .95;
      if (r < .4) { var pn = Math.random() < .4 ? P.n.filter(function (e) { return e.prep; }) : P.n, n = pick(pn.length ? pn : P.n), pl = (n.c === 'c') && Math.random() < .2; return { k: 'n', e: n, pl: pl }; }
      if (r < .66) { var v = pick(P.v), f = 'base'; if (LV >= 1) { var q = Math.random(); f = q < .5 ? 'base' : q < .75 ? 'ing' : 'pp'; if (f === 'pp' && v.fr === 'intr' && Math.random() < .5) f = 'base'; } return { k: 'v', e: v, f: f }; }
      if (r < .86) return { k: 'adj', e: pick(P.adj) };
      return { k: 'adv', e: pick(P.adv) };
    }
    function bNew(sp) { var it = sp.chunk ? newItem('chunk', sp.chunk, 0, 0) : newItem('word', sp, 0, 0); it.state = 'idle'; it.sc = 1; return it; }
    // ---- つなぎの玉 ----
    var AUX = [['modal', 'can'], ['modal', 'will'], ['modal', 'must'], ['modal', 'should'], ['modal', 'may'], ['sm', 'want to'], ['sm', 'have to'], ['sm', 'need to'], ['sm', 'be going to']];
    var PRONS = ['i', 'you', 'he', 'she', 'we', 'they'];
    // 発射台の上のボタンで、撃つ玉を自分で選ぶ
    var PAL = [['art', '冠詞', [null]], ['prep', '前置詞', ['in', 'at', 'on', 'to', 'with', 'for']], ['pron', '代名詞', ['i', 'you', 'he', 'she', 'we', 'they']], ['modal', '助動詞', ['can', 'will', 'must', 'should', 'may']], ['sm', 'want to等', ['want to', 'have to', 'need to', 'be going to']], ['be', 'be', [null]], ['have', 'have', [null]]];
    B.sel = { cat: 'art', v: null }; B.last = {}; B.open = null;
    function makeBall(sel) {
      var sp, label = null, kind = sel.cat;
      if (kind === 'art') { sp = { k: 'det', v: 'a' }; label = 'a/the'; }
      else if (kind === 'prep') sp = { k: 'prep', v: sel.v || 'in' };
      else if (kind === 'pron') sp = { k: 'pr', v: sel.v || 'i' };
      else if (kind === 'modal' || kind === 'sm') { sp = { k: kind, v: sel.v || (kind === 'modal' ? 'can' : 'want to'), t: 'pres' }; kind = 'aux'; }
      else if (kind === 'be') sp = { k: 'be', v: 'pres' };
      else sp = { k: 'hv', v: 'pres' };
      var it = bNew(sp); it.ball = kind; it.label = label; it.col = []; bFit(it); return it;
    }
    // 前置詞が名詞に合うか(場所・時の名詞は辞書の前置詞。場所は to も可。人・動物は with/for/to、物は with/for)
    function prepFits(p, e) { if (e.prep) return p === e.prep || (p === 'to' && e.cat === 'place'); if (e.cat === 'person' || e.cat === 'animal') return /^(with|for|to)$/.test(p); return /^(with|for)$/.test(p); }
    function prepHint(e) { return e.prep ? e.prep + (e.cat === 'place' ? ' / to' : '') : (e.cat === 'person' || e.cat === 'animal') ? 'with / for / to' : 'with / for'; }
    function nounOK(it) { return it && it.kind === 'word' && it.word.k === 'n'; }
    function verbOK(it, kind) {
      if (!it || it.kind !== 'word' || it.word.k !== 'v') return false; var f = it.word.f || 'base', v = it.word.e;
      if (LV === 0) return kind !== 'be' || v.fr !== 'cl';
      if (kind === 'aux') return f === 'base';
      if (kind === 'be') return f === 'ing' || (f === 'pp' && v.fr !== 'intr');
      if (kind === 'have') return f === 'pp';
      return false;
    }
    function targetOK(ball, t) { return ball === 'art' || ball === 'prep' || ball === 'pron' ? nounOK(t) : verbOK(t, ball); }
    // 玉 + 相手(+となりの形容詞・副詞)から、正しい順のチャンクを作る。できなければ null
    function cs(ws) { var st = G.chainState(ws, cfg); return st.complete && !st.err ? st.chunk : null; }
    function buildFor(ball, t, mods) {
      var res = null;
      if (ball.ball === 'art' || ball.ball === 'pron' || ball.ball === 'prep') {
        var n = t.word, adjs = n.e.cat === 'time' ? [] : mods.filter(function (m) { return m.word.k === 'adj'; }).slice(0, 2), sets = [adjs, adjs.slice(0, 1)];
        var heads = ball.ball === 'art' ? [[{ k: 'det', v: 'a' }], [{ k: 'det', v: 'the' }]]
          : ball.ball === 'pron' ? [[{ k: 'pr', v: ball.word.v }]]
          : [[], [{ k: 'det', v: 'the' }], [{ k: 'det', v: 'a' }]].map(function (d) { return [{ k: 'prep', v: ball.word.v }].concat(d); });
        for (var i = 0; i < sets.length && !res; i++) for (var h = 0; h < heads.length && !res; h++) {
          var ws = heads[h].concat(sets[i].map(function (m) { return m.word; }), [n]), c = cs(ws); if (c) res = { chunk: c, used: sets[i] };
        }
      } else {
        var v = JSON.parse(JSON.stringify({ k: 'v', f: t.word.f })); v.e = t.word.e;
        if (LV === 0) v.f = ball.ball === 'be' ? 'ing' : ball.ball === 'have' ? 'pp' : 'base';
        var advs = mods.filter(function (m) { return m.word.k === 'adv'; }).slice(0, 2), sets2 = [advs, advs.slice(0, 1)];
        for (var j = 0; j < sets2.length && !res; j++) { var c2 = cs([ball.word, v].concat(sets2[j].map(function (m) { return m.word; }))); if (c2) res = { chunk: c2, used: sets2[j] }; }
      }
      return res;
    }
    function bFrontier() { return bAll().filter(function (it) { return bNb(it.gr.r, it.gr.c).some(function (p) { return !bGet(p[0], p[1]); }); }); }
    function bFillQueue() { while (B.queue.length < 1) B.queue.push(makeBall(B.sel)); }
    g.bobSelect = function (c, v) { bSelect(c, v); };
    function bSelect(cat, v) { // パレットで選ぶ:いまの弾を置きかえる(スロットから乗せたチャンクは元へ戻す)
      B.sel = { cat: cat, v: v }; B.last[cat] = v; var cur = B.queue[0];
      if (cur && cur.ball === 'chunk') { var L = bLauncher(); toSlot(cur.chunk, L.x, L.y, cur.home); slotsChanged(); }
      B.queue = [makeBall(B.sel)]; app.audio.sfx('cycle');
    }
    // ---- 地形・おじゃま・天井 ----
    function bSlots(maxR) { var o = []; for (var r = 0; r < (maxR || 14); r++) for (var c = 0; c < bCols(r); c++) { if (bGet(r, c)) continue; if (r === 0 || bNb(r, c).some(function (p) { return bGet(p[0], p[1]); })) o.push([r, c]); } return o; }
    function bTerrain() { // 天井からぶら下がる、つららのような地形(上から4割まで)
      var lim = Math.max(3, Math.round(bRows() * .4));
      for (var c = 0; c < bCols(0); c++) if (Math.random() < .8) bPlace(bNew(bContent()), 0, c);
      for (var r = 1; r < lim; r++) for (var c2 = 0; c2 < bCols(r); c2++) {
        var up = bNb(r, c2).filter(function (p) { return p[0] === r - 1 && bGet(p[0], p[1]); }).length;
        if (up && Math.random() < .5 + up * .15 - r * .06) bPlace(bNew(bContent()), r, c2);
      }
      for (var t = 0; t < 40 && bAll().length < 20; t++) { var sl = bSlots(lim); if (!sl.length) break; var pk = pick(sl); bPlace(bNew(bContent()), pk[0], pk[1]); } // 少なすぎるときは足す
    }
    function bGarbage(n) { // おじゃまが上から降ってきて、地形のどこかにくっつく(場所はばらす。終わりの線の3段手前まで)
      var lim = bRows() - 3;
      for (var i = 0; i < n; i++) { var sl = bSlots(lim); if (!sl.length) break; var pk = pick(sl), it = bNew(bContent()), p = bPos(pk[0], pk[1]); it.x = p.x; it.y = g.L.field.y - 30 - i * 30; it.garb = 1; bPlace(it, pk[0], pk[1]); }
      app.audio.sfx('tick');
    }
    function bPushRow() { // 天井が1段下がる
      var old = B.cells; B.cells = {}; B.par ^= 1;
      for (var k in old) { var it = old[k]; it.gr.r++; B.cells[bKey(it.gr.r, it.gr.c)] = it; }
      for (var c = 0; c < bCols(0); c++) if (Math.random() < .75) { var n = bNew(bContent()), p = bPos(0, c); n.x = p.x; n.y = p.y - B.RH; bPlace(n, 0, c); }
      app.audio.sfx('warn'); g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + 40, text: '天井が下がった!', t: 0, d: 1, ja: 1 });
    }
    var ITEM_JA = { pierce: '貫通', warp: 'ワープ', bomb: 'ボム' };
    function bPushBack() { // 文を割ったごほうび:いちばん下の段を消す+アイテム
      var all = bAll(); if (all.length) { var mr = Math.max.apply(null, all.map(function (i) { return i.gr.r; })); all.filter(function (i) { return i.gr.r === mr; }).forEach(function (i) { bRemove(i); i.state = 'pop'; i.popT = -.1; }); }
      g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + 70, text: 'おしかえした!', t: 0, d: 1.2, ja: 1 }); bDrop();
      var k = pick(['pierce', 'warp', 'bomb']); B.inv[k]++; g.fx.push({ type: 'txt', x: 70, y: g.L.lane.y - 10, text: ITEM_JA[k] + ' +1', t: 0, d: 1.4, ja: 1 });
    }
    function bInit() { bGeo(); B.cells = {}; B.par = 0; bTerrain(); bAll().forEach(function (it, i) { it.sc = 0; it.state = 'grow'; it.scT = -i * .012; }); bFillQueue(); }
    function bLauncher() { var lane = g.L.lane; return { x: lane.x + lane.w / 2, y: lane.y + lane.h * .7 }; }
    function bItemPos(i) { var lane = g.L.lane; return { x: 28 + i * 40, y: lane.y + lane.h * .7, r: 17 }; }
    function palRect(i) { var lane = g.L.lane, w = (lane.w - 12) / PAL.length; return { x: lane.x + 6 + i * w + 2, y: lane.y + 26, w: w - 4, h: 28 }; }
    function optRect(j, n) { var lane = g.L.lane, w = Math.min(64, (lane.w - 12) / n); return { x: lane.x + (lane.w - w * n) / 2 + j * w + 2, y: lane.y - 30, w: w - 4, h: 28 }; }
    function inR(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
    function bDanger() { return g.L.lane.y - 4; }
    function bDir(x, y) { var L = bLauncher(), dx = x - L.x, dy = y - L.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len; if (uy > -.18) { uy = -.18; ux = (ux >= 0 ? 1 : -1) * Math.sqrt(1 - uy * uy); } return { ux: ux, uy: uy }; }
    function bAfterShot() {
      B.shots++;
      if (B.shots % 3 === 0) bGarbage(Math.min(6, 2 + Math.floor(B.shots / 25)));
      if (B.shots >= B.nextRow) { bPushRow(); B.nextRow = B.shots + Math.max(10, 16 - Math.floor(B.shots / 40) * 2); }
      if (bAll().length < 10) bGarbage(6);
      bCheckOver();
    }
    function bFire(dir, x, y) {
      if (B.proj) return;
      var L = bLauncher(), arm = B.arm; B.arm = null;
      if (arm === 'pierce' || arm === 'bomb') { B.inv[arm]--; B.proj = { special: arm, x: L.x, y: L.y, vx: dir.ux * 1250, vy: dir.uy * 1250 }; app.audio.sfx('link', 4); return; }
      if (!B.queue.length) return;
      var it = B.queue.shift(); bFillQueue(); it.col = it.col || [];
      if (arm === 'warp') { B.inv.warp--; bWarp(it, x, y); return; }
      it.x = L.x; it.y = L.y; it.sc = 1; it.state = 'idle'; g.items.push(it);
      B.proj = { it: it, vx: dir.ux * 1150, vy: dir.uy * 1150 }; app.audio.sfx('link', 3); emit('shot', { item: it });
    }
    function bWarp(it, x, y) { // ワープ:指の近くの本命へ直接(手前は無視)
      var kind = ballKind(it), best = null, bd = 1e9; bAll().forEach(function (o) { if (!isTarget(kind, o, it)) return; var d = Math.hypot(o.x - x, o.y - y); if (d < bd) { bd = d; best = o; } });
      it.x = best ? best.x : x; it.y = best ? best.y : y; burst(it.x, it.y, Art.COL.magic, 14); app.audio.sfx('extend'); g.items.push(it); bEnd(it, best, null);
    }
    // ---- 飛んでいる玉:飾り(形容詞/副詞)は拾って突き抜け、本命に当たったら止まってチャンクになる ----
    function ballKind(ball) { if (ball.ball !== 'chunk') return ball.ball; var t = ball.chunk.t; return t === 'NP' ? 'np' : t === 'PP' ? 'pp' : t === 'VP' ? 'vp' : 'other'; }
    function modOf(kind) { return /^(art|pron|prep|np|pp)$/.test(kind) ? 'adj' : /^(aux|be|have|vp)$/.test(kind) ? 'adv' : null; }
    function verbAlone(t) { if (!t || t.kind !== 'word' || t.word.k !== 'v') return null; var v = JSON.parse(JSON.stringify({ k: 'v', f: LV === 0 ? 'base' : t.word.f })); v.e = t.word.e; return cs([v]); }
    function isTarget(kind, t, ball) {
      if (!t || t.kind !== 'word') return false;
      if (kind === 'prep') return t.word.k === 'n' && (!ball || prepFits(ball.word.v, t.word.e));
      if (kind === 'pron') return t.word.k === 'n' && t.word.e.cat !== 'time' && !/^[A-Z]/.test(t.word.e.w); // 時の名詞・固有名詞に my などは付けない
      if (kind === 'art' || kind === 'vp') return t.word.k === 'n';
      if (kind === 'aux' || kind === 'have') return verbOK(t, kind);
      if (kind === 'be') return verbOK(t, 'be') || t.word.k === 'adj';
      if (kind === 'np' || kind === 'pp') return !!verbAlone(t);
      return false;
    }
    function targetOK(kind, t, ball) { return isTarget(kind, t, ball); }
    function growChunk(ch, cols) { // 拾った飾りをチャンクに入れる(名詞の前に形容詞、動詞のうしろに副詞)
      if (!cols.length) return ch; var ws = ch.words.slice();
      if (ch.t === 'VP') { var nv = ws.filter(function (w) { return w.k === 'adv'; }).length; ws = ws.concat(cols.map(function (c) { return c.word; }).slice(0, Math.max(0, 2 - nv))); } // 副詞も2つまで
      else { var ni = -1, na = ws.filter(function (w) { return w.k === 'adj'; }).length; ws.forEach(function (w, i) { if (w.k === 'n') ni = i; }); if (ni < 0) return ch; var add = cols.map(function (c) { return c.word; }).slice(0, Math.max(0, 2 - na)); if (!add.length) return ch; ws = ws.slice(0, ni).concat(add, ws.slice(ni)); } // 形容詞は合わせて2つまで
      return cs(ws) || ch;
    }
    function toSlot(ch, x, y, role) { // チャンクを下の役割スロットへ(埋まっていれば押し出す)
      var sl = (role && g.slots.filter(function (z) { return z.role === role && accepts(z.role, ch) && !z.item; })[0]) || (role && g.slots.filter(function (z) { return z.role === role && accepts(z.role, ch); })[0]) || freeSlotFor(ch) || g.slots.filter(function (z) { return accepts(z.role, ch); })[0];
      if (!sl) return; if (sl.item) { var old = sl.item; sl.item = null; old.slot = null; burst(sl.rect.x + sl.rect.w / 2, sl.rect.y + sl.rect.h / 2, [200, 190, 230], 8); }
      var ci = newItem('chunk', ch, x, y); ci.sc = 1; ci.state = 'idle'; placeInSlot(ci, sl);
    }
    function popBubble(o, pts) { bRemove(o); var i = g.items.indexOf(o); if (i >= 0) g.items.splice(i, 1); burst(o.x, o.y, Art.COL[wordCol(o.word)] || Art.COL.noun, 8); if (pts) addScore(Math.round(pts * mult()), o.x, o.y - 20); }
    function relabel(ball) { // 飛んでいる玉の表示:拾った飾りも見せる
      var base = ball.ball === 'chunk' ? G.chunkText(ball.chunk, cfg) : (ball.label || ball.text);
      ball.label = ball.col.length ? base + ' +' + ball.col.map(function (c) { return c.text; }).join(' ') : (ball.ball === 'chunk' ? null : ball.label); bFit(ball);
    }
    function bStep(dt) {
      var P = B.proj; if (!P) return; var f = g.L.field, it = P.it || P, n = Math.ceil(Math.hypot(P.vx, P.vy) * dt / 5);
      for (var i = 0; i < n; i++) {
        it.x += P.vx * dt / n; it.y += P.vy * dt / n;
        if (it.x < f.x + B.R) { it.x = f.x + B.R; P.vx = Math.abs(P.vx); app.audio.sfx('tap', 2); }
        if (it.x > f.x + f.w - B.R) { it.x = f.x + f.w - B.R; P.vx = -Math.abs(P.vx); app.audio.sfx('tap', 2); }
        var all = bAll(), touch = null; for (var j = 0; j < all.length; j++) if (Math.hypot(all[j].x - it.x, all[j].y - it.y) < B.D * .86) { touch = all[j]; break; }
        if (P.special === 'pierce') {
          if (touch) popBubble(touch, 5);
          if (it.y < B.top - B.R) { B.proj = null; bDrop(); bAfterShot(); return; }
          continue;
        }
        if (P.special === 'bomb') { if (touch || it.y <= B.top + B.R) { B.proj = null; bBomb(it.x, it.y); bAfterShot(); return; } continue; }
        if (it.y <= B.top + B.R) { bEnd(P.it, null); return; }
        if (!touch) continue;
        var kind = ballKind(P.it), mod = modOf(kind);
        if (touch.kind === 'word' && touch.word.k === mod && P.it.col.length < 2 && !isTarget(kind, touch, P.it)) {
          P.it.col.push(touch); popBubble(touch, 5); app.audio.sfx('link', P.it.col.length); relabel(P.it); continue; // 拾って突き抜ける
        }
        bEnd(P.it, isTarget(kind, touch, P.it) ? touch : null, touch); return;
      }
    }
    function bEnd(ball, t, hitWrong) {
      B.proj = null; var kind = ballKind(ball), x = ball.x, y = ball.y, gi = g.items.indexOf(ball); if (gi >= 0) g.items.splice(gi, 1);
      var made = []; // [chunk, role]
      if (t) {
        if (kind === 'np' || kind === 'pp') { var vp = verbAlone(t); if (vp) { made.push([growChunk(ball.chunk, ball.col), kind === 'np' ? 'S' : 'P'], [vp, 'V']); } }
        else if (kind === 'vp') { var np = null; [[{ k: 'det', v: 'a' }], [{ k: 'det', v: 'the' }], []].some(function (h) { np = cs(h.concat([t.word])); return !!np; }); if (np) made.push([growChunk(ball.chunk, ball.col), 'V'], [np, 'O']); }
        else if (kind === 'be' && t.word.k === 'adj') { var bv = cs([{ k: 'be', v: 'pres' }].concat(ball.col.map(function (c) { return c.word; }))) || cs([{ k: 'be', v: 'pres' }]), ap = cs([t.word]); if (bv && ap) made.push([bv, 'V'], [ap, 'O']); }
        else { var r = buildFor(ball, t, ball.col); if (r && kind === 'art' && !r.chunk.words.some(function (w) { return w.k === 'det'; })) r = null; if (r) made.push([r.chunk, null]); else hitWrong = t; }
      }
      if (made.length) {
        var jk = bNbItems(t).filter(function (o) { return o.junk; }); jk.forEach(function (o) { popBubble(o, 20); }); if (jk.length) g.fx.push({ type: 'txt', x: t.x, y: t.y + 24, text: 'じゃま玉も消えた!', t: 0, d: 1, ja: 1 });
        popBubble(t, 0); var words = 0, txt = [];
        made.forEach(function (m) { toSlot(m[0], x, y, m[1]); words += (m[0].words || []).length; txt.push(G.chunkText(m[0], cfg)); });
        g.stats.chunks++; addCombo(1); addScore(Math.round(10 * words * words * mult()), x, y - 30);
        var say = txt.join(' '); app.audio.sfx('chunk', Math.min(6, words)); speak(say); burst(x, y, Art.COL[chunkCol(made[0][0])], 14 + words * 3);
        g.fx.push({ type: 'txt', x: g.L.W / 2, y: y - 34, text: say, t: 0, d: 1.3 }); slotsChanged(); emit('chunk', { chunk: made[0][0], n: words });
      } else if (ball.ball === 'chunk') { // スロットのチャンク:育った分を持って元へ戻る
        var gc = growChunk(ball.chunk, ball.col); toSlot(gc, x, y, ball.home); slotsChanged();
        if (ball.col.length) { speak(G.chunkText(gc, cfg)); addScore(Math.round(10 * gc.words.length * mult()), x, y); } else { app.audio.sfx('reject'); g.fx.push({ type: 'txt', x: x, y: y - 20, text: 'もどった', t: 0, d: .8, ja: 1 }); }
      } else { // ミス:外した玉は、その場にくっついて「じゃま玉」になる(正しい答えを小さく出す)
        var best = null, bd = 1e9; bSlots().forEach(function (p) { var q = bPos(p[0], p[1]), d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = p; } });
        app.audio.sfx('reject'); breakCombo();
        var hint = missHint(kind, hitWrong, ball);
        if (best) { ball.x = x; ball.y = y; ball.junk = 1; ball.col = []; bPlace(ball, best[0], best[1]); squash(ball, -8); }
        g.fx.push({ type: 'txt', x: Math.min(g.L.W - 90, Math.max(90, x)), y: y + 34, text: hint, t: 0, d: 2.2, ja: 1 });
      }
      bDrop(); bAfterShot();
    }
    function missHint(kind, t, ball) {
      if (!t || t.kind !== 'word') return 'ミス:あたる相手がいない';
      var k = t.word.k, w = t.text;
      if (kind === 'prep' && k === 'n') return w + ' には ' + prepHint(t.word.e);
      if ((kind === 'art' || kind === 'pron') && k === 'n') return w + ' には ' + (kind === 'art' ? '冠詞' : 'my / his など') + 'はつけない';
      if ((kind === 'art' || kind === 'pron' || kind === 'prep') && k !== 'n') return 'この玉は名詞に当てよう';
      if (kind === 'aux' || kind === 'be' || kind === 'have') {
        if (k !== 'v') return kind === 'be' ? 'be は -ing形の動詞か形容詞に' : 'この玉は動詞に当てよう';
        var f = t.word.f || 'base'; return f === 'ing' ? w + ' には be' : f === 'pp' ? w + ' には have(be なら受け身)' : w + ' には can / want to など';
      }
      return 'ミス';
    }
    function bBomb(x, y) {
      var n = 0; bAll().forEach(function (o) { if (Math.hypot(o.x - x, o.y - y) < B.D * 2.1) { bRemove(o); o.state = 'pop'; o.popT = -Math.hypot(o.x - x, o.y - y) / 900; n++; } });
      g.fx.push({ type: 'ring', x: x, y: y, t: 0, d: .5, col: Art.COL.magic, big: B.D * 2.2 }); app.audio.sfx('sentence', 2); addScore(Math.round(8 * n * mult()), x, y); bDrop();
    }
    function bDrop() { // 天井とつながっていないバブルは落ちる(落とした数の2乗でボーナス)
      bAll().forEach(function (it) { if (it.state === 'pop') bRemove(it); });
      var ok = {}, st = [];
      for (var c = 0; c < bCols(0); c++) if (bGet(0, c)) { ok[bKey(0, c)] = 1; st.push([0, c]); }
      while (st.length) { var p = st.pop(); bNb(p[0], p[1]).forEach(function (q) { var k = bKey(q[0], q[1]); if (!ok[k] && B.cells[k]) { ok[k] = 1; st.push(q); } }); }
      var n = 0; bAll().forEach(function (it) { var k = bKey(it.gr.r, it.gr.c); if (!ok[k]) { bRemove(it); it.state = 'fall'; it.vy = -60 - Math.random() * 100; it.vx = (Math.random() - .5) * 100; B.falls.push(it); n++; } });
      if (n) { var pts = Math.round(20 * n * n * mult()); addScore(pts, g.L.W / 2, g.L.field.y + g.L.field.h * .5, true); g.fx.push({ type: 'txt', x: g.L.W / 2, y: g.L.field.y + g.L.field.h * .45, text: n + 'こ おとした!', t: 0, d: 1.2, ja: 1 }); app.audio.sfx('extend'); }
    }
    function bCheckOver() { var dy = bDanger(); if (bAll().some(function (it) { return bPos(it.gr.r, it.gr.c).y + B.R > dy; })) finish('あふれた!'); }
    function bUpdate(dt) {
      bStep(dt);
      bAll().forEach(function (it) { if (it.state === 'pop') { bRemove(it); return; } var p = bPos(it.gr.r, it.gr.c), k = it.garb ? Math.min(1, dt * 7) : Math.min(1, dt * 12); it.x += (p.x - it.x) * k; it.y += (p.y - it.y) * k; if (Math.abs(p.y - it.y) < 1) it.garb = 0; });
      B.falls = B.falls.filter(function (it) { it.vy += 1400 * dt; it.x += it.vx * dt; it.y += it.vy * dt; if (it.y > g.L.H + 60) { var i = g.items.indexOf(it); if (i >= 0) g.items.splice(i, 1); return false; } return true; });
    }
    function drawBob(ctx, t) {
      if (!g.L) return;
      var L = bLauncher(), f = g.L.field, dy = bDanger();
      ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(239,77,99,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, dy); ctx.lineTo(f.x + f.w, dy); ctx.stroke(); ctx.setLineDash([]);
      bAll().forEach(function (it) { if (it.junk) { ctx.beginPath(); ctx.arc(it.x, it.y, B.R - 1, 0, 7); ctx.fillStyle = 'rgba(80,70,100,.35)'; ctx.fill(); } });
      if (B.aimP && !B.proj && !B.aimP.flick) {
        ctx.fillStyle = B.arm ? 'rgba(255,95,143,.95)' : 'rgba(255,255,255,.95)';
        if (B.arm === 'warp') { ctx.beginPath(); ctx.arc(B.aimP.x, B.aimP.y, 14, 0, 7); ctx.strokeStyle = '#ff5f8f'; ctx.lineWidth = 3; ctx.stroke(); }
        else { var d = bDir(B.aimP.x, B.aimP.y), x = L.x, y = L.y, ux = d.ux, uy = d.uy, n = 0; while (y > B.top + B.R && n < 400) { x += ux * 6; y += uy * 6; n++; if (x < f.x + B.R || x > f.x + f.w - B.R) ux = -ux; if (n % 3 === 0) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); } } }
      }
      ctx.beginPath(); ctx.arc(L.x, L.y + 3, B.R + 9, 0, 7); ctx.fillStyle = B.arm ? 'rgba(255,95,143,.25)' : 'rgba(106,76,240,.16)'; ctx.fill();
      ['pierce', 'warp', 'bomb'].forEach(function (k, i) {
        var p = bItemPos(i), on = B.arm === k, cnt = B.inv[k];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = on ? '#ff5f8f' : cnt ? '#6a4cf0' : 'rgba(150,140,180,.5)'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ITEM_JA[k], p.x, p.y);
        ctx.beginPath(); ctx.arc(p.x + 13, p.y - 13, 8, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.fillStyle = '#ff5f8f'; ctx.font = '900 10px sans-serif'; ctx.fillText(cnt, p.x + 13, p.y - 12);
      });
      var nr = B.nextRow - B.shots, ng = 3 - (B.shots % 3); ctx.fillStyle = 'rgba(90,70,140,.85)'; ctx.font = '800 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('おじゃま あと' + ng + '発 ・ 天井 あと' + nr + '発', L.x, g.L.lane.y + 12);
      ctx.restore();
      if (B.proj && B.proj.special) { ctx.save(); ctx.beginPath(); ctx.arc(B.proj.x, B.proj.y, B.R - 2, 0, 7); ctx.fillStyle = B.proj.special === 'bomb' ? '#3a2c4a' : '#ff5f8f'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ITEM_JA[B.proj.special], B.proj.x, B.proj.y); ctx.restore(); }
      var cur = B.queue[0];
      if (cur && !(B.proj && B.proj.it)) { if (B.arm === 'pierce' || B.arm === 'bomb') { ctx.save(); ctx.beginPath(); ctx.arc(L.x, L.y, B.R - 2, 0, 7); ctx.fillStyle = B.arm === 'bomb' ? '#3a2c4a' : '#ff5f8f'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ITEM_JA[B.arm], L.x, L.y); ctx.restore(); } else { cur.x = L.x; cur.y = L.y; drawItem(ctx, cur, 1, t); } }
      // パレット
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      PAL.forEach(function (p, i) { var r = palRect(i), on = B.sel.cat === p[0]; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fillStyle = on ? '#6a4cf0' : 'rgba(255,255,255,.88)'; ctx.fill(); ctx.fillStyle = on ? '#fff' : '#4a3a6a'; ctx.font = '800 ' + (p[1].length > 4 ? 9 : 11) + 'px sans-serif'; ctx.fillText(p[1], r.x + r.w / 2, r.y + r.h / 2 + 1); });
      if (B.open) { var po = PAL.filter(function (p) { return p[0] === B.open; })[0], opts = po[2]; opts.forEach(function (v, j) { var r = optRect(j, opts.length), on = B.sel.cat === po[0] && B.sel.v === v; roundRect(ctx, r.x, r.y, r.w, r.h, 12); ctx.fillStyle = on ? '#ff5f8f' : '#fff'; ctx.fill(); ctx.strokeStyle = '#6a4cf0'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = on ? '#fff' : '#3a2c4a'; ctx.font = '800 ' + ((v || '').length > 7 ? 9 : 12) + 'px sans-serif'; ctx.fillText(v === 'i' ? 'I' : v, r.x + r.w / 2, r.y + r.h / 2 + 1); }); }
      if (B.aimP && !B.aimP.onL && Math.hypot(B.aimP.x - L.x, B.aimP.y - L.y) < B.R + 30) { ctx.fillStyle = '#ef4d63'; ctx.font = '900 12px sans-serif'; ctx.fillText('はなすと やめる', L.x, L.y - B.R - 16); }
      ctx.restore();
    }
    // スロットのチャンク:タップ=発射台へ/ドラッグ=入れ替え/長押し=捨てる
    function slotRelease(d, x, y) {
      var s0 = g.slots[d.si], it = s0.item; if (!it) return;
      if (d.moved) {
        var ti = slotAt(x, y); if (ti == null || ti === d.si) return; var s1 = g.slots[ti], other = s1.item;
        if (!accepts(s1.role, it.chunk) || (other && !accepts(s0.role, other.chunk))) { toast('その場所には入らない', 'tri'); app.audio.sfx('reject'); return; }
        s0.item = null; it.slot = null; if (other) { s1.item = null; other.slot = null; placeInSlot(other, s0); } placeInSlot(it, s1); slotsChanged(); return;
      }
      if (g.t - d.t >= .5) { s0.item = null; it.slot = null; burst(s0.rect.x + s0.rect.w / 2, s0.rect.y + s0.rect.h / 2, [200, 190, 230], 10); app.audio.sfx('pop'); toast('すてた', 'info'); slotsChanged(); return; }
      s0.item = null; it.slot = null; it.state = 'idle'; it.ball = 'chunk'; it.home = s0.role; it.col = []; it.label = null; bFit(it); B.queue.unshift(it); app.audio.sfx('slot'); slotsChanged();
    }
    if (SHOT) {
      g.down = function (x, y) {
        if (g.state !== 'play' || g.noInput) return; g.idleT = 0;
        if (g.ready && g.pill && x >= g.pill.x && x <= g.pill.x + g.pill.w && y >= g.pill.y && y <= g.pill.y + g.pill.h) { var wc = G.wordCount(g.ready.T); confirmSlots(); addScore(Math.round(15 * wc * wc * mult()), g.L.W / 2, g.L.field.y + g.L.field.h * .4, true); for (var pb = 0; pb < 1 + Math.floor(wc / 5); pb++) bPushBack(); return; }
        for (var k = 0; k < 3; k++) { var ip = bItemPos(k), key = ['pierce', 'warp', 'bomb'][k]; if (Math.hypot(x - ip.x, y - ip.y) < ip.r + 6) { if (B.arm === key) B.arm = null; else if (B.inv[key] > 0) B.arm = key; else toast('文を「わる!」ともらえる', 'tri'); app.audio.sfx('cycle'); return; } }
        var L = bLauncher();
        if (Math.hypot(x - L.x, y - L.y) < B.R + 10) { B.aimP = { x: x, y: y, sx: x, sy: y, onL: true }; return; }
        if (B.open) { var po = PAL.filter(function (p) { return p[0] === B.open; })[0]; for (var j = 0; j < po[2].length; j++) if (inR(optRect(j, po[2].length), x, y)) { bSelect(po[0], po[2][j]); B.open = null; return; } }
        for (var i = 0; i < PAL.length; i++) if (inR(palRect(i), x, y)) { var c = PAL[i]; if (c[2].length === 1) { bSelect(c[0], null); B.open = null; } else if (B.open === c[0]) B.open = null; else { B.open = c[0]; bSelect(c[0], B.last[c[0]] || c[2][0]); } return; }
        B.open = null;
        var si = slotAt(x, y); if (si != null && g.slots[si].item) { B.sd = { si: si, sx: x, sy: y, x: x, y: y, t: g.t, moved: false }; return; }
        if (y < g.L.lane.y) B.aimP = { x: x, y: y, sx: x, sy: y };
      };
      g.move = function (x, y) { if (B.sd) { B.sd.x = x; B.sd.y = y; if (Math.hypot(x - B.sd.sx, y - B.sd.sy) > 12) B.sd.moved = true; return; } if (B.aimP) { B.aimP.x = x; B.aimP.y = y; if (B.aimP.onL) B.aimP.flick = y - B.aimP.sy > 30; } };
      g.up = function (x, y) {
        if (B.sd) { var d0 = B.sd; B.sd = null; if (g.state === 'play') slotRelease(d0, x, y); return; }
        var a = B.aimP; B.aimP = null; if (!a || g.state !== 'play') return;
        if (a.onL) {
          if (y - a.sy > 30) { // 発射台の代名詞を下へ:主語としてスロットへ(1発ぶん)
            var cur = B.queue[0]; if (!cur || cur.ball !== 'pron') { toast('下に入れられるのは代名詞(I / he など)だけ', 'tri'); app.audio.sfx('reject'); return; }
            var tok = G.chainState([cur.word], cfg).chunk, sl = freeSlotFor(tok) || g.slots.filter(function (z) { return accepts(z.role, tok); })[0]; if (!sl) return;
            if (sl.item) { sl.item.slot = null; sl.item = null; }
            B.queue.shift(); bFillQueue(); var LL = bLauncher(), ci = newItem('chunk', tok, LL.x, LL.y); ci.sc = 1; ci.state = 'idle'; placeInSlot(ci, sl); slotsChanged(); bAfterShot(); return;
          }
          if (Math.hypot(x - a.sx, y - a.sy) < 12) { var c0 = B.queue[0]; if (c0) speak(c0.label || c0.text); return; }
        }
        var LC = bLauncher(); if (Math.hypot(x - LC.x, y - LC.y) < B.R + 30) { app.audio.sfx('cycle'); return; } // 発射台の近くで離したら、やめる
        bFire(bDir(x, y), x, y);
      };
      g.cancel = function () { B.aimP = null; B.sd = null; };
    }
    g.start = function () {
      g.layout(); g.chunksSince = 0;
      if (SHOT) { bInit(); app.ui.count('3'); app.audio.sfx('count', 3); return; }
      if (opt.mode === 'tutorial') { g.state = 'play'; return; }
      g.spawnQ = g.target || M.target; g.spawnT = 0;
      app.ui.count('3'); app.audio.sfx('count', 3);
    };
    // 自動テスト・連携用の窓口
    g.debug = { supply: supply, slotsChanged: function () { slotsChanged(); }, hit: function (x, y) { return hitStroke(x, y); }, items: function () { return g.items; }, slots: function () { return g.slots; }, chain: function () { return g.chain; }, cfg: cfg, tokenOf: tokenOf, solve: function () { return Supply.solve(fieldAndSlotItems(), cfg, 5000); } };
    return g;
  }
  return { create: create, ROLE: ROLE, MODE: MODE, accepts: accepts, TUNE: TUNE, sentExt: sentExt, decay: decay, overInterval: overInterval };
})();

/* ===== FILE: tutorial.js ===== */
/* ===== tutorial.js:体験型チュートリアル(実際に1文作って覚える) ===== */
var Tutorial = (function () {
  'use strict';
  function run(app, g, done) {
    var ui = app.ui, F = g.L.field, step = -1, hand = null, finished = false, tm = [];
    var W = F.w, X = function (k) { return F.x + W * k; }, Y = function (k) { return F.y + F.h * k; };
    var D = app.dict, find = function (pos, w) { return D.all(pos).filter(function (e) { return e.w === w; })[0]; };
    var E = {
      small: find('adj', 'small') || D.getWords({ pos: 'adj', maxLevel: 1 })[0], cat: find('noun', 'cat') || D.getWords({ pos: 'noun', maxLevel: 1 })[0],
      sleep: find('verb', 'sleep') || D.getWords({ pos: 'verb', maxLevel: 1, tag: { fr: ['intr'] } })[0], dog: find('noun', 'dog') || D.getWords({ pos: 'noun', maxLevel: 1 })[0],
      run: find('verb', 'run') || D.getWords({ pos: 'verb', maxLevel: 1, tag: { fr: ['intr'] } })[0]
    };
    var it = {};
    g.calm = true;
    g.guide = { allow: function () { return false; }, draw: drawHand, noHint: true };
    var bottomSay = function () { return app.stage.h - g.L.lane.y + 8; };
    function say(html, next, label) { ui.say(html, { next: next, nextLabel: label, bottom: bottomSay() }); }
    function clearHand() { hand = null; }
    function drawHand(ctx, t) {
      if (!hand) return;
      var p;
      if (hand.tap) { var a = hand.tap(); if (!a) return; p = { x: a.x, y: a.y }; }
      else { var A = hand.from(), B = hand.to(); if (!A || !B) return; var k = (t * .6) % 1, e = U.E.inOut(Math.min(1, k * 1.3)); p = { x: U.lerp(A.x, B.x, e), y: U.lerp(A.y, B.y, e) };
        ctx.save(); ctx.setLineDash([6, 8]); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,111,159,.7)'; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); ctx.restore(); }
      var pr = (t * 1.6) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - pr; ctx.strokeStyle = '#ff6f9f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, 16 + pr * 26, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.translate(p.x + 20, p.y + 26); ctx.rotate(-.35);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#6a4cf0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-7, -22, 14, 30, 7) : ctx.rect(-7, -22, 14, 30); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-14, 0, 28, 26, 10) : ctx.rect(-14, 0, 28, 26); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    function at(item) { return function () { if (!item) return null; if (item.slot) return { x: item.slot.rect.x + item.slot.rect.w / 2, y: item.slot.rect.y + item.slot.rect.h / 2 }; return g.items.indexOf(item) >= 0 ? item : null; }; }
    function slotPos(i) { return function () { var r = g.slots[i].rect; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; }; }
    function spawn(spec, kx, ky) { var i = g.spawnWord(spec, X(kx), Y(ky), true); i.vx = i.vy = 0; return i; }
    function later(fn, ms) { tm.push(setTimeout(function () { if (!finished) fn(); }, ms)); }
    var handlers = {};
    function onG(name, fn) { handlers[name] = fn; }
    ['chunk', 'sentence', 'fail', 'cycle', 'slot', 'chainAdd', 'chainStart', 'eat'].forEach(function (n) { g.on(n, function (d) { if (handlers[n]) handlers[n](d); }); });
    function go(n) { step = n; handlers = {}; STEPS[n](); }
    var STEPS = [
      function () {
        say('やあ、ぼくは<b>チャンクくん</b>!<br>英語のバブルをつなげて、<b>文</b>を作るゲームだよ。', function () { go(1); });
        g.guide.allow = function () { return false; };
      },
      function () {
        it.the = spawn({ k: 'det', v: 'the' }, .18, .2); it.small = spawn({ k: 'adj', e: E.small }, .5, .12); it.cat = spawn({ k: 'n', e: E.cat }, .82, .22);
        it.sleep = spawn({ k: 'v', e: E.sleep }, .55, .42);
        var seq = [it.the, it.small, it.cat], idx = 0;
        say('単語を<b>英語の順番</b>にタップすると「チャンク」になるよ。<br><span class="pc-en">the → small → cat</span> の順にタップしてみて!');
        hand = { tap: function () { return at(seq[Math.min(idx, 2)])(); } };
        g.guide.allow = function (item, slot) { return !slot && item === seq[idx]; };
        onG('chainStart', function (d) { if (d.item === seq[0]) idx = 1; });
        onG('chainAdd', function (d) { idx = seq.indexOf(d.item) + 1; });
        onG('fail', function () { idx = 0; });
        onG('chunk', function (d) { it.np = d.item; it.vp = it.sleep; clearHand(); later(function () { go(3); }, 700); });
      },
      function () {
        say('できた!これが<b>名詞のチャンク</b>。<br>次は動詞 <span class="pc-en">sleep</span> をタップ。少し待つとチャンクになるよ。');
        hand = { tap: at(it.sleep) };
        g.guide.allow = function (item, slot) { return !slot && item === it.sleep; };
        onG('chunk', function (d) { it.vp = d.item; clearHand(); later(function () { go(3); }, 700); });
      },
      function () {
        say('できた!これが<b>名詞のチャンク</b>。<br>今度は<b>指でなぞって</b>つなげよう。<span class="pc-en">the … cat</span> から <span class="pc-en">sleep</span> へ、なぞってみて!');
        hand = { from: at(it.np), to: at(it.vp) };
        g.guide.allow = function (item, slot) { return (slot === undefined || slot === 'drag') && (item === it.np || item === it.vp); };
        onG('sentence', function () { clearHand(); later(function () { go(4); }, 1600); });
        onG('fail', function () { say('おしい!<span class="pc-en">the … cat</span> を押したまま、<span class="pc-en">sleep</span> まで指をすべらせてね。'); });
      },
      function () {
        say('すごい!<span class="pc-en">The small cat sleeps.</span><br>主語に合わせて <b>sleep<u>s</u></b> の s も自動で付くよ。', function () { go(5); });
        g.guide.allow = function () { return false; };
      },
      function () {
        it.a = spawn({ k: 'det', v: 'a' }, .22, .18); it.dog = spawn({ k: 'n', e: E.dog }, .6, .14); it.run = spawn({ k: 'v', e: E.run }, .78, .4);
        var cycled = false;
        say('連鎖中の単語を<b>もう一度タップ</b>すると形が変わるよ。<br><span class="pc-en">a</span> をタップ → もう一度タップで <span class="pc-en">the</span> に。それから <span class="pc-en">dog</span> をタップ!');
        hand = { tap: function () { return cycled ? at(it.dog)() : at(it.a)(); } };
        g.guide.allow = function (item, slot) { return !slot && (item === it.a || (cycled && item === it.dog)); };
        onG('cycle', function () { cycled = true; });
        onG('fail', function () { cycled = false; });
        onG('chunk', function (d) { it.np2 = d.item; clearHand(); later(function () { go(6); }, 700); });
      },
      function () {
        say('下の<b>スロット</b>に置いても文が作れるよ。<br><span class="pc-en">the dog</span> を「だれが」へ、<span class="pc-en">run</span> を「する」へドラッグ!<br>(下にピッとはじくと、合うスロットへ自動で入るよ)');
        var stage = 0;
        hand = { from: function () { return stage ? at(it.run)() : at(it.np2)(); }, to: function () { return stage ? slotPos(2)() : slotPos(1)(); } };
        g.guide.allow = function (item, slot) { if (slot === 'confirm') return true; if (item === it.np2 || item === it.run) return true; return !!(item && item.slot); };
        onG('slot', function (d) { if (d.role === 'S') stage = 1; if (g.slots[1].item && g.slots[2].item) { stage = 2; hand = { tap: function () { return g.pill ? { x: g.pill.x + g.pill.w / 2, y: g.pill.y + g.pill.h / 2 } : null; } }; say('いいね!そろったら「<b>わる!</b>」をタップ。<br>スロットを<b>たくさん埋めるほど倍率アップ</b>。貯めて一気に割ろう!'); } });
        onG('sentence', function () { clearHand(); later(function () { go(7); }, 1600); });
      },
      function () {
        it.junk = spawn({ k: 'prep', v: 'into' }, .5, .3);
        say('いらないバブルは、<b>チャンクくんにドラッグ</b>すると食べてくれるよ。<br><span class="pc-en">into</span> を食べさせてみて!(3回まで。文を作ると回復)');
        hand = { from: at(it.junk), to: function () { return { x: 46, y: g.L.lane.y + g.L.lane.h * .55 }; } };
        g.guide.allow = function (item, slot) { return item === it.junk && (slot === undefined || slot === 'drag'); };
        onG('eat', function () { clearHand(); later(function () { go(8); }, 900); });
      },
      function () {
        say('ばっちり!あとは時間内に、どんどん文を作ろう。<br><b>長い文ほど時間がのびる</b>よ。<b>△や×</b>が出たら理由を見てね!', finish, 'はじめる!');
        g.guide.allow = function () { return false; };
      }
    ];
    function finish() { if (finished) return; finished = true; tm.forEach(clearTimeout); ui.unsay(); ui.unskip(); g.guide = null; done(); }
    ui.skip(finish);
    go(0);
    return { stop: function () { finished = true; tm.forEach(clearTimeout); ui.unsay(); ui.unskip(); } };
  }
  return { run: run };
})();

/* ===== FILE: ui.js ===== */
/* ===== ui.js:画面(DOM)とスタイル。クラス名はすべて pc- 接頭辞 ===== */
var UI = (function () {
  'use strict';
  var CSS = [
    '.pc-root{position:relative;width:100%;height:100%;overflow:hidden;background:#f3ecff;color:#3a2c4a;font-family:' + Art.FONT_JA + ';-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;-webkit-touch-callout:none;-webkit-text-size-adjust:100%;line-height:1.4;box-sizing:border-box}',
    '.pc-root *,.pc-root *::before,.pc-root *::after{box-sizing:border-box}',
    '.pc-root button{font-family:inherit;cursor:pointer;-webkit-appearance:none;appearance:none}',
    '.pc-stage{position:absolute;top:0;bottom:0;left:50%;width:100%;max-width:520px;transform:translateX(-50%);overflow:hidden}',
    '.pc-bg,.pc-cv{position:absolute;left:0;top:0;width:100%;height:100%;display:block}',
    '.pc-en{font-family:' + Art.FONT_EN + '}',
    '.pc-probe{position:absolute;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}',
    /* ボタン */
    '.pc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:0 24px;border:0;border-radius:22px;font-weight:900;font-size:19px;letter-spacing:.04em;color:#fff;background:linear-gradient(180deg,#9a80ff,#6a4cf0);box-shadow:0 5px 0 #4b30c4,0 12px 22px rgba(90,60,200,.32);transition:transform .08s,box-shadow .08s,filter .2s;position:relative}',
    '.pc-btn:active{transform:translateY(4px);box-shadow:0 1px 0 #4b30c4,0 4px 10px rgba(90,60,200,.3)}',
    '.pc-btn svg{width:22px;height:22px;fill:currentColor}',
    '.pc-btn.pink{background:linear-gradient(180deg,#ff9cc2,#ff6f9f);box-shadow:0 5px 0 #d94379,0 12px 22px rgba(255,80,140,.3)}.pc-btn.pink:active{box-shadow:0 1px 0 #d94379}',
    '.pc-btn.mint{background:linear-gradient(180deg,#6fe0ad,#2fbf83);box-shadow:0 5px 0 #1d915f,0 12px 22px rgba(40,180,120,.3)}.pc-btn.mint:active{box-shadow:0 1px 0 #1d915f}',
    '.pc-btn.yellow{color:#5a3d00;background:linear-gradient(180deg,#ffe27a,#ffc93c);box-shadow:0 5px 0 #d79a12,0 12px 22px rgba(240,170,20,.3)}.pc-btn.yellow:active{box-shadow:0 1px 0 #d79a12}',
    '.pc-btn.ghost{color:#5b45c9;background:#fff;box-shadow:0 4px 0 #d8cff7,0 8px 18px rgba(90,60,200,.14)}.pc-btn.ghost:active{box-shadow:0 1px 0 #d8cff7}',
    '.pc-btn.small{min-height:42px;font-size:15px;padding:0 16px;border-radius:16px}',
    '.pc-btn.wide{width:100%}',
    '.pc-btn[disabled]{filter:grayscale(.8) opacity(.6);pointer-events:none}',
    '.pc-ib{width:48px;height:48px;border-radius:18px;border:0;display:inline-flex;align-items:center;justify-content:center;color:#5b45c9;background:rgba(255,255,255,.92);box-shadow:0 4px 0 #d8cff7,0 8px 16px rgba(90,60,200,.15);transition:transform .08s}',
    '.pc-ib:active{transform:translateY(3px);box-shadow:0 1px 0 #d8cff7}',
    '.pc-ib svg{width:24px;height:24px;fill:currentColor}',
    /* 画面 */
    '.pc-scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(var(--pc-top) + 12px) 16px calc(var(--pc-bottom) + 16px);overflow-y:auto;overflow-x:hidden;touch-action:pan-y;-webkit-overflow-scrolling:touch;animation:pc-in .3s cubic-bezier(.2,.9,.3,1.2) both;z-index:20}',
    '.pc-scr.out{animation:pc-out .2s ease-in both;pointer-events:none}',
    '@keyframes pc-in{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}',
    '@keyframes pc-out{to{opacity:0;transform:translateY(10px) scale(.98)}}',
    '.pc-head{display:flex;align-items:center;gap:12px;margin-bottom:12px;min-height:48px}',
    '.pc-head h2{margin:0;font-size:22px;font-weight:900;color:#4a35b5;text-shadow:0 2px 0 #fff}',
    '.pc-card{background:rgba(255,255,255,.9);border-radius:26px;box-shadow:0 10px 30px rgba(80,50,140,.16);padding:16px;margin-bottom:12px}',
    '.pc-card h3{margin:0 0 10px;font-size:15px;color:#6a55c9;font-weight:900;letter-spacing:.05em}',
    '.pc-spacer{flex:1 1 auto;min-height:8px}',
    '.pc-dim{position:absolute;inset:0;background:rgba(50,30,90,.35);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}',
    /* タイトル */
    '.pc-logo{text-align:center;margin-top:min(8vh,60px)}',
    '.pc-logo .ls{display:flex;justify-content:center;gap:2px;flex-wrap:nowrap}',
    '.pc-logo .l{display:inline-flex;align-items:center;justify-content:center;width:min(15vw,62px);height:min(15vw,62px);border-radius:50%;font-size:min(9vw,38px);font-weight:900;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:inset 0 -6px 0 rgba(0,0,0,.12),inset 0 6px 10px rgba(255,255,255,.6),0 6px 14px rgba(80,50,140,.25);animation:pc-bob 2.4s ease-in-out infinite;position:relative}',
    '.pc-logo .l::after{content:"";position:absolute;left:22%;top:14%;width:28%;height:16%;border-radius:50%;background:rgba(255,255,255,.75);transform:rotate(-25deg)}',
    '@keyframes pc-bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-6px) scale(1.04,.96)}}',
    '.pc-logo .sub{margin-top:14px;font-weight:900;color:#6a55c9;font-size:15px;letter-spacing:.12em}',
    '.pc-logo .en{font-family:' + Art.FONT_EN + ';font-weight:900;color:#ff6f9f;font-size:13px;letter-spacing:.3em;margin-top:4px}',
    '.pc-menu{display:flex;flex-direction:column;gap:14px;width:100%;max-width:340px;margin:0 auto}',
    '.pc-row{display:flex;justify-content:center;gap:14px}',
    '.pc-ibl{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:800;color:#5b45c9}',
    '.pc-tap{align-self:center;padding:10px 22px;border-radius:22px;background:rgba(255,255,255,.82);box-shadow:0 6px 18px rgba(80,50,140,.15);font-weight:900;color:#5b45c9;font-size:18px;animation:pc-blink 1.4s ease-in-out infinite}',
    '@keyframes pc-blink{50%{opacity:.55}}',
    /* モード */
    '.pc-lv{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:rgba(255,255,255,.7);padding:5px;border-radius:18px}',
    '.pc-lv button{border:0;border-radius:14px;padding:9px 0;font-weight:900;font-size:13px;white-space:nowrap;letter-spacing:-.02em;color:#6a55c9;background:transparent;transition:background .15s}',
    '.pc-lv button.on{color:#fff;background:linear-gradient(180deg,#9a80ff,#6a4cf0);box-shadow:0 3px 0 #4b30c4}',
    '.pc-lvdesc{font-size:12.5px;color:#6b5d80;margin:8px 4px 0;min-height:18px;font-weight:700}',
    '.pc-mode{display:flex;align-items:center;gap:14px;padding:14px;border-radius:24px;background:rgba(255,255,255,.92);box-shadow:0 8px 22px rgba(80,50,140,.14);margin-top:12px;border:0;width:100%;text-align:left;color:inherit;transition:transform .1s}',
    '.pc-mode:active{transform:scale(.98)}',
    '.pc-mode .ic{flex:0 0 56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.12)}',
    '.pc-mode .ic svg{width:30px;height:30px;fill:#fff}',
    '.pc-mode .tx{flex:1;min-width:0}',
    '.pc-mode b{display:block;font-size:17px;font-weight:900;color:#3a2c4a}',
    '.pc-mode small{display:block;font-size:12.5px;color:#7a6c90;font-weight:700;margin-top:2px}',
    '.pc-mode .best{font-size:12px;color:#ff6f9f;font-weight:900;margin-top:3px;font-family:' + Art.FONT_EN + '}',
    '.pc-mode.locked{opacity:.92}.pc-mode .lock{width:26px;height:26px;fill:#b3a6d6}',
    /* 設定 */
    '.pc-set{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 2px;border-bottom:1px dashed rgba(140,120,200,.25);font-weight:800;font-size:15px}',
    '.pc-set:last-child{border-bottom:0}',
    '.pc-set small{display:block;font-size:11.5px;color:#8a7da0;font-weight:700}',
    '.pc-sw{position:relative;flex:0 0 56px;height:32px;border-radius:16px;background:#ddd5f2;border:0;transition:background .2s}',
    '.pc-sw::after{content:"";position:absolute;left:3px;top:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.2);transition:transform .2s}',
    '.pc-sw.on{background:#3cc98a}.pc-sw.on::after{transform:translateX(24px)}',
    '.pc-sw[disabled]{opacity:.45}',
    '.pc-seg{display:flex;background:#eee8fb;border-radius:14px;padding:3px;gap:2px;flex-wrap:nowrap}',
    '.pc-seg button{border:0;background:transparent;border-radius:11px;padding:7px 10px;font-weight:900;font-size:13px;color:#6a55c9;white-space:nowrap}',
    '.pc-seg button.on{background:#fff;box-shadow:0 2px 6px rgba(80,50,140,.18);color:#4a35b5}',
    '.pc-seg[aria-disabled=true]{opacity:.45;pointer-events:none}',
    '.pc-range{-webkit-appearance:none;appearance:none;width:130px;height:8px;border-radius:4px;background:#e2daf7;outline:none}',
    '.pc-range::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#7b5cff;box-shadow:0 2px 5px rgba(0,0,0,.25);border:3px solid #fff}',
    '.pc-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#7b5cff;border:3px solid #fff}',
    /* HUD */
    '.pc-hud{position:absolute;left:0;right:0;top:var(--pc-top);height:58px;display:flex;align-items:center;gap:10px;padding:0 10px;z-index:10;pointer-events:none}',
    '.pc-hud>*{pointer-events:auto}',
    '.pc-hud .pc-ib{width:44px;height:44px;border-radius:16px}',
    '.pc-score{flex:1;text-align:center;line-height:1}',
    '.pc-score b{display:block;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:28px;color:#4a35b5;text-shadow:0 2px 0 #fff,0 0 12px rgba(255,255,255,.9);transition:transform .15s}',
    '.pc-score b.bump{transform:scale(1.15)}',
    '.pc-combo{display:inline-block;margin-top:3px;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:12px;color:#fff;background:linear-gradient(90deg,#ff7aa8,#ff9b6a);border-radius:10px;padding:2px 8px;opacity:0;transition:opacity .2s}',
    '.pc-combo.on{opacity:1}',
    '.pc-timer{position:relative;width:52px;height:52px}',
    '.pc-timer svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}',
    '.pc-timer span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:17px;color:#4a35b5}',
    '.pc-timer.warn span{color:#ef4d63;animation:pc-pulse .5s ease-in-out infinite alternate}',
    '@keyframes pc-pulse{to{transform:scale(1.18)}}',
    '.pc-prev{position:absolute;left:12px;right:12px;top:calc(var(--pc-top) + 58px);height:30px;display:flex;align-items:center;justify-content:center;z-index:9;pointer-events:none}',
    '.pc-prev div{max-width:100%;display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:15px;background:rgba(255,255,255,.88);box-shadow:0 3px 10px rgba(80,50,140,.12);font-family:' + Art.FONT_EN + ';font-weight:800;font-size:14px;color:#3a2c4a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .15s}',
    '.pc-prev div.empty{opacity:0}',
    '.pc-prev i{font-style:normal;flex:0 0 auto;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-family:' + Art.FONT_JA + '}',
    '.pc-prev .goal{background:rgba(255,247,220,.95)}.pc-prev .goal i{background:#ffb21f}.pc-prev .goal small{font-size:12.5px;font-weight:900;color:#7a5200}',
    '.pc-prev .ok i{background:#3cc98a}.pc-prev .bad i{background:#ef4d63}.pc-prev .wait i{background:#f5a524}.pc-prev .sel i{background:#7b5cff}',
    '.pc-prev small{font-family:' + Art.FONT_JA + ';font-size:11px;color:#8a7da0;overflow:hidden;text-overflow:ellipsis}',
    '.pc-items{position:absolute;right:10px;display:flex;gap:8px;z-index:9}',
    '.pc-items button{position:relative;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.95);color:#7b5cff;box-shadow:0 3px 0 #d8cff7,0 6px 12px rgba(90,60,200,.15);display:flex;align-items:center;justify-content:center}',
    '.pc-items button svg{width:22px;height:22px;fill:currentColor}',
    '.pc-items button em{position:absolute;right:-4px;top:-4px;min-width:18px;height:18px;border-radius:9px;background:#ff6f9f;color:#fff;font-style:normal;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:' + Art.FONT_EN + '}',
    '.pc-items button.zero{opacity:.45}',
    /* 演出用の文字 */
    '.pc-toast{position:absolute;left:50%;top:calc(var(--pc-top) + 96px);transform:translateX(-50%);z-index:12;pointer-events:none;display:flex;align-items:center;gap:8px;max-width:92%;padding:9px 16px;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(80,50,140,.22);font-weight:900;font-size:14px;color:#3a2c4a;animation:pc-toast 2.3s ease both}',
    '.pc-toast i{font-style:normal;flex:0 0 auto;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px}',
    '.pc-toast.x i{background:#ef4d63}.pc-toast.tri i{background:#f5a524}.pc-toast.info i{background:#7b5cff}',
    '@keyframes pc-toast{0%{opacity:0;transform:translate(-50%,-10px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-6px)}}',
    '.pc-banner{position:absolute;left:12px;right:12px;top:38%;z-index:12;pointer-events:none;text-align:center;animation:pc-ban 2.2s cubic-bezier(.2,.9,.3,1.2) both}',
    '.pc-banner div{display:inline-block;max-width:100%;padding:14px 20px;border-radius:24px;background:linear-gradient(180deg,#fff,#f6f0ff);box-shadow:0 12px 30px rgba(80,50,140,.3),inset 0 -4px 0 rgba(140,110,230,.15);font-family:' + Art.FONT_EN + ';font-weight:900;font-size:21px;color:#3a2c4a;line-height:1.35}',
    '.pc-banner u{text-decoration:none;color:#ff4f8b;border-bottom:3px solid #ffb3cc}',
    '.pc-banner small{display:block;margin-top:6px;font-size:14px;color:#ff6f9f}','.pc-banner .pf{display:inline-block;padding:1px 10px;border-radius:10px;background:linear-gradient(90deg,#ffd23f,#ff9b6a);color:#fff;font-size:15px;margin-right:4px}',
    '.pc-banner .ok{display:inline-flex;width:28px;height:28px;border-radius:50%;background:#3cc98a;color:#fff;align-items:center;justify-content:center;vertical-align:-5px;margin-right:6px}.pc-banner .ok svg{width:18px;height:18px;fill:none;stroke:#fff}',
    '@keyframes pc-ban{0%{opacity:0;transform:scale(.6)}12%{opacity:1;transform:scale(1.04)}20%{transform:scale(1)}82%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-24px)}}',
    '.pc-count{position:absolute;left:0;right:0;top:36%;text-align:center;z-index:13;pointer-events:none;font-weight:900;font-size:72px;color:#fff;-webkit-text-stroke:3px #6a4cf0;text-shadow:0 6px 0 #4b30c4,0 12px 30px rgba(80,50,180,.45);animation:pc-cnt .8s cubic-bezier(.2,.9,.3,1.4) both}',
    '.pc-count.big{font-size:52px;animation-duration:1.4s}',
    '@keyframes pc-cnt{0%{opacity:0;transform:scale(.3)}30%{opacity:1;transform:scale(1.1)}45%{transform:scale(1)}85%{opacity:1}100%{opacity:0;transform:scale(1.15)}}',
    '.pc-tip{position:absolute;z-index:11;pointer-events:none;transform:translate(-50%,-100%);padding:8px 12px;border-radius:14px;background:#3d2d66;color:#fff;font-family:' + Art.FONT_EN + ';font-weight:800;font-size:15px;white-space:nowrap;box-shadow:0 8px 20px rgba(40,20,80,.3);max-width:94%}',
    '.pc-tip small{display:block;font-family:' + Art.FONT_JA + ';font-weight:700;font-size:11.5px;color:#d9ccff;margin-top:1px}',
    '.pc-tip::after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#3d2d66}',
    /* 結果 */
    '.pc-res-score{text-align:center;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:56px;color:#4a35b5;text-shadow:0 3px 0 #fff;line-height:1.1}',
    '.pc-new{display:inline-block;margin:4px auto 0;padding:4px 12px;border-radius:12px;background:linear-gradient(90deg,#ffd23f,#ff9b6a);color:#fff;font-weight:900;font-size:14px;animation:pc-pulse .6s ease-in-out infinite alternate;font-family:' + Art.FONT_EN + '}',
    '.pc-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.pc-stats div{background:#f5f0ff;border-radius:16px;padding:9px 10px;text-align:center}',
    '.pc-stats b{display:block;font-family:' + Art.FONT_EN + ';font-size:22px;font-weight:900;color:#5b45c9}',
    '.pc-stats small{font-size:11.5px;font-weight:800;color:#7a6c90}',
    '.pc-list{display:flex;flex-direction:column;gap:6px;max-height:34vh;overflow:auto;touch-action:pan-y}',
    '.pc-sent{display:flex;align-items:center;gap:8px;background:#faf7ff;border-radius:14px;padding:7px 8px 7px 12px;font-family:' + Art.FONT_EN + ';font-weight:800;font-size:14px}',
    '.pc-sent span{flex:1;min-width:0}',
    '.pc-sent button{flex:0 0 34px;height:34px;border-radius:50%;border:0;background:#ece5ff;color:#6a4cf0;display:flex;align-items:center;justify-content:center}',
    '.pc-sent button svg{width:18px;height:18px;fill:currentColor}',
    '.pc-goal{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:#fff7dc;font-weight:900;font-size:14px;color:#7a5200}',
    '.pc-goal.done{background:#ddf7ea;color:#1d7a50}',
    /* 記録 */
    '.pc-tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;touch-action:pan-x}',
    '.pc-tabs button{flex:0 0 auto;border:0;border-radius:14px;padding:8px 12px;font-weight:900;font-size:13px;background:rgba(255,255,255,.75);color:#6a55c9}',
    '.pc-tabs button.on{background:#6a4cf0;color:#fff}',
    '.pc-rank{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px dashed rgba(140,120,200,.25);font-weight:800}',
    '.pc-rank .n{flex:0 0 30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#eee8fb;color:#6a55c9;font-family:' + Art.FONT_EN + ';font-weight:900}',
    '.pc-rank:nth-child(1) .n{background:#ffd23f;color:#6b4a00}.pc-rank:nth-child(2) .n{background:#dfe3ee;color:#4b5266}.pc-rank:nth-child(3) .n{background:#f6c6a0;color:#7a3f12}',
    '.pc-rank .s{flex:1;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:18px;color:#3a2c4a}',
    '.pc-rank small{color:#8a7da0;font-size:11.5px}',
    '.pc-empty{text-align:center;color:#8a7da0;font-weight:800;padding:24px 0}',
    /* ショップ */
    '.pc-prod{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px dashed rgba(140,120,200,.25)}',
    '.pc-prod:last-child{border-bottom:0}',
    '.pc-prod .ic{flex:0 0 46px;height:46px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#f1ebff;color:#7b5cff}',
    '.pc-prod .ic svg{width:26px;height:26px;fill:currentColor}',
    '.pc-prod .tx{flex:1}.pc-prod b{display:block;font-size:15px}.pc-prod small{font-size:12px;color:#7a6c90;font-weight:700}',
    '.pc-note{font-size:11.5px;color:#8a7da0;font-weight:700;text-align:center;margin:4px 0 10px}',
    /* モーダル・チュートリアル */
    '.pc-modal{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px}',
    '.pc-modal .pc-card{position:relative;width:100%;max-width:340px;text-align:center;animation:pc-in .25s cubic-bezier(.2,.9,.3,1.3) both}',
    '.pc-modal p{margin:6px 0 16px;font-weight:800;font-size:15px;color:#4a3d60}',
    '.pc-say{position:absolute;left:12px;right:12px;z-index:30;display:flex;flex-direction:column;align-items:stretch;gap:10px;padding:14px 16px;border-radius:22px;background:#fff;box-shadow:0 10px 30px rgba(80,50,140,.28);animation:pc-in .3s cubic-bezier(.2,.9,.3,1.3) both}',
    '.pc-say p{margin:0;font-weight:800;font-size:15.5px;line-height:1.55;color:#3a2c4a}',
    '.pc-say p b{color:#ff4f8b}.pc-say p .pc-en{color:#5b45c9;font-weight:900}',
    '.pc-say::after{content:"";position:absolute;left:34px;bottom:-10px;border:10px solid transparent;border-bottom:0;border-top-color:#fff}',
    '.pc-say .row{display:flex;justify-content:flex-end;gap:8px}',
    '.pc-skip{position:absolute;right:12px;top:calc(var(--pc-top) + 64px);z-index:31}',
    '.pc-credits p{font-size:13.5px;font-weight:700;color:#4a3d60;margin:0 0 10px;line-height:1.7}',
    '.pc-tgear{position:absolute;top:calc(var(--pc-top) + 12px);left:14px;z-index:3}',
    '.pc-lvnow{font-size:12.5px;font-weight:800;color:#8a6aa8;text-align:center;margin:2px 0 10px}',
    '.pc-ttsnote{font-size:11.5px;color:#a0567a;font-weight:800;text-align:center;margin-top:6px}',
    '@media (prefers-reduced-motion: reduce){.pc-logo .l,.pc-tap{animation:none}.pc-scr{animation-duration:.01s}}'
  ].join('\n');
  var styleRef = 0, styleEl = null;
  function injectCSS() { styleRef++; if (styleEl) return; styleEl = document.createElement('style'); styleEl.setAttribute('data-punichunk', ''); styleEl.textContent = CSS; document.head.appendChild(styleEl); }
  function removeCSS() { styleRef--; if (styleRef <= 0 && styleEl) { styleEl.remove(); styleEl = null; styleRef = 0; } }

  function create(app, stageEl) {
    var el = U.el, ui = { stage: stageEl }, hudEl = null, prevEl = null, itemsEl = null, layer = el('div', { class: 'pc-layer' });
    stageEl.appendChild(layer);
    function icon(n) { return Art.ICON[n] || ''; }
    // 画面が切り替わった直後のタップは無視する(前の画面のタップが新しい画面のボタンに当たる「すり抜け」防止)
    var shownAt = 0; function early() { return Date.now() - shownAt < 400; }
    function btn(label, cls, fn, ic) { var b = el('button', { class: 'pc-btn ' + (cls || ''), onclick: function (e) { if (early()) return; app.audio.sfx('button'); app.audio.unlock(); fn && fn(e); } }); if (ic) b.innerHTML = icon(ic); b.appendChild(document.createTextNode(label)); return b; }
    function ib(ic, label, fn) { var b = el('button', { class: 'pc-ib', 'aria-label': label, html: icon(ic), onclick: function (e) { if (early()) return; app.audio.sfx('button'); app.audio.unlock(); fn && fn(e); } }); return b; }
    ui.btn = btn; ui.ib = ib; ui.icon = icon;
    var cur = null;
    function screen(node) {
      if (cur) { var old = cur; old.classList.add('out'); old.style.pointerEvents = 'none'; setTimeout(function () { old.remove(); }, 200); }
      shownAt = Date.now(); cur = node; if (node) stageEl.appendChild(node); return node;
    }
    ui.clear = function () { screen(null); };
    function head(title, back) { return el('div', { class: 'pc-head' }, [ib('back', 'もどる', back), el('h2', { text: title })]); }

    // ---------- 起動 ----------
    ui.splash = function (onGo) {
      var n = el('div', { class: 'pc-scr', onclick: function () { app.audio.unlock(); onGo(); } }, [logo(), el('div', { class: 'pc-spacer' }), el('div', { class: 'pc-tap', text: 'タップしてはじめる' }), el('div', { style: { height: '24vh' } })]);
      return screen(n);
    };
    function logo() {
      var letters = ['ぷ', 'に', 'チ', 'ャ', 'ン', 'ク'], cols = ['#ff7aa8', '#ffb347', '#7b5cff', '#5aa8f0', '#3cc98a', '#ff6f9f'];
      return el('div', { class: 'pc-logo' }, [el('div', { class: 'ls' }, letters.map(function (c, i) { return el('span', { class: 'l', text: c, style: { background: 'radial-gradient(circle at 35% 30%,#fff 0,' + cols[i] + ' 60%)', animationDelay: (i * .12) + 's', width: c === 'ャ' ? 'min(11vw,46px)' : '', height: c === 'ャ' ? 'min(11vw,46px)' : '', fontSize: c === 'ャ' ? 'min(7vw,28px)' : '', alignSelf: c === 'ャ' ? 'flex-end' : '' } }); })), el('div', { class: 'sub', text: '英語脳バブルパズル' }), el('div', { class: 'en', text: 'PUNI CHUNK' })]);
    }
    // ---------- タイトル ----------
    ui.title = function (h) {
      var n = el('div', { class: 'pc-scr' }, [
        muteBtn(), el('div', { class: 'pc-tgear' }, [ib('gear', '設定', h.settings)]), logo(), el('div', { class: 'pc-spacer' }),
        el('div', { class: 'pc-menu' }, [
          btn('あそぶ', 'wide', h.play, 'play'),
          btn('あそびかた', 'ghost wide', h.tutorial, 'info'),
          el('div', { class: 'pc-row' }, [
            el('div', { class: 'pc-ibl' }, [ib('trophy', '記録', h.records), document.createTextNode('記録')]),
            el('div', { class: 'pc-ibl' }, [ib('shop', 'ショップ', h.shop), document.createTextNode('ショップ')]),
            el('div', { class: 'pc-ibl' }, [ib('star', 'クレジット', h.credits), document.createTextNode('クレジット')])
          ])
        ]),
        el('div', { style: { height: '20vh', minHeight: '150px' } })
      ]);
      screen(n);
      setTimeout(function () { var lg = n.querySelector('.pc-logo'), mn = n.querySelector('.pc-menu'), H = stageEl.clientHeight; if (lg && mn && H) { var sr = stageEl.getBoundingClientRect(); app.band = { y0: (lg.getBoundingClientRect().bottom - sr.top) / H, y1: (mn.getBoundingClientRect().top - sr.top) / H }; } }, 350);
      return n;
    };
    function muteBtn() {
      var s = app.settings, b = ib('speaker', '音のオン/オフ', function () { var on = !(s.bgm > 0 || s.sfx > 0); if (on) { s.bgm = s._bgm || .5; s.sfx = s._sfx || .8; } else { s._bgm = s.bgm; s._sfx = s.sfx; s.bgm = 0; s.sfx = 0; } app.saveSettings(); paint(); });
      function paint() { var off = !(s.bgm > 0 || s.sfx > 0); b.style.opacity = off ? .45 : 1; b.setAttribute('aria-pressed', off ? 'true' : 'false'); b.innerHTML = icon('speaker') + (off ? '<i style="position:absolute;width:28px;height:3px;background:#ef4d63;transform:rotate(-45deg);border-radius:2px"></i>' : ''); }
      b.style.position = 'absolute'; b.style.right = '14px'; b.style.top = 'calc(var(--pc-top) + 12px)'; paint(); return b;
    }
    // ---------- モード選択 ----------
    ui.modes = function (h) {
      var lvBox = el('div', { class: 'pc-lv' }), desc = el('div', { class: 'pc-lvdesc' }), list = el('div');
      function render() {
        lvBox.innerHTML = ''; app.LEVELS.forEach(function (L) { lvBox.appendChild(el('button', { class: L.id === app.state.level ? 'on' : '', text: L.name, onclick: function () { app.audio.sfx('button'); app.state.level = L.id; app.saveState(); render(); } })); });
        desc.textContent = app.LEVELS[app.state.level].desc;
        list.innerHTML = '';
        app.MODES.forEach(function (m) {
          var best = app.best(m.id, app.state.level), locked = m.premium && !app.services.store.isPremium();
          var ic = el('div', { class: 'ic', style: { background: m.bg }, html: icon(m.icon) });
          var card = el('button', { class: 'pc-mode' + (locked ? ' locked' : ''), onclick: function () { if (early()) return; app.audio.sfx('button'); app.audio.unlock(); locked ? h.shop() : h.start(m.id); } }, [
            ic, el('div', { class: 'tx' }, [el('b', { text: m.name }), el('small', { text: m.desc }), el('div', { class: 'best', text: locked ? 'プレミアムで解放' : best ? 'BEST ' + U.fmt(best) : 'まだ記録なし' })]),
            locked ? el('span', { html: icon('lock').replace('<svg', '<svg class="lock"') }) : null
          ]);
          list.appendChild(card);
        });
      }
      render();
      return screen(el('div', { class: 'pc-scr' }, [head('モードをえらぶ', h.back), el('div', { class: 'pc-lvnow', text: 'むずかしさ:' + app.LEVELS[app.state.level].name + '(設定で変更)' }), list, el('div', { style: { height: '170px', flex: '0 0 auto' } })]));
    };
    // ---------- 設定 ----------
    function levelCard() {
      var lvBox = el('div', { class: 'pc-lv' }), desc = el('div', { class: 'pc-lvdesc' });
      function render() { lvBox.innerHTML = ''; app.LEVELS.forEach(function (L) { lvBox.appendChild(el('button', { class: L.id === app.state.level ? 'on' : '', text: L.name, onclick: function () { app.audio.sfx('button'); app.state.level = L.id; app.saveState(); render(); } })); }); desc.textContent = app.LEVELS[app.state.level].desc; }
      render(); return el('div', { class: 'pc-card' }, [el('h3', { text: 'むずかしさ' }), lvBox, desc]);
    }
    ui.settings = function (h) {
      var s = app.settings;
      function sw(key, label, sub, dis) { var b = el('button', { class: 'pc-sw' + (s[key] ? ' on' : ''), 'aria-label': label, 'aria-pressed': s[key] ? 'true' : 'false', disabled: dis ? 'disabled' : null, onclick: function () { s[key] = !s[key]; b.classList.toggle('on', s[key]); app.saveSettings(); app.audio.sfx('button'); h.changed && h.changed(key); } }); return el('div', { class: 'pc-set' }, [el('div', {}, [document.createTextNode(label), sub ? el('small', { text: sub }) : null]), b]); }
      function seg(key, label, opts, dis, sub) { var box = el('div', { class: 'pc-seg', 'aria-disabled': dis ? 'true' : 'false' }); opts.forEach(function (o) { box.appendChild(el('button', { class: s[key] === o[0] ? 'on' : '', text: o[1], onclick: function () { s[key] = o[0]; Array.prototype.forEach.call(box.children, function (c, i) { c.classList.toggle('on', opts[i][0] === o[0]); }); app.saveSettings(); app.audio.sfx('button'); h.changed && h.changed(key); } })); }); return el('div', { class: 'pc-set' }, [el('div', {}, [document.createTextNode(label), sub ? el('small', { text: sub }) : null]), box]); }
      function range(key, label) { var r = el('input', { type: 'range', class: 'pc-range', min: 0, max: 100, value: Math.round(s[key] * 100), 'aria-label': label }); r.addEventListener('input', function () { s[key] = r.value / 100; app.saveSettings(); app.applyAudio(); }); r.addEventListener('change', function () { app.audio.sfx('button'); }); return el('div', { class: 'pc-set' }, [el('div', { text: label }), r]); }
      var autoBox = el('div');
      function renderAuto() {
        autoBox.innerHTML = '';
        autoBox.appendChild(sw('custom', '自分で細かく決める', 'オフのときは、むずかしさに合わせて自動で決まる'));
        var dis = !s.custom;
        [['art', '冠詞 a / the'], ['prep', '前置詞 at / on / in'], ['verb', '動詞の形(過去など)'], ['ti', 'to / -ing'], ['er', '-er / -est']].forEach(function (k) {
          var b = el('div', { class: 'pc-seg', 'aria-disabled': dis ? 'true' : 'false' });
          [[true, '自動'], [false, '手動']].forEach(function (o) { b.appendChild(el('button', { class: s.auto[k[0]] === o[0] ? 'on' : '', text: o[1], onclick: function () { s.auto[k[0]] = o[0]; app.saveSettings(); app.audio.sfx('button'); renderAuto(); } })); });
          autoBox.appendChild(el('div', { class: 'pc-set' }, [el('div', { text: k[1] }), b]));
        });
        autoBox.appendChild(seg('color', '色のヒント', [['pos', '品詞'], ['chunk', 'チャンク'], ['none', 'なし']], dis));
      }
      var oldCustom = h.changed; h.changed = function (k) { if (k === 'custom') renderAuto(); oldCustom && oldCustom(k); };
      renderAuto();
      var ttsNote = app.audio.ttsAvailable() ? null : el('div', { class: 'pc-ttsnote', text: 'この端末では英語の読み上げが使えないようです(字幕で表示します)' });
      var data = el('div', { class: 'pc-card' }, [el('h3', { text: 'データ' }), btn('記録をすべて消す', 'ghost small', function () { ui.confirm('記録と設定を消しますか?', 'けす', function () { app.resetData(); ui.toast('記録を消しました', 'info'); }); })]);
      return screen(el('div', { class: 'pc-scr' }, [head('設定', h.back), levelCard(),
        el('div', { class: 'pc-card' }, [el('h3', { text: '音' }), range('bgm', 'BGM'), range('sfx', '効果音'), sw('voice', '英語の読み上げ'), seg('rate', '読み上げの速さ', [[.8, 'ゆっくり'], [1, 'ふつう'], [1.15, 'はやい']]), ttsNote]),
        el('div', { class: 'pc-card' }, [el('h3', { text: 'あそびかた' }), seg('hint', 'ヒント', [['none', 'なし'], ['press', '長押し'], ['always', 'いつも']], false, '長押し:候補が目立つ(コンボ少し減)'), sw('gloss', 'チャンクの意味を表示', 'できたチャンクに日本語を小さく出す')]),
        el('div', { class: 'pc-card' }, [el('h3', { text: '自動 / 手動' }), autoBox]),
        el('div', { class: 'pc-card' }, [el('h3', { text: '演出' }), sw('lite', '軽量モード', '古い端末向けに演出をひかえめに'), sw('vibe', '振動', '対応している端末のみ')]),
        data, el('div', { style: { height: '20px', flex: '0 0 auto' } })]));
    };
    // ---------- 記録 ----------
    ui.records = function (h) {
      var tabs = el('div', { class: 'pc-tabs' }), box = el('div', { class: 'pc-card' }), sel = { m: app.MODES[0].id, l: app.state.level };
      function render() {
        tabs.innerHTML = ''; app.MODES.forEach(function (m) { tabs.appendChild(el('button', { class: m.id === sel.m ? 'on' : '', text: m.name, onclick: function () { sel.m = m.id; app.audio.sfx('button'); render(); } })); });
        box.innerHTML = '';
        var lv = el('div', { class: 'pc-lv', style: { marginBottom: '8px' } }); app.LEVELS.forEach(function (L) { lv.appendChild(el('button', { class: L.id === sel.l ? 'on' : '', text: L.name, onclick: function () { sel.l = L.id; app.audio.sfx('button'); render(); } })); });
        box.appendChild(lv);
        var listEl = el('div'); box.appendChild(listEl);
        app.services.ranking.top(sel.m, sel.l).then(function (list) {
          if (!list.length) { listEl.appendChild(el('div', { class: 'pc-empty', text: 'まだ記録がありません' })); return; }
          list.forEach(function (r, i) { listEl.appendChild(el('div', { class: 'pc-rank' }, [el('div', { class: 'n', text: String(i + 1) }), el('div', { class: 's' }, [document.createTextNode(U.fmt(r.score)), el('small', { text: '  ' + (r.sentences || 0) + '文 · ' + (r.date || '') })])])); });
        });
      }
      render();
      var st = app.lifetime();
      return screen(el('div', { class: 'pc-scr' }, [head('記録', h.back), tabs, box,
        el('div', { class: 'pc-card' }, [el('h3', { text: 'これまで' }), el('div', { class: 'pc-stats' }, [stat(st.plays, 'あそんだ回数'), stat(st.sentences, '作った文'), stat(st.maxCombo, '最大コンボ'), stat(st.longestN, 'いちばん長い文(語)')]), st.longest ? el('div', { class: 'pc-sent', style: { marginTop: '8px' } }, [el('span', { text: st.longest }), speakBtn(st.longest)]) : null])]));
    };
    function stat(v, l) { return el('div', {}, [el('b', { text: U.fmt(v || 0) }), el('small', { text: l })]); }
    function speakBtn(text) { return el('button', { 'aria-label': '読み上げ', html: icon('speaker'), onclick: function () { app.audio.unlock(); app.audio.speak(text); } }); }
    // ---------- ショップ ----------
    ui.shop = function (h) {
      var st = app.services.store, box = el('div');
      function render() {
        box.innerHTML = ''; var inv = st.inventory();
        var prem = st.isPremium();
        box.appendChild(el('div', { class: 'pc-card' }, [el('h3', { text: 'プレミアム' }), el('div', { class: 'pc-prod' }, [el('div', { class: 'ic', html: icon('star') }), el('div', { class: 'tx' }, [el('b', { text: 'プレミアム会員' }), el('small', { text: '日替わりお題+自由に使える「あき」スロット' })]), prem ? el('b', { text: '加入中', style: { color: '#3cc98a' } }) : btn(st.price('premium'), 'pink small', function () { buy('premium'); })])]));
        var items = [['hint', 'hint', 'ヒント+ ×5', '作れる文を番号で教えてくれる'], ['magic', 'magic', 'まほうバブル ×3', 'つなげたい単語に変身する'], ['auto', 'auto', 'オートくっつけ ×3', '単語を自動でチャンクにする']];
        box.appendChild(el('div', { class: 'pc-card' }, [el('h3', { text: 'アイテム' })].concat(items.map(function (it) { return el('div', { class: 'pc-prod' }, [el('div', { class: 'ic', html: icon(it[1]) }), el('div', { class: 'tx' }, [el('b', { text: it[2] }), el('small', { text: it[3] + '(所持 ' + (inv[it[0]] || 0) + ')' })]), btn(st.price(it[0]), 'yellow small', function () { buy(it[0]); })]); }))));
        if (st.isDummy) box.lastChild.appendChild(el('div', { class: 'pc-note', text: 'テスト版:実際の支払いは発生しません' }));
      }
      function buy(id) { ui.confirm(st.isDummy ? '(テスト購入)購入しますか?' : '購入しますか?', '買う', function () { st.purchase(id).then(function (ok) { if (ok) { app.audio.sfx('best'); ui.toast('ありがとう!', 'info'); app.emit('purchase', { id: id }); } else ui.toast('購入できませんでした', 'x'); render(); }); }); }
      render();
      return screen(el('div', { class: 'pc-scr' }, [head('ショップ', h.back), box]));
    };
    // ---------- クレジット ----------
    ui.credits = function (h) {
      return screen(el('div', { class: 'pc-scr' }, [head('クレジット', h.back), el('div', { class: 'pc-card pc-credits' }, [
        el('h3', { text: 'ぷにチャンク' }),
        el('p', { text: '英語を「チャンク(意味のかたまり)」でつかむ、バブルパズル。' }),
        el('p', { text: 'グラフィック・効果音・BGM・チャンクくんは、すべてプログラムで描いています。外部の素材は使っていません。' }),
        el('h3', { text: '辞書' }),
        el('p', { text: app.dictCredit }),
        el('p', { text: '英語の読み上げには、端末に内蔵された音声合成を使っています。' }),
        el('h3', { text: 'バージョン' }), el('p', { class: 'pc-en', text: 'v' + app.version })
      ])]));
    };
    // ---------- 一時停止 ----------
    ui.pause = function (h) {
      var n = el('div', { class: 'pc-modal' }, [el('div', { class: 'pc-dim' }), el('div', { class: 'pc-card' }, [el('h3', { text: 'ひと休み', style: { fontSize: '20px' } }),
        el('div', { class: 'pc-menu' }, [btn('つづける', 'wide', h.resume, 'play'), btn('やりなおす', 'ghost wide', h.retry, 'retry'), h.finish ? btn('おわる(結果へ)', 'ghost wide', h.finish) : null, btn('設定', 'ghost wide', h.settings, 'gear'), btn('タイトルへ', 'ghost wide', h.title, 'home')])])]);
      n.style.zIndex = 35; stageEl.appendChild(n); return n;
    };
    ui.confirm = function (msg, ok, fn, cancelLabel) {
      var n = el('div', { class: 'pc-modal' }, [el('div', { class: 'pc-dim' }), el('div', { class: 'pc-card' }, [el('p', { text: msg }), el('div', { class: 'pc-row' }, [btn(cancelLabel || 'やめる', 'ghost small', function () { n.remove(); }), btn(ok, 'pink small', function () { n.remove(); fn(); })])])]);
      n.style.zIndex = 50; stageEl.appendChild(n); return n;
    };
    // ---------- 結果 ----------
    ui.result = function (r, h) {
      var scoreEl = el('div', { class: 'pc-res-score', text: '0' });
      var list = el('div', { class: 'pc-list' }, r.stats.list.length ? r.stats.list.map(function (s) { return el('div', { class: 'pc-sent' }, [el('span', { text: s.text }), speakBtn(s.text)]); }) : [el('div', { class: 'pc-empty', text: '文はまだ作れなかった…次はきっと!' })]);
      var goal = r.goal ? el('div', { class: 'pc-goal' + (r.goal.done ? ' done' : '') }, [el('span', { text: r.goal.done ? '◎ お題クリア! +' + U.fmt(r.goal.bonus) : '△ お題:' + r.goal.text })]) : null;
      var n = el('div', { class: 'pc-scr' }, [
        el('div', { class: 'pc-head', style: { justifyContent: 'center' } }, [el('h2', { text: r.modeName + ' · ' + r.levelName })]),
        el('div', { class: 'pc-card', style: { textAlign: 'center' } }, [scoreEl, r.newBest ? el('div', { class: 'pc-new', text: 'NEW RECORD!' }) : el('div', { style: { fontSize: '12px', color: '#8a7da0', fontWeight: 800 }, text: r.best ? 'BEST ' + U.fmt(r.best) : '' }), r.practice ? el('div', { class: 'pc-note', text: '今日の記録はつけ済み(練習プレイ)' }) : null]),
        goal,
        el('div', { class: 'pc-card' }, [el('div', { class: 'pc-stats' }, [stat(r.stats.sentences, '作った文'), stat(r.stats.chunks, 'チャンク'), stat(r.stats.maxCombo, '最大コンボ'), stat(r.stats.longestN, 'いちばん長い文(語)')])]),
        el('div', { class: 'pc-card' }, [el('h3', { text: '作った文' }), list]),
        el('div', { class: 'pc-menu' }, [btn('もう一度', 'pink wide', h.retry, 'retry'), el('div', { class: 'pc-row' }, [btn('モード', 'ghost small', h.modes), btn('タイトル', 'ghost small', h.title, 'home')])]),
        el('div', { style: { height: '120px', flex: '0 0 auto' } })
      ]);
      screen(n);
      var t0 = performance.now(), D = 900;
      (function step() { var k = Math.min(1, (performance.now() - t0) / D); scoreEl.textContent = U.fmt(r.score * U.E.outCubic(k)); if (k < 1 && n.isConnected) requestAnimationFrame(step); })();
      return n;
    };
    // ---------- プレイ中のHUD ----------
    ui.hudShow = function (h) {
      ui.hudHide();
      var timer = el('div', { class: 'pc-timer', html: '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="rgba(255,255,255,.92)" stroke="#e6defa" stroke-width="5"/><circle class="arc" cx="26" cy="26" r="22" fill="none" stroke="#7b5cff" stroke-width="5" stroke-linecap="round" stroke-dasharray="138.2" stroke-dashoffset="0"/></svg><span>60</span>' });
      var score = el('b', { text: '0' }), combo = el('span', { class: 'pc-combo', text: 'x1.0' });
      hudEl = el('div', { class: 'pc-hud' }, [ib('pause', '一時停止', h.pause), el('div', { class: 'pc-score' }, [score, combo]), timer]);
      prevEl = el('div', { class: 'pc-prev' }, [el('div', { class: 'empty' })]);
      itemsEl = el('div', { class: 'pc-items' });
      stageEl.appendChild(hudEl); stageEl.appendChild(prevEl); stageEl.appendChild(itemsEl);
      ui._hud = { score: score, combo: combo, timer: timer, arc: timer.querySelector('.arc'), num: timer.querySelector('span'), last: {} };
      ui.itemsRender(h.inv(), h.useItem);
    };
    ui.hudHide = function () { ui.goal = null; [hudEl, prevEl, itemsEl].forEach(function (e) { if (e) e.remove(); }); hudEl = prevEl = itemsEl = null; ui._hud = null; ui.tip(null); };
    ui.itemsPos = function (y) { if (itemsEl) itemsEl.style.top = (y - 20) + 'px'; };
    ui.itemsRender = function (inv, use) {
      if (!itemsEl) return; itemsEl.innerHTML = '';
      [['hint', 'ヒント+'], ['magic', 'まほうバブル'], ['auto', 'オートくっつけ']].forEach(function (k) {
        var c = inv[k[0]] || 0, b = el('button', { class: c ? '' : 'zero', 'aria-label': k[1], html: icon(k[0]) + '<em>' + c + '</em>', onclick: function () { app.audio.unlock(); if (!c) { app.audio.sfx('reject'); ui.toast(k[1] + 'はショップで手に入る', 'info'); return; } use(k[0]); } });
        itemsEl.appendChild(b);
      });
    };
    ui.hud = function (o) {
      var H = ui._hud; if (!H) return; var L = H.last;
      var sc = U.fmt(o.score); if (L.score !== sc) { H.score.textContent = sc; H.score.classList.add('bump'); clearTimeout(H.bt); H.bt = setTimeout(function () { H.score.classList.remove('bump'); }, 140); L.score = sc; }
      var cb = o.combo >= 2 ? o.combo + ' COMBO  x' + o.mult.toFixed(1) : ''; if (L.cb !== cb) { H.combo.textContent = cb; H.combo.classList.toggle('on', !!cb); L.cb = cb; }
      var k, txt;
      if (o.time != null) { k = U.clamp(o.time / (o.timeMax || 60), 0, 1); txt = String(Math.ceil(o.time)); }
      else if (o.fill != null) { k = U.clamp(o.fill, 0, 1); txt = Math.round(o.fill * 100) + '%'; }
      else { k = 1; txt = '∞'; }
      var off = (138.2 * (1 - k)).toFixed(1); if (L.off !== off) { H.arc.setAttribute('stroke-dashoffset', off); L.off = off; }
      if (L.txt !== txt) { H.num.textContent = txt; L.txt = txt; }
      var col = o.warn ? '#ef4d63' : o.fill != null ? '#f5a524' : '#7b5cff'; if (L.col !== col) { H.arc.setAttribute('stroke', col); L.col = col; }
      if (L.warn !== o.warn) { H.timer.classList.toggle('warn', !!o.warn); L.warn = o.warn; }
    };
    ui.preview = function (text, state, sub) {
      if (!prevEl) return; var d = prevEl.firstChild;
      if (!text) { if (ui.goal) { d.className = 'goal'; d.innerHTML = ''; d.appendChild(el('i', { text: '★' })); d.appendChild(el('small', { text: 'お題:' + ui.goal })); } else d.className = 'empty'; return; }
      var mark = state === 'ok' ? '✓' : state === 'bad' ? '×' : state === 'sel' ? '●' : '…';
      d.className = state || ''; d.innerHTML = ''; d.appendChild(el('i', { text: mark })); d.appendChild(el('span', { text: text })); if (sub) d.appendChild(el('small', { text: sub }));
    };
    var toastEl = null;
    ui.toast = function (msg, kind) {
      if (toastEl) toastEl.remove();
      toastEl = el('div', { class: 'pc-toast ' + (kind || 'info') }, [el('i', { text: kind === 'x' ? '×' : kind === 'tri' ? '△' : '!' }), el('span', { text: msg })]);
      stageEl.appendChild(toastEl); var t = toastEl; setTimeout(function () { if (t === toastEl) { t.remove(); toastEl = null; } }, 2300);
    };
    var banEl = null;
    ui.banner = function (text, marks, pts, o) {
      o = o || {};
      if (banEl) banEl.remove();
      var html = esc(text);
      (marks || []).forEach(function (m) { var re = new RegExp('\\b(' + m.replace(/(es|s)$/, '') + ')(es|s)\\b'); html = html.replace(re, '$1<u>$2</u>'); });
      banEl = el('div', { class: 'pc-banner' }, [el('div', { html: '<span class="ok">' + icon('check') + '</span>' + html + '<small>' + (o.perfect ? '<b class="pf">PERFECT!</b> ' : '') + '+' + U.fmt(pts) + (o.slot ? '  スロット×' + o.slot.toFixed(1) : '') + (o.shock ? '  余波×' + o.shock : '') + '</small>' })]);
      stageEl.appendChild(banEl); var b = banEl; setTimeout(function () { if (b === banEl) { b.remove(); banEl = null; } }, 2200);
    };
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var cntEl = null;
    ui.count = function (text, big) { if (cntEl) cntEl.remove(); cntEl = el('div', { class: 'pc-count' + (big || text.length > 2 ? ' big' : ''), text: text }); stageEl.appendChild(cntEl); var c = cntEl; setTimeout(function () { if (c === cntEl) { c.remove(); cntEl = null; } }, big ? 1450 : 820); };
    var tipEl = null;
    ui.tip = function (text, gloss, x, y) {
      if (!text) { if (tipEl) { tipEl.remove(); tipEl = null; } return; }
      if (!tipEl) { tipEl = el('div', { class: 'pc-tip' }); stageEl.appendChild(tipEl); }
      tipEl.innerHTML = ''; tipEl.appendChild(document.createTextNode(text)); if (gloss) tipEl.appendChild(el('small', { text: gloss }));
      var W = stageEl.clientWidth, half = Math.min(W / 2 - 8, (tipEl.offsetWidth || 120) / 2 + 2);
      tipEl.style.left = U.clamp(x, half + 4, W - half - 4) + 'px'; tipEl.style.top = Math.max(y, 120) + 'px';
    };
    ui.say = function (html, o) {
      ui.unsay(); o = o || {};
      var row = el('div', { class: 'row' }, [o.next ? btn(o.nextLabel || 'つぎへ', 'small', o.next) : null]);
      var n = el('div', { class: 'pc-say', style: { bottom: (o.bottom || 140) + 'px' } }, [el('p', { html: html }), o.next ? row : null]);
      stageEl.appendChild(n); ui._say = n; return n;
    };
    ui.unsay = function () { if (ui._say) { ui._say.remove(); ui._say = null; } };
    ui.skip = function (fn) { var b = btn('スキップ', 'ghost small pc-skip', fn); stageEl.appendChild(b); ui._skip = b; return b; };
    ui.unskip = function () { if (ui._skip) { ui._skip.remove(); ui._skip = null; } };
    ui.destroy = function () { ui.hudHide(); ui.unsay(); ui.unskip(); stageEl.innerHTML = ''; };
    return ui;
  }
  return { create: create, injectCSS: injectCSS, removeCSS: removeCSS };
})();

/* ===== FILE: app.js ===== */
/* ===== app.js:組み込み口(mount / unmount)・アダプタ・画面遷移 ===== */
var VERSION = '1.0.0';
var LEVELS = [
  { id: 0, name: 'やさしい', desc: 'ぜんぶ自動で直してくれる。まずはここから', auto: { art: true, prep: true, verb: true, ti: true, er: true }, color: 'pos', maxLevel: 1 },
  { id: 1, name: 'ふつう', desc: '冠詞・前置詞・to/-ing・-er/-est を自分で選ぶ', auto: { art: false, prep: false, verb: true, ti: false, er: false }, color: 'pos', maxLevel: 2 },
  { id: 2, name: 'むずかしい', desc: '動詞の形も自分で。色はチャンクだけ', auto: { art: false, prep: false, verb: false, ti: false, er: false }, color: 'chunk', maxLevel: 3 },
  { id: 3, name: '鬼', desc: '色のヒントなし・ぜんぶ手動', auto: { art: false, prep: false, verb: false, ti: false, er: false }, color: 'none', maxLevel: 4 }
];
var MODES = [
  { id: 'shot', name: 'ボブル(試作)', desc: '下から撃って、となりの単語とチャンク・文を作って消す', icon: 'magic', bg: 'linear-gradient(160deg,#ff8fb8,#ff5f8f)' },
  { id: 'ta', name: 'タイムアタック', desc: '60秒。長い文ほど時間がのびる', icon: 'play', bg: 'linear-gradient(160deg,#9a80ff,#6a4cf0)' },
  { id: 'over', name: 'あふれ注意', desc: 'バブルがあふれたら終わり', icon: 'magic', bg: 'linear-gradient(160deg,#ffb36b,#ff7a59)' },
  { id: 'free', name: 'フリー', desc: '時間制限なし。じっくり練習', icon: 'info', bg: 'linear-gradient(160deg,#6fe0ad,#2fbf83)' },
  { id: 'daily', name: '日替わりお題', desc: '毎日ちがうお題と盤面で1回勝負', icon: 'star', bg: 'linear-gradient(160deg,#ffd76a,#ffb21f)', premium: true }
];
var GOALS = [
  { id: 'long', text: '5語以上の文を3つ作る', test: function (s) { return s.list.filter(function (x) { return x.words >= 5; }).length >= 3; } },
  { id: 'past', text: '過去の文を3つ作る', test: function (s) { return s.past >= 3; } },
  { id: 'front', text: '前置きつきの文を2つ作る', test: function (s) { return s.front >= 2; } },
  { id: 'coord', text: 'and / but / so で文をつなぐ', test: function (s) { return s.coord >= 1; } },
  { id: 'clause', text: 'when / if などの節を使う', test: function (s) { return s.clause >= 1; } },
  { id: 'slot', text: 'スロットで文を4つ作る', test: function (s) { return s.slotS >= 4; } },
  { id: 'combo', text: 'コンボを15以上つなぐ', test: function (s) { return s.maxCombo >= 15; } },
  { id: 'many', text: '文を8つ作る', test: function (s) { return s.sentences >= 8; } }
];
var DEFAULT_SETTINGS = { bgm: .5, sfx: .8, voice: true, rate: 1, hint: 'press', gloss: true, custom: false, auto: { art: false, prep: false, verb: true, ti: false, er: false }, color: 'pos', lite: false, vibe: true };

// ---------- 既定のアダプタ ----------
function localStorageAdapter(prefix) {
  prefix = prefix || 'punichunk:'; var mem = {};
  function ls() { try { var x = window.localStorage; x.setItem(prefix + '__t', '1'); x.removeItem(prefix + '__t'); return x; } catch (e) { return null; } }
  var s = ls();
  return {
    get: function (k) { try { var v = s ? s.getItem(prefix + k) : mem[k]; return v == null ? null : JSON.parse(v); } catch (e) { return null; } },
    set: function (k, v) { var j = JSON.stringify(v); try { if (s) s.setItem(prefix + k, j); else mem[k] = j; } catch (e) { mem[k] = j; } },
    remove: function (k) { try { if (s) s.removeItem(prefix + k); delete mem[k]; } catch (e) { } }
  };
}
function localRanking(storage) {
  return {
    submit: function (e) { var all = storage.get('rank') || {}, key = e.mode + ':' + e.level, list = all[key] || []; list.push(e); list.sort(function (a, b) { return b.score - a.score; }); all[key] = list.slice(0, 10); storage.set('rank', all); return Promise.resolve({ rank: all[key].indexOf(e) + 1 }); },
    top: function (mode, level) { var all = storage.get('rank') || {}; return Promise.resolve((all[mode + ':' + level] || []).slice()); },
    isLocal: true
  };
}
function localStore(storage) {
  var PRICE = { premium: '¥480', hint: '¥120', magic: '¥120', auto: '¥120' }, GRANT = { hint: 5, magic: 3, auto: 3 };
  function load() { return storage.get('store') || { premium: false, inv: { hint: 3, magic: 3, auto: 3 } }; }
  function save(d) { storage.set('store', d); }
  return {
    isDummy: true,
    isPremium: function () { return !!load().premium; },
    inventory: function () { return Object.assign({}, load().inv); },
    consume: function (id) { var d = load(); if (!d.inv[id]) return false; d.inv[id]--; save(d); return true; },
    purchase: function (id) { var d = load(); if (id === 'premium') d.premium = true; else d.inv[id] = (d.inv[id] || 0) + (GRANT[id] || 1); save(d); return Promise.resolve(true); },
    price: function (id) { return PRICE[id] || '¥120'; }
  };
}

function mount(container, options) {
  if (!container || !container.appendChild) throw new Error('PuniChunk.mount: 要素を指定してください');
  options = options || {};
  UI.injectCSS();
  var listeners = [], raf = 0, dead = false, ro = null;
  function listen(t, ev, fn, o) { t.addEventListener(ev, fn, o); listeners.push([t, ev, fn, o]); }
  var root = U.el('div', { class: 'pc-root' }), stageEl = U.el('div', { class: 'pc-stage' });
  var bg = U.el('canvas', { class: 'pc-bg', 'aria-hidden': 'true' }), cv = U.el('canvas', { class: 'pc-cv', 'aria-label': 'ゲーム画面' }), probe = U.el('div', { class: 'pc-probe' });
  stageEl.appendChild(bg); stageEl.appendChild(cv); root.appendChild(probe); root.appendChild(stageEl); container.appendChild(root);
  var storage = options.storage || localStorageAdapter(options.storagePrefix);
  var dict = options.dict ? Dict.validate(options.dict) : Dict.makeDefault();
  var settings = Object.assign({}, DEFAULT_SETTINGS, storage.get('settings') || {}); settings.auto = Object.assign({}, DEFAULT_SETTINGS.auto, settings.auto || {});
  if (options.audio) { ['bgm', 'sfx', 'voice', 'rate'].forEach(function (k) { if (options.audio[k] != null) settings[k] = options.audio[k]; }); }
  var state = Object.assign({ level: 0, tutorialDone: false }, storage.get('state') || {});
  var services = Object.assign({ ranking: localRanking(storage), store: localStore(storage) }, options.services || {});
  var reduced = false; try { reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  var app = {
    version: VERSION, LEVELS: LEVELS, MODES: MODES, dict: dict, settings: settings, state: state, services: services, storage: storage, reduced: reduced,
    dictCredit: options.dictCredit || '辞書データ:「英語脳ゲーム」(eigo_nou)の手作り辞書をもとに作成。',
    stage: { w: 360, h: 640, top: 0, bottom: 0 }, dpr: 1, scene: 'title', game: null
  };
  app.emit = function (name, data) { if (name === 'chunk') vibrate(10); else if (name === 'sentence') vibrate([18, 40, 18]); else if (name === 'fail') vibrate(30); if (options.onEvent) { try { options.onEvent(name, data || {}); } catch (e) { } } };
  function vibrate(p) { if (settings.vibe && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { } } }
  app.audio = Snd.create();
  app.applyAudio = function () { app.audio.set({ vol: { bgm: settings.bgm, sfx: settings.sfx }, on: { bgm: settings.bgm > 0, sfx: settings.sfx > 0, voice: settings.voice }, rate: settings.rate }); };
  app.applyAudio();
  app.saveSettings = function () { storage.set('settings', settings); app.applyAudio(); };
  app.saveState = function () { storage.set('state', state); };
  app.best = function (mode, level) { var b = storage.get('best') || {}; return b[mode + ':' + level] || 0; };
  app.lifetime = function () { return Object.assign({ plays: 0, sentences: 0, maxCombo: 0, longestN: 0, longest: '' }, storage.get('life') || {}); };
  app.resetData = function () { ['rank', 'best', 'life', 'state', 'settings', 'daily'].forEach(function (k) { storage.remove(k); }); Object.assign(settings, JSON.parse(JSON.stringify(DEFAULT_SETTINGS))); state.level = 0; state.tutorialDone = false; app.applyAudio(); };
  var ui = app.ui = UI.create(app, stageEl);

  // ---------- 大きさ ----------
  var ctx = cv.getContext('2d'), bctx = bg.getContext('2d'), needResize = true;
  function measure() {
    var r = stageEl.getBoundingClientRect(), cs = getComputedStyle(probe);
    var top = options.insets && options.insets.top != null ? options.insets.top : parseFloat(cs.paddingTop) || 0;
    var bot = options.insets && options.insets.bottom != null ? options.insets.bottom : parseFloat(cs.paddingBottom) || 0;
    app.stage = { w: Math.max(280, r.width), h: Math.max(420, r.height), top: top, bottom: bot };
    app.dpr = Math.min(3, window.devicePixelRatio || 1);
    [cv, bg].forEach(function (c) { c.width = Math.round(app.stage.w * app.dpr); c.height = Math.round(app.stage.h * app.dpr); });
    root.style.setProperty('--pc-top', top + 'px'); root.style.setProperty('--pc-bottom', bot + 'px');
    if (app.game) { app.game.layout(); ui.itemsPos(app.game.L.lane.y + app.game.L.lane.h / 2); }
    needResize = false;
  }
  if (window.ResizeObserver) { ro = new ResizeObserver(function () { needResize = true; var r = stageEl.getBoundingClientRect(); setAwayRef && setAwayRef('zero', r.width < 2 || r.height < 2); }); ro.observe(stageEl); }
  var setAwayRef = null;
  listen(window, 'resize', function () { needResize = true; });

  // ---------- 背景・タイトルの飾り ----------
  var city = Art.City(options.citySeed || 2024), decor = [];
  function makeDecor() {
    decor = [];
    var words = dict.getWords({ pos: 'noun', maxLevel: 1, count: 3 }).map(function (e) { return { k: 'n', e: e }; })
      .concat(dict.getWords({ pos: 'verb', maxLevel: 1, count: 3, tag: { simple: 1 } }).map(function (e) { return { k: 'v', e: e }; }))
      .concat(dict.getWords({ pos: 'adj', maxLevel: 1, count: 2 }).map(function (e) { return { k: 'adj', e: e }; }))
      .concat([{ k: 'det', v: 'the' }]);
    var W0 = Math.max(300, Math.min(520, container.clientWidth || 390)), H0 = Math.max(500, container.clientHeight || 800);
    words.forEach(function (w, i) {
      var text = G.wordText(w, { auto: LEVELS[0].auto }), r = U.clamp(Art.measure(text, 15) / 2 + 13, 23, 44), best = null;
      for (var t = 0; t < 40; t++) { var x = .1 + Math.random() * .8, y = .24 + Math.random() * .28, md = 1e9; decor.forEach(function (d) { md = Math.min(md, Math.hypot((d.x - x) * W0, (d.y - y) * H0) - d.r - r); }); if (!best || md > best.md) best = { x: x, y: y, md: md }; if (md > 8) break; }
      decor.push({ w: w, text: text, r: r, x: best.x, y: best.y, vx: (Math.random() - .5) * .02, vy: (Math.random() - .5) * .02, ph: Math.random() * 6 });
    });
  }
  makeDecor();
  var T = 0, last = performance.now(), blink = 2, kunExpr = 'normal';
  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
    if (needResize) measure();
    var W = app.stage.w, H = app.stage.h, d = app.dpr, g = app.game;
    bctx.setTransform(d, 0, 0, d, 0, 0);
    var p = .32, lit = .25;
    if (g) { p = g.mode === 'over' ? .15 + .8 * U.clamp(g.items.length / 34, 0, 1) : g.mode === 'free' || g.mode === 'tutorial' ? .2 + .25 * (Math.sin(T * .02) + 1) / 2 : U.clamp(.08 + g.t / 140, 0, .97); lit = U.clamp(g.score / 4000, .1, 1); }
    else if (app.scene === 'result') { p = .78; lit = .9; }
    city.draw(bctx, W, H, p, lit, T, d);
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, W, H);
    if (g) { g.update(dt); if (app.game === g) g.draw(ctx); }
    else drawDecor(dt, W, H, app.scene === 'title' && app.decor);
  }
  function drawDecor(dt, W, H, show) {
    var light = settings.lite || reduced;
    if (show && !light) for (var i = 0; i < decor.length; i++) for (var j = i + 1; j < decor.length; j++) { if (j >= U.clamp(Math.floor(((app.band || { y0: .22, y1: .55 }).y1 - (app.band || { y0: .22, y1: .55 }).y0) * H * W / 10500), 3, decor.length)) break; var p = decor[i], q = decor[j], dx = (q.x - p.x) * W, dy = (q.y - p.y) * H, dd = Math.hypot(dx, dy) || 1, mn = p.r + q.r + 6; if (dd < mn) { var o = (mn - dd) / 2 / dd; p.x -= dx * o / W; p.y -= dy * o / H; q.x += dx * o / W; q.y += dy * o / H; } }
    var bd0 = app.band || { y0: .22, y1: .55 }, capN = U.clamp(Math.floor((bd0.y1 - bd0.y0) * H * W / 10500), 3, decor.length);
    if (show) decor.slice(0, capN).forEach(function (b) {
      if (!light) { b.x += b.vx * dt; b.y += b.vy * dt; }
      var mx = (b.r + 6) / W; if (b.x < mx) { b.x = mx; b.vx = Math.abs(b.vx); } if (b.x > 1 - mx) { b.x = 1 - mx; b.vx = -Math.abs(b.vx); }
      var bd = app.band || { y0: .22, y1: .55 }, y0 = bd.y0 + (b.r + 4) / H, y1 = Math.max(y0, bd.y1 - (b.r + 4) / H); if (b.y < y0) { b.y = y0; b.vy = Math.abs(b.vy); } if (b.y > y1) { b.y = y1; b.vy = -Math.abs(b.vy); }
      var sp = Art.sprite({ text: b.text, col: Art.colorKeyOfWord(b.w), r: b.r, kind: 'word', shape: 'round', dpr: app.dpr });
      var w = Math.sin(T * 2 + b.ph) * .03, x = b.x * W, y = b.y * H;
      ctx.save(); ctx.globalAlpha = .9; ctx.translate(x, y); ctx.scale(1 + w, 1 - w); ctx.drawImage(sp.cv, -sp.size / 2, -sp.size / 2, sp.size, sp.size); ctx.restore();
    });
    blink -= dt; if (blink < -.12) blink = 2 + Math.random() * 3;
    if (app.kun === false || (app.scene === 'result' && H < 760)) return;
    var s = Math.min(1.25, W / 330, H / 760), y = H - app.stage.bottom - 66 * s;
    Art.chunkKun(ctx, W / 2 - 40 * s, y, { segs: 2, expr: app.scene === 'result' ? 'joy' : kunExpr, t: T, blink: blink < 0 ? .1 : 1, scale: s, wave: app.scene !== 'result' && Math.sin(T * .7) > .6, walk: false });
  }

  // ---------- 入力 ----------
  function pos(e) { var r = stageEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  var activePtr = null;
  // 読み上げ・音の解錠は「指を離したとき」も行う(iPhone はタッチの pointerdown をユーザー操作とみなさない)
  listen(root, 'pointerup', function () { app.audio.unlock(); }, true); listen(root, 'touchend', function () { app.audio.unlock(); }, true);
  listen(cv, 'pointerdown', function (e) { app.audio.unlock(); if (!app.game || activePtr != null) return; activePtr = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (x) { } var p = pos(e); app.game.down(p.x, p.y); e.preventDefault(); });
  listen(cv, 'pointermove', function (e) { if (!app.game || e.pointerId !== activePtr) return; var p = pos(e); app.game.move(p.x, p.y); e.preventDefault(); });
  listen(cv, 'pointerup', function (e) { if (e.pointerId !== activePtr) return; activePtr = null; if (!app.game) return; var p = pos(e); app.game.up(p.x, p.y); });
  listen(cv, 'pointercancel', function (e) { if (e.pointerId !== activePtr) return; activePtr = null; if (app.game) app.game.cancel(); });
  listen(root, 'contextmenu', function (e) { e.preventDefault(); });
  listen(root, 'gesturestart', function (e) { e.preventDefault(); });
  listen(root, 'dblclick', function (e) { e.preventDefault(); });
  // 画面から外れたら静かにする:タブ切替・フォーカスが外れた(埋め込み先で閉じた等)・表示領域から消えた・大きさ0
  var away = {};
  function setAway(why, on) {
    var was = Object.keys(away).length > 0; if (on) away[why] = 1; else delete away[why];
    var now = Object.keys(away).length > 0; if (was === now) return;
    if (now) { app.audio.suspend(); if (app.game && app.game.state !== 'over' && app.game.mode !== 'tutorial') showPause(); app.emit('away', {}); }
    else app.audio.resume();
  }
  listen(document, 'visibilitychange', function () { setAway('hidden', document.hidden); });
  listen(window, 'pagehide', function () { setAway('hidden', true); });
  listen(window, 'pageshow', function () { setAway('hidden', false); });
  if (options.pauseOnBlur !== false) { listen(window, 'blur', function () { setAway('blur', true); }); listen(window, 'focus', function () { setAway('blur', false); }); listen(root, 'pointerdown', function () { setAway('blur', false); }); }
  setAwayRef = setAway; var io = null;
  if (window.IntersectionObserver) { io = new IntersectionObserver(function (es) { es.forEach(function (e) { setAway('offscreen', !e.isIntersecting); }); }); io.observe(root); }
  listen(window, 'keydown', function (e) { if (e.key === 'Escape' && app.game && app.game.state !== 'over' && !pauseEl) showPause(); });

  // ---------- 画面遷移 ----------
  var pauseEl = null, tut = null, lastMode = 'ta';
  function toTitle() { endGame(); app.scene = 'title'; app.decor = true; app.kun = true; app.audio.music('title'); ui.title({ play: toPlay, tutorial: function () { startTutorial(toTitle); }, records: function () { app.decor = false; app.kun = false; ui.records({ back: toTitle }); }, shop: function () { app.decor = false; app.kun = false; ui.shop({ back: toTitle }); }, settings: function () { app.decor = false; app.kun = false; ui.settings({ back: toTitle }); }, credits: function () { app.decor = false; app.kun = false; ui.credits({ back: toTitle }); } }); app.emit('screen', { name: 'title' }); }
  function toPlay() { if (!state.tutorialDone) startTutorial(toModes); else toModes(); }
  function toModes() { endGame(); app.scene = 'title'; app.decor = false; app.kun = true; app.audio.music('title'); ui.modes({ back: toTitle, start: startGame, shop: function () { app.kun = false; ui.shop({ back: toModes }); } }); app.emit('screen', { name: 'modes' }); }
  function endGame() { if (tut) { tut.stop(); tut = null; } if (app.game) { app.game.destroy(); app.game = null; } ui.hudHide(); if (pauseEl) { pauseEl.remove(); pauseEl = null; } ui.unsay(); ui.unskip(); }
  function cfgFor(level) { var L = LEVELS[level] || LEVELS[0]; return settings.custom ? { auto: Object.assign({}, settings.auto), color: settings.color, maxLevel: L.maxLevel } : { auto: Object.assign({}, L.auto), color: L.color, maxLevel: L.maxLevel }; }
  function startGame(mode) {
    endGame(); lastMode = mode; app.scene = 'game'; ui.clear(); app.audio.music(null);
    var level = state.level, c = cfgFor(level), seed = null, goal = null, practice = false;
    if (mode === 'daily') { var day = U.today(); seed = U.hash('daily:' + day); goal = GOALS[seed % GOALS.length]; practice = !!(storage.get('daily') || {})[day]; }
    var g = Game.create(app, { mode: mode, level: level, auto: c.auto, colorMode: c.color, maxLevel: c.maxLevel, seed: seed, freeSlot: services.store.isPremium() });
    g.goal = goal; g.practice = practice; app.game = g;
    ui.hudShow({ pause: showPause, inv: function () { return services.store.inventory(); }, useItem: useItem });
    g.start(); ui.itemsPos(mode === 'shot' ? -200 : g.L.lane.y + g.L.lane.h / 2);
    if (goal) { ui.goal = goal.text + (practice ? '(練習)' : ''); ui.preview('', ''); }
    app.emit('screen', { name: 'game', mode: mode });
  }
  function useItem(id) { var g = app.game; if (!g || g.state !== 'play') return; if (!services.store.consume(id)) return; if (!g.useItem(id)) services.store.purchase && services.store.isDummy && refund(id); ui.itemsRender(services.store.inventory(), useItem); app.emit('item', { id: id }); }
  function refund(id) { var d = storage.get('store'); if (d && d.inv) { d.inv[id] = (d.inv[id] || 0) + 1; storage.set('store', d); } }
  function startTutorial(after) {
    endGame(); app.scene = 'game'; ui.clear(); app.audio.music('title');
    var L = LEVELS[0], g = Game.create(app, { mode: 'tutorial', level: 0, auto: L.auto, colorMode: 'pos', maxLevel: 1 });
    app.game = g; ui.hudShow({ pause: showPause, inv: function () { return {}; }, useItem: function () { } }); g.start(); ui.itemsPos(-200);
    tut = Tutorial.run(app, g, function () { state.tutorialDone = true; app.saveState(); tut = null; after(); });
    app.emit('screen', { name: 'tutorial' });
  }
  function showPause() {
    var g = app.game; if (!g || pauseEl) return; g.pause(); app.audio.music(null); app.emit('pause', {});
    pauseEl = ui.pause({
      resume: function () { pauseEl.remove(); pauseEl = null; g.resume(); if (g.state === 'play') app.audio.music('play'); app.emit('resume', {}); },
      retry: function () { if (g.mode === 'tutorial') { startTutorial(toModes); return; } startGame(g.mode); },
      finish: g.mode === 'free' ? function () { pauseEl.remove(); pauseEl = null; g.resume(); g.finish('おしまい!'); } : null,
      settings: function () { var s = ui.settings({ back: function () { s.classList.add('out'); setTimeout(function () { s.remove(); }, 200); } }); s.style.zIndex = 45; },
      title: toTitle
    });
  }
  app.onGameEnd = function (g) {
    if (app.game !== g) return;
    var st = g.stats, score = g.score, goalRes = null;
    if (g.goal) { var ok = g.goal.test(st); goalRes = { text: g.goal.text, done: ok, bonus: 1500 }; if (ok) score += 1500; }
    var key = g.mode + ':' + g.level, bests = storage.get('best') || {}, prev = bests[key] || 0, practice = g.practice, newBest = !practice && score > prev && score > 0;
    if (!practice) {
      if (newBest) { bests[key] = score; storage.set('best', bests); }
      services.ranking.submit({ mode: g.mode, level: g.level, score: score, sentences: st.sentences, longest: st.longest, date: U.today() });
      if (g.mode === 'daily') { var dl = storage.get('daily') || {}; dl[U.today()] = score; storage.set('daily', dl); }
    }
    var life = app.lifetime(); life.plays++; life.sentences += st.sentences; life.maxCombo = Math.max(life.maxCombo, st.maxCombo); if (st.longestN > life.longestN) { life.longestN = st.longestN; life.longest = st.longest; } storage.set('life', life);
    var mode = MODES.filter(function (m) { return m.id === g.mode; })[0] || MODES[0];
    endGame(); app.scene = 'result'; app.kun = true; app.audio.music('result'); if (newBest) setTimeout(function () { app.audio.sfx('best'); }, 700);
    var res = { mode: g.mode, level: g.level, score: score, stats: st, newBest: newBest, best: Math.max(prev, newBest ? score : 0), goal: goalRes, practice: practice, modeName: mode.name, levelName: LEVELS[g.level].name };
    ui.result(res, { retry: function () { startGame(lastMode); }, modes: toModes, title: toTitle });
    app.emit('result', { mode: res.mode, level: res.level, score: score, newBest: newBest, stats: { sentences: st.sentences, chunks: st.chunks, maxCombo: st.maxCombo, longest: st.longest } });
  };

  // ---------- 開始 ----------
  measure();
  raf = requestAnimationFrame(frame);
  var start = options.startScreen || 'splash';
  if (start === 'title') toTitle(); else if (start === 'modes') toModes(); else if (start === 'game') startGame(options.initialMode || 'ta');
  else { app.decor = true; ui.splash(function () { toTitle(); }); }
  app.emit('ready', { version: VERSION });

  var api = {
    unmount: function () {
      if (dead) return; dead = true; cancelAnimationFrame(raf);
      endGame(); listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); }); listeners = [];
      if (ro) ro.disconnect(); if (io) io.disconnect(); app.audio.destroy(); ui.destroy(); root.remove(); UI.removeCSS();
      if (PuniChunk._last === api) PuniChunk._last = null;
    },
    pause: function () { if (app.game && app.game.state !== 'over') showPause(); },
    resume: function () { if (pauseEl) pauseEl.querySelector('.pc-btn').click(); },
    setAudio: function (o) { ['bgm', 'sfx', 'voice', 'rate'].forEach(function (k) { if (o[k] != null) settings[k] = o[k]; }); app.saveSettings(); },
    show: function (name, mode) { if (name === 'title') toTitle(); else if (name === 'modes') toModes(); else if (name === 'game') startGame(mode || 'ta'); else if (name === 'tutorial') startTutorial(toModes); },
    getState: function () { var g = app.game; return { scene: app.scene, mode: g && g.mode, score: g && g.score, playing: !!(g && g.state === 'play') }; },
    _app: app
  };
  PuniChunk._last = api;
  return api;
}
var PuniChunk = { mount: mount, version: VERSION, LEVELS: LEVELS, MODES: MODES, adapters: { localStorage: localStorageAdapter, localRanking: localRanking, localStore: localStore, dict: function (data) { return Dict.makeDefault(data); } }, _internal: { G: G, Dict: Dict, Supply: Supply, U: U } };

global.PuniChunk = PuniChunk;
if (typeof module !== "undefined" && module.exports) module.exports = PuniChunk;
})(typeof window !== "undefined" ? window : this);
