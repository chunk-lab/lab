// 単発アプリを町に差し込む仕組み(Town App 契約 v1)
// どのアプリも「mount(要素, ctx) → { unmount() }」の形にそろえて開く。
// 種類:
//   module … 町と一緒にビルドする JS(mount を持つオブジェクト)
//   script … 別ファイルの JS を読み込み、window[global].mount(要素, options) を呼ぶ(ぷにチャンク型)
//   iframe … 別の HTML をそのまま入れる。postMessage で町とやり取りする(sdk/town-sdk.js)

export function createAppHost({ root, bus, storage, wallet, getPlayer, getAudio, getNotes = () => [], features = [], gems = null, house = null, photo = null, paramsFor = null, member = null, dictUrl = null, learn = null }) {
  const registry = new Map();
  const loadedScripts = new Map();
  let current = null;

  const layer = document.createElement('div');
  layer.className = 'tw-app-layer';
  layer.hidden = true;
  root.appendChild(layer);

  function makeCtx(def, params, frame) {
    return {
      version: 1,
      appId: def.id,
      params,
      player: getPlayer(),
      audio: getAudio(),
      storage: storage.scope('app:' + def.id),
      notes: { list: getNotes },   // ことばノート(読み取り専用)。チャンクストリームなどの復習アプリが使う
      wallet: { get: wallet.get, add: (n, why) => wallet.add(n, def.id + (why ? ':' + why : '')) },
      gems,    // ダイヤ {get, spend}。組み込み先がなければ null(その場合コインだけで広げる)
      house,   // 自宅の広げ方の値段
      member,  // 会員 {paid()}。組み込み先がなければ null(無料会員あつかい)
      dictUrl, // 辞書データの場所(英語ゲーム用)
      learn,   // 単語ごとの学習の記録(組み込み先の共通の記録)。なければ null(アプリが自分で持つ)
      photo,   // 写真の枠の設定(はじめの枚数・最大・ダイヤの値段)
      features: features.slice(),   // 組み込み先(チャンクタウン)が用意している機能。'study'＝勉強部屋を開ける
      emit: (name, data) => bus.emit('app:event', { app: def.id, name, data }),
      setTitle: t => { frame.querySelector('.tw-app-title').textContent = t; },
      setHead: btns => {   // 上のバー「町にもどる」の左に、アプリ用のボタンを並べる([{label, fn}]。空で消す)
        const hd = frame.querySelector('.tw-app-head'), cl = frame.querySelector('.tw-app-close'); hd.querySelector('.tw-app-hb')?.remove();
        if (!btns || !btns.length) return;
        const w = document.createElement('span'); w.className = 'tw-app-hb';
        btns.forEach(b => { const e = document.createElement('button'); e.className = 'tw-app-hbtn'; e.textContent = b.label; e.onclick = () => b.fn(); w.appendChild(e); });
        hd.insertBefore(w, cl);
      },
      open: (id, p) => setTimeout(() => open(id, p), 0),   // ほかのアプリへ(いまのアプリは閉じる)。家→ショップなど
      close: result => close(result),
    };
  }

  async function open(id, params = {}) {
    const def = registry.get(id);
    if (paramsFor) params = paramsFor(id, params) || params;   // 町の様子(時刻など)をアプリに足す
    if (!def) { bus.emit('toast', 'まだ準備中みたい'); return false; }
    if (current) close();
    const frame = document.createElement('div');
    frame.className = 'tw-app';
    frame.innerHTML = `<header class="tw-app-head"><span class="tw-app-title"></span><button class="tw-app-close" aria-label="町にもどる">町にもどる</button></header><div class="tw-app-body"></div>`;
    frame.querySelector('.tw-app-title').textContent = def.title;
    const back = params && params.from === 'home' && id !== 'home' && registry.get('home');   // 家から開いたものは「家にもどる」
    if (back) { const b = frame.querySelector('.tw-app-close'); b.textContent = '🏠 家にもどる'; b.setAttribute('aria-label', '家にもどる'); }
    const rb = params && params.back && params.back.id && registry.get(params.back.id) ? params.back : null;   // 来た施設(アミューズメントセンターなど)にもどる
    if (rb) { const b = frame.querySelector('.tw-app-close'); b.textContent = rb.label || 'もどる'; b.setAttribute('aria-label', rb.label || 'もどる'); }
    frame.querySelector('.tw-app-close').onclick = () => { const go = () => (rb ? open(rb.id, rb.params || {}) : back ? open('home', {}) : close()); if (current?.frame === frame && current.inst?.beforeClose?.(go)) return; go(); };   // アプリが最後に見せたいものがあれば先に
    layer.appendChild(frame);
    layer.hidden = false;
    const body = frame.querySelector('.tw-app-body');
    const ctx = makeCtx(def, params, frame);
    current = { id, def, frame, inst: null };
    bus.emit('app:open', { id });
    try {
      const mounter = def.type === 'script' ? scriptMounter(def) : def.type === 'iframe' ? iframeMounter(def) : def.module;
      const inst = await mounter.mount(body, ctx);
      if (current && current.frame === frame) current.inst = inst; else inst?.unmount?.();
    } catch (e) {
      console.warn('[town] app failed', id, e);
      body.innerHTML = `<div class="tw-app-missing"><p>このアプリはまだ置かれていないみたい。</p><small>${def.hint || ''}</small></div>`;
    }
    return true;
  }

  function close(result) {
    if (!current) return;
    const c = current;
    current = null;
    try { c.inst?.unmount?.(); } catch (e) { console.error(e); }
    c.frame.remove();
    layer.hidden = true;
    bus.emit('app:close', { id: c.id, result });
  }

  function loadScript(src) {
    if (!loadedScripts.has(src)) {
      loadedScripts.set(src, new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.async = true;
        s.onload = res;
        s.onerror = () => { loadedScripts.delete(src); s.remove(); rej(new Error('load ' + src)); };
        document.head.appendChild(s);
      }));
    }
    return loadedScripts.get(src);
  }

  function scriptMounter(def) {
    return {
      async mount(el, ctx) {
        await loadScript(def.src);
        const lib = window[def.global];
        if (!lib?.mount) throw new Error('no global ' + def.global);
        const inner = document.createElement('div');
        inner.style.cssText = 'position:absolute;inset:0';
        el.appendChild(inner);
        const handle = lib.mount(inner, def.options ? def.options(ctx) : {});
        return { unmount() { (handle?.unmount || lib.unmount)?.call(handle || lib); inner.remove(); } };
      },
    };
  }

  function iframeMounter(def) {
    return {
      mount(el, ctx) {
        const f = document.createElement('iframe');
        f.className = 'tw-app-frame';
        f.src = def.url;
        f.allow = 'autoplay';
        el.appendChild(f);
        const send = msg => f.contentWindow?.postMessage({ town: 1, ...msg }, '*');
        const hello = () => send({ type: 'hello', ctx: { version: 1, appId: ctx.appId, params: ctx.params, player: ctx.player, audio: ctx.audio, coins: ctx.wallet.get() } });
        const onMsg = e => {
          if (e.source !== f.contentWindow || !e.data || e.data.town !== 1) return;
          const m = e.data;
          switch (m.type) {
            case 'ready': hello(); break;
            case 'close': ctx.close(m.result); break;
            case 'event': ctx.emit(m.name, m.data); break;
            case 'coins': send({ type: 'coins', id: m.id, coins: ctx.wallet.add(m.amount, m.reason) }); break;
            case 'storage:get': send({ type: 'storage', id: m.id, value: ctx.storage.get(m.key) }); break;
            case 'storage:set': ctx.storage.set(m.key, m.value); break;
            case 'title': ctx.setTitle(String(m.title || '')); break;
          }
        };
        window.addEventListener('message', onMsg);
        f.addEventListener('load', hello);
        const offAudio = bus.on('audio', a => send({ type: 'audio', audio: a }));
        return { unmount() { window.removeEventListener('message', onMsg); offAudio(); f.src = 'about:blank'; f.remove(); } };
      },
    };
  }

  return {
    register(def) { registry.set(def.id, def); },
    has: id => registry.has(id),
    open, close,
    get current() { return current ? current.id : null; },
    list: () => [...registry.values()],
  };
}
