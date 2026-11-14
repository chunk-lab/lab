// イベントの予約(花火・日食・月食)。運営画面が town:events に書いた予約を、町が数秒おきに見て、時間になったら始める。
//   予約 {id, kind, when:'date'|'birthday', at:'2026-11-03T20:00'(date のとき・この端末の時計), hour:20(birthday のとき・その日の何時から), title}
//   kind … 'fw:digest' 'fw:full' 'fw:kiku'… / 'solar'(日食) / 'lunar'(月食)
//   誕生日: 町に登録された生年月日の「月日」が今日と同じ日に、1年に1回だけ。
export const EVENT_KINDS = {
  'fw:digest': '花火大会(ダイジェスト・約1分)', 'fw:full': '花火大会(フル・約3分)', 'fw:starmine': 'スターマイン', 'fw:finale': 'フィナーレ',
  solar: '日食', lunar: '月食', rain: '雨と虹',
};
const LATE_MS = 10 * 60 * 1000;   // 予定の時刻から10分をすぎたら、もう始めない

export function createSchedule({ storage, getBirth, canFire, fire }) {
  const list = () => { const v = storage.get('events'); return Array.isArray(v) ? v : []; };
  const ran = () => storage.get('events:ran') || {};
  const mark = (id, key) => { const r = ran(); r[id] = key; storage.set('events:ran', r); };
  return {
    list,
    check(now = new Date()) {
      const r = ran();
      for (const ev of list()) {
        if (!ev || !ev.id || !ev.kind) continue;
        if (ev.when === 'birthday') {
          const b = getBirth && getBirth(); if (!b) continue;
          const [, m, d] = b.split('-').map(Number); if (!m || !d) continue;
          const key = 'b' + now.getFullYear();
          if (now.getMonth() + 1 === m && now.getDate() === d && now.getHours() >= (ev.hour ?? 20) && r[ev.id] !== key) {
            if (!canFire()) continue; mark(ev.id, key); fire(ev, { birthday: true });
          }
        } else {
          const t = ev._s || Date.parse(ev.at); if (isNaN(t) || r[ev.id] === ev.at) continue;
          if (now.getTime() >= t) {
            if (now.getTime() > t + LATE_MS) { mark(ev.id, ev.at); continue; }   // 過ぎたものは見送る
            if (!canFire()) continue; mark(ev.id, ev.at); fire(ev, {});
          }
        }
      }
    },
  };
}
