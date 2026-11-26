/* 今スラの「やりながら覚える」案内（物語などから opts.coach で使う）。
   auto＝さらさら：切れ目で止めて「今よ！」→タップで切る(2回)。
   manual＝チャレンジ：時間を止めて ▶で進む→チャンク！で切る→◀でもどれる→スタート。 */
import { ENV, S, SPEED, settings, step, $ } from './engine.js';

export function playCoach(kind) {
  const root = ENV.root; if (!root) return;
  let bub = null, anim = null, mode = 'wait', g1 = -1, stops = [], left = 2, alive = true;
  const hide = () => { if (anim) { anim.cancel(); anim = null; } if (bub) { bub.remove(); bub = null; } };
  const show = (msg, target, ok) => {
    hide();
    bub = document.createElement('div');
    Object.assign(bub.style, { position: 'fixed', left: '14px', right: '14px', top: '30%', zIndex: 80, background: '#fff8e7', border: '3px solid #f0a040', borderRadius: '16px', padding: '12px 14px', fontSize: '18px', fontWeight: '800', lineHeight: '1.5', color: '#4a3420', textAlign: 'center', boxShadow: '0 6px 18px rgba(0,0,0,.3)', pointerEvents: ok ? 'auto' : 'none' });
    bub.innerHTML = msg;
    if (ok) {
      const b = document.createElement('button'); b.textContent = 'OK';
      Object.assign(b.style, { display: 'block', margin: '10px auto 0', padding: '8px 34px', fontSize: '17px', fontWeight: '800', border: 'none', borderRadius: '999px', background: '#f0a040', color: '#fff' });
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ok(); });
      bub.append(b);
    }
    root.append(bub);
    { const lw = $('laneWrap'), r = lw && lw.getBoundingClientRect();   // 切る文のすぐ上に出す(上すぎると読めない)
      if (r && r.height) bub.style.top = Math.max(8, r.top - bub.offsetHeight - 10) + 'px'; }
    if (target) anim = target.animate([{ boxShadow: '0 0 0 0 rgba(255,140,30,.95)', transform: 'scale(1)' }, { boxShadow: '0 0 0 16px rgba(255,140,30,0)', transform: 'scale(1.07)' }], { duration: 750, iterations: Infinity });
  };
  const flash = (msg, ms) => { show(msg); setTimeout(() => { if (bub && bub.innerHTML.startsWith(msg)) hide(); }, ms); };
  // 1文目の正しい切れ目（全体の通し番号）
  const ends = () => { const sen = S.sens[S.seq[0]], base = S.starts[0]; return sen.units.map(u => base + u.e); };
  const finish = () => { alive = false; clearInterval(iv); };

  // 押されたボタンの横取り（案内中だけ）
  const onDown = e => {
    if (!alive || !S || S.phase !== 'play') return;
    const t = e.target.closest && e.target.closest('#fwdBtn,#backBtn,#tapZone,#scrub');
    if (!t) return;
    const id = t.id;
    if (kind === 'auto') {
      if (mode !== 'stop' || id !== 'tapZone') return;
      // 止めていた所で切る：時間の判定をずらしてから、本来の「切る」へ流す
      S.paused = false; S.lastStepAt = -1e9; S.nextStepAt = performance.now() + SPEED[settings.speed];
      mode = 'go'; hide(); left--;
      setTimeout(() => {
        if (!S || S.phase !== 'play') return;
        clearTimeout(S.timer); S.timer = setTimeout(step, SPEED[settings.speed]);
        if (left <= 0) { flash('その調子！<br>あとは 自分で切ってみよう', 2200); finish(); }
      }, 0);
      return;
    }
    // manual
    const block = () => { e.stopImmediatePropagation(); e.preventDefault(); };
    if (mode === 'fwd') { if (id !== 'fwdBtn' || S.passed - 1 >= g1) block(); return; }
    if (mode === 'cut') { if (id !== 'tapZone') block(); return; }
    if (mode === 'back' || mode === 'wait') block();
  };
  root.addEventListener('pointerdown', onDown, true);
  ENV.offs.push(() => { alive = false; clearInterval(iv); hide(); root.removeEventListener('pointerdown', onDown, true); });

  const iv = setInterval(() => {
    if (!alive) return;
    { const sb = $('startBox'); if (sb && !sb.hidden) { const b = $('startBtn'); b && b.click(); } }   // スタートの画面は、とばす
    if (!S || S.phase !== 'play') return;
    if (kind === 'auto') {
      if (mode === 'wait') { stops = ends().slice(0, -1); mode = 'go'; flash('英文が流れてくるよ', 1600); return; }
      if (mode !== 'go') return;
      const w = S.passed - 1;
      if (stops.includes(w) && !S.cuts.has(w) && !S.paused) {
        clearTimeout(S.timer); S.paused = true; mode = 'stop';
        show('今よ！<br>「チャンク！」をタップ', $('cutBtn'));
      }
      return;
    }
    // manual
    if (mode === 'wait') {
      S.hold = true; g1 = ends()[0]; mode = 'fwd';
      show('いまは 時間が止まっているよ。<br>横の ▶ で、線が1語ずつ進むよ', $('fwdBtn'));
      return;
    }
    if (mode === 'fwd' && S.passed - 1 === g1) { mode = 'cut'; show('ここが 切れ目！<br>「チャンク！」で切ろう', $('cutBtn')); return; }
    if (mode === 'cut' && S.cuts.has(g1)) {
      mode = 'back';
      show('まちがえたら ◀ で、切った所まで もどれるよ。<br><small>(チャレンジでは、もどると 時間がへるよ)</small>', $('backBtn'), () => {
        mode = 'end'; flash('では、30秒 スタート！', 1300); S.hold = false; finish();
      });
    }
  }, 50);
}
