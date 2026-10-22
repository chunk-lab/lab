// AI連携:各社へのリクエストの形・キーの扱い・画面の流れを、偽のサーバー応答で確かめる(実際のキーは使わない)
import { chromium } from 'playwright';
const url = 'file://' + process.cwd() + '/dist/index.html';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ok = (c, m) => { console.log((c ? 'OK  ' : 'NG  ') + m); if (!c) process.exitCode = 1; };
const errors = [], reqs = [];
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('pageerror', e => errors.push(e.message));
let retire = false, status = 200, models = null, busy503 = false;
await page.route(/generativelanguage|api\.openai|api\.anthropic/, async r => {
  const q = r.request(); reqs.push({ url: q.url(), h: q.headers(), b: JSON.parse(q.postData() || '{}') });
  const u = q.url();
  if (busy503 && u.includes('gemini-2.5-flash:')) return r.fulfill({ status: 503, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: { message: 'This model is currently experiencing high demand.' } }) });
  if (models && u.includes('/models?')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ models }) });
  if (models && u.includes('gemini-3.5-flash-lite:')) return r.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: { message: 'model not found' } }) });
  if (status !== 200) return r.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
  if (retire && u.includes('gemini-3.5-flash-lite:')) return r.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: { message: 'This model models/gemini-3.5-flash-lite is no longer available. Please use models/gemini-9-flash-lite for' } }) });
  const sse = o => 'data: ' + JSON.stringify(o) + '\n\n';
  const body = u.includes('google') ? sse({ candidates: [{ content: { parts: [{ text: 'やあ、' }] } }] }) + sse({ candidates: [{ content: { parts: [{ text: 'ようこそ。' }] } }] })
    : u.includes('openai') ? sse({ choices: [{ delta: { content: 'いらっしゃい。' } }] }) + 'data: [DONE]\n\n'
    : sse({ type: 'content_block_start' }) + sse({ type: 'content_block_delta', delta: { text: 'こんにちは〜' } });
  r.fulfill({ status: 200, contentType: 'text/event-stream', headers: { 'access-control-allow-origin': '*' }, body });
});
await page.route(/\/(preflight)/, r => r.continue());
await page.goto(url); await page.waitForTimeout(700); await page.click('.tw-start'); await page.waitForTimeout(300);

// 設定 → AI設定画面(キー取得リンクつき)
await page.click('.tw-menu'); await page.click('[data-act="ai"]');
const link = await page.getAttribute('.tw-link', 'href');
ok(link === 'https://aistudio.google.com/apikey', 'Gemini のキー取得ページへ案内: ' + link);
ok((await page.getAttribute('.tw-link', 'rel')).includes('noopener'), 'リンクは noopener');
// 空のままではためせない
await page.click('[data-a="test"]');
ok(/貼って/.test(await page.textContent('.tw-status')), 'キー未入力なら案内');
// Gemini
await page.fill('.tw-key', 'AIzaFAKEKEY');
await page.click('[data-a="test"]'); await page.waitForSelector('.tw-status:has-text("つながりました")');
let g = reqs.at(-1);
ok(g.url.includes('gemini-3.5-flash-lite:streamGenerateContent') && !g.url.includes('AIzaFAKEKEY'), 'Gemini: キーはURLに入れない');
ok(g.h['x-goog-api-key'] === 'AIzaFAKEKEY' && g.b.contents[0].parts[0].text === 'こんにちは' && g.b.systemInstruction, 'Gemini: ヘッダと本文の形');
await page.waitForTimeout(1500);
ok(!(await page.isVisible('.tw-panel')), 'つながったら画面が閉じる');
// 保存されたキーは町の外(アプリ用領域)から見えない
const stored = await page.evaluate(() => Object.keys(localStorage).filter(k => /ai$/.test(k)));
ok(stored.join() === 'town:ai', '保存先は town:ai のみ: ' + stored);

