import { ENV } from './env.js';
import { DB, REG, autoExtra, makeItem, refreshLex, save, toast } from './common.js';
import { I18N, tx } from './i18n.js';
import { PACK_KINDS } from './pack.js';
import { APP, SAMPLE, esc, go, mutate, pick, renderScene } from './play.js';
// ================= ことばを足す（ゲーム中・登録画面・AI判定） =================
// 入れた場所 → 種類（kind）が自動で決まる。
// 場所：前（文の頭）／人・もの／する／どんな／後ろ（いつ・どこ・どんなふうに）
export let SLOT_OF_KIND;
export let SKEL;
export let KIND_LABEL;

// ゲーム中の選択肢のまとまり（key）→ 足すことばの種類と、足したあとの選び方
export function addSpecFor(key){
 const k=String(key||'');
 if(k==='swho') return {kind:'people', pick:id=>pick('subj','p:'+id)};
 if(k==='swhat') return {kind:'things', pick:id=>pick('subj','t:'+id)};
 if(k==='Ldo') return {kind:'verbs', fr:'intr', pick:id=>pick('self',id)};
 if(k==='R') return {kind:'verbs', fr:'tr', pick:id=>pick('other',id)};
 if(k==='Lbeloc') return null;
 if(/^Lbe/.test(k)) return {kind:'states', pick:id=>pick('state',id)};
 if(k==='io') return {kind:'people', pick:id=>pick('iobj','p:'+id)};
 if(k==='oP') return {kind:'people', pick:id=>pick('obj','p:'+id)};
 if(k==='oT') return {kind:'things', pick:id=>pick('obj','t:'+id)};
 if(k==='thing') return {kind:'things', pick:id=>pick('thing','t:'+id)};
 const m=k.match(/^(?:x|pv)(place|time|manner|with|prelink|prestance)$/);
 if(m){ const o=m[1];
  if(o==='place') return {kind:'places', pick:id=>pick('place',id)};
  if(o==='time') return {kind:'times', pick:id=>pick('time',id)};
  if(o==='manner') return {kind:'manners', pick:id=>pick('manner',id)};
  if(o==='with') return {kind:'people', pick:id=>pick('with','p:'+id)};
  return {kind:'leads', pick:id=>{ const c=APP.S.main; APP.preCat=null; mutate(()=>{ c.lead=id; APP.open=null; },'lead'); }};
 }
 return null;
}
export function mySet(){ let s=DB.sets.find(x=>x.on && !x.packId); if(!s){ s=DB.sets[0]; if(!s){ s={id:'my1',name:'マイセット',on:true,items:[],sentences:[]}; DB.sets.push(s); } s.on=true; } return s; }
export function skelHtml(slot, fixed){ return `<div class="skel">${SKEL.map(([k,l])=>`<button data-sk="${k}" class="${slot===k?(fixed?'fixed on':'on'):''}" ${fixed&&slot!==k?'disabled':''}>${l}</button>`).join('')}</div>`; }

