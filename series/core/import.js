/* 勉強ノートができる前に各アプリへ登録してあった言葉を、1回だけ勉強ノートに取り込む。
   ストリームの単語集・英語脳で登録した言葉と文・3Dの町のことばノート。取り込んだ元は消さない（元のアプリでもそのまま使える）。 */
import { createStore } from './store.js';
const json = v => { if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch (e) { return null; } };
export function importOld(nb) {
  const st = createStore('core'), done = st.get('nbImport') || {};
  const run = (key, fn) => { if (done[key]) return; try { const items = fn() || []; if (items.length) nb.addMany(items); done[key] = Date.now(); } catch (e) { console.warn('import', key, e); } };
  run('stream', () => (json(createStore('stream').get('cs-wordlists')) || []).flatMap(L => (L.lines || []).map(l => { const c = String(l).split('\t'); return { en: c[0], ja: c[1] || '', src: 'stream' }; })));
  run('eigonou', () => { const db = createStore('eigonou').get('db') || {}; return (db.sets || []).flatMap(s => [
    ...(s.items || []).filter(it => String(it.id || '').startsWith('u') && it.en).map(it => ({ en: it.en, ja: it.ja || '', src: 'eigonou' })),
    ...(s.sentences || []).map(x => ({ en: x.en, ja: x.ja || '', kind: 'short', src: 'eigonou' }))]); });
  run('town3d', () => { let n = null; try { n = JSON.parse(localStorage.getItem('town:notes')); } catch (e) { } return (n || []).map(x => ({ en: x.text, ja: x.meaning || '', kind: x.kind === 'quote' ? 'quote' : x.kind === 'sentence' ? 'short' : undefined, src: 'town3d' })); });
  st.set('nbImport', done);
}