// OpenAI / Claude の形
for (const [id, key] of [['openai', 'sk-FAKE'], ['claude', 'sk-ant-FAKE']]) {
  await page.click('.tw-menu'); await page.click('[data-act="ai"]'); await page.click(`[data-p="${id}"]`);
  await page.fill('.tw-key', key); await page.click('[data-a="test"]'); await page.waitForSelector('.tw-status:has-text("つながりました")');
  const q = reqs.at(-1);
  if (id === 'openai') ok(q.h.authorization === 'Bearer ' + key && q.b.max_completion_tokens && q.b.messages[0].role === 'system', 'OpenAI: 認証ヘッダと本文');
  else ok(q.h['x-api-key'] === key && q.h['anthropic-dangerous-direct-browser-access'] === 'true' && q.b.model === 'claude-haiku-5-5' && q.b.system, 'Claude: ヘッダ(ブラウザ直接許可)と本文');
  await page.waitForTimeout(1500);
}
await page.click('.tw-menu'); await page.click('[data-act="ai"]'); await page.click('[data-p="gemini"]'); await page.fill('.tw-key', 'AIzaFAKEKEY'); await page.click('[data-a="test"]'); await page.waitForSelector('.tw-status:has-text("つながりました")'); await page.waitForTimeout(1500);

// NPC と会話 → おしゃべり(マスコットの近くへ行く)
await page.evaluate(() => town.setHour(13));
await page.waitForTimeout(300);
const pos = await page.evaluate(() => town.getState().npcs.chunkkun);
await page.evaluate(([x, z]) => town.teleport(x, z + 1.3, Math.PI), pos);
await page.waitForFunction(() => /チャンクくん/.test(town.getState().focus || ''), null, { timeout: 8000 });
await page.click('.tw-action');
await page.waitForSelector('.tw-dialog .tw-choices:not([style*="hidden"])', { timeout: 8000 });
await page.click('.tw-dialog .tw-choices .tw-btn:has-text("おしゃべりする")');
await page.fill('.tw-say', 'おすすめの場所は?'); await page.press('.tw-say', 'Enter');
await page.waitForFunction(() => [...document.querySelectorAll('.tw-msg.npc')].some(e => e.textContent === 'やあ、ようこそ。'));
const last = reqs.at(-1), sys = last.b.systemInstruction.parts[0].text;
ok(/【性格・話し方】.*もちもち/.test(sys) && /60文字/.test(sys) && /チャンクくん/.test(sys), '人物カードとルールが指示文に入る');
ok(last.b.contents[0].role === 'user' || last.b.contents[0].role === 'model', 'contents の先頭: ' + last.b.contents[0].role);
ok(last.b.contents.length >= 1 && last.b.contents.at(-1).role === 'user', '最後は user');
await page.click('[data-a="close"]');
ok(!(await page.isVisible('.tw-panel')), 'またね で閉じる');

// エラー文言と上限
for (const [st, re] of [[401, /キーが使えない/], [429, /使いすぎ|上限/], [404, /モデル名.*404/], [503, /混み合って/], [403, /キーが使えない.*403/]]) {
  status = st;
  await page.click('.tw-menu'); await page.click('[data-act="ai"]'); await page.click('[data-a="test"]');
  await page.waitForFunction(() => document.querySelector('.tw-status')?.textContent.length > 8 && !/つないでいます/.test(document.querySelector('.tw-status').textContent));
  ok(re.test(await page.textContent('.tw-status')), `HTTP ${st} → ` + await page.textContent('.tw-status'));
  await page.click('[data-a="close"]');
}
status = 200;


await page.click('.tw-menu'); await page.click('[data-act="ai"]'); await page.click('[data-a="clear"]');
ok(/消しました/.test(await page.textContent('.tw-status')), 'キーを消せる');
ok(await page.evaluate(() => !town.ai.ready), '消したあとは未接続');
await browser.close();
ok(errors.length === 0, 'JSエラーなし ' + errors.join('|'));
