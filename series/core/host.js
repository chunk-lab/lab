/* ゲームの開け閉め。ゲームは games/<id>/game.js で
   export default { id, name, right, async mount(el, ctx) { …; return { unmount(){…} } } }
   ctx = { store（そのゲーム専用のセーブ）, settings, speech, sound, report, showBack, exit, opts, base（そのゲームのファイルの場所）, loadScript } */
import { createStore } from './store.js';
const loaded = {};
export function loadScript(src) {
  try { const v = window.__APP__ && window.__APP__.build; if (v && !/\?/.test(src)) src += '?v=' + v; } catch (e) { }   // 組み立てごとの印(古いファイルが残らないように)
  return loaded[src] || (loaded[src] = new Promise((ok, ng) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => { delete loaded[src]; ng(new Error(src)); }; document.head.appendChild(s); }));
}
export function createHost(core, layer, backBtn) {
  let cur = null;
  const close = () => {
    if (!cur) return; const c = cur; cur = null;
    try { c.inst && c.inst.unmount && c.inst.unmount(); } catch (e) { console.error(e); }
    core.speech.stop(); c.el.remove(); layer.hidden = true; backBtn.hidden = true; document.body.classList.remove('cs-in-game');
    core.onClose && core.onClose(c.game.id);
  };
  backBtn.addEventListener('click', close);
  return {
    get current() { return cur && cur.game.id; },
    async open(game, opts = {}) {
      if (cur) close();
      if (game.right && !core.rights.has(game.right)) { core.ui.toast('このゲームはまだ使えません'); return; }
      const el = document.createElement('div'); el.className = 'cs-mount'; layer.appendChild(el); layer.hidden = false; backBtn.hidden = !core.config.backButton;
      document.body.classList.add('cs-in-game');
      const ctx = { core, store: createStore(game.id), settings: core.settings, speech: core.speech, sound: core.sound, opts,
        base: core.base + 'g/' + game.id + '/', loadScript,
        report: (name, data) => core.events.report(game.id, name, data),
        earn: (kind, n) => core.member.earn(kind, n),   // コインをもらう（'game'＝点数のごほうび。1日の上限つき）
        showBack: (on) => { backBtn.hidden = !(on && core.config.backButton); }, exit: close };
      cur = { game, el, inst: null };
      ctx.report('open');
      try { const inst = await game.mount(el, ctx); if (cur && cur.el === el) cur.inst = inst || {}; else inst && inst.unmount && inst.unmount(); }
      catch (e) { console.error(e); el.innerHTML = '<p class="cs-err">読み込めませんでした</p>'; backBtn.hidden = false; }
    },
    close
  };
}
