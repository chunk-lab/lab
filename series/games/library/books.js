/* 本の一覧（図書館・今日なにする?・使ってみる・実力テストが使う）。
   ストリームの長文（ストリームでも、読む・解くでも開ける）・チャンクチャンクのお話・共有の棚・自分の本をまとめて「本」として扱う。 */
import { STORIES } from '../chunkchunk/src/data.js';
import { builtinStory } from '../chunkchunk/src/reading.js';
import { LIBRARY, weeklyBooks } from '../../data/library.js';
import { loadScript } from '../../core/host.js';
export const LV = { 1: '初級', 2: '中級', 3: '上級' };
let ready = null;
export function createBooks(core) {
  // ストリームの長文データ（g/stream/data.js・texts.js）を読み込む。ストリームが入っていないアプリでは何もしない
  const load = () => ready || (ready = Promise.all(['data.js', 'texts.js'].map(f => loadScript(core.base + 'g/stream/' + f))).catch(() => null));
  const passages = () => { try { return typeof PASSAGES !== 'undefined' ? PASSAGES : []; } catch (e) { return []; } };
  const texts = () => { try { return typeof LS_TEXTS !== 'undefined' ? LS_TEXTS : {}; } catch (e) { return {}; } };
  const words = s => (s.list || []).reduce((a, x) => a + String(Array.isArray(x) ? x[0] : '').replace(/[A-Z]:|=[^|]*|\|/g, ' ').split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length, 0);
  function all() {
    const out = [];
    for (const p of passages()) {
      const t = texts()[p.id];
      out.push({ id: 'st:' + p.id, title: p.title, ja: p.ja || '', lv: p.lv, tag: p.tag || '', src: 'stream', canStream: true, canRead: !!t, pid: p.id, story: () => t ? { title: t.title, list: t.list, level: t.level, questions: t.q || [] } : null });
    }
    for (const s of STORIES) out.push({ id: 'cc:' + s.title, title: s.title, ja: '', lv: s.lv, tag: 'お話', src: 'chunkchunk', canStream: false, canRead: true, story: () => builtinStory(s) });
    for (const x of (core.cloud ? core.cloud.listShelf() : [])) out.push({ id: 'sh:' + x.id, sid: x.id, title: x.title, ja: '', lv: x.level || 1, tag: '共有・' + x.author, src: 'shared', canStream: false, canRead: true, shared: true, story: () => x.story });
    return out.filter(b => !LIBRARY.hidden.includes(b.id));
  }
  const byId = id => all().find(b => b.id === id) || (id.startsWith('sh:') && core.cloud ? (x => x && { id, sid: x.id, title: x.title, lv: x.level || 1, tag: '共有', src: 'shared', canRead: true, shared: true, story: () => x.story })(core.cloud.get(id.slice(3))) : null);
  const weekly = () => weeklyBooks(core.member.keys.dayKey()).map(byId).filter(Boolean);
  const featured = () => LIBRARY.featured.map(byId).filter(Boolean);
  // 読む・解く（共通の読む画面）。終わったら記録へ。課題図書ならその日の「今日の課題」
  function read(b, { onClose } = {}) {
    const story = b.story(); if (!story) { core.ui.toast('この本は、まだ読む画面がありません'); return; }
    const t0 = Date.now(); let graded = null, ended = false;
    const fin = () => {
      const min = Math.round((Date.now() - t0) / 6e3) / 10; if (min < 0.5) return;
      core.events.report('library', 'done', { play: 'cc.read', book: b.id, title: b.title, min, words: words(story), score: graded && graded.n ? Math.round(graded.res.reduce((a, x) => a + ({ o: 1, t: .5, x: 0 })[x], 0) / graded.n * 100) : undefined, finished: !!graded || ended });
      if (b.shared && core.cloud) core.cloud.used(b.sid);
    };
    core.reader.open(story, { backLabel: '← 図書館へ', onClose: () => { fin(); onClose && onClose(); }, onGrade: r => { graded = r; return ''; }, onEnd: () => { ended = true; } });
  }
  return { load, all, byId, weekly, featured, read, words, LV };
}
