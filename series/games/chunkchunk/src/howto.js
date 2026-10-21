/* チャンクチャンクの「遊び方」。タイトル画面の各メニューの最後（まだ見ていない間は、いちばん上）に置く */
import { runCoach } from '../../../core/coach.js';
const HOW = {
  arcade: [
    { w: 'g', f: 'joy', t: 'チャンクチャンクは、英文を、意味のまとまり（チャンク）で区切るゲームだよ。' },
    { w: 'b', t: '文は、スタートのときに、まず1文まるごと読み上げられるよ。音を聞いて、切れ目を考えよう。' },
    { w: 'g', t: '「さらさらチャンク」は、自動で流れてくる英文を、切れ目で「チャンク！」とタップするよ。' },
    { w: 'b', t: '「よーいどんチャンク」は、▶で1語ずつ進めて、切れ目で「区切る」を押すよ。まちがえたら◀で戻れる。' },
    { w: 'g', t: '「チャレンジ」は、30秒か1分で、何点とれるか。コンボがつながると、点が上がるよ。' },
    { w: 'b', f: 'idea', t: '「ランダム」は1文ずつ、「おはなし」は物語を続けて遊べるよ。' }],
  lesson: [
    { w: 'g', f: 'joy', t: 'ここは学校。チャンクの切り方を、練習するところだよ。' },
    { w: 'b', t: '「Lesson」は、お話とゲームで学ぶよ。「読む・聞く」と「話す・書く」から選べるよ。' },
    { w: 'g', t: '「Chunk Practice」は、文章を選んで、自分で送って切る練習だよ。' },
    { w: 'b', f: 'idea', t: '「Random Practice」は、例文からランダムに練習できるよ。' }],
  library: [
    { w: 'g', f: 'joy', t: 'ここは図書館。英語の文章を、読んだり登録したりするところだよ。' },
    { w: 'b', t: '「Reading」は、長文を読んで、問題に答えるよ。分からない単語は、辞書で見られるよ。' },
    { w: 'g', f: 'idea', t: '「My Texts」では、自分の長文や短文を登録して、問題も作れるよ。' }]
};
export function initHowto(root, settings, save) {
  root.querySelectorAll('[data-howto]').forEach(b => {
    const menu = b.parentElement;
    if (!settings.howSeen) menu.prepend(b);   // まだ見ていない間は、いちばん上
    b.onclick = () => { runCoach(HOW[b.dataset.howto] || HOW.arcade); if (!settings.howSeen) { settings.howSeen = true; save(); } };
  });
}
