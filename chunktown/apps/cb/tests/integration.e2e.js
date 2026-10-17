// 組み込みの検証: mount/unmount 10回・リスナーの残り・一時停止・日替わり・購入・カスタム設定
const { open } = require('./e2e_lib');
(async () => {
  const { browser, page, errors } = await open(390, 844);
  const r = {};
  r.counts = await page.evaluate(async () => {
    window.game.unmount();
    const add = window.addEventListener, rem = window.removeEventListener, dadd = document.addEventListener, drem = document.removeEventListener;
    let live = 0; window.addEventListener = function () { live++; return add.apply(this, arguments); }; window.removeEventListener = function () { live--; return rem.apply(this, arguments); };
    document.addEventListener = function () { live++; return dadd.apply(this, arguments); }; document.removeEventListener = function () { live--; return drem.apply(this, arguments); };
    const host = document.getElementById('app'), log = [];
    for (let i = 0; i < 10; i++) {
      const ev = []; const g = PuniChunk.mount(host, { startScreen: i % 2 ? 'game' : 'title', initialMode: 'ta', onEvent: (n) => ev.push(n), storagePrefix: 'pctest:' });
      await new Promise(r => setTimeout(r, 400 + (i % 3) * 300));
      g.unmount(); log.push(ev.slice(0, 3).join('/'));
    }
    return { liveListeners: live, styles: document.querySelectorAll('style[data-punichunk]').length, children: host.childElementCount, events: log.slice(0, 2) };
  });
  // 2つ同時にmountしてもぶつからない
  r.twin = await page.evaluate(async () => {
    const a = document.createElement('div'), b = document.createElement('div'); a.style.cssText = b.style.cssText = 'position:fixed;top:0;width:50%;height:100%'; b.style.left = '50%';
    document.body.append(a, b); const g1 = PuniChunk.mount(a, { startScreen: 'title' }), g2 = PuniChunk.mount(b, { startScreen: 'modes' });
    await new Promise(r => setTimeout(r, 600)); const st = document.querySelectorAll('style[data-punichunk]').length;
    g1.unmount(); const st1 = document.querySelectorAll('style[data-punichunk]').length; g2.unmount(); a.remove(); b.remove();
    return { stylesWhileTwo: st, afterOne: st1, afterBoth: document.querySelectorAll('style[data-punichunk]').length, globals: Object.keys(window).filter(k => /^(U|G|Dict|Supply|Art|Snd|Game|UI|Tutorial|DICT_DATA|LEVELS|MODES)$/.test(k)) };
  });
  // 本番の起動に戻して、各機能を確認
  await page.evaluate(() => { window.game = PuniChunk.mount(document.getElementById('app'), { startScreen: 'title' }); const a = window.game._app; a.state.tutorialDone = true; a.saveState(); });
  await page.waitForTimeout(500);
  // バックグラウンドで一時停止
  await page.evaluate(() => window.game.show('game', 'ta')); await page.waitForTimeout(3800);
  r.pause = await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); const g = window.game._app.game; const s = g.state; Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); return { state: s, menu: !!document.querySelector('.pc-modal') }; });
  const t1 = await page.evaluate(() => window.game._app.game.time); await page.waitForTimeout(1000); const t2 = await page.evaluate(() => window.game._app.game.time);
  r.pause.timeFrozen = Math.abs(t1 - t2) < .01;
  await page.getByText('つづける', { exact: true }).click(); await page.waitForTimeout(300);
  r.pause.resumed = await page.evaluate(() => window.game._app.game.state);
  // 日替わり(ロック→テスト購入→プレイ可)
  await page.evaluate(() => window.game.show('modes')); await page.waitForTimeout(400);
  await page.getByText('日替わりお題', { exact: true }).click(); await page.waitForTimeout(500);
  r.daily = { shopOpened: await page.getByText('プレミアム会員', { exact: true }).count() };
  await page.getByText('¥480', { exact: true }).click(); await page.waitForTimeout(300); await page.getByText('買う', { exact: true }).click(); await page.waitForTimeout(500);
  r.daily.premium = await page.evaluate(() => window.game._app.services.store.isPremium());
  await page.evaluate(() => window.game.show('game', 'daily')); await page.waitForTimeout(3800);
  r.daily.slots = await page.evaluate(() => window.game._app.game.slots.length);
  r.daily.goal = await page.evaluate(() => window.game._app.game.goal && window.game._app.game.goal.text);
  await page.screenshot({ path: __dirname + '/shots/daily.png' });
  // アイテム
  r.items = await page.evaluate(() => { const a = window.game._app, before = a.services.store.inventory(); const ok = a.game.useItem('magic'); return { before, ok }; });
  // カスタム設定(全部手動)が反映される
  r.custom = await page.evaluate(() => { const a = window.game._app; a.settings.custom = true; a.settings.auto = { art: false, prep: false, verb: false, ti: false, er: false }; a.saveSettings(); window.game.show('game', 'free'); return a.game.debug.cfg.auto; });
  console.log(JSON.stringify(r, null, 1)); console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
