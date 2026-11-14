/* プロフィール（仮）：名前・アバター（いまは一枚絵）・ステータス。
   アバターは「絵」と「データ」を分けておく：ゲームは avatarURL() を表示するだけ。作り直しても使い方は同じ。
   ステータスの項目はまだ決めていない。いまは記録（events）から「遊んだ回数」などを出すだけ。 */
import { createStore } from './store.js';
export function createProfile(events, base, getLog = () => null) {
  const st = createStore('core');
  const p = Object.assign({ name: '', avatar: 'default' }, st.get('profile') || {});
  return {
    get name() { return p.name; },
    setName(n) { p.name = String(n).slice(0, 12); st.set('profile', p); },
    avatarURL() { return base + 'core/avatar/' + p.avatar + '.svg'; },
    status() {
      const s = events.stats(), c = s.count, plays = Object.keys(c).filter(k => k.endsWith(':open')).reduce((a, k) => a + c[k], 0);
      const lg = getLog(), T = lg ? lg.totalSummary() : null, h = x => { const m = Math.round(x / 60); return m >= 60 ? Math.floor(m / 60) + '時間' + (m % 60) + '分' : m + '分'; };
      return [...(T ? [{ label: '勉強した時間(合計)', value: h(T.by.study) }, { label: '遊んだ時間(合計)', value: h(T.by.tv + T.by.sport) }, { label: '街でまったり(合計)', value: h(T.by.relax) }] : []), { label: '遊んだ回数', value: plays + '回' }, { label: 'はじめた日', value: s.first || '—' }, { label: '最後に遊んだ日', value: s.last || '—' }];
    }
  };
}
