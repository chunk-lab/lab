const vm=require('vm'),fs=require('fs');
const ctx={console,navigator:{},window:{},document:{getElementById:()=>({})},localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{},location:{}};ctx.self=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync('/home/claude/lab/stream/data.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('/home/claude/lab/rhythm/common.js','utf8')+';this.measureShift=measureShift;this.autoShift=autoShift;this.wtAt=wtAt;this.S=S;',ctx);
const T=JSON.parse(fs.readFileSync('texts.json'));
for(const voice of ['af_heart','am_michael','ALL']){
  const clips=[];
  for(const p of T)p.chunks.forEach((text,i)=>{for(const vo of ['af_heart','am_michael']){ if(voice!=='ALL'&&vo!==voice)continue;
    const n=`${vo}_${p.id}_${i}`,w=JSON.parse(fs.readFileSync(`out/${n}.wt.json`));if(!w.ok)continue;
    const b=fs.readFileSync(`out/${n}.f32`),a=new Float32Array(b.buffer,b.byteOffset,b.length/4),cut=JSON.parse(fs.readFileSync(`out/${n}.cut.json`)).cut;
    clips.push({text,v:{a,sr:24000,wt:w.t.map(x=>({t:Math.max(0,x.t-cut),e:Math.max(0,x.e-cut)}))}});}});
  const m=ctx.measureShift(clips);console.log(voice,'n',m.n,'中央値 %sms 25%〜75%% %s〜%s ms → 補正 %sms'.replace('%%','%').replace('%s',(m.med*1000).toFixed(0)).replace('%s',(m.q1*1000).toFixed(0)).replace('%s',(m.q3*1000).toFixed(0)).replace('%s',(m.shift*1000).toFixed(0)));
}
