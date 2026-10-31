// ビリヤードの物理(台の上を2Dで、回転は3Dで計算する)。単位はメートル・秒。
//   すべり摩擦 → ころがりに移る(押し・引き・ストップが自然に出る)/ ころがり抵抗 / 縦軸の回転(ひねり)の減り方
//   球どうし:ほぼ弾性衝突 / クッション:反発 + ひねりで はね返る角度が変わる / ポケットの角(ジョー)でもはね返る
export const W = 1.27, L = 2.54, R = 0.028575, W2 = W / 2, L2 = L / 2;
export const CM = 0.083, SM = 0.064;   // コーナーポケットの口(レールの切れ目までの長さ)/ サイドポケットの口の半分
const G = 9.81, MU_S = 0.2, MU_R = 0.011, SPIN_D = 9, E_BALL = 0.95, MU_RAIL = 0.17, JL = 0.075;

// クッションの線分(ボールの中心は R より近づけない)。端は丸い角としてはたらく
export const RAILS = (() => {
  const s = [], seg = (ax, az, bx, bz, jaw) => s.push({ ax, az, bx, bz, jaw: !!jaw });
  for (const sx of [-1, 1]) {
    seg(sx * W2, -L2 + CM, sx * W2, -SM); seg(sx * W2, SM, sx * W2, L2 - CM);   // 長いレール(サイドポケットで切れる)
    for (const sz of [-1, 1]) {   // コーナーのジョー(ななめ外へ)
      seg(sx * W2, sz * (L2 - CM), sx * (W2 + JL * 0.74), sz * (L2 - CM + JL * 0.67), 1);
      seg(sx * (W2 - CM), sz * L2, sx * (W2 - CM + JL * 0.67), sz * (L2 + JL * 0.74), 1);
    }
    for (const sz of [-1, 1]) seg(sx * W2, sz * SM, sx * (W2 + 0.06), sz * (SM - 0.008), 1);   // サイドのジョー(少しせまくなる)
  }
  for (const sz of [-1, 1]) seg(-W2 + CM, sz * L2, W2 - CM, sz * L2);   // 短いレール
  return s;
})();
// ポケット(落ちる場所の中心)
export const POCKETS = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => ({ x: sx * (W2 + 0.028), z: sz * (L2 + 0.028), aimx: sx * (W2 - 0.004), aimz: sz * (L2 - 0.004), corner: true }))
  .concat([-1, 1].map(sx => ({ x: sx * (W2 + 0.05), z: 0, aimx: sx * (W2 + 0.012), aimz: 0, corner: false })));

export const FOOT = { x: 0, z: L2 / 2 }, HEAD_Z = -L2 / 2;

export function mkBall(n, x, z) { return { n, x, z, vx: 0, vz: 0, wx: 0, wy: 0, wz: 0, on: true, pk: -1 }; }

// 手球を打つ。ang=向き(ラジアン。0で +z)、v=速さ(m/秒)、a=左右のずれ(-1〜1:右が+)、b=上下のずれ(-1〜1:上が+)
export function strike(c, ang, v, a = 0, b = 0) {
  const dx = Math.sin(ang), dz = Math.cos(ang);
  const sa = a * 0.5, sb = b * 0.5, back = Math.sqrt(Math.max(0, 1 - sa * sa - sb * sb));
  // 当たる点 r(球の中心から)。右 = d × 上(打つ人から見て右)
  const rx = R * (-sa * dz - back * dx), ry = R * sb, rz = R * (sa * dx - back * dz);
  const vx = v * dx, vz = v * dz, k = 5 / (2 * R * R);
  c.vx = vx; c.vz = vz;
  c.wx = k * (ry * vz - rz * 0); c.wy = k * (rz * vx - rx * vz); c.wz = k * (rx * 0 - ry * vx);
}

const moving = b => b.on && (Math.abs(b.vx) > 1e-4 || Math.abs(b.vz) > 1e-4 || Math.abs(b.wy) > 0.05 || Math.abs(b.wx) > 0.05 || Math.abs(b.wz) > 0.05);
export const anyMoving = balls => balls.some(moving);

