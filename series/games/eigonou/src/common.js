import { SLOT_OF_KIND, aiBox, aiPrompt, buildItem, parseAi, skelHtml } from './addword.js';
import { artCheck } from './emoji_fix.js';
import { FRONTS, LEX, OFFICIAL, TENSES, buildLex, ing, newClause, past, pp, s3, sentenceJa, sentenceText } from './engine.js';
import { ENV, onDoc } from './env.js';
import { tx } from './i18n.js';
import { basePack, exportPack, importPackUI, packFromSet } from './pack.js';
import { $, APP, esc, go, ico, resetAll } from './play.js';
import { loadPlay, runTry } from './playsent.js';
// ================= APP STATE =================
export let STORE_KEY;
export let DEF_SETTINGS;
export let DB;

export function save(){ try{ ENV.store.set('db', DB); }catch(e){ toast('保存できませんでした（容量がいっぱいかもしれません）'); } }
export let COMMUNITY;
export function activeSets(){ const s=DB.sets.filter(x=>x.on); COMMUNITY.forEach(c=>{ if(DB.community[c.id]) s.push(c); }); return s; }


export let SET;

// ================= SPEECH =================
export let VOICE;
export function pickVoice(){ if(!('speechSynthesis' in window)) return; const vs=speechSynthesis.getVoices(); VOICE = vs.find(v=>/en-US/i.test(v.lang)&&/Samantha|Google US|Jenny|Aria|Natural/i.test(v.name)) || vs.find(v=>/en-US/i.test(v.lang)) || vs.find(v=>/^en/i.test(v.lang)) || null; }

export let TTS_OK, TTS_WARNED;
export function ttsNotice(){ if(TTS_WARNED) return; TTS_WARNED=true; const el=document.getElementById('ttsnote'); if(el) el.hidden=false; }
export function say(t){   /* 読み上げは共通の部品。声・速さ・ON/OFF は全アプリ共通の設定。ここの「音声」は読む範囲だけ */
 if(!t||SET().speak==='off') return;
 let tt=t.replace(/[,]$/,'').trim(); if(/^I[.!?]?$/.test(tt)) tt='eye';
 try{ ENV.core.speech.speak(tt, { rate: 0.9 }); }catch(e){ ttsNotice(); }
}



// ================= TOAST =================
export let _tt; export function toast(t){ const el=$('#toast'); el.textContent=t; el.classList.add('on'); clearTimeout(_tt); _tt=setTimeout(()=>el.classList.remove('on'),2200); }

