// 効果音と環境音(Web Audio だけで作る。音声ファイルなし)
export function createAudio() {
  let ac = null, master = null, amb = null;
  const vol = { bgm: 0.5, sfx: 0.7, voice: true };
  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC(); master = ac.createGain(); master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f, dur, { type = 'sine', gain = 0.2, slide = 0, delay = 0 } = {}) {
    const a = ctx(); if (!a || vol.sfx <= 0) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain * vol.sfx, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  // ハーモニカのような、のばす音(ゆれ=ビブラートつき)
  function reed(f, dur, delay = 0) {
    const a = ctx(); if (!a || vol.sfx <= 0) return;
    const t = a.currentTime + delay, o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 1.005;
    lp.type = 'lowpass'; lp.frequency.value = 2200;
    lfo.frequency.value = 5.2; lg.gain.value = f * 0.007; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const v = 0.05 * vol.sfx;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.07); g.gain.setValueAtTime(v * 0.85, Math.max(t + 0.08, t + dur - 0.12)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g).connect(master);
    [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.05); });
  }
  // ハーモニカのオリジナル曲(ペンタトニック)。[音の高さHz, 長さ(拍)] 0 は休み。朝・昼・夕・晩と、たまに吹くとくべつな曲の5曲
  const TUNES = {
    morning: { name: '朝のうた', beat: 0.30, notes: [[784, 1], [880, 1], [1047, 2], [880, 1], [1047, 1], [1175, 2], [1047, 1], [880, 1], [784, 2], [659, 1], [784, 1], [880, 3], [0, 1], [1047, 1], [1175, 1], [1319, 2], [1175, 1], [1047, 1], [880, 2], [784, 1], [880, 1], [1047, 4]] },
    noon: { name: 'ひるさがりのうた', beat: 0.34, notes: [[659, 1.5], [784, 0.5], [880, 2], [784, 1], [659, 1], [587, 2], [523, 1], [587, 1], [659, 3], [0, 1], [784, 1.5], [880, 0.5], [1047, 2], [880, 1], [784, 1], [659, 2], [587, 1], [523, 1], [587, 4]] },
    evening: { name: '夕やけのうた', beat: 0.38, notes: [[880, 2], [784, 1], [659, 1], [587, 2], [523, 2], [587, 1], [659, 1], [784, 3], [0, 1], [880, 1], [784, 1], [659, 2], [587, 1], [523, 1], [440, 2], [523, 1], [587, 1], [659, 4]] },
    night: { name: 'おやすみのうた', beat: 0.45, notes: [[523, 2], [440, 2], [392, 3], [0, 1], [440, 2], [523, 2], [587, 3], [0, 1], [523, 1], [440, 1], [392, 2], [330, 2], [392, 1], [440, 1], [330, 5]] },
    special: { name: 'とっておきの曲', beat: 0.28, notes: [[1047, 1], [1319, 1], [1568, 2], [1319, 1], [1047, 1], [784, 2], [880, 1], [1047, 1], [1175, 2], [0, 0.5], [1175, 0.5], [1319, 1], [1175, 1], [1047, 2], [1568, 1], [1319, 1], [1047, 1], [784, 1], [880, 1], [1047, 1], [1175, 1], [1319, 3], [0, 1], [1568, 0.5], [1319, 0.5], [1175, 0.5], [1047, 0.5], [1319, 2], [1047, 1], [784, 1], [1047, 5]] },
  };
  // 時間から曲をえらぶ(たまに「とくべつな曲」)
  function pickTune(hour, special = Math.random() < 0.18) {
    if (special) return 'special';
    return hour >= 5 && hour < 10 ? 'morning' : hour >= 10 && hour < 16 ? 'noon' : hour >= 16 && hour < 19 ? 'evening' : 'night';
  }
  // 広場の水音+遠いざわめき(フィルタをかけたノイズ)
  function ambience(on) {
    const a = ctx(); if (!a) return;
    if (on && !amb) {
      const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      const g = a.createGain(); g.gain.value = 0.035 * vol.bgm;
      src.connect(f).connect(g).connect(master); src.start();
      amb = { src, g };
    } else if (!on && amb) { amb.src.stop(); amb = null; }
  }
  // 雨のおと(0〜1)。ふるあいだだけ、ざーっという高めのノイズ
  let rainN = null;
  function rain(v) {
    const a = ctx(); if (!a) return;
    if (v > 0.01 && !rainN) {
      const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 0.35;
      const g = a.createGain(); g.gain.value = 0; src.connect(f).connect(g).connect(master); src.start(); rainN = { src, g };
    }
    if (rainN) { rainN.g.gain.value = 0.16 * v * vol.sfx; if (v <= 0.01) { rainN.src.stop(); rainN = null; } }
  }
  const SFX = {
    tap: () => tone(880, 0.08, { type: 'triangle', gain: 0.15 }),
    blip: () => tone(620 + Math.random() * 120, 0.04, { type: 'square', gain: 0.03 }),
    open: () => { tone(660, 0.12, { type: 'triangle' }); tone(990, 0.18, { type: 'triangle', delay: 0.08 }); },
    close: () => { tone(880, 0.1, { type: 'triangle' }); tone(587, 0.16, { type: 'triangle', delay: 0.07 }); },
    talk: () => tone(740, 0.1, { type: 'sine', gain: 0.18, slide: 1.3 }),
    coin: () => { tone(1320, 0.08, { type: 'square', gain: 0.06 }); tone(1760, 0.2, { type: 'square', gain: 0.06, delay: 0.07 }); },
    wave: () => tone(523, 0.2, { type: 'sine', gain: 0.12, slide: 1.5 }),
    // 花火:のぼる笛のような音→ドン(おおきい花火ほど低く大きく)
    whistle: () => tone(500, 0.8, { type: 'sine', gain: 0.05, slide: 3.2 }),
    boom: sc => { const s = Math.max(0.3, Math.min(1.4, +sc || 1)); tone(95 / s, 0.7, { type: 'triangle', gain: 0.32 * Math.min(1, s), slide: 0.3 }); tone(55 / s, 1.0, { type: 'sine', gain: 0.3 * Math.min(1, s), slide: 0.5 }); tone(1800, 0.25, { type: 'square', gain: 0.02, slide: 0.4, delay: 0.1 }); },
    bigboom: () => { tone(70, 1.4, { type: 'triangle', gain: 0.42, slide: 0.25 }); tone(42, 2.2, { type: 'sine', gain: 0.45, slide: 0.5 }); tone(120, 0.9, { type: 'sawtooth', gain: 0.1, slide: 0.3, delay: 0.05 }); tone(1500, 0.5, { type: 'square', gain: 0.03, slide: 0.4, delay: 0.1 }); },
    harmonica: kind => { const T = TUNES[kind] || TUNES.noon; let t = 0; for (const [f, b] of T.notes) { const d = b * T.beat; if (f) reed(f, d * 0.96, t); t += d; } return { sec: t, name: T.name }; },
  };
  return {
    unlock() { ctx(); },
    play(name, arg) { try { return SFX[name]?.(arg); } catch (e) {} },
    pickTune,
    ambience,
    rain,
    get: () => ({ ...vol }),
    set(v) { Object.assign(vol, v); if (amb) amb.g.gain.value = 0.035 * vol.bgm; },
    suspend() { ac?.suspend(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
    dispose() { ambience(false); ac?.close(); ac = null; },
  };
}
