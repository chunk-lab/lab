import { save, say } from './common.js';
import { T, TENSES, allowedTenses, needsObj, newClause, nounTags, predV, sentenceJa, sentenceParts, sentenceText } from './engine.js';
import { tx } from './i18n.js';
import { objRankRefs } from './objrank.js';
import { esc } from './play.js';
import { PR, prNew, pracStore } from './prac.js';
import { reelCands, reelFix, reelSet } from './reel.js';
import { SB_VIOLENT, sbBare, sbCount, sbPlural } from './slot.js';
// ---- 練習の拡充：ひたすら練習（rep）／クイズ（quiz）。文はエンジンで自動生成（作り置きなし）----
export let DR;
export let DR_TOPICS;
export let DR_BADV;
export let DR_SUBJ;
export let drPick;
export let drShuf;
export let drText, drJa;
export let drClone;
export let drHoleless;
export let DR_TORDER;
export function drTenses(c){ let al=[]; try{ al=allowedTenses(c,{kind:'main'})||[]; }catch(e){} return DR_TORDER.filter(t=>al.includes(t)); }
export function drTLab(t){ const x=TENSES[t]||{}; return (x.ja||t); }
export function drGen(opt){ opt=opt||{}; for(let k=0;k<150;k++){ try{
  const c=newClause(); reelSet('subj',c,opt.subj||drPick(DR_SUBJ)); const vs=(reelCands('verb',c)||[]).filter(Boolean); if(!vs.length) continue; reelSet('verb',c,drPick(vs));
  const v=predV(c); if(!v||SB_VIOLENT.test(v.en||'')||DR_BADV.test(v.en||'')||v.tail||v.prep) continue;
  if(needsObj(c)){ const vt=v.t||[], GEN=['thing','any','abstract']; const RK=(typeof objRankRefs==='function'&&objRankRefs(v.id))||[]; const rk=RK.filter(r=>/^t:/.test(r)); const os=rk.length?rk:(reelCands('obj',c)||[]).filter(r=>r&&!/^p:/.test(r)&&!/(self|selves)$/.test(r)).filter(r=>{ try{ const tg=nounTags(r); return vt.some(x=>!GEN.includes(x)&&tg.includes(x)); }catch(e){ return false; } }); if(!os.length) continue; c.obj=drPick(os); c.useObj=true; }
  else if(opt.needObj) continue; else if(v.fr!=='intr') continue;
  if(opt.noObj&&needsObj(c)) continue;
  c.tense=opt.tense||'pres'; try{ reelFix(c); }catch(e){} c.tense=opt.tense||'pres';
  if(!drTenses(c).includes(c.tense)) continue; if(!drHoleless(c)) continue; return c; }catch(e){} } return null; }
export function drHL(text,sub){ const t=esc(text); if(!sub) return t; const s=esc(sub); const i=t.indexOf(s); return i<0?t:t.slice(0,i)+'<mark>'+s+'</mark>'+t.slice(i+s.length); }
export function drPartsEn(c,re){ try{ return sentenceParts({main:c}).filter(p=>p.en&&re.test(String(p.key||''))).map(p=>p.en).join(' '); }catch(e){ return ''; } }
export function drVerbForm(c,subj,tense){ const d=drClone(c); reelSet('subj',d,subj); d.tense=tense; d.neg=false; d.q=false; return drPartsEn(d,/^m\.verb$/); }
export function drForms(c){ const f=[['原形','p:they','pres'],['三単現（he / she / it）','p:she','pres'],['過去形','p:she','past'],['〜ing形','p:she','prog'],['過去分詞（have ＋ これ）','p:she','perf']]; return f.map(([lab,s,t])=>({lab,w:drVerbForm(c,s,t),s,t})); }
// ---- 名詞：限定詞・数量語 ----
export let DR_QD;
export function drNP(d,n,pl){ const w=pl?sbPlural(n):n; if(d==='a') return ((/^(uni|use|eu|one)/i.test(n)?false:/^(hour|honest|heir)/i.test(n)?true:/^[aeiou]/i.test(n))?'an ':'a ')+n; return d+' '+w; }
export function drNoun(c){ try{ return sbBare(c.obj); }catch(e){ return ''; } }
export function drNounGen(){ for(let k=0;k<80;k++){ const c=drGen({needObj:1,subj:drPick(['p:i','p:you','p:we','p:they'])}); if(!c) continue; const n=drNoun(c); if(!n||/\s/.test(n)||!sbCount(n)) continue; return {c,n,cnt:sbCount(n)}; } return null; }
export function drObjSwap(c,np){ const base=drText(c); const old=drPartsEn(c,/^m\.obj$/); if(!old||base.indexOf(old)<0) return base.replace(/\.$/,'')+' ('+np+').'; return base.replace(old,np); }
// ---- When / If ----
export function drCond(conj,subTense,mainTense){ for(let k=0;k<80;k++){ try{ const main=drGen({tense:mainTense}); if(!main) continue; const sub=drGen({noObj:1,tense:subTense}); if(!sub) continue; main.subs=main.subs||{}; main.subs.conj={conj,front:true,c:sub}; main.tense=mainTense; sub.tense=subTense; if(!drHoleless(main)) continue; return main; }catch(e){} } return null; }
export let DR_CP;
// ---- ひたすら練習 ----
export function drRepNew(){ for(let k=0;k<8;k++){ drRepNew0(); if(DR.rep) return; } }
export function drRepNew0(){ const T=DR.topic; DR.msg=null; DR.n++;
 if(T==='tense'){ const c=drGen(); if(!c){ DR.rep=null; return; } DR.rep={c,list:drTenses(c),i:0}; }
 else if(T==='noun'){ const g=drNounGen(); if(!g){ DR.rep=null; return; } const L=g.cnt==='u'?DR_QD.u:(Math.random()<.5?DR_QD.c1:DR_QD.cp); DR.rep={g,L,i:0}; }
 else if(T==='verb'){ const c=drGen({noObj:Math.random()<.5?1:0}); if(!c){ DR.rep=null; return; } DR.rep={c,F:drForms(c),i:0}; }
 else { const c0=drGen({tense:'pres'}); const sub=drGen({noObj:1}); if(!c0||!sub){ DR.rep=null; return; } DR.rep={main:c0,sub,i:0}; } }