// ================= NAV / SETTINGS / SETS / REGISTER =================
export function renderSettings(){
 const S=SET(); const seg=(k,opts)=>`<div class="seg big">${opts.map(([v,l])=>`<button class="${S[k]===v?'on':''}" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
 const tg=(k,l)=>`<label class="tgl"><input type="checkbox" data-tk="${k}" ${S[k]?'checked':''}><span>${l}</span></label>`;
 $('#settings').innerHTML=`<h2>設定</h2>
 <section><h3>文のレベル</h3><p class="note">レベルが上がると、使える文の形が増えます。</p>${seg('slv',[['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['6','何でも']])}<p class="note">${esc(SLV_DESC[+S.slv||3]||'')}</p></section>
 <section><h3>単語のレベル</h3><p class="note">選んだ級までの単語が中心に出ます。よく使う単語ほど出やすくなります。</p>${seg('level',[[1,'3級まで'],[2,'準2級まで'],[3,'2級まで'],[4,'それ以上も']])}<p class="note">英検の級との対応はおおよその目安です（CEFR A1≒3級、A2≒準2級、B1≒2級）。</p></section>
 <section><h3>候補の言葉</h3><p class="note">音声と、上にできていく文はいつも英語です。</p>${seg('lang',[['ja','日本語'],['en','English'],['both','両方']])}</section>
 <section><h3>選んだあと、動きを見せる時間</h3>${seg('beat',[['long','たっぷり'],['mid','ふつう'],['off','なし']])}</section>
 <section>${tg('adv','詳細設定を表示する')}</section>
${S.adv?`<div class="advset">
 <section><h3>キャンバスの文</h3>${tg('canvasJa','キャンバスの文に日本語訳をつける')}</section>
 <section><h3>🎨 絵・動きのチェック</h3>${artCheckHtml()}</section>
 <section><h3>くだけた言い方・決まり文句</h3>${tg('casual','きほんモードでも出す（何でもモードではいつも出ます）')}</section>
 <section><h3>きほんモードで使うもの</h3>${tg('kModal','できる・したい・かも など')}${tg('kNeg','しない（否定）')}${tg('kQ','きく（疑問）')}</section>
 <section><h3>音声</h3>${seg('speak',[['chunk','選んだ部分'],['sentence','毎回文全体'],['off','なし']])}<div class="rowb"><button class="chip" id="commonSet">🔈 声・速さ・音量（共通の設定）</button></div><button class="chip" id="testv">🔊 試しに聞く</button></section>
 <section><h3>単語リストの出典</h3><p class="note">単語のレベル分けに『CEFR-J Wordlist Version 1.6』東京外国語大学投野由紀夫研究室（http://www.cefr-j.org/download.html より2026年9月ダウンロード）を利用しています。日本語の意味・活用・使い方の情報はこのゲーム用に付け加えたものです。</p></section>
 <section><h3>色のきまり</h3><div class="legend">${[['noun','人・物（名詞）','Ken / an apple'],['verb','する・ある（動詞）','eats / is'],['aux','助ける言葉（助動詞・否定）','can / don\'t / will'],['adj','どんな（形容詞）','happy'],['adv','どこ・いつ・どう（副詞のまとまり）','in the park'],['conj','つなぐ言葉','when / who / to'],['wh','きく言葉','What / Where']].map(([p,a,b])=>`<div class="lg"><span class="ck pos-${p}"><span class="en">${b}</span></span><span>${a}</span></div>`).join('')}</div><p class="note">主語は色つきの塗りつぶし、ほかは枠で見分けます。</p></section>
</div>`:''}`;
 $('#settings').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ let v=b.dataset.v; if(b.dataset.k==='rate'||b.dataset.k==='level') v=+v; S[b.dataset.k]=v; save(); renderSettings(); if(b.dataset.k==='slv' && typeof resetAll==='function'){ APP.level=String(v); resetAll(); } });
 $('#settings').querySelectorAll('[data-tk]').forEach(b=>b.onchange=()=>{ S[b.dataset.tk]=b.checked; save(); if(b.dataset.tk==='adv') renderSettings(); });
 { const tv=$('#testv'); if(tv) tv.onclick=()=>say('I am playing soccer in the park with my friends.'); } { const cs=$('#commonSet'); if(cs) cs.onclick=()=>ENV.core.ui.settings(); }
}
export function refreshLex(){ buildLex(activeSets()); }
// マイセットの中身:単語/熟語・慣用句/文章に分けて出す。それぞれ ▶ を押すと、AIが文を考えて「つくる」に入る
const clsOf=it=>it.cls||(/\s/.test((it.en+(it.tail?' '+it.tail:'')).trim())?'phrase':'word');
function setBody(s){
 const itH=it=>`<span class="it pos-${kindPos(it.kind)}">${ico(it.e,'ic sm')} ${esc(it.en+(it.tail?' '+it.tail:''))} <small>${esc(it.ja)}</small><button data-try="${s.id}|${it.id}" aria-label="使ってみる" style="color:#2a8">▶</button><button data-del="${s.id}|${it.id}" aria-label="削除">×</button></span>`;
 const W=s.items.filter(i=>clsOf(i)==='word'), P=s.items.filter(i=>clsOf(i)==='phrase'), T=s.sentences||[];
 const sec=(t,h)=>`<div class="note" style="margin:8px 0 2px">${t}</div><div class="items">${h}</div>`;
 if(!W.length&&!P.length&&!T.length) return '<div class="items"><p class="note">まだありません。「ことば登録」から追加できます。</p></div>';
 return (W.length?sec('単語 '+W.length,W.map(itH).join('')):'')+(P.length?sec('熟語・慣用句 '+P.length,P.map(itH).join('')):'')+(T.length?sec('文章 '+T.length,T.map((t,i)=>`<span class="it"><small style="margin-right:4px">📝</small>${esc(t.en)} <small>${esc(t.ja||'')}</small><button data-trys="${s.id}|${i}" aria-label="使ってみる" style="color:#2a8">▶</button></span>`).join('')):'');
}
export function renderSets(){
 const mine=DB.sets.map(s=>`<div class="setc"><div class="sethd"><label class="tgl"><input type="checkbox" data-on="${s.id}" ${s.on?'checked':''}><span><b>${esc(s.name)}</b></span></label><span class="cnt">${s.items.length}語${s.sentences&&s.sentences.length?' / '+s.sentences.length+'文':''}</span></div>
  ${setBody(s)}
  <div class="rowb"><button class="chip" data-pub="${s.id}">${s.published?'公開中（試作）':'公開する'}</button><button class="chip" data-ren="${s.id}">名前を変える</button><button class="chip" data-exp="${s.id}">📤 ${tx('pack.export')}</button></div></div>`).join('');
 const com=COMMUNITY.map(c=>{ const r=DB.ratings[c.id]||{}; const sc=c.score; return `<div class="setc"><div class="sethd"><b>${esc(c.name)}</b><span class="cnt">by ${esc(c.by)}・${c.uses+(DB.community[c.id]?1:0)}人が使用</span></div><p class="note">${esc(c.desc)}</p>
  <div class="items">${c.items.map(it=>`<span class="it pos-${kindPos(it.kind)}">${ico(it.e,'ic sm')} ${esc(it.en)} <small>${esc(it.ja)}</small></span>`).join('')}</div>
  <div class="rate">${[['easy','👍','わかりやすい'],['useful','💡','役立った'],['again','🔁','また使う'],['wrong','⚠️','まちがいを報告']].map(([k,e,l])=>`<button class="${r[k]?'on':''}" data-rt="${c.id}|${k}">${e} ${l} <b>${sc[k]+(r[k]?1:0)}</b></button>`).join('')}</div>
  <div class="rowb"><button class="chip ${DB.community[c.id]?'on':''}" data-add="${c.id}">${DB.community[c.id]?'✓ ゲームに入っています':'＋ ゲームに追加'}</button></div></div>`; }).join('');
 $('#sets').innerHTML=`<h2>ことばセット</h2><p class="note">オンにしたセットの言葉が「つくる」「みつける」の候補にそのまま出てきます。</p>
 <section><h3>公式</h3><div class="setc"><div class="sethd"><b>きほんセット</b><span class="cnt">${OFFICIAL.people.length+OFFICIAL.things.length+OFFICIAL.verbs.length+OFFICIAL.states.length+OFFICIAL.places.length+OFFICIAL.times.length+OFFICIAL.manners.length}語・いつもオン</span></div></div></section>
 <section><h3>自分のセット</h3>${mine}<div class="rowb wrap"><button class="chip" id="newset">＋ 新しいセット</button><button class="chip" id="impPack">📥 ${tx('pack.import')}</button></div><p class="note">パックは「英語の中身」と「言語ごとの意味」に分かれた共有用のファイルです。ほかの人のパックを読みこんだり、自分のセットを渡したりできます。</p><details><summary class="note">翻訳・開発用</summary><button class="chip" id="basePack">📤 ${tx('pack.base')}</button></details></section>
 <section><h3>みんなのセット <span class="note">（試作：サンプル表示）</span></h3><div class="pts">🪙 あなたのポイント <b>${DB.points}</b><span class="note">公開したセットが評価されるとたまります</span></div>${com}</section>
 ${DB.log.length?`<section><h3>作った文</h3>${DB.log.slice(0,12).map(l=>`<button class="logl" data-say="${esc(l.en)}"><span class="en">${esc(l.en)}</span><small>${esc(l.ja)}</small></button>`).join('')}</section>`:''}`;
 const R=$('#sets');
 R.querySelectorAll('[data-on]').forEach(b=>b.onchange=()=>{ DB.sets.find(s=>s.id===b.dataset.on).on=b.checked; save(); refreshLex(); });
 R.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const [sid,iid]=b.dataset.del.split('|'); const s=DB.sets.find(x=>x.id===sid); s.items=s.items.filter(i=>i.id!==iid); save(); refreshLex(); renderSets(); });
 R.querySelectorAll('[data-try]').forEach(b=>b.onclick=async()=>{ const [sid,iid]=b.dataset.try.split('|'); const st=DB.sets.find(x=>x.id===sid), it=st&&st.items.find(i=>i.id===iid); if(!it) return; b.textContent='…'; try{ const p=await runTry({en:(it.en+(it.tail?' '+it.tail:'')).trim(), ja:it.ja, cls:clsOf(it), kind:it.kind}); if(p){ loadPlay(p); return; } }catch(e){ toast(String(e&&e.message||e)); } b.textContent='▶'; });
 R.querySelectorAll('[data-trys]').forEach(b=>b.onclick=async()=>{ const [sid,i]=b.dataset.trys.split('|'); const st=DB.sets.find(x=>x.id===sid), t=st&&(st.sentences||[])[+i]; if(!t) return; b.textContent='…'; try{ const p=await runTry({en:t.en, ja:t.ja, cls:'sentence'}); if(p){ loadPlay(p); return; } }catch(e){ toast(String(e&&e.message||e)); } b.textContent='▶'; });
 R.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{ const id=b.dataset.add; DB.community[id]=!DB.community[id]; save(); refreshLex(); renderSets(); toast(DB.community[id]?'ゲームに追加しました':'ゲームから外しました'); });
 R.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>{ const [id,k]=b.dataset.rt.split('|'); DB.ratings[id]=DB.ratings[id]||{}; DB.ratings[id][k]=!DB.ratings[id][k]; save(); renderSets(); });
 R.querySelectorAll('[data-pub]').forEach(b=>b.onclick=()=>publishCheck(b.dataset.pub));
 R.querySelectorAll('[data-ren]').forEach(b=>b.onclick=()=>{ const s=DB.sets.find(x=>x.id===b.dataset.ren); const n=prompt('セットの名前',s.name); if(n){ s.name=n.slice(0,30); save(); renderSets(); } });
 R.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>say(b.dataset.say));
 R.querySelectorAll('[data-exp]').forEach(b=>b.onclick=()=>{ const st=DB.sets.find(x=>x.id===b.dataset.exp); if(st) exportPack(packFromSet(st), (st.name||'pack')+'.json'); });
 $('#impPack').onclick=importPackUI; $('#basePack').onclick=()=>exportPack(basePack(),'eigonou-base-pack.json');
 $('#newset').onclick=()=>{ DB.sets.push({id:'my'+Date.now(),name:'セット'+(DB.sets.length+1),on:true,items:[],sentences:[]}); save(); renderSets(); };
}
export function kindPos(k){ return {people:'noun',things:'noun',verbs:'verb',states:'adj',places:'adv',times:'adv',manners:'adv',leads:'conj'}[k]||'noun'; }
export function publishCheck(sid){
 const s=DB.sets.find(x=>x.id===sid); const issues=[];
 if(!s.items.length) issues.push('言葉が1つもありません');
 const seen={}; s.items.forEach(it=>{ const k=it.kind+it.en.toLowerCase(); if(seen[k]) issues.push(`「${it.en}」が重複しています`); seen[k]=1; if(!it.ja) issues.push(`「${it.en}」に日本語がありません`); if(/[^\x20-\x7E’]/.test(it.en)) issues.push(`「${it.en}」に英語以外の文字があります`); const off=[...LEX.people,...LEX.things,...LEX.verbs].find(o=>!o.custom && o.en.toLowerCase()===it.en.toLowerCase()); if(off) issues.push(`「${it.en}」は公式セットにもあります`); });
 if(issues.length){ alert('公開前のチェック\n\n'+issues.slice(0,8).map(x=>'・'+x).join('\n')+'\n\n直してからもう一度お試しください。'); return; }
 s.published=!s.published; save(); renderSets(); toast(s.published?'公開しました（試作ではこの端末の中だけ）':'公開をやめました');
}

