import { LEX, N, P, predV } from './engine.js';
import { APP, LV, esc, ico, mutate, pick } from './play.js';
// ================= 位置のまとまり（on the table / under the tree …） =================
// 「位置 × 名詞」から自動でチャンクを作る。1つずつ登録しない。
// 初級：完成したチャンクを選ぶだけ。中級（Lv3〜）：選んだあと位置のダイヤルで on ↔ under … を入れかえ。
// 使う場所：① 動作のあと（場所 c.place）② be のあと（c.pred={k:'s',id:'ls_…'}）③ There is … の場所
export let POSN;
export let POS_ORDER;
// 名詞の性質ごとに、自然な位置
export let LOCK;
export let LOCN;
export let LOCNI; 
export function locPosOf(n){ const a=(LOCK[n.k]||[]).concat(n.plus||[]); return POS_ORDER.filter(p=>a.includes(p)); }
export function locLvPos(n, lv){ lv=lv||(typeof LV==='function'?LV():6); const mx=lv>=3?3:lv; return locPosOf(n).filter(p=>POSN[p].lv<=mx); }
// id：場所は lc_位置_名詞、be のあとは ls_位置_名詞
export function locMake(pre, p, n){ const P=POSN[p], jn=n.ja+P.ja; return {id:pre+p+'_'+n.id, en:P.en+' '+n.en, to:(P.to||P.en)+' '+n.en, ja:jn+(p==='around'?'を':'で'), jat:jn+'へ', jn, e:n.e, loc:{p, n:n.id}}; }
export function locRegister(L){
 LOCN.forEach(n=>locPosOf(n).forEach(p=>{
  const pl=locMake('lc_',p,n); if(!L.idx['places:'+pl.id]){ L.places.push(pl); L.idx['places:'+pl.id]=pl; }
  const st=Object.assign(locMake('ls_',p,n),{jt:'raw'}); L.idx['states:'+st.id]=st;
 }));
}
export function locInfo(id){ const m=/^l[cs]_([a-z]+)_([a-z]+)$/.exec(id||''); return m && POSN[m[1]] && LOCNI[m[2]] ? {p:m[1], n:m[2], st:id[1]==='s'} : null; }
// 主語が生き物なら「いる」、ものなら「ある」
export function locAlive(c){ const r=c && (c.type==='exist'? c.thing : c.subj); if(!r || r[0]!=='p') return false; const n=N(r); return !(n && (n.id==='it'||n.thing)); }

