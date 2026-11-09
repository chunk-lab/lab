// 効果音と環境音(Web Audio だけで作る。音声ファイルなし)
// この町のファイル(town.js)を読み込んだ場所。曲(bgm/town.mp3)は、その横に置く。読み込み中にしか分からないので、ここ(いちばん外側)で控えておく
const SCRIPT_SRC = (() => { try { return (document.currentScript && document.currentScript.src) || ''; } catch (e) { return ''; } })();
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
  // オカリナのような、まるくてやさしい音(ほぼ正弦波＋かすかな息の音。ゆれは、音がのびてから少しだけかかる)
  function reed(f, dur, delay = 0) {
    const a = ctx(); if (!a || vol.sfx <= 0) return;
    const t = a.currentTime + delay, o = a.createOscillator(), o2 = a.createOscillator(), g2 = a.createGain(), g = a.createGain(), lp = a.createBiquadFilter(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = 'sine'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2; g2.gain.value = 0.10;
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    lfo.frequency.value = 4.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.0035, t + Math.min(0.35, dur * 0.6)); lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const v = 0.085 * vol.sfx;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.06); g.gain.setValueAtTime(v * 0.9, Math.max(t + 0.07, t + dur - 0.14)); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(master);
    [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.05); });
    // 吹きはじめの、かすかな息の音
    const n = Math.floor(a.sampleRate * 0.12), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const ns = a.createBufferSource(), bp = a.createBiquadFilter(), ng = a.createGain(); ns.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = Math.min(6000, f * 2.5); bp.Q.value = 1.2; ng.gain.value = 0.35 * v;
    ns.connect(bp).connect(ng).connect(master); ns.start(t);
  }
  // ピアノのような音(打ってすぐ減る。倍音を少し)
  function piano(f, dur, delay = 0, v = 1) {
    const a = ctx(); if (!a || vol.sfx <= 0 || !f) return;
    const t = a.currentTime + delay, g = a.createGain(), lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 6);
    const peak = 0.11 * vol.sfx * v, len = Math.max(0.35, Math.min(2.2, dur * 1.6));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.008); g.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    lp.connect(g).connect(master);
    [[1, 'triangle', 1], [2, 'sine', 0.35], [3, 'sine', 0.12]].forEach(([m, ty, k]) => { const o = a.createOscillator(), og = a.createGain(); o.type = ty; o.frequency.value = f * m; og.gain.value = k; o.connect(og).connect(lp); o.start(t); o.stop(t + len + 0.05); });
  }
  // オカリナのオリジナル曲(ペンタトニック)。[音の高さHz, 長さ(拍)] 0 は休み。朝・昼・夕・晩と、たまに吹くとくべつな曲の5曲
  const TUNES = {
    morning: { name: '朝のうた', beat: 0.30, notes: [[784, 1], [880, 1], [1047, 2], [880, 1], [1047, 1], [1175, 2], [1047, 1], [880, 1], [784, 2], [659, 1], [784, 1], [880, 3], [0, 1], [1047, 1], [1175, 1], [1319, 2], [1175, 1], [1047, 1], [880, 2], [784, 1], [880, 1], [1047, 4]] },
    noon: { name: 'ひるさがりのうた', beat: 0.34, notes: [[659, 1.5], [784, 0.5], [880, 2], [784, 1], [659, 1], [587, 2], [523, 1], [587, 1], [659, 3], [0, 1], [784, 1.5], [880, 0.5], [1047, 2], [880, 1], [784, 1], [659, 2], [587, 1], [523, 1], [587, 4]] },
    evening: { name: '夕やけのうた', beat: 0.38, notes: [[880, 2], [784, 1], [659, 1], [587, 2], [523, 2], [587, 1], [659, 1], [784, 3], [0, 1], [880, 1], [784, 1], [659, 2], [587, 1], [523, 1], [440, 2], [523, 1], [587, 1], [659, 4]] },
    night: { name: 'おやすみのうた', beat: 0.45, notes: [[523, 2], [440, 2], [392, 3], [0, 1], [440, 2], [523, 2], [587, 3], [0, 1], [523, 1], [440, 1], [392, 2], [330, 2], [392, 1], [440, 1], [330, 5]] },
    bday: { name: 'ハッピーバースデー', beat: 0.42, notes: [[392, 0.75], [392, 0.25], [440, 1], [392, 1], [523, 1], [494, 2], [392, 0.75], [392, 0.25], [440, 1], [392, 1], [587, 1], [523, 2], [392, 0.75], [392, 0.25], [784, 1], [659, 1], [523, 1], [494, 1], [440, 2], [698, 0.75], [698, 0.25], [659, 1], [523, 1], [587, 1], [523, 3]] },
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
  // 街歩きの曲(圧縮して音量の波をそろえた mp3)。AudioContext の中で鳴らすので、suspend/resume でいっしょに止まる
  // ピアノ・オカリナ(ハーモニカ)の演奏のあいだは、街の曲をいったん消して、終わったら戻す
  let duckEnd = 0, duckTimer = 0;
  function duck(sec) {
    const a = ac; if (!a || !bgmG) return;
    duckEnd = Math.max(duckEnd, a.currentTime + sec);
    try { bgmG.gain.cancelScheduledValues(a.currentTime); bgmG.gain.setTargetAtTime(0, a.currentTime, 0.08); } catch (e) { }
    clearTimeout(duckTimer);
    duckTimer = setTimeout(() => { try { if (bgmG && ac) bgmG.gain.setTargetAtTime(0.9 * vol.bgm, ac.currentTime, 0.4); } catch (e) { } }, Math.max(0, (duckEnd - a.currentTime) * 1000) + 200);
  }
  const BGM_URL = SCRIPT_SRC ? new URL('bgm/town.mp3', SCRIPT_SRC).href : 'bgm/town.mp3';
  let bgmBuf = null, bgmSrc = null, bgmG = null, bgmWant = false, bgmLoading = false;
  function bgm(on) {
    bgmWant = !!on; const a = ctx(); if (!a) return;
    if (!on) { if (bgmSrc) { try { bgmSrc.stop(); } catch (e) { } bgmSrc = null; } return; }
    if (bgmSrc) return;
    const go = () => { if (!bgmWant || bgmSrc || !bgmBuf) return; const src = a.createBufferSource(); src.buffer = bgmBuf; src.loop = true; bgmG = a.createGain(); bgmG.gain.value = 0.9 * vol.bgm; src.connect(bgmG).connect(master); src.start(); bgmSrc = src; };
    if (bgmBuf) return go();
    if (bgmLoading) return; bgmLoading = true;
    fetch(BGM_URL).then(r => r.arrayBuffer()).then(b => a.decodeAudioData(b)).then(buf => { bgmBuf = buf; bgmLoading = false; go(); }).catch(() => { bgmLoading = false; });
  }
  const SFX = {
    tap: () => tone(880, 0.08, { type: 'triangle', gain: 0.15 }),
    blip: () => tone(620 + Math.random() * 120, 0.04, { type: 'square', gain: 0.03 }),
    open: () => { tone(660, 0.12, { type: 'triangle' }); tone(990, 0.18, { type: 'triangle', delay: 0.08 }); },
    close: () => { tone(880, 0.1, { type: 'triangle' }); tone(587, 0.16, { type: 'triangle', delay: 0.07 }); },
    talk: () => tone(740, 0.1, { type: 'sine', gain: 0.18, slide: 1.3 }),
    pay: () => { tone(988, 0.07, { type: 'square', gain: 0.05 }); tone(1319, 0.07, { type: 'square', gain: 0.05, delay: 0.07 }); tone(880, 0.22, { type: 'triangle', gain: 0.07, delay: 0.14 }); },
    coin: () => { tone(1320, 0.08, { type: 'square', gain: 0.06 }); tone(1760, 0.2, { type: 'square', gain: 0.06, delay: 0.07 }); },
    wave: () => tone(523, 0.2, { type: 'sine', gain: 0.12, slide: 1.5 }),
    // 花火:のぼる笛のような音→ドン(おおきい花火ほど低く大きく)
    whistle: () => tone(500, 0.8, { type: 'sine', gain: 0.05, slide: 3.2 }),
    boom: sc => { const s = Math.max(0.3, Math.min(1.4, +sc || 1)); tone(95 / s, 0.7, { type: 'triangle', gain: 0.32 * Math.min(1, s), slide: 0.3 }); tone(55 / s, 1.0, { type: 'sine', gain: 0.3 * Math.min(1, s), slide: 0.5 }); tone(1800, 0.25, { type: 'square', gain: 0.02, slide: 0.4, delay: 0.1 }); },
    bigboom: () => { tone(70, 1.4, { type: 'triangle', gain: 0.42, slide: 0.25 }); tone(42, 2.2, { type: 'sine', gain: 0.45, slide: 0.5 }); tone(120, 0.9, { type: 'sawtooth', gain: 0.1, slide: 0.3, delay: 0.05 }); tone(1500, 0.5, { type: 'square', gain: 0.03, slide: 0.4, delay: 0.1 }); },
    piano: ([f, dur, delay, v]) => piano(f, dur, delay, v),
    harmonica: kind => { const T = TUNES[kind] || TUNES.noon; let t = 0; for (const [f, b] of T.notes) { const d = b * T.beat; if (f) reed(f, d * 0.96, t); t += d; } return { sec: t, name: T.name }; },
  };
  return {
    unlock() { ctx(); },
    play(name, arg) { try { if (name === 'piano' && arg) duck((arg[2] || 0) + (arg[1] || 0.5) + 0.8); const r = SFX[name]?.(arg); if (name === 'harmonica' && r && r.sec) duck(r.sec + 0.6); return r; } catch (e) {} },
    pickTune,
    ambience,
    rain,
    bgm,
    state: () => ({ bgm: !!bgmSrc, amb: !!amb, rain: !!rainN }),
    get: () => ({ ...vol }),
    set(v) { Object.assign(vol, v); if (amb) amb.g.gain.value = 0.035 * vol.bgm; if (bgmG) bgmG.gain.value = 0.9 * vol.bgm; },
    suspend() { ac?.suspend(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
    dispose() { ambience(false); bgm(false); rain(0); ac?.close(); ac = null; },
  };
}
