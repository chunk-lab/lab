/* 図書館の棚（運営が決めるもの）。ここを直して組み立て直すだけで、全アプリの図書館と「今日の課題」が変わる。
   本の id：
     ストリームの長文 … 'st:<長文のid>'（games/stream/data の PASSAGES。ストリームでも、読む・解くでも開ける）
     チャンクチャンクのお話 … 'cc:<題名>'（読む・解くで開ける）
     共有の棚の本 … 'sh:<共有のid>'（運営画面の「課題図書にする」で選ぶ）
   weekly：課題図書。from（その週の月曜）から次の from までの間、掲示板と「今日なにする?」に出る。
           課題図書を1冊終えると、その日の「今日の課題」(コイン)がもらえる。
   featured：話題の本（図書館の上の棚）。hidden：出さない本。 */
export const LIBRARY = {
  weekly: [
    { from: '2026-10-19', books: ['st:beg1', 'cc:ケンの日曜日', 'st:int1'] },
    { from: '2026-10-26', books: ['st:beg2', 'cc:雨の日の図書館', 'st:int2'] },
    { from: '2026-11-02', books: ['st:adv1', 'cc:祖父の畑', 'st:beg1'] },
  ],
  featured: ['st:adv2', 'st:int1', 'cc:駅での出来事'],
  hidden: [],
};
// 今週の課題図書（weekly の中で、今日より前で一番新しい from）
export function weeklyBooks(t) {   // t：'YYYY-MM-DD'（端末の日付）
  const w = LIBRARY.weekly.filter(x => x.from <= t).sort((a, b) => a.from < b.from ? 1 : -1)[0];
  return w ? w.books.slice() : [];
}
