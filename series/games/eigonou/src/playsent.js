import { ENV } from './env.js';
import { LEX, newClause, sentenceJa, sentenceText } from './engine.js';
import { DB, REG, autoExtra, judge, makeItem, refreshLex, save, toast } from './common.js';
import { aiPrompt, mySet, parseAi } from './addword.js';
import { PACK_KINDS } from './pack.js';
import { APP, SAMPLE, esc, go, normalize } from './play.js';
// ================= 完成した文を、組み立て済みの状態で用意する =================
// 英語脳は、文を「誰が・どうする・何を・いつ・どこ・どんなふうに」の枠に1つずつ入れて作る。
// 登録した表現を使った文を、枠ぜんぶ埋めた状態(clause)で持っておき、▶ を押すと「つくる」にそのまま読み込む。
//   AIがあれば:例文を枠に分けてもらい(足りない部品は登録)、エンジンで組み立てる。AIがなければ:エンジンの型どおりに自動で組む。
// AIに聞いてJSONで返してもらう(使っている人のAIのキー → なければClaude内蔵のsample)
export const aiReady = () => !!((ENV.core && ENV.core.ai && ENV.core.ai.ready) || SAMPLE);
export async function askJ(system, user, max) {
  const ai = ENV.core && ENV.core.ai;
  if (ai && ai.ready) return ai.askJSON(system, user, max || 700);
  if (SAMPLE) { const r = await SAMPLE(system + '\n出力はJSONだけ。\n' + user, { modelTier: 'quick' }); const m = String(r && r.text || '').match(/\{[\s\S]*\}|\[[\s\S]*\]/); if (!m) throw new Error('AIの返事を読めませんでした'); return JSON.parse(m[0]); }
  throw new Error('AIのキーが入っていません');
}
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const fullOf = x => norm((x.en || '') + ' ' + (x.tail || '') + ' ' + (x.prep || ''));
const SUBJ = { i: 'i', you: 'you', he: 'he', she: 'she', we: 'we', they: 'they' }, OBJ = { me: 'i', him: 'he', her: 'she', us: 'we', them: 'they', you: 'you' };
const NOUNK = ['people', 'things'];
function findId(kind, full) { const k = norm(full), noArt = k.replace(/^(a|an|the) /, ''); const x = (LEX[kind] || []).find(y => fullOf(y) === k || fullOf(y) === noArt); return x ? x.id : null; }
// 言葉を探し、なければ登録して(マイセットへ)、idを返す
function ensure(kind, full, ja, x, cls) {
  let id = findId(kind, full); if (id) return id;
  const bak = { en: REG.en, ja: REG.ja, e: REG.e, x: REG.x };
  try {
    REG.en = full; REG.ja = ja || ''; REG.e = ''; REG.x = Object.assign({}, autoExtra(kind, full, ja || ''), x || {});
    const it = makeItem(kind); if (!it || !it.en) return null;
    it.cls = cls || (/\s/.test(full.trim()) ? 'phrase' : 'word');
    mySet().items.push(it); save(); refreshLex(); return it.id;
  } finally { Object.assign(REG, bak); }
}
function nounRef(word, kind, ja) {
  const w = norm(word); if (!w) return null;
  if (SUBJ[w]) return 'p:' + SUBJ[w]; if (OBJ[w]) return 'p:' + OBJ[w];
  if (w === 'it' && LEX.things.find(t => t.id === 'it')) return 't:it';
  const k = NOUNK.includes(kind) ? kind : 'things', id = ensure(k, word, ja); return id ? (k === 'people' ? 'p:' : 't:') + id : null;
}
const TENSES = ['pres', 'past', 'fut', 'prog', 'pastprog', 'perf'];
// AIが返した枠(spec)→ clause。作れなければ null
export function clauseFromSpec(sp) {
  if (!sp || !sp.verb) return null;
  const c = newClause(), subj = nounRef(sp.subject || 'I', sp.subject_kind, sp.subject_ja); if (!subj) return null; c.subj = subj;
  const vid = ensure('verbs', sp.verb, sp.verb_ja, { fr: ['intr', 'tr', 'both'].includes(sp.verb_fr) ? sp.verb_fr : undefined, past: sp.past || undefined, pp: sp.pp || undefined });
  if (!vid) return null; c.pred = { k: 'v', id: vid };
  const v = LEX.verbs.find(x => x.id === vid);
  if (sp.object && v && v.fr !== 'intr') { const o = nounRef(sp.object, sp.object_kind, sp.object_ja); if (o) { c.useObj = true; c.obj = o; } }
  for (const [f, k] of [['time', 'times'], ['place', 'places'], ['manner', 'manners']]) if (sp[f]) { const id = ensure(k, sp[f], sp[f + '_ja']); if (id) c[f] = id; }
  c.tense = TENSES.includes(sp.tense) ? sp.tense : 'pres';
  return c;
}
// AIなしの型どおりの文(登録画面の「ゲームではこう使われます」と同じ作り)
export function autoClause(kind, id, item) {
  const mk = o => Object.assign(newClause(), o);
  if (kind === 'verbs') { const v = LEX.verbs.find(x => x.id === id), tr = v && v.fr !== 'intr', tags = (v && v.t) || [], hang = /\b(to|of|with|for|on|at|in|about|from|into)$/.test(String(v && v.en || '').trim()), idm = v && (v.cls === 'phrase' && v.tail && !/\b(to|of|with|for|on|at|in|about|from|into)$/.test(String(v.tail).trim())), ob = tr && !idm ? (LEX.things.find(t => tags.some(g => (t.t || []).includes(g))) || (hang ? LEX.things[0] : null)) : null; return mk({ subj: 'p:i', pred: { k: 'v', id }, useObj: !!ob, obj: ob ? 't:' + ob.id : null, tense: 'past', time: 'yesterday' }); }
  if (kind === 'things') return mk({ subj: 'p:i', pred: { k: 'v', id: 'like' }, useObj: true, obj: 't:' + id });
  if (kind === 'people') return mk({ subj: 'p:' + id, pred: { k: 's', id: 'happy' } });
  if (kind === 'states') return mk({ subj: 'p:he', pred: { k: 's', id }, tense: 'past' });
  if (kind === 'places') return mk({ subj: 'p:we', pred: { k: 'v', id: 'eat' }, place: id });
  if (kind === 'times') return mk({ subj: 'p:i', pred: { k: 'v', id: 'walk' }, time: id });
  if (kind === 'manners') return mk({ subj: 'p:she', pred: { k: 'v', id: 'run' }, manner: id });
  if (kind === 'leads') return mk({ lead: id, subj: 'p:i', pred: { k: 'v', id: 'walk' }, tense: 'past' });
  return null;
}
// clause を実際に組み立てて、英語・日本語を確かめる(組めなければ null)
export function render1(c) { try { const en = sentenceText({ main: c }), ja = sentenceJa({ main: c }); return en && /[a-z]/i.test(en) ? { en, ja } : null; } catch (e) { return null; } }
const SPEC_SYS = 'You convert an English example sentence into the slots of a word-order learning game for Japanese learners. Output ONE JSON object. Keep the target expression exactly. Rewrite the sentence so that it is ONE simple clause with at most: a subject, the verb phrase, one object, and optional time / place / manner chunks. Subject pronouns: I, you, he, she, we, they. Object pronouns: me, you, him, her, us, them, it. Everything else is a noun phrase with its article (e.g. "a great idea", "my friend").';
const SPEC_FMT = '{"subject":"","subject_kind":"people|things","subject_ja":"","verb":"verb phrase in base form, with particles/prepositions","verb_ja":"short Japanese in dictionary form","verb_fr":"intr|tr","past":"","pp":"","object":"","object_kind":"people|things","object_ja":"","time":"","time_ja":"","place":"","place_ja":"","manner":"","manner_ja":"","tense":"pres|past|fut|prog"}';
// 表現 q(+種類 kind)から、遊べる文を1つ作る。AIがあれば、その言葉にふさわしい文をAIが考えて枠に分ける。なければ型どおり
export async function makePlay(q, kind, onlyAi) {
  let c = null, r = null;
  if (aiReady() && (q.ex || kind || onlyAi)) {
    try {
      const sentence = !!onlyAi;
      const sp = await askJ(SPEC_SYS, `${sentence ? 'Sentence to convert' : 'Target expression'}: "${q.en}"${q.ex && !sentence ? `\nExample sentence (you may reuse it): "${q.ex}"` : ''}${q.exja ? `\nJapanese: "${q.exja}"` : ''}${!sentence && !q.ex ? '\nMake a natural, useful example sentence that uses the target expression.' : ''}\nReturn: ${SPEC_FMT}`, 700);
      c = clauseFromSpec(sp); r = c && render1(c);
      // 単語・名詞・場所などは、組み上がった文にその言葉が入っているかを確かめる(動詞は活用で形が変わるので確かめない)
      if (r && !onlyAi && kind && kind !== 'verbs' && !norm(r.en).includes(norm(q.en).replace(/^(a|an|the) /, ''))) r = null;
    } catch (e) { console.error(e); }
  }
  if (!r && !onlyAi) { try { const k = kind || 'verbs', id = ensure(k, q.en, q.ja, q.ai && q.ai.kind === 'verbs' ? { fr: q.ai.fr, past: q.ai.past, pp: q.ai.pp } : null, q.cls); c = id ? autoClause(k, id) : null; r = c && render1(c); } catch (e) { console.error(e); r = null; } }
  if (!r) return null;
  return { expr: q.en, en: r.en, ja: r.ja, clause: JSON.parse(JSON.stringify(c)) };
}
export function savePlay(p) { const set = mySet(); set.plays = (set.plays || []).filter(x => norm(x.expr) !== norm(p.expr)); set.plays.unshift(p); set.plays.length = Math.min(set.plays.length, 60); save(); }
export function allPlays() { return DB.sets.flatMap(s => s.plays || []); }
// ▶:組み立て済みの文を「つくる」に読み込む
export function loadPlay(p) {
  document.querySelectorAll('.eg-inbox,.eg-plays,.eg-try').forEach(e => e.remove());
  APP.S = { main: JSON.parse(JSON.stringify(p.clause)) }; APP.active = 'main'; APP.lsub = null; APP.pass = {}; APP.open = null; APP.finished = true; APP.hist = [];
  try { normalize(); } catch (e) { console.error(e); }
  go('make');
}
// ===== 文の記憶(その人の端末だけ):いまの文を覚えておいて、いつでも引き出す =====
export function saveMemo() {
  const m = APP.S && APP.S.main, r = m && m.pred ? render1(m) : null; if (!r) { toast('まず、文を作ってね'); return false; }
  DB.memo = DB.memo || []; DB.memo = DB.memo.filter(x => norm(x.en) !== norm(r.en)); DB.memo.unshift({ id: 'm' + Date.now().toString(36), en: r.en, ja: r.ja, clause: JSON.parse(JSON.stringify(m)), at: Date.now() });
  DB.memo.length = Math.min(DB.memo.length, 200); save(); toast('💾 この文を記憶しました'); return true;
}
// 記憶した文・表現の文の一覧(▶で「つくる」に、×で消す)
export function showPlays() {
  const root = ENV.root; if (!root) return; root.querySelector('.eg-plays')?.remove();
  const draw = () => {
    const memo = DB.memo || [], pl = allPlays(); root.querySelector('.eg-plays')?.remove();
    const row = (p, src, i) => `<div style="display:flex;gap:6px;margin-bottom:6px"><button data-l="${src}${i}" style="flex:1;text-align:left;border:0;border-radius:12px;background:#f4f1fb;padding:9px 12px;font:inherit"><b style="font-size:14px">▶ ${esc(p.en)}</b><br><small style="color:#8d7f9e">${esc(p.ja || '')}${p.expr && p.expr !== p.en ? '　(' + esc(p.expr) + ')' : ''}</small></button><button data-d="${src}${i}" aria-label="消す" style="border:0;background:none;font:inherit;color:#b06;padding:0 6px">×</button></div>`;
    const el = document.createElement('div'); el.className = 'eg-plays';
    el.style.cssText = 'position:absolute;inset:0;z-index:50;background:#0006;display:flex;align-items:center;justify-content:center;padding:16px';
    el.innerHTML = `<div style="background:#fff;border-radius:18px;padding:14px;max-width:380px;width:100%;max-height:82vh;display:flex;flex-direction:column;color:#3b3552;font-weight:700"><div style="font-size:16px;font-weight:900;text-align:center">📚 記憶した文</div><div style="overflow:auto;margin:10px 0">
      <div style="font-size:12px;color:#8d7f9e;margin:4px 0">💾 自分で記憶した文</div>${memo.length ? memo.map((p, i) => row(p, 'm', i)).join('') : '<div style="font-size:12px;color:#8d7f9e;margin-bottom:6px">まだありません。文を作ったら、上の「💾 記憶」を押してね。</div>'}
      <div style="font-size:12px;color:#8d7f9e;margin:10px 0 4px">✨ 使ってみる・もらった表現の文</div>${pl.length ? pl.map((p, i) => row(p, 'p', i)).join('') : '<div style="font-size:12px;color:#8d7f9e">まだありません。</div>'}</div><button data-x style="border:0;background:none;font:inherit;font-size:13px;color:#8d7f9e;padding:6px">とじる</button></div>`;
    el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { const k = b.dataset.l; loadPlay((k[0] === 'm' ? memo : pl)[+k.slice(1)]); });
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const k = b.dataset.d, i = +k.slice(1); if (k[0] === 'm') DB.memo.splice(i, 1); else { const p = pl[i]; DB.sets.forEach(s => { s.plays = (s.plays || []).filter(x => x !== p && x.en !== p.en); }); } save(); draw(); });
    el.querySelector('[data-x]').onclick = () => el.remove(); (root.closest('.cs-mount') || root).appendChild(el);
  };
  draw();
}
// ===== 「使ってみる」:どんな単語・熟語・チャンク・文でも、入力したものにふさわしい文をAIが考えて、つくる画面に入れる =====
const guessCls = en => { const e = String(en || '').trim(), n = e.split(/\s+/).filter(Boolean).length; return /[.?!]$/.test(e) && n >= 3 || n >= 7 ? 'sentence' : n >= 2 ? 'phrase' : 'word'; };
export async function runTry({ en, ja, cls, kind, x }, say) {
  en = String(en || '').trim().replace(/\s+/g, ' '); ja = String(ja || '').trim(); if (!/[a-z]/i.test(en)) { toast('英語を入れてね'); return null; }
  cls = cls || guessCls(en); say = say || (() => { });
  if (cls === 'sentence') {   // 文:そのまま文として覚え、AIで枠に分けて組み立てる
    if (!aiReady()) { toast('文を組み立てるには、AIのキーが必要です(設定で入れられます)'); return null; }
    say('AIが、文を枠に分けています…');
    const set = mySet(); set.sentences = set.sentences || []; if (!set.sentences.some(t => norm(t.en) === norm(en))) set.sentences.push({ en, ja });
    const p = await makePlay({ en, ex: en, exja: ja, ja }, 'verbs', true); if (!p) { toast('この文は、うまく組み立てられませんでした(もう少し短い文だと組めます)'); return null; }
    savePlay(p); save(); return p;
  }
  // 単語・熟語・チャンク:種類(する/もの/どこ…)を決めて、マイセットに入れる(入っていれば使う)
  say(aiReady() ? 'AIが、ふさわしい文を考えています…' : '文を組み立てています…');
  let k = kind && PACK_KINDS.includes(kind) ? kind : null, ax = null;
  if (!k && aiReady()) { try { const a = parseAi(JSON.stringify(await askJ('You are a careful JSON-only API.', aiPrompt({ en, ja }), 500))); if (a) { k = a.kind; ax = a; } } catch (e) { console.error(e); } }
  k = k || judge(en, ja) || (cls === 'phrase' ? 'verbs' : 'things'); if (k === 'sentence') k = 'verbs';
  const full = k === 'verbs' && ax && ax.en ? (ax.en + (ax.tail ? ' ' + ax.tail : '')).trim() : en;
  const id = ensure(k, full, (ax && ax.ja) || ja, Object.assign({}, ax ? { fr: ax.fr, past: ax.past, pp: ax.pp, t: ax.t, pl: ax.pl, animal: ax.animal } : {}, x || {}), cls);
  if (!id) { toast('登録できませんでした'); return null; }
  const p = await makePlay({ en, ja: (ax && ax.ja) || ja, cls, ai: ax }, k); if (!p) { toast('文を組み立てられませんでした'); return null; }
  savePlay(p); save(); return p;
}
// 入力して「使ってみる」を押すだけの画面(単体で使える)
export function openTry(pre) {
  const root = ENV.root; if (!root) return; root.querySelector('.eg-try')?.remove();
  const el = document.createElement('div'); el.className = 'eg-try'; let cls = pre && pre.cls || '';
  el.style.cssText = 'position:absolute;inset:0;z-index:50;background:#0006;display:flex;align-items:center;justify-content:center;padding:16px';
  const seg = (v, l) => `<button data-c="${v}" style="flex:1;border:0;border-radius:999px;padding:7px 4px;font:inherit;font-size:12px;background:${cls === v ? '#ffd36b' : '#f4f1fb'}">${l}</button>`;
  const draw = () => {
    const en0 = el.querySelector('[data-en]'), ja0 = el.querySelector('[data-ja]'), enV = en0 ? en0.value : (pre && pre.en) || '', jaV = ja0 ? ja0.value : (pre && pre.ja) || '';
    el.innerHTML = `<div style="background:#fff;border-radius:18px;padding:16px;max-width:380px;width:100%;color:#3b3552;font-weight:700"><div style="font-size:16px;font-weight:900;text-align:center">✨ 使ってみる</div>
      <div style="font-size:12px;color:#8d7f9e;margin:6px 0 8px;text-align:center">単語・熟語・チャンク・文を入れると、AIが ふさわしい文を考えて「つくる」に入れます</div>
      <input data-en value="${esc(enV)}" placeholder="英語(例:hang out / at the station / apple)" autocomplete="off" autocapitalize="off" style="width:100%;box-sizing:border-box;border:2px solid #e3dcf3;border-radius:12px;padding:10px;font:inherit;margin-bottom:6px">
      <input data-ja value="${esc(jaV)}" placeholder="日本語の意味(なくてもOK)" autocomplete="off" style="width:100%;box-sizing:border-box;border:2px solid #e3dcf3;border-radius:12px;padding:10px;font:inherit;margin-bottom:8px">
      <div style="display:flex;gap:4px;margin-bottom:10px">${seg('', 'おまかせ')}${seg('word', '単語')}${seg('phrase', '熟語・慣用句')}${seg('sentence', '文章')}</div>
      <button data-go style="width:100%;border:0;border-radius:999px;padding:12px;background:linear-gradient(160deg,#ffd0dc,#ffb3c1);color:#fff;font:inherit;font-size:15px">✨ 文を作って「つくる」へ</button>
      <div data-msg style="min-height:18px;font-size:12px;color:#8d7f9e;text-align:center;margin-top:6px"></div>
      <button data-x style="width:100%;border:0;background:none;font:inherit;font-size:12px;color:#8d7f9e;padding:6px">とじる</button></div>`;
    el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { cls = b.dataset.c; draw(); });
    el.querySelector('[data-x]').onclick = () => el.remove();
    el.querySelector('[data-go]').onclick = async () => {
      const msg = el.querySelector('[data-msg]'), btn = el.querySelector('[data-go]'); btn.disabled = true;
      try { const p = await runTry({ en: el.querySelector('[data-en]').value, ja: el.querySelector('[data-ja]').value, cls: cls || undefined }, t => { msg.textContent = t; }); if (p) { el.remove(); loadPlay(p); return; } } catch (e) { console.error(e); msg.textContent = String(e && e.message || e).slice(0, 80); }
      btn.disabled = false;
    };
  };
  (root.closest('.cs-mount') || root).appendChild(el); draw(); const f = el.querySelector('[data-en]'); if (f && !f.value) setTimeout(() => f.focus(), 50);
}
