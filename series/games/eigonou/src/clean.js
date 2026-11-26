// 登録済みのことばのデータを、1度だけきれいにする(日本語の語尾の「は・を」、過去形に入った前置詞)
import { DB, save } from './common.js';
export function cleanDB() {
  let ch = 0;
  (DB.sets || []).forEach(s => (s.items || []).forEach(it => {
    if ((it.kind === 'things' || it.kind === 'people') && typeof it.ja === 'string') { const j = it.ja.trim().replace(/[はがをにも]$/, ''); if (j && j !== it.ja) { it.ja = j; ch++; } }
    if (it.kind === 'verbs') for (const k of ['past', 'pp']) if (typeof it[k] === 'string' && /\s/.test(it[k].trim())) { it[k] = it[k].trim().split(/\s+/)[0]; ch++; }
  }));
  if (ch) save();
}
