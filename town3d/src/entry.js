export { mount } from './main.js';
export { createLocalNet, createWsNet } from './core/net.js';
export { createStorage } from './core/core.js';

// どの版か一目で分かるように、画面の左下に小さく出す(ビルドした日時と版番号)
try { const v = document.createElement('div'); v.textContent = 'ver ' + __BUILD__; v.style.cssText = 'position:fixed;left:6px;bottom:4px;z-index:99999;font:10px/1 monospace;color:#fff;background:rgba(0,0,0,.45);padding:2px 5px;border-radius:6px;pointer-events:none'; document.body.appendChild(v); } catch (e) { }
