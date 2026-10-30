import { ENV } from './env.js';
import { DB, REG, autoExtra, judge, makeItem, refreshLex, save, splitSentence, toast } from './common.js';
import { LEX } from './engine.js';
import { PACK_KINDS } from './pack.js';
import { aiPrompt, mySet, parseAi } from './addword.js';
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
    if (have(kind, it.en, it.tail)) return false;
    mySet().items.push(it); return true;
  } finally { Object.assign(REG, bak); }
}
async function addSentence(q) {
  const set = mySet(); set.sentences = set.sentences || [];
  if (!set.sentences.some(s => s.en.toLowerCase() === q.en.toLowerCase())) set.sentences.push({ en: q.en, ja: q.ja || '' });
  let n = 0; const ai = ENV.core && ENV.core.ai;
  if (ai && ai.ready) {   // AIがあれば、まとまりに分けて、それぞれの言葉も登録
    try {
      const r = await ai.askJSON('You split an English sentence into word-order chunks for a Japanese learner. Return a JSON array: [{"en":"chunk (verbs: base form + tail)","ja":"short Japanese meaning","kind":"leads|people|things|verbs|states|times|places|manners"}]. 3-6 chunks, no duplicates.', `Sentence: "${q.en}"${q.ja ? `\nJapanese: ${q.ja}` : ''}`, 700);
      for (const c of Array.isArray(r) ? r : []) { if (!c || !c.en || !c.ja || !KINDS().includes(c.kind)) continue; if (addItem(c.kind, String(c.en), String(c.ja), null)) n++; }
    } catch (e) { }
  }
  return n;
}
async function addPhrase(q) {
  const ai = await aiOne(q), kind = (ai && KINDS().includes(ai.kind) && ai.kind) || (q.kind && KINDS().includes(q.kind) && q.kind) || judge(q.en, q.ja) || (q.en.split(' ').length > 1 ? 'verbs' : 'things');
  const x = ai ? { ...ai, en: kind === 'verbs' ? ai.en : undefined } : null; if (x && x.en === undefined) delete x.en;
  return addItem(kind, q.en, (ai && ai.ja) || q.ja || '', x);
}
// 開いたときに1回:箱の中身を登録して、知らせる
export async function drainInbox() {
  const box = ENV.core && ENV.core.eigo; if (!box || !box.count()) return;
  const list = box.take(), aiOk = !!(ENV.core.ai && ENV.core.ai.ready), left = []; let n = 0, chunks = 0, firstEn = '';
  for (const q of list) {
    try {
      const isSen = q.kind === 'sentence' || judge(q.en, q.ja) === 'sentence';
      if (isSen) { chunks += await addSentence(q); n++; }
      else if (!q.ja && !aiOk) { left.push(q); continue; }   // 日本語の意味がなく、AIもないなら、まだ登録できない(箱にもどす)
      else if (await addPhrase(q)) n++; else continue;
      if (!firstEn) firstEn = q.en;
    } catch (e) { left.push(q); }
  }
  if (left.length) box.send(left);
  save(); refreshLex();
  if (n) toast(`📥 「${firstEn}」${n > 1 ? `など ${n}こ` : ''}を、マイことばに入れたよ${chunks ? `(文のまとまり +${chunks})` : ''}`);
  else if (left.length) toast('📥 日本語の意味がないので、まだ登録できません(AIのキーを入れるか、意味を足してね)');
}
