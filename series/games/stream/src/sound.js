import { ENV, bgmOn, setInterval, setTimeout, sfxOn } from './base.js';
import { PAUSED } from './play.js';
/* ================= 音 ================= */
export let AC=null,SEG,BGG,VOG;
export function ac(){
  if(!AC){try{const cs=ENV.core.sound;AC=cs.ctx();   // 共通の音：効果音・ボイスは「効果音」、BGMは「BGM」の音量で鳴る
    SEG=AC.createGain();SEG.gain.value=.9;SEG.connect(cs.sfxBus);BGG=AC.createGain();BGG.gain.value=.55;BGG.connect(cs.bgmBus);VOG=AC.createGain();VOG.gain.value=1;VOG.connect(cs.sfxBus);loadVoices()}catch(e){AC=null}}
  if(AC&&AC.state==="suspended"&&!PAUSED)AC.resume();
  return AC;
}
export function tone(f,d,type,vol,when,f2,dest){if(!AC)return;const t=when||AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type||"sine";o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(dest||SEG);o.start(t);o.stop(t+d+.02)}
export let NOISE=null;export function noiseBuf(){if(!NOISE){NOISE=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const d=NOISE.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return NOISE}
export function noise(d,vol,ff,ft,when,dest){if(!AC)return;const t=when||AC.currentTime,s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseBuf();f.type=ft||"highpass";f.frequency.value=ff;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f).connect(g).connect(dest||SEG);s.start(t);s.stop(t+d+.02)}
export const SE={
 tap(){tone(880,.05,"triangle",.08)},
 ok(c){if(!sfxOn())return;const b=660*Math.pow(2,Math.min(c,14)/24);tone(b,.09,"triangle",.16);tone(b*1.5,.16,"sine",.12,AC.currentTime+.05)},
 ng(){if(!sfxOn())return;tone(170,.18,"square",.07,0,110);tone(120,.2,"sawtooth",.04)},
 miss(){if(!sfxOn())return;tone(400,.25,"triangle",.1,0,180)},
 merge(){if(!sfxOn())return;noise(.18,.08,2400,"bandpass");tone(1320,.18,"sine",.06,AC.currentTime+.03)},
 count(h){if(!sfxOn())return;tone(h?1046:523,h?.35:.12,"triangle",.16)},
 clear(){if(!sfxOn())return;[523,659,784,1046,1318].forEach((f,i)=>tone(f,.25,"triangle",.14,AC.currentTime+i*.08))},
 star(i){if(!sfxOn())return;tone(988*Math.pow(1.19,i),.22,"sine",.14)},
};
export const VO={},VOLIST=["nice","good","excellent","perfect","combo","stage_clear","try_again","wow","yes"];
export function loadVoices(){VOLIST.forEach(n=>{fetch(`${ENV.base}audio/voice/${n}.mp3`).then(r=>r.arrayBuffer()).then(b=>AC.decodeAudioData(b)).then(buf=>VO[n]=buf).catch(()=>{})})}
export function voice(n){if(!AC||!sfxOn()||!VO[n])return;const s=AC.createBufferSource();s.buffer=VO[n];s.connect(VOG);s.start()}

