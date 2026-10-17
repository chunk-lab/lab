import { set_searchResults } from './play.js';
import { set_buildLex } from './engine.js';
import { set_renderSettings } from './common.js';
import { BIGT } from './big.js';
import { renderSettings } from './common.js';
import { LEX, buildLex, pp } from './engine.js';
import { cntForm } from './objrank.js';
import { APP, pick, searchResults } from './play.js';
import { plurOf } from './qfw.js';
// ================= 大語彙（綴りを打つと、その場所に合う言葉だけ候補に出る） =================
// 手で作った約2,300語（品質が高い）を先に、足りない言葉を辞書（big.js・約2.6万語）から出す。
// 選んだ言葉は、その場でエンジン用の形（過去形・自他・日本語の活用型など）にして LEX に足す。
export let BIGX;

// 日常でよく使うのに辞書に無い（または見つかりにくい）言葉の補い

export let BIG_EMO;
export let BIG_TAGS;
export let BIG_HAVE, BIG_HAVE_LEX;
export function bigKey(s){ return String(s||'').toLowerCase().replace(/^(a|an|the|to|my) /,'').trim(); }
export function bigHave(){ if(BIG_HAVE && BIG_HAVE_LEX===LEX) return BIG_HAVE; const H={n:new Set(),p:new Set(),v:new Set(),a:new Set(),r:new Set()};
 LEX.things.forEach(x=>H.n.add(bigKey(x.en))); LEX.people.forEach(x=>H.p.add(bigKey(x.en)));
 LEX.verbs.forEach(x=>{ if(!x.tail&&!x.prep) H.v.add(bigKey(x.en)); }); LEX.states.forEach(x=>H.a.add(bigKey(x.en))); LEX.manners.forEach(x=>H.r.add(bigKey(x.en)));
 BIG_HAVE=H; BIG_HAVE_LEX=LEX; return H; }
export function bigKinds(x){ if(!x) return [];
 const SPECIAL=['modal','q','imp','place','time','cmp','mcmp','scope','toWhom','relk','pre','cw'];
 if(x.open==='manner') return ['r']; if(x.open==='with') return ['p','an']; if(SPECIAL.includes(x.open)) return [];
 if(x.st==='subj') return ['p','an','n'];
 if(x.st==='split') return x.lsub==='be'?['a','n','p','an']:(x.lsub==='do'?['v']:['v','a']);
 if(x.st==='obj'||['thing','than','mthan'].includes(x.st)) return ['n','p','an'];
 if(x.st==='extras') return ['r'];
 return []; }
// ---- LEX に足す（まだなら） ----
export let BIGUSED;
export function bigIsVowel(w){ if(/^(hour|honest|honou?r|heir)/i.test(w)) return true; return /^[aeiou]/i.test(w)&&!/^(uni|use|usu|euro|one|once|ura|ute|uti)/i.test(w); }
export function bigAdd(list,obj){ if(!LEX.idx[list+':'+obj.id]){ LEX[list].push(obj); LEX.idx[list+':'+obj.id]=obj; BIGUSED.push([list,obj]); } return obj.id; }
export function bigMake(k,e,role){
 const id=(role==='thing'?'bt_':'b_')+e.w;
 if(k==='v'){ const v={id,en:e.w,ja:e.ja,jt:e.jt,fr:e.fr,e:'✨',an:e.fr==='intr'?'bob':'reach',big:1}; if(e.fr!=='intr') v.t=['any']; if(e.past) v.past=e.past; if(e.pp) v.pp=e.pp; if(e.dbl) v.dbl=1; return ['verbs',v]; }
 if(k==='a'){ const b=e.w; const s={id,en:b,ja:e.ja,jt:e.jt,e:'💫',big:1}; if(e.more) s.more=1; else { s.comp=/e$/.test(b)?b+'r':/[^aeiou]y$/.test(b)?b.slice(0,-1)+'ier':/[^aeiou][aeiou][^aeiouwy]$/.test(b)&&b.length<=4?b+b.slice(-1)+'er':b+'er'; s.sup=s.comp.replace(/er$/,'est'); } return ['states',s]; }
 if(k==='r') return ['manners',{id,en:e.w,ja:e.ja,e:'✨',big:1}];
 if(k==='p') return ['people',{id,en:'the '+e.w,ja:e.ja,e:'🧑',p:3,pl:0,big:1}];
 if(k==='an') return ['people',{id,en:'the '+e.w,ja:e.ja,e:'🐾',p:3,pl:0,animal:1,big:1}];
 // 名詞：目的語など → things、主語 → 「もの」として people に入れる
 const unc=e.u===1, pl=e.u===2, emo=BIG_EMO[e.ln]||'📦';
 if(role==='thing') return ['people',{id,en:e.pn||('the '+e.w),ja:e.ja,e:emo,p:3,pl:pl?1:0,thing:1,big:1}];
 const cf=(typeof cntForm==='function')?cntForm(e.w):null; if(cf) return ['things',{id,en:cf.en,ja:e.ja,e:emo,t:(BIG_TAGS[e.ln]||['thing']).slice(),pl:cf.pl,cnt:cf.cnt,big:1}];
 return ['things',{id,en:e.pn||((unc||pl)?e.w:(bigIsVowel(e.w)?'an ':'a ')+e.w),ja:e.ja,e:emo,t:(BIG_TAGS[e.ln]||['thing']).slice(),pl:pl?1:0,big:1}]; }
