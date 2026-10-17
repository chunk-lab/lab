// バランス調整のシミュレーション: node tests/balance.sim.js [回数]
// 実際の辞書・供給・判定エンジン・探索を使い、腕前の違うプレイヤーでタイムアタックを回す
const { Supply, Dict, U, G, Game } = require('./load.js')();
const T = Game.TUNE, dict = Dict.makeDefault(), N = +(process.argv[2] || 200);
const PLAYERS = {
  '初心者': { think: 5.5, perPart: 1.6, chunk: 3.2, fail: .28 },
  '中級':   { think: 3.0, perPart: 1.0, chunk: 1.8, fail: .14 },
  '上級':   { think: 1.4, perPart: .55, chunk: 1.0, fail: .06 }
};
const CFG = { auto: { art: true, prep: true, verb: true, ti: true, er: true } };
function game(P, seed) {
  const rnd = U.rng(seed), sup = Supply.create(dict, { rnd, maxLevel: 2 });
  let items = [], time = 60, t = 0, sentences = 0, words = 0, combo = 0, score = 0, comboT = 0;
  const refill = () => { while (items.length < 22) { const w = sup.next(items, 22, .07); if (w) items.push({ word: w }); } };
  refill();
  while (time > 0 && t < 900) {
    const sol = Supply.solve(items, CFG, 2500);
    if (!sol) { t += 1; time -= 1; continue; }
    const chunksToBuild = sol.parts.filter(p => p.src.length > 1).length;
    let cost = P.think + P.perPart * sol.parts.length + P.chunk * chunksToBuild;
    cost *= .75 + rnd() * .5;
    t += cost; time -= cost; comboT -= cost; if (comboT <= 0) combo = 0;
    if (time <= 0) break;
    if (rnd() < P.fail) { time -= rnd() < .4 ? T.failTri : T.failX; combo = 0; continue; }
    const n = G.wordCount(sol.parts.map(p => p.c));
    combo += 2 + chunksToBuild; comboT = T.comboWin;
    for (let k = 0; k < chunksToBuild; k++) time = Math.min(90, time + T.chunkTime * Game.decay(t));
    time = Math.min(90, time + Game.sentExt(n, false, combo, t));
    sentences++; words += n; score += Math.round((20 * n + 35 * (sol.parts.length - 1)) * (1 + Math.min(combo, T.multCap) * T.multStep));
    const used = new Set(); sol.parts.forEach(p => p.src.forEach(i => used.add(i)));
    items = items.filter(i => !used.has(i)); refill();
  }
  return { len: t, sentences, words, score };
}
function over(P, seed) {
  const rnd = U.rng(seed), sup = Supply.create(dict, { rnd, maxLevel: 2 });
  let items = [], t = 0, spawnT = T.overStart, iv = T.overStart, sentences = 0, busy = 0;
  while (items.length < 18) items.push({ word: sup.next(items, 18, .07) });
  while (t < 1200) {
    const dt = .25; t += dt; spawnT -= dt; busy -= dt;
    iv = Game.overInterval(sentences, t); if (spawnT <= 0) { spawnT = iv; const w = sup.next(items, 22, .07); if (w) items.push({ word: w }); }
    if (items.length > 34) break;
    if (busy > 0) continue;
    const sol = Supply.solve(items, CFG, 2500); if (!sol) { busy = 1; continue; }
    const chunks = sol.parts.filter(p => p.src.length > 1).length;
    busy = (P.think + P.perPart * sol.parts.length + P.chunk * chunks) * (.75 + rnd() * .5);
    if (rnd() < P.fail) continue;
    const used = new Set(); sol.parts.forEach(p => p.src.forEach(i => used.add(i))); items = items.filter(i => !used.has(i));
    sentences++;
  }
  return { len: t, sentences };
}
const stat = a => { a = a.slice().sort((x, y) => x - y); const m = a.reduce((s, x) => s + x, 0) / a.length; return { avg: +m.toFixed(1), p10: +a[Math.floor(a.length * .1)].toFixed(1), p90: +a[Math.floor(a.length * .9)].toFixed(1), max: +a[a.length - 1].toFixed(1) }; };
const out = {};
for (const [name, P] of Object.entries(PLAYERS)) {
  const rs = []; for (let i = 0; i < N; i++) rs.push(game(P, 1000 + i));
  const os = []; for (let i = 0; i < Math.ceil(N / 2); i++) os.push(over(P, 5000 + i));
  out[name] = { あふれ生存秒: stat(os.map(r => r.len)), あふれ文数: stat(os.map(r => r.sentences)), プレイ時間: stat(rs.map(r => r.len)), 文の数: stat(rs.map(r => r.sentences)), 平均語数: +(rs.reduce((s, r) => s + r.words, 0) / Math.max(1, rs.reduce((s, r) => s + r.sentences, 0))).toFixed(2), スコア: stat(rs.map(r => r.score)) };
}
console.log(JSON.stringify(out, null, 1));
