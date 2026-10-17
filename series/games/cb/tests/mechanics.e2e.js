// プレイ中の細かい動きを撮る(長押し・ヒント・差し込み・失敗・スロット・あふれ)
const { open } = require('./e2e_lib');
(async () => {
  const { browser, page, errors } = await open(390, 844);
  const S = n => page.screenshot({ path: __dirname + '/shots/m_' + n + '.png' });
  const G = () => page.evaluate(() => { const g = window.game._app.game; return g && g.items.filter(i => i.state === 'idle').map(i => ({ id: i.id, text: i.text, x: i.x, y: i.y, k: i.word && i.word.k, t: i.chunk && i.chunk.t })); });
  await page.evaluate(() => { const a = window.game._app; a.state.tutorialDone = true; a.state.level = 1; a.saveState(); window.game.show('game', 'free'); });
  await page.waitForTimeout(3800);
  let its = await G();
  // 長押し(ヒント)
  const n = its.find(i => i.k === 'det') || its[0];
  await page.mouse.move(n.x, n.y); await page.mouse.down(); await page.waitForTimeout(650); await S('1_longpress'); await page.mouse.up(); await page.waitForTimeout(300);
  // 連鎖ミス(冠詞だけ)→散る
  await page.mouse.click(n.x, n.y); await page.waitForTimeout(2300); await S('2_scatter');
  // 名詞→チャンク
  its = await G(); const noun = its.find(i => i.k === 'n'); await page.mouse.click(noun.x, noun.y); await page.waitForTimeout(1000); await S('3_chunk');
  // チャンクを選択→形容詞を差し込み
  its = await G(); const ch = its.find(i => i.t === 'NP'); const adj = its.find(i => i.k === 'adj');
  if (ch && adj) { await page.mouse.click(ch.x, ch.y); await page.waitForTimeout(300); await S('4_select'); await page.mouse.click(adj.x, adj.y); await page.waitForTimeout(500); await S('5_insert'); }
  // 間違った文(名詞句2つ)
  its = await G(); const nps = its.filter(i => i.t === 'NP' || i.k === 'pr');
  if (nps.length >= 2) { await page.mouse.move(nps[0].x, nps[0].y); await page.mouse.down(); for (let s = 1; s <= 8; s++) { await page.mouse.move(nps[0].x + (nps[1].x - nps[0].x) * s / 8, nps[0].y + (nps[1].y - nps[0].y) * s / 8); await page.waitForTimeout(16); } await S('6_stroke'); await page.mouse.up(); await page.waitForTimeout(250); await S('7_fail'); }
  // スロットへ運ぶ
  await page.waitForTimeout(800); its = await G(); const sub = its.find(i => i.t === 'NP' || i.k === 'pr'); const slot = await page.evaluate(() => { const r = window.game._app.game.slots[1].rect; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; });
  if (sub) { await page.mouse.move(sub.x, sub.y); await page.mouse.down(); for (let s = 1; s <= 12; s++) { await page.mouse.move(sub.x + (slot.x - sub.x) * s / 12, sub.y + (slot.y - sub.y) * s / 12); await page.waitForTimeout(16); } await S('8_carry'); await page.mouse.up(); await page.waitForTimeout(400); await S('9_slotted'); }
  // あふれモード
  await page.evaluate(() => window.game.show('game', 'over')); await page.waitForTimeout(16000); await S('10_over');
  console.log('errors', errors, await page.evaluate(() => { const g = window.game._app.game; return g ? { n: g.items.length, state: g.state } : window.game._app.scene; }));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