// ---- 検索 ----
export function bigResults(q, x){
 const kinds=bigKinds(x); if(!kinds.length||!q) return [];
 const ql=q.toLowerCase(), ascii=/^[a-z]+$/.test(ql); const H=bigHave(); const hits=[];
 kinds.forEach(k=>{ const hk=k==='an'?'p':k; BIGX[k].forEach(e=>{ let m=0;
   if(ascii){ if(e.w===ql) m=4; else if(e.w.startsWith(ql)) m=3; }
   else if(/[぀-ヿ一-龥]/.test(q)){ if(e.ja===q) m=4; else if(e.ja.startsWith(q)) m=3; else if(e.ja.includes(q)) m=2; }
   if(!m) return; hits.push({e,k,m}); }); });
 hits.sort((a,b)=>b.m-a.m||b.e.sc-a.e.sc||a.e.w.length-b.e.w.length||(a.e.w<b.e.w?-1:1));
 const seen=new Set(); const out=[];
 for(const h of hits){ const key=h.k+h.e.w; if(seen.has(key)) continue; seen.add(key); out.push(bigOption(h.k,h.e,x)); if(out.length>=16) break; }
 return out; }
export function bigOption(k,e,x){
 const base={big:1,id:'big:'+k+':'+e.w};
 if(x.st==='split' && ['n','p','an'].includes(k)){ const w=e.w, unc=e.u===1||e.u===2; const art=unc?'':(bigIsVowel(w)?'an ':'a '); const id='bs_'+w; const st={id,en:art+w,pl:unc?art+w:(typeof plurOf==='function'?plurOf(w):w+'s'),ja:e.ja,jt:'na',e:BIG_EMO[e.ln]||'📦',noun:1,typed:1,big:1}; return Object.assign(base,{e:st.e,en:st.en,ja:e.ja+'だ',pos:'adj',act:()=>{ bigAdd('states',st); APP.beKind='noun'; pick('state',id); }}); }
 const go=(pickFn)=>()=>{ pickFn(); };
 if(k==='v'){ const other=e.fr==='tr'||(e.fr==='both'&&x.side==='other'); return Object.assign(base,{e:'✨',en:e.w,ja:e.ja,pos:'verb',act:()=>{ const [l,o]=bigMake('v',e); const id=bigAdd(l,o); pick(other?'other':'self',id); }}); }
 if(k==='a') return Object.assign(base,{e:'💫',en:e.w,ja:e.ja+(e.jt==='na'?'':''),pos:'adj',act:()=>{ const [l,o]=bigMake('a',e); const id=bigAdd(l,o); pick('state',id); }});
 if(k==='r') return Object.assign(base,{e:'✨',en:e.w,ja:e.ja,pos:'adv',act:()=>{ const [l,o]=bigMake('r',e); const id=bigAdd(l,o); pick('manner',id); }});
 if(k==='p'||k==='an'){ const emo=k==='an'?'🐾':'🧑'; return Object.assign(base,{e:emo,en:'the '+e.w,ja:e.ja,pos:'noun',act:()=>{ const [l,o]=bigMake(k,e); const id=bigAdd(l,o); const ref='p:'+id; if(x.open==='with') pick('with',ref); else if(x.st==='subj') pick('subj',ref); else pick(x.st==='obj'?'obj':x.st,ref); }}); }
 // 名詞
 const role=x.st==='subj'?'thing':'obj'; const [l0,o0]=bigMake('n',e,role);
 return Object.assign(base,{e:o0.e,en:o0.en,ja:e.ja,pos:'noun',act:()=>{ const [l,o]=bigMake('n',e,role); const id=bigAdd(l,o); const ref=(l==='people'?'p:':'t:')+id; pick(x.st==='subj'?'subj':x.st==='obj'?'obj':x.st,ref); }}); }
