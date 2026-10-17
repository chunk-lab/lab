import { ENV } from './env.js';
import { DB, refreshLex, renderSets, save, toast } from './common.js';
import { FRONTS, LEX } from './engine.js';
import { I18N, tx } from './i18n.js';
import { esc } from './play.js';
// ================= パック（ことばの共有形式） =================
// 1つのパック = 英語の中身（どの言語でも同じ）＋ 言語ごとの意味（あとから誰でも足せる）
// {
//   format:'eigonou-pack', v:1, id, name, by, license, created,
//   items:[ {id, kind, en, e, ...英語側の文法情報} ],      ← 英語だけ
//   lang:{ ja:{ name, desc, items:{ <id>:{ja, jat, ...} } } } ← 言語レイヤー
// }
// kind: people / things / verbs / states / places / times / manners / leads（文の頭のまとまり）
export let PACK_FMT, PACK_V;
// 言語ごとに変わる項目（ここにあるものは lang レイヤーへ、それ以外は英語側へ）
export let LANG_FIELDS;
export let PACK_KINDS;

export function splitItem(it, lang){
 const en={}, lo={};
 Object.keys(it).forEach(k=>{ if(k==='custom') return; (LANG_FIELDS.includes(k)? lo : en)[k]=it[k]; });
 return {en, lo};
}
export function packFromItems(meta, items, lang){
 lang=lang||'ja';
 const p={format:PACK_FMT, v:PACK_V, id:meta.id||('pk'+Date.now().toString(36)), name:meta.name||'', by:meta.by||'', license:meta.license||'CC BY 4.0', created:new Date().toISOString().slice(0,10), items:[], lang:{}};
 const L={name:meta.name||'', desc:meta.desc||'', items:{}};
 items.forEach(it=>{ const {en,lo}=splitItem(it,lang); p.items.push(en); if(Object.keys(lo).length) L.items[it.id]=lo; });
 p.lang[lang]=L;
 if(meta.sentences && meta.sentences.length) p.sentences=meta.sentences.map(s=>({en:s.en, lang:{[lang]:s.ja}}));
 return p;
}
export function packFromSet(set){ return packFromItems({id:set.packId||set.id, name:set.name, by:set.by||'', desc:set.desc||'', sentences:set.sentences}, set.items||[], 'ja'); }
// パック → ゲームで使う形（英語側＋指定言語。なければ日本語、なければ英語をそのまま意味に）
export function itemsFromPack(p, lang){
 lang=lang||'ja'; const L=(p.lang&&(p.lang[lang]||p.lang.ja))||{items:{}};
 return (p.items||[]).filter(it=>it && it.en && PACK_KINDS.includes(it.kind)).map(it=>{ const lo=(L.items||{})[it.id]||{}; const o=Object.assign({},it,lo); if(!o.ja) o.ja=o.en; o.id=String(o.id||('i'+Math.random().toString(36).slice(2,8))).replace(/[^\w-]/g,'_'); return o; });
}
export function checkPack(p){
 if(!p || p.format!==PACK_FMT || !Array.isArray(p.items)) return false;
 return true;
}
export function setFromPack(p){
 const lang=I18N.lang||'ja'; const L=(p.lang&&(p.lang[lang]||p.lang.ja))||{};
 const pre='k'+Date.now().toString(36).slice(-4)+'_';
 const items=itemsFromPack(p,lang).map(it=>Object.assign(it,{id:pre+it.id}));
 return {id:'my'+Date.now(), packId:p.id, name:(L.name||p.name||'パック').slice(0,40), by:p.by||'', desc:L.desc||'', on:true, items, sentences:(p.sentences||[]).map(s=>({en:s.en, ja:(s.lang&&(s.lang[lang]||s.lang.ja))||''}))};
}
// 公式の言葉をそのままパックにする（翻訳する人が lang レイヤーだけ作れるように）
export function basePack(){
 const items=[]; ['people','things','verbs','states','places','times','manners'].forEach(k=>(LEX[k]||[]).forEach(it=>{ if(it.custom||it.hidden||it.loc) return; items.push(Object.assign({kind:k},it)); }));
 FRONTS.forEach(f=>{ if(!f.custom) items.push(Object.assign({kind:'leads'},f)); });
 return packFromItems({id:'base', name:'きほんセット', by:'official'}, items, 'ja');
}
// 書き出し：ダウンロードできればファイル、できなければコピー
export async function exportPack(p, fname){
 const text=JSON.stringify(p,null,1);
 try{ if(window.claude && claude.use){ const d=await claude.use('downloads'); if(d){ await d.save({filename:fname||((p.name||'pack')+'.json'), data:text}); return; } } }catch(e){ if(e && e.code==='declined') return; }
 try{ await navigator.clipboard.writeText(text); toast(tx('pack.copied')); }catch(e){ showPackText(text); }
}
export function showPackText(text){
 const w=document.createElement('div'); w.className='modalw'; w.innerHTML=`<div class="modal"><textarea readonly style="width:100%;height:50vh;font-size:11px">${esc(text)}</textarea><div class="rowb"><button class="chip" data-x="close">閉じる</button></div></div>`;
 ENV.root.appendChild(w); w.querySelector('[data-x="close"]').onclick=()=>w.remove(); w.onclick=e=>{ if(e.target===w) w.remove(); };
}
// 読みこみ：ファイルか貼りつけ
export function importPackUI(){
 const w=document.createElement('div'); w.className='modalw';
 w.innerHTML=`<div class="modal"><h3>${tx('pack.import')}</h3><label class="chip upl">ファイルを選ぶ<input type="file" accept=".json,application/json" hidden></label><textarea placeholder="${esc(tx('pack.paste'))}" style="width:100%;height:30vh;font-size:12px;margin-top:8px"></textarea><div class="rowb"><button class="chip" data-x="close">やめる</button><button class="chip on" data-x="go">読みこむ</button></div></div>`;
 ENV.root.appendChild(w);
 const ta=w.querySelector('textarea');
 w.querySelector('input[type=file]').onchange=e=>{ const f=e.target.files[0]; if(!f) return; const fr=new FileReader(); fr.onload=()=>{ ta.value=fr.result; }; fr.readAsText(f); };
 w.querySelector('[data-x="close"]').onclick=()=>w.remove();
 w.querySelector('[data-x="go"]').onclick=()=>{ let p=null; try{ p=JSON.parse(ta.value); }catch(e){} if(!checkPack(p)){ toast(tx('pack.bad')); return; } const s=setFromPack(p); DB.sets.push(s); save(); refreshLex(); w.remove(); if(typeof renderSets==='function') renderSets(); toast(tx('pack.imported',{name:s.name,n:s.items.length})); };
}

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_pack(){
PACK_FMT = 'eigonou-pack';
PACK_V = 1;
LANG_FIELDS = ['ja','jat','jn','jt','vt','part','jaAdj','jaBy','cl','clj','mean','jaNote','jn2'];
PACK_KINDS = ['people','things','verbs','states','places','times','manners','leads'];
}
