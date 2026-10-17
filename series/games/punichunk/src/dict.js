import { DICT_DATA } from './dict_data.js';
/* ===== dict.js:辞書アダプタと語形変化 =====
 辞書アダプタの約束(差し替え用):
   getWords({pos, tag, maxLevel, count, rnd, exclude}) → 辞書エントリの配列
   all(pos) → その品詞の全エントリ
 pos: 'noun' | 'verb' | 'adj' | 'adv' | 'idiom'。エントリの形は README の「辞書スキーマ」を参照。 */
export var Dict = (function () {
  'use strict';
  function makeDefault(data) {
    data = data || DICT_DATA;
    var idx = {};
    Object.keys(data).forEach(function (pos) { idx[pos] = data[pos].filter(function (e) { return e && e.w; }); });
    function match(e, o) {
      if (o.maxLevel && (e.lv || 1) > o.maxLevel) return false;
      if (o.minLevel && (e.lv || 1) < o.minLevel) return false;
      if (o.tag) {
        var t = o.tag;
        if (t.cat && e.cat !== t.cat) return false;
        if (t.notCat && t.notCat.indexOf(e.cat) >= 0) return false;
        if (t.k && (Array.isArray(t.k) ? t.k.indexOf(e.k) < 0 : e.k !== t.k)) return false;
        if (t.c && t.c.indexOf(e.c) < 0) return false;
        if (t.fr && t.fr.indexOf(e.fr) < 0) return false;
        if (t.simple && (e.tail)) return false;
        if (t.cv && !e.cv) return false;
        if (t.link && !e.link) return false;
      }
      if (o.exclude && o.exclude.has(e.w)) return false;
      return true;
    }
    return {
      getWords: function (o) {
        o = o || {};
        var list = (idx[o.pos] || []).filter(function (e) { return match(e, o); });
        var r = o.rnd || Math.random, n = o.count || 1, out = [];
        if (!list.length) return out;
        // 低いレベルほど少し出やすくする
        for (var tries = 0; out.length < n && tries < n * 30; tries++) {
          var a = list[Math.floor(r() * list.length)], b = list[Math.floor(r() * list.length)];
          var e = (a.lv || 1) <= (b.lv || 1) ? a : b;
          if (out.indexOf(e) < 0) out.push(e);
        }
        return out;
      },
      all: function (pos) { return (idx[pos] || []).slice(); }
    };
  }
  function validate(ad) {
    if (!ad || typeof ad.getWords !== 'function' || typeof ad.all !== 'function') throw new Error('PuniChunk: 辞書アダプタには getWords と all が必要です');
    return ad;
  }

  // ---------- 語形変化 ----------
  var IRR_PL = { child: 'children', man: 'men', woman: 'women', mouse: 'mice', sheep: 'sheep', fish: 'fish', person: 'people', foot: 'feet', tooth: 'teeth', goose: 'geese', knife: 'knives', leaf: 'leaves', wife: 'wives', life: 'lives', half: 'halves', wolf: 'wolves', shelf: 'shelves', potato: 'potatoes', tomato: 'tomatoes', hero: 'heroes', deer: 'deer', ox: 'oxen', policeman: 'policemen', fireman: 'firemen', salmon: 'salmon', piano: 'pianos', photo: 'photos', radio: 'radios', zoo: 'zoos', kangaroo: 'kangaroos', video: 'videos' };
  function plural(w) {
    var sp = w.lastIndexOf(' ');
    if (sp > 0) return w.slice(0, sp + 1) + plural(w.slice(sp + 1));
    var lw = w.toLowerCase();
    if (IRR_PL[lw]) return IRR_PL[lw];
    var m = /(child|man|woman|mouse|foot|tooth|person)$/.exec(lw); if (m && lw !== m[1]) return w.slice(0, -m[1].length) + IRR_PL[m[1]];
    if (/(s|x|z|ch|sh)$/.test(lw)) return w + 'es';
    if (/[^aeiou]y$/.test(lw)) return w.slice(0, -1) + 'ies';
    if (/[^aeiou]o$/.test(lw)) return w + 'es';
    return w + 's';
  }
  function head(v) { return v.b || v.w.split(' ')[0]; }
  function tailOf(v) { var t = v.tail || (v.w.indexOf(' ') > 0 && v.w.split(' ').slice(1).join(' ')) || ''; return t ? ' ' + t : ''; }
  function s3(v) {
    var b = head(v); if (v.s3) return v.s3 + tailOf(v);
    var x;
    if (b === 'have') x = 'has'; else if (b === 'be') x = 'is';
    else if (/(s|x|z|ch|sh|o)$/.test(b)) x = b + 'es';
    else if (/[^aeiou]y$/.test(b)) x = b.slice(0, -1) + 'ies';
    else x = b + 's';
    return x + tailOf(v);
  }
  function regEd(b, dbl) {
    if (/e$/.test(b)) return b + 'd';
    if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ied';
    if (dbl && /[^aeiou][aeiou][bdgklmnprtv]$/.test(b)) return b + b.slice(-1) + 'ed';
    return b + 'ed';
  }
  function past(v) { return (v.past || regEd(head(v), v.dbl)) + tailOf(v); }
  function pp(v) { return (v.pp || v.past || regEd(head(v), v.dbl)) + tailOf(v); }
  function ingOf(b, dbl) {
    if (b === 'be') return 'being'; if (b === 'see') return 'seeing';
    if (/ie$/.test(b)) return b.slice(0, -2) + 'ying';
    if (/[^aeiouy]e$/.test(b) && !/(ee|ye|oe)$/.test(b)) return b.slice(0, -1) + 'ing';
    if (dbl && /[^aeiou][aeiou][bdgklmnprtv]$/.test(b)) return b + b.slice(-1) + 'ing';
    return b + 'ing';
  }
  function ing(v) { return ingOf(head(v), v.dbl) + tailOf(v); }
  function base(v) { return head(v) + tailOf(v); }
  function comp(a) { return a.cmp || 'more ' + a.w; }
  function sup(a) { return a.sup || 'most ' + a.w; }
  function an(next) {
    var w = String(next || '').toLowerCase();
    if (/^(hour|honest|honor|heir)/.test(w)) return 'an';
    if (/^(uni|use|usu|uti|euro|one|once|u[^aeiou][aeiou])/.test(w)) return 'a';
    return /^[aeiou]/.test(w) ? 'an' : 'a';
  }
  return { makeDefault: makeDefault, validate: validate, plural: plural, s3: s3, past: past, pp: pp, ing: ing, base: base, comp: comp, sup: sup, an: an, head: head };
})();
