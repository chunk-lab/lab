const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/cb/out/chunkcards.html'); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => {
    const K = window.ChunkKit, T = K.tsuCard, M = K.mk, v = (w, f) => { const c = M('v', w); c.w.f = f || 'base'; return c; }, n = (w, pl) => { const c = M('n', w); c.w.pl = !!pl; return c; };
    const rows = [
      [M('pron', 'he'), T(['be', 'pres']), M('adj', 'happy')],
      [M('pron', 'i'), T(['be', 'pres']), v('read', 'ing'), T(['det', 'a']), n('apple')],
      [M('pron', 'they'), T(['be', 'past']), M('adj', 'happy')],
      [M('pron', 'she'), T(['hv', 'pres']), v('read', 'pp'), T(['det', 'the']), n('book')],
      [M('pron', 'he'), v('play'), T(['det', 'the']), n('guitar')],
      [M('pron', 'i'), T(['not', '']), v('like'), M('pron', 'he')],
      [M('pron', 'she'), T(['not', '']), v('study')],
      [M('pron', 'he'), T(['sm', 'want to']), v('swim')],
      [M('pron', 'she'), T(['sm', 'be going to']), v('eat'), n('pizza')],
      [M('pron', 'he'), T(['sm', 'have to']), v('study')],
      [T(['conj', 'when']), M('pron', 'i'), v('run'), M('pron', 'he'), v('swim')],
      [T(['det', 'the']), n('boy'), T(['rel', 'who', 'who']), v('play'), T(['det', 'the']), n('guitar'), T(['be', 'pres']), M('adj', 'happy')],
      [M('pron', 'i'), v('like'), T(['det', 'the']), n('pizza'), T(['rel', 'that', 'that']), M('pron', 'she'), v('make', 'past')],
      [M('pron', 'they'), T(['modal', 'can']), v('swim'), M('adv', 'quickly')],
      [n('dog', true), T(['be', 'pres']), M('adj', 'happy')],
      [T(['pos', 'i', 'my']), n('sister'), v('go', 'past'), T(['prep', 'to']), T(['det', 'the']), n('park'), M('adv', 'yesterday')],
      [M('pron', 'he'), T(['be', 'pres'])], // not ok → guess
    ];
    return rows.map(r => { const ev = K.evaluate(r), sf = K.surfaceOf(r, ev); return (ev.text || ev.state) + '  =>  ' + (sf ? sf.join(' | ') : 'null'); }).join('\n');
  }));
  console.log('errors', errs); await b.close();
})();
