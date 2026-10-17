// ランダム盤面での実プレイ検証(判定エンジンを使わずに組み合わせを挙げ、人の操作で作る)
// node tests/realplay.e2e.js <level> <boards> [out.json]
const { open } = require('./e2e_lib');
const LEVEL = +(process.argv[2] || 0), BOARDS = +(process.argv[3] || 3), OUT = process.argv[4];
const AUTO_ART = LEVEL === 0;
// ---- 判定エンジンを使わない「プレイヤーの目」:辞書の情報だけで、英語として成り立つ組み合わせを挙げる ----
function candidates(B) {
  const W = B.filter(b => b.word), by = k => W.filter(b => b.word.k === k);
  const nounsC = by('n').filter(b => (b.word.e.c === 'c' || b.word.e.c === 't') && !b.word.pl && !b.word.e.ind);
  const nounsFree = by('n').filter(b => b.word.e.c === 'u' || b.word.e.c === 'p' || b.word.e.c === 'n' || b.word.pl);
  const verbs = by('v'), out = [];
  const add = (type, parts) => { if (parts.every(Boolean) && new Set(parts.map(p => p.id)).size === parts.length) out.push({ type, ids: parts.map(p => p.id), text: parts.map(p => p.text).join(' ') }); };
  const one = a => a[Math.floor(Math.random() * a.length)];
  if (by('modal').length && verbs.length) add('助動詞+動詞', [one(by('modal')), one(verbs)]);
  if (by('sm').length && verbs.length) add('want to など+動詞', [one(by('sm')), one(verbs)]);
  if (by('not').length && verbs.length) add('not+動詞', [one(by('not')), one(verbs)]);
  if (by('be').length && verbs.length) add('be+動詞(進行)', [one(by('be')), one(verbs)]);
  if (by('tp').length && verbs.length) add('動詞+時制パーツ', [one(verbs), one(by('tp'))]);
  if (by('ti').length && verbs.length) add('to+動詞', [one(by('ti')), one(verbs)]);
  const the = W.find(b => b.word.k === 'det' && b.word.v === 'the'), a = W.find(b => b.word.k === 'det' && b.word.v === 'a');
  if ((the || a) && nounsC.length) add('冠詞+名詞', [the || a, one(nounsC)]);
  if ((the || a) && nounsC.length && by('adj').length) add('冠詞+形容詞+名詞', [the || a, one(by('adj')), one(nounsC)]);
  if (by('adj').length && (AUTO_ART ? by('n').length : nounsFree.length)) add('形容詞+名詞', [one(by('adj')), one(AUTO_ART ? by('n') : nounsFree)]);
  const pr = by('pr').filter(b => b.word.v !== 'it');
  if (pr.length && nounsC.length) add('所有(my)+名詞', [one(pr), one(nounsC)]);
  // 前置詞+名詞:場所・時の名詞は、その名詞に合う前置詞を探す(at the airport / on Monday)
  for (const n of by('n').filter(b => b.word.e.prep)) { const p = by('prep').find(b => b.word.v === n.word.e.prep); if (!p) continue; const c = n.word.e.c; if (c === 'n' || c === 'u' || n.word.pl) add('前置詞+名詞', [p, n]); else if (the) add('前置詞+the+名詞', [p, the, n]); if (out.filter(o => o.type.startsWith('前置詞')).length) break; }
  if (by('prep').length && pr.length) add('前置詞+代名詞', [one(by('prep')), one(pr)]);
  return out;
}
function sentences(B) {
  const W = B.filter(b => b.word), by = k => W.filter(b => b.word.k === k), out = [];
  const subj = by('pr'), intr = by('v').filter(b => b.word.e.fr !== 'tr' && !b.word.e.link), tr = by('v').filter(b => b.word.e.fr !== 'intr' && !b.word.e.cv);
  const objs = by('n').filter(b => b.word.e.c === 'u' || b.word.e.c === 'n' || b.word.pl || AUTO_ART);
  if (subj.length && intr.length) out.push({ type: '代名詞+自動詞', ids: [subj[0].id, intr[0].id] });
  if (subj.length > 1 && tr.length) out.push({ type: '代名詞+他動詞+代名詞', ids: [subj[0].id, tr[0].id, subj[1].id] });
  if (subj.length && tr.length && objs.length) out.push({ type: '代名詞+他動詞+名詞', ids: [subj[0].id, tr[0].id, objs[0].id] });
  if (subj.length && by('modal').length && intr.length) out.push({ type: '代名詞+助動詞+動詞', ids: [subj[0].id, by('modal')[0].id, intr[0].id] });
  return out;
}
(async () => {
  const { browser, page, errors } = await open(390, 844);
  const results = [];
  await page.evaluate(([l]) => { const a = window.game._app; a.state.tutorialDone = true; a.state.level = l; a.saveState(); }, [LEVEL]);
  for (let b = 0; b < BOARDS; b++) {
    await page.evaluate(() => window.game.show('game', 'free')); await page.waitForTimeout(4200);
    const snap = await page.evaluate(() => { const g = window.game._app.game; g.calm = true; g.target = 0; g.spawnQ = 0; return g.items.filter(i => i.state !== 'pop').map(i => ({ id: i.id, x: i.x, y: i.y, text: i.text, word: i.word ? JSON.parse(JSON.stringify(i.word)) : null, chunk: !!i.chunk, cw: i.chunk ? JSON.parse(JSON.stringify(i.chunk.words)) : null })); });
    const restore = () => page.evaluate((snap) => {
      const g = window.game._app.game; g.items.forEach(i => { i.state = 'pop'; i.popT = 1; }); g.items.length = 0; g.slots.forEach(s => s.item = null); g.chain = null; g.sel = null; g.drag = null; g.target = 0; g.spawnQ = 0; g.calm = true;
      const G = PuniChunk._internal.G, map = {};
      snap.forEach(s => { const spec = s.word ? s.word : { chunk: G.chainState(s.cw, g.debug.cfg).chunk }; const it = g.spawnWord(spec, s.x, s.y, true); it.vx = it.vy = 0; map[s.id] = it.id; });
      window.__map = map; window.__ev = []; const a = window.game._app; if (!a.__wrapped) { const o = a.emit; a.emit = (n, d) => { (window.__ev = window.__ev || []).push([n, d && (d.code || d.text || (d.chunk && PuniChunk._internal.G.chunkText(d.chunk, window.game._app.game.debug.cfg)) || '')]); o(n, d); }; a.__wrapped = 1; }
    }, snap);
    const P = id => page.evaluate(id => { const g = window.game._app.game, i = g.items.find(x => x.id === window.__map[id] && x.state !== 'pop'); return i && { x: i.x, y: i.y }; }, id);
    const tap = async (ids, gap) => { for (const id of ids) { const p = await P(id); if (!p) return false; await page.mouse.click(p.x, p.y); await page.waitForTimeout(gap); } return true; };
    const drag = async (ids) => { const pts = []; for (const id of ids) { const p = await P(id); if (!p) return false; pts.push(p); } await page.mouse.move(pts[0].x, pts[0].y); await page.mouse.down(); for (let k = 1; k < pts.length; k++) { for (let s = 1; s <= 8; s++) { await page.mouse.move(pts[k - 1].x + (pts[k].x - pts[k - 1].x) * s / 8, pts[k - 1].y + (pts[k].y - pts[k - 1].y) * s / 8); await page.waitForTimeout(4); } await page.waitForTimeout(160); } await page.mouse.up(); return true; };
    const ev = () => page.evaluate(() => window.__ev.slice());
    const cands = candidates(snap).filter(c => !process.env.TYPES || process.env.TYPES.split(',').some(t => c.type.includes(t)));
    for (const c of cands) {
      for (const g of ['順にタップ', '逆順にタップ', '間を空けてタップ', '順になぞる', '逆になぞる']) {
        await restore(); await page.waitForTimeout(80);
        const ids = g.startsWith('逆') ? c.ids.slice().reverse() : c.ids;
        if (g.includes('なぞる')) await drag(ids); else await tap(ids, g === '間を空けてタップ' ? 1800 : 180);
        await page.waitForTimeout(1500);
        const ls = await page.evaluate(() => window.game._app.game.debug.lastStroke || ''); await page.evaluate(() => { window.game._app.game.debug.lastStroke = ''; });
        const e = await ev(), made = e.filter(x => x[0] === 'chunk' || x[0] === 'insert').map(x => x[1]), fail = e.filter(x => x[0] === 'fail').map(x => x[1]);
        const POSS = { i: 'my', you: 'your', he: 'his', she: 'her', we: 'our', they: 'their' }, OBJ = { i: 'me', you: 'you', he: 'him', she: 'her', we: 'us', they: 'them' };
        const want = c.text.split(' ').filter(w => !/^(the|a)$/.test(w)).map(w => w.toLowerCase()).map(w => c.type.startsWith('所有') && POSS[w] ? POSS[w] : c.type.startsWith('前置詞') && OBJ[w] ? OBJ[w] : w);
        const ok = made.some(m => (m.split(' ').length >= 2 || /ing$|ed$/.test(m) || c.type.includes('時制')) && want.every(w => /過去|未来|進行|to\/ing/.test(w) || m.toLowerCase().split(' ').some(x => x === w || (w.length > 2 && x.slice(0, 3) === w.slice(0, 3)))));
        results.push({ level: LEVEL, board: b, kind: 'チャンク', type: c.type, gesture: g, words: c.text, ok, made: made.join(' / '), fail: fail.join(','), stroke: ls, ev: ok ? undefined : e.map(x => x.join(':')).join(' | ').slice(0, 400) });
      }
    }
    for (const s of (process.env.TYPES ? [] : sentences(snap))) {
      await restore(); await page.waitForTimeout(80); await drag(s.ids); await page.waitForTimeout(900);
      const ls = await page.evaluate(() => window.game._app.game.debug.lastStroke || '');
      const e = await ev(), sent = e.filter(x => x[0] === 'sentence').map(x => x[1]), fail = e.filter(x => x[0] === 'fail').map(x => x[1]);
      results.push({ level: LEVEL, board: b, kind: '文', type: s.type, gesture: '単語を順になぞる', words: s.ids.map(id => snap.find(x => x.id === id).text).join(' '), ok: sent.length > 0, made: sent.join(' / '), fail: fail.join(','), stroke: ls });
    }
  }
  results.errors = errors;
  if (OUT) require('fs').writeFileSync(OUT, JSON.stringify({ results, errors }, null, 1));
  const ok = results.filter(r => r.ok).length; console.log('level', LEVEL, 'attempts', results.length, 'ok', ok, 'errors', errors.length);
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