// ---- ゲーム中の「➕ ことばを足す」 ----
export function openAddWord(key){
 const sp=addSpecFor(key); if(!sp){ go('reg'); return; }
 const st={en:'',ja:'',e:'',kind:sp.kind};
 const w=document.createElement('div'); w.className='modalw';
 const draw=()=>{
  w.innerHTML=`<div class="modal"><h3>➕ ${tx('add.title')}</h3>
  <div class="note">${tx('add.where')}：<b>${esc(KIND_LABEL[st.kind])}</b></div>${skelHtml(SLOT_OF_KIND[st.kind],true)}
  <label>${tx('add.en')}<input data-f="en" value="${esc(st.en)}" autocomplete="off" placeholder="${esc(({leads:'By the way',people:'my cousin',things:'a smoothie',verbs:sp.fr==='tr'?'take care of':'hang out',states:'awesome',times:'every weekend',places:'at the station',manners:'on purpose'})[st.kind]||'')}"></label>
  <label>${tx('add.ja')}<input data-f="ja" value="${esc(st.ja)}" autocomplete="off"></label>
  <label>${tx('add.e')}<input data-f="e" value="${esc(st.e)}" maxlength="4" style="width:5em"></label>
  <div class="aibox" data-ai></div>
  <div class="rowb"><button class="chip" data-x="close">${tx('add.cancel')}</button><button class="chip on" data-x="save">${tx('add.save')}</button></div></div>`;
  w.querySelectorAll('[data-f]').forEach(i=>i.oninput=()=>{ st[i.dataset.f]=i.value; });
  w.querySelector('[data-x="close"]').onclick=()=>w.remove();
  w.querySelector('[data-x="save"]').onclick=()=>{
   if(!st.en.trim()){ toast(tx('add.needEn')); return; } if(!st.ja.trim()){ toast(tx('add.needJa')); return; }
   const it=buildItem(st.kind, st.en, st.ja, st.e, {fr:sp.fr, ai:st.ai}); const set=mySet(); set.items.push(it); save(); refreshLex();
   w.remove(); toast(tx('add.saved',{en:it.en+(it.tail?' '+it.tail:'')})); try{ sp.pick(it.id); }catch(e){ renderScene(); }
  };
  aiBox(w.querySelector('[data-ai]'), ()=>({en:st.en, ja:st.ja, kind:st.kind}), r=>{ if(r.ja && !st.ja) st.ja=r.ja; if(r.e && !st.e) st.e=r.e; if(r.en) st.en=r.en+(r.tail?' '+r.tail:''); st.ai=r; draw(); }, true);
  const f=w.querySelector('[data-f="en"]'); if(f && !st.en) setTimeout(()=>f.focus(),50);
 };
 ENV.root.appendChild(w); draw(); w.onclick=e=>{ if(e.target===w) w.remove(); };
}
// 種類と英語・日本語から、ゲームで使える形を作る（足りない所は自動で推測）
export function buildItem(kind, en, ja, e, o){
 o=o||{}; const ai=o.ai||{};
 const bak={en:REG.en,ja:REG.ja,e:REG.e,x:REG.x};
 REG.en=en; REG.ja=ja; REG.e=e||ai.e||'';
 let it;
 if(kind==='leads'){ it={kind:'leads',id:'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),en:en.trim().replace(/,$/,'').replace(/^./,c=>c.toUpperCase()),ja:ja.trim().replace(/、$/,''),e:REG.e||'💬',g:'link'}; }
 else {
  const x=autoExtra(kind,en,ja);
  if(kind==='verbs'){ if(o.fr) x.fr=o.fr; if(ai.fr) x.fr=ai.fr; if(ai.past) x.past=ai.past; if(ai.pp) x.pp=ai.pp; if(ai.tail!=null && ai.en){ x.en=ai.en; x.tail=ai.tail; } if(Array.isArray(ai.t)&&ai.t.length) x.t=ai.t; if(!x.t||!x.t.length) x.t=x.fr==='intr'?[]:['any']; }
  if(kind==='people'||kind==='things'){ if(ai.pl!=null) x.pl=+ai.pl; if(ai.animal!=null) x.animal=+ai.animal; if(kind==='things'&&Array.isArray(ai.t)&&ai.t.length) x.t=ai.t; }
  REG.x=x; it=makeItem(kind);
  if(kind==='verbs' && x.t && x.t.length && x.fr!=='intr') it.t=x.t;
 }
 Object.assign(REG,bak);
 return it;
}

// ---- AI 判定（Claude は1ボタン、ChatGPT・Gemini はコピー＆貼りつけ） ----
export function aiPrompt(q){
 return `You classify an English word or chunk for an English-word-order learning game for ${I18N.names[I18N.lang]||'Japanese'} speakers.
Input English: "${q.en}"${q.ja?`\nMeaning (${I18N.lang}): "${q.ja}"`:''}${q.ex?`\nExample sentence: "${q.ex}"`:''}${q.kind?`\nThe user put it in this slot: ${q.kind}`:''}
Decide where the chunk goes in a sentence (use the example sentence position if given):
- "leads": at the very front, before the subject (e.g. "By the way,", "First of all,")
- "people" / "things": a noun phrase (person/animal vs. object)
- "verbs": the verb part (phrasal verbs and idioms like "take care of", "hang out")
- "states": an adjective used after be ("happy", "worn out")
- "times" / "places" / "manners": after the verb phrase (when / where / how)
Reply with ONLY one JSON object, no other text:
{"kind":"...","en":"base form (verbs: first word only, no 'to')","tail":"(verbs only) the rest after the first word, or empty","ja":"short meaning in ${I18N.lang==='ja'?'Japanese':I18N.lang}","past":"(verbs) past form","pp":"(verbs) past participle","fr":"(verbs) intr | tr | both","t":["(verbs/things) up to 3 of: food, drink, read, write, watch, sport, instr, game, music, lang, ride, thing, person, animal, any"],"pl":0,"animal":0,"e":"one emoji"}`;
}
export function parseAi(text){
 if(!text) return null; const m=String(text).match(/\{[\s\S]*\}/); if(!m) return null;
 try{ const r=JSON.parse(m[0]); if(!r || !r.kind || !PACK_KINDS.includes(r.kind)) return null; return r; }catch(e){ return null; }
}
// box: 入れる場所 / getQ: 今の入力 / onResult: 結果 / fixedKind: 場所が決まっているか
export function aiBox(box, getQ, onResult, fixedKind){
 if(!box) return;
 box.innerHTML=`<div class="rowb" style="justify-content:flex-start;margin-top:0">${SAMPLE?`<button class="chip" data-ai="claude">${tx('ai.claude')}</button>`:''}<button class="chip" data-ai="copy">${tx('ai.other')}</button></div><div data-ai="pastew" hidden><textarea placeholder="${esc(tx('ai.paste'))}"></textarea><div class="rowb"><button class="chip on" data-ai="apply">${tx('ai.apply')}</button></div></div><div class="note" data-ai="msg"></div>`;
 const msg=t=>{ box.querySelector('[data-ai="msg"]').textContent=t||''; };
 const done=r=>{ if(!r){ msg(tx('ai.bad')); return; } if(fixedKind) r.kind=getQ().kind||r.kind; onResult(r); };
 const cb=box.querySelector('[data-ai="claude"]');
 if(cb) cb.onclick=async()=>{ const q=getQ(); if(!q.en||!q.en.trim()){ toast(tx('add.needEn')); return; } msg(tx('ai.busy')); try{ const r=await SAMPLE(aiPrompt(q),{modelTier:'quick'}); done(parseAi(r&&r.text)); }catch(e){ msg(tx('ai.fail')); } };
 box.querySelector('[data-ai="copy"]').onclick=async()=>{ const q=getQ(); if(!q.en||!q.en.trim()){ toast(tx('add.needEn')); return; } const t=aiPrompt(q); try{ await navigator.clipboard.writeText(t); }catch(e){} box.querySelector('[data-ai="pastew"]').hidden=false; msg(tx('ai.copied')); };
 box.querySelector('[data-ai="apply"]').onclick=()=>done(parseAi(box.querySelector('textarea').value));
}

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_addword(){
SLOT_OF_KIND = {leads:'front',people:'noun',things:'noun',verbs:'verb',states:'adj',times:'back',places:'back',manners:'back'};
SKEL = [['front','前','First of all,'],['noun','人・もの','Ken / a cake'],['verb','する','take care of'],['adj','どんな','happy'],['back','後ろ','in the end']];
KIND_LABEL = {leads:'文の頭に置く',people:'人・動物',things:'もの',verbs:'する（動詞）',states:'どんな（ようす）',times:'いつ',places:'どこ',manners:'どんなふうに'};
}