export function drRepView(){ const R=DR.rep, T=DR.topic; if(!R) return '<p class="note">文を作れませんでした。もう一度どうぞ。</p>'; let ja='',en='',lab='',hl='',say_='';
 if(T==='tense'){ const t=R.list[R.i]; R.c.tense=t; en=drText(R.c); ja=drJa(R.c); lab=drTLab(t); hl=drPartsEn(R.c,/^m\.(aux|neg|verb)$/); }
 else if(T==='noun'){ const g=R.g, [d,jg]=R.L[R.i]; const pl=(g.cnt==='c')&&(DR_QD.cp.some(x=>x[0]===d)); const np=drNP(d,g.n,pl); en=drObjSwap(g.c,np); ja=drJa(g.c); lab=d+'　'+jg; hl=np; }
 else if(T==='verb'){ const f=R.F[R.i]; const d=drClone(R.c); reelSet('subj',d,f.s); d.tense=f.t; en=drText(d); ja=drJa(d); lab=f.lab; hl=f.w; }
 else { const [cj,st,mt,rule]=DR_CP[R.i]; const m=drCond(cj,st,mt); if(!m){ return '<p class="note">文を作れませんでした。もう一度どうぞ。</p>'; } if(!R.keep||R.keep.i!==R.i){ R.keep={i:R.i,m}; } const mm=R.keep.m; en=drText(mm); ja=drJa(mm); lab=rule; hl=''; }
 DR.say=en; return `<section class="prq"><div class="drlab">${esc(lab)}</div><div class="drsent en">${drHL(en,hl)}</div><div class="prja">${esc(ja)}</div>
 <div class="drbtns"><button class="chip" id="drSay">🔊 聞く</button><button class="wide" id="drNext">つぎ ▶</button><button class="chip" id="drNew">🎲 べつの文</button></div><div class="drcnt">${DR.n}ぶんめ</div></section>`; }
