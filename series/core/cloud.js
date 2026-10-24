/* 共有の教材（サーバー側のしくみ）。いまは端末の中で同じ流れを再現するだけ（同じ端末の中でしか共有されない）。
   Supabase につなぐときは、この中の保存先(st)をサーバーに置きかえる。画面側（図書館・運営画面）はこのまま使える。
   流れ（設計書「共有の教材の流れ」）：
     1. 共有する(有料会員・自分で書いた文章だけ)。運営が課題図書などに使ってよい許可つき。作者は自由に取り下げられない
     2. 新着(投票期間 VOTE_DAYS 日)：無料会員も中身を見て「使いたい」に投票できる(遊べない)
     3. 共有の棚：投票の上位か、運営が選んだものだけ。課題図書もここから選べる。選ばれた作者にはお礼(ダイヤ)
     4. 見直し：使われていない・満足度が低い(評価 RATE_MIN 票以上で「よかった」が半分未満)ものは棚から外す(作者と枠に入れている人の分は残る)
     権利侵害の通報 → 運営が全員から消す */
import { createStore } from './store.js';
export const CLOUD_RULES = { VOTE_DAYS: 14, SHELF_TOP: 5, RATE_MIN: 20, VOTES_PER_WEEK: 5, IDLE_DAYS: 90, THANKS_GEMS: 10 };
const DAY = 864e5;
export function createCloud(member) {
  const st = createStore('cloud'), subs = new Set();
  const D = Object.assign({ items: [], votes: {}, rated: {}, reports: [] }, st.get('db') || {});
  const save = () => { st.set('db', D); subs.forEach(f => { try { f(); } catch (e) { } }); };
  const find = id => D.items.find(x => x.id === id);
  const pub = x => x && ({ id: x.id, title: x.title, author: x.author, level: x.level, kind: x.kind, state: x.state, at: x.at, votes: x.votes, good: x.good, bad: x.bad, uses: x.uses, lastUse: x.lastUse, story: x.story, pick: !!x.pick, note: x.note || '' });
  const weekKey = () => member.keys.weekKey();
  // 投票期間が終わったものを自動で進める（上位 SHELF_TOP は棚へ、ほかは「見送り」）
  function settle() {
    const now = Date.now(), due = D.items.filter(x => x.state === 'new' && now - x.at > CLOUD_RULES.VOTE_DAYS * DAY);
    if (!due.length) return;
    due.sort((a, b) => b.votes - a.votes).forEach((x, i) => { x.state = i < CLOUD_RULES.SHELF_TOP && x.votes > 0 ? 'shelf' : 'passed'; x.decided = now; });
    save();
  }
  return {
    RULES: CLOUD_RULES,
    // ---- 利用者 ----
    share({ title, story, level, author, kind = 'long' }) {
      if (!member.isPaid()) return { ok: false, why: 'paid' };
      if (!title || !story || !(story.list || []).length) return { ok: false, why: 'empty' };
      const x = { id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: String(title).slice(0, 60), story, level: level || 0, author: author || 'だれか', kind, state: 'new', at: Date.now(), votes: 0, good: 0, bad: 0, uses: 0, lastUse: 0 };
      D.items.unshift(x); save(); return { ok: true, id: x.id };
    },
    listNew() { settle(); return D.items.filter(x => x.state === 'new').map(pub); },
    listShelf() { settle(); return D.items.filter(x => x.state === 'shelf').map(pub); },
    get: id => pub(find(id)),
    votesLeft() { const k = weekKey(); return CLOUD_RULES.VOTES_PER_WEEK - Object.values(D.votes).filter(v => v === k).length; },
    voted: id => !!D.votes[id],
    vote(id) { const x = find(id); if (!x || x.state !== 'new' || D.votes[id]) return false; if (this.votesLeft() <= 0) return false; D.votes[id] = weekKey(); x.votes++; save(); return true; },
    used(id) { const x = find(id); if (!x) return; x.uses++; x.lastUse = Date.now(); save(); },
    canRate: id => !D.rated[id],
    rate(id, good) { const x = find(id); if (!x || D.rated[id]) return false; D.rated[id] = 1; good ? x.good++ : x.bad++; save(); return true; },
    report(id, why) { D.reports.push({ id, why: String(why || '').slice(0, 200), at: Date.now() }); save(); },
    // ---- 運営 ----
    all() { settle(); return D.items.map(pub); },
    reports: () => D.reports.slice(),
    setState(id, state, note) { const x = find(id); if (!x) return; if (state === 'shelf' && !x.pick) { x.pick = true; } x.state = state; x.note = note || x.note || ''; x.decided = Date.now(); save(); },
    remove(id) { D.items = D.items.filter(x => x.id !== id); D.reports = D.reports.filter(r => r.id !== id); save(); },   // 権利侵害など：全員から消す
    // 見直しの候補：棚にあって、使われていない or 満足度が低い
    reviewList() {
      const now = Date.now();
      return D.items.filter(x => x.state === 'shelf').map(x => {
        const rated = x.good + x.bad, low = rated >= CLOUD_RULES.RATE_MIN && x.good / rated < 0.5, idle = now - Math.max(x.lastUse, x.decided || x.at) > CLOUD_RULES.IDLE_DAYS * DAY;
        return low || idle ? { ...pub(x), why: low ? `満足度が低い(よかった ${x.good}/${rated})` : `${CLOUD_RULES.IDLE_DAYS}日使われていない` } : null;
      }).filter(Boolean);
    },
    onChange(f) { subs.add(f); return () => subs.delete(f); },
  };
}
