import { clearPop, stopVoice, $, ENV, S, bindSettingRows, closeSheet, legendHTML, loadStage, nextRun, openSheet, primeSpeech, randLabel, saveSettings, settingRows, settings, stageN, startPractice, unlockAudio } from './engine.js';
import { pickText } from './pick.js';
import { showRanking, startTimed } from './rank.js';
import { openMyTexts } from './texts.js';
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
export function initTitle(face){
  FACE=face||"arcade";
  document.querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>{
    primeSpeech();unlockAudio();$("title").hidden=true;
    const [adv,mode]=b.dataset.play.split("-");settings.advance=adv;settings.mode=mode;saveSettings();
    loadStage(mode,stageN[mode],null,true);
  });
  document.querySelectorAll("[data-open-set]").forEach(b=>b.onclick=()=>{
    openSheet(`<h2>設定</h2>${settingRows()}${legendHTML()}<div class="btns"><button class="primary" id="closeBtn">閉じる</button></div>`);
    bindSettingRows();$("closeBtn").onclick=closeSheet;
  });
  document.querySelectorAll("[data-study]").forEach(b=>b.onclick=()=>{
    primeSpeech();unlockAudio();const v=b.dataset.study;
    if(v==="make"){ENV.make.open();return}
    if(v==="texts"){$("title").hidden=true;openMyTexts();return}
    if(v==="random"){$("title").hidden=true;startPractice(null);return}
    pickText(v);
  });
  document.querySelectorAll("[data-timed]").forEach(b=>b.onclick=()=>startTimed(+b.dataset.timed));
  document.querySelectorAll("[data-rank]").forEach(b=>b.onclick=()=>showRanking(30));
}
