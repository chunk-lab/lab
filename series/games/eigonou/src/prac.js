import { DB, save, say } from './common.js';
import { drRender, drStart, prModeSeg } from './drill.js';
import { LEX, N, P, PARTICLE, PVBASE, newClause, sentenceJa, sentenceText } from './engine.js';
import { esc, init } from './play.js';
import { PRAC_ID, PRAC_PV } from './prac_data.js';
// ================= PRACTICE: phrasal verbs / idioms =================
export let PR;
export function pracStore(){ DB.prac=DB.prac||{pv:{},id:{},min:3}; DB.prac.pv=DB.prac.pv||{}; DB.prac.id=DB.prac.id||{}; return DB.prac; }
export function pvList(){
 const seen=new Set(); const out=[];
 PRAC_PV.forEach(p=>{ if(seen.has(p.w)) return; seen.add(p.w); const gv=LEX.verbs.find(v=>v.pv && v.en===p.b && ([v.tail,v.prep].filter(Boolean).join(' ').replace('{poss}','my'))===p.p); out.push(Object.assign({},p,{ja:(gv&&gv.ja&&!gv.jaAdj?gv.ja:p.ja),mean:gv&&gv.mean,gid:gv&&gv.id})); });
 LEX.verbs.filter(v=>v.pv && v.pv.p!=='idiom' && !v.hidden).forEach(v=>{ const p=[v.tail,v.prep].filter(Boolean).join(' '); const w=v.en+' '+p; if(!p || seen.has(w) || p.includes('{poss}')) return; seen.add(w); out.push({w,b:v.en,p,ja:v.ja,ex:'',exja:'',s:v.star||2,mean:v.mean,gid:v.id}); });
 return out;
}
export function idList(){ const out=PRAC_ID.slice(); const seen=new Set(out.map(i=>i.w.toLowerCase()));
 LEX.verbs.filter(v=>v.pv && v.pv.p==='idiom' && !v.hidden).forEach(v=>{ const w=(v.en+' '+[v.tail,v.prep].filter(Boolean).join(' ')).replace('{poss}','my'); if(seen.has(w.toLowerCase())) return; seen.add(w.toLowerCase()); out.push({w,ja:v.ja,ex:'',exja:'',s:v.star||3,gid:v.id}); });
 return out; }
