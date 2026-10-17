/* ===== ui.js:画面(DOM)とスタイル。クラス名はすべて pc- 接頭辞 ===== */
var UI = (function () {
  'use strict';
  var CSS = [
    '.pc-root{position:relative;width:100%;height:100%;overflow:hidden;background:#f3ecff;color:#3a2c4a;font-family:' + Art.FONT_JA + ';-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;-webkit-touch-callout:none;-webkit-text-size-adjust:100%;line-height:1.4;box-sizing:border-box}',
    '.pc-root *,.pc-root *::before,.pc-root *::after{box-sizing:border-box}',
    '.pc-root button{font-family:inherit;cursor:pointer;-webkit-appearance:none;appearance:none}',
    '.pc-stage{position:absolute;top:0;bottom:0;left:50%;width:100%;max-width:520px;transform:translateX(-50%);overflow:hidden}',
    '.pc-bg,.pc-cv{position:absolute;left:0;top:0;width:100%;height:100%;display:block}',
    '.pc-en{font-family:' + Art.FONT_EN + '}',
    '.pc-probe{position:absolute;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}',
    /* ボタン */
    '.pc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:0 24px;border:0;border-radius:22px;font-weight:900;font-size:19px;letter-spacing:.04em;color:#fff;background:linear-gradient(180deg,#9a80ff,#6a4cf0);box-shadow:0 5px 0 #4b30c4,0 12px 22px rgba(90,60,200,.32);transition:transform .08s,box-shadow .08s,filter .2s;position:relative}',
    '.pc-btn:active{transform:translateY(4px);box-shadow:0 1px 0 #4b30c4,0 4px 10px rgba(90,60,200,.3)}',
    '.pc-btn svg{width:22px;height:22px;fill:currentColor}',
    '.pc-btn.pink{background:linear-gradient(180deg,#ff9cc2,#ff6f9f);box-shadow:0 5px 0 #d94379,0 12px 22px rgba(255,80,140,.3)}.pc-btn.pink:active{box-shadow:0 1px 0 #d94379}',
    '.pc-btn.mint{background:linear-gradient(180deg,#6fe0ad,#2fbf83);box-shadow:0 5px 0 #1d915f,0 12px 22px rgba(40,180,120,.3)}.pc-btn.mint:active{box-shadow:0 1px 0 #1d915f}',
    '.pc-btn.yellow{color:#5a3d00;background:linear-gradient(180deg,#ffe27a,#ffc93c);box-shadow:0 5px 0 #d79a12,0 12px 22px rgba(240,170,20,.3)}.pc-btn.yellow:active{box-shadow:0 1px 0 #d79a12}',
    '.pc-btn.ghost{color:#5b45c9;background:#fff;box-shadow:0 4px 0 #d8cff7,0 8px 18px rgba(90,60,200,.14)}.pc-btn.ghost:active{box-shadow:0 1px 0 #d8cff7}',
    '.pc-btn.small{min-height:42px;font-size:15px;padding:0 16px;border-radius:16px}',
    '.pc-btn.wide{width:100%}',
    '.pc-btn[disabled]{filter:grayscale(.8) opacity(.6);pointer-events:none}',
    '.pc-ib{width:48px;height:48px;border-radius:18px;border:0;display:inline-flex;align-items:center;justify-content:center;color:#5b45c9;background:rgba(255,255,255,.92);box-shadow:0 4px 0 #d8cff7,0 8px 16px rgba(90,60,200,.15);transition:transform .08s}',
    '.pc-ib:active{transform:translateY(3px);box-shadow:0 1px 0 #d8cff7}',
    '.pc-ib svg{width:24px;height:24px;fill:currentColor}',
    /* 画面 */
    '.pc-scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(var(--pc-top) + 12px) 16px calc(var(--pc-bottom) + 16px);overflow-y:auto;overflow-x:hidden;touch-action:pan-y;-webkit-overflow-scrolling:touch;animation:pc-in .3s cubic-bezier(.2,.9,.3,1.2) both;z-index:20}',
    '.pc-scr.out{animation:pc-out .2s ease-in both;pointer-events:none}',
    '@keyframes pc-in{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:none}}',
    '@keyframes pc-out{to{opacity:0;transform:translateY(10px) scale(.98)}}',
    '.pc-head{display:flex;align-items:center;gap:12px;margin-bottom:12px;min-height:48px}',
    '.pc-head h2{margin:0;font-size:22px;font-weight:900;color:#4a35b5;text-shadow:0 2px 0 #fff}',
    '.pc-card{background:rgba(255,255,255,.9);border-radius:26px;box-shadow:0 10px 30px rgba(80,50,140,.16);padding:16px;margin-bottom:12px}',
    '.pc-card h3{margin:0 0 10px;font-size:15px;color:#6a55c9;font-weight:900;letter-spacing:.05em}',
    '.pc-spacer{flex:1 1 auto;min-height:8px}',
    '.pc-dim{position:absolute;inset:0;background:rgba(50,30,90,.35);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}',
    /* タイトル */
    '.pc-logo{text-align:center;margin-top:min(8vh,60px)}',
    '.pc-logo .ls{display:flex;justify-content:center;gap:2px;flex-wrap:nowrap}',
    '.pc-logo .l{display:inline-flex;align-items:center;justify-content:center;width:min(15vw,62px);height:min(15vw,62px);border-radius:50%;font-size:min(9vw,38px);font-weight:900;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.18);box-shadow:inset 0 -6px 0 rgba(0,0,0,.12),inset 0 6px 10px rgba(255,255,255,.6),0 6px 14px rgba(80,50,140,.25);animation:pc-bob 2.4s ease-in-out infinite;position:relative}',
    '.pc-logo .l::after{content:"";position:absolute;left:22%;top:14%;width:28%;height:16%;border-radius:50%;background:rgba(255,255,255,.75);transform:rotate(-25deg)}',
    '@keyframes pc-bob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-6px) scale(1.04,.96)}}',
    '.pc-logo .sub{margin-top:14px;font-weight:900;color:#6a55c9;font-size:15px;letter-spacing:.12em}',
    '.pc-logo .en{font-family:' + Art.FONT_EN + ';font-weight:900;color:#ff6f9f;font-size:13px;letter-spacing:.3em;margin-top:4px}',
    '.pc-menu{display:flex;flex-direction:column;gap:14px;width:100%;max-width:340px;margin:0 auto}',
    '.pc-row{display:flex;justify-content:center;gap:14px}',
    '.pc-ibl{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;font-weight:800;color:#5b45c9}',
    '.pc-tap{align-self:center;padding:10px 22px;border-radius:22px;background:rgba(255,255,255,.82);box-shadow:0 6px 18px rgba(80,50,140,.15);font-weight:900;color:#5b45c9;font-size:18px;animation:pc-blink 1.4s ease-in-out infinite}',
    '@keyframes pc-blink{50%{opacity:.55}}',
    /* モード */
    '.pc-lv{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:rgba(255,255,255,.7);padding:5px;border-radius:18px}',
    '.pc-lv button{border:0;border-radius:14px;padding:9px 0;font-weight:900;font-size:13px;white-space:nowrap;letter-spacing:-.02em;color:#6a55c9;background:transparent;transition:background .15s}',
    '.pc-lv button.on{color:#fff;background:linear-gradient(180deg,#9a80ff,#6a4cf0);box-shadow:0 3px 0 #4b30c4}',
    '.pc-lvdesc{font-size:12.5px;color:#6b5d80;margin:8px 4px 0;min-height:18px;font-weight:700}',
    '.pc-mode{display:flex;align-items:center;gap:14px;padding:14px;border-radius:24px;background:rgba(255,255,255,.92);box-shadow:0 8px 22px rgba(80,50,140,.14);margin-top:12px;border:0;width:100%;text-align:left;color:inherit;transition:transform .1s}',
    '.pc-mode:active{transform:scale(.98)}',
    '.pc-mode .ic{flex:0 0 56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:24px;box-shadow:inset 0 -5px 0 rgba(0,0,0,.12)}',
    '.pc-mode .ic svg{width:30px;height:30px;fill:#fff}',
    '.pc-mode .tx{flex:1;min-width:0}',
    '.pc-mode b{display:block;font-size:17px;font-weight:900;color:#3a2c4a}',
    '.pc-mode small{display:block;font-size:12.5px;color:#7a6c90;font-weight:700;margin-top:2px}',
    '.pc-mode .best{font-size:12px;color:#ff6f9f;font-weight:900;margin-top:3px;font-family:' + Art.FONT_EN + '}',
    '.pc-mode.locked{opacity:.92}.pc-mode .lock{width:26px;height:26px;fill:#b3a6d6}',
    /* 設定 */
    '.pc-set{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 2px;border-bottom:1px dashed rgba(140,120,200,.25);font-weight:800;font-size:15px}',
    '.pc-set:last-child{border-bottom:0}',
    '.pc-set small{display:block;font-size:11.5px;color:#8a7da0;font-weight:700}',
    '.pc-sw{position:relative;flex:0 0 56px;height:32px;border-radius:16px;background:#ddd5f2;border:0;transition:background .2s}',
    '.pc-sw::after{content:"";position:absolute;left:3px;top:3px;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.2);transition:transform .2s}',
    '.pc-sw.on{background:#3cc98a}.pc-sw.on::after{transform:translateX(24px)}',
    '.pc-sw[disabled]{opacity:.45}',
    '.pc-seg{display:flex;background:#eee8fb;border-radius:14px;padding:3px;gap:2px;flex-wrap:nowrap}',
    '.pc-seg button{border:0;background:transparent;border-radius:11px;padding:7px 10px;font-weight:900;font-size:13px;color:#6a55c9;white-space:nowrap}',
    '.pc-seg button.on{background:#fff;box-shadow:0 2px 6px rgba(80,50,140,.18);color:#4a35b5}',
    '.pc-seg[aria-disabled=true]{opacity:.45;pointer-events:none}',
    '.pc-range{-webkit-appearance:none;appearance:none;width:130px;height:8px;border-radius:4px;background:#e2daf7;outline:none}',
    '.pc-range::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#7b5cff;box-shadow:0 2px 5px rgba(0,0,0,.25);border:3px solid #fff}',
    '.pc-range::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#7b5cff;border:3px solid #fff}',
    /* HUD */
    '.pc-hud{position:absolute;left:0;right:0;top:var(--pc-top);height:58px;display:flex;align-items:center;gap:10px;padding:0 10px;z-index:10;pointer-events:none}',
    '.pc-hud>*{pointer-events:auto}',
    '.pc-hud .pc-ib{width:44px;height:44px;border-radius:16px}',
    '.pc-score{flex:1;text-align:center;line-height:1}',
    '.pc-score b{display:block;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:28px;color:#4a35b5;text-shadow:0 2px 0 #fff,0 0 12px rgba(255,255,255,.9);transition:transform .15s}',
    '.pc-score b.bump{transform:scale(1.15)}',
    '.pc-combo{display:inline-block;margin-top:3px;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:12px;color:#fff;background:linear-gradient(90deg,#ff7aa8,#ff9b6a);border-radius:10px;padding:2px 8px;opacity:0;transition:opacity .2s}',
    '.pc-combo.on{opacity:1}',
    '.pc-timer{position:relative;width:52px;height:52px}',
    '.pc-timer svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}',
    '.pc-timer span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:17px;color:#4a35b5}',
    '.pc-timer.warn span{color:#ef4d63;animation:pc-pulse .5s ease-in-out infinite alternate}',
    '@keyframes pc-pulse{to{transform:scale(1.18)}}',
    '.pc-prev{position:absolute;left:12px;right:12px;top:calc(var(--pc-top) + 58px);height:30px;display:flex;align-items:center;justify-content:center;z-index:9;pointer-events:none}',
    '.pc-prev div{max-width:100%;display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:15px;background:rgba(255,255,255,.88);box-shadow:0 3px 10px rgba(80,50,140,.12);font-family:' + Art.FONT_EN + ';font-weight:800;font-size:14px;color:#3a2c4a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .15s}',
    '.pc-prev div.empty{opacity:0}',
    '.pc-prev i{font-style:normal;flex:0 0 auto;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-family:' + Art.FONT_JA + '}',
    '.pc-prev .goal{background:rgba(255,247,220,.95)}.pc-prev .goal i{background:#ffb21f}.pc-prev .goal small{font-size:12.5px;font-weight:900;color:#7a5200}',
    '.pc-prev .ok i{background:#3cc98a}.pc-prev .bad i{background:#ef4d63}.pc-prev .wait i{background:#f5a524}.pc-prev .sel i{background:#7b5cff}',
    '.pc-prev small{font-family:' + Art.FONT_JA + ';font-size:11px;color:#8a7da0;overflow:hidden;text-overflow:ellipsis}',
    '.pc-items{position:absolute;right:10px;display:flex;gap:8px;z-index:9}',
    '.pc-items button{position:relative;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.95);color:#7b5cff;box-shadow:0 3px 0 #d8cff7,0 6px 12px rgba(90,60,200,.15);display:flex;align-items:center;justify-content:center}',
    '.pc-items button svg{width:22px;height:22px;fill:currentColor}',
    '.pc-items button em{position:absolute;right:-4px;top:-4px;min-width:18px;height:18px;border-radius:9px;background:#ff6f9f;color:#fff;font-style:normal;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;padding:0 4px;font-family:' + Art.FONT_EN + '}',
    '.pc-items button.zero{opacity:.45}',
    /* 演出用の文字 */
    '.pc-toast{position:absolute;left:50%;top:calc(var(--pc-top) + 96px);transform:translateX(-50%);z-index:12;pointer-events:none;display:flex;align-items:center;gap:8px;max-width:92%;padding:9px 16px;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(80,50,140,.22);font-weight:900;font-size:14px;color:#3a2c4a;animation:pc-toast 2.3s ease both}',
    '.pc-toast i{font-style:normal;flex:0 0 auto;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px}',
    '.pc-toast.x i{background:#ef4d63}.pc-toast.tri i{background:#f5a524}.pc-toast.info i{background:#7b5cff}',
    '@keyframes pc-toast{0%{opacity:0;transform:translate(-50%,-10px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-6px)}}',
    '.pc-banner{position:absolute;left:12px;right:12px;top:38%;z-index:12;pointer-events:none;text-align:center;animation:pc-ban 2.2s cubic-bezier(.2,.9,.3,1.2) both}',
    '.pc-banner div{display:inline-block;max-width:100%;padding:14px 20px;border-radius:24px;background:linear-gradient(180deg,#fff,#f6f0ff);box-shadow:0 12px 30px rgba(80,50,140,.3),inset 0 -4px 0 rgba(140,110,230,.15);font-family:' + Art.FONT_EN + ';font-weight:900;font-size:21px;color:#3a2c4a;line-height:1.35}',
    '.pc-banner u{text-decoration:none;color:#ff4f8b;border-bottom:3px solid #ffb3cc}',
    '.pc-banner small{display:block;margin-top:6px;font-size:14px;color:#ff6f9f}','.pc-banner .pf{display:inline-block;padding:1px 10px;border-radius:10px;background:linear-gradient(90deg,#ffd23f,#ff9b6a);color:#fff;font-size:15px;margin-right:4px}',
    '.pc-banner .ok{display:inline-flex;width:28px;height:28px;border-radius:50%;background:#3cc98a;color:#fff;align-items:center;justify-content:center;vertical-align:-5px;margin-right:6px}.pc-banner .ok svg{width:18px;height:18px;fill:none;stroke:#fff}',
    '@keyframes pc-ban{0%{opacity:0;transform:scale(.6)}12%{opacity:1;transform:scale(1.04)}20%{transform:scale(1)}82%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-24px)}}',
    '.pc-count{position:absolute;left:0;right:0;top:36%;text-align:center;z-index:13;pointer-events:none;font-weight:900;font-size:72px;color:#fff;-webkit-text-stroke:3px #6a4cf0;text-shadow:0 6px 0 #4b30c4,0 12px 30px rgba(80,50,180,.45);animation:pc-cnt .8s cubic-bezier(.2,.9,.3,1.4) both}',
    '.pc-count.big{font-size:52px;animation-duration:1.4s}',
    '@keyframes pc-cnt{0%{opacity:0;transform:scale(.3)}30%{opacity:1;transform:scale(1.1)}45%{transform:scale(1)}85%{opacity:1}100%{opacity:0;transform:scale(1.15)}}',
    '.pc-tip{position:absolute;z-index:11;pointer-events:none;transform:translate(-50%,-100%);padding:8px 12px;border-radius:14px;background:#3d2d66;color:#fff;font-family:' + Art.FONT_EN + ';font-weight:800;font-size:15px;white-space:nowrap;box-shadow:0 8px 20px rgba(40,20,80,.3);max-width:94%}',
    '.pc-tip small{display:block;font-family:' + Art.FONT_JA + ';font-weight:700;font-size:11.5px;color:#d9ccff;margin-top:1px}',
    '.pc-tip::after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#3d2d66}',
    /* 結果 */
    '.pc-res-score{text-align:center;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:56px;color:#4a35b5;text-shadow:0 3px 0 #fff;line-height:1.1}',
    '.pc-new{display:inline-block;margin:4px auto 0;padding:4px 12px;border-radius:12px;background:linear-gradient(90deg,#ffd23f,#ff9b6a);color:#fff;font-weight:900;font-size:14px;animation:pc-pulse .6s ease-in-out infinite alternate;font-family:' + Art.FONT_EN + '}',
    '.pc-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.pc-stats div{background:#f5f0ff;border-radius:16px;padding:9px 10px;text-align:center}',
    '.pc-stats b{display:block;font-family:' + Art.FONT_EN + ';font-size:22px;font-weight:900;color:#5b45c9}',
    '.pc-stats small{font-size:11.5px;font-weight:800;color:#7a6c90}',
    '.pc-list{display:flex;flex-direction:column;gap:6px;max-height:34vh;overflow:auto;touch-action:pan-y}',
    '.pc-sent{display:flex;align-items:center;gap:8px;background:#faf7ff;border-radius:14px;padding:7px 8px 7px 12px;font-family:' + Art.FONT_EN + ';font-weight:800;font-size:14px}',
    '.pc-sent span{flex:1;min-width:0}',
    '.pc-sent button{flex:0 0 34px;height:34px;border-radius:50%;border:0;background:#ece5ff;color:#6a4cf0;display:flex;align-items:center;justify-content:center}',
    '.pc-sent button svg{width:18px;height:18px;fill:currentColor}',
    '.pc-goal{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:#fff7dc;font-weight:900;font-size:14px;color:#7a5200}',
    '.pc-goal.done{background:#ddf7ea;color:#1d7a50}',
    /* 記録 */
    '.pc-tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;touch-action:pan-x}',
    '.pc-tabs button{flex:0 0 auto;border:0;border-radius:14px;padding:8px 12px;font-weight:900;font-size:13px;background:rgba(255,255,255,.75);color:#6a55c9}',
    '.pc-tabs button.on{background:#6a4cf0;color:#fff}',
    '.pc-rank{display:flex;align-items:center;gap:10px;padding:9px 6px;border-bottom:1px dashed rgba(140,120,200,.25);font-weight:800}',
    '.pc-rank .n{flex:0 0 30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#eee8fb;color:#6a55c9;font-family:' + Art.FONT_EN + ';font-weight:900}',
    '.pc-rank:nth-child(1) .n{background:#ffd23f;color:#6b4a00}.pc-rank:nth-child(2) .n{background:#dfe3ee;color:#4b5266}.pc-rank:nth-child(3) .n{background:#f6c6a0;color:#7a3f12}',
    '.pc-rank .s{flex:1;font-family:' + Art.FONT_EN + ';font-weight:900;font-size:18px;color:#3a2c4a}',
    '.pc-rank small{color:#8a7da0;font-size:11.5px}',
    '.pc-empty{text-align:center;color:#8a7da0;font-weight:800;padding:24px 0}',
    /* ショップ */
    '.pc-prod{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px dashed rgba(140,120,200,.25)}',
    '.pc-prod:last-child{border-bottom:0}',
    '.pc-prod .ic{flex:0 0 46px;height:46px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:#f1ebff;color:#7b5cff}',
    '.pc-prod .ic svg{width:26px;height:26px;fill:currentColor}',
    '.pc-prod .tx{flex:1}.pc-prod b{display:block;font-size:15px}.pc-prod small{font-size:12px;color:#7a6c90;font-weight:700}',
    '.pc-note{font-size:11.5px;color:#8a7da0;font-weight:700;text-align:center;margin:4px 0 10px}',
    /* モーダル・チュートリアル */
    '.pc-modal{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:24px}',
    '.pc-modal .pc-card{position:relative;width:100%;max-width:340px;text-align:center;animation:pc-in .25s cubic-bezier(.2,.9,.3,1.3) both}',
    '.pc-modal p{margin:6px 0 16px;font-weight:800;font-size:15px;color:#4a3d60}',
    '.pc-say{position:absolute;left:12px;right:12px;z-index:30;display:flex;flex-direction:column;align-items:stretch;gap:10px;padding:14px 16px;border-radius:22px;background:#fff;box-shadow:0 10px 30px rgba(80,50,140,.28);animation:pc-in .3s cubic-bezier(.2,.9,.3,1.3) both}',
    '.pc-say p{margin:0;font-weight:800;font-size:15.5px;line-height:1.55;color:#3a2c4a}',
    '.pc-say p b{color:#ff4f8b}.pc-say p .pc-en{color:#5b45c9;font-weight:900}',
    '.pc-say::after{content:"";position:absolute;left:34px;bottom:-10px;border:10px solid transparent;border-bottom:0;border-top-color:#fff}',
    '.pc-say .row{display:flex;justify-content:flex-end;gap:8px}',
    '.pc-skip{position:absolute;right:12px;top:calc(var(--pc-top) + 64px);z-index:31}',
    '.pc-credits p{font-size:13.5px;font-weight:700;color:#4a3d60;margin:0 0 10px;line-height:1.7}',
    '.pc-tgear{position:absolute;top:calc(var(--pc-top) + 12px);left:14px;z-index:3}',
    '.pc-lvnow{font-size:12.5px;font-weight:800;color:#8a6aa8;text-align:center;margin:2px 0 10px}',
    '.pc-ttsnote{font-size:11.5px;color:#a0567a;font-weight:800;text-align:center;margin-top:6px}',
    '@media (prefers-reduced-motion: reduce){.pc-logo .l,.pc-tap{animation:none}.pc-scr{animation-duration:.01s}}'
  ].join('\n');
  var styleRef = 0, styleEl = null;
  function injectCSS() { styleRef++; if (styleEl) return; styleEl = document.createElement('style'); styleEl.setAttribute('data-punichunk', ''); styleEl.textContent = CSS; document.head.appendChild(styleEl); }
  function removeCSS() { styleRef--; if (styleRef <= 0 && styleEl) { styleEl.remove(); styleEl = null; styleRef = 0; } }

  function create(app, stageEl) {
    var el = U.el, ui = { stage: stageEl }, hudEl = null, prevEl = null, itemsEl = null, layer = el('div', { class: 'pc-layer' });
    stageEl.appendChild(layer);
    function icon(n) { return Art.ICON[n] || ''; }
    // 画面が切り替わった直後のタップは無視する(前の画面のタップが新しい画面のボタンに当たる「すり抜け」防止)
    var shownAt = 0; function early() { return Date.now() - shownAt < 400; }
    function btn(label, cls, fn, ic) { var b = el('button', { class: 'pc-btn ' + (cls || ''), onclick: function (e) { if (early()) return; app.audio.sfx('button'); app.audio.unlock(); fn && fn(e); } }); if (ic) b.innerHTML = icon(ic); b.appendChild(document.createTextNode(label)); return b; }
    function ib(ic, label, fn) { var b = el('button', { class: 'pc-ib', 'aria-label': label, html: icon(ic), onclick: function (e) { if (early()) return; app.audio.sfx('button'); app.audio.unlock(); fn && fn(e); } }); return b; }
    ui.btn = btn; ui.ib = ib; ui.icon = icon;
    var cur = null;
    function screen(node) {
      if (cur) { var old = cur; old.classList.add('out'); old.style.pointerEvents = 'none'; setTimeout(function () { old.remove(); }, 200); }
      shownAt = Date.now(); cur = node; if (node) stageEl.appendChild(node); return node;
    }
    ui.clear = function () { screen(null); };
    function head(title, back) { return el('div', { class: 'pc-head' }, [ib('back', 'もどる', back), el('h2', { text: title })]); }

    // ---------- 起動 ----------
    ui.splash = function (onGo) {
      var n = el('div', { class: 'pc-scr', onclick: function () { app.audio.unlock(); onGo(); } }, [logo(), el('div', { class: 'pc-spacer' }), el('div', { class: 'pc-tap', text: 'タップしてはじめる' }), el('div', { style: { height: '24vh' } })]);
      return screen(n);
    };
    function logo() {
      var letters = ['ぷ', 'に', 'チ', 'ャ', 'ン', 'ク'], cols = ['#ff7aa8', '#ffb347', '#7b5cff', '#5aa8f0', '#3cc98a', '#ff6f9f'];
      return el('div', { class: 'pc-logo' }, [el('div', { class: 'ls' }, letters.map(function (c, i) { return el('span', { class: 'l', text: c, style: { background: 'radial-gradient(circle at 35% 30%,#fff 0,' + cols[i] + ' 60%)', animationDelay: (i * .12) + 's', width: c === 'ャ' ? 'min(11vw,46px)' : '', height: c === 'ャ' ? 'min(11vw,46px)' : '', fontSize: c === 'ャ' ? 'min(7vw,28px)' : '', alignSelf: c === 'ャ' ? 'flex-end' : '' } }); })), el('div', { class: 'sub', text: '英語脳バブルパズル' }), el('div', { class: 'en', text: 'PUNI CHUNK' })]);
    }
    // ---------- タイトル ----------
    ui.title = function (h) {
      var n = el('div', { class: 'pc-scr' }, [
        muteBtn(), el('div', { class: 'pc-tgear' }, [ib('gear', '設定', h.settings)]), logo(), el('div', { class: 'pc-spacer' }),
        el('div', { class: 'pc-menu' }, [
          btn('あそぶ', 'wide', h.play, 'play'),
          btn('あそびかた', 'ghost wide', h.tutorial, 'info'),
          el('div', { class: 'pc-row' }, [
            el('div', { class: 'pc-ibl' }, [ib('trophy', '記録', h.records), document.createTextNode('記録')]),
            el('div', { class: 'pc-ibl' }, [ib('shop', 'ショップ', h.shop), document.createTextNode('ショップ')]),
            el('div', { class: 'pc-ibl' }, [ib('star', 'クレジット', h.credits), document.createTextNode('クレジット')])
          ])
        ]),
        el('div', { style: { height: '20vh', minHeight: '150px' } })
      ]);
      screen(n);
      setTimeout(function () { var lg = n.querySelector('.pc-logo'), mn = n.querySelector('.pc-menu'), H = stageEl.clientHeight; if (lg && mn && H) { var sr = stageEl.getBoundingClientRect(); app.band = { y0: (lg.getBoundingClientRect().bottom - sr.top) / H, y1: (mn.getBoundingClientRect().top - sr.top) / H }; } }, 350);
      return n;
    };
    function muteBtn() {
      var s = app.settings, b = ib('speaker', '音のオン/オフ', function () { var on = !(s.bgm > 0 || s.sfx > 0); if (on) { s.bgm = s._bgm || .5; s.sfx = s._sfx || .8; } else { s._bgm = s.bgm; s._sfx = s.sfx; s.bgm = 0; s.sfx = 0; } app.saveSettings(); paint(); });
      function paint() { var off = !(s.bgm > 0 || s.sfx > 0); b.style.opacity = off ? .45 : 1; b.setAttribute('aria-pressed', off ? 'true' : 'false'); b.innerHTML = icon('speaker') + (off ? '<i style="position:absolute;width:28px;height:3px;background:#ef4d63;transform:rotate(-45deg);border-radius:2px"></i>' : ''); }
      b.style.position = 'absolute'; b.style.right = '14px'; b.style.top = 'calc(var(--pc-top) + 12px)'; paint(); return b;
    }
    // ---------- モード選択 ----------
    ui.modes = function (h) {
      var lvBox = el('div', { class: 'pc-lv' }), desc = el('div', { class: 'pc-lvdesc' }), list = el('div');
      function render() {
        lvBox.innerHTML = ''; app.LEVELS.forEach(function (L) { lvBox.appendChild(el('button', { class: L.id === app.state.level ? 'on' : '', text: L.name, onclick: function () { app.audio.sfx('button'); app.state.level = L.id; app.saveState(); render(); } })); });
        desc.textContent = app.LEVELS[app.state.level].desc;
        list.innerHTML = '';
        app.MODES.forEach(function (m) {
          var best = app.best(m.id, app.state.level), locked = m.premium && !app.services.store.isPremium();
          var ic = el('div', { class: 'ic', style: { background: m.bg }, html: icon(m.icon) });
          var card = el('button', { class: 'pc-mode' + (locked ? ' locked' : ''), onclick: function () { if (early()) return; app.audio.sfx('button'); app.audio.unlock(); locked ? h.shop() : h.start(m.id); } }, [
            ic, el('div', { class: 'tx' }, [el('b', { text: m.name }), el('small', { text: m.desc }), el('div', { class: 'best', text: locked ? 'プレミアムで解放' : best ? 'BEST ' + U.fmt(best) : 'まだ記録なし' })]),
            locked ? el('span', { html: icon('lock').replace('<svg', '<svg class="lock"') }) : null
          ]);
          list.appendChild(card);
        });
      }
      render();
      return screen(el('div', { class: 'pc-scr' }, [head('モードをえらぶ', h.back), el('div', { class: 'pc-lvnow', text: 'むずかしさ:' + app.LEVELS[app.state.level].name + '(設定で変更)' }), list, el('div', { style: { height: '170px', flex: '0 0 auto' } })]));
    };
    // ---------- 設定 ----------
    function levelCard() {
      var lvBox = el('div', { class: 'pc-lv' }), desc = el('div', { class: 'pc-lvdesc' });
      function render() { lvBox.innerHTML = ''; app.LEVELS.forEach(function (L) { lvBox.appendChild(el('button', { class: L.id === app.state.level ? 'on' : '', text: L.name, onclick: function () { app.audio.sfx('button'); app.state.level = L.id; app.saveState(); render(); } })); }); desc.textContent = app.LEVELS[app.state.level].desc; }
      render(); return el('div', { class: 'pc-card' }, [el('h3', { text: 'むずかしさ' }), lvBox, desc]);
    }
    ui.settings = function (h) {
      var s = app.settings;
      function sw(key, label, sub, dis) { var b = el('button', { class: 'pc-sw' + (s[key] ? ' on' : ''), 'aria-label': label, 'aria-pressed': s[key] ? 'true' : 'false', disabled: dis ? 'disabled' : null, onclick: function () { s[key] = !s[key]; b.classList.toggle('on', s[key]); app.saveSettings(); app.audio.sfx('button'); h.changed && h.changed(key); } }); return el('div', { class: 'pc-set' }, [el('div', {}, [document.createTextNode(label), sub ? el('small', { text: sub }) : null]), b]); }
      function seg(key, label, opts, dis, sub) { var box = el('div', { class: 'pc-seg', 'aria-disabled': dis ? 'true' : 'false' }); opts.forEach(function (o) { box.appendChild(el('button', { class: s[key] === o[0] ? 'on' : '', text: o[1], onclick: function () { s[key] = o[0]; Array.prototype.forEach.call(box.children, function (c, i) { c.classList.toggle('on', opts[i][0] === o[0]); }); app.saveSettings(); app.audio.sfx('button'); h.changed && h.changed(key); } })); }); return el('div', { class: 'pc-set' }, [el('div', {}, [document.createTextNode(label), sub ? el('small', { text: sub }) : null]), box]); }
      function range(key, label) { var r = el('input', { type: 'range', class: 'pc-range', min: 0, max: 100, value: Math.round(s[key] * 100), 'aria-label': label }); r.addEventListener('input', function () { s[key] = r.value / 100; app.saveSettings(); app.applyAudio(); }); r.addEventListener('change', function () { app.audio.sfx('button'); }); return el('div', { class: 'pc-set' }, [el('div', { text: label }), r]); }
      var autoBox = el('div');
      function renderAuto() {
        autoBox.innerHTML = '';
        autoBox.appendChild(sw('custom', '自分で細かく決める', 'オフのときは、むずかしさに合わせて自動で決まる'));
        var dis = !s.custom;
        [['art', '冠詞 a / the'], ['prep', '前置詞 at / on / in'], ['verb', '動詞の形(過去など)'], ['ti', 'to / -ing'], ['er', '-er / -est']].forEach(function (k) {
          var b = el('div', { class: 'pc-seg', 'aria-disabled': dis ? 'true' : 'false' });
          [[true, '自動'], [false, '手動']].forEach(function (o) { b.appendChild(el('button', { class: s.auto[k[0]] === o[0] ? 'on' : '', text: o[1], onclick: function () { s.auto[k[0]] = o[0]; app.saveSettings(); app.audio.sfx('button'); renderAuto(); } })); });
          autoBox.appendChild(el('div', { class: 'pc-set' }, [el('div', { text: k[1] }), b]));
        });
        autoBox.appendChild(seg('color', '色のヒント', [['pos', '品詞'], ['chunk', 'チャンク'], ['none', 'なし']], dis));
      }
      var oldCustom = h.changed; h.changed = function (k) { if (k === 'custom') renderAuto(); oldCustom && oldCustom(k); };
      renderAuto();
      var ttsNote = app.audio.ttsAvailable() ? null : el('div', { class: 'pc-ttsnote', text: 'この端末では英語の読み上げが使えないようです(字幕で表示します)' });
      var data = el('div', { class: 'pc-card' }, [el('h3', { text: 'データ' }), btn('記録をすべて消す', 'ghost small', function () { ui.confirm('記録と設定を消しますか?', 'けす', function () { app.resetData(); ui.toast('記録を消しました', 'info'); }); })]);
      return screen(el('div', { class: 'pc-scr' }, [head('設定', h.back), levelCard(),
        el('div', { class: 'pc-card' }, [el('h3', { text: '音' }), range('bgm', 'BGM'), range('sfx', '効果音'), sw('voice', '英語の読み上げ'), seg('rate', '読み上げの速さ', [[.8, 'ゆっくり'], [1, 'ふつう'], [1.15, 'はやい']]), ttsNote]),
        el('div', { class: 'pc-card' }, [el('h3', { text: 'あそびかた' }), seg('hint', 'ヒント', [['none', 'なし'], ['press', '長押し'], ['always', 'いつも']], false, '長押し:候補が目立つ(コンボ少し減)'), sw('gloss', 'チャンクの意味を表示', 'できたチャンクに日本語を小さく出す')]),
        el('div', { class: 'pc-card' }, [el('h3', { text: '自動 / 手動' }), autoBox]),
        el('div', { class: 'pc-card' }, [el('h3', { text: '演出' }), sw('lite', '軽量モード', '古い端末向けに演出をひかえめに'), sw('vibe', '振動', '対応している端末のみ')]),
        data, el('div', { style: { height: '20px', flex: '0 0 auto' } })]));
    };
    // ---------- 記録 ----------
    ui.records = function (h) {
      var tabs = el('div', { class: 'pc-tabs' }), box = el('div', { class: 'pc-card' }), sel = { m: app.MODES[0].id, l: app.state.level };
      function render() {
        tabs.innerHTML = ''; app.MODES.forEach(function (m) { tabs.appendChild(el('button', { class: m.id === sel.m ? 'on' : '', text: m.name, onclick: function () { sel.m = m.id; app.audio.sfx('button'); render(); } })); });
        box.innerHTML = '';
        var lv = el('div', { class: 'pc-lv', style: { marginBottom: '8px' } }); app.LEVELS.forEach(function (L) { lv.appendChild(el('button', { class: L.id === sel.l ? 'on' : '', text: L.name, onclick: function () { sel.l = L.id; app.audio.sfx('button'); render(); } })); });
        box.appendChild(lv);
        var listEl = el('div'); box.appendChild(listEl);
        app.services.ranking.top(sel.m, sel.l).then(function (list) {
          if (!list.length) { listEl.appendChild(el('div', { class: 'pc-empty', text: 'まだ記録がありません' })); return; }
          list.forEach(function (r, i) { listEl.appendChild(el('div', { class: 'pc-rank' }, [el('div', { class: 'n', text: String(i + 1) }), el('div', { class: 's' }, [document.createTextNode(U.fmt(r.score)), el('small', { text: '  ' + (r.sentences || 0) + '文 · ' + (r.date || '') })])])); });
        });
      }
      render();
      var st = app.lifetime();
      return screen(el('div', { class: 'pc-scr' }, [head('記録', h.back), tabs, box,
        el('div', { class: 'pc-card' }, [el('h3', { text: 'これまで' }), el('div', { class: 'pc-stats' }, [stat(st.plays, 'あそんだ回数'), stat(st.sentences, '作った文'), stat(st.maxCombo, '最大コンボ'), stat(st.longestN, 'いちばん長い文(語)')]), st.longest ? el('div', { class: 'pc-sent', style: { marginTop: '8px' } }, [el('span', { text: st.longest }), speakBtn(st.longest)]) : null])]));
    };
    function stat(v, l) { return el('div', {}, [el('b', { text: U.fmt(v || 0) }), el('small', { text: l })]); }
    function speakBtn(text) { return el('button', { 'aria-label': '読み上げ', html: icon('speaker'), onclick: function () { app.audio.unlock(); app.audio.speak(text); } }); }
    // ---------- ショップ ----------
    ui.shop = function (h) {
      var st = app.services.store, box = el('div');
      function render() {
        box.innerHTML = ''; var inv = st.inventory();
        var prem = st.isPremium();
        box.appendChild(el('div', { class: 'pc-card' }, [el('h3', { text: 'プレミアム' }), el('div', { class: 'pc-prod' }, [el('div', { class: 'ic', html: icon('star') }), el('div', { class: 'tx' }, [el('b', { text: 'プレミアム会員' }), el('small', { text: '日替わりお題+自由に使える「あき」スロット' })]), prem ? el('b', { text: '加入中', style: { color: '#3cc98a' } }) : btn(st.price('premium'), 'pink small', function () { buy('premium'); })])]));
        var items = [['hint', 'hint', 'ヒント+ ×5', '作れる文を番号で教えてくれる'], ['magic', 'magic', 'まほうバブル ×3', 'つなげたい単語に変身する'], ['auto', 'auto', 'オートくっつけ ×3', '単語を自動でチャンクにする']];
        box.appendChild(el('div', { class: 'pc-card' }, [el('h3', { text: 'アイテム' })].concat(items.map(function (it) { return el('div', { class: 'pc-prod' }, [el('div', { class: 'ic', html: icon(it[1]) }), el('div', { class: 'tx' }, [el('b', { text: it[2] }), el('small', { text: it[3] + '(所持 ' + (inv[it[0]] || 0) + ')' })]), btn(st.price(it[0]), 'yellow small', function () { buy(it[0]); })]); }))));
        if (st.isDummy) box.lastChild.appendChild(el('div', { class: 'pc-note', text: 'テスト版:実際の支払いは発生しません' }));
      }
      function buy(id) { ui.confirm(st.isDummy ? '(テスト購入)購入しますか?' : '購入しますか?', '買う', function () { st.purchase(id).then(function (ok) { if (ok) { app.audio.sfx('best'); ui.toast('ありがとう!', 'info'); app.emit('purchase', { id: id }); } else ui.toast('購入できませんでした', 'x'); render(); }); }); }
      render();
      return screen(el('div', { class: 'pc-scr' }, [head('ショップ', h.back), box]));
    };
    // ---------- クレジット ----------
    ui.credits = function (h) {
      return screen(el('div', { class: 'pc-scr' }, [head('クレジット', h.back), el('div', { class: 'pc-card pc-credits' }, [
        el('h3', { text: 'ぷにチャンク' }),
        el('p', { text: '英語を「チャンク(意味のかたまり)」でつかむ、バブルパズル。' }),
        el('p', { text: 'グラフィック・効果音・BGM・チャンクくんは、すべてプログラムで描いています。外部の素材は使っていません。' }),
        el('h3', { text: '辞書' }),
        el('p', { text: app.dictCredit }),
        el('p', { text: '英語の読み上げには、端末に内蔵された音声合成を使っています。' }),
        el('h3', { text: 'バージョン' }), el('p', { class: 'pc-en', text: 'v' + app.version })
      ])]));
    };
    // ---------- 一時停止 ----------
    ui.pause = function (h) {
      var n = el('div', { class: 'pc-modal' }, [el('div', { class: 'pc-dim' }), el('div', { class: 'pc-card' }, [el('h3', { text: 'ひと休み', style: { fontSize: '20px' } }),
        el('div', { class: 'pc-menu' }, [btn('つづける', 'wide', h.resume, 'play'), btn('やりなおす', 'ghost wide', h.retry, 'retry'), h.finish ? btn('おわる(結果へ)', 'ghost wide', h.finish) : null, btn('設定', 'ghost wide', h.settings, 'gear'), btn('タイトルへ', 'ghost wide', h.title, 'home')])])]);
      n.style.zIndex = 35; stageEl.appendChild(n); return n;
    };
    ui.confirm = function (msg, ok, fn, cancelLabel) {
      var n = el('div', { class: 'pc-modal' }, [el('div', { class: 'pc-dim' }), el('div', { class: 'pc-card' }, [el('p', { text: msg }), el('div', { class: 'pc-row' }, [btn(cancelLabel || 'やめる', 'ghost small', function () { n.remove(); }), btn(ok, 'pink small', function () { n.remove(); fn(); })])])]);
      n.style.zIndex = 50; stageEl.appendChild(n); return n;
    };
    // ---------- 結果 ----------
    ui.result = function (r, h) {
      var scoreEl = el('div', { class: 'pc-res-score', text: '0' });
      var list = el('div', { class: 'pc-list' }, r.stats.list.length ? r.stats.list.map(function (s) { return el('div', { class: 'pc-sent' }, [el('span', { text: s.text }), speakBtn(s.text)]); }) : [el('div', { class: 'pc-empty', text: '文はまだ作れなかった…次はきっと!' })]);
      var goal = r.goal ? el('div', { class: 'pc-goal' + (r.goal.done ? ' done' : '') }, [el('span', { text: r.goal.done ? '◎ お題クリア! +' + U.fmt(r.goal.bonus) : '△ お題:' + r.goal.text })]) : null;
      var n = el('div', { class: 'pc-scr' }, [
        el('div', { class: 'pc-head', style: { justifyContent: 'center' } }, [el('h2', { text: r.modeName + ' · ' + r.levelName })]),
        el('div', { class: 'pc-card', style: { textAlign: 'center' } }, [scoreEl, r.newBest ? el('div', { class: 'pc-new', text: 'NEW RECORD!' }) : el('div', { style: { fontSize: '12px', color: '#8a7da0', fontWeight: 800 }, text: r.best ? 'BEST ' + U.fmt(r.best) : '' }), r.practice ? el('div', { class: 'pc-note', text: '今日の記録はつけ済み(練習プレイ)' }) : null]),
        goal,
        el('div', { class: 'pc-card' }, [el('div', { class: 'pc-stats' }, [stat(r.stats.sentences, '作った文'), stat(r.stats.chunks, 'チャンク'), stat(r.stats.maxCombo, '最大コンボ'), stat(r.stats.longestN, 'いちばん長い文(語)')])]),
        el('div', { class: 'pc-card' }, [el('h3', { text: '作った文' }), list]),
        el('div', { class: 'pc-menu' }, [btn('もう一度', 'pink wide', h.retry, 'retry'), el('div', { class: 'pc-row' }, [btn('モード', 'ghost small', h.modes), btn('タイトル', 'ghost small', h.title, 'home')])]),
        el('div', { style: { height: '120px', flex: '0 0 auto' } })
      ]);
      screen(n);
      var t0 = performance.now(), D = 900;
      (function step() { var k = Math.min(1, (performance.now() - t0) / D); scoreEl.textContent = U.fmt(r.score * U.E.outCubic(k)); if (k < 1 && n.isConnected) requestAnimationFrame(step); })();
      return n;
    };
    // ---------- プレイ中のHUD ----------
    ui.hudShow = function (h) {
      ui.hudHide();
      var timer = el('div', { class: 'pc-timer', html: '<svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="rgba(255,255,255,.92)" stroke="#e6defa" stroke-width="5"/><circle class="arc" cx="26" cy="26" r="22" fill="none" stroke="#7b5cff" stroke-width="5" stroke-linecap="round" stroke-dasharray="138.2" stroke-dashoffset="0"/></svg><span>60</span>' });
      var score = el('b', { text: '0' }), combo = el('span', { class: 'pc-combo', text: 'x1.0' });
      hudEl = el('div', { class: 'pc-hud' }, [ib('pause', '一時停止', h.pause), el('div', { class: 'pc-score' }, [score, combo]), timer]);
      prevEl = el('div', { class: 'pc-prev' }, [el('div', { class: 'empty' })]);
      itemsEl = el('div', { class: 'pc-items' });
      stageEl.appendChild(hudEl); stageEl.appendChild(prevEl); stageEl.appendChild(itemsEl);
      ui._hud = { score: score, combo: combo, timer: timer, arc: timer.querySelector('.arc'), num: timer.querySelector('span'), last: {} };
      ui.itemsRender(h.inv(), h.useItem);
    };
    ui.hudHide = function () { ui.goal = null; [hudEl, prevEl, itemsEl].forEach(function (e) { if (e) e.remove(); }); hudEl = prevEl = itemsEl = null; ui._hud = null; ui.tip(null); };
    ui.itemsPos = function (y) { if (itemsEl) itemsEl.style.top = (y - 20) + 'px'; };
    ui.itemsRender = function (inv, use) {
      if (!itemsEl) return; itemsEl.innerHTML = '';
      [['hint', 'ヒント+'], ['magic', 'まほうバブル'], ['auto', 'オートくっつけ']].forEach(function (k) {
        var c = inv[k[0]] || 0, b = el('button', { class: c ? '' : 'zero', 'aria-label': k[1], html: icon(k[0]) + '<em>' + c + '</em>', onclick: function () { app.audio.unlock(); if (!c) { app.audio.sfx('reject'); ui.toast(k[1] + 'はショップで手に入る', 'info'); return; } use(k[0]); } });
        itemsEl.appendChild(b);
      });
    };
    ui.hud = function (o) {
      var H = ui._hud; if (!H) return; var L = H.last;
      var sc = U.fmt(o.score); if (L.score !== sc) { H.score.textContent = sc; H.score.classList.add('bump'); clearTimeout(H.bt); H.bt = setTimeout(function () { H.score.classList.remove('bump'); }, 140); L.score = sc; }
      var cb = o.combo >= 2 ? o.combo + ' COMBO  x' + o.mult.toFixed(1) : ''; if (L.cb !== cb) { H.combo.textContent = cb; H.combo.classList.toggle('on', !!cb); L.cb = cb; }
      var k, txt;
      if (o.time != null) { k = U.clamp(o.time / (o.timeMax || 60), 0, 1); txt = String(Math.ceil(o.time)); }
      else if (o.fill != null) { k = U.clamp(o.fill, 0, 1); txt = Math.round(o.fill * 100) + '%'; }
      else { k = 1; txt = '∞'; }
      var off = (138.2 * (1 - k)).toFixed(1); if (L.off !== off) { H.arc.setAttribute('stroke-dashoffset', off); L.off = off; }
      if (L.txt !== txt) { H.num.textContent = txt; L.txt = txt; }
      var col = o.warn ? '#ef4d63' : o.fill != null ? '#f5a524' : '#7b5cff'; if (L.col !== col) { H.arc.setAttribute('stroke', col); L.col = col; }
      if (L.warn !== o.warn) { H.timer.classList.toggle('warn', !!o.warn); L.warn = o.warn; }
    };
    ui.preview = function (text, state, sub) {
      if (!prevEl) return; var d = prevEl.firstChild;
      if (!text) { if (ui.goal) { d.className = 'goal'; d.innerHTML = ''; d.appendChild(el('i', { text: '★' })); d.appendChild(el('small', { text: 'お題:' + ui.goal })); } else d.className = 'empty'; return; }
      var mark = state === 'ok' ? '✓' : state === 'bad' ? '×' : state === 'sel' ? '●' : '…';
      d.className = state || ''; d.innerHTML = ''; d.appendChild(el('i', { text: mark })); d.appendChild(el('span', { text: text })); if (sub) d.appendChild(el('small', { text: sub }));
    };
    var toastEl = null;
    ui.toast = function (msg, kind) {
      if (toastEl) toastEl.remove();
      toastEl = el('div', { class: 'pc-toast ' + (kind || 'info') }, [el('i', { text: kind === 'x' ? '×' : kind === 'tri' ? '△' : '!' }), el('span', { text: msg })]);
      stageEl.appendChild(toastEl); var t = toastEl; setTimeout(function () { if (t === toastEl) { t.remove(); toastEl = null; } }, 2300);
    };
    var banEl = null;
    ui.banner = function (text, marks, pts, o) {
      o = o || {};
      if (banEl) banEl.remove();
      var html = esc(text);
      (marks || []).forEach(function (m) { var re = new RegExp('\\b(' + m.replace(/(es|s)$/, '') + ')(es|s)\\b'); html = html.replace(re, '$1<u>$2</u>'); });
      banEl = el('div', { class: 'pc-banner' }, [el('div', { html: '<span class="ok">' + icon('check') + '</span>' + html + '<small>' + (o.perfect ? '<b class="pf">PERFECT!</b> ' : '') + '+' + U.fmt(pts) + (o.slot ? '  スロット×' + o.slot.toFixed(1) : '') + (o.shock ? '  余波×' + o.shock : '') + '</small>' })]);
      stageEl.appendChild(banEl); var b = banEl; setTimeout(function () { if (b === banEl) { b.remove(); banEl = null; } }, 2200);
    };
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var cntEl = null;
    ui.count = function (text, big) { if (cntEl) cntEl.remove(); cntEl = el('div', { class: 'pc-count' + (big || text.length > 2 ? ' big' : ''), text: text }); stageEl.appendChild(cntEl); var c = cntEl; setTimeout(function () { if (c === cntEl) { c.remove(); cntEl = null; } }, big ? 1450 : 820); };
    var tipEl = null;
    ui.tip = function (text, gloss, x, y) {
      if (!text) { if (tipEl) { tipEl.remove(); tipEl = null; } return; }
      if (!tipEl) { tipEl = el('div', { class: 'pc-tip' }); stageEl.appendChild(tipEl); }
      tipEl.innerHTML = ''; tipEl.appendChild(document.createTextNode(text)); if (gloss) tipEl.appendChild(el('small', { text: gloss }));
      var W = stageEl.clientWidth, half = Math.min(W / 2 - 8, (tipEl.offsetWidth || 120) / 2 + 2);
      tipEl.style.left = U.clamp(x, half + 4, W - half - 4) + 'px'; tipEl.style.top = Math.max(y, 120) + 'px';
    };
    ui.say = function (html, o) {
      ui.unsay(); o = o || {};
      var row = el('div', { class: 'row' }, [o.next ? btn(o.nextLabel || 'つぎへ', 'small', o.next) : null]);
      var n = el('div', { class: 'pc-say', style: { bottom: (o.bottom || 140) + 'px' } }, [el('p', { html: html }), o.next ? row : null]);
      stageEl.appendChild(n); ui._say = n; return n;
    };
    ui.unsay = function () { if (ui._say) { ui._say.remove(); ui._say = null; } };
    ui.skip = function (fn) { var b = btn('スキップ', 'ghost small pc-skip', fn); stageEl.appendChild(b); ui._skip = b; return b; };
    ui.unskip = function () { if (ui._skip) { ui._skip.remove(); ui._skip = null; } };
    ui.destroy = function () { ui.hudHide(); ui.unsay(); ui.unskip(); stageEl.innerHTML = ''; };
    return ui;
  }
  return { create: create, injectCSS: injectCSS, removeCSS: removeCSS };
})();
