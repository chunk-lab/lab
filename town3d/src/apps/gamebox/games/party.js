// パーティ連打(ミニゲーム集)。10秒くらいのミニゲームを続けて、勝ち数で競う
// 画面の下半分=プレイヤー1、上半分=相手(2人のときは上下さかさまで見る)
import { surface, pointers, loop, txt, banner, rr, clamp, btn, hit, COL, INK, shuffle } from '../kit.js';

const COLORS = [['RED', '#ff5a5a'], ['BLUE', '#4a8cff'], ['GREEN', '#3fbf6a'], ['YELLOW', '#ffcf3a'], ['PINK', '#ff8fc7'], ['PURPLE', '#a46be8']];

export default {
  id: 'party', title: 'パーティ連打', icon: '🎉', desc: '10秒のミニゲームを5本勝負', rule: '綱引き連打・早押しガンマン・風船・だるまさん・ぴったりストップ・カラータッチ・あっち向いてホイから5本。多く勝った方の勝ち。',
  options: [{ key: 'n', label: '何本勝負', choices: [[3, '3本'], [5, '5本'], [7, '7本']], def: 5 }],
  start(host) {
    const S = surface(host.box), g = S.g, two = host.two, cpu = host.players[1].cpu, sfx = host.sfx, lv = cpu ? cpu.lv : 2;
    const total = host.opts.trial ? 2 : host.opts.n || 5;
    const wins = [0, 0];
    const pool = shuffle(['tug', 'gun', 'balloon', 'daruma', 'stop', 'color', 'hoi']);
    const list = []; while (list.length < total) list.push(host.opts.only || pool[list.length % pool.length]);
    let ri = -1, phase = 'intro', pt0 = 0, M = null, roundWin = -1;
    const R = () => ({ W: S.W, H: S.H, h: S.H / 2 });
    // 半分ずつ描く:ローカル座標は「中央線が y=0、自分の手前に向かって y が増える」
    function half(side, fn) {
      const { W, h } = R(); g.save();
      if (side === 0) g.translate(0, h); else { g.translate(W, h); g.rotate(Math.PI); }
      fn(side === 1 && !two); g.restore();
    }
    const T = (up, s, x, y, o = {}) => txt(g, s, x, y, { ...o, flip: up, align: up && o.align ? (o.align === 'left' ? 'right' : o.align === 'right' ? 'left' : o.align) : o.align });   // up=CPU側(上)の文字をさかさにしない
    const pressed = [false, false];
    const pt = pointers(S.cv, {
      onDown: p => { const s = two ? p.side : 0; if (s === 1 && !two) return; pressed[s] = true; if (phase === 'play' && M.down) M.down(s, local(p, s)); },
      onUp: p => { const s = two ? p.side : 0; pressed[s] = false; if (phase === 'play' && M.up) M.up(s); },
    });
    function local(p, s) { const { W, h } = R(); return s === 0 ? { x: p.x, y: p.y - h } : { x: W - p.x, y: h - p.y }; }
    function next() {
      ri++; if (ri >= list.length || wins[0] > total / 2 || wins[1] > total / 2) { const w = wins[0] > wins[1] ? 0 : wins[1] > wins[0] ? 1 : -1; setTimeout(() => host.end({ winner: w, score: wins }), 300); phase = 'end'; return; }
      M = GAMES[list[ri]](); phase = 'intro'; pt0 = 0; roundWin = -1; sfx.play('whoosh');
    }
    function finishRound(w) { if (phase !== 'play') return; roundWin = w; if (w >= 0) wins[w]++; phase = 'res'; pt0 = 0; sfx.play(w === 0 ? 'point' : w === 1 ? 'ng' : 'tap'); }
    const cpuOn = !two;
    // ======== ミニゲーム ========
    const GAMES = {
      gun: () => {   // 早押しガンマン:「FIRE!」で撃つ。にせの合図(FIVE! など)や早撃ちは負け
        const at = 1.6 + Math.random() * 3, fakes = ['FIVE!', 'FINE!', 'FIRE?', 'FISH!', 'FIRST!'].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3));
        const cues = fakes.map((f, i) => ({ t: 0.8 + i * (at - 0.8) / Math.max(1, fakes.length) + Math.random() * 0.3, s: f })).filter(c => c.t < at - 0.5);
        let t = 0, go = false, cpuAt = 0, shown = '', shot = -1, foul = -1;
        return { title: '早撃ちガンマン', how: '「FIRE!」が出た瞬間に撃て! にせの合図や早撃ちは負け', dur: 9,
          down(s) { if (shot >= 0 || foul >= 0) return; sfx.play('boom'); if (!go) { foul = s; finishRound(1 - s); return; } shot = s; finishRound(s); },
          update(dt) {
            t += dt; for (const c of cues) if (t >= c.t && t < c.t + 0.6) shown = c.s; if (!go && !cues.some(c => t >= c.t && t < c.t + 0.6)) shown = '';
            if (!go && t >= at) { go = true; shown = 'FIRE!'; sfx.play('buzz'); cpuAt = t + [0, 0.4, 0.3, 0.22][lv] + (Math.random() - 0.5) * 0.1; }
            if (cpuOn && !go && cues.some(c => Math.abs(t - c.t) < dt) && Math.random() < [0, 0.12, 0.06, 0.02][lv]) { foul = 1; finishRound(0); }   // CPUもたまにだまされる
            if (go && cpuOn && t >= cpuAt && shot < 0) { shot = 1; sfx.play('boom'); finishRound(1); }
          },
          timeout() { finishRound(-1); },
          draw() {
            const { W, h } = R();
            [0, 1].forEach(s => half(s, up => {
              const hit0 = shot >= 0 && shot !== s, ok = shot === s;
              T(up, foul === s ? '🙈' : hit0 ? '😵' : '🤠', W / 2, h * 0.42, { size: 64 });
              T(up, foul === s ? 'はやすぎ!' : ok ? 'BANG!' : hit0 ? 'やられた…' : '…', W / 2, h * 0.68, { size: 20, color: ok ? '#ff5a5a' : '#8d7f9e' });
              btn(g, { x: W / 2 - 90, y: h - 110, w: 180, h: 80, label: '🔫 撃つ' }, { fill: go ? '#ffd36b' : '#fff', size: 24, flip: up });
            }));
            if (shown) banner(g, S, two, shown, { size: 54, color: shown === 'FIRE!' ? '#ff5a5a' : '#8d7f9e' });
          } };
      },
      hoi: () => {   // あっち向いてホイ:じゃんけん → 勝った方が「指す」、負けた方は「顔を向ける」。同じ向きなら指した方の勝ち
        const HANDS = ['✊', '✌️', '✋'], HN = ['グー', 'チョキ', 'パー'], DIRS = [['⬆', 'up'], ['⬇', 'down'], ['⬅', 'left'], ['➡', 'right']], DV = [[0, -1], [0, 1], [-1, 0], [1, 0]], ANG = [0, Math.PI, -Math.PI / 2, Math.PI / 2];
        let st = 'jan', t = 0, hand = [-1, -1], win = -1, dir = [null, null], msg = '', cpuT = 0, same = false;
        const beats = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 2) || (a === 2 && b === 0);
        const jb = (W, h) => HANDS.map((x, i) => ({ x: 14 + i * ((W - 28) / 3), y: h - 120, w: (W - 28) / 3 - 8, h: 90, i, label: x }));
        const db = (W, h) => DIRS.map((d, i) => { const cx = W / 2, cy = h - 110, off = [[0, -48], [0, 48], [-80, 0], [80, 0]][i]; return { x: cx + off[0] - 38, y: cy + off[1] - 26, w: 76, h: 52, i, label: d[0] }; });
        const cpuPlan = () => { cpuT = st === 'jan' ? 0.5 + Math.random() * 0.8 : [0, 0.9, 0.7, 0.5][lv] * (0.6 + Math.random() * 0.6); };
        cpuPlan();
        const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
        const judge = () => {
          if (st === 'jan' && hand[0] >= 0 && hand[1] >= 0) { st = 'janrev'; t = 0; sfx.play('tap'); }
          else if (st === 'hoi' && dir[0] != null && dir[1] != null) { st = 'rev'; t = 0; same = dir[0] === dir[1]; sfx.play('whoosh'); }
        };
        const after = () => {   // 結果を見せたあとの次へ
          if (st === 'janrev') {
            if (hand[0] === hand[1]) { msg = 'あいこで…'; t = -0.9; hand = [-1, -1]; st = 'jan'; cpuPlan(); return; }
            win = beats(hand[0], hand[1]) ? 0 : 1; st = 'hoi'; t = 0; dir = [null, null]; msg = 'あっち向いて…'; sfx.play('whoosh'); cpuPlan();
          } else if (st === 'rev') {
            if (same) finishRound(win);
            else { msg = 'かわした!'; st = 'jan'; t = -1.2; hand = [-1, -1]; win = -1; cpuPlan(); }
          }
        };
        // 顔(絵文字):向きにあわせて、首をふる(横にずれて細くなる/上下にずれてつぶれる)。up=相手側(さかさま補正)
        const face = (up, s, x, y, size, d, k) => {
          const ic = host.players[s].icon || (s ? '🤖' : '🙂'), v = d == null ? [0, 0] : DV[d], e = ease(k);
          g.save(); g.translate(x + v[0] * size * 0.55 * e, y + v[1] * size * 0.4 * e); if (up) g.rotate(Math.PI);
          g.rotate(v[0] * 0.35 * e * (up ? -1 : 1)); g.scale(1 - Math.abs(v[0]) * 0.4 * e, 1 - Math.abs(v[1]) * 0.25 * e);
          txt(g, ic, 0, 0, { size }); g.restore();
        };
        return { title: 'あっち向いてホイ', how: 'じゃんけんで勝ったら「指す」、負けたら「顔を向ける」。同じ向きなら、指した方のかち!', dur: 30,
          down(s, p) {
            const { W, h } = R(); if (t < 0) return;
            if (st === 'jan' && hand[s] < 0) { const b = jb(W, h).find(b => hit(b, p)); if (b) { hand[s] = b.i; sfx.play('tap'); judge(); } }
            else if (st === 'hoi' && dir[s] == null) { const b = db(W, h).find(b => hit(b, p)); if (b) { dir[s] = b.i; sfx.play('tap'); judge(); } }
          },
          update(dt) {
            t += dt;
            if (st === 'janrev' && t > 1.5) after();
            else if (st === 'rev' && t > 2.1) after();
            if (st === 'hoi' && t > 2.4) { for (const s of [0, 1]) if (dir[s] == null) dir[s] = Math.floor(Math.random() * 4); judge(); }   // 時間切れは でたらめな向き
            if (cpuOn && t >= 0) { cpuT -= dt; if (cpuT <= 0) { if (st === 'jan' && hand[1] < 0) { hand[1] = Math.floor(Math.random() * 3); judge(); } else if (st === 'hoi' && dir[1] == null) { dir[1] = Math.floor(Math.random() * 4); judge(); } cpuPlan(); } }
          },
          timeout() { finishRound(-1); },
          draw() {
            const { W, h } = R();
            [0, 1].forEach(s => half(s, up => {
              const canSee = !up || two, o = 1 - s, mineWin = win === s, FY = h * 0.34, col = s ? COL.p2 : COL.p1;
              // じゃんけんの結果(手と、かち/まけ/あいこ)
              if (st === 'jan') {
                face(up, s, W / 2, FY, 76, null, 0);
                T(up, hand[s] >= 0 ? '✔ 出した! あいてを待っているよ' : 'じゃん けん…', W / 2, h * 0.52, { size: hand[s] >= 0 ? 14 : 20 });
                if (canSee && hand[s] < 0) jb(W, h).forEach(b => btn(g, b, { size: 40, flip: up }));
              } else if (st === 'janrev') {
                const tie = hand[0] === hand[1], w = !tie && (beats(hand[s], hand[o])), k = ease(t / 0.3);
                g.fillStyle = tie ? 'rgba(255,211,107,.35)' : w ? 'rgba(63,191,106,.28)' : 'rgba(90,168,240,.25)'; g.fillRect(0, 4, W, h * 0.62);
                T(up, HANDS[hand[s]], W * 0.3, h * 0.2 + 14, { size: 64 * k }); T(up, '✕', W / 2, h * 0.2 + 14, { size: 20, color: '#8d7f9e' }); T(up, HANDS[hand[o]], W * 0.7, h * 0.2 + 14, { size: 64 * k });
                T(up, host.players[s].name, W * 0.3, h * 0.2 + 56, { size: 12, color: '#8d7f9e', maxW: W * 0.35 }); T(up, host.players[o].name, W * 0.7, h * 0.2 + 56, { size: 12, color: '#8d7f9e', maxW: W * 0.35 });
                T(up, tie ? 'あいこ!' : w ? '🏆 じゃんけん かち! → 指す側' : 'まけ… → 顔を向ける側', W / 2, h * 0.52, { size: tie ? 30 : 22, color: tie ? '#c98a00' : w ? '#2ca66a' : '#3a7fd0', stroke: '#fff', sw: 5 });
              } else {   // hoi / rev
                const reveal = st === 'rev', k = reveal ? t / 0.3 : 0;
                g.fillStyle = mineWin ? 'rgba(255,122,162,.22)' : 'rgba(90,168,240,.2)'; g.fillRect(0, 4, W, h * 0.66);
                // 役わりの札
                g.fillStyle = mineWin ? '#ff7aa2' : '#5aa8f0'; rr(g, W / 2 - 115, 46, 230, 30, 15); g.fill();
                const nm = up && !two ? host.players[s].name : 'あなた';
                T(up, mineWin ? `👉 ${nm}が「指す」側` : `😮 ${nm}は「顔を向ける」側`, W / 2, 62, { size: 14, color: '#fff', maxW: 220 });
                face(up, s, W / 2, FY + 40, 84, !mineWin && reveal ? dir[s] : null, k);
                if (mineWin && reveal && dir[s] != null) {   // 指(指した向きに のびる)
                  const v = DV[dir[s]], e = ease(t / 0.3), fx = W / 2 + v[0] * (46 + 40 * e) * 1.2, fy = FY + 40 + v[1] * (46 + 40 * e);
                  g.save(); g.translate(fx, fy); g.rotate(ANG[dir[s]]); txt(g, '👆', 0, 0, { size: 54 }); g.restore();
                }
                if (!reveal) T(up, dir[s] != null ? (canSee ? `✔ 決めた ${DIRS[dir[s]][0]}  あいてを待っているよ` : '✔ 決めた') : (mineWin ? '指す向きを えらんで!' : '顔を向ける向きを えらんで!'), W / 2, h * 0.52, { size: 14, color: '#5a4a6b' });
                else T(up, `${mineWin ? '指した' : '顔の向き'} ${DIRS[dir[s]][0]}`, W / 2, h * 0.52, { size: 18, color: mineWin ? '#ff5a8a' : '#3a7fd0' });
                if (canSee && !reveal && dir[s] == null) db(W, h).forEach(b => btn(g, b, { size: 26, flip: up, fill: mineWin ? '#ffe1ea' : '#e3f1ff' }));
              }
            }));
            if (st === 'rev' && t > 0.4) {   // けっか:ど真ん中に大きく
              const w = win, txtm = same ? `同じ向き!! ${host.players[w].name}のかち!` : 'ちがう向き… かわした!';
              banner(g, S, two, same ? (two ? '同じ向き!! 指した方のかち!' : (w === 0 ? '同じ向き!! あなたのかち!' : '同じ向き!! あいてのかち…')) : 'ちがう向き… かわした!', { size: 24, color: same ? (two || w === 0 ? '#2ca66a' : '#d24') : '#8d7f9e' });
            } else if (msg && t < 0.6 && t >= 0 && st === 'hoi') banner(g, S, two, msg, { size: 26 });
          } };
      },
      tug: () => {   // 連打で綱を引く
        let pos = 0, cpuT = 0; const lim = 12;
        return { title: '綱引き連打', how: 'ボタンを連打! 綱を自分のほうへ', dur: 9,
          down(s) { pos += s === 0 ? 1 : -1; sfx.play('tick', s); },
          update(dt) { if (cpuOn) { cpuT -= dt; if (cpuT <= 0) { cpuT = 1 / ([0, 5.6, 7, 8.6][lv] * (0.85 + Math.random() * 0.3)); pos -= 1; } } if (pos >= lim) finishRound(0); if (pos <= -lim) finishRound(1); },
          timeout() { finishRound(pos > 0 ? 0 : pos < 0 ? 1 : -1); },
          draw() {
            const { W, H, h } = R(), y = h + pos / lim * h * 0.6;
            g.strokeStyle = '#b08b5a'; g.lineWidth = 10; g.beginPath(); g.moveTo(W / 2, 30); g.lineTo(W / 2, H - 30); g.stroke();
            g.fillStyle = '#ff5a5a'; rr(g, W / 2 - 22, y - 8, 44, 16, 6); g.fill();
            g.strokeStyle = INK; g.setLineDash([6, 6]); g.lineWidth = 2; [h + h * 0.6, h - h * 0.6].forEach(yy => { g.beginPath(); g.moveTo(W / 2 - 60, yy); g.lineTo(W / 2 + 60, yy); g.stroke(); }); g.setLineDash([]);
            [0, 1].forEach(s => half(s, up => { btn(g, { x: R().W / 2 - 80, y: h - 120, w: 160, h: 80, label: '連打!' }, { fill: pressed[s] ? (s ? COL.p2 : COL.p1) : '#fff', size: 26, flip: up }); }));
          } };
      },
      don: () => {   // 合図のあとに先に押す
        const at = 1.4 + Math.random() * 2.6; let t = 0, go = false, cpuAt = 0;
        return { title: '早押しドン!', how: '「ドン!」が出たら押す。はやすぎたら負け!', dur: 8,
          down(s) { if (!go) { finishRound(1 - s); M.foul = s; return; } finishRound(s); },
          update(dt) { t += dt; if (!go && t >= at) { go = true; sfx.play('buzz'); cpuAt = t + [0, 0.42, 0.32, 0.24][lv] + (Math.random() - 0.5) * 0.12; } if (go && cpuOn && t >= cpuAt) finishRound(1); },
          timeout() { finishRound(-1); },
          draw() {
            const { W, h } = R();
            [0, 1].forEach(s => half(s, up => { btn(g, { x: W / 2 - 90, y: h - 140, w: 180, h: 100, label: go ? 'ドン!!' : 'まだ…' }, { fill: go ? '#ffd36b' : '#fff', size: 30, flip: up }); }));
            if (go) banner(g, S, two, 'ドン!!', { size: 54, color: '#ffd36b' });
          } };
      },
      balloon: () => {   // 長押しでふくらます。割れたら0
        const st = [0, 0].map(() => ({ v: 0, pop: 0.8 + Math.random() * 0.2, done: false, popped: false })); let cpuStop = [0, 0.66, 0.76, 0.84][lv] + Math.random() * 0.08;
        const fin = () => { if (st.every(x => x.done)) { const a = st[0].popped ? 0 : st[0].v, b = st[1].popped ? 0 : st[1].v; finishRound(a > b ? 0 : b > a ? 1 : -1); } };
        return { title: '風船ふくらまし', how: '押しているあいだ ふくらむ。割れる前に はなす!', dur: 9,
          up(s) { if (st[s].v > 0) { st[s].done = true; fin(); } },
          update(dt) {
            [0, 1].forEach(s => { const x = st[s]; if (x.done) return; const hold = s === 0 ? pressed[0] : cpuOn ? x.v < cpuStop : pressed[1]; if (hold) { x.v += dt * 0.24; if (x.v >= x.pop) { x.popped = x.done = true; sfx.play('pop'); fin(); } } else if (s === 1 && cpuOn && x.v >= cpuStop) { x.done = true; fin(); } });
          },
          timeout() { st.forEach(x => (x.done = true)); fin(); },
          draw() {
            const { W, h } = R();
            [0, 1].forEach(s => half(s, up => {
              const x = st[s], r = 18 + x.v * h * 0.32;
              if (x.popped) T(up, '💥 パン!', W / 2, h * 0.45, { size: 30, color: '#ff5a5a' });
              else { g.fillStyle = s ? COL.p2 : COL.p1; g.beginPath(); g.ellipse(W / 2, h * 0.5 - r * 0.2, r * 0.85, r, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(W / 2 - r * 0.3, h * 0.5 - r * 0.55, r * 0.18, r * 0.28, -0.4, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W / 2, h * 0.5 + r * 0.8); g.lineTo(W / 2, h - 130); g.stroke(); }
              T(up, `${Math.round((x.popped ? 0 : x.v) * 100)}`, W - 40, h * 0.3, { size: 22 });
              if (!up || two) btn(g, { x: W / 2 - 90, y: h - 110, w: 180, h: 76, label: x.done ? 'OK!' : '押して ふくらます' }, { fill: pressed[s] ? '#ffe58a' : '#fff', size: 17, flip: up });
            }));
          } };
      },
      daruma: () => {   // 押しているあいだ進む。鬼が見たら止まる
        const st = [0, 0].map(() => ({ d: 0, caught: 0 })); let t = 0, look = false, phaseT = 2.2 + Math.random() * 1.5, cpuHold = false;
        return { title: 'だるまさんがころんだ', how: '押していると前へ。「ころんだ!」で はなす。動いていたら スタートにもどる', dur: 12,
          update(dt) {
            t += dt; phaseT -= dt;
            if (phaseT <= 0) { look = !look; phaseT = look ? 1.2 + Math.random() * 0.8 : 1.6 + Math.random() * 2.2; if (look) sfx.play('buzz'); }
            if (cpuOn) { const risky = [0, 0.55, 0.32, 0.18][lv]; cpuHold = !look && phaseT > risky; }
            [0, 1].forEach(s => {
              const x = st[s], hold = s === 0 ? pressed[0] : cpuOn ? cpuHold : pressed[1];
              if (x.caught > 0) { x.caught -= dt; return; }
              if (hold) { if (look) { x.d = 0; x.caught = 0.8; sfx.play('ng'); } else x.d += dt * 0.16; }
              if (x.d >= 1) finishRound(s);
            });
          },
          timeout() { finishRound(st[0].d > st[1].d ? 0 : st[1].d > st[0].d ? 1 : -1); },
          draw() {
            const { W, h } = R();
            txt(g, look ? '👹' : '🙈', W / 2, h, { size: 46 });
            [0, 1].forEach(s => half(s, up => {
              const x = st[s], y = h - 150 - x.d * (h - 190);
              g.strokeStyle = 'rgba(0,0,0,0.15)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(W / 2 - 60, 40); g.lineTo(W / 2 + 60, 40); g.stroke(); g.setLineDash([]);
              T(up, x.caught > 0 ? '😵' : s ? '🏃' : '🏃‍♀️', W / 2, y, { size: 34 });
              T(up, look ? 'ころんだ!' : 'だるまさんが…', W / 2, 70, { size: 18, color: look ? '#ff5a5a' : INK });
              if (!up || two) btn(g, { x: W / 2 - 90, y: h - 100, w: 180, h: 70, label: '押して すすむ' }, { fill: pressed[s] ? '#ffe58a' : '#fff', size: 17, flip: up });
            }));
          } };
      },
      stop: () => {   // 5.00秒ぴったりで止める
        let t = 0; const st = [null, null], cpuAt = 5 + (Math.random() - 0.5) * 2 * [0, 0.45, 0.25, 0.1][lv];
        const fin = () => { if (st[0] != null && st[1] != null) { const a = Math.abs(st[0] - 5), b = Math.abs(st[1] - 5); finishRound(a < b ? 0 : b < a ? 1 : -1); } };
        return { title: 'ぴったりストップ', how: '5.00秒ちょうどで押す! 数字はとちゅうで消えるよ', dur: 9,
          down(s) { if (st[s] == null) { st[s] = t; sfx.play('tap'); fin(); } },
          update(dt) { t += dt; if (cpuOn && st[1] == null && t >= cpuAt) { st[1] = t; fin(); } },
          timeout() { if (st[0] == null) st[0] = 99; if (st[1] == null) st[1] = 99; fin(); },
          draw() {
            const { W, h } = R();
            [0, 1].forEach(s => half(s, up => {
              const v = st[s] != null ? st[s] : t, show = st[s] != null || t < 1.6;
              T(up, show ? v.toFixed(2) : '?.??', W / 2, h * 0.42, { size: 48, color: st[s] != null ? (Math.abs(st[s] - 5) < 0.1 ? '#3fbf6a' : INK) : INK });
              if (!up || two) btn(g, { x: W / 2 - 90, y: h - 110, w: 180, h: 76, label: st[s] != null ? 'ストップ!' : 'とめる' }, { fill: st[s] != null ? '#ffe58a' : '#fff', size: 22, flip: up });
            }));
          } };
      },
      color: () => {   // 英語の色の名前と同じ色を押す(字の色にまどわされないで)
        const pick = () => { const c = COLORS[Math.floor(Math.random() * COLORS.length)]; let ink; do { ink = COLORS[Math.floor(Math.random() * COLORS.length)]; } while (ink === c && Math.random() < 0.8); return { c, ink, opts: shuffle([c, ...shuffle(COLORS.filter(x => x !== c)).slice(0, 3)]) }; };
        let q = pick(), lock = [0, 0], got = [0, 0], cpuT = 0, n = 0, wait = 0;
        const reset = () => { cpuT = [0, 1.15, 0.85, 0.6][lv] + Math.random() * 0.3; };
        reset();
        const answer = (s, c) => {
          if (wait > 0 || lock[s] > 0) return;
          if (c === q.c) { got[s]++; n++; sfx.play('ok'); wait = 0.6; if (n >= 3) setTimeout(() => finishRound(got[0] > got[1] ? 0 : got[1] > got[0] ? 1 : -1), 400); }
          else { lock[s] = 1; sfx.play('ng'); }
        };
        const B = (W, h) => q.opts.map((c, i) => ({ x: 16 + (i % 2) * (W - 32) / 2, y: h - 150 + Math.floor(i / 2) * 70, w: (W - 48) / 2, h: 60, c }));
        return { title: 'カラータッチ', how: '英語の色の名前と同じ色を押す! 字の色にだまされないで(3問)', dur: 12,
          down(s, p) { const { W, h } = R(); const b = B(W, h).find(b => hit(b, p)); if (b) answer(s, b.c); },
          update(dt) {
            lock = lock.map(x => Math.max(0, x - dt));
            if (wait > 0) { wait -= dt; if (wait <= 0 && n < 3) { q = pick(); reset(); } return; }
            if (cpuOn && n < 3) { cpuT -= dt; if (cpuT <= 0) { answer(1, Math.random() < [0, 0.75, 0.85, 0.94][lv] ? q.c : q.opts.find(c => c !== q.c)); reset(); } }
          },
          timeout() { finishRound(got[0] > got[1] ? 0 : got[1] > got[0] ? 1 : -1); },
          draw() {
            const { W, h } = R();
            [0, 1].forEach(s => half(s, up => {
              if (wait <= 0) T(up, q.c[0], W / 2, h * 0.28, { size: 46, color: q.ink[1], stroke: '#fff', sw: 6, font: 'Georgia,serif' });
              T(up, `${got[s]}`, 30, h * 0.28, { size: 24 });
              if (!up || two) B(W, h).forEach(b => btn(g, { ...b, label: '' }, { fill: b.c[1], alpha: lock[s] > 0 ? 0.35 : 1 }));
              else B(W, h).forEach(b => btn(g, { ...b, label: '' }, { fill: b.c[1], alpha: 0.5 }));
            }));
          } };
      },
    };
    next();
    const stop = loop(dt => {
      pt0 += dt;
      if (phase === 'intro' && pt0 > 2.4) { phase = 'play'; pt0 = 0; sfx.play('go'); }
      else if (phase === 'play') { M.update && M.update(dt); if (pt0 > M.dur && phase === 'play') M.timeout(); }
      else if (phase === 'res' && pt0 > 1.6) next();
      draw();
    });
    function draw() {
      S.begin(); const { W, H, h } = R();
      g.fillStyle = '#fff3f7'; g.fillRect(0, h, W, h); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, W, h);
      g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h); g.lineTo(W, h); g.stroke();
      // 勝ち数
      [0, 1].forEach(s => half(s, up => {
        for (let k = 0; k < Math.ceil(total / 2); k++) T(up, k < wins[s] ? '★' : '☆', 20 + k * 22, 22, { size: 18, color: s ? COL.p2d : COL.p1d });
        T(up, host.players[s].name, W - 12, 22, { size: 13, align: 'right', color: s ? COL.p2d : COL.p1d });
      }));
      if (M && (phase === 'play' || phase === 'res')) M.draw();
      if (M && phase === 'intro') {
        [0, 1].forEach(s => half(s, up => { T(up, `第${ri + 1}戦`, W / 2, h * 0.3, { size: 16, color: '#8d7f9e' }); T(up, M.title, W / 2, h * 0.48, { size: 28, color: INK }); T(up, M.how, W / 2, h * 0.66, { size: 13, color: '#6b5a80', maxW: W - 40 }); }));
        if (pt0 > 1.6) banner(g, S, two, 'READY…', { size: 30 });
      }
      if (phase === 'res') banner(g, S, two, roundWin === -1 ? 'ひきわけ' : `${host.players[roundWin].name} の勝ち!`, { size: 26, color: roundWin === 0 ? COL.p1 : roundWin === 1 ? COL.p2 : '#fff' });
    }
    return { stop() { stop(); pt.off(); S.cv.remove(); } };
  },
};