// ---------- REGISTER ----------
export let REG;
export let KINDS;
export let TAGS;
export function judge(en, ja){
 const e=en.trim(), l=e.toLowerCase(); const words=l.split(/\s+/).filter(Boolean);
 if(!e) return null;
 if(/[.?!]$/.test(e) && words.length>=3) return 'sentence';
 if(/,$/.test(e) && words.length<=5) return 'leads';
 if(/^(by the way|first of all|in the end|at first|in fact|to be honest|for example|anyway|actually|of course|after all|in my opinion|as a result|by the way)$/.test(l.replace(/,$/,''))) return 'leads';
 if(/^(yesterday|today|tomorrow|tonight|now|soon|already|sometimes|always|usually|often|every |last |next |this (morning|afternoon|evening|week|year)|on (sunday|monday|tuesday|wednesday|thursday|friday|saturday)s?|at \d|at (noon|night)|in the (morning|afternoon|evening)|since |for (a|an|\d|two|three|few|many) |all day|after |before school|.* ago$)/.test(l)) return 'times';
 if(/^(here|there|home|at home|downtown|abroad)$/.test(l) || /^(in|at|on|by|near|under|behind|inside|outside|in front of|next to) /.test(l)) return 'places';
 if(/^(with |alone$|together$)/.test(l)) return 'manners';
 if(words.length===1 && /ly$/.test(l) && !/(family|fly|jelly|belly|july|rally|ally)$/.test(l)) return 'manners';
 if(/^(a|an|the|my|your|his|her|our|their|some|this|that|these|those)\s/.test(l) || /^[A-Z][a-z]+$/.test(e)){
  if(/(mother|father|mom|dad|friend|teacher|brother|sister|man|woman|boy|girl|baby|doctor|student|coach|uncle|aunt|grandma|grandpa|cousin|neighbor|boss|kid|child|people|person|team)s?$/.test(l) || /(さん|先生|ちゃん|くん|友|母|父|兄|姉|弟|妹|人|たち)$/.test(ja)) return 'people';
  if(/^[A-Z][a-z]+$/.test(e) && /[ァ-ヶー]+$/.test(ja) && ja.length<=5) return 'people';
  return 'things';
 }
 if(/^to /.test(l)) return 'verbs';
 if(/[うくぐすつぬぶむる]$/.test(ja) && !/[いな]$/.test(ja)) return 'verbs';
 if(/(い|な|だ)$/.test(ja) || /(ful|ous|ive|able|y|ed)$/.test(l)) return 'states';
 return words.length===1 ? 'things' : 'things';
}
export function guessJt(ja){ if(/する$/.test(ja)) return 's'; if(/来る$|くる$/.test(ja)) return 'k'; if(/る$/.test(ja)){ const p=ja.slice(-2,-1); if(/[えけげせぜてでねへべぺめれいきぎしじちぢにひびぴみり]/.test(p) && !/(帰る|入る|走る|知る|切る|要る|減る|しゃべる|すべる|ける|はいる|かえる|しる|きる)$/.test(ja)) return 'i'; if(/^[一-龯]る$/.test(ja.slice(-2)) && /(見る|着る|寝る|出る|似る|煮る|居る|得る)$/.test(ja)) return 'i'; } return 'g'; }
export function autoExtra(kind, en, ja){
 const l=en.trim().replace(/^to /i,'');
 if(kind==='verbs'){ const parts=l.split(' '); const b=parts[0]; const known=LEX.verbs.find(v=>v.en===b&&!v.custom); const tmp={en:b}; return {en:b, tail:parts.slice(1).join(' '), past: known&&known.past||past(tmp), pp: known&&(known.pp||known.past)||pp(tmp), fr:'both', t:[], jt:guessJt(ja)}; }
 if(kind==='people'){ return {pl:/s$/.test(l)&&!/ss$/.test(l)?1:0, animal:/(dog|cat|bird|rabbit|fish|horse|hamster)s?$/.test(l)?1:0}; }
 if(kind==='things'){ return {pl: /s$/.test(l)&&!/ss$/.test(l)&&!/^(an?|this|that) /.test(l)?1:0, t:['thing']}; }
 if(kind==='states'){ const w=l; const more=w.length>7||/(ful|ous|ive|ed|ing)$/.test(w); return {more:more?1:0, jt: /い$/.test(ja)?'i':(/(する|る)$/.test(ja)?'v':'na'), vt:guessJt(ja)}; }
 if(kind==='places'){ const to = /^(in|at|on|by|near|inside) /.test(l)? l.replace(/^(in|at|on|by|near|inside) /,'to '): l; return {to, jat: ja.replace(/で$/,'へ'), jn: ja.replace(/[でにへ]$/,'')}; }
 if(kind==='times'){ let ts=['pres','past','fut']; if(/^(yesterday|last |.* ago$|this morning)/.test(l)) ts=['past','pastprog']; else if(/^(tomorrow|next |soon)/.test(l)) ts=['fut','prog']; else if(/^(every |on \w+s$|sometimes|usually|always|often)/.test(l)) ts=['pres','past']; else if(/^(since )/.test(l)) ts=['perf','perfprog']; else if(/^for /.test(l)) ts=['perfprog','perf','past','fut']; else if(/^now$/.test(l)) ts=['prog','pres']; return {ts}; }
 return {};
}
export function splitSentence(en){
 const raw=en.replace(/[.?!]$/,'').trim(); let toks=raw.split(/\s+/);
 const low=toks.map(t=>t.toLowerCase().replace(/[,]/g,''));
 const out=[]; const used=new Array(toks.length).fill(0);
 const mark=(i,j,kind)=>{ for(let k=i;k<j;k++) used[k]=1; out.push({i,kind,en:toks.slice(i,j).join(' ').replace(/,$/,'')}); };
 const timeW=/^(yesterday|today|tomorrow|tonight|now|soon|already|sometimes|always|usually|often)$/;
 const multiTime=/^(every|last|next|this)$/;
 const preps=/^(in|at|on|by|near|under|behind|to|from|with|for|since|after|before)$/;
 for(let i=0;i<low.length;i++){
  if(used[i]) continue;
  if(timeW.test(low[i])){ mark(i,i+1,'times'); continue; }
  if(multiTime.test(low[i]) && i>0 && low[i+1]){ mark(i,i+2,'times'); continue; }
  if(preps.test(low[i]) && i>1){ let j=i+1; while(j<low.length && !preps.test(low[j]) && !timeW.test(low[j]) && !multiTime.test(low[j])) j++; const ph=low.slice(i,j).join(' '); const kind = /^with /.test(ph)?'manners': /^(for|since|after|before) /.test(ph)||/^(at \d|in the (morning|afternoon|evening)|on (sunday|monday|tuesday|wednesday|thursday|friday|saturday))/.test(ph)?'times':/^to (the |my )?\w+$/.test(ph)&&i>2?'places':'places'; mark(i,j,kind); i=j-1; continue; }
  if(/ly$/.test(low[i]) && i>1){ mark(i,i+1,'manners'); continue; }
 }
 // core
 const core=[]; for(let i=0;i<toks.length;i++) if(!used[i]) core.push(i);
 const aux=/^(is|am|are|was|were|will|can|could|do|does|did|have|has|had|should|must|might|would|don't|doesn't|didn't|can't|won't)$/;
 const vforms={}; LEX.verbs.forEach(v=>[v.en,s3(v),past(v),pp(v),ing(v)].forEach(f=>vforms[f]=v));
 let vi=core.findIndex((idx,k)=>k>0 && (aux.test(low[idx])||vforms[low[idx]]|| /(ed|s)$/.test(low[idx])&&k>0&&k===1));
 if(vi<0) vi=Math.min(1,core.length-1);
 let vend=vi; while(vend+1<core.length && (aux.test(low[core[vend]]) || /^(not|never)$/.test(low[core[vend+1]]) || (aux.test(low[core[vend]]) && true))) { vend++; if(!aux.test(low[core[vend]])) break; }
 const subjI=core.slice(0,vi), verbI=core.slice(vi,vend+1), objI=core.slice(vend+1);
 if(subjI.length) out.push({i:subjI[0],kind:'people',en:subjI.map(i=>toks[i]).join(' ')});
 if(verbI.length){ const last=low[verbI[verbI.length-1]]; const v=vforms[last]; out.push({i:verbI[0],kind:'verbs',en:verbI.map(i=>toks[i]).join(' '),lemma:v?v.en:last.replace(/(ing|ed|es|s)$/,''),known:!!v}); }
 if(objI.length) out.push({i:objI[0],kind:'things',en:objI.map(i=>toks[i]).join(' ')});
 out.sort((a,b)=>a.i-b.i);
 return out;
}
export function renderReg(){
 const r=REG; const kind=r.kind||r.auto;
 let h=`<h2>ことば登録</h2><p class="note">英語と日本語を入れるだけで、ゲームのどこで使う言葉かを自動で判定します。違っていたらタップで直せます。</p>
 <section class="regf"><label>英語<input id="rEn" value="${esc(r.en)}" placeholder="例：a latte / practice / at the gym / I play tennis on Sundays." autocomplete="off"></label>
 <label>日本語<input id="rJa" value="${esc(r.ja)}" placeholder="例：ラテ / 練習する / ジムで" autocomplete="off"></label>
 <div class="rowb"><label class="pic">絵文字か画像<input id="rE" value="${/^data:/.test(r.e)?'':esc(r.e)}" placeholder="🧁" maxlength="4"></label><label class="chip upl">画像を選ぶ<input type="file" id="rImg" accept="image/*" hidden></label>${/^data:/.test(r.e)?ico(r.e,'ic prev'):''}</div></section>`;
 if(r.en.trim()){
  const cls=kind==='sentence'?'sentence':(r.cls||(/\s/.test(r.en.trim())?'phrase':'word'));
  h+=`<section><h3>区分</h3><div class="rowb">${[['word','単語'],['phrase','熟語・慣用句'],['sentence','文章']].map(([k,l])=>`<button class="chip ${cls===k?'on':''}" data-cls="${k}">${l}</button>`).join('')}</div><p class="note">単語と熟語は別々に登録できます。マイセットでも、この区分で分かれます。</p></section>`;
  const slot=kind==='sentence'?null:SLOT_OF_KIND[kind];
  const SUB={noun:[['people','人・動物'],['things','もの']],back:[['times','いつ'],['places','どこ'],['manners','どんなふうに']]};
  h+=`<section><h3>文のどこに入る？ ${r.auto&&!r.kind?'<span class="autot">自動判定</span>':''}</h3>${skelHtml(slot,false)}${slot&&SUB[slot]?`<div class="rowb">${SUB[slot].map(([k,l])=>`<button class="chip ${kind===k?'on':''}" data-kd="${k}">${l}</button>`).join('')}</div>`:''}<div class="rowb"><button class="chip ${kind==='sentence'?'on':''}" data-kd="sentence">文ごと登録する</button></div>
  <label class="note">例文（あれば。AIが文の中の位置から判断します）<input id="rEx" value="${esc(r.ex)}" placeholder="例：I usually hang out with my friends on Sundays." autocomplete="off"></label><div class="aibox" id="rAi"></div></section>`;
  if(kind==='sentence'){ const sp=splitSentence(r.en); r.sentence=sp; h+=`<section><h3>文をまとまりに分けました</h3><p class="note">それぞれの日本語を入れると、ほかの文でも使えるようになります（空のままなら文だけ保存）。</p><div class="spl">${sp.map((c,i)=>`<div class="spr"><span class="ck pos-${kindPos(c.kind)}"><span class="en">${esc(c.kind==='verbs'&&!c.known?c.lemma:c.en)}</span></span><select data-sk="${i}">${KINDS.filter(k=>k[0]!=='sentence').map(([k,l])=>`<option value="${k}" ${c.kind===k?'selected':''}>${l}</option>`).join('')}</select><input data-sj="${i}" placeholder="日本語" value="${esc(c.ja||'')}"></div>`).join('')}</div></section>`; }
  else if(kind){ const x=Object.assign(autoExtra(kind,r.en,r.ja), r.extra); r.x=x; h+=extraForm(kind,x); h+=previewBox(kind,x); }
  h+=`<section><div class="rowb"><span class="note">保存先</span><select id="rSet">${DB.sets.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div><button class="wide" id="rSave">この言葉を登録してゲームで使う</button><button class="wide" id="rTry" style="margin-top:8px;background:linear-gradient(160deg,#cfe9ff,#b9d9ff)">✨ 使ってみる(AIが文を考えて「つくる」へ)</button></section>`;
 }
 $('#reg').innerHTML=h;
 inboxBanner();
 const rEn=$('#rEn'), rJa=$('#rJa');
 const upd=()=>{ r.en=rEn.value; r.ja=rJa.value; r.auto=judge(r.en,r.ja); r.extra={}; clearTimeout(r._t); r._t=setTimeout(()=>{ const a=document.activeElement&&document.activeElement.id; renderReg(); if(a){ const el=$('#'+a); if(el){ el.focus(); const n=el.value.length; el.setSelectionRange&&el.setSelectionRange(n,n);} } },450); };
 rEn.oninput=upd; rJa.oninput=upd; $('#rE').oninput=e=>{ r.e=e.target.value; };
 $('#rImg').onchange=e=>{ const f=e.target.files[0]; if(!f) return; const fr=new FileReader(); fr.onload=()=>{ const img=new Image(); img.onload=()=>{ const cv=document.createElement('canvas'); const S=96; const sc=Math.min(S/img.width,S/img.height); cv.width=Math.round(img.width*sc); cv.height=Math.round(img.height*sc); cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height); r.e=cv.toDataURL('image/webp',.8); renderReg(); }; img.src=fr.result; }; fr.readAsDataURL(f); };
 document.querySelectorAll('[data-kd]').forEach(b=>b.onclick=()=>{ r.kind=b.dataset.kd; r.extra={}; renderReg(); });
 document.querySelectorAll('[data-cls]').forEach(b=>b.onclick=()=>{ const v=b.dataset.cls; r.cls=v; if(v==='sentence') r.kind='sentence'; else if(r.kind==='sentence') r.kind=null; r.extra={}; renderReg(); });
 document.querySelectorAll('#reg .skel [data-sk]').forEach(b=>b.onclick=()=>{ const sl=b.dataset.sk; const cur=r.kind||r.auto; const def={front:'leads',noun:(cur==='things'?'things':'people'),verb:'verbs',adj:'states',back:(['times','places','manners'].includes(cur)?cur:'manners')}[sl]; r.kind=def; r.extra={}; renderReg(); });
 { const ex=$('#rEx'); if(ex) ex.oninput=()=>{ r.ex=ex.value; }; }
 if($('#rAi')) aiBox($('#rAi'), ()=>({en:r.en, ja:r.ja, ex:r.ex}), a=>{ applyAi(a); renderReg(); }, false);
 document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{ const k=b.dataset.x, v=b.dataset.v; if(k==='t'){ const t=(r.x.t||[]).slice(); const i=t.indexOf(v); i>=0?t.splice(i,1):t.push(v); r.extra.t=t; } else if(k==='tsx'){ const t=(r.x.ts||[]).slice(); const i=t.indexOf(v); i>=0?t.splice(i,1):t.push(v); r.extra.ts=t.length?t:['pres']; } else r.extra[k]=isNaN(+v)?v:+v; renderReg(); });
 document.querySelectorAll('[data-xi]').forEach(b=>b.onchange=()=>{ r.extra[b.dataset.xi]=b.value; renderReg(); });
 document.querySelectorAll('[data-sk]').forEach(s=>s.onchange=()=>{ r.sentence[+s.dataset.sk].kind=s.value; });
 document.querySelectorAll('[data-sj]').forEach(s=>s.oninput=()=>{ r.sentence[+s.dataset.sj].ja=s.value; });
 document.querySelectorAll('[data-pv]').forEach(b=>b.onclick=()=>say(b.dataset.pv));
 const sv=$('#rSave'); if(sv) sv.onclick=saveReg;
 const tr=$('#rTry'); if(tr) tr.onclick=async()=>{ const cls=kind==='sentence'?'sentence':(r.cls||(/\s/.test(r.en.trim())?'phrase':'word')); tr.disabled=true; tr.textContent='AIが考えています…'; try{ const p=await runTry({en:r.en, ja:r.ja, cls, kind:(kind&&kind!=='sentence')?kind:null, x:r.x}); if(p){ loadPlay(p); return; } }catch(e){ toast(String(e&&e.message||e)); } tr.disabled=false; tr.textContent='✨ 使ってみる(AIが文を考えて「つくる」へ)'; };
}
export function extraForm(kind,x){
 const opt=(k,v,l)=>`<button class="chip ${String(x[k])===String(v)?'on':''}" data-x="${k}" data-v="${v}">${l}</button>`;
 if(kind==='verbs') return `<section><h3>どう使う？</h3><div class="rowb">${opt('fr','intr','← 自分だけでする')}${opt('fr','tr','何かへ →')}${opt('fr','both','両方')}</div>
  ${x.fr!=='intr'?`<h3>何に対してする？</h3><div class="rowb wrap">${TAGS.map(([t,l])=>`<button class="chip ${(x.t||[]).includes(t)?'on':''}" data-x="t" data-v="${t}">${l}</button>`).join('')}</div>`:''}
  <h3>英語の形 <span class="note">自動で作りました。違うときだけ直してください</span></h3><div class="forms"><label>過去<input data-xi="past" value="${esc(x.past)}"></label><label>完了<input data-xi="pp" value="${esc(x.pp)}"></label></div>
  <h3>日本語の活用</h3><div class="rowb">${opt('jt','g','書く・話す型')}${opt('jt','i','食べる・見る型')}${opt('jt','s','〜する')}</div></section>`;
 if(kind==='things') return `<section><h3>どんな物？</h3><div class="rowb wrap">${TAGS.filter(t=>!['person','animal'].includes(t[0])).map(([t,l])=>`<button class="chip ${(x.t||[]).includes(t)?'on':''}" data-x="t" data-v="${t}">${l}</button>`).join('')}</div><div class="rowb">${opt('pl',0,'1つ')}${opt('pl',1,'2つ以上')}</div></section>`;
 if(kind==='people') return `<section><div class="rowb">${opt('animal',0,'人')}${opt('animal',1,'動物')}</div><div class="rowb">${opt('pl',0,'1人・1匹')}${opt('pl',1,'2人以上')}</div></section>`;
 if(kind==='states') return `<section><h3>くらべるとき</h3><div class="rowb">${opt('more',0,'-er / -est')}${opt('more',1,'more / most')}</div><h3>日本語の形</h3><div class="rowb">${opt('jt','i','〜い')}${opt('jt','na','〜だ')}${opt('jt','v','〜している')}</div></section>`;
 if(kind==='places') return `<section><h3>「〜へ行く」のとき</h3><div class="forms"><label>英語<input data-xi="to" value="${esc(x.to)}"></label><label>日本語<input data-xi="jat" value="${esc(x.jat)}"></label></div></section>`;
 if(kind==='times') return `<section><h3>いつの話？</h3><div class="rowb wrap">${['past','pastprog','perf','perfprog','pres','prog','fut'].map(t=>`<button class="chip ${x.ts.includes(t)?'on':''}" data-x="tsx" data-v="${t}">${TENSES[t].lab}</button>`).join('')}</div></section>`;
 return '';
}
export function makeItem(kind){
 const r=REG, x=r.x||{}; const id='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 const e=r.e||({people:'🧑',things:'📦',verbs:'✨',states:'💫',manners:'✨',places:'📍',times:'🕒'})[kind];
 const it={kind,id,en:r.en.trim().replace(/^to /i,''),ja:r.ja.trim(),e};
 if(kind==='verbs'){ Object.assign(it,{en:x.en,tail:x.tail||undefined,past:x.past,pp:x.pp,fr:x.fr,t:x.fr==='intr'?undefined:((x.t&&x.t.length)?x.t:['thing']),jt:x.jt,an:'bob'}); if(!/[うくぐすつぬぶむる]$/.test(it.ja)) it.ja+=(x.jt==='s'?'する':''); }
 if(kind==='people'){ Object.assign(it,{p:3,pl:x.pl,animal:x.animal}); }
 if(kind==='things'){ Object.assign(it,{t:x.t||['thing'],pl:x.pl}); }
 if(kind==='states'){ Object.assign(it,{jt:x.jt,vt:x.vt,more:x.more}); it.ja=it.ja.replace(/だ$/,''); }
 if(kind==='places'){ Object.assign(it,{to:x.to,jat:x.jat,jn:x.jn}); }
 if(kind==='times'){ Object.assign(it,{ts:x.ts}); }
 return it;
}
export function previewBox(kind,x){
 if(!REG.ja.trim()) return `<p class="note">日本語も入れると、ゲームで使えるようになります。</p>`;
 if(kind==='leads'){ const it=buildItem('leads',REG.en,REG.ja,REG.e); FRONTS.push(it); let ex=[]; try{ const c=Object.assign(newClause(),{lead:it.id,subj:'p:i',pred:{k:'v',id:'walk'},tense:'past'}); ex.push({en:sentenceText({main:c}),ja:sentenceJa({main:c})}); }catch(e){} FRONTS.pop();
  return `<section><h3>ゲームではこう使われます</h3><div class="pv">${ex.map(s=>`<button class="pvl" data-pv="${esc(s.en)}"><span class="en">${esc(s.en)}</span><small>${esc(s.ja)}</small></button>`).join('')}</div></section>`; }
 const it=makeItem(kind); const tmp=OFFICIAL[kind]; tmp.push(it); buildLex(activeSets());
 const ex=[]; const mk=(o)=>{ const c=Object.assign(newClause(),o); return {en:sentenceText({main:c}),ja:sentenceJa({main:c})}; };
 try{
  if(kind==='verbs'){ const ob=x.fr!=='intr'? (LEX.things.find(t=>(it.t||[]).some(g=>(t.t||[]).includes(g)))||LEX.things[0]) : null; const obr = x.fr!=='intr'? ((it.t||[]).includes('person')?'p:mom':'t:'+ob.id):null;
   ex.push(mk({subj:'p:she',pred:{k:'v',id:it.id},useObj:!!obr,obj:obr,time:'everyday'}), mk({subj:'p:i',pred:{k:'v',id:it.id},useObj:!!obr,obj:obr,tense:'past',time:'yesterday'}), mk({subj:'p:they',pred:{k:'v',id:it.id},useObj:!!obr,obj:obr,tense:'prog',time:'now'})); }
  if(kind==='things') ex.push(mk({subj:'p:i',pred:{k:'v',id:'like'},useObj:true,obj:'t:'+it.id}), mk({type:'exist',thing:'t:'+it.id,place:'home'}));
  if(kind==='people') ex.push(mk({subj:'p:'+it.id,pred:{k:'s',id:'happy'}}), mk({subj:'p:i',pred:{k:'v',id:'help'},useObj:true,obj:'p:'+it.id,tense:'past'}));
  if(kind==='states') ex.push(mk({subj:'p:he',pred:{k:'s',id:it.id},tense:'past'}), mk({subj:'p:she',pred:{k:'s',id:it.id},degree:'more',than:'p:i'}));
  if(kind==='places') ex.push(mk({subj:'p:we',pred:{k:'v',id:'eat'},place:it.id}), mk({subj:'p:ken',pred:{k:'v',id:'go'},place:it.id,tense:'past'}));
  if(kind==='times') ex.push(mk({subj:'p:i',pred:{k:'v',id:'walk'},time:it.id}));
  if(kind==='manners') ex.push(mk({subj:'p:she',pred:{k:'v',id:'run'},manner:it.id}));
 }catch(e){ console.warn(e); }
 tmp.pop(); buildLex(activeSets());
 return `<section><h3>ゲームではこう使われます</h3><div class="pv">${ex.map(s=>`<button class="pvl" data-pv="${esc(s.en)}"><span class="en">${esc(s.en)}</span><small>${esc(s.ja)}</small></button>`).join('')}</div><p class="note">おかしいときは、上の選択を変えてみてください。</p></section>`;
}
/* 登録した言葉・文は、全アプリ共通の勉強ノートにも入れる */
function noteWord(en,ja,kind){ try{ ENV.ctx && ENV.ctx.report('word',{ en:String(en).trim(), ja:String(ja||'').trim(), kind }); }catch(e){} }
export function saveReg(){
 const r=REG; const kind=r.kind||r.auto; const set=DB.sets.find(s=>s.id===$('#rSet').value)||DB.sets[0];
 if(!r.en.trim()){ toast('英語を入れてください'); return; }
 if(kind==='sentence'){
  set.sentences=set.sentences||[]; set.sentences.push({en:r.en.trim(),ja:r.ja.trim()}); let n=0;
  (r.sentence||[]).forEach(c=>{ if(!c.ja||!c.ja.trim()) return; const en = c.kind==='verbs'? c.lemma : c.en; if(c.kind==='verbs'&&c.known) return; if(LEX[c.kind]&&LEX[c.kind].find(x=>x.en.toLowerCase()===en.toLowerCase())) return; const bak={en:r.en,ja:r.ja,x:r.x,e:r.e}; r.en=en; r.ja=c.ja.trim(); r.e=''; r.x=autoExtra(c.kind,r.en,r.ja); set.items.push(makeItem(c.kind)); n++; Object.assign(r,bak); });
  noteWord(r.en,r.ja,'short');
  save(); refreshLex(); toast(`文を保存しました${n?`（言葉を${n}個追加）`:''}`);
 } else {
  if(!r.ja.trim()){ toast('日本語も入れてください'); return; }
  { const itm=kind==='leads'? buildItem('leads',r.en,r.ja,r.e) : makeItem(kind); itm.cls=r.cls||(/\s/.test(r.en.trim())?'phrase':'word'); set.items.push(itm); } save(); noteWord(r.en,r.ja); refreshLex(); toast(`「${r.en.trim()}」を${set.name}に登録しました`);
 }
 Object.assign(REG,{en:'',ja:'',e:'',ex:'',kind:null,auto:null,extra:{},sentence:null,x:null,cls:null});
 if(INBOX.cur){ INBOX.done++; inboxNext(); return; }
 renderReg();
}
// AIの判定結果を、ことば登録の入力に入れる(登録画面のAIボタンと、外から届いたことばの自動判定で使う)
function applyAi(a){ const r=REG; r.kind=a.kind; if(a.kind==='verbs' && a.en){ r.en=(a.en+(a.tail?' '+a.tail:'')).trim(); } if(!r.ja && a.ja) r.ja=a.ja; if(!r.e && a.e) r.e=a.e; r.extra={}; if(a.kind==='verbs'){ if(a.fr) r.extra.fr=a.fr; if(a.past) r.extra.past=a.past; if(a.pp) r.extra.pp=a.pp; if(Array.isArray(a.t)&&a.t.length) r.extra.t=a.t; } if((a.kind==='people'||a.kind==='things')&&a.pl!=null) r.extra.pl=+a.pl; if(a.kind==='people'&&a.animal!=null) r.extra.animal=+a.animal; }
// ===== 外から届いたことば(勉強ノート・町など → core.eigo の箱)=====
// ふつうの「ことば登録」の画面に1つずつ入れて開く。本人が場所・意味を確かめて「登録」を押すと、次のことばが入る。
export const INBOX = { cur: null, q: [], total: 0, done: 0 };
export function inboxLoad(list){ list=(list||[]).filter(x=>x&&x.en&&/[a-z]/i.test(x.en)); if(!list.length) return; INBOX.q=INBOX.q.concat(list); INBOX.total+=list.length; if(!INBOX.cur) inboxNext(); else renderReg(); }
export function inboxNext(){
 const c=INBOX.q.shift(); INBOX.cur=c||null;
 if(!c){ const d=INBOX.done; INBOX.total=0; INBOX.done=0; if(d) toast(`届いたことばを ${d}こ 登録しました。「つくる」で使ってみよう`); go(d?'make':'reg'); return; }
 const en=String(c.en).trim(), ja=String(c.ja||'').trim();
 Object.assign(REG,{en, ja, e:'', ex:c.ex||'', kind:c.kind==='sentence'?'sentence':null, auto:judge(en,ja), extra:{}, sentence:null, x:null});
 go('reg');
 // 使っている人のAIがあれば、文以外は場所・意味・活用をAIで決めて入れる(本人は確かめて登録するだけ)
 const ai=ENV.core&&ENV.core.ai;
 if(REG.kind!=='sentence' && REG.auto!=='sentence' && ai && ai.ready){
  toast('AIで、どこに入る言葉か調べています…');
  ai.ask('You are a careful JSON-only API.', aiPrompt({en, ja, ex:c.ex||''}), 500).then(t=>{ const a=parseAi(t); if(!a || INBOX.cur!==c) return; applyAi(a); renderReg(); }).catch(()=>{});
 }
}
// 途中でやめたとき:残りを返す(箱にもどす)
export function inboxRest(){ const r=(INBOX.cur?[INBOX.cur]:[]).concat(INBOX.q); INBOX.cur=null; INBOX.q=[]; INBOX.total=0; INBOX.done=0; return r; }
function inboxBanner(){
 if(!INBOX.cur) return; const reg=$('#reg'); if(!reg) return;
 reg.insertAdjacentHTML('afterbegin',`<div class="inbx" style="background:#fff3c8;border-radius:14px;padding:10px 12px;margin:0 0 10px;font-size:13px;font-weight:700;line-height:1.5">📥 届いたことば <b>${INBOX.done+1} / ${INBOX.total}</b>${INBOX.q.length?`(このあと ${INBOX.q.length}こ)`:''}<br><span style="font-weight:500">場所と意味を確かめて、下の「この言葉を登録してゲームで使う」を押してね。</span><div class="rowb" style="margin-top:6px"><button class="chip" data-inb="skip">これはとばす</button><button class="chip" data-inb="later">あとでやる</button></div></div>`);
 reg.querySelector('[data-inb="skip"]').onclick=()=>inboxNext();
 reg.querySelector('[data-inb="later"]').onclick=()=>{ const r=inboxRest(); try{ ENV.core&&ENV.core.eigo&&ENV.core.eigo.send(r); }catch(e){} toast(`のこり ${r.length}こは、次に開いたときにまた出ます`); go('make'); };
}



