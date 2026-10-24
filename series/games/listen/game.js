/* ランダムチャンク（聞き取り）：ストリームの長文のまとまりを、声だけで聞いて意味を選ぶ。最後にそのまとまりをまねして言う。
   10問。まちがえたまとまりは勉強ノートへ。材料はストリームの長文データ(g/stream/data.js)。 */
import { loadScript } from '../../core/host.js';
import './listen.css';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const N = 10;
export default {
  id: 'listen', name: 'ランダムチャンク',
  async mount(el, ctx) {
    const core = ctx.core; el.classList.add('ls'); ctx.showBack(true);
    const auto = ctx.opts && ctx.opts.lv;   // ミッション:レベルを決めてすぐ始める
    el.innerHTML = '<div class="ls-wrap"><p class="ls-note">読みこんでいます…</p></div>';
    try { await loadScript(core.base + 'g/stream/data.js'); } catch (e) { el.innerHTML = '<div class="ls-wrap"><p class="ls-note">このアプリでは使えません</p></div>'; return {}; }
    const PS = (() => { try { return PASSAGES; } catch (e) { return []; } })();
    const all = PS.flatMap(p => p.chunks.map(c => ({ en: (c.tk || []).map(t => t[1]).join(' ').replace(/\s+([,.!?;:])/g, '$1'), ja: c.ja, lv: p.lv }))).filter(c => c.en.split(' ').length >= 2 && c.ja);
    const wrap = el.querySelector('.ls-wrap'); let alive = true, lv = Math.max(1, core.level ? core.level.lv : 1);
    const say = (t, r = 1) => core.speech.speak(t, { rate: r });
    function title() {
      wrap.innerHTML = `<h2>ランダムチャンク</h2><p class="ls-note">声だけを聞いて、意味を選ぼう。答えたら、そのまとまりをまねして言ってみよう。${N}問。</p>
        <nav class="ls-lv">${[1, 2, 3].map(n => `<button data-lv="${n}" class="${n === lv ? 'on' : ''}">${['', '初級', '中級', '上級'][n]}</button>`).join('')}</nav><button class="ls-go" data-start>はじめる</button>`;
      wrap.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { lv = +b.dataset.lv; title(); });
      wrap.querySelector('[data-start]').onclick = start;
    }
    function start() {
      const pool = all.filter(c => c.lv === lv), qs = shuf(pool).slice(0, N), t0 = Date.now(), res = [];
      let i = 0;
      const ask = () => {
        if (!alive) return;
        const q = qs[i], opts = shuf([q.ja, ...shuf(pool.filter(x => x.ja !== q.ja)).slice(0, 3).map(x => x.ja)]);
        wrap.innerHTML = `<p class="ls-note">${i + 1} / ${qs.length}</p><button class="ls-ear" data-ear>🔊 もう一度聞く</button><button class="ls-slow" data-slow>ゆっくり</button>
          <div class="ls-opts">${opts.map((o, k) => `<button data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
        wrap.querySelector('[data-ear]').onclick = () => say(q.en); wrap.querySelector('[data-slow]').onclick = () => say(q.en, .7);
        setTimeout(() => alive && say(q.en), 300);
        wrap.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
          const ok = opts[+b.dataset.k] === q.ja; res.push({ ...q, ok });
          wrap.innerHTML = `<p class="ls-note">${ok ? '⭕ 正解' : '✖ ちがいます'}</p><p class="ls-en">${esc(q.en)}</p><p class="ls-ja">${esc(q.ja)}</p>
            <p class="ls-note" data-m>まねして言ってみよう</p><button class="ls-go" data-next>${i + 1 < qs.length ? '次へ' : '結果へ'}</button>`;
          let n = 0; const rep = () => { if (!alive || n >= 2 || !wrap.querySelector('[data-m]')) return; n++; say(q.en, n === 1 ? .85 : 1); wrap.querySelector('[data-m]').textContent = `${n}回目:聞いて、まねして言ってみよう`; setTimeout(rep, 1600 + q.en.split(' ').length * 500); };
          setTimeout(rep, 400);
          wrap.querySelector('[data-next]').onclick = () => { core.speech.stop(); i++; if (i < qs.length) ask(); else end(); };
        });
      };
      const end = () => {
        const ok = res.filter(x => x.ok).length, missed = res.filter(x => !x.ok).map(x => ({ en: x.en, ja: x.ja, kind: 'phrase' }));
        ctx.report('done', { play: 'listen', lv, n: res.length, min: Math.round((Date.now() - t0) / 6e3) / 10, score: Math.round(ok / res.length * 100), missed, finished: true });
        wrap.innerHTML = `<h2>${ok} / ${res.length}</h2><p class="ls-note">まちがえたまとまりは、勉強ノートに入りました。</p><button class="ls-go" data-again>もう一回</button><button class="ls-sub" data-top>レベルを選ぶ</button>`;
        wrap.querySelector('[data-again]').onclick = start; wrap.querySelector('[data-top]').onclick = title;
      };
      ask();
    }
    if (auto) { lv = auto; start(); } else title();
    return { unmount() { alive = false; core.speech.stop(); el.innerHTML = ''; } };
  }
};
