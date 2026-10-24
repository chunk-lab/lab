// 釣りのしくみ(画面とは別)。自分・砂吹さん(ボット)・記録の再生で同じものを使う。
//   池の座標:x = -1(左)〜1(右)、d = 0(手前の岸)〜1(むこう岸)。岸の自分は (0, 0)
//   流れ:ready(ねらう) → charge(ためる) → fly(とんでいる) → water(水の中:待つ/巻く) → fight(ファイト) → landed / lost
import { FISH, ITEMS, AREAS, areaAt, RARITY_PTS, gearById } from './data.js';

export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const timeOf = h => (h >= 5 && h < 9 ? 'morning' : h >= 9 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'evening' : 'night');
const PH = ['ready', 'charge', 'fly', 'water', 'fight', 'landed', 'lost'];

// 出やすさ(条件に合わないものは 0)
function weightOf(sp, cond) {
  if (sp.season && !sp.season.includes(cond.season)) return 0;
  const tm = timeOf(cond.hour);
  if (sp.time !== 'any' && sp.time !== tm && !(sp.rain && cond.rain && tm !== 'day')) return 0;
  let w = [0, 100, 40, 14, 4.2, 1.1][sp.r];
  if (sp.time !== 'any') w *= 2.2;
  if (sp.rain) w *= cond.rain ? 3 : 0.7;
  if (sp.id === 'kingoi' && tm === 'morning') w *= 3;
  if (sp.id === 'nushi' && !cond.rain) w *= 0.35;
  return w;
}
function pickWeighted(list, r) { const tot = list.reduce((a, b) => a + b[1], 0); let x = r() * tot; for (const [v, w] of list) { if ((x -= w) <= 0) return v; } return list.length ? list[list.length - 1][0] : null; }
function pointIn(area, r) {
  if (area !== 'open' && AREAS[area]) { const a = AREAS[area]; return [a.x0 + (a.x1 - a.x0) * r(), a.d0 + (a.d1 - a.d0) * r()]; }
  for (let k = 0; k < 20; k++) { const x = -0.85 + r() * 1.7, d = 0.12 + r() * 0.82; if (areaAt(x, d) === 'open') return [x, d]; }
  return [0, 0.5];
}

