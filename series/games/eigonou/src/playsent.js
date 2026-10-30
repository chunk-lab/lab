import { ENV } from './env.js';
import { LEX, newClause, sentenceJa, sentenceText } from './engine.js';
import { DB, REG, autoExtra, makeItem, refreshLex, save } from './common.js';
import { mySet } from './addword.js';
import { APP, go, normalize } from './play.js';
// ================= 完成した文を、組み立て済みの状態で用意する =================
// 英語脳は、文を「誰が・どうする・何を・いつ・どこ・どんなふうに」の枠に1つずつ入れて作る。
// 登録した表現を使った文を、枠ぜんぶ埋めた状態(clause)で持っておき、▶ を押すと「つくる」にそのまま読み込む。
//   AIがあれば:例文を枠に分けてもらい(足りない部品は登録)、エンジンで組み立てる。AIがなければ:エンジンの型どおりに自動で組む。
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const fullOf = x => norm((x.en || '') + ' ' + (x.tail || '') + ' ' + (x.prep || ''));
const SUBJ = { i: 'i', you: 'you', he: 'he', she: 'she', we: 'we', they: 'they' }, OBJ = { me: 'i', him: 'he', her: 'she', us: 'we', them: 'they', you: 'you' };
const NOUNK = ['people', 'things'];
function findId(kind, full) { const k = norm(full), noArt = k.replace(/^(a|an|the) /, ''); const x = (LEX[kind] || []).find(y => fullOf(y) === k || fullOf(y) === noArt); return x ? x.id : null; }
// 言葉を探し、なければ登録して(マイセットへ)、idを返す
function ensure(kind, full, ja, x) {
  let id = findId(kind, full); if (id) return id;
  const bak = { en: REG.en, ja: REG.ja, e: REG.e, x: REG.x };
  try {
    REG.en = full; REG.ja = ja || ''; REG.e = ''; REG.x = Object.assign({}, autoExtra(kind, full, ja || ''), x || {});
    const it = makeItem(kind); if (!it || !it.en) return null;
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
  if (kind === 'verbs') { const v = LEX.verbs.find(x => x.id === id), tr = v && v.fr !== 'intr', tags = (v && v.t) || [], ob = tr ? (LEX.things.find(t => tags.some(g => (t.t || []).includes(g))) || LEX.things[0]) : null; return mk({ subj: 'p:i', pred: { k: 'v', id }, useObj: !!ob, obj: ob ? 't:' + ob.id : null, tense: 'past', time: 'yesterday' }); }
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
// 表現 q(+登録済みの種類 kind)から、遊べる文を1つ作る
export async function makePlay(q, kind, onlyAi) {
  const ai = ENV.core && ENV.core.ai; let c = null, r = null;
  if (ai && ai.ready && q.ex && (kind === 'verbs' || !kind)) {
    try { const sp = await ai.askJSON(SPEC_SYS, `Target expression: "${q.en}"\nExample sentence: "${q.ex}"${q.exja ? `\nJapanese: "${q.exja}"` : ''}\nReturn: ${SPEC_FMT}`, 700); c = clauseFromSpec(sp); r = c && render1(c); } catch (e) { console.error(e); }
  }
  if (!r && !onlyAi) { try { const id = ensure(kind || 'verbs', q.en, q.ja, q.ai && q.ai.kind === 'verbs' ? { fr: q.ai.fr, past: q.ai.past, pp: q.ai.pp } : null); c = id ? autoClause(kind || 'verbs', id) : null; r = c && render1(c); } catch (e) { console.error(e); r = null; } }
  if (!r) return null;
  return { expr: q.en, en: r.en, ja: r.ja, clause: JSON.parse(JSON.stringify(c)) };
}
export function savePlay(p) { const set = mySet(); set.plays = (set.plays || []).filter(x => norm(x.expr) !== norm(p.expr)); set.plays.unshift(p); set.plays.length = Math.min(set.plays.length, 60); save(); }
export function allPlays() { return DB.sets.flatMap(s => s.plays || []); }
// ▶:組み立て済みの文を「つくる」に読み込む
export function loadPlay(p) {
  document.querySelectorAll('.eg-inbox,.eg-plays').forEach(e => e.remove());
  APP.S = { main: JSON.parse(JSON.stringify(p.clause)) }; APP.active = 'main'; APP.lsub = null; APP.pass = {}; APP.open = null; APP.finished = true; APP.hist = [];
  try { normalize(); } catch (e) { console.error(e); }
  go('make');
}
// 保存してある「表現の文」の一覧
export function showPlays() {
  const root = ENV.root; if (!root) return; root.querySelector('.eg-plays')?.remove();
  const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])), L = allPlays();
  const el = document.createElement('div'); el.className = 'eg-plays';
  el.style.cssText = 'position:absolute;inset:0;z-index:50;background:#0006;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = `<div style="background:#fff;border-radius:18px;padding:14px;max-width:380px;width:100%;max-height:80vh;display:flex;flex-direction:column;color:#3b3552;font-weight:700"><div style="font-size:16px;font-weight:900;text-align:center">📚 表現の文</div><div style="overflow:auto;margin:10px 0">${L.length ? L.map((p, i) => `<button data-i="${i}" style="display:block;width:100%;text-align:left;border:0;border-radius:12px;background:#f4f1fb;padding:9px 12px;margin-bottom:6px;font:inherit"><b style="font-size:14px">▶ ${esc(p.en)}</b><br><small style="color:#8d7f9e">${esc(p.ja || '')}　(${esc(p.expr)})</small></button>`).join('') : '<div style="text-align:center;color:#8d7f9e;font-size:13px">まだありません。勉強ノートやゴルフ・フリスビーでもらった表現が、ここに入ります。</div>'}</div><button data-x style="border:0;background:none;font:inherit;font-size:13px;color:#8d7f9e;padding:6px">とじる</button></div>`;
  el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => loadPlay(L[+b.dataset.i])); el.querySelector('[data-x]').onclick = () => el.remove();
  (root.closest('.cs-mount') || root).appendChild(el);
}
