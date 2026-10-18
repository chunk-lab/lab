/* BGM（assets/audio/bgm の mp3）。画面の状態を見て、鳴らす曲を自動で切りかえる
   title＝入口／game＝ゲーム中（60秒チャレンジ含む）／game30＝30秒チャレンジ／result＝結果／study＝リーディング・練習・レッスンなど
   mean は各ファイルの平均音量(dB)。曲ごとの大きさの差をそろえるために使う。
   音が大きすぎたので、前の版より 約6dB 小さくした（BGM_TARGET）。全体の大きさは共通設定の「BGM」でも変えられる */
import { ENV, settings, $, unlockAudio, S } from './engine.js';
import { setMute } from './engine.js';
const FILES = { title: { f: 'title.mp3', mean: -16.1 }, game: { f: 'game.mp3', mean: -13.8 }, game30: { f: 'game30.mp3', mean: -15.2 }, result: { f: 'result.mp3', mean: -19.1 }, study: { f: 'study.mp3', mean: -19.0 } };
const BGM_TARGET = { low: -37, mid: -31 };   // 鳴らすときの平均音量(dB)。前の版は 小さめ −31／ふつう −25
let NODES = {}, cur = null, timer = 0, btn = null;
function level(k) { const m = settings.bgm || 'low'; if (!BGM_TARGET[m]) return 0; return Math.min(1, Math.pow(10, (BGM_TARGET[m] - FILES[k].mean) / 20)); }
function node(k) {
  if (NODES[k]) return NODES[k];
  const a = new Audio(ENV.ctx.base + 'audio/bgm/' + FILES[k].f); a.loop = true; a.preload = 'auto';
  const n = { a, g: null };
  try { const ac = ENV.core.sound.ctx(), src = ac.createMediaElementSource(a), g = ac.createGain(); g.gain.value = 0; src.connect(g).connect(ENV.core.sound.bgmBus); n.g = g; } catch (e) { a.volume = .1; }
  return NODES[k] = n;
}
function setVol(n, v, sec) { if (n.g) { try { const t = ENV.core.sound.ctx().currentTime; n.g.gain.cancelScheduledValues(t); n.g.gain.setTargetAtTime(v, t, sec / 3); } catch (e) { } } else n.a.volume = Math.min(1, v * .5); }
function wanted() {
  if (!ENV.root || settings.mute || (settings.bgm || 'low') === 'off' || document.hidden) return null;
  if ((ENV.make && ENV.make.visible()) || (ENV.story && ENV.story.visible())) return 'study';   // 文を作るレッスン
  const ti = $('title'); if (ti && !ti.hidden) return 'title';
  try { if (ENV.core.reader.isOpen) return 'study'; } catch (e) { }
  if ($('edView') && !$('edView').hidden) return 'study';
  if (S) { if (S.phase === 'done') return 'result'; if (S.studyMode) return 'study'; return S.timed && S.timed.sec === 30 ? 'game30' : 'game'; }
  return 'title';
}
function hint(on) { if (btn) btn.classList.toggle('bgmWait', !!on); }
export function bgmTick() {
  if (!ENV.root) return;
  let ac = null; try { ac = ENV.core.sound.ctx(); if (ac && ac.state === 'suspended') ac.resume().catch(() => { }); } catch (e) { }
  if (!ac) return;
  const want = wanted();
  if (want === cur) { if (want) { const n = node(want); if (n.a.paused) n.a.play().catch(() => { }); setVol(n, level(want), .4); hint(n.a.paused || ac.state !== 'running'); } else hint(false); return; }
  if (cur) { const o = node(cur); setVol(o, 0, .6); const oa = o.a; setTimeout(() => { if (cur !== Object.keys(NODES).find(k => NODES[k] === o)) oa.pause(); }, 900); }
  cur = want;
  if (want) { const n = node(want); if (want !== 'study') { try { n.a.currentTime = 0; } catch (e) { } } n.a.play().catch(() => { }); setVol(n, level(want), .8); } else hint(false);
}
export function bgmMuteDraw() { if (!btn) return; const off = !!settings.mute; btn.textContent = off ? '🔇' : '🎵'; btn.setAttribute('aria-label', off ? '音を入れる' : '音をぜんぶ消す'); btn.title = btn.getAttribute('aria-label'); }
/* 開くときに呼ぶ（左はしの 🎵 ボタンと、画面のタップで音を始める仕組み） */
export function initBgm(el) {
  NODES = {}; cur = null;
  btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ccBgmMute'; btn.dataset.nosfx = '1';
  btn.onclick = () => setMute(!settings.mute);
  el.appendChild(btn); bgmMuteDraw();
  const g = () => { try { unlockAudio(); } catch (e) { } bgmTick(); };
  ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'].forEach(ev => { document.addEventListener(ev, g, true); ENV.offs.push(() => document.removeEventListener(ev, g, true)); });
  timer = setInterval(bgmTick, 400);
  ENV.offs.push(() => { clearInterval(timer); stopBgm(); });
}
function stopBgm() { Object.values(NODES).forEach(n => { try { n.a.pause(); n.a.src = ''; } catch (e) { } }); NODES = {}; cur = null; if (btn) { btn.remove(); btn = null; } }