export function prPool(){ const min=pracStore().min||3; return (PR.mode==='pv'?pvList():idList()).filter(p=>p.s>=min); }
export function prPick(){
 const pool=prPool(); const st=pracStore()[PR.mode]; PR.round++;
 const due=pool.filter(p=>{ const r=st[p.w]; return r && r.next<=PR.round && p.w!==(PR.cur&&PR.cur.w); });
 if(due.length) return due[Math.floor(Math.random()*due.length)];
 const fresh=pool.filter(p=>!st[p.w]);
 if(fresh.length){ const top=Math.max(...fresh.map(p=>p.s)); const f2=fresh.filter(p=>p.s===top); return f2[Math.floor(Math.random()*f2.length)]; }
 const rest=pool.filter(p=>p.w!==(PR.cur&&PR.cur.w)); return rest[Math.floor(Math.random()*rest.length)]||pool[0];
}
export function prRecord(ok){ const st=pracStore()[PR.mode]; const w=PR.cur.w; const r=st[w]||{ok:0,miss:0,streak:0,next:0}; if(ok){ r.ok++; r.streak++; r.next=PR.round+[3,6,12,25][Math.min(3,r.streak-1)]; } else { r.miss++; r.streak=0; r.next=PR.round+2; } st[w]=r; save(); }
export function verbForms(b){ const B=Object.assign({},(typeof PVBASE!=='undefined'&&PVBASE[b])||{}); const f=new Set([b,b+'s',b+'es',b+'ed',b+'d',b+'ing',b.replace(/e$/,'')+'ing',b+b.slice(-1)+'ing',b+b.slice(-1)+'ed',b.replace(/y$/,'ies'),b.replace(/y$/,'ied')]); if(B.past) f.add(B.past); if(B.pp) f.add(B.pp); if(B.s3) f.add(B.s3); return f; }
export function blankPhrase(sentence, base, part){
 const toks=sentence.split(/\s+/); const clean=t=>t.toLowerCase().replace(/[^a-z'’-]/g,''); const forms=verbForms(base); const pw=part.split(' ');
 for(let i=0;i<toks.length;i++){ if(!forms.has(clean(toks[i]))) continue; for(let j=i+1;j<=Math.min(toks.length-pw.length,i+6);j++){ if(pw.every((w,k)=>clean(toks[j+k])===w)){ const tail=toks[j+pw.length-1].replace(/^[A-Za-z'’-]+/,''); const out=toks.slice(); out.splice(j,pw.length,'＿＿'+tail); return {text:out.join(' '),verbAt:i}; } } }
 return null;
}
export function genExample(p){
 const v=p.gid? LEX.idx['verbs:'+p.gid] : null; if(!v) return null;
 const subs=['p:i','p:he','p:she','p:we','p:they'];
 const c=Object.assign(newClause(),{subj:subs[Math.floor(Math.random()*subs.length)],pred:{k:'v',id:v.id}}); c.subs={};
 if(v.fr==='tr'||(v.fr==='both'&&v.t)){ c.useObj=true; const tg=v.t||['thing']; const pool=LEX.people.filter(x=>!x.thing&&!x.pron).map(x=>'p:'+x.id).concat(LEX.things.filter(x=>!x.poss&&!x.bpart).map(x=>'t:'+x.id)).filter(r=>{ const n=N(r); const tags=r[0]==='p'?(n.animal?['animal','any']:['person','any']):(n.t||['thing']).concat(['any']); return tg.includes('any')||tg.some(t=>tags.includes(t)); }); if(pool.length) c.obj=pool[Math.floor(Math.random()*Math.min(pool.length,40))]; else { c.useObj=false; } }
 c.tense=['pres','past'][Math.floor(Math.random()*2)];
 try{ return {ex:sentenceText({main:c}),exja:sentenceJa({main:c})}; }catch(e){ return null; }
}
export function prNew(){
 if(PR.mode==='rep'||PR.mode==='quiz'){ drStart(); return; }
 const it=prPick(); PR.cur=it; PR.done=false; PR.tries=0; PR.msg=null; PR.picked=[];
 if(!it){ renderPrac(); return; }
 if(PR.mode==='pv'){
  let ex=it.ex, exja=it.exja; let bl=ex? blankPhrase(ex,it.b,it.p) : null;
  if(!bl){ const g=genExample(it); if(g){ ex=g.ex; exja=g.exja; bl=blankPhrase(ex,it.b,it.p); } }
  PR.ex=ex; PR.exja=exja; PR.blank=bl? bl.text : (it.b+' ＿＿');
  const fam=new Set(); pvList().forEach(q=>{ if(q.b===it.b && q.p!==it.p) fam.add(q.p); });
  const generic=['up','out','off','on','down','back','away','over','in','into','around','through'];
  let opts=shuffleP([...fam]).slice(0,4); generic.forEach(g=>{ if(opts.length<5 && g!==it.p && !opts.includes(g)) opts.push(g); });
  opts.push(it.p); PR.opts=shuffleP(opts);
 } else {
  const words=it.w.replace(/’/g,"'").split(/\s+/); PR.words=words;
  const others=shuffleP(idList().filter(x=>x.w!==it.w).flatMap(x=>x.w.split(/\s+/))).filter(w=>!words.includes(w)).slice(0,Math.min(3,Math.max(2,5-words.length)));
  PR.tiles=shuffleP(words.concat(others).map((w,i)=>({w,i})));
  PR.ex=it.ex; PR.exja=it.exja;
  if(!PR.ex && it.gid){ const g=genExample(it); if(g){ PR.ex=g.ex; PR.exja=g.exja; } }
  const re=new RegExp(it.w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/’|'/g,"['’]").replace(/one['’]s/i,"\\w+['’]?s?"),'i');
  PR.blank = PR.ex && re.test(PR.ex)? PR.ex.replace(re,'＿＿＿') : null;
 }
 renderPrac();
}
export function shuffleP(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
export function prAnswerPV(p){
 const it=PR.cur; if(PR.done) return;
 if(p===it.p){ if(PR.tries===0) prRecord(true); PR.done=true; PR.msg={ok:1}; say(PR.ex||(it.b+' '+it.p)); }
 else { if(PR.tries===0) prRecord(false); PR.tries++; const other=pvList().find(q=>q.b===it.b&&q.p===p); PR.msg={ok:0,txt: other? `${it.b} ${p} ＝「${other.ja}」。ここでは意味が合いません` : `${it.b} ${p} ではありません`}; say(it.b+' '+p); }
 renderPrac();
}
export function prTapTile(t){
 if(PR.done) return; if(PR.picked.includes(t)) PR.picked=PR.picked.filter(x=>x!==t); else PR.picked.push(t);
 if(PR.picked.length===PR.words.length){ const ans=PR.picked.map(x=>x.w).join(' ').toLowerCase(); const ok = ans===PR.words.join(' ').toLowerCase();
  if(ok){ if(PR.tries===0) prRecord(true); PR.done=true; PR.msg={ok:1}; say(PR.ex||PR.cur.w); }
  else { if(PR.tries===0) prRecord(false); PR.tries++; PR.msg={ok:0,txt: PR.tries>=2? '正解：'+PR.cur.w : 'おしい！順番をもう一度'}; setTimeout(()=>{ PR.picked=[]; renderPrac(); },900); }
 }
 renderPrac();
}
export function renderPrac(){
 if(PR.mode==='rep'||PR.mode==='quiz'){ drRender(); return; }
 const el=document.getElementById('prac'); if(!el) return; const st=pracStore(); const it=PR.cur;
 const pool=prPool(); const rec=st[PR.mode]; const learned=pool.filter(p=>rec[p.w]&&rec[p.w].streak>=2).length; const weak=pool.filter(p=>rec[p.w]&&rec[p.w].miss>rec[p.w].ok).length;
 let h=`<h2>れんしゅう</h2>${prModeSeg()}
 <div class="prbar"><span>よく出る順：</span>${[[3,'★★★だけ'],[2,'★★まで'],[1,'ぜんぶ']].map(([v,l])=>`<button class="chip ${(st.min||3)===v?'on':''}" data-min="${v}">${l}</button>`).join('')}<span class="prstat">覚えた ${learned}／${pool.length}${weak?`・にがて ${weak}`:''}</span></div>`;
 if(!it){ h+='<p class="note">問題がありません</p>'; el.innerHTML=h; bindPrac(); return; }
 if(PR.mode==='pv'){
  const P=PARTICLE[it.p.split(' ')[0]]||PARTICLE.idiom;
  h+=`<section class="prq"><div class="prja">「${esc(it.ja)}」</div><div class="prsent en">${esc(PR.blank).replace('＿＿','<span class="prblank">'+(PR.done?esc(it.p):'＿＿')+'</span>')}</div>${PR.exja?`<div class="prexja">${esc(PR.exja)}</div>`:''}
  <div class="prbase"><b class="en">${esc(it.b)}</b> ＋ ？</div>
  <div class="propts">${PR.opts.map(o=>{ const PP=PARTICLE[o.split(' ')[0]]||{e:'▫️'}; return `<button class="propt ${PR.done&&o===it.p?'ok':''}" data-p="${esc(o)}"><span>${PP.e}</span><b class="en">${esc(o)}</b></button>`; }).join('')}</div>
  ${PR.msg? (PR.msg.ok? `<div class="prres ok"><div class="dimg a-${P.a}"><span>${P.e}</span></div><div><b class="en">${esc(it.b+' '+it.p)}</b> ＝ ${esc(it.ja)}<small>「${esc(it.p.split(' ')[0])}」のイメージ：${esc(P.core||'')}</small>${it.mean?`<small>${esc(it.mean)}</small>`:''}</div></div>` : `<div class="prres ng">✗ ${esc(PR.msg.txt)}</div>`) : ''}
  ${PR.done?'<button class="wide" id="prNext">つぎへ ▶</button>':''}</section>`;
 } else {
  h+=`<section class="prq"><div class="prja">「${esc(it.ja)}」</div>${PR.blank?`<div class="prsent en">${esc(PR.blank).replace('＿＿＿','<span class="prblank">'+(PR.done?esc(it.w):'＿＿＿')+'</span>')}</div>`:''}${PR.exja?`<div class="prexja">${esc(PR.exja)}</div>`:''}
  <div class="prbuild en">${PR.picked.map((t,i)=>`<button class="prtile on" data-t="${t.i}">${esc(t.w)}</button>`).join('')}${PR.picked.length<PR.words.length?'<span class="prslot">'+'＿ '.repeat(PR.words.length-PR.picked.length)+'</span>':''}</div>
  <div class="prtiles en">${PR.tiles.map(t=>`<button class="prtile ${PR.picked.includes(t)?'used':''}" data-t="${t.i}">${esc(t.w)}</button>`).join('')}</div>
  ${PR.msg? (PR.msg.ok? `<div class="prres ok">⭕ <b class="en">${esc(it.w)}</b> ＝ ${esc(it.ja)}</div>` : `<div class="prres ng">${esc(PR.msg.txt)}</div>`):''}
  ${PR.done||PR.tries>=2?'<button class="wide" id="prNext">つぎへ ▶</button>':''}</section>`;
 }
 h+=`<p class="note">まちがえた問題は、少しあとでもう一度出ます。正解が続くと、出る間隔がのびていきます。</p><p class="note">出典：句動詞・熟語の一覧と例文は「米国英語｜熟語と句動詞 分離版」より。</p>`;
 el.innerHTML=h; bindPrac();
}
export function bindPrac(){
 const el=document.getElementById('prac');
 el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ PR.mode=b.dataset.m; PR.cur=null; prNew(); });
 el.querySelectorAll('[data-min]').forEach(b=>b.onclick=()=>{ pracStore().min=+b.dataset.min; save(); PR.cur=null; prNew(); });
 el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>prAnswerPV(b.dataset.p));
 el.querySelectorAll('.prtile').forEach(b=>b.onclick=()=>{ const t=PR.tiles.find(x=>String(x.i)===b.dataset.t); if(t) prTapTile(t); });
 const nx=document.getElementById('prNext'); if(nx) nx.onclick=prNew;
}




/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_prac(){
PR = {mode:'pv',min:3,cur:null,done:false,tries:0,picked:[],tiles:[],round:0,msg:null};
init();
}