export function drRepNext(){ const R=DR.rep,T=DR.topic; if(!R){ drRepNew(); return; } R.i++; const len=T==='tense'?R.list.length:T==='noun'?R.L.length:T==='verb'?R.F.length:DR_CP.length; if(R.i>=len){ drRepNew(); } drRender(); }
// ---- クイズ ----
export function drQNew(){ for(let k=0;k<8;k++){ drQNew0(); if(DR.q) return; } }
export function drQNew0(){ const T=DR.topic; DR.done=false; DR.msg=null; DR.q=null;
 try{
 if(T==='tense'){ const c=drGen(); if(!c) return; const ts=drTenses(c).filter(t=>['pres','prog','past','fut','perf'].includes(t)); const t=drPick(ts); const opts=[]; drShuf(ts).forEach(x=>{ c.tense=x; const tx=drText(c); if(!opts.some(o=>o.tx===tx)) opts.push({tx,t:x}); }); c.tense=t; const ans=drText(c); const o4=drShuf(opts.filter(o=>o.tx!==ans)).slice(0,3).concat([{tx:ans,t}]); DR.q={ask:drJa(c),sub:'日本語に合う英語は？',opts:drShuf(o4),ans,why:'「'+drTLab(t)+'」→ '+ans}; }
 else if(T==='noun'){ const g=drNounGen(); if(!g) return; let ok,bad,pl=false; if(g.cnt==='u'){ ok=drPick([['some','いくらかの'],['much','たくさんの'],['a little','少しの']]); bad=['many','a few','several','every']; } else if(g.cnt!=='p'&&Math.random()<.4){ ok=['a','1つの']; bad=['much','a little','many','several']; } else { ok=drPick([['some','いくつかの'],['many','たくさんの'],['two','2つの'],['a few','少しの'],['several','いくつかの']]); pl=true; bad=['much','a little','a','every']; } if(g.cnt==='p'){ pl=true; ok=drPick([['some','いくつかの'],['many','たくさんの'],['a lot of','たくさんの']]); bad=['much','a little','a','every']; } const an=/^an /.test(drNP('a',g.n,false)); const A=x=>x==='a'&&an?'an':x; const d=A(ok[0]); const blank=drObjSwap(g.c,'＿＿ '+(pl&&g.cnt!=='p'?sbPlural(g.n):g.n)); const wrong=drShuf(bad).slice(0,3).map(A); const opts=drShuf(wrong.map(x=>({tx:x,t:x})).concat([{tx:d,t:d}])); DR.q={ask:blank,sub:'＿＿に入るのは？',ja:drJa(g.c)+'（'+ok[1]+'）',opts,ans:d,why:g.n+'は'+(g.cnt==='u'?'数えられない名詞':g.cnt==='p'?'ふつう複数形で使う名詞':'数えられる名詞')+'。'+(d==='an'?'an '+g.n:drNP(d,g.n,pl&&g.cnt!=='p'))}; }
 else if(T==='verb'){ const c=drGen({noObj:1}); if(!c) return; const F=drForms(c); const k=drPick([1,2,3,4]); const f=F[k]; const base=F[0].w; const wrongReg=base.replace(/e$/,'')+(k===3?'ing':k===1?'s':'ed'); let pool=F.map(x=>x.w).concat([wrongReg,base+'ed',base+'s']).filter((x,i,a)=>x&&x!==f.w&&a.indexOf(x)===i); if(pool.length<3) return; const wrong=drShuf(pool).slice(0,3); DR.q={ask:base,sub:'「'+base+'」の'+f.lab.replace(/（.*/,'')+'は？',opts:drShuf(wrong.concat([f.w]).map(x=>({tx:x,t:x}))),ans:f.w,why:F.map(x=>x.w).join(' / ')}; }
 else { const [cj,st,mt,rule]=drPick([DR_CP[0],DR_CP[2]]); const m=drCond(cj,st,mt); if(!m) return; const ans=drText(m); const others=(mt==='fut'?['past','perf','pastprog']:['fut','perf','pres']); const opts=[{tx:ans,t:mt}]; others.forEach(x=>{ const d=drClone(m); d.tense=x; if(drTenses(d).includes(x)&&drHoleless(d)){ const tx=drText(d); if(tx!==ans&&!opts.some(o=>o.tx===tx)) opts.push({tx,t:x}); } }); if(opts.length<3) return; DR.q={ask:drJa(m),sub:'日本語に合う英語は？',opts:drShuf(opts.slice(0,4)),ans,why:rule}; }
 }catch(e){ DR.q=null; } }
export function drQView(){ const Q=DR.q; if(!Q) return '<p class="note">問題を作れませんでした。もう一度どうぞ。</p><button class="wide" id="drNext">もう一度 ▶</button>'; const st=drStat();
 return `<section class="prq"><div class="drsub">${esc(Q.sub)}</div><div class="prja">${DR.topic==='verb'?'<b class="en drbig">'+esc(Q.ask)+'</b>':esc(Q.ask)}</div>${Q.ja?`<div class="prexja">${esc(Q.ja)}</div>`:''}
 <div class="propts dropts">${Q.opts.map((o,i)=>`<button class="propt ${DR.done&&o.tx===Q.ans?'ok':''} ${DR.done&&DR.pickd===i&&o.tx!==Q.ans?'ng':''}" data-dq="${i}"><b class="en">${esc(o.tx)}</b></button>`).join('')}</div>
 ${DR.msg?`<div class="prres ${DR.msg.ok?'ok':'ng'}">${DR.msg.ok?'⭕':'✗'} ${esc(Q.why)}</div>`:''}
 ${DR.done?'<button class="wide" id="drNext">つぎへ ▶</button>':''}<div class="drcnt">正解 ${st.ok}／${st.ok+st.miss}　れんぞく ${st.streak}</div></section>`; }
