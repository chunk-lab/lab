/* 音（Web Audio）：BGM と効果音の音量を共通の設定でまとめて管理する。
   ゲームは sound.ctx() で AudioContext を、sound.sfxBus / sound.bgmBus に音をつなぐ。 */
export function createSound(settings) {
  let ac = null, sfx = null, bgm = null;
  const ensure = () => {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); sfx = ac.createGain(); bgm = ac.createGain(); sfx.connect(ac.destination); bgm.connect(ac.destination); apply(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  };
  const apply = () => { if (!ac) return; sfx.gain.value = settings.get('sfx'); bgm.gain.value = settings.get('bgm'); };
  settings.onChange(apply);
  return {
    ctx: ensure,
    get sfxBus() { ensure(); return sfx; },
    get bgmBus() { ensure(); return bgm; },
    /* かんたんな効果音：beep(高さHz, 長さ秒, 波形) */
    beep(f = 660, d = 0.08, type = 'triangle', vol = 0.15) {
      const c = ensure(); if (!c) return; const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(sfx); o.start(t); o.stop(t + d + 0.02);
    }
  };
}
