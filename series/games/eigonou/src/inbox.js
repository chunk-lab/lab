import { ENV } from './env.js';
import { DB, REG, autoExtra, judge, makeItem, refreshLex, save, splitSentence, toast } from './common.js';
import { LEX } from './engine.js';
import { PACK_KINDS } from './pack.js';
import { aiPrompt, mySet, parseAi } from './addword.js';
import { loadPlay, makePlay, savePlay } from './playsent.js';
// ================= 外から登録(受け渡し箱 core.eigo → マイことば) =================
// 勉強ノート・スポーツの表現など、ほかのアプリが core.eigo.send([{en, ja}]) で送っておいたものを、開いたときに登録する。
// 1語・熟語・句動詞・慣用句は、1つの「ことば」として自動判定(AIのキーがあれば、AIで種類・活用まで上手に仕分ける)。
// 文は、そのまま「文」として入れ、AIのキーがあれば、まとまりに分けて、それぞれの言葉も登録する。
const KINDS = () => PACK_KINDS || ['leads', 'people', 'things', 'verbs', 'states', 'times', 'places', 'manners'];
const have = (kind, en, tail) => { const key = (en + (tail ? ' ' + tail : '')).toLowerCase().trim(); return DB.sets.some(s => (s.items || []).some(it => (it.en + (it.tail ? ' ' + it.tail : '')).toLowerCase().trim() === key)) || !!(LEX && LEX[kind] && LEX[kind].some(v => (v.en + (v.tail ? ' ' + v.tail : '')).toLowerCase().trim() === key && !v.custom)); };
async function aiOne(q) {   // 使っている人のAIで、種類・活用などを決める(失敗したら null で、ふつうの自動判定にもどる)
  const ai = ENV.core && ENV.core.ai; if (!ai || !ai.ready) return null;
  try { const t = await ai.ask('You are a careful JSON-only API.', aiPrompt({ en: q.en, ja: q.ja, ex: q.ex }), 500); return parseAi(t); } catch (e) { return null; }
}
function addItem(kind, en, ja, x) {   // REG を一時的に借りて、ふだんの「ことば登録」と同じ形のことばを作る
  const bak = { en: REG.en, ja: REG.ja, e: REG.e, x: REG.x };
  try {
    REG.en = en; REG.ja = ja; REG.e = ''; REG.x = Object.assign({}, autoExtra(kind, en, ja), x || {});
    const it = makeItem(kind); if (!it || !it.en) return false;
    if (have(kind, it.en, it.tail)) return true;   // もう入っている(二重には入れない。「入っている」扱いで、文の用意には進む)
    // 元からゲームに入っている言葉は、二重に入れない(「入っている」扱い)
    { const key = (it.en + ' ' + (it.tail || '')).trim().toLowerCase(); if ((LEX[kind] || []).some(x => !x.custom && (x.en + ' ' + (x.tail || '') + ' ' + (x.prep || '')).trim().replace(/\s+/g, ' ').toLowerCase() === key.replace(/\s+/g, ' '))) return true; }
    mySet().items.push(it); return true;
  } finally { Object.assign(REG, bak); }
}
// 文の登録:文そのものを保存し、AIがあれば「まとまり」に分けて、まとまりごとの種類・意味・活用まで決めて、ぜんぶ自動で言葉として登録する
//   (人が1つずつ意味を入れる必要はない。ふだんの「ことば登録」と同じ形のことばになる)
async function addSentence(q) {
  const set = mySet(); set.sentences = set.sentences || [];
  if (!set.sentences.some(s => s.en.toLowerCase() === q.en.toLowerCase())) set.sentences.push({ en: q.en, ja: q.ja || '' });
  let n = 0; const ai = ENV.core && ENV.core.ai;
  if (ai && ai.ready) {
    try {
      const r = await ai.askJSON('You split an English sentence into word-order chunks for an English-word-order learning game for Japanese speakers. Chunks in sentence order, 3-6 of them, no duplicates, nothing left out except the subject pronoun. Return a JSON array. Each element: {"kind":"leads|people|things|verbs|states|times|places|manners","en":"(verbs: base form, first word only; others: the chunk as written)","tail":"(verbs only) the rest after the first word, or empty","ja":"short Japanese meaning","past":"(verbs) past form","pp":"(verbs) past participle","fr":"(verbs) intr | tr | both","t":["(verbs/things) up to 3 of: food, drink, read, write, watch, sport, instr, game, music, lang, ride, thing, person, animal, any"],"pl":0,"animal":0,"e":"one emoji"}',
        `Sentence: "${q.en}"${q.ja ? `\nJapanese: "${q.ja}"` : ''}`, 1500);
      for (const c of Array.isArray(r) ? r : []) {
        if (!c || !c.en || !c.ja || !KINDS().includes(c.kind)) continue;
        const full = c.kind === 'verbs' ? (String(c.en) + (c.tail ? ' ' + c.tail : '')).trim() : String(c.en);
        if (c.kind === 'people' && /^(i|you|he|she|it|we|they)$/i.test(full)) continue;   // 代名詞は最初から入っている
        const x = { ...c }; if (c.kind !== 'verbs') delete x.en;
        if (addItem(c.kind, full, String(c.ja), x)) n++;
      }
    } catch (e) { console.error(e); }
  }
  return n;
}
async function addPhrase(q) {
  const ai = (q.ai && q.ai.kind ? q.ai : null) || await aiOne(q), kind = (ai && KINDS().includes(ai.kind) && ai.kind) || (q.kind && KINDS().includes(q.kind) && q.kind) || judge(q.en, q.ja) || (q.en.split(' ').length > 1 ? 'verbs' : 'things');
  const x = ai ? { ...ai, en: kind === 'verbs' ? ai.en : undefined } : null; if (x && x.en === undefined) delete x.en;
  return addItem(kind, q.en, (ai && ai.ja) || q.ja || '', x) ? kind : false;
}
// 開いたときに1回:箱の中身を登録して、知らせる
// 登録したあとに、何が入ったかを見せて、すぐ「つくる」「れんしゅう」へ行けるようにする
function showDone(got, gotS, chunks, plays) {
  const root = ENV.root; if (!root) return toast('📥 マイことばに入れたよ');
  root.querySelector('.eg-inbox')?.remove();
  const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const el = document.createElement('div'); el.className = 'eg-inbox';
  el.style.cssText = 'position:absolute;inset:0;z-index:50;background:#0006;display:flex;align-items:center;justify-content:center;padding:16px';
  el.innerHTML = `<div style="background:#fff;border-radius:18px;padding:16px;max-width:360px;width:100%;box-shadow:0 8px 28px #0005;text-align:center;color:#3b3552;font-weight:700">
    <div style="font-size:16px;font-weight:900">📥 マイことばに入れたよ</div>
    <div style="margin:10px 0;font-size:14px;text-align:left;max-height:34vh;overflow:auto">${got.map(x => `<div>✅ <b>${esc(x.en)}</b> <small style="color:#8d7f9e">${esc(x.ja || '')}</small></div>`).join('')}${gotS.map(x => `<div>✅ 📝 ${esc(x.en)}</div>`).join('')}${chunks ? `<small style="color:#8d7f9e">文のまとまり +${chunks}</small>` : ''}</div>
    ${(plays || []).map((p, i) => `<button data-p="${i}" style="display:block;width:100%;text-align:left;border:0;border-radius:12px;background:#eaf6ee;padding:9px 12px;margin-bottom:6px;font:inherit;font-weight:700;color:#3b3552"><b>▶ ${esc(p.en)}</b><br><small style="color:#8d7f9e">${esc(p.ja || '')}</small></button>`).join('')}
    <button data-g="make" style="width:100%;border:0;border-radius:999px;padding:12px;background:linear-gradient(160deg,#ffd0dc,#ffb3c1);color:#fff;font:inherit;font-size:15px">🎨 この表現で文をつくる</button>
    <button data-g="prac" style="width:100%;border:0;border-radius:999px;padding:10px;margin-top:8px;background:#d6f0ff;font:inherit;font-size:14px">🎯 れんしゅうする</button>
    <button data-g="" style="width:100%;border:0;background:none;margin-top:6px;padding:8px;font:inherit;font-size:12px;color:#8d7f9e">あとで</button></div>`;
  el.querySelectorAll('button').forEach(b => b.onclick = () => { el.remove(); const v = b.dataset.g; if (v) root.querySelector(`.nav [data-v="${v}"]`)?.click(); });
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => loadPlay(plays[+b.dataset.p]));
  (root.closest('.cs-mount') || root).appendChild(el);
}
export async function drainInbox() {
  const box = ENV.core && ENV.core.eigo; if (!box || !box.count()) return;
  const list = box.take(), aiOk = !!(ENV.core.ai && ENV.core.ai.ready), left = []; let n = 0, chunks = 0, firstEn = ''; const got = [], gotS = [], plays = []; let wantPlay = false;
  for (const q of list) {
    try {
      const isSen = q.kind === 'sentence' || judge(q.en, q.ja) === 'sentence';
      if (isSen) { chunks += await addSentence(q); n++; gotS.push(q); if (aiOk) { const p = await makePlay({ en: q.en, ex: q.en, exja: q.ja, ja: q.ja }, 'verbs', true); if (p) plays.push(p); } }
      else if (!q.ja && !aiOk) { left.push(q); continue; }   // 日本語の意味がなく、AIもないなら、まだ登録できない(箱にもどす)
      else { const k = await addPhrase(q); if (k) { n++; got.push(q); const p = await makePlay(q, k); if (p) { p.expr = q.en; plays.push(p); if (q.play) wantPlay = true; } } else if (!q.ex) continue; }
      if (q.ex && /[a-z]/i.test(q.ex)) { const set = mySet(); set.sentences = set.sentences || []; if (!set.sentences.some(s => s.en.toLowerCase() === String(q.ex).toLowerCase())) { set.sentences.push({ en: String(q.ex), ja: q.exja || '' }); gotS.push({ en: q.ex }); } }
      if (!firstEn) firstEn = q.en;
    } catch (e) { console.error('inbox', q.en, e); left.push(q); }
  }
  if (left.length) box.send(left);
  plays.forEach(savePlay); save(); refreshLex();
  if (wantPlay && plays.length) { toast('▶ ' + plays[0].en); loadPlay(plays[0]); return; }
  if (n) showDone(got, gotS, chunks, plays);
  else if (left.length) toast('📥 日本語の意味がないので、まだ登録できません(AIのキーを入れるか、意味を足してね)');
}
