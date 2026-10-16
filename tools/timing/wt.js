const vm=require('vm'),fs=require('fs');
const ctx={console,navigator:{},window:{},document:{getElementById:()=>({})},localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{},location:{}};ctx.self=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('/home/claude/lab/stream/data.js','utf8')+';',ctx);
vm.runInContext(fs.readFileSync('/home/claude/lab/rhythm/common.js','utf8')+';this.wordTimes=wordTimes;',ctx);
let bad=0,n=0;
for(const f of fs.readdirSync('out').filter(f=>f.endsWith('.json')&&!f.endsWith('.wt.json'))){
  const j=JSON.parse(fs.readFileSync('out/'+f));const tot=j.dur.reduce((a,b)=>a+b,0);
  const r=ctx.wordTimes({dur:j.dur,ids:j.ids,spaceId:j.spaceId,audio:{length:tot*600},sr:j.sr},j.text);
  n++;if(!r.ok){bad++;console.log('NG',f,r.why)}
  fs.writeFileSync('out/'+f.replace('.json','.wt.json'),JSON.stringify(r));
}
console.log('chunks',n,'時刻が取れなかった',bad);