export function createEngine({ seed = 1, cond = { hour: 12, season: 'summer', rain: false }, gear = {}, onEvent = () => {}, record = false } = {}) {
  const rs = rng(seed), rb = rng(seed ^ 0x5bd1e995);   // rs=池(魚の出かた。対戦では同じになる) / rb=ふるまい
  const G = { rod: gearById('rod', gear.rod), reel: gearById('reel', gear.reel), line: gearById('line', gear.line), bait: gearById('bait', gear.bait) };
  const S = {
    t: 0, ph: 'ready', aim: 0, p: 0, pDir: 1, chargeT: 0,
    lure: { x: 0, d: 0.3, sx: 0, sd: 0, tx: 0, td: 0, fly: 0, flyT: 1 }, baitOk: true, waitT: 0, twitchT: 0,
    bob: { dip: 0, sunk: 0, nib: 0 }, fish: [], engaged: null, bite: null, hooked: null, result: null, resultT: 0, locked: false,
    catches: [], score: { count: 0, big: 0, point: 0 },
  };
  const input = { reel: 0, side: 0 };
  const ev = (type, data = {}) => { onEvent(type, data); if (record) log.ev.push([Math.round(S.t * 10), type, data.id || data.reason || '', data.size || 0, data.pts || 0]); };
  const log = { s: '', ev: [] }; let recT = 0;
  const isLure = () => G.bait.type === 'lure';

  // ---- 池の魚 ----
  function spawn(first) {
    const cand = FISH.map(sp => [sp, weightOf(sp, cond)]).filter(a => a[1] > 0);
    const sp = pickWeighted(cand, rs); if (!sp) return;
    const area = sp.area[Math.floor(rs() * sp.area.length)];
    const [x, d] = pointIn(area, rs);
    const u = Math.pow(rs(), 1.7), size = Math.round((sp.size[0] + (sp.size[1] - sp.size[0]) * u) * 10) / 10;
    S.fish.push({ sp, size, u, x, d, hx: x, hd: d, area, tx: x, td: d, st: 'roam', cool: first ? 0 : 2, retarget: 0, vis: first ? 1 : 0, wig: rs() * 6 });
  }
  const POP = () => 6 + (cond.rain ? 1 : 0) + (timeOf(cond.hour) === 'night' ? 1 : 0);
  for (let i = 0; i < POP(); i++) spawn(true);
  let churnT = 6 + rs() * 6;

  function fishUpdate(f, dt) {
    const sp = f.sp;
    if (f.st === 'gone') { f.vis -= dt * 0.8; return; }
    f.vis = Math.min(1, f.vis + dt * 0.5);
    f.cool = Math.max(0, f.cool - dt);
    let sx = 0.05 + 0.03 * Math.min(1, sp.str), tx = f.tx, td = f.td;
    if (f.st === 'roam') {
      if ((f.retarget -= dt) <= 0 || Math.hypot(f.tx - f.x, f.td - f.d) < 0.02) { const area = sp.area[Math.floor(rb() * sp.area.length)]; [f.tx, f.td] = pointIn(area, rb); f.retarget = 3 + rb() * 5; }
    } else if (f.st === 'approach' || f.st === 'nibble' || f.st === 'bite') {
      tx = S.lure.x; td = S.lure.d; sx = f.st === 'approach' ? (isLure() ? 0.32 : 0.09) : 0.25;
    } else if (f.st === 'flee') {
      sx = 0.35; if ((f.fleeT -= dt) <= 0) { f.st = 'roam'; f.cool = 8; }
    }
    if (f.st !== 'flee') { f.tx2 = tx; f.td2 = td; }
    const ax = (f.st === 'flee' ? f.tx : tx) - f.x, ad = (f.st === 'flee' ? f.td : td) - f.d, l = Math.hypot(ax, ad);
    if (l > 0.002) { const k = Math.min(1, sx * dt / l); f.x += ax * k; f.d += ad * k; f.hx = ax / l; f.hd = ad / l; }
    f.x = clamp(f.x, -0.95, 0.95); f.d = clamp(f.d, 0.04, 1);
  }

  // ---- 魚がエサ・ルアーに気づく ----
  function attract(dt) {
    if (!S.baitOk || S.engaged) return;
    const lure = S.lure, moving = input.reel > 0.05, tm = timeOf(cond.hour);
    for (const f of S.fish) {
      if (f.st !== 'roam' || f.cool > 0 || f.vis < 0.8) continue;
      const RAD = isLure() ? 0.46 : 0.34, dist = Math.hypot(f.x - lure.x, f.d - lure.d); if (dist > RAD) continue;
      let pref = f.sp.bait[G.bait.id] || 0;
      if (G.bait.id === 'glow') pref = Math.max(pref, tm === 'night' ? 0.55 : 0.12);
      if (!pref) continue;
      let m;
      if (isLure()) {
        const want = f.sp.speed, thr = input.reel;
        if (!moving) m = S.twitchT > 0 ? (want === 'twitch' ? 1.6 : 0.6) : want === 'still' ? 0.6 : 0.12;
        else if (want === 'slow') m = thr < 0.55 ? 1.2 : 0.45;
        else if (want === 'fast') m = thr > 0.6 ? 1.3 : 0.4;
        else if (want === 'twitch') m = S.twitchT > 0 ? 1.7 : 0.55;
        else m = 0.8;
        if (G.bait.id === 'frog' && areaAt(lure.x, lure.d) === 'lily') m *= 1.6;
      } else m = moving ? 0.3 : 1 + Math.min(0.5, S.waitT * 0.03);
      const p = pref * m * (1 - dist / RAD) * (isLure() ? 2.0 : 0.75);
      if (rb() < p * dt) { f.st = 'approach'; S.engaged = f; f.nibbles = isLure() ? 0 : Math.max(0, f.sp.wary + Math.floor(rb() * 2) - (rb() < 0.4 ? 1 : 0)); f.nibT = 0.5 + rb() * 0.8; return; }
    }
  }
  function engagedUpdate(dt) {
    const f = S.engaged; if (!f) return;
    const dist = Math.hypot(f.x - S.lure.x, f.d - S.lure.d);
    if (f.st === 'approach') {
      if (isLure() && input.reel < 0.05 && S.twitchT <= 0 && f.sp.speed !== 'still' && rb() < 0.35 * dt) { leave(f, 'miss'); return; }   // 止めたルアーは見切られることも
      if (dist < 0.025) { f.st = f.nibbles > 0 ? 'nibble' : 'bite'; if (f.st === 'bite') startBite(f); else { f.nibT = 0.25 + rb() * 0.4; } }
    } else if (f.st === 'nibble') {
      if ((f.nibT -= dt) <= 0) { f.nibbles--; S.bob.nib = 1; ev('nibble', {}); if (f.nibbles <= 0) { f.nibT = 0.5 + rb() * 0.9; f.st = 'nibble2'; } else f.nibT = 0.6 + rb() * 0.9; }
    } else if (f.st === 'nibble2') { if ((f.nibT -= dt) <= 0) { f.st = 'bite'; startBite(f); } }
    else if (f.st === 'bite') {
      if (S.t - S.bite.t0 > S.bite.win) {   // 合わせそこね
        if (!isLure() && rb() < 0.75) { S.baitOk = false; ev('stolen'); } else ev('miss');
        leave(f, 'miss');
      }
    }
  }
  function startBite(f) { const win = f.sp.win * (isLure() ? 0.85 : 1) * (0.85 + 0.3 * rb()); S.bite = { f, t0: S.t, win }; ev('bite', { heavy: f.sp.str > 1 }); }
  function leave(f, why) { f.st = 'flee'; f.fleeT = 1.5; const a = rb() * 6.28; f.tx = clamp(f.x + Math.cos(a) * 0.4, -0.9, 0.9); f.td = clamp(f.d + Math.abs(Math.sin(a)) * 0.4, 0.1, 1); if (S.engaged === f) S.engaged = null; S.bite = null; }
  function spookNear(x, d, r, chance) { for (const f of S.fish) if (f.st === 'roam' || f.st === 'approach') { if (Math.hypot(f.x - x, f.d - d) < r && rb() < chance) leave(f, 'spook'); } }

  // ---- 引っかかる(ゴミ・アイテム) ----
  function snag(dt) {
    if (!S.baitOk || S.engaged) return;
    const a = areaAt(S.lure.x, S.lure.d), mult = a === 'open' ? 1 : a === 'lily' ? 1.2 : 2;
    const p = (input.reel > 0.05 ? 0.012 * input.reel : S.waitT > 6 ? 0.006 : 0) * mult;
    if (rb() < p * dt) {
      const tm = timeOf(cond.hour);
      const cand = ITEMS.filter(it => (!it.season || it.season.includes(cond.season)) && (it.time === 'any' || it.time === tm)).map(it => [it, [0, 100, 30, 10, 3, 0.8][it.r] * (it.area.includes(a) ? 2 : 1)]);
      const it = pickWeighted(cand, rb); if (it) hook({ sp: it, size: 0, u: 0.5, x: S.lure.x, d: S.lure.d, item: true }, true);
    }
  }

  // ---- ファイト ----
  function hook(f, auto) {
    const L = Math.hypot(f.x * 0.95, f.d);
    S.hooked = { f, sp: f.sp, size: f.size, u: f.u, L, phi: Math.atan2(f.x * 0.95, f.d), S: 1, mode: 'rest', modeT: 0.5, T: 0.2, bm: 0, sl: 0, jump: 0, dir: rb() < 0.5 ? -1 : 1, heavy: !!f.sp.heavy };
    if (!auto) S.fish.splice(S.fish.indexOf(f), 1);
    S.engaged = null; S.bite = null; S.ph = 'fight';
    ev('hooked', { id: f.sp.id, auto: !!auto, item: !!f.item });
  }
  function fight(dt) {
    const h = S.hooked, sp = h.sp, thr = clamp(input.reel, 0, 1);
    const F = sp.str * (0.75 + 0.5 * h.u);
    let pull = h.heavy ? F * 0.55 : F * (h.mode === 'run' ? 1 : 0.35) * (0.35 + 0.65 * h.S);
    pull /= Math.sqrt(G.rod.power);
    let T = pull * (0.4 + 0.9 * thr) / G.line.str + thr * 0.06, slip = 0;
    if (T > 0.9) { const ex = T - 0.9; slip = ex * G.reel.drag * 0.5; T = 0.9 + ex * (1 - G.reel.drag * 0.6); }
    T += Math.sin(S.t * 31) * 0.015 * (h.mode === 'run' ? 1 : 0.3) + (h.jolt || 0); h.jolt = Math.max(0, (h.jolt || 0) - dt * 1.2);
    h.T += (T - h.T) * Math.min(1, dt * 12);
    // 糸の長さ
    let dL = 0;
    if (!h.heavy && h.mode === 'run') dL += 0.1 * Math.sqrt(F) * (0.4 + 0.6 * h.S);
    dL -= thr * G.reel.speed * 0.1 * (1 - Math.min(0.85, pull / (G.line.str * 1.6))) * (h.heavy ? 0.55 : 1);
    dL += slip * 0.6;
    h.L = Math.max(0, h.L + dL * dt);
    // 左右
    if (!h.heavy) {
      if (h.mode === 'run') h.phi += h.dir * 0.42 * dt * (0.5 + h.S);
      else h.phi *= 1 - Math.min(1, dt * 0.25 * thr);
      if (Math.abs(h.phi) > 1.05) { h.phi = Math.sign(h.phi) * 1.05; h.dir = -Math.sign(h.phi); }
    }
    // 体力
    let side = 1;
    if (h.mode === 'run') { const k = input.side * h.dir; side = k < -0.3 ? 1.9 : k > 0.3 ? 0.55 : 1; } else if (Math.abs(input.side) > 0.3) side = 1.15;
    h.S = Math.max(0.05, h.S - (0.03 + 0.16 * h.T) * side * Math.sqrt(G.rod.power) / (sp.stam * (0.7 + 0.6 * h.u)) * dt);
    // あばれる/休む
    if ((h.modeT -= dt) <= 0) {
      if (h.mode === 'run') { h.mode = 'rest'; h.modeT = (0.7 + rb() * 0.9) * (1.3 - h.S * 0.5); }
      else if (!h.heavy && rb() < 0.35 + 0.6 * h.S * sp.run) {
        h.mode = 'run'; h.jolt = 0.22 * Math.min(1.5, F); h.modeT = (0.8 + rb() * 1.4) * (0.5 + h.S) * (0.6 + 0.4 * sp.run);
        h.dir = Math.abs(h.phi) > 0.6 ? -Math.sign(h.phi) : rb() < 0.5 ? -1 : 1;
        if (sp.jump && h.S > 0.25 && rb() < 0.38) { h.jump = 0.9; ev('jump'); }
        ev('run', { dir: h.dir });
      } else { h.mode = 'rest'; h.modeT = 0.5 + rb() * 0.8; }
    }
    // 最後のあがき:まだ元気な大物は、足もとでもう一度走る
    if (!h.heavy && h.L < 0.12 && h.S > 0.3 && F > 0.85 && h.mode !== 'run') { h.mode = 'run'; h.modeT = 1.2 + rb(); h.dir = rb() < 0.5 ? -1 : 1; h.jolt = 0.3; ev('run', { dir: h.dir, last: 1 }); }
    if (h.jump > 0) { h.jump -= dt; if (h.T > 0.72 && rb() < 2.2 * dt) return lose('jump'); }
    // 切れる・はずれる
    if (h.T > 1) h.bm += ((h.T - 1) * 5 + 0.7) * dt; else h.bm = Math.max(0, h.bm - 0.35 * dt);
    if (h.bm >= 1 || h.L > 1.3) return lose('snap');
    if (h.T < 0.1 && thr < 0.05 && !h.heavy) h.sl += dt; else h.sl = Math.max(0, h.sl - dt * 2);
    if (h.sl > 1.8) return lose('slack');
    if (h.L < 0.035) return land();
    S.lure.x = Math.sin(h.phi) * h.L / 0.95; S.lure.d = Math.cos(h.phi) * h.L;
  }
  function lose(reason) { S.ph = 'lost'; S.result = { reason, sp: S.hooked.sp }; S.resultT = 0; ev('lost', { reason, id: S.hooked.sp.id }); S.hooked = null; S.baitOk = true; }
  function land() {
    const h = S.hooked, sp = h.sp, fish = sp.kind === 'fish';
    const pts = fish ? Math.round(RARITY_PTS[sp.r] * (0.6 + 0.8 * h.u)) : sp.kind === 'item' ? Math.round(RARITY_PTS[sp.r] * 0.5) : 1;
    const res = { id: sp.id, size: h.size, u: h.u, pts, kind: sp.kind, t: S.t };
    S.catches.push(res);
    if (fish) { S.score.count++; S.score.big = Math.max(S.score.big, h.size); }
    S.score.point += pts;
    S.ph = 'landed'; S.result = res; S.resultT = 0; S.hooked = null; S.baitOk = true;
    ev('catch', res);
  }

  // ---- 入力 ----
  const tri = t => { const k = t % 2; return k < 1 ? k : 2 - k; };
  const api = {
    S, G, input, cond, log,
    get ph() { return S.ph; },
    setAim(a) { if (S.ph === 'ready' || S.ph === 'charge') S.aim = clamp(a, -1, 1); },
    setGear(slot, id) { if (S.ph !== 'ready') return false; G[slot] = gearById(slot, id); return true; },
    // 着水する予定の場所(ためている力 p から)
    target(p = S.p) {
      const dist = 0.1 + p * G.rod.dist * 0.92, a = S.aim * 0.78;
      return [clamp(Math.sin(a) * dist * 1.08, -0.93, 0.93), clamp(Math.cos(a) * dist, 0.06, 0.98)];
    },
    castStart() { if (S.ph !== 'ready' || S.locked) return; S.ph = 'charge'; S.chargeT = 0; S.p = 0; },
    castRelease() {
      if (S.ph !== 'charge') return;
      let [tx, td] = api.target(); const sc = (1 - G.rod.acc) * 0.13;
      tx = clamp(tx + (rb() - 0.5) * sc, -0.93, 0.93); td = clamp(td + (rb() - 0.5) * sc, 0.06, 0.98);
      Object.assign(S.lure, { sx: 0.05, sd: -0.02, tx, td, fly: 0, flyT: 0.55 + Math.hypot(tx, td) * 0.55, x: 0.05, d: 0 });
      S.ph = 'fly'; ev('cast', { p: S.p });
    },
    hookPress() {   // あわせ(ルアーのときは、しゃくりも兼ねる)
      if (S.ph !== 'water') return;
      const f = S.engaged;
      if (S.bite && f) {
        const dt = S.t - S.bite.t0, q = dt / S.bite.win;
        if (rb() < (q < 0.85 ? 0.95 : 0.7)) { hook(f); return; }
        ev('miss'); leave(f, 'miss'); return;
      }
      if (f && (f.st === 'nibble' || f.st === 'nibble2')) { ev('early'); leave(f, 'early'); spookNear(S.lure.x, S.lure.d, 0.15, 0.3); return; }
      if (isLure()) { S.twitchT = 0.7; S.lure.d = Math.max(0, S.lure.d - 0.012); ev('twitch'); }
      else { ev('jerk'); spookNear(S.lure.x, S.lure.d, 0.12, 0.25); }
    },
    ack() { if (S.ph === 'landed' || S.ph === 'lost') { S.ph = 'ready'; S.result = null; } },
    lock(on = true) { S.locked = on; },
    update(dt) {
      S.t += dt;
      // 池の魚の入れかわり
      if ((churnT -= dt) <= 0) {
        churnT = 7 + rs() * 8;
        const roam = S.fish.filter(f => f.st === 'roam'); if (roam.length > 3) roam[Math.floor(rs() * roam.length)].st = 'gone';
      }
      S.fish = S.fish.filter(f => !(f.st === 'gone' && f.vis <= 0));
      while (S.fish.filter(f => f.st !== 'gone').length < POP()) spawn(false);
      for (const f of S.fish) fishUpdate(f, dt);
      S.bob.nib = Math.max(0, S.bob.nib - dt * 3);
      S.twitchT = Math.max(0, S.twitchT - dt);
      switch (S.ph) {
        case 'charge': S.chargeT += dt; S.p = tri(S.chargeT * 0.95); break;
        case 'fly': {
          const L = S.lure; L.fly += dt; const u = Math.min(1, L.fly / L.flyT);
          L.x = L.sx + (L.tx - L.sx) * u; L.d = L.sd + (L.td - L.sd) * u; L.h = Math.sin(u * Math.PI) * (0.15 + Math.hypot(L.tx, L.td) * 0.25);
          if (u >= 1) { L.h = 0; S.ph = 'water'; S.waitT = 0; S.baitOk = true; ev('land', { x: L.x, d: L.d }); spookNear(L.x, L.d, 0.07, 0.5); }
          break;
        }
        case 'water': {
          const L = S.lure, thr = input.reel;
          S.waitT = thr > 0.05 ? 0 : S.waitT + dt;
          if (thr > 0.02) {
            const sp = thr * G.reel.speed * (isLure() ? 0.2 : 0.16), l = Math.hypot(L.x, L.d) || 1;
            L.x -= L.x / l * sp * dt; L.d -= L.d / l * sp * dt;
            if (Math.hypot(L.x, L.d) < 0.035) { S.ph = 'ready'; S.engaged && leave(S.engaged, 'miss'); S.baitOk = true; ev('retrieve'); break; }
          }
          attract(dt); engagedUpdate(dt); snag(dt);
          break;
        }
        case 'fight': fight(dt); break;
        case 'landed': case 'lost': S.resultT += dt; break;
      }
      // 記録(0.2秒ごと 5文字)
      if (record && (recT += dt) >= 0.2) { recT -= 0.2; log.s += api.snapCode(); }
    },
    // いまの様子を5文字に(相手の画面で再生する)
    snapCode() {
      const C = CH, q = (v, a, b) => C[clamp(Math.round((v - a) / (b - a) * 63), 0, 63)];
      const ph = PH.indexOf(S.ph), x = S.ph === 'ready' || S.ph === 'charge' ? S.aim * 0.5 : S.lure.x, d = S.ph === 'ready' ? 0 : S.ph === 'charge' ? S.p : S.lure.d;
      const h = S.hooked;
      const bite = S.bite ? 2 : S.bob.nib > 0.3 ? 1 : 0, sz = h ? (h.size > 90 ? 3 : h.size > 45 ? 2 : h.size > 18 ? 1 : 0) : 0;
      const flags = bite | (h && h.jump > 0 ? 4 : 0) | (isLure() ? 8 : 0) | (sz << 4);
      return C[ph] + q(x, -1, 1) + q(d, 0, 1) + q(h ? h.T : S.ph === 'fly' ? (S.lure.h || 0) : 0, 0, 1.3) + C[flags];
    },
  };
  return api;
}
const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export function decodeSnap(s, i) {
  const o = i * 5; if (o + 5 > s.length) return null;
  const v = k => CH.indexOf(s[o + k]);
  const f = v(4);
  return { ph: PH[v(0)], x: v(1) / 63 * 2 - 1, d: v(2) / 63, T: v(3) / 63 * 1.3, bite: f & 3, jump: !!(f & 4), lure: !!(f & 8), sz: f >> 4 };
}
// 記録の再生:t 秒のときの様子
export function replayAt(rec, t) {
  const n = Math.floor(rec.s.length / 5); if (!n) return null;
  const i = Math.min(n - 1, Math.floor(t / 0.2)), a = decodeSnap(rec.s, i), b = decodeSnap(rec.s, Math.min(n - 1, i + 1)), k = (t / 0.2) - i;
  if (!b || a.ph !== b.ph) return a;
  return { ...a, x: a.x + (b.x - a.x) * k, d: a.d + (b.d - a.d) * k, T: a.T + (b.T - a.T) * k };
}