// 1ステップ(dt秒)。ev に起きたことを入れる: {t:'hit',a,b,v} {t:'rail',n,v} {t:'pot',n,p}
export function step(balls, dt, ev) {
  const n = balls.length;
  for (let i = 0; i < n; i++) {
    const b = balls[i]; if (!b.on) continue;
    // 床との摩擦
    const ux = b.vx + R * b.wz, uz = b.vz - R * b.wx, us = Math.hypot(ux, uz);
    if (us > 1e-5) {   // すべっている
      const dv = MU_S * G * dt, k = Math.min(1, us / (3.5 * dv));   // 行きすぎないように
      const fx = -ux / us * dv * k, fz = -uz / us * dv * k;
      b.vx += fx; b.vz += fz; b.wx += -2.5 * fz / R; b.wz += 2.5 * fx / R;
    } else {   // ころがっている
      const s = Math.hypot(b.vx, b.vz), d = MU_R * G * dt;
      if (s <= d) { b.vx = 0; b.vz = 0; } else { b.vx -= b.vx / s * d; b.vz -= b.vz / s * d; }
      b.wx = b.vz / R; b.wz = -b.vx / R;
    }
    const sd = SPIN_D * dt; b.wy = Math.abs(b.wy) <= sd ? 0 : b.wy - Math.sign(b.wy) * sd;
    b.x += b.vx * dt; b.z += b.vz * dt;
  }
  // 球どうし
  const D = 2 * R, D2 = D * D;
  for (let i = 0; i < n; i++) {
    const a = balls[i]; if (!a.on) continue;
    for (let j = i + 1; j < n; j++) {
      const c = balls[j]; if (!c.on) continue;
      const dx = a.x - c.x, dz = a.z - c.z, d2 = dx * dx + dz * dz; if (d2 >= D2 || d2 < 1e-12) continue;
      const d = Math.sqrt(d2), nx = dx / d, nz = dz / d, push = (D - d) / 2;
      a.x += nx * push; a.z += nz * push; c.x -= nx * push; c.z -= nz * push;
      const vr = (a.vx - c.vx) * nx + (a.vz - c.vz) * nz; if (vr >= 0) continue;
      const J = -(1 + E_BALL) / 2 * vr;
      a.vx += J * nx; a.vz += J * nz; c.vx -= J * nx; c.vz -= J * nz;
      // 少しだけ「スロー」(当たった瞬間のこすれで、的球が横に引っぱられる)
      const tx = -nz, tz = nx, slip = (a.vx - c.vx) * tx + (a.vz - c.vz) * tz + R * (a.wy + c.wy);
      const ft = Math.max(-0.06 * J, Math.min(0.06 * J, slip / 7)) ;
      a.vx -= ft * tx; a.vz -= ft * tz; c.vx += ft * tx; c.vz += ft * tz;
      ev && ev.push({ t: 'hit', a: a.n, b: c.n, v: -vr });
    }
  }
  // クッション・ジョー
  for (let i = 0; i < n; i++) {
    const b = balls[i]; if (!b.on) continue;
    for (const s of RAILS) {
      const ex = s.bx - s.ax, ez = s.bz - s.az, l2 = ex * ex + ez * ez;
      let t = ((b.x - s.ax) * ex + (b.z - s.az) * ez) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = s.ax + ex * t, pz = s.az + ez * t, dx = b.x - px, dz = b.z - pz, d2 = dx * dx + dz * dz;
      if (d2 >= R * R || d2 < 1e-12) continue;
      const d = Math.sqrt(d2), nx = dx / d, nz = dz / d;
      b.x = px + nx * R; b.z = pz + nz * R;
      const vn = b.vx * nx + b.vz * nz; if (vn >= 0) continue;
      const e = Math.max(0.66, Math.min(0.86, 0.88 - 0.045 * -vn));
      const Pn = -(1 + e) * vn, tx = -nz, tz = nx, slip = b.vx * tx + b.vz * tz + b.wy * R;
      const Pt = -Math.sign(slip) * Math.min(MU_RAIL * Pn, Math.abs(slip) * 2 / 7);
      b.vx += Pn * nx + Pt * tx; b.vz += Pn * nz + Pt * tz;
      b.wy += 2.5 * Pt / R;
      b.wx *= 0.35; b.wz *= 0.35;   // クッションの高さで、前への回転はほとんど消える
      ev && ev.push({ t: 'rail', n: b.n, v: -vn });
    }
    // ポケットに入った(クッションの線より中心が外へ出た)
    if (Math.abs(b.x) > W2 + R * 0.5 || Math.abs(b.z) > L2 + R * 0.5) {
      let best = 0, bd = 1e9; POCKETS.forEach((p, k) => { const dd = Math.hypot(p.x - b.x, p.z - b.z); if (dd < bd) { bd = dd; best = k; } });
      b.on = false; b.pk = best; ev && ev.push({ t: 'pot', n: b.n, p: best, vx: b.vx, vz: b.vz, x: b.x, z: b.z });
    }
  }
}

