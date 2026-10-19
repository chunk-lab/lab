/* 効果音と声。音は2種類：
   ・電子音（tone）… ファイルなし。判定の音など
   ・mp3（assets/audio/se, voice）… ボタンの声・コンボの声など。読み込んでから、共通の「効果音」の音量（core.sound.sfxBus）に流す
   音が大きすぎたので、mp3は元の音量の約3割（−10dB）に下げて鳴らす（FILE_GAIN）。全体の大きさは共通設定の「効果音」でも変えられる */
import { ENV, settings, tone, unlockAudio } from './engine.js';
export const FILE_GAIN = 0.3;
export const VOICE_RATE = 0.5;   // 声のmp3は効果音のさらに半分の大きさ
const FILES = ['se/mode_game', 'se/mode_study', 'se/btn_sarasara', 'se/btn_yoidon', 'se/btn_lesson', 'voice/chunk', 'voice/combo', 'voice/adjective', 'voice/adverb', 'voice/verb', 'voice/noun', 'voice/perfect', 'voice/nice', 'voice/yes', 'voice/good', 'voice/excellent', 'voice/wow', 'voice/stage_clear', 'voice/try_again'];
const BUF = {}, LAST = {};
let curVoice = null;
const sT = (f, d, t, v, s) => () => tone(f, d, t, v, s);
const sSeq = (list, gap, type, vol) => () => list.forEach((f, i) => setTimeout(() => tone(f, .11, type || 'triangle', vol || .11), i * gap));
const SYN = {
  'se/tap': sT(900, .04, 'triangle', .07),
  'se/back': () => { tone(620, .05, 'triangle', .07); setTimeout(() => tone(460, .06, 'triangle', .07), 45); },
  'se/open': () => { tone(520, .05, 'sine', .08); setTimeout(() => tone(780, .07, 'sine', .08), 45); },
  'se/close': () => { tone(780, .05, 'sine', .07); setTimeout(() => tone(520, .07, 'sine', .07), 45); },
  'se/forgot': () => { tone(230, .13, 'square', .05, .6); setTimeout(() => tone(170, .16, 'square', .05, .6), 110); },
  'se/sentence_clear': sSeq([660, 880, 1100], 70, 'sine', .1),
  'voice/perfect': () => { sSeq([784, 988, 1175, 1568], 60, 'triangle', .12)(); setTimeout(() => tone(2093, .25, 'sine', .07), 300); },
  'se/bonus': () => { tone(1046, .09, 'sine', .1); setTimeout(() => tone(1568, .14, 'sine', .09), 80); },
  'se/combo3': sSeq([784, 988], 65), 'se/combo6': sSeq([784, 988, 1175], 65), 'se/combo9': sSeq([784, 988, 1175, 1568], 65, 'triangle', .13),
  'se/count5': sT(1000, .06, 'square', .06),
  'se/timeup': () => { [880, 660, 440].forEach((f, i) => setTimeout(() => tone(f, .16, 'triangle', .12), i * 170)); setTimeout(() => tone(220, .4, 'sawtooth', .07, .8), 540); },
  'se/newbest': () => { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, .12, 'triangle', .12), i * 90)); setTimeout(() => { tone(1046, .45, 'sine', .09); tone(1318, .45, 'sine', .07); }, 500); },
  'se/study_wordtap': sT(1100, .035, 'triangle', .06),
  'se/study_correct': sSeq([880, 1320], 70, 'sine', .11),
  'se/study_wrong': sT(200, .18, 'sawtooth', .05, .7),
  'se/study_page': sT(700, .04, 'triangle', .06),
  'se/study_submit': sSeq([660, 880, 1320], 75, 'sine', .1)
};
function load(name) {
  if (BUF[name]) return BUF[name];
  const ac = ENV.core.sound.ctx();
  return BUF[name] = fetch(ENV.ctx.base + 'audio/' + name + '.mp3').then(r => r.arrayBuffer()).then(b => new Promise((ok, ng) => ac.decodeAudioData(b, ok, ng))).catch(() => null);
}
export function stopSfxVoice() { try { curVoice && curVoice.stop(); } catch (e) { } curVoice = null; }
function playFile(name) {
  const isVoice = name.startsWith('voice/');
  load(name).then(buf => {
    if (!buf || !ENV.root || settings.mute) return;
    const ac = ENV.core.sound.ctx(), src = ac.createBufferSource(), g = ac.createGain();
    src.buffer = buf; g.gain.value = isVoice ? FILE_GAIN * VOICE_RATE : FILE_GAIN; src.connect(g).connect(ENV.core.sound.sfxBus);
    if (isVoice) { stopSfxVoice(); curVoice = src; }
    src.start();
  });
}
export function sfx(name) {
  const m = settings.sound || 'both';
  if (m === 'off' || settings.mute) return;
  if (m === 'voice' && !name.startsWith('voice/')) return;
  if (m === 'sfx' && name.startsWith('voice/')) return;   // 声をオフにしている時
  const now = performance.now(); if (now - (LAST[name] || 0) < 120) return; LAST[name] = now;   // 同じ音が連続して重ならないように
  try { unlockAudio(); } catch (e) { }
  if (FILES.includes(name)) { playFile(name); return; }
  const f = SYN[name]; if (f) try { f(); } catch (e) { }
}
/* 使い始めに、よく使う音を先に読み込んでおく */
export function preloadSfx() { try { ENV.core.sound.ctx(); FILES.forEach(load); } catch (e) { } }
/* ボタンを押した音（区切るボタンは判定の音が鳴るので除く。専用の声があるボタンも除く） */
export function initSfx() {
  const h = e => {
    const b = e.target.closest && e.target.closest('button');
    if (!b || !ENV.root || !ENV.root.contains(b) || b.id === 'cutBtn' || b.dataset.nosfx || b.disabled) return;
    if (b.dataset.play || b.dataset.study === 'make') return;
    sfx(/^[←‹＜]|戻る|もどる|閉じる|やめる/.test((b.textContent || '').trim()) ? 'se/back' : 'se/tap');
  };
  document.addEventListener('click', h, true); ENV.offs.push(() => document.removeEventListener('click', h, true));
}
