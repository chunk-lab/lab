const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/cb/out/chunkcards.html'); await p.waitForTimeout(500);
  const out = await p.evaluate(() => {
    const C = window.ChunkCards, M = C._mk, T = s => C._tsu(s);
    const v = (w, f) => { const c = M('v', w); if (!c) return null; c.w.f = f || 'base'; return c; };
    const n = (w, pl) => { const c = M('n', w); if (!c) return null; c.w.pl = !!pl; return c; };
    const tests = {
      'he eat apple': [M('pron', 'he'), v('eat'), n('apple')],
      'he eat a apple': [M('pron', 'he'), v('eat'), T(['det', 'a']), n('apple')],
      'my sister bought a red bag at the park yesterday': [T(['pos', 'i', 'my']), n('sister'), v('buy', 'past'), T(['det', 'a']), M('adj', 'red'), n('book'), T(['prep', 'in']), T(['det', 'the']), n('park'), M('adv', 'yesterday')],
      'she has read the book': [M('pron', 'she'), T(['hv', 'pres']), v('read', 'pp'), T(['det', 'the']), n('book')],
      'they can swim quickly': [M('pron', 'they'), T(['modal', 'can']), v('swim'), M('adv', 'quickly')],
      'he is happy': [M('pron', 'he'), T(['be', 'pres']), M('adj', 'happy')],
      'apple eat he': [n('apple'), v('eat'), M('pron', 'he')],
      'he eats': [M('pron', 'he'), v('eat')],
      'when I run, he swims': [T(['conj', 'when']), M('pron', 'i'), v('run'), M('pron', 'he'), v('swim')],
      'I am reading a book': [M('pron', 'i'), T(['be', 'pres']), v('read', 'ing'), T(['det', 'a']), n('book')],
      'on Monday': [M('pron', 'i'), v('study'), T(['prep', 'on']), n('Monday')],
      'in Monday': [M('pron', 'i'), v('study'), T(['prep', 'in']), n('Monday')],
      'the sister reading the book went to the park': [T(['det', 'the']), n('sister'), v('read', 'ing'), T(['det', 'the']), n('book'), v('go', 'past'), T(['prep', 'to']), T(['det', 'the']), n('park')],
      'the book on the desk is old': [T(['det', 'the']), n('book'), T(['prep', 'on']), T(['det', 'the']), n('desk'), T(['be', 'pres']), M('adj', 'old')],
      'the boy who plays the guitar is happy': [T(['det', 'the']), n('boy'), T(['rel', 'who', 'who']), v('play'), T(['det', 'the']), n('guitar'), T(['be', 'pres']), M('adj', 'happy')],
      'I like the pizza that she made': [M('pron', 'i'), v('like'), T(['det', 'the']), n('pizza'), T(['rel', 'that', 'that']), M('pron', 'she'), v('make', 'past')],
      'the car made in Japan is nice (pp)': [T(['det', 'the']), n('car'), v('make', 'pp'), T(['prep', 'in']), n('Japan'), T(['be', 'pres']), M('adj', 'nice')],
      'I read the book in the park (adverbial)': [M('pron', 'i'), v('read', 'past'), T(['det', 'the']), n('book'), T(['prep', 'in']), T(['det', 'the']), n('park')],
      'the dog which runs (who for dog ok?)': [T(['det', 'the']), n('dog'), T(['rel', 'which', 'which']), v('run'), v('sleep')]
    };
    const res = {};
    for (const k in tests) { const row = tests[k]; if (row.some(x => !x)) { res[k] = 'MISSING WORD'; continue; } const ev = C._eval(row); let sc = '';
      if (ev.state === 'ok') { const y = C._yaku(ev.f); sc = y.name + ' ' + y.chips + 'x' + y.mult; }
      res[k] = ev.state + ' | ' + (ev.text || '') + ' | ' + (ev.msg || '') + ' | ' + sc; }
    return res;
  });
  for (const k in out) console.log(k.padEnd(50), out[k]);
  console.log('errors', errs); await b.close();
})();