// ---- 既存の検索につなぐ ----
// 手作りの語と辞書の語を、一致のしかた（ぴったり／頭が合う／途中が合う）でまとめて並べる。同じ強さなら手作りが先。
export function bigLevel(o,q){ const ql=q.toLowerCase(); if(o.id==='qb_be' && ['be','is','am','are','was','were','im'].includes(ql)) return 5; const en=String(o.en).toLowerCase().replace(/^(a|an|the|my|to|with|than|as|be|at|in|on|from|for|by|of|about|into|over|under|near) /,'').replace(/[,、…]+$/,''); const ja=String(o.ja||'').replace(/[、]+$/,'');
 if(/^[a-z' -]+$/.test(ql)){ if(en===ql) return 4; if(en.startsWith(ql)) return 3; if(en.split(/[\s…]+/).some(w=>w.startsWith(ql))) return 2; return 1; }
 if(ja===q) return 4; if(ja.startsWith(q)) return 3; return 2; }

// buildLex をやり直しても、使った言葉は残す

// 辞書データの出典表示（CC BY 4.0 / WordNet License の条件）


/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_bigdict(){
BIGX = {n:[],p:[],an:[],v:[],a:[],r:[]};
(function(){ const ln=s=>s.split('\n').filter(Boolean).map(l=>l.split('\t'));
 ln(BIGT.n).forEach(f=>BIGX.n.push({w:f[0],ja:f[1],sc:+f[2],ln:f[3],u:+f[4]}));
 ['p','an','r'].forEach(k=>ln(BIGT[k]).forEach(f=>BIGX[k].push({w:f[0],ja:f[1],sc:+f[2]})));
 ln(BIGT.v).forEach(f=>{ let pa=f[5],pp=f[6]; const R=/(en|own|awn|orn|ne)$/; if(pa&&pp&&pa!==pp&&R.test(pa)&&!R.test(pp)){ const t=pa; pa=pp; pp=t; } BIGX.v.push({w:f[0],ja:f[1],sc:+f[2],jt:f[3],fr:f[4],past:pa,pp:pp,dbl:+f[7]}); });
 ln(BIGT.a).forEach(f=>BIGX.a.push({w:f[0],ja:f[1],sc:+f[2],jt:f[3],more:+f[4]}));
})();
[['mine','わたしのもの',1],['yours','あなたのもの',1],['his','かれのもの',1],['hers','かのじょのもの',1],['ours','わたしたちのもの',1],['theirs','かれらのもの',1],['coworker','同僚',0],['bike','自転車',0],['laptop','ノートパソコン',0],['email','メール',0],['glasses','めがね',2],['smartphone','スマホ',0],['website','ウェブサイト',0],['app','アプリ',0],['password','パスワード',0],['selfie','自撮り',0],['headphones','ヘッドホン',2],['charger','充電器',0],['backpack','リュック',0],['sneakers','スニーカー',2],['groceries','食料品',2],['leftovers','残り物',2],['roommate','ルームメイト',0],['classmate','クラスメイト',0],['girlfriend','彼女',0],['boyfriend','彼氏',0],['in-laws','義理の家族',2],['stepmother','継母',0],['stepfather','継父',0]].forEach(([w,ja,u])=>{ if(['mine','yours','his','hers','ours','theirs'].includes(w)){ BIGX.n=BIGX.n.filter(e=>e.w!==w); BIGX.n.unshift({w,ja,sc:150,ln:'possession',u}); } else if(!BIGX.n.some(e=>e.w===w)) BIGX.n.push({w,ja,sc:80,ln:'artifact',u}); });
BIG_EMO = {food:'🍽️',plant:'🌱',artifact:'📦',object:'🪨',body:'🫀',location:'📍',substance:'🧪',group:'👥',event:'📅',time:'🕐',act:'🎬',comm:'💬',cognition:'💭',feeling:'💗',possession:'🎁',quantity:'🔢',shape:'🔷',state:'🔹',attr:'🔖',process:'⚙️',relation:'🔗',phenom:'🌤️',motive:'🎯'};
BIG_TAGS = {food:['food'],plant:['plant','thing'],comm:['read','write','thing'],event:['event'],act:['event'],artifact:['thing'],object:['thing'],body:['thing'],substance:['thing'],possession:['thing'],location:['thing']};
BIG_HAVE = null;
BIG_HAVE_LEX = null;
BIGUSED = [];
{ const _sr=searchResults; set_searchResults(function(){ const res=_sr.apply(this,arguments); try{ const q=(APP.search.q||'').trim().replace(/^(a|an|the|my|to|with|than|as) +/i,''); const ex=bigResults(q,APP.search.ctx); if(!ex.length) return res;
   const have=new Set(res.map(o=>bigKey(o.en))); const all=res.map((o,i)=>({o,i,l:bigLevel(o,q),b:0})).concat(ex.filter(o=>!have.has(bigKey(o.en))).map((o,i)=>({o,i:1000+i,l:bigLevel(o,q),b:1})));
   return all.sort((a,b)=>b.l-a.l||a.b-b.b||a.i-b.i).map(x=>x.o); }catch(e){ return res; } }); }
{ const _bl=buildLex; set_buildLex(function(){ const L=_bl.apply(this,arguments); try{ BIGUSED.forEach(([l,o])=>{ if(!L.idx[l+':'+o.id]){ L[l].push(o); L.idx[l+':'+o.id]=o; } }); }catch(e){} return L; }); }
{ const _rs=renderSettings; set_renderSettings(function(){ const r=_rs.apply(this,arguments); try{ const el=document.getElementById('settings'); if(el && !el.querySelector('.bigcredit')){ const p=document.createElement('p'); p.className='note bigcredit'; p.style.cssText='margin:18px 8px;font-size:11px;color:#888;line-height:1.6'; p.innerHTML='辞書データ：EJDict-hand（パブリックドメイン／CC0）、English WordNet（Princeton WordNet と Open English Wordnet team。CC BY 4.0）。絵文字：Google Noto Emoji（Apache 2.0）。'; el.appendChild(p); } }catch(e){} return r; }); }
}
