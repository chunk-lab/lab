// 釣りの効果音(Web Audio でその場で作る)とふるえ
export function createSfx(volume = 0.7) {
  let lastReel = -1, lastCreak = -1, ac = null, out = null, noiseBuf = null, reelN = null, creakN = null, ambN = null;
  const ctx = () => {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = volume; out.connect(ac.destination); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  };
  const noise = () => { if (!noiseBuf) { const a = ctx(); noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; };
  function tone(f, dur, { type = 'sine', g = 0.2, slide = 1, delay = 0, attack = 0.005 } = {}) {
    const a = ctx(); if (!a || volume <= 0) return; const t = a.currentTime + delay;
    const o = a.createOscillator(), v = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    v.gain.setValueAtTime(0.0001, t); v.gain.linearRampToValueAtTime(g, t + attack); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v).connect(out); o.start(t); o.stop(t + dur + 0.05);
  }
  function burst(dur, { f = 1200, q = 0.8, type = 'bandpass', g = 0.3, slide = 1, delay = 0 } = {}) {
    const a = ctx(); if (!a || volume <= 0) return; const t = a.currentTime + delay;
    const s = a.createBufferSource(); s.buffer = noise(); const fl = a.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); if (slide !== 1) fl.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
    const v = a.createGain(); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(v).connect(out); s.start(t); s.stop(t + dur + 0.05);
  }
  const vib = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };
  const S = {
    tap: () => tone(880, 0.07, { type: 'triangle', g: 0.12 }),
    whoosh: () => burst(0.35, { f: 600, slide: 4, q: 1.2, g: 0.25 }),
    plop: () => { tone(520, 0.14, { slide: 0.45, g: 0.25 }); burst(0.18, { f: 900, type: 'lowpass', g: 0.18 }); },
    splash: () => { burst(0.5, { f: 1800, q: 0.6, g: 0.35, slide: 0.4 }); tone(180, 0.2, { slide: 0.5, g: 0.15 }); },
    nibble: () => { tone(300, 0.05, { type: 'triangle', g: 0.12 }); vib(15); },
    bite: () => { tone(140, 0.25, { type: 'triangle', g: 0.4, slide: 0.6 }); burst(0.2, { f: 700, g: 0.25 }); vib([60, 30, 90]); },
    hook: () => { tone(220, 0.12, { type: 'square', g: 0.12, slide: 1.8 }); burst(0.15, { f: 2500, g: 0.2 }); vib(40); },
    early: () => { tone(330, 0.2, { type: 'triangle', g: 0.12, slide: 0.6 }); },
    jump: () => { burst(0.7, { f: 1400, q: 0.5, g: 0.4, slide: 0.5 }); vib([30, 20, 30]); },
    snap: () => { burst(0.12, { f: 4000, q: 3, g: 0.45 }); tone(900, 0.25, { type: 'sawtooth', g: 0.08, slide: 0.3 }); vib([120]); },
    lost: () => { tone(392, 0.18, { type: 'triangle', g: 0.14 }); tone(311, 0.3, { type: 'triangle', g: 0.14, delay: 0.16 }); },
    catch: big => { const n = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047]; n.forEach((f, i) => tone(f, 0.25, { type: 'triangle', g: 0.16, delay: i * 0.09 })); burst(0.5, { f: 1500, g: 0.2, slide: 0.5 }); vib(big ? [40, 40, 40, 40, 120] : [40, 30, 60]); },
    legend: () => { [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.4, { type: 'triangle', g: 0.15, delay: i * 0.1 })); tone(130, 1.2, { g: 0.2, delay: 0.1 }); },
    coin: () => { tone(1320, 0.07, { type: 'square', g: 0.05 }); tone(1760, 0.18, { type: 'square', g: 0.05, delay: 0.06 }); },
    count: () => tone(660, 0.12, { type: 'triangle', g: 0.15 }),
    go: () => { tone(880, 0.35, { type: 'triangle', g: 0.18 }); tone(1320, 0.35, { type: 'triangle', g: 0.1 }); },
    whistle: () => { tone(1800, 0.5, { type: 'sine', g: 0.12 }); tone(1500, 0.4, { type: 'sine', g: 0.1, delay: 0.5 }); },
  };
  // 続く音:リールのカリカリ・糸のきしみ
  function loopNoise(slot, f, q) {
    const a = ctx(); if (!a) return null;
    const s = a.createBufferSource(); s.buffer = noise(); s.loop = true; const fl = a.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = q;
    const v = a.createGain(); v.gain.value = 0; s.connect(fl).connect(v).connect(out); s.start(); return { s, v, fl };
  }
  // ファイトの曲(その場で鳴らす短いループ)。level 0=止める / 0.5=ふつう / 1=伝説
  let seqT = null, seqStep = 0, seqLv = 0, nextAt = 0;
  const BASS = [110, 110, 0, 110, 131, 0, 98, 0, 110, 110, 0, 147, 131, 0, 98, 82];
  const LEAD = [440, 0, 523, 0, 587, 0, 523, 494, 440, 0, 392, 0, 440, 0, 0, 0];
  function seqTick() {
    const a = ctx(); if (!a) return;
    const spb = 60 / (126 + seqLv * 24) / 2;
    while (nextAt < a.currentTime + 0.12) {
      const i = seqStep % 16, d = Math.max(0, nextAt - a.currentTime);
      if (i % 4 === 0) { tone(60, 0.18, { type: 'sine', g: 0.22 * seqLv + 0.08, slide: 0.5, delay: d }); }
      if (i % 2 === 1) burst(0.04, { f: 8000, type: 'highpass', g: 0.05 + 0.04 * seqLv, delay: d });
      if (BASS[i]) tone(BASS[i], spb * 0.9, { type: 'triangle', g: 0.09 + 0.05 * seqLv, delay: d });
      if (seqLv >= 0.7 && LEAD[i]) tone(LEAD[i] * (seqLv >= 1 ? 1 : 0.5) * 2, spb * 0.8, { type: 'square', g: 0.025, delay: d });
      nextAt += spb; seqStep++;
    }
  }
  function fight(lv) {
    seqLv = lv;
    if (lv > 0 && !seqT) { const a = ctx(); if (!a) return; nextAt = a.currentTime + 0.05; seqStep = 0; seqT = setInterval(seqTick, 40); }
    if (lv <= 0 && seqT) { clearInterval(seqT); seqT = null; }
  }
  return {
    fight,
    play(n, a) { try { S[n] && S[n](a); } catch (e) { } },
    vib,
    unlock() { ctx(); },
    // リールを巻く強さ 0〜1 / 糸の張り 0〜1.3
    reel(v) { if (!ac) return; v = Math.round(v * 20) / 20; if (v === lastReel) return; lastReel = v; if (!reelN && v > 0.02) reelN = loopNoise('reel', 3200, 6); if (reelN) { const t = ac.currentTime; reelN.v.gain.setTargetAtTime(v > 0.02 ? 0.05 + v * 0.06 : 0, t, 0.03); reelN.fl.frequency.setTargetAtTime(2400 + v * 2400, t, 0.05); } },
    creak(T) { if (!ac) return; T = Math.round(T * 20) / 20; if (T === lastCreak) return; lastCreak = T; if (!creakN && T > 0.75) creakN = loopNoise('creak', 260, 14); if (creakN) { const t = ac.currentTime, k = Math.max(0, T - 0.75) / 0.4; creakN.v.gain.setTargetAtTime(Math.min(0.35, k * 0.35), t, 0.05); creakN.fl.frequency.setTargetAtTime(200 + k * 260, t, 0.05); } },
    // 水辺の音(風と水)
    ambience(on) { if (!ac) return; if (on && !ambN) { ambN = loopNoise('amb', 500, 0.4); if (ambN) ambN.v.gain.value = 0.025; } else if (!on && ambN) { ambN.s.stop(); ambN = null; } },
    setVolume(v) { volume = v; if (out) out.gain.value = v; },
    stopLoops() { fight(0); for (const n of [reelN, creakN, ambN]) { try { n && n.s.stop(); } catch (e) { } } reelN = creakN = ambN = null; lastReel = lastCreak = -1; },
    close() { this.stopLoops(); try { ac && ac.close(); } catch (e) { } ac = null; },
  };
}