// 1フレームぶん進める(速さに合わせて細かく分ける)
export function advance(balls, frameDt, ev) {
  let mv = 0; for (const b of balls) if (b.on) mv = Math.max(mv, Math.hypot(b.vx, b.vz));
  const n = Math.max(2, Math.min(80, Math.ceil(mv * frameDt / (R * 0.2))));
  for (let i = 0; i < n; i++) step(balls, frameDt / n, ev);
}

// 最後まで計算する(CPUの先読み用)。止まるまで or maxT 秒
export function simulate(balls, maxT = 14) {
  const ev = []; let t = 0;
  while (t < maxT && anyMoving(balls)) { advance(balls, 1 / 60, ev); t += 1 / 60; }
  for (const b of balls) if (b.on) { b.vx = b.vz = b.wx = b.wy = b.wz = 0; }
  return ev;
}

export const clone = balls => balls.map(b => ({ ...b }));

// 置ける場所か(ほかの球と重ならない・台の中)
export function freeAt(balls, x, z, skip) {
  if (Math.abs(x) > W2 - R || Math.abs(z) > L2 - R) return false;
  return balls.every(b => b === skip || !b.on || Math.hypot(b.x - x, b.z - z) >= 2 * R + 0.0005);
}
// フットスポットへ戻す(ふさがっていたら奥へずらす)
export function spot(balls, b) {
  let z = FOOT.z; while (!freeAt(balls, 0, z, b) && z < L2 - R) z += 0.004;
  if (!freeAt(balls, 0, z, b)) { z = FOOT.z; while (!freeAt(balls, 0, z, b) && z > -L2 + R) z -= 0.004; }
  Object.assign(b, { x: 0, z, on: true, pk: -1, vx: 0, vz: 0, wx: 0, wy: 0, wz: 0 });
}

// ラック(9ボール=ひし形 / 8ボール=三角)。1番が手前(頭)、9番・8番がまん中
export function rack(kind) {
  const balls = [mkBall(0, 0, -L2 / 2 - 0.05)], dz = 2 * R * 0.8660254 + 0.0002, dx = R + 0.0001;
  const put = (n, row, col, cnt) => balls.push(mkBall(n, (col - (cnt - 1) / 2) * 2 * dx + (Math.random() - 0.5) * 0.0004, FOOT.z + row * dz + (Math.random() - 0.5) * 0.0003));
  const sh = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  if (kind === 9) {
    const rows = [1, 2, 3, 2, 1], rest = sh([2, 3, 4, 5, 6, 7, 8]);
    rows.forEach((cnt, r) => { for (let c = 0; c < cnt; c++) { const n = r === 0 ? 1 : r === 2 && c === 1 ? 9 : rest.pop(); put(n, r, c, cnt); } });
  } else {
    const solids = sh([1, 2, 3, 4, 5, 6, 7]), stripes = sh([9, 10, 11, 12, 13, 14, 15]);
    const back = Math.random() < 0.5 ? [solids.pop(), stripes.pop()] : [stripes.pop(), solids.pop()];
    const rest = sh(solids.concat(stripes));
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) {
      const n = r === 2 && c === 1 ? 8 : r === 4 && c === 0 ? back[0] : r === 4 && c === 4 ? back[1] : rest.pop();
      put(n, r, c, r + 1);
    }
  }
  return balls;
}
