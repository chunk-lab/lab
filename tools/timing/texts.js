const vm=require('vm'),fs=require('fs');
const ctx={console,navigator:{},window:{},document:{getElementById:()=>({})},localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{},location:{}};ctx.self=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('/home/claude/lab/stream/data.js','utf8')+';this.PASSAGES=PASSAGES;',ctx);
vm.runInContext(fs.readFileSync('/home/claude/lab/rhythm/common.js','utf8')+';this.LIST=LIST;this.wordTimes=wordTimes;this.words=words;this.isContent=isContent;',ctx);
fs.writeFileSync('texts.json',JSON.stringify(ctx.LIST.map(p=>({id:p.id,chunks:p.chunks.map(c=>c.en)}))));
console.log(ctx.LIST.map(p=>p.id+':'+p.chunks.length).join(' '));