export function drStat(){ const s=pracStore(); s.dr=s.dr||{}; const k=DR.topic; return s.dr[k]=s.dr[k]||{ok:0,miss:0,streak:0}; }
export function drAnswer(i){ if(DR.done||!DR.q) return; const o=DR.q.opts[i]; const ok=o.tx===DR.q.ans; DR.done=true; DR.pickd=i; DR.msg={ok}; const st=drStat(); if(ok){ st.ok++; st.streak++; } else { st.miss++; st.streak=0; } try{ save(); }catch(e){} try{ say(DR.q.ans); }catch(e){} drRender(); }
// ---- 画面 ----
export function prModeSeg(){ const m=PR.mode; return `<div class="seg big prm">${[['pv','🎡 句動詞'],['id','🧩 言い方'],['rep','🔁 反復'],['quiz','🎯 クイズ']].map(([k,l])=>`<button class="${m===k?'on':''}" data-m="${k}">${l}</button>`).join('')}</div>`; }
export function drStart(){ if(PR.mode==='rep'){ drRepNew(); } else { drQNew(); } drRender(); }
export function drRender(){ const el=document.getElementById('prac'); if(!el) return; if(DR.mode!==PR.mode){ DR.mode=PR.mode; }
 const body=PR.mode==='rep'?drRepView():drQView();
 el.innerHTML=`<h2>れんしゅう</h2>${prModeSeg()}<div class="prbar drtopics">${DR_TOPICS.map(([k,l])=>`<button class="chip ${DR.topic===k?'on':''}" data-dt="${k}">${l}</button>`).join('')}</div>${body}<p class="note">${PR.mode==='rep'?'ひたすら声に出して、なぞって覚える練習です。まちがいはありません。':'問題は毎回、自動で作られます。'}</p>`;
 el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ PR.mode=b.dataset.m; PR.cur=null; prNew(); });
 el.querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>{ DR.topic=b.dataset.dt; DR.rep=null; drStart(); });
 el.querySelectorAll('[data-dq]').forEach(b=>b.onclick=()=>drAnswer(+b.dataset.dq));
 const nx=document.getElementById('drNext'); if(nx) nx.onclick=()=>{ if(PR.mode==='rep'){ drRepNext(); } else { drQNew(); drRender(); } };
 const nw=document.getElementById('drNew'); if(nw) nw.onclick=()=>{ drRepNew(); drRender(); };
 const sy=document.getElementById('drSay'); if(sy) sy.onclick=()=>{ try{ say(DR.say); }catch(e){} }; }


/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_drill(){
DR = {topic:'tense',n:0,rep:null,q:null,done:false,msg:null};
DR_TOPICS = [['tense','⏱ 時制'],['noun','📦 名詞'],['verb','🔤 動詞の形'],['cond','☁️ When・If']];
DR_BADV = /^(get|become|seem|turn|keep|remain|grow|stay)$/i;
DR_SUBJ = ['p:i','p:you','p:he','p:she','p:we','p:they'];
drPick = a=>a[Math.floor(Math.random()*a.length)];
drShuf = a=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
drText = c=>sentenceText({main:c});
drJa = c=>sentenceJa({main:c});
drClone = c=>JSON.parse(JSON.stringify(c));
drHoleless = c=>{ try{ return sentenceParts({main:c}).every(p=>!p.hole); }catch(e){ return false; } };
DR_TORDER = ['pres','prog','past','fut','perf','pastprog','perfprog','pastperf','futprog','pastperfprog','futperf','futperfprog'];
DR_QD = {c1:[['a','1つの'],['the','その'],['my','わたしの'],['this','この'],['every','どの〜も']],cp:[['the','その'],['my','わたしの'],['these','これらの'],['some','いくつかの'],['many','たくさんの'],['two','2つの'],['a few','少しの'],['several','いくつかの'],['a lot of','たくさんの'],['all','すべての']],u:[['the','その'],['my','わたしの'],['this','この'],['some','いくらかの'],['much','たくさんの'],['a little','少しの'],['a lot of','たくさんの'],['enough','十分な']]};
DR_CP = [['if','pres','fut','If ＋ 現在形 → will（これから起こりそうなこと）'],['when','pres','pres','When ＋ 現在形 → 現在形（いつものこと）'],['when','past','past','When ＋ 過去形 → 過去形（あのときのこと）']];
}
