const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/cb/out/chunkcards.html'); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => {
    const K = window.ChunkKit, T = K.tsuCard, M = K.mk, v = (w, f) => { const c = M('v', w); if (!c) return null; c.w.f = f || 'base'; return c; }, n = (w, pl) => { const c = M('n', w); if (!c) return null; c.w.pl = !!pl; return c; };
    const rows = {
      'I end up (phrasal)': [M('pron', 'i'), v('end'), T(['prep', 'up']), T(['prep', 'in']), T(['det', 'the']), n('park')],
      'he gave up': [M('pron', 'he'), v('give', 'past'), T(['prep', 'up'])],
      'box is filled(past card) with water': [T(['det', 'the']), n('box'), T(['be', 'pres']), v('fill', 'past'), T(['prep', 'with']), n('water')],
      'boiling water': [M('pron', 'i'), v('drink'), T(['det', 'the']), v('boil', 'ing'), n('water')],
      'a broken window': [M('pron', 'i'), v('see', 'past'), T(['det', 'a']), v('break', 'pp'), n('window')],
      'I like swimming': [M('pron', 'i'), v('like'), v('swim', 'ing')],
      'swimming is fun': [v('swim', 'ing'), T(['be', 'pres']), M('adj', 'fun')],
      'that book / those books': [M('pron', 'i'), v('read'), T(['det', 'that']), n('book', true)],
      'I like it': [M('pron', 'i'), v('like'), M('pron', 'it')],
      'eat pizza (combo)': [M('pron', 'i'), v('eat'), n('pizza')],
      'eat the book (bad?)': [M('pron', 'i'), v('read'), T(['det', 'the']), n('apple')],
      'dup time': [M('pron', 'i'), v('study'), T(['prep', 'at']), n('noon'), T(['prep', 'in']), T(['det', 'the']), n('morning')],
      'and coord': [M('pron', 'i'), v('run'), T(['conj', 'and']), M('pron', 'he'), v('swim')],
      'because': [M('pron', 'i'), v('run'), T(['conj', 'because']), M('pron', 'he'), v('swim')],
    };
    const o = [];
    for (const k in rows) { const r = rows[k]; if (r.some(x => !x)) { o.push(k + ': MISSING'); continue; } const e = K.evaluate(r); let s = ''; if (e.state === 'ok') { const b = K.baseScore(r, e); s = b.y.name + ' ' + b.chips + 'x' + b.mult + ' colloc=' + e.f.colloc + ' dup=' + e.f.dupWords.length + ' half=' + e.f.halfWords.length + ' sf=' + (K.surfaceOf(r, e) || 'null'); } o.push(k + ': ' + e.state + ' | ' + (e.text || e.msg) + ' | ' + s); }
    return o.join('\n');
  }));
  console.log('errors', errs); await b.close();
})();
