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
 w.localStorage.setItem('cs:eigonou:db',JSON.stringify({settings:{level:4},sets:[{id:'precious',name:'既存のことば',on:true,items:[{kind:'things',id:'keepsake',en:'a keepsake',ja:'記念品',e:'🎁'}]}],memo:[{en:'Never erase me.'}]}));
 w.localStorage.setItem('cs:chunkchunk:story',JSON.stringify({cleared:{7:true},unlocked:{free:true}}));
 w.eval(bundle.outputFiles.find(f=>f.path.endsWith('.js'))?.text||bundle.outputFiles[0].text);
 const core=w.qa.core;await core.host.open(w.qa.games.eigonou);const ordinaryChunks=w.document.querySelector('#chunks').innerHTML;const ordinaryInput=w.document.querySelector('#slin');if(ordinaryInput)ordinaryInput.value='unfinished';core.host.close();const initialDb=w.localStorage.getItem('cs:eigonou:db');const homeSeed=w.localStorage.getItem('cs:town:cont');
 const click=(label,parent=w.document)=>{const b=[...parent.querySelectorAll('button')].find(b=>b.textContent.trim()===label);assert.ok(b,'missing '+label);b.click()};
 const state=()=>JSON.parse(w.localStorage.getItem('cs:town-episodes:first'));
 w.qa.episodes.open();click('軽い2Dで進める');await sleep(10);click('つぎへ');click('はじめる');await sleep(180);
 assert.equal(core.host.current,'stream');assert.equal(w.document.querySelector('#sPlay').hidden,false);
 assert.equal([...w.document.scripts].some(s=>s.src.includes('town3d')),false,'2D must not load 3D');
 core.host.close();assert.equal(state().index,1);assert.match(w.document.querySelector('.ep-error').textContent,/途中/);
 click('もう一度開く');await sleep(180);
 core.events.report('stream','done',{play:'stream.word',set:'w1-1',finished:true});click('物語のつづきへ');assert.equal(state().index,2);
 while(state().index<8)click('つぎへ');
 click('はじめる');await sleep(80);assert.match(w.document.querySelector('.cs-chname').textContent,/第1章/);
 core.host.close();await sleep(100);assert.equal(state().index,8,'interrupt reading must not advance');
 click('もう一度開く');await sleep(80);click('スキップ');await sleep(80);
 for(let item=0;item<3;item++){
   let f=w.document.querySelector('[aria-label="1語すすむ"]');assert.ok(f,'real lesson exercise');f.click();
   w.document.querySelector('.cs-cutBtn').click();
   while(!f.disabled)f.click();
   w.document.querySelector('.cs-cutBtn').click();
   const go=[...w.document.querySelectorAll('button')].find(b=>/^(つぎの文へ|けっかを見る)$/.test(b.textContent));assert.ok(go);go.click();
 }
 assert.equal(state().passed,true);assert.equal(JSON.parse(w.localStorage.getItem('cs:chunkchunk:story')).cleared[7],true,'existing later chapter must survive');
 click('物語のつづきへ');assert.equal(state().index,9);
 while(state().index<18)click('つぎへ');
 click('はじめる');await sleep(30);const frame=w.document.querySelector('iframe');assert.ok(frame);assert.equal(frame.getAttribute('sandbox'),'allow-scripts');
 const frameDOM=new JSDOM(frame.srcdoc,{url:'about:blank',runScripts:'dangerously',resources:resources(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(cw){stubs(cw);Object.defineProperty(cw,'parent',{value:{postMessage(data){w.dispatchEvent(new w.MessageEvent('message',{source:frame.contentWindow,origin:'null',data}))}}});Object.defineProperty(cw,'localStorage',{get(){throw new cw.DOMException('blocked','SecurityError')}})}});children.push(frameDOM);
 await sleep(500);const cw=frameDOM.window;const panel=cw.document.querySelector('[aria-label="そらの案内"]');assert.ok(panel,'real English brain app loaded');
 for(const label of ['I（私は）','want to（〜したい）','rest（休む）','play（遊ぶ）'])click(label,panel);
 assert.match(cw.document.querySelector('#chunks').textContent,/want to.*play/);
 click('物語にもどる',panel);await sleep(30);assert.equal(state().index,19);
 assert.equal(w.localStorage.getItem('cs:eigonou:db'),initialDb,'English brain saved data must be byte-for-byte unchanged');assert.equal(w.localStorage.getItem('cs:town:cont'),homeSeed);
 while(state().index<25)click('つぎへ');click('ドアを開けて町へ');await sleep(20);
 assert.equal(state().completed,true);assert.equal(w.departed,'2d');assert.equal(w.document.querySelector('.ep-root'),null);
 await core.host.open(w.qa.games.eigonou);assert.equal(w.document.querySelector('#chunks').innerHTML,ordinaryChunks,'ordinary English brain sentence survives');if(ordinaryInput)assert.equal(w.document.querySelector('#slin').value,'unfinished','ordinary text input survives');core.host.close();
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('PASS: full 2D event bridges real stream launch, interrupted/retried reading lesson, actual three reading exercises, sandboxed English brain exercise, return and departure; existing English brain data and chapter 7 preserved.');
}catch(e){console.error(e.stack);console.error('DOM errors:',errors);process.exitCode=1}finally{children.forEach(c=>c.window.close());w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
