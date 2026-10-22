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
  const SFX = {
    tap: () => tone(880, 0.08, { type: 'triangle', gain: 0.15 }),
    blip: () => tone(620 + Math.random() * 120, 0.04, { type: 'square', gain: 0.03 }),
    open: () => { tone(660, 0.12, { type: 'triangle' }); tone(990, 0.18, { type: 'triangle', delay: 0.08 }); },
    close: () => { tone(880, 0.1, { type: 'triangle' }); tone(587, 0.16, { type: 'triangle', delay: 0.07 }); },
    talk: () => tone(740, 0.1, { type: 'sine', gain: 0.18, slide: 1.3 }),
    coin: () => { tone(1320, 0.08, { type: 'square', gain: 0.06 }); tone(1760, 0.2, { type: 'square', gain: 0.06, delay: 0.07 }); },
    wave: () => tone(523, 0.2, { type: 'sine', gain: 0.12, slide: 1.5 }),
  };
  return {
    unlock() { ctx(); },
    play(name) { try { SFX[name]?.(); } catch (e) {} },
    ambience,
    get: () => ({ ...vol }),
    set(v) { Object.assign(vol, v); if (amb) amb.g.gain.value = 0.035 * vol.bgm; },
    suspend() { ac?.suspend(); },
    resume() { if (ac && ac.state === 'suspended') ac.resume(); },
    dispose() { ambience(false); ac?.close(); ac = null; },
  };
}
