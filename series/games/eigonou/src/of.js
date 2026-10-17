import { set_jaPred } from './engine.js';
import { set_optList } from './play.js';
import { N, jaPred, predS, predV } from './engine.js';
import { LV, optList } from './play.js';
// ================= of のまとまり（none of them / the king of pirates …） =================
// 1つずつ手で登録せず、組み合わせから自動でチャンクを作る。
// ① 数・量 + of + 人（主語）：none of them / all of us / one of my friends …
// ② 名詞 + of + 名詞：a cup of coffee / a piece of cake（目的語）、the king of pirates（〜になる・〜だ）
export let OFQ;
export let OFQ_TAIL;
// 目的語になる「名詞 of 名詞」
export let OFT;
// 〜になる・〜だ（何者）の「名詞 of 名詞」
export let OFS;
export function ofRegister(L){
 const put=(k,x)=>{ if(!L.idx[k+':'+x.id]){ L[k].push(x); L.idx[k+':'+x.id]=x; } };
 Object.entries(OFQ).forEach(([q,Q])=>OFQ_TAIL.forEach(tid=>{ const t0=L.idx['people:'+tid]; if(!t0) return; const t=tid==='you'?Object.assign({},t0,{ja:'あなたたち'}):t0;
  if(q==='both' && !['they','we','you'].includes(tid)) return;
  put('people',{id:'q_'+q+'_'+tid,en:Q.en+' of '+(t.obj||t.en),obj:Q.en+' of '+(t.obj||t.en),ja:Q.ja(t),e:Q.e,p:3,pl:Q.pl,ofq:q,jtopic:1,noneg:Q.neg?1:0});
 }));
 OFT.forEach(x=>put('things',Object.assign({ofn:1},x,{id:'of_'+x.id})));
 OFS.forEach(x=>put('states',Object.assign({noun:1,jt:'noun',ofn:1},x,{id:'of_'+x.id})));
}
// none of them … は日本語では否定になる（かれらのだれも来なかった）

// 「will be ＋ 名詞」は「〜になる」（I will be a teacher. → 先生になる／She will be … → 先生になるだろう）

// of のまとまりは Lv3 から


/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_of(){
OFQ = {
 all:{en:'all',e:'👥',pl:1,ja:t=>t.ja+'はみんな'},
 some:{en:'some',e:'👥',pl:1,ja:t=>t.ja+'の何人かは'},
 none:{en:'none',e:'🙅',pl:1,neg:1,ja:t=>t.ja+'のだれも'},
 most:{en:'most',e:'👥',pl:1,ja:t=>t.ja+'のほとんどは'},
 many:{en:'many',e:'👥',pl:1,ja:t=>t.ja+'の多くは'},
 both:{en:'both',e:'👫',pl:1,ja:t=>t.ja+'は二人とも'},
 each:{en:'each',e:'🧍',pl:0,ja:t=>t.ja+'はそれぞれ'},
 one:{en:'one',e:'☝️',pl:0,ja:t=>t.ja+'の1人は'},
};
OFQ_TAIL = ['they','we','you','friends','students'];
OFT = [
 {id:'cupcoffee',en:'a cup of coffee',ja:'1杯のコーヒー',e:'☕',t:['drink']},
 {id:'cuptea',en:'a cup of tea',ja:'1杯のお茶',e:'🍵',t:['drink']},
 {id:'glasswater',en:'a glass of water',ja:'1杯の水',e:'🥛',t:['drink']},
 {id:'bottlejuice',en:'a bottle of juice',ja:'1本のジュース',e:'🧃',t:['drink']},
 {id:'piececake',en:'a piece of cake',ja:'ひと切れのケーキ',e:'🍰',t:['food']},
 {id:'slicepizza',en:'a slice of pizza',ja:'ひと切れのピザ',e:'🍕',t:['food']},
 {id:'lotbooks',en:'a lot of books',ja:'たくさんの本',e:'📚',t:['read','thing']},
 {id:'picfamily',en:'a picture of my family',ja:'家族の写真',e:'🖼️',t:['thing','draw']},
 {id:'namesong',en:'the name of the song',ja:'その歌の名前',e:'🎵',t:['thing']},
 {id:'endstory',en:'the end of the story',ja:'話の終わり',e:'📖',t:['read','thing']},
];
OFS = [
 {id:'kingpirates',en:'the king of pirates',ja:'海賊王',e:'🏴‍☠️'},
 {id:'captainteam',en:'the captain of the team',ja:'チームのキャプテン',e:'🧢'},
 {id:'leaderclass',en:'the leader of the class',ja:'クラスのリーダー',e:'🙋'},
 {id:'memberclub',en:'a member of the club',ja:'クラブの一員',e:'🤝'},
 {id:'onefriends',en:'one of my friends',ja:'友だちの1人',e:'☝️'},
 {id:'fanband',en:'a big fan of the band',ja:'そのバンドの大ファン',e:'🎸'},
];
{ const _jp=jaPred;
  set_jaPred(function(c,ctx,o){ o=o||{}; if(!o.ofDone && c){ const r=c.passive?c.obj:c.subj, n=r&&N(r); if(n&&n.noneg){ return _jp(Object.assign({},c,{neg:!c.neg}),ctx,Object.assign({},o,{ofDone:1})); } } return _jp(c,ctx,o); }); }
{ const _jp2=jaPred;
  set_jaPred(function(c,ctx,o){ try{ const s=c&&!predV(c)&&predS(c); const fut=c&&(c.modal==='will'||(!c.modal&&c.tense==='fut'));
   if(s && s.noun && fut && !c.q && !(o&&o.sOverride)){ const first=(c.subj==='p:i'||c.subj==='p:we'); return s.ja+'に'+(c.neg?'ならない':'なる')+(first?'':'だろう'); } }catch(e){}
   return _jp2(c,ctx,o); }); }
{ const _ol=optList; set_optList(function(k,c){ const O=_ol(k,c); if(typeof LV==='function' && LV()<3 && Array.isArray(O)){ const F=O.filter(o=>!['ofq','tof','sof'].includes(o.g)); F.hiddenCasual=O.hiddenCasual; return F; } return O; }); }
}
