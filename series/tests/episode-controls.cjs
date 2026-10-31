const {JSDOM,VirtualConsole,requestInterceptor}=require('jsdom');
const fs=require('fs');const esbuild=require('esbuild');
const root=require('path').resolve(__dirname,'..');const assert=require('node:assert/strict');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let errors=[],children=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.type!=='css-parsing')errors.push(e.message)});
function resources(){return{interceptors:[requestInterceptor(request=>{const u=new URL(request.url),f=root+'/dist/town'+u.pathname;return new Response(fs.existsSync(f)&&fs.statSync(f).isFile()?fs.readFileSync(f):'',{headers:{'Content-Type':f.endsWith('.css')?'text/css':'application/javascript'}})})]}}
function stubs(w){w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.ResizeObserver=class{observe(){}disconnect(){}};w.HTMLElement.prototype.scrollIntoView=function(){};w.Element.prototype.animate=()=>({cancel(){},finished:Promise.resolve()});w.HTMLCanvasElement.prototype.getContext=()=>({measureText:t=>({width:String(t).length*8})});w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};w.speechSynthesis={getVoices:()=>[],cancel(){},speak(){}};w.fetch=async url=>{const f=root+'/dist/town'+new URL(url,w.location.href).pathname;return{ok:fs.existsSync(f),text:async()=>fs.readFileSync(f,'utf8'),json:async()=>JSON.parse(fs.readFileSync(f,'utf8'))}};}
(async()=>{
const bundle=await esbuild.build({stdin:{contents:`import {createCore} from './core/index.js';import {GAMES} from './games/index.js';import {createEpisodes} from './apps/town/episodes/view.js';window.__APP__={base:'https://example.test/',backButton:true,grants:['sub:all']};const core=createCore(window.__APP__);core.openGame=(g,o)=>core.host.open(GAMES[g],o);const episodes=createEpisodes(core,{games:GAMES,depart:async mode=>{window.departed=mode}});window.qa={core,episodes,games:GAMES};`,resolveDir:root,loader:'js'},bundle:true,format:'iife',write:false,loader:{'.html':'text','.css':'empty'}});
const dom=new JSDOM('<!doctype html><body>',{url:'https://example.test/',runScripts:'dangerously',resources:resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse:stubs});const w=dom.window;
try{
 w.localStorage.setItem('cs:town-episodes:first',JSON.stringify({version:1,index:18,mode:'3d',passed:false,completed:false}));
 w.eval(bundle.outputFiles.find(f=>f.path.endsWith('.js'))?.text||bundle.outputFiles[0].text);
 const core=w.qa.core;
 w.qa.episodes.open();
 assert.equal(w.document.querySelector('.ep-webgl'),null);
 assert.equal([...w.document.querySelectorAll('button')].some(b=>b.textContent==='2D / 3D'),false);
 assert.equal(w.document.querySelector('.ep-aux').textContent,'want to');
 const click=(label,parent=w.document)=>{const b=[...parent.querySelectorAll('button')].find(b=>b.textContent.trim()===label);assert.ok(b,label);b.click()};
 click('はじめる');await sleep(30);const frame=w.document.querySelector('iframe');assert.ok(frame);
 const frameDOM=new JSDOM(frame.srcdoc,{url:'about:blank',runScripts:'dangerously',resources:resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(cw){stubs(cw);Object.defineProperty(cw,'parent',{value:{postMessage(data){w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,origin:'null',data}))}}});Object.defineProperty(cw,'localStorage',{get(){throw new cw.DOMException('blocked','SecurityError')}})}});children.push(frameDOM);

 await sleep(400);const cw=frameDOM.window,panel=cw.document.querySelector('[aria-label="そらの案内"]');assert.ok(panel);
 const next=panel.querySelector('button');assert.equal(next.hidden,true);
 cw.document.querySelector('#sldone').click();await sleep(0);
 assert.match(cw.document.querySelector('#chunks').textContent,/I.*want to.*play/,'native completion is never blocked');
 cw.document.querySelector('#chunks [data-cat="subj"]').click();await sleep(0);
 cw.document.querySelector('#slot .slp[data-r="S"]').click();await sleep(0);
 assert.match(panel.textContent,/she/);
 const she=[...cw.document.querySelectorAll('#slot .slbar .slm')].find(e=>e.querySelector('b')?.textContent==='she');assert.ok(she);she.click();await sleep(0);
 assert.match(panel.textContent,/できたね/);assert.equal(next.hidden,false);
 assert.match(cw.document.querySelector('#chunks').textContent,/She.*wants to.*play/);
 next.click();await sleep(10);assert.equal(core.host.current,null);
 assert.equal(JSON.parse(w.localStorage.getItem('cs:town-episodes:first')).index,19);
 w.qa.episodes.stop();
 await core.host.open(w.qa.games.stream,{fontSize:1.4,wordset:{lv:1,k:0}});await sleep(100);
 assert.equal(w.document.querySelector('.ct-stream').style.getPropertyValue('--fs'),'1.4');core.host.close();
 const css=fs.readFileSync(root+'/apps/town/episodes/view.css','utf8');assert.match(css,/ep-sora.*scaleX\(-1\)/);assert.match(css,/body.ep-on>\.cs-back\{display:none!important/);assert.match(css,/#7a4ad9/);
 if(errors.length)throw Error(errors.join('\n'));console.log('PASS: changed controls only — 2D dialogue, auxiliary color, native guided subject choice, native completion and subject editing, story return, stream size large, mirrored boy, hidden town back button');
}catch(e){console.error(e.stack);process.exitCode=1}finally{children.forEach(c=>c.window.close());w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