// 砂吹さん(ボット)。lv: 'easy' | 'hard'
export function createBot(engine, lv = 'easy', seed = 3) {
  const r = rng(seed), E = engine, S = E.S;
  const K = lv === 'hard' ? { react: 0.24, sd: 0.08, aimErr: 0.03, early: 0.03, lo: 0.62, hi: 0.9, side: 0.85, wait: 14, lag: 0.22, idle: 1 } : { react: 0.5, sd: 0.22, aimErr: 0.1, early: 0.25, lo: 0.6, hi: 0.95, side: 0.4, wait: 20, lag: 0.45, idle: 3 };
  const seen = [];
  let plan = null, hookAt = -1, waitT = 0, twT = 0, sideLag = 0, idle = 0.8, thrHold = 0;
  const areas = ['weed', 'log', 'lily', 'rock', 'deep', 'open', 'open'];
  E.onBot = (type) => {
    if (type === 'bite') hookAt = S.t + Math.max(0.08, K.react + (r() - 0.5) * 2 * K.sd * 1.7);
    if (type === 'nibble' && r() < K.early) hookAt = S.t + 0.15;
  };
  return {
    update(dt) {
      const ph = S.ph;
      if (ph === 'landed' || ph === 'lost') { if (S.resultT > 1.6) E.ack(); E.input.reel = 0; return; }
      if (ph === 'ready') {
        E.input.reel = 0; if ((idle -= dt) > 0) return;
        const a = areas[Math.floor(r() * areas.length)], A = AREAS[a];
        let tx, td; if (A) { tx = (A.x0 + A.x1) / 2 + (r() - 0.5) * 0.15; td = (A.d0 + A.d1) / 2; } else { tx = (r() - 0.5) * 1.2; td = 0.3 + r() * 0.5; }
        const dist = Math.hypot(tx / 1.08, td), want = clamp((dist - 0.1) / (E.G.rod.dist * 0.92), 0.15, 1);
        E.setAim(clamp(Math.atan2(tx / 1.08, td) / 0.78, -1, 1)); plan = { want: clamp(want + (r() - 0.5) * K.aimErr * 2, 0.08, 0.96) }; E.castStart(); idle = K.idle + r() * 1.5; return;
      }
      if (ph === 'charge') { if ((Math.abs(S.p - plan.want) < 0.05 && S.chargeT > 0.3) || S.chargeT > 6) E.castRelease(); return; }
      if (ph === 'water') {
        if (hookAt > 0 && S.t >= hookAt) { hookAt = -1; E.hookPress(); return; }
        const lure = E.G.bait.type === 'lure';
        if (!S.baitOk) { E.input.reel = 1; return; }
        if (lure) {
          E.input.reel = S.engaged ? 0.4 : (E.G.bait.id === 'spoon' ? 0.42 : 0.5);
          if ((twT -= dt) <= 0 && E.G.bait.id !== 'spoon') { twT = 1 + r() * 1.2; if (!S.bite) E.hookPress(); }
        } else {
          waitT += dt; E.input.reel = 0;
          if (waitT > K.wait + r() * 8 && !S.engaged) { thrHold = 1.2; waitT = 0; }
          if (thrHold > 0) { thrHold -= dt; E.input.reel = 0.6; }
        }
        return;
      }
      if (ph === 'fight') {
        const h = S.hooked; if (!h) return;
        seen.push([S.t, h.T, h.jump > 0]); while (seen.length > 1 && seen[1][0] <= S.t - K.lag) seen.shift();   // 人と同じように、少しおくれて気づく
        const T = seen[0][1];
        if (seen[0][2]) { E.input.reel = 0; return; }
        if (h.jump > 0) E.input.reel = 0;
        else if (T < K.lo) E.input.reel = 1; else if (T > K.hi) E.input.reel = 0;
        sideLag += ((h.mode === 'run' ? -h.dir * K.side : 0) - sideLag) * Math.min(1, dt * 3);
        E.input.side = sideLag;
      }
    },
  };
}
