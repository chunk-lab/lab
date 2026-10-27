export { mount } from './main.js';
export { createLocalNet, createWsNet } from './core/net.js';
export { createStorage } from './core/core.js';

// どの版か一目で分かるように、画面の上の真ん中に出す(ビルドした日時と版番号)。端が切れる端末でも見えるように、中央・安全領域の内側
try { const v = document.createElement('div'); v.textContent = 'ver ' + __BUILD__; v.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 62px);z-index:99999;font:bold 12px/1 monospace;color:#fff;background:rgba(220,40,80,.85);padding:4px 9px;border-radius:8px;pointer-events:none;white-space:nowrap'; document.body.appendChild(v); } catch (e) { }