// 選択肢：名詞ごとに1つの位置だけ出す（同じ名詞が並ばないように）。位置はダイヤルで入れかえる
export function locPick(n){ APP.locPos=APP.locPos||{}; const ok=locLvPos(n); if(!ok.length) return null; let p=APP.locPos[n.id]; if(!ok.includes(p)){ p=ok[Math.floor(Math.random()*ok.length)]; APP.locPos[n.id]=p; } return p; }
export function locOpts(c, forState){
 const v=predV(c), mo=!forState && v && v.motion, ex=c.type==='exist', O=[];
 const fixedEn=new Set(LEX.places.filter(p=>!p.loc).map(p=>p.en));
 LOCN.forEach(n=>{ const p=locPick(n); if(!p) return; const it=locMake(forState?'ls_':'lc_',p,n); if(fixedEn.has(it.en)) return;
  const sel = forState? (c.pred&&c.pred.k==='s'&&c.pred.id===it.id) : c.place===it.id;
  O.push({id:it.id, g:'ploc', e:n.e, en:mo?it.to:it.en, ja: forState? it.jn+'に' : ex? it.jn+'に' : (mo?it.jat:it.ja), pos:forState?'adj':'adv', sel,
   act:()=> forState? pick('state',it.id) : pick('place',it.id)});
 });
 return O;
}
// 位置の小さな絵（箱とボール）
export function locIcon(p){
 const box='<rect x="5" y="8" width="12" height="7" rx="1.5" fill="#f2d7a6" stroke="#8a6a3a" stroke-width="1.2"/>';
 const ball=(x,y,r)=>`<circle cx="${x}" cy="${y}" r="${r||2.8}" fill="#df3f35"/>`;
 const B={
  at: box+ball(21,13)+'<path d="M18 6l3 3 3-3" stroke="#df3f35" fill="none" stroke-width="1.3"/>',
  on: box+ball(11,5),
  in: ball(11,12)+'<rect x="5" y="8" width="12" height="7" rx="1.5" fill="rgba(242,215,166,.55)" stroke="#8a6a3a" stroke-width="1.2"/>',
  under: '<rect x="4" y="5" width="14" height="2.5" rx="1" fill="#f2d7a6" stroke="#8a6a3a" stroke-width="1"/><path d="M5.5 7.5v8M16.5 7.5v8" stroke="#8a6a3a" stroke-width="1.2"/>'+ball(11,13),
  next: box+ball(20,12),
  behind: ball(14,8.5)+box,
  front: box+ball(10,15,3.4),
  near: box+ball(21.5,13,2.3)+'<path d="M17.5 17h3" stroke="#9aa0bf" stroke-dasharray="1 1"/>',
  across: box+'<path d="M17.5 4v16" stroke="#9aa0bf" stroke-dasharray="2 1.5"/>'+ball(21,11.5,2.3),
  around: box+'<ellipse cx="11" cy="11.5" rx="9.5" ry="7" fill="none" stroke="#9aa0bf" stroke-dasharray="2 1.5"/>'+ball(2,11,2.2),
 };
 return `<svg class="locic" viewBox="0 0 24 22" width="24" height="22">${B[p]||box}</svg>`;
}
// 絵の中：名詞の絵を、位置に合わせて主語のまわりに置く
export function locScene(add, info, ax, ay){
 const n=LOCNI[info.n]; if(!n) return;
 const S={ on:[0,17,62,'prop'], in:[0,7,104,'lbl'], under:[0,-21,92,'lbl'], next:[21,5,60,'prop'], behind:[4,-3,112,'prop'],
  front:[0,11,78,'lbl'], near:[31,6,50,'prop'], across:[37,1,54,'prop'], around:[0,3,60,'prop'] }[info.p];
 if(!S) return;
 add('locp', ico(n.e), ax+S[0], ay+S[1], {size:S[2], cls:S[3]==='lbl'?'bub locfront':'prop locback'});
 if(info.p==='around') add('loca','<span class="locring"></span>',ax,ay+3,{cls:'lbl'});
 if(info.p==='across') add('locr','<span class="locroad"></span>',ax+19,ay+4,{cls:'prop'});
}
// ダイヤル：同じ名詞のまま位置だけ入れかえる（Lv3〜）
export function locStrip(add, c, y){
 if(LV()<3 || APP.finished) return false;
 const isSt = c.pred && c.pred.k==='s' && locInfo(c.pred.id);
 const info = isSt ? locInfo(c.pred.id) : locInfo(c.place);
 if(!info) return false;
 const n=LOCNI[info.n]; const ps=locLvPos(n); if(ps.length<2) return false;
 const btn=p=>`<button class="lchip ${p===info.p?'on':''}" data-lp="${p}">${locIcon(p)}<b class="en">${esc(POSN[p].en)}</b><small>${esc(POSN[p].ja.replace(/^の/,''))}</small></button>`;
 add('locs',`<div class="lstrip">${ps.map(btn).join('')}</div>`,50,y,{cls:'ui fb',tap:e=>{
  const b=e&&e.target&&e.target.closest('[data-lp]'); if(!b) return; const p=b.dataset.lp; if(p===info.p) return;
  APP.locPos=APP.locPos||{}; APP.locPos[info.n]=p;
  if(isSt) mutate(()=>{ c.pred={k:'s',id:'ls_'+p+'_'+info.n}; },'state'); else mutate(()=>{ c.place='lc_'+p+'_'+info.n; },'place');
 }});
 return true;
}

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_loc(){
POSN = {
 at:{en:'at',to:'to',ja:'',lv:1},
 on:{en:'on',to:'onto',ja:'の上',lv:1},
 in:{en:'in',to:'into',ja:'の中',lv:1},
 under:{en:'under',ja:'の下',lv:1},
 next:{en:'next to',ja:'の横',lv:2},
 behind:{en:'behind',ja:'の後ろ',lv:2},
 front:{en:'in front of',ja:'の前',lv:2},
 near:{en:'near',ja:'の近く',lv:2},
 across:{en:'across from',ja:'の向かい',lv:3},
 around:{en:'around',ja:'のまわり',lv:3},
};
POS_ORDER = ['at','on','in','under','next','behind','front','near','across','around'];
LOCK = {
 surf:['on','under','next','behind','front','near'],
 box:['on','in','under','next','behind','front','near'],
 cont:['in','next','behind','front','near'],
 bldg:['at','in','next','behind','front','near','across'],
 tree:['under','next','behind','front','near','around'],
 flat:['next','behind','front','near'],
 bridge:['on','under','near'],
 plaza:['next','front','near','around','behind'],
};
LOCN = [
 {id:'table',en:'the table',ja:'テーブル',e:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 34'><rect x='2' y='8' width='36' height='6' rx='2' fill='%23c98b4a'/><rect x='6' y='14' width='4' height='18' rx='1' fill='%23a86f35'/><rect x='30' y='14' width='4' height='18' rx='1' fill='%23a86f35'/></svg>",k:'surf'},
 {id:'desk',en:'the desk',ja:'机',e:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 34'><rect x='2' y='9' width='36' height='5' rx='1.5' fill='%23b07a45'/><rect x='24' y='14' width='12' height='18' rx='1' fill='%23a86f35'/><rect x='26' y='18' width='8' height='2' fill='%23e6c79c'/><rect x='26' y='24' width='8' height='2' fill='%23e6c79c'/><rect x='5' y='14' width='3.5' height='18' rx='1' fill='%23a86f35'/></svg>",k:'surf'},
 {id:'chair',en:'the chair',ja:'いす',e:'🪑',k:'surf'},
 {id:'bed',en:'the bed',ja:'ベッド',e:'🛏️',k:'surf',plus:['in']},
 {id:'sofa',en:'the sofa',ja:'ソファー',e:'🛋️',k:'surf'},
 {id:'box',en:'the box',ja:'箱',e:'📦',k:'box'},
 {id:'bench',en:'the bench',ja:'ベンチ',e:'🪑',k:'surf'},
 {id:'bag',en:'the bag',ja:'かばん',e:'👜',k:'cont'},
 {id:'car',en:'the car',ja:'車',e:'🚗',k:'cont',plus:['on','under']},
 {id:'fridge',en:'the fridge',ja:'冷蔵庫',e:'🧊',k:'cont',plus:['on']},
 {id:'tree',en:'the tree',ja:'木',e:'🌳',k:'tree'},
 {id:'door',en:'the door',ja:'ドア',e:'🚪',k:'flat'},
 {id:'window',en:'the window',ja:'窓',e:'🪟',k:'flat'},
 {id:'tv',en:'the TV',ja:'テレビ',e:'📺',k:'flat'},
 {id:'busstop',en:'the bus stop',ja:'バス停',e:'🚏',k:'flat',plus:['at']},
 {id:'bridge',en:'the bridge',ja:'橋',e:'🌉',k:'bridge'},
 {id:'house',en:'the house',ja:'家',e:'🏠',k:'bldg'},
 {id:'station',en:'the station',ja:'駅',e:'🚉',k:'bldg'},
 {id:'cafe',en:'the cafe',ja:'カフェ',e:'☕',k:'bldg'},
 {id:'bakery',en:'the bakery',ja:'パン屋',e:'🥐',k:'bldg'},
 {id:'fountain',en:'the fountain',ja:'噴水',e:'⛲',k:'plaza'},
 {id:'bank',en:'the bank',ja:'銀行',e:'🏦',k:'bldg'},
 {id:'hospital',en:'the hospital',ja:'病院',e:'🏥',k:'bldg'},
 {id:'postoffice',en:'the post office',ja:'郵便局',e:'🏤',k:'bldg'},
 {id:'store',en:'the convenience store',ja:'コンビニ',e:'🏪',k:'bldg'},
 {id:'flowershop',en:'the flower shop',ja:'花屋',e:'💐',k:'bldg'},
 {id:'school',en:'the school',ja:'学校',e:'🏫',k:'bldg'},
];
LOCNI = {};
LOCN.forEach(n=>LOCNI[n.id]=n);
}
