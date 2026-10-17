import { U } from './util.js';
/* ===== audio.js:効果音・BGM(すべて Web Audio で生成)と読み上げ ===== */
export var Snd = (function () {
  'use strict';
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function create(opts) {
    var A = { ctx: null, vol: { bgm: .55, sfx: .8 }, on: { bgm: true, sfx: true, voice: true }, rate: 1, track: null, intensity: 0, dead: false };
    var master, comp, sfxBus, bgmBus, noiseBuf, timer = null, seq = null, voices = [], voice = null;
    function ensure() {
      if (A.ctx || A.dead) return A.ctx;
      var CORE = opts && opts.core, c;
      if (CORE) c = CORE.sound.ctx(); else { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { c = new AC(); } catch (e) { return null; } }
      if (!c) return null; A.ctx = c;
      sfxBus = c.createGain(); bgmBus = c.createGain();
      if (CORE) {   /* 共通の音量（効果音・BGM）の手前につなぐ。音量そのものは共通の設定が決める */
        var cs = c.createDynamicsCompressor(); cs.threshold.value = -14; cs.ratio.value = 4; cs.attack.value = .005; cs.release.value = .2;
        sfxBus.connect(cs); cs.connect(CORE.sound.sfxBus); bgmBus.connect(CORE.sound.bgmBus);
        sfxBus.gain.value = .9; bgmBus.gain.value = .5; master = comp = null;
      } else {
        master = c.createGain(); master.gain.value = .9;
        comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .005; comp.release.value = .2;
        master.connect(comp); comp.connect(c.destination); sfxBus.connect(master); bgmBus.connect(master); applyVol();
      }
      noiseBuf = c.createBuffer(1, c.sampleRate * .5, c.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return c;
    }
    function applyVol() { if (!A.ctx || (opts && opts.core)) return; var t = A.ctx.currentTime; sfxBus.gain.setTargetAtTime(A.on.sfx ? A.vol.sfx : 0, t, .02); bgmBus.gain.setTargetAtTime(A.on.bgm ? A.vol.bgm * .5 : 0, t, .05); }
    // ---- 音の部品 ----
    function tone(o) {
      var c = A.ctx; if (!c) return; var t = (o.t || c.currentTime), dur = o.d || .2;
      var osc = c.createOscillator(), g = c.createGain(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
      if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + (o.glide || dur));
      if (o.det) osc.detune.value = o.det;
      var v = o.v == null ? .3 : o.v, a = o.a || .005;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      var node = g;
      if (o.lp) { var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || .7; g.connect(f); node = f; }
      osc.connect(g); node.connect(o.bus || sfxBus); osc.start(t); osc.stop(t + dur + .05);
    }
    function noise(o) {
      var c = A.ctx; if (!c) return; var t = o.t || c.currentTime, dur = o.d || .1;
      var s = c.createBufferSource(); s.buffer = noiseBuf; var f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.value = o.f || 2000; f.Q.value = o.q || 1;
      var g = c.createGain(); g.gain.setValueAtTime(o.v || .2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(o.bus || sfxBus); s.start(t, Math.random() * .3); s.stop(t + dur + .02);
    }
    function pop(t, f, v) { tone({ t: t, f: f || 900, f2: (f || 900) * .35, d: .09, glide: .07, v: v || .25, type: 'sine' }); noise({ t: t, f: 3000, q: 2, d: .03, v: (v || .25) * .4 }); }
    function bell(t, m, v, d) { tone({ t: t, f: mtof(m), d: d || .5, v: v || .14, type: 'sine' }); tone({ t: t, f: mtof(m + 12), d: (d || .5) * .6, v: (v || .14) * .35, type: 'sine' }); tone({ t: t, f: mtof(m) * 2.76, d: .12, v: (v || .14) * .2, type: 'sine' }); }
    var SFX = {
      tap: function (p) { var c = A.ctx, t = c.currentTime, m = 72 + PENTA[Math.min(PENTA.length - 1, p || 0)]; pop(t, mtof(m) * 1.6, .16); bell(t + .005, m, .13, .3); },
      cycle: function () { var t = A.ctx.currentTime; tone({ t: t, f: 1300, f2: 1800, d: .06, v: .12, type: 'square', lp: 3000 }); tone({ t: t + .05, f: 1700, d: .06, v: .1, type: 'triangle' }); },
      link: function (p) { var t = A.ctx.currentTime, m = 67 + PENTA[Math.min(PENTA.length - 1, p || 0)]; bell(t, m, .16, .45); pop(t, 600, .12); },
      chunk: function (p) { var t = A.ctx.currentTime, m = 72 + PENTA[Math.min(8, (p || 2) + 2)]; pop(t, 520, .3); tone({ t: t, f: 180, f2: 90, d: .18, v: .2, type: 'sine' }); bell(t + .06, m, .16, .5); bell(t + .14, m + 7, .13, .6); },
      sentence: function (p) { var t = A.ctx.currentTime, base = 72, ch = [0, 4, 7, 12, 16, 19, 24]; for (var i = 0; i < Math.min(7, 3 + (p || 2)); i++) { bell(t + i * .07, base + ch[i], .15, .8); tone({ t: t + i * .07, f: mtof(base + ch[i] - 12), d: .25, v: .07, type: 'triangle' }); } noise({ t: t + .35, f: 8000, q: .5, d: .5, v: .08, ft: 'highpass' }); tone({ t: t, f: 110, f2: 55, d: .4, v: .25, type: 'sine' }); },
      reject: function () { var t = A.ctx.currentTime; tone({ t: t, f: 240, f2: 150, d: .14, v: .22, type: 'triangle' }); },
      fail: function () { var t = A.ctx.currentTime; tone({ t: t, f: 440, f2: 330, d: .2, v: .16, type: 'triangle' }); tone({ t: t + .18, f: 330, f2: 220, d: .3, v: .16, type: 'triangle' }); },
      tri: function () { var t = A.ctx.currentTime; tone({ t: t, f: 520, d: .14, v: .14, type: 'triangle' }); tone({ t: t + .12, f: 440, d: .22, v: .14, type: 'triangle' }); },
      scatter: function () { var t = A.ctx.currentTime; for (var i = 0; i < 4; i++) pop(t + i * .045, 500 + Math.random() * 700, .1); },
      select: function () { var t = A.ctx.currentTime; tone({ t: t, f: 880, f2: 1320, d: .1, v: .12, type: 'sine' }); },
      slot: function () { var t = A.ctx.currentTime; tone({ t: t, f: 200, f2: 120, d: .12, v: .28, type: 'sine' }); noise({ t: t, f: 1500, q: 1, d: .04, v: .12 }); },
      ready: function () { var t = A.ctx.currentTime;[0, 4, 7, 12].forEach(function (s, i) { bell(t + i * .05, 79 + s, .08, .35); }); },
      tick: function () { var t = A.ctx.currentTime; tone({ t: t, f: 1500, d: .04, v: .12, type: 'square', lp: 2500 }); },
      extend: function () { var t = A.ctx.currentTime;[0, 7, 12].forEach(function (s, i) { tone({ t: t + i * .04, f: mtof(84 + s), d: .2, v: .06, type: 'sine' }); }); },
      combo: function (p) { var t = A.ctx.currentTime, m = 79 + Math.min(12, p || 0); bell(t, m, .12, .4); bell(t + .06, m + 5, .1, .4); },
      insert: function () { var t = A.ctx.currentTime; tone({ t: t, f: 300, f2: 700, d: .12, v: .2, type: 'sine' }); pop(t + .08, 1100, .14); },
      button: function () { var t = A.ctx.currentTime; tone({ t: t, f: 660, f2: 990, d: .07, v: .14, type: 'sine' }); },
      count: function (p) { var t = A.ctx.currentTime; tone({ t: t, f: p ? 784 : 1175, d: p ? .18 : .5, v: .2, type: 'triangle' }); },
      end: function () { var t = A.ctx.currentTime;[84, 79, 76, 72].forEach(function (m, i) { bell(t + i * .12, m, .14, .6); }); },
      best: function () { var t = A.ctx.currentTime;[72, 76, 79, 84, 79, 84, 88].forEach(function (m, i) { bell(t + i * .1, m, .15, .7); tone({ t: t + i * .1, f: mtof(m - 24), d: .2, v: .08, type: 'triangle' }); }); },
      pop: function () { pop(A.ctx.currentTime, 700 + Math.random() * 500, .18); },
      warn: function () { var t = A.ctx.currentTime; tone({ t: t, f: 330, d: .12, v: .15, type: 'square', lp: 1200 }); }
    };
    // ---- BGM(手続き生成のシーケンサ) ----
    var PROG = { // 4小節の和音(ルートのMIDI)と3和音
      play: [[48, [0, 4, 7]], [43, [0, 4, 7]], [45, [0, 3, 7]], [41, [0, 4, 7]]],
      title: [[41, [0, 4, 7, 11]], [43, [0, 4, 7]], [40, [0, 3, 7]], [45, [0, 3, 7]]],
      result: [[48, [0, 4, 7, 11]], [41, [0, 4, 7, 11]], [43, [0, 4, 7]], [48, [0, 4, 7]]]
    };
    var MEL = { // 16分×16 を4小節。数字=和音ルート+半音、null=休み
      play: [[12, null, 16, null, 19, null, 16, 14, 12, null, null, 9, 12, null, null, null], [11, null, 14, null, 19, null, 14, 12, 11, null, 7, null, 11, null, null, null], [12, null, 15, null, 19, 17, 15, null, 12, null, 15, null, 19, null, null, null], [12, null, 16, 19, 21, null, 19, 16, 19, null, 16, null, 14, null, 12, null]],
      title: [[16, null, null, null, 19, null, 21, null, 19, null, null, null, 16, null, null, null], [14, null, null, null, 19, null, 16, null, 14, null, null, null, null, null, null, null], [15, null, null, null, 19, null, 22, null, 19, null, 15, null, null, null, null, null], [12, null, null, null, 16, null, 19, null, 21, null, null, null, 19, null, null, null]],
      result: [[19, null, 16, null, 12, null, 16, null, 19, null, 24, null, null, null, null, null], [16, null, 14, null, 12, null, 9, null, 12, null, null, null, null, null, null, null], [14, null, 16, null, 19, null, 14, null, 11, null, null, null, null, null, null, null], [12, null, 16, null, 19, null, 24, null, null, null, null, null, null, null, null, null]]
    };
    var BPM = { play: 120, title: 92, result: 88 };
    function music(name) {
      if (A.track === name) return; A.track = name; stopSeq();
      if (!name || !ensure()) return;
      seq = { name: name, step: 0, next: A.ctx.currentTime + .08 };
      timer = setInterval(schedule, 25);
    }
    function stopSeq() { if (timer) clearInterval(timer); timer = null; seq = null; }
    function schedule() {
      if (!seq || !A.ctx || A.ctx.state !== 'running') return;
      var c = A.ctx, spb = 60 / BPM[seq.name] / 4;
      while (seq.next < c.currentTime + .14) { playStep(seq.name, seq.step, seq.next, spb); seq.step = (seq.step + 1) % 64; seq.next += spb; }
    }
    function playStep(name, step, t, spb) {
      var bar = Math.floor(step / 16), s = step % 16, ch = PROG[name][bar], root = ch[0], I = name === 'play' ? A.intensity : .3, B = bgmBus;
      if (name === 'play') {
        if (s % 4 === 0) tone({ t: t, f: mtof(root - 12), d: spb * 3, v: .34, type: 'triangle', bus: B, lp: 600 });
        if (s % 4 === 2) tone({ t: t, f: mtof(root), d: spb * 1.4, v: .16, type: 'triangle', bus: B, lp: 900 });
        if (s % 8 === 4 || s % 8 === 7 && I > .5) ch[1].forEach(function (iv) { tone({ t: t, f: mtof(root + 12 + iv), d: spb * 1.8, v: .045, type: 'square', bus: B, lp: 1800, det: 4 }); });
        if (s % 4 === 0) { tone({ t: t, f: 150, f2: 45, d: .22, glide: .12, v: .5, type: 'sine', bus: B }); }
        if (s % 8 === 4) noise({ t: t, f: 1800, q: .7, d: .12, v: .16, bus: B });
        if (s % 2 === 1 || I > .6) noise({ t: t, f: 9000, q: .5, d: .035, v: .05 + I * .04, ft: 'highpass', bus: B });
        if (I > .3 && s % 2 === 0) { var ar = ch[1][(s / 2) % ch[1].length]; tone({ t: t, f: mtof(root + 24 + ar), d: spb * 1.2, v: .035 + I * .03, type: 'sine', bus: B }); }
      } else {
        if (s === 0) ch[1].forEach(function (iv) { tone({ t: t, f: mtof(root + 12 + iv), d: spb * 15, a: .3, v: .05, type: 'triangle', bus: B, lp: 1400 }); });
        if (s % 8 === 0) tone({ t: t, f: mtof(root - 12), d: spb * 7, v: .22, type: 'sine', bus: B });
        if (s % 4 === 2) { var ar2 = ch[1][(s / 4 | 0) % ch[1].length]; tone({ t: t, f: mtof(root + 24 + ar2), d: spb * 3, v: .04, type: 'sine', bus: B }); }
      }
      var m = MEL[name][bar][s]; if (m != null) { var mm = root + 12 + m + (name === 'play' ? 0 : 12); tone({ t: t, f: mtof(mm), d: spb * (name === 'play' ? 2.2 : 3.5), v: name === 'play' ? .085 : .07, type: name === 'play' ? 'square' : 'triangle', bus: B, lp: name === 'play' ? 2600 : 3000 }); tone({ t: t, f: mtof(mm + 12), d: spb * 1.5, v: .025, type: 'sine', bus: B }); }
    }
    // ---- 読み上げ ----
    var ttsOK = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
    function pickVoice() {
      if (!ttsOK) return; voices = speechSynthesis.getVoices() || [];
      var en = voices.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
      var pref = [/Samantha/i, /Google US English/i, /Aria/i, /Jenny/i, /Ava/i, /Allison/i, /Zira/i, /en-US/i];
      voice = null;
      for (var i = 0; i < pref.length && !voice; i++) voice = en.filter(function (v) { return pref[i].test(v.name) || pref[i].test(v.lang); })[0] || null;
      voice = voice || en[0] || null;
    }
    if (ttsOK) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { } }
    function speak(text, o) {
      if (opts && opts.core) { if (A.dead || !text) return false; opts.core.speech.speak(text, { rate: o && o.rate }); return true; }
      if (!ttsOK || !A.on.voice || A.dead || !text) return false;
      try {
        if (!voice) pickVoice();
        if (speechSynthesis.paused) speechSynthesis.resume(); // Chrome は長く使わないと一時停止のまま固まることがある
        if ((!o || !o.queue) && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; if (voice) u.voice = voice; u.rate = (o && o.rate) || A.rate; u.pitch = 1.05; u.volume = 1;
        speechSynthesis.speak(u); return true;
      } catch (e) { return false; }
    }
    // iPhone などは、最初の読み上げを「タップの中」で呼ばないと、以後の読み上げが全部無音になる。最初のタップで無音の読み上げをして解錠する
    var ttsPrimed = false;
    A.unlock = function () {
      var c = ensure(); if (c && c.state === 'suspended') c.resume();
      if (!ttsOK) return; if (!voice) pickVoice();
      if (!ttsPrimed) { ttsPrimed = true; try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'en-US'; speechSynthesis.speak(u); } catch (e) { } }
      else if (speechSynthesis.paused) { try { speechSynthesis.resume(); } catch (e) { } }
    };
    A.sfx = function (name, p) { if (!A.on.sfx || !ensure() || A.ctx.state !== 'running') return; try { SFX[name] && SFX[name](p); } catch (e) { } };
    A.music = music;
    A.setIntensity = function (x) { A.intensity = U.clamp(x, 0, 1); };
    A.set = function (o) { if (opts && opts.core) return; if (o.vol) Object.assign(A.vol, o.vol); if (o.on) Object.assign(A.on, o.on); if (o.rate) A.rate = o.rate; applyVol(); if (!A.on.voice && ttsOK) speechSynthesis.cancel(); };
    A.speak = speak; A.ttsAvailable = function () { if (opts && opts.core) return true; return ttsOK && (!!voice || !voices.length); };
    A.suspend = function () { if (opts && opts.core) { opts.core.speech.stop(); return; } if (A.ctx && A.ctx.state === 'running') A.ctx.suspend(); if (ttsOK) speechSynthesis.cancel(); };
    A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); };
    A.destroy = function () { A.dead = true; stopSeq(); if (ttsOK) { try { speechSynthesis.cancel(); speechSynthesis.removeEventListener('voiceschanged', pickVoice); } catch (e) { } } if (A.ctx) { if (opts && opts.core) { try { sfxBus.disconnect(); bgmBus.disconnect(); opts.core.speech.stop(); } catch (e) { } } else { try { A.ctx.close(); } catch (e) { } } } A.ctx = null; };
    if (opts) A.set(opts);
    return A;
  }
  return { create: create };
})();