export function artCheckHtml(){ if(typeof artCheck!=='function') return ''; const r=artCheck(); const lab={verbs:'動詞',things:'物',people:'人・動物',states:'ようす',places:'場所',times:'時',manners:'やり方',anim:'動き（動詞）'};
 const rows=Object.keys(lab).map(k=>{ const L=r[k]||[]; return `<details><summary>${lab[k]}：まだ汎用 ${L.length}件</summary><div style="font-size:12px;line-height:1.6">${L.length?L.map(esc).join('、'):'なし 🎉'}</div></details>`; }).join('');
 return `<div style="font-size:12px;color:#6b7190">絵文字やアニメがまだ汎用のままの言葉です。あとで割り当てるときの確認用。</div>${rows}`; }

export let SLV_DESC;

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_common(){
STORE_KEY = 'eigonou_v1';
DEF_SETTINGS = {level:2,casual:false,canvasJa:true,preview:true,lang:'both',kModal:true,kNeg:true,kQ:true,tabsFirst:false,speak:'chunk',rate:0.9,beat:'mid',slv:'3',adv:false};
DB = {settings:Object.assign({},DEF_SETTINGS), sets:[{id:'my1',name:'マイセット',on:true,items:[],sentences:[],published:false}], community:{}, ratings:{}, points:0, log:[]};
try{ let d=ENV.store.get('db'); if(d==null){ const raw=localStorage.getItem(STORE_KEY); if(raw){ d=JSON.parse(raw); ENV.store.set('db', d); } } if(d){ DB=Object.assign(DB,d); DB.settings=Object.assign({},DEF_SETTINGS,d.settings||{}); if(!DB.settings._v3){ DB.settings.preview=true; DB.settings._v3=1; } } }catch(e){}
COMMUNITY = [
 {id:'c_cafe',name:'カフェで使う英語',by:'mika_t',desc:'注文・カフェの時間に使うことば',score:{easy:41,useful:37,again:29,wrong:1},uses:212,items:[
  {kind:'things',id:'c_latte',en:'a latte',ja:'ラテ',e:'☕',t:['drink']},
  {kind:'things',id:'c_muffin',en:'a muffin',ja:'マフィン',e:'🧁',t:['food']},
  {kind:'things',id:'c_menu',en:'the menu',ja:'メニュー',e:'📋',t:['read','thing']},
  {kind:'verbs',id:'c_order',en:'order',ja:'注文する',jt:'s',fr:'both',t:['food','drink'],e:'🛎️',an:'bob'},
  {kind:'verbs',id:'c_pay',en:'pay',past:'paid',pp:'paid',ja:'払う',jt:'g',fr:'intr',e:'💳',an:'bob'},
  {kind:'places',id:'c_counter',en:'at the counter',to:'to the counter',ja:'カウンターで',jat:'カウンターへ',jn:'カウンター',e:'🧾',bg:'cafe'},
  {kind:'times',id:'c_after',en:'after school',ja:'放課後',e:'🎒',ts:['pres','past','fut','pastprog'],sky:'evening'},
 ]},
 {id:'c_club',name:'部活・スポーツ',by:'coach_k',desc:'練習や試合の話ができる',score:{easy:28,useful:33,again:25,wrong:0},uses:158,items:[
  {kind:'verbs',id:'c_practice',en:'practice',ja:'練習する',jt:'s',fr:'both',t:['sport','instr'],e:'🏋️',an:'jump'},
  {kind:'verbs',id:'c_win',en:'win',past:'won',pp:'won',dbl:1,ja:'勝つ',jt:'g',fr:'both',t:['game2'],e:'🏆',an:'jump'},
  {kind:'things',id:'c_game',en:'the game',ja:'試合',e:'🥅',t:['game2','watch']},
  {kind:'people',id:'c_coach',en:'the coach',ja:'コーチ',e:'🧢',p:3,pl:0},
  {kind:'people',id:'c_team',en:'our team',ja:'チーム',e:'🫂',p:3,pl:0},
  {kind:'places',id:'c_field',en:'on the field',to:'to the field',ja:'グラウンドで',jat:'グラウンドへ',jn:'グラウンド',e:'🏟️',bg:'park'},
 ]},
];
buildLex(activeSets());
SET = ()=>DB.settings;
VOICE = null;
if('speechSynthesis' in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
TTS_OK = null;
TTS_WARNED = false;
onDoc('pointerdown',function unlockTTS(){ try{ if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(' '); u.volume=0; window.speechSynthesis.speak(u); pickVoice(); } }catch(e){} document.removeEventListener('pointerdown',unlockTTS); },{once:true});
_tt = null;
REG = {en:'',ja:'',e:'',ex:'',kind:null,auto:null,extra:{},sentence:null};
KINDS = [['people','誰？（人・動物）','noun'],['things','何？（物）','noun'],['verbs','どうする？','verb'],['states','どんな感じ？','adj'],['manners','どんなふうに？','adv'],['places','どこ？','adv'],['times','いつ？','adv'],['sentence','文ごと','conj']];
TAGS = [['food','食べ物'],['drink','飲み物'],['read','読む物'],['write','書く物'],['watch','見る物'],['sport','スポーツ'],['instr','楽器'],['game','ゲーム'],['music','音楽'],['lang','教科・言語'],['ball','ボール'],['ride','乗り物'],['door','開け閉めする物'],['clean','そうじする所'],['wash','洗う物'],['thing','持ち物・道具'],['person','人'],['animal','動物']];
SLV_DESC = {1:'主語＋動詞だけ（He runs. / She is happy.）。いつも・今の話。',2:'＋目的語、後ろに1つ（場所・時）、過去・これから。',3:'＋「ない」、はい・いいえの疑問文、can・will、often・very。',4:'＋疑問詞、助動詞ぜんぶ、進行形、比較、前置き、誰と・どんなふうに。',5:'＋完了形、who/that の説明、where・when、when・if・because の文、名詞の前の「どんな？」。',6:'すべて（受け身・使役・〜するために・句動詞ダイヤルなど）。'};
}

/* ほかのファイルが中身を差しかえるとき用 */
export function set_renderSettings(v) { return renderSettings = v; }
