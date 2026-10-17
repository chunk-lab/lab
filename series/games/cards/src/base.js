import { G } from '../../punichunk/src/grammar.js';
import { Dict } from '../../punichunk/src/dict.js';
export { G };
export var DICT = Dict.makeDefault();
  export var CFG = { auto: { art: false, prep: false, verb: false, ti: false, er: false } };
  // レベル:0 初級(冠詞・前置詞・時制はおまかせ)/1 中級/2 上級
  export var LEVEL = 1, LV_JA = ['初級', '中級', '上級'], LV_MULT = [1, 1, 1.3];
  export function setLevel(l) { LEVEL = l; var a = l === 0; CFG.auto = { art: a, prep: a, verb: a, ti: a, er: a }; }
  export var $ = function (s, r) { return (r || document).querySelector(s); };
  export var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  export var rnd = Math.random, pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  export var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  export var storeKeyLevel = 'level';
  /* セーブ：共通のセーブ（ctx.store）にそのまま入れる。mount のときに bindStore で渡す */
  export var back = null;
  export function bindStore(s) { back = s; }
  export var store = { get: function (k) { var v = back ? back.get(k) : null; return v === undefined ? null : v; }, set: function (k, v) { if (back) back.set(k, v); } };
