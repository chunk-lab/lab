import { clearPop, stopVoice, $, ENV, S, bindSettingRows, closeSheet, legendHTML, loadStage, nextRun, openSheet, primeSpeech, randLabel, saveSettings, settingRows, settings, stageN, startPractice, unlockAudio } from './engine.js';
import { pickText } from './pick.js';
import { showRanking, startTimed } from './rank.js';
import { openMyTexts } from './texts.js';
import { sfx } from './sfx.js';
/* 施設ごとの入口（メニュー）。街のどこから入ったかで中身が変わる：
   lesson＝学校（チャンク練習・役割）／library＝図書館（リーディング・長文の登録と共有）／arcade＝ゲームセンター（ゲーム・チャレンジ・ランキング） */
export let FACE="arcade";
export function updateLvHint(){const el=$("lvHint");if(el)el.textContent=`出る文：${randLabel()}（設定で変えられます）`}
export function showTitle(){
  nextRun();if(S){clearTimeout(S.timer);S.phase="ready";S.paused=false;S.roleMode=false}
  stopVoice();
  ["count","modal","startBox","edView","rolePick"].forEach(id=>$(id).hidden=true);
  clearPop();
  $("title").dataset.face=FACE;updateLvHint();
  $("title").hidden=false;
}
/* 学校の「Lesson」：押すと「読む・聞く」「話す・書く」の2つから選ぶ（もどるで学校のメニューへ） */
function lessonSub(on){const f=document.querySelector(".faceLesson");if(!f)return;f.querySelector(".sMenu:not(.lessonSub)").hidden=on;f.querySelector(".lessonSub").hidden=!on}
export function initTitle(face){
  FACE=face||"arcade";
  document.querySelectorAll("[data-chara]").forEach(i=>i.src=ENV.ctx.base+"img/chara/"+i.dataset.chara+"/"+(i.dataset.chara==="boy"?"idea":"joy")+".webp");
  if(FACE==="all"){   // 単体アプリ：施設の切りかえタブ（ゲームセンター／学校／図書館）
    FACE="arcade";const t=$("title"),bar=document.createElement("div");bar.className="ccTabs";
    bar.innerHTML=[["arcade","ゲームセンター"],["lesson","学校"],["library","図書館"]].map(([k,n])=>`<button data-tab="${k}">${n}</button>`).join("");
    t.appendChild(bar);
    const draw=()=>bar.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.tab===FACE));
    bar.onclick=e=>{const b=e.target.closest("button");if(!b)return;FACE=b.dataset.tab;t.dataset.face=FACE;draw()};
    draw();ENV.tabsDraw=draw;
  }
  document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>{
    primeSpeech();unlockAudio();$("title").hidden=true;
    const [adv,mode]=b.dataset.play.split("-");sfx("se/btn_"+(adv==="auto"?"sarasara":"yoidon"));settings.advance=adv;settings.mode=mode;saveSettings();
    loadStage(mode,stageN[mode],null,true);
  });
  document.querySelectorAll("[data-open-set]").forEach(b=>b.onclick=()=>{
    openSheet(`<h2>設定</h2>${settingRows()}${legendHTML()}<div class="btns"><button class="primary" id="closeBtn">閉じる</button></div>`);
    bindSettingRows();$("closeBtn").onclick=closeSheet;
  });
  document.querySelectorAll("[data-study]").forEach(b=>b.onclick=()=>{
    primeSpeech();unlockAudio();const v=b.dataset.study;
    if(v==="lesson"){sfx("se/btn_lesson");lessonSub(true);return}
    if(v==="make"){sfx("se/btn_lesson");ENV.make.open();return}
    if(v==="story"){sfx("se/btn_lesson");ENV.story.open();return}
    if(v==="texts"){$("title").hidden=true;openMyTexts();return}
    if(v==="random"){$("title").hidden=true;startPractice(null);return}
    pickText(v);
  });
  document.querySelectorAll("[data-lesson-back]").forEach(b=>b.onclick=()=>lessonSub(false));
  document.querySelectorAll("[data-timed]").forEach(b=>b.onclick=()=>startTimed(+b.dataset.timed));
  document.querySelectorAll("[data-rank]").forEach(b=>b.onclick=()=>showRanking(30));
}
