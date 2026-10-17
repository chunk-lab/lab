// eigo_nou の辞書を Node 上で読み込み、マージ済み LEX を返す
const fs=require('fs'),vm=require('vm'),path=require('path');
module.exports=function(dir){
 const files=['i18n.js','vocab.js','vocab_a1.js','vocab_a2.js','cefr_map.js','engine.js','pv_user.js','idioms.js'];
 const noop=()=>{}; const el=new Proxy(function(){},{get:(t,k)=>k==='style'||k==='classList'||k==='dataset'?new Proxy({},{get:()=>noop}):noop,apply:()=>el});
 const ctx={console,window:{},document:{getElementById:()=>el,querySelector:()=>el,querySelectorAll:()=>[],createElement:()=>el,addEventListener:noop,body:el,documentElement:el},localStorage:{getItem:()=>null,setItem:noop},navigator:{language:'ja'},location:{search:''},setTimeout:noop,addEventListener:noop};
 ctx.window=ctx; vm.createContext(ctx);
 let src=files.map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n;\n');
 src+='\n;this.__L=buildLex([]);this.__X={FRONTS,MODALS,CONJS,CEFR_LV,LINKV:typeof LINKV!=="undefined"?LINKV:null,FREQADV:typeof FREQADV!=="undefined"?FREQADV:null,MPAT:typeof MPAT!=="undefined"?MPAT:null,IDV:typeof IDV!=="undefined"?IDV:null};';
 vm.runInContext(src,ctx,{filename:'A.js'});
 return {L:ctx.__L,X:ctx.__X};
};
if(require.main===module){ const {L,X}=module.exports(process.argv[2]); for(const k in L) if(Array.isArray(L[k])) console.log(k,L[k].length); console.log(Object.keys(X).map(k=>k+':'+(X[k]&&(X[k].length||Object.keys(X[k]).length))).join(' ')); }
