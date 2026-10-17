const fs=require('fs'),vm=require('vm'),path=require('path');
module.exports=function(dir){
 const order=fs.readFileSync(path.join(dir,'order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(Boolean);
 const noop=()=>{}; let el; el=new Proxy(function(){},{get:(t,k)=>k==='forEach'?noop:k===Symbol.iterator?function*(){}:k==='length'?0:k===Symbol.toPrimitive?(()=>''):(k==='value'||k==='textContent'||k==='innerHTML')?'':el,set:()=>true,apply:()=>el});
 const ctx={console:{log:noop,warn:noop,error:noop},window:{},document:{getElementById:()=>el,querySelector:()=>el,querySelectorAll:()=>[],createElement:()=>el,addEventListener:noop,body:el,documentElement:el,head:el},localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{language:'ja',userAgent:''},location:{search:'',hash:''},setTimeout:noop,requestAnimationFrame:noop,cancelAnimationFrame:noop,fetch:()=>new Promise(()=>{}),Audio:function(){return el},Image:function(){return el},performance:{now:()=>0},getComputedStyle:()=>el,innerWidth:400,innerHeight:800,clearTimeout:noop,setInterval:noop,addEventListener:noop,matchMedia:()=>({matches:false,addEventListener:noop})};
 ctx.window=ctx; vm.createContext(ctx);
 const src=order.map(f=>'/*F:'+f+'*/\n'+fs.readFileSync(path.join(dir,f),'utf8')).join('\n;\n');
 try{ vm.runInContext(src,ctx,{filename:'A.js'}); }catch(e){ process.stderr.write('load err: '+e.message+'\n'+(e.stack||'').split('\n').slice(0,3).join('\n')+'\n'); }
 ctx.__ev=(s)=>vm.runInContext(s,ctx); return ctx;
};
