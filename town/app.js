(() => {
  // core/store.js
  var PREFIX = "cs:";
  function createStore(space) {
    const p = PREFIX + space + ":";
    return {
      get(k) {
        try {
          const v = localStorage.getItem(p + k);
          return v == null ? null : JSON.parse(v);
        } catch (e) {
          return null;
        }
      },
      set(k, v) {
        try {
          localStorage.setItem(p + k, JSON.stringify(v));
        } catch (e) {
        }
      },
      remove(k) {
        try {
          localStorage.removeItem(p + k);
        } catch (e) {
        }
      },
      keys() {
        const out = [];
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k.startsWith(p)) out.push(k.slice(p.length));
          }
        } catch (e) {
        }
        return out;
      }
    };
  }

  // core/settings.js
  var DEFAULTS = { bgm: 0.5, sfx: 0.8, voice: true, rate: 1 };
  function createSettings() {
    const st = createStore("core");
    const v = Object.assign({}, DEFAULTS, st.get("settings") || {});
    const subs = /* @__PURE__ */ new Set();
    return {
      get: (k) => v[k],
      all: () => Object.assign({}, v),
      set(k, val) {
        v[k] = val;
        st.set("settings", v);
        subs.forEach((f) => {
          try {
            f(k, val, v);
          } catch (e) {
          }
        });
      },
      onChange(f) {
        subs.add(f);
        return () => subs.delete(f);
      }
    };
  }

  // core/speech.js
  function createSpeech(settings) {
    let voice = null;
    const pick = () => {
      try {
        const vs = speechSynthesis.getVoices() || [], en = vs.filter((x) => /^en[-_]?/i.test(x.lang || ""));
        voice = en.find((x) => /US/i.test(x.lang)) || en[0] || null;
      } catch (e) {
      }
    };
    try {
      pick();
      speechSynthesis.addEventListener("voiceschanged", pick);
    } catch (e) {
    }
    return {
      speak(text, opt = {}) {
        if (!settings.get("voice")) {
          opt.onend && setTimeout(opt.onend, 0);
          return;
        }
        try {
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "en-US";
          if (voice) u.voice = voice;
          u.rate = (opt.rate || 1) * settings.get("rate");
          if (opt.onend) u.onend = u.onerror = opt.onend;
          speechSynthesis.speak(u);
        } catch (e) {
          opt.onend && opt.onend();
        }
      },
      stop() {
        try {
          speechSynthesis.cancel();
        } catch (e) {
        }
      },
      get voice() {
        return voice;
      }
    };
  }

  // core/sound.js
  function createSound(settings) {
    let ac = null, sfx = null, bgm = null;
    const ensure = () => {
      if (!ac) {
        try {
          ac = new (window.AudioContext || window.webkitAudioContext)();
          sfx = ac.createGain();
          bgm = ac.createGain();
          sfx.connect(ac.destination);
          bgm.connect(ac.destination);
          apply();
        } catch (e) {
          ac = null;
        }
      }
      if (ac && ac.state === "suspended") ac.resume();
      return ac;
    };
    const apply = () => {
      if (!ac) return;
      sfx.gain.value = settings.get("sfx");
      bgm.gain.value = settings.get("bgm");
    };
    settings.onChange(apply);
    return {
      ctx: ensure,
      get sfxBus() {
        ensure();
        return sfx;
      },
      get bgmBus() {
        ensure();
        return bgm;
      },
      /* かんたんな効果音：beep(高さHz, 長さ秒, 波形) */
      beep(f = 660, d = 0.08, type = "triangle", vol = 0.15) {
        const c = ensure();
        if (!c) return;
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
        o.type = type;
        o.frequency.value = f;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(1e-3, t + d);
        o.connect(g);
        g.connect(sfx);
        o.start(t);
        o.stop(t + d + 0.02);
      }
    };
  }

  // core/rights.js
  function createRights(grants = []) {
    const st = createStore("core");
    const owned = /* @__PURE__ */ new Set([...st.get("rights") || [], ...grants]);
    const subs = /* @__PURE__ */ new Set();
    const has = (id) => owned.has(id) || id.startsWith("game:") && owned.has("sub:all");
    return {
      has,
      list: () => [...owned],
      grant(id) {
        if (owned.has(id)) return;
        owned.add(id);
        st.set("rights", [...owned].filter((x) => !grants.includes(x)));
        subs.forEach((f) => f(id));
      },
      onChange(f) {
        subs.add(f);
        return () => subs.delete(f);
      }
    };
  }

  // core/events.js
  function createEvents() {
    const st = createStore("core");
    const stats = st.get("stats") || { first: null, last: null, count: {} };
    const subs = /* @__PURE__ */ new Set();
    return {
      report(game, name, data = {}) {
        const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), key = game + ":" + name;
        stats.first = stats.first || now;
        stats.last = now;
        stats.count[key] = (stats.count[key] || 0) + 1;
        st.set("stats", stats);
        subs.forEach((f) => {
          try {
            f(game, name, data);
          } catch (e) {
          }
        });
      },
      stats: () => JSON.parse(JSON.stringify(stats)),
      on(f) {
        subs.add(f);
        return () => subs.delete(f);
      }
    };
  }

  // core/profile.js
  function createProfile(events, base) {
    const st = createStore("core");
    const p = Object.assign({ name: "", avatar: "default" }, st.get("profile") || {});
    return {
      get name() {
        return p.name;
      },
      setName(n) {
        p.name = String(n).slice(0, 12);
        st.set("profile", p);
      },
      avatarURL() {
        return base + "core/avatar/" + p.avatar + ".svg";
      },
      status() {
        const s = events.stats(), c = s.count, plays = Object.keys(c).filter((k) => k.endsWith(":open")).reduce((a, k) => a + c[k], 0);
        return [{ label: "\u904A\u3093\u3060\u56DE\u6570", value: plays + "\u56DE" }, { label: "\u306F\u3058\u3081\u305F\u65E5", value: s.first || "\u2014" }, { label: "\u6700\u5F8C\u306B\u904A\u3093\u3060\u65E5", value: s.last || "\u2014" }];
      }
    };
  }

  // core/ui.js
  function createUI(core2) {
    const root = document.createElement("div");
    root.className = "cs-ui";
    document.body.appendChild(root);
    const esc2 = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const sheet = (html, bind) => {
      const ov = document.createElement("div");
      ov.className = "cs-ov";
      ov.innerHTML = '<div class="cs-sheet" role="dialog">' + html + '<button class="cs-btn cs-close">\u3068\u3058\u308B</button></div>';
      root.appendChild(ov);
      const close = () => ov.remove();
      ov.addEventListener("click", (e) => {
        if (e.target === ov) close();
      });
      ov.querySelector(".cs-close").onclick = close;
      bind && bind(ov, close);
      return close;
    };
    const toast = (t) => {
      const d = document.createElement("div");
      d.className = "cs-toast";
      d.textContent = t;
      root.appendChild(d);
      setTimeout(() => d.remove(), 2200);
    };
    const settings = () => {
      const s = core2.settings, row = (k, label, min, max, step) => `<label class="cs-row"><span>${label}</span><input type="range" id="cs-${k}" min="${min}" max="${max}" step="${step}" value="${s.get(k)}"></label>`;
      sheet(`<h3>\u8A2D\u5B9A</h3>${row("bgm", "BGM", 0, 1, 0.05)}${row("sfx", "\u52B9\u679C\u97F3", 0, 1, 0.05)}
      <label class="cs-row"><span>\u82F1\u8A9E\u306E\u8AAD\u307F\u4E0A\u3052</span><input type="checkbox" id="cs-voice" ${s.get("voice") ? "checked" : ""}></label>
      ${row("rate", "\u8AAD\u307F\u4E0A\u3052\u306E\u901F\u3055", 0.7, 1.3, 0.05)}<button class="cs-btn" id="cs-try">\u8AAD\u307F\u4E0A\u3052\u3092\u8A66\u3059</button>`, (ov) => {
        ["bgm", "sfx", "rate"].forEach((k) => ov.querySelector("#cs-" + k).oninput = (e) => s.set(k, +e.target.value));
        ov.querySelector("#cs-voice").onchange = (e) => s.set("voice", e.target.checked);
        ov.querySelector("#cs-try").onclick = () => core2.speech.speak("Hello! Let\u2019s read English in chunks.");
      });
    };
    const profile = () => {
      const p = core2.profile;
      sheet(`<h3>\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB</h3><div class="cs-prof"><img src="${p.avatarURL()}" alt="\u30A2\u30D0\u30BF\u30FC"><div>
      <label class="cs-row cs-col"><span>\u306A\u307E\u3048</span><input id="cs-name" maxlength="12" placeholder="\u306A\u307E\u3048\u3092\u5165\u308C\u3066\u306D" value="${esc2(p.name)}"></label></div></div>
      <p class="cs-note">\u30A2\u30D0\u30BF\u30FC\u306F\u4F5C\u308A\u76F4\u3057\u4E2D\uFF08\u3044\u307E\u306F\u4EEE\u306E\u7D75\uFF09\u3002\u30B9\u30C6\u30FC\u30BF\u30B9\u306E\u9805\u76EE\u3082\u3053\u308C\u304B\u3089\u6C7A\u3081\u307E\u3059\u3002</p>
      <ul class="cs-stat">${p.status().map((x) => `<li><span>${esc2(x.label)}</span><b>${esc2(x.value)}</b></li>`).join("")}</ul>`, (ov) => {
        ov.querySelector("#cs-name").onchange = (e) => p.setName(e.target.value);
      });
    };
    return { sheet, toast, settings, profile };
  }

  // core/host.js
  var loaded = {};
  function loadScript(src) {
    return loaded[src] || (loaded[src] = new Promise((ok, ng) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = () => {
        delete loaded[src];
        ng(new Error(src));
      };
      document.head.appendChild(s);
    }));
  }
  function createHost(core2, layer, backBtn) {
    let cur = null;
    const close = () => {
      if (!cur) return;
      const c = cur;
      cur = null;
      try {
        c.inst && c.inst.unmount && c.inst.unmount();
      } catch (e) {
        console.error(e);
      }
      core2.speech.stop();
      c.el.remove();
      layer.hidden = true;
      backBtn.hidden = true;
      document.body.classList.remove("cs-in-game");
      core2.onClose && core2.onClose(c.game.id);
    };
    backBtn.addEventListener("click", close);
    return {
      get current() {
        return cur && cur.game.id;
      },
      async open(game, opts = {}) {
        if (cur) close();
        if (game.right && !core2.rights.has(game.right)) {
          core2.ui.toast("\u3053\u306E\u30B2\u30FC\u30E0\u306F\u307E\u3060\u4F7F\u3048\u307E\u305B\u3093");
          return;
        }
        const el = document.createElement("div");
        el.className = "cs-mount";
        layer.appendChild(el);
        layer.hidden = false;
        backBtn.hidden = !core2.config.backButton;
        document.body.classList.add("cs-in-game");
        const ctx = {
          core: core2,
          store: createStore(game.id),
          settings: core2.settings,
          speech: core2.speech,
          sound: core2.sound,
          opts,
          base: core2.base + "g/" + game.id + "/",
          loadScript,
          report: (name, data) => core2.events.report(game.id, name, data),
          showBack: (on) => {
            backBtn.hidden = !(on && core2.config.backButton);
          },
          exit: close
        };
        cur = { game, el, inst: null };
        ctx.report("open");
        try {
          const inst = await game.mount(el, ctx);
          if (cur && cur.el === el) cur.inst = inst || {};
          else inst && inst.unmount && inst.unmount();
        } catch (e) {
          console.error(e);
          el.innerHTML = '<p class="cs-err">\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F</p>';
          backBtn.hidden = false;
        }
      },
      close
    };
  }

  // core/index.js
  function createCore(config) {
    const base = config.base || "./";
    const core2 = { config, base };
    core2.settings = createSettings();
    core2.speech = createSpeech(core2.settings);
    core2.sound = createSound(core2.settings);
    core2.rights = createRights(config.grants || []);
    core2.events = createEvents();
    core2.profile = createProfile(core2.events, base);
    core2.ui = createUI(core2);
    const layer = document.createElement("div");
    layer.className = "cs-layer";
    layer.hidden = true;
    const back = document.createElement("button");
    back.className = "cs-back";
    back.hidden = true;
    back.textContent = config.backLabel || "\u2190 \u3082\u3069\u308B";
    document.body.append(layer, back);
    core2.host = createHost(core2, layer, back);
    return core2;
  }

  // games/cb/game-punichunk.js
  var game_punichunk_default = {
    id: "punichunk",
    name: "\u3077\u306B\u30C1\u30E3\u30F3\u30AF",
    right: "game:punichunk",
    async mount(el, ctx) {
      await ctx.loadScript(ctx.core.base + "lib/punichunk.js");
      const s = ctx.settings, audio = () => ({ bgm: s.get("bgm"), sfx: s.get("sfx"), voice: s.get("voice"), rate: s.get("rate") });
      const g = window.PuniChunk.mount(el, {
        startScreen: "title",
        storage: ctx.store,
        audio: audio(),
        onEvent: (n, d) => {
          if (n === "screen") ctx.showBack(["title", "modes", "splash"].includes(d.name));
          if (n === "result") ctx.report("result", { mode: d.mode, score: d.score });
        }
      });
      const off = s.onChange(() => {
        try {
          g.setAudio(audio());
        } catch (e) {
        }
      });
      ctx.showBack(true);
      return { unmount() {
        off();
        g.unmount();
      } };
    }
  };

  // games/cb/game-cards.js
  var game_cards_default = {
    id: "cards",
    name: "\u30C1\u30E3\u30F3\u30AF\u30FB\u30AB\u30FC\u30C9",
    right: "game:cards",
    async mount(el, ctx) {
      await ctx.loadScript(ctx.core.base + "lib/punichunk.js");
      await ctx.loadScript(ctx.base + "cards.js");
      el.classList.add("ct-cards");
      const root = document.createElement("div");
      root.className = "cc-app";
      el.appendChild(root);
      window.ChunkCards.mount(root);
      const mo = new MutationObserver(() => ctx.showBack(!!root.querySelector("#go")));
      mo.observe(root, { childList: true, subtree: true });
      ctx.showBack(true);
      return { unmount() {
        mo.disconnect();
        root.remove();
      } };
    }
  };

  // games/stream/game.js
  var game_default = {
    id: "stream",
    name: "\u30C1\u30E3\u30F3\u30AF\u30B9\u30C8\u30EA\u30FC\u30E0",
    right: "game:stream",
    async mount(el, ctx) {
      for (const f of ["data.js", "pool.js", "words.js", "stream.js"]) await ctx.loadScript(ctx.base + f);
      return window.StreamApp(el, ctx);
    }
  };

  // games/chunkchunk/game.js
  var game_default2 = {
    id: "chunkchunk",
    name: "\u30C1\u30E3\u30F3\u30AF\u30C1\u30E3\u30F3\u30AF",
    right: "game:chunkchunk",
    async mount(el, ctx) {
      const f = document.createElement("iframe");
      f.src = ctx.base + "index.html" + (ctx.opts.go ? "?go=" + ctx.opts.go : "");
      f.allow = "fullscreen; autoplay";
      el.appendChild(f);
      ctx.showBack(true);
      return { unmount() {
        f.src = "about:blank";
      } };
    }
  };

  // games/index.js
  var GAMES = { punichunk: game_punichunk_default, cards: game_cards_default, stream: game_default, chunkchunk: game_default2 };

  // apps/town/main.js
  var core = createCore(window.__APP__);
  var PLACES = {
    school: { n: "\u5B66\u6821", img: "school", sub: "\u30C1\u30E3\u30F3\u30AF\u30C1\u30E3\u30F3\u30AF\u3067\u5B66\u3076", items: [{ t: "\u30C1\u30E3\u30F3\u30AF\u30C1\u30E3\u30F3\u30AF\uFF08\u30B9\u30BF\u30C7\u30A3\uFF09", game: "chunkchunk", opts: { go: "study" } }] },
    library: { n: "\u56F3\u66F8\u9928", img: "library", sub: "\u8AAD\u3080\u30FB\u8ABF\u3079\u308B", items: [{ t: "\u30EA\u30FC\u30C7\u30A3\u30F3\u30B0\uFF08\u30C1\u30E3\u30F3\u30AF\u30C1\u30E3\u30F3\u30AF\uFF09", game: "chunkchunk", opts: { go: "study" } }] },
    house: { n: "\u81EA\u5B85", img: "house", profile: true },
    shop: { n: "\u30B7\u30E7\u30C3\u30D7", img: "supermarket", sub: "\u6709\u6599\u30B3\u30F3\u30C6\u30F3\u30C4", items: [] },
    game: { n: "\u30B2\u30FC\u30E0\u30BB\u30F3\u30BF\u30FC", img: "gamecenter", sub: "\u904A\u3093\u3067\u935B\u3048\u308B", items: [
      { t: "\u30C1\u30E3\u30F3\u30AF\u30B9\u30C8\u30EA\u30FC\u30E0", game: "stream" },
      { t: "\u3077\u306B\u30C1\u30E3\u30F3\u30AF", game: "punichunk" },
      { t: "\u30C1\u30E3\u30F3\u30AF\u30FB\u30AB\u30FC\u30C9", game: "cards" },
      { t: "\u30C1\u30E3\u30F3\u30AF\u30C1\u30E3\u30F3\u30AF\uFF08\u30B2\u30FC\u30E0\uFF09", game: "chunkchunk", opts: { go: "game" } }
    ] }
  };
  var BLD = [["school", "bSchool", "\u5B66\u6821"], ["library", "bLibrary", "\u56F3\u66F8\u9928"], ["house", "bHouse", "\u81EA\u5B85"], ["shop", "bShop", "\u30B7\u30E7\u30C3\u30D7"], ["game", "bGame", "\u30B2\u30FC\u30E0\u30BB\u30F3\u30BF\u30FC"]];
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  document.body.insertAdjacentHTML("afterbegin", `<div class="tw-view"><div class="tw-map" id="twMap">${BLD.map(([k, id, alt]) => `<button class="tw-bld" id="${id}" data-k="${k}"><img src="img/${PLACES[k].img}.webp" alt="${alt}"></button>`).join("")}</div></div>
<div class="tw-top"><button class="tw-me" id="twMe"><img alt="" id="twMeImg"><span id="twMeName"></span></button><button class="tw-gear" id="twGear" aria-label="\u8A2D\u5B9A">\u2699</button></div>`);
  var $ = (id) => document.getElementById(id);
  var refreshMe = () => {
    $("twMeImg").src = core.profile.avatarURL();
    $("twMeName").textContent = core.profile.name || "\u306A\u307E\u3048\u672A\u8A2D\u5B9A";
  };
  refreshMe();
  $("twMe").onclick = () => {
    core.ui.profile();
  };
  $("twGear").onclick = () => core.ui.settings();
  document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "cs-name") setTimeout(refreshMe, 0);
  });
  var fit = () => {
    const m = $("twMap"), vh = innerHeight, mh = m.offsetHeight;
    m.style.top = (mh <= vh ? vh - mh : Math.min(0, Math.max(vh - mh, vh / 2 - mh * 0.48))) + "px";
  };
  addEventListener("resize", fit);
  fit();
  function enter(k) {
    const p = PLACES[k];
    if (p.profile) {
      core.ui.profile();
      return;
    }
    if (p.items.length === 1) {
      core.host.open(GAMES[p.items[0].game], p.items[0].opts);
      return;
    }
    core.ui.sheet(
      `<header class="tw-head"><img src="img/${p.img}.webp" alt=""><div><h3>${esc(p.n)}</h3><p>${esc(p.sub)}</p></div></header>` + (p.items.length ? `<ul class="tw-list">${p.items.map((it, i) => `<li><button data-i="${i}">${esc(it.t)}<small>\u5165\u308B \u203A</small></button></li>`).join("")}</ul>` : '<p class="cs-note">\u58F2\u3063\u3066\u3044\u308B\u3082\u306E\u306F\u3001\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002</p>'),
      (ov, close) => ov.querySelectorAll("button[data-i]").forEach((b) => b.onclick = () => {
        const it = p.items[+b.dataset.i];
        close();
        core.host.open(GAMES[it.game], it.opts);
      })
    );
  }
  document.querySelectorAll(".tw-bld").forEach((b) => b.addEventListener("click", () => {
    b.classList.remove("hop");
    void b.offsetWidth;
    b.classList.add("hop");
    setTimeout(() => enter(b.dataset.k), 260);
  }));
  core.onClose = () => refreshMe();
})();