/* ---- BGM（WebAudioで鳴らすループ。リズムモードはこの拍に合わせて出題） ---- */
export const BGM={on:false,bpm:120,t0:0,step:0,next:0,timer:0,style:"game",bar:0};
export const PROG=[[0,4,7],[7,11,14],[9,12,16],[5,9,12]];
export const mtof=m=>440*Math.pow(2,(m-69)/12);
export function bgmStart(bpm,style,at){if(!ac())return;bgmStop();BGM.on=true;BGM.bpm=bpm;BGM.style=style;BGM.t0=at||AC.currentTime+.05;BGM.next=BGM.t0;BGM.step=0;BGG.gain.cancelScheduledValues(AC.currentTime);BGG.gain.setValueAtTime(bgmOn()?(style==="menu"?.35:.5):0,AC.currentTime);BGM.timer=setInterval(bgmTick,25);bgmTick()}
export function bgmStop(){BGM.on=false;clearInterval(BGM.timer)}
export function bgmTick(){if(!BGM.on||!AC)return;const sd=60/BGM.bpm/4;while(BGM.next<AC.currentTime+.15){bgmStep(BGM.step,BGM.next);BGM.next+=sd;BGM.step++}}
export function bgmStep(s,t){
  const st=s%16,bar=Math.floor(s/16)%4,ch=PROG[bar],root=48+ch[0],menu=BGM.style==="menu";
  if(menu){
    if(st===0)ch.forEach(n=>tone(mtof(60+n),3.2,"sine",.035,t,0,BGG));
    if(st%4===2)tone(mtof(72+ch[(st/4|0)%3]),.5,"triangle",.045,t,0,BGG);
    if(st===0)tone(mtof(root-12),1.4,"triangle",.07,t,0,BGG);
    return}
  if(st%4===0){tone(120,.16,"sine",.5,t,45,BGG)}
  if(st===4||st===12)noise(.13,.22,1600,"bandpass",t,BGG);
  if(st%2===1)noise(.03,st%4===3?.09:.05,7000,"highpass",t,BGG);
  if(st%2===0)tone(mtof(root+(st%8===6?12:0)),.16,"triangle",.17,t,0,BGG);
  const arp=[0,1,2,1][st%4];tone(mtof(72+ch[arp]+(st>=8&&bar%2?12:0)),.11,"square",.022,t,0,BGG);
  if(st===0)ch.forEach(n=>tone(mtof(60+n),1.6,"sawtooth",.012,t,0,BGG));
}
export function bgmDuck(on){if(!AC||!BGM.on||!bgmOn())return;BGG.gain.setTargetAtTime(on?.22:(BGM.style==="menu"?.35:.5),AC.currentTime,.08)}

/* ---- 読み上げ（スマホ版ではネイティブTTS／音声ファイルに差し替え予定） ---- */
export const TTS={id:0,pend:null,busy:false,kind:"",wd:0};   // 声・速さ・ON/OFF は共通の読み上げ（core.speech）
// 割り込みで読む。読み終わり（または見張りタイマー）で cb
export function speak(text,cb,kind){
  const id=++TTS.id;clearTimeout(TTS.wd);TTS.pend=null;TTS.busy=true;TTS.kind=kind||"";
  const sp=ENV.core.speech,vOn=ENV.core.settings.get("voice"),rate=ENV.core.settings.get("rate")||1,est=(500+text.split(/\s+/).length*380)/rate;
  let fin=false;const t0=performance.now();const done=(late)=>{if(fin)return;const el=performance.now()-t0;if(!late&&el<est*.55){fin=true;setTimeout(()=>{fin=false;done(true)},est*.55-el);return}fin=true;if(id!==TTS.id)return;clearTimeout(TTS.wd);TTS.busy=false;bgmDuck(false);cb&&cb();
    if(TTS.pend&&id===TTS.id){const p=TTS.pend;TTS.pend=null;speak(p,null,"post")}};
  if(!vOn||!window.speechSynthesis){TTS.wd=setTimeout(()=>done(true),vOn?est:200);return}
  bgmDuck(true);sp.speak(text,{onend:()=>done()});TTS.wd=setTimeout(()=>done(true),est*1.8+1500);
}
// 答えたあとの読み上げ：読み上げ中なら1つだけ予約（溜めない）
export function speakAfter(text){if(TTS.busy&&TTS.kind==="post"){TTS.pend=text;return}speak(text,null,"post")}
export function hush(){TTS.id++;TTS.pend=null;clearTimeout(TTS.wd);TTS.busy=false;ENV.core.speech.stop();bgmDuck(false)}
export function say(t){speak(t,null,"ui")}
