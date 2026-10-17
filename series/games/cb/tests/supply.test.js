// 供給のテスト:1万回の補充で「文が作れない盤面」が0であること
const { Supply, Dict, U, Seeds } = require('./load.js')();
const dict = Dict.makeDefault();
const CFGS = { auto: { auto: { art: true, prep: true, verb: true, ti: true, er: true } }, man: { auto: { art: false, prep: false, verb: false, ti: false, er: false } } };
let fail = 0, total = 0;
for (const [name, cfg] of Object.entries(CFGS)) for (const lv of [2, 3, 4]) {
  const rnd = U.rng(1234 + lv), sup = Supply.create(dict, { rnd, maxLevel: lv, cfg, seeds: Seeds.create(dict, { rnd, cfg, level: lv - 1, maxLevel: lv }) });
  let items = [], stuckRaw = 0, noSent = 0, refills = 0, catTot = {}, checks = 0, rescues = 0;
  const add = () => { const w = sup.next(items, 22); if (!w) return; if (w.k === 'v') w.f = 'base'; if (w.k === 'sm') w.t = 'pres'; if (w.k === 'be') w.v = 'pres'; items.push({ word: w }); refills++; const c = Supply.catOf(w); catTot[c] = (catTot[c] || 0) + 1; };
  while (items.length < 22) add();
  for (let step = 0; step < 10000 / 6; step++) {
    // ランダムに1〜5個使う(文やチャンクで消費した想定)
    const n = 1 + Math.floor(rnd() * 5); for (let i = 0; i < n && items.length; i++) items.splice(Math.floor(rnd() * items.length), 1);
    while (items.length < 22) add();
    if (!sup.feasible(items).ok) stuckRaw++;
    // ゲームと同じ救済:文が作れなければ、古い機能語を救済の1語と入れ替える(2秒ごと×最大3回)
    let ok = false;
    for (let r = 0; r <= 3 && !ok; r++) {
      ok = sup.feasible(items).ok && !!Supply.solve(items, cfg, 3000);
      if (!ok && r < 3) { const i = items.findIndex(x => /^(det|q|prep|er|ti|conj|modal|not|deg)$/.test(x.word.k)); if (i >= 0) items.splice(i, 1); items.push({ word: sup.rescue(items) }); rescues++; }
    }
    checks++; if (!ok) { noSent++; console.log('  詰み盤面:', items.map(x => x.word.e ? x.word.e.w + '(' + x.word.k + (x.word.e.fr ? ':' + x.word.e.fr : '') + ')' : x.word.v + '(' + x.word.k + ')').join(' ')); }
  }
  const tot = Object.values(catTot).reduce((a, b) => a + b, 0);
  console.log(`${name} lv${lv}: 補充 ${refills}回, 救済 ${rescues}回, 救済後も文なし ${noSent}/${checks} | ` + Object.entries(catTot).map(([k, v]) => k + ' ' + (v / tot * 100).toFixed(0) + '%').join(' '));
  if (noSent) fail++; total += refills;
}
console.log('補充の合計 ' + total + '回 / 詰み(文が作れない盤面) ' + (fail ? 'あり' : '0'));
process.exitCode = fail ? 1 : 0;
