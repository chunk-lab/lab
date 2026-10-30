/* 英語脳アプリへの「受け渡し箱」:ほかのアプリ(勉強ノート・スポーツの表現など)から、言葉・表現・文を送っておくと、
   次に英語脳アプリを開いたとき、向こうの「マイことば」に登録される(自動判定。AIのキーが入っていれば、AIで上手に仕分ける)。
   送るもの:{ en, ja, kind?, ex?, exja?, ai?, play? }  kind は省略してよい(英語脳側で判定)。ex は例文(exja は日本語)。ai はAIが先に作った種類・活用の情報。play は、開いたら完成した文をすぐ「つくる」に出す印。 */
import { createStore } from './store.js';
export function createEigoInbox() {
  const st = createStore('core'), K = 'eigoInbox';
  const list = () => st.get(K) || [];
  return {
    send(items) {   // 送る。同じ英語がもう箱に入っていれば足さない。入れた数を返す
      const L = list(), have = new Set(L.map(x => x.en.toLowerCase())); let n = 0;
      (items || []).forEach(it => {
        const en = String(it && it.en || '').trim().replace(/\s+/g, ' '); if (!en || !/[a-zA-Z]/.test(en)) return;
        const old = L.find(x => x.en.toLowerCase() === en.toLowerCase());
        if (old) { if (it.play) old.play = true; if (!old.ex && it.ex) { old.ex = it.ex; old.exja = it.exja || ''; } if (!old.ai && it.ai) old.ai = it.ai; return; }   // もう箱にある:足さずに、「すぐ遊ぶ」の印や例文だけ足す
        L.push({ en, ja: String(it.ja || '').trim(), kind: it.kind || '', ex: it.ex || '', exja: it.exja || '', ai: it.ai || undefined, play: !!it.play, at: Date.now() }); have.add(en.toLowerCase()); n++;
      });
      st.set(K, L.slice(-200)); return n;
    },
    take() { const L = list(); st.set(K, []); return L; },   // 箱をからにして、中身を返す(英語脳が開いたとき)
    count: () => list().length,
  };
}
