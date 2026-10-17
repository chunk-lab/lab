/* 音：効果音（Web Audio で生成）と英語の読み上げ。音量・読み上げは全アプリ共通の設定（core）に従う。 */
export function bindCore(c) { CORE = c; }
export var CORE = null;
    export function ac() { return CORE ? CORE.sound.ctx() : null; }
  export function beep(f, d, type, v, when) { var c = ac(); if (!c) return; var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v || .12, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(CORE.sound.sfxBus); o.start(t); o.stop(t + d + .02); }
  // 柔らかい音:鈴のような高音(sine)と、カード・チップの「カチッ」(短いノイズ)
  export var NB = null;
  export function noise(d, f, q, v, when) { var c = ac(); if (!c) return; if (!NB) { NB = c.createBuffer(1, c.sampleRate * .3, c.sampleRate); var a = NB.getChannelData(0); for (var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
    var t = c.currentTime + (when || 0), sN = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); sN.buffer = NB; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); sN.connect(bp); bp.connect(g); g.connect(CORE.sound.sfxBus); sN.start(t); sN.stop(t + d + .02); }
  export function bell(f, d, v, when) { beep(f, d, 'sine', v, when); beep(f * 2.01, d * .6, 'sine', v * .25, when); }
  export var SFX = {
    tap: function () { noise(.04, 3200, 2, .12); },
    put: function () { noise(.06, 2200, 1.2, .18); noise(.05, 900, 1, .08, .01); },
    chip: function (i) { noise(.05, 2600 + i * 60, 6, .16); bell(880 + i * 30, .12, .03, .01); },
    mult: function () { bell(523, .35, .08); bell(784, .4, .06, .05); },
    joker: function () { bell(1175, .45, .07); bell(1568, .5, .05, .08); },
    bad: function () { beep(196, .25, 'triangle', .06); beep(185, .3, 'triangle', .05, .08); },
    win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { bell(f, .9, .07, i * .09); }); },
    coin: function () { noise(.05, 4200, 8, .14); bell(2093, .25, .04, .02); },
    lose: function () { [392, 330, 262].forEach(function (f, i) { bell(f, .8, .07, i * .2); }); }
  };
/* 最初のタップで音を使えるようにする（iPhone など） */
export function unlock() { ac(); }
export function speak(t) { if (CORE) CORE.speech.speak(t, { rate: .95 }); }
