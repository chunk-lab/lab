/* ===== チャンクタウン：土台（全アプリ共通のしくみ） =====
 ここにあるもの
  ・アプリの登録と開け閉め（ChunkTown.register / open / close）
  ・セーブデータ（ChunkTown.storage(名前)）… アプリごとに分かれた保存場所。キーは "ct:<アプリ>:<キー>"
  ・共通の設定（ChunkTown.settings）… 音量・読み上げ。全アプリで同じものを使う
  ・読み上げ（ChunkTown.speak）
 これから入れるもの（中身を決めてから）：プロフィール・アバター、コイン・ダイヤ、レベル・課題、ショップ、ランキング

 アプリのつなぎ方（apps/adapters/*.js）
  ChunkTown.register({
    id:"punichunk", name:"ぷにチャンク",
    scripts:["apps/punichunk.js"],          // 最初に開くときに読み込むファイル
    mount(el, ctx){ ...; return { unmount(){...} } }
  });
  ctx = { storage, settings, speak, showBack(true/false), exit() }
*/
(function () {
  'use strict';
  var KEY = 'ct:';
  function storage(ns) {
    var p = KEY + ns + ':';
    return {
      get: function (k) { try { var v = localStorage.getItem(p + k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } },
      set: function (k, v) { try { localStorage.setItem(p + k, JSON.stringify(v)); } catch (e) { } },
      remove: function (k) { try { localStorage.removeItem(p + k); } catch (e) { } }
    };
  }
  var core = storage('core');
  var settings = Object.assign({ bgm: 0.5, sfx: 0.8, voice: true, rate: 1 }, core.get('settings') || {});
  function saveSettings() { core.set('settings', settings); }

  var voice = null;
  function pickVoice() { try { var vs = speechSynthesis.getVoices() || [], en = vs.filter(function (v) { return /^en[-_]?/i.test(v.lang || ''); }); voice = en.find(function (v) { return /US/i.test(v.lang); }) || en[0] || null; } catch (e) { } }
  try { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) { }
  function speak(t) { if (!settings.voice) return; try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; if (voice) u.voice = voice; u.rate = settings.rate; speechSynthesis.speak(u); } catch (e) { } }

  var loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    return (loaded[src] = new Promise(function (ok, ng) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { delete loaded[src]; ng(new Error(src)); }; document.head.appendChild(s); }));
  }

  var apps = {}, cur = null;
  var CT = window.ChunkTown = {
    storage: storage, settings: settings, saveSettings: saveSettings, speak: speak, apps: apps,
    register: function (a) { apps[a.id] = a; },
    open: function (id, opts) {
      var a = apps[id]; if (!a || cur) return;
      var view = document.getElementById('ctApp'), back = document.getElementById('ctBack'), el = document.createElement('div');
      el.className = 'ct-mount'; view.appendChild(el); view.hidden = false; back.hidden = true;
      document.body.classList.add('ct-in-app');
      var ctx = { storage: storage(id), settings: settings, speak: speak, opts: opts || {}, exit: CT.close,
        showBack: function (on) { back.hidden = !on; } };
      cur = { id: id, el: el, inst: null };
      (a.scripts || []).reduce(function (p, s) { return p.then(function () { return loadScript(s); }); }, Promise.resolve())
        .then(function () { if (cur && cur.el === el) cur.inst = a.mount(el, ctx) || {}; })
        .catch(function (e) { el.innerHTML = '<p class="ct-err">読み込めませんでした（' + e.message + '）</p>'; back.hidden = false; });
    },
    close: function () {
      if (!cur) return; var c = cur; cur = null;
      try { c.inst && c.inst.unmount && c.inst.unmount(); } catch (e) { }
      try { speechSynthesis.cancel(); } catch (e) { }
      c.el.remove(); document.getElementById('ctApp').hidden = true; document.getElementById('ctBack').hidden = true;
      document.body.classList.remove('ct-in-app');
    }
  };
  document.addEventListener('DOMContentLoaded', function () { document.getElementById('ctBack').onclick = CT.close; });
})();
