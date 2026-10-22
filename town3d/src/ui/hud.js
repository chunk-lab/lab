// 画面の上に重ねる UI(DOM)。クラスはすべて tw- 接頭辞
import { LOOKS, LOOK_IDS } from '../world/character.js';

export const CSS = `
.tw-root{position:absolute;inset:0;overflow:hidden;font-family:"M PLUS Rounded 1c","Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans JP",system-ui,sans-serif;color:#5a4a6b;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent;
 --tw-pink:#ffb3c1;--tw-mint:#a8e6cf;--tw-lav:#c9b8ea;--tw-cream:#fffaf2;--tw-ink:#5a4a6b;--tw-sub:#8d7f9e;--tw-shadow:0 6px 18px rgba(90,74,107,.18);--tw-top:env(safe-area-inset-top,0px);--tw-bot:env(safe-area-inset-bottom,0px)}
.tw-root *{box-sizing:border-box}
.tw-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.tw-top{position:absolute;left:12px;right:12px;top:calc(10px + var(--tw-top));display:flex;gap:8px;align-items:center;pointer-events:none}
.tw-chip{background:rgba(255,250,242,.9);border-radius:999px;padding:7px 13px;font-weight:700;font-size:14px;box-shadow:var(--tw-shadow);white-space:nowrap}
.tw-area{max-width:46%;overflow:hidden;text-overflow:ellipsis}
.tw-sp{flex:1}
.tw-btn{pointer-events:auto;border:0;background:var(--tw-cream);color:var(--tw-ink);border-radius:999px;font:inherit;font-weight:700;box-shadow:var(--tw-shadow);cursor:pointer;transition:transform .12s}
.tw-btn:active{transform:scale(.92)}
.tw-find{height:42px;padding:0 16px;font-size:15px;font-weight:700;letter-spacing:.06em}
.tw-icon{width:42px;height:42px;font-size:20px;display:grid;place-items:center;padding:0}
.tw-action{position:absolute;right:20px;bottom:calc(26px + var(--tw-bot));min-width:96px;height:96px;border-radius:48px;padding:0 18px;font-size:17px;background:linear-gradient(160deg,#ffd0dc,#ffb3c1);color:#fff;text-shadow:0 1px 2px rgba(150,80,110,.4);animation:tw-pop .25s}
.tw-action[hidden]{display:none}
.tw-emotes{position:absolute;left:12px;bottom:calc(16px + var(--tw-bot));display:flex;gap:6px}
.tw-stick.fixed{left:22px;top:auto;bottom:calc(68px + var(--tw-bot));width:132px;height:132px;pointer-events:auto;touch-action:none;background:rgba(255,255,255,.32);border:2px solid rgba(255,255,255,.75);box-shadow:var(--tw-shadow)}
.tw-stick.fixed i{left:44px;top:44px}
.tw-ctl{position:absolute;right:16px;bottom:calc(132px + var(--tw-bot));display:grid;grid-template-columns:repeat(2,48px);gap:8px;touch-action:none}
.tw-ctl button{height:44px;border:0;border-radius:22px;background:rgba(255,255,255,.88);color:var(--tw-ink);font:inherit;font-size:17px;font-weight:700;box-shadow:var(--tw-shadow);touch-action:none;-webkit-user-select:none}
.tw-ctl button:active,.tw-ctl button.on{background:var(--tw-mint)}
.tw-ctl .wide{grid-column:1/3;font-size:14px}
.tw-emotes .tw-btn{height:38px;padding:0 12px;font-size:13px}
.tw-emotes .tw-btn[hidden]{display:none}
.tw-grade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(176,168,255,.20),rgba(255,214,190,.12) 70%,rgba(255,190,200,.16));mix-blend-mode:soft-light}
.tw-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 55%,rgba(70,40,110,.22) 100%)}
.tw-stick{position:absolute;left:0;top:0;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.7);pointer-events:none}
.tw-stick i{position:absolute;left:38px;top:38px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.9);box-shadow:var(--tw-shadow)}
.tw-labels{position:absolute;inset:0;pointer-events:none}
.tw-label{position:absolute;left:0;top:0;transform:translate(-50%,-100%);font-size:12px;font-weight:700;background:rgba(255,255,255,.85);padding:2px 8px;border-radius:999px;white-space:nowrap}
.tw-label.me{background:rgba(255,179,193,.9);color:#fff}
.tw-bubble{position:absolute;left:0;top:0;transform:translate(-50%,-100%);max-width:180px;font-size:13px;font-weight:700;background:#fff;padding:6px 11px;border-radius:14px;box-shadow:var(--tw-shadow);animation:tw-pop .2s}
.tw-bubble:after{content:"";position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#fff}
.tw-dialog{position:absolute;left:12px;right:12px;bottom:calc(16px + var(--tw-bot));max-width:620px;margin:0 auto;background:rgba(255,250,242,.97);border-radius:22px;padding:16px 18px 14px;box-shadow:0 10px 30px rgba(90,74,107,.25);animation:tw-up .22s;pointer-events:auto}
.tw-dname{position:absolute;top:-14px;left:18px;background:var(--tw-pink);color:#fff;padding:4px 14px;border-radius:999px;font-weight:800;font-size:14px}
.tw-dname small{font-weight:600;opacity:.85;margin-left:6px}
.tw-dtext{min-height:48px;font-size:16px;line-height:1.6;margin-top:6px}
.tw-choices{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;justify-content:flex-end}
.tw-choices .tw-btn{padding:9px 16px;font-size:14px;background:#fff;border:2px solid var(--tw-lav);box-shadow:none}
.tw-choices .tw-btn.main{background:var(--tw-mint);border-color:var(--tw-mint)}
.tw-toast{position:absolute;left:50%;top:calc(64px + var(--tw-top));transform:translateX(-50%);background:rgba(90,74,107,.88);color:#fff;padding:8px 16px;border-radius:999px;font-size:14px;font-weight:700;animation:tw-pop .2s;white-space:nowrap;pointer-events:none}
.tw-panel{position:absolute;inset:0;background:rgba(90,74,107,.25);display:grid;place-items:center;pointer-events:auto;animation:tw-fade .2s}
.tw-card{width:min(92%,420px);max-height:86%;overflow:auto;background:var(--tw-cream);border-radius:24px;padding:20px;box-shadow:0 14px 40px rgba(90,74,107,.3)}
.tw-card h2{margin:0 0 12px;font-size:19px}
.tw-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px dashed #e6dcef;font-size:14px}
.tw-seg{display:flex;gap:4px}.tw-seg .tw-btn{padding:6px 11px;font-size:13px;box-shadow:none;border:2px solid #eadff3}.tw-seg .tw-btn.on{background:var(--tw-pink);border-color:var(--tw-pink);color:#fff}
.tw-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:linear-gradient(180deg,rgba(255,236,242,.55),rgba(232,224,255,.75));pointer-events:auto;padding:20px}
.tw-logo{font-size:clamp(30px,9vw,52px);font-weight:900;color:#fff;letter-spacing:.06em;text-shadow:0 3px 0 #f5a3b8,0 6px 16px rgba(160,100,150,.35)}
.tw-sub{font-size:14px;color:var(--tw-sub);font-weight:700;margin-top:-8px}
.tw-looks{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:min(100%,420px)}
.tw-look{pointer-events:auto;border:3px solid transparent;border-radius:18px;background:#fff;padding:8px 4px;font:inherit;font-weight:700;font-size:13px;color:var(--tw-ink);cursor:pointer}
.tw-look.on{border-color:var(--tw-pink)}
.tw-look i{display:block;width:44px;height:44px;margin:0 auto 4px;border-radius:50%;position:relative}
.tw-look i:after{content:"";position:absolute;left:8px;right:8px;top:12px;bottom:4px;border-radius:50%;background:var(--sk)}
.tw-name{pointer-events:auto;width:min(100%,260px);font:inherit;font-size:16px;font-weight:700;text-align:center;padding:10px;border-radius:999px;border:2px solid #eadff3;background:#fff;color:var(--tw-ink)}
.tw-start{padding:14px 40px;font-size:18px;background:linear-gradient(160deg,#ffd0dc,#ffb3c1);color:#fff}
.tw-hint{font-size:12px;color:var(--tw-sub);text-align:center;line-height:1.6}
.tw-app-layer{position:absolute;inset:0;z-index:20;background:#fff8f3;display:flex}
.tw-app-layer[hidden]{display:none}
.tw-app{position:relative;flex:1;display:flex;flex-direction:column}
.tw-app-head{display:flex;align-items:center;justify-content:space-between;padding:calc(8px + var(--tw-top)) 12px 8px;background:var(--tw-cream);box-shadow:0 2px 8px rgba(90,74,107,.08);z-index:1}
.tw-app-title{font-weight:800}
.tw-app-close{border:0;background:var(--tw-lav);color:#fff;border-radius:999px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer}
.tw-app-body{position:relative;flex:1;overflow:auto}
.tw-app-frame{position:absolute;inset:0;width:100%;height:100%;border:0}
.tw-app-missing{padding:40px 24px;text-align:center;line-height:1.8}
.tw-app-missing small{color:var(--tw-sub)}
.tw-fade{position:absolute;inset:0;background:#fff8f3;pointer-events:none;opacity:0;transition:opacity .25s;z-index:19}
.tw-card{touch-action:pan-y}
.tw-map{display:block;width:100%;border-radius:16px;margin:0 0 10px;background:#cfe9c3;cursor:pointer;touch-action:manipulation}
.tw-ftabs{display:flex;gap:6px;margin-bottom:8px}.tw-ftabs .tw-btn{flex:1;padding:8px;font-size:14px;box-shadow:none;border:2px solid #eadff3}.tw-ftabs .tw-btn.on{background:var(--tw-pink);border-color:var(--tw-pink);color:#fff}
.tw-fq{width:100%;font:inherit;font-size:16px;padding:9px 12px;border-radius:14px;border:2px solid #eadff3;background:#fff;color:var(--tw-ink);user-select:text;-webkit-user-select:text}
.tw-flist{max-height:34vh;overflow:auto;margin:8px 0;touch-action:pan-y}
.tw-frow{display:flex;align-items:center;gap:10px;padding:8px 8px;border-radius:14px;cursor:pointer}.tw-frow.sel{background:#fff0f3}
.tw-fdot{width:12px;height:12px;border-radius:50%;flex:none;background:#43bf94;border:2px solid #fff;box-shadow:0 0 0 1px #d8cfe6}.tw-fdot.player{background:#9a7fd6}.tw-fdot.place{background:#ffb347;border-radius:3px}
.tw-fname{flex:1;min-width:0;display:flex;flex-direction:column}.tw-fname b{font-size:15px}.tw-fname small{color:var(--tw-sub);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tw-frow .tw-btn{padding:7px 16px;font-size:14px;background:var(--tw-mint);box-shadow:none}.tw-frow .tw-btn:disabled{background:#eee;color:#aaa}
.tw-enrow{display:flex;gap:8px;margin:2px 0 8px}.tw-enrow .tw-btn{padding:5px 12px;font-size:13px}
.tw-w{cursor:pointer;border-bottom:1px dotted var(--tw-sub);border-radius:3px}.tw-w.sel{background:#ffe08a;border-bottom-color:transparent}
.tw-trbtn{margin-left:8px;border:1px solid var(--tw-sub);background:#fff;color:var(--tw-sub);border-radius:10px;font-size:11px;padding:0 8px;cursor:pointer;vertical-align:middle}
.tw-tr{margin-top:5px;padding-top:5px;border-top:1px dashed #e4d8dc;font-size:13px;color:var(--tw-sub)}
.tw-tools{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0;padding:6px 8px;background:#fff7e0;border-radius:12px}.tw-tools .tw-btn{padding:5px 10px;font-size:12px}.tw-seltxt{font-weight:700;font-size:13px;margin-right:auto;word-break:break-word}
.tw-nrow{padding:10px 0;border-bottom:1px solid #f0e6ea}.tw-nrow b{font-size:16px}.tw-nrow small{display:block;color:var(--tw-sub);font-size:12px;margin-top:2px}.tw-nm{color:#5a4a6b;font-size:14px;margin-top:2px}
.tw-kind{display:inline-block;font-size:11px;padding:0 7px;border-radius:9px;background:#e9e0f7;color:#6b5a91;margin-right:6px;vertical-align:middle}
.tw-note{font-size:13px;line-height:1.6;color:var(--tw-sub);margin:6px 0}.tw-note.small{font-size:11px}
.tw-prov{display:grid;gap:6px;margin:10px 0}.tw-prov .tw-btn{border-radius:16px;padding:9px 12px;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:8px;box-shadow:none;border:2px solid #eadff3;font-size:14px}
.tw-prov .tw-btn small{font-size:11px;color:var(--tw-sub);font-weight:700}.tw-prov .tw-btn.on{border-color:var(--tw-pink);background:#fff0f3}
.tw-steps{margin:8px 0;padding-left:20px;font-size:14px;line-height:1.7}
.tw-link{display:block;text-align:center;text-decoration:none;color:var(--tw-ink);padding:11px;margin:8px 0;background:var(--tw-mint)}
.tw-key,.tw-say,.tw-adv input{width:100%;font:inherit;font-size:16px;padding:10px 12px;border-radius:14px;border:2px solid #eadff3;background:#fff;color:var(--tw-ink);pointer-events:auto;user-select:text;-webkit-user-select:text}
.tw-adv{margin:10px 0;font-size:13px}.tw-adv label{display:block;margin:8px 0 0;font-weight:700}
.tw-status{min-height:22px;font-size:14px;font-weight:700;margin:8px 0}
.tw-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}.tw-actions .tw-btn{padding:9px 16px;font-size:14px;box-shadow:none;border:2px solid #eadff3}.tw-actions .main{background:var(--tw-mint);border-color:var(--tw-mint)}
.tw-card h2 small{font-size:12px;color:var(--tw-sub);margin-left:8px;font-weight:700}
.tw-log{height:min(42vh,300px);overflow:auto;display:flex;flex-direction:column;gap:8px;padding:4px 2px 10px}
.tw-msg{max-width:84%;padding:8px 12px;border-radius:16px;font-size:15px;line-height:1.5;background:#fff;align-self:flex-start;user-select:text;-webkit-user-select:text}
.tw-msg.me{align-self:flex-end;background:var(--tw-pink);color:#fff}.tw-msg.wait{opacity:.6}.tw-msg.err{background:#fff3e0;color:#9a6a3a}
.tw-chatrow{display:flex;gap:8px}.tw-chatrow .tw-btn{padding:0 16px;box-shadow:none;border:2px solid var(--tw-mint);background:var(--tw-mint)}
@keyframes tw-pop{from{transform:scale(.6);opacity:0}}
.tw-bubble,.tw-toast{animation-name:tw-pop2}
@keyframes tw-pop2{from{opacity:0;margin-top:6px}}
@keyframes tw-up{from{transform:translateY(20px);opacity:0}}
@keyframes tw-fade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){.tw-root *{animation:none!important;transition:none!important}}
`;

