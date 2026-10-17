/* 街・単体アプリとのつなぎ（もとは1ページだけで動いていたので、ここで出入りを管理する）
   onDoc / onWin：読み込み時に付けていた document / window の受け口。開いている間だけ付く
   onTick：読み込み時に始めていた setInterval。開いている間だけ動く
   ENV：共通の部品（セーブ・読み上げ など）と、いま入っている箱 */
export const ENV = { root: null, ctx: null, core: null, store: null, mounted: false };
const L = [], T = [];
export function onDoc(type, fn, opt) { L.push([document, type, fn, opt]); if (ENV.mounted) document.addEventListener(type, fn, opt); }
export function onWin(type, fn, opt) { L.push([window, type, fn, opt]); if (ENV.mounted) window.addEventListener(type, fn, opt); }
export function onTick(fn, ms) { const t = { fn, ms, id: 0 }; T.push(t); if (ENV.mounted) t.id = setInterval(fn, ms); return t; }
export function attach() { ENV.mounted = true; L.forEach(([o, ty, f, op]) => o.addEventListener(ty, f, op)); T.forEach(t => { t.id = setInterval(t.fn, t.ms); }); }
export function detach() { ENV.mounted = false; L.forEach(([o, ty, f, op]) => o.removeEventListener(ty, f, op)); T.forEach(t => { clearInterval(t.id); t.id = 0; }); }