export function createHud(root, bus) {
  const h = s => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; };
  const top = h(`<div class="tw-top"><span class="tw-chip tw-area">ほし広場</span><span class="tw-chip tw-clock">10:00</span><span class="tw-sp"></span><span class="tw-chip tw-coins">🪙 0</span><button class="tw-btn tw-find" aria-label="町をさがす">探す</button><button class="tw-btn tw-icon tw-menu" aria-label="せってい">⚙</button></div>`);
  const labels = h('<div class="tw-labels"></div>');
  const action = h('<button class="tw-btn tw-action" hidden></button>');
  const emotes = h('<div class="tw-emotes"><button class="tw-btn" data-e="wave">👋 手をふる</button><button class="tw-btn" data-e="say">💬 ひとこと</button><button class="tw-btn" data-e="feed" hidden>🌾 えさをまく</button></div>');
  const grade = h('<div class="tw-grade"></div>'), vig = h('<div class="tw-vig"></div>');
  root.prepend(grade, vig);
  root.append(labels, top, emotes, action);
  const area = top.querySelector('.tw-area'), clock = top.querySelector('.tw-clock'), coins = top.querySelector('.tw-coins');
  let dialog = null, toastEl = null, toastT = 0, panel = null;

  emotes.onclick = e => { const b = e.target.closest('[data-e]'); if (b) bus.emit('ui:emote', b.dataset.e); };
  top.querySelector('.tw-menu').onclick = () => bus.emit('ui:menu');
  top.querySelector('.tw-find').onclick = () => bus.emit('ui:find');
  action.onclick = () => bus.emit('ui:action');

  const tags = new Map(); // id → {el, bubble, until}
  return {
    setArea(t) { if (area.textContent !== t) area.textContent = t; },
    setLite(on) { grade.style.display = vig.style.display = on ? 'none' : ''; },
    setFeed(on) { const b = emotes.querySelector('[data-e="feed"]'); if (b && b.hidden === on) b.hidden = !on; },
    setClock(hh) { const H = Math.floor(hh), m = Math.floor((hh % 1) * 60); const ic = hh < 5 || hh >= 19 ? '🌙' : hh < 7 ? '🌅' : hh < 17 ? '☀️' : '🌇'; clock.textContent = `${ic} ${String(H).padStart(2, '0')}:${String(m).padStart(2, '0')}`; },
    setCoins(n) { coins.textContent = '🪙 ' + n; },
    setAction(label) { if (!label) { action.hidden = true; return; } action.hidden = false; if (action.textContent !== label) action.textContent = label; },
    get busy() { return !!dialog || !!panel; },
    toast(text) {
      toastEl?.remove(); clearTimeout(toastT);
      toastEl = h(`<div class="tw-toast"></div>`); toastEl.textContent = text; root.appendChild(toastEl);
      toastT = setTimeout(() => { toastEl?.remove(); toastEl = null; }, 2200);
    },
    // 会話:文字送り。choices を押すか、最後まで出たあとに押すと閉じる
    dialog({ name, role, text, choices = [] }) {
      this.closeDialog();
      dialog = h(`<div class="tw-dialog"><div class="tw-dname"></div><div class="tw-dtext"></div><div class="tw-choices"></div></div>`);
      dialog.querySelector('.tw-dname').innerHTML = `${esc(name)}${role ? `<small>${esc(role)}</small>` : ''}`;
      const tx = dialog.querySelector('.tw-dtext'), ch = dialog.querySelector('.tw-choices');
      const all = [...choices, { label: 'またね', fn: null }];
      all.forEach((c, i) => { const b = h(`<button class="tw-btn${i === 0 && choices.length ? ' main' : ''}"></button>`); b.textContent = c.label; b.onclick = ev => { ev.stopPropagation(); this.closeDialog(); c.fn?.(); }; ch.appendChild(b); });
      ch.style.visibility = 'hidden';
      root.appendChild(dialog);
      let i = 0; const chars = [...text];
      const tick = setInterval(() => {
        i++; tx.textContent = chars.slice(0, i).join('');
        if (i % 2) bus.emit('sfx', 'blip');
        if (i >= chars.length) { clearInterval(tick); ch.style.visibility = ''; }
      }, 32);
      dialog.onclick = () => { if (i < chars.length) { i = chars.length - 1; } };
      dialog._stop = () => clearInterval(tick);
    },
    closeDialog() { if (dialog) { dialog._stop(); dialog.remove(); dialog = null; bus.emit('ui:dialogClosed'); } },
    // 頭の上の名前と吹き出し
    tag(id, name, me = false) {
      if (tags.has(id)) return;
      const el = h(`<div class="tw-label${me ? ' me' : ''}"></div>`); el.textContent = name; labels.appendChild(el);
      tags.set(id, { el, bubble: null, until: 0 });
    },
    untag(id) { const t = tags.get(id); if (t) { t.el.remove(); t.bubble?.remove(); tags.delete(id); } },
    say(id, text, sec = 3.5) {
      const t = tags.get(id); if (!t) return;
      t.bubble?.remove(); t.bubble = h('<div class="tw-bubble"></div>'); t.bubble.textContent = text; labels.appendChild(t.bubble); t.until = performance.now() + sec * 1000;
    },
    // pos: id → {x,y,visible}(画面座標)
    placeTags(pos) {
      const now = performance.now();
      for (const [id, t] of tags) {
        const p = pos.get(id);
        const vis = p && p.visible;
        t.el.style.display = vis && p.showName ? '' : 'none';
        if (vis) t.el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-100%)`;
        if (t.bubble) {
          if (now > t.until) { t.bubble.remove(); t.bubble = null; continue; }
          t.bubble.style.display = vis ? '' : 'none';
          if (vis) t.bubble.style.transform = `translate(${p.x}px,${p.y - 24}px) translate(-50%,-100%)`;
        }
      }
    },
    panel(html, onClick, opt = {}) {
      this.closePanel();
      panel = h(`<div class="tw-panel"><div class="tw-card">${html}</div></div>`);
      panel.onclick = e => { if (e.target === panel) return opt.sticky ? undefined : this.closePanel(); onClick?.(e, panel); };
      root.appendChild(panel);
      return panel;
    },
    closePanel() { if (panel) { panel.remove(); panel = null; bus.emit('ui:panelClosed'); } },
    // 最初の画面:キャラを選んで名前を決める
    title({ look, name }, onStart) {
      const el = h(`<div class="tw-title"><div class="tw-logo">ほしみや町</div><div class="tw-sub">パステルの町で、くらしてみよう</div><div class="tw-looks"></div><input class="tw-name" maxlength="8" placeholder="なまえ"><button class="tw-btn tw-start">町へ出かける</button><div class="tw-hint">PC:WASD で移動・ドラッグで見まわす・E で話す<br>スマホ:左側をなぞって移動・右側で見まわす</div></div>`);
      const box = el.querySelector('.tw-looks');
      let sel = look;
      LOOK_IDS.forEach(id => {
        const L = LOOKS[id];
        const b = h(`<button class="tw-look${id === sel ? ' on' : ''}"><i style="background:#${hex(L.hair)};--sk:#${hex(L.skin)}"></i>${L.name}</button>`);
        b.onclick = () => { sel = id; box.querySelectorAll('.tw-look').forEach(x => x.classList.remove('on')); b.classList.add('on'); if (!inp.value || LOOK_IDS.some(k => LOOKS[k].name === inp.value)) inp.value = L.name; bus.emit('sfx', 'tap'); };
        box.appendChild(b);
      });
      const inp = el.querySelector('.tw-name'); inp.value = name || LOOKS[sel].name;
      inp.addEventListener('keydown', e => e.stopPropagation());
      el.querySelector('.tw-start').onclick = () => { el.remove(); onStart({ look: sel, name: (inp.value.trim() || LOOKS[sel].name).slice(0, 8) }); };
      root.appendChild(el);
    },
    dispose() { this.closeDialog(); this.closePanel(); toastEl?.remove(); [top, labels, action, emotes].forEach(e => e.remove()); },
  };
}
const hex = n => n.toString(16).padStart(6, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
